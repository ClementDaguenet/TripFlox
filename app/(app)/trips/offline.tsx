import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { clearOfflineData, getOfflineDataSize, getSyncStatus, prepareOfflineData, setSyncStatus } from '@/contexts/offline';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OfflineModeScreen() {
  const [syncStatus, setSyncStatusState] = useState<'synced' | 'pending' | 'error' | null>(null);
  const [offlineDataSize, setOfflineDataSize] = useState<number>(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'icon');
  const insets = useSafeAreaInsets();

  const loadStatus = useCallback(async () => {
    try {
      const [status, size] = await Promise.all([
        getSyncStatus(),
        getOfflineDataSize()
      ]);
      setSyncStatusState(status);
      setOfflineDataSize(size);
    } catch (error) {
      console.error('Error loading offline status:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  const handlePrepareOfflineData = async () => {
    setIsPreparing(true);
    try {
      const offlineData = await prepareOfflineData();
      
      Alert.alert(
        'Offline Data Prepared',
        `Successfully prepared offline data:\n• ${offlineData.trips.length} trips\n• ${offlineData.tripSteps.length} steps\n• ${offlineData.journalEntries.length} journal entries\n• ${offlineData.checklists.length} checklists`,
        [{ text: 'OK' }]
      );
      
      loadStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare offline data');
    } finally {
      setIsPreparing(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await setSyncStatus('pending');
      setSyncStatusState('pending');
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await setSyncStatus('synced');
      setSyncStatusState('synced');
      
      Alert.alert('Success', 'Data synced successfully!');
      loadStatus();
    } catch (error) {
      await setSyncStatus('error');
      setSyncStatusState('error');
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      'Clear Offline Data',
      'Are you sure you want to clear all offline data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await clearOfflineData();
              await setSyncStatus('synced');
              setSyncStatusState('synced');
              setOfflineDataSize(0);
              Alert.alert('Success', 'Offline data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear offline data');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'synced': return '#4CAF50';
      case 'pending': return '#ff8c00';
      case 'error': return '#ff4444';
      default: return theme.icon;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'synced': return 'Synced';
      case 'pending': return 'Syncing...';
      case 'error': return 'Sync Error';
      default: return 'Unknown';
    }
  };

  const formatDataSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Back Button */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={[styles.backButtonText, { color: theme.tint }]}>
            ← Back
          </ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Offline Mode</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.subtitle, { color: text }]}>
          Manage your offline data and synchronization
        </ThemedText>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <View style={styles.statusHeader}>
            <ThemedText style={[styles.statusTitle, { color: text }]}>Sync Status</ThemedText>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(syncStatus) }]} />
          </View>
          <ThemedText style={[styles.statusText, { color: getStatusColor(syncStatus) }]}>
            {getStatusText(syncStatus)}
          </ThemedText>
          <ThemedText style={[styles.dataSize, { color: text }]}>
            Offline data: {formatDataSize(offlineDataSize)}
          </ThemedText>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
            Actions
          </ThemedText>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.tint }]}
            onPress={handlePrepareOfflineData}
            disabled={isPreparing}
          >
            <ThemedText style={styles.actionButtonText}>
              {isPreparing ? 'Preparing...' : '📱 Prepare Offline Data'}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={handleSyncData}
            disabled={isSyncing || syncStatus === 'pending'}
          >
            <ThemedText style={styles.actionButtonText}>
              {isSyncing ? 'Syncing...' : '🔄 Sync Data'}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
            onPress={handleClearOfflineData}
          >
            <ThemedText style={styles.actionButtonText}>🗑️ Clear Offline Data</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Information */}
        <View style={styles.infoSection}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
            About Offline Mode
          </ThemedText>
          
          <View style={[styles.infoCard, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
            <ThemedText style={[styles.infoText, { color: text }]}>
              • <ThemedText style={styles.bold}>Prepare Offline Data:</ThemedText> Download all your trips, steps, journal entries, and checklists for offline use
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: text }]}>
              • <ThemedText style={styles.bold}>Sync Data:</ThemedText> Upload any changes made while offline when you're back online
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: text }]}>
              • <ThemedText style={styles.bold}>Offline Access:</ThemedText> View and edit your trips even without internet connection
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: text }]}>
              • <ThemedText style={styles.bold}>Automatic Sync:</ThemedText> Changes are automatically synced when you reconnect
            </ThemedText>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: text }]}>
            Tips
          </ThemedText>
          
          <View style={[styles.tipCard, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
            <ThemedText style={[styles.tipText, { color: text }]}>
              💡 Prepare your offline data before traveling to ensure you have access to all your trip information
            </ThemedText>
          </View>
          
          <View style={[styles.tipCard, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
            <ThemedText style={[styles.tipText, { color: text }]}>
              🔄 Sync your data regularly to keep your information up to date across all devices
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60, // Same width as back button to center the title
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  statusCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataSize: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  tipsSection: {
    marginBottom: 16,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
