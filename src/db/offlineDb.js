import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'juicy_offline.db';

let sqliteConnection = null;
let dbConnection = null;
let initPromise = null;

/**
 * Initialize SQLite offline database and create tables if they do not exist.
 * Idempotent, safe to call multiple times, fails gracefully on error.
 */
export const initOfflineDb = async () => {
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

      // Check if connection already exists
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
        try {
          dbConnection = await sqliteConnection.createConnection(
            DB_NAME,
            false,
            'no-encryption',
            1,
            false
          );
        } catch (connErr) {
          dbConnection = await sqliteConnection.retrieveConnection(DB_NAME, false);
        }
      }

      if (!dbConnection) {
        throw new Error('Failed to create SQLite connection for juicy_offline.db');
      }

      const isOpen = await dbConnection.isDBOpen();
      if (!isOpen?.result) {
        await dbConnection.open();
      }

      // Schema definition for all offline-first tables
      const schemaSql = `
        CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY,
          name TEXT,
          username TEXT,
          dob TEXT,
          about TEXT,
          phone TEXT,
          email TEXT,
          gender TEXT,
          city TEXT,
          country TEXT,
          countryCode TEXT,
          profileImage TEXT,
          rawJson TEXT,
          syncStatus TEXT DEFAULT 'synced',
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS friends (
          id TEXT PRIMARY KEY,
          currentUserId TEXT,
          username TEXT,
          name TEXT,
          profilePic TEXT,
          phone TEXT,
          about TEXT,
          lastSeen TEXT,
          rawJson TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          chatId TEXT,
          currentUserId TEXT,
          senderId TEXT,
          receiverId TEXT,
          text TEXT,
          type TEXT,
          mediaUrl TEXT,
          time TEXT,
          timestamp INTEGER,
          status TEXT,
          syncStatus TEXT DEFAULT 'synced',
          rawJson TEXT,
          createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS recent_searches (
          id TEXT PRIMARY KEY,
          currentUserId TEXT,
          username TEXT,
          name TEXT,
          profilePic TEXT,
          rawJson TEXT,
          searchedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS cached_users (
          id TEXT PRIMARY KEY,
          username TEXT,
          name TEXT,
          profilePic TEXT,
          phone TEXT,
          rawJson TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS contact_gestures (
          userId TEXT PRIMARY KEY,
          gesturesJson TEXT,
          syncStatus TEXT DEFAULT 'synced',
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS custom_wallpapers (
          id TEXT PRIMARY KEY,
          name TEXT,
          url TEXT,
          type TEXT,
          size TEXT,
          category TEXT,
          icon TEXT,
          rawJson TEXT,
          uploadedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS blocked_users (
          id TEXT PRIMARY KEY,
          currentUserId TEXT,
          userId TEXT,
          username TEXT,
          name TEXT,
          profilePic TEXT,
          rawJson TEXT,
          blockedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS moods (
          id TEXT PRIMARY KEY,
          currentUserId TEXT,
          userId TEXT,
          username TEXT,
          profilePic TEXT,
          emoji TEXT,
          text TEXT,
          timestamp TEXT,
          likes TEXT,
          rawJson TEXT,
          updatedAt TEXT
        );
      `;

      await dbConnection.execute(schemaSql);

      if (Capacitor.getPlatform() === 'web' && sqliteConnection) {
        try {
          await sqliteConnection.saveToStore(DB_NAME);
        } catch (e) {}
      }

      console.log('✅ [SQLITE] juicy_offline.db initialized successfully');
      return dbConnection;
    } catch (error) {
      console.warn('⚠️ [SQLITE] initOfflineDb failed or unavailable:', error?.message || error);
      dbConnection = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

const saveWebStore = async () => {
  if (Capacitor.getPlatform() === 'web' && sqliteConnection) {
    try {
      await sqliteConnection.saveToStore(DB_NAME);
    } catch (e) {}
  }
};

/* ==========================================================================
   USER PROFILE METHODS
   ========================================================================== */

/**
 * Save user profile to local SQLite
 */
export const saveUserProfileLocally = async (userId, profileData, syncStatus = 'synced') => {
  if (!userId || !profileData) return false;
  try {
    const db = await initOfflineDb();
    if (!db) return false;

    const id = String(userId);
    const name = profileData.name || '';
    const username = profileData.username || '';
    const dob = profileData.dob || '';
    const about = profileData.about || '';
    const phone = profileData.phone || '';
    const email = profileData.email || '';
    const gender = profileData.gender || '';
    const city = profileData.city || '';
    const country = profileData.country || '';
    const countryCode = profileData.countryCode || '+91';
    const profileImage = profileData.profileImage || '';
    const rawJson = JSON.stringify(profileData);
    const updatedAt = new Date().toISOString();

    const sql = `
      INSERT OR REPLACE INTO user_profile (
        id, name, username, dob, about, phone, email, gender, city, country, countryCode, profileImage, rawJson, syncStatus, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.run(sql, [
      id, name, username, dob, about, phone, email, gender, city, country, countryCode, profileImage, rawJson, syncStatus, updatedAt
    ]);

    await saveWebStore();
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveUserProfileLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve user profile from local SQLite
 */
export const getUserProfileLocally = async (userId) => {
  if (!userId) return null;
  try {
    const db = await initOfflineDb();
    if (!db) return null;

    const res = await db.query('SELECT * FROM user_profile WHERE id = ? LIMIT 1;', [String(userId)]);
    if (res?.values && res.values.length > 0) {
      const row = res.values[0];
      if (row.rawJson) {
        try {
          const parsed = JSON.parse(row.rawJson);
          return { ...parsed, ...row };
        } catch (e) {}
      }
      return row;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ [SQLITE] getUserProfileLocally failed:', error?.message || error);
    return null;
  }
};

/* ==========================================================================
   FRIENDS METHODS
   ========================================================================== */

/**
 * Save friends list to local SQLite
 */
export const saveFriendsLocally = async (currentUserId, friendsList) => {
  if (!currentUserId || !Array.isArray(friendsList)) return false;
  try {
    const db = await initOfflineDb();
    if (!db) return false;

    const currId = String(currentUserId);
    const updatedAt = new Date().toISOString();

    for (const friend of friendsList) {
      if (!friend || (!friend._id && !friend.id)) continue;
      const id = String(friend._id || friend.id);
      const username = friend.username || '';
      const name = friend.name || '';
      const profilePic = friend.profilePic || friend.profileImage || '';
      const phone = friend.phone || '';
      const about = friend.about || '';
      const lastSeen = friend.lastSeen || '';
      const rawJson = JSON.stringify(friend);

      const sql = `
        INSERT OR REPLACE INTO friends (
          id, currentUserId, username, name, profilePic, phone, about, lastSeen, rawJson, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      await db.run(sql, [id, currId, username, name, profilePic, phone, about, lastSeen, rawJson, updatedAt]);
    }

    await saveWebStore();
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveFriendsLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve cached friends list from local SQLite
 */
export const getFriendsLocally = async (currentUserId) => {
  if (!currentUserId) return [];
  try {
    const db = await initOfflineDb();
    if (!db) return [];

    const res = await db.query(
      'SELECT * FROM friends WHERE currentUserId = ? ORDER BY updatedAt DESC;',
      [String(currentUserId)]
    );

    if (res?.values && Array.isArray(res.values)) {
      return res.values.map(row => {
        if (row.rawJson) {
          try {
            return JSON.parse(row.rawJson);
          } catch (e) {}
        }
        return {
          _id: row.id,
          username: row.username,
          name: row.name,
          profilePic: row.profilePic,
          phone: row.phone,
          about: row.about,
          lastSeen: row.lastSeen
        };
      });
    }
    return [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] getFriendsLocally failed:', error?.message || error);
    return [];
  }
};

/* ==========================================================================
   CHAT MESSAGES METHODS
   ========================================================================== */

/**
 * Save a single chat message locally
 */
export const saveSingleMessageLocally = async (chatId, msg, syncStatus = 'synced', currentUserId = '') => {
  if (!chatId || !msg) return false;
  try {
    const db = await initOfflineDb();
    if (!db) return false;

    const id = String(msg._id || msg.id || `${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const cId = String(chatId);
    const currId = String(currentUserId || localStorage.getItem('userId') || '');
    const senderId = String(msg.senderId || msg.sender || '');
    const receiverId = String(msg.receiverId || msg.receiver || '');
    const text = msg.text || msg.content || msg.message || '';
    const type = msg.type || 'text';
    const mediaUrl = msg.mediaUrl || msg.fileUrl || msg.image || msg.audioUrl || '';
    const time = msg.time || '';
    const timestamp = typeof msg.timestamp === 'number' ? msg.timestamp : Date.now();
    const status = msg.status || 'sent';
    const rawJson = JSON.stringify(msg);
    const createdAt = msg.createdAt ? String(msg.createdAt) : new Date().toISOString();

    const sql = `
      INSERT OR REPLACE INTO chat_messages (
        id, chatId, currentUserId, senderId, receiverId, text, type, mediaUrl, time, timestamp, status, syncStatus, rawJson, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.run(sql, [
      id, cId, currId, senderId, receiverId, text, type, mediaUrl, time, timestamp, status, syncStatus, rawJson, createdAt
    ]);

    await saveWebStore();
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveSingleMessageLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Bulk save messages object ({ [chatId]: [messageArray] }) to local SQLite
 */
export const saveMessagesLocally = async (currentUserId, messagesObj) => {
  if (!messagesObj || typeof messagesObj !== 'object') return false;
  try {
    const db = await initOfflineDb();
    if (!db) return false;

    const currId = String(currentUserId || localStorage.getItem('userId') || '');

    for (const [chatId, msgList] of Object.entries(messagesObj)) {
      if (!Array.isArray(msgList)) continue;
      for (const msg of msgList) {
        if (!msg) continue;
        const id = String(msg._id || msg.id || `${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        const senderId = String(msg.senderId || msg.sender || '');
        const receiverId = String(msg.receiverId || msg.receiver || '');
        const text = msg.text || msg.content || msg.message || '';
        const type = msg.type || 'text';
        const mediaUrl = msg.mediaUrl || msg.fileUrl || msg.image || msg.audioUrl || '';
        const time = msg.time || '';
        const timestamp = typeof msg.timestamp === 'number' ? msg.timestamp : Date.now();
        const status = msg.status || 'sent';
        const rawJson = JSON.stringify(msg);
        const createdAt = msg.createdAt ? String(msg.createdAt) : new Date().toISOString();

        const sql = `
          INSERT OR REPLACE INTO chat_messages (
            id, chatId, currentUserId, senderId, receiverId, text, type, mediaUrl, time, timestamp, status, syncStatus, rawJson, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?);
        `;
        await db.run(sql, [
          id, String(chatId), currId, senderId, receiverId, text, type, mediaUrl, time, timestamp, status, rawJson, createdAt
        ]);
      }
    }

    await saveWebStore();
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveMessagesLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve all messages formatted as { [chatId]: [messageArray] } from local SQLite
 */
export const getAllMessagesLocally = async (currentUserId) => {
  try {
    const db = await initOfflineDb();
    if (!db) return {};

    const currId = String(currentUserId || localStorage.getItem('userId') || '');
    let sql = 'SELECT * FROM chat_messages ORDER BY timestamp ASC, createdAt ASC;';
    let params = [];

    if (currId) {
      sql = 'SELECT * FROM chat_messages WHERE currentUserId = ? OR currentUserId = "" ORDER BY timestamp ASC, createdAt ASC;';
      params = [currId];
    }

    const res = await db.query(sql, params);
    const messagesObj = {};

    if (res?.values && Array.isArray(res.values)) {
      for (const row of res.values) {
        const chatId = row.chatId;
        if (!chatId) continue;
        if (!messagesObj[chatId]) {
          messagesObj[chatId] = [];
        }

        let msgItem = null;
        if (row.rawJson) {
          try {
            msgItem = JSON.parse(row.rawJson);
          } catch (e) {}
        }

        if (!msgItem) {
          msgItem = {
            _id: row.id,
            id: row.id,
            senderId: row.senderId,
            receiverId: row.receiverId,
            text: row.text,
            type: row.type,
            mediaUrl: row.mediaUrl,
            time: row.time,
            timestamp: row.timestamp,
            status: row.status
          };
        }

        messagesObj[chatId].push(msgItem);
      }
    }

    return messagesObj;
  } catch (error) {
    console.warn('⚠️ [SQLITE] getAllMessagesLocally failed:', error?.message || error);
    return {};
  }
};

/* ==========================================================================
   RECENT SEARCHES & CACHED USERS METHODS
   ========================================================================== */

/**
 * Save recent searches list to SQLite
 */
export const saveRecentSearchesLocally = async (currentUserId, usersList) => {
  if (!currentUserId || !Array.isArray(usersList)) return false;
  try {
    const db = await initOfflineDb();
    if (!db) return false;

    const currId = String(currentUserId);
    // Clear old recent searches for this user to keep order exact
    await db.run('DELETE FROM recent_searches WHERE currentUserId = ?;', [currId]);

    for (const user of usersList) {
      if (!user || (!user._id && !user.id)) continue;
      const id = String(user._id || user.id);
      const username = user.username || '';
      const name = user.name || '';
      const profilePic = user.profilePic || user.profileImage || '';
      const rawJson = JSON.stringify(user);
      const searchedAt = new Date().toISOString();

      const sql = `
        INSERT OR REPLACE INTO recent_searches (
          id, currentUserId, username, name, profilePic, rawJson, searchedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `;
      await db.run(sql, [id, currId, username, name, profilePic, rawJson, searchedAt]);
    }

    await saveWebStore();
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveRecentSearchesLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve recent searches from SQLite
 */
export const getRecentSearchesLocally = async (currentUserId) => {
  if (!currentUserId) return [];
  try {
    const db = await initOfflineDb();
    if (!db) return [];

    const res = await db.query(
      'SELECT * FROM recent_searches WHERE currentUserId = ? ORDER BY searchedAt DESC;',
      [String(currentUserId)]
    );

    if (res?.values && Array.isArray(res.values)) {
      return res.values.map(row => {
        if (row.rawJson) {
          try {
            return JSON.parse(row.rawJson);
          } catch (e) {}
        }
        return {
          _id: row.id,
          username: row.username,
          name: row.name,
          profilePic: row.profilePic
        };
      });
    }
    return [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] getRecentSearchesLocally failed:', error?.message || error);
    return [];
  }
};

/**
 * Cache discovered users (from search results or last logins) to SQLite
 */
export const saveCachedUsersLocally = async (usersList) => {
  if (!Array.isArray(usersList) || usersList.length === 0) return false;
  try {
    const db = await initOfflineDb();
    if (!db) return false;

    const updatedAt = new Date().toISOString();

    for (const user of usersList) {
      if (!user || (!user._id && !user.id)) continue;
      const id = String(user._id || user.id);
      const username = user.username || '';
      const name = user.name || '';
      const profilePic = user.profilePic || user.profileImage || '';
      const phone = user.phone || '';
      const rawJson = JSON.stringify(user);

      const sql = `
        INSERT OR REPLACE INTO cached_users (
          id, username, name, profilePic, phone, rawJson, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `;
      await db.run(sql, [id, username, name, profilePic, phone, rawJson, updatedAt]);
    }

    await saveWebStore();
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveCachedUsersLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Search locally cached users by query string (offline search)
 */
export const searchCachedUsersLocally = async (queryStr) => {
  try {
    const db = await initOfflineDb();
    if (!db) return [];

    const term = `%${(queryStr || '').trim().toLowerCase()}%`;
    const sql = `
      SELECT * FROM cached_users
      WHERE LOWER(username) LIKE ? OR LOWER(name) LIKE ? OR phone LIKE ?
      ORDER BY updatedAt DESC LIMIT 20;
    `;
    const res = await db.query(sql, [term, term, term]);

    if (res?.values && Array.isArray(res.values)) {
      return res.values.map(row => {
        if (row.rawJson) {
          try {
            return JSON.parse(row.rawJson);
          } catch (e) {}
        }
        return {
          _id: row.id,
          username: row.username,
          name: row.name,
          profilePic: row.profilePic,
          phone: row.phone
        };
      });
    }
    return [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] searchCachedUsersLocally failed:', error?.message || error);
    return [];
  }
};

/**
 * Retrieve cached last logins / recent users
 */
export const getLastLoginsLocally = async (limit = 20) => {
  try {
    const db = await initOfflineDb();
    if (!db) return [];

    const sql = `SELECT * FROM cached_users ORDER BY updatedAt DESC LIMIT ?;`;
    const res = await db.query(sql, [limit]);

    if (res?.values && Array.isArray(res.values)) {
      return res.values.map(row => {
        if (row.rawJson) {
          try {
            return JSON.parse(row.rawJson);
          } catch (e) {}
        }
        return {
          _id: row.id,
          username: row.username,
          name: row.name,
          profilePic: row.profilePic,
          phone: row.phone
        };
      });
    }
    return [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] getLastLoginsLocally failed:', error?.message || error);
    return [];
  }
};

/* ==========================================================================
   CONTACT GESTURES METHODS
   ========================================================================== */

/**
 * Save gestures dictionary ({ [friendId]: { username, points } }) to SQLite
 */
export const saveContactGesturesLocally = async (userId, gesturesObj, syncStatus = 'synced') => {
  if (!userId || !gesturesObj || typeof gesturesObj !== 'object') return false;
  try {
    const uId = String(userId);
    const gesturesJson = JSON.stringify(gesturesObj);
    const updatedAt = new Date().toISOString();

    // Also sync to localStorage for instantaneous synchronous access
    try {
      localStorage.setItem('juicy_contact_gestures', gesturesJson);
    } catch (e) {}

    const db = await initOfflineDb();
    if (!db) return false;

    const sql = `
      INSERT OR REPLACE INTO contact_gestures (
        userId, gesturesJson, syncStatus, updatedAt
      ) VALUES (?, ?, ?, ?);
    `;
    await db.run(sql, [uId, gesturesJson, syncStatus, updatedAt]);

    await saveWebStore();
    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveContactGesturesLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve cached contact gestures from local SQLite
 */
export const getContactGesturesLocally = async (userId) => {
  if (!userId) {
    try {
      const saved = localStorage.getItem('juicy_contact_gestures');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  try {
    const db = await initOfflineDb();
    if (!db) {
      const saved = localStorage.getItem('juicy_contact_gestures');
      return saved ? JSON.parse(saved) : {};
    }

    const res = await db.query(
      'SELECT gesturesJson FROM contact_gestures WHERE userId = ? LIMIT 1;',
      [String(userId)]
    );

    if (res?.values && res.values.length > 0 && res.values[0].gesturesJson) {
      try {
        const gestures = JSON.parse(res.values[0].gesturesJson);
        // Keep localStorage hot in sync
        try {
          localStorage.setItem('juicy_contact_gestures', JSON.stringify(gestures));
        } catch (e) {}
        return gestures;
      } catch (parseErr) {
        console.warn('⚠️ [SQLITE] Failed to parse gestures JSON:', parseErr);
      }
    }

    // Fallback to localStorage if not found in SQLite
    const saved = localStorage.getItem('juicy_contact_gestures');
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('⚠️ [SQLITE] getContactGesturesLocally failed:', error?.message || error);
    const saved = localStorage.getItem('juicy_contact_gestures');
    try {
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }
};

/**
 * Delete a specific friend gesture locally from SQLite and localStorage
 */
export const deleteContactGestureLocally = async (userId, friendId) => {
  if (!userId || !friendId) return {};
  try {
    const currentGestures = await getContactGesturesLocally(userId);
    const updated = { ...currentGestures };
    delete updated[friendId];

    await saveContactGesturesLocally(userId, updated, 'pending');
    return updated;
  } catch (error) {
    console.warn('⚠️ [SQLITE] deleteContactGestureLocally failed:', error?.message || error);
    return {};
  }
};

/* ==========================================================================
   CUSTOM WALLPAPERS & APP SETTINGS (SQLITE)
   ========================================================================== */

/**
 * Save custom wallpaper image to SQLite and sync to localStorage safely
 */
export const saveCustomWallpaperLocally = async (wallpaperData) => {
  if (!wallpaperData || !wallpaperData.id) return false;
  try {
    const id = String(wallpaperData.id);
    const name = wallpaperData.name || `Wallpaper-${Date.now()}`;
    const url = wallpaperData.url || '';
    const type = wallpaperData.type || 'custom-image';
    const size = wallpaperData.size || 'cover';
    const category = wallpaperData.category || 'custom';
    const icon = wallpaperData.icon || '🖼️';
    const rawJson = JSON.stringify(wallpaperData);
    const uploadedAt = wallpaperData.uploadedAt || new Date().toISOString();

    const db = await initOfflineDb();
    if (db) {
      const sql = `
        INSERT OR REPLACE INTO custom_wallpapers (
          id, name, url, type, size, category, icon, rawJson, uploadedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      await db.run(sql, [id, name, url, type, size, category, icon, rawJson, uploadedAt]);
      await saveWebStore();
    }

    // Keep localStorage in sync if space permits (safe try-catch against quota errors)
    try {
      const current = localStorage.getItem('customWallpapers');
      const list = current ? JSON.parse(current) : [];
      const updated = list.filter(w => w.id !== id);
      updated.push(wallpaperData);
      localStorage.setItem('customWallpapers', JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn('⚠️ localStorage quota exceeded, wallpaper safely preserved in SQLite:', quotaErr);
    }

    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveCustomWallpaperLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve all custom wallpapers from SQLite (with localStorage fallback)
 */
export const getCustomWallpapersLocally = async () => {
  try {
    const db = await initOfflineDb();
    if (db) {
      const res = await db.query('SELECT * FROM custom_wallpapers ORDER BY uploadedAt DESC;');
      if (res?.values && Array.isArray(res.values) && res.values.length > 0) {
        return res.values.map(row => {
          if (row.rawJson) {
            try {
              return JSON.parse(row.rawJson);
            } catch (e) {}
          }
          return {
            id: row.id,
            name: row.name,
            url: row.url,
            type: row.type,
            size: row.size,
            category: row.category,
            icon: row.icon,
            uploadedAt: row.uploadedAt
          };
        });
      }
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('customWallpapers');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] getCustomWallpapersLocally failed:', error?.message || error);
    try {
      const saved = localStorage.getItem('customWallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }
};

/**
 * Delete a custom wallpaper from SQLite and localStorage
 */
export const deleteCustomWallpaperLocally = async (wallpaperId) => {
  if (!wallpaperId) return false;
  try {
    const id = String(wallpaperId);
    const db = await initOfflineDb();
    if (db) {
      await db.run('DELETE FROM custom_wallpapers WHERE id = ?;', [id]);
      await saveWebStore();
    }

    try {
      const saved = localStorage.getItem('customWallpapers');
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = list.filter(w => w.id !== id);
        localStorage.setItem('customWallpapers', JSON.stringify(filtered));
      }
    } catch (e) {}

    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] deleteCustomWallpaperLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Save generic app setting / preference (e.g. appPattern, patternOpacity, appTheme) to SQLite
 */
export const saveAppSettingLocally = async (key, value) => {
  if (!key) return false;
  try {
    const k = String(key);
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    const updatedAt = new Date().toISOString();

    const db = await initOfflineDb();
    if (db) {
      const sql = `INSERT OR REPLACE INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?);`;
      await db.run(sql, [k, v, updatedAt]);
      await saveWebStore();
    }

    try {
      localStorage.setItem(k, v);
    } catch (e) {}

    return true;
  } catch (error) {
    console.warn(`⚠️ [SQLITE] saveAppSettingLocally failed for key ${key}:`, error?.message || error);
    return false;
  }
};

/**
 * Retrieve app setting from SQLite
 */
export const getAppSettingLocally = async (key) => {
  if (!key) return null;
  try {
    const db = await initOfflineDb();
    if (db) {
      const res = await db.query('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [String(key)]);
      if (res?.values && res.values.length > 0 && res.values[0].value) {
        const val = res.values[0].value;
        try {
          localStorage.setItem(key, val);
        } catch (e) {}
        return val;
      }
    }

    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`⚠️ [SQLITE] getAppSettingLocally failed for key ${key}:`, error?.message || error);
    return localStorage.getItem(key);
  }
};

/* ==========================================================================
   BLOCKED USERS METHODS (SQLITE)
   ========================================================================== */

/**
 * Save blocked users list to SQLite and sync to localStorage
 */
export const saveBlockedUsersLocally = async (currentUserId, blockedList) => {
  if (!currentUserId || !Array.isArray(blockedList)) return false;
  try {
    const currId = String(currentUserId);
    const db = await initOfflineDb();
    if (db) {
      await db.run('DELETE FROM blocked_users WHERE currentUserId = ?;', [currId]);

      for (const item of blockedList) {
        if (!item) continue;
        const targetUserId = String(
          typeof item === 'string'
            ? item
            : (item.userId || item._id || item.id || '')
        );
        if (!targetUserId) continue;
        const id = `${currId}_${targetUserId}`;
        const username = typeof item === 'object' ? (item.username || '') : '';
        const name = typeof item === 'object' ? (item.name || '') : '';
        const profilePic = typeof item === 'object' ? (item.profilePic || item.profileImage || '') : '';
        const rawJson = typeof item === 'object' ? JSON.stringify(item) : JSON.stringify({ userId: targetUserId, _id: targetUserId });
        const blockedAt = (typeof item === 'object' && item.blockedAt) ? item.blockedAt : new Date().toISOString();

        const sql = `
          INSERT OR REPLACE INTO blocked_users (
            id, currentUserId, userId, username, name, profilePic, rawJson, blockedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        await db.run(sql, [id, currId, targetUserId, username, name, profilePic, rawJson, blockedAt]);
      }

      await saveWebStore();
    }

    try {
      localStorage.setItem(`juicy_cached_blocked_${currId}`, JSON.stringify(blockedList));
    } catch (e) {}

    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveBlockedUsersLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve blocked users list from SQLite (with localStorage fallback and auto-migration)
 */
export const getBlockedUsersLocally = async (currentUserId) => {
  if (!currentUserId) return [];
  const currId = String(currentUserId);
  try {
    const db = await initOfflineDb();
    if (db) {
      const res = await db.query(
        'SELECT * FROM blocked_users WHERE currentUserId = ? ORDER BY blockedAt DESC;',
        [currId]
      );
      if (res?.values && Array.isArray(res.values)) {
        if (res.values.length > 0) {
          return res.values.map(row => {
            if (row.rawJson) {
              try {
                return JSON.parse(row.rawJson);
              } catch (e) {}
            }
            return {
              userId: row.userId,
              _id: row.userId,
              username: row.username,
              name: row.name,
              profilePic: row.profilePic
            };
          });
        }

        // SQLite table has 0 rows: check if legacy localStorage cache has data to migrate
        try {
          const saved = localStorage.getItem(`juicy_cached_blocked_${currId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Migrate localStorage items into SQLite
              saveBlockedUsersLocally(currId, parsed).catch(() => {});
              return parsed;
            }
          }
        } catch (migErr) {}

        return [];
      }
    }

    // Fallback to localStorage if db query unavailable
    const saved = localStorage.getItem(`juicy_cached_blocked_${currId}`);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] getBlockedUsersLocally failed:', error?.message || error);
    try {
      const saved = localStorage.getItem(`juicy_cached_blocked_${currId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }
};

/**
 * Remove a specific unblocked user locally from SQLite and localStorage
 */
export const removeBlockedUserLocally = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) return false;
  try {
    const currId = String(currentUserId);
    const tId = String(targetUserId);
    const db = await initOfflineDb();
    if (db) {
      await db.run(
        'DELETE FROM blocked_users WHERE currentUserId = ? AND (userId = ? OR id = ?);',
        [currId, tId, `${currId}_${tId}`]
      );
      await saveWebStore();
    }

    try {
      const saved = localStorage.getItem(`juicy_cached_blocked_${currId}`);
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = list.filter(u => String(u.userId || u._id || u.id) !== tId);
        localStorage.setItem(`juicy_cached_blocked_${currId}`, JSON.stringify(filtered));
      }
    } catch (e) {}

    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] removeBlockedUserLocally failed:', error?.message || error);
    return false;
  }
};

/* ==========================================================================
   MOODS METHODS (SQLITE)
   ========================================================================== */

/**
 * Save moods list to SQLite and update localStorage
 */
export const saveMoodsLocally = async (currentUserId, moodsList) => {
  if (!currentUserId || !Array.isArray(moodsList)) return false;
  try {
    const currId = String(currentUserId);
    const db = await initOfflineDb();
    if (db) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const updatedAt = new Date().toISOString();

      // Clean up expired moods
      try {
        await db.run('DELETE FROM moods WHERE currentUserId = ? AND timestamp < ?;', [currId, twentyFourHoursAgo]);
      } catch (e) {}

      // Replace current user moods with fresh list
      await db.run('DELETE FROM moods WHERE currentUserId = ?;', [currId]);

      for (const mood of moodsList) {
        if (!mood) continue;
        const id = String(mood._id || mood.id || '');
        if (!id) continue;
        const userId = String(mood.userId?._id || mood.userId || mood.user?._id || mood.user || '');
        const username = mood.username || mood.user?.username || '';
        const profilePic = mood.profilePic || mood.user?.profilePic || mood.user?.profileImage || '';
        const emoji = mood.emoji || '💭';
        const text = mood.text || '';
        const timestamp = mood.timestamp || new Date().toISOString();
        const likes = JSON.stringify(mood.likes || []);
        const rawJson = JSON.stringify(mood);

        const sql = `
          INSERT OR REPLACE INTO moods (
            id, currentUserId, userId, username, profilePic, emoji, text, timestamp, likes, rawJson, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        await db.run(sql, [id, currId, userId, username, profilePic, emoji, text, timestamp, likes, rawJson, updatedAt]);
      }

      await saveWebStore();
    }

    try {
      localStorage.setItem(`cached_moods_${currId}`, JSON.stringify(moodsList));
    } catch (e) {}

    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveMoodsLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Retrieve active moods from SQLite (with fallback and migration from localStorage)
 */
export const getMoodsLocally = async (currentUserId) => {
  if (!currentUserId) return [];
  const currId = String(currentUserId);
  try {
    const db = await initOfflineDb();
    if (db) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await db.query(
        'SELECT * FROM moods WHERE currentUserId = ? AND timestamp >= ? ORDER BY timestamp DESC;',
        [currId, twentyFourHoursAgo]
      );
      if (res?.values && Array.isArray(res.values) && res.values.length > 0) {
        return res.values.map(row => {
          if (row.rawJson) {
            try {
              return JSON.parse(row.rawJson);
            } catch (e) {}
          }
          return {
            _id: row.id,
            id: row.id,
            userId: row.userId,
            username: row.username,
            profilePic: row.profilePic,
            emoji: row.emoji,
            text: row.text,
            timestamp: row.timestamp,
            likes: row.likes ? JSON.parse(row.likes) : []
          };
        });
      }

      // SQLite table is empty: check if localStorage has data to migrate
      try {
        const saved = localStorage.getItem(`cached_moods_${currId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            saveMoodsLocally(currId, parsed).catch(() => {});
            return parsed;
          }
        }
      } catch (migErr) {}

      return [];
    }

    // Fallback to localStorage if db query unavailable
    const saved = localStorage.getItem(`cached_moods_${currId}`);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('⚠️ [SQLITE] getMoodsLocally failed:', error?.message || error);
    try {
      const saved = localStorage.getItem(`cached_moods_${currId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }
};

/**
 * Save or update a single mood locally in SQLite and localStorage
 */
export const saveSingleMoodLocally = async (currentUserId, mood) => {
  if (!mood) return false;
  try {
    const currId = String(currentUserId || mood.userId || '');
    const id = String(mood._id || mood.id || '');
    if (!id) return false;
    const userId = String(mood.userId?._id || mood.userId || mood.user?._id || mood.user || '');
    const username = mood.username || mood.user?.username || '';
    const profilePic = mood.profilePic || mood.user?.profilePic || mood.user?.profileImage || '';
    const emoji = mood.emoji || '💭';
    const text = mood.text || '';
    const timestamp = mood.timestamp || new Date().toISOString();
    const likes = JSON.stringify(mood.likes || []);
    const rawJson = JSON.stringify(mood);
    const updatedAt = new Date().toISOString();

    const db = await initOfflineDb();
    if (db) {
      const sql = `
        INSERT OR REPLACE INTO moods (
          id, currentUserId, userId, username, profilePic, emoji, text, timestamp, likes, rawJson, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      await db.run(sql, [id, currId, userId, username, profilePic, emoji, text, timestamp, likes, rawJson, updatedAt]);
      await saveWebStore();
    }

    if (currId) {
      try {
        const saved = localStorage.getItem(`cached_moods_${currId}`);
        const list = saved ? JSON.parse(saved) : [];
        const index = list.findIndex(m => String(m.id || m._id) === id);
        if (index >= 0) {
          list[index] = mood;
        } else {
          list.unshift(mood);
        }
        localStorage.setItem(`cached_moods_${currId}`, JSON.stringify(list));
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] saveSingleMoodLocally failed:', error?.message || error);
    return false;
  }
};

/**
 * Delete a specific mood locally from SQLite and localStorage
 */
export const deleteMoodLocally = async (currentUserId, moodId) => {
  if (!moodId) return false;
  try {
    const targetIdStr = String(moodId);
    const currId = String(currentUserId || '');
    const db = await initOfflineDb();
    if (db) {
      if (currId) {
        await db.run('DELETE FROM moods WHERE (id = ? OR id = ?) AND currentUserId = ?;', [targetIdStr, `temp-${targetIdStr}`, currId]);
      } else {
        await db.run('DELETE FROM moods WHERE id = ? OR id = ?;', [targetIdStr, `temp-${targetIdStr}`]);
      }
      await saveWebStore();
    }

    if (currId) {
      try {
        const saved = localStorage.getItem(`cached_moods_${currId}`);
        if (saved) {
          const list = JSON.parse(saved);
          const filtered = list.filter(m => {
            const mid = String(m.id || m._id || '');
            return mid !== targetIdStr && mid !== `temp-${targetIdStr}`;
          });
          localStorage.setItem(`cached_moods_${currId}`, JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.warn('⚠️ [SQLITE] deleteMoodLocally failed:', error?.message || error);
    return false;
  }
};




