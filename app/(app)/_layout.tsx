import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
  const { isAuthenticated, isLoadingAuthState } = useAuth();

  if (isLoadingAuthState) {
    return null;
  }

  if (!isAuthenticated) {
    // si pas connecté, rediriger vers login
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ici tous les écrans de l’app protégés */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
