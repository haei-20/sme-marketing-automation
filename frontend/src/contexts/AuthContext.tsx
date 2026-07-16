import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  appEnv,
  authApi,
  mockSession,
  sessionStore,
  type AuthSession,
  type LoginRequest,
  type RegisterRequest,
} from "@/lib";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(payload: LoginRequest): Promise<void>;
  register(payload: RegisterRequest): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function demoSessionForRegistration(payload: RegisterRequest): AuthSession {
  return {
    ...mockSession,
    user: {
      ...mockSession.user,
      email: payload.email,
      fullName: payload.fullName,
    },
  };
}

const demoDelay = () => new Promise((resolve) => window.setTimeout(resolve, 450));

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    sessionStore.getSession(),
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => sessionStore.subscribe(setSession), []);

  const login = useCallback(async (payload: LoginRequest) => {
    setIsLoading(true);
    try {
      if (appEnv.useMocks) {
        await demoDelay();
        sessionStore.setSession({
          ...mockSession,
          user: { ...mockSession.user, email: payload.email },
        });
        return;
      }
      await authApi.login(payload);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    setIsLoading(true);
    try {
      if (appEnv.useMocks) {
        await demoDelay();
        sessionStore.setSession(demoSessionForRegistration(payload));
        return;
      }
      await authApi.register(payload);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (appEnv.useMocks) {
        await demoDelay();
        sessionStore.clear();
        return;
      }
      await authApi.logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      register,
      logout,
    }),
    [session, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}
