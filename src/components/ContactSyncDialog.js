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
          borderRadius: '28px',
          maxHeight: '88vh',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF9FB 55%, #FFF1F6 100%)',
          border: '1px solid rgba(255, 92, 147, 0.18)',
          boxShadow:
            '0 24px 70px rgba(205, 105, 140, 0.20), 0 8px 24px rgba(120, 70, 90, 0.08)',
          overflow: 'hidden',
          position: 'relative',
        }
      }}
      sx={{
        '& .MuiBackdrop-root': {
          background: 'rgba(70, 45, 60, 0.18)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F9 100%)',
          borderBottom: '1px solid rgba(255, 92, 147, 0.12)',
          py: 2.5,
          px: 3,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: '10%',
            width: '80%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 92, 147, 0.30), transparent)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* 3D pink icon badge */}
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            background: 'linear-gradient(145deg, #FF72A3, #FF3F7D)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 8px 18px rgba(255, 72, 130, 0.25), inset 0 2px 4px rgba(255,255,255,0.45)',
            transform: 'perspective(400px) rotateY(-8deg)',
          }}>
            <PersonAddIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              component="div"
              variant="h6"
              fontWeight={800}
              sx={{
                color: '#34344A',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              Select Contact
            </Typography>
            <Typography variant="caption" sx={{ color: '#E95686', fontWeight: 600 }}>
              {syncedUsers.length > 0 ? `${syncedUsers.length} found on Juicy` : 'Sync your contacts'}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#77778A',
            background: '#FFF7FA',
            border: '1px solid rgba(255, 92, 147, 0.15)',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#E93673',
              background: '#FFE6EF',
              transform: 'rotate(90deg) scale(1.05)',
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Body ── */}
      <DialogContent
        sx={{
          p: 0,
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            background: '#F4A3BD',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* ── Sync Button ── */}
          <Button
            variant="contained"
            startIcon={
              isSyncing
                ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                : <RefreshIcon />
            }
            onClick={handleSync}
            disabled={isSyncing}
            sx={{
              background: isSyncing
                ? 'linear-gradient(135deg, #FF9EBD, #FF6A9D)'
                : 'linear-gradient(135deg, #FF6A9D, #FF4F87, #F63D78)',
              borderRadius: '16px',
              textTransform: 'none',
              py: 1.6,
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.03em',
              color: '#fff',
              border: 'none',
              boxShadow:
                '0 8px 20px rgba(255, 79, 135, 0.28), inset 0 2px 3px rgba(255,255,255,0.35)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover:not(:disabled)': {
                background: 'linear-gradient(135deg, #FF85B8, #FF6A9D, #F63D78)',
                boxShadow:
                  '0 12px 28px rgba(255, 79, 135, 0.40), inset 0 2px 3px rgba(255,255,255,0.35)',
                transform: 'translateY(-2px)',
              },
              '&:active:not(:disabled)': {
                transform: 'translateY(1px)',
                boxShadow: '0 4px 12px rgba(255, 79, 135, 0.25)',
              },
              '&:disabled': {
                opacity: 0.75,
                color: '#fff',
              }
            }}
          >
            {isSyncing ? 'Syncing Contacts…' : '⟳  Sync Contacts from Phone'}
          </Button>

          {/* ── Search ── */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search contacts or numbers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#FF4F87', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '16px',
                color: '#4A4A5A',
                background: '#FFFFFF',
                border: '1px solid rgba(80, 80, 100, 0.10)',
                boxShadow: '0 4px 14px rgba(180, 120, 140, 0.08)',
                transition: 'all 0.2s ease',
                '& fieldset': { border: 'none' },
                '&:hover': {
                  border: '1px solid rgba(255, 79, 135, 0.30)',
                  boxShadow: '0 4px 16px rgba(180, 120, 140, 0.12)',
                },
                '&.Mui-focused': {
                  border: '1px solid rgba(255, 79, 135, 0.45)',
                  boxShadow: '0 0 0 4px rgba(255, 79, 135, 0.08)',
                },
              }
            }}
            inputProps={{ style: { color: '#4A4A5A' } }}
            sx={{
              '& .MuiInputBase-input::placeholder': { color: '#9B9BAA', opacity: 1 },
            }}
            size="small"
          />

          {/* ── Select All ── */}
          {filteredUsers.length > 0 && onSelectAllUsers && (
            <Button
              variant="outlined"
              onClick={() => onSelectAllUsers(filteredUsers)}
              sx={{
                color: '#E93673',
                borderColor: '#FFD0DF',
                background: '#FFF7FA',
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 10px rgba(255, 79, 135, 0.08)',
                '&:hover': {
                  borderColor: '#FF4F87',
                  background: '#FFEAF1',
                  boxShadow: '0 4px 16px rgba(255, 79, 135, 0.16)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              ✓ Select All {filteredUsers.length} Contact{filteredUsers.length !== 1 ? 's' : ''}
            </Button>
          )}

          {/* ── Error Alert ── */}
          {error && (
            <Alert
              severity="info"
              sx={{
                borderRadius: '14px',
                background: '#F3F8FF',
                border: '1px solid #D8E8F8',
                color: '#52708E',
                '& .MuiAlert-icon': { color: '#7AADD4' }
              }}
            >
              {error}
            </Alert>
          )}

          {/* ── Success Alert ── */}
          {success && (
            <Alert
              severity="success"
              sx={{
                borderRadius: '14px',
                background: '#FFF0F6',
                border: '1px solid #FFD2E1',
                color: '#D93F70',
                '& .MuiAlert-icon': { color: '#F05A8A' }
              }}
            >
              {success}
            </Alert>
          )}

          {/* ── Registered Contacts Divider ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 0.5 }}>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(233,86,134,0.22))' }} />
            <Typography
              variant="caption"
              sx={{
                color: '#E95686',
                fontWeight: 700,
                letterSpacing: '0.14em',
                fontSize: '0.65rem',
              }}
            >
              REGISTERED CONTACTS
            </Typography>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(233,86,134,0.22), transparent)' }} />
          </Box>

          {/* ── Loading Skeleton ── */}
          {isSyncing && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #FCEAF1, #FFF3F7)',
                    border: '1px solid rgba(220, 150, 175, 0.14)',
                    animation: 'juicyPulse 1.6s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                    '@keyframes juicyPulse': {
                      '0%, 100%': { opacity: 0.5 },
                      '50%': { opacity: 0.9 },
                    }
                  }}
                >
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #F9DCE7, #FCEAF1)' }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ height: 12, width: '55%', borderRadius: 6, background: 'linear-gradient(90deg, #F9DCE7, #FFF3F7)', mb: 0.8 }} />
                    <Box sx={{ height: 10, width: '38%', borderRadius: 6, background: 'linear-gradient(90deg, #FFF3F7, #FCEAF1)' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* ── Contact List ── */}
          <List sx={{ pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, idx) => (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => onSelectUser(user)}
                  disableGutters
                  sx={{
                    borderRadius: '18px',
                    px: 1.5,
                    py: 1,
                    background: '#FFFFFF',
                    border: '1px solid rgba(220, 150, 175, 0.14)',
                    boxShadow: '0 5px 16px rgba(190, 120, 145, 0.08)',
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    animationDelay: `${idx * 0.04}s`,
                    '&:hover': {
                      background: '#FFF8FB',
                      border: '1px solid rgba(255, 79, 135, 0.25)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 24px rgba(255, 79, 135, 0.12)',
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                      boxShadow: '0 3px 10px rgba(255, 79, 135, 0.08)',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={user.profileImage}
                      sx={{
                        width: 48,
                        height: 48,
                        border: '3px solid #FFFFFF',
                        boxShadow: '0 5px 12px rgba(255, 79, 135, 0.22)',
                        background: 'linear-gradient(145deg, #FF75A5, #FF4B85)',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: '#fff',
                      }}
                    >
                      {user.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={user.phone}
                    primaryTypographyProps={{
                      fontWeight: 700,
                      color: '#34344A',
                      fontSize: '0.95rem',
                    }}
                    secondaryTypographyProps={{
                      color: '#9292A3',
                      fontSize: '0.78rem',
                    }}
                  />
                  <IconButton
                    sx={{
                      color: '#F0447D',
                      background: '#FFF0F5',
                      border: '1px solid #FFD3E0',
                      borderRadius: '12px',
                      width: 36,
                      height: 36,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: '#FFE2EC',
                        boxShadow: '0 4px 14px rgba(255, 79, 135, 0.20)',
                        transform: 'scale(1.08)',
                      }
                    }}
                  >
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ))
            ) : (
              !isSyncing && (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  {/* 3D floating contact-book icon */}
                  <Box sx={{
                    width: 78,
                    height: 78,
                    borderRadius: '22px',
                    background: 'linear-gradient(145deg, #FFE6EF, #FFF7FA)',
                    border: '1px solid #FFD1E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow:
                      '0 12px 28px rgba(255, 79, 135, 0.14), 0 0 0 6px rgba(255, 79, 135, 0.05)',
                    transform: 'perspective(500px) rotateY(-6deg) rotateX(3deg)',
                    mb: 0.5,
                  }}>
                    <PersonAddIcon sx={{ color: '#F05A8A', fontSize: 34 }} />
                  </Box>
                  <Typography
                    sx={{
                      color: '#77778A',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      maxWidth: 260,
                      lineHeight: 1.5,
                    }}
                  >
                    {syncedUsers.length > 0
                      ? 'No contacts match your search.'
                      : 'No contacts synced yet. Tap Sync to find your friends on Juicy.'}
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
