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

const SearchPage = () => {
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState({});
  const [lastLoginUsers, setLastLoginUsers] = useState([]);
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
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);
  
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

  // User's friends
  const [userFriends, setUserFriends] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    setRecentSearches((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleCancelRequest = async (userId) => {
    setFriendRequests((prev) => {
      const updated = { ...prev };
      delete updated[userId];
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
    // Remove from local state
    setUserFriends((prev) => prev.filter(f => f._id !== userId));
    
    // Remove from backend
    const currentUserId = localStorage.getItem('userId');
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
      // Restore the friend in local state if delete failed
      setUserFriends((prev) => {
        const user = userFriends.find(f => f._id === userId);
        if (user) {
          return [...prev, user];
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

  // Fetch users based on search
  useEffect(() => {
    const fetchUsers = async () => {
      if (search.trim() === '') {
        setFilteredUsers([]);
        return;
      }

      try {
        const currentUserId = localStorage.getItem('userId');
        const API_URL = API_BASE_URL;
        const res = await fetch(`${API_URL}/api/users/search?q=${search}&userId=${currentUserId}`);
        let data = await res.json();
        if (Array.isArray(data) && currentUserId) {
          data = data.filter(u => String(u._id) !== String(currentUserId));
          data = data.filter(u => u.profileVisible !== false);
        }
        setFilteredUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setFilteredUsers([]);
      }
    };

    fetchUsers();
  }, [search]);

  // Fetch last registered users
  useEffect(() => {
    const fetchLastLogins = async () => {
      try {
        const limit = isMobile ? 15 : 20;
        const currentUserId = localStorage.getItem('userId');
        const API_URL = API_BASE_URL;

        // Instant load from local cache if available
        const cached = localStorage.getItem('cached_last_logins');
        if (cached) {
          try {
            setLastLoginUsers(JSON.parse(cached));
          } catch (e) {}
        }

        const res = await fetch(`${API_URL}/api/last-logins?limit=${limit}`);
        let data = await res.json();
        if (Array.isArray(data) && currentUserId) {
          data = data.filter(u => String(u._id) !== String(currentUserId));
          data = data.filter(u => u.profileVisible !== false);
        }
        setLastLoginUsers(data);
        try { localStorage.setItem('cached_last_logins', JSON.stringify(data)); } catch (e) {}
      } catch (error) {
        console.error('Error fetching last logins:', error);
      }
    };
    fetchLastLogins();
  }, [isMobile]);

  // Fetch user's friends list
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
      } catch (error) {
        console.error('Error fetching user friends:', error);
        setUserFriends([]);
      }
    };
    
    fetchUserFriends();
  }, [blockedUsers, blockedBy]);

  // Save recentSearches to localStorage
  useEffect(() => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return;
      localStorage.setItem(`recentSearches_${currentUserId}`, JSON.stringify(recentSearches));
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
          try { localStorage.setItem(key, JSON.stringify(validated)); } catch {}
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
      } catch (err) {
        console.error('Error fetching sent friend requests:', err);
      }
    };
    fetchSentRequests();
  }, []);

  // Fetch blocked users
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const API_URL = API_BASE_URL;
    fetch(`${API_URL}/api/user/${userId}/blocked`)
      .then(res => res.json())
      .then(data => setBlockedUsers(data.map(u => u.userId)))
      .catch(err => console.error('Error fetching blocked users:', err));
  }, []);

  // Fetch users who have blocked me
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const API_URL = API_BASE_URL;
    fetch(`${API_URL}/api/user/${userId}/blocked-by`)
      .then(res => res.json())
      .then(data => setBlockedBy(data.map(u => u.userId)))
      .catch(err => console.error('Error fetching blocked by:', err));
  }, []);

  // Filter suggestions
  const filteredSuggestions = lastLoginUsers.filter(
    user => !blockedUsers.includes(user._id) && 
            !blockedBy.includes(user._id) &&
            !userFriends.some(f => String(f._id) === String(user._id))
  );

  // Helper to render avatar with default theme colors
  const renderAvatar = (user, size = 44) => {
    if (user && user.profileImage) {
      return (
        <Avatar 
          src={user.profileImage} 
          sx={{ 
            width: size, 
            height: size, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '2px solid var(--surface-color, #ffffff)' 
          }} 
        />
      );
    }
    return (
      <Avatar 
        sx={{ 
          width: size, 
          height: size, 
          bgcolor: 'var(--primary-color, #f06292)', 
          color: '#ffffff',
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '2px solid var(--surface-color, #ffffff)'
        }}
      >
        {user?.username?.charAt(0)?.toUpperCase() || '?'}
      </Avatar>
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
        bgcolor: 'var(--background-color, #fff6f8)',
        color: 'var(--text-color, #000000)',
        fontFamily: 'var(--app-font, "Poppins", sans-serif)',
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
                width: 42,
                height: 42,
                borderRadius: '12px',
                bgcolor: 'var(--primary-color, #f06292)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            >
              <SearchIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-color, #000)', lineHeight: 1.2 }}>
                Search & Connect
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-color, #000)', opacity: 0.6 }}>
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
              p: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '16px',
              bgcolor: 'var(--surface-color, #ffffff)',
              border: '1px solid rgba(128,128,128,0.18)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: 'var(--primary-color, #f06292)',
                boxShadow: '0 4px 20px rgba(240, 98, 146, 0.18)',
              },
              mb: 3
            }}
          >
            <InputAdornment position="start" sx={{ pl: 1.5 }}>
              <SearchIcon sx={{ color: 'var(--primary-color, #f06292)' }} />
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
              <IconButton onClick={() => setSearch('')} size="small" sx={{ mr: 1, color: 'var(--text-color, #000)', opacity: 0.6 }}>
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
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'var(--text-color, #000)', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" sx={{ color: 'var(--primary-color, #f06292)' }} />
                Search Results ({filteredUsers.length})
              </Typography>
              {filteredUsers.length > 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'var(--surface-color, #ffffff)',
                    borderRadius: 3,
                    p: 1,
                    border: '1px solid rgba(128,128,128,0.12)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                  }}
                >
                  <List disablePadding>
                    {filteredUsers.map((user, index) => (
                      <React.Fragment key={user._id}>
                        <ListItem 
                          sx={{ 
                            px: 2, 
                            py: 1.5,
                            borderRadius: 2,
                            bgcolor: 'transparent',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(240, 98, 146, 0.06)' }
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
                                  sx={{ textTransform: 'none', borderRadius: 5, px: 2 }}
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
                                    bgcolor: 'var(--primary-color, #f06292)',
                                    color: '#ffffff',
                                    '&:hover': {
                                      bgcolor: 'var(--primary-color, #f06292)',
                                      filter: 'brightness(0.9)'
                                    },
                                    textTransform: 'none',
                                    borderRadius: 5,
                                    boxShadow: 'none',
                                    px: 2
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
                                      borderColor: 'var(--primary-color, #f06292)', 
                                      color: 'var(--primary-color, #f06292)',
                                      fontWeight: 600
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
                                    sx={{ textTransform: 'none', borderRadius: 5 }}
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
                              <Typography fontWeight={600} color="var(--text-color, #000000)">
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
                          <Divider sx={{ my: 0.5, opacity: 0.4 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'var(--surface-color, #ffffff)',
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    border: '1px solid rgba(128,128,128,0.12)'
                  }}
                >
                  <Typography variant="body1" color="var(--text-color, #000000)" sx={{ opacity: 0.7 }}>
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
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'var(--text-color, #000)', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" sx={{ color: 'var(--primary-color, #f06292)' }} />
                    Your Friends ({userFriends.length})
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'var(--surface-color, #ffffff)',
                      borderRadius: 3,
                      p: 1,
                      border: '1px solid rgba(128,128,128,0.12)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                    }}
                  >
                    <List disablePadding>
                      {userFriends.map((user, index) => (
                        <React.Fragment key={user._id}>
                          <ListItem 
                            sx={{ 
                              px: 2, 
                              py: 1.5,
                              borderRadius: 2,
                              cursor: 'pointer',
                              bgcolor: 'transparent',
                              transition: 'all 0.2s ease',
                              '&:hover': { bgcolor: 'rgba(240, 98, 146, 0.06)' }
                            }}
                            onClick={() => handleOpenProfile(user)}
                            secondaryAction={
                              <Chip
                                label="Friend"
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'var(--primary-color, #f06292)',
                                  color: 'var(--primary-color, #f06292)',
                                  fontWeight: 600,
                                  borderRadius: 5
                                }}
                              />
                            }
                          >
                            <ListItemAvatar>
                              {renderAvatar(user, 48)}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight={600} color="var(--text-color, #000000)">
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
                            <Divider sx={{ my: 0.5, opacity: 0.4 }} />
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
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'var(--text-color, #000)', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PermContactCalendarIcon fontSize="small" sx={{ color: 'var(--primary-color, #f06292)' }} />
                    Synced Contacts ({syncedUsers.length})
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'var(--surface-color, #ffffff)',
                      borderRadius: 3,
                      p: 1,
                      border: '1px solid rgba(128,128,128,0.12)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                    }}
                  >
                    <List disablePadding>
                      {syncedUsers.map((user, index) => (
                        <React.Fragment key={user._id}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 2,
                              cursor: 'pointer',
                              bgcolor: 'transparent',
                              transition: 'all 0.2s ease',
                              '&:hover': { bgcolor: 'rgba(240, 98, 146, 0.06)' }
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
                                    bgcolor: 'var(--primary-color, #f06292)',
                                    color: '#ffffff',
                                    textTransform: 'none',
                                    borderRadius: 5,
                                    boxShadow: 'none',
                                    px: 2
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
                                    borderColor: 'var(--primary-color, #f06292)',
                                    color: 'var(--primary-color, #f06292)',
                                    fontWeight: 600
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
                                <Typography fontWeight={600} color="var(--text-color, #000000)">
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
                            <Divider sx={{ my: 0.5, opacity: 0.4 }} />
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
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'var(--text-color, #000)', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon fontSize="small" sx={{ color: 'var(--primary-color, #f06292)' }} />
                    Recent Searches
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: 'var(--surface-color, #ffffff)',
                      borderRadius: 3,
                      p: 1,
                      border: '1px solid rgba(128,128,128,0.12)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                    }}
                  >
                    <List disablePadding>
                      {recentSearches.map((user, index) => (
                        <React.Fragment key={user._id}>
                          <ListItem
                            sx={{ 
                              px: 2, 
                              py: 1.5,
                              borderRadius: 2,
                              cursor: 'pointer',
                              bgcolor: 'transparent',
                              transition: 'all 0.2s ease',
                              '&:hover': { bgcolor: 'rgba(240, 98, 146, 0.06)' }
                            }}
                            onClick={() => handleOpenProfile(user)}
                            secondaryAction={
                              <IconButton 
                                edge="end" 
                                onClick={(e) => handleRemoveRecent(user._id, e)}
                                sx={{ color: 'var(--text-color, #000000)', opacity: 0.5 }}
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
                                <Typography fontWeight={600} color="var(--text-color, #000000)">
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
                            <Divider sx={{ my: 0.5, opacity: 0.4 }} />
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
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'var(--text-color, #000)', opacity: 0.7, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon fontSize="small" sx={{ color: 'var(--primary-color, #f06292)' }} />
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
                          bgcolor: 'var(--surface-color, #ffffff)',
                          borderRadius: 3,
                          p: 2,
                          cursor: 'pointer',
                          border: '1px solid rgba(128,128,128,0.12)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            borderColor: 'var(--primary-color, #f06292)'
                          }
                        }}
                        onClick={() => handleOpenProfile(user)}
                      >
                        {renderAvatar(user, 56)}
                        <Typography
                          fontWeight={600}
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
                              bgcolor: 'var(--primary-color, #f06292)',
                              color: '#ffffff',
                              '&:hover': { 
                                bgcolor: 'var(--primary-color, #f06292)',
                                filter: 'brightness(0.9)'
                              },
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              py: 0.6,
                              boxShadow: 'none',
                              borderRadius: 5
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
                            sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.6, borderRadius: 5 }}
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
            borderRadius: 4,
            bgcolor: 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            p: 1
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
              borderBottom: '1px solid rgba(128,128,128,0.12)'
            }}>
              <Typography variant="h6" fontWeight={700} color="var(--text-color, #000000)">
                User Profile
              </Typography>
              <IconButton onClick={handleCloseProfile} size="small" sx={{ color: 'var(--text-color, #000000)', opacity: 0.6 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                {/* Profile Image */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                  {selectedUser.profileImage ? (
                    <Avatar
                      src={selectedUser.profileImage}
                      sx={{
                        width: 110,
                        height: 110,
                        border: '4px solid var(--primary-color, #f06292)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 110,
                        height: 110,
                        bgcolor: 'var(--primary-color, #f06292)',
                        color: '#ffffff',
                        fontSize: 42,
                        fontWeight: 700,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
                      }}
                    >
                      {selectedUser.username?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  )}
                </Box>
                
                {/* User Info */}
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }} color="var(--text-color, #000000)">
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
                      p: 1.5,
                      mb: 3,
                      bgcolor: 'rgba(240, 98, 146, 0.05)',
                      borderRadius: 3,
                      width: '100%',
                      textAlign: 'center',
                      border: '1px solid rgba(240, 98, 146, 0.15)'
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
                      sx={{ borderRadius: 5, py: 1, textTransform: 'none', fontWeight: 600 }}
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
                      sx={{ borderRadius: 5, py: 1, textTransform: 'none', fontWeight: 600 }}
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
                        bgcolor: 'var(--primary-color, #f06292)',
                        color: '#ffffff',
                        '&:hover': {
                          bgcolor: 'var(--primary-color, #f06292)',
                          filter: 'brightness(0.9)'
                        },
                        borderRadius: 5,
                        py: 1,
                        boxShadow: 'none',
                        textTransform: 'none',
                        fontWeight: 600
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
                      color: 'var(--text-color, #000000)',
                      opacity: 0.7,
                      borderRadius: 5,
                      textTransform: 'none'
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
            borderRadius: 3, 
            bgcolor: 'var(--surface-color, #ffffff)', 
            color: 'var(--text-color, #000000)',
            border: '1px solid var(--primary-color, #f06292)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          }}
        >
          {syncSuccess}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SearchPage;