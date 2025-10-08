import { ThemedText } from "@/components/themed-text";
import { ThemedTextI18n } from "@/components/themed-text-i18n";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedWaves } from "@/components/ui/animated-waves";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientCard } from "@/components/ui/gradient-card";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTrips, getUserProfile, UserRow } from "@/contexts/db";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/hooks/use-translation";
import { getLocationDisplay } from "@/services/location-utils";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Cache pour les noms de villes pour éviter les appels API répétés
const cityCache = new Map<string, string>();

export default function HomeScreen() {
  const { currentUserEmail } = useAuth();
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<UserRow | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [tripsCount, setTripsCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [daysTraveling, setDaysTraveling] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const loadUserProfile = useCallback(async () => {
    if (!currentUserEmail) return;
    const profile = await getUserProfile(currentUserEmail);
    setUserProfile(profile);
    if (profile) {
      setUserId(profile.id);
    }
  }, [currentUserEmail]);

  const loadStats = useCallback(async () => {
    try {
      if (!userId) return;
      
      setIsLoadingStats(true);
      const trips = await getAllTrips(userId);
      setTripsCount(trips.length);

      // Compter les villes uniques en utilisant les noms de villes réels
      const uniqueCities = new Set<string>();
      
      // Traiter les trips avec géocodage asynchrone et cache
      const locationPromises = trips
        .filter((trip) => trip.lat && trip.lng)
        .map(async (trip) => {
          const cacheKey = `${trip.lat},${trip.lng}`;
          
          // Vérifier le cache d'abord
          if (cityCache.has(cacheKey)) {
            return cityCache.get(cacheKey);
          }
          
          try {
            // Utiliser getLocationDisplay qui a une meilleure gestion d'erreur
            const locationName = await getLocationDisplay(trip.lat!, trip.lng!);
            if (locationName && locationName !== 'No location') {
              // Extraire la ville du nom de lieu si possible
              const city = locationName.split(',')[0].trim();
              cityCache.set(cacheKey, city);
              return city;
            }
          } catch (error) {
            console.error('Error geocoding trip location:', error);
          }
          return null;
        });

      const cities = await Promise.all(locationPromises);
      cities.forEach((city) => {
        if (city) {
          uniqueCities.add(city);
        }
      });
      
      setLocationsCount(uniqueCities.size);

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
    } finally {
      setIsLoadingStats(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
  );

  // Charger les stats quand userId change
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadStats();
      }
    }, [userId, loadStats])
  );

  return (
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="medium" style={{ paddingTop: insets.top }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.topAvatarContainer, { top: insets.top + 10 }]}>
            {userProfile?.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.topAvatar} />
            ) : (
              <View style={[styles.topAvatar, { backgroundColor: theme.tint }]}>
                <ThemedText style={[styles.topAvatarText, { color: theme.text }]}>
                  {(userProfile?.firstName || "T").charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>

          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <ThemedTextI18n 
                  i18nKey="home.welcome" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {userProfile?.firstName || t('home.traveler')}
                </ThemedText>
              </View>
            </View>
          </GlassCard>
          <View style={styles.statsContainer}>
            <GradientCard 
              gradient="sunset" 
              style={styles.statCard}
              shadow="lg"
              borderRadius="xl"
            >
              <View style={styles.statContent}>
                {isLoadingStats ? (
                  <ThemedText style={[styles.statNumber, { color: theme.text }]}>
                    ...
                  </ThemedText>
                ) : (
                  <AnimatedNumber
                    value={tripsCount}
                    style={styles.statNumber}
                    color={theme.text}
                    fontSize={28}
                    fontWeight="bold"
                  />
                )}
                <ThemedTextI18n 
                  i18nKey="home.trips" 
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                />
                <ThemedText style={styles.statIcon}>✈️</ThemedText>
              </View>
            </GradientCard>

            <GradientCard 
              gradient="ocean" 
              style={styles.statCard}
              shadow="lg"
              borderRadius="xl"
            >
              <View style={styles.statContent}>
                {isLoadingStats ? (
                  <ThemedText style={[styles.statNumber, { color: theme.text }]}>
                    ...
                  </ThemedText>
                ) : (
                  <AnimatedNumber
                    value={locationsCount}
                    style={styles.statNumber}
                    color={theme.text}
                    fontSize={28}
                    fontWeight="bold"
                  />
                )}
                <ThemedTextI18n 
                  i18nKey="home.locations" 
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                />
                <ThemedText style={styles.statIcon}>📍</ThemedText>
              </View>
            </GradientCard>

            <GradientCard 
              gradient="forest" 
              style={styles.statCard}
              shadow="lg"
              borderRadius="xl"
            >
              <View style={styles.statContent}>
                {isLoadingStats ? (
                  <ThemedText style={[styles.statNumber, { color: theme.text }]}>
                    ...
                  </ThemedText>
                ) : (
                  <AnimatedNumber
                    value={daysTraveling}
                    style={styles.statNumber}
                    color={theme.text}
                    fontSize={28}
                    fontWeight="bold"
                  />
                )}
                <ThemedTextI18n 
                  i18nKey="home.days" 
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                />
                <ThemedText style={styles.statIcon}>📅</ThemedText>
              </View>
            </GradientCard>
          </View>

          <GlassCard style={styles.actionsCard} blurIntensity={25}>
            <ThemedTextI18n 
              i18nKey="sections.quickActions" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />

            <View style={styles.actionsGrid}>
              <Link href="/(app)/trips/new" asChild>
                <GradientButton
                  title={t('buttons.newTrip')}
                  gradient="primary"
                  size="lg"
                  style={styles.actionButton}
                />
              </Link>
              <Link href="/(app)/(tabs)/trips" asChild>
                <GradientButton
                  title={t('home.viewTrips')}
                  gradient="ocean"
                  size="lg"
                  style={styles.actionButton}
                />
              </Link>
            </View>
          </GlassCard>

          {!isLoadingStats && tripsCount > 0 && (
            <GlassCard style={styles.recentTripsCard} blurIntensity={20}>
              <ThemedTextI18n 
                i18nKey="home.recentTrips" 
                style={[styles.sectionTitle, { color: theme.text }]}
              />
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {t('home.youHaveTrips', { count: tripsCount, plural: tripsCount !== 1 ? 's' : '' })}
              </ThemedText>
            </GlassCard>
          )}

          {!isLoadingStats && tripsCount === 0 && (
            <GradientCard 
              gradient="aurora" 
              style={styles.emptyStateCard}
              shadow="xl"
              borderRadius="2xl"
            >
              <View style={styles.emptyStateContent}>
                <ThemedText style={styles.emptyStateIcon}>🌍</ThemedText>
        <ThemedTextI18n 
          i18nKey="empty.startJourney" 
          style={[styles.emptyStateTitle, { color: theme.text }]}
        />
                <ThemedTextI18n 
                  i18nKey="empty.createFirstTripMessage" 
                  style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}
                />
                <Link href="/(app)/trips/new" asChild>
                  <GradientButton
                    title={t('buttons.createFirstTrip')}
                    gradient="sunset"
                    size="xl"
                    style={styles.emptyStateButton}
                  />
                </Link>
              </View>
            </GradientCard>
          )}

          <GlassCard style={styles.featuresCard} blurIntensity={15}>
            <ThemedTextI18n 
              i18nKey="home.whyChoose" 
              style={[styles.sectionTitle, { color: theme.text }]}
            />
            
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <ThemedText style={styles.featureIcon}>🗺️</ThemedText>
                </View>
                <ThemedTextI18n 
                  i18nKey="home.whyChoose1" 
                  style={[styles.featureTitle, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="home.whyChoose1Desc" 
                  style={[styles.featureDescription, { color: theme.textSecondary }]}
                />
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <ThemedText style={styles.featureIcon}>📍</ThemedText>
                </View>
                <ThemedTextI18n 
                  i18nKey="home.whyChoose2" 
                  style={[styles.featureTitle, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="home.whyChoose2Desc" 
                  style={[styles.featureDescription, { color: theme.textSecondary }]}
                />
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <ThemedText style={styles.featureIcon}>📅</ThemedText>
                </View>
                <ThemedTextI18n 
                  i18nKey="home.whyChoose3" 
                  style={[styles.featureTitle, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="home.whyChoose3Desc" 
                  style={[styles.featureDescription, { color: theme.textSecondary }]}
                />
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <ThemedText style={styles.featureIcon}>👤</ThemedText>
                </View>
                <ThemedTextI18n 
                  i18nKey="home.whyChoose4" 
                  style={[styles.featureTitle, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="home.whyChoose4Desc" 
                  style={[styles.featureDescription, { color: theme.textSecondary }]}
                />
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </AnimatedWaves>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  
  // Header
  headerCard: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  topAvatarContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  topAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  topAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 120,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statIcon: {
    fontSize: 24,
    marginTop: 8,
    lineHeight: 32,
  },
  actionsCard: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  recentTripsCard: {
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyStateCard: {
    marginTop: 8,
    minHeight: 200,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    lineHeight: 72,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    minWidth: 200,
  },

  featuresCard: {
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureItem: {
    width: (width - 40) / 2,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 40,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
  },
  featureDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 20,
    width: '100%',
  },
});