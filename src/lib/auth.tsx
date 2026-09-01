import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authApi, childrenApi, tokenStore, type Child, type Parent } from "./api";

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

  async function loadSession() {
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
    } catch {
      tokenStore.clear();
      setParent(null);
    } finally {
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
  }

  const activeChild = kids.find((c) => c.id === activeChildId) ?? kids[0] ?? null;

  return (
    <AuthContext.Provider
      value={{
        parent,
        children: kids,
        activeChild,
        isLoading,
        isAuthenticated: Boolean(parent),
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

// Wrap any screen that requires a logged-in parent; bounces to /login otherwise.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
