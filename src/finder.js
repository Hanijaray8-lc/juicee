import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Fab,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import BrushIcon from '@mui/icons-material/Brush';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import GestureIcon from '@mui/icons-material/Gesture';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './config/apiConfig';
import { UserGuideModal } from './UserGuideModal';

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
  const [friends, setFriends] = useState([]);
  const [savedGestures, setSavedGestures] = useState({});
  const [drawingUser, setDrawingUser] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const canvasRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  // Load friends and gestures
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch friends list
    fetch(`${API_BASE_URL}/api/user/${userId}/friends`)
      .then(res => res.json())
      .then(data => {
        setFriends(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to load friends:', err);
        setSnackbar({ open: true, message: 'Failed to load friends list', severity: 'error' });
      });

    // Fetch user gestures from backend AND sync to localStorage
    fetch(`${API_BASE_URL}/api/user/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(user => {
        if (user && user.gestures) {
          setSavedGestures(user.gestures);
          localStorage.setItem('juicy_contact_gestures', JSON.stringify(user.gestures));
        } else {
          // Fallback to localStorage if backend has none
          const saved = localStorage.getItem('juicy_contact_gestures');
          if (saved) {
            try {
              setSavedGestures(JSON.parse(saved));
            } catch (e) {
              console.error('Failed to parse gestures:', e);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load user profile gestures:', err);
        // Fallback to localStorage on error
        const saved = localStorage.getItem('juicy_contact_gestures');
        if (saved) {
          try {
            setSavedGestures(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to parse gestures:', e);
          }
        }
        setLoading(false);
      });
  }, [userId]);

  // Set up canvas styling when drawing user modal opens
  useEffect(() => {
    if (drawingUser && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // clear canvas
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

  const saveGesture = () => {
    if (points.length < 8) {
      setSnackbar({ open: true, message: 'Gesture is too short. Draw a longer stroke.', severity: 'warning' });
      return;
    }

    const normalized = normalizeGesture(points, 32, 200);

    const updated = {
      ...savedGestures,
      [drawingUser._id]: {
        username: drawingUser.username || drawingUser.name,
        points: normalized
      }
    };

    setSavedGestures(updated);
    localStorage.setItem('juicy_contact_gestures', JSON.stringify(updated));

    // Sync to Backend
    fetch(`${API_BASE_URL}/api/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gestures: updated })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update gestures on backend');
        return res.json();
      })
      .then(data => console.log('✅ Gestures synced to backend successfully:', data))
      .catch(err => console.error('❌ Failed to sync gestures to backend:', err));

    // Sync to Android native
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) {
      const { AudioRoute } = window.Capacitor.Plugins;
      if (AudioRoute && typeof AudioRoute.setLockedContacts === 'function') {
        AudioRoute.setLockedContacts({ contacts: Object.keys(updated) })
          .then(() => console.log('📱 Synced locked contacts to native successfully'))
          .catch(err => console.error('📱 Error syncing locked contacts to native:', err));
      }
    }

    setDrawingUser(null);
    setSnackbar({ open: true, message: `Gesture saved for ${drawingUser.username || drawingUser.name}!`, severity: 'success' });
  };

  const deleteGesture = (friendId, username) => {
    const updated = { ...savedGestures };
    delete updated[friendId];

    setSavedGestures(updated);
    localStorage.setItem('juicy_contact_gestures', JSON.stringify(updated));

    // Sync to Backend
    fetch(`${API_BASE_URL}/api/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gestures: updated })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update gestures on backend');
        return res.json();
      })
      .then(data => console.log('✅ Gestures updated on backend after deletion:', data))
      .catch(err => console.error('❌ Failed to sync gestures deletion to backend:', err));

    // Sync to Android native
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) {
      const { AudioRoute } = window.Capacitor.Plugins;
      if (AudioRoute && typeof AudioRoute.setLockedContacts === 'function') {
        AudioRoute.setLockedContacts({ contacts: Object.keys(updated) })
          .then(() => console.log('📱 Synced locked contacts to native successfully after deletion'))
          .catch(err => console.error('📱 Error syncing locked contacts to native:', err));
      }
    }

    setSnackbar({ open: true, message: `Gesture deleted for ${username}`, severity: 'info' });
  };

  // Stats for the header
  const mappedCount = friends.filter(f => !!savedGestures[f._id]).length;

  return (
    <Box sx={{
      height: '100%',
      bgcolor: '#faf5f7',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: `'Poppins', sans-serif`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative top gradient blob */}
      <Box sx={{
        position: 'absolute',
        top: -80,
        right: -60,
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(240,98,146,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        top: 40,
        left: -40,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(240,98,146,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header Bar */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'rgba(250,245,247,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(240,98,146,0.08)',
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2.5 },
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/chat?tab=settings')} 
            sx={{
              color: '#f06292',
              mr: 1.5,
              bgcolor: 'rgba(240,98,146,0.08)',
              '&:hover': { bgcolor: 'rgba(240,98,146,0.15)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{
              fontWeight: 800,
              color: '#1a1a2e',
              letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}>
              Contact Gestures
            </Typography>
            <Typography variant="caption" sx={{ 
              color: '#888', 
              display: 'block', 
              mt: 0.3,
              fontWeight: 500 
            }}>
              Draw signs to open chats instantly
            </Typography>
          </Box>
          <Chip
            icon={<GestureIcon sx={{ fontSize: 16, color: '#f06292 !important' }} />}
            label={`${mappedCount}/${friends.length}`}
            size="small"
            sx={{
              bgcolor: 'rgba(240,98,146,0.1)',
              color: '#f06292',
              fontWeight: 700,
              border: '1px solid rgba(240,98,146,0.2)',
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Box>

        {/* Progress indicator */}
        {friends.length > 0 && (
          <Box sx={{ width: '100%', height: 3, bgcolor: 'rgba(240,98,146,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{
              width: `${friends.length > 0 ? (mappedCount / friends.length) * 100 : 0}%`,
              height: '100%',
              bgcolor: '#f06292',
              borderRadius: 2,
              transition: 'width 0.5s ease'
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
        scrollbarWidth: 'none', // Hide scrollbar for Firefox
        msOverflowStyle: 'none', // Hide scrollbar for IE/Edge
        '&::-webkit-scrollbar': {
          display: 'none', // Hide scrollbar for Chrome/Safari/Webkit
        }
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            mt: 8,
            gap: 2
          }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '3px solid rgba(240,98,146,0.15)',
              borderTop: '3px solid #f06292',
              animation: 'spin 0.8s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
            <Typography sx={{ color: '#888', fontWeight: 500, fontSize: '0.9rem' }}>
              Loading friends...
            </Typography>
          </Box>
        ) : friends.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 10,
            gap: 2,
            textAlign: 'center'
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(240,98,146,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GestureIcon sx={{ fontSize: 36, color: '#f06292', opacity: 0.5 }} />
            </Box>
            <Typography sx={{
              color: '#666',
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              No friends yet
            </Typography>
            <Typography sx={{
              color: '#999',
              fontSize: '0.85rem',
              maxWidth: 240,
              lineHeight: 1.5
            }}>
              Add friends first to configure your shortcut gestures
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {friends.map((friend) => {
              const isMapped = !!savedGestures[friend._id];
              return (
                <Paper
                  key={friend._id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease',
                    '&:active': {
                      transform: 'scale(0.98)',
                      bgcolor: '#fff0f3'
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 2,
                    gap: 2
                  }}>
                    {/* Avatar with status ring */}
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar
                        src={friend.profilePic || friend.image}
                        sx={{ 
                          width: 52, 
                          height: 52,
                          border: isMapped ? '2.5px solid #4caf50' : '2.5px solid transparent',
                          boxShadow: isMapped ? '0 0 0 3px rgba(76,175,80,0.15)' : 'none'
                        }}
                      />
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

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ 
                        fontWeight: 700, 
                        color: '#1a1a2e',
                        fontSize: '0.95rem',
                        mb: 0.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {friend.username || friend.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {isMapped ? (
                          <Chip
                            size="small"
                            label="Mapped"
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
                              bgcolor: 'rgba(0,0,0,0.04)',
                              color: '#888',
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
                        sx={{
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 2,
                          py: 0.6,
                          fontSize: '0.8rem',
                          minWidth: 0,
                          color: isMapped ? '#f06292' : '#ffffff',
                          borderColor: isMapped ? 'rgba(240,98,146,0.3)' : 'transparent',
                          bgcolor: isMapped ? 'transparent' : '#f06292',
                          '&:hover': {
                            bgcolor: isMapped ? 'rgba(240,98,146,0.06)' : '#e91e63',
                            borderColor: isMapped ? 'rgba(240,98,146,0.5)' : 'transparent'
                          }
                        }}
                      >
                        {isMapped ? "Redraw" : "Draw"}
                      </Button>
                      {isMapped && (
                        <IconButton
                          size="small"
                          onClick={() => deleteGesture(friend._id, friend.username || friend.name)}
                          sx={{
                            width: 34,
                            height: 34,
                            color: '#d32f2f',
                            bgcolor: 'rgba(211,47,47,0.06)',
                            '&:hover': { bgcolor: 'rgba(211,47,47,0.12)' }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
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
            borderRadius: 3,
            m: { xs: 1.5, sm: 2 },
            bgcolor: '#ffffff',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 800, 
          pb: 1, 
          pt: 2.5,
          px: 2.5,
          color: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AutoFixHighIcon sx={{ color: '#f06292', fontSize: 22 }} />
          Map Gesture
        </DialogTitle>
        
        <DialogContent sx={{ px: 2.5, pb: 1 }}>
          <Typography variant="body2" sx={{ 
            color: '#666', 
            mb: 2,
            lineHeight: 1.6,
            fontSize: '0.85rem'
          }}>
            Draw a unique gesture for <b style={{ color: '#f06292' }}>{drawingUser?.username || drawingUser?.name}</b> in one continuous stroke.
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
                border: '2.5px dashed rgba(240,98,146,0.35)',
                bgcolor: 'rgba(240,98,146,0.02)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                '&:hover': {
                  borderColor: 'rgba(240,98,146,0.6)'
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
                  <GestureIcon sx={{ fontSize: 40, color: 'rgba(240,98,146,0.2)', mb: 1 }} />
                  <Typography sx={{ color: 'rgba(240,98,146,0.35)', fontSize: '0.8rem', fontWeight: 500 }}>
                    Start drawing here
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
            fullWidth
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              color: '#666',
              borderColor: 'rgba(0,0,0,0.12)',
              py: 1,
              flex: { xs: '1 1 100%', sm: '0 0 auto' },
              '&:hover': { borderColor: 'rgba(0,0,0,0.25)', bgcolor: 'rgba(0,0,0,0.02)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={clearCanvas}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              color: '#ed6c02',
              borderColor: 'rgba(237,108,2,0.3)',
              py: 1,
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
            fullWidth
            disableElevation
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              py: 1,
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              bgcolor: '#f06292',
              '&:hover': { bgcolor: '#e91e63' },
              '&.Mui-disabled': { bgcolor: 'rgba(240,98,146,0.2)', color: 'rgba(255,255,255,0.6)' }
            }}
          >
            Save Gesture
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