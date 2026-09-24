import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  Grid,
  Switch,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CakeIcon from "@mui/icons-material/Cake";
import InfoIcon from "@mui/icons-material/Info";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import SecurityIcon from "@mui/icons-material/Security";
import { keyframes } from '@emotion/react';
import "@fontsource/pacifico";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import Slide from "@mui/material/Slide";
import useSwipeBack from './hooks/useSwipeBack';
import juiceeLogo from './logo/juicee2.png';
import API_BASE_URL from './config/apiConfig';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// ============================================================
// 3D JUICEE SPLASH ANIMATIONS & ATMOSPHERE (SAME AS SIGN IN)
// ============================================================

// Main 3D tumble entrance: starts deep in 3D perspective, tilts and overshoots into place
const logoTumbleIn = keyframes`
  0% {
    opacity: 0;
    transform:
      perspective(1000px)
      translate3d(0, -15px, -350px)
      rotateX(-60deg)
      rotateY(55deg)
      rotateZ(-6deg)
      scale(0.7);
  }
  40% {
    opacity: 1;
    transform:
      perspective(1000px)
      translate3d(0, -5px, 50px)
      rotateX(16deg)
      rotateY(-15deg)
      rotateZ(2deg)
      scale(1.05);
  }
  70% {
    transform:
      perspective(1000px)
      translate3d(0, 2px, 16px)
      rotateX(-5deg)
      rotateY(6deg)
      rotateZ(-1deg)
      scale(1.01);
  }
  85% {
    transform:
      perspective(1000px)
      translate3d(0, -1px, 5px)
      rotateX(2deg)
      rotateY(-2deg)
      rotateZ(0deg)
      scale(1);
  }
  100% {
    opacity: 1;
    transform:
      perspective(1000px)
      translate3d(0, 0, 0)
      rotateX(0deg)
      rotateY(0deg)
      rotateZ(0deg)
      scale(1);
  }
`;

// Continuous subtle 3D floating / coin-like wobble
const logoFloat = keyframes`
  0%, 100% {
    transform:
      perspective(1000px)
      translate3d(0, 0, 0)
      rotateX(0deg)
      rotateY(0deg)
      rotateZ(0deg);
  }
  25% {
    transform:
      perspective(1000px)
      translate3d(0, -4px, 8px)
      rotateX(2deg)
      rotateY(-3deg)
      rotateZ(-0.4deg);
  }
  50% {
    transform:
      perspective(1000px)
      translate3d(0, -7px, 14px)
      rotateX(-2deg)
      rotateY(4deg)
      rotateZ(0.4deg);
  }
  75% {
    transform:
      perspective(1000px)
      translate3d(0, -3px, 6px)
      rotateX(1.5deg)
      rotateY(-2deg)
      rotateZ(-0.2deg);
  }
`;

// Soft shadow under the floating logo
const shadowPulse = keyframes`
  0%, 100% {
    transform: translateX(-50%) scale(1);
    opacity: 0.16;
  }
  50% {
    transform: translateX(-50%) scale(0.85);
    opacity: 0.08;
  }
`;

// Glossy light sweep across the logo
const logoLightSweep = keyframes`
  0% {
    transform: translateX(-160%) skewX(-18deg);
    opacity: 0;
  }
  20% {
    opacity: 0.35;
  }
  55% {
    opacity: 0.1;
  }
  100% {
    transform: translateX(220%) skewX(-18deg);
    opacity: 0;
  }
`;

// Floating background orb #1
const orbDriftOne = keyframes`
  0%, 100% {
    opacity: 0.18;
    transform: translate(-50px, 30px) scale(0.75);
  }
  50% {
    opacity: 0.55;
    transform: translate(40px, -35px) scale(1.05);
  }
`;

// Floating background orb #2
const orbDriftTwo = keyframes`
  0%, 100% {
    opacity: 0.16;
    transform: translate(45px, -35px) scale(0.7);
  }
  50% {
    opacity: 0.48;
    transform: translate(-40px, 40px) scale(1.05);
  }
`;

// Floating background orb #3
const orbDriftThree = keyframes`
  0%, 100% {
    opacity: 0.14;
    transform: translate(0, 45px) scale(0.6);
  }
  50% {
    opacity: 0.42;
    transform: translate(50px, -25px) scale(0.95);
  }
`;

// Small floating particle
const particleFloat = keyframes`
  0%, 100% {
    opacity: 0.18;
    transform: translate(0, 15px) scale(0.75);
  }
  50% {
    opacity: 0.5;
    transform: translate(15px, -18px) scale(1);
  }
`;

// Card entrance animation: smooth lift and clear settlement
const cardEntrance = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18px);
  }
  100% {
    opacity: 1;
    transform: none;
  }
