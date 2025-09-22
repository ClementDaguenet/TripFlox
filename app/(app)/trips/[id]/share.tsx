import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { getTripById, TripRow } from '@/contexts/db';
import { checkSharingTables, createTripShare, deleteTripShare, getTripShares, TripShareRow } from '@/contexts/sharing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ShareTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [shares, setShares] = useState<TripShareRow[]>([]);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'icon');
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      const [tripData, sharesData] = await Promise.all([
        getTripById(Number(id)),
        getTripShares(Number(id))
      ]);
      
      setTrip(tripData);
      setShares(sharesData);
    } catch (error) {
      console.error('Error loading trip share data:', error);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCreateReadOnlyLink = async () => {
    if (!trip) return;
    
    setIsCreatingShare(true);
    try {
      // Check if sharing tables exist
      const tablesExist = await checkSharingTables();
      if (!tablesExist) {
        Alert.alert('Database Error', 'Sharing tables not found. Please restart the app.');
        return;
      }
      
      const shareToken = await createTripShare({
        tripId: trip.id,
        shareType: 'readonly',
        permissions: JSON.stringify({ view: true, edit: false, admin: false }),
        createdBy: 1, // TODO: Get current user ID
      });

      const shareUrl = `woxtripflox://share/${shareToken}`;
      
      Alert.alert(
        'Read-Only Link Created',
        'The link has been copied to your clipboard. You can now share it with others!',
        [
          { text: 'OK' },
          { 
            text: 'Share', 
            onPress: () => Share.share({ 
              message: `Check out my trip: ${trip.title}\n\nView the trip details: ${shareUrl}\n\nDownload Wox Tripflox to view the full trip experience!` 
            })
          }
        ]
      );
      
      await Clipboard.setStringAsync(shareUrl);
      loadData();
    } catch (error) {
      console.error('Error creating read-only link:', error);
      Alert.alert('Error', `Failed to create share link: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCreateCollaborativeLink = async () => {
    if (!trip) return;
    
    setIsCreatingShare(true);
    try {
      // Check if sharing tables exist
      const tablesExist = await checkSharingTables();
      if (!tablesExist) {
        Alert.alert('Database Error', 'Sharing tables not found. Please restart the app.');
        return;
      }
      
      const shareToken = await createTripShare({
        tripId: trip.id,
        shareType: 'collaborative',
        permissions: JSON.stringify({ view: true, edit: true, admin: false }),
        createdBy: 1, // TODO: Get current user ID
      });

      const shareUrl = `woxtripflox://share/${shareToken}`;
      
      Alert.alert(
        'Collaborative Link Created',
        'The link has been copied to your clipboard. You can now invite others to collaborate!',
        [
          { text: 'OK' },
          { 
            text: 'Share', 
            onPress: () => Share.share({ 
              message: `Join my trip: ${trip.title}\n\nCollaborate on the trip: ${shareUrl}\n\nDownload Wox Tripflox to join the trip!` 
            })
          }
        ]
      );
      
      await Clipboard.setStringAsync(shareUrl);
      loadData();
    } catch (error) {
      console.error('Error creating collaborative link:', error);
      Alert.alert('Error', `Failed to create share link: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleDeleteShare = (shareId: number) => {
    Alert.alert(
      'Delete Share Link',
      'Are you sure you want to delete this share link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteTripShare(shareId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete share link');
            }
          }
        }
      ]
    );
  };

  const handleCopyLink = async (shareToken: string) => {
    const shareUrl = `woxtripflox://share/${shareToken}`;
    await Clipboard.setStringAsync(shareUrl);
    Alert.alert('Copied', 'Link copied to clipboard');
  };

  const renderShareItem = ({ item }: { item: TripShareRow }) => (
    <View style={[styles.shareCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <View style={styles.shareInfo}>
        <View style={styles.shareHeader}>
          <ThemedText style={[styles.shareType, { color: item.shareType === 'readonly' ? '#ff6b6b' : '#4CAF50' }]}>
            {item.shareType === 'readonly' ? '👁️ Read-Only' : '🤝 Collaborative'}
          </ThemedText>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteShare(item.id)}
          >
            <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>
        
        <ThemedText style={[styles.shareToken, { color: text }]}>
          {item.shareToken}
        </ThemedText>
        
        <ThemedText style={[styles.shareDate, { color: text }]}>
          Created {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
        
        {item.expiresAt && (
          <ThemedText style={[styles.shareExpiry, { color: '#ff8c00' }]}>
            Expires {new Date(item.expiresAt).toLocaleDateString()}
          </ThemedText>
        )}
      </View>
      
      <TouchableOpacity 
        style={[styles.copyButton, { backgroundColor: theme.tint }]}
        onPress={() => handleCopyLink(item.shareToken)}
      >
        <ThemedText style={styles.copyButtonText}>Copy Link</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Prepare data for FlatList
  const listData = [
    { type: 'header', id: 'header' },
    { type: 'createButtons', id: 'createButtons' },
    { type: 'sharesHeader', id: 'sharesHeader' },
    ...shares.map(share => ({ type: 'share', id: `share-${share.id}`, data: share })),
    { type: 'optionsHeader', id: 'optionsHeader' },
    { type: 'options', id: 'options' },
  ];

  const renderListItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.headerSection}>
            <ThemedText type="title" style={styles.title}>Share Trip</ThemedText>
            <ThemedText style={[styles.subtitle, { color: text }]}>
              Share "{trip.title}" with others
            </ThemedText>
          </View>
        );
      
      case 'createButtons':
        return (
          <View style={styles.createButtons}>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: '#ff6b6b' }]}
              onPress={handleCreateReadOnlyLink}
              disabled={isCreatingShare}
            >
              <ThemedText style={styles.createButtonText}>
                {isCreatingShare ? 'Creating...' : '👁️ Create Read-Only Link'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleCreateCollaborativeLink}
              disabled={isCreatingShare}
            >
              <ThemedText style={styles.createButtonText}>
                {isCreatingShare ? 'Creating...' : '🤝 Create Collaborative Link'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        );
      
      case 'sharesHeader':
        return (
          <View style={styles.sharesSection}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
              Active Share Links ({shares.length})
            </ThemedText>
            
            {shares.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>🔗</ThemedText>
                <ThemedText style={[styles.emptyText, { color: text }]}>
                  No share links created yet. Create one to start sharing!
                </ThemedText>
              </View>
            ) : null}
          </View>
        );
      
      case 'share':
        return renderShareItem({ item: item.data });
      
      case 'optionsHeader':
        return (
          <View style={styles.optionsSection}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
              Share Options
            </ThemedText>
          </View>
        );
      
      case 'options':
        return (
          <View style={styles.optionCard}>
            <ThemedText style={[styles.optionTitle, { color: text }]}>📱 Share via Apps</ThemedText>
            <ThemedText style={[styles.optionDescription, { color: text }]}>
              Share trip details via SMS, email, or social media
            </ThemedText>
            <TouchableOpacity 
              style={[styles.optionButton, { backgroundColor: theme.tint }]}
              onPress={() => Share.share({ 
                message: `Check out my trip: ${trip.title}\nStart: ${trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'}\nEnd: ${trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'TBD'}` 
              })}
            >
              <ThemedText style={styles.optionButtonText}>Share Trip Details</ThemedText>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderListItem}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
        showsVerticalScrollIndicator={false}
      />
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
  headerSection: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    opacity: 0.8,
  },
  createButtons: {
    gap: 12,
    marginBottom: 32,
  },
  createButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sharesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sharesList: {
    paddingBottom: 16,
  },
  shareCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  shareInfo: {
    flex: 1,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
    color: '#ff4444',
  },
  shareToken: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    opacity: 0.7,
  },
  shareDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  shareExpiry: {
    fontSize: 12,
    fontWeight: '600',
  },
  copyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 12,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  optionsSection: {
    marginBottom: 16,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  optionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
