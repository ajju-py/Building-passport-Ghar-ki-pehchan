"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole, UserSession } from "@/lib/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: UserRole }) => Promise<void>;
  logout: () => void;
  quickLogin: (role: "admin" | "engineer" | "owner") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("bp_auth_token");
      localStorage.removeItem("bp_auth_user");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("bp_auth_token", res.token);
      localStorage.setItem("bp_auth_user", JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; role?: UserRole }) => {
      setIsLoading(true);
      try {
        const res = await api.auth.register(data);
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem("bp_auth_token", res.token);
        localStorage.setItem("bp_auth_user", JSON.stringify(res.user));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const quickLogin = useCallback(
    async (role: "admin" | "engineer" | "owner") => {
      const creds = {
        admin: { email: "admin@buildingpassport.org", password: "AdminPassword123!" },
        engineer: { email: "engineer@buildingpassport.org", password: "EngineerPass123!" },
        owner: { email: "owner@buildingpassport.org", password: "OwnerPass123!" },
      }[role];

      await login(creds.email, creds.password);
    },
    [login]
  );

  useEffect(() => {
    let ignore = false;
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("bp_auth_token");
      const savedUser = localStorage.getItem("bp_auth_user");

      if (!savedToken || !savedUser) {
        await Promise.resolve();
        if (!ignore) setIsLoading(false);
        return;
      }

      try {
        const verified = await api.auth.getMe();
        if (!ignore) {
          setToken(savedToken);
          setUser(verified);
          localStorage.setItem("bp_auth_user", JSON.stringify(verified));
        }
      } catch {
        if (!ignore) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("bp_auth_token");
          localStorage.removeItem("bp_auth_user");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