`;

// Subtle fade-in for supporting elements
const subtleFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: none;
  }
`;

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const passwordRules = [
  {
    label: "8-16 characters",
    test: (v) => v.length >= 8 && v.length <= 16,
  },
  {
    label: "At least one special character (@, /, -, +, etc.)",
    test: (v) => /[@/+\-!#$%^&*(),.?":{}|<>]/.test(v),
  },
  {
    label: "At least one number (0-9)",
    test: (v) => /\d/.test(v),
  },
];

export default function SignUpPage() {
  useSwipeBack(); // Default threshold is 80px
  const navigate = useNavigate();

  // --- THEME SYNC ---
  const [activeTheme, setActiveTheme] = useState(() => {
    const DEFAULT_THEME = {
      id: 'light',
      name: 'Light',
      description: 'Bright and clear with soft pastels',
      colors: { primary: '#f06292', background: '#fff6f8', surface: '#ffffff', text: '#000000' },
      icon: '☀️'
    };
    try {
      const savedTheme = localStorage.getItem('appTheme');
      return savedTheme ? JSON.parse(savedTheme) : DEFAULT_THEME;
    } catch (e) {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    if (activeTheme && activeTheme.colors) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', activeTheme.colors.primary);
      root.style.setProperty('--background-color', activeTheme.colors.background);
      root.style.setProperty('--surface-color', activeTheme.colors.surface);
      root.style.setProperty('--text-color', activeTheme.colors.text);
    }
  }, [activeTheme]);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme) setActiveTheme(JSON.parse(savedTheme));
      } catch (e) { }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChanged', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', handleStorageChange);
    };
  }, []);

  const getSolidPrimary = (primary) => {
    if (primary && primary.startsWith('linear-gradient')) {
      const match = primary.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
      return match ? match[0] : '#f06292';
    }
    return primary || '#f06292';
  };

  const hexToRgb = (hex) => {
    if (!hex) return '0, 0, 0';
    let c = hex.substring(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const num = parseInt(c, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  };

  const solidPrimary = getSolidPrimary(activeTheme.colors.primary);
  const rgbText = hexToRgb(activeTheme.colors.text);
  const isGradient = activeTheme.colors.primary && activeTheme.colors.primary.startsWith('linear-gradient');
  const isDark = activeTheme.id?.includes('dark') || (activeTheme.colors.background && (activeTheme.colors.background === '#121212' || activeTheme.colors.background.startsWith('#1')));

  // Theme Colors
  const WHITE = activeTheme.colors.surface;
  const LIGHT_GRAY = activeTheme.colors.background;
  const INPUT_TEXT_COLOR = activeTheme.colors.text || '#000000';
  const TEXT_GRAY = `rgba(${rgbText}, 0.65)`;
  const BORDER_GRAY = `rgba(${rgbText}, 0.12)`;

  // Shared 3D Input Style
  const textFieldSx = {
    '& .MuiInputBase-root': {
      borderRadius: '16px',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : LIGHT_GRAY,
      transition: 'all 0.25s ease',
      height: 54,
    },
    '& .MuiInputBase-input': {
      color: INPUT_TEXT_COLOR,
      fontWeight: 500,
      fontSize: '0.96rem',
    },
    '& .MuiInputLabel-root': {
      color: TEXT_GRAY,
      fontSize: '0.92rem',
      '&.Mui-focused': {
        color: solidPrimary,
        fontWeight: 600,
      },
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: BORDER_GRAY,
        transition: 'all 0.25s ease',
      },
      '&:hover fieldset': {
        borderColor: solidPrimary,
      },
      '&.Mui-focused fieldset': {
        borderColor: solidPrimary,
        borderWidth: '1.5px',
        boxShadow: `0 0 0 4px ${solidPrimary}20`,
      },
    },
  };

  // Shared 3D Primary Button Style
  const primaryButtonSx = {
    background: isGradient ? activeTheme.colors.primary : `linear-gradient(135deg, ${solidPrimary}, ${solidPrimary}e6)`,
    color: '#fff',
    borderRadius: '28px',
    textTransform: "none",
    fontWeight: 700,
    height: 50,
    fontSize: '1rem',
    letterSpacing: '0.02em',
    boxShadow: `0 6px 20px -3px ${solidPrimary}50`,
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
      background: isGradient ? activeTheme.colors.primary : `linear-gradient(135deg, ${solidPrimary}, ${solidPrimary})`,
      transform: 'translateY(-2px)',
      boxShadow: `0 10px 25px -3px ${solidPrimary}70`,
      cursor: 'pointer',
    },
    '&:active': {
      transform: 'translateY(0) scale(0.99)',
      boxShadow: `0 4px 12px -2px ${solidPrimary}40`,
    },
    '&:disabled': {
      background: isDark ? 'rgba(255,255,255,0.12)' : '#e0e0e0',
      color: isDark ? 'rgba(255,255,255,0.35)' : '#9e9e9e',
      boxShadow: 'none',
      cursor: 'not-allowed',
      transform: 'none',
    },
  };

  // Shared Outlined Button Style
  const outlinedButtonSx = {
    height: 50,
    borderRadius: '28px',
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.95rem",
    color: INPUT_TEXT_COLOR,
    borderColor: BORDER_GRAY,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    boxShadow: isDark ? 'none' : "0 2px 6px rgba(0,0,0,0.04)",
    transition: "all 0.25s ease",
    "&:hover": {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : "#fafafa",
      borderColor: solidPrimary,
      transform: 'translateY(-1px)',
      boxShadow: `0 6px 16px ${solidPrimary}20`,
    },
  };

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dob: '',
    about: '',
    city: '',
    country: 'India',
    profileVisible: true,
  });

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState({ loading: false, exists: false, checked: false });

  // Username availability check effect
  useEffect(() => {
    let active = true;
    const username = form.username.trim();
    if (!username) {
      setUsernameStatus({ loading: false, exists: false, checked: false });
      return;
    }
    // Only check if username is valid format
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(username)) {
      setUsernameStatus({ loading: false, exists: false, checked: false });
      return;
    }
    setUsernameStatus((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (!active) return;
        setUsernameStatus({ loading: false, exists: data.exists, checked: true });
      } catch {
        if (!active) return;
        setUsernameStatus({ loading: false, exists: false, checked: false });
      }
    }, 500); // debounce
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.username]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [profilePreview, setProfilePreview] = useState('');
  const [popup, setPopup] = useState({
    open: false,
    success: false,
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [countrySelectOpen, setCountrySelectOpen] = useState(false);

  // Terms & Conditions state
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);

  // --- GOOGLE SIGN-IN STATES & HANDLERS ---
  const [googleClientId, setGoogleClientId] = useState(() => {
    const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNative && process.env.REACT_APP_GOOGLE_ANDROID_CLIENT_ID) {
      return process.env.REACT_APP_GOOGLE_ANDROID_CLIENT_ID;
    }
    return process.env.REACT_APP_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id') || '821005945428-7qbipus2rfd5r10d0uoblo6pi23sd9l5.apps.googleusercontent.com';
  });
  const [googleTokenInput, setGoogleTokenInput] = useState('');
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const googleBtnRef = React.useRef(null);

  // Google Sign-In Phone Number Prompt State
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [googlePhoneInput, setGooglePhoneInput] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);
  const [phoneCountryPickerOpen, setPhoneCountryPickerOpen] = useState(false);
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState({ code: '+91', name: 'India', flag: '🇮🇳', dialLength: 10 });

  // Countries list for phone modal
  const phoneCountries = [
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', dialLength: 9 },
    { code: '+91', name: 'India', flag: '🇮🇳', dialLength: 10 },
    { code: '+1', name: 'USA', flag: '🇺🇸', dialLength: 10 },
    { code: '+1', name: 'Canada', flag: '🇨🇦', dialLength: 10 },
    { code: '+44', name: 'UK', flag: '🇬🇧', dialLength: 10 },
    { code: '+971', name: 'UAE', flag: '🇦🇪', dialLength: 9 },
    { code: '+974', name: 'Qatar', flag: '🇶🇦', dialLength: 8 },
    { code: '+965', name: 'Kuwait', flag: '🇰🇼', dialLength: 8 },
    { code: '+968', name: 'Oman', flag: '🇴🇲', dialLength: 8 },
    { code: '+973', name: 'Bahrain', flag: '🇧🇭', dialLength: 8 },
    { code: '+20', name: 'Egypt', flag: '🇪🇬', dialLength: 10 },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰', dialLength: 10 },
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩', dialLength: 10 },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', dialLength: 9 },
    { code: '+977', name: 'Nepal', flag: '🇳🇵', dialLength: 10 },
    { code: '+61', name: 'Australia', flag: '🇦🇺', dialLength: 9 },
    { code: '+65', name: 'Singapore', flag: '🇸🇬', dialLength: 8 },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾', dialLength: 9 },
    { code: '+86', name: 'China', flag: '🇨🇳', dialLength: 11 },
    { code: '+81', name: 'Japan', flag: '🇯🇵', dialLength: 10 },
    { code: '+82', name: 'South Korea', flag: '🇰🇷', dialLength: 10 },
    { code: '+55', name: 'Brazil', flag: '🇧🇷', dialLength: 11 },
    { code: '+7', name: 'Russia', flag: '🇷🇺', dialLength: 10 },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬', dialLength: 10 },
    { code: '+254', name: 'Kenya', flag: '🇰🇪', dialLength: 9 },
  ];

  // Request all essential app permissions one by one (Notifications, Camera, Photos & Videos)
  const requestAllAppPermissions = () => {
    if (typeof window !== 'undefined' && window.PermissionsBridge && typeof window.PermissionsBridge.requestPermissions === 'function') {
      try {
        window.PermissionsBridge.requestPermissions();
        return;
      } catch (e) {
        console.warn('PermissionsBridge.requestPermissions error:', e);
      }
    }

    try {
      if (typeof window !== 'undefined' && window.Capacitor) {
        const { PushNotifications, Camera } = window.Capacitor.Plugins || {};
        if (PushNotifications && typeof PushNotifications.requestPermissions === 'function') {
          PushNotifications.requestPermissions().catch(() => { });
        }
        if (Camera && typeof Camera.requestPermissions === 'function') {
          Camera.requestPermissions({ permissions: ['camera', 'photos'] }).catch(() => { });
        }
      }
    } catch (e) { }

    try {
      if (typeof Notification !== 'undefined' && Notification.requestPermission) {
        Notification.requestPermission().catch(() => { });
      }
    } catch (e) { }

    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          .then(stream => {
            if (stream) stream.getTracks().forEach(t => t.stop());
          })
          .catch(() => { });
      }
    } catch (e) { }
  };

  const handleGoogleResponse = async (response) => {
    if (!response || !response.credential) {
      showPopup(false, "Google Sign-In was cancelled.");
      return;
    }

    try {
      showPopup(true, "Signing in with Google...");
      const res = await fetch(`${API_BASE_URL}/api/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const result = await res.json();
      if (res.ok && result.token && result.user) {
        localStorage.setItem('userId', result.user._id);
        localStorage.setItem('token', result.token);
        if (result.user.username) {
          localStorage.setItem('username', result.user.username);
        }
        if (result.user.profileImage) {
          localStorage.setItem('profileImage', result.user.profileImage);
        }

        if (typeof window !== 'undefined' && window.Capacitor) {
          const { AudioRoute } = window.Capacitor.Plugins || {};
          if (AudioRoute && typeof AudioRoute.saveSession === 'function') {
            AudioRoute.saveSession({
              userId: result.user._id,
              token: result.token,
              username: result.user.username || '',
              profileImage: result.user.profileImage || '',
              backendUrl: 'https://juicyapp.in',
            }).catch(err => console.warn('Native saveSession error:', err));
          }
        }

        if (result.requirePhone) {
          setPendingGoogleUser({ token: result.token, user: result.user });
          setIsNewGoogleUser(result.isNewUser === true);
          setPhoneModalOpen(true);
        } else {
          showPopup(true, result.message || "Google Sign-In successful!");
          requestAllAppPermissions();
          setTimeout(() => navigate("/chat"), 1200);
        }
      } else {
        showPopup(false, result.message || "Google Sign-In failed.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      showPopup(false, "Network error during Google Sign-In.");
    }
  };

  const handleSaveGooglePhone = async () => {
    const digitsOnly = googlePhoneInput.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 5) {
      setPhoneError("Please enter a valid mobile number.");
      return;
    }
    const fullPhone = `${selectedPhoneCountry.code}${digitsOnly}`;
    setPhoneSaving(true);
    setPhoneError("");
    try {
      const uId = pendingGoogleUser?.user?._id || localStorage.getItem('userId');
      const res = await fetch(`${API_BASE_URL}/api/save-google-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uId,
          phone: fullPhone
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user && data.user.phone) {
          localStorage.setItem('phone', data.user.phone);
        }
        setPhoneModalOpen(false);
        showPopup(true, "Mobile number saved successfully!");
        requestAllAppPermissions();
        setTimeout(() => navigate("/chat"), 1200);
      } else {
        setPhoneError(data.message || "Failed to save mobile number.");
      }
    } catch (err) {
      setPhoneError("Server error. Please try again.");
    } finally {
      setPhoneSaving(false);
    }
  };

  useEffect(() => {
    const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNative) return;

    const initializeGoogleGsi = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        if (googleClientId) {
          try {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleResponse,
              auto_select: false,
              ux_mode: 'popup',
              context: 'signup',
            });
            if (googleBtnRef.current) {
              googleBtnRef.current.innerHTML = '';
              window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'continue_with',
                shape: 'rectangular',
              });
            }
          } catch (e) {
            console.warn("GSI init error:", e);
          }
        }
      }
    };

    if (window.google && window.google.accounts) {
      initializeGoogleGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleGsi();
      };
      document.body.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const GOOGLE_WEB_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '821005945428-7qbipus2rfd5r10d0uoblo6pi23sd9l5.apps.googleusercontent.com';

  const handleGoogleSignInClick = async () => {
    const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isNative) {
      try {
        await GoogleAuth.initialize({
          clientId: GOOGLE_WEB_CLIENT_ID,
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });

        const googleUser = await GoogleAuth.signIn();
        console.log('[GoogleAuth SignUp] signIn result:', JSON.stringify(googleUser));

        const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;

        if (idToken) {
          handleGoogleResponse({ credential: idToken });
          return;
        } else {
          console.error('[GoogleAuth SignUp] No idToken in response:', JSON.stringify(googleUser));
          showPopup(false, 'Google Sign-In failed: no token received.');
          return;
        }
      } catch (err) {
        console.error('[GoogleAuth SignUp] error — code:', err?.code, '| error:', err?.error, '| message:', err?.message, '| full:', JSON.stringify(err));
        const errCode = String(err?.code ?? err?.error ?? '');
        const errMsg = err?.message || String(err) || '';

        const isCancelled =
          errCode === '12501' ||
          errMsg.includes('12501') ||
          errMsg.toLowerCase().includes('cancel') ||
          errCode === 'popup_closed_by_user';

        if (isCancelled) return;

        if (errCode === '10' || errCode === '12500' || errMsg.includes('10') || errMsg.includes('12500')) {
          showPopup(false, `Google Sign-In config error (Code ${errCode || '10'}). Check SHA-1 in Firebase Console.`);
          return;
        }

        if (errCode === '7') {
          showPopup(false, 'Google Sign-In failed: Network error. Check internet connection.');
          return;
        }

        const displayMsg = (errMsg && errMsg !== 'Something went wrong') ? errMsg : `Config/SHA-1 error (Code ${errCode || 'Unknown'})`;
        showPopup(false, `Google Sign-In failed: ${displayMsg}`);
        return;
      }
    }

    if (!googleClientId) {
      setGoogleModalOpen(true);
    } else if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        const btn = googleBtnRef.current ? googleBtnRef.current.querySelector('div[role="button"], iframe, button') : null;
        if (btn) {
          btn.click();
        } else {
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              setGoogleModalOpen(true);
            }
          });
        }
      } catch (e) {
        setGoogleModalOpen(true);
      }
    } else {
      setGoogleModalOpen(true);
    }
  };

  const handleManualGoogleSubmit = async () => {
    if (!googleTokenInput.trim()) return;
    setGoogleModalOpen(false);
    let val = googleTokenInput.trim();
    if (val.includes('.apps.googleusercontent.com') || /^\d+$/.test(val)) {
      if (/^\d+$/.test(val)) val = `${val}.apps.googleusercontent.com`;
      localStorage.setItem('google_client_id', val);
      setGoogleClientId(val);
      showPopup(true, "Google Client ID saved! Click Sign in with Google again.");
    } else {
      await handleGoogleResponse({ credential: val });
    }
    setGoogleTokenInput('');
  };

  const termsContent = `📘 Juicy Terms of Service

1. Welcome to Juicy
Welcome to Juicy, a platform that helps you connect with people through messages, audio calls, and video calls. By using Juicy, you agree to these Terms.

2. Using Juicy
You can use Juicy to:
• Send and receive messages
• Make audio and video calls
• Share media like images and files

You must use Juicy responsibly and follow all applicable laws.

3. Your Account
• You are responsible for your account and activity
• Keep your password secure
• Do not share your account with others
• Provide accurate information

We may disable accounts that violate our rules.

4. What You Can Share
You can share content like:
• Messages
• Photos
• Videos

But you must not share:
• Harmful or abusive content
• Fake or misleading information
• Illegal or copyrighted content without permission
• Nudity or inappropriate material

5. Safety and Respect
We want Juicy to be safe for everyone.
You agree not to:
• Harass or bully others
• Threaten or harm users
• Spam or misuse the platform

6. Permissions You Give Us
To operate Juicy, you give us permission to:
• Store and process your messages and data
• Use your content to improve our services
• Ensure safety and security

We do not sell your personal messages.

7. Service Availability
We are always improving Juicy, so:
• Features may change or be removed
• Service may be temporarily unavailable

We are not responsible for downtime or data loss.

8. Ending Your Use
• You can stop using Juicy anytime.
• We may suspend or delete accounts if:
  - You violate these Terms
  - Your activity harms other users

9. Limitation of Liability
Juicy is not responsible for:
• User-generated content
• Communication issues
• Loss of data
• Any damages from using the app

10. Updates to Terms
• We may update these Terms.
• If you continue using Juicy, you agree to the updated Terms.

11. Contact Us
For support or questions:
📧 support@juicyapp.com`;

  const handleTermsScroll = (e) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      setTermsScrolled(true);
    }
  };

  const handleTermsCheckbox = (e) => {
    setTermsAgreed(e.target.checked);
  };

  const handleAgreeTerms = () => {
    setTermsAgreed(true);
    setTermsDialogOpen(false);
  };

  // Country Code State
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+91',
    name: 'India',
    flag: '🇮🇳',
    dialLength: 10,
  });

  // Logo animation state
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Country codes list (49 countries)
  const countries = [
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', dialLength: 9 },
    { code: '+91', name: 'India', flag: '🇮🇳', dialLength: 10 },
    { code: '+1', name: 'USA', flag: '🇺🇸', dialLength: 10 },
    { code: '+1', name: 'Canada', flag: '🇨🇦', dialLength: 10 },
    { code: '+44', name: 'UK', flag: '🇬🇧', dialLength: 10 },
    { code: '+971', name: 'UAE', flag: '🇦🇪', dialLength: 9 },
    { code: '+974', name: 'Qatar', flag: '🇶🇦', dialLength: 8 },
    { code: '+965', name: 'Kuwait', flag: '🇰🇼', dialLength: 8 },
    { code: '+968', name: 'Oman', flag: '🇴🇲', dialLength: 8 },
    { code: '+973', name: 'Bahrain', flag: '🇧🇭', dialLength: 8 },
    { code: '+20', name: 'Egypt', flag: '🇪🇬', dialLength: 10 },
    { code: '+962', name: 'Jordan', flag: '🇯🇴', dialLength: 9 },
    { code: '+61', name: 'Australia', flag: '🇦🇺', dialLength: 9 },
    { code: '+64', name: 'New Zealand', flag: '🇳🇿', dialLength: 9 },
    { code: '+65', name: 'Singapore', flag: '🇸🇬', dialLength: 8 },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾', dialLength: 9 },
    { code: '+66', name: 'Thailand', flag: '🇹🇭', dialLength: 9 },
    { code: '+86', name: 'China', flag: '🇨🇳', dialLength: 11 },
    { code: '+81', name: 'Japan', flag: '🇯🇵', dialLength: 10 },
    { code: '+82', name: 'South Korea', flag: '🇰🇷', dialLength: 10 },
    { code: '+33', name: 'France', flag: '🇫🇷', dialLength: 9 },
    { code: '+49', name: 'Germany', flag: '🇩🇪', dialLength: 10 },
    { code: '+39', name: 'Italy', flag: '🇮🇹', dialLength: 10 },
    { code: '+34', name: 'Spain', flag: '🇪🇸', dialLength: 9 },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰', dialLength: 10 },
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩', dialLength: 10 },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', dialLength: 9 },
    { code: '+977', name: 'Nepal', flag: '🇳🇵', dialLength: 10 },
    { code: '+63', name: 'Philippines', flag: '🇵🇭', dialLength: 10 },
    { code: '+62', name: 'Indonesia', flag: '🇮🇩', dialLength: 10 },
    { code: '+55', name: 'Brazil', flag: '🇧🇷', dialLength: 11 },
    { code: '+52', name: 'Mexico', flag: '🇲🇽', dialLength: 10 },
    { code: '+7', name: 'Russia', flag: '🇷🇺', dialLength: 10 },
    { code: '+90', name: 'Turkey', flag: '🇹🇷', dialLength: 10 },
    { code: '+27', name: 'South Africa', flag: '🇿🇦', dialLength: 9 },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬', dialLength: 10 },
    { code: '+254', name: 'Kenya', flag: '🇰🇪', dialLength: 9 },
    { code: '+212', name: 'Morocco', flag: '🇲🇦', dialLength: 9 },
    { code: '+31', name: 'Netherlands', flag: '🇳🇱', dialLength: 9 },
    { code: '+32', name: 'Belgium', flag: '🇧🇪', dialLength: 9 },
    { code: '+41', name: 'Switzerland', flag: '🇨🇭', dialLength: 9 },
    { code: '+46', name: 'Sweden', flag: '🇸🇪', dialLength: 9 },
    { code: '+47', name: 'Norway', flag: '🇳🇴', dialLength: 8 },
    { code: '+45', name: 'Denmark', flag: '🇩🇰', dialLength: 8 },
    { code: '+358', name: 'Finland', flag: '🇫🇮', dialLength: 9 },
    { code: '+353', name: 'Ireland', flag: '🇮🇪', dialLength: 9 },
    { code: '+351', name: 'Portugal', flag: '🇵🇹', dialLength: 9 },
    { code: '+30', name: 'Greece', flag: '🇬🇷', dialLength: 10 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoLoad = () => {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, '').slice(0, selectedCountry.dialLength);
      setForm({ ...form, [name]: digitsOnly });
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    } else if (name === "name") {
      setForm({ ...form, name: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Convert image to base64
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const requiredFields = [
      { key: 'name', label: 'Full Name' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'password', label: 'Password' },
      { key: 'confirmPassword', label: 'Confirm Password' },
      { key: 'gender', label: 'Gender' }
    ];

    const errors = {};
    requiredFields.forEach(field => {
      if (!form[field.key]) {
        errors[field.key] = `Please fill ${field.label}`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      showPopup(false, 'Passwords do not match');
      return;
    }

    const allRulesPassed = passwordRules.every(rule => rule.test(form.password));
    if (!allRulesPassed) {
      setFieldErrors({ password: "Password does not meet all requirements" });
      showPopup(false, "Password does not meet all requirements");
      return;
    }

    try {
      if (usernameStatus.checked && usernameStatus.exists) {
        setFieldErrors({ username: 'Username already exists' });
        showPopup(false, 'Username already exists');
        return;
      }

      const formData = new FormData();

      Object.keys(form).forEach(key => {
        if (key === 'phone') {
          formData.append(key, `${selectedCountry.code} ${form[key]}`);
        } else {
          formData.append(key, form[key]);
        }
      });
      formData.append('countryCode', selectedCountry.code);
      formData.append('profileImage', profileImage);

      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log('📋 Signup Response:', {
        status: response.status,
        data: data,
        field: data.field,
        message: data.message
      });

      if (response.ok) {
        showPopup(true, data.message || 'Registered successfully!');
        navigate('/signin', { replace: true });
      } else {
        if (response.status === 409) {
          const field = data.field || '';
          const message = data.message || 'Registration failed';

          if (field) {
            console.log(`⚠️ Conflict on field: ${field}`);
            setFieldErrors({ [field]: message });
            showPopup(false, message);
          } else {
            console.log('⚠️ Conflict but no field specified:', message);
            showPopup(false, message);
          }
        } else {
          console.log('❌ Registration error:', data.message);
          showPopup(false, data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  const showPopup = (success, message) => {
    setPopup({ open: true, success, message });
    setTimeout(() => setPopup((p) => ({ ...p, open: false })), 2000);
  };

  const isStep1Valid = useMemo(() => {
    return (
      form.name.trim() !== '' &&
      form.username.trim() !== '' &&
      !usernameStatus.loading &&
      !(usernameStatus.checked && usernameStatus.exists) &&
      form.gender !== ''
    );
  }, [form.name, form.username, usernameStatus, form.gender]);

  const isStep2Valid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      form.email.trim() !== '' &&
      emailRegex.test(form.email) &&
      form.phone.trim() !== '' &&
      form.phone.length === selectedCountry.dialLength
    );
  }, [form.email, form.phone, selectedCountry.dialLength]);

  const isStep3Valid = useMemo(() => {
    return (
      form.password !== '' &&
      form.confirmPassword !== '' &&
      form.password === form.confirmPassword &&
      passwordRules.every(rule => rule.test(form.password)) &&
      termsAgreed
    );
  }, [form.password, form.confirmPassword, termsAgreed]);

  const isFormValid = useMemo(() => {
    return isStep1Valid && isStep2Valid && isStep3Valid;
  }, [isStep1Valid, isStep2Valid, isStep3Valid]);

  return (
    <>
      {/* =====================================================
          MAIN 3D PAGE VIEWPORT & ATMOSPHERE (MATCHES SIGNIN)
          ===================================================== */}
      <Box
        sx={{
          minHeight: "100dvh",
          width: "100%",
          backgroundColor: activeTheme.colors.background,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflowX: "hidden",
          overflowY: "auto",
          py: { xs: 3, sm: 5 },
          px: { xs: 2, sm: 3 },
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
          transition: "background-color 0.3s ease",
        }}
      >
        {/* ---------------------------------------------------
            3D FLOATING ORBS & AMBIENT GLOW (JUICEE SPLASH STYLE)
            --------------------------------------------------- */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          {/* Top-Left Ambient Orb */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: '6%', sm: '10%' },
              left: { xs: '-4%', sm: '12%' },
              width: { xs: 90, sm: 140 },
              height: { xs: 90, sm: 140 },
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), ${solidPrimary}99 42%, ${solidPrimary}15 100%)`,
              boxShadow: `0 0 35px ${solidPrimary}40, 0 15px 35px rgba(0,0,0,0.06)`,
              animation: isLoaded ? `${orbDriftOne} 6s ease-in-out infinite` : 'none',
            }}
          />

          {/* Top-Right Glowing Orb */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: '15%', sm: '18%' },
              right: { xs: '-5%', sm: '10%' },
              width: { xs: 70, sm: 110 },
              height: { xs: 70, sm: 110 },
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), ${solidPrimary}88 45%, ${solidPrimary}12 100%)`,
              boxShadow: `0 0 30px ${solidPrimary}35`,
              animation: isLoaded ? `${orbDriftTwo} 6.8s ease-in-out infinite 0.5s` : 'none',
            }}
          />

          {/* Bottom-Left Ambient Orb */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: '8%', sm: '12%' },
              left: { xs: '4%', sm: '16%' },
              width: { xs: 50, sm: 80 },
              height: { xs: 50, sm: 80 },
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.9), ${solidPrimary}77 45%, ${solidPrimary}10 100%)`,
              boxShadow: `0 0 25px ${solidPrimary}30`,
              animation: isLoaded ? `${orbDriftThree} 7.2s ease-in-out infinite 1s` : 'none',
            }}
          />

          {/* Bottom-Right Small Particle Orb */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: '18%', sm: '22%' },
              right: { xs: '8%', sm: '18%' },
              width: { xs: 20, sm: 30 },
              height: { xs: 20, sm: 30 },
              borderRadius: '50%',
              backgroundColor: solidPrimary,
              boxShadow: `0 0 18px ${solidPrimary}60`,
              animation: isLoaded ? `${particleFloat} 5s ease-in-out infinite 0.8s` : 'none',
            }}
          />

          {/* Center Subtle Atmosphere Radial Glow */}
          <Box
            sx={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '380px', sm: '550px' },
              height: { xs: '380px', sm: '550px' },
              borderRadius: '50%',
              background: `radial-gradient(circle, ${solidPrimary}15 0%, transparent 68%)`,
              pointerEvents: 'none',
            }}
          />
        </Box>

        {/* =====================================================
            SIGNUP CONTENT WRAPPER
            ===================================================== */}
        <Container
          component="main"
          maxWidth="xs"
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 0,
          }}
        >
          {/* ---------------------------------------------------
              3D JUICEE LOGO SECTION WITH LIGHT SWEEP & COIN FLOAT
              --------------------------------------------------- */}
          <Box
            sx={{
              position: 'relative',
              width: { xs: 240, sm: 280, md: 300 },
              height: { xs: 95, sm: 105, md: 115 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              perspective: '1200px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Ground Shadow Disc underneath Logo */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                width: { xs: 150, sm: 190 },
                height: 14,
                borderRadius: '50%',
                backgroundColor: solidPrimary,
                filter: 'blur(10px)',
                animation: isLoaded ? `${shadowPulse} 4.2s ease-in-out infinite` : 'none',
              }}
            />

            {/* 3D Animated Logo Stage */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformStyle: 'preserve-3d',
                animation: isLoaded
                  ? `${logoTumbleIn} 1.1s cubic-bezier(0.18, 0.75, 0.2, 1) forwards, ${logoFloat} 4.2s ease-in-out 1.1s infinite`
                  : 'none',
                opacity: isLoaded ? 1 : 0,
                filter: `drop-shadow(0 14px 18px rgba(0,0,0,0.12)) drop-shadow(0 0 16px ${solidPrimary}25)`,
              }}
            >
              <Box
                component="img"
                src={juiceeLogo}
                alt="Juicy Logo"
                onLoad={handleLogoLoad}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  zIndex: 2,
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                  imageRendering: '-webkit-optimize-contrast',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              />

              {/* Glossy Light Sweep across Logo */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '-10%',
                  left: '-20%',
                  width: '24%',
                  height: '120%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                  filter: 'blur(4px)',
                  transform: 'translateX(-160%) skewX(-18deg)',
                  pointerEvents: 'none',
                  zIndex: 3,
                  animation: isLoaded ? `${logoLightSweep} 3s ease-in-out 1.2s infinite` : 'none',
                }}
              />
            </Box>
          </Box>

          {/* ---------------------------------------------------
              CREATE ACCOUNT TITLE & SUBTITLE
              --------------------------------------------------- */}
          <Typography
            component="h1"
            variant="h4"
            sx={{
              mt: 0.5,
              fontFamily: '"Pacifico", cursive',
              fontWeight: 'bold',
              letterSpacing: 1.5,
              color: solidPrimary,
              textShadow: `0 2px 12px ${solidPrimary}30`,
              fontSize: { xs: '2.1rem', sm: '2.5rem' },
              textAlign: 'center',
              animation: isLoaded ? `${subtleFadeIn} 0.7s ease-out 0.2s forwards` : 'none',
              opacity: isLoaded ? 1 : 0,
            }}
          >
            Create Account
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              mb: 2.5,
              color: TEXT_GRAY,
              fontSize: { xs: '0.88rem', sm: '0.94rem' },
              fontWeight: 500,
              textAlign: 'center',
              letterSpacing: 0.3,
              animation: isLoaded ? `${subtleFadeIn} 0.7s ease-out 0.35s forwards` : 'none',
              opacity: isLoaded ? 1 : 0,
            }}
          >
            Join Juicy to connect with friends
          </Typography>

          {/* ---------------------------------------------------
              PREMIUM 3D SIGNUP CARD
              --------------------------------------------------- */}
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              borderRadius: '24px',
              padding: { xs: 2.75, sm: 3.5 },
              bgcolor: isDark ? '#1e1e1e' : (activeTheme.colors.surface || '#ffffff'),
              color: INPUT_TEXT_COLOR,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: isDark
                ? `0 20px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 8px 20px -6px ${solidPrimary}20`
                : `0 16px 36px -8px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.9) inset, 0 8px 24px -4px ${solidPrimary}12`,
              animation: isLoaded ? `${cardEntrance} 0.55s ease-out 0.1s forwards` : 'none',
              opacity: isLoaded ? 1 : 0,
              transform: 'none',
            }}
          >
            {/* Step indicator header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
              <Typography
                sx={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: solidPrimary,
                  mb: 1.2,
                  letterSpacing: 0.3,
                  textAlign: 'center',
                }}
              >
                Step {currentStep} of 3 — {currentStep === 1 ? 'Name & Profile' : currentStep === 2 ? 'Contact & Verification' : 'Password & Security'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 260, justifyContent: 'center' }}>
                {[1, 2, 3].map((s) => (
                  <Box
                    key={s}
                    sx={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      background: s === currentStep
                        ? (isGradient ? activeTheme.colors.primary : `linear-gradient(90deg, ${solidPrimary}, ${solidPrimary}dd)`)
                        : s < currentStep
                        ? `${solidPrimary}70`
                        : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                      boxShadow: s === currentStep ? `0 0 8px ${solidPrimary}50` : 'none',
                      transition: 'all 0.35s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              {/* Step 1: Name & Profile */}
              {currentStep === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                  {/* Profile Photo button and preview */}
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    {profilePreview && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                        <Box
                          component="img"
                          src={profilePreview}
                          alt="Profile Preview"
                          sx={{
                            width: 84,
                            height: 84,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `3px solid ${solidPrimary}`,
                            boxShadow: `0 6px 20px ${solidPrimary}35`,
                          }}
                        />
                      </Box>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => setProfileOpen(true)}
                      sx={{
                        borderColor: BORDER_GRAY,
                        color: solidPrimary,
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2.5,
                        py: 0.7,
                        fontSize: '0.86rem',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${solidPrimary}08`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: `${solidPrimary}15`,
                          borderColor: solidPrimary,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      {profilePreview ? 'Change Profile Photo' : '+ Add Profile Photo'}
                    </Button>
                  </Box>

                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    error={!!fieldErrors.username || (usernameStatus.checked && usernameStatus.exists)}
                    helperText={
                      fieldErrors.username ||
                      (usernameStatus.checked && usernameStatus.exists ? 'Username is already taken' :
                        usernameStatus.checked && !usernameStatus.exists && form.username ? 'Username is available' : '')
                    }
                    InputProps={{
                      endAdornment:
                        form.username && usernameStatus.checked ? (
                          usernameStatus.exists ? (
                            <InputAdornment position="end">
                              <CancelRoundedIcon sx={{ color: '#ef1c1c' }} />
                            </InputAdornment>
                          ) : (
                            <InputAdornment position="end">
                              <CheckCircleRoundedIcon sx={{ color: solidPrimary }} />
                            </InputAdornment>
                          )
                        ) : null,
                    }}
                    sx={textFieldSx}
                  />

                  {/* Gender Selection - 3D Styled Cards */}
                  <Box sx={{ textAlign: 'left', mt: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: '0.84rem',
                        color: TEXT_GRAY,
                        mb: 0.8,
                        ml: 0.5,
                        fontWeight: 500,
                      }}
                    >
                      Gender
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {[
                        { value: 'Male', icon: '♂', label: 'Male' },
                        { value: 'Female', icon: '♀', label: 'Female' },
                        { value: 'Other', icon: '⚧', label: 'Other' },
                      ].map((option) => {
                        const isSelected = form.gender === option.value;
                        return (
                          <Box
                            key={option.value}
                            onClick={() =>
                              handleChange({
                                target: { name: 'gender', value: option.value },
                              })
                            }
                            sx={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.4,
                              py: 1.2,
                              px: 1,
                              borderRadius: '16px',
                              cursor: 'pointer',
                              backgroundColor: isSelected
                                ? (isDark ? `${solidPrimary}25` : `${solidPrimary}12`)
                                : (isDark ? 'rgba(255,255,255,0.04)' : LIGHT_GRAY),
                              border: `1.5px solid ${isSelected ? solidPrimary : BORDER_GRAY}`,
                              boxShadow: isSelected
                                ? `0 4px 16px ${solidPrimary}28`
                                : 'none',
                              transition: 'all 0.25s ease',
                              '&:hover': {
                                borderColor: solidPrimary,
                                transform: 'translateY(-2px)',
                              },
                              '&:active': {
                                transform: 'scale(0.98)',
                              },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '1.4rem',
                                lineHeight: 1,
                                color: isSelected ? solidPrimary : TEXT_GRAY,
                                transition: 'transform 0.25s ease',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                              }}
                            >
                              {option.icon}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.8rem',
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? solidPrimary : TEXT_GRAY,
                                transition: 'all 0.25s ease',
                              }}
                            >
                              {option.label}
                            </Typography>
                            {/* Radio dot indicator */}
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                border: `2px solid ${isSelected ? solidPrimary : `rgba(${rgbText}, 0.25)`}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 0.2,
                                transition: 'all 0.25s ease',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: isSelected ? solidPrimary : 'transparent',
                                  transition: 'all 0.25s ease',
                                  transform: isSelected ? 'scale(1)' : 'scale(0)',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                    {fieldErrors.gender && (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: '#d32f2f',
                          mt: 0.5,
                          ml: 0.5,
                        }}
                      >
                        {fieldErrors.gender}
                      </Typography>
                    )}
                  </Box>

                  {/* Date of Birth */}
                  <TextField
                    fullWidth
                    type="date"
                    label="Date of Birth"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CakeIcon sx={{ color: solidPrimary, fontSize: '1.15rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />

                  {/* Bio / About Me */}
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="About Me / Bio"
                    name="about"
                    placeholder="Tell friends a little about yourself or your vibe..."
                    value={form.about}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <InfoIcon sx={{ color: solidPrimary, fontSize: '1.15rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      ...textFieldSx,
                      '& .MuiInputBase-root': {
                        ...textFieldSx['& .MuiInputBase-root'],
                        height: 'auto',
                        minHeight: 74,
                        py: 1,
                      },
                    }}
                  />

                  {/* Step 1 Actions */}
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setCurrentStep(2)}
                    disabled={!isStep1Valid}
                    sx={{ ...primaryButtonSx, mt: 1.5 }}
                  >
                    Next
                  </Button>
                </Box>
              )}

              {/* Step 2: Email & Phone */}
              {currentStep === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    error={!!fieldErrors.email}
                    helperText={fieldErrors.email}
                    sx={textFieldSx}
                  />

                  {/* Phone Number Input with Built-in Country Code */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    {/* Country Code selector button */}
                    <Box
                      onClick={() => setCountrySelectOpen(true)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        borderRadius: '16px',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : LIGHT_GRAY,
                        border: `1.5px solid ${BORDER_GRAY}`,
                        cursor: 'pointer',
                        minWidth: 85,
                        height: 54,
                        userSelect: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: solidPrimary, boxShadow: `0 0 0 3px ${solidPrimary}15` },
                      }}
                    >
                      <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{selectedCountry.flag}</Typography>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: INPUT_TEXT_COLOR, whiteSpace: 'nowrap' }}>
                        {selectedCountry.code}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: TEXT_GRAY }}>▼</Typography>
                    </Box>

                    {/* Mobile Number input */}
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      inputProps={{ maxLength: selectedCountry.dialLength, inputMode: 'numeric', pattern: '[0-9]*' }}
                      placeholder={`${selectedCountry.dialLength} digits`}
                      error={!!fieldErrors.phone}
                      helperText={fieldErrors.phone || `${selectedCountry.dialLength} digits`}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalPhoneIcon sx={{ color: solidPrimary, fontSize: '1.1rem' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                  </Box>

                  {/* City & Country (2 columns) */}
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      placeholder="e.g. Chennai"
                      value={form.city}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnIcon sx={{ color: solidPrimary, fontSize: '1.15rem' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      label="Country"
                      name="country"
                      placeholder="e.g. India"
                      value={form.country}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PublicIcon sx={{ color: solidPrimary, fontSize: '1.15rem' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                  </Box>

                  {/* Profile Discovery Visibility Switch */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: '16px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : LIGHT_GRAY,
                      border: `1.5px solid ${BORDER_GRAY}`,
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        borderColor: solidPrimary,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <SecurityIcon sx={{ color: form.profileVisible ? '#10b981' : '#f59e0b', fontSize: '1.35rem' }} />
                      <Box>
                        <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: INPUT_TEXT_COLOR, lineHeight: 1.2 }}>
                          Profile Visibility
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: TEXT_GRAY, mt: 0.3 }}>
                          {form.profileVisible ? 'Visible to nearby discovery & friends' : 'Hidden from discovery search'}
                        </Typography>
                      </Box>
                    </Box>
                    <Switch
                      checked={form.profileVisible}
                      onChange={(e) => setForm(prev => ({ ...prev, profileVisible: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: solidPrimary,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: solidPrimary,
                        },
                      }}
                    />
                  </Box>

                  {/* Step 2 Actions */}
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentStep(1)}
                      sx={{ ...outlinedButtonSx, flex: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentStep(3)}
                      disabled={!isStep2Valid}
                      sx={{ ...primaryButtonSx, flex: 1 }}
                    >
                      Next
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 3: Security Passwords & Terms */}
              {currentStep === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowPassword}
                            edge="end"
                            sx={{
                              color: TEXT_GRAY,
                              transition: 'color 0.2s',
                              '&:hover': { color: solidPrimary },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                            sx={{
                              color: TEXT_GRAY,
                              transition: 'color 0.2s',
                              '&:hover': { color: solidPrimary },
                            }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />

                  {/* Password Rules */}
                  <Box sx={{ mt: 0.5, mb: 0.5, px: 0.5 }}>
                    {passwordRules.map((rule, idx) => {
                      const passed = rule.test(form.password);
                      return (
                        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          {passed ? (
                            <CheckCircleRoundedIcon sx={{ color: solidPrimary, fontSize: 18 }} />
                          ) : (
                            <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 18 }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: passed ? solidPrimary : "#ef1c1c",
                              fontWeight: passed ? "bold" : "normal",
                              fontSize: { xs: '0.75rem', sm: '0.82rem' },
                            }}
                          >
                            {rule.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Terms & Conditions Checkbox */}
                  <Box sx={{ mt: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={termsAgreed}
                          onChange={handleTermsCheckbox}
                          sx={{
                            color: TEXT_GRAY,
                            '&.Mui-checked': {
                              color: solidPrimary,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '0.88rem', color: TEXT_GRAY }}>
                          I agree to the{' '}
                          <Link
                            component="button"
                            type="button"
                            variant="body2"
                            sx={{
                              color: solidPrimary,
                              textDecoration: 'none',
                              fontWeight: 600,
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                              }
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              setTermsDialogOpen(true);
                            }}
                          >
                            Terms & Conditions
                          </Link>
                        </Typography>
                      }
                    />
                  </Box>

                  {/* Step 3 Actions */}
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentStep(2)}
                      sx={{ ...outlinedButtonSx, flex: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!isFormValid}
                      sx={{ ...primaryButtonSx, flex: 1 }}
                    >
                      Register
                    </Button>
                  </Box>
                </Box>
              )}
            </form>

            {/* --- OR DIVIDER --- */}
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2, width: '100%' }}>
              <Divider sx={{ flexGrow: 1, borderColor: BORDER_GRAY }} />
              <Typography variant="body2" sx={{ px: 1.5, color: TEXT_GRAY, fontSize: '0.78rem', fontWeight: 600, letterSpacing: 0.5 }}>
                OR
              </Typography>
              <Divider sx={{ flexGrow: 1, borderColor: BORDER_GRAY }} />
            </Box>

            {/* --- GOOGLE SIGN-IN BUTTON --- */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 48,
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleSignInClick}
                startIcon={
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                }
                sx={{
                  height: 48,
                  borderRadius: '24px',
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.93rem",
                  color: INPUT_TEXT_COLOR,
                  borderColor: BORDER_GRAY,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  boxShadow: isDark ? 'none' : "0 2px 6px rgba(0,0,0,0.04)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : "#fafafa",
                    borderColor: solidPrimary,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 6px 16px ${solidPrimary}20`,
                  },
                }}
              >
                Sign in with Google
              </Button>

              {/* Web GSI iframe overlay — web browser only, hidden on Android. */}
              <Box
                ref={googleBtnRef}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0.01,
                  zIndex: 2,
                  overflow: 'hidden',
                  display: (googleClientId && !(window.Capacitor?.isNativePlatform?.())) ? 'block' : 'none',
                  pointerEvents: (window.Capacitor?.isNativePlatform?.()) ? 'none' : 'auto',
                  '& iframe': {
                    width: '100% !important',
                    height: '100% !important',
                    transform: 'scale(1.2)',
                    transformOrigin: 'top left',
                    cursor: 'pointer',
                  }
                }}
              />
            </Box>

            {/* --- SIGN IN LINK --- */}
            <Grid container justifyContent="center" sx={{ mt: 3 }}>
              <Grid item>
                <Typography variant="body2" sx={{ color: TEXT_GRAY, fontSize: '0.9rem' }}>
                  Already have an account?{" "}
                  <Link
                    component={RouterLink}
                    to="/signin"
                    variant="body2"
                    sx={{
                      color: solidPrimary,
                      fontWeight: 700,
                      textDecoration: 'none',
                      ml: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        textDecoration: 'underline',
                        opacity: 0.85,
                      }
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* =====================================================
          COUNTRY CODE SELECTION MODAL
          ===================================================== */}
      <Dialog
        open={countrySelectOpen}
        onClose={() => setCountrySelectOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ color: solidPrimary, fontFamily: "Pacifico, cursive", fontWeight: 700, textAlign: 'center', fontSize: '1.4rem' }}>
          Select Country
        </DialogTitle>
        <DialogContent sx={{ p: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {countries.map((country, idx) => (
              <Box
                key={idx}
                onClick={() => {
                  setSelectedCountry(country);
                  setCountrySelectOpen(false);
                  setForm(prev => ({ ...prev, phone: '', country: country.name }));
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  backgroundColor: selectedCountry.name === country.name ? `${solidPrimary}18` : 'transparent',
                  border: selectedCountry.name === country.name ? `1.5px solid ${solidPrimary}` : `1.5px solid transparent`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: `${solidPrimary}10`,
                    borderColor: solidPrimary,
                  },
                }}
              >
                <Typography sx={{ fontSize: '1.4rem' }}>{country.flag}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', color: INPUT_TEXT_COLOR, fontSize: '0.92rem' }}>
                    {country.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: TEXT_GRAY }}>
                    {country.code} • {country.dialLength} digits
                  </Typography>
                </Box>
                {selectedCountry.name === country.name && (
                  <CheckCircleRoundedIcon sx={{ color: solidPrimary }} />
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          PROFILE PHOTO MODAL
          ===================================================== */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
            p: 1.5,
          }
        }}
      >
        <DialogTitle sx={{ color: solidPrimary, fontFamily: "Pacifico, cursive", fontWeight: 700, textAlign: 'center', fontSize: '1.4rem' }}>
          Add Profile Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, py: 1 }}>
            <Box
              component="img"
              src={profilePreview || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
              alt="Profile"
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${solidPrimary}40`,
                boxShadow: `0 8px 24px ${solidPrimary}30`,
              }}
            />
            <Button
              component="label"
              variant="outlined"
              sx={{
                ...outlinedButtonSx,
                height: 46,
                px: 3,
                fontSize: '0.9rem',
              }}
            >
              Upload Profile Photo
              <input type="file" accept="image/*" hidden onChange={handleProfileImageChange} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={() => setProfileOpen(false)}
            sx={{
              ...primaryButtonSx,
              height: 44,
              px: 4,
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          SUCCESS/ERROR POPUP DIALOG (MATCHES SIGN IN)
          ===================================================== */}
      <Dialog
        open={popup.open}
        TransitionComponent={Transition}
        keepMounted
        PaperProps={{
          sx: {
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%) !important",
            bgcolor: WHITE,
            borderRadius: '20px',
            minWidth: 300,
            maxWidth: '90vw',
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 16px 36px rgba(0,0,0,0.12), 0 0 20px ${solidPrimary}20`,
            display: "flex",
            alignItems: "center",
            px: 2.5,
            py: 1.75,
            zIndex: 1500,
          },
        }}
        hideBackdrop
      >
        <DialogContent sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 0 }}>
          {popup.success ? (
            <CheckCircleRoundedIcon sx={{ color: solidPrimary, fontSize: 34 }} />
          ) : (
            <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 34 }} />
          )}
          <Typography
            variant="subtitle1"
            sx={{
              color: popup.success ? solidPrimary : "#ef1c1c",
              fontWeight: "bold",
              fontFamily: "Pacifico, cursive",
              letterSpacing: 0.8,
              fontSize: '1.05rem',
            }}
          >
            {popup.message}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          TERMS & CONDITIONS DIALOG
          ===================================================== */}
      <Dialog
        open={termsDialogOpen}
        onClose={() => {
          if (!termsAgreed) {
            setTermsDialogOpen(false);
            setTermsScrolled(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 'bold',
            fontSize: '1.3rem',
            fontFamily: "Pacifico, cursive",
            background: isGradient ? activeTheme.colors.primary : solidPrimary,
            color: '#fff',
            borderRadius: '24px 24px 0 0',
            textAlign: 'center',
            py: 2,
          }}
        >
          Terms & Conditions
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: LIGHT_GRAY,
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: solidPrimary,
              borderRadius: '10px',
            },
          }}
          onScroll={handleTermsScroll}
        >
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'inherit',
              fontSize: '0.88rem',
              lineHeight: 1.8,
              color: TEXT_GRAY,
              fontWeight: 400,
            }}
          >
            {termsContent}
          </Typography>
        </DialogContent>

        {/* Scroll indicator */}
        {!termsScrolled && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: `${solidPrimary}10`,
              textAlign: 'center',
              borderTop: `1px solid ${BORDER_GRAY}`,
            }}
          >
            <Typography sx={{ fontSize: '0.85rem', color: solidPrimary, fontWeight: 600 }}>
              ⬇️ Scroll to the bottom to agree
            </Typography>
          </Box>
        )}

        <DialogActions
          sx={{
            p: 2.5,
            borderTop: `1px solid ${BORDER_GRAY}`,
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            sx={{
              ...outlinedButtonSx,
              height: 44,
              px: 3,
            }}
            onClick={() => {
              setTermsDialogOpen(false);
              setTermsScrolled(false);
            }}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            disabled={!termsScrolled}
            sx={{
              ...primaryButtonSx,
              height: 44,
              px: 3,
            }}
            onClick={handleAgreeTerms}
          >
            I Agree
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          GOOGLE SIGN-IN CONFIGURATION DIALOG
          ===================================================== */}
      <Dialog
        open={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
          }
        }}
      >
        <DialogTitle sx={{ color: solidPrimary, fontFamily: "Pacifico, cursive", fontWeight: 700, textAlign: 'center', fontSize: '1.3rem' }}>
          Google Sign-In Configuration
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TEXT_GRAY, mb: 2, textAlign: 'center' }}>
            {googleClientId
              ? "Paste a Google ID Token or enter a new Google Client ID below:"
              : "Enter your Google OAuth Client ID (.apps.googleusercontent.com) or Google ID Token to enable Google Sign-In:"}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={googleClientId ? "Google ID Token / Client ID" : "Google Client ID or ID Token"}
            placeholder={googleClientId ? "Paste Google ID Token..." : "your-client-id.apps.googleusercontent.com"}
            value={googleTokenInput}
            onChange={(e) => setGoogleTokenInput(e.target.value)}
            sx={textFieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1.5 }}>
          <Button
            onClick={() => setGoogleModalOpen(false)}
            sx={{ ...outlinedButtonSx, height: 42, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleManualGoogleSubmit}
            sx={{ ...primaryButtonSx, height: 42, px: 3 }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          GOOGLE SIGN-IN PHONE NUMBER PROMPT DIALOG
          ===================================================== */}
      <Dialog
        open={phoneModalOpen}
        TransitionComponent={Transition}
        keepMounted
        disableEscapeKeyDown={isNewGoogleUser}
        onClose={isNewGoogleUser ? undefined : () => {
          setPhoneModalOpen(false);
          showPopup(true, "Signed in successfully!");
          requestAllAppPermissions();
          setTimeout(() => navigate("/chat"), 1000);
        }}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: 340,
            px: 3,
            py: 2.5,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", textAlign: "center", color: solidPrimary, fontSize: '1.4rem' }}>
          Enter Mobile Number
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: TEXT_GRAY }}>
            Please enter your mobile number to complete your
            {isNewGoogleUser ? ' registration' : ' profile'}:
          </Typography>
          {/* Country code + phone number row */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            {/* Country code selector button */}
            <Box
              onClick={() => setPhoneCountryPickerOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                borderRadius: '16px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : LIGHT_GRAY,
                border: `1.5px solid ${BORDER_GRAY}`,
                cursor: 'pointer',
                minWidth: 80,
                height: 54,
                userSelect: 'none',
                transition: 'all 0.2s',
                '&:hover': { borderColor: solidPrimary, boxShadow: `0 0 0 3px ${solidPrimary}15` },
              }}
            >
              <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{selectedPhoneCountry.flag}</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: INPUT_TEXT_COLOR, whiteSpace: 'nowrap' }}>
                {selectedPhoneCountry.code}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: TEXT_GRAY }}>▼</Typography>
            </Box>
            {/* Phone number digits input */}
            <TextField
              label="Phone Number"
              placeholder={`${selectedPhoneCountry.dialLength} digits`}
              type="tel"
              value={googlePhoneInput}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, selectedPhoneCountry.dialLength);
                setGooglePhoneInput(digits);
                setPhoneError("");
              }}
              fullWidth
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalPhoneIcon sx={{ color: solidPrimary, fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />
          </Box>
          {/* Preview of full phone number */}
          {googlePhoneInput && (
            <Typography variant="caption" sx={{ color: solidPrimary, fontWeight: 600, ml: 0.5 }}>
              Will be saved as: {selectedPhoneCountry.code}{googlePhoneInput.replace(/\D/g, '')}
            </Typography>
          )}
          {phoneError && (
            <Typography variant="caption" sx={{ color: "#ef1c1c", fontWeight: "bold" }}>
              {phoneError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1.5 }}>
          {!isNewGoogleUser && (
            <Button
              variant="text"
              sx={{ color: TEXT_GRAY, textTransform: 'none', fontSize: '0.88rem' }}
              onClick={() => {
                setPhoneModalOpen(false);
                showPopup(true, "Signed in successfully!");
                requestAllAppPermissions();
                setTimeout(() => navigate("/chat"), 1000);
              }}
              disabled={phoneSaving}
            >
              Skip
            </Button>
          )}
          <Button
            variant="contained"
            sx={{ ...primaryButtonSx, height: 44, px: 3 }}
            onClick={handleSaveGooglePhone}
            disabled={phoneSaving}
          >
            {phoneSaving ? "Saving..." : "Save & Continue"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          COUNTRY PICKER DIALOG FOR PHONE MODAL
          ===================================================== */}
      <Dialog
        open={phoneCountryPickerOpen}
        onClose={() => setPhoneCountryPickerOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: 300,
            maxHeight: '70vh',
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: solidPrimary, fontFamily: "Pacifico, cursive", pb: 1, fontSize: '1.2rem', textAlign: 'center' }}>
          Select Country Code
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          {phoneCountries.map((country, idx) => (
            <Box
              key={`${country.code}-${idx}`}
              onClick={() => {
                setSelectedPhoneCountry(country);
                setGooglePhoneInput('');
                setPhoneCountryPickerOpen(false);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2.5,
                py: 1.2,
                cursor: 'pointer',
                backgroundColor: selectedPhoneCountry.code === country.code && selectedPhoneCountry.name === country.name
                  ? `${solidPrimary}18`
                  : 'transparent',
                '&:hover': { backgroundColor: `${solidPrimary}10` },
                borderBottom: `1px solid ${BORDER_GRAY}`,
                transition: 'background 0.15s',
              }}
            >
              <Typography sx={{ fontSize: '1.4rem' }}>{country.flag}</Typography>
              <Typography sx={{ flex: 1, fontSize: '0.9rem', color: INPUT_TEXT_COLOR, fontWeight: 500 }}>
                {country.name}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: solidPrimary }}>
                {country.code}
              </Typography>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
}