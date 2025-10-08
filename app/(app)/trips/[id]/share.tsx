import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { GradientCard } from '@/components/ui/gradient-card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getTripById, getUserProfile, TripRow } from '@/contexts/db';
import { checkSharingTables, createTripShareSimple, deleteTripShare, getTripShares, TripShareRow } from '@/contexts/sharing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ShareTripScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [shares, setShares] = useState<TripShareRow[]>([]);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;
  const border = theme.icon;
  const insets = useSafeAreaInsets();
  const { currentUserEmail } = useAuth();

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
    if (userId) {
      loadData();
    }
  }, [userId, loadData]);

  const loadData = useCallback(async () => {
    if (!id || !userId) return;
    
    try {
      // Ensure sharing tables exist
      const tablesExist = await checkSharingTables();
      if (!tablesExist) {
        console.error('Sharing tables not found');
        return;
      }

      const [tripData, sharesData] = await Promise.all([
        getTripById(Number(id), userId),
        getTripShares(Number(id))
      ]);
      
      setTrip(tripData);
      setShares(sharesData);
    } catch (error) {
      console.error('Error loading trip share data:', error);
    }
  }, [id, userId]);

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
        Alert.alert(t('common.error'), t('share.tablesNotFound'));
        return;
      }

      const share = await createTripShareSimple(Number(id), 'readonly');
      if (share) {
        const shareUrl = `https://woxtripflox.app/share/${share.token}`;
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert(t('common.success'), t('share.readOnlyLinkCreated'));
        loadData();
      } else {
        Alert.alert(t('common.error'), t('share.failedToCreateLink'));
      }
    } catch (error) {
      console.error('Error creating read-only link:', error);
      Alert.alert(t('common.error'), t('alerts.failedToCreateShareLink'));
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCreateCollaborativeLink = async () => {
    if (!trip) return;
    
    setIsCreatingShare(true);
    try {
      const share = await createTripShareSimple(Number(id), 'collaborative');
      if (share) {
        const shareUrl = `https://woxtripflox.app/share/${share.token}`;
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert(t('common.success'), t('share.collaborativeLinkCreated'));
        loadData();
      } else {
        Alert.alert(t('common.error'), t('share.failedToCreateLink'));
      }
    } catch (error) {
      console.error('Error creating collaborative link:', error);
      Alert.alert(t('common.error'), t('alerts.failedToCreateShareLink'));
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleDeleteShare = async (shareId: number) => {
    Alert.alert(
      t('share.deleteShareLink'),
      t('share.deleteShareLinkConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            await deleteTripShare(shareId);
            loadData();
          }
        }
      ]
    );
  };


  const handleCopyLink = async (token: string) => {
    try {
      const shareUrl = `https://woxtripflox.app/share/${token}`;
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert(t('common.success'), t('share.linkCopied'));
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert(t('common.error'), t('share.failedToCopyLink'));
    }
  };

  const handleShareLink = async (token: string) => {
    try {
      const shareUrl = `https://woxtripflox.app/share/${token}`;
      await Share.share({
        message: `Check out my trip: ${trip?.title}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing link:', error);
    }
  };

  const getShareGradient = (index: number) => {
    const gradients = ['primary', 'secondary', 'sunset', 'ocean', 'forest', 'fire', 'night', 'aurora'];
    return gradients[index % gradients.length] as any;
  };

  const formatDate = (dateValue: number | string) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderShareItem = ({ item, index }: { item: TripShareRow; index: number }) => (
    <GradientCard
      gradient={getShareGradient(index)}
      style={styles.shareCard}
      shadow="md"
      borderRadius="lg"
    >
      <View style={styles.shareContent}>
        <View style={styles.shareHeader}>
          <View style={styles.shareInfo}>
            <ThemedText style={[styles.shareTitle, { color: theme.text }]}>
              {item.shareType === 'readonly' ? t('share.readOnlyLink') : t('share.collaborativeLink')}
            </ThemedText>
            <ThemedText style={styles.shareDate}>
              {t('share.created')} {formatDate(item.createdAt)}
            </ThemedText>
            <ThemedText style={styles.shareToken}>
              {t('share.token')}: {item.shareToken.substring(0, 8)}...
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteShare(item.id)}
          >
            <ThemedText style={[styles.deleteButtonText, { color: theme.text }]}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.shareActions}>
          <GradientButton
            title={t('share.copy')}
            gradient="secondary"
            size="sm"
            style={styles.shareActionButton}
            onPress={() => handleCopyLink(item.shareToken)}
          />
          <GradientButton
            title={t('share.share')}
            gradient="ocean"
            size="sm"
            style={styles.shareActionButton}
            onPress={() => handleShareLink(item.shareToken)}
          />
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
        <ThemedText style={styles.emptyStateIcon}>🔗</ThemedText>
        <ThemedTextI18n 
          i18nKey="share.noShareLinksYet" 
          style={[styles.emptyStateTitle, { color: theme.text }]}
        />
        <ThemedTextI18n 
          i18nKey="share.createShareLinkDescription" 
          style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}
        />
      </View>
    </GradientCard>
  );

  if (!trip) {
    return (
      <GradientBackground gradient="primary" style={styles.container}>
        <AnimatedWaves intensity="medium">
          <View style={styles.loadingContainer}>
            <ThemedTextI18n 
              i18nKey="share.loading" 
              style={[styles.loadingText, { color: theme.text }]}
            />
          </View>
        </AnimatedWaves>
      </GradientBackground>
    );
  }

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
                  i18nKey="share.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {trip.title}
                </ThemedText>
                <ThemedText style={[styles.shareCount, { color: theme.textSecondary }]}>
                  {t('share.shareCount', { count: shares.length, plural: shares.length !== 1 ? 's' : '' })}
                </ThemedText>
              </View>
            </View>
          </GlassCard>

          <View style={styles.createShareButtons}>
            <GradientButton
              title={t('share.createReadOnlyLink')}
              gradient="primary"
              size="lg"
              style={styles.createButton}
              onPress={handleCreateReadOnlyLink}
              disabled={isCreatingShare}
            />
            <GradientButton
              title={t('share.createCollaborativeLink')}
              gradient="secondary"
              size="lg"
              style={styles.createButton}
              onPress={handleCreateCollaborativeLink}
              disabled={isCreatingShare}
            />
          </View>

          <GlassCard style={styles.infoCard} blurIntensity={20}>
            <ThemedTextI18n 
              i18nKey="share.shareOptions" 
              style={[styles.infoTitle, { color: theme.text }]}
            />
            <View style={styles.infoItems}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoIcon}>📖</ThemedText>
                <View style={styles.infoContent}>
                  <ThemedTextI18n 
                    i18nKey="share.readOnlyLink" 
                    style={[styles.infoItemTitle, { color: theme.text }]}
                  />
                  <ThemedTextI18n 
                    i18nKey="share.readOnlyDescription" 
                    style={[styles.infoItemDescription, { color: theme.textSecondary }]}
                  />
                </View>
              </View>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoIcon}>👥</ThemedText>
                <View style={styles.infoContent}>
                  <ThemedTextI18n 
                    i18nKey="share.collaborativeLink" 
                    style={[styles.infoItemTitle, { color: theme.text }]}
                  />
                  <ThemedTextI18n 
                    i18nKey="share.collaborativeDescription" 
                    style={[styles.infoItemDescription, { color: theme.textSecondary }]}
                  />
                </View>
              </View>
            </View>
          </GlassCard>

          {shares.length > 0 ? (
            <View style={styles.sharesSection}>
              <ThemedTextI18n 
                i18nKey="share.existingShareLinks" 
                style={[styles.sectionTitle, { color: theme.text }]}
              />
              <FlatList
                data={shares}
                renderItem={renderShareItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.shareSeparator} />}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              {renderEmptyState()}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
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
    marginBottom: 4,
  },
  shareCount: {
    fontSize: 14,
    opacity: 0.7,
  },

  // Create Share Buttons
  createShareButtons: {
    gap: 12,
  },
  createButton: {
    marginBottom: 0,
  },

  // Info Card
  infoCard: {
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoItems: {
    gap: 16,
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
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoItemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Shares Section
  sharesSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  shareCard: {
    marginBottom: 0,
  },
  shareContent: {
    padding: 16,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shareInfo: {
    flex: 1,
    marginRight: 12,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shareDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  shareToken: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareActionButton: {
    flex: 1,
  },
  shareSeparator: {
    height: 12,
  },

  // Empty State
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
});