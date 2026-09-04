import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ApiError, authApi, childrenApi, tokenStore, type Child, type Parent } from "./api";

type AuthState = {
  parent: Parent | null;
  children: Child[];
  activeChild: Child | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshChildren: () => Promise<Child[]>;
  setParent: (parent: Parent) => void;
  setActiveChildId: (childId: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children: reactChildren }: { children: ReactNode }) {
  const [parent, setParent] = useState<Parent | null>(null);
  const [kids, setKids] = useState<Child[]>([]);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Whether this browser holds a session at all. Set synchronously from localStorage at
  // startup (a token existing is reason enough to treat the parent as signed in) and from then
  // on changed ONLY by an explicit action: login/register succeeding, logout() running, or the
  // backend actively rejecting the session (a real 401/403, confirmed after apiRequest's own
  // refresh-and-retry already failed). It is never flipped by a network hiccup, a slow/failed
  // background fetch, or closing and reopening the tab — those must never look like a logout.
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(tokenStore.getAccessToken()));

  async function loadSession(attempt = 0) {
    if (!tokenStore.getAccessToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setParent(me);
      const kidsList = await childrenApi.list();
      setKids(kidsList);
      const savedActive = tokenStore.getActiveChildId();
      const active = kidsList.find((c) => c.id === savedActive) ?? kidsList[0];
      if (active) {
        setActiveChildIdState(active.id);
        tokenStore.setActiveChildId(active.id);
      }
      setIsLoading(false);
    } catch (err) {
      // Only the backend actively rejecting the (already refresh-retried) request — a real
      // 401/403 — means this parent is genuinely logged out. Anything else (offline, a CORS
      // misconfig, the backend briefly restarting...) is a transient failure: the saved session
      // is likely still fine, so this must not silently sign the parent out. Retry a few times
      // with backoff before giving up — the tokens (and isAuthenticated) stay put either way,
      // so a manual reload once connectivity is back will always pick the session back up.
      const isAuthRejection = err instanceof ApiError && (err.status === 401 || err.status === 403);
      if (isAuthRejection) {
        tokenStore.clear();
        setParent(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      if (attempt < 3) {
        setTimeout(() => loadSession(attempt + 1), 1000 * 2 ** attempt);
        return;
      }
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshChildren() {
    const kidsList = await childrenApi.list();
    setKids(kidsList);
    if (!activeChildId && kidsList[0]) {
      setActiveChildIdState(kidsList[0].id);
      tokenStore.setActiveChildId(kidsList[0].id);
    }
    return kidsList;
  }

  function setActiveChildId(childId: string) {
    setActiveChildIdState(childId);
    tokenStore.setActiveChildId(childId);
  }

  async function login(email: string, password: string) {
    // A device token (and active-child pick) from a previously logged-in
    // parent on this browser must not carry over — it belongs to a different
    // account and the backend will reject it (403) once reused here.
    tokenStore.clear();
    const result = await authApi.login({ email, password });
    tokenStore.setSession(result.accessToken, result.refreshToken);
    setParent(result.parent);
    setIsAuthenticated(true);
    await refreshChildren();
  }

  async function register(input: { email: string; password: string; name: string }) {
    tokenStore.clear();
    const result = await authApi.register({
      ...input,
      privacyPolicyAccepted: true,
      dataProcessingConsent: true,
      childUsageConsent: true,
    });
    tokenStore.setSession(result.accessToken, result.refreshToken);
    setParent(result.parent);
    setIsAuthenticated(true);
  }

  async function logout() {
    const refreshToken = tokenStore.getRefreshToken();
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined);
    }
    tokenStore.clear();
    setParent(null);
    setKids([]);
    setActiveChildIdState(null);
    setIsAuthenticated(false);
  }

  const activeChild = kids.find((c) => c.id === activeChildId) ?? kids[0] ?? null;

  return (
    <AuthContext.Provider
      value={{
        parent,
        children: kids,
        activeChild,
        isLoading,
        isAuthenticated,
        refreshChildren,
        setParent,
        setActiveChildId,
        login,
        register,
        logout,
      }}
    >
      {reactChildren}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Wrap any screen that requires a logged-in parent; bounces to /login otherwise. Gated on
// isAuthenticated alone (a stored token) — never on isLoading, so a slow or transiently-failing
// background profile fetch can't look like a logout and bounce someone who is really still
// signed in. Pages below already render sensibly with parent/children still empty.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
