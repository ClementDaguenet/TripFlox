import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { ChecklistRow, deleteChecklist, getChecklistById, getChecklists, getTripById, insertChecklist, TripRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ChecklistsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [templates, setTemplates] = useState<ChecklistRow[]>([]);
  const [selectedTab, setSelectedTab] = useState<'trip' | 'templates'>('trip');
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      const [tripData, tripChecklists, templateChecklists] = await Promise.all([
        getTripById(Number(id)),
        getChecklists(Number(id)),
        getChecklists(null) // Templates have tripId = null
      ]);
      
      setTrip(tripData);
      setChecklists(tripChecklists);
      setTemplates(templateChecklists.filter(c => c.isTemplate));
    } catch (error) {
      console.error('Error loading checklists data:', error);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteChecklist = (checklistId: number, checklistName: string) => {
    Alert.alert(
      'Delete Checklist',
      `Are you sure you want to delete "${checklistName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteChecklist(checklistId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete checklist');
            }
          }
        }
      ]
    );
  };

  const handleUseTemplate = async (templateId: number) => {
    try {
      const template = await getChecklistById(templateId);
      if (!template) return;

      // Create a new checklist based on the template
      const newChecklistId = await insertChecklist({
        tripId: Number(id),
        name: template.name,
        description: template.description,
        isTemplate: false,
      });

      // TODO: Copy template items to new checklist
      Alert.alert('Success', 'Checklist created from template!', [
        { text: 'OK', onPress: () => router.push({ pathname: '/(app)/trips/[id]/checklists/[checklistId]', params: { id: String(id), checklistId: String(newChecklistId) } }) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create checklist from template');
    }
  };

  const renderChecklist = ({ item }: { item: ChecklistRow }) => (
    <TouchableOpacity 
      style={[styles.checklistCard, { backgroundColor: theme.background, borderColor: theme.icon }]}
      onPress={() => router.push({ pathname: '/(app)/trips/[id]/checklists/[checklistId]', params: { id: String(id), checklistId: String(item.id) } })}
    >
      <View style={styles.checklistHeader}>
        <View style={styles.checklistInfo}>
          <ThemedText style={[styles.checklistName, { color: text }]}>{item.name}</ThemedText>
          {item.description ? (
            <ThemedText style={[styles.checklistDescription, { color: text }]}>{item.description}</ThemedText>
          ) : null}
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteChecklist(item.id, item.name)}
        >
          <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.checklistFooter}>
        <ThemedText style={[styles.checklistDate, { color: text }]}>
          Created {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
        {item.isTemplate ? (
          <View style={[styles.templateBadge, { backgroundColor: theme.tint }]}>
            <ThemedText style={styles.templateText}>Template</ThemedText>
          </View>
        ) : null}
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

  const currentChecklists = selectedTab === 'trip' ? checklists : templates;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: text }]}>
            Preparation Lists
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: text }]}>
            {trip.title}
          </ThemedText>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, { backgroundColor: selectedTab === 'trip' ? theme.tint : theme.background, borderColor: theme.tint }]}
            onPress={() => setSelectedTab('trip')}
          >
            <ThemedText style={[styles.tabText, { color: selectedTab === 'trip' ? 'white' : theme.tint }]}>
              Trip Lists ({checklists.length})
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, { backgroundColor: selectedTab === 'templates' ? theme.tint : theme.background, borderColor: theme.tint }]}
            onPress={() => setSelectedTab('templates')}
          >
            <ThemedText style={[styles.tabText, { color: selectedTab === 'templates' ? 'white' : theme.tint }]}>
              Templates ({templates.length})
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Link href={{ pathname: '/(app)/trips/[id]/checklists/new', params: { id: String(id) } }} asChild>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.tint }]}>
              <ThemedText style={styles.actionButtonText}>+ New List</ThemedText>
            </TouchableOpacity>
          </Link>
          
          {selectedTab === 'templates' ? (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ff8c00' }]}
              onPress={() => {
                // TODO: Create template functionality
                Alert.alert('Coming Soon', 'Template creation will be available soon!');
              }}
            >
              <ThemedText style={styles.actionButtonText}>📝 New Template</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Checklists List */}
        {currentChecklists.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>
              {selectedTab === 'trip' ? '✅' : '📝'}
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.emptyTitle, { color: text }]}>
              {selectedTab === 'trip' ? 'No checklists yet' : 'No templates yet'}
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: text }]}>
              {selectedTab === 'trip' 
                ? 'Start preparing for your trip by creating your first checklist!'
                : 'Create reusable templates for your travel preparations!'
              }
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={currentChecklists}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderChecklist}
            scrollEnabled={false}
            contentContainerStyle={styles.checklistsList}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
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
  checklistsList: {
    paddingBottom: 24,
  },
  checklistCard: {
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
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checklistInfo: {
    flex: 1,
  },
  checklistName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
  checklistFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  templateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  templateText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
