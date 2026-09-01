// In production (e.g. Railway), the frontend and backend live on different
// domains, so VITE_API_URL must be set explicitly at build time — see DEPLOY.md.
// In local dev, the LAN IP of this machine can change (new WiFi, DHCP renewal),
// which would silently break API calls from a phone/other device on the network.
// So when VITE_API_URL isn't set, derive the backend host from whatever host the
// browser actually used to load this page — same origin, just port 4000.
function computeApiBase(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) return explicit;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000/api/v1`;
  }
  return "http://localhost:4000/api/v1";
}

const API_BASE = computeApiBase();

const ACCESS_TOKEN_KEY = "echoryx.accessToken";
const REFRESH_TOKEN_KEY = "echoryx.refreshToken";
const DEVICE_TOKEN_KEY = "echoryx.deviceToken";
const ACTIVE_CHILD_KEY = "echoryx.activeChildId";

function isBrowser() {
  return typeof window !== "undefined";
}

export const tokenStore = {
  getAccessToken: () => (isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null),
  getRefreshToken: () => (isBrowser() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null),
  getDeviceToken: () => (isBrowser() ? localStorage.getItem(DEVICE_TOKEN_KEY) : null),
  getActiveChildId: () => (isBrowser() ? localStorage.getItem(ACTIVE_CHILD_KEY) : null),
  setSession: (accessToken: string, refreshToken: string) => {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  setDeviceToken: (token: string) => {
    if (isBrowser()) localStorage.setItem(DEVICE_TOKEN_KEY, token);
  },
  setActiveChildId: (childId: string) => {
    if (isBrowser()) localStorage.setItem(ACTIVE_CHILD_KEY, childId);
  },
  clear: () => {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    localStorage.removeItem(ACTIVE_CHILD_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: "parent" | "device" | "none";
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        tokenStore.setSession(data.accessToken, data.refreshToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, _isRetry = false): Promise<T> {
  const { method = "GET", body, auth = "parent" } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth === "parent") {
    const token = tokenStore.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else if (auth === "device") {
    const token = tokenStore.getDeviceToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth === "parent" && !_isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, options, true);
    tokenStore.clear();
  }

  // A stored device token can belong to a previously logged-in parent on this
  // browser (e.g. switched accounts without signing out) — the backend
  // rejects it as 403 since the device no longer matches. Self-heal by
  // dropping it and getting a fresh one for whoever is logged in now, then
  // retry once, so "log in as any account" always just works.
  if (res.status === 403 && auth === "device" && !_isRetry) {
    // Only clear if the token we sent is the one still on record — two
    // concurrent 403s (e.g. a double-fired effect) must not have the second
    // one wipe out the fresh token the first one just fetched.
    if (tokenStore.getDeviceToken() === (headers.Authorization?.slice("Bearer ".length) ?? null)) {
      localStorage.removeItem(DEVICE_TOKEN_KEY);
    }
    try {
      await ensureDeviceToken();
      return apiRequest<T>(path, options, true);
    } catch {
      // fall through to the normal error handling below
    }
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    throw new ApiError(res.status, payload.code ?? "UNKNOWN", payload.message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Domain types (mirrors backend response shapes) -------------------------

export type Plan = "free" | "plus" | "premium";
export type Parent = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  createdAt: string;
  hasPin: boolean;
  locale: "en" | "vi";
  plan: Plan;
};
export type Character = { id: string; code: string; name: string; nick: string; colorToken: string; imageKey: string };
export type AgeGroup = "toddler" | "preschool" | "early_elementary" | "elementary";
export type Child = {
  id: string;
  parentId: string;
  name: string;
  ageGroup: AgeGroup;
  developmentLevel: string;
  characterId: string | null;
  avatarInitial: string | null;
  isActive: boolean;
};
export type Device = {
  id: string;
  name: string;
  type: "tv" | "tablet" | "phone";
  platform: string;
  status: "connected" | "idle" | "offline";
  appVersion: string | null;
  lastSeenAt: string | null;
};
export type WatchSession = {
  id: string;
  childId: string;
  deviceId: string;
  sourceApp: string;
  contentTitle: string | null;
  category: "educational" | "entertainment" | "other";
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
};
export type InteractionMessage = {
  id: string;
  sender: "niso" | "child";
  contentText: string;
  moderationStatus: "approved" | "flagged" | "blocked";
  createdAt: string;
};
export type Dashboard = {
  date: string;
  totalWatchSeconds: number;
  learningSeconds: number;
  interactionsCount: number;
  contentMix: { educational: number; entertainment: number; other: number };
  watchByHour: Record<string, number>;
  energyBudgetMinutes: number;
  energyUsedMinutes: number;
};
export type ProgressReport = {
  kpis: { sessions: number; learningHours: number; badges: number };
  growth: { week: string; score: number }[];
  skills: { vocabulary: number; attention: number; empathy: number; problemSolving: number };
};
export type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  criteriaValue: number;
  earned: boolean;
  earnedAt: string | null;
};
export type RewardsSummary = { starBalance: number; badges: Badge[] };
export type RewardItem = { id: string; name: string; description: string | null; costStars: number };
export type Redemption = { id: string; childId: string; rewardItemId: string; costStars: number; status: string };
export type Notification = { id: string; type: string; title: string; body: string; isRead: boolean; createdAt: string };
export type NotificationPrefs = {
  milestone: boolean;
  badge_earned: boolean;
  redemption_requested: boolean;
  energy_budget_reached: boolean;
  weekly_report: boolean;
};
export type Locale = "en" | "vi";
export type AppSettings = { hasPin: boolean; notificationPrefs: NotificationPrefs; locale: Locale; plan: Plan };

// --- API namespaces -----------------------------------------------------

export const authApi = {
  register: (input: {
    email: string;
    password: string;
    name: string;
    privacyPolicyAccepted: true;
    dataProcessingConsent: true;
    childUsageConsent: true;
  }) =>
    apiRequest<{ parent: Parent; accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: input,
      auth: "none",
    }),
  login: (input: { email: string; password: string }) =>
    apiRequest<{ parent: Parent; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: input,
      auth: "none",
    }),
  me: () => apiRequest<Parent>("/auth/me"),
  updateProfile: (input: { name?: string; phone?: string | null }) =>
    apiRequest<Parent>("/auth/me", { method: "PATCH", body: input }),
  logout: (refreshToken: string) =>
    apiRequest<void>("/auth/logout", { method: "POST", body: { refreshToken }, auth: "none" }),
};

export const charactersApi = {
  list: () => apiRequest<Character[]>("/characters"),
};

export const childrenApi = {
  list: () => apiRequest<Child[]>("/children"),
  create: (input: { name: string; ageGroup: AgeGroup; characterId?: string }) =>
    apiRequest<Child>("/children", { method: "POST", body: input }),
  update: (childId: string, input: Partial<{ name: string; ageGroup: AgeGroup; characterId: string }>) =>
    apiRequest<Child>(`/children/${childId}`, { method: "PATCH", body: input }),
  getFrequency: (childId: string) =>
    apiRequest<{ childId: string; intervalMinutes: number }>(`/children/${childId}/frequency`),
  setFrequency: (childId: string, intervalMinutes: number) =>
    apiRequest<{ childId: string; intervalMinutes: number }>(`/children/${childId}/frequency`, {
      method: "PUT",
      body: { intervalMinutes },
    }),
};

export const devicesApi = {
  list: () => apiRequest<Device[]>("/devices"),
  createPairingCode: (input: { name: string; type: "tv" | "tablet" | "phone" }) =>
    apiRequest<{ deviceId: string; pairingCode: string; expiresAt: string }>("/devices/pairing-code", {
      method: "POST",
      body: input,
    }),
  webPreview: () => apiRequest<{ device: Device; deviceToken: string }>("/devices/web-preview", { method: "POST" }),
  remove: (deviceId: string) => apiRequest<void>(`/devices/${deviceId}`, { method: "DELETE" }),
};

export const watchSessionsApi = {
  history: (childId: string) => apiRequest<WatchSession[]>(`/children/${childId}/watch-sessions`),
  current: (childId: string) => apiRequest<WatchSession | null>(`/children/${childId}/watch-sessions/current`),
  start: (input: { childId: string; sourceApp: string; contentTitle?: string; category?: string }) =>
    apiRequest<WatchSession>("/watch-sessions/start", { method: "POST", body: input, auth: "device" }),
  end: (watchSessionId: string, pausedForInteraction = false) =>
    apiRequest<WatchSession>(`/watch-sessions/${watchSessionId}/end`, {
      method: "POST",
      body: { pausedForInteraction },
      auth: "device",
    }),
};

export const conversationsApi = {
  listSessions: (childId: string) => apiRequest<{ id: string; startedAt: string; status: string }[]>(`/children/${childId}/interactions`),
  messages: (interactionId: string) => apiRequest<InteractionMessage[]>(`/interactions/${interactionId}/messages`),
  start: (input: { childId: string; watchSessionId?: string; triggerReason?: string }) =>
    apiRequest<{ session: { id: string }; message: InteractionMessage }>("/interactions/start", {
      method: "POST",
      body: input,
      auth: "device",
    }),
  sendMessage: (interactionId: string, text: string) =>
    apiRequest<{ childMessage: InteractionMessage; nisoMessage: InteractionMessage; starsAwarded: number }>(
      `/interactions/${interactionId}/messages`,
      { method: "POST", body: { text }, auth: "device" },
    ),
  end: (interactionId: string) =>
    apiRequest<{ id: string; status: string }>(`/interactions/${interactionId}/end`, { method: "POST", auth: "device" }),
};

export const rewardsApi = {
  summary: (childId: string) => apiRequest<RewardsSummary>(`/children/${childId}/rewards`),
  items: () => apiRequest<RewardItem[]>("/reward-items"),
  redeem: (childId: string, rewardItemId: string) =>
    apiRequest<Redemption>("/reward-redemptions", { method: "POST", body: { childId, rewardItemId } }),
  redemptions: (childId: string) => apiRequest<Redemption[]>(`/children/${childId}/reward-redemptions`),
  decide: (redemptionId: string, decision: "approved" | "rejected" | "fulfilled") =>
    apiRequest<Redemption>(`/reward-redemptions/${redemptionId}/decide`, { method: "POST", body: { decision } }),
};

export const progressApi = {
  dashboard: (childId: string, date?: string) =>
    apiRequest<Dashboard>(`/children/${childId}/dashboard${date ? `?date=${date}` : ""}`),
  report: (childId: string, weeks = 12) => apiRequest<ProgressReport>(`/children/${childId}/progress?weeks=${weeks}`),
};

export const notificationsApi = {
  list: () => apiRequest<Notification[]>("/notifications"),
  markRead: (notificationId: string) => apiRequest<Notification>(`/notifications/${notificationId}/read`, { method: "POST" }),
};

export const settingsApi = {
  get: () => apiRequest<AppSettings>("/settings"),
  setPin: (pin: string) => apiRequest<{ hasPin: boolean }>("/settings/pin", { method: "PUT", body: { pin } }),
  removePin: () => apiRequest<{ hasPin: boolean }>("/settings/pin", { method: "DELETE" }),
  verifyPin: (pin: string) => apiRequest<{ valid: boolean }>("/settings/pin/verify", { method: "POST", body: { pin } }),
  updateNotificationPrefs: (patch: Partial<NotificationPrefs>) =>
    apiRequest<NotificationPrefs>("/settings/notification-prefs", { method: "PATCH", body: patch }),
  updateLocale: (locale: Locale) => apiRequest<{ locale: Locale }>("/settings/locale", { method: "PATCH", body: { locale } }),
  updatePlan: (plan: Plan) => apiRequest<{ plan: Plan }>("/settings/plan", { method: "PATCH", body: { plan } }),
};

// The on-device Android companion app doesn't exist yet in this project, so the
// parent's own browser session "borrows" a virtual device (see backend
// POST /devices/web-preview) to preview watch-session/Niso conversation flows.
//
// Single-flight: two callers racing to fetch a device token at once (e.g. an
// effect that double-fires) must not each independently hit the endpoint and
// clobber tokenStore with two different tokens — they share one in-flight
// request instead.
let deviceTokenPromise: Promise<string> | null = null;

export async function ensureDeviceToken(): Promise<string> {
  const existing = tokenStore.getDeviceToken();
  if (existing) return existing;

  if (!deviceTokenPromise) {
    deviceTokenPromise = devicesApi
      .webPreview()
      .then(({ deviceToken }) => {
        tokenStore.setDeviceToken(deviceToken);
        return deviceToken;
      })
      .finally(() => {
        deviceTokenPromise = null;
      });
  }
  return deviceTokenPromise;
}

