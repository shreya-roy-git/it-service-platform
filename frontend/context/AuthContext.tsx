"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearStoredToken, getCurrentUserApi, getStoredToken, loginApi, logoutApi, setOnUnauthorizedHandler, setStoredToken } from "@/lib/api/client";
import type { LoginInput, User } from "@/types/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (getStoredToken()) {
        await logoutApi().catch(() => {
          // Ignore logout network errors on client cleanup
        });
      }
    } finally {
      clearStoredToken();
      setUser(null);
      setToken(null);
    }
  }, []);

  // Initialize auth state from stored token
  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        const currentUser = await getCurrentUserApi();
        setUser(currentUser);
      } catch {
        // Token invalid or expired
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void initAuth();
  }, []);

  // Register unauthorized response handler
  useEffect(() => {
    setOnUnauthorizedHandler(() => {
      clearStoredToken();
      setToken(null);
      setUser(null);
    });
    return () => {
      setOnUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (credentials: LoginInput): Promise<User> => {
    const data = await loginApi(credentials);
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
