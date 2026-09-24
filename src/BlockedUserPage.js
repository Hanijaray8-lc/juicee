import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Snackbar,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './config/apiConfig';
import {
  initOfflineDb,
  getBlockedUsersLocally,
  saveBlockedUsersLocally,
  removeBlockedUserLocally
} from './db/offlineDb';
import { getProfileImageSrc } from './utils/imageUtils';

const BlockedUsersPage = () => {
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  // Instant synchronous initial load from cache
  const [blockedUsers, setBlockedUsers] = useState(() => {
    if (!userId) return [];
    try {
      const cached = localStorage.getItem(`juicy_cached_blocked_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load from SQLite and sync with server in background
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    // 1. Fast SQLite local database read
    const loadFromSqlite = async () => {
      try {
        await initOfflineDb();
        const sqliteBlocked = await getBlockedUsersLocally(userId);
        if (isMounted && Array.isArray(sqliteBlocked)) {
          if (sqliteBlocked.length > 0) {
            setBlockedUsers(sqliteBlocked);
          }
        }
      } catch (err) {
        console.warn('SQLite blocked users load notice:', err);
      }
    };

    loadFromSqlite();

    // 2. Background server fetch
    fetch(`${API_BASE_URL}/api/user/${userId}/blocked`)
      .then(res => res.json())
      .then(async data => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setBlockedUsers(data);
          await saveBlockedUsersLocally(userId, data);
        }
      })
      .catch(err => {
        console.warn('Network blocked users fetch notice (using SQLite offline data):', err);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleUnblockClick = (user) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  // Optimistic Offline-First Unblock
  const handleUnblockConfirm = async () => {
    if (!selectedUser) return;
    const targetUserId = selectedUser.userId || selectedUser._id || selectedUser.id;
    const targetUsername = selectedUser.username || selectedUser.name || 'User';

    // 1. Optimistically update local React state (0ms latency)
    setBlockedUsers(prev => prev.filter(u => String(u.userId || u._id || u.id) !== String(targetUserId)));
    setConfirmOpen(false);
    setSelectedUser(null);
    setSnackbar({ open: true, message: `${targetUsername} unblocked successfully`, severity: 'success' });

    // 2. Persist update to SQLite database & localStorage
    await removeBlockedUserLocally(userId, targetUserId);

    // 3. Sync to backend API in background
    try {
      await fetch(`${API_BASE_URL}/api/user/${userId}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unblockUserId: targetUserId }),
      });
    } catch (err) {
      console.warn('Background unblock sync notice (updated in SQLite):', err);
    }
  };

  const handleUnblockCancel = () => {
    setConfirmOpen(false);
    setSelectedUser(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #fff5f8 0%, #fdf0f5 40%, #fbebf1 100%)',
        color: '#2b1736',
        position: 'relative',
        overflowX: 'hidden',
        pb: 6
      }}
    >
      {/* Subtle Ambient Decorative Glowing Spheres */}
      <Box
        sx={{
          position: 'fixed',
          top: '-80px',
          right: '-60px',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 105, 180, 0.18) 0%, rgba(255, 192, 203, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(30px)'
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: '10%',
          left: '-80px',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240, 98, 146, 0.14) 0%, rgba(255, 192, 203, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(30px)'
        }}
      />

      {/* Main Responsive Content Container */}
      <Box
        sx={{
          maxWidth: 600,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          pt: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Elevated 3D Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            pt: 1,
            pb: 1
          }}
        >
          <IconButton
            onClick={() => navigate('/chat?tab=settings')}
            sx={{
              mr: 2,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #ffffff, #ffeef4)',
              boxShadow: '0 6px 16px -2px rgba(240, 98, 146, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(240, 98, 146, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              color: '#f06292',
              transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                transform: 'scale(1.06)',
                background: 'linear-gradient(145deg, #ffffff, #ffe4ee)',
                boxShadow: '0 8px 20px -2px rgba(240, 98, 146, 0.32)'
              },
              '&:active': {
                transform: 'scale(0.92)'
              }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 22 }} />
          </IconButton>

          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.25rem', sm: '1.35rem' },
                letterSpacing: '-0.02em',
                color: '#2b1736',
                lineHeight: 1.2
              }}
            >
              Blocked Users
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#8b738e',
                fontWeight: 600,
                fontSize: '0.78rem'
              }}
            >
              {blockedUsers.length === 1 ? '1 user blocked' : `${blockedUsers.length} users blocked`}
            </Typography>
          </Box>
        </Box>

        {/* User List or Empty State */}
        {blockedUsers.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              py: { xs: 8, sm: 10 },
              px: 3,
              borderRadius: '28px',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 245, 248, 0.68) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 12px 32px -8px rgba(240, 98, 146, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
              mt: 2
            }}
          >
            {/* Glossy 3D Shield Illustration */}
            <Box
              sx={{
                position: 'relative',
                width: 110,
                height: 110,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2.5
              }}
            >
              {/* Soft Pink Circular Glow */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(240, 98, 146, 0.22) 0%, rgba(255, 240, 245, 0) 70%)',
                  animation: 'juicyShieldPulse 3s infinite ease-in-out',
                  '@keyframes juicyShieldPulse': {
                    '0%': { transform: 'scale(0.95)', opacity: 0.7 },
                    '50%': { transform: 'scale(1.1)', opacity: 1 },
                    '100%': { transform: 'scale(0.95)', opacity: 0.7 }
                  }
                }}
              />
              {/* 3D Shield Badge Container */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '26px',
                  background: 'linear-gradient(145deg, #ffffff 0%, #ffeaf1 100%)',
                  boxShadow: '0 12px 28px -4px rgba(240, 98, 146, 0.28), inset 0 2px 3px rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(240, 98, 146, 0.15)',
                  border: '1.5px solid rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <ShieldRoundedIcon
                  sx={{
                    fontSize: 44,
                    color: '#f06292',
                    filter: 'drop-shadow(0 4px 8px rgba(240, 98, 146, 0.35))'
                  }}
                />
              </Box>
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.25rem', sm: '1.35rem' },
                color: '#2b1736',
                letterSpacing: '-0.01em',
                mb: 1
              }}
            >
              No blocked users
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#7a677d',
                maxWidth: 280,
                lineHeight: 1.5,
                fontWeight: 500,
                fontSize: '0.92rem'
              }}
            >
              You haven't blocked anyone yet.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {blockedUsers.map(u => {
              const itemKey = u.userId || u._id || u.id;
              return (
                <Box
                  key={itemKey}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: { xs: 2, sm: 2.25 },
                    borderRadius: '26px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 245, 249, 0.85) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.92)',
                    boxShadow: '0 10px 24px -6px rgba(240, 98, 146, 0.12), 0 4px 10px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 1)',
                    transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 14px 28px -6px rgba(240, 98, 146, 0.2), 0 6px 14px rgba(0, 0, 0, 0.03)',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 242, 247, 0.92) 100%)'
                    }
                  }}
                >
                  {/* Left: Avatar with 3D blocked badge + user info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: 1.5 }}>
                    <Box sx={{ position: 'relative', mr: 2, flexShrink: 0 }}>
                      <Avatar
                        src={getProfileImageSrc(u.profilePic || u.profileImage)}
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '18px',
                          border: '2.5px solid #ffffff',
                          boxShadow: '0 8px 18px -3px rgba(240, 98, 146, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
                          background: 'linear-gradient(135deg, #f06292 0%, #ec407a 100%)',
                          fontWeight: 700,
                          fontSize: '1.15rem',
                          color: '#ffffff',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        {(u.username?.[0] || u.name?.[0] || '?').toUpperCase()}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -3,
                          right: -3,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: '#ff3366',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(255, 51, 102, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
                          border: '2px solid #ffffff'
                        }}
                      >
                        <BlockRoundedIcon sx={{ fontSize: 13, color: '#ffffff' }} />
                      </Box>
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.02rem',
                          color: '#2b1736',
                          lineHeight: 1.3
                        }}
                      >
                        {u.username || u.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#9e859e',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        Blocked
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right: 3D Glossy Green Pill Unblock Button */}
                  <Button
                    variant="contained"
                    onClick={() => handleUnblockClick(u)}
                    sx={{
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      px: { xs: 2.2, sm: 2.8 },
                      py: 0.85,
                      flexShrink: 0,
                      color: '#ffffff',
                      background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 6px 16px -2px rgba(16, 185, 129, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.45), inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        background: 'linear-gradient(145deg, #34d399 0%, #059669 100%)',
                        boxShadow: '0 8px 20px -2px rgba(16, 185, 129, 0.55)',
                        transform: 'scale(1.04)'
                      },
                      '&:active': {
                        transform: 'scale(0.96)',
                        boxShadow: '0 3px 8px rgba(16, 185, 129, 0.35)'
                      }
                    }}
                  >
                    Unblock
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}

        {/* 3D Glass Confirmation Dialog */}
        <Dialog
          open={confirmOpen}
          onClose={handleUnblockCancel}
          PaperProps={{
            sx: {
              borderRadius: '28px',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 245, 249, 0.92) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 48px -8px rgba(240, 98, 146, 0.28), 0 12px 24px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 1)',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              p: { xs: 2.5, sm: 3 },
              maxWidth: 380,
              mx: 2
            }
          }}
        >
          <DialogContent sx={{ p: 0, textAlign: 'center' }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(145deg, #ffffff, #ffeaf1)',
                boxShadow: '0 8px 18px -2px rgba(240, 98, 146, 0.22), inset 0 1px 1px #ffffff',
                border: '1.5px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BlockRoundedIcon sx={{ fontSize: 26, color: '#f06292' }} />
            </Box>
            <DialogContentText
              sx={{
                color: '#2b1736',
                fontSize: '1.02rem',
                lineHeight: 1.5,
                fontWeight: 500
              }}
            >
              Are you sure you want to unblock <Box component="span" sx={{ fontWeight: 800, color: '#ff3366' }}>{selectedUser?.username || selectedUser?.name}</Box>?
            </DialogContentText>
          </DialogContent>
          <DialogActions
            sx={{
              p: 0,
              mt: 3,
              display: 'flex',
              gap: 1.5,
              justifyContent: 'center'
            }}
          >
            <Button
              onClick={handleUnblockCancel}
              sx={{
                flex: 1,
                borderRadius: '22px',
                py: 1,
                background: 'rgba(240, 98, 146, 0.08)',
                color: '#7a677d',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                border: '1px solid rgba(240, 98, 146, 0.12)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(240, 98, 146, 0.15)',
                  color: '#2b1736',
                  transform: 'scale(1.02)'
                },
                '&:active': {
                  transform: 'scale(0.96)'
                }
              }}
            >
              No
            </Button>
            <Button
              onClick={handleUnblockConfirm}
              variant="contained"
              sx={{
                flex: 1,
                borderRadius: '22px',
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                color: '#ffffff',
                background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 6px 18px -2px rgba(16, 185, 129, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  background: 'linear-gradient(145deg, #34d399 0%, #059669 100%)',
                  boxShadow: '0 8px 22px -2px rgba(16, 185, 129, 0.55)',
                  transform: 'scale(1.02)'
                },
                '&:active': {
                  transform: 'scale(0.96)'
                }
              }}
            >
              Yes
            </Button>
          </DialogActions>
        </Dialog>

        {/* 3D Glass Snackbar feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{
              width: '100%',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.92) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 12px 28px -4px rgba(16, 185, 129, 0.25), 0 4px 12px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              color: '#065f46',
              fontWeight: 700,
              fontSize: '0.9rem',
              '& .MuiAlert-icon': {
                color: '#10b981'
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default BlockedUsersPage;
