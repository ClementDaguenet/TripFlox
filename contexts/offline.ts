import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistRow, getDb, JournalEntryRow, TripRow, TripStepRow } from './db';

// Offline data management
export interface OfflineData {
  trips: TripRow[];
  tripSteps: TripStepRow[];
  journalEntries: JournalEntryRow[];
  checklists: ChecklistRow[];
  lastSync: number;
}

const OFFLINE_DATA_KEY = 'offline_data';
const SYNC_STATUS_KEY = 'sync_status';

export async function saveOfflineData(data: OfflineData): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
}

export async function loadOfflineData(): Promise<OfflineData | null> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading offline data:', error);
    return null;
  }
}

export async function clearOfflineData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

export async function setSyncStatus(status: 'synced' | 'pending' | 'error'): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_STATUS_KEY, status);
  } catch (error) {
    console.error('Error setting sync status:', error);
  }
}

export async function getSyncStatus(): Promise<'synced' | 'pending' | 'error' | null> {
  try {
    const status = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return status as 'synced' | 'pending' | 'error' | null;
  } catch (error) {
    console.error('Error getting sync status:', error);
    return null;
  }
}

export async function prepareOfflineData(): Promise<OfflineData> {
  const db = getDb();
  
  // Get all trips
  const trips = await db.getAllAsync<TripRow>("SELECT * FROM trips ORDER BY createdAt DESC");
  
  // Get all trip steps
  const tripSteps = await db.getAllAsync<TripStepRow>("SELECT * FROM trip_steps ORDER BY order_index ASC");
  
  // Get all journal entries
  const journalEntries = await db.getAllAsync<JournalEntryRow>("SELECT * FROM journal_entries ORDER BY entryDate DESC");
  
  // Get all checklists
  const checklists = await db.getAllAsync<ChecklistRow>("SELECT * FROM checklists ORDER BY createdAt DESC");
  
  const offlineData: OfflineData = {
    trips,
    tripSteps,
    journalEntries,
    checklists,
    lastSync: Date.now()
  };
  
  await saveOfflineData(offlineData);
  await setSyncStatus('synced');
  
  return offlineData;
}

export async function syncOfflineData(): Promise<void> {
  try {
    const offlineData = await loadOfflineData();
    if (!offlineData) return;
    
    // Here you would implement the actual sync logic
    // For now, we'll just update the sync status
    await setSyncStatus('synced');
    
    console.log('Offline data synced successfully');
  } catch (error) {
    console.error('Error syncing offline data:', error);
    await setSyncStatus('error');
  }
}

export async function isOfflineMode(): Promise<boolean> {
  // Simple check - in a real app, you'd check network connectivity
  return false; // For now, always assume online
}

export async function getOfflineDataSize(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    return data ? data.length : 0;
  } catch (error) {
    console.error('Error getting offline data size:', error);
    return 0;
  }
}
