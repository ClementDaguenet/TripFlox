import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientCard } from '@/components/ui/gradient-card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { deleteTripById, getAllTrips, getUserProfile, TripRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { getLocationDisplay, getLocationDisplaySync } from '@/services/location-utils';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function TripsScreen() {
  const { t } = useTranslation();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [locationNames, setLocationNames] = useState<Map<string, string>>(new Map());
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { currentUserEmail } = useAuth();

  const load = async () => {
    if (userId) {
      const all = await getAllTrips(userId);
      setTrips(all);
      
      // Charger les noms de lieux de manière asynchrone
      loadLocationNames(all);
    }
  };

  const loadLocationNames = async (trips: TripRow[]) => {
    const newLocationNames = new Map(locationNames);
    
    // Traiter les trips par batch pour éviter de surcharger l'API
    const batchSize = 3;
    const tripsWithLocation = trips.filter(trip => trip.lat && trip.lng);
    
    for (let i = 0; i < tripsWithLocation.length; i += batchSize) {
      const batch = tripsWithLocation.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (trip) => {
        const key = `${trip.lat},${trip.lng}`;
        if (!newLocationNames.has(key)) {
          try {
            const locationName = await getLocationDisplay(trip.lat!, trip.lng!);
            return { key, locationName };
          } catch (error) {
            console.error('Error loading location name:', error);
            return { key, locationName: getLocationDisplaySync(trip.lat!, trip.lng!) };
          }
        }
        return null;
      });
      
      const results = await Promise.all(batchPromises);
      results.forEach(result => {
        if (result) {
          newLocationNames.set(result.key, result.locationName);
        }
      });
      
      // Délai entre les batches pour éviter le rate limiting
      if (i + batchSize < tripsWithLocation.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setLocationNames(newLocationNames);
  };

  useEffect(() => {
    const loadUserId = async () => {
      if (currentUserEmail) {
        const user = await getUserProfile(currentUserEmail);
        if (user) {
          setUserId(user.id);
        }
      }
    };
    loadUserId();
  }, [currentUserEmail]);

  useEffect(() => {
    load();
  }, [userId]);

  useFocusEffect(React.useCallback(() => {
    load();
  }, [userId]));

  const filtered = trips.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));

  const handleDeleteTrip = (tripId: number, tripTitle: string) => {
    Alert.alert(
      t('trips.deleteTrip'),
      t('trips.deleteTripConfirm', { title: tripTitle }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            if (userId) {
              await deleteTripById(tripId, userId);
              load();
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateValue: number | string) => {
    const date = new Date(typeof dateValue === 'number' ? dateValue : dateValue);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTripGradient = (index: number) => {
    const gradients = ['primary', 'secondary', 'sunset', 'ocean', 'forest', 'fire', 'night', 'aurora'];
    return gradients[index % gradients.length] as any;
  };

  const renderTripCard = ({ item, index }: { item: TripRow; index: number }) => (
    <GradientCard
      gradient={getTripGradient(index)}
      style={styles.tripCard}
      shadow="lg"
      borderRadius="xl"
    >
      <View style={styles.tripCardContent}>
        {/* Image de couverture ou placeholder */}
        <View style={styles.tripCoverContainer}>
          {item.coverUri ? (
            <>
              <Image 
                source={{ uri: item.coverUri }} 
                style={styles.tripCoverImage}
                resizeMode="cover"
              />
              <View style={styles.tripCoverOverlay} />
            </>
          ) : (
            <View style={[styles.tripCoverPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.tripCoverPlaceholderText, { color: theme.textTertiary }]}>
                📸
              </ThemedText>
            </View>
          )}
        </View>
        
        <View style={[styles.tripContent, { paddingHorizontal: 12, paddingBottom: 12 }]}>
          <View style={styles.tripHeader}>
            <ThemedText style={[styles.tripTitle, { color: theme.text }]} numberOfLines={2}>
              {item.title}
            </ThemedText>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTrip(item.id, item.title)}
            >
              <ThemedText style={[styles.deleteButtonText, { color: theme.text }]}>🗑️</ThemedText>
            </TouchableOpacity>
          </View>

          {item.description ? (
            <ThemedText style={[styles.tripDescription, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </ThemedText>
          ) : null}

          <View style={styles.tripDatesCompact}>
            {item.startDate && (
              <ThemedText style={[styles.dateCompact, { color: theme.textSecondary }]}>
                📅 {formatDate(item.startDate)}
              </ThemedText>
            )}
            {item.endDate && (
              <ThemedText style={[styles.dateCompact, { color: theme.textSecondary }]}>
                📅 {formatDate(item.endDate)}
              </ThemedText>
            )}
          </View>

          {(item.lat && item.lng) && (
            <ThemedText style={[styles.locationCompact, { color: theme.textSecondary }]} numberOfLines={1}>
              📍 {locationNames.get(`${item.lat},${item.lng}`) || getLocationDisplaySync(item.lat, item.lng)}
            </ThemedText>
          )}

          <View style={styles.tripActions}>
            <Link href={`/(app)/trips/${item.id}`} asChild>
              <GradientButton
                title={t('common.view')}
                gradient="fire"
                size="sm"
                style={styles.viewButton}
              />
            </Link>
          </View>
        </View>
      </View>
    </GradientCard>
  );

  const renderEmptyState = () => (
    <GradientCard 
      gradient="aurora" 
      style={styles.emptyStateCard}
      shadow="xl"
      borderRadius="2xl"
    >
      <View style={styles.emptyStateContent}>
        <ThemedText style={styles.emptyStateIcon}>🗺️</ThemedText>
        <ThemedTextI18n 
          i18nKey="trips.noTrips" 
          style={[styles.emptyStateTitle, { color: theme.text }]}
        />
        <ThemedTextI18n 
          i18nKey="trips.noTripsDescription" 
          style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}
        />
        <Link href="/(app)/trips/new" asChild>
          <GradientButton
            title={t('trips.createFirstTrip')}
            gradient="fire"
            size="lg"
            style={styles.emptyStateButton}
          />
        </Link>
      </View>
    </GradientCard>
  );

  return (
    <GradientBackground gradient="secondary" style={styles.container}>
      <AnimatedWaves intensity="low" style={{ paddingTop: insets.top }}>
        <View style={styles.content}>
          {/* Header avec Glassmorphism */}
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <ThemedTextI18n 
                i18nKey="trips.title" 
                type="title" 
                style={[styles.title, { color: theme.text }]}
              />
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('trips.youHaveTrips', { count: trips.length, plural: trips.length !== 1 ? 's' : '' })}
              </ThemedText>
            </View>
          </GlassCard>

          {/* Search Bar avec Glassmorphism */}
          <GlassCard style={styles.searchCard} blurIntensity={25}>
            <View style={styles.searchContainer}>
              <ThemedText style={styles.searchIcon}>🔍</ThemedText>
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t('trips.searchTrips')}
                placeholderTextColor={theme.textSecondary}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </GlassCard>

          {filtered.length > 0 ? (
            <FlatList
              data={filtered}
              renderItem={renderTripCard}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.tripsGrid}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={styles.row}
            />
          ) : (
            <View style={styles.emptyContainer}>
              {renderEmptyState()}
            </View>
          )}

          <View style={styles.fabContainer}>
            <Link href="/(app)/trips/new" asChild>
              <GradientButton
                title={t('trips.newTrip')}
                gradient="primary"
                size="lg"
                style={styles.fab}
                borderRadius="full"
              />
            </Link>
          </View>
        </View>
      </AnimatedWaves>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  headerCard: {
    marginBottom: 16,
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
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
  searchCard: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  tripsGrid: {
    paddingBottom: 100,
    paddingHorizontal: 4,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  tripCard: {
    width: (width - 50) / 2,
    minHeight: 180,
    overflow: 'hidden',
  },
  tripCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tripContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tripCoverContainer: {
    height: 80,
    position: 'relative',
    marginBottom: 12,
  },
  tripCoverImage: {
    width: '100%',
    height: '100%',
  },
  tripCoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tripCoverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tripCoverPlaceholderText: {
    fontSize: 32,
    opacity: 0.6,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 6,
  },
  tripDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  deleteButtonText: {
    fontSize: 12,
  },
  tripDatesCompact: {
    marginBottom: 6,
  },
  dateCompact: {
    fontSize: 11,
    marginBottom: 2,
  },
  locationCompact: {
    fontSize: 10,
    marginBottom: 6,
  },
  tripActions: {
    alignItems: 'flex-end',
  },
  viewButton: {
    minWidth: 70,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateCard: {
    marginHorizontal: 16,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    lineHeight: 70,
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
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});