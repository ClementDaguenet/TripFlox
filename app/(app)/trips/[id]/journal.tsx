import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { deleteJournalEntry, getJournalEntries, getTripById, getTripSteps, JournalEntryRow, TripRow, TripStepRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function JournalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [steps, setSteps] = useState<TripStepRow[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryRow[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'day' | 'step'>('all');
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      const [tripData, stepsData, entriesData] = await Promise.all([
        getTripById(Number(id)),
        getTripSteps(Number(id)),
        getJournalEntries(Number(id))
      ]);
      
      setTrip(tripData);
      setSteps(stepsData);
      setJournalEntries(entriesData);
    } catch (error) {
      console.error('Error loading journal data:', error);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStepName = (stepId: number | null) => {
    if (!stepId) return 'General';
    const step = steps.find(s => s.id === stepId);
    return step?.name || 'Unknown Step';
  };

  const getFilteredEntries = () => {
    switch (selectedFilter) {
      case 'step':
        return journalEntries.filter(entry => entry.stepId === selectedStepId);
      case 'day':
        // Group by day
        const groupedByDay = journalEntries.reduce((acc, entry) => {
          const day = new Date(entry.entryDate).toDateString();
          if (!acc[day]) acc[day] = [];
          acc[day].push(entry);
          return acc;
        }, {} as Record<string, JournalEntryRow[]>);
        return Object.values(groupedByDay).flat();
      default:
        return journalEntries;
    }
  };

  const handleDeleteEntry = (entryId: number, entryTitle: string) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entryTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteJournalEntry(entryId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          }
        }
      ]
    );
  };

  const exportToPDF = async () => {
    try {
      // Create HTML content for PDF
      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .entry { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
              .entry-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .entry-content { margin-bottom: 10px; line-height: 1.6; }
              .entry-meta { font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${trip?.title} - Travel Journal</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
      `;

      journalEntries.forEach(entry => {
        htmlContent += `
          <div class="entry">
            <div class="entry-title">${entry.title}</div>
            <div class="entry-content">${entry.content || ''}</div>
            <div class="entry-meta">
              ${formatDate(entry.entryDate)} - ${getStepName(entry.stepId)}
            </div>
          </div>
        `;
      });

      htmlContent += `</body></html>`;

      // For now, we'll use Share to export as text
      // In a real implementation, you'd use a PDF library
      const textContent = journalEntries.map(entry => 
        `${entry.title}\n${entry.content || ''}\n${formatDate(entry.entryDate)} - ${getStepName(entry.stepId)}\n\n`
      ).join('---\n\n');

      await Share.share({
        message: `Travel Journal - ${trip?.title}\n\n${textContent}`,
        title: 'Travel Journal Export'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export journal');
    }
  };

  const exportPhotos = async () => {
    try {
      // Get all photos from journal entries
      const allPhotos = journalEntries.flatMap(entry => 
        entry.id ? [] : [] // We'd need to fetch media for each entry
      );

      if (allPhotos.length === 0) {
        Alert.alert('No Photos', 'No photos found in your journal entries');
        return;
      }

      // For now, show a placeholder message
      Alert.alert('Export Photos', 'Photo export feature will be available soon!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export photos');
    }
  };

  const renderEntry = ({ item }: { item: JournalEntryRow }) => (
    <TouchableOpacity 
      style={[styles.entryCard, { backgroundColor: theme.background, borderColor: theme.icon }]}
      onPress={() => router.push({ pathname: '/(app)/trips/[id]/journal/[entryId]', params: { id: String(id), entryId: String(item.id) } })}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryTitleContainer}>
          <ThemedText style={[styles.entryTitle, { color: text }]}>{item.title}</ThemedText>
          <ThemedText style={[styles.entryStep, { color: theme.tint }]}>
            {getStepName(item.stepId)}
          </ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteEntry(item.id, item.title)}
        >
          <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
        </TouchableOpacity>
      </View>
      
      {item.content ? (
        <ThemedText style={[styles.entryContent, { color: text }]} numberOfLines={3}>
          {item.content}
        </ThemedText>
      ) : null}
      
      <View style={styles.entryFooter}>
        <ThemedText style={[styles.entryDate, { color: text }]}>
          {formatDate(item.entryDate)}
        </ThemedText>
        <ThemedText style={[styles.entryTime, { color: text }]}>
          {formatTime(item.entryDate)}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const filteredEntries = getFilteredEntries();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: text }]}>
            Travel Journal
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: text }]}>
            {trip.title}
          </ThemedText>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: selectedFilter === 'all' ? theme.tint : theme.background, borderColor: theme.tint }]}
            onPress={() => setSelectedFilter('all')}
          >
            <ThemedText style={[styles.filterButtonText, { color: selectedFilter === 'all' ? 'white' : theme.tint }]}>
              All Entries
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: selectedFilter === 'day' ? theme.tint : theme.background, borderColor: theme.tint }]}
            onPress={() => setSelectedFilter('day')}
          >
            <ThemedText style={[styles.filterButtonText, { color: selectedFilter === 'day' ? 'white' : theme.tint }]}>
              By Day
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: selectedFilter === 'step' ? theme.tint : theme.background, borderColor: theme.tint }]}
            onPress={() => setSelectedFilter('step')}
          >
            <ThemedText style={[styles.filterButtonText, { color: selectedFilter === 'step' ? 'white' : theme.tint }]}>
              By Step
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Step Selector (when step filter is active) */}
        {selectedFilter === 'step' ? (
          <View style={styles.stepSelector}>
            <ThemedText style={[styles.stepSelectorLabel, { color: text }]}>Select Step:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepScrollView}>
              <TouchableOpacity 
                style={[styles.stepOption, { backgroundColor: selectedStepId === null ? theme.tint : theme.background, borderColor: theme.tint }]}
                onPress={() => setSelectedStepId(null)}
              >
                <ThemedText style={[styles.stepOptionText, { color: selectedStepId === null ? 'white' : theme.tint }]}>
                  General
                </ThemedText>
              </TouchableOpacity>
              {steps.map((step) => (
                <TouchableOpacity 
                  key={step.id}
                  style={[styles.stepOption, { backgroundColor: selectedStepId === step.id ? theme.tint : theme.background, borderColor: theme.tint }]}
                  onPress={() => setSelectedStepId(step.id)}
                >
                  <ThemedText style={[styles.stepOptionText, { color: selectedStepId === step.id ? 'white' : theme.tint }]}>
                    {step.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Link href={{ pathname: '/(app)/trips/[id]/journal/new-entry', params: { id: String(id) } }} asChild>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.tint }]}>
              <ThemedText style={styles.actionButtonText}>+ New Entry</ThemedText>
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ff8c00' }]}
            onPress={exportToPDF}
          >
            <ThemedText style={styles.actionButtonText}>📄 Export PDF</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={exportPhotos}
          >
            <ThemedText style={styles.actionButtonText}>📸 Export Photos</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>📖</ThemedText>
            <ThemedText type="subtitle" style={[styles.emptyTitle, { color: text }]}>
              No journal entries yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: text }]}>
              Start documenting your travel memories by creating your first journal entry!
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEntry}
            scrollEnabled={false}
            contentContainerStyle={styles.entriesList}
          />
        )}
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepSelector: {
    marginBottom: 16,
  },
  stepSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepScrollView: {
    flexDirection: 'row',
  },
  stepOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  stepOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  entriesList: {
    paddingBottom: 24,
  },
  entryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryTitleContainer: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryStep: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  entryTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
});
