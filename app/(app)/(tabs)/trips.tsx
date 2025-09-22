import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { deleteTripById, getAllTrips, TripRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TripsScreen() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [query, setQuery] = useState('');
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = useThemeColor({}, 'icon');
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const load = async () => {
    const all = await getAllTrips();
    setTrips(all);
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(React.useCallback(() => {
    load();
  }, []));

  const filtered = trips.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));

  const handleDeleteTrip = (tripId: number, tripTitle: string) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${tripTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteTripById(tripId);
            load();
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'No date set';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTripDuration = (startDate: number | null, endDate: number | null) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="title" style={styles.headerTitle}>My Trips</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{filtered.length} trip{filtered.length !== 1 ? 's' : ''}</ThemedText>
        </View>
        <View style={styles.headerButtons}>
          <Link href="/(app)/trips/offline" asChild>
            <TouchableOpacity style={[styles.offlineButton, { backgroundColor: '#ff8c00' }]}>
              <ThemedText style={styles.offlineButtonText}>📱 Offline</ThemedText>
            </TouchableOpacity>
          </Link>
          <Link href="/(app)/trips/new" asChild>
            <TouchableOpacity style={[styles.newTripButton, { backgroundColor: theme.tint }]}>
              <ThemedText style={styles.newTripButtonText}>+ New Trip</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { borderColor: border, color: text }]}
          placeholder="Search your trips..."
          placeholderTextColor={border}
          value={query}
          onChangeText={setQuery}
        />
        <View style={[styles.searchIcon, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.searchIconText}>🔍</ThemedText>
        </View>
      </View>

      {/* Trips List */}
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const duration = getTripDuration(item.startDate, item.endDate);
          return (
            <View style={[styles.tripCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              {/* Trip Image */}
              <View style={styles.tripImageContainer}>
                {item.coverUri ? (
                  <Image source={{ uri: item.coverUri }} style={styles.tripImage} />
                ) : (
                  <View style={[styles.tripImagePlaceholder, { backgroundColor: theme.tint }]}>
                    <ThemedText style={styles.tripImagePlaceholderText}>🗺️</ThemedText>
                  </View>
                )}
                <View style={[styles.tripStatusBadge, { backgroundColor: theme.tint }]}>
                  <ThemedText style={styles.tripStatusText}>Active</ThemedText>
                </View>
              </View>

              {/* Trip Content */}
              <View style={styles.tripContent}>
                <ThemedText type="subtitle" style={[styles.tripTitle, { color: theme.text }]}>{item.title}</ThemedText>
                
                {/* Trip Dates */}
                <View style={styles.tripDates}>
                  <View style={styles.dateItem}>
                    <ThemedText style={[styles.dateLabel, { color: theme.text }]}>Start</ThemedText>
                    <ThemedText style={[styles.dateValue, { color: theme.text }]}>{formatDate(item.startDate)}</ThemedText>
                  </View>
                  <View style={styles.dateItem}>
                    <ThemedText style={[styles.dateLabel, { color: theme.text }]}>End</ThemedText>
                    <ThemedText style={[styles.dateValue, { color: theme.text }]}>{formatDate(item.endDate)}</ThemedText>
                  </View>
                  {duration && (
                    <View style={styles.dateItem}>
                      <ThemedText style={[styles.dateLabel, { color: theme.text }]}>Duration</ThemedText>
                      <ThemedText style={[styles.dateValue, { color: theme.text }]}>{duration} day{duration !== 1 ? 's' : ''}</ThemedText>
                    </View>
                  )}
                </View>

                {/* Trip Location */}
                {item.lat && item.lng && (
                  <View style={styles.tripLocation}>
                    <ThemedText style={styles.locationIcon}>📍</ThemedText>
                    <ThemedText style={[styles.locationText, { color: theme.text }]}>Location set</ThemedText>
                  </View>
                )}

                    {/* Action Buttons */}
                    <View style={styles.tripActions}>
                      <Link href={{ pathname: '/(app)/trips/[id]', params: { id: String(item.id) } }} asChild>
                        <TouchableOpacity style={[styles.viewButton, { backgroundColor: theme.tint }]}>
                          <View style={styles.viewButtonContent}>
                            <ThemedText style={styles.viewButtonIcon}>👁️</ThemedText>
                            <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
                          </View>
                        </TouchableOpacity>
                      </Link>
                      <TouchableOpacity 
                        style={[styles.deleteButton]} 
                        onPress={() => handleDeleteTrip(item.id, item.title)}
                      >
                        <View style={styles.deleteButtonContent}>
                          <ThemedText style={styles.deleteButtonIcon}>🗑️</ThemedText>
                          <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                        </View>
                      </TouchableOpacity>
                    </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateIcon}>🗺️</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyStateTitle}>No trips yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>Start planning your next adventure by creating your first trip!</ThemedText>
            <Link href="/(app)/trips/new" asChild>
              <TouchableOpacity style={[styles.emptyStateButton, { backgroundColor: theme.tint }]}>
                <ThemedText style={styles.emptyStateButtonText}>Create Your First Trip</ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  offlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
  },
  offlineButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  newTripButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  newTripButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  searchIcon: {
    position: 'absolute',
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 24,
  },
  tripCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripImageContainer: {
    position: 'relative',
    height: 160,
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  tripImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripImagePlaceholderText: {
    fontSize: 48,
  },
  tripStatusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tripStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tripContent: {
    padding: 20,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tripDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    opacity: 0.7,
  },
      tripActions: {
        flexDirection: 'row',
        gap: 12,
      },
      viewButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
      viewButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
      viewButtonIcon: {
        fontSize: 16,
      },
      viewButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
      },
      deleteButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
        backgroundColor: '#ff4444',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
      deleteButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
      deleteButtonIcon: {
        fontSize: 16,
      },
      deleteButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
      },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});


