import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  Badge,
  IconButton,
  useMediaQuery,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Chip,
  Tooltip,
  Fade,
  Zoom,
  Divider,
  Slider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CameraAlt as CameraAltIcon,
  DeleteForever as DeleteForeverIcon,
  Block as BlockIcon,
  PersonRemove as PersonRemoveIcon,
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Transgender as TransgenderIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useTheme } from '@mui/material/styles';
import Cropper from 'react-easy-crop';
import getCroppedImg from './utils/cropImage';
import useSwipeBack from './hooks/useSwipeBack';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './config/apiConfig';
import { useSocket } from './context/socketContext';
import { getProfileImageSrc } from './utils/imageUtils';

const UserProfile = ({
  friendRequestsList = [],
  onAcceptFriend,
  onBlockChange,
  hideProfileCard = false,
  initialTab = 0,
  onBack
}) => {
  useSwipeBack();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab !== undefined) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  // Theme & Dark mode detection matching Settings.js
  const [currentIsDark] = useState(() => {
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

  const [friends, setFriends] = useState([]);
  // ── Pre-fill from localStorage so `user` is never null on first render (no skeleton flash) ──
  const [user, setUser] = useState(() => {
    try {
      const userId = localStorage.getItem('userId');
      const name = localStorage.getItem('username') || localStorage.getItem('name') || '';
      const profileImage = localStorage.getItem('profileImageCache') || localStorage.getItem('profileImage') || '';
      const email = localStorage.getItem('userEmail') || '';
      const phone = localStorage.getItem('userPhone') || '';
      const gender = localStorage.getItem('userGender') || '';
      if (userId) return { _id: userId, name, username: name, profileImage, email, phone, gender };
    } catch (e) {}
    return null;
  });
  const socket = useSocket();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editingImg, setEditingImg] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    friend: null,
  });
  const navigate = useNavigate();

  // Account Details edit state
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState({ email: '', phone: '', gender: '' });
  const [savingDetails, setSavingDetails] = useState(false);

  const handleEditDetails = () => {
    setDetailsForm({
      email: user?.email || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
    });
    setEditingDetails(true);
  };

  const handleCancelDetails = () => {
    setEditingDetails(false);
    setDetailsForm({ email: '', phone: '', gender: '' });
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    const userId = localStorage.getItem('userId');
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: detailsForm.email.trim(),
          phone: detailsForm.phone.trim(),
          gender: detailsForm.gender.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = data.user || data;
        setUser(prev => ({ ...prev, ...updatedUser }));
        setEditingDetails(false);
      } else {
        alert(data.message || 'Failed to save details');
      }
    } catch (err) {
      alert('Server error');
    }
    setSavingDetails(false);
  };

  const populateRequests = async (requestsList) => {
    if (!requestsList || requestsList.length === 0) return [];
    // Run all sender-profile fetches in PARALLEL (was sequential before)
    return await Promise.all(requestsList.map(async req => {
      const sId = (typeof req.senderId === 'object' ? req.senderId?._id : req.senderId) || req.senderId;
      if (!sId) return req;
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/${sId}`);
        if (res.ok) {
          const sender = await res.json();
          return {
            name: sender.name,
            username: sender.username,
            avatar: sender.profileImage || null,
            status: 'pending',
            online: false,
            _id: sId,
            requestId: req.requestId || req._id
          };
        }
      } catch (e) {
        console.error('Error populating request:', e);
      }
      return {
        name: req.senderUsername || 'Unknown',
        username: req.senderUsername || '',
        avatar: req.senderProfilePic || null,
        status: 'pending',
        online: false,
        _id: sId,
        requestId: req.requestId || req._id
      };
    }));
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // ── 1. Pre-fill friends from localStorage cache ──
    const cachedFriends = localStorage.getItem('friendsCache');
    if (cachedFriends) {
      try { setFriends(JSON.parse(cachedFriends)); } catch (e) {}
    }

    // ── 2. Fire all 3 network requests IN PARALLEL ──
    Promise.all([
      fetch(`${API_BASE_URL}/api/user/${userId}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/user/${userId}/friends`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/user/${userId}/friendRequests`).then(r => r.json()),
    ]).then(async ([userData, friendsData, requestsData]) => {
      // User profile — merge into existing state so UI doesn't flash
      setUser(prev => ({ ...(prev || {}), ...userData }));
      if (userData.profileImage) {
        localStorage.setItem('profileImageCache', userData.profileImage);
        localStorage.setItem('profileImage', userData.profileImage);
      } else {
        localStorage.removeItem('profileImageCache');
        localStorage.removeItem('profileImage');
      }
      // Cache extra fields for instant load next time
      if (userData.email) localStorage.setItem('userEmail', userData.email);
      if (userData.phone) localStorage.setItem('userPhone', userData.phone);
      if (userData.gender) localStorage.setItem('userGender', userData.gender);
      if (userData.name) localStorage.setItem('username', userData.name);

      // Friends — update state + cache
      if (Array.isArray(friendsData)) {
        setFriends(friendsData);
        localStorage.setItem('friendsCache', JSON.stringify(friendsData));
      }

      // Friend requests — populate in parallel
      if (Array.isArray(requestsData)) {
        const populated = await populateRequests(requestsData);
        setPendingRequests(populated);
      }
    }).catch(err => console.error('Profile initial fetch error:', err));
  }, []);

  useEffect(() => {
    // Only re-run when the incoming friendRequestsList prop itself changes
    // (not on every user state update — avoids redundant populateRequests calls)
    if (!friendRequestsList || friendRequestsList.length === 0) return;
    const currentIdStr = localStorage.getItem('userId');
    const filtered = friendRequestsList.filter(req => {
      if (!req) return false;
      if (req.receiverId && currentIdStr && String(req.receiverId) !== currentIdStr) return false;
      return true;
    });
    populateRequests(filtered).then(setPendingRequests);
  }, [friendRequestsList]); // ← removed `user` dependency to stop redundant re-runs

  useEffect(() => {
    if (activeTab !== 1) return;
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    // Fetch once immediately when switching to Requests tab
    fetch(`${API_BASE_URL}/api/user/${userId}/friendRequests`)
      .then(res => res.json())
      .then(async data => {
        if (Array.isArray(data)) {
          const populated = await populateRequests(data);
          setPendingRequests(populated);
        }
      })
      .catch(err => console.error('Error fetching friend requests:', err));
    // Then poll every 8s (was 5s — reduce server load)
    const pollInterval = setInterval(() => {
      fetch(`${API_BASE_URL}/api/user/${userId}/friendRequests`)
        .then(res => res.json())
        .then(async data => {
          if (Array.isArray(data)) {
            const populated = await populateRequests(data);
            setPendingRequests(populated);
          }
        })
        .catch(err => console.error('Error fetching friend requests:', err));
    }, 8000);
    return () => clearInterval(pollInterval);
  }, [activeTab]);

  // ── Instantly show new incoming friend request in Requests tab ──
  useEffect(() => {
    const handleSentRequest = (e) => {
      const req = e.detail;
      if (!req) return;
      const currentUserId = user?._id ? String(user._id) : localStorage.getItem('userId');
      // Only add if this user is the receiver
      if (!req.receiverId || !currentUserId || String(req.receiverId) !== currentUserId) return;
      const senderId = String(req.senderId);
      setPendingRequests(prev => {
        const exists = prev.some(r => String(r._id || r.senderId) === senderId);
        if (exists) return prev;
        // Optimistically build the request entry from the event payload
        const newReq = {
          _id: senderId,
          senderId,
          name: req.senderUsername || 'Unknown',
          username: req.senderUsername || '',
          avatar: req.senderProfilePic || null,
          status: 'pending',
          online: false,
          requestId: req.requestId || req._id
        };
        return [newReq, ...prev];
      });
      // Auto-switch to Requests tab so user sees it right away
      setActiveTab(1);
    };
    window.addEventListener('juicy_friend_request_sent', handleSentRequest);
    return () => window.removeEventListener('juicy_friend_request_sent', handleSentRequest);
  }, [user]);

  // Filter out requests from users who are already friends
  const friendIds = new Set(friends.map(f => String(f._id || f.friendId || f)));
  const activePendingRequests = pendingRequests.filter(req => !friendIds.has(String(req._id || req.senderId)));

  const handleRequestAction = async (req, action) => {
    const userId = (user && user._id) || localStorage.getItem('userId');
    if (!userId) return;
    const senderId = req.senderId || req._id;
    if (!senderId) return;

    // Optimistically update local pendingRequests list
    setPendingRequests(prev => prev.filter(r => String(r._id || r.senderId) !== String(senderId)));

    if (action === 'accept') {
      try {
        await fetch(`${API_BASE_URL}/api/friendRequests/${senderId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: userId }),
        });
        // Notify ChatPage.js to refresh its friends/chat list
        if (onAcceptFriend) {
          onAcceptFriend(req);
        }
        // Switch to Friends tab so user instantly sees the new friend
        setActiveTab(0);
      } catch (err) {
        console.error('Error accepting friend:', err);
      }
    } else if (action === 'reject') {
      try {
        await fetch(`${API_BASE_URL}/api/friendRequests/${senderId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: userId }),
        });
      } catch (err) {
        console.error('Error rejecting friend:', err);
      }
    }
    fetch(`${API_BASE_URL}/api/user/${userId}/friends`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setFriends(data))
      .catch(err => console.error(err));
    fetch(`${API_BASE_URL}/api/user/${userId}/friendRequests`)
      .then(res => res.json())
      .then(async data => {
        if (Array.isArray(data)) {
          const populated = await populateRequests(data);
          setPendingRequests(populated);
        }
      })
      .catch(err => console.error(err));
  };

  const handleRemoveFriend = async (friendId) => {
    setFriends(prev => prev.filter(f => f._id !== friendId));
    try {
      const userId = user && user._id;
      if (userId && friendId) {
        await fetch(`${API_BASE_URL}/api/user/${userId}/remove-friend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId }),
        });
        if (socket && socket.connected) {
          socket.emit('friend_removed', {
            removedUserId: friendId,
            currentUserId: userId
          });
        }
      }
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  const handleRemoveProfileImage = () => {
    const userId = localStorage.getItem('userId');

    // 1. Instantly clear the avatar in UI (optimistic update)
    setUser(prev => ({ ...prev, profileImage: '' }));
    setEditingImg(false);

    // 2. Clear local cache so next load doesn't show the old image
    localStorage.removeItem('profileImageCache');

    // 3. Persist to backend in the background (fire-and-forget)
    fetch(`${API_BASE_URL}/api/user/${userId}/profile-image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileImage: '' }),
    }).catch(err => console.error('Failed to remove profile image from backend:', err));
  };

  const handleDeleteAccount = () => {
    const userId = (user && user._id) || localStorage.getItem('userId');

    // 1. Instantly close confirmation dialog and reset state
    setDeleteDialogOpen(false);
    setDeleteInput('');
    setDeleting(false);

    // 2. Instantly wipe in-memory component state
    setUser(null);
    setFriends([]);
    setPendingRequests([]);
    setBlockedUsers([]);

    // 3. Disconnect socket session immediately
    if (socket) {
      try {
        if (userId) socket.emit('logout', { userId });
        socket.disconnect();
      } catch (e) {
        console.warn('Socket disconnect error:', e);
      }
    }

    // 4. Clear native Capacitor AudioRoute session
    if (typeof window !== 'undefined' && window.Capacitor) {
      const { AudioRoute } = window.Capacitor.Plugins || {};
      if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
        try {
          AudioRoute.clearSession();
        } catch (e) { }
      }
    }

    // 5. Instantly clear localcache (all localStorage & sessionStorage)
    try {
      const savedTheme = localStorage.getItem('appTheme');
      localStorage.clear();
      // Restore theme setting if present so visual styling remains clean
      if (savedTheme) {
        localStorage.setItem('appTheme', savedTheme);
      }
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }

    try {
      sessionStorage.clear();
    } catch (e) { }

    // 6. Broadcast storage & logout events to notify any active listeners
    try {
      window.dispatchEvent(new CustomEvent('juicy_account_deleted', { detail: { userId } }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) { }

    // 7. Instantly navigate to SignInPage (optimistic, zero delay)
    navigate('/signin', { replace: true });

    // Fallback: If for any reason navigation didn't change path, redirect
    setTimeout(() => {
      if (window.location.pathname !== '/signin') {
        window.location.replace('/signin');
      }
    }, 150);

    // 8. Fire-and-forget delete on backend in background without blocking UI
    if (userId) {
      fetch(`${API_BASE_URL}/api/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => {
        console.error('Background account deletion error:', err);
      });
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    fetch(`${API_BASE_URL}/api/user/${userId}/blocked`)
      .then(res => res.json())
      .then(data => setBlockedUsers(data.map(u => u.userId)));
  }, []);

  const visibleFriends = friends.filter(f => !blockedUsers.includes(f._id));

  // Profile image resolution supporting Google URLs and Base64 format
  // (Delegated to shared getProfileImageSrc utility)

  // Skeleton Loading State matching Settings glassmorphic theme
  if (!user) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'var(--background-color, #fff7f9)',
          backgroundImage: isDark
            ? 'radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.03) 0%, transparent 45%)'
            : 'radial-gradient(circle at 90% 8%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 10% 65%, rgba(0, 0, 0, 0.02) 0%, transparent 45%)',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            p: 4,
            borderRadius: '24px',
            bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
            backdropFilter: 'blur(14px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
            boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 8px 24px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Skeleton
            variant="circular"
            width={88}
            height={88}
            sx={{ mx: 'auto', mb: 2, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          />
          <Skeleton
            variant="text"
            width={140}
            height={32}
            sx={{ mx: 'auto', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          />
          <Skeleton
            variant="text"
            width={90}
            height={22}
            sx={{ mx: 'auto', mt: 1, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: 'var(--background-color, #fff7f9)',
        backgroundImage: isDark
          ? 'radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.03) 0%, transparent 45%)'
          : 'radial-gradient(circle at 90% 8%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 10% 65%, rgba(0, 0, 0, 0.02) 0%, transparent 45%)',
        color: 'var(--text-color, #000000)',
        fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main scrollable container matching Settings.js */}
      <Box
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: isMobile ? '100%' : (hideProfileCard ? 760 : 1180),
          mx: 'auto',
          height: '100%',
          bgcolor: 'transparent',
          overflowY: 'auto',
          pt: { xs: 2, sm: 3.5 },
          pb: isMobile ? { xs: 14, sm: 10 } : 8,
          px: { xs: 2, sm: 3.5 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
          /* Hide scrollbar across all browsers while keeping scrolling fully functional */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
            width: 0,
            height: 0,
          }
        }}
      >
        {/* Header Bar matching Settings.js */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            px: 0.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {onBack && (
              <IconButton
                onClick={onBack}
                sx={{
                  color: isDark ? '#ffffff' : 'var(--text-color, #1e1b2e)',
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderRadius: '14px',
                  p: 1.1,
                  mr: 0.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                    transform: 'translateX(-2px)'
                  }
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}

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
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              {hideProfileCard ? <PersonAddAlt1Icon fontSize="medium" /> : <PersonIcon fontSize="medium" />}
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: isDark
                    ? 'linear-gradient(135deg, #ffffff 0%, var(--primary-color, #fda4af) 100%)'
                    : 'linear-gradient(135deg, var(--text-color, #1e1b2e) 0%, var(--primary-color, #ff2d6c) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                  fontSize: isMobile ? '1.35rem' : '1.55rem'
                }}
              >
                {hideProfileCard ? 'Friend Requests' : 'Profile & Connections'}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                {hideProfileCard ? 'Respond to incoming requests & invites' : 'Manage your profile, friendships & interactions'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content Layout: 2 Columns on Desktop, Stacked on Mobile */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: { xs: 2.5, sm: 3 },
            alignItems: 'stretch',
          }}
        >
          {/* Left Column: Profile Card */}
          {!hideProfileCard && (
            <Box
              sx={{
                flex: isMobile ? '1 1 100%' : '0 0 370px',
                width: isMobile ? '100%' : 370,
                position: 'relative',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '24px',
                  bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
                  boxShadow: isDark
                    ? '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : '0 8px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Decorative header banner */}
                <Box
                  sx={{
                    height: isMobile ? '105px' : '120px',
                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '55px',
                      background: isDark
                        ? 'linear-gradient(to top, rgba(28, 22, 38, 0.95), transparent)'
                        : 'linear-gradient(to top, var(--surface-color, rgba(255,255,255,0.95)), transparent)',
                    },
                  }}
                />

                <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 3, position: 'relative', mt: '-52px' }}>
                  {/* Avatar with sleek ring and camera trigger */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Tooltip title="Change photo" disableTouchListener={isMobile}>
                          <IconButton
                            size="small"
                            onClick={() => setEditingImg(prev => !prev)}
                            sx={{
                              bgcolor: 'var(--primary-color, #ff2d6c)',
                              color: '#ffffff',
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              border: isDark ? '3px solid #1c1626' : '3px solid #ffffff',
                              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                bgcolor: 'var(--primary-color, #ff2d6c)',
                                transform: 'scale(1.12)',
                                filter: 'brightness(1.1)',
                              },
                            }}
                          >
                            <CameraAltIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <Avatar
                        sx={{
                          width: isMobile ? 96 : 108,
                          height: isMobile ? 96 : 108,
                          bgcolor: isDark ? 'rgba(255, 45, 108, 0.2)' : 'var(--background-color, #ffe4ec)',
                          color: 'var(--primary-color, #ff2d6c)',
                          fontSize: isMobile ? 38 : 44,
                          fontWeight: 700,
                          border: isDark ? '4px solid #1c1626' : '4px solid #ffffff',
                          boxShadow: isDark
                            ? '0 8px 24px rgba(0, 0, 0, 0.5)'
                            : '0 8px 24px rgba(255, 45, 108, 0.18)',
                          cursor: 'pointer',
                          transition: 'transform 0.25s ease',
                          '&:hover': { transform: 'scale(1.04)' },
                        }}
                        src={getProfileImageSrc(user.profileImage)}
                        onClick={() => setPreviewOpen(true)}
                      >
                        {(user.name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                      </Avatar>
                    </Badge>
                  </Box>

                  {/* Image Edit Actions */}
                  <Fade in={editingImg}>
                    <Box
                      sx={{
                        display: editingImg ? 'flex' : 'none',
                        flexDirection: 'row',
                        gap: 1.5,
                        mb: 2.5,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DeleteForeverIcon fontSize="small" />}
                        onClick={handleRemoveProfileImage}
                        sx={{
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                          bgcolor: 'rgba(239, 68, 68, 0.06)',
                          color: '#ef4444',
                          borderRadius: '16px',
                          textTransform: 'none',
                          fontWeight: 650,
                          fontSize: '0.8rem',
                          px: 2,
                          py: 0.7,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#ef4444',
                            bgcolor: 'rgba(239, 68, 68, 0.12)',
                            color: '#dc2626',
                          },
                        }}
                      >
                        Remove
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        component="label"
                        startIcon={<CloudUploadIcon fontSize="small" />}
                        sx={{
                          background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                          color: '#ffffff',
                          borderRadius: '16px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          px: 2.2,
                          py: 0.7,
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            filter: 'brightness(1.08)',
                            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                          },
                        }}
                      >
                        Upload New
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedImage(URL.createObjectURL(e.target.files[0]));
                              setCropModalOpen(true);
                            }
                          }}
                        />
                      </Button>
                    </Box>
                  </Fade>

                  {/* User Identity */}
                  <Box textAlign="center" mb={2.5}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: isDark ? '#f8fafc' : '#0f172a',
                        letterSpacing: '-0.3px',
                        fontSize: isMobile ? '1.15rem' : '1.3rem',
                        lineHeight: 1.3,
                        mb: 0.3,
                      }}
                    >
                      {user.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--primary-color, #ff2d6c)',
                        fontWeight: 650,
                        fontSize: '0.92rem',
                      }}
                    >
                      @{user.username}
                    </Typography>

                    {/* Online status indicator badge */}
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.8,
                        px: 1.6,
                        py: 0.45,
                        borderRadius: '20px',
                        bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        mt: 1.2
                      }}
                    >
                      <Box
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: '#22c55e',
                          boxShadow: '0 0 8px #22c55e'
                        }}
                      />
                      <Typography sx={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 650 }}>
                        Online
                      </Typography>
                    </Box>
                  </Box>

                  {/* Account Details Box */}
                  <Box mb={2.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.92rem',
                          letterSpacing: '-0.2px',
                          color: 'var(--primary-color, #ff2d6c)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        Account Details
                      </Typography>

                      {/* Edit / Save / Cancel controls */}
                      {!editingDetails ? (
                        <Tooltip title="Edit details" disableTouchListener={isMobile}>
                          <IconButton
                            size="small"
                            onClick={handleEditDetails}
                            sx={{
                              color: 'var(--primary-color, #ff2d6c)',
                              bgcolor: isDark ? 'rgba(255,45,108,0.12)' : 'rgba(255,45,108,0.08)',
                              borderRadius: '10px',
                              p: 0.7,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(255,45,108,0.22)' : 'rgba(255,45,108,0.16)',
                                transform: 'scale(1.08)',
                              }
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.8 }}>
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              onClick={handleCancelDetails}
                              sx={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderRadius: '10px',
                                p: 0.7,
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              onClick={handleSaveDetails}
                              disabled={savingDetails}
                              sx={{
                                color: '#ffffff',
                                bgcolor: 'var(--primary-color, #ff2d6c)',
                                borderRadius: '10px',
                                p: 0.7,
                                transition: 'all 0.2s ease',
                                '&:hover': { filter: 'brightness(1.1)', transform: 'scale(1.08)' },
                                '&.Mui-disabled': { opacity: 0.6 }
                              }}
                            >
                              <SaveIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    <Box
                      sx={{
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '20px',
                        p: 1.8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.6,
                      }}
                    >
                      {[
                        { label: 'Email', value: user.email, icon: <EmailIcon sx={{ fontSize: 18 }} />, field: 'email' },
                        { label: 'Phone', value: user.phone, icon: <PhoneIcon sx={{ fontSize: 18 }} />, field: 'phone' },
                        { label: 'Gender', value: user.gender, icon: <TransgenderIcon sx={{ fontSize: 18 }} />, field: 'gender' },
                      ].map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '12px',
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 45, 108, 0.08)',
                              color: 'var(--primary-color, #ff2d6c)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                fontWeight: 650,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                display: 'block',
                                mb: editingDetails ? 0.5 : 0
                              }}
                            >
                              {item.label}
                            </Typography>
                            {editingDetails ? (
                              <TextField
                                value={detailsForm[item.field]}
                                onChange={e => setDetailsForm(prev => ({ ...prev, [item.field]: e.target.value }))}
                                size="small"
                                variant="outlined"
                                placeholder={`Enter ${item.label.toLowerCase()}`}
                                fullWidth
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    fontSize: '0.84rem',
                                    color: isDark ? '#f8fafc' : '#0f172a',
                                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                                    '& fieldset': {
                                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,45,108,0.25)',
                                    },
                                    '&:hover fieldset': {
                                      borderColor: 'var(--primary-color, #ff2d6c)',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: 'var(--primary-color, #ff2d6c)',
                                      borderWidth: '1.5px',
                                    },
                                  },
                                  '& .MuiInputBase-input': {
                                    py: 0.8,
                                    px: 1.2,
                                  }
                                }}
                              />
                            ) : (
                              <Typography
                                sx={{
                                  color: isDark ? '#f8fafc' : '#0f172a',
                                  fontWeight: 550,
                                  fontSize: '0.86rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {item.value || 'Not set'}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Delete Account Pill matching Settings.js */}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DeleteForeverIcon sx={{ fontSize: 20 }} />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      bgcolor: 'rgba(239, 68, 68, 0.06)',
                      color: '#ef4444',
                      fontWeight: 650,
                      borderRadius: '20px',
                      py: 1.2,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        borderColor: '#ef4444',
                        color: '#dc2626',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Delete Account
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Right Column: Friends / Requests Panel */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: '24px',
                bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
                boxShadow: isDark
                  ? '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
                  : '0 8px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                overflow: 'hidden',
                height: isMobile ? 'auto' : (hideProfileCard ? 'calc(100vh - 150px)' : '620px'),
                minHeight: isMobile ? '480px' : (hideProfileCard ? 'calc(100vh - 150px)' : '620px'),
                maxHeight: isMobile ? '80vh' : (hideProfileCard ? 'calc(100vh - 150px)' : '620px'),
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Segmented Pill Tabs matching Settings design */}
              <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2, pb: 1 }}>
                <Box
                  sx={{
                    bgcolor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.035)',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '18px',
                    p: 0.6,
                  }}
                >
                  <Tabs
                    value={[0, 1].includes(activeTab) ? activeTab : 0}
                    onChange={(_, newVal) => setActiveTab(newVal)}
                    variant="fullWidth"
                    TabIndicatorProps={{ style: { display: 'none' } }}
                    sx={{
                      minHeight: 46,
                      '& .MuiTabs-root': { minHeight: 46 },
                      '& .MuiTab-root': {
                        minHeight: 44,
                        textTransform: 'none',
                        fontWeight: 650,
                        fontSize: isMobile ? '0.84rem' : '0.92rem',
                        fontFamily: 'Poppins, sans-serif',
                        color: isDark ? '#94a3b8' : '#64748b',
                        borderRadius: '14px',
                        transition: 'all 0.22s ease',
                        gap: 1,
                        py: 0.8,
                        '&.Mui-selected': {
                          color: '#ffffff',
                          background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                          fontWeight: 750,
                          boxShadow: '0 4px 14px rgba(255, 45, 108, 0.3)',
                        },
                      },
                    }}
                  >
                    <Tab
                      value={0}
                      icon={<PeopleAltIcon sx={{ fontSize: isMobile ? '1.15rem' : '1.25rem' }} />}
                      iconPosition="start"
                      label={`Friends (${visibleFriends.filter(f => f.username && f.username !== 'Unknown').length})`}
                    />
                    <Tab
                      value={1}
                      icon={<PersonAddAlt1Icon sx={{ fontSize: isMobile ? '1.15rem' : '1.25rem' }} />}
                      iconPosition="start"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <span>Requests</span>
                          {activePendingRequests.length > 0 && (
                            <Box
                              component="span"
                              sx={{
                                bgcolor: activeTab === 1 ? '#ffffff' : 'var(--primary-color, #ff2d6c)',
                                color: activeTab === 1 ? 'var(--primary-color, #ff2d6c)' : '#ffffff',
                                borderRadius: '20px',
                                minWidth: 20,
                                height: 20,
                                px: 0.6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                lineHeight: 1,
                                boxShadow: activeTab === 1 ? '0 2px 6px rgba(0,0,0,0.15)' : '0 2px 6px rgba(255,45,108,0.4)',
                              }}
                            >
                              {activePendingRequests.length}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </Tabs>
                </Box>
              </Box>

              {/* Scrollable List Container */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  px: { xs: 1.5, sm: 2.5 },
                  py: 1,
                  /* Hide scrollbar across all browsers while keeping scrolling fully functional */
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                    width: 0,
                    height: 0,
                  }
                }}
              >
                <List sx={{ p: 0, pb: isMobile ? 12 : 6 }}>
                  {/* Friends List - 5 default + scroll */}
                  {activeTab === 0 && (
                    <>
                      {visibleFriends
                        .filter(friend => friend.username && friend.username !== 'Unknown')
                        .slice(0, 5)
                        .map((friend, index) => (
                          <Zoom in key={friend._id || index} style={{ transitionDelay: `${index * 30}ms` }}>
                            <ListItem
                              sx={{
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 1.2, sm: 1.4 },
                                mb: 1.5,
                                borderRadius: '18px',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.95)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
                                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.03)',
                                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                flexWrap: 'nowrap',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: isDark ? '0 8px 22px rgba(0,0,0,0.35)' : '0 8px 22px rgba(0,0,0,0.06)',
                                  borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.3))',
                                },
                              }}
                            >
                              <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1.2 }}>
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                  variant="dot"
                                  color="success"
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      width: isMobile ? 10 : 12,
                                      height: isMobile ? 10 : 12,
                                      borderRadius: '50%',
                                      border: isDark ? '2px solid #1c1626' : '2px solid white',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                      bgcolor: '#22c55e',
                                    },
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: isMobile ? 44 : 50,
                                      height: isMobile ? 44 : 50,
                                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                      flexShrink: 0,
                                      ...(!getProfileImageSrc(friend.profilePic || friend.profileImage) && {
                                        background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                        color: '#fff',
                                        fontWeight: 700
                                      })
                                    }}
                                    src={getProfileImageSrc(friend.profilePic || friend.profileImage)}
                                  >
                                    {(friend.username?.[0] || friend.name?.[0] || '?').toUpperCase()}
                                  </Avatar>
                                </Badge>
                              </ListItemAvatar>

                              <ListItemText
                                primary={
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: isMobile ? '0.9rem' : '0.98rem',
                                      color: isDark ? '#f8fafc' : '#0f172a',
                                      display: 'block',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {friend.username || 'Unknown'}
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: isMobile ? '0.74rem' : '0.8rem',
                                      color: isDark ? '#94a3b8' : '#64748b',
                                      fontWeight: 500,
                                      display: 'block',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    @{friend.username || ''}
                                  </Typography>
                                }
                                sx={{ flex: '1 1 auto', minWidth: 0, mr: 1 }}
                              />

                              <Box sx={{ display: 'flex', gap: 0.8, ml: 'auto', flexShrink: 0 }}>
                                <Tooltip title="Remove friend" arrow disableTouchListener={isMobile}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setConfirmDialog({ open: true, action: 'remove', friend })}
                                    sx={{
                                      color: '#ef4444',
                                      bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                      width: isMobile ? 32 : 36,
                                      height: isMobile ? 32 : 36,
                                      borderRadius: '12px',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(239, 68, 68, 0.2)',
                                        transform: 'scale(1.08)',
                                      },
                                    }}
                                  >
                                    <PersonRemoveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Block" arrow disableTouchListener={isMobile}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setConfirmDialog({ open: true, action: 'block', friend })}
                                    sx={{
                                      color: '#f97316',
                                      bgcolor: isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.08)',
                                      width: isMobile ? 32 : 36,
                                      height: isMobile ? 32 : 36,
                                      borderRadius: '12px',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(249, 115, 22, 0.2)',
                                        transform: 'scale(1.08)',
                                      },
                                    }}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItem>
                          </Zoom>
                        ))}

                      {/* Show remaining friends (beyond 5) with scroll */}
                      {visibleFriends.filter(f => f.username && f.username !== 'Unknown').length > 5 && (
                        <>
                          <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                            <Chip
                              label={`${visibleFriends.filter(f => f.username && f.username !== 'Unknown').length - 5} more friends`}
                              size="small"
                              sx={{
                                bgcolor: isDark ? 'rgba(255, 45, 108, 0.15)' : 'rgba(255, 45, 108, 0.08)',
                                color: 'var(--primary-color, #ff2d6c)',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 45, 108, 0.2)'
                              }}
                            />
                          </Divider>

                          {visibleFriends
                            .filter(friend => friend.username && friend.username !== 'Unknown')
                            .slice(5)
                            .map((friend, index) => (
                              <Zoom in key={friend._id || `remaining-${index}`} style={{ transitionDelay: `${index * 30}ms` }}>
                                <ListItem
                                  sx={{
                                    px: { xs: 1.5, sm: 2 },
                                    py: { xs: 1.2, sm: 1.4 },
                                    mb: 1.5,
                                    borderRadius: '18px',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.95)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
                                    boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.03)',
                                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                    flexWrap: 'nowrap',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: isDark ? '0 8px 22px rgba(0,0,0,0.35)' : '0 8px 22px rgba(0,0,0,0.06)',
                                      borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.3))',
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1.2 }}>
                                    <Badge
                                      overlap="circular"
                                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                      variant="dot"
                                      color="success"
                                      sx={{
                                        '& .MuiBadge-badge': {
                                          width: isMobile ? 10 : 12,
                                          height: isMobile ? 10 : 12,
                                          borderRadius: '50%',
                                          border: isDark ? '2px solid #1c1626' : '2px solid white',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                          bgcolor: '#22c55e',
                                        },
                                      }}
                                    >
                                      <Avatar
                                        sx={{
                                          width: isMobile ? 44 : 50,
                                          height: isMobile ? 44 : 50,
                                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                          flexShrink: 0,
                                          ...(!getProfileImageSrc(friend.profilePic || friend.profileImage) && {
                                            background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                            color: '#fff',
                                            fontWeight: 700
                                          })
                                        }}
                                        src={getProfileImageSrc(friend.profilePic || friend.profileImage)}
                                      >
                                        {(friend.username?.[0] || friend.name?.[0] || '?').toUpperCase()}
                                      </Avatar>
                                    </Badge>
                                  </ListItemAvatar>

                                  <ListItemText
                                    primary={
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: isMobile ? '0.9rem' : '0.98rem',
                                          color: isDark ? '#f8fafc' : '#0f172a',
                                          display: 'block',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {friend.username || 'Unknown'}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontSize: isMobile ? '0.74rem' : '0.8rem',
                                          color: isDark ? '#94a3b8' : '#64748b',
                                          fontWeight: 500,
                                          display: 'block',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        @{friend.username || ''}
                                      </Typography>
                                    }
                                    sx={{ flex: '1 1 auto', minWidth: 0, mr: 1 }}
                                  />

                                  <Box sx={{ display: 'flex', gap: 0.8, ml: 'auto', flexShrink: 0 }}>
                                    <Tooltip title="Remove friend" arrow disableTouchListener={isMobile}>
                                      <IconButton
                                        size="small"
                                        onClick={() => setConfirmDialog({ open: true, action: 'remove', friend })}
                                        sx={{
                                          color: '#ef4444',
                                          bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                          width: isMobile ? 32 : 36,
                                          height: isMobile ? 32 : 36,
                                          borderRadius: '12px',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'rgba(239, 68, 68, 0.2)',
                                            transform: 'scale(1.08)',
                                          },
                                        }}
                                      >
                                        <PersonRemoveIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Block" arrow disableTouchListener={isMobile}>
                                      <IconButton
                                        size="small"
                                        onClick={() => setConfirmDialog({ open: true, action: 'block', friend })}
                                        sx={{
                                          color: '#f97316',
                                          bgcolor: isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.08)',
                                          width: isMobile ? 32 : 36,
                                          height: isMobile ? 32 : 36,
                                          borderRadius: '12px',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'rgba(249, 115, 22, 0.2)',
                                            transform: 'scale(1.08)',
                                          },
                                        }}
                                      >
                                        <BlockIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </ListItem>
                              </Zoom>
                            ))}
                        </>
                      )}

                      {/* Empty state for friends */}
                      {visibleFriends.filter(f => f.username && f.username !== 'Unknown').length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                          <Box
                            sx={{
                              width: 72,
                              height: 72,
                              borderRadius: '22px',
                              background: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 2,
                              border: isDark ? '1px solid rgba(255, 45, 108, 0.2)' : '1px solid rgba(255, 45, 108, 0.12)',
                            }}
                          >
                            <PeopleAltIcon sx={{ fontSize: 36, color: 'var(--primary-color, #ff2d6c)' }} />
                          </Box>
                          <Typography variant="h6" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 750, fontSize: '1.05rem', mb: 0.5 }}>
                            No friends yet
                          </Typography>
                          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 3, fontSize: '0.85rem' }}>
                            Start connecting and building your circle today
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => navigate('/chat?tab=search')}
                            sx={{
                              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                              color: '#ffffff',
                              borderRadius: '20px',
                              textTransform: 'none',
                              fontWeight: 700,
                              px: 3.5,
                              py: 1.2,
                              fontSize: '0.9rem',
                              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                              transition: 'all 0.22s ease',
                              '&:hover': {
                                filter: 'brightness(1.08)',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                                transform: 'translateY(-2px)'
                              },
                            }}
                          >
                            Find Friends
                          </Button>
                        </Box>
                      )}
                    </>
                  )}

                  {/* Requests List - 5 default + scroll */}
                  {activeTab === 1 && (
                    <>
                      {activePendingRequests.slice(0, 5).map((friend, index) => {
                        const displayName = friend.name || friend.senderUsername || friend.username || 'Unknown';
                        const displayUsername = friend.username || friend.senderUsername || '';
                        const displayAvatar = friend.avatar || friend.senderProfilePic || null;

                        return (
                          <Zoom in key={friend.requestId || friend._id || index} style={{ transitionDelay: `${index * 30}ms` }}>
                            <ListItem
                              sx={{
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 1.2, sm: 1.4 },
                                mb: 1.5,
                                borderRadius: '18px',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.95)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
                                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.03)',
                                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                flexWrap: 'nowrap',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: isDark ? '0 8px 22px rgba(0,0,0,0.35)' : '0 8px 22px rgba(0,0,0,0.06)',
                                  borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.3))',
                                },
                              }}
                            >
                              <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1.2 }}>
                                <Avatar
                                  sx={{
                                    width: isMobile ? 44 : 50,
                                    height: isMobile ? 44 : 50,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    flexShrink: 0,
                                    ...(!getProfileImageSrc(displayAvatar) && {
                                      background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                      color: '#fff',
                                      fontWeight: 700
                                    })
                                  }}
                                  src={getProfileImageSrc(displayAvatar)}
                                >
                                  {(displayName?.[0] || displayUsername?.[0] || '?').toUpperCase()}
                                </Avatar>
                              </ListItemAvatar>

                              <ListItemText
                                primary={
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: isMobile ? '0.9rem' : '0.98rem',
                                      color: isDark ? '#f8fafc' : '#0f172a',
                                      display: 'block',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {displayName}
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: isMobile ? '0.74rem' : '0.8rem',
                                      color: isDark ? '#94a3b8' : '#64748b',
                                      fontWeight: 500,
                                      display: 'block',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {displayUsername ? `@${displayUsername} · ` : ''}Friend request
                                  </Typography>
                                }
                                sx={{ flex: '1 1 auto', minWidth: 0, mr: 1 }}
                              />

                              <Box sx={{ display: 'flex', gap: 0.8, ml: 'auto', flexShrink: 0 }}>
                                <Tooltip title="Accept" arrow disableTouchListener={isMobile}>
                                  <IconButton
                                    onClick={() => handleRequestAction(friend, 'accept')}
                                    sx={{
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      color: '#ffffff',
                                      width: isMobile ? 32 : 36,
                                      height: isMobile ? 32 : 36,
                                      borderRadius: '12px',
                                      boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        transform: 'scale(1.08)',
                                        boxShadow: '0 5px 14px rgba(16, 185, 129, 0.4)',
                                      },
                                    }}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Decline" arrow disableTouchListener={isMobile}>
                                  <IconButton
                                    onClick={() => handleRequestAction(friend, 'reject')}
                                    sx={{
                                      bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                      color: '#ef4444',
                                      width: isMobile ? 32 : 36,
                                      height: isMobile ? 32 : 36,
                                      borderRadius: '12px',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(239, 68, 68, 0.2)',
                                        transform: 'scale(1.08)',
                                      },
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItem>
                          </Zoom>
                        );
                      })}

                      {/* Show remaining requests (beyond 5) with scroll */}
                      {activePendingRequests.length > 5 && (
                        <>
                          <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                            <Chip
                              label={`${activePendingRequests.length - 5} more requests`}
                              size="small"
                              sx={{
                                bgcolor: isDark ? 'rgba(255, 45, 108, 0.15)' : 'rgba(255, 45, 108, 0.08)',
                                color: 'var(--primary-color, #ff2d6c)',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 45, 108, 0.2)'
                              }}
                            />
                          </Divider>

                          {activePendingRequests.slice(5).map((friend, index) => {
                            const displayName = friend.name || friend.senderUsername || friend.username || 'Unknown';
                            const displayUsername = friend.username || friend.senderUsername || '';
                            const displayAvatar = friend.avatar || friend.senderProfilePic || null;

                            return (
                              <Zoom in key={friend.requestId || friend._id || `remaining-${index}`} style={{ transitionDelay: `${index * 30}ms` }}>
                                <ListItem
                                  sx={{
                                    px: { xs: 1.5, sm: 2 },
                                    py: { xs: 1.2, sm: 1.4 },
                                    mb: 1.5,
                                    borderRadius: '18px',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.95)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
                                    boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.03)',
                                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                    flexWrap: 'nowrap',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: isDark ? '0 8px 22px rgba(0,0,0,0.35)' : '0 8px 22px rgba(0,0,0,0.06)',
                                      borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.3))',
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1.2 }}>
                                    <Avatar
                                      sx={{
                                        width: isMobile ? 44 : 50,
                                        height: isMobile ? 44 : 50,
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                        flexShrink: 0,
                                        ...(!getProfileImageSrc(displayAvatar) && {
                                          background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                          color: '#fff',
                                          fontWeight: 700
                                        })
                                      }}
                                      src={getProfileImageSrc(displayAvatar)}
                                    >
                                      {(displayName?.[0] || displayUsername?.[0] || '?').toUpperCase()}
                                    </Avatar>
                                  </ListItemAvatar>

                                  <ListItemText
                                    primary={
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: isMobile ? '0.9rem' : '0.98rem',
                                          color: isDark ? '#f8fafc' : '#0f172a',
                                          display: 'block',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {displayName}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontSize: isMobile ? '0.74rem' : '0.8rem',
                                          color: isDark ? '#94a3b8' : '#64748b',
                                          fontWeight: 500,
                                          display: 'block',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {displayUsername ? `@${displayUsername} · ` : ''}Friend request
                                      </Typography>
                                    }
                                    sx={{ flex: '1 1 auto', minWidth: 0, mr: 1 }}
                                  />

                                  <Box sx={{ display: 'flex', gap: 0.8, ml: 'auto', flexShrink: 0 }}>
                                    <Tooltip title="Accept" arrow disableTouchListener={isMobile}>
                                      <IconButton
                                        onClick={() => handleRequestAction(friend, 'accept')}
                                        sx={{
                                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                          color: '#ffffff',
                                          width: isMobile ? 32 : 36,
                                          height: isMobile ? 32 : 36,
                                          borderRadius: '12px',
                                          boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            transform: 'scale(1.08)',
                                            boxShadow: '0 5px 14px rgba(16, 185, 129, 0.4)',
                                          },
                                        }}
                                      >
                                        <CheckIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Decline" arrow disableTouchListener={isMobile}>
                                      <IconButton
                                        onClick={() => handleRequestAction(friend, 'reject')}
                                        sx={{
                                          bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                          color: '#ef4444',
                                          width: isMobile ? 32 : 36,
                                          height: isMobile ? 32 : 36,
                                          borderRadius: '12px',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'rgba(239, 68, 68, 0.2)',
                                            transform: 'scale(1.08)',
                                          },
                                        }}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </ListItem>
                              </Zoom>
                            );
                          })}
                        </>
                      )}

                      {/* Empty state for requests */}
                      {activePendingRequests.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                          <Box
                            sx={{
                              width: 72,
                              height: 72,
                              borderRadius: '22px',
                              background: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 2,
                              border: isDark ? '1px solid rgba(255, 45, 108, 0.2)' : '1px solid rgba(255, 45, 108, 0.12)',
                            }}
                          >
                            <PersonAddAlt1Icon sx={{ fontSize: 36, color: 'var(--primary-color, #ff2d6c)' }} />
                          </Box>
                          <Typography variant="h6" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 750, fontSize: '1.05rem', mb: 0.5 }}>
                            No pending requests
                          </Typography>
                          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.85rem' }}>
                            Incoming friend requests will appear here
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </List>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Delete Account Dialog matching Settings.js Modal Style */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDark ? '#1a1424' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            p: 1
          },
        }}
      >
        <DialogTitle sx={{ pt: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DeleteForeverIcon sx={{ color: '#ef4444', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography fontWeight={800} sx={{ color: '#ef4444', fontSize: '1.15rem' }}>
                Delete Account
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                Permanent action
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontSize: '0.9rem', mb: 2, lineHeight: 1.6 }}>
            This action is permanent and cannot be undone. All your chat history, contacts, and personal data will be erased.
          </Typography>
          <Typography sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.85rem', mb: 1, fontWeight: 650 }}>
            Type <Box component="span" sx={{ color: '#ef4444', fontWeight: 750 }}>"Delete My Account"</Box> to confirm:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            placeholder="Delete My Account"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(239, 68, 68, 0.03)',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.9rem',
                '& fieldset': {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(239, 68, 68, 0.25)',
                },
                '&:hover fieldset': {
                  borderColor: '#ef4444',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ef4444',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              borderRadius: '18px',
              textTransform: 'none',
              fontWeight: 650,
              px: 3,
              py: 1,
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            disabled={deleteInput.trim().toLowerCase() !== 'delete my account' || deleting}
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '18px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              },
              '&.Mui-disabled': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.25)',
                color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.8)',
              },
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cropper Dialog matching Settings.js Modal Style */}
      <Dialog
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '28px',
            overflow: 'hidden',
            bgcolor: isDark ? '#1a1424' : '#ffffff',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          },
        }}
      >
        <DialogTitle sx={{
          bgcolor: isDark ? '#140f1d' : '#1e1b2e',
          color: '#fff',
          py: 2.2,
          px: 3,
          fontWeight: 700,
          fontSize: '1.05rem',
        }}>
          Crop Profile Photo
        </DialogTitle>
        <DialogContent sx={{ position: 'relative', height: 320, bgcolor: '#000000', p: 0 }}>
          {selectedImage && (
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
            />
          )}
        </DialogContent>
        <Box sx={{ px: 3, py: 2, bgcolor: isDark ? '#1a1424' : '#ffffff' }}>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 1, display: 'block', fontWeight: 650 }}>
            Zoom Level
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value)}
            sx={{
              color: 'var(--primary-color, #ff2d6c)',
              '& .MuiSlider-thumb': {
                boxShadow: '0 2px 10px rgba(255, 45, 108, 0.4)',
              },
            }}
          />
        </Box>
        <DialogActions sx={{ px: 3, pb: 2.5, bgcolor: isDark ? '#1a1424' : '#ffffff', gap: 1.5 }}>
          <Button
            onClick={() => setCropModalOpen(false)}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              borderRadius: '18px',
              textTransform: 'none',
              fontWeight: 650,
              px: 3,
              py: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              // 1. Crop the image locally (fast, no network)
              const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);

              // 2. Instantly show the new image and close all dialogs
              setUser(prev => ({ ...prev, profileImage: croppedImage }));
              setCropModalOpen(false);
              setEditingImg(false);

              // 3. Write to local cache immediately so next load is instant
              try {
                localStorage.setItem('profileImageCache', croppedImage);
                localStorage.setItem('profileImage', croppedImage);
              } catch (cacheErr) {
                console.warn('Profile image cache write failed (storage full?):', cacheErr);
              }

              // 4. Persist to backend in the background (fire-and-forget)
              const userId = localStorage.getItem('userId');
              fetch(`${API_BASE_URL}/api/user/${userId}/profile-image`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileImage: croppedImage }),
              }).catch(err => console.error('Failed to save profile image to backend:', err));
            }}
            sx={{
              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
              color: '#fff',
              borderRadius: '18px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3.5,
              py: 1,
              boxShadow: '0 4px 16px rgba(255, 45, 108, 0.35)',
              '&:hover': {
                filter: 'brightness(1.08)',
              },
            }}
          >
            Save Photo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Full Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: 'transparent',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            m: 0,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 2,
          }}
        >
          <Avatar
            src={getProfileImageSrc(user.profileImage)}
            sx={{
              width: isMobile ? 250 : 300,
              height: isMobile ? 250 : 300,
              bgcolor: isDark ? '#2a1a2e' : '#ffe4ec',
              border: '4px solid #ffffff',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              fontSize: isMobile ? 80 : 100,
              fontWeight: 700,
              color: 'var(--primary-color, #ff2d6c)',
            }}
          >
            {(user.name?.[0] || user.username?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Button
            onClick={() => setPreviewOpen(false)}
            sx={{
              mt: 3,
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              fontWeight: 650,
              textTransform: 'none',
              px: 4,
              py: 1.1,
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.28)',
              },
            }}
          >
            Close Preview
          </Button>
        </Box>
      </Dialog>

      {/* Confirmation Dialog (Remove / Block Friend) matching Settings style */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDark ? '#1a1424' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            p: 1
          },
        }}
      >
        <DialogTitle sx={{ pt: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                bgcolor: confirmDialog.action === 'remove' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {confirmDialog.action === 'remove' ? (
                <PersonRemoveIcon sx={{ color: '#ef4444', fontSize: 24 }} />
              ) : (
                <BlockIcon sx={{ color: '#f97316', fontSize: 24 }} />
              )}
            </Box>
            <Box>
              <Typography fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.15rem' }}>
                {confirmDialog.action === 'remove' ? 'Remove Friend' : 'Block User'}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                Please confirm action
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Are you sure you want to <Box component="span" sx={{ fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>{confirmDialog.action}</Box>{' '}
            <Box component="span" sx={{ fontWeight: 750, color: 'var(--primary-color, #ff2d6c)' }}>
              {confirmDialog.friend?.username}
            </Box>?
            {confirmDialog.action === 'remove' && ' They will be removed from your friends list.'}
            {confirmDialog.action === 'block' && ' They will no longer be able to message or interact with you.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              borderRadius: '18px',
              textTransform: 'none',
              fontWeight: 650,
              px: 3,
              py: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (confirmDialog.action === 'remove') {
                await handleRemoveFriend(confirmDialog.friend._id);
                setConfirmDialog({ open: false, action: null, friend: null });
              } else if (confirmDialog.action === 'block') {
                const userId = user && user._id;
                const friendId = confirmDialog.friend._id;
                if (userId && friendId) {
                  // 1. Instantly remove from friends list (optimistic)
                  setFriends(prev => prev.filter(f => f._id !== friendId));
                  // 2. Instantly add to blocked list (optimistic)
                  setBlockedUsers(prev => [...prev, friendId]);
                  // 3. Close dialog immediately
                  setConfirmDialog({ open: false, action: null, friend: null });
                  // 4. Navigate to Blocked Users page instantly with the new user data
                  navigate('/blocked-users', {
                    state: {
                      newlyBlocked: {
                        userId: friendId,
                        username: confirmDialog.friend.username,
                        name: confirmDialog.friend.name,
                        profilePic: confirmDialog.friend.profilePic || confirmDialog.friend.profileImage || ''
                      }
                    }
                  });
                  // 5. Sync to backend in background
                  fetch(`${API_BASE_URL}/api/user/${userId}/block`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blockUserId: friendId }),
                  }).then(() => {
                    if (onBlockChange) onBlockChange();
                  }).catch(err => console.error('Block sync error:', err));
                }
              }
            }}
            variant="contained"
            sx={{
              borderRadius: '18px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              bgcolor: confirmDialog.action === 'remove' ? '#ef4444' : '#f97316',
              color: '#fff',
              boxShadow: confirmDialog.action === 'remove'
                ? '0 4px 16px rgba(239, 68, 68, 0.35)'
                : '0 4px 16px rgba(249, 115, 22, 0.35)',
              '&:hover': {
                bgcolor: confirmDialog.action === 'remove' ? '#dc2626' : '#ea580c',
              },
            }}
          >
            Yes, {confirmDialog.action === 'remove' ? 'Remove' : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;