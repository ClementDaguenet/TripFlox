import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTrips, getUserProfile, UserRow } from "@/contexts/db";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { currentUserEmail } = useAuth();
  const [userProfile, setUserProfile] = useState<UserRow | null>(null);
  const [tripsCount, setTripsCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [daysTraveling, setDaysTraveling] = useState(0);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const loadUserProfile = useCallback(async () => {
    if (!currentUserEmail) return;
    const profile = await getUserProfile(currentUserEmail);
    setUserProfile(profile);
  }, [currentUserEmail]);

  const loadStats = useCallback(async () => {
    try {
      const trips = await getAllTrips();
      setTripsCount(trips.length);

      const tripsWithLocation = trips.filter((trip) => trip.lat && trip.lng);
      setLocationsCount(tripsWithLocation.length);

      let totalDays = 0;
      trips.forEach((trip) => {
        if (trip.startDate && trip.endDate) {
          const start = new Date(trip.startDate);
          const end = new Date(trip.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalDays += diffDays;
        }
      });
      setDaysTraveling(totalDays);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      loadStats();
    }, [loadUserProfile, loadStats])
  );

  const features = [
    {
      icon: "🗺️",
      title: "Plan Your Trips",
      description: "Create and organize your travel adventures with ease",
      color: theme.tint,
      gradient: [theme.tint, theme.tint + "80"],
    },
    {
      icon: "📍",
      title: "Location Tracking",
      description: "Mark and discover amazing places around the world",
      color: "#ff8c00",
      gradient: ["#ff8c00", "#ffb84d"],
    },
    {
      icon: "📅",
      title: "Date Management",
      description: "Keep track of your travel dates and schedules",
      color: "#4CAF50",
      gradient: ["#4CAF50", "#66BB6A"],
    },
    {
      icon: "👤",
      title: "Personal Profile",
      description: "Manage your travel preferences and personal info",
      color: "#2196F3",
      gradient: ["#2196F3", "#42A5F5"],
    },
  ];

  const quickActions = [
    {
      title: "New Trip",
      icon: "✈️",
      href: "/(app)/trips/new" as const,
      color: theme.tint,
      textColor: "white",
    },
    {
      title: "My Trips",
      icon: "🗺️",
      href: "/(app)/(tabs)/trips" as const,
      color: "#ff8c00",
      textColor: "white",
    },
    {
      title: "Profile",
      icon: "👤",
      href: "/(app)/(tabs)/profile" as const,
      color: "#4CAF50",
      textColor: "white",
    },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.tint }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <ThemedText style={styles.heroGreeting}>
                Welcome back, {userProfile?.firstName || "Traveler"}! 👋
              </ThemedText>
              <ThemedText style={styles.heroTitle}>Wox Tripflox</ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                Your ultimate travel companion for planning amazing adventures
              </ThemedText>
            </View>
            <View style={styles.heroDecoration}>
              <ThemedText style={styles.heroEmoji}>✈️</ThemedText>
            </View>
          </View>
        </View>

        {/* Quick Actions - New Design */}
        <View style={styles.quickActionsSection}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: theme.text }]}
          >
            Quick Actions
          </ThemedText>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} asChild>
                <TouchableOpacity
                  style={[
                    styles.quickActionCard,
                    { backgroundColor: action.color },
                  ]}
                >
                  <View style={styles.quickActionIconWrapper}>
                    <ThemedText style={styles.quickActionIcon}>
                      {action.icon}
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[
                      styles.quickActionText,
                      { color: action.textColor },
                    ]}
                  >
                    {action.title}
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* Stats Cards - New Grid Layout */}
        <View style={styles.statsSection}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: theme.text }]}
          >
            Your Journey
          </ThemedText>
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.background, borderColor: theme.tint },
              ]}
            >
              <ThemedText style={[styles.statNumber, { color: theme.tint }]}>
                {tripsCount}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.text }]}>
                Trips
              </ThemedText>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.background, borderColor: "#ff8c00" },
              ]}
            >
              <ThemedText style={[styles.statNumber, { color: "#ff8c00" }]}>
                {locationsCount}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.text }]}>
                Locations
              </ThemedText>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.background, borderColor: "#4CAF50" },
              ]}
            >
              <ThemedText style={[styles.statNumber, { color: "#4CAF50" }]}>
                {daysTraveling}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.text }]}>
                Days
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Features - New Card Layout */}
        <View style={styles.featuresSection}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: theme.text }]}
          >
            Why Choose Wox Tripflox?
          </ThemedText>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.icon,
                  },
                ]}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: feature.color + "20" },
                  ]}
                >
                  <ThemedText style={styles.featureIcon}>
                    {feature.icon}
                  </ThemedText>
                </View>
                <View style={styles.featureContent}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.featureTitle, { color: theme.text }]}
                  >
                    {feature.title}
                  </ThemedText>
                  <ThemedText
                    style={[styles.featureDescription, { color: theme.text }]}
                  >
                    {feature.description}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Call to Action - New Design */}
        <View style={styles.ctaSection}>
          <View
            style={[
              styles.ctaCard,
              { backgroundColor: theme.tint + "15", borderColor: theme.tint },
            ]}
          >
            <View style={styles.ctaIconContainer}>
              <ThemedText style={styles.ctaIcon}>🚀</ThemedText>
            </View>
            <View style={styles.ctaTextContainer}>
              <ThemedText style={[styles.ctaTitle, { color: theme.text }]}>
                Ready to Start Your Journey?
              </ThemedText>
              <ThemedText
                style={[styles.ctaDescription, { color: theme.text }]}
              >
                Create your first trip and begin planning your next adventure!
              </ThemedText>
            </View>
            <Link href="/(app)/trips/new" asChild>
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: theme.tint }]}
              >
                <ThemedText style={styles.ctaButtonText}>
                  Get Started
                </ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: theme.text }]}>
            Made with ❤️ for travelers around the world
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 50,
    marginBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  heroGreeting: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
    lineHeight: 24,
  },
  heroDecoration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 50,
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionText: {
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    flexShrink: 0,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
    flexShrink: 1,
  },
  featureTitle: {
    fontSize: 18,
    marginBottom: 6,
    fontWeight: "700",
    flexWrap: "wrap",
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    flexWrap: "wrap",
  },

  // Call to Action
  ctaSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  ctaCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(108, 71, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  ctaIcon: {
    fontSize: 28,
  },
  ctaTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  // Footer
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
});
