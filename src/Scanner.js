import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Avatar,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  useMediaQuery,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Devices as DevicesIcon,
  LaptopMac as LaptopIcon,
  PhoneIphone as PhoneIcon,
  QrCodeScanner as QrCodeScannerIcon,
  QrCode as QrCodeIcon,
  HelpOutline as HelpIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Logout as LogoutIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import toast from 'react-hot-toast';
import jsQR from 'jsqr';
import { useSocket } from './context/socketContext';
import API_BASE_URL from './config/apiConfig';

export default function Scanner({ open, onClose, user, onUserScanned }) {
  const isMobile = useMediaQuery('(max-width:600px)');
  const socket = useSocket();
  const theme = useTheme();

  const [themeKey, setThemeKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0); 
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [linkedDevices, setLinkedDevices] = useState([]);
  const [fetchingDevices, setFetchingDevices] = useState(false);
  const [logOutTarget, setLogOutTarget] = useState(null);

  // Theme & Dark mode detection matching Settings.js
  const [isDark, setIsDark] = useState(() => {
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

  // Listen for theme changes dynamically
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeKey(prev => prev + 1);
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
            setIsDark((r * 299 + g * 587 + b * 114) / 1000 < 128);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);
  
  // Mobile generated linking code state
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedCodeOpen, setGeneratedCodeOpen] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  // General Link Confirmation Dialog state (for both QR and Code)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSessionId, setConfirmSessionId] = useState('');
  const [confirmBrowser, setConfirmBrowser] = useState(null);
  const [confirmingLink, setConfirmingLink] = useState(false);

  const videoRef = useRef(null);

  // Fetch linked devices from MongoDB
  const fetchLinkedDevices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setFetchingDevices(true);
      const res = await fetch(`${API_BASE_URL}/api/linked-devices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLinkedDevices(data);
      }
    } catch (err) {
      console.error('Error fetching linked devices:', err);
    } finally {
      setFetchingDevices(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLinkedDevices();
    }
  }, [open]);

  // Join user socket room and listen to code submissions
  useEffect(() => {
    if (socket && user && open) {
      socket.emit('join_room', user._id, user.username);
      
      const handleCodeSubmitted = (data) => {
        setGeneratedCodeOpen(false);
        setConfirmSessionId(data.sessionId);
        setConfirmBrowser(data.browserInfo || { browserName: 'Web Browser', osName: 'Desktop' });
        setConfirmOpen(true);
      };

      socket.on('code_submitted', handleCodeSubmitted);

      return () => {
        socket.off('code_submitted', handleCodeSubmitted);
      };
    }
  }, [socket, user, open]);

  // Camera QR Scanning Logic
  useEffect(() => {
    let activeStream = null;
    let animationFrameId = null;

    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleScannedQR(code.data);
          return;
        }
      }
      
      if (isScanning) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    if (isScanning) {
      setCameraError(null);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          activeStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play()
              .then(() => {
                animationFrameId = requestAnimationFrame(scanFrame);
              })
              .catch(e => console.log('Video play error:', e));
          }
        })
        .catch(err => {
          console.error('Camera access failed:', err);
          setCameraError('Unable to access camera. Please check permissions or link using code.');
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScanning]);

  const handleScannedQR = async (scannedData) => {
    if (!scannedData) return;

    if (String(scannedData).startsWith('juicy-web-')) {
      setIsScanning(false);
      
      setConfirmSessionId(scannedData);
      setConfirmBrowser({
        browserName: 'Web Browser (QR Scan)',
        deviceName: 'Desktop Client',
        osName: 'WebOS',
        ipAddress: '127.0.0.1'
      });
      setConfirmOpen(true);
      return;
    }

    // Otherwise, assume it is a user's QR code (username)
    setIsScanning(false);
    
    const toastId = toast.loading('Processing QR code...');
    
    try {
      const token = localStorage.getItem('token');
      const loggedInUserId = user?._id || localStorage.getItem('userId');
      
      if (!loggedInUserId) {
        throw new Error('User not logged in');
      }

      const searchRes = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(scannedData)}&userId=${loggedInUserId}`);
      
      if (!searchRes.ok) {
        throw new Error('Failed to find user matching QR');
      }
      
      const users = await searchRes.json();
      const matchedUser = Array.isArray(users) ? users.find(u => u.username.toLowerCase() === scannedData.toLowerCase()) : null;
      
      if (!matchedUser) {
        toast.error('No matching user found for this QR code.', { id: toastId });
        setIsScanning(true);
        return;
      }
      
      if (matchedUser._id.toString() === loggedInUserId) {
        toast.error('You cannot add yourself.', { id: toastId });
        setIsScanning(true);
        return;
      }
      
      const addRes = await fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/add-friend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendId: matchedUser._id })
      });
      
      if (addRes.ok) {
        toast.success(`Started chat with ${matchedUser.username}`, { id: toastId });
        
        if (onUserScanned) {
          onUserScanned(matchedUser);
        }
        onClose();
      } else {
        const errorData = await addRes.json();
        toast.error(errorData.message || 'Failed to add friend', { id: toastId });
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error handling scanned user QR:', err);
      toast.error('Failed to process user QR code.', { id: toastId });
      setIsScanning(true);
    }
  };

  // Mobile generates the 5-digit number
  const handleGenerateLinkCode = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setGeneratingCode(true);
      const response = await fetch(`${API_BASE_URL}/api/link-device/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setGeneratedCode(data.code);
        setGeneratedCodeOpen(true);
        if (socket) {
          socket.emit('join_qr_room', { sessionId: data.sessionId });
        }
      } else {
        toast.error(data.message || 'Failed to generate code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setGeneratingCode(false);
    }
  };

  // Confirm or Deny Device Link
  const handleConfirmLink = async (isApproved) => {
    const token = localStorage.getItem('token');
    if (!token || !confirmSessionId) return;

    setConfirmingLink(true);
    toast.loading(isApproved ? 'Linking device...' : 'Cancelling...', { id: 'confirm-toast' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/link-device/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: confirmSessionId,
          confirm: isApproved,
          browserName: confirmBrowser?.browserName,
          deviceName: confirmBrowser?.deviceName,
          osName: confirmBrowser?.osName,
          ipAddress: confirmBrowser?.ipAddress
        })
      });

      if (response.ok) {
        if (isApproved) {
          toast.success('Device linked successfully! 🎉', { id: 'confirm-toast' });
        } else {
          toast.success('Link request cancelled.', { id: 'confirm-toast' });
        }
        fetchLinkedDevices();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Verification failed', { id: 'confirm-toast' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during confirmation', { id: 'confirm-toast' });
    } finally {
      setConfirmingLink(false);
      setConfirmOpen(false);
      setConfirmSessionId('');
      setConfirmBrowser(null);
    }
  };

  const handleLogOutDevice = async (id) => {
    const token = localStorage.getItem('token');
    toast.loading('Logging out device...', { id: 'device-logout-toast' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/linked-devices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        toast.success('Device logged out remotely! 📡', { id: 'device-logout-toast' });
        fetchLinkedDevices();
      } else {
        toast.error('Failed to unlink device', { id: 'device-logout-toast' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error', { id: 'device-logout-toast' });
    }
    setLogOutTarget(null);
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(user?.username || '');
    toast.success('Username copied to clipboard!');
  };

  const generateShareCard = (username) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 720, 1080);
      grad.addColorStop(0, '#f06292');
      grad.addColorStop(0.3, '#ff4d86');
      grad.addColorStop(0.7, '#ff80ab');
      grad.addColorStop(1, '#7928ca');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1080);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;

      const cardX = 100;
      const cardY = 200;
      const cardW = 520;
      const cardH = 680;
      const radius = 36;
      ctx.fillStyle = '#ffffff';
      
      ctx.beginPath();
      ctx.moveTo(cardX + radius, cardY);
      ctx.lineTo(cardX + cardW - radius, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
      ctx.lineTo(cardX + cardW, cardY + cardH - radius);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
      ctx.lineTo(cardX + radius, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
      ctx.lineTo(cardX, cardY + radius);
      ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f06292';
      ctx.font = 'bold 50px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
      ctx.fillText('Juicy', 360, 290);

      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.beginPath();
        const qrBorderRadius = 16;
        const qbx = 190, qby = 320, qbw = 340, qbh = 340;
        ctx.moveTo(qbx + qrBorderRadius, qby);
        ctx.lineTo(qbx + qbw - qrBorderRadius, qby);
        ctx.quadraticCurveTo(qbx + qbw, qby, qbx + qbw, qby + qrBorderRadius);
        ctx.lineTo(qbx + qbw, qby + qbh - qrBorderRadius);
        ctx.quadraticCurveTo(qbx + qbw, qby + qbh, qbx + qbw - qrBorderRadius, qby + qbh);
        ctx.lineTo(qbx + qrBorderRadius, qby + qbh);
        ctx.quadraticCurveTo(qbx, qby + qbh, qbx, qby + qbh - qrBorderRadius);
        ctx.lineTo(qbx, qby + qrBorderRadius);
        ctx.quadraticCurveTo(qbx, qby, qbx + qrBorderRadius, qby);
        ctx.closePath();
        ctx.fill();

        ctx.drawImage(qrImg, 210, 340, 300, 300);

        ctx.fillStyle = '#121212';
        ctx.font = 'bold 36px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
        ctx.fillText(`@${username}`, 360, 725);

        ctx.fillStyle = '#777777';
        ctx.font = '500 20px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
        ctx.fillText('Scan to make a good conversation', 360, 775);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
        ctx.fillText('Juicy Messenger', 360, 960);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'normal 16px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
        ctx.fillText('Share your QR code to connect instantly', 360, 990);

        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };

      qrImg.onerror = (err) => {
        reject(err);
      };

      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=f06292&data=${encodeURIComponent(username)}`;
    });
  };

  const handleShareQR = async () => {
    const toastId = toast.loading('Generating profile card...');
    try {
      const username = user?.username || 'JuicyUser';
      const dataUrl = await generateShareCard(username);
      
      const { AudioRoute } = window.Capacitor.Plugins || {};
      
      if (AudioRoute && typeof AudioRoute.shareImage === 'function') {
        toast.loading('Opening share sheet...', { id: toastId });
        await AudioRoute.shareImage({
          base64Data: dataUrl,
          fileName: `${username}_Juicy_QR.png`
        });
        toast.success('Shared successfully!', { id: toastId });
      } else {
        if (navigator.share) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `${username}_Juicy_QR.png`, { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            toast.loading('Opening share sheet...', { id: toastId });
            await navigator.share({
              files: [file],
              title: `${username}'s Juicy Card`,
              text: `Connect with me on Juicy: ${username}`
            });
            toast.success('Shared successfully!', { id: toastId });
          } else {
            await navigator.share({
              title: `${username}'s Juicy QR`,
              text: `Connect with me on Juicy: ${username}`,
              url: window.location.origin
            });
            toast.success('Link shared successfully!', { id: toastId });
          }
        } else {
          navigator.clipboard.writeText(username);
          toast.success('Username copied to clipboard!', { id: toastId });
        }
      }
    } catch (err) {
      console.error('Error sharing QR card:', err);
      toast.error('Could not share QR card', { id: toastId });
    }
  };

  const handleDownloadQR = async () => {
    const toastId = toast.loading('Generating profile card for download...');
    try {
      const username = user?.username || 'JuicyUser';
      const dataUrl = await generateShareCard(username);
      
      const { AudioRoute } = window.Capacitor.Plugins || {};
      if (AudioRoute && typeof AudioRoute.saveFileToDownloads === 'function') {
        await AudioRoute.saveFileToDownloads({
          base64Data: dataUrl,
          fileName: `${username}_Juicy_QR.png`,
          mimeType: 'image/png'
        });
        toast.success('Juicy Card saved to Downloads!', { id: toastId });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${username}_Juicy_QR.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Juicy Card download started!', { id: toastId });
      }
    } catch (err) {
      console.error('Error downloading QR card:', err);
      toast.error('Failed to download QR card', { id: toastId });
    }
  };

  return (
    <Dialog
      key={themeKey}
      open={open}
      onClose={() => {
        setIsScanning(false);
        onClose();
      }}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '28px',
          bgcolor: isDark ? 'rgba(24, 18, 34, 0.96)' : 'var(--surface-color, rgba(255, 255, 255, 0.96))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: isDark ? '#f8fafc' : '#0f172a',
          overflow: 'hidden',
          backgroundImage: isDark
            ? 'radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.04) 0%, transparent 50%)'
            : 'radial-gradient(circle at 90% 10%, rgba(0, 0, 0, 0.02) 0%, transparent 50%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
          boxShadow: isDark ? '0 24px 60px rgba(0, 0, 0, 0.5)' : '0 24px 60px rgba(255, 45, 108, 0.16)',
          fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh'
        }
      }}
    >
      {!isScanning ? (
        // Main view (Linked Devices + QR tabs)
        <>
          {/* Header matching Settings.js */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2.5, sm: 3 },
            py: 2.2,
            bgcolor: isDark ? 'rgba(24, 18, 34, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '14px',
                  background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
              >
                <DevicesIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: '1.22rem',
                    background: isDark
                      ? 'linear-gradient(135deg, #ffffff 0%, var(--primary-color, #fda4af) 100%)'
                      : 'linear-gradient(135deg, var(--text-color, #1e1b2e) 0%, var(--primary-color, #ff2d6c) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                    letterSpacing: '-0.3px',
                  }}
                >
                  Linked Devices
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500, display: 'block' }}>
                  Manage session logins & web access
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={() => { setIsScanning(false); onClose(); }}
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderRadius: '12px',
                p: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  color: isDark ? '#ffffff' : '#0f172a',
                  transform: 'scale(1.06)'
                }
              }}
              size="small"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Segmented Pill Tabs matching UserProfile.js */}
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 0.5 }}>
            <Box
              sx={{
                bgcolor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.035)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                borderRadius: '18px',
                p: 0.6,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="fullWidth"
                TabIndicatorProps={{ style: { display: 'none' } }}
                sx={{
                  minHeight: 44,
                  '& .MuiTabs-root': { minHeight: 44 },
                  '& .MuiTab-root': {
                    minHeight: 42,
                    textTransform: 'none',
                    fontWeight: 650,
                    fontSize: isMobile ? '0.84rem' : '0.9rem',
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
                  }
                }}
              >
                <Tab label="Linked Devices" icon={<DevicesIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                <Tab label="My QR Code" icon={<QrCodeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              </Tabs>
            </Box>
          </Box>

          <DialogContent
            sx={{
              p: { xs: 2.5, sm: 3 },
              bgcolor: isDark ? 'transparent' : 'var(--background-color, #fff7fa)',
              overflowY: 'auto',
              /* Sleek scrollbar matching Settings.js */
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'var(--primary-color, rgba(255, 45, 108, 0.25))',
                borderRadius: '10px'
              }
            }}
          >
            {activeTab === 0 ? (
              <Box>
                {/* CSS Animation illustration */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 3, sm: 4 },
                  mb: 3.5,
                  mt: 1,
                  position: 'relative',
                  height: 110
                }}>
                  {/* Laptop */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'float 4s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-8px)' }
                    }
                  }}>
                    <Box sx={{
                      width: 66,
                      height: 66,
                      borderRadius: '20px',
                      background: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.08)',
                      border: isDark ? '1.5px solid rgba(255, 45, 108, 0.25)' : '1.5px solid rgba(255, 45, 108, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                    }}>
                      <LaptopIcon sx={{ fontSize: 34, color: 'var(--primary-color, #ff2d6c)' }} />
                    </Box>
                  </Box>

                  {/* Flow animation line */}
                  <Box sx={{
                    width: { xs: 50, sm: 70 },
                    height: 4,
                    borderRadius: 2,
                    position: 'relative',
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 45, 108, 0.15)',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '35%',
                      background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                      borderRadius: 2,
                      animation: 'linkFlow 2s infinite linear',
                      '@keyframes linkFlow': {
                        '0%': { left: '-35%' },
                        '100%': { left: '110%' }
                      }
                    }} />
                  </Box>

                  {/* Phone */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'floatDelayed 4s ease-in-out infinite',
                    '@keyframes floatDelayed': {
                      '0%, 100%': { transform: 'translateY(-8px)' },
                      '50%': { transform: 'translateY(0)' }
                    }
                  }}>
                    <Box sx={{
                      width: 66,
                      height: 66,
                      borderRadius: '20px',
                      background: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.08)',
                      border: isDark ? '1.5px solid rgba(255, 45, 108, 0.25)' : '1.5px solid rgba(255, 45, 108, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                    }}>
                      <PhoneIcon sx={{ fontSize: 34, color: 'var(--primary-color, #ff2d6c)' }} />
                    </Box>
                  </Box>
                </Box>

                {/* Info Text */}
                <Box sx={{ textAlign: 'center', mb: 3.5, px: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 800, mb: 0.8, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'Poppins, sans-serif', fontSize: '1.05rem' }}>
                    Use Juicy on other devices
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', maxWidth: 380, mx: 'auto', lineHeight: 1.55, fontSize: '0.86rem' }}>
                    Link devices to scan QR codes and keep chatting on your browser, laptop, or desktop smoothly.
                  </Typography>
                </Box>

                {/* Primary Action Buttons matching Settings.js pill buttons */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
                  <Button
                    variant="contained"
                    onClick={() => setIsScanning(true)}
                    startIcon={<QrCodeScannerIcon />}
                    sx={{
                      height: 48,
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif',
                      px: 3.5,
                      background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                      color: '#fff',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        filter: 'brightness(1.08)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': { transform: 'scale(0.97)' }
                    }}
                  >
                    Scan QR Code
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateLinkCode}
                    disabled={generatingCode}
                    startIcon={generatingCode ? <CircularProgress size={16} color="inherit" /> : <KeyIcon />}
                    sx={{
                      height: 48,
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif',
                      px: 3.5,
                      color: 'var(--primary-color, #ff2d6c)',
                      borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.4))',
                      bgcolor: isDark ? 'rgba(255, 45, 108, 0.06)' : 'rgba(255, 45, 108, 0.04)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        borderColor: 'var(--primary-color, #ff2d6c)',
                        bgcolor: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.08)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': { transform: 'scale(0.97)' }
                    }}
                  >
                    Link with Code
                  </Button>
                </Box>

                {/* Device Status Section */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 750,
                      color: 'var(--primary-color, #ff2d6c)',
                      mb: 1.5,
                      px: 0.5,
                      letterSpacing: '0.04em',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    Connected Devices
                  </Typography>

                  {fetchingDevices ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                      <CircularProgress size={28} sx={{ color: 'var(--primary-color, #ff2d6c)' }} />
                    </Box>
                  ) : linkedDevices.length === 0 ? (
                    <Card sx={{
                      borderRadius: '20px',
                      boxShadow: 'none',
                      border: isDark ? '1.5px dashed rgba(255, 255, 255, 0.12)' : '1.5px dashed rgba(255, 45, 108, 0.25)',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'var(--surface-color, #ffffff)',
                    }}>
                      <CardContent sx={{ py: 4, textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.88rem' }}>
                        No devices linked yet. Scan a QR code or generate a linking code to get started.
                      </CardContent>
                    </Card>
                  ) : (
                    <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {linkedDevices.map((dev, idx) => (
                        <Card
                          key={dev._id}
                          sx={{
                            borderRadius: '20px',
                            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.04)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(0, 0, 0, 0.06)',
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'var(--surface-color, #ffffff)',
                            overflow: 'hidden',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                            animationDelay: `${idx * 0.08}s`,
                            '@keyframes slideIn': {
                              '0%': { transform: 'translateY(12px)', opacity: 0 },
                              '100%': { transform: 'translateY(0)', opacity: 1 }
                            },
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(255, 45, 108, 0.08)',
                              borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.3))'
                            }
                          }}
                        >
                          <ListItem
                            secondaryAction={
                              <Tooltip title="Unlink device" arrow>
                                <IconButton
                                  edge="end"
                                  onClick={() => setLogOutTarget(dev)}
                                  sx={{
                                    color: '#ef4444',
                                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                    width: 38,
                                    height: 38,
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: 'rgba(239, 68, 68, 0.2)',
                                      transform: 'scale(1.08)'
                                    },
                                    '&:active': {
                                      transform: 'scale(0.95)'
                                    }
                                  }}
                                >
                                  <LogoutIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            }
                            sx={{ py: 1.8, px: { xs: 2, sm: 2.5 } }}
                          >
                            <ListItemAvatar sx={{ minWidth: 56 }}>
                              <Avatar sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '14px',
                                bgcolor: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.08)',
                                color: 'var(--primary-color, #ff2d6c)',
                                border: isDark ? '1px solid rgba(255, 45, 108, 0.25)' : '1px solid rgba(255, 45, 108, 0.2)'
                              }}>
                                <LaptopIcon sx={{ fontSize: 22 }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'Poppins, sans-serif', fontSize: '0.94rem' }}>
                                    {dev.browserName} ({dev.osName})
                                  </Typography>
                                  <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: '#22c55e',
                                    boxShadow: '0 0 6px #22c55e'
                                  }} />
                                </Box>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mt: 0.4 }}>
                                  <Typography component="span" variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', fontSize: '0.78rem' }}>
                                    {dev.deviceName} • IP: {dev.ipAddress}
                                  </Typography>
                                  <Typography component="span" variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', display: 'block', fontSize: '0.73rem' }}>
                                    Linked on {new Date(dev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              // My QR Code (Web view scan me target)
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 2,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <Card sx={{
                  borderRadius: '24px',
                  boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 16px 40px rgba(255, 45, 108, 0.1)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 45, 108, 0.2)',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'var(--surface-color, #ffffff)',
                  p: { xs: 2.5, sm: 3.5 },
                  width: '100%',
                  maxWidth: 330,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  backgroundImage: 'none',
                  animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  '@keyframes scaleIn': {
                    '0%': { transform: 'scale(0.96)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 }
                  }
                }}>
                  {/* Outer border decoration */}
                  <Box sx={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    right: 14,
                    bottom: 14,
                    border: '1.5px dashed var(--primary-color, #ff2d6c)',
                    opacity: isDark ? 0.2 : 0.25,
                    borderRadius: '20px',
                    pointerEvents: 'none'
                  }} />

                  {/* QR Image Frame */}
                  <Box sx={{
                    p: 2,
                    borderRadius: '18px',
                    bgcolor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 2.5,
                    zIndex: 2
                  }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=f06292&data=${encodeURIComponent(user?.username || 'JuicyUser')}`}
                      alt="My QR Code"
                      style={{
                        width: 190,
                        height: 190,
                        display: 'block',
                        borderRadius: '8px'
                      }}
                    />
                  </Box>

                  {/* Username */}
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.4, fontFamily: 'Poppins, sans-serif', fontSize: '1.15rem' }}>
                    @{user?.username || 'JuicyUser'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', mb: 3, px: 1, fontSize: '0.85rem' }}>
                    Scan to connect and chat on Juicy
                  </Typography>

                  {/* Sharing Action buttons */}
                  <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'center', flexWrap: 'wrap', zIndex: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleShareQR}
                      startIcon={<ShareIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        flex: 1,
                        minWidth: '100px',
                        height: 42,
                        borderRadius: '21px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        fontFamily: 'Poppins, sans-serif',
                        background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                        color: '#fff',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          filter: 'brightness(1.08)',
                          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                          transform: 'translateY(-1px)'
                        },
                        '&:active': { transform: 'scale(0.97)' }
                      }}
                    >
                      Share
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleDownloadQR}
                      startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        flex: 1,
                        minWidth: '100px',
                        height: 42,
                        borderRadius: '21px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        fontFamily: 'Poppins, sans-serif',
                        color: 'var(--primary-color, #ff2d6c)',
                        borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.4))',
                        bgcolor: isDark ? 'rgba(255, 45, 108, 0.06)' : 'rgba(255, 45, 108, 0.04)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'var(--primary-color, #ff2d6c)',
                          bgcolor: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.08)',
                          transform: 'translateY(-1px)'
                        },
                        '&:active': { transform: 'scale(0.97)' }
                      }}
                    >
                      Download
                    </Button>
                  </Box>

                  <Button
                    variant="text"
                    onClick={handleCopyUsername}
                    startIcon={<CopyIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      mt: 2,
                      textTransform: 'none',
                      fontWeight: 650,
                      fontFamily: 'Poppins, sans-serif',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.8rem',
                      zIndex: 2,
                      '&:hover': { color: 'var(--primary-color, #ff2d6c)' }
                    }}
                  >
                    Copy Username
                  </Button>
                </Card>
              </Box>
            )}
          </DialogContent>
        </>
      ) : (
        // Camera Viewfinder (Scanner tab active)
        <Box sx={{ display: 'flex', flexDirection: 'column', height: isMobile ? '100%' : '560px', bgcolor: '#000000', color: '#ffffff' }}>
          {/* Viewfinder Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 3,
            py: 2.2,
            bgcolor: 'rgba(15, 10, 22, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            zIndex: 10
          }}>
            <IconButton
              onClick={() => setIsScanning(false)}
              color="inherit"
              size="small"
              sx={{
                mr: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                p: 1,
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', transform: 'translateX(-2px)' }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, fontFamily: 'Poppins, sans-serif', fontSize: '1.05rem' }}>
                Scan QR Code
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                Align the QR code within the frame to link or connect
              </Typography>
            </Box>
          </Box>

          {/* Viewfinder Viewport */}
          <Box sx={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            bgcolor: '#0a0810'
          }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              playsInline
              muted
            />

            {/* WhatsApp / Modern Scanner Overlay */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {/* Top translucent block */}
              <Box sx={{ width: '100%', flex: 1, bgcolor: 'rgba(0, 0, 0, 0.65)' }} />

              <Box sx={{ display: 'flex', width: '100%', height: 260 }}>
                {/* Left translucent block */}
                <Box sx={{ flex: 1, bgcolor: 'rgba(0, 0, 0, 0.65)' }} />

                {/* Viewfinder Frame */}
                <Box sx={{
                  width: 260,
                  height: 260,
                  position: 'relative',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 30px rgba(255, 45, 108, 0.35)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '26px',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 32,
                    height: 32,
                    borderTop: '4px solid var(--primary-color, #ff2d6c)',
                    borderLeft: '4px solid var(--primary-color, #ff2d6c)',
                    borderTopLeftRadius: '22px'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderTop: '4px solid var(--primary-color, #ff2d6c)',
                    borderRight: '4px solid var(--primary-color, #ff2d6c)',
                    borderTopRightRadius: '22px'
                  }
                }}>
                  {/* Bottom Corners */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: 32,
                    height: 32,
                    borderBottom: '4px solid var(--primary-color, #ff2d6c)',
                    borderLeft: '4px solid var(--primary-color, #ff2d6c)',
                    borderBottomLeftRadius: '22px'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderBottom: '4px solid var(--primary-color, #ff2d6c)',
                    borderRight: '4px solid var(--primary-color, #ff2d6c)',
                    borderBottomRightRadius: '22px'
                  }} />

                  {/* Animated laser scanning line */}
                  <Box sx={{
                    position: 'absolute',
                    left: '6%',
                    width: '88%',
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #ff80ab, var(--primary-color, #ff2d6c), transparent)',
                    boxShadow: '0 0 16px var(--primary-color, #ff2d6c)',
                    opacity: 0.95,
                    animation: 'scanAnimation 2.4s infinite ease-in-out',
                    '@keyframes scanAnimation': {
                      '0%, 100%': { top: '6%' },
                      '50%': { top: '94%' }
                    },
                    zIndex: 3
                  }} />
                </Box>

                {/* Right translucent block */}
                <Box sx={{ flex: 1, bgcolor: 'rgba(0, 0, 0, 0.65)' }} />
              </Box>

              {/* Bottom translucent block */}
              <Box sx={{ width: '100%', flex: 1, bgcolor: 'rgba(0, 0, 0, 0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: 650, px: 3, fontFamily: 'Poppins, sans-serif', fontSize: '0.88rem' }}>
                  Align the QR code within the frame
                </Typography>
              </Box>
            </Box>

            {cameraError && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                bgcolor: '#120f18',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                textAlign: 'center',
                zIndex: 8
              }}>
                <QrCodeScannerIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mb: 3.5, lineHeight: 1.5, maxWidth: 320 }}>
                  {cameraError}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setIsScanning(false)}
                  sx={{
                    height: 42,
                    borderRadius: '21px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                    px: 3.5,
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  }}
                >
                  Go Back
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Auto-Generated 5-Digit Code Dialog matching Settings.js */}
      <Dialog
        open={generatedCodeOpen}
        onClose={() => setGeneratedCodeOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDark ? '#1a1424' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            maxWidth: 370,
            width: '90%',
            p: 1.5,
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(255, 45, 108, 0.15)' : 'rgba(255, 45, 108, 0.1)',
            color: 'var(--primary-color, #ff2d6c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <KeyIcon sx={{ fontSize: 20 }} />
          </Box>
          Your Linking Code
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 3, lineHeight: 1.5 }}>
            Enter this 5-digit code on your desktop screen to authenticate the link.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center', mb: 2 }}>
            {generatedCode.split('').map((char, index) => (
              <Box
                key={index}
                sx={{
                  width: 48,
                  height: 54,
                  bgcolor: isDark ? 'rgba(255, 45, 108, 0.12)' : 'rgba(255, 45, 108, 0.08)',
                  borderRadius: '14px',
                  border: isDark ? '1.5px solid rgba(255, 45, 108, 0.35)' : '1.5px solid rgba(255, 45, 108, 0.25)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: 'var(--primary-color, #ff2d6c)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                {char}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setGeneratedCodeOpen(false)}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '18px',
              px: 3.5,
              py: 0.9
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DEVICE LINK CONFIRMATION DIALOG matching Settings.js */}
      <Dialog
        open={confirmOpen}
        onClose={() => handleConfirmLink(false)}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDark ? '#1a1424' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            maxWidth: 390,
            width: '90%',
            p: 1.5,
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pt: 2, pb: 1, fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
          Confirm Device Link?
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 2.5, lineHeight: 1.5 }}>
            Do you want to authorize and log in to the following desktop device?
          </Typography>

          <Card sx={{
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 45, 108, 0.04)',
            boxShadow: 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 45, 108, 0.15)',
            borderRadius: '18px',
            p: 0.5,
            mb: 1
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{
                  bgcolor: isDark ? 'rgba(255, 45, 108, 0.15)' : 'rgba(255, 45, 108, 0.1)',
                  color: 'var(--primary-color, #ff2d6c)',
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 45, 108, 0.2)'
                }}>
                  <LaptopIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                    {confirmBrowser?.browserName || 'Web Client'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.25, display: 'block' }}>
                    {confirmBrowser?.osName || 'Desktop OS'} • IP: {confirmBrowser?.ipAddress || '127.0.0.1'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => handleConfirmLink(false)}
            disabled={confirmingLink}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '18px',
              px: 3,
              py: 1
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleConfirmLink(true)}
            disabled={confirmingLink}
            variant="contained"
            sx={{
              background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '18px',
              px: 3.5,
              py: 1,
              boxShadow: '0 4px 14px rgba(255, 45, 108, 0.35)',
              '&:hover': {
                filter: 'brightness(1.08)'
              },
              '&:active': { transform: 'scale(0.97)' }
            }}
          >
            {confirmingLink ? <CircularProgress size={16} color="inherit" /> : 'Confirm & Sync'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Out Device Confirmation Dialog matching Settings.js */}
      <Dialog
        open={Boolean(logOutTarget)}
        onClose={() => setLogOutTarget(null)}
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDark ? '#1a1424' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            p: 1.5,
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', color: '#ef4444' }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LogoutIcon sx={{ fontSize: 20, color: '#ef4444' }} />
          </Box>
          Unlink Device?
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#64748b', lineHeight: 1.55 }}>
            Are you sure you want to remotely log out and unlink <strong>{logOutTarget?.browserName}</strong> on <strong>{logOutTarget?.osName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setLogOutTarget(null)}
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '18px',
              px: 3,
              py: 1
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleLogOutDevice(logOutTarget._id)}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '18px',
              px: 3.5,
              py: 1,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              },
              '&:active': { transform: 'scale(0.97)' }
            }}
          >
            Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
