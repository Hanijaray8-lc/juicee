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
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  CameraAlt as CameraAltIcon,
  DeleteForever as DeleteForeverIcon,
  Block as BlockIcon,
  PersonRemove as PersonRemoveIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import getCroppedImg from './utils/cropImage';
import useSwipeBack from './hooks/useSwipeBack';
import { useNavigate } from 'react-router-dom';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import API_BASE_URL from './config/apiConfig';
import { useSocket } from './context/socketContext';

const UserProfile = ({
  friendRequestsList = [],
  onAcceptFriend,
  onBlockChange,
  hideProfileCard = false,
  initialTab = 0
}) => {
  useSwipeBack();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab !== undefined) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const isMobile = useMediaQuery('(max-width:768px)');
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);
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
  const [imageLoaded, setImageLoaded] = useState(false);

  const populateRequests = async (requestsList) => {
    if (!requestsList || requestsList.length === 0) return [];
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
    if (userId) {
      // --- Local cache: pre-fill profile image instantly from localStorage ---
      const cachedImage = localStorage.getItem('profileImageCache');
      if (cachedImage) {
        setUser(prev => prev ? { ...prev, profileImage: cachedImage } : { profileImage: cachedImage });
      }
      // Fetch full user data; update state (cache stays fresh from save handler)
      fetch(`${API_BASE_URL}/api/user/${userId}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          // Keep cache in sync with latest server value
          if (data.profileImage) {
            localStorage.setItem('profileImageCache', data.profileImage);
          } else {
            localStorage.removeItem('profileImageCache');
          }
        });
      fetch(`${API_BASE_URL}/api/user/${userId}/friends`)
        .then(res => res.json())
        .then(data => setFriends(data));
      fetch(`${API_BASE_URL}/api/user/${userId}/friendRequests`)
        .then(res => res.json())
        .then(async data => {
          const populated = await populateRequests(data);
          setPendingRequests(populated);
        });
    }
  }, []);

  useEffect(() => {
    async function fetchAvatars() {
      const currentIdStr = user && user._id ? String(user._id) : localStorage.getItem('userId');
      const filtered = (friendRequestsList || []).filter(req => {
        if (!req) return false;
        if (req.receiverId && currentIdStr && String(req.receiverId) !== currentIdStr) return false;
        return true;
      });
      const requestsWithImages = await populateRequests(filtered);
      setPendingRequests(requestsWithImages);
    }
    if (user || friendRequestsList) fetchAvatars();
  }, [friendRequestsList, user]);

  useEffect(() => {
    if (activeTab !== 1) return;
    const userId = localStorage.getItem('userId');
    if (!userId) return;
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
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [activeTab]);

  const currentIdStr = user && user._id ? String(user._id) : localStorage.getItem('userId');
  const filteredPendingRequests = (friendRequestsList || [])
    .filter(req => {
      if (!req) return false;
      if (req.receiverId && currentIdStr && String(req.receiverId) !== currentIdStr) return false;
      return true;
    })
    .map(req => ({
      name: req.senderUsername || req.username || 'User',
      avatar: req.profileImage || req.senderProfilePic || null,
      status: 'pending',
      online: false,
      _id: req.senderId || req._id,
      requestId: req.requestId || req._id
    }));

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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const userId = localStorage.getItem('userId');
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('profileImage');
        if (typeof window !== 'undefined' && window.Capacitor) {
          const { AudioRoute } = window.Capacitor.Plugins || {};
          if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
            try {
              await AudioRoute.clearSession();
            } catch (e) { }
          }
        }
        window.location.href = '/signin';
      } else {
        alert('Failed to delete account');
      }
    } catch (err) {
      alert('Server error');
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeleteInput('');
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    fetch(`${API_BASE_URL}/api/user/${userId}/blocked`)
      .then(res => res.json())
      .then(data => setBlockedUsers(data.map(u => u.userId)));
  }, []);

  const visibleFriends = friends.filter(f => !blockedUsers.includes(f._id));

  const getProfileImageSrc = (profileImage) => {
    if (!profileImage) return undefined;
    return profileImage.startsWith('data:') ? profileImage : `data:image/jpeg;base64,${profileImage}`;
  };

  if (!user) {
    return (
      <Box sx={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'var(--background-color, #fff6f8)',
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="text" width={120} height={30} sx={{ mx: 'auto' }} />
          <Skeleton variant="text" width={80} height={20} sx={{ mx: 'auto', mt: 1 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        bgcolor: 'var(--background-color, #fff6f8)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Poppins', 'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-color, #ec407a)15, transparent 70%)',
          opacity: 0.08,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-color, #ff6f91)20, transparent 70%)',
          opacity: 0.06,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Main scrollable container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: isMobile ? 1.5 : 4,
          pt: isMobile ? 2 : 4,
          pb: isMobile ? { xs: 20, sm: 12, md: 6 } : 8,
          position: 'relative',
          zIndex: 1,
          '&::-webkit-scrollbar': {
            width: '0px',
            display: 'none',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'transparent',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <Box
          sx={{
            maxWidth: '1200px',
            mx: 'auto',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 4,
          }}
        >
          {/* Profile Card - Full width on mobile */}
          {!hideProfileCard && (
            <Box
              sx={{
                flex: isMobile ? '1 1 100%' : '0 0 380px',
                position: 'relative',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'var(--surface-color, rgba(255, 255, 255, 0.85))',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 8px 32px rgba(var(--primary-color, 236,64,122), 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                  position: 'relative',
                  width: '100%',
                }}
              >
                {/* Decorative header gradient */}
                <Box
                  sx={{
                    height: isMobile ? '100px' : '120px',
                    background: 'linear-gradient(135deg, var(--primary-color, #ff6f91) 0%, var(--primary-color, #ec407a) 50%, var(--primary-color, #d81b60) 100%)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '60px',
                      background: 'linear-gradient(to top, var(--surface-color, rgba(255,255,255,0.85)), transparent)',
                    },
                  }}
                />

                <Box sx={{ px: isMobile ? 2 : 3, pb: 3, position: 'relative', mt: '-50px' }}>
                  {/* Avatar with glass effect */}
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
                              bgcolor: 'var(--surface-color, #fff)',
                              border: '2px solid var(--primary-color, #ec407a)',
                              color: 'var(--primary-color, #ec407a)',
                              width: 36,
                              height: 36,
                              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                bgcolor: 'var(--primary-color, #ec407a)',
                                color: 'var(--surface-color, #fff)',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <CameraAltIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <Avatar
                        sx={{
                          width: isMobile ? 90 : 110,
                          height: isMobile ? 90 : 110,
                          bgcolor: 'var(--background-color, #fce4ec)',
                          fontSize: isMobile ? 36 : 44,
                          fontWeight: 600,
                          border: '4px solid var(--surface-color, #fff)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          transition: 'transform 0.3s ease',
                          '&:hover': { transform: 'scale(1.05)' },
                        }}
                        src={getProfileImageSrc(user.profileImage)}
                        onClick={() => setPreviewOpen(true)}
                      >
                        {!user.profileImage && user.name?.[0]}
                      </Avatar>
                    </Badge>
                  </Box>

                  {/* Image edit actions */}
                  <Fade in={editingImg}>
                    <Box
                      sx={{
                        display: editingImg ? 'flex' : 'none',
                        flexDirection: 'row',
                        gap: 1.5,
                        mb: 2,
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
                          borderColor: '#ffcdd2',
                          color: 'var(--primary-color, #e53935)',
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          px: 2,
                          '&:hover': {
                            borderColor: 'var(--primary-color, #ef5350)',
                            bgcolor: 'rgba(229,57,53,0.04)',
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
                          bgcolor: 'var(--primary-color, #ec407a)',
                          color: 'var(--surface-color, #fff)',
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          px: 2,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          '&:hover': {
                            bgcolor: 'var(--primary-color, #d81b60)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
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

                  {/* User Info */}
                  <Box textAlign="center" mb={3}>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      fontWeight={700}
                      sx={{
                        color: 'var(--text-color, #1a1a2e)',
                        letterSpacing: '-0.02em',
                        mb: 0.5,
                      }}
                    >
                      {user.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--primary-color, #ec407a)',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                      }}
                    >
                      @{user.username}
                    </Typography>
                    <Chip
                      label="Online"
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        color: '#2e7d32',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24,
                        '& .MuiChip-label': { px: 1.5 },
                      }}
                    />
                  </Box>

                  {/* Details */}
                  <Box mb={3}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ color: 'var(--text-color, #1a1a2e)', fontSize: '0.85rem', mb: 1.5, letterSpacing: '0.02em' }}
                    >
                      Details
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'rgba(var(--primary-color, 236,64,122), 0.08)',
                        borderRadius: '16px',
                        p: '1rem',
                        border: '1px solid rgba(var(--primary-color, 236,64,122), 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      {[
                        { label: 'Email', value: user.email, icon: '✉️' },
                        { label: 'Phone', value: user.phone, icon: '📱' },
                        { label: 'Gender', value: user.gender, icon: '👤' },
                      ].map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontSize: '1rem' }}>{item.icon}</Typography>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: '#888', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            >
                              {item.label}
                            </Typography>
                            <Typography
                              fontSize="0.85rem"
                              sx={{ color: '#4a4a6a', fontWeight: 500 }}
                            >
                              {item.value || 'Not set'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Delete Account */}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{
                      borderColor: 'rgba(229, 57, 53, 0.3)',
                      color: '#e53935',
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(229, 57, 53, 0.04)',
                        borderColor: '#e53935',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(229,57,53,0.1)',
                      },
                    }}
                  >
                    Delete Account
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Friends / Requests Panel - With 5 default users and scroll */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'var(--surface-color, rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px rgba(var(--primary-color, 236,64,122), 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                height: isMobile ? 'auto' : (hideProfileCard ? 'calc(100vh - 120px)' : '580px'),
                minHeight: isMobile ? '500px' : (hideProfileCard ? 'calc(100vh - 120px)' : '580px'),
                maxHeight: isMobile ? '80vh' : (hideProfileCard ? 'calc(100vh - 120px)' : '580px'),
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* MUI Tabs */}
              <Box sx={{ px: isMobile ? 1 : 2, pt: 1.5 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, newVal) => setActiveTab(newVal)}
                  variant="fullWidth"
                  TabIndicatorProps={{
                    style: {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                      background: 'var(--primary-color, #ec407a)',
                    },
                  }}
                  sx={{
                    bgcolor: 'rgba(236,64,122, 0.05)',
                    borderRadius: '16px 16px 0 0',
                    minHeight: 52,
                    '& .MuiTabs-root': { minHeight: 52 },
                    '& .MuiTab-root': {
                      minHeight: 52,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.82rem' : '0.9rem',
                      fontFamily: "'Poppins', 'Inter', sans-serif",
                      color: '#999',
                      letterSpacing: '0.01em',
                      transition: 'color 0.25s ease',
                      gap: 0.8,
                      '&.Mui-selected': {
                        color: 'var(--primary-color, #ec407a)',
                        fontWeight: 700,
                      },
                    },
                  }}
                >
                  <Tab
                    icon={<PeopleAltIcon sx={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }} />}
                    iconPosition="start"
                    label="Friends"
                  />
                  <Tab
                    icon={<PersonAddAlt1Icon sx={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        Requests
                        {activePendingRequests.length > 0 && (
                          <Box
                            component="span"
                            sx={{
                              bgcolor: 'var(--primary-color, #ec407a)',
                              color: '#fff',
                              borderRadius: '20px',
                              minWidth: 20,
                              height: 20,
                              px: 0.6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              lineHeight: 1,
                              boxShadow: '0 2px 6px rgba(236,64,122,0.4)',
                            }}
                          >
                            {activePendingRequests.length}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </Tabs>
                <Box sx={{ height: '1px', bgcolor: 'rgba(236,64,122,0.12)', mx: -2 }} />
              </Box>

              {/* Scrollable List Container - 5 users default, scroll for others */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  px: isMobile ? 2 : 2,
                  py: 0.5,
                  '&::-webkit-scrollbar': {
                    width: '0px',
                    display: 'none',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'transparent',
                  },
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* IE/Edge */
                }}
              >
                <List sx={{ p: 0, pb: isMobile ? 13 : 10 }}>
                  {/* Friends List - Show 5 users by default, rest scrollable */}
                  {activeTab === 0 && (
                    <>
                      {visibleFriends
                        .filter(friend => friend.username && friend.username !== 'Unknown')
                        .slice(0, 5)
                        .map((friend, index) => (
                          <Zoom in key={friend._id || index} style={{ transitionDelay: `${index * 30}ms` }}>
                            <ListItem
                              sx={{
                                px: isMobile ? 1.5 : 2,
                                py: isMobile ? 1 : 1.5,
                                mb: 1.5,
                                borderRadius: '16px',
                                bgcolor: '#fff',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                border: '1px solid rgba(0,0,0,0.03)',
                                transition: 'all 0.2s ease',
                                flexWrap: 'wrap',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                  borderColor: 'rgba(236, 64, 122, 0.15)',
                                },
                              }}
                            >
                              <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1 }}>
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
                                      border: '2px solid white',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    },
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: isMobile ? 44 : 52,
                                      height: isMobile ? 44 : 52,
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                      flexShrink: 0,
                                      ...(!friend.profilePic && {
                                        bgcolor: 'var(--primary-color, #f06292)',
                                        color: '#fff',
                                        fontWeight: 600
                                      })
                                    }}
                                    src={friend.profilePic || undefined}
                                  >
                                    {friend.username?.[0]?.toUpperCase()}
                                  </Avatar>
                                </Badge>
                              </ListItemAvatar>

                              <ListItemText
                                primary={
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                                      color: '#1a1a2e',
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
                                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                                      color: '#888',
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

                              <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
                                <Tooltip title="Remove friend" arrow disableTouchListener={isMobile}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setConfirmDialog({ open: true, action: 'remove', friend })}
                                    sx={{
                                      color: '#e53935',
                                      bgcolor: 'rgba(229, 57, 53, 0.08)',
                                      width: isMobile ? 28 : 32,
                                      height: isMobile ? 28 : 32,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(229, 57, 53, 0.15)',
                                        transform: 'scale(1.05)',
                                      },
                                    }}
                                  >
                                    <PersonRemoveIcon fontSize={isMobile ? "small" : "small"} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Block" arrow disableTouchListener={isMobile}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setConfirmDialog({ open: true, action: 'block', friend })}
                                    sx={{
                                      color: '#ff9100',
                                      bgcolor: 'rgba(255, 145, 0, 0.08)',
                                      width: isMobile ? 28 : 32,
                                      height: isMobile ? 28 : 32,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(255, 145, 0, 0.15)',
                                        transform: 'scale(1.05)',
                                      },
                                    }}
                                  >
                                    <BlockIcon fontSize={isMobile ? "small" : "small"} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItem>
                          </Zoom>
                        ))}

                      {/* Show remaining friends (beyond 5) with scroll */}
                      {visibleFriends.filter(f => f.username && f.username !== 'Unknown').length > 5 && (
                        <>
                          <Divider sx={{ my: 2 }}>
                            <Chip
                              label={`${visibleFriends.filter(f => f.username && f.username !== 'Unknown').length - 5} more friends`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(236, 64, 122, 0.1)',
                                color: '#ec407a',
                                fontWeight: 600,
                                fontSize: '0.7rem'
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
                                    px: isMobile ? 1.5 : 2,
                                    py: isMobile ? 1 : 1.5,
                                    mb: 1.5,
                                    borderRadius: '16px',
                                    bgcolor: '#fff',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    border: '1px solid rgba(0,0,0,0.03)',
                                    transition: 'all 0.2s ease',
                                    flexWrap: 'wrap',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                      borderColor: 'rgba(236, 64, 122, 0.15)',
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1 }}>
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
                                          border: '2px solid white',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        },
                                      }}
                                    >
                                      <Avatar
                                        sx={{
                                          width: isMobile ? 44 : 52,
                                          height: isMobile ? 44 : 52,
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                          flexShrink: 0,
                                          ...(!friend.profilePic && {
                                            bgcolor: 'var(--primary-color, #f06292)',
                                            color: '#fff',
                                            fontWeight: 600
                                          })
                                        }}
                                        src={friend.profilePic || undefined}
                                      >
                                        {friend.username?.[0]?.toUpperCase()}
                                      </Avatar>
                                    </Badge>
                                  </ListItemAvatar>

                                  <ListItemText
                                    primary={
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: isMobile ? '0.85rem' : '0.95rem',
                                          color: '#1a1a2e',
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
                                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                                          color: '#888',
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

                                  <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
                                    <Tooltip title="Remove friend" arrow disableTouchListener={isMobile}>
                                      <IconButton
                                        size="small"
                                        onClick={() => setConfirmDialog({ open: true, action: 'remove', friend })}
                                        sx={{
                                          color: '#e53935',
                                          bgcolor: 'rgba(229, 57, 53, 0.08)',
                                          width: isMobile ? 28 : 32,
                                          height: isMobile ? 28 : 32,
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'rgba(229, 57, 53, 0.15)',
                                            transform: 'scale(1.05)',
                                          },
                                        }}
                                      >
                                        <PersonRemoveIcon fontSize={isMobile ? "small" : "small"} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Block" arrow disableTouchListener={isMobile}>
                                      <IconButton
                                        size="small"
                                        onClick={() => setConfirmDialog({ open: true, action: 'block', friend })}
                                        sx={{
                                          color: '#ff9100',
                                          bgcolor: 'rgba(255, 145, 0, 0.08)',
                                          width: isMobile ? 28 : 32,
                                          height: isMobile ? 28 : 32,
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'rgba(255, 145, 0, 0.15)',
                                            transform: 'scale(1.05)',
                                          },
                                        }}
                                      >
                                        <BlockIcon fontSize={isMobile ? "small" : "small"} />
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
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              bgcolor: 'rgba(236, 64, 122, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 2,
                            }}
                          >
                            <PeopleAltIcon sx={{ fontSize: 40, color: 'rgba(236, 64, 122, 0.3)' }} />
                          </Box>
                          <Typography variant="body1" sx={{ color: '#888', fontWeight: 600, mb: 1 }}>
                            No friends yet
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#aaa', mb: 3, fontSize: '0.85rem' }}>
                            Start building your network today
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => navigate('/chat?tab=search')}
                            sx={{
                              bgcolor: '#ec407a',
                              color: '#fff',
                              borderRadius: '12px',
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 3,
                              boxShadow: '0 4px 16px rgba(236,64,122,0.3)',
                              '&:hover': {
                                bgcolor: '#d81b60',
                                boxShadow: '0 6px 20px rgba(236,64,122,0.4)',
                              },
                            }}
                          >
                            Find Friends
                          </Button>
                        </Box>
                      )}
                    </>
                  )}

                  {/* Requests List - Show 5 by default, rest scrollable */}
                  {activeTab === 1 && (
                    <>
                      {activePendingRequests.slice(0, 5).map((friend, index) => {
                        const sId = (typeof friend.senderId === 'object' ? friend.senderId?._id : friend.senderId) || friend._id;
                        const displayName = friend.name || friend.senderUsername || friend.username || 'Unknown';
                        const displayUsername = friend.username || friend.senderUsername || '';
                        const displayAvatar = friend.avatar || friend.senderProfilePic || null;

                        return (
                          <Zoom in key={friend.requestId || friend._id || index} style={{ transitionDelay: `${index * 30}ms` }}>
                            <ListItem
                              sx={{
                                px: isMobile ? 1.5 : 2,
                                py: isMobile ? 1 : 1.5,
                                mb: 1.5,
                                borderRadius: '16px',
                                bgcolor: '#fff',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                border: '1px solid rgba(0,0,0,0.03)',
                                transition: 'all 0.2s ease',
                                flexWrap: 'wrap',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                  borderColor: 'rgba(236, 64, 122, 0.15)',
                                },
                              }}
                            >
                              <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1 }}>
                                <Avatar
                                  sx={{
                                    width: isMobile ? 44 : 52,
                                    height: isMobile ? 44 : 52,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    flexShrink: 0,
                                    ...(!displayAvatar && {
                                      bgcolor: 'var(--primary-color, #f06292)',
                                      color: '#fff',
                                      fontWeight: 600
                                    })
                                  }}
                                  src={displayAvatar || undefined}
                                >
                                  {displayName?.[0]?.toUpperCase()}
                                </Avatar>
                              </ListItemAvatar>

                              <ListItemText
                                primary={
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                                      color: '#1a1a2e',
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
                                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                                      color: '#888',
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

                              <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
                                <Tooltip title="Accept" arrow disableTouchListener={isMobile}>
                                  <IconButton
                                    onClick={() => handleRequestAction(friend, 'accept')}
                                    sx={{
                                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                                      color: '#2e7d32',
                                      width: isMobile ? 32 : 36,
                                      height: isMobile ? 32 : 36,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(76, 175, 80, 0.2)',
                                        transform: 'scale(1.05)',
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
                                      bgcolor: 'rgba(244, 67, 54, 0.1)',
                                      color: '#c62828',
                                      width: isMobile ? 32 : 36,
                                      height: isMobile ? 32 : 36,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(244, 67, 54, 0.2)',
                                        transform: 'scale(1.05)',
                                      },
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItem>
                          </Zoom>
                        )
                      })}

                      {/* Show remaining requests (beyond 5) with scroll */}
                      {activePendingRequests.length > 5 && (
                        <>
                          <Divider sx={{ my: 2 }}>
                            <Chip
                              label={`${activePendingRequests.length - 5} more requests`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(236, 64, 122, 0.1)',
                                color: '#ec407a',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                          </Divider>

                          {activePendingRequests.slice(5).map((friend, index) => {
                            const sId = (typeof friend.senderId === 'object' ? friend.senderId?._id : friend.senderId) || friend._id;
                            const displayName = friend.name || friend.senderUsername || friend.username || 'Unknown';
                            const displayUsername = friend.username || friend.senderUsername || '';
                            const displayAvatar = friend.avatar || friend.senderProfilePic || null;

                            return (
                              <Zoom in key={friend.requestId || friend._id || `remaining-${index}`} style={{ transitionDelay: `${index * 30}ms` }}>
                                <ListItem
                                  sx={{
                                    px: isMobile ? 1.5 : 2,
                                    py: isMobile ? 1 : 1.5,
                                    mb: 1.5,
                                    borderRadius: '16px',
                                    bgcolor: '#fff',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    border: '1px solid rgba(0,0,0,0.03)',
                                    transition: 'all 0.2s ease',
                                    flexWrap: 'wrap',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                      borderColor: 'rgba(236, 64, 122, 0.15)',
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: isMobile ? 44 : 52, mr: 1 }}>
                                    <Avatar
                                      sx={{
                                        width: isMobile ? 44 : 52,
                                        height: isMobile ? 44 : 52,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        flexShrink: 0,
                                        ...(!displayAvatar && {
                                          bgcolor: 'var(--primary-color, #f06292)',
                                          color: '#fff',
                                          fontWeight: 600
                                        })
                                      }}
                                      src={displayAvatar || undefined}
                                    >
                                      {displayName?.[0]?.toUpperCase()}
                                    </Avatar>
                                  </ListItemAvatar>

                                  <ListItemText
                                    primary={
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: isMobile ? '0.85rem' : '0.95rem',
                                          color: '#1a1a2e',
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
                                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                                          color: '#888',
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

                                  <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
                                    <Tooltip title="Accept" arrow disableTouchListener={isMobile}>
                                      <IconButton
                                        onClick={() => handleRequestAction(friend, 'accept')}
                                        sx={{
                                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                                          color: '#2e7d32',
                                          width: isMobile ? 32 : 36,
                                          height: isMobile ? 32 : 36,
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'rgba(76, 175, 80, 0.2)',
                                            transform: 'scale(1.05)',
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
                                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                                          color: '#c62828',
                                          width: isMobile ? 32 : 36,
                                          height: isMobile ? 32 : 36,
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'rgba(244, 67, 54, 0.2)',
                                            transform: 'scale(1.05)',
                                          },
                                        }}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </ListItem>
                              </Zoom>
                            )
                          })}
                        </>
                      )}

                      {/* Empty state for requests */}
                      {activePendingRequests.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              bgcolor: 'rgba(236, 64, 122, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 2,
                            }}
                          >
                            <PersonAddAlt1Icon sx={{ fontSize: 40, color: 'rgba(236, 64, 122, 0.3)' }} />
                          </Box>
                          <Typography variant="body1" sx={{ color: '#888', fontWeight: 600 }}>
                            No pending requests
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#aaa', mt: 0.5, fontSize: '0.85rem' }}>
                            Check back later for new friend requests
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

      {/* Delete Account Dialog - Same as original */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'var(--surface-color, rgba(255, 255, 255, 0.95))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'var(--surface-color, rgba(255, 255, 255, 0.95))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DeleteForeverIcon sx={{ color: 'var(--primary-color, #e53935)' }} />
            </Box>
            <Typography fontWeight={700} sx={{ color: 'var(--text-color, #ff5f5f)', fontSize: '1.1rem' }}>
              Delete Account
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ color: '#666', fontSize: '0.9rem', mb: 2, lineHeight: 1.6 }}>
            This action is permanent and cannot be undone. All your data will be permanently removed.
          </Typography>
          <Typography sx={{ color: '#1a1a2e', fontSize: '0.85rem', mb: 1, fontWeight: 600 }}>
            Type <Box component="span" sx={{ color: '#e53935', fontWeight: 700 }}>"Delete My Account"</Box> to confirm:
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
                borderRadius: '12px',
                bgcolor: 'rgba(229, 57, 53, 0.03)',
                fontFamily: 'Poppins',
                fontSize: '0.9rem',
                '& fieldset': {
                  borderColor: 'rgba(229, 57, 53, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(229, 57, 53, 0.4)',
                },
                '&.Mui-focused fieldSet': {
                  borderColor: '#e53935',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#888',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            disabled={deleteInput !== 'Delete My Account' || deleting}
            sx={{
              bgcolor: '#e53935',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 16px rgba(229,57,53,0.3)',
              '&:hover': { bgcolor: '#c62828' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(229, 57, 53, 0.3)',
                color: 'rgba(255,255,255,0.6)',
              },
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cropper Dialog - Same as original */}
      <Dialog
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{
          bgcolor: '#1a1a2e',
          color: '#fff',
          py: 2,
          px: 3,
          fontWeight: 700,
          fontSize: '1.1rem',
        }}>
          Crop Profile Photo
        </DialogTitle>
        <DialogContent sx={{ position: 'relative', height: 320, bgcolor: '#1a1a2e', p: 0 }}>
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
        <Box sx={{ px: 3, py: 2, bgcolor: '#fff' }}>
          <Typography variant="caption" sx={{ color: '#888', mb: 1, display: 'block', fontWeight: 500 }}>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value)}
            sx={{
              color: '#ec407a',
              '& .MuiSlider-thumb': {
                boxShadow: '0 2px 8px rgba(236,64,122,0.4)',
              },
            }}
          />
        </Box>
        <DialogActions sx={{ px: 3, pb: 3, bgcolor: '#fff', gap: 1 }}>
          <Button
            onClick={() => setCropModalOpen(false)}
            sx={{
              color: '#888',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
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
              bgcolor: '#ec407a',
              color: '#fff',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 16px rgba(236,64,122,0.3)',
              '&:hover': { bgcolor: '#d81b60' },
            }}
          >
            Save Photo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog - Same as original */}
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
              width: isMobile ? 240 : 280,
              height: isMobile ? 240 : 280,
              bgcolor: '#fce4ec',
              border: '4px solid #fff',
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
              fontSize: isMobile ? 80 : 100,
              fontWeight: 700,
            }}
          >
            {!user.profileImage && user.name?.[0]}
          </Avatar>
          <Button
            onClick={() => setPreviewOpen(false)}
            sx={{
              mt: 3,
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1,
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            Close Preview
          </Button>
        </Box>
      </Dialog>

      {/* Confirmation Dialog - Same as original */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: confirmDialog.action === 'remove' ? 'rgba(229, 57, 53, 0.1)' : 'rgba(255, 145, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {confirmDialog.action === 'remove' ? (
                <PersonRemoveIcon sx={{ color: '#e53935' }} />
              ) : (
                <BlockIcon sx={{ color: '#ff9100' }} />
              )}
            </Box>
            <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: '1.1rem' }}>
              {confirmDialog.action === 'remove' ? 'Remove Friend' : 'Block User'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Are you sure you want to <Box component="span" sx={{ fontWeight: 700, color: '#1a1a2e' }}>{confirmDialog.action}</Box>{' '}
            <Box component="span" sx={{ fontWeight: 700, color: '#ec407a' }}>
              {confirmDialog.friend?.username}
            </Box>?
            {confirmDialog.action === 'remove' && ' They will be removed from your friends list.'}
            {confirmDialog.action === 'block' && ' They will no longer be able to interact with you.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            sx={{
              color: '#888',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (confirmDialog.action === 'remove') {
                await handleRemoveFriend(confirmDialog.friend._id);
              } else if (confirmDialog.action === 'block') {
                const userId = user && user._id;
                if (userId && confirmDialog.friend._id) {
                  await fetch(`${API_BASE_URL}/api/user/${userId}/block`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blockUserId: confirmDialog.friend._id }),
                  });
                  setBlockedUsers(prev => [...prev, confirmDialog.friend._id]);
                  if (onBlockChange) onBlockChange();
                }
              }
              setConfirmDialog({ open: false, action: null, friend: null });
            }}
            variant="contained"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              bgcolor: confirmDialog.action === 'remove' ? '#e53935' : '#ff9100',
              color: '#fff',
              boxShadow: confirmDialog.action === 'remove'
                ? '0 4px 16px rgba(229,57,53,0.3)'
                : '0 4px 16px rgba(255,145,0,0.3)',
              '&:hover': {
                bgcolor: confirmDialog.action === 'remove' ? '#c62828' : '#f57c00',
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