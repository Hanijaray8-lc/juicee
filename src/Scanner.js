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
  useMediaQuery
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
  Logout as LogoutIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import jsQR from 'jsqr';
import { useSocket } from './context/socketContext';
import API_BASE_URL from './config/apiConfig';

export default function Scanner({ open, onClose, user, onUserScanned }) {
  const isMobile = useMediaQuery('(max-width:600px)');
  const socket = useSocket();
  
  const [themeKey, setThemeKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0); 
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [linkedDevices, setLinkedDevices] = useState([]);
  const [fetchingDevices, setFetchingDevices] = useState(false);
  const [logOutTarget, setLogOutTarget] = useState(null);

  // Listen for theme changes dynamically
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeKey(prev => prev + 1);
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
      // Ensure we are in the user room to receive notifications
      socket.emit('join_room', user._id, user.username);
      
      const handleCodeSubmitted = (data) => {
        // Web client submitted the code! Pop up confirmation on phone
        setGeneratedCodeOpen(false); // Close code display if open
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
          // Detected QR Code! Show Confirmation Dialog instead of auto linking
          handleScannedQR(code.data);
          return; // Stop scan loop
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

    if (String(scannedData).startsWith('juicy-web-') || String(scannedData).startsWith('juicy-web-')) {
      setIsScanning(false); // Stop camera
      
      // Set confirm targets and open Confirmation Dialog
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
    setIsScanning(false); // Stop camera
    
    const toastId = toast.loading('Processing QR code...');
    
    try {
      const token = localStorage.getItem('token');
      const loggedInUserId = user?._id || localStorage.getItem('userId');
      
      if (!loggedInUserId) {
        throw new Error('User not logged in');
      }

      // Search/fetch this user by their username (scannedData)
      const searchRes = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(scannedData)}&userId=${loggedInUserId}`);
      
      if (!searchRes.ok) {
        throw new Error('Failed to find user matching QR');
      }
      
      const users = await searchRes.json();
      // Find the exact matching username
      const matchedUser = Array.isArray(users) ? users.find(u => u.username.toLowerCase() === scannedData.toLowerCase()) : null;
      
      if (!matchedUser) {
        toast.error('No matching user found for this QR code.', { id: toastId });
        // Resume scan
        setIsScanning(true);
        return;
      }
      
      if (matchedUser._id.toString() === loggedInUserId) {
        toast.error('You cannot add yourself.', { id: toastId });
        // Resume scan
        setIsScanning(true);
        return;
      }
      
      // We found the user! Let's auto add them as a friend
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
        
        // Open the chat page with this user automatically!
        if (onUserScanned) {
          onUserScanned(matchedUser);
        }
        onClose(); // Close the scanner dialog
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

  // Fallback scanner initiator for retry helper
  const scanFrameFallback = () => {
    if (!isScanning) return;
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        handleScannedQR(code.data);
        return;
      }
    }
    requestAnimationFrame(scanFrameFallback);
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
        // Make mobile join the temporary session room to get confirmation alerts
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

      // 1. Draw beautiful Instagram-style gradient background
      const grad = ctx.createLinearGradient(0, 0, 720, 1080);
      grad.addColorStop(0, '#f06292');
      grad.addColorStop(0.3, '#ff4d86');
      grad.addColorStop(0.7, '#ff80ab');
      grad.addColorStop(1, '#7928ca');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1080);

      // 2. Draw white card shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;

      // 3. Draw rounded white card in center
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

      // Reset shadow for next drawings
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 4. Draw card header "Juicy"
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f06292';
      ctx.font = 'bold 50px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
      ctx.fillText('Juicy', 360, 290);

      // 5. Load and draw QR code
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous'; // CRITICAL: Avoid tainting canvas
      qrImg.onload = () => {
        // Draw white background border for QR code
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

        // Draw actual QR code image inside the border
        ctx.drawImage(qrImg, 210, 340, 300, 300);

        // 6. Draw username
        ctx.fillStyle = '#121212';
        ctx.font = 'bold 36px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
        ctx.fillText(`@${username}`, 360, 725);

        // 7. Draw tagline
        ctx.fillStyle = '#777777';
        ctx.font = '500 20px "Poppins", "Roboto", "Helvetica Neue", sans-serif';
        ctx.fillText('Scan to make a good conversation', 360, 775);

        // 8. Draw bottom brand mark on the gradient
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

      // Set the source of the QR code image (pink color, matching card)
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
          borderRadius: isMobile ? 0 : '24px',
          bgcolor: 'var(--surface-color, #ffffff)',
          color: 'var(--text-color, #000000)',
          overflow: 'hidden',
          backgroundImage: 'none',
          boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
          fontFamily: '"Poppins", "Roboto", sans-serif',
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
          {/* Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2.5,
            bgcolor: 'var(--surface-color, #ffffff)',
            borderBottom: '1px solid rgba(240, 98, 146, 0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottomLeftRadius: isMobile ? 0 : '20px',
            borderBottomRightRadius: isMobile ? 0 : '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                onClick={() => { setIsScanning(false); onClose(); }}
                sx={{
                  color: 'var(--text-color, #121212)',
                  opacity: 0.8,
                  bgcolor: 'rgba(150,150,150,0.1)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(240, 98, 146, 0.15)',
                    color: 'var(--primary-color, #f06292)',
                    opacity: 1,
                    transform: 'scale(1.05)'
                  },
                  '&:active': { transform: 'scale(0.95)' }
                }}
                size="small"
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: '"Poppins", sans-serif', color: 'var(--text-color, #121212)' }}>
                  Linked Devices
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-color, #121212)', opacity: 0.7, display: 'block', mt: -0.25 }}>
                  Manage session logins & web access
                </Typography>
              </Box>
            </Box>
            <HelpIcon sx={{ color: 'var(--primary-color, #f06292)', opacity: 0.8, fontSize: 22 }} />
          </Box>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{
              borderBottom: '1px solid rgba(150,150,150,0.12)',
              bgcolor: 'var(--surface-color, #ffffff)',
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'none',
                fontFamily: '"Poppins", sans-serif',
                color: 'var(--text-color, #121212)',
                opacity: 0.7,
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  color: 'var(--primary-color, #f06292)',
                  opacity: 1
                }
              },
              '& .MuiTabs-indicator': {
                bgcolor: 'var(--primary-color, #f06292)',
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab label="Linked Devices" icon={<DevicesIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="My QR Code" icon={<QrCodeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>

          <DialogContent sx={{ p: 3, bgcolor: 'var(--background-color, #fff7fa)', overflowY: 'auto' }}>
            {activeTab === 0 ? (
              <Box>
                {/* CSS Animation illustration */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  mb: 4,
                  mt: 1,
                  position: 'relative',
                  height: 120
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
                      width: 68,
                      height: 68,
                      borderRadius: '20px',
                      background: 'rgba(240, 98, 146, 0.1)',
                      border: '1.5px solid rgba(240, 98, 146, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
                    }}>
                      <LaptopIcon sx={{ fontSize: 36, color: 'var(--primary-color, #f06292)' }} />
                    </Box>
                  </Box>

                  {/* Flow animation line */}
                  <Box sx={{
                    width: 70,
                    height: 4,
                    borderRadius: 2,
                    position: 'relative',
                    background: 'rgba(240, 98, 146, 0.15)',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '30%',
                      background: 'var(--primary-color, #f06292)',
                      borderRadius: 2,
                      animation: 'linkFlow 2s infinite linear',
                      '@keyframes linkFlow': {
                        '0%': { left: '-30%' },
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
                      width: 68,
                      height: 68,
                      borderRadius: '20px',
                      background: 'rgba(240, 98, 146, 0.1)',
                      border: '1.5px solid rgba(240, 98, 146, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
                    }}>
                      <PhoneIcon sx={{ fontSize: 36, color: 'var(--primary-color, #f06292)' }} />
                    </Box>
                  </Box>
                </Box>

                {/* Info Text */}
                <Box sx={{ textAlign: 'center', mb: 4, px: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 800, mb: 1, color: 'var(--text-color, #121212)', fontFamily: '"Poppins", sans-serif' }}>
                    Use Juicy on other devices
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-color, #121212)', opacity: 0.7, maxWidth: 360, mx: 'auto', lineHeight: 1.5, fontSize: '0.85rem' }}>
                    Link devices to scan QR codes and keep chatting on your browser, laptop, or desktop.
                  </Typography>
                </Box>

                {/* Primary Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
                  <Button
                    variant="contained"
                    onClick={() => setIsScanning(true)}
                    startIcon={<QrCodeScannerIcon />}
                    sx={{
                      height: 52,
                      borderRadius: '26px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      fontFamily: '"Poppins", sans-serif',
                      px: 4,
                      bgcolor: 'var(--primary-color, #f06292)',
                      color: '#fff',
                      boxShadow: '0 8px 20px rgba(240, 98, 146, 0.25)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'var(--primary-color, #f06292)',
                        filter: 'brightness(0.95)',
                        boxShadow: '0 12px 28px rgba(240, 98, 146, 0.35)',
                        transform: 'scale(1.02)'
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
                      height: 52,
                      borderRadius: '26px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      fontFamily: '"Poppins", sans-serif',
                      px: 4,
                      color: 'var(--primary-color, #f06292)',
                      borderColor: 'rgba(240, 98, 146, 0.4)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'var(--primary-color, #f06292)',
                        bgcolor: 'rgba(240, 98, 146, 0.08)',
                        transform: 'scale(1.02)'
                      },
                      '&:active': { transform: 'scale(0.97)' }
                    }}
                  >
                    Link with Code
                  </Button>
                </Box>

                {/* Device Status Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--primary-color, #f06292)', mb: 2, px: 0.5, letterSpacing: '0.05em', fontSize: '0.78rem' }}>
                    CONNECTED DEVICES
                  </Typography>

                  {fetchingDevices ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={28} color="primary" />
                    </Box>
                  ) : linkedDevices.length === 0 ? (
                    <Card sx={{
                      borderRadius: '20px',
                      boxShadow: 'none',
                      border: '1.5px dashed rgba(240, 98, 146, 0.25)',
                      bgcolor: 'var(--surface-color, #ffffff)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'var(--surface-color, #ffffff)'
                      }
                    }}>
                      <CardContent sx={{ py: 4.5, textAlign: 'center', color: 'var(--text-color, #121212)', opacity: 0.7, fontSize: '0.85rem' }}>
                        No devices linked yet. Scan a QR code or generate a linking code to get started.
                      </CardContent>
                    </Card>
                  ) : (
                    <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {linkedDevices.map((dev, idx) => (
                        <Card
                          key={dev._id}
                          sx={{
                            borderRadius: '20px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                            border: '1px solid rgba(240, 98, 146, 0.15)',
                            bgcolor: 'var(--surface-color, #ffffff)',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                            animationDelay: `${idx * 0.1}s`,
                            '@keyframes slideIn': {
                              '0%': { transform: 'translateY(15px)', opacity: 0 },
                              '100%': { transform: 'translateY(0)', opacity: 1 }
                            },
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(240, 98, 146, 0.1)',
                              borderColor: 'var(--primary-color, #f06292)'
                            }
                          }}
                        >
                          <ListItem
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => setLogOutTarget(dev)}
                                sx={{
                                  color: '#ff3b30',
                                  bgcolor: 'rgba(255, 59, 48, 0.08)',
                                  width: 40,
                                  height: 40,
                                  borderRadius: '12px',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: 'rgba(255, 59, 48, 0.16)',
                                    transform: 'scale(1.05)'
                                  },
                                  '&:active': {
                                    transform: 'scale(0.95)'
                                  }
                                }}
                              >
                                <LogoutIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            }
                            sx={{ py: 2, px: 2.5 }}
                          >
                            <ListItemAvatar sx={{ minWidth: 60 }}>
                              <Avatar sx={{
                                width: 44,
                                height: 44,
                                bgcolor: 'rgba(240, 98, 146, 0.1)',
                                color: 'var(--primary-color, #f06292)',
                                border: '1px solid rgba(240, 98, 146, 0.2)'
                              }}>
                                <LaptopIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--text-color, #121212)', fontFamily: '"Poppins", sans-serif' }}>
                                    {dev.browserName} ({dev.osName})
                                  </Typography>
                                  {/* Online status indicator dot */}
                                  <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: '#34c759',
                                    boxShadow: '0 0 6px #34c759'
                                  }} />
                                </Box>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                  <Typography component="span" variant="caption" sx={{ color: 'var(--text-color, #121212)', opacity: 0.7, display: 'block', fontSize: '0.78rem' }}>
                                    {dev.deviceName} • IP: {dev.ipAddress}
                                  </Typography>
                                  <Typography component="span" variant="caption" sx={{ color: 'var(--text-color, #121212)', opacity: 0.5, display: 'block', fontSize: '0.75rem' }}>
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
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(240, 98, 146, 0.2)',
                  bgcolor: 'var(--surface-color, #ffffff)',
                  p: 3.5,
                  width: '100%',
                  maxWidth: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  backgroundImage: 'none',
                  animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  '@keyframes scaleIn': {
                    '0%': { transform: 'scale(0.95)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 }
                  }
                }}>
                  {/* Outer border decoration */}
                  <Box sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    right: 16,
                    bottom: 16,
                    border: '1.5px dashed var(--primary-color, #f06292)',
                    opacity: 0.3,
                    borderRadius: '20px',
                    pointerEvents: 'none'
                  }} />

                  {/* QR Image */}
                  <Box sx={{
                    p: 2,
                    borderRadius: '16px',
                    bgcolor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 3,
                    zIndex: 2
                  }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=f06292&data=${encodeURIComponent(user?.username || 'JuicyUser')}`}
                      alt="My QR Code"
                      style={{
                        width: 200,
                        height: 200,
                        display: 'block',
                        borderRadius: '8px'
                      }}
                    />
                  </Box>

                  {/* Username */}
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-color, #121212)', mb: 0.5, fontFamily: '"Poppins", sans-serif' }}>
                    @{user?.username || 'JuicyUser'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-color, #121212)', opacity: 0.7, textAlign: 'center', mb: 3.5, px: 1, fontSize: '0.85rem' }}>
                    Scan to make a good conversation
                  </Typography>

                  {/* Sharing Action buttons */}
                  <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                        fontFamily: '"Poppins", sans-serif',
                        bgcolor: 'var(--primary-color, #f06292)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(240, 98, 146, 0.25)',
                        '&:hover': {
                          bgcolor: 'var(--primary-color, #f06292)',
                          filter: 'brightness(0.95)'
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
                        fontFamily: '"Poppins", sans-serif',
                        color: 'var(--primary-color, #f06292)',
                        borderColor: 'rgba(240, 98, 146, 0.4)',
                        '&:hover': {
                          borderColor: 'var(--primary-color, #f06292)',
                          bgcolor: 'rgba(240, 98, 146, 0.08)'
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
                      fontWeight: 700,
                      fontFamily: '"Poppins", sans-serif',
                      color: 'var(--text-color, #121212)',
                      opacity: 0.7,
                      fontSize: '0.8rem',
                      '&:hover': { color: 'var(--primary-color, #f06292)', opacity: 1 }
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: isMobile ? '100%' : '550px', bgcolor: '#000000', color: '#ffffff' }}>
          {/* Viewfinder Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 3,
            py: 2.5,
            bgcolor: 'rgba(0,0,0,0.85)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            zIndex: 10
          }}>
            <IconButton
              onClick={() => setIsScanning(false)}
              color="inherit"
              size="small"
              sx={{
                mr: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, fontFamily: '"Poppins", sans-serif' }}>
                Scan QR Code
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Align the desktop QR code within the frame to link
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
            bgcolor: '#0c0c0e'
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

            {/* WhatsApp Style Scanner Overlay */}
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
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 25px rgba(240, 98, 146, 0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 30,
                    height: 30,
                    borderTop: '4px solid var(--primary-color, #F06292)',
                    borderLeft: '4px solid var(--primary-color, #F06292)',
                    borderTopLeftRadius: '20px'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 30,
                    height: 30,
                    borderTop: '4px solid var(--primary-color, #F06292)',
                    borderRight: '4px solid var(--primary-color, #F06292)',
                    borderTopRightRadius: '20px'
                  }
                }}>
                  {/* Bottom Corners */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: 30,
                    height: 30,
                    borderBottom: '4px solid var(--primary-color, #F06292)',
                    borderLeft: '4px solid var(--primary-color, #F06292)',
                    borderBottomLeftRadius: '20px'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 30,
                    height: 30,
                    borderBottom: '4px solid var(--primary-color, #F06292)',
                    borderRight: '4px solid var(--primary-color, #F06292)',
                    borderBottomRightRadius: '20px'
                  }} />

                  {/* Animated laser scanning line */}
                  <Box sx={{
                    position: 'absolute',
                    left: '5%',
                    width: '90%',
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, var(--primary-color, #FF80AB), var(--primary-color, #F06292), transparent)',
                    boxShadow: '0 0 15px var(--primary-color, #F06292)',
                    opacity: 0.9,
                    animation: 'scanAnimation 2.5s infinite ease-in-out',
                    '@keyframes scanAnimation': {
                      '0%, 100%': { top: '5%' },
                      '50%': { top: '95%' }
                    },
                    zIndex: 3
                  }} />
                </Box>

                {/* Right translucent block */}
                <Box sx={{ flex: 1, bgcolor: 'rgba(0, 0, 0, 0.65)' }} />
              </Box>

              {/* Bottom translucent block */}
              <Box sx={{ width: '100%', flex: 1, bgcolor: 'rgba(0, 0, 0, 0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: 600, px: 3, fontFamily: '"Poppins", sans-serif' }}>
                  Align the QR code within the frame to link
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
                bgcolor: '#141416',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                textAlign: 'center',
                zIndex: 8
              }}>
                <QrCodeScannerIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.4)', opacity: 0.5, mb: 2 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3.5, lineHeight: 1.5 }}>
                  {cameraError}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setIsScanning(false)}
                  sx={{
                    height: 40,
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontFamily: '"Poppins", sans-serif',
                    bgcolor: 'var(--primary-color, #f06292)',
                    px: 3,
                    color: '#fff',
                    '&:hover': {
                      bgcolor: 'var(--primary-color, #f06292)',
                      filter: 'brightness(0.95)'
                    }
                  }}
                >
                  Go Back
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Auto-Generated 5-Digit Code Dialog */}
      <Dialog
        open={generatedCodeOpen}
        onClose={() => setGeneratedCodeOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            maxWidth: 360,
            width: '90%',
            p: 1.5,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: '"Poppins", sans-serif', fontSize: '1.2rem', color: 'var(--text-color, #121212)' }}>
          <KeyIcon sx={{ color: 'var(--primary-color, #f06292)' }} />
          Your Linking Code
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'var(--text-color, #121212)', opacity: 0.7, mb: 3, lineHeight: 1.5 }}>
            Enter this code on your desktop screen to link the devices.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center', mb: 3 }}>
            {generatedCode.split('').map((char, index) => (
              <Box
                key={index}
                sx={{
                  width: 44,
                  height: 48,
                  bgcolor: 'rgba(240, 98, 146, 0.08)',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(240, 98, 146, 0.25)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'var(--primary-color, #f06292)',
                  boxShadow: 'inset 0 1px 4px rgba(240, 98, 146, 0.1)'
                }}
              >
                {char}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setGeneratedCodeOpen(false)}
            sx={{
              color: 'var(--text-color, #121212)',
              opacity: 0.8,
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: '"Poppins", sans-serif',
              borderRadius: '20px',
              px: 2.5
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DEVICE LINK CONFIRMATION DIALOG */}
      <Dialog
        open={confirmOpen}
        onClose={() => handleConfirmLink(false)}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            maxWidth: 380,
            width: '90%',
            p: 1.5,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, fontFamily: '"Poppins", sans-serif', fontSize: '1.25rem', color: 'var(--text-color, #121212)' }}>
          Confirm Link Device?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'var(--text-color, #121212)', opacity: 0.7, mb: 3, lineHeight: 1.5 }}>
            Do you want to authorize and log in to the following desktop device?
          </Typography>

          <Card sx={{
            bgcolor: 'var(--background-color, rgba(240, 98, 146, 0.04))',
            boxShadow: 'none',
            border: '1px solid rgba(240, 98, 146, 0.15)',
            borderRadius: '16px',
            p: 0.5,
            mb: 1.5
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{
                  bgcolor: 'rgba(240, 98, 146, 0.1)',
                  color: 'var(--primary-color, #f06292)',
                  width: 44,
                  height: 44,
                  border: '1px solid rgba(240, 98, 146, 0.2)'
                }}>
                  <LaptopIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--text-color, #121212)' }}>
                    {confirmBrowser?.browserName || 'Web Client'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-color, #121212)', opacity: 0.7, mt: 0.25, display: 'block' }}>
                    {confirmBrowser?.osName || 'Desktop OS'} • IP: {confirmBrowser?.ipAddress || '127.0.0.1'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => handleConfirmLink(false)}
            disabled={confirmingLink}
            sx={{
              color: 'var(--text-color, #121212)',
              opacity: 0.7,
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: '"Poppins", sans-serif',
              borderRadius: '20px',
              px: 2.5
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleConfirmLink(true)}
            disabled={confirmingLink}
            variant="contained"
            sx={{
              bgcolor: 'var(--primary-color, #f06292)',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: '"Poppins", sans-serif',
              borderRadius: '20px',
              px: 3,
              boxShadow: '0 4px 12px rgba(240, 98, 146, 0.25)',
              '&:hover': {
                bgcolor: 'var(--primary-color, #f06292)',
                filter: 'brightness(0.95)'
              },
              '&:active': { transform: 'scale(0.97)' }
            }}
          >
            {confirmingLink ? <CircularProgress size={16} color="inherit" /> : 'Confirm & Sync'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Out Device Confirmation Dialog */}
      <Dialog
        open={Boolean(logOutTarget)}
        onClose={() => setLogOutTarget(null)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            p: 1.5,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, fontFamily: '"Poppins", sans-serif', fontSize: '1.2rem', color: 'var(--text-color, #121212)' }}>
          Unlink Device?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'var(--text-color, #121212)', opacity: 0.8, lineHeight: 1.5 }}>
            Are you sure you want to log out and unlink <strong>{logOutTarget?.browserName}</strong> on <strong>{logOutTarget?.osName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setLogOutTarget(null)}
            sx={{
              color: 'var(--text-color, #121212)',
              opacity: 0.7,
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: '"Poppins", sans-serif',
              borderRadius: '20px',
              px: 2.5
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleLogOutDevice(logOutTarget._id)}
            variant="contained"
            color="error"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: '"Poppins", sans-serif',
              borderRadius: '20px',
              px: 3,
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.25)',
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
