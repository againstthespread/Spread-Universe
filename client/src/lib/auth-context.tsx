import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { User } from "@shared/schema";
import {
  AUTH_UNAUTHORIZED_EVENT,
  SESSION_EXPIRED_STORAGE_KEY,
  apiFetch,
  queryClient,
} from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkAuthGenerationRef = useRef(0);

  const checkAuth = async () => {
    const generation = ++checkAuthGenerationRef.current;

    try {
      const res = await apiFetch("/api/auth/me");

      if (res.ok) {
        const data = await res.json();
        if (generation === checkAuthGenerationRef.current) {
          setUser(data.user);
        }
        return data.user as User;
      }

      if (generation === checkAuthGenerationRef.current) {
        setUser(null);
      }
      return null;
    } catch {
      if (generation === checkAuthGenerationRef.current) {
        setUser(null);
      }
      return null;
    } finally {
      if (generation === checkAuthGenerationRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      checkAuthGenerationRef.current++;
      setUser(null);
      setIsLoading(false);
      queryClient.clear();

      if (window.location.pathname !== "/login") {
        sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, "true");
        window.location.assign("/login");
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = async () => {
    const authenticatedUser = await checkAuth();
    if (!authenticatedUser) {
      throw new Error("Your sign-in could not be confirmed. Please try again.");
    }
    return authenticatedUser;
  };

  const logout = async () => {
    checkAuthGenerationRef.current++;
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
