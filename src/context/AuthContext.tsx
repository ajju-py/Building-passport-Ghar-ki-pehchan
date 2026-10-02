"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole, UserSession } from "@/lib/types";
import { api } from "@/lib/api";

interface RegisterResult {
  verificationSent: boolean;
  message: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    mobile?: string;
  }) => Promise<RegisterResult>;
  logout: () => void;
  quickLogin: (role: "admin" | "engineer" | "owner") => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => Promise<string>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<string>;
  verifyOtp: (data: {
    destination: string;
    otp: string;
    purpose: "EMAIL_VERIFICATION" | "MOBILE_VERIFICATION";
  }) => Promise<string>;
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
    api.auth.logout().catch(() => {});
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
    async (data: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
      mobile?: string;
    }): Promise<RegisterResult> => {
      setIsLoading(true);
      try {
        const res = await api.auth.register(data);
        if (res.token) {
          setToken(res.token);
          setUser(res.user);
          localStorage.setItem("bp_auth_token", res.token);
          localStorage.setItem("bp_auth_user", JSON.stringify(res.user));
        }
        return {
          verificationSent: res.verificationSent,
          message: res.message,
        };
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

  const forgotPassword = useCallback(async (email: string): Promise<string> => {
    const res = await api.auth.forgotPassword({ email });
    return res.message;
  }, []);

  const resetPassword = useCallback(
    async (data: { email: string; otp: string; newPassword: string }): Promise<string> => {
      const res = await api.auth.resetPassword(data);
      return res.message;
    },
    []
  );

  const changePassword = useCallback(
    async (data: { currentPassword: string; newPassword: string }): Promise<string> => {
      const res = await api.auth.changePassword(data);
      return res.message;
    },
    []
  );

  const verifyOtp = useCallback(
    async (data: {
      destination: string;
      otp: string;
      purpose: "EMAIL_VERIFICATION" | "MOBILE_VERIFICATION";
    }): Promise<string> => {
      const res = await api.auth.verifyOtp(data);
      if (user) {
        setUser({ ...user, accountStatus: "active" });
      }
      return res.message;
    },
    [user]
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
        forgotPassword,
        resetPassword,
        changePassword,
        verifyOtp,
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
