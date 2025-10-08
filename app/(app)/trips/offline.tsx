import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientCard } from '@/components/ui/gradient-card';
import { Colors } from '@/constants/theme';
import { clearOfflineData, getOfflineDataSize, getSyncStatus, prepareOfflineData, setSyncStatus } from '@/contexts/offline';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OfflineModeScreen() {
  const [syncStatus, setSyncStatusState] = useState<'synced' | 'pending' | 'error' | null>(null);
  const [offlineDataSize, setOfflineDataSize] = useState<number>(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;
  const border = theme.icon;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

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
        t('alerts.offlineDataPrepared'),
        t('alerts.offlineDataPreparedMessage', { count: offlineData.trips.length }),
        [{ text: t('common.ok') }]
      );
      loadStatus();
    } catch (error) {
      console.error('Error preparing offline data:', error);
      Alert.alert(t('common.error'), t('alerts.failedToPrepareOfflineData'));
    } finally {
      setIsPreparing(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      await setSyncStatus('synced');
      
      Alert.alert(t('common.success'), t('alerts.dataSynchronized'));
      loadStatus();
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert(t('common.error'), t('alerts.failedToSyncData'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      t('alerts.clearOfflineData'),
      t('alerts.clearOfflineDataMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('alerts.clear'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await clearOfflineData();
              setOfflineDataSize(0);
              Alert.alert(t('common.success'), t('alerts.offlineDataCleared'));
            } catch (error) {
              Alert.alert(t('common.error'), t('alerts.failedToClearOfflineData'));
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'synced': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return theme.icon;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'synced': return t('status.synced');
      case 'pending': return t('status.syncing');
      case 'error': return t('status.syncError');
      default: return t('status.unknown');
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'synced': return '✅';
      case 'pending': return '⏳';
      case 'error': return '❌';
      default: return '❓';
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
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="medium" style={{ paddingTop: insets.top }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <ThemedTextI18n 
                  i18nKey="offline.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="offline.subtitle" 
                  style={[styles.subtitle, { color: theme.textSecondary }]}
                />
              </View>
            </View>
          </GlassCard>

          <GradientCard 
            gradient="ocean" 
            style={styles.statusCard}
            shadow="lg"
            borderRadius="xl"
          >
            <View style={styles.statusContent}>
              <View style={styles.statusHeader}>
                <ThemedText style={styles.statusIcon}>
                  {getStatusIcon(syncStatus)}
                </ThemedText>
                <ThemedText style={[styles.statusTitle, { color: theme.text }]}>
                  Sync Status
                </ThemedText>
              </View>
              <ThemedText style={[styles.statusText, { color: getStatusColor(syncStatus) }]}>
                {getStatusText(syncStatus)}
              </ThemedText>
              <ThemedText style={styles.dataSize}>
                Offline Data: {formatDataSize(offlineDataSize)}
              </ThemedText>
            </View>
          </GradientCard>

          <View style={styles.actionButtons}>
            <GradientButton
              title={t('buttons.prepareOfflineData')}
              gradient="primary"
              size="lg"
              style={styles.actionButton}
              onPress={handlePrepareOfflineData}
              disabled={isPreparing}
            />
            <GradientButton
              title={t('buttons.syncData')}
              gradient="secondary"
              size="lg"
              style={styles.actionButton}
              onPress={handleSyncData}
              disabled={isSyncing}
            />
            <GradientButton
              title={t('buttons.clearOfflineData')}
              gradient="fire"
              size="lg"
              style={styles.actionButton}
              onPress={handleClearOfflineData}
            />
          </View>

          <View style={styles.infoCards}>
            <GlassCard style={styles.infoCard} blurIntensity={20}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoIcon}>📱</ThemedText>
                <View style={styles.infoContent}>
                  <ThemedText style={[styles.infoTitle, { color: theme.text }]}>
                    Offline Access
                  </ThemedText>
                  <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
                    Access your trips and data even without internet connection
                  </ThemedText>
                </View>
              </View>
            </GlassCard>

            <GlassCard style={styles.infoCard} blurIntensity={20}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoIcon}>🔄</ThemedText>
                <View style={styles.infoContent}>
                  <ThemedText style={[styles.infoTitle, { color: theme.text }]}>
                    Auto Sync
                  </ThemedText>
                  <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
                    Automatically sync your data when you&apos;re back online
                  </ThemedText>
                </View>
              </View>
            </GlassCard>

            <GlassCard style={styles.infoCard} blurIntensity={20}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoIcon}>💾</ThemedText>
                <View style={styles.infoContent}>
                  <ThemedText style={[styles.infoTitle, { color: theme.text }]}>
                    Local Storage
                  </ThemedText>
                  <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
                    Your data is stored securely on your device
                  </ThemedText>
                </View>
              </View>
            </GlassCard>
          </View>

          <GlassCard style={styles.tipsCard} blurIntensity={15}>
            <ThemedText style={[styles.tipsTitle, { color: theme.text }]}>
              💡 Tips for Offline Mode
            </ThemedText>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <ThemedText style={styles.tipIcon}>1️⃣</ThemedText>
                <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
                  Prepare offline data before traveling to areas with poor connectivity
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <ThemedText style={styles.tipIcon}>2️⃣</ThemedText>
                <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
                  Sync your data regularly to keep everything up to date
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <ThemedText style={styles.tipIcon}>3️⃣</ThemedText>
                <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
                  Clear offline data periodically to free up storage space
                </ThemedText>
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
    alignItems: 'center',
  },
  headerContent: {
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
    textAlign: 'center',
  },

  // Status Card
  statusCard: {
    marginBottom: 8,
  },
  statusContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataSize: {
    fontSize: 14,
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },

  // Info Cards
  infoCards: {
    gap: 12,
  },
  infoCard: {
    marginBottom: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Tips
  tipsCard: {
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});