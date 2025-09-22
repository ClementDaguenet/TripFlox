import * as SQLite from "expo-sqlite";

export type UserRow = {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  birthDate?: number;
  avatar?: string;
  country?: string;
  createdAt: number;
};

export type TripRow = {
  id: number;
  title: string;
  startDate: number | null;
  endDate: number | null;
  coverUri: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: number;
};

export type TripStepRow = {
  id: number;
  tripId: number;
  name: string;
  description: string | null;
  startDate: number | null;
  endDate: number | null;
  lat: number | null;
  lng: number | null;
  order_index: number;
  createdAt: number;
};

export type JournalEntryRow = {
  id: number;
  tripId: number;
  stepId: number | null;
  title: string;
  content: string | null;
  entryDate: number;
  createdAt: number;
};

export type JournalMediaRow = {
  id: number;
  journalEntryId: number;
  type: 'photo' | 'audio';
  uri: string;
  caption: string | null;
  createdAt: number;
};

export type ChecklistRow = {
  id: number;
  tripId: number | null;
  name: string;
  description: string | null;
  isTemplate: boolean;
  createdAt: number;
};

export type ChecklistItemRow = {
  id: number;
  checklistId: number;
  text: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: number | null;
  reminderDate: number | null;
  order_index: number;
  createdAt: number;
};

export type TripShareRow = {
  id: number;
  tripId: number;
  shareToken: string;
  shareType: 'readonly' | 'collaborative';
  permissions: string; // JSON string of permissions
  expiresAt: number | null;
  createdBy: number; // user ID
  createdAt: number;
};

export type TripCollaboratorRow = {
  id: number;
  tripId: number;
  userId: number;
  role: 'viewer' | 'editor' | 'admin';
  invitedBy: number;
  joinedAt: number;
  createdAt: number;
};

