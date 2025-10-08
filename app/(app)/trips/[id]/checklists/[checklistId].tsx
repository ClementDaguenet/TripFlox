import { ThemedText } from '@/components/themed-text';
import { ThemedTextI18n } from '@/components/themed-text-i18n';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { ChecklistItemRow, ChecklistRow, deleteChecklist, deleteChecklistItem, getChecklistById, getChecklistItems, insertChecklistItem, updateChecklistItem } from '@/contexts/db';
import { scheduleChecklistReminder } from '@/contexts/notifications';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ChecklistDetailScreen() {
  const { t } = useTranslation();
  const { id, checklistId } = useLocalSearchParams<{ id: string; checklistId: string }>();
  const [checklist, setChecklist] = useState<ChecklistRow | null>(null);
  const [items, setItems] = useState<ChecklistItemRow[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const text = theme.text;
  const border = theme.icon;
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    if (!checklistId) return;
    
    try {
      const [checklistData, itemsData] = await Promise.all([
        getChecklistById(Number(checklistId)),
        getChecklistItems(Number(checklistId))
      ]);
      
      setChecklist(checklistData);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading checklist data:', error);
    }
  }, [checklistId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggleItem = async (itemId: number, isCompleted: boolean) => {
    try {
      await updateChecklistItem(itemId, { isCompleted: !isCompleted });
      loadData();
    } catch (error) {
      Alert.alert(t('common.error'), t('checklist.failedToUpdateItem'));
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    
    try {
      await insertChecklistItem({
        checklistId: Number(checklistId),
        text: newItemText.trim(),
        priority: 'medium',
      });
      
      setNewItemText('');
      setIsAddingItem(false);
      loadData();
    } catch (error) {
      Alert.alert(t('common.error'), t('checklist.failedToAddItem'));
    }
  };

  const scheduleReminder = async (itemId: number, reminderDate: number) => {
    try {
      const item = items.find(item => item.id === itemId);
      const itemText = item?.text || 'Checklist item';

      const notificationId = await scheduleChecklistReminder(
        itemId,
        Number(checklistId),
        itemText,
        reminderDate
      );

      if (notificationId) {
        await updateChecklistItem(itemId, { reminderDate });
        loadData();
        Alert.alert(t('common.success'), t('checklist.reminderScheduled'));
      } else {
        Alert.alert(t('common.error'), t('checklist.failedToScheduleReminder'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('checklist.failedToScheduleReminder'));
    }
  };

  const showReminderPicker = (itemId: number) => {
    Alert.alert(
      t('checklist.setReminder'),
      t('checklist.reminderPrompt'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('checklist.oneHour'), 
          onPress: () => scheduleReminder(itemId, Date.now() + 60 * 60 * 1000)
        },
        { 
          text: t('checklist.oneDay'), 
          onPress: () => scheduleReminder(itemId, Date.now() + 24 * 60 * 60 * 1000)
        },
        { 
          text: t('checklist.oneWeek'), 
          onPress: () => scheduleReminder(itemId, Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
      ]
    );
  };

  const handleDeleteItem = (itemId: number, itemText: string) => {
    Alert.alert(
      t('checklist.deleteItem'),
      t('checklist.deleteItemConfirm', { item: itemText }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteChecklistItem(itemId);
              loadData();
            } catch (error) {
              Alert.alert(t('common.error'), t('checklist.failedToDeleteItem'));
            }
          }
        }
      ]
    );
  };

  const handleDeleteChecklist = () => {
    Alert.alert(
      t('checklist.deleteChecklist'),
      t('checklist.deleteChecklistConfirm', { name: checklist?.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteChecklist(Number(checklistId));
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), t('checklist.failedToDeleteChecklist'));
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff8c00';
      case 'low': return '#4CAF50';
      default: return theme.icon;
    }
  };

  const getCompletionStats = () => {
    const completed = items.filter(item => item.isCompleted).length;
    const total = items.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const renderItem = ({ item }: { item: ChecklistItemRow }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={() => handleToggleItem(item.id, item.isCompleted)}
      >
        <View style={[styles.checkbox, { borderColor: item.isCompleted ? theme.tint : border }]}>
          {item.isCompleted ? (
            <ThemedText style={[styles.checkmark, { color: theme.tint }]}>✓</ThemedText>
          ) : null}
        </View>
        
        <View style={styles.itemInfo}>
          <ThemedText style={[
            styles.itemText, 
            { 
              color: text,
              textDecorationLine: item.isCompleted ? 'line-through' : 'none',
              opacity: item.isCompleted ? 0.6 : 1
            }
          ]}>
            {item.text}
          </ThemedText>
          
          <View style={styles.itemMeta}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
            <ThemedText style={[styles.priorityText, { color: text }]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </ThemedText>
            {item.dueDate ? (
              <ThemedText style={[styles.dueDate, { color: text }]}>
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </ThemedText>
            ) : null}
            {item.reminderDate ? (
              <ThemedText style={[styles.reminderDate, { color: theme.tint }]}>
                🔔 {new Date(item.reminderDate).toLocaleDateString()}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.reminderButton}
          onPress={() => showReminderPicker(item.id)}
        >
          <ThemedText style={styles.reminderIcon}>🔔</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteItemButton}
          onPress={() => handleDeleteItem(item.id, item.text)}
        >
          <ThemedText style={styles.deleteItemIcon}>×</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!checklist) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{t('common.loading')}</ThemedText>
      </ThemedView>
    );
  }

  const stats = getCompletionStats();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedTextI18n i18nKey="navigation.back" type="link" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={[styles.title, { color: text }]}>
              {checklist.name}
            </ThemedText>
            {checklist.description ? (
              <ThemedText style={[styles.description, { color: text }]}>
                {checklist.description}
              </ThemedText>
            ) : null}
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteChecklist}>
            <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedTextI18n 
              i18nKey="checklist.progress" 
              i18nOptions={{ completed: stats.completed, total: stats.total, percentage: stats.percentage }}
              style={[styles.progressText, { color: text }]}
            />
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.icon }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: theme.tint,
                  width: `${stats.percentage}%`
                }
              ]} 
            />
          </View>
        </View>
        
        {isAddingItem ? (
          <View style={[styles.addItemContainer, { backgroundColor: theme.background, borderColor: theme.icon }]}>
            <TextInput
              style={[styles.addItemInput, { borderColor: border, color: text }]}
              placeholder={t('placeholders.addNewItem')}
              placeholderTextColor={border}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
              autoFocus
            />
            <View style={styles.addItemActions}>
              <TouchableOpacity 
                style={[styles.addItemButton, { backgroundColor: theme.tint }]}
                onPress={handleAddItem}
              >
                <ThemedText style={[styles.addItemButtonText, { color: theme.text }]}>{t('common.add')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: theme.icon }]}
                onPress={() => {
                  setIsAddingItem(false);
                  setNewItemText('');
                }}
              >
                <ThemedText style={[styles.cancelButtonText, { color: text }]}>{t('common.cancel')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addItemTrigger, { backgroundColor: theme.tint }]}
            onPress={() => setIsAddingItem(true)}
          >
            <ThemedTextI18n 
              i18nKey="checklist.addNewItem" 
              style={[styles.addItemTriggerText, { color: theme.text }]}
            />
          </TouchableOpacity>
        )}
        
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>✅</ThemedText>
            <ThemedTextI18n 
              i18nKey="checklist.noItemsYet" 
              type="subtitle" 
              style={[styles.emptyTitle, { color: text }]}
            />
            <ThemedTextI18n 
              i18nKey="checklist.noItemsMessage" 
              style={[styles.emptyText, { color: text }]}
            />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            scrollEnabled={false}
            contentContainerStyle={styles.itemsList}
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
  backButton: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  addItemTrigger: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addItemTriggerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addItemContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  addItemInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  addItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addItemButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsList: {
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    opacity: 0.7,
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  reminderDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  reminderButton: {
    padding: 8,
    marginRight: 4,
  },
  reminderIcon: {
    fontSize: 16,
  },
  deleteItemButton: {
    padding: 8,
  },
  deleteItemIcon: {
    fontSize: 20,
    color: '#ff4444',
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
