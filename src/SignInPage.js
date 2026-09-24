import {
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
} from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { keyframes } from '@emotion/react';
import "@fontsource/pacifico";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Slide from "@mui/material/Slide";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import useSwipeBack from './hooks/useSwipeBack';
import juiceeLogo from './logo/juicee2.png';
import API_BASE_URL from './config/apiConfig';
import { saveUserProfileLocally } from './db/offlineDb';

// ============================================================
// 3D JUICEE SPLASH ANIMATIONS & ATMOSPHERE
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

function SignInPage() {
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

  // Dynamic Theme Colors overriding WhatsApp Palette locally in this scope
  const WHATSAPP_GREEN = activeTheme.colors.primary;
  const WHATSAPP_DARK_GREEN = solidPrimary;
  const WHATSAPP_TEAL = solidPrimary;
  const WHITE = activeTheme.colors.surface;
  const LIGHT_GRAY = activeTheme.colors.background;
  const INPUT_TEXT_COLOR = activeTheme.colors.text || '#000000';
  const TEXT_GRAY = `rgba(${rgbText}, 0.65)`;
  const BORDER_GRAY = `rgba(${rgbText}, 0.12)`;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // refs for focusing inputs when toggling visibility
  const hiddenPwdRef = useRef(null);   // actual hidden password input
  const visiblePwdRef = useRef(null);  // visible text field when showing password
  const [hiddenFocused, setHiddenFocused] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [popup, setPopup] = useState({
    open: false,
    success: false,
    loading: false,
    bufferLoading: false,
    message: "",
  });

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotCountry, setForgotCountry] = useState({ code: '+91', name: 'India', flag: '🇮🇳', dialLength: 10 });
  const [forgotCountryPickerOpen, setForgotCountryPickerOpen] = useState(false);
  const [forgotStatus, setForgotStatus] = useState(""); // '', 'checking', 'processing', 'done', 'error'
  const [forgotError, setForgotError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState(""); // '', 'processing', 'done', 'error'
  const [resetError, setResetError] = useState("");

  const getFormattedForgotPhone = () => {
    let digits = forgotMobile.replace(/\D/g, '');
    if (!digits) return '';
    if (forgotCountry.code === '+91' && digits.startsWith('91') && digits.length === 12) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0') && digits.length > forgotCountry.dialLength) {
      digits = digits.replace(/^0+/, '');
    }
    return `${forgotCountry.code}${digits}`;
  };

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
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
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

  // Countries list for phone modal & forgot password (all 49 countries from SignUp page)
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

  // ✅ Request all essential app permissions one by one (Notifications, Camera, Microphone, Photos & Videos)
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
      setIsGoogleLoading(false);
      showPopup(false, "Google Sign-In was cancelled.");
      return;
    }

    try {
      setIsGoogleLoading(true);
      showPopup(false, "Signing in with Google...", { loading: true, duration: 15000 });
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
        if (result.user) {
          saveUserProfileLocally(result.user._id, result.user, 'synced').catch(() => {});
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
          setIsGoogleLoading(false);
          setPendingGoogleUser({ token: result.token, user: result.user });
          setIsNewGoogleUser(result.isNewUser === true);
          setPhoneModalOpen(true);
        } else {
          showPopup(true, result.message || "Google Sign-In successful!", { bufferLoading: true, duration: 2500 });
          requestAllAppPermissions();
          setTimeout(() => {
            navigate("/chat", { replace: true });
          }, 1200);
        }
      } else {
        setIsGoogleLoading(false);
        showPopup(false, result.message || "Google Sign-In failed.");
      }
    } catch (err) {
      setIsGoogleLoading(false);
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
              context: 'signin',
            });
            setIsGsiLoaded(true);
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
        setIsGsiLoaded(true);
        initializeGoogleGsi();
      };
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const GOOGLE_WEB_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '821005945428-7qbipus2rfd5r10d0uoblo6pi23sd9l5.apps.googleusercontent.com';

  const handleGoogleSignIn = async () => {
    const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isNative) {
      try {
        setIsGoogleLoading(true);
        showPopup(false, "Connecting to Google...", { loading: true, duration: 15000 });
        await GoogleAuth.initialize({
          clientId: GOOGLE_WEB_CLIENT_ID,
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });

        const googleUser = await GoogleAuth.signIn();
        console.log('[GoogleAuth SignIn] result:', JSON.stringify(googleUser));

        const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;

        if (idToken) {
          handleGoogleResponse({ credential: idToken });
        } else {
          setIsGoogleLoading(false);
          console.error('[GoogleAuth] signIn succeeded but no idToken in response:', JSON.stringify(googleUser));
          showPopup(false, 'Google Sign-In failed: no token received.');
        }
      } catch (err) {
        setIsGoogleLoading(false);
        console.error('[GoogleAuth] signIn error — code:', err?.code, '| error:', err?.error, '| message:', err?.message, '| full:', JSON.stringify(err));
        const errCode = String(err?.code ?? err?.error ?? '');
        const errMsg = err?.message || String(err) || '';

        const isCancelled =
          errCode === '12501' ||
          errMsg.includes('12501') ||
          errMsg.toLowerCase().includes('cancel') ||
          errCode === 'popup_closed_by_user';

        if (isCancelled) {
          setPopup((p) => ({ ...p, open: false }));
          return;
        }

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
      }

      return;
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
      showPopup(true, "Client ID saved! Click Sign in with Google again.");
    } else {
      await handleGoogleResponse({ credential: val });
    }
    setGoogleTokenInput('');
  };

  const [isLoaded, setIsLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoLoad = () => {
    setLogoLoaded(true);
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => {
      const next = !prev;
      setTimeout(() => {
        try {
          if (next) {
            visiblePwdRef.current?.focus();
            const el = visiblePwdRef.current;
            if (el && el.setSelectionRange) {
              const len = el.value?.length || 0;
              el.setSelectionRange(len, len);
            }
          } else {
            hiddenPwdRef.current?.focus();
          }
        } catch (e) { }
      }, 0);
      return next;
    });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const focusHidden = () => {
    try {
      const el = hiddenPwdRef.current;
      if (el) {
        el.focus();
        if (el.setSelectionRange) {
          const len = el.value?.length || 0;
          el.setSelectionRange(len, len);
        }
      }
    } catch (e) { }
  };

  const focusVisible = () => {
    try {
      const el = visiblePwdRef.current;
      if (el) {
        el.focus();
        if (el.setSelectionRange) {
          const len = el.value?.length || 0;
          el.setSelectionRange(len, len);
        }
      }
    } catch (e) { }
  };

  const showPopup = (success, message, options = {}) => {
    let loading = false;
    let bufferLoading = false;
    let duration = 2000;

    if (typeof options === 'object' && options !== null) {
      if (options.loading !== undefined) loading = options.loading;
      if (options.bufferLoading !== undefined) bufferLoading = options.bufferLoading;
      if (options.duration !== undefined) duration = options.duration;
    }

    const isLoginOrGoogleSuccess = success && (
      /login/i.test(message) ||
      /google/i.test(message) ||
      /signed in/i.test(message)
    );

    if (bufferLoading || isLoginOrGoogleSuccess) {
      bufferLoading = true;
    }

    setPopup({
      open: true,
      success,
      loading,
      bufferLoading,
      message,
    });

    if (duration > 0) {
      setTimeout(() => setPopup((p) => ({ ...p, open: false })), duration);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");

    setIsSubmitting(true);
    showPopup(false, "Signing in...", { loading: true, duration: 15000 });

    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (response.ok) {
          localStorage.setItem('userId', result.user._id);
          localStorage.setItem('token', result.token);
          if (result.user.username) {
            localStorage.setItem('username', result.user.username);
          }
          if (result.user.profileImage) {
            localStorage.setItem('profileImage', result.user.profileImage);
          }
          if (result.user) {
            saveUserProfileLocally(result.user._id, result.user, 'synced').catch(() => {});
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

          showPopup(true, result.message || "Login successful!", { bufferLoading: true, duration: 2500 });
          requestAllAppPermissions();
          setTimeout(() => {
            navigate("/chat", { replace: true });
          }, 1200);
        } else {
          setIsSubmitting(false);
          showPopup(false, result.message || "Invalid credentials.");
        }
        return;
      } catch (err) {
        lastError = err;
        console.warn(`Login attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err.message);
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    setIsSubmitting(false);
    console.error("Login error after retries:", lastError);
    showPopup(false, "Network error. Check your connection and try again.");
  };

  const handleForgotOpen = () => {
    setForgotMobile("");
    setForgotCountry({ code: '+91', name: 'India', flag: '🇮🇳', dialLength: 10 });
    setForgotStatus("");
    setForgotError("");
    setForgotOpen(true);
  };

  const handleForgotVerify = async () => {
    const fullPhone = getFormattedForgotPhone();
    const digitsOnly = forgotMobile.replace(/\D/g, '');

    if (!digitsOnly || digitsOnly.length < 5) {
      setForgotStatus("error");
      setForgotError("Please enter your registered mobile number.");
      return;
    }

    setForgotStatus("checking");
    setForgotError("");

    setTimeout(async () => {
      setForgotStatus("processing");
      try {
        const response = await fetch(`${API_BASE_URL}/api/forgot-password/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: fullPhone
          }),
        });
        const result = await response.json();
        if (response.ok) {
          setForgotStatus("done");
          setTimeout(() => {
            setForgotOpen(false);
            setResetOpen(true);
          }, 800);
        } else {
          setForgotStatus("error");
          setForgotError(result.message || "Verification failed. Mobile number not registered.");
        }
      } catch (err) {
        setForgotStatus("error");
        setForgotError("Server error. Try again.");
      }
    }, 800);
  };

  const handleResetPassword = async () => {
    setResetError("");
    if (!newPassword || newPassword.length < 4) {
      setResetStatus("error");
      setResetError("Password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetStatus("error");
      setResetError("Passwords do not match.");
      return;
    }

    setResetStatus("processing");
    const fullPhone = getFormattedForgotPhone();

    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: fullPhone,
            newPassword,
          }),
        });
        const result = await response.json();
        if (response.ok) {
          setResetStatus("done");
          setTimeout(() => {
            setResetOpen(false);
            setNewPassword("");
            setConfirmPassword("");
            setForgotMobile("");
            setResetStatus("");
            showPopup(true, "Password reset successful! Please sign in.");
          }, 1000);
        } else {
          setResetStatus("error");
          setResetError(result.message || "Password reset failed.");
        }
      } catch (err) {
        setResetStatus("error");
        setResetError("Server error. Try again.");
      }
    }, 800);
  };

  // Auto-redirect if already logged in (WhatsApp-style 0ms instant redirect)
  useEffect(() => {
    const checkSession = async () => {
      let userId = localStorage.getItem('userId');
      let token = localStorage.getItem('token');

      if ((!token || !userId) && typeof window !== 'undefined' && window.Capacitor) {
        const { AudioRoute } = window.Capacitor.Plugins || {};
        if (AudioRoute && typeof AudioRoute.getSession === 'function') {
          try {
            const sess = await AudioRoute.getSession();
            if (sess && sess.token && sess.userId) {
              userId = sess.userId;
              token = sess.token;
              localStorage.setItem('userId', sess.userId);
              localStorage.setItem('token', sess.token);
              if (sess.username) localStorage.setItem('username', sess.username);
              if (sess.profileImage) localStorage.setItem('profileImage', sess.profileImage);
            }
          } catch (err) {
            console.warn('Native getSession error:', err);
          }
        }
      }

      if (token && userId) {
        navigate('/chat', { replace: true });

        fetch(`${API_BASE_URL}/api/verify-token`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : { valid: false })
          .then(data => {
            if (data && data.valid === false) {
              localStorage.removeItem('userId');
              localStorage.removeItem('token');
              if (typeof window !== 'undefined' && window.Capacitor) {
                const { AudioRoute } = window.Capacitor.Plugins || {};
                if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
                  AudioRoute.clearSession().catch(() => { });
                }
              }
              navigate('/signin', { replace: true });
            }
          })
          .catch(err => {
            console.warn('Background token check offline:', err);
          });
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <>
      {/* =====================================================
          MAIN 3D PAGE VIEWPORT & ATMOSPHERE
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
            LOGIN CONTENT WRAPPER
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
              WELCOME TITLE & SUBTITLE
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
            Welcome
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
            Sign in to continue to Juicy
          </Typography>

          {/* ---------------------------------------------------
              PREMIUM 3D LOGIN CARD
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
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              {/* Form starts here */}
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                {/* Username / Email field */}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  name="email"
                  label="Username or Email"
                  autoComplete="email"
                  autoFocus
                  sx={{
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
                  }}
                />

                {/* Password field: hearts mask when hidden; eye shows original */}
                <Box sx={{ position: "relative", mt: 1.5 }}>
                  {showPassword ? (
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="password"
                      name="password"
                      label="Password"
                      type="text"
                      value={password}
                      onChange={handlePasswordChange}
                      inputRef={visiblePwdRef}
                      onFocus={() => setHiddenFocused(true)}
                      onBlur={() => setHiddenFocused(false)}
                      sx={{
                        '& .MuiInputBase-root': {
                          height: 54,
                          boxSizing: "border-box",
                          borderRadius: '16px',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : LIGHT_GRAY,
                          color: INPUT_TEXT_COLOR,
                          transition: 'all 0.25s ease',
                        },
                        '& .MuiInputBase-input': {
                          padding: "15px 14px",
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
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleClickShowPassword}
                              edge="end"
                              aria-label="Hide password"
                              sx={{
                                color: TEXT_GRAY,
                                transition: 'color 0.2s',
                                '&:hover': { color: solidPrimary },
                              }}
                            >
                              <VisibilityOff />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  ) : (
                    <>
                      {/* Visible mask TextField (hearts) */}
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password-mask"
                        label="Password"
                        value={"❤".repeat(Math.max(0, password.length))}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end" sx={{ pointerEvents: "auto" }}>
                              <IconButton
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); handleClickShowPassword(); }}
                                edge="end"
                                aria-label="Show password"
                                sx={{
                                  color: TEXT_GRAY,
                                  transition: 'color 0.2s',
                                  '&:hover': { color: solidPrimary },
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          pointerEvents: "none",
                          '& .MuiInputBase-root': {
                            height: 54,
                            boxSizing: "border-box",
                            borderRadius: '16px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : LIGHT_GRAY,
                            color: solidPrimary,
                            boxShadow: hiddenFocused ? `0 0 0 4px ${solidPrimary}25` : "none",
                            transition: 'all 0.25s ease',
                          },
                          '& .MuiInputBase-input': {
                            padding: "15px 14px",
                            color: solidPrimary,
                            letterSpacing: 2,
                            fontSize: '0.9rem',
                          },
                          '& .MuiInputLabel-root': {
                            color: hiddenFocused ? solidPrimary : TEXT_GRAY,
                            fontSize: '0.92rem',
                          },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: hiddenFocused ? solidPrimary : BORDER_GRAY,
                              borderWidth: hiddenFocused ? '1.5px' : '1px',
                              transition: 'all 0.25s ease',
                            },
                          },
                        }}
                      />

                      {/* Invisible native input */}
                      <input
                        ref={hiddenPwdRef}
                        type="password"
                        name="password"
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={() => setHiddenFocused(true)}
                        onBlur={() => setHiddenFocused(false)}
                        tabIndex={0}
                        style={{
                          position: "absolute",
                          top: 15,
                          left: 14,
                          width: "calc(100% - 72px)",
                          height: 24,
                          opacity: 0,
                          zIndex: 3,
                          border: "none",
                          padding: "0",
                          margin: 0,
                          fontSize: "1rem",
                          color: INPUT_TEXT_COLOR,
                          boxSizing: "border-box",
                        }}
                      />
                    </>
                  )}
                </Box>

                {/* Forgot Password Row */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 1 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={handleForgotOpen}
                    sx={{
                      color: solidPrimary,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      letterSpacing: 0.2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        textDecoration: 'none',
                        opacity: 0.8,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                {/* 3D Juicee Sign In Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting || isGoogleLoading}
                  sx={{
                    mt: 1.5,
                    mb: 2,
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
                    '&.Mui-disabled': {
                      background: isGradient ? activeTheme.colors.primary : `linear-gradient(135deg, ${solidPrimary}, ${solidPrimary}e6)`,
                      color: '#fff',
                      opacity: 0.8,
                    },
                  }}
                >
                  {isSubmitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={22} thickness={4} sx={{ color: '#ffffff' }} />
                      <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.98rem' }}>
                        Signing In...
                      </Typography>
                    </Box>
                  ) : (
                    "Sign In"
                  )}
                </Button>

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
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isSubmitting}
                    startIcon={
                      isGoogleLoading ? (
                        <CircularProgress size={18} thickness={4} sx={{ color: solidPrimary }} />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      )
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
                      "&.Mui-disabled": {
                        borderColor: BORDER_GRAY,
                        color: INPUT_TEXT_COLOR,
                        opacity: 0.75,
                      }
                    }}
                  >
                    {isGoogleLoading ? "Connecting to Google..." : "Sign in with Google"}
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
                      pointerEvents: (window.Capacitor?.isNativePlatform?.() || isGoogleLoading || isSubmitting) ? 'none' : 'auto',
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
              </Box>

              {/* --- SIGN UP LINK --- */}
              <Grid container justifyContent="center" sx={{ mt: 3 }}>
                <Grid item>
                  <Typography variant="body2" sx={{ color: TEXT_GRAY, fontSize: '0.9rem' }}>
                    Don't have an account?{" "}
                    <Link
                      component={RouterLink}
                      to="/signup"
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
                      Sign Up
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* =====================================================
          SUCCESS/ERROR POPUP DIALOG
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
          },
        }}
        hideBackdrop
      >
        <DialogContent sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 0, width: '100%' }}>
          {popup.loading ? (
            <CircularProgress size={30} thickness={4} sx={{ color: solidPrimary, flexShrink: 0 }} />
          ) : popup.success ? (
            <CheckCircleRoundedIcon sx={{ color: solidPrimary, fontSize: 34, flexShrink: 0 }} />
          ) : (
            <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 34, flexShrink: 0 }} />
          )}
          <Typography
            variant="subtitle1"
            sx={{
              color: popup.success || popup.loading ? solidPrimary : "#ef1c1c",
              fontWeight: "bold",
              fontFamily: "Pacifico, cursive",
              letterSpacing: 0.8,
              fontSize: '1.05rem',
            }}
          >
            {popup.message}
          </Typography>
          {popup.bufferLoading && (
            <CircularProgress
              size={22}
              thickness={4}
              sx={{
                color: solidPrimary,
                ml: 'auto',
                flexShrink: 0,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* =====================================================
          FORGOT PASSWORD DIALOG
          ===================================================== */}
      <Dialog
        open={forgotOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setForgotOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: { xs: 300, sm: 390 },
            maxWidth: 430,
            px: 3,
            py: 2.5,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", textAlign: "center", color: solidPrimary, pb: 1, fontSize: '1.6rem' }}>
          Forgot Password
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: TEXT_GRAY, fontSize: '0.9rem' }}>
            Enter your registered mobile number to reset your password:
          </Typography>

          {/* Country Code + Mobile Number Row */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            {/* Country code selector button */}
            <Box
              onClick={() => setForgotCountryPickerOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                borderRadius: '16px',
                backgroundColor: LIGHT_GRAY,
                border: `1.5px solid ${BORDER_GRAY}`,
                cursor: 'pointer',
                minWidth: 85,
                height: 54,
                userSelect: 'none',
                transition: 'all 0.2s',
                '&:hover': { borderColor: solidPrimary, boxShadow: `0 0 0 3px ${solidPrimary}15` },
              }}
            >
              <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{forgotCountry.flag}</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: INPUT_TEXT_COLOR, whiteSpace: 'nowrap' }}>
                {forgotCountry.code}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: TEXT_GRAY }}>▼</Typography>
            </Box>

            {/* Mobile Number input */}
            <TextField
              label="Registered Mobile Number"
              placeholder={`${forgotCountry.dialLength} digits`}
              type="tel"
              value={forgotMobile}
              onChange={e => {
                let val = e.target.value;
                if (val.includes('+') || val.replace(/\D/g, '').length > forgotCountry.dialLength) {
                  const raw = val.replace(/\D/g, '');
                  if (forgotCountry.code === '+91' && raw.startsWith('91') && raw.length === 12) {
                    val = raw.slice(2);
                  } else {
                    val = raw.slice(-forgotCountry.dialLength);
                  }
                } else {
                  val = val.replace(/\D/g, '').slice(0, forgotCountry.dialLength);
                }
                setForgotMobile(val);
                setForgotError("");
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
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: '16px',
                  backgroundColor: LIGHT_GRAY,
                  height: 54,
                },
                '& .MuiInputBase-input': {
                  color: INPUT_TEXT_COLOR,
                  fontSize: '0.95rem',
                  letterSpacing: 1,
                  fontWeight: 500,
                },
                '& .MuiInputLabel-root': {
                  color: TEXT_GRAY,
                  '&.Mui-focused': { color: solidPrimary },
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: BORDER_GRAY },
                  '&:hover fieldset': { borderColor: solidPrimary },
                  '&.Mui-focused fieldset': { borderColor: solidPrimary, boxShadow: `0 0 0 3px ${solidPrimary}20` },
                }
              }}
            />
          </Box>

          {/* Formatted phone preview */}
          {forgotMobile && (
            <Typography variant="caption" sx={{ color: solidPrimary, fontWeight: 600, ml: 0.5 }}>
              Will verify as: {getFormattedForgotPhone()}
            </Typography>
          )}

          {forgotStatus === "checking" && (
            <Typography sx={{ color: "#ff9800", fontWeight: "bold", fontSize: '0.9rem' }}>Checking...</Typography>
          )}
          {forgotStatus === "processing" && (
            <Typography sx={{ color: "#2196f3", fontWeight: "bold", fontSize: '0.9rem' }}>Processing...</Typography>
          )}
          {forgotStatus === "done" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleRoundedIcon sx={{ color: solidPrimary }} />
              <Typography sx={{ color: solidPrimary, fontWeight: "bold" }}>Verified! Opening password reset...</Typography>
            </Box>
          )}
          {forgotStatus === "error" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CancelRoundedIcon sx={{ color: "#ef1c1c" }} />
              <Typography sx={{ color: "#ef1c1c", fontWeight: "bold", fontSize: '0.85rem' }}>{forgotError}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            sx={{
              color: "#ef1c1c",
              borderColor: "#ef1c1c40",
              "&:hover": { borderColor: "#ef1c1c", bgcolor: "rgba(239, 28, 28, 0.05)" },
              borderRadius: '24px',
              textTransform: 'none',
              px: 2.5,
              fontWeight: 600,
            }}
            onClick={() => setForgotOpen(false)}
            disabled={forgotStatus === "processing" || forgotStatus === "done"}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: solidPrimary,
              "&:hover": { bgcolor: solidPrimary, filter: 'brightness(0.92)' },
              borderRadius: '24px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              boxShadow: `0 4px 14px ${solidPrimary}40`,
            }}
            onClick={handleForgotVerify}
            disabled={forgotStatus === "processing" || forgotStatus === "done"}
          >
            {forgotStatus === "checking" || forgotStatus === "processing" ? "Verifying..." : "Verify"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          PASSWORD RESET DIALOG
          ===================================================== */}
      <Dialog
        open={resetOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setResetOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: { xs: 300, sm: 390 },
            maxWidth: 430,
            px: 3,
            py: 2.5,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14), 0 0 24px ${solidPrimary}15`,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", textAlign: "center", color: solidPrimary, pb: 1, fontSize: '1.6rem' }}>
          Reset Password
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: LIGHT_GRAY, border: `1px solid ${BORDER_GRAY}` }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: INPUT_TEXT_COLOR }}>
              Verified Mobile: <span style={{ color: solidPrimary }}>{getFormattedForgotPhone()}</span>
            </Typography>
          </Box>

          <TextField
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={e => {
              setNewPassword(e.target.value);
              setResetError("");
            }}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    size="small"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: '16px',
                backgroundColor: LIGHT_GRAY,
                height: 54,
              },
              '& .MuiInputBase-input': { color: INPUT_TEXT_COLOR },
              '& .MuiInputLabel-root': { color: TEXT_GRAY, '&.Mui-focused': { color: solidPrimary } },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: BORDER_GRAY },
                '&:hover fieldset': { borderColor: solidPrimary },
                '&.Mui-focused fieldset': { borderColor: solidPrimary, boxShadow: `0 0 0 3px ${solidPrimary}20` },
              }
            }}
          />

          <TextField
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={e => {
              setConfirmPassword(e.target.value);
              setResetError("");
            }}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: '16px',
                backgroundColor: LIGHT_GRAY,
                height: 54,
              },
              '& .MuiInputBase-input': { color: INPUT_TEXT_COLOR },
              '& .MuiInputLabel-root': { color: TEXT_GRAY, '&.Mui-focused': { color: solidPrimary } },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: BORDER_GRAY },
                '&:hover fieldset': { borderColor: solidPrimary },
                '&.Mui-focused fieldset': { borderColor: solidPrimary, boxShadow: `0 0 0 3px ${solidPrimary}20` },
              }
            }}
          />

          {resetStatus === "processing" && (
            <Typography sx={{ color: "#2196f3", fontWeight: "bold", fontSize: '0.9rem' }}>Processing reset...</Typography>
          )}
          {resetStatus === "done" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleRoundedIcon sx={{ color: solidPrimary }} />
              <Typography sx={{ color: solidPrimary, fontWeight: "bold" }}>Password Reset Successful!</Typography>
            </Box>
          )}
          {resetStatus === "error" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CancelRoundedIcon sx={{ color: "#ef1c1c" }} />
              <Typography sx={{ color: "#ef1c1c", fontWeight: "bold", fontSize: '0.85rem' }}>
                {resetError || (newPassword !== confirmPassword ? "Passwords do not match." : "Reset failed. Try again.")}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            sx={{
              color: "#ef1c1c",
              borderColor: "#ef1c1c40",
              "&:hover": { borderColor: "#ef1c1c", bgcolor: "rgba(239, 28, 28, 0.05)" },
              borderRadius: '24px',
              textTransform: 'none',
              px: 2.5,
              fontWeight: 600,
            }}
            onClick={() => setResetOpen(false)}
            disabled={resetStatus === "processing" || resetStatus === "done"}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: solidPrimary,
              "&:hover": { bgcolor: solidPrimary, filter: 'brightness(0.92)' },
              borderRadius: '24px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              boxShadow: `0 4px 14px ${solidPrimary}40`,
            }}
            onClick={handleResetPassword}
            disabled={resetStatus === "processing" || resetStatus === "done"}
          >
            {resetStatus === "processing" ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          GOOGLE CLIENT ID / AUTH TOKEN MODAL
          ===================================================== */}
      <Dialog
        open={googleModalOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setGoogleModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: 340,
            px: 3,
            py: 2.5,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14)`,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", textAlign: "center", color: solidPrimary, fontSize: '1.5rem' }}>
          Sign in with Google
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: TEXT_GRAY, fontSize: '0.9rem' }}>
            {googleClientId
              ? "Click to sign in with your Google account ID or enter your token below:"
              : "Please enter your Google OAuth Client ID or ID Token to complete sign-in:"}
          </Typography>
          <TextField
            label={googleClientId ? "Google ID Token / Credential" : "Google Client ID or ID Token"}
            placeholder={googleClientId ? "Paste Google ID Token..." : "your-client-id.apps.googleusercontent.com"}
            value={googleTokenInput}
            onChange={e => setGoogleTokenInput(e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: LIGHT_GRAY,
                borderRadius: '16px',
              },
              '& .MuiInputBase-input': {
                color: INPUT_TEXT_COLOR,
                fontSize: '0.85rem'
              },
              '& .MuiInputLabel-root': {
                color: TEXT_GRAY,
                '&.Mui-focused': { color: solidPrimary },
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: BORDER_GRAY },
                '&:hover fieldset': { borderColor: solidPrimary },
                '&.Mui-focused fieldset': { borderColor: solidPrimary },
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            sx={{
              color: "#ef1c1c",
              borderColor: "#ef1c1c40",
              "&:hover": { borderColor: "#ef1c1c" },
              borderRadius: '24px',
              textTransform: 'none',
              px: 2.5,
              fontWeight: 600,
            }}
            onClick={() => setGoogleModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: solidPrimary,
              "&:hover": { bgcolor: solidPrimary, filter: 'brightness(0.92)' },
              borderRadius: '24px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
            }}
            onClick={handleManualGoogleSubmit}
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
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", textAlign: "center", color: solidPrimary, fontSize: '1.5rem' }}>
          Enter Mobile Number
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: TEXT_GRAY, fontSize: '0.9rem' }}>
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
                backgroundColor: LIGHT_GRAY,
                border: `1.5px solid ${BORDER_GRAY}`,
                cursor: 'pointer',
                minWidth: 80,
                height: 54,
                userSelect: 'none',
                transition: 'all 0.2s',
                '&:hover': { borderColor: solidPrimary },
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
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: '16px',
                  backgroundColor: LIGHT_GRAY,
                  height: 54,
                },
                '& .MuiInputBase-input': {
                  color: INPUT_TEXT_COLOR,
                  fontSize: '0.95rem',
                  letterSpacing: 1,
                  fontWeight: 500,
                },
                '& .MuiInputLabel-root': {
                  color: TEXT_GRAY,
                  '&.Mui-focused': { color: solidPrimary },
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: BORDER_GRAY },
                  '&:hover fieldset': { borderColor: solidPrimary },
                  '&.Mui-focused fieldset': { borderColor: solidPrimary, boxShadow: `0 0 0 3px ${solidPrimary}20` },
                }
              }}
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
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {!isNewGoogleUser && (
            <Button
              variant="text"
              sx={{ color: TEXT_GRAY, textTransform: 'none', fontSize: '0.88rem', borderRadius: '20px' }}
              onClick={() => {
                setPhoneModalOpen(false);
                showPopup(true, "Signed in successfully!");
                setTimeout(() => navigate("/chat"), 1000);
              }}
              disabled={phoneSaving}
            >
              Skip
            </Button>
          )}
          <Button
            variant="contained"
            sx={{
              bgcolor: solidPrimary,
              "&:hover": { bgcolor: solidPrimary, filter: 'brightness(0.92)' },
              borderRadius: '24px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              boxShadow: `0 4px 14px ${solidPrimary}40`,
            }}
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
            minWidth: 310,
            maxHeight: '70vh',
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14)`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: solidPrimary, pb: 1, fontSize: '1.1rem' }}>
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
                px: 2.2,
                py: 1.3,
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

      {/* =====================================================
          COUNTRY PICKER DIALOG FOR FORGOT PASSWORD
          ===================================================== */}
      <Dialog
        open={forgotCountryPickerOpen}
        onClose={() => setForgotCountryPickerOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: 310,
            maxHeight: '70vh',
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            border: `1px solid ${BORDER_GRAY}`,
            boxShadow: `0 24px 48px rgba(0,0,0,0.14)`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: solidPrimary, pb: 1, fontSize: '1.1rem' }}>
          Select Country Code
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          {phoneCountries.map((country, idx) => (
            <Box
              key={`forgot-country-${country.code}-${idx}`}
              onClick={() => {
                setForgotCountry(country);
                setForgotMobile('');
                setForgotCountryPickerOpen(false);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2.2,
                py: 1.3,
                cursor: 'pointer',
                backgroundColor: forgotCountry.code === country.code && forgotCountry.name === country.name
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

export default SignInPage;