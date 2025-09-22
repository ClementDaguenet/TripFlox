import { getDb, TripCollaboratorRow, TripShareRow } from './db';

// Trip Sharing functions
export async function createTripShare(params: {
  tripId: number;
  shareType: 'readonly' | 'collaborative';
  permissions: string;
  expiresAt?: number | null;
  createdBy: number;
}): Promise<string> {
  const db = getDb();
  const createdAt = Date.now();
  const shareToken = generateShareToken();
  
  try {
    await db.runAsync(
      "INSERT INTO trip_shares (tripId, shareToken, shareType, permissions, expiresAt, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [params.tripId, shareToken, params.shareType, params.permissions, params.expiresAt ?? null, params.createdBy, createdAt]
    );
    
    return shareToken;
  } catch (error) {
    console.error('Error creating trip share:', error);
    throw new Error(`Failed to create share link: ${error.message || 'Database error'}`);
  }
}

export async function getTripShareByToken(shareToken: string): Promise<TripShareRow | null> {
  const db = getDb();
  const rows = await db.getAllAsync<TripShareRow>("SELECT * FROM trip_shares WHERE shareToken = ? LIMIT 1", [shareToken]);
  return rows[0] ?? null;
}

export async function getTripShares(tripId: number): Promise<TripShareRow[]> {
  const db = getDb();
  const rows = await db.getAllAsync<TripShareRow>("SELECT * FROM trip_shares WHERE tripId = ? ORDER BY createdAt DESC", [tripId]);
  return rows;
}

export async function deleteTripShare(shareId: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM trip_shares WHERE id = ?", [shareId]);
}

// Trip Collaboration functions
export async function addTripCollaborator(params: {
  tripId: number;
  userId: number;
  role: 'viewer' | 'editor' | 'admin';
  invitedBy: number;
}): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  const joinedAt = Date.now();
  
  const result = await db.runAsync(
    "INSERT INTO trip_collaborators (tripId, userId, role, invitedBy, joinedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [params.tripId, params.userId, params.role, params.invitedBy, joinedAt, createdAt]
  );
  
  return result.lastInsertRowId ?? 0;
}

export async function getTripCollaborators(tripId: number): Promise<TripCollaboratorRow[]> {
  const db = getDb();
  const rows = await db.getAllAsync<TripCollaboratorRow>("SELECT * FROM trip_collaborators WHERE tripId = ? ORDER BY createdAt DESC", [tripId]);
  return rows;
}

export async function updateTripCollaborator(collaboratorId: number, role: 'viewer' | 'editor' | 'admin'): Promise<void> {
  const db = getDb();
  await db.runAsync("UPDATE trip_collaborators SET role = ? WHERE id = ?", [role, collaboratorId]);
}

export async function removeTripCollaborator(collaboratorId: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM trip_collaborators WHERE id = ?", [collaboratorId]);
}

export async function isUserCollaborator(tripId: number, userId: number): Promise<boolean> {
  const db = getDb();
  const rows = await db.getAllAsync<TripCollaboratorRow>("SELECT * FROM trip_collaborators WHERE tripId = ? AND userId = ? LIMIT 1", [tripId, userId]);
  return rows.length > 0;
}

export async function getUserCollaborationRole(tripId: number, userId: number): Promise<'viewer' | 'editor' | 'admin' | null> {
  const db = getDb();
  const rows = await db.getAllAsync<TripCollaboratorRow>("SELECT * FROM trip_collaborators WHERE tripId = ? AND userId = ? LIMIT 1", [tripId, userId]);
  return rows[0]?.role ?? null;
}

// Debug function to check if sharing tables exist
export async function checkSharingTables(): Promise<boolean> {
  try {
    const db = getDb();
    await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='trip_shares'");
    await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='trip_collaborators'");
    return true;
  } catch (error) {
    console.error('Sharing tables check failed:', error);
    return false;
  }
}

// Utility function to generate share tokens
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
