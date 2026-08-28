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

// --- WHATSAPP EXACT COLOR PALETTE ---
const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_DARK_GREEN = '#128C7E';
const WHATSAPP_TEAL = '#075E54';
const WHITE = '#FFFFFF';
const LIGHT_GRAY = '#F0F2F5';
const TEXT_GRAY = '#5F6A6A';
const BORDER_GRAY = '#E9EDEF';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- LOGO POPUP ANIMATION KEYFRAMES ---
const logoPopup = keyframes`
  0% { 
    opacity: 0; 
    transform: scale(0.3) translateY(20px); 
  }
  50% { 
    transform: scale(1.1) translateY(-5px); 
  }
  70% { 
    transform: scale(0.95) translateY(0); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0); 
  }
`;

const fadeInUp = keyframes`
  0% { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const pulseRing = keyframes`
  0% { 
    transform: scale(0.8); 
    opacity: 0.5; 
  }
  100% { 
    transform: scale(1.4); 
    opacity: 0; 
  }
`;

const welcomeAnimation = {
  '@keyframes roseFade': {
    '0%': { color: '#128C7E' },
    '50%': { color: '#25D366' },
    '100%': { color: '#128C7E' },
  },
  animation: 'roseFade 2s infinite',
  fontFamily: '"Pacifico", cursive',
  fontWeight: 'bold',
  letterSpacing: 2,
};

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

  // Dynamic Theme Colors overriding WhatsApp Palette locally in this scope
  const WHATSAPP_GREEN = activeTheme.colors.primary;
  const WHATSAPP_DARK_GREEN = solidPrimary;
  const WHATSAPP_TEAL = solidPrimary;
  const WHITE = activeTheme.colors.surface;
  const LIGHT_GRAY = activeTheme.colors.background;
  const INPUT_TEXT_COLOR = activeTheme.colors.text || '#000000';
  const TEXT_GRAY = `rgba(${rgbText}, 0.65)`;
  const BORDER_GRAY = `rgba(${rgbText}, 0.12)`;

  const localWelcomeAnimation = {
    '@keyframes themeFade': {
      '0%': { color: solidPrimary },
      '50%': { color: `rgba(${rgbText}, 0.4)` },
      '100%': { color: solidPrimary },
    },
    animation: 'themeFade 2s infinite',
    fontFamily: '"Pacifico", cursive',
    fontWeight: 'bold',
    letterSpacing: 2,
  };

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // refs for focusing inputs when toggling visibility
  const hiddenPwdRef = useRef(null);   // actual hidden password input
  const visiblePwdRef = useRef(null);  // visible text field when showing password
  const [hiddenFocused, setHiddenFocused] = useState(false);

  const [popup, setPopup] = useState({
    open: false,
    success: false,
    message: "",
  });

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotStatus, setForgotStatus] = useState(""); // '', 'checking', 'processing', 'done', 'error'
  const [forgotError, setForgotError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStatus, setResetStatus] = useState(""); // '', 'processing', 'done', 'error'

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
              backendUrl: 'https://juicyapp.in', // ✅ for CallActionReceiver
            }).catch(err => console.warn('Native saveSession error:', err));
          }
        }

        if (result.requirePhone) {
          setPendingGoogleUser({ token: result.token, user: result.user });
          setPhoneModalOpen(true);
        } else {
          showPopup(true, result.message || "Google Sign-In successful!");
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
    // Build phone in format: +918778519806 (country code + digits, no space)
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
    // Android uses native GoogleAuth.signIn() — web GSI must NOT load inside WebView.
    // Loading web GSI on Android renders an <iframe> overlay that intercepts taps
    // before handleGoogleSignIn() can execute, preventing the OAuth window from opening.
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

  // Web Client ID for requestIdToken() — MUST be type-3 (web), not Android client ID
  const GOOGLE_WEB_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '821005945428-7qbipus2rfd5r10d0uoblo6pi23sd9l5.apps.googleusercontent.com';

  // NOTE: GoogleAuth.initialize() is NOT called on native Android.
  // The @codetrix-studio/capacitor-google-auth plugin reads config automatically
  // from capacitor.config.json (serverClientId, androidClientId, scopes).
  // Calling initialize() explicitly on native causes a silent failure that
  // blocks signIn() from ever opening the OAuth window.

  const handleGoogleSignIn = async () => {
    const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isNative) {
      try {
        // initialize() MUST be called before signIn() to build GoogleSignInClient.
        // Without this call, googleSignInClient is null inside the plugin and signIn()
        // crashes with NullPointerException at GoogleAuth.java:81.
        // Config (serverClientId, androidClientId, scopes) is read from capacitor.config.json.
        await GoogleAuth.initialize({
          clientId: GOOGLE_WEB_CLIENT_ID,
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });

        // Launch native Google account picker
        const googleUser = await GoogleAuth.signIn();
        console.log('[GoogleAuth SignIn] result:', JSON.stringify(googleUser));

        // idToken can be at top level OR inside authentication{} depending on version
        const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;

        if (idToken) {
          handleGoogleResponse({ credential: idToken });
        } else {
          console.error('[GoogleAuth] signIn succeeded but no idToken in response:', JSON.stringify(googleUser));
          showPopup(false, 'Google Sign-In failed: no token received.');
        }
      } catch (err) {
        // Log the full error object so logcat shows exact error code
        console.error('[GoogleAuth] signIn error — code:', err?.code, '| error:', err?.error, '| message:', err?.message, '| full:', JSON.stringify(err));
        const errCode = String(err?.code ?? err?.error ?? '');
        const errMsg = err?.message || String(err) || '';

        // 12501 = user cancelled the account picker — silent
        const isCancelled =
          errCode === '12501' ||
          errMsg.includes('12501') ||
          errMsg.toLowerCase().includes('cancel') ||
          errCode === 'popup_closed_by_user';

        if (isCancelled) {
          return;
        }

        // 10 or 12500 = DEVELOPER_ERROR (SHA-1 fingerprint or package name mismatch in Firebase)
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

      return; // always return on native — never fall through to web GSI
    }

    // ---- Web-only GSI flow (browser, not native Android) ----
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
    // Trigger entrance animations
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoLoad = () => {
    setLogoLoaded(true);
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => {
      const next = !prev;
      // focus appropriate input after toggle
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
        } catch (e) {
          /* ignore */
        }
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
    } catch (e) { /* ignore */ }
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
    } catch (e) { /* ignore */ }
  };

  const showPopup = (success, message) => {
    setPopup({ open: true, success, message });
    setTimeout(() => setPopup((p) => ({ ...p, open: false })), 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");

    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json(); if (response.ok) {
          localStorage.setItem('userId', result.user._id);
          localStorage.setItem('token', result.token);
          if (result.user.username) {
            localStorage.setItem('username', result.user.username);
          }
          if (result.user.profileImage) {
            localStorage.setItem('profileImage', result.user.profileImage);
          }

          // Sync to Android native SharedPreferences for persistent backup
          if (typeof window !== 'undefined' && window.Capacitor) {
            const { AudioRoute } = window.Capacitor.Plugins || {};
            if (AudioRoute && typeof AudioRoute.saveSession === 'function') {
              AudioRoute.saveSession({
                userId: result.user._id,
                token: result.token,
                username: result.user.username || '',
                profileImage: result.user.profileImage || '',
                backendUrl: 'https://juicyapp.in', // ✅ for CallActionReceiver
              }).catch(err => console.warn('Native saveSession error:', err));
            }
          }

          showPopup(true, result.message || "Login successful!");
          setTimeout(() => navigate("/chat"), 1500);
        } else {
          showPopup(false, result.message || "Invalid credentials.");
        }
        return; // Success or server-side error — no need to retry
      } catch (err) {
        lastError = err;
        console.warn(`Login attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err.message);
        if (attempt < MAX_RETRIES - 1) {
          // Wait before retrying (1s, 2s, 4s)
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    // All retries exhausted
    console.error("Login error after retries:", lastError);
    showPopup(false, "Network error. Check your connection and try again.");
  };

  // Open forgot dialog
  const handleForgotOpen = () => {
    setForgotOpen(true);
    setForgotStatus("");
    setForgotMobile("");
    setForgotError("");
  };

  // Handle verify button in forgot dialog
  const handleForgotVerify = async () => {
    setForgotStatus("checking");
    setForgotError("");
    const usernameOrEmail = document.getElementById("email")?.value || "";

    setTimeout(async () => {
      setForgotStatus("processing");
      try {
        // Send both username/email and mobile to backend
        const response = await fetch(`${API_BASE_URL}/api/forgot-password/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: usernameOrEmail,
            phone: forgotMobile
          }),
        });
        const result = await response.json();
        if (response.ok) {
          setForgotStatus("done");
          setTimeout(() => {
            setForgotOpen(false);
            setResetOpen(true);
          }, 1000);
        } else {
          setForgotStatus("error");
          setForgotError(result.message || "Verification failed.");
        }
      } catch (err) {
        setForgotStatus("error");
        setForgotError("Server error. Try again.");
      }
    }, 1200);
  };

  // Handle password reset
  const handleResetPassword = async () => {
    setResetStatus("processing");
    setTimeout(async () => {
      if (newPassword !== confirmPassword) {
        setResetStatus("error");
        return;
      }
      const usernameOrEmail = document.getElementById("email")?.value || "";
      try {
        // Send username/email, mobile, and new password to backend
        const response = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: usernameOrEmail,
            phone: forgotMobile,
            newPassword,
          }),
        });
        if (response.ok) {
          setResetStatus("done");
          setTimeout(() => {
            setResetOpen(false);
            showPopup(true, "Password reset successful!");
          }, 1200);
        } else {
          setResetStatus("error");
        }
      } catch (err) {
        setResetStatus("error");
      }
    }, 1200);
  };

  // Auto-redirect if already logged in (WhatsApp-style 0ms instant redirect)
  useEffect(() => {
    const checkSession = async () => {
      let userId = localStorage.getItem('userId');
      let token = localStorage.getItem('token');

      // Native fallback if localStorage was cleared by WebView
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
        // ✅ INSTANT direct navigation to chat (0ms lag, no flashing SignInPage)
        navigate('/chat', { replace: true });

        // Background silent token verification
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
      <Box
        sx={{
          minHeight: "100dvh",
          backgroundColor: activeTheme.colors.background,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          overflowY: "auto",
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={0}
            sx={{
              padding: { xs: 2, sm: 3 },
              borderRadius: 3,
              bgcolor: WHITE,
              color: INPUT_TEXT_COLOR,
              boxShadow: 'none',
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

              {/* --- LOGO SECTION WITH POPUP ANIMATION --- */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 220, sm: 260, md: 285 },
                  height: { xs: 85, sm: 90, md: 100 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  animation: isLoaded ? `${logoPopup} 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards` : 'none',
                  opacity: isLoaded ? 1 : 0,
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
                  }}
                />
              </Box>

              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mt: 0.5,
                  ...localWelcomeAnimation,
                  color: WHATSAPP_TEAL,
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                }}
              >
                Welcome
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  mb: 3,
                  color: TEXT_GRAY,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  animation: isLoaded ? `${fadeInUp} 0.6s ease-out 0.4s forwards` : 'none',
                  opacity: isLoaded ? 1 : 0,
                }}
              >
                Sign in to continue to Juicy
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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
                    backgroundColor: LIGHT_GRAY,
                    borderRadius: 2,
                    '& .MuiInputBase-input': {
                      color: INPUT_TEXT_COLOR,
                    },
                    '& .MuiInputLabel-root': {
                      color: TEXT_GRAY,
                      '&.Mui-focused': {
                        color: WHATSAPP_GREEN,
                      },
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      color: INPUT_TEXT_COLOR,
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: WHATSAPP_GREEN,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: WHATSAPP_GREEN,
                      },
                    },
                  }}
                />

                {/* Password field: hearts mask when hidden; eye shows original */}
                <Box sx={{ position: "relative", mt: 2 }}>
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
                        backgroundColor: LIGHT_GRAY,
                        borderRadius: 2,
                        '& .MuiInputLabel-root': {
                          color: TEXT_GRAY,
                          '&.Mui-focused': {
                            color: WHATSAPP_GREEN,
                          },
                        },
                        "& .MuiInputBase-root": {
                          height: 56,
                          boxSizing: "border-box",
                          borderRadius: 2,
                          color: INPUT_TEXT_COLOR,
                          '& fieldset': {
                            borderColor: 'transparent',
                          },
                          '&:hover fieldset': {
                            borderColor: WHATSAPP_GREEN,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: WHATSAPP_GREEN,
                          },
                        },
                        "& .MuiInputBase-input": {
                          padding: "16px 14px",
                          color: INPUT_TEXT_COLOR,
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
                              sx={{ color: TEXT_GRAY }}
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
                                sx={{ color: TEXT_GRAY }}
                              >
                                <Visibility />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          backgroundColor: LIGHT_GRAY,
                          borderRadius: 2,
                          pointerEvents: "none",
                          boxShadow: hiddenFocused ? `0 0 0 3px ${WHATSAPP_GREEN}30` : "none",
                          '& .MuiInputLabel-root': {
                            color: TEXT_GRAY,
                          },
                          "& .MuiInputBase-root": {
                            height: 56,
                            boxSizing: "border-box",
                            borderRadius: 2,
                            color: INPUT_TEXT_COLOR,
                            '& fieldset': {
                              borderColor: 'transparent',
                            },
                          },
                          "& .MuiInputBase-input": {
                            padding: "16px 14px",
                            color: INPUT_TEXT_COLOR,
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
                          top: 16,
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

                <Grid container justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Grid item>
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      sx={{
                        color: WHATSAPP_DARK_GREEN,
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                      onClick={handleForgotOpen}
                    >
                      Forgot password?
                    </Link>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    bgcolor: WHATSAPP_GREEN,
                    color: '#fff',
                    "&:hover": {
                      bgcolor: WHATSAPP_DARK_GREEN,
                      cursor: 'pointer',
                    },
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: "bold",
                    height: 48,
                    boxShadow: `0 4px 12px ${WHATSAPP_GREEN}40`,
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Sign In
                </Button>

                {/* --- OR DIVIDER & GOOGLE SIGN-IN BUTTON --- */}
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2, width: '100%' }}>
                  <Divider sx={{ flexGrow: 1, borderColor: BORDER_GRAY }} />
                  <Typography variant="body2" sx={{ px: 1.5, color: TEXT_GRAY, fontSize: '0.8rem', fontWeight: 500 }}>
                    OR
                  </Typography>
                  <Divider sx={{ flexGrow: 1, borderColor: BORDER_GRAY }} />
                </Box>

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
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: INPUT_TEXT_COLOR,
                      borderColor: BORDER_GRAY,
                      backgroundColor: LIGHT_GRAY,
                      "&:hover": {
                        backgroundColor: "#f8f9fa",
                        borderColor: WHATSAPP_GREEN,
                      },
                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    Sign in with Google
                  </Button>

                  {/* Web GSI iframe overlay — web browser only, hidden on Android.
                      On Android this overlay would intercept taps before handleGoogleSignIn()
                      could fire, preventing GoogleAuth.signIn() from ever being called. */}
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
                      // Hide completely on native Android — web GSI iframe must not intercept taps
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
              </Box>

              <Grid container justifyContent="center" sx={{ mt: 2 }}>
                <Grid item>
                  <Typography variant="body2" sx={{ color: TEXT_GRAY }}>
                    Don't have an account?{" "}
                    <Link
                      component={RouterLink}
                      to="/signup"
                      variant="body2"
                      sx={{
                        color: WHATSAPP_DARK_GREEN,
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
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

      {/* Success/Error Popup Dialog */}
      <Dialog
        open={popup.open}
        TransitionComponent={Transition}
        keepMounted
        PaperProps={{
          sx: {
            position: "fixed",
            bottom: 32,
            left: "44%",
            transform: "translateX(-50%)",
            bgcolor: "#fff",
            borderRadius: 3,
            minWidth: 320,
            boxShadow: 6,
            display: "flex",
            alignItems: "center",
            px: 3,
            py: 2,
          },
        }}
        hideBackdrop
      >
        <DialogContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 0 }}>
          {popup.success ? (
            <CheckCircleRoundedIcon sx={{ color: WHATSAPP_GREEN, fontSize: 40 }} />
          ) : (
            <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 40 }} />
          )}
          <Typography
            variant="subtitle1"
            sx={{
              color: popup.success ? WHATSAPP_GREEN : "#ef1c1c",
              fontWeight: "bold",
              fontFamily: "Pacifico, cursive",
              letterSpacing: 1,
            }}
          >
            {popup.message}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog
        open={forgotOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setForgotOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 350,
            px: 3,
            py: 2,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", ml: 8, color: WHATSAPP_TEAL }}>
          Forgot Password
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontWeight: "bold", color: INPUT_TEXT_COLOR }}>
            Username/Email: <span style={{ color: WHATSAPP_GREEN }}>{document.getElementById("email")?.value || ""}</span>
          </Typography>
          <TextField
            label="Registered Mobile Number"
            value={forgotMobile}
            onChange={e => setForgotMobile(e.target.value)}
            fullWidth
            sx={{
              backgroundColor: LIGHT_GRAY,
              borderRadius: 1,
              '& .MuiInputBase-input': {
                color: INPUT_TEXT_COLOR,
              },
              '& .MuiInputLabel-root': {
                color: TEXT_GRAY,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                color: INPUT_TEXT_COLOR,
              }
            }}
          />
          {forgotStatus === "checking" && (
            <Typography sx={{ color: "orange", fontWeight: "bold" }}>Checking...</Typography>
          )}
          {forgotStatus === "processing" && (
            <Typography sx={{ color: "blue", fontWeight: "bold" }}>Processing...</Typography>
          )}
          {forgotStatus === "done" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleRoundedIcon sx={{ color: WHATSAPP_GREEN }} />
              <Typography sx={{ color: WHATSAPP_GREEN, fontWeight: "bold" }}>Done!</Typography>
            </Box>
          )}
          {forgotStatus === "error" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CancelRoundedIcon sx={{ color: "#ef1c1c" }} />
              <Typography sx={{ color: "#ef1c1c", fontWeight: "bold" }}>{forgotError}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            sx={{ bgcolor: "#ef1c1c", "&:hover": { bgcolor: "#cc1818" }, borderRadius: 5 }}
            onClick={() => setForgotOpen(false)}
            disabled={forgotStatus === "processing" || forgotStatus === "done"}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: WHATSAPP_GREEN, "&:hover": { bgcolor: WHATSAPP_DARK_GREEN }, borderRadius: 5 }}
            onClick={handleForgotVerify}
            disabled={forgotStatus === "processing" || forgotStatus === "done"}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={resetOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setResetOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 350,
            px: 3,
            py: 2,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", ml: 8, color: WHATSAPP_TEAL }}>
          Reset Password
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontWeight: "bold", color: INPUT_TEXT_COLOR }}>
            Username/Email: <span style={{ color: WHATSAPP_GREEN }}>{document.getElementById("email")?.value || ""}</span>
          </Typography>
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            fullWidth
            sx={{
              backgroundColor: LIGHT_GRAY,
              borderRadius: 1,
              '& .MuiInputBase-input': {
                color: INPUT_TEXT_COLOR,
              },
              '& .MuiInputLabel-root': {
                color: TEXT_GRAY,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                color: INPUT_TEXT_COLOR,
              }
            }}
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            fullWidth
            sx={{
              backgroundColor: LIGHT_GRAY,
              borderRadius: 1,
              '& .MuiInputBase-input': {
                color: INPUT_TEXT_COLOR,
              },
              '& .MuiInputLabel-root': {
                color: TEXT_GRAY,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                color: INPUT_TEXT_COLOR,
              }
            }}
          />
          {resetStatus === "processing" && (
            <Typography sx={{ color: "blue", fontWeight: "bold" }}>Processing...</Typography>
          )}
          {resetStatus === "done" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleRoundedIcon sx={{ color: WHATSAPP_GREEN }} />
              <Typography sx={{ color: WHATSAPP_GREEN, fontWeight: "bold" }}>Password Reset Successful!</Typography>
            </Box>
          )}
          {resetStatus === "error" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CancelRoundedIcon sx={{ color: "#ef1c1c" }} />
              <Typography sx={{ color: "#ef1c1c", fontWeight: "bold" }}>
                {newPassword !== confirmPassword ? "Passwords do not match." : "Reset failed."}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            sx={{ bgcolor: "#ef1c1c", "&:hover": { bgcolor: "#cc1818" }, borderRadius: 5 }}
            onClick={() => setResetOpen(false)}
            disabled={resetStatus === "processing" || resetStatus === "done"}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: WHATSAPP_GREEN, "&:hover": { bgcolor: WHATSAPP_DARK_GREEN }, borderRadius: 5 }}
            onClick={handleResetPassword}
            disabled={resetStatus === "processing" || resetStatus === "done"}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Google Client ID / Auth Token Modal */}
      <Dialog
        open={googleModalOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setGoogleModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 340,
            px: 3,
            py: 2,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", textAlign: "center", color: WHATSAPP_TEAL }}>
          Sign in with Google
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: TEXT_GRAY }}>
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
              backgroundColor: LIGHT_GRAY,
              borderRadius: 1,
              '& .MuiInputBase-input': {
                color: INPUT_TEXT_COLOR,
                fontSize: '0.85rem'
              },
              '& .MuiInputLabel-root': {
                color: TEXT_GRAY,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                color: INPUT_TEXT_COLOR,
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            sx={{ bgcolor: "#ef1c1c", "&:hover": { bgcolor: "#cc1818" }, borderRadius: 5, textTransform: 'none' }}
            onClick={() => setGoogleModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: WHATSAPP_GREEN, "&:hover": { bgcolor: WHATSAPP_DARK_GREEN }, borderRadius: 5, textTransform: 'none' }}
            onClick={handleManualGoogleSubmit}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Google Sign-In Phone Number Prompt Dialog */}
      <Dialog
        open={phoneModalOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => {
          setPhoneModalOpen(false);
          showPopup(true, "Signed in successfully!");
          setTimeout(() => navigate("/chat"), 1000);
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 340,
            px: 3,
            py: 2,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "Pacifico, cursive", fontWeight: "bold", textAlign: "center", color: WHATSAPP_TEAL }}>
          Enter Mobile Number
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: TEXT_GRAY }}>
            Please enter your mobile number to complete your registration:
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
                py: 1,
                borderRadius: 2,
                backgroundColor: LIGHT_GRAY,
                border: `1.5px solid ${BORDER_GRAY}`,
                cursor: 'pointer',
                minWidth: 80,
                height: 56,
                userSelect: 'none',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: WHATSAPP_GREEN },
              }}
            >
              <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{selectedPhoneCountry.flag}</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: INPUT_TEXT_COLOR, whiteSpace: 'nowrap' }}>
                {selectedPhoneCountry.code}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: TEXT_GRAY }}>▼</Typography>
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
                    <LocalPhoneIcon sx={{ color: WHATSAPP_GREEN, fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: LIGHT_GRAY,
                borderRadius: 2,
                '& .MuiInputBase-input': {
                  color: INPUT_TEXT_COLOR,
                  fontSize: '0.95rem',
                  letterSpacing: 1,
                },
                '& .MuiInputLabel-root': {
                  color: TEXT_GRAY,
                  '&.Mui-focused': { color: WHATSAPP_GREEN },
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  color: INPUT_TEXT_COLOR,
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: WHATSAPP_GREEN },
                  '&.Mui-focused fieldset': { borderColor: WHATSAPP_GREEN },
                }
              }}
            />
          </Box>
          {/* Preview of full phone number */}
          {googlePhoneInput && (
            <Typography variant="caption" sx={{ color: WHATSAPP_TEAL, fontWeight: 600, ml: 0.5 }}>
              Will be saved as: {selectedPhoneCountry.code}{googlePhoneInput.replace(/\D/g, '')}
            </Typography>
          )}
          {phoneError && (
            <Typography variant="caption" sx={{ color: "#ef1c1c", fontWeight: "bold" }}>
              {phoneError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>

          <Button
            variant="contained"
            sx={{ bgcolor: WHATSAPP_GREEN, "&:hover": { bgcolor: WHATSAPP_DARK_GREEN }, borderRadius: 5, textTransform: 'none' }}
            onClick={handleSaveGooglePhone}
            disabled={phoneSaving}
          >
            {phoneSaving ? "Saving..." : "Save & Continue"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Country Picker Dialog for Phone Modal */}
      <Dialog
        open={phoneCountryPickerOpen}
        onClose={() => setPhoneCountryPickerOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 300,
            maxHeight: '70vh',
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: WHATSAPP_TEAL, pb: 1, fontSize: '1rem' }}>
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
                px: 2,
                py: 1.2,
                cursor: 'pointer',
                backgroundColor: selectedPhoneCountry.code === country.code && selectedPhoneCountry.name === country.name
                  ? `${WHATSAPP_GREEN}18`
                  : 'transparent',
                '&:hover': { backgroundColor: `${WHATSAPP_GREEN}12` },
                borderBottom: `1px solid ${BORDER_GRAY}`,
                transition: 'background 0.15s',
              }}
            >
              <Typography sx={{ fontSize: '1.4rem' }}>{country.flag}</Typography>
              <Typography sx={{ flex: 1, fontSize: '0.9rem', color: INPUT_TEXT_COLOR, fontWeight: 500 }}>
                {country.name}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: WHATSAPP_TEAL }}>
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