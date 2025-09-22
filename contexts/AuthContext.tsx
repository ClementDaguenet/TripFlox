import { deleteUserByEmail, findUserByEmail, initDb } from "@/contexts/db";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoadingAuthState: boolean;
  deleteAccount: () => Promise<void>;
  currentUserEmail: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuthState, setIsLoadingAuthState] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      const email = await SecureStore.getItemAsync("userEmail");
      
      if (token && email) {
        setIsAuthenticated(true);
        setCurrentUserEmail(email);
      } else {
        setIsAuthenticated(false);
        setCurrentUserEmail(null);
        // Clean up invalid auth state
        await SecureStore.deleteItemAsync("userToken");
        await SecureStore.deleteItemAsync("userEmail");
      }
      setIsLoadingAuthState(false);
    };
    initDb().finally(checkAuth);
  }, []);

  const login = async (email: string, password: string) => {
    const user = await findUserByEmail(email);
    const isValid = !!user && user.password === password;
    if (!isValid) {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userEmail");
      setIsAuthenticated(false);
      setCurrentUserEmail(null);
      throw new Error("Invalid credentials");
    }

    await SecureStore.setItemAsync("userToken", "dummy-token");
    await SecureStore.setItemAsync("userEmail", email);
    setIsAuthenticated(true);
    setCurrentUserEmail(email);
    router.replace("/home" as Href);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userEmail");
    setIsAuthenticated(false);
    setCurrentUserEmail(null);
    router.replace("/login");
  };

  const deleteAccount = async () => {
    if (currentUserEmail) {
      await deleteUserByEmail(currentUserEmail);
    }
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userEmail");
    setIsAuthenticated(false);
    setCurrentUserEmail(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoadingAuthState, deleteAccount, currentUserEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}