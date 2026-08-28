import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, Typography, IconButton, Slider, useTheme, useMediaQuery, Dialog, Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import BrushIcon from '@mui/icons-material/Brush';
import { generateUniqueId } from './utils/uniqueIdGenerator';

const formatDate = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return 'Invalid Date';
  }
};

const formatTime = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};

const Drawing = ({ open, onClose, user, selectedUser, socket, setMessages }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const doodleCanvasRef = useRef(null);
  const doodleContainerRef = useRef(null);
  const doodleSavedRef = useRef(null);
  const lastPointRef = useRef(null);
  const colorsContainerRef = useRef(null);

  const handleColorsScroll = (direction) => {
    if (colorsContainerRef.current) {
      const nudgeAmount = 80;
      const newScrollLeft = colorsContainerRef.current.scrollLeft + (direction === 'left' ? -nudgeAmount : nudgeAmount);
      colorsContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const [doodleTool, setDoodleTool] = useState('pen'); // 'pen' | 'eraser'
  const [doodleColor, setDoodleColor] = useState('#ff2d55');
  const [doodleSize, setDoodleSize] = useState(6);
  const [isDoodling, setIsDoodling] = useState(false);
  const [doodleHistory, setDoodleHistory] = useState([]);

  const initDoodleCanvas = () => {
    const canvas = doodleCanvasRef.current;
    const container = doodleContainerRef.current || (canvas && canvas.parentElement);
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;

    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    // Only capture previous image if we're about to resize (resize clears canvas)
    let prevData = null;
    if ((canvas.width && canvas.height) && (canvas.width !== targetW || canvas.height !== targetH)) {
      try { prevData = canvas.toDataURL('image/png'); } catch (e) { prevData = null; }
    }

    // Set new size (this clears the canvas)
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // restore saved image (saved ref takes precedence over transient prevData)
    const src = doodleSavedRef.current || prevData;
    if (src) {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        } catch (err) {
          console.warn('Failed to restore doodle image', err);
        }
      };
      img.src = src;
    }

    return ctx;
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        initDoodleCanvas();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle window resizing to keep the canvas scaling properly
  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      initDoodleCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  const clientToCanvas = (clientX, clientY) => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDoodle = (ev) => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    ev.preventDefault && ev.preventDefault();
    const pointer = (ev.touches && ev.touches[0]) ? ev.touches[0] : ev;
    const pt = clientToCanvas(pointer.clientX, pointer.clientY);
    lastPointRef.current = pt;
    setIsDoodling(true);
    try { ev.target && ev.target.setPointerCapture && ev.target.setPointerCapture(ev.pointerId); } catch (e) { }
  };

  const drawDoodleStroke = (from, to) => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineWidth = doodleSize || 4;
    if (doodleTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = doodleColor || '#000';
    }
    ctx.stroke();
    ctx.closePath();
    ctx.globalCompositeOperation = 'source-over';
  };

  const moveDoodle = (ev) => {
    if (!isDoodling) return;
    ev.preventDefault && ev.preventDefault();
    const pointer = (ev.touches && ev.touches[0]) ? ev.touches[0] : ev;
    const pt = clientToCanvas(pointer.clientX, pointer.clientY);
    const last = lastPointRef.current || pt;
    drawDoodleStroke(last, pt);
    lastPointRef.current = pt;
  };

  const endDoodle = (ev) => {
    if (!isDoodling) return;
    setIsDoodling(false);
    lastPointRef.current = null;
    try {
      const c = doodleCanvasRef.current;
      if (c) {
        const strokeData = c.toDataURL('image/png');
        doodleSavedRef.current = strokeData;
        setDoodleHistory(prev => [...prev, strokeData]);
      }
    } catch (err) { /* ignore */ }
    try { ev && ev.target && ev.target.releasePointerCapture && ev.target.releasePointerCapture(ev.pointerId); } catch (e) { }
  };

  const clearDoodle = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    doodleSavedRef.current = null;
    setDoodleHistory([]);
  };

  const undoDoodle = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas || doodleHistory.length === 0) return;

    const newHistory = [...doodleHistory];
    newHistory.pop();
    setDoodleHistory(newHistory);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (newHistory.length > 0) {
      const previousStateSrc = newHistory[newHistory.length - 1];
      doodleSavedRef.current = previousStateSrc;

      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        } catch (err) {
          console.warn('Failed to restore previous doodle state:', err);
        }
      };
      img.src = previousStateSrc;
    } else {
      doodleSavedRef.current = null;
    }
  };

  const sendDoodle = () => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) {
      onClose();
      return;
    }
    if (!socket || !user || !selectedUser) {
      onClose();
      return;
    }
    // Prevent sending if nothing has been drawn
    if (doodleHistory.length === 0) {
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const msgId = generateUniqueId();
    const newMessage = {
      id: msgId,
      senderId: user._id,
      senderUsername: user.username,
      receiverId: selectedUser._id,
      receiverUsername: selectedUser.username,
      roomId: [user._id, selectedUser._id].sort().join('-'),
      image: dataUrl,
      type: 'doodle',
      timestamp: Date.now()
    };

    try { socket.emit('send_message', newMessage); } catch (e) { console.warn(e); }

    setMessages(prev => {
      const updated = { ...prev };
      if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
      updated[selectedUser._id].push({
        id: msgId,
        sender: 'You',
        image: dataUrl,
        type: 'doodle',
        timestamp: formatTime(new Date()),
        date: formatDate(new Date()),
        createdAt: new Date().toISOString()
      });
      return updated;
    });

    clearDoodle();
    onClose();
  };

  // Bottom toolbar total height differs on mobile (two rows) vs desktop (single row)
  const toolbarHeight = isMobile ? 92 : 56;
  // Floating pill bottom offset sits just above toolbar
  const pillBottom = toolbarHeight + 8;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isMobile ? "sm" : "xs"}
      TransitionComponent={isMobile ? Slide : undefined}
      TransitionProps={isMobile ? { direction: "up" } : undefined}
      PaperProps={{
        sx: isMobile ? {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          m: 0,
          borderRadius: '20px 20px 0 0',
          width: '100%',
          height: { xs: '85vh', sm: '80vh', md: '75vh' },
          overflow: 'hidden',
          bgcolor: 'var(--surface-color, background.paper)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom)'
        } : {
          borderRadius: '24px',
          width: '520px',
          height: '680px',
          maxHeight: '90vh',
          overflow: 'hidden',
          bgcolor: 'var(--surface-color, background.paper)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
        }
      }}
      BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.35)' } }}
    >
      <Box
        ref={doodleContainerRef}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header - Gradient & layout style matching Yourmood */}
        <Box sx={{
          px: 3,
          pt: isMobile ? 1 : 2,
          pb: isMobile ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(90deg, var(--primary-color, #ff7aa3), var(--primary-color, #ff4d86))',
          color: '#fff',
          zIndex: 12,
          flexShrink: 0
        }}>
          {/* Top pull indicator pill bar */}
          {isMobile && (
            <Box sx={{
              width: 42,
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.6)',
              mb: 1
            }} />
          )}
          <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <IconButton onClick={onClose} size={isMobile ? 'small' : 'medium'} sx={{ color: '#fff' }}>
              <CloseIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
            </IconButton>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: isMobile ? 16 : 18 }}>Drawing</Typography>
            <Button
              onClick={sendDoodle}
              disabled={doodleHistory.length === 0}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                color: '#fff',
                fontWeight: 600,
                fontSize: isMobile ? 13 : 14,
                minWidth: 'auto',
                px: isMobile ? 1 : 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                '&.Mui-disabled': {
                  color: 'rgba(255,255,255,0.4)'
                }
              }}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* Canvas Area - reserve bottom toolbar space so nothing is hidden */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          pb: `${toolbarHeight}px`,
          background: 'var(--background-color, #fafafa)',
          overflow: 'hidden',
          minHeight: 0
        }}>
          <canvas
            ref={doodleCanvasRef}
            style={{
              width: '100%',
              height: '100%',
              touchAction: 'none',
              display: 'block'
            }}
            onPointerDown={(e) => { initDoodleCanvas(); startDoodle(e); }}
            onPointerMove={moveDoodle}
            onPointerUp={endDoodle}
            onPointerCancel={endDoodle}
          />
        </Box>

        {/* Floating left pill: pen icon + vertical size slider (above bottom toolbar) */}
        <Box sx={{
          position: 'absolute',
          left: isMobile ? 6 : 12,
          bottom: pillBottom,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: 'var(--surface-color, rgba(255,255,255,0.98))',
          borderRadius: 999,
          px: 0.5,
          py: 0.75,
          boxShadow: '0 4px 14px rgba(0,0,0,0.10)'
        }}>
          {/* Pen button */}
          <IconButton
            onClick={() => setDoodleTool('pen')}
            size="small"
            sx={{
              p: 0.25,
              width: isMobile ? 30 : 36,
              height: isMobile ? 30 : 36,
              bgcolor: doodleTool === 'pen' ? 'var(--background-color, #f0f8ff)' : 'transparent',
              border: doodleTool === 'pen' ? '1px solid var(--primary-color, #0095f6)' : 'none',
              borderRadius: 5
            }}
          >
            <BrushIcon sx={{
              color: doodleTool === 'pen' ? 'var(--primary-color, #0095f6)' : 'var(--text-color, #666)',
              fontSize: isMobile ? 16 : 18
            }} />
          </IconButton>

          {/* Vertical size slider */}
          <Box sx={{
            height: isMobile ? 80 : 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 0.25
          }}>
            <Slider
              value={doodleSize}
              onChange={(e, v) => setDoodleSize(v)}
              min={1}
              max={40}
              orientation="vertical"
              size="small"
              sx={{
                height: isMobile ? 65 : 100,
                '& .MuiSlider-thumb': {
                  width: isMobile ? 8 : 10,
                  height: isMobile ? 8 : 10,
                  color: 'var(--primary-color, #0095f6)'
                },
                '& .MuiSlider-track': {
                  color: 'var(--primary-color, #0095f6)'
                },
                '& .MuiSlider-rail': {
                  opacity: 0.25,
                  color: 'var(--text-color, #666)'
                }
              }}
            />
          </Box>

          {/* Size preview dot */}
          <Box sx={{
            width: Math.max(5, Math.min(16, doodleSize)),
            height: Math.max(5, Math.min(16, doodleSize)),
            borderRadius: '50%',
            bgcolor: doodleColor || 'var(--text-color, #000)',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
          }} />
        </Box>

        {/* Bottom toolbar – mobile: two rows (colors on top, tools below); desktop: single row */}
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'var(--surface-color, #fff)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          zIndex: 14,
          borderTopRightRadius: 16,
          borderTopLeftRadius: 16,
          pb: 'env(safe-area-inset-bottom, 0px)'
        }}>
          {/* Row 1 (mobile) / inline (desktop): Color palette */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            flex: isMobile ? 'none' : 1,
            borderBottom: isMobile ? '1px solid rgba(0,0,0,0.04)' : 'none',
            overflow: 'hidden'
          }}>
            {/* Left Scroll Arrow (Desktop only) */}
            {!isMobile && (
              <IconButton
                onClick={() => handleColorsScroll('left')}
                size="small"
                sx={{
                  position: 'absolute',
                  left: 2,
                  zIndex: 2,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#f5f5f5' },
                  width: 24,
                  height: 24,
                  p: 0
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}

            <Box
              ref={colorsContainerRef}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                overflowX: 'auto',
                px: isMobile ? 1.5 : 4,
                py: isMobile ? 0.75 : 0.5,
                flex: 1,
                '&::-webkit-scrollbar': { height: 0, display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                justifyContent: isMobile ? 'center' : 'flex-start',
                scrollBehavior: 'smooth'
              }}
            >
              {['#000000', '#ffffff', '#ff4d4d', '#ffd500', '#4dff4d', '#4d79ff', '#b366ff', '#ff66b3', '#ff9f43', '#00d2d3', '#0a3d62', '#ff9ff3', '#10ac84', '#5f27cd', '#8d6e63', '#00cbff', '#ff6b6b', '#808000'].map((c) => (
                <Box
                  key={c}
                  onClick={() => setDoodleColor(c)}
                  sx={{
                    minWidth: isMobile ? 26 : 28,
                    minHeight: isMobile ? 26 : 28,
                    width: isMobile ? 26 : 28,
                    height: isMobile ? 26 : 28,
                    borderRadius: '50%',
                    bgcolor: c,
                    border: doodleColor === c
                      ? '2.5px solid var(--primary-color, #0095f6)'
                      : c === '#ffffff'
                        ? '1.5px solid #ddd'
                        : '2px solid transparent',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                    boxShadow: doodleColor === c ? '0 0 0 2px rgba(0,149,246,0.2)' : '0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'border 0.15s, box-shadow 0.15s'
                  }}
                />
              ))}

              {/* Native color picker */}
              <input
                type="color"
                value={doodleColor}
                onChange={(e) => setDoodleColor(e.target.value)}
                style={{
                  width: isMobile ? 22 : 24,
                  height: isMobile ? 22 : 24,
                  border: 'none',
                  padding: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  flexShrink: 0
                }}
              />
            </Box>

            {/* Right Scroll Arrow (Desktop only) */}
            {!isMobile && (
              <IconButton
                onClick={() => handleColorsScroll('right')}
                size="small"
                sx={{
                  position: 'absolute',
                  right: 2,
                  zIndex: 2,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#f5f5f5' },
                  width: 24,
                  height: 24,
                  p: 0
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>

          {/* Row 2 (mobile) / continued inline (desktop): Tools + action buttons */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 0.5 : 1,
            px: isMobile ? 1 : 2,
            py: isMobile ? 0.5 : 0.75,
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            flexShrink: 0
          }}>
            {/* Pen */}
            <IconButton
              onClick={() => setDoodleTool('pen')}
              sx={{
                p: 0.5,
                width: isMobile ? 34 : 40,
                height: isMobile ? 34 : 40,
                bgcolor: doodleTool === 'pen' ? 'var(--background-color, #f0f8ff)' : 'transparent',
                border: doodleTool === 'pen' ? '1.5px solid var(--primary-color, #0095f6)' : '1.5px solid transparent',
                borderRadius: 2
              }}
              size="small"
            >
              <BrushIcon sx={{
                color: doodleTool === 'pen' ? 'var(--primary-color, #0095f6)' : 'var(--text-color, #666)',
                fontSize: isMobile ? 18 : 20
              }} />
            </IconButton>

            {/* Eraser */}
            <IconButton
              onClick={() => setDoodleTool('eraser')}
              sx={{
                p: 0.5,
                width: isMobile ? 34 : 40,
                height: isMobile ? 34 : 40,
                bgcolor: doodleTool === 'eraser' ? 'var(--background-color, #fff0f0)' : 'transparent',
                border: doodleTool === 'eraser' ? '1.5px solid var(--primary-color, #ff4d4d)' : '1.5px solid transparent',
                borderRadius: 2
              }}
              size="small"
            >
              <DeleteIcon sx={{
                color: doodleTool === 'eraser' ? 'var(--primary-color, #ff4d4d)' : 'var(--text-color, #666)',
                fontSize: isMobile ? 18 : 20
              }} />
            </IconButton>

            {/* Spacer on mobile to push buttons right */}
            {isMobile && <Box sx={{ flex: 1 }} />}

            {/* Undo button */}
            <Button
              variant="contained"
              onClick={undoDoodle}
              disabled={doodleHistory.length === 0}
              size="small"
              sx={{
                borderRadius: 20,
                minWidth: isMobile ? 56 : 80,
                height: isMobile ? 32 : 38,
                fontSize: isMobile ? 11 : 13,
                px: isMobile ? 1.5 : 2,
                fontWeight: 600,
                background: 'var(--primary-color, linear-gradient(135deg, #0095f6, #0076c4))',
                color: '#fff',
                boxShadow: '0 3px 10px rgba(0, 149, 246, 0.25)',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'var(--primary-color, linear-gradient(135deg, #0084db, #0063a5))',
                  boxShadow: '0 5px 14px rgba(0, 149, 246, 0.35)',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0px)',
                  boxShadow: '0 2px 6px rgba(0, 149, 246, 0.25)'
                },
                '&.Mui-disabled': {
                  background: '#e0e0e0',
                  color: '#a0a0a0',
                  boxShadow: 'none'
                }
              }}
            >
              Undo
            </Button>

            {/* Clear button */}
            <Button
              variant="contained"
              onClick={clearDoodle}
              size="small"
              sx={{
                borderRadius: 20,
                minWidth: isMobile ? 56 : 80,
                height: isMobile ? 32 : 38,
                fontSize: isMobile ? 11 : 13,
                px: isMobile ? 1.5 : 2,
                fontWeight: 600,
                background: 'var(--primary-color, linear-gradient(135deg, #ff4d4d, #ff6b6b))',
                color: '#fff',
                boxShadow: '0 3px 10px rgba(255, 77, 77, 0.25)',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'var(--primary-color, linear-gradient(135deg, #ff3333, #ff5555))',
                  boxShadow: '0 5px 14px rgba(255, 77, 77, 0.35)',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0px)',
                  boxShadow: '0 2px 6px rgba(255, 77, 77, 0.25)'
                }
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default Drawing;
