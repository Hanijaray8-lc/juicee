import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Chip,
  Paper,
  InputBase,
  Skeleton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import BrushIcon from '@mui/icons-material/Brush';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GestureIcon from '@mui/icons-material/Gesture';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './config/apiConfig';
import {
  getFriendsLocally,
  saveFriendsLocally,
  getContactGesturesLocally,
  saveContactGesturesLocally,
} from './db/offlineDb';
import { getProfileImageSrc } from './utils/imageUtils';

// ==========================================
// GESTURE MATCHER MATHEMATICAL UTILITIES
// ==========================================

// Helper to calculate Euclidean distance between two points
function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Helper to calculate total length of a path
function pathLength(points) {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += distance(points[i - 1], points[i]);
  }
  return d;
}

// Resamples points to a standard number N of points
function resample(points, n) {
  if (points.length === 0) return [];
  const I = pathLength(points) / (n - 1); // Interval length
  let D = 0;
  const newPoints = [points[0]];
  const pts = [...points];
  
  for (let i = 1; i < pts.length; i++) {
    const d = distance(pts[i - 1], pts[i]);
    if ((D + d) >= I) {
      const qx = pts[i - 1].x + ((I - D) / d) * (pts[i].x - pts[i - 1].x);
      const qy = pts[i - 1].y + ((I - D) / d) * (pts[i].y - pts[i - 1].y);
      const q = { x: qx, y: qy };
      newPoints.push(q);
      pts.splice(i, 0, q); // Insert q as next point to calculate from
      D = 0;
    } else {
      D += d;
    }
  }
  
  // Ensure exactly N points
  while (newPoints.length < n) {
    newPoints.push(points[points.length - 1]);
  }
  return newPoints.slice(0, n);
}

// Scales points to a square bounding box
function scaleTo(points, size = 200) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i++) {
    if (points[i].x < minX) minX = points[i].x;
    if (points[i].x > maxX) maxX = points[i].x;
    if (points[i].y < minY) minY = points[i].y;
    if (points[i].y > maxY) maxY = points[i].y;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Avoid division by zero
  const scaleX = width > 0 ? (size / width) : 1;
  const scaleY = height > 0 ? (size / height) : 1;
  
  return points.map(p => ({
    x: (p.x - minX) * scaleX,
    y: (p.y - minY) * scaleY
  }));
}

// Translates points relative to their centroid to the origin (0, 0)
function translateToOrigin(points) {
  let totalX = 0, totalY = 0;
  for (let i = 0; i < points.length; i++) {
    totalX += points[i].x;
    totalY += points[i].y;
  }
  const centroidX = totalX / points.length;
  const centroidY = totalY / points.length;
  
  return points.map(p => ({
    x: p.x - centroidX,
    y: p.y - centroidY
  }));
}

// Combines all steps to normalize a gesture
export function normalizeGesture(points, n = 32, size = 200) {
  if (points.length < 2) return [];
  const resampled = resample(points, n);
  const scaled = scaleTo(resampled, size);
  const translated = translateToOrigin(scaled);
  return translated;
}

// Matches two gestures by averaging point distance
export function matchGestures(points1, points2) {
  if (points1.length !== points2.length || points1.length === 0) return Infinity;
  let sum = 0;
  for (let i = 0; i < points1.length; i++) {
    sum += distance(points1[i], points2[i]);
  }
  return sum / points1.length;
}

// ==========================================
// COMPONENT IMPLEMENTATION
// ==========================================

