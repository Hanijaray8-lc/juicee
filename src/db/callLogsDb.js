import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { generateUniqueNumericId } from '../utils/uniqueIdGenerator.js';

const DB_NAME = 'juicy_call_logs.db';

let sqliteConnection = null;
let dbConnection = null;
let initPromise = null;

/**
 * Initialize SQLite call logs database and create table if not exists.
 * Idempotent, safe to call multiple times, fails silently/gracefully on error.
 */
export const initCallLogsDb = async () => {
  // If already open and connected, return existing db connection
  if (dbConnection) {
    try {
      const isOpen = await dbConnection.isDBOpen();
      if (isOpen?.result) {
        return dbConnection;
      }
    } catch (e) {
      // Re-initialize if check failed
    }
  }

  // If initialization is already in flight, return the shared promise
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (!sqliteConnection) {
        sqliteConnection = new SQLiteConnection(CapacitorSQLite);
      }

      // Handle web platform fallback via jeep-sqlite web component
      if (Capacitor.getPlatform() === 'web') {
        if (typeof window !== 'undefined') {
          try {
            const { defineCustomElements } = await import('jeep-sqlite/loader');
            if (typeof defineCustomElements === 'function') {
              defineCustomElements(window);
            }
            if (!document.querySelector('jeep-sqlite')) {
              const jeepEl = document.createElement('jeep-sqlite');
              jeepEl.setAttribute('wasmPath', '/assets');
              document.body.appendChild(jeepEl);
              await customElements.whenDefined('jeep-sqlite');
            }
            await sqliteConnection.initWebStore();
          } catch (webErr) {
            console.warn('⚠️ [SQLITE] Web jeep-sqlite fallback init notice:', webErr?.message || webErr);
          }
        }
      }

      // Check if connection already exists in SQLiteConnection dictionary
      let isConn = false;
      try {
        const check = await sqliteConnection.isConnection(DB_NAME, false);
        isConn = Boolean(check?.result);
      } catch (e) {
        isConn = false;
      }

      if (isConn) {
        dbConnection = await sqliteConnection.retrieveConnection(DB_NAME, false);
      } else {
        dbConnection = await sqliteConnection.createConnection(
          DB_NAME,
          false,
          'no-encryption',
          1,
          false
        );
      }

      if (!dbConnection) {
        throw new Error('Failed to create SQLite connection');
      }

      const isOpen = await dbConnection.isDBOpen();
      if (!isOpen?.result) {
        await dbConnection.open();
      }

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS call_logs (
          id TEXT PRIMARY KEY,
          callerId TEXT,
          receiverId TEXT,
          callType TEXT,
          status TEXT,
          duration INTEGER,
          startTime TEXT,
          endTime TEXT,
          name TEXT,
          image TEXT,
          direction TEXT,
          syncStatus TEXT DEFAULT 'pending',
          createdAt TEXT
        );
      `;
      await dbConnection.execute(createTableSql);

      if (Capacitor.getPlatform() === 'web' && sqliteConnection) {
        try {
          await sqliteConnection.saveToStore(DB_NAME);
        } catch (e) {}
      }

      console.log('✅ [SQLITE] juicy_call_logs.db initialized successfully');
      return dbConnection;
    } catch (error) {
      console.warn('⚠️ [SQLITE] initCallLogsDb failed or unavailable:', error?.message || error);
      dbConnection = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

/**
 * Inserts a row into call_logs with syncStatus='pending'.
 * Resolves even if SQLite write fails (catch internally, log warning, return false).
 */
export const saveCallLogLocally = async (callLogEntry) => {
  if (!callLogEntry) return false;

  try {
    const db = await initCallLogsDb();
    if (!db) {
      return false;
    }

    const id = callLogEntry.id ? String(callLogEntry.id) : String(generateUniqueNumericId());
    const callerId = callLogEntry.callerId ? String(callLogEntry.callerId) : '';
    const receiverId = callLogEntry.receiverId ? String(callLogEntry.receiverId) : '';
    const callType = callLogEntry.callType || 'audio';
    const status = callLogEntry.status || 'completed';
    const duration = typeof callLogEntry.duration === 'number' ? callLogEntry.duration : (parseInt(callLogEntry.duration, 10) || 0);

    const startTime = callLogEntry.startTime instanceof Date
      ? callLogEntry.startTime.toISOString()
      : (callLogEntry.startTime ? String(callLogEntry.startTime) : new Date().toISOString());

    const endTime = callLogEntry.endTime instanceof Date
      ? callLogEntry.endTime.toISOString()
      : (callLogEntry.endTime ? String(callLogEntry.endTime) : new Date().toISOString());

    const name = callLogEntry.name ? String(callLogEntry.name) : '';
    const image = callLogEntry.image ? String(callLogEntry.image) : '';
    const direction = callLogEntry.direction
      ? String(callLogEntry.direction)
      : (callLogEntry.type === 'outgoing' || callLogEntry.type === 'incoming' ? callLogEntry.type : 'outgoing');

    const createdAt = new Date().toISOString();

    const insertSql = `
      INSERT OR REPLACE INTO call_logs (
        id, callerId, receiverId, callType, status, duration, startTime, endTime, name, image, direction, syncStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?);
    `;

    const values = [
      id,
      callerId,
      receiverId,
      callType,
      status,
      duration,
      startTime,
      endTime,
      name,
      image,
      direction,
      createdAt
    ];

    await db.run(insertSql, values);

    if (Capacitor.getPlatform() === 'web' && sqliteConnection) {
      try {
        await sqliteConnection.saveToStore(DB_NAME);
      } catch (e) {}
    }

    console.log('📁 [SQLITE] Call log saved locally:', { id, name, status, duration });
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveCallLogLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Returns all rows from call_logs ordered by createdAt DESC.
 */
export const getAllCallLogsLocally = async () => {
  try {
    const db = await initCallLogsDb();
    if (!db) {
      return [];
    }

    const res = await db.query('SELECT * FROM call_logs ORDER BY createdAt DESC;');
    return res?.values || [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] getAllCallLogsLocally failed:', error?.message || error);
    return [];
  }
};

/**
 * Updates syncStatus to 'synced' for the given id, called after a successful backend save.
 */
export const markCallLogSynced = async (id) => {
  if (!id) return false;

  try {
    const db = await initCallLogsDb();
    if (!db) {
      return false;
    }

    const sql = "UPDATE call_logs SET syncStatus = 'synced' WHERE id = ?;";
    await db.run(sql, [String(id)]);

    if (Capacitor.getPlatform() === 'web' && sqliteConnection) {
      try {
        await sqliteConnection.saveToStore(DB_NAME);
      } catch (e) {}
    }

    console.log('☁️ [SQLITE] Call log marked synced:', id);
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] markCallLogSynced failed:', error?.message || error);
    return false;
  }
};
