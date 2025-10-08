import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { AnimatedWaves } from '@/components/ui/animated-waves';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { insertChecklist } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewChecklistScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = theme.icon;
  const text = theme.text;
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    
    try {
      if (!name.trim()) {
        setError(t('newChecklist.nameRequired'));
        return;
      }
      
      if (!id) {
        setError(t('newChecklist.tripIdMissing'));
        return;
      }

      const checklistId = await insertChecklist({
        tripId: isTemplate ? null : Number(id),
        name: name.trim(),
        description: description.trim() || null,
        isTemplate,
      });

      Alert.alert(t('newChecklist.success'), t('newChecklist.checklistCreated'), [
        { 
          text: t('common.ok'), 
          onPress: () => {
            if (isTemplate) {
              router.back();
            } else {
              router.push(`/(app)/trips/${id}/checklists/${checklistId}`);
            }
          }
        }
      ]);
    } catch (err) {
      setError(t('newChecklist.failedToCreate'));
      Alert.alert(t('newChecklist.error'), t('newChecklist.failedToCreate'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GradientBackground gradient="primary" style={styles.container}>
      <AnimatedWaves intensity="medium" style={{ paddingTop: insets.top }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <GlassCard style={styles.headerCard} blurIntensity={30}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => router.back()}
              >
                <ThemedTextI18n 
                  i18nKey="navigation.back" 
                  style={[styles.backButtonText, { color: theme.text }]}
                />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <ThemedTextI18n 
                  i18nKey="newChecklist.title" 
                  type="title" 
                  style={[styles.title, { color: theme.text }]}
                />
                <ThemedTextI18n 
                  i18nKey="newChecklist.subtitle" 
                  style={[styles.subtitle, { color: theme.textSecondary }]}
                />
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </GlassCard>

          {/* Checklist Form */}
          <GlassCard style={styles.formCard} blurIntensity={25}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="newChecklist.checklistName" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.input, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('placeholders.checklistName')}
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedTextI18n 
                  i18nKey="newChecklist.description" 
                  style={[styles.inputLabel, { color: theme.text }]}
                />
                <TextInput
                  style={[styles.textArea, { 
                    borderColor: border, 
                    color: text,
                    backgroundColor: theme.backgroundSecondary 
                  }]}
                  placeholder={t('placeholders.checklistDescription')}
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Template Toggle */}
              <View style={styles.templateSection}>
                <TouchableOpacity 
                  style={[styles.templateToggle, { 
                    backgroundColor: isTemplate ? theme.tint : theme.background, 
                    borderColor: theme.tint 
                  }]}
                  onPress={() => setIsTemplate(!isTemplate)}
                >
                  <View style={[styles.checkbox, { 
                    backgroundColor: isTemplate ? 'white' : 'transparent', 
                    borderColor: isTemplate ? 'white' : theme.tint 
                  }]}>
                    {isTemplate ? <ThemedText style={[styles.checkmark, { color: theme.text }]}>✓</ThemedText> : null}
                  </View>
                  <View style={styles.templateInfo}>
                    <ThemedTextI18n 
                      i18nKey="newChecklist.isTemplate" 
                      style={[styles.templateTitle, { color: theme.text }]}
                    />
                    <ThemedTextI18n 
                      i18nKey="newChecklist.templateDescription" 
                      style={[styles.templateDescription, { color: theme.textSecondary }]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    {error}
                  </ThemedText>
                </View>
              )}
            </View>
          </GlassCard>

          {/* Save Button */}
          <GradientButton
            title={isSaving ? t('newChecklist.creatingChecklist') : t('newChecklist.createChecklist')}
            gradient="primary"
            size="xl"
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 60, // Same width as back button to center the content
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

  // Form
  formCard: {
    marginBottom: 8,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  templateSection: {
    marginTop: 8,
  },
  templateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },

  // Save Button
  saveButton: {
    marginTop: 8,
  },
});