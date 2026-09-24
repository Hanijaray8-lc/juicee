import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  InputAdornment,
  useMediaQuery,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Chip,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SyncIcon from '@mui/icons-material/Sync';
import PermContactCalendarIcon from '@mui/icons-material/PermContactCalendar';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTheme } from '@mui/material/styles';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import API_BASE_URL from './config/apiConfig';
import {
  saveRecentSearchesLocally,
  getRecentSearchesLocally,
  saveCachedUsersLocally,
  searchCachedUsersLocally,
  getLastLoginsLocally,
  saveFriendsLocally,
  getFriendsLocally,
  getBlockedUsersLocally,
  saveBlockedUsersLocally
} from './db/offlineDb';
import { getProfileImageSrc } from './utils/imageUtils';

const SearchPage = () => {
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState(() => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return {};
      const saved = localStorage.getItem(`juicy_cached_sent_requests_${currentUserId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [lastLoginUsers, setLastLoginUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_last_logins');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return [];
      const saved = localStorage.getItem(`recentSearches_${currentUserId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [blockedUsers, setBlockedUsers] = useState(() => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return [];
      const saved = localStorage.getItem(`juicy_cached_blocked_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(u => (typeof u === 'string' ? u : (u.userId || u._id || u.id)));
      }
      return [];
    } catch {
      return [];
    }
  });
  const [blockedBy, setBlockedBy] = useState(() => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return [];
      const saved = localStorage.getItem(`juicy_cached_blocked_by_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(u => (typeof u === 'string' ? u : (u.userId || u._id || u.id)));
      }
      return [];
    } catch {
      return [];
    }
  });

  // New state for profile dialog
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New states for synced contacts
  const [syncedUsers, setSyncedUsers] = useState([]);
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Menu for contact sync options
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Socket state
  const [socket, setSocket] = useState(null);

  // User's friends - initialized from cache for instant 0ms rendering
  const [userFriends, setUserFriends] = useState(() => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return [];
      const saved = localStorage.getItem(`juicy_cached_friends_${currentUserId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [currentIsDark, setCurrentIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('appTheme');
      if (saved) {
        const parsed = JSON.parse(saved);
        const bgCol = parsed?.colors?.background;
        if (bgCol && bgCol.startsWith('#')) {
          const hex = bgCol.replace('#', '').trim();
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return (r * 299 + g * 587 + b * 114) / 1000 < 128;
        }
      }
    } catch (e) {}
    return theme.palette.mode === 'dark';
  });
  const isDark = currentIsDark;

  useEffect(() => {
    const handleThemeChange = () => {
      try {
        const saved = localStorage.getItem('appTheme');
        if (saved) {
          const parsed = JSON.parse(saved);
          const bgCol = parsed?.colors?.background;
          if (bgCol && bgCol.startsWith('#')) {
            const hex = bgCol.replace('#', '').trim();
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            setCurrentIsDark((r * 299 + g * 587 + b * 114) / 1000 < 128);
            return;
          }
        }
      } catch (e) {}
      setCurrentIsDark(theme.palette.mode === 'dark');
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [theme.palette.mode]);

  // Check if browser supports Contact Picker API
  const supportsContactPicker = 'contacts' in navigator && 'ContactsManager' in window;

  // Handle opening profile dialog
  const handleOpenProfile = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  // Handle closing profile dialog
  const handleCloseProfile = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Handle menu open
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Add friend request logic
  const handleAddFriend = async (userId) => {
    setFriendRequests((prev) => ({ ...prev, [userId]: true }));
    const user =
      filteredUsers.find(u => u._id === userId) ||
      lastLoginUsers.find(u => u._id === userId) ||
      recentSearches.find(u => u._id === userId) ||
      syncedUsers.find(u => u._id === userId);

    if (user) {
      setRecentSearches(prev => {
        const filtered = prev.filter(u => u._id !== userId);
        const updated = [user, ...filtered];
        return updated.slice(0, 5);
      });

      // Get current user's info from localStorage
      const currentUserId = localStorage.getItem('userId');
      const currentUsername = localStorage.getItem('username');
      const currentProfileImage = localStorage.getItem('profileImage');

      try {
        const API_URL = API_BASE_URL;
        const response = await fetch(`${API_URL}/api/friendRequests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUserId,
            senderUsername: currentUsername,
            senderProfilePic: currentProfileImage || '',
            receiverId: user._id
          })
        });

        const requestData = await response.json();
        setFriendRequests((prev) => ({ ...prev, [userId]: true }));

        // Emit socket event to notify friend request to recipient in real-time
        if (socket && socket.connected) {
          socket.emit('send_friend_request', {
            senderId: currentUserId,
            senderUsername: currentUsername,
            senderProfilePic: currentProfileImage || '',
            receiverId: user._id,
            requestId: requestData._id,
            timestamp: new Date()
          });
        }

        // Update selected user if dialog is open
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser({ ...selectedUser, friendRequestSent: true });
        }
      } catch (err) {
        console.error('Error sending friend request:', err);
      }
    }
  };

  // Remove from recent searches by userId
  const handleRemoveRecent = (userId, e) => {
    e.stopPropagation(); // Prevent opening profile
    setRecentSearches((prev) => {
      const updated = prev.filter((u) => u._id !== userId);
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId) {
        try {
          localStorage.setItem(`recentSearches_${currentUserId}`, JSON.stringify(updated));
        } catch (err) { }
        saveRecentSearchesLocally(currentUserId, updated);
      }
      return updated;
    });
  };

  const handleCancelRequest = async (userId) => {
    setFriendRequests((prev) => {
      const updated = { ...prev };
      delete updated[userId];
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId) {
        try {
          localStorage.setItem(`juicy_cached_sent_requests_${currentUserId}`, JSON.stringify(updated));
        } catch (e) { }
      }
      return updated;
    });

    // Cancel friend request in backend
    const currentUserId = localStorage.getItem('userId');
    try {
      await fetch(`${API_BASE_URL}/api/friendRequests/${currentUserId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      });

      // Update selected user if dialog is open
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, friendRequestSent: false });
      }
    } catch (err) {
      console.error('Error cancelling friend request:', err);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (userId) => {
    const currentUserId = localStorage.getItem('userId');
    // Remove from local state and SQLite
    setUserFriends((prev) => {
      const updated = prev.filter(f => f._id !== userId);
      if (currentUserId) {
        try {
          localStorage.setItem(`juicy_cached_friends_${currentUserId}`, JSON.stringify(updated));
        } catch (e) { }
        saveFriendsLocally(currentUserId, updated);
      }
      return updated;
    });

    // Remove from backend
    try {
      await fetch(`${API_BASE_URL}/api/user/${currentUserId}/remove-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId })
      });

      // Notify ChatPage and other clients about friend removal via socket
      if (socket && socket.connected) {
        socket.emit('friend_removed', {
          removedUserId: userId,
          currentUserId: currentUserId
        });
      }

      // Update selected user if dialog is open
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser });
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      // Restore the friend in local state and SQLite if delete failed
      setUserFriends((prev) => {
        const user = userFriends.find(f => f._id === userId);
        if (user) {
          const restored = [...prev, user];
          if (currentUserId) {
            try {
              localStorage.setItem(`juicy_cached_friends_${currentUserId}`, JSON.stringify(restored));
            } catch (e) { }
            saveFriendsLocally(currentUserId, restored);
          }
          return restored;
        }
        return prev;
      });
    }
  };

  // Format phone number for comparison
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  };

  // Extract phone numbers from vCard/VCF content
  const extractFromVCF = (content) => {
    const phones = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.startsWith('TEL;') || line.startsWith('TEL:')) {
        const match = line.match(/[+\d\s-()]+/g);
        if (match) {
          const number = formatPhoneNumber(match[0]);
          if (number && number.length >= 6) {
            phones.push(number);
          }
        }
      }
    }
    return phones;
  };

  // Handle file upload for contacts
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsSyncingContacts(true);
    setSyncError('');
    setSyncSuccess('');

    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const content = await file.text();
      let phoneNumbers = [];

      if (fileExt === 'csv') {
        // Parse CSV - simple line-by-line parser
        const lines = content.split('\n');
        lines.forEach(line => {
          const cells = line.split(',').map(cell => cell.trim());
          cells.forEach(cell => {
            if (typeof cell === 'string' && cell.length > 0) {
              const cleanedCell = cell.replace(/^["']|["']$/g, '');
              const numbers = cleanedCell.match(/[+\d\s-()]{6,}/g);
              if (numbers) {
                numbers.forEach(num => {
                  const cleaned = formatPhoneNumber(num);
                  if (cleaned && cleaned.length >= 6) {
                    phoneNumbers.push(cleaned);
                  }
                });
              }
            }
          });
        });
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        // Parse Excel
        const workbook = XLSX.read(content, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        data.forEach(row => {
          if (Array.isArray(row)) {
            row.forEach(cell => {
              if (typeof cell === 'string') {
                const numbers = cell.match(/[+\d\s-()]{6,}/g);
                if (numbers) {
                  numbers.forEach(num => {
                    const cleaned = formatPhoneNumber(num);
                    if (cleaned && cleaned.length >= 6) {
                      phoneNumbers.push(cleaned);
                    }
                  });
                }
              } else if (typeof cell === 'number') {
                const cleaned = formatPhoneNumber(cell.toString());
                if (cleaned && cleaned.length >= 6) {
                  phoneNumbers.push(cleaned);
                }
              }
            });
          }
        });
      } else if (fileExt === 'vcf' || fileExt === 'vcard') {
        // Parse vCard
        phoneNumbers = extractFromVCF(content);
      }

      // Remove duplicates
      phoneNumbers = [...new Set(phoneNumbers)];

      if (phoneNumbers.length === 0) {
        setSyncError('No valid phone numbers found in the file.');
        setIsSyncingContacts(false);
        return;
      }

      // Send to backend
      await searchUsersByPhones(phoneNumbers);

    } catch (error) {
      console.error('File upload error:', error);
      setSyncError(`Error parsing file: ${error.message}`);
    } finally {
      setIsSyncingContacts(false);
    }
  };

  // Search users by phone numbers
  const searchUsersByPhones = async (phoneNumbers) => {
    try {
      const currentUserId = localStorage.getItem('userId');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/api/search-by-phones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers,
          userId: currentUserId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Failed to search users by phone';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let matchedUsers = await response.json();

      // Filter out blocked users and ensure profile visibility
      if (Array.isArray(matchedUsers)) {
        matchedUsers = matchedUsers.filter(u =>
          String(u._id) !== String(currentUserId) &&
          !blockedUsers.includes(u._id) &&
          !blockedBy.includes(u._id) &&
          u.profileVisible !== false
        );
      }

      setSyncedUsers(matchedUsers);
      saveCachedUsersLocally(matchedUsers);

      if (matchedUsers.length === 0) {
        setSyncError(`No app users found among ${phoneNumbers.length} contacts.`);
      } else {
        setSyncSuccess(`Found ${matchedUsers.length} app users in your contacts!`);
        setSnackbarOpen(true);
      }

    } catch (err) {
      console.error('Error searching users:', err);
      let errorMsg = err?.message || 'Unknown error occurred';

      if (err.name === 'AbortError') {
        errorMsg = 'Request timed out. Check your internet connection.';
      } else if (errorMsg.includes('Failed to fetch')) {
        errorMsg = 'Cannot reach server. Make sure you\'re connected to the internet and the server is running.';
      }

      setSyncError(`Error: ${errorMsg}`);
    }
  };

  // Web Contact Picker API
  const handleWebContactPicker = async () => {
    setIsSyncingContacts(true);
    setSyncError('');
    setSyncSuccess('');

    try {
      if (!supportsContactPicker) {
        throw new Error('Contact Picker API not supported in this browser');
      }

      const props = ['name', 'tel'];
      const opts = { multiple: true };

      // @ts-ignore - Contact Picker API types
      const contacts = await navigator.contacts.select(props, opts);

      const phoneNumbers = [];

      for (const contact of contacts) {
        if (contact.tel && Array.isArray(contact.tel)) {
          for (const number of contact.tel) {
            const cleaned = formatPhoneNumber(number);
            if (cleaned && cleaned.length >= 6) {
              phoneNumbers.push(cleaned);
            }
          }
        }
      }

      if (phoneNumbers.length === 0) {
        setSyncError('No valid phone numbers found in selected contacts.');
        setIsSyncingContacts(false);
        return;
      }

      const uniquePhones = [...new Set(phoneNumbers)];
      await searchUsersByPhones(uniquePhones);

    } catch (error) {
      console.error('Contact picker error:', error);
      if (error.name === 'NotAllowedError') {
        setSyncError('Permission denied. Please allow contact access.');
      } else if (error.name === 'NotFoundError') {
        setSyncError('No contacts selected or found.');
      } else {
        setSyncError(`Error accessing contacts: ${error.message}`);
      }
    } finally {
      setIsSyncingContacts(false);
    }
  };

  // Try to use browser's built-in contact input
  const handleContactInput = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsSyncingContacts(true);

    try {
      const content = await file.text();
      const phoneNumbers = extractFromVCF(content);

      if (phoneNumbers.length > 0) {
        await searchUsersByPhones([...new Set(phoneNumbers)]);
      } else {
        await handleFileUpload(event);
      }
    } catch (error) {
      console.error('Contact input error:', error);
      setSyncError(`Error reading contacts: ${error.message}`);
    } finally {
      setIsSyncingContacts(false);
    }
  };

  // Fetch contacts from Android/iOS via Capacitor
  const fetchAndroidContacts = async () => {
    try {
      const isNative = typeof window !== 'undefined' && Capacitor && Capacitor.getPlatform && Capacitor.getPlatform() !== 'web';
      if (!isNative) return [];

      const ContactsModule = await import('@capacitor-community/contacts');
      const Contacts = ContactsModule.Contacts;

      const perm = await Contacts.requestPermissions();
      const granted =
        (perm === 'granted') ||
        (perm === 'limited') ||
        (perm && perm.contacts && (perm.contacts === 'granted' || perm.contacts === 'limited'));

      if (!granted) return [];

      const result = await Contacts.getContacts();
      const list = result?.contacts || result || [];

      const phoneNumbers = [];
      for (const contact of list) {
        const phones = contact.phones || contact.phoneNumbers || contact.tel || [];
        for (const p of phones) {
          const raw = (p && (p.value || p.number || p)) || '';
          const cleaned = formatPhoneNumber(raw);
          if (cleaned && cleaned.length >= 6) {
            phoneNumbers.push(cleaned);
          }
        }
      }

      return [...new Set(phoneNumbers)];
    } catch (err) {
      console.error('Android contact fetch failed:', err);
      return [];
    }
  };

  // Main sync function that handles all methods
  const handleSyncContacts = async (method = 'auto') => {
    setIsSyncingContacts(true);
    setSyncError('');
    setSyncSuccess('');
    handleMenuClose();

    try {
      let phoneNumbers = [];
      const isNative = typeof window !== 'undefined' && Capacitor && Capacitor.getPlatform && Capacitor.getPlatform() !== 'web';

      if (isNative && method !== 'file') {
        phoneNumbers = await fetchAndroidContacts();
        if (phoneNumbers.length > 0) {
          await searchUsersByPhones(phoneNumbers);
          return;
        }
      }

      if (!isNative && supportsContactPicker && method !== 'file') {
        try {
          const props = ['name', 'tel'];
          const opts = { multiple: true };
          // @ts-ignore
          const contacts = await navigator.contacts.select(props, opts);

          for (const contact of contacts) {
            if (contact.tel && Array.isArray(contact.tel)) {
              for (const number of contact.tel) {
                const cleaned = formatPhoneNumber(number);
                if (cleaned && cleaned.length >= 6) {
                  phoneNumbers.push(cleaned);
                }
              }
            }
          }

          if (phoneNumbers.length > 0) {
            phoneNumbers = [...new Set(phoneNumbers)];
            await searchUsersByPhones(phoneNumbers);
            return;
          }
        } catch (pickerError) {
          console.warn('Contact picker failed:', pickerError);
        }
      }

      if (phoneNumbers.length === 0 && method !== 'file') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.vcf,.vcard,.csv,.xlsx,.xls';
        input.onchange = handleContactInput;
        input.click();
        return;
      }

      if (phoneNumbers.length === 0 && method === 'auto') {
        setSyncError('No contacts found. Please try uploading a contacts file.');
      }

    } catch (error) {
      console.error('Contact sync error:', error);
      setSyncError(`Error: ${error.message}`);
    } finally {
      if (method !== 'file' && !supportsContactPicker) {
        setIsSyncingContacts(false);
      }
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = API_BASE_URL;

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      reconnection: true,
      autoConnect: true
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Load recent searches and friends from SQLite on mount
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    // SQLite Recent Searches
    getRecentSearchesLocally(currentUserId)
      .then((searches) => {
        if (Array.isArray(searches) && searches.length > 0) {
          setRecentSearches(searches);
        }
      })
      .catch(e => console.warn('SQLite recent searches notice:', e));

    // SQLite Friends List
    getFriendsLocally(currentUserId)
      .then((friends) => {
        if (Array.isArray(friends) && friends.length > 0) {
          setUserFriends(friends);
        }
      })
      .catch(e => console.warn('SQLite friends notice:', e));

    // SQLite Blocked Users
    getBlockedUsersLocally(currentUserId)
      .then((blocked) => {
        if (Array.isArray(blocked) && blocked.length > 0) {
          const ids = blocked.map(u => (typeof u === 'string' ? u : (u.userId || u._id || u.id)));
          setBlockedUsers(ids);
        }
      })
      .catch(e => console.warn('SQLite blocked notice:', e));
  }, []);

  // Fetch users based on search (offline-first SQLite query + online API search)
  useEffect(() => {
    let isCancelled = false;
    const fetchUsers = async () => {
      const q = search.trim();
      if (q === '') {
        setFilteredUsers([]);
        return;
      }

      const currentUserId = localStorage.getItem('userId');

      // 1. Instant offline search from local SQLite
      try {
        const localMatches = await searchCachedUsersLocally(q);
        if (!isCancelled && Array.isArray(localMatches) && localMatches.length > 0) {
          const filteredLocal = localMatches
            .filter(u => String(u._id) !== String(currentUserId))
            .filter(u => !blockedUsers.includes(u._id) && !blockedBy.includes(u._id));
          if (filteredLocal.length > 0) {
            setFilteredUsers(filteredLocal);
          }
        }
      } catch (err) {
        console.warn('SQLite search notice:', err);
      }

      // 2. Online search from backend API
      try {
        const API_URL = API_BASE_URL;
        const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}&userId=${currentUserId}`);
        let data = await res.json();
        if (!isCancelled && Array.isArray(data)) {
          if (currentUserId) {
            data = data.filter(u => String(u._id) !== String(currentUserId));
            data = data.filter(u => u.profileVisible !== false);
          }
          setFilteredUsers(data);
          // Cache discovered users into SQLite for offline availability
          saveCachedUsersLocally(data);
        }
      } catch (error) {
        console.warn('Network search unavailable, retaining offline SQLite results:', error);
      }
    };

    fetchUsers();
    return () => {
      isCancelled = true;
    };
  }, [search, blockedUsers, blockedBy]);

  // Fetch last registered users (offline-first SQLite + online API)
  useEffect(() => {
    let isCancelled = false;
    const fetchLastLogins = async () => {
      try {
        const limit = isMobile ? 15 : 20;
        const currentUserId = localStorage.getItem('userId');
        const API_URL = API_BASE_URL;

        // 1. Instant load from local SQLite cache
        try {
          const sqliteUsers = await getLastLoginsLocally(limit);
          if (!isCancelled && Array.isArray(sqliteUsers) && sqliteUsers.length > 0) {
            const filteredSqlite = sqliteUsers.filter(u => String(u._id) !== String(currentUserId));
            if (filteredSqlite.length > 0) {
              setLastLoginUsers(filteredSqlite);
            }
          }
        } catch (e) { }

        // Fallback to localStorage cache if state empty
        const cached = localStorage.getItem('cached_last_logins');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (!isCancelled && Array.isArray(parsed) && parsed.length > 0) {
              setLastLoginUsers(prev => (prev.length === 0 ? parsed : prev));
            }
          } catch (e) { }
        }

        // 2. Fetch fresh last logins from backend
        const res = await fetch(`${API_URL}/api/last-logins?limit=${limit}`);
        let data = await res.json();
        if (!isCancelled && Array.isArray(data)) {
          if (currentUserId) {
            data = data.filter(u => String(u._id) !== String(currentUserId));
            data = data.filter(u => u.profileVisible !== false);
          }
          setLastLoginUsers(data);
          try { localStorage.setItem('cached_last_logins', JSON.stringify(data)); } catch (e) { }
          // Cache in SQLite
          saveCachedUsersLocally(data);
        }
      } catch (error) {
        console.warn('Network last logins fetch failed, using offline SQLite cache:', error);
      }
    };
    fetchLastLogins();
    return () => {
      isCancelled = true;
    };
  }, [isMobile]);

  // Fetch user's friends list (network sync + SQLite persist)
  useEffect(() => {
    const fetchUserFriends = async () => {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return;

      try {
        const API_URL = API_BASE_URL;
        const res = await fetch(`${API_URL}/api/user/${currentUserId}/friends`);
        const data = await res.json();

        let friends = Array.isArray(data) ? data : [];
        friends = friends.filter(u =>
          !blockedUsers.includes(u._id) &&
          !blockedBy.includes(u._id)
        );

        setUserFriends(friends);
        try {
          localStorage.setItem(`juicy_cached_friends_${currentUserId}`, JSON.stringify(friends));
        } catch (e) { }
        // Also cache friends into SQLite
        saveFriendsLocally(currentUserId, friends);
        if (friends.length > 0) {
          saveCachedUsersLocally(friends);
        }
      } catch (error) {
        console.warn('Network friend fetch failed, retaining SQLite local cache:', error);
      }
    };

    fetchUserFriends();
  }, [blockedUsers, blockedBy]);

  // Save recentSearches to localStorage and SQLite
  useEffect(() => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return;
      localStorage.setItem(`recentSearches_${currentUserId}`, JSON.stringify(recentSearches));
      // Persist to local SQLite
      saveRecentSearchesLocally(currentUserId, recentSearches);
    } catch (e) {
      console.error('Failed to save recent searches', e);
    }
  }, [recentSearches]);

  // Validate recent searches on mount (parallelized for speed)
  useEffect(() => {
    const validateRecent = async () => {
      try {
        const currentUserId = localStorage.getItem('userId');
        if (!currentUserId) return;
        const key = `recentSearches_${currentUserId}`;
        const raw = localStorage.getItem(key);
        if (!raw) return;
        let parsed = [];
        try { parsed = JSON.parse(raw); } catch { parsed = []; }
        if (!Array.isArray(parsed) || parsed.length === 0) return;

        const API_URL = API_BASE_URL;
        const validatedResults = await Promise.all(
          parsed.map(async (item) => {
            if (!item || !item._id) return null;
            try {
              const res = await fetch(`${API_URL}/api/user/${item._id}`);
              if (res.ok) {
                return await res.json();
              } else if (res.status === 404) {
                return null;
              } else {
                return item;
              }
            } catch (err) {
              return item;
            }
          })
        );
        const validated = validatedResults.filter(Boolean);

        const same = validated.length === parsed.length && validated.every((v, i) => v._id === (parsed[i] && parsed[i]._id));
        if (!same) {
          setRecentSearches(validated);
          try { localStorage.setItem(key, JSON.stringify(validated)); } catch { }
          saveRecentSearchesLocally(currentUserId, validated);
        }
      } catch (err) {
        console.error('validateRecent error', err);
      }
    };
    validateRecent();
  }, []);

  // Fetch sent friend requests
  useEffect(() => {
    const fetchSentRequests = async () => {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return;
      try {
        const API_URL = API_BASE_URL;
        const res = await fetch(`${API_URL}/api/user/${currentUserId}`);
        const data = await res.json();
        const sentRequests = {};
        if (data.friendRequests && Array.isArray(data.friendRequests)) {
          data.friendRequests.forEach(req => {
            if (req.senderId === currentUserId) {
              sentRequests[req.receiverId] = true;
            }
            if (req.receiverId === currentUserId) {
              sentRequests[req.senderId] = true;
            }
          });
        }
        setFriendRequests(sentRequests);
        try {
          localStorage.setItem(`juicy_cached_sent_requests_${currentUserId}`, JSON.stringify(sentRequests));
        } catch (e) { }
      } catch (err) {
        console.warn('Network friend requests notice:', err);
      }
    };
    fetchSentRequests();
  }, []);

  // Fetch blocked users from network + persist to SQLite
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const API_URL = API_BASE_URL;
    fetch(`${API_URL}/api/user/${userId}/blocked`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const ids = data.map(u => (typeof u === 'string' ? u : (u.userId || u._id || u.id)));
          setBlockedUsers(ids);
          try {
            localStorage.setItem(`juicy_cached_blocked_${userId}`, JSON.stringify(data));
          } catch (e) { }
          saveBlockedUsersLocally(userId, data);
        }
      })
      .catch(err => console.warn('Network blocked fetch notice, using local SQLite cache:', err));
  }, []);

  // Fetch users who have blocked me
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const API_URL = API_BASE_URL;
    fetch(`${API_URL}/api/user/${userId}/blocked-by`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const ids = data.map(u => (typeof u === 'string' ? u : (u.userId || u._id || u.id)));
          setBlockedBy(ids);
          try {
            localStorage.setItem(`juicy_cached_blocked_by_${userId}`, JSON.stringify(data));
          } catch (e) { }
        }
      })
      .catch(err => console.warn('Network blocked-by notice:', err));
  }, []);

  // Filter suggestions
  const filteredSuggestions = lastLoginUsers.filter(
    user => !blockedUsers.includes(user._id) &&
      !blockedBy.includes(user._id) &&
      !userFriends.some(f => String(f._id) === String(user._id))
  );

  // Helper to render avatar with 3D glossy theme ring
  const renderAvatar = (user, size = 44) => {
    return (
      <Box
        sx={{
          p: '2px',
          borderRadius: '50%',
          background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff8da1 100%))',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'inline-flex'
        }}
      >
        {user && (user.profileImage || user.profilePic) ? (
          <Avatar
            src={getProfileImageSrc(user.profileImage || user.profilePic)}
            sx={{
              width: size,
              height: size,
              border: isDark ? '2px solid #1c1626' : '2px solid #ffffff'
            }}
          />
        ) : (
          <Avatar
            sx={{
              width: size,
              height: size,
              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: size > 50 ? '1.15rem' : '0.95rem',
              border: isDark ? '2px solid #1c1626' : '2px solid #ffffff'
            }}
          >
            {user?.username?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        p: 0,
        m: 0,
        bgcolor: isDark ? '#120f17' : 'var(--background-color, #fff7f9)',
        backgroundImage: isDark
          ? 'radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.03) 0%, transparent 45%)'
          : 'radial-gradient(circle at 90% 8%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 10% 65%, rgba(0, 0, 0, 0.02) 0%, transparent 45%)',
        color: 'var(--text-color, #000000)',
        fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 1050,
          mx: 'auto',
          p: isMobile ? 2 : 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2.5,
            px: 0.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '16px',
                background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              <SearchIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: isDark
                    ? 'linear-gradient(135deg, #ffffff 0%, var(--primary-color, #fda4af) 100%)'
                    : 'linear-gradient(135deg, #1e1b2e 0%, var(--primary-color, #ff2d6c) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                  fontSize: isMobile ? '1.25rem' : '1.45rem'
                }}
              >
                Search & Connect
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                Find people, sync contacts & manage friends
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Scrollable Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
              width: 0,
              height: 0,
            },
          }}
        >
          {/* Search Input Field */}
          <Paper
            elevation={0}
            sx={{
              p: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
              backdropFilter: 'blur(12px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(125, 125, 125, 0.18)',
              boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 18px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.25s ease',
              '&:focus-within': {
                borderColor: 'var(--primary-color, #ff2d6c)',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.15)',
              },
              mb: 3
            }}
          >
            <InputAdornment position="start" sx={{ pl: 1 }}>
              <SearchIcon sx={{ color: 'var(--primary-color, #ff2d6c)' }} />
            </InputAdornment>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by username or phone number..."
              variant="standard"
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: {
                  color: 'var(--text-color, #000000)',
                  px: 1,
                  py: 0.8,
                  fontSize: '0.95rem',
                }
              }}
            />
            {search && (
              <IconButton onClick={() => setSearch('')} size="small" sx={{ mr: 1, color: 'var(--primary-color, #ff2d6c)', opacity: 0.8 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Paper>

          {/* Sync Error Alert */}
          {syncError && (
            <Alert severity="error" onClose={() => setSyncError('')} sx={{ mb: 2.5, borderRadius: 3 }}>
              {syncError}
            </Alert>
          )}

          {/* SEARCH RESULTS MODE */}
          {search.trim() !== '' && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 0.6, borderRadius: '50%', background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))', color: '#fff', display: 'flex' }}>
                  <SearchIcon sx={{ fontSize: 16 }} />
                </Box>
                Search Results ({filteredUsers.length})
              </Typography>
              {filteredUsers.length > 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.82))',
                    backdropFilter: 'blur(14px)',
                    borderRadius: '24px',
                    p: 1.2,
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)',
                    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <List disablePadding>
                    {filteredUsers.map((user, index) => (
                      <React.Fragment key={user._id}>
                        <ListItem
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: '16px',
                            bgcolor: 'transparent',
                            transition: 'all 0.22s ease',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(125, 125, 125, 0.06)' }
                          }}
                          onClick={() => handleOpenProfile(user)}
                          secondaryAction={
                            <Box>
                              {userFriends.some(f => String(f._id) === String(user._id)) ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<PersonRemoveIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFriend(user._id);
                                  }}
                                  sx={{ textTransform: 'none', borderRadius: '20px', px: 2, fontWeight: 650, borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                >
                                  Remove
                                </Button>
                              ) : !friendRequests[user._id] ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PersonAddIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddFriend(user._id);
                                  }}
                                  sx={{
                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                    color: '#ffffff',
                                    '&:hover': {
                                      opacity: 0.9,
                                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)'
                                    },
                                    textTransform: 'none',
                                    borderRadius: '20px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    fontWeight: 650,
                                    px: 2.2
                                  }}
                                >
                                  Add
                                </Button>
                              ) : (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Chip
                                    label="Requested"
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: 'var(--primary-color, #ff2d6c)',
                                      bgcolor: 'rgba(125, 125, 125, 0.08)',
                                      color: 'var(--primary-color, #ff2d6c)',
                                      fontWeight: 650,
                                      borderRadius: '16px'
                                    }}
                                  />
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelRequest(user._id);
                                    }}
                                    sx={{ textTransform: 'none', borderRadius: '20px', fontWeight: 650, borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                  >
                                    Cancel
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            {renderAvatar(user, 48)}
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography fontWeight={700} color="var(--text-color, #000000)">
                                {user.name || user.username}
                              </Typography>
                            }
                            secondary={
                              <Typography fontSize={13} color="var(--text-color, #000000)" sx={{ opacity: 0.6 }}>
                                @{user.username}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < filteredUsers.length - 1 && (
                          <Divider sx={{ my: 0.5, opacity: isDark ? 0.08 : 0.15 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'rgba(255, 255, 255, 0.82)',
                    backdropFilter: 'blur(14px)',
                    borderRadius: '24px',
                    p: 4,
                    textAlign: 'center',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 105, 150, 0.15)'
                  }}
                >
                  <Typography variant="body1" color="var(--text-color, #000000)" sx={{ opacity: 0.7, fontWeight: 500 }}>
                    No users found matching "{search.trim()}"
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* NORMAL DEFAULT MODE */}
          {search.trim() === '' && (
            <>
              {/* Your Friends Section */}
              {userFriends.length > 0 && (
                <Box sx={{ width: '100%', mb: 3.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ p: 0.6, borderRadius: '50%', background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))', color: '#fff', display: 'flex' }}>
                      <GroupIcon sx={{ fontSize: 16 }} />
                    </Box>
                    Your Friends ({userFriends.length})
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.82))',
                      backdropFilter: 'blur(14px)',
                      borderRadius: '24px',
                      p: 1.2,
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)',
                      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <List disablePadding>
                      {userFriends.map((user, index) => (
                        <React.Fragment key={user._id}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: '16px',
                              cursor: 'pointer',
                              bgcolor: 'transparent',
                              transition: 'all 0.22s ease',
                              '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(125, 125, 125, 0.06)' }
                            }}
                            onClick={() => handleOpenProfile(user)}
                            secondaryAction={
                              <Chip
                                label="Friend"
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(16, 185, 129, 0.35)',
                                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                                  color: '#10b981',
                                  fontWeight: 650,
                                  borderRadius: '16px'
                                }}
                              />
                            }
                          >
                            <ListItemAvatar>
                              {renderAvatar(user, 48)}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight={700} color="var(--text-color, #000000)">
                                  {user.name || user.username}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="var(--text-color, #000000)" sx={{ opacity: 0.6 }}>
                                    @{user.username}
                                  </Typography>
                                  {user.phone && (
                                    <Typography component="span" variant="caption" display="block" color="var(--text-color, #000000)" sx={{ opacity: 0.5 }}>
                                      {user.phone}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                          {index < userFriends.length - 1 && (
                            <Divider sx={{ my: 0.5, opacity: isDark ? 0.08 : 0.15 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Synced Contacts Section */}
              {syncedUsers.length > 0 && (
                <Box sx={{ width: '100%', mb: 3.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ p: 0.6, borderRadius: '50%', background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))', color: '#fff', display: 'flex' }}>
                      <PermContactCalendarIcon sx={{ fontSize: 16 }} />
                    </Box>
                    Synced Contacts ({syncedUsers.length})
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.82))',
                      backdropFilter: 'blur(14px)',
                      borderRadius: '24px',
                      p: 1.2,
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)',
                      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <List disablePadding>
                      {syncedUsers.map((user, index) => (
                        <React.Fragment key={user._id}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: '16px',
                              cursor: 'pointer',
                              bgcolor: 'transparent',
                              transition: 'all 0.22s ease',
                              '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(125, 125, 125, 0.06)' }
                            }}
                            onClick={() => handleOpenProfile(user)}
                            secondaryAction={
                              !friendRequests[user._id] && !userFriends.some(f => String(f._id) === String(user._id)) ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PersonAddIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddFriend(user._id);
                                  }}
                                  sx={{
                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                    color: '#ffffff',
                                    '&:hover': {
                                      opacity: 0.9,
                                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)'
                                    },
                                    textTransform: 'none',
                                    borderRadius: '20px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    fontWeight: 650,
                                    px: 2.2
                                  }}
                                >
                                  Add
                                </Button>
                              ) : (
                                <Chip
                                  label={userFriends.some(f => String(f._id) === String(user._id)) ? "Friend" : "Requested"}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: userFriends.some(f => String(f._id) === String(user._id)) ? 'rgba(16, 185, 129, 0.35)' : 'var(--primary-color, #ff2d6c)',
                                    bgcolor: userFriends.some(f => String(f._id) === String(user._id)) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(125, 125, 125, 0.08)',
                                    color: userFriends.some(f => String(f._id) === String(user._id)) ? '#10b981' : 'var(--primary-color, #ff2d6c)',
                                    fontWeight: 650,
                                    borderRadius: '16px'
                                  }}
                                />
                              )
                            }
                          >
                            <ListItemAvatar>
                              {renderAvatar(user, 48)}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight={700} color="var(--text-color, #000000)">
                                  {user.name || user.username}
                                </Typography>
                              }
                              secondary={
                                <Typography fontSize={13} color="var(--text-color, #000000)" sx={{ opacity: 0.6 }}>
                                  @{user.username}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < syncedUsers.length - 1 && (
                            <Divider sx={{ my: 0.5, opacity: isDark ? 0.08 : 0.15 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <Box sx={{ width: '100%', mb: 3.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ p: 0.6, borderRadius: '50%', background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))', color: '#fff', display: 'flex' }}>
                      <HistoryIcon sx={{ fontSize: 16 }} />
                    </Box>
                    Recent Searches
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.82))',
                      backdropFilter: 'blur(14px)',
                      borderRadius: '24px',
                      p: 1.2,
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)',
                      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <List disablePadding>
                      {recentSearches.map((user, index) => (
                        <React.Fragment key={user._id}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: '16px',
                              cursor: 'pointer',
                              bgcolor: 'transparent',
                              transition: 'all 0.22s ease',
                              '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(125, 125, 125, 0.06)' }
                            }}
                            onClick={() => handleOpenProfile(user)}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={(e) => handleRemoveRecent(user._id, e)}
                                sx={{ color: isDark ? '#94a3b8' : '#a0aec0', transition: 'all 0.2s', '&:hover': { color: '#ef4444' } }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            }
                          >
                            <ListItemAvatar>
                              {renderAvatar(user, 48)}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight={700} color="var(--text-color, #000000)">
                                  {user.name || user.username}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="var(--text-color, #000000)" sx={{ opacity: 0.6 }}>
                                    @{user.username}
                                  </Typography>
                                  {user.phone && (
                                    <Typography component="span" variant="caption" display="block" color="var(--text-color, #000000)" sx={{ opacity: 0.5 }}>
                                      {user.phone}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                          {index < recentSearches.length - 1 && (
                            <Divider sx={{ my: 0.5, opacity: isDark ? 0.08 : 0.15 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Suggested Users Section */}
              {filteredSuggestions.length > 0 && (
                <Box sx={{ width: '100%', mb: 3.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ p: 0.6, borderRadius: '50%', background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))', color: '#fff', display: 'flex' }}>
                      <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                    </Box>
                    Suggested Users
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(3, 1fr)',
                        md: 'repeat(5, 1fr)'
                      },
                      gap: 2
                    }}
                  >
                    {filteredSuggestions.slice(0, 10).map((user) => (
                      <Paper
                        key={user._id}
                        elevation={0}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.82))',
                          backdropFilter: 'blur(14px)',
                          borderRadius: '24px',
                          p: 2.2,
                          cursor: 'pointer',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)',
                          boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0, 0, 0, 0.06)',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: isDark ? '0 14px 32px rgba(0,0,0,0.45)' : '0 14px 32px rgba(0, 0, 0, 0.12)',
                            borderColor: 'var(--primary-color, #ff2d6c)'
                          }
                        }}
                        onClick={() => handleOpenProfile(user)}
                      >
                        {renderAvatar(user, 56)}
                        <Typography
                          fontWeight={700}
                          fontSize={14}
                          sx={{
                            mt: 1.5,
                            textAlign: 'center',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-color, #000000)'
                          }}
                        >
                          {user.name || user.username}
                        </Typography>
                        <Typography
                          fontSize={12}
                          color="var(--text-color, #000000)"
                          sx={{
                            opacity: 0.6,
                            textAlign: 'center',
                            mb: 2,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          @{user.username}
                        </Typography>

                        {!friendRequests[user._id] ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddFriend(user._id);
                            }}
                            sx={{
                              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                              color: '#ffffff',
                              '&:hover': {
                                opacity: 0.9,
                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)'
                              },
                              textTransform: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              py: 0.7,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                              borderRadius: '20px'
                            }}
                            fullWidth
                          >
                            Add
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRequest(user._id);
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.78rem', py: 0.7, borderRadius: '20px', fontWeight: 650, borderColor: 'rgba(239, 68, 68, 0.4)' }}
                            fullWidth
                          >
                            Cancel
                          </Button>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Profile Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseProfile}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDark ? 'rgba(26, 20, 36, 0.95)' : 'var(--surface-color, rgba(255, 255, 255, 0.96))',
            backdropFilter: 'blur(20px)',
            color: 'var(--text-color, #000000)',
            boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 24px 60px rgba(0, 0, 0, 0.18)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(125, 125, 125, 0.2)',
            p: 1.5
          }
        }}
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{
              pb: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.12)'
            }}>
              <Typography variant="h6" fontWeight={750} color="var(--text-color, #000000)">
                User Profile
              </Typography>
              <IconButton onClick={handleCloseProfile} size="small" sx={{ color: isDark ? '#94a3b8' : '#a0aec0' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                {/* Profile Image */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                  <Box
                    sx={{
                      p: '4px',
                      borderRadius: '50%',
                      background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff8da1 100%))',
                      boxShadow: '0 8px 28px rgba(0, 0, 0, 0.25)',
                      display: 'inline-block'
                    }}
                  >
                    {selectedUser && (selectedUser.profileImage || selectedUser.profilePic) ? (
                      <Avatar
                        src={getProfileImageSrc(selectedUser.profileImage || selectedUser.profilePic)}
                        sx={{
                          width: 104,
                          height: 104,
                          border: isDark ? '3px solid #1a1424' : '3px solid #ffffff'
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 104,
                          height: 104,
                          background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                          color: '#ffffff',
                          fontSize: 40,
                          fontWeight: 700,
                          border: isDark ? '3px solid #1a1424' : '3px solid #ffffff'
                        }}
                      >
                        {selectedUser.username?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    )}
                  </Box>
                </Box>

                {/* User Info */}
                <Typography variant="h6" fontWeight={750} sx={{ mb: 0.5 }} color="var(--text-color, #000000)">
                  {selectedUser.name || selectedUser.username}
                </Typography>

                <Typography variant="body2" color="var(--text-color, #000000)" sx={{ opacity: 0.6, mb: 2 }}>
                  @{selectedUser.username}
                </Typography>

                {/* Bio */}
                {selectedUser.bio && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      mb: 3,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(125, 125, 125, 0.05)',
                      borderRadius: '18px',
                      width: '100%',
                      textAlign: 'center',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--text-color, #000000)',
                        fontStyle: 'italic'
                      }}
                    >
                      "{selectedUser.bio}"
                    </Typography>
                  </Paper>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                  {userFriends.some(f => String(f._id) === String(selectedUser._id)) ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<PersonRemoveIcon />}
                      onClick={() => handleRemoveFriend(selectedUser._id)}
                      sx={{ borderRadius: '16px', py: 1.2, textTransform: 'none', fontWeight: 650, borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                      Remove Friend
                    </Button>
                  ) : friendRequests[selectedUser._id] ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<PersonRemoveIcon />}
                      onClick={() => handleCancelRequest(selectedUser._id)}
                      sx={{ borderRadius: '16px', py: 1.2, textTransform: 'none', fontWeight: 650, borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                      Cancel Request
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleAddFriend(selectedUser._id)}
                      sx={{
                        background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                        color: '#ffffff',
                        '&:hover': {
                          opacity: 0.9,
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                        },
                        borderRadius: '16px',
                        py: 1.3,
                        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                        textTransform: 'none',
                        fontWeight: 700
                      }}
                    >
                      Add Friend
                    </Button>
                  )}

                  <Button
                    fullWidth
                    variant="text"
                    onClick={handleCloseProfile}
                    sx={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      borderRadius: '16px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: '18px',
            bgcolor: isDark ? '#1a1424' : 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            border: '1.5px solid var(--primary-color, #ff2d6c)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)'
          }}
        >
          {syncSuccess}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SearchPage;