import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { getChecklists, getJournalEntries, getTripById, getTripSteps } from '@/contexts/db';
import { getTripShareByToken } from '@/contexts/sharing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ShareViewScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const loadSharedTrip = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Get share information
      const share = await getTripShareByToken(token);
      if (!share) {
        Alert.alert('Invalid Link', 'This share link is invalid or has expired.');
        router.replace('/(app)/(tabs)/home');
        return;
      }

      setShareInfo(share);

      // Check if share has expired
      if (share.expiresAt && share.expiresAt < Date.now()) {
        Alert.alert('Expired Link', 'This share link has expired.');
        router.replace('/(app)/(tabs)/home');
        return;
      }

      // Load trip data
      const [tripData, stepsData, journalData, checklistsData] = await Promise.all([
        getTripById(share.tripId),
        getTripSteps(share.tripId),
        getJournalEntries(share.tripId),
        getChecklists(share.tripId)
      ]);

      setTrip(tripData);
      setSteps(stepsData);
      setJournalEntries(journalData);
      setChecklists(checklistsData);
    } catch (error) {
      console.error('Error loading shared trip:', error);
      Alert.alert('Error', 'Failed to load shared trip');
      router.replace('/(app)/(tabs)/home');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadSharedTrip();
    }, [loadSharedTrip])
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStep = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.stepCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <View style={styles.stepHeader}>
        <ThemedText style={[styles.stepNumber, { color: theme.tint }]}>
          {index + 1}
        </ThemedText>
        <View style={styles.stepInfo}>
          <ThemedText style={[styles.stepName, { color: text }]}>
            {item.name}
          </ThemedText>
          {item.description ? (
            <ThemedText style={[styles.stepDescription, { color: text }]}>
              {item.description}
            </ThemedText>
          ) : null}
        </View>
      </View>
      
      {(item.startDate || item.endDate) ? (
        <View style={styles.stepDates}>
          {item.startDate ? (
            <ThemedText style={[styles.stepDate, { color: text }]}>
              Start: {formatDate(item.startDate)}
            </ThemedText>
          ) : null}
          {item.endDate ? (
            <ThemedText style={[styles.stepDate, { color: text }]}>
              End: {formatDate(item.endDate)}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const renderJournalEntry = ({ item }: { item: any }) => (
    <View style={[styles.journalCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <ThemedText style={[styles.journalTitle, { color: text }]}>
        {item.title}
      </ThemedText>
      <ThemedText style={[styles.journalDate, { color: text }]}>
        {formatDate(item.entryDate)}
      </ThemedText>
      {item.content ? (
        <ThemedText style={[styles.journalContent, { color: text }]}>
          {item.content}
        </ThemedText>
      ) : null}
    </View>
  );

  const renderChecklist = ({ item }: { item: any }) => (
    <View style={[styles.checklistCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <ThemedText style={[styles.checklistTitle, { color: text }]}>
        {item.name}
      </ThemedText>
      {item.description ? (
        <ThemedText style={[styles.checklistDescription, { color: text }]}>
          {item.description}
        </ThemedText>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading shared trip...</ThemedText>
      </ThemedView>
    );
  }

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Trip not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {trip.title}
          </ThemedText>
          <ThemedText style={[styles.shareType, { color: shareInfo?.shareType === 'readonly' ? '#ff6b6b' : '#4CAF50' }]}>
            {shareInfo?.shareType === 'readonly' ? '👁️ Read-Only View' : '🤝 Collaborative View'}
          </ThemedText>
        </View>

        {/* Trip Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: text }]}>Start Date</ThemedText>
            <ThemedText style={[styles.infoValue, { color: text }]}>
              {trip.startDate ? formatDate(trip.startDate) : 'Not set'}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: text }]}>End Date</ThemedText>
            <ThemedText style={[styles.infoValue, { color: text }]}>
              {trip.endDate ? formatDate(trip.endDate) : 'Not set'}
            </ThemedText>
          </View>
        </View>

        {/* Trip Steps */}
        {steps.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
              Trip Steps ({steps.length})
            </ThemedText>
            <FlatList
              data={steps}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderStep}
              scrollEnabled={false}
              contentContainerStyle={styles.stepsList}
            />
          </View>
        ) : null}

        {/* Journal Entries */}
        {journalEntries.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
              Travel Journal ({journalEntries.length})
            </ThemedText>
            <FlatList
              data={journalEntries}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderJournalEntry}
              scrollEnabled={false}
              contentContainerStyle={styles.journalList}
            />
          </View>
        ) : null}

        {/* Checklists */}
        {checklists.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
              Preparation Lists ({checklists.length})
            </ThemedText>
            <FlatList
              data={checklists}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderChecklist}
              scrollEnabled={false}
              contentContainerStyle={styles.checklistsList}
            />
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: text }]}>
            Shared via Wox Tripflox
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  shareType: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepsList: {
    paddingBottom: 16,
  },
  stepCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 24,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  stepDates: {
    marginTop: 8,
  },
  stepDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  journalList: {
    paddingBottom: 16,
  },
  journalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  journalDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  journalContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  checklistsList: {
    paddingBottom: 16,
  },
  checklistCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
