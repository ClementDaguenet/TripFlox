import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import * as Notifications from 'expo-notifications';
import { Slot } from "expo-router";
import React, { useEffect } from "react";

export const unstable_settings = { 
  initialRouteName: "index",
};

export default function RootLayout() {
  useEffect(() => {
    // Configure notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}