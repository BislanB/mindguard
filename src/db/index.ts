import { openDB, type IDBPDatabase } from 'idb';
import type {
  ReportTemplate,
  ReportEntry,
  FocusSession,
  BlockRule,
  UnlockAttempt,
  UserSettings,
} from '../types/index.js';

const DB_NAME = 'mindguard-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('focusSessions')) {
          db.createObjectStore('focusSessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('blockRules')) {
          db.createObjectStore('blockRules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('unlockAttempts')) {
          db.createObjectStore('unlockAttempts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export function getDefaultSettings(): UserSettings {
  return {
    theme: 'system',
    defaultTemplateId: '',
    blockerSettings: {
      enabled: true,
      pin: '',
      strictLevel: 2,
      delayMinutes: 15,
      emergencyAccessDays: 7,
      lastEmergencyAccess: null,
      allowlist: [],
    },
  };
}

// ── Templates ──

export async function getAllTemplates(): Promise<ReportTemplate[]> {
  const db = await getDB();
  return db.getAll('templates');
}

export async function saveTemplate(t: ReportTemplate): Promise<void> {
  const db = await getDB();
  await db.put('templates', t);
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

// ── Reports ──

export async function getAllReports(): Promise<ReportEntry[]> {
  const db = await getDB();
  return db.getAll('reports');
}

export async function saveReport(r: ReportEntry): Promise<void> {
  const db = await getDB();
  await db.put('reports', r);
}

export async function deleteReport(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('reports', id);
}

// ── Focus Sessions ──

export async function saveFocusSession(s: FocusSession): Promise<void> {
  const db = await getDB();
  await db.put('focusSessions', s);
}

export async function getAllFocusSessions(): Promise<FocusSession[]> {
  const db = await getDB();
  return db.getAll('focusSessions');
}

// ── Block Rules ──

export async function getAllBlockRules(): Promise<BlockRule[]> {
  const db = await getDB();
  return db.getAll('blockRules');
}

export async function saveBlockRule(r: BlockRule): Promise<void> {
  const db = await getDB();
  await db.put('blockRules', r);
}

export async function deleteBlockRule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('blockRules', id);
}

// ── Unlock Attempts ──

export async function getAllUnlockAttempts(): Promise<UnlockAttempt[]> {
  const db = await getDB();
  return db.getAll('unlockAttempts');
}

export async function saveUnlockAttempt(a: UnlockAttempt): Promise<void> {
  const db = await getDB();
  await db.put('unlockAttempts', a);
}

// ── Settings ──

export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  const s = await db.get('settings', 'main');
  return s ?? getDefaultSettings();
}

export async function saveSettings(s: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', s, 'main');
}
