import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Snackbar,
  Button,
  Container,
  Paper,
  Avatar,
  useMediaQuery,
  Divider,
  Chip,
  Tooltip,
  Switch,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CakeIcon from '@mui/icons-material/Cake';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TransgenderIcon from '@mui/icons-material/Transgender';
import InfoIcon from '@mui/icons-material/Info';
import BadgeIcon from '@mui/icons-material/Badge';
import PublicIcon from '@mui/icons-material/Public';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VerifiedIcon from '@mui/icons-material/Verified';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SecurityIcon from '@mui/icons-material/Security';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import API_BASE_URL from './config/apiConfig';
import { getUserProfileLocally, saveUserProfileLocally } from './db/offlineDb';
import { getProfileImageSrc } from './utils/imageUtils';

const EditProfile = ({ onBack }) => {
  const [image, setImage] = useState(() => {
    try {
      return (
        localStorage.getItem('profileImageCache') ||
        localStorage.getItem('profileImage') ||
        null
      );
    } catch (e) {
      return null;
    }
  });
  const [imageFile, setImageFile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [about, setAbout] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [profileVisible, setProfileVisible] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);
  const [createdAt, setCreatedAt] = useState('');
  const [govidproof, setGovidproof] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Profile Saved!');
  const [focusedField, setFocusedField] = useState(null);
  const [idCopied, setIdCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Dark mode detection matching Settings.js and Yourmood.js
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

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      navigate('/chat?tab=settings');
    }
  };

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');

  // Helper to parse phone number and country code cleanly
  const parsePhoneAndCode = (rawPhone, rawCountryCode) => {
    let code = rawCountryCode || '+91';
    let num = String(rawPhone || '').trim();
    if (num.startsWith('+')) {
      const knownCodes = ['+971', '+966', '+965', '+968', '+974', '+973', '+880', '+977', '+358', '+353', '+351', '+234', '+254', '+212', '+91', '+44', '+65', '+60', '+61', '+86', '+81', '+82', '+33', '+49', '+39', '+34', '+92', '+94', '+63', '+62', '+55', '+52', '+90', '+27', '+31', '+32', '+41', '+46', '+47', '+45', '+30', '+20', '+962', '+64', '+1', '+7'];
      for (const c of knownCodes) {
        if (num.startsWith(c)) {
          if (!rawCountryCode) code = c;
          num = num.slice(c.length).trim();
          break;
        }
      }
    }
    const digitsOnly = num.replace(/\D/g, '');
    const phoneDigits = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    return { phoneDigits, code };
  };

  useEffect(() => {
    // 0. Immediate local cache hydration
    const localCached = localStorage.getItem('profileImageCache') || localStorage.getItem('profileImage');
    if (localCached && !image) {
      setImage(localCached);
    }

    if (!userId) return;

    // 1. Instant offline load from local SQLite
    getUserProfileLocally(userId)
      .then(cachedUser => {
        if (cachedUser) {
          if (cachedUser.name !== undefined) setFullName(cachedUser.name || '');
          if (cachedUser.username !== undefined) setUsername(cachedUser.username || '');
          if (cachedUser.dob !== undefined) setDob(cachedUser.dob || '');
          if (cachedUser.about !== undefined) setAbout(cachedUser.about || '');
          if (cachedUser.phone !== undefined) {
            const { phoneDigits, code } = parsePhoneAndCode(cachedUser.phone, cachedUser.countryCode);
            setPhone(phoneDigits);
            if (code) setCountryCode(code);
          } else if (cachedUser.countryCode) {
            setCountryCode(cachedUser.countryCode);
          }
          if (cachedUser.email !== undefined) setEmail(cachedUser.email || '');
          if (cachedUser.gender !== undefined) setGender(cachedUser.gender || '');
          if (cachedUser.city !== undefined) setCity(cachedUser.city || '');
          if (cachedUser.country !== undefined) setCountry(cachedUser.country || '');
          const cachedImg = cachedUser.profileImage || cachedUser.profilePic || cachedUser.image || cachedUser.photoURL || localCached;
          if (cachedImg) setImage(cachedImg);
          if (cachedUser.profileVisible !== undefined) {
            setProfileVisible(cachedUser.profileVisible === true || cachedUser.profileVisible === 'true');
          }
          if (cachedUser.createdAt) setCreatedAt(cachedUser.createdAt);
          if (cachedUser.govidproof) setGovidproof(cachedUser.govidproof);
          if (Array.isArray(cachedUser.friends)) {
            setFriendsCount(cachedUser.friends.length);
          } else if (cachedUser.friendsCount) {
            setFriendsCount(Number(cachedUser.friendsCount) || 0);
          }
        }
      })
      .catch(err => console.warn('SQLite profile load notice:', err));

    // 2. Fetch latest profile from backend and cache in SQLite
    fetch(`${API_BASE_URL}/api/user/${userId}`)
      .then(res => res.json())
      .then(user => {
        if (user && (user._id || user.username || user.name)) {
          setFullName(user.name || '');
          setUsername(user.username || '');
          setDob(user.dob || '');
          setAbout(user.about || '');
          if (user.phone !== undefined) {
            const { phoneDigits, code } = parsePhoneAndCode(user.phone, user.countryCode);
            setPhone(phoneDigits);
            if (code) setCountryCode(code);
          } else if (user.countryCode) {
            setCountryCode(user.countryCode);
          }
          setEmail(user.email || '');
          setGender(user.gender || '');
          setCity(user.city || '');
          setCountry(user.country || '');
          const freshImg = user.profileImage || user.profilePic || user.image || user.photoURL || localCached;
          if (freshImg) {
            setImage(freshImg);
            try {
              localStorage.setItem('profileImage', freshImg);
              localStorage.setItem('profileImageCache', freshImg);
            } catch (e) {}
          }
          if (user.profileVisible !== undefined) {
            setProfileVisible(user.profileVisible === true || user.profileVisible === 'true');
          }
          if (user.createdAt) setCreatedAt(user.createdAt);
          if (user.govidproof) setGovidproof(user.govidproof);
          if (Array.isArray(user.friends)) {
            setFriendsCount(user.friends.length);
          }

          // Save fresh profile to local SQLite
          saveUserProfileLocally(userId, user, 'synced');
        }
      })
      .catch(err => {
        console.warn('Network profile fetch failed, using offline SQLite cache:', err);
      });
  }, [userId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  // Copy User ID helper
  const handleCopyUserId = () => {
    if (userId) {
      navigator.clipboard?.writeText(userId);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  // Format member joined date
  const memberSinceFormatted = useMemo(() => {
    if (!createdAt) return 'Active Member';
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return 'Active Member';
      return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch {
      return 'Active Member';
    }
  }, [createdAt]);

  // Save changes offline-first
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const userData = {
        name: fullName,
        username,
        dob,
        about,
        phone,
        email,
        gender,
        city,
        country,
        countryCode,
        profileVisible,
      };

      const persistAndSync = async (dataToSave) => {
        // 1. Immediately persist to SQLite locally (offline safety)
        await saveUserProfileLocally(userId, dataToSave, 'pending');

        // 2. Attempt sync with backend
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave),
          });
          if (response.ok) {
            await saveUserProfileLocally(userId, dataToSave, 'synced');
          }
          if (dataToSave.profileImage) {
            localStorage.setItem('profileImage', dataToSave.profileImage);
            localStorage.setItem('profileImageCache', dataToSave.profileImage);
          }
        } catch (networkErr) {
          console.warn('Profile saved to local SQLite (offline mode, synced later):', networkErr);
        }

        setImageFile(null);
        setIsSaving(false);
        setSnackbarMessage('Profile Saved Successfully!');
        setSnackbarOpen(true);
        setTimeout(() => {
          handleBack();
        }, 1500);
      };

      // Convert image to base64 if a new image was selected
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          userData.profileImage = reader.result;
          await persistAndSync(userData);
        };
        reader.readAsDataURL(imageFile);
      } else {
        if (image) userData.profileImage = image;
        await persistAndSync(userData);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setIsSaving(false);
    }
  };

  // Color tokens
  const primaryPink = '#e52e71';
  const primaryPinkHover = '#ff4d86';
  const primaryGradient = 'linear-gradient(135deg, #ff4d86 0%, #e52e71 100%)';
  const cardBg = isDark ? '#1a1824' : '#ffffff';
  const cardBorder = isDark ? '1px solid rgba(255, 77, 134, 0.18)' : '1px solid rgba(229, 46, 113, 0.12)';
  const fieldBg = isDark ? '#232032' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#172033';
  const textSecondary = isDark ? '#a8b2c1' : '#718096';

  // 3D Input Style helper
  const getInputStyle = (fieldName) => ({
    padding: '14px 16px 14px 44px',
    borderRadius: '16px',
    border: focusedField === fieldName
      ? '1.8px solid #ff4d86'
      : isDark
        ? '1.5px solid rgba(255, 77, 134, 0.22)'
        : '1.5px solid rgba(229, 46, 113, 0.18)',
    backgroundColor: fieldBg,
    color: textPrimary,
    fontSize: '14.5px',
    fontWeight: 500,
    fontFamily: 'Poppins, sans-serif',
    outline: 'none',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: focusedField === fieldName
      ? '0 6px 20px rgba(229, 46, 113, 0.16), inset 0 2px 4px rgba(0,0,0,0.02)'
      : '0 2px 8px rgba(0, 0, 0, 0.02)',
  });

  const validBadgeStyle = {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    zIndex: 2,
    userSelect: 'none',
  };

  const fieldWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  };

  const iconStyle = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: focusedField ? '#e52e71' : '#ff4d86',
    fontSize: '20px',
    zIndex: 2,
    opacity: 0.85,
    pointerEvents: 'none',
    transition: 'all 0.25s ease',
  };

  return (
    <Box sx={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: isDark ? '#121018' : 'var(--background-color, #fffafb)',
      fontFamily: 'Poppins, sans-serif',
      overflow: 'hidden',
    }}>
      {/* 3D Glassmorphic Top AppBar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: isDark ? 'rgba(26, 24, 36, 0.88)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: textPrimary,
          borderBottom: isDark ? '1px solid rgba(255, 77, 134, 0.15)' : '1px solid rgba(229, 46, 113, 0.12)',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.35)'
            : '0 4px 20px rgba(229, 46, 113, 0.06)',
          zIndex: 10,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              edge="start"
              onClick={handleBack}
              aria-label="back"
              sx={{
                width: 40,
                height: 40,
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(229, 46, 113, 0.08)',
                color: primaryPink,
                boxShadow: isDark
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(229, 46, 113, 0.15)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: primaryPink,
                  color: '#fff',
                  transform: 'scale(1.05) translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(229, 46, 113, 0.35)',
                },
                '&:active': {
                  transform: 'scale(0.96)',
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontFamily: 'Poppins, sans-serif',
                  color: textPrimary,
                  fontSize: { xs: '1.05rem', sm: '1.25rem' },
                  letterSpacing: -0.3,
                  lineHeight: 1.2,
                }}
              >
                Profile & Account
              </Typography>
              <Typography
                sx={{
                  color: textSecondary,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 500,
                }}
              >
                View and customize your 3D Juicy presence
              </Typography>
            </Box>
          </Box>

          {/* Quick Save Action Pill */}

        </Toolbar>
      </AppBar>

      {/* Main 3D Scrollable Workspace (No scrollbar visible) */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        pb: { xs: 12, sm: 8 },
        minHeight: 0,
      }}>
        <Container maxWidth="sm" sx={{ pt: { xs: 2.5, sm: 3 }, px: { xs: 2, sm: 2.5 } }}>

          {/* 1. HERO 3D PROFILE CARD */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              mb: 3,
              borderRadius: '24px',
              bgcolor: cardBg,
              border: cardBorder,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: isDark
                ? '0 16px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(255, 77, 134, 0.08)'
                : '0 16px 40px rgba(229, 46, 113, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: isDark
                  ? '0 20px 48px rgba(0, 0, 0, 0.55), 0 6px 16px rgba(255, 77, 134, 0.12)'
                  : '0 20px 48px rgba(229, 46, 113, 0.13), 0 6px 16px rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {/* Top decorative gradient ambient aura */}
            <Box sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 77, 134, 0.15) 0%, rgba(255, 77, 134, 0) 70%)',
              pointerEvents: 'none',
            }} />

            {/* Avatar & Camera 3D Stage */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                {/* 3D Glowing Gradient Ring */}
                <Box sx={{
                  p: '4px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff4d86 0%, #e52e71 50%, #ff8dae 100%)',
                  boxShadow: '0 8px 26px rgba(229, 46, 113, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Avatar
                    src={getProfileImageSrc(image)}
                    alt="Profile"
                    imgProps={{
                      referrerPolicy: 'no-referrer',
                      crossOrigin: 'anonymous',
                      loading: 'eager',
                    }}
                    slotProps={{
                      img: {
                        referrerPolicy: 'no-referrer',
                        crossOrigin: 'anonymous',
                        loading: 'eager',
                      },
                    }}
                    sx={{
                      width: { xs: 104, sm: 116 },
                      height: { xs: 104, sm: 116 },
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #ffffff',
                      bgcolor: isDark ? '#2b2333' : '#fff0f5',
                      color: primaryPink,
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {(fullName?.[0] || username?.[0] || 'J').toUpperCase()}
                  </Avatar>
                </Box>

                {/* 3D Camera Action Button with pop effect */}
                <label htmlFor="image-upload">
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      borderRadius: '50%',
                      background: primaryGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '3px solid #ffffff',
                      boxShadow: '0 4px 14px rgba(229, 46, 113, 0.5)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.15) translateY(-2px)',
                        boxShadow: '0 6px 18px rgba(229, 46, 113, 0.7)',
                      },
                      '&:active': {
                        transform: 'scale(0.96)',
                      },
                    }}
                  >
                    <CameraAltIcon sx={{ color: '#fff', fontSize: { xs: 18, sm: 20 } }} />
                  </Box>
                </label>
                <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} hidden />
              </Box>

              {/* User Name & Handle */}
              <Box sx={{ textAlign: 'center', mt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.25rem', sm: '1.45rem' },
                      color: textPrimary,
                      fontFamily: 'Poppins, sans-serif',
                      letterSpacing: -0.3,
                    }}
                  >
                    {fullName || 'Juicy Explorer'}
                  </Typography>

                  {/* Verification Checkmark Badge from govidproof */}
                  {govidproof && (
                    <Tooltip title="Verified Juicy Account" arrow>
                      <VerifiedIcon sx={{ color: '#00b4d8', fontSize: 20 }} />
                    </Tooltip>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      color: primaryPink,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    @{username || 'juicy_user'}
                  </Typography>

                  {/* Copyable Juicy User ID Badge */}
                  {userId && (
                    <Tooltip title={idCopied ? 'Copied to Clipboard!' : 'Click to copy User ID'} arrow>
                      <Chip
                        icon={<ContentCopyIcon sx={{ '&&': { fontSize: 13, color: textSecondary } }} />}
                        label={idCopied ? 'Copied!' : `ID: ${userId.slice(-6)}`}
                        onClick={handleCopyUserId}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          color: textSecondary,
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 77, 134, 0.15)' : 'rgba(229, 46, 113, 0.08)',
                            color: primaryPink,
                          },
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>

            {/* 3D Stat Ribbon (Friends, Visibility, Joined) */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: { xs: 1, sm: 1.5 },
              p: { xs: 1.2, sm: 1.5 },
              borderRadius: '18px',
              bgcolor: isDark ? '#221f2f' : '#fff5f8',
              border: isDark ? '1px solid rgba(255, 77, 134, 0.12)' : '1px solid rgba(229, 46, 113, 0.1)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
            }}>
              {/* Stat 1: Friends */}
              <Box sx={{ textAlign: 'center', p: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: primaryPink }}>
                  <PeopleAltIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: textPrimary }}>
                    {friendsCount}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 500, mt: 0.2 }}>
                  Friends
                </Typography>
              </Box>

              {/* Stat 2: Visibility */}
              <Box sx={{ textAlign: 'center', p: 0.5, borderLeft: cardBorder, borderRight: cardBorder }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: profileVisible ? '#10b981' : '#f59e0b' }}>
                  {profileVisible ? <VisibilityIcon sx={{ fontSize: 16 }} /> : <VisibilityOffIcon sx={{ fontSize: 16 }} />}
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, color: profileVisible ? '#10b981' : '#f59e0b' }}>
                    {profileVisible ? 'Public' : 'Hidden'}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 500, mt: 0.2 }}>
                  Visibility
                </Typography>
              </Box>

              {/* Stat 3: Member Since */}
              <Box sx={{ textAlign: 'center', p: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: primaryPink }}>
                  <CalendarTodayIcon sx={{ fontSize: 15 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, color: textPrimary, noWrap: true }}>
                    {memberSinceFormatted}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 500, mt: 0.2 }}>
                  Joined
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* 2. SECTION: PERSONAL IDENTITY CARD */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              mb: 2.5,
              borderRadius: '22px',
              bgcolor: cardBg,
              border: cardBorder,
              boxShadow: isDark
                ? '0 10px 30px rgba(0, 0, 0, 0.35)'
                : '0 10px 30px rgba(229, 46, 113, 0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(255, 77, 134, 0.15)' : 'rgba(229, 46, 113, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryPink,
              }}>
                <PersonIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: textPrimary }}>
                Basic Information
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Full Name & Username in 2 columns on tablet/desktop */}
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1.8 }}>
                {/* Full Name */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                    Full Name
                  </Typography>
                  <Box sx={fieldWrapperStyle}>
                    <PersonIcon sx={iconStyle} />
                    <input
                      type="text"
                      placeholder="e.g. Yuvasri Arumugasamy"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('name')}
                    />
                  </Box>
                </Box>

                {/* Username */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                    Username
                  </Typography>
                  <Box sx={fieldWrapperStyle}>
                    <BadgeIcon sx={iconStyle} />
                    <input
                      type="text"
                      placeholder="e.g. yuvasri_2005"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('username')}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Bio / About Me */}
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                  About Me / Bio
                </Typography>
                <Box sx={fieldWrapperStyle}>
                  <InfoIcon sx={{ ...iconStyle, top: '22px' }} />
                  <textarea
                    rows={3}
                    placeholder="Share a thought, your passions, or a fun vibe with friends..."
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    onFocus={() => setFocusedField('about')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...getInputStyle('about'),
                      paddingTop: '12px',
                      resize: 'none',
                      lineHeight: 1.5,
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* 3. SECTION: CONTACT & COMMUNICATION */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              mb: 2.5,
              borderRadius: '22px',
              bgcolor: cardBg,
              border: cardBorder,
              boxShadow: isDark
                ? '0 10px 30px rgba(0, 0, 0, 0.35)'
                : '0 10px 30px rgba(229, 46, 113, 0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(255, 77, 134, 0.15)' : 'rgba(229, 46, 113, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryPink,
              }}>
                <PhoneIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: textPrimary }}>
                Contact Details
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Phone Number with Country Code */}
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                  Phone Number
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.2 }}>
                  {/* Country Code Select */}
                  <Box sx={{ width: { xs: '95px', sm: '110px' } }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        ...getInputStyle('countryCode'),
                        padding: '14px 10px',
                        textAlign: 'center',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+65">🇸🇬 +65</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+60">🇲🇾 +60</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                  </Box>

                  {/* Phone Input */}
                  <Box sx={{ ...fieldWrapperStyle, flex: 1 }}>
                    <PhoneIcon sx={iconStyle} />
                    <input
                      type="tel"
                      placeholder="10-digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('phone')}
                    />
                    {phone.length === 10 ? (
                      <span style={validBadgeStyle}>✅</span>
                    ) : phone.length > 0 ? (
                      <span style={validBadgeStyle}>❌</span>
                    ) : null}
                  </Box>
                </Box>
              </Box>

              {/* Email Address */}
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                  Email Address
                </Typography>
                <Box sx={fieldWrapperStyle}>
                  <EmailIcon sx={iconStyle} />
                  <input
                    type="email"
                    placeholder="e.g. yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={getInputStyle('email')}
                  />
                  {email.length > 0 && (
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                      <span style={validBadgeStyle}>✅</span>
                    ) : (
                      <span style={validBadgeStyle}>❌</span>
                    )
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* 4. SECTION: PERSONAL & REGIONAL (from juicee.users.csv) */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              mb: 2.5,
              borderRadius: '22px',
              bgcolor: cardBg,
              border: cardBorder,
              boxShadow: isDark
                ? '0 10px 30px rgba(0, 0, 0, 0.35)'
                : '0 10px 30px rgba(229, 46, 113, 0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(255, 77, 134, 0.15)' : 'rgba(229, 46, 113, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryPink,
              }}>
                <PublicIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: textPrimary }}>
                Demographics & Location
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Date of Birth & Gender in 2 columns */}
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1.8 }}>
                {/* Date of Birth */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                    Date of Birth
                  </Typography>
                  <Box sx={fieldWrapperStyle}>
                    <CakeIcon sx={iconStyle} />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('dob')}
                    />
                  </Box>
                </Box>

                {/* Gender */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                    Gender
                  </Typography>
                  <Box sx={fieldWrapperStyle}>
                    <TransgenderIcon sx={iconStyle} />
                    <select
                      value={(gender || '').toLowerCase()}
                      onChange={(e) => setGender(e.target.value)}
                      onFocus={() => setFocusedField('gender')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        ...getInputStyle('gender'),
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </Box>
                </Box>
              </Box>

              {/* City & Country in 2 columns */}
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1.8 }}>
                {/* City */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                    City
                  </Typography>
                  <Box sx={fieldWrapperStyle}>
                    <LocationOnIcon sx={iconStyle} />
                    <input
                      type="text"
                      placeholder="e.g. Chennai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onFocus={() => setFocusedField('city')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('city')}
                    />
                  </Box>
                </Box>

                {/* Country */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary, mb: 0.8, ml: 0.5 }}>
                    Country
                  </Typography>
                  <Box sx={fieldWrapperStyle}>
                    <PublicIcon sx={iconStyle} />
                    <input
                      type="text"
                      placeholder="e.g. India"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      onFocus={() => setFocusedField('country')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('country')}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* 5. SECTION: PRIVACY & DISCOVERY (profileVisible from juicee.users.csv) */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              mb: 3.5,
              borderRadius: '22px',
              bgcolor: cardBg,
              border: cardBorder,
              boxShadow: isDark
                ? '0 10px 30px rgba(0, 0, 0, 0.35)'
                : '0 10px 30px rgba(229, 46, 113, 0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pr: 2 }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '12px',
                  bgcolor: profileVisible ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: profileVisible ? '#10b981' : '#f59e0b',
                  mt: 0.3,
                }}>
                  <SecurityIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: textPrimary, lineHeight: 1.3 }}>
                    Profile Visibility in Discovery
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: textSecondary, mt: 0.4, lineHeight: 1.4 }}>
                    {profileVisible
                      ? 'Your profile is visible to other Juicy members in nearby radar & friend search.'
                      : 'Your profile is hidden from discovery. Only direct connections can view your details.'}
                  </Typography>
                </Box>
              </Box>

              {/* 3D Tactile Switch */}
              <Switch
                checked={profileVisible}
                onChange={(e) => setProfileVisible(e.target.checked)}
                sx={{
                  width: 52,
                  height: 30,
                  padding: 0,
                  '& .MuiSwitch-switchBase': {
                    padding: 0,
                    margin: '3px',
                    transitionDuration: '250ms',
                    '&.Mui-checked': {
                      transform: 'translateX(22px)',
                      color: '#fff',
                      '& + .MuiSwitch-track': {
                        backgroundColor: '#e52e71',
                        opacity: 1,
                        border: 0,
                      },
                    },
                  },
                  '& .MuiSwitch-thumb': {
                    boxSizing: 'border-box',
                    width: 24,
                    height: 24,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  },
                  '& .MuiSwitch-track': {
                    borderRadius: 30 / 2,
                    backgroundColor: isDark ? '#3d394e' : '#e2e8f0',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          </Paper>

          {/* 6. PROMINENT 3D SAVE CHANGES BUTTON */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSave}
              disabled={isSaving}
              startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 22 }} />}
              sx={{
                background: primaryGradient,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.05rem' },
                fontFamily: 'Poppins, sans-serif',
                textTransform: 'none',
                borderRadius: '18px',
                py: { xs: 1.6, sm: 1.8 },
                letterSpacing: 0.3,
                boxShadow: '0 10px 28px rgba(229, 46, 113, 0.4), inset 0 1px 1px rgba(255,255,255,0.4)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff5c8d 0%, #d81b60 100%)',
                  boxShadow: '0 14px 34px rgba(229, 46, 113, 0.55)',
                  transform: 'translateY(-2.5px)',
                },
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '0 6px 18px rgba(229, 46, 113, 0.35)',
                },
              }}
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 3D Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1800}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: { xs: 2, sm: 3 },
          zIndex: 9999,
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.8,
          bgcolor: cardBg,
          borderRadius: '20px',
          px: { xs: 3, sm: 4 },
          py: 1.8,
          boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes slideDown': {
            from: { opacity: 0, transform: 'translateY(-20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}>
          <CheckCircleRoundedIcon sx={{ color: '#10b981', fontSize: { xs: 28, sm: 32 } }} />
          <Typography
            sx={{
              color: textPrimary,
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
            }}
          >
            {snackbarMessage}
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  );
};

export default EditProfile;
