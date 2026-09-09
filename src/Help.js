import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardMedia,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';
import useSwipeBack from './hooks/useSwipeBack';

const Help = ({ onBack }) => {
  useSwipeBack();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form states
  const [name, setName] = useState(() => localStorage.getItem('username') || '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [screenshots, setScreenshots] = useState([]); // array of { file, previewUrl }
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Errors state
  const [errors, setErrors] = useState({});

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Screenshot File Selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validImages = [];
    let hasError = false;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        hasError = true;
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // max 10MB each
        hasError = true;
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      validImages.push({ file, previewUrl, name: file.name, id: `${Date.now()}-${Math.random()}` });
    });

    if (hasError) {
      setSnackbar({
        open: true,
        message: 'Some files were skipped. Only images under 10MB are allowed.',
        severity: 'warning'
      });
    }

    setScreenshots(prev => [...prev, ...validImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove Screenshot
  const handleRemoveScreenshot = (id) => {
    setScreenshots(prev => {
      const target = prev.find(item => item.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  // Helper to convert File object to Base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Validate & Send via WhatsApp
  const handleSendWhatsApp = async () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Please enter your name';
    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Please enter your mobile number';
    } else if (!/^[0-9+\s-]{7,15}$/.test(mobileNumber.trim())) {
      newErrors.mobileNumber = 'Enter a valid mobile number';
    }
    if (!issueDescription.trim()) newErrors.issueDescription = 'Please describe your issue';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields.',
        severity: 'error'
      });
      return;
    }

    setErrors({});

    // Target WhatsApp number: 9486042369 (Country code 91 for India)
    const targetWhatsAppNumber = '919486042369';

    // Standard WhatsApp-compatible Emojis using explicit Unicode escapes
    const alertEmoji = '\uD83D\uDEA8';  // 🚨
    const nameEmoji = '\uD83D\uDC64';   // 👤
    const phoneEmoji = '\uD83D\uDCDE';  // 📞
    const issueEmoji = '\uD83D\uDCDD';  // 📝
    const cameraEmoji = '\uD83D\uDCF7'; // 📷

    let screenshotInfoText = 'No screenshots attached.';
    if (screenshots.length > 0) {
      screenshotInfoText = `${cameraEmoji} *Screenshots attached:* ${screenshots.length} file(s) (${screenshots.map(s => s.name).join(', ')})`;
    }

    const messageText = `*Juicy App Support Request* ${alertEmoji}

${nameEmoji} *Name:* ${name.trim()}
${phoneEmoji} *Mobile Number:* ${mobileNumber.trim()}

${issueEmoji} *Issue Description:*
${issueDescription.trim()}

${screenshotInfoText}

---
Sent via Juicy App Help Center`;

    // Check Native Capacitor plugin for native Android/iOS
    const { AudioRoute } = window.Capacitor?.Plugins || {};

    if (screenshots.length > 0) {
      try {
        const firstScreenshot = screenshots[0];
        const base64Data = await fileToBase64(firstScreenshot.file);

        if (AudioRoute && typeof AudioRoute.shareImage === 'function') {
          // Native Android/Capacitor: send image + text directly via AudioRoute shareImage targeting WhatsApp
          setSnackbar({
            open: true,
            message: 'Opening WhatsApp with image and message attached...',
            severity: 'success'
          });
          await AudioRoute.shareImage({
            base64Data: base64Data,
            fileName: firstScreenshot.name || `help_screenshot_${Date.now()}.png`,
            text: messageText,
            package: 'com.whatsapp',
            phone: targetWhatsAppNumber
          });
          return;
        }
        // Web Browser: use navigator.share if file sharing is supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [firstScreenshot.file] })) {
          setSnackbar({
            open: true,
            message: 'Opening share sheet to send via WhatsApp...',
            severity: 'success'
          });
          await navigator.share({
            files: [firstScreenshot.file],
            title: 'Juicy Support Request',
            text: messageText
          });
          return;
        }
      } catch (err) {
        console.warn('File share API error, falling back to direct URL:', err);
      }
    }

    // Fallback or no screenshots: Direct WhatsApp URL scheme
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodedMessage}`;

    if (screenshots.length > 0) {
      // Try copying image to clipboard on Web desktop fallback so user can paste it (Ctrl+V)
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new window.ClipboardItem({ [screenshots[0].file.type]: screenshots[0].file });
          await navigator.clipboard.write([item]);
          setSnackbar({
            open: true,
            message: 'Screenshot copied to clipboard! Opening WhatsApp... (Paste with Ctrl+V)',
            severity: 'info'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Opening WhatsApp with support details...',
            severity: 'info'
          });
        }
      } catch (e) {
        setSnackbar({
          open: true,
          message: 'Opening WhatsApp with support details...',
          severity: 'info'
        });
      }
    } else {
      setSnackbar({
        open: true,
        message: 'Opening WhatsApp to send your support request...',
        severity: 'success'
      });
    }

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 600);
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: 'var(--background-color, #fff6f8)',
        color: 'var(--text-color, #000000)',
        fontFamily: 'var(--app-font, "Poppins", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Bar */}
      <Paper
        elevation={0}
        sx={{
          py: 1.5,
          px: 2,
          bgcolor: 'var(--surface-color, #ffffff)',
          color: 'var(--text-color, #000000)',
          borderBottom: '1px solid rgba(128,128,128,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          zIndex: 10,
          flexShrink: 0
        }}
      >
        <IconButton onClick={handleBack} sx={{ color: 'var(--primary-color, #f06292)' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpOutlineIcon sx={{ color: 'var(--primary-color, #f06292)' }} />
          <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1.15rem', color: 'var(--text-color, inherit)' }}>
            Help & Support
          </Typography>
        </Box>
      </Paper>

      {/* Scrollable Form Content Area */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          p: { xs: 2, sm: 4 },
          pb: { xs: 14, sm: 8 },
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            maxWidth: 600,
            width: '100%',
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
        {/* Intro Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            border: '1px solid rgba(240, 98, 146, 0.25)',
            background: 'linear-gradient(135deg, rgba(240, 98, 146, 0.12) 0%, var(--surface-color, #ffffff) 100%)'
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" color="var(--primary-color, #f06292)" gutterBottom>
            How can we help you?
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'var(--text-color, #000000)', opacity: 0.85 }}>
            Encountering an issue or have a question? Fill out the details below and tap <b>Send via WhatsApp</b> to chat directly with our support team .
          </Typography>
        </Paper>

        {/* Form Controls */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #000000)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            border: '1px solid rgba(128,128,128,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          {/* Name Field */}
          <Box>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 0.8, color: 'var(--text-color, inherit)' }}>
              Your Name *
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              error={!!errors.name}
              helperText={errors.name}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(128,128,128,0.06)',
                  color: 'var(--text-color, inherit)',
                  '& fieldset': {
                    borderColor: 'rgba(128,128,128,0.25)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--primary-color, #f06292)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-color, #f06292)',
                  },
                  '& input': {
                    color: 'var(--text-color, inherit)',
                  },
                  '& input::placeholder': {
                    color: 'var(--text-color, inherit)',
                    opacity: 0.55,
                  }
                }
              }}
            />
          </Box>

          {/* Mobile Number Field */}
          <Box>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 0.8, color: 'var(--text-color, inherit)' }}>
              Mobile Number *
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              type="tel"
              placeholder="Enter your phone number (e.g., 9486042369)"
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(e.target.value);
                if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: null }));
              }}
              error={!!errors.mobileNumber}
              helperText={errors.mobileNumber}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(128,128,128,0.06)',
                  color: 'var(--text-color, inherit)',
                  '& fieldset': {
                    borderColor: 'rgba(128,128,128,0.25)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--primary-color, #f06292)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-color, #f06292)',
                  },
                  '& input': {
                    color: 'var(--text-color, inherit)',
                  },
                  '& input::placeholder': {
                    color: 'var(--text-color, inherit)',
                    opacity: 0.55,
                  }
                }
              }}
            />
          </Box>

          {/* Description Field */}
          <Box>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 0.8, color: 'var(--text-color, inherit)' }}>
              Description about Issue *
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              variant="outlined"
              placeholder="Explain the problem or error you encountered in detail..."
              value={issueDescription}
              onChange={(e) => {
                setIssueDescription(e.target.value);
                if (errors.issueDescription) setErrors(prev => ({ ...prev, issueDescription: null }));
              }}
              error={!!errors.issueDescription}
              helperText={errors.issueDescription}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(128,128,128,0.06)',
                  color: 'var(--text-color, inherit)',
                  '& fieldset': {
                    borderColor: 'rgba(128,128,128,0.25)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--primary-color, #f06292)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-color, #f06292)',
                  },
                  '& textarea': {
                    color: 'var(--text-color, inherit)',
                  },
                  '& textarea::placeholder': {
                    color: 'var(--text-color, inherit)',
                    opacity: 0.55,
                  }
                }
              }}
            />
          </Box>

          {/* Screenshot Attachments */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="600" sx={{ color: 'var(--text-color, inherit)' }}>
                Screenshots (Optional)
              </Typography>
              <Chip
                label={`${screenshots.length} Attached`}
                size="small"
                color={screenshots.length > 0 ? 'primary' : 'default'}
                sx={{
                  height: 22,
                  fontSize: '0.75rem',
                  ...(screenshots.length === 0 && {
                    bgcolor: 'rgba(128,128,128,0.15)',
                    color: 'var(--text-color, inherit)'
                  })
                }}
              />
            </Box>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />

            {/* Upload Button */}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddPhotoAlternateIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                borderRadius: 2,
                py: 1.2,
                textTransform: 'none',
                borderColor: 'var(--primary-color, #f06292)',
                color: 'var(--primary-color, #f06292)',
                fontWeight: 600,
                borderStyle: 'dashed',
                bgcolor: 'rgba(128,128,128,0.04)',
                '&:hover': {
                  borderColor: 'var(--primary-color, #f06292)',
                  bgcolor: 'rgba(240, 98, 146, 0.08)'
                }
              }}
            >
              Add Screenshot Image(s)
            </Button>

            {/* Screenshot Previews */}
            {screenshots.length > 0 && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: 1.5,
                  mt: 2,
                  maxHeight: 220,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(128,128,128,0.08)'
                }}
              >
                {screenshots.map((item) => (
                  <Card
                    key={item.id}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="80"
                      image={item.previewUrl}
                      alt="Screenshot"
                      sx={{ objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveScreenshot(item.id)}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        color: '#ffffff',
                        p: 0.4,
                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.9)' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* Submit Button to WhatsApp */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<WhatsAppIcon sx={{ fontSize: 24 }} />}
            onClick={handleSendWhatsApp}
            sx={{
              mt: 1,
              py: 1.5,
              borderRadius: 2.5,
              bgcolor: '#25D366',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
              '&:hover': {
                bgcolor: '#1eb857',
                boxShadow: '0 6px 20px rgba(37, 211, 102, 0.45)'
              }
            }}
          >
            Send via WhatsApp
          </Button>
        </Paper>
      </Box>
    </Box>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily: 'var(--app-font, "Poppins")', fontWeight: 500, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Help;
