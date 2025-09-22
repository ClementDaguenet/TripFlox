import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { deleteJournalEntry, deleteJournalMedia, getJournalEntryById, getJournalMedia, getTripSteps, JournalEntryRow, JournalMediaRow, TripStepRow } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function JournalEntryDetailScreen() {
  const { id, entryId } = useLocalSearchParams<{ id: string; entryId: string }>();
  const [entry, setEntry] = useState<JournalEntryRow | null>(null);
  const [media, setMedia] = useState<JournalMediaRow[]>([]);
  const [steps, setSteps] = useState<TripStepRow[]>([]);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    if (!entryId) return;
    
    try {
      const [entryData, mediaData, stepsData] = await Promise.all([
        getJournalEntryById(Number(entryId)),
        getJournalMedia(Number(entryId)),
        getTripSteps(Number(id))
      ]);
      
      setEntry(entryData);
      setMedia(mediaData);
      setSteps(stepsData);
    } catch (error) {
      console.error('Error loading journal entry data:', error);
    }
  }, [entryId, id]);

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

  const handleDeleteEntry = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteJournalEntry(Number(entryId));
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          }
        }
      ]
    );
  };

  const handleDeleteMedia = (mediaId: number, mediaType: string) => {
    Alert.alert(
      'Delete Media',
      `Are you sure you want to delete this ${mediaType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteJournalMedia(mediaId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete media');
            }
          }
        }
      ]
    );
  };

  const renderPhoto = ({ item }: { item: JournalMediaRow }) => (
    <View style={styles.mediaContainer}>
      <Image source={{ uri: item.uri }} style={styles.photo} />
      {item.caption ? (
        <ThemedText style={[styles.mediaCaption, { color: text }]}>{item.caption}</ThemedText>
      ) : null}
      <TouchableOpacity 
        style={styles.deleteMediaButton}
        onPress={() => handleDeleteMedia(item.id, 'photo')}
      >
        <ThemedText style={styles.deleteMediaText}>×</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (!entry) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const photos = media.filter(m => m.type === 'photo');
  const audios = media.filter(m => m.type === 'audio');

  const renderAudio = ({ item }: { item: JournalMediaRow }) => (
    <View style={[styles.audioContainer, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <View style={styles.audioInfo}>
        <ThemedText style={styles.audioIcon}>🎵</ThemedText>
        <View style={styles.audioDetails}>
          <ThemedText style={[styles.audioTitle, { color: text }]}>Audio Recording</ThemedText>
          {item.caption ? (
            <ThemedText style={[styles.audioCaption, { color: text }]}>{item.caption}</ThemedText>
          ) : null}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteMediaButton}
        onPress={() => handleDeleteMedia(item.id, 'audio')}
      >
        <ThemedText style={styles.deleteMediaText}>×</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="link">← Back</ThemedText>
        </TouchableOpacity>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={[styles.title, { color: text }]}>
              {entry.title}
            </ThemedText>
            <ThemedText style={[styles.step, { color: theme.tint }]}>
              {getStepName(entry.stepId)}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEntry}>
            <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Date and Time */}
        <View style={styles.dateContainer}>
          <ThemedText style={[styles.date, { color: text }]}>
            {formatDate(entry.entryDate)}
          </ThemedText>
          <ThemedText style={[styles.time, { color: text }]}>
            {formatTime(entry.entryDate)}
          </ThemedText>
        </View>
        
        {/* Content */}
        {entry.content ? (
          <View style={styles.contentContainer}>
            <ThemedText style={[styles.content, { color: text }]}>
              {entry.content}
            </ThemedText>
          </View>
        ) : null}
        
        {/* Photos */}
        {photos.length > 0 ? (
          <View style={styles.mediaSection}>
            <ThemedText type="subtitle" style={[styles.mediaSectionTitle, { color: text }]}>
              Photos ({photos.length})
            </ThemedText>
            <FlatList
              data={photos}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderPhoto}
              horizontal
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaList}
            />
          </View>
        ) : null}
        
        {/* Audios */}
        {audios.length > 0 ? (
          <View style={styles.mediaSection}>
            <ThemedText type="subtitle" style={[styles.mediaSectionTitle, { color: text }]}>
              Audio Notes ({audios.length})
            </ThemedText>
            <View style={styles.audioList}>
              {audios.map((audio) => renderAudio({ item: audio }))}
            </View>
          </View>
        ) : null}
        
        {/* Empty State for Media */}
        {media.length === 0 ? (
          <View style={styles.emptyMediaState}>
            <ThemedText style={styles.emptyMediaIcon}>📷</ThemedText>
            <ThemedText style={[styles.emptyMediaText, { color: text }]}>
              No photos or audio recordings
            </ThemedText>
          </View>
        ) : null}
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
  backButton: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  step: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    opacity: 0.7,
  },
  contentContainer: {
    marginBottom: 24,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  mediaSection: {
    marginBottom: 24,
  },
  mediaSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mediaList: {
    paddingRight: 16,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  mediaCaption: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },
  deleteMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteMediaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioList: {
    gap: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  audioInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  audioDetails: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  audioCaption: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyMediaState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMediaIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyMediaText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