let database: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!database) {
    database = SQLite.openDatabaseSync("app.db");
  }
  return database;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  
  // Force recreation of sharing tables if they don't exist
  try {
    await db.execAsync(`DROP TABLE IF EXISTS trip_shares;`);
    await db.execAsync(`DROP TABLE IF EXISTS trip_collaborators;`);
  } catch (e) {
    // Tables might not exist, ignore error
  }
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      mobile TEXT,
      birthDate INTEGER,
      avatar TEXT,
      country TEXT,
      createdAt INTEGER NOT NULL
    );`
  );
  
  // Add new columns to existing users table if they don't exist
  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN firstName TEXT;`);
  } catch (e) {
    // Column already exists, ignore error
  }
  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN lastName TEXT;`);
  } catch (e) {
    // Column already exists, ignore error
  }
  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN mobile TEXT;`);
  } catch (e) {
    // Column already exists, ignore error
  }
  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN birthDate INTEGER;`);
  } catch (e) {
    // Column already exists, ignore error
  }
  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN avatar TEXT;`);
  } catch (e) {
    // Column already exists, ignore error
  }
  try {
    await db.execAsync(`ALTER TABLE users ADD COLUMN country TEXT;`);
  } catch (e) {
    // Column already exists, ignore error
  }
  
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      startDate INTEGER,
      endDate INTEGER,
      coverUri TEXT,
      lat REAL,
      lng REAL,
      createdAt INTEGER NOT NULL
    );`
  );
  
      // Add new columns to existing trips table if they don't exist
      try {
        await db.execAsync(`ALTER TABLE trips ADD COLUMN lat REAL;`);
      } catch (e) {
        // Column already exists, ignore error
      }
      try {
        await db.execAsync(`ALTER TABLE trips ADD COLUMN lng REAL;`);
      } catch (e) {
        // Column already exists, ignore error
      }
      
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS trip_steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tripId INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          startDate INTEGER,
          endDate INTEGER,
          lat REAL,
          lng REAL,
          order_index INTEGER NOT NULL,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (tripId) REFERENCES trips (id) ON DELETE CASCADE
        );`
      );
      
      // Journal entries table
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tripId INTEGER NOT NULL,
          stepId INTEGER,
          title TEXT NOT NULL,
          content TEXT,
          entryDate INTEGER NOT NULL,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (tripId) REFERENCES trips (id) ON DELETE CASCADE,
          FOREIGN KEY (stepId) REFERENCES trip_steps (id) ON DELETE SET NULL
        );`
      );
      
      // Journal media table
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS journal_media (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journalEntryId INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('photo', 'audio')),
          uri TEXT NOT NULL,
          caption TEXT,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (journalEntryId) REFERENCES journal_entries (id) ON DELETE CASCADE
        );`
      );
      
      // Checklists table
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS checklists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tripId INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          isTemplate INTEGER NOT NULL DEFAULT 0,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (tripId) REFERENCES trips (id) ON DELETE CASCADE
        );`
      );
      
        // Checklist items table
        await db.execAsync(
          `CREATE TABLE IF NOT EXISTS checklist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            checklistId INTEGER NOT NULL,
            text TEXT NOT NULL,
            isCompleted INTEGER NOT NULL DEFAULT 0,
            priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            dueDate INTEGER,
            reminderDate INTEGER,
            order_index INTEGER NOT NULL,
            createdAt INTEGER NOT NULL,
            FOREIGN KEY (checklistId) REFERENCES checklists (id) ON DELETE CASCADE
          );`
        );

        // Trip shares table
        await db.execAsync(
          `CREATE TABLE IF NOT EXISTS trip_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tripId INTEGER NOT NULL,
            shareToken TEXT UNIQUE NOT NULL,
            shareType TEXT NOT NULL CHECK (shareType IN ('readonly', 'collaborative')),
            permissions TEXT NOT NULL,
            expiresAt INTEGER,
            createdBy INTEGER NOT NULL,
            createdAt INTEGER NOT NULL,
            FOREIGN KEY (tripId) REFERENCES trips (id) ON DELETE CASCADE,
            FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE CASCADE
          );`
        );

        // Trip collaborators table
        await db.execAsync(
          `CREATE TABLE IF NOT EXISTS trip_collaborators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tripId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
            invitedBy INTEGER NOT NULL,
            joinedAt INTEGER,
            createdAt INTEGER NOT NULL,
            FOREIGN KEY (tripId) REFERENCES trips (id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (invitedBy) REFERENCES users (id) ON DELETE CASCADE
          );`
        );
}

export async function insertUser(params: { username: string; email: string; password: string; }): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  const result = await db.runAsync(
    "INSERT INTO users (username, email, password, createdAt) VALUES (?, ?, ?, ?)",
    [params.username, params.email, params.password, createdAt]
  );
  return result.lastInsertRowId ?? 0;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = getDb();
  const rows = await db.getAllAsync<UserRow>("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] ?? null;
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM users WHERE email = ?", [email]);
}

export async function insertTrip(params: { title: string; startDate?: number | null; endDate?: number | null; coverUri?: string | null; }): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  const result = await db.runAsync(
    "INSERT INTO trips (title, startDate, endDate, coverUri, lat, lng, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [params.title, params.startDate ?? null, params.endDate ?? null, params.coverUri ?? null, null, null, createdAt]
  );
  return result.lastInsertRowId ?? 0;
}

export async function getAllTrips(): Promise<TripRow[]> {
  const db = getDb();
  const rows = await db.getAllAsync<TripRow>("SELECT * FROM trips ORDER BY createdAt DESC");
  return rows;
}

export async function deleteTripById(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM trips WHERE id = ?", [id]);
}

export async function getTripById(id: number): Promise<TripRow | null> {
  const db = getDb();
  const rows = await db.getAllAsync<TripRow>("SELECT * FROM trips WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function updateTripLocation(id: number, lat: number, lng: number): Promise<void> {
  const db = getDb();
  await db.runAsync("UPDATE trips SET lat = ?, lng = ? WHERE id = ?", [lat, lng, id]);
}

export async function updateUserProfile(email: string, profileData: {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  birthDate?: number;
  avatar?: string;
  country?: string;
}): Promise<void> {
  const db = getDb();
  const fields = [];
  const values = [];
  
  if (profileData.firstName !== undefined) {
    fields.push("firstName = ?");
    values.push(profileData.firstName);
  }
  if (profileData.lastName !== undefined) {
    fields.push("lastName = ?");
    values.push(profileData.lastName);
  }
  if (profileData.mobile !== undefined) {
    fields.push("mobile = ?");
    values.push(profileData.mobile);
  }
  if (profileData.birthDate !== undefined) {
    fields.push("birthDate = ?");
    values.push(profileData.birthDate);
  }
  if (profileData.avatar !== undefined) {
    fields.push("avatar = ?");
    values.push(profileData.avatar);
  }
  if (profileData.country !== undefined) {
    fields.push("country = ?");
    values.push(profileData.country);
  }
  
  if (fields.length > 0) {
    values.push(email);
    await db.runAsync(`UPDATE users SET ${fields.join(", ")} WHERE email = ?`, values);
  }
}

export async function getUserProfile(email: string): Promise<UserRow | null> {
  const db = getDb();
  const rows = await db.getAllAsync<UserRow>("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] ?? null;
}

// Trip Steps functions
export async function insertTripStep(params: {
  tripId: number;
  name: string;
  description?: string | null;
  startDate?: number | null;
  endDate?: number | null;
  lat?: number | null;
  lng?: number | null;
  order: number;
}): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  const result = await db.runAsync(
    "INSERT INTO trip_steps (tripId, name, description, startDate, endDate, lat, lng, order_index, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [params.tripId, params.name, params.description ?? null, params.startDate ?? null, params.endDate ?? null, params.lat ?? null, params.lng ?? null, params.order, createdAt]
  );
  return result.lastInsertRowId ?? 0;
}

export async function getTripSteps(tripId: number): Promise<TripStepRow[]> {
  const db = getDb();
  const rows = await db.getAllAsync<TripStepRow>("SELECT * FROM trip_steps WHERE tripId = ? ORDER BY order_index ASC", [tripId]);
  return rows;
}

export async function getTripStepById(stepId: number): Promise<TripStepRow | null> {
  const db = getDb();
  const rows = await db.getAllAsync<TripStepRow>("SELECT * FROM trip_steps WHERE id = ? LIMIT 1", [stepId]);
  return rows[0] ?? null;
}

export async function updateTripStep(stepId: number, params: {
  name?: string;
  description?: string | null;
  startDate?: number | null;
  endDate?: number | null;
  lat?: number | null;
  lng?: number | null;
  order?: number;
}): Promise<void> {
  const db = getDb();
  const fields = [];
  const values = [];
  
  if (params.name !== undefined) {
    fields.push("name = ?");
    values.push(params.name);
  }
  if (params.description !== undefined) {
    fields.push("description = ?");
    values.push(params.description);
  }
  if (params.startDate !== undefined) {
    fields.push("startDate = ?");
    values.push(params.startDate);
  }
  if (params.endDate !== undefined) {
    fields.push("endDate = ?");
    values.push(params.endDate);
  }
  if (params.lat !== undefined) {
    fields.push("lat = ?");
    values.push(params.lat);
  }
  if (params.lng !== undefined) {
    fields.push("lng = ?");
    values.push(params.lng);
  }
  if (params.order !== undefined) {
    fields.push("order_index = ?");
    values.push(params.order);
  }
  
  if (fields.length > 0) {
    values.push(stepId);
    await db.runAsync(`UPDATE trip_steps SET ${fields.join(", ")} WHERE id = ?`, values);
  }
}

export async function deleteTripStep(stepId: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM trip_steps WHERE id = ?", [stepId]);
}

export async function reorderTripSteps(tripId: number, stepIds: number[]): Promise<void> {
  const db = getDb();
  
  // Mettre à jour l'ordre de chaque étape
  for (let i = 0; i < stepIds.length; i++) {
    await db.runAsync(
      "UPDATE trip_steps SET order_index = ? WHERE id = ? AND tripId = ?",
      [i + 1, stepIds[i], tripId]
    );
  }
}

// Journal functions
export async function insertJournalEntry(params: {
  tripId: number;
  stepId?: number | null;
  title: string;
  content?: string | null;
  entryDate: number;
}): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  const result = await db.runAsync(
    "INSERT INTO journal_entries (tripId, stepId, title, content, entryDate, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [params.tripId, params.stepId ?? null, params.title, params.content ?? null, params.entryDate, createdAt]
  );
  return result.lastInsertRowId ?? 0;
}

export async function getJournalEntries(tripId: number, stepId?: number | null): Promise<JournalEntryRow[]> {
  const db = getDb();
  let query = "SELECT * FROM journal_entries WHERE tripId = ?";
  let params: any[] = [tripId];
  
  if (stepId !== undefined) {
    query += " AND stepId = ?";
    params.push(stepId);
  }
  
  query += " ORDER BY entryDate DESC, createdAt DESC";
  
  const rows = await db.getAllAsync<JournalEntryRow>(query, params);
  return rows;
}

export async function getJournalEntryById(entryId: number): Promise<JournalEntryRow | null> {
  const db = getDb();
  const rows = await db.getAllAsync<JournalEntryRow>("SELECT * FROM journal_entries WHERE id = ? LIMIT 1", [entryId]);
  return rows[0] ?? null;
}

export async function updateJournalEntry(entryId: number, params: {
  title?: string;
  content?: string | null;
  entryDate?: number;
}): Promise<void> {
  const db = getDb();
  const fields = [];
  const values = [];
  
  if (params.title !== undefined) {
    fields.push("title = ?");
    values.push(params.title);
  }
  if (params.content !== undefined) {
    fields.push("content = ?");
    values.push(params.content);
  }
  if (params.entryDate !== undefined) {
    fields.push("entryDate = ?");
    values.push(params.entryDate);
  }
  
  if (fields.length > 0) {
    values.push(entryId);
    await db.runAsync(`UPDATE journal_entries SET ${fields.join(", ")} WHERE id = ?`, values);
  }
}

export async function deleteJournalEntry(entryId: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM journal_entries WHERE id = ?", [entryId]);
}

// Journal media functions
export async function insertJournalMedia(params: {
  journalEntryId: number;
  type: 'photo' | 'audio';
  uri: string;
  caption?: string | null;
}): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  const result = await db.runAsync(
    "INSERT INTO journal_media (journalEntryId, type, uri, caption, createdAt) VALUES (?, ?, ?, ?, ?)",
    [params.journalEntryId, params.type, params.uri, params.caption ?? null, createdAt]
  );
  return result.lastInsertRowId ?? 0;
}

export async function getJournalMedia(journalEntryId: number): Promise<JournalMediaRow[]> {
  const db = getDb();
  const rows = await db.getAllAsync<JournalMediaRow>(
    "SELECT * FROM journal_media WHERE journalEntryId = ? ORDER BY createdAt ASC",
    [journalEntryId]
  );
  return rows;
}

export async function deleteJournalMedia(mediaId: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM journal_media WHERE id = ?", [mediaId]);
}

// Checklist functions
export async function insertChecklist(params: {
  tripId?: number | null;
  name: string;
  description?: string | null;
  isTemplate?: boolean;
}): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  const result = await db.runAsync(
    "INSERT INTO checklists (tripId, name, description, isTemplate, createdAt) VALUES (?, ?, ?, ?, ?)",
    [params.tripId ?? null, params.name, params.description ?? null, (params.isTemplate ?? false) ? 1 : 0, createdAt]
  );
  return result.lastInsertRowId ?? 0;
}

export async function getChecklists(tripId?: number | null): Promise<ChecklistRow[]> {
  const db = getDb();
  let query = "SELECT * FROM checklists";
  let params: any[] = [];
  
  if (tripId !== undefined) {
    query += " WHERE tripId = ?";
    params.push(tripId);
  }
  
  query += " ORDER BY createdAt DESC";
  
  const rows = await db.getAllAsync<ChecklistRow>(query, params);
  return rows;
}

export async function getChecklistById(checklistId: number): Promise<ChecklistRow | null> {
  const db = getDb();
  const rows = await db.getAllAsync<ChecklistRow>("SELECT * FROM checklists WHERE id = ? LIMIT 1", [checklistId]);
  return rows[0] ?? null;
}

export async function updateChecklist(checklistId: number, params: {
  name?: string;
  description?: string | null;
}): Promise<void> {
  const db = getDb();
  const fields = [];
  const values = [];
  
  if (params.name !== undefined) {
    fields.push("name = ?");
    values.push(params.name);
  }
  if (params.description !== undefined) {
    fields.push("description = ?");
    values.push(params.description);
  }
  
  if (fields.length > 0) {
    values.push(checklistId);
    await db.runAsync(`UPDATE checklists SET ${fields.join(", ")} WHERE id = ?`, values);
  }
}

export async function deleteChecklist(checklistId: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM checklists WHERE id = ?", [checklistId]);
}

// Checklist items functions
export async function insertChecklistItem(params: {
  checklistId: number;
  text: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: number | null;
  reminderDate?: number | null;
}): Promise<number> {
  const db = getDb();
  const createdAt = Date.now();
  
  // Get the next order index
  const existingItems = await db.getAllAsync<ChecklistItemRow>(
    "SELECT order_index FROM checklist_items WHERE checklistId = ? ORDER BY order_index DESC LIMIT 1",
    [params.checklistId]
  );
  const nextOrder = existingItems.length > 0 ? existingItems[0].order_index + 1 : 1;
  
  const result = await db.runAsync(
    "INSERT INTO checklist_items (checklistId, text, isCompleted, priority, dueDate, reminderDate, order_index, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      params.checklistId,
      params.text,
      0, // isCompleted
      params.priority || 'medium',
      params.dueDate ?? null,
      params.reminderDate ?? null,
      nextOrder,
      createdAt
    ]
  );
  return result.lastInsertRowId ?? 0;
}

export async function getChecklistItems(checklistId: number): Promise<ChecklistItemRow[]> {
  const db = getDb();
  const rows = await db.getAllAsync<ChecklistItemRow>(
    "SELECT * FROM checklist_items WHERE checklistId = ? ORDER BY order_index ASC",
    [checklistId]
  );
  return rows;
}

export async function updateChecklistItem(itemId: number, params: {
  text?: string;
  isCompleted?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: number | null;
  reminderDate?: number | null;
}): Promise<void> {
  const db = getDb();
  const fields = [];
  const values = [];
  
  if (params.text !== undefined) {
    fields.push("text = ?");
    values.push(params.text);
  }
  if (params.isCompleted !== undefined) {
    fields.push("isCompleted = ?");
    values.push(params.isCompleted ? 1 : 0);
  }
  if (params.priority !== undefined) {
    fields.push("priority = ?");
    values.push(params.priority);
  }
  if (params.dueDate !== undefined) {
    fields.push("dueDate = ?");
    values.push(params.dueDate);
  }
  if (params.reminderDate !== undefined) {
    fields.push("reminderDate = ?");
    values.push(params.reminderDate);
  }
  
  if (fields.length > 0) {
    values.push(itemId);
    await db.runAsync(`UPDATE checklist_items SET ${fields.join(", ")} WHERE id = ?`, values);
  }
}

export async function deleteChecklistItem(itemId: number): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM checklist_items WHERE id = ?", [itemId]);
}

export async function reorderChecklistItems(checklistId: number, itemIds: number[]): Promise<void> {
  const db = getDb();
  
  // Mettre à jour l'ordre de chaque élément
  for (let i = 0; i < itemIds.length; i++) {
    await db.runAsync(
      "UPDATE checklist_items SET order_index = ? WHERE id = ? AND checklistId = ?",
      [i + 1, itemIds[i], checklistId]
    );
  }
}


