import * as React from "react";
import { apiRequest } from "./queryClient";
import { User, InsertUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: Omit<InsertUser, "password"> & { password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log("Authentication successful, user data received:", userData);
          setUser(userData);
        } else {
          console.log("Authentication check failed with status:", response.status);
          // Clear user data if not authenticated
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    try {
      console.log(`Attempting login for user: ${username}`);
      
      // Use direct fetch for login to have more control over the request
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Login failed with status ${response.status}: ${errorText}`);
        throw new Error(`Login failed: ${errorText}`);
      }
      
      const userData = await response.json();
      console.log("Login successful, session established with user data:", userData);
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (userData: Omit<InsertUser, "password"> & { password: string }): Promise<User> => {
    try {
      console.log(`Registering new user: ${userData.username}`);
      
      // Use direct fetch for registration to control the request
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Registration failed with status ${response.status}: ${errorText}`);
        throw new Error(`Registration failed: ${errorText}`);
      }
      
      const newUser = await response.json();
      console.log("Registration successful, session established with user data:", newUser);
      
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log("Attempting to log out user");
      
      // Use direct fetch for logout to control the request
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Logout failed with status ${response.status}: ${errorText}`);
        throw new Error(`Logout failed: ${errorText}`);
      }
      
      console.log("Logout successful, session destroyed");
      
      // Clear the user state regardless of response
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear the user state on error
      setUser(null);
      throw error;
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, register, logout } },
    children
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