const FinderPage = () => {
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  // Instant synchronous initial load to eliminate any load buffer / white screen
  const [friends, setFriends] = useState(() => {
    if (!userId) return [];
    try {
      const cached = localStorage.getItem(`juicy_cached_friends_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [savedGestures, setSavedGestures] = useState(() => {
    try {
      const saved = localStorage.getItem('juicy_contact_gestures');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {};
  });

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
    return false;
  });

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
          }
        }
      } catch (e) {}
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // Only show initial skeleton if we have neither cached friends nor cached gestures
  const [initialLoading, setInitialLoading] = useState(() => {
    if (!userId) return false;
    try {
      const cachedFriends = localStorage.getItem(`juicy_cached_friends_${userId}`);
      return !cachedFriends;
    } catch (e) {
      return false;
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'mapped', 'unmapped'
  const [drawingUser, setDrawingUser] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const canvasRef = useRef(null);

  // Sync to Native Capacitor Plugin
  const syncToNative = (gesturesObj) => {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) {
      const { AudioRoute } = window.Capacitor.Plugins;
      if (AudioRoute && typeof AudioRoute.setLockedContacts === 'function') {
        const contacts = Object.keys(gesturesObj);
        AudioRoute.setLockedContacts({ contacts })
          .then(() => console.log('📱 Synced locked contacts to native:', contacts))
          .catch(err => console.error('📱 Error syncing locked contacts to native:', err));
      }
    }
  };

  // 1. FAST SQLITE INITIAL LOAD & 2. BACKGROUND SERVER SYNC
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!userId) {
      setInitialLoading(false);
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    // Step A: Load from SQLite immediately (offline-first instant response)
    try {
      const [sqliteFriends, sqliteGestures] = await Promise.all([
        getFriendsLocally(userId),
        getContactGesturesLocally(userId),
      ]);

      if (Array.isArray(sqliteFriends) && sqliteFriends.length > 0) {
        setFriends(sqliteFriends);
        try {
          localStorage.setItem(`juicy_cached_friends_${userId}`, JSON.stringify(sqliteFriends));
        } catch (e) {}
        setInitialLoading(false);
      }

      if (sqliteGestures && Object.keys(sqliteGestures).length > 0) {
        setSavedGestures(sqliteGestures);
        try {
          localStorage.setItem('juicy_contact_gestures', JSON.stringify(sqliteGestures));
        } catch (e) {}
      }
    } catch (sqliteErr) {
      console.warn('⚠️ SQLite fast load notice in finder:', sqliteErr);
    }

    // Step B: Parallel Background Sync from Backend (non-blocking)
    try {
      const [friendsRes, userRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/user/${userId}/friends`),
        fetch(`${API_BASE_URL}/api/user/${userId}`),
      ]);

      // Process Friends Response
      if (friendsRes.status === 'fulfilled' && friendsRes.value.ok) {
        const friendsData = await friendsRes.value.json();
        if (Array.isArray(friendsData)) {
          setFriends(friendsData);
          // Persist fresh friends list to SQLite & localStorage
          saveFriendsLocally(userId, friendsData);
          try {
            localStorage.setItem(`juicy_cached_friends_${userId}`, JSON.stringify(friendsData));
          } catch (e) {}
        }
      }

      // Process User & Gestures Response
      if (userRes.status === 'fulfilled' && userRes.value.ok) {
        const userData = await userRes.value.json();
        if (userData && userData.gestures) {
          setSavedGestures(userData.gestures);
          // Persist fresh gestures to SQLite & localStorage
          saveContactGesturesLocally(userId, userData.gestures, 'synced');
          syncToNative(userData.gestures);
        }
      }

      if (isManualRefresh) {
        setSnackbar({ open: true, message: 'Contacts & gestures updated', severity: 'success' });
      }
    } catch (networkErr) {
      console.warn('⚠️ Background network sync notice in finder:', networkErr);
      if (isManualRefresh) {
        setSnackbar({ open: true, message: 'Using offline data', severity: 'info' });
      }
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Set up canvas styling when drawing user modal opens
  useEffect(() => {
    if (drawingUser && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#f06292'; // matching juicee primary pink
      ctx.shadowColor = '#f06292';
      ctx.shadowBlur = 8;
      setPoints([]);
    }
  }, [drawingUser]);

  const getTouchPos = (canvas, touchEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touchEvent.touches[0].clientX - rect.left,
      y: touchEvent.touches[0].clientY - rect.top
    };
  };

  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();

    let pos;
    if (e.touches) {
      e.preventDefault();
      pos = getTouchPos(canvas, e);
    } else {
      const rect = canvas.getBoundingClientRect();
      pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setPoints([pos]);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let pos;
    if (e.touches) {
      e.preventDefault();
      pos = getTouchPos(canvas, e);
    } else {
      const rect = canvas.getBoundingClientRect();
      pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setPoints(prev => [...prev, pos]);
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPoints([]);
  };

  // Optimistic Offline-First Save
  const saveGesture = async () => {
    if (points.length < 8) {
      setSnackbar({ open: true, message: 'Gesture is too short. Draw a longer stroke.', severity: 'warning' });
      return;
    }

    const normalized = normalizeGesture(points, 32, 200);
    const friendId = drawingUser._id || drawingUser.id;
    const friendName = drawingUser.username || drawingUser.name || 'Friend';

    const updated = {
      ...savedGestures,
      [friendId]: {
        username: friendName,
        points: normalized
      }
    };

    // 1. Optimistically update React state immediately (0ms delay)
    setSavedGestures(updated);
    setDrawingUser(null);
    setSnackbar({ open: true, message: `Gesture saved for ${friendName}!`, severity: 'success' });

    // 2. Instantly persist to SQLite and localStorage
    await saveContactGesturesLocally(userId, updated, 'pending');

    // 3. Sync to Native Android Plugin
    syncToNative(updated);

    // 4. Background Sync to Backend
    fetch(`${API_BASE_URL}/api/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gestures: updated })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update gestures on backend');
        return res.json();
      })
      .then(() => {
        // Mark SQLite status as synced
        saveContactGesturesLocally(userId, updated, 'synced');
      })
      .catch(err => {
        console.warn('⚠️ Background gesture sync notice (saved offline in SQLite):', err);
      });
  };

  // Optimistic Offline-First Delete
  const deleteGesture = async (friendId, username) => {
    const updated = { ...savedGestures };
    delete updated[friendId];

    // 1. Optimistically update React state immediately
    setSavedGestures(updated);
    setSnackbar({ open: true, message: `Gesture removed for ${username}`, severity: 'info' });

    // 2. Instantly persist to SQLite and localStorage
    await saveContactGesturesLocally(userId, updated, 'pending');

    // 3. Sync to Native Android Plugin
    syncToNative(updated);

    // 4. Background Sync to Backend
    fetch(`${API_BASE_URL}/api/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gestures: updated })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update gestures on backend');
        return res.json();
      })
      .then(() => {
        saveContactGesturesLocally(userId, updated, 'synced');
      })
      .catch(err => {
        console.warn('⚠️ Background gesture delete notice (updated offline in SQLite):', err);
      });
  };

  // Filtered and Searched Friends List
  const filteredFriends = useMemo(() => {
    return friends.filter(friend => {
      const friendId = friend._id || friend.id;
      const isMapped = !!savedGestures[friendId];

      if (activeFilter === 'mapped' && !isMapped) return false;
      if (activeFilter === 'unmapped' && isMapped) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const name = (friend.name || '').toLowerCase();
        const uname = (friend.username || '').toLowerCase();
        return name.includes(query) || uname.includes(query);
      }

      return true;
    });
  }, [friends, savedGestures, activeFilter, searchQuery]);

  // Stats
  const mappedCount = useMemo(() => {
    return friends.filter(f => !!savedGestures[f._id || f.id]).length;
  }, [friends, savedGestures]);

  const unmappedCount = friends.length - mappedCount;

  return (
    <Box sx={{
      height: '100%',
      bgcolor: 'var(--background-color, #faf5f7)',
      background: 'var(--background-color, #faf5f7)',
      color: 'var(--text-color, #1a1a2e)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: `'Poppins', sans-serif`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative top background gradients */}
      <Box sx={{
        position: 'absolute',
        top: -80,
        right: -60,
        width: 240,
        height: 240,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(var(--primary-rgb, 240,98,146), 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        top: 60,
        left: -50,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(var(--primary-rgb, 240,98,146), 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header Bar */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: currentIsDark ? 'rgba(26, 20, 36, 0.95)' : 'var(--surface-color, rgba(250,245,247,0.96))',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(var(--primary-rgb, 240,98,146), 0.15)',
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2.5 },
        pb: 1.5
      }}>
        {/* Top title and back row */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <IconButton 
            onClick={() => navigate('/chat?tab=settings')} 
            sx={{
              color: 'var(--primary-color, #f06292)',
              mr: 1.5,
              bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.08)',
              '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.18)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{
                fontWeight: 800,
                color: 'var(--text-color, #1a1a2e)',
                letterSpacing: '-0.4px',
                lineHeight: 1.2
              }}>
                Contact Gestures
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ 
              color: currentIsDark ? 'rgba(255,255,255,0.6)' : '#888', 
              display: 'block', 
              mt: 0.2,
              fontWeight: 500 
            }}>
              Instant gesture shortcuts powered by SQLite
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh from server">
              <IconButton
                size="small"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                sx={{
                  color: 'var(--primary-color, #f06292)',
                  bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.08)',
                  '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.18)' },
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Chip
              icon={<GestureIcon sx={{ fontSize: 15, color: 'var(--primary-color, #f06292) !important' }} />}
              label={`${mappedCount}/${friends.length}`}
              size="small"
              sx={{
                bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.1)',
                color: 'var(--primary-color, #f06292)',
                fontWeight: 700,
                border: '1px solid rgba(var(--primary-rgb, 240,98,146), 0.25)',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {/* Search Box */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 2.5,
              bgcolor: currentIsDark ? 'rgba(40, 32, 54, 0.8)' : 'var(--surface-color, #ffffff)',
              border: '1.5px solid rgba(var(--primary-rgb, 240,98,146), 0.15)',
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: 'var(--primary-color, #f06292)',
                boxShadow: '0 0 0 3px rgba(var(--primary-rgb, 240,98,146), 0.1)'
              }
            }}
          >
            <SearchIcon sx={{ color: 'var(--primary-color, #f06292)', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search friends to map gestures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                fontSize: '0.88rem',
                fontFamily: `'Poppins', sans-serif`,
                color: 'var(--text-color, #1a1a2e)'
              }}
            />
            {searchQuery && (
              <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.5, color: '#888' }}>
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Paper>

          {/* Filter Chips Bar */}
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.2 }}>
            <Chip
              label={`All (${friends.length})`}
              size="small"
              onClick={() => setActiveFilter('all')}
              sx={{
                fontWeight: activeFilter === 'all' ? 700 : 500,
                bgcolor: activeFilter === 'all' ? 'var(--primary-color, #f06292)' : (currentIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                color: activeFilter === 'all' ? '#fff' : (currentIsDark ? 'rgba(255,255,255,0.7)' : '#666'),
                border: activeFilter === 'all' ? 'none' : (currentIsDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)'),
                '&:hover': {
                  bgcolor: activeFilter === 'all' ? 'var(--primary-color, #e91e63)' : 'rgba(var(--primary-rgb, 240,98,146), 0.08)'
                }
              }}
            />
            <Chip
              label={`Mapped (${mappedCount})`}
              size="small"
              onClick={() => setActiveFilter('mapped')}
              sx={{
                fontWeight: activeFilter === 'mapped' ? 700 : 500,
                bgcolor: activeFilter === 'mapped' ? '#4caf50' : 'rgba(76,175,80,0.08)',
                color: activeFilter === 'mapped' ? '#fff' : '#2e7d32',
                border: activeFilter === 'mapped' ? 'none' : '1px solid rgba(76,175,80,0.2)',
                '&:hover': {
                  bgcolor: activeFilter === 'mapped' ? '#43a047' : 'rgba(76,175,80,0.15)'
                }
              }}
            />
            <Chip
              label={`Not Set (${unmappedCount})`}
              size="small"
              onClick={() => setActiveFilter('unmapped')}
              sx={{
                fontWeight: activeFilter === 'unmapped' ? 700 : 500,
                bgcolor: activeFilter === 'unmapped' ? '#ff9800' : 'rgba(255,152,0,0.08)',
                color: activeFilter === 'unmapped' ? '#fff' : '#e65100',
                border: activeFilter === 'unmapped' ? 'none' : '1px solid rgba(255,152,0,0.2)',
                '&:hover': {
                  bgcolor: activeFilter === 'unmapped' ? '#f57c00' : 'rgba(255,152,0,0.15)'
                }
              }}
            />
          </Box>
        </Box>

        {/* Progress indicator */}
        {friends.length > 0 && (
          <Box sx={{ width: '100%', height: 3, bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.1)', borderRadius: 2, overflow: 'hidden', mt: 1.5 }}>
            <Box sx={{
              width: `${(mappedCount / friends.length) * 100}%`,
              height: '100%',
              bgcolor: 'var(--primary-color, #f06292)',
              borderRadius: 2,
              transition: 'width 0.4s ease'
            }} />
          </Box>
        )}
      </Box>

      {/* Content Area */}
      <Box sx={{ 
        flex: 1, 
        px: { xs: 2, sm: 3 }, 
        py: 2,
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        }
      }}>
        {/* SKELETON LOADER (Only on initial cold-start when no SQLite cache exists yet) */}
        {initialLoading && friends.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4].map(idx => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  p: 2,
                  bgcolor: currentIsDark ? 'rgba(36, 28, 48, 0.9)' : 'var(--surface-color, #ffffff)',
                  border: currentIsDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Skeleton variant="circular" width={52} height={52} sx={{ bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.08)' }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="30%" height={18} />
                </Box>
                <Skeleton variant="rounded" width={72} height={32} sx={{ borderRadius: 2 }} />
              </Paper>
            ))}
          </Box>
        ) : friends.length === 0 ? (
          /* Empty Friends State */
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 8,
            gap: 2,
            textAlign: 'center'
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GestureIcon sx={{ fontSize: 38, color: 'var(--primary-color, #f06292)', opacity: 0.6 }} />
            </Box>
            <Typography sx={{
              color: 'var(--text-color, #1a1a2e)',
              fontWeight: 700,
              fontSize: '1.05rem'
            }}>
              No friends found
            </Typography>
            <Typography sx={{
              color: currentIsDark ? 'rgba(255,255,255,0.6)' : '#888',
              fontSize: '0.85rem',
              maxWidth: 260,
              lineHeight: 1.5
            }}>
              Add contacts or friends first to configure rapid gesture shortcuts
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/chat?tab=search')}
              sx={{
                mt: 1,
                borderRadius: 2.5,
                color: 'var(--primary-color, #f06292)',
                borderColor: 'var(--primary-color, #f06292)',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Search & Add Friends
            </Button>
          </Box>
        ) : filteredFriends.length === 0 ? (
          /* No search/filter match */
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 6,
            gap: 1.5,
            textAlign: 'center'
          }}>
            <FilterListIcon sx={{ fontSize: 36, color: 'var(--primary-color, #f06292)', opacity: 0.4 }} />
            <Typography sx={{ color: currentIsDark ? 'rgba(255,255,255,0.7)' : '#666', fontWeight: 600, fontSize: '0.95rem' }}>
              No contacts match your filter
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              sx={{ color: 'var(--primary-color, #f06292)', textTransform: 'none', fontWeight: 600 }}
            >
              Reset Filters
            </Button>
          </Box>
        ) : (
          /* FRIENDS LIST - Rendered instantly from SQLite */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            {filteredFriends.map((friend) => {
              const friendId = friend._id || friend.id;
              const isMapped = !!savedGestures[friendId];
              const displayName = friend.username || friend.name || 'Friend';

              return (
                <Paper
                  key={friendId}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: currentIsDark ? 'rgba(36, 28, 48, 0.9)' : 'var(--surface-color, #ffffff)',
                    border: currentIsDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.04)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 14px rgba(var(--primary-rgb, 240,98,146), 0.12)',
                      borderColor: 'rgba(var(--primary-rgb, 240,98,146), 0.25)'
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 2,
                    gap: 2
                  }}>
                    {/* Avatar with status indicator ring */}
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar
                        src={getProfileImageSrc(friend.profilePic || friend.profileImage || friend.image)}
                        sx={{ 
                          width: 52, 
                          height: 52,
                          border: isMapped ? '2.5px solid #4caf50' : '2.5px solid transparent',
                          boxShadow: isMapped ? '0 0 0 3px rgba(76,175,80,0.15)' : 'none'
                        }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </Avatar>
                      {isMapped && (
                        <Box sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: '#4caf50',
                          border: '2.5px solid #fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircleIcon sx={{ fontSize: 10, color: '#fff' }} />
                        </Box>
                      )}
                    </Box>

                    {/* Contact Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ 
                        fontWeight: 700, 
                        color: 'var(--text-color, #1a1a2e)',
                        fontSize: '0.95rem',
                        mb: 0.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {displayName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {isMapped ? (
                          <Chip
                            size="small"
                            label="Gesture Mapped"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(76,175,80,0.1)',
                              color: '#2e7d32',
                              border: '1px solid rgba(76,175,80,0.2)',
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Not Set"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: currentIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                              color: currentIsDark ? 'rgba(255,255,255,0.6)' : '#888',
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        variant={isMapped ? "outlined" : "contained"}
                        size="small"
                        onClick={() => setDrawingUser(friend)}
                        disableElevation
                        startIcon={isMapped ? <BrushIcon sx={{ fontSize: 15 }} /> : <GestureIcon sx={{ fontSize: 15 }} />}
                        sx={{
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 1.8,
                          py: 0.6,
                          fontSize: '0.8rem',
                          minWidth: 0,
                          color: isMapped ? 'var(--primary-color, #f06292)' : '#ffffff',
                          borderColor: isMapped ? 'rgba(var(--primary-rgb, 240,98,146), 0.35)' : 'transparent',
                          bgcolor: isMapped ? 'transparent' : 'var(--primary-color, #f06292)',
                          '&:hover': {
                            bgcolor: isMapped ? 'rgba(var(--primary-rgb, 240,98,146), 0.08)' : 'var(--primary-color, #e91e63)',
                            borderColor: isMapped ? 'rgba(var(--primary-rgb, 240,98,146), 0.6)' : 'transparent'
                          }
                        }}
                      >
                        {isMapped ? "Redraw" : "Draw"}
                      </Button>
                      {isMapped && (
                        <Tooltip title="Delete Gesture">
                          <IconButton
                            size="small"
                            onClick={() => deleteGesture(friendId, displayName)}
                            sx={{
                              width: 34,
                              height: 34,
                              color: '#d32f2f',
                              bgcolor: 'rgba(211,47,47,0.06)',
                              '&:hover': { bgcolor: 'rgba(211,47,47,0.14)' }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Drawing Overlay Canvas Dialog */}
      <Dialog
        open={!!drawingUser}
        onClose={() => setDrawingUser(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            m: { xs: 1.5, sm: 2 },
            bgcolor: currentIsDark ? '#1f182e' : 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #1a1a2e)',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 800, 
          pb: 1, 
          pt: 2.5,
          px: 2.5,
          color: 'var(--text-color, #1a1a2e)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AutoFixHighIcon sx={{ color: 'var(--primary-color, #f06292)', fontSize: 22 }} />
          Map Quick Gesture
        </DialogTitle>
        
        <DialogContent sx={{ px: 2.5, pb: 1 }}>
          <Typography variant="body2" sx={{ 
            color: currentIsDark ? 'rgba(255,255,255,0.7)' : '#666', 
            mb: 2,
            lineHeight: 1.6,
            fontSize: '0.85rem'
          }}>
            Draw a unique sign for <b style={{ color: 'var(--primary-color, #f06292)' }}>{drawingUser?.username || drawingUser?.name}</b> in one continuous stroke.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              my: 1
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', sm: 320 },
                height: { xs: 280, sm: 320 },
                maxWidth: 320,
                borderRadius: 3,
                border: '2.5px dashed rgba(var(--primary-rgb, 240,98,146), 0.35)',
                bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.02)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                '&:hover': {
                  borderColor: 'rgba(var(--primary-rgb, 240,98,146), 0.6)'
                }
              }}
            >
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleStopDraw}
                onMouseLeave={handleStopDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDraw}
                onTouchEnd={handleStopDraw}
                style={{
                  cursor: 'crosshair',
                  touchAction: 'none',
                  display: 'block',
                  width: '100%',
                  height: '100%'
                }}
              />
              {points.length === 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  textAlign: 'center'
                }}>
                  <GestureIcon sx={{ fontSize: 40, color: 'rgba(var(--primary-rgb, 240,98,146), 0.25)', mb: 1 }} />
                  <Typography sx={{ color: 'rgba(var(--primary-rgb, 240,98,146), 0.4)', fontSize: '0.85rem', fontWeight: 500 }}>
                    Start drawing gesture here
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          px: 2.5, 
          pb: 2.5, 
          pt: 1,
          gap: 1,
          display: 'flex',
          flexWrap: 'wrap'
        }}>
          <Button
            onClick={() => setDrawingUser(null)}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              color: currentIsDark ? 'rgba(255,255,255,0.7)' : '#666',
              borderColor: currentIsDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
              py: 0.9,
              flex: { xs: '1 1 100%', sm: '0 0 auto' },
              '&:hover': { borderColor: currentIsDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)', bgcolor: 'rgba(0,0,0,0.02)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={clearCanvas}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              color: '#ed6c02',
              borderColor: 'rgba(237,108,2,0.3)',
              py: 0.9,
              flex: { xs: '1 1 100%', sm: '0 0 auto' },
              '&:hover': { borderColor: '#ed6c02', bgcolor: 'rgba(237,108,2,0.04)' }
            }}
          >
            Clear
          </Button>
          <Button
            onClick={saveGesture}
            variant="contained"
            disabled={points.length === 0}
            disableElevation
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              py: 0.9,
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              bgcolor: 'var(--primary-color, #f06292)',
              '&:hover': { bgcolor: 'var(--primary-color, #e91e63)' },
              '&.Mui-disabled': { bgcolor: 'rgba(var(--primary-rgb, 240,98,146), 0.2)', color: 'rgba(255,255,255,0.6)' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Toasts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 1, sm: 2 } }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ 
            width: '100%', 
            borderRadius: 3, 
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            alignItems: 'center'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FinderPage;