import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Fab,
  TextField,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { Capacitor } from '@capacitor/core';
import API_BASE_URL from '../config/apiConfig';

// WhatsApp Theme Colors for consistency
const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_GRAY = '#F0F2F5';

const ContactSyncDialog = ({ open, onClose, onSelectUser, onSelectAllUsers }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedUsers, setSyncedUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = syncedUsers.filter(user => {
    const q = searchQuery.toLowerCase();
    const nameMatch = user.username && user.username.toLowerCase().includes(q);
    const phoneMatch = user.phone && user.phone.includes(q);
    return nameMatch || phoneMatch;
  });

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  const fetchAndroidContacts = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      if (!isNative) return [];

      // Dynamic import to avoid web build errors
      const ContactsModule = await import('@capacitor-community/contacts');
      const Contacts = ContactsModule.Contacts;

      // Request permissions
      const perm = await Contacts.requestPermissions();
      const granted =
        perm === 'granted' ||
        perm === 'limited' ||
        (perm && perm.contacts && (perm.contacts === 'granted' || perm.contacts === 'limited'));

      if (!granted) return [];

      // Fetch all contacts
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

  const handleSync = async () => {
    setIsSyncing(true);
    setError('');
    setSuccess('');
    setSyncedUsers([]);

    const currentUserId = localStorage.getItem('userId');

    try {
      let phoneNumbers = [];
      const isNative = Capacitor.isNativePlatform();
      const supportsContactPicker = 'contacts' in navigator && 'ContactsManager' in window;

      if (isNative) {
        phoneNumbers = await fetchAndroidContacts();
      } else if (supportsContactPicker) {
        try {
          const props = ['name', 'tel'];
          const opts = { multiple: true };
          const contacts = await navigator.contacts.select(props, opts);
          for (const contact of contacts) {
            const phones = contact.tel || contact.phones || contact.phoneNumbers || [];
            const phonesArr = Array.isArray(phones) ? phones : [phones];
            for (const p of phonesArr) {
              const raw = (p && (p.value || p.number || p)) || '';
              const cleaned = formatPhoneNumber(raw);
              if (cleaned && cleaned.length >= 6) phoneNumbers.push(cleaned);
            }
          }
        } catch (e) {
          console.warn('Web contact picker failed', e);
        }
      }

      // Fallback: check localStorage for previously synced contacts if none found
      if (phoneNumbers.length === 0 && currentUserId) {
        const saved = localStorage.getItem(`synced_phone_numbers_${currentUserId}`);
        if (saved) {
          try {
            phoneNumbers = JSON.parse(saved);
          } catch (e) {
            console.error('Failed to parse cached phone numbers', e);
          }
        }
      }

      if (phoneNumbers.length === 0) {
        setError('No contacts found. Please try again or check permissions.');
        setIsSyncing(false);
        return;
      }

      // Search registered users
      const response = await fetch(`${API_BASE_URL}/api/search-by-phones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers: [...new Set(phoneNumbers)],
          userId: currentUserId
        })
      });

      if (!response.ok) throw new Error('Failed to sync with server');

      const matchedUsers = await response.json();
      setSyncedUsers(matchedUsers);

      if (matchedUsers.length === 0) {
        setError('No app users found in your contacts.');
      } else {
        setSuccess(`Found ${matchedUsers.length} users!`);
        if (phoneNumbers && phoneNumbers.length > 0 && currentUserId) {
          localStorage.setItem(`synced_phone_numbers_${currentUserId}`, JSON.stringify(phoneNumbers));
        }
        if (onSelectAllUsers) {
          onSelectAllUsers(matchedUsers);
        }
      }
    } catch (err) {
      setError(err.message || 'Error occurred during sync');
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: WHATSAPP_GREEN,
        color: 'white',
        py: 2
      }}>
        <Typography variant="h6" fontWeight={700}>Select Contact</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={isSyncing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={handleSync}
            disabled={isSyncing}
            sx={{
              bgcolor: WHATSAPP_GREEN,
              '&:hover': { bgcolor: '#128C7E' },
              borderRadius: 2,
              textTransform: 'none',
              py: 1.5,
              fontWeight: 600
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync Contacts from Phone'}
          </Button>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search contacts or numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
            size="small"
          />

          {filteredUsers.length > 0 && onSelectAllUsers && (
            <Button
              variant="outlined"
              onClick={() => onSelectAllUsers(filteredUsers)}
              sx={{
                color: WHATSAPP_GREEN,
                borderColor: WHATSAPP_GREEN,
                '&:hover': { borderColor: '#128C7E', bgcolor: 'rgba(37, 211, 102, 0.04)' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Select All {filteredUsers.length} Contact{filteredUsers.length !== 1 ? 's' : ''}
            </Button>
          )}

          {error && <Alert severity="info" sx={{ borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="textSecondary">REGISTERED CONTACTS</Typography>
          </Divider>

          <List sx={{ pt: 0 }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => onSelectUser(user)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': { bgcolor: WHATSAPP_GRAY }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.profileImage} sx={{ width: 48, height: 48 }}>
                      {user.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={user.phone}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <IconButton color="primary">
                    <PersonAddIcon />
                  </IconButton>
                </ListItem>
              ))
            ) : (
              !isSyncing && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">
                    {syncedUsers.length > 0
                      ? "No contacts match your search."
                      : "No contacts synced yet. Click the button above to find your friends on Juicy."}
                  </Typography>
                </Box>
              )
            )}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSyncDialog;
