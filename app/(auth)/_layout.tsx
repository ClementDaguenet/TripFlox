import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  const { isAuthenticated, isLoadingAuthState } = useAuth();

  if (isLoadingAuthState) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}