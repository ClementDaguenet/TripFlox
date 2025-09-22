import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { insertChecklist } from '@/contexts/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const border = useThemeColor({}, 'icon');
  const text = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    setError(null);
    
    if (!name.trim()) {
      setError('Checklist name is required');
      return;
    }
    
    if (!id) {
      setError('Trip ID is missing');
      return;
    }

    try {
      const checklistId = await insertChecklist({
        tripId: isTemplate ? null : Number(id),
        name: name.trim(),
        description: description.trim() || null,
        isTemplate,
      });

      Alert.alert('Success', 'Checklist created successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            if (isTemplate) {
              router.back();
            } else {
              router.push({ pathname: '/(app)/trips/[id]/checklists/[checklistId]', params: { id: String(id), checklistId: String(checklistId) } });
            }
          }
        }
      ]);
    } catch (error) {
      setError('Failed to save checklist');
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="link">← Back</ThemedText>
        </TouchableOpacity>
        
        <ThemedText type="title" style={styles.title}>New Checklist</ThemedText>
        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
        
        {/* Name Input */}
        <TextInput
          style={[styles.input, { borderColor: border, color: text }]}
          placeholder="Checklist name (e.g., Suitcase, Documents, etc.)"
          placeholderTextColor={border}
          value={name}
          onChangeText={setName}
        />
        
        {/* Description Input */}
        <TextInput
          style={[styles.textArea, { borderColor: border, color: text }]}
          placeholder="Description (optional)"
          placeholderTextColor={border}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        
        {/* Template Toggle */}
        <View style={styles.templateSection}>
          <TouchableOpacity 
            style={[styles.templateToggle, { backgroundColor: isTemplate ? theme.tint : theme.background, borderColor: theme.tint }]}
            onPress={() => setIsTemplate(!isTemplate)}
          >
            <View style={[styles.checkbox, { backgroundColor: isTemplate ? 'white' : 'transparent', borderColor: isTemplate ? 'white' : theme.tint }]}>
              {isTemplate && <ThemedText style={styles.checkmark}>✓</ThemedText>}
            </View>
            <View style={styles.templateInfo}>
              <ThemedText style={[styles.templateTitle, { color: isTemplate ? 'white' : text }]}>
                Save as Template
              </ThemedText>
              <ThemedText style={[styles.templateDescription, { color: isTemplate ? 'white' : text }]}>
                Templates can be reused for future trips
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Quick Templates */}
        <View style={styles.templatesSection}>
          <ThemedText style={[styles.sectionTitle, { color: text }]}>Quick Templates</ThemedText>
          <View style={styles.templateGrid}>
            {[
              { name: 'Suitcase', icon: '🧳', description: 'Clothes and personal items' },
              { name: 'Documents', icon: '📄', description: 'Passport, tickets, insurance' },
              { name: 'Electronics', icon: '📱', description: 'Phone, charger, camera' },
              { name: 'Health', icon: '💊', description: 'Medications, first aid' },
              { name: 'Activities', icon: '🎯', description: 'Tours, reservations' },
              { name: 'Emergency', icon: '🚨', description: 'Emergency contacts, backup' },
            ].map((template, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.templateCard, { backgroundColor: theme.background, borderColor: theme.icon }]}
                onPress={() => {
                  setName(template.name);
                  setDescription(template.description);
                }}
              >
                <ThemedText style={styles.templateIcon}>{template.icon}</ThemedText>
                <ThemedText style={[styles.templateCardName, { color: text }]}>{template.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={{ height: 16 }} />
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.tint }]} onPress={handleSave}>
          <ThemedText style={styles.saveButtonText}>Create Checklist</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  backButton: { marginBottom: 12 },
  title: { textAlign: 'center', marginBottom: 12 },
  input: { 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
  templateSection: {
    marginBottom: 24,
  },
  templateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  templatesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateCardName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
