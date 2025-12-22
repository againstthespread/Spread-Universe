import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track if user was set manually via login() to prevent checkAuth() from overwriting
  const manuallyAuthenticatedRef = useRef(false);
  // Track request generation to ignore stale responses
  const checkAuthGenerationRef = useRef(0);

  const checkAuth = async () => {
    // If user was manually authenticated, don't check server
    if (manuallyAuthenticatedRef.current) {
      setIsLoading(false);
      return;
    }

    const generation = ++checkAuthGenerationRef.current;
    
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      
      // Ignore stale responses or if user was manually authenticated during fetch
      if (generation !== checkAuthGenerationRef.current || manuallyAuthenticatedRef.current) {
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      // Only set null if this is still the latest request
      if (generation === checkAuthGenerationRef.current && !manuallyAuthenticatedRef.current) {
        setUser(null);
      }
    } finally {
      // Only set loading to false if this is the latest request
      if (generation === checkAuthGenerationRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (user: User) => {
    manuallyAuthenticatedRef.current = true;
    checkAuthGenerationRef.current++; // Invalidate any pending checkAuth
    setUser(user);
    setIsLoading(false);
  };

  const logout = async () => {
    manuallyAuthenticatedRef.current = false;
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    setUser(null);
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
