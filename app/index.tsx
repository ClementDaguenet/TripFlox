import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import React from "react";

export default function RootIndex() {
  const { isAuthenticated, isLoadingAuthState } = useAuth();

  if (isLoadingAuthState) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}


