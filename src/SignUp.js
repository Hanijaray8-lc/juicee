import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  useMediaQuery,
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { keyframes } from '@emotion/react';
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import Slide from "@mui/material/Slide";
import useSwipeBack from './hooks/useSwipeBack';
import juiceeLogo from './logo/juicee2.png';
import API_BASE_URL from './config/apiConfig';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- WHATSAPP EXACT COLOR PALETTE ---
const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_DARK_GREEN = '#128C7E';
const WHATSAPP_TEAL = '#075E54';
const WHITE = '#FFFFFF';
const LIGHT_GRAY = '#F0F2F5';
const TEXT_GRAY = '#5F6A6A';
const BORDER_GRAY = '#E9EDEF';

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

export default function SignUpPage() {
  useSwipeBack(); // Default threshold is 80px

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

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
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
    // before handleGoogleSignInClick() can execute, preventing the OAuth window from opening.
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

  // Web Client ID — MUST be type-3 (Web), not Android client ID
  const GOOGLE_WEB_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '821005945428-7qbipus2rfd5r10d0uoblo6pi23sd9l5.apps.googleusercontent.com';

  // NOTE: GoogleAuth.initialize() is NOT called on native Android.
  // The @codetrix-studio/capacitor-google-auth plugin reads config automatically
  // from capacitor.config.json (serverClientId, androidClientId, scopes).
  // Calling initialize() explicitly on native causes a silent failure that
  // blocks signIn() from ever opening the OAuth window.

  const handleGoogleSignInClick = async () => {
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
        console.log('[GoogleAuth SignUp] signIn result:', JSON.stringify(googleUser));

        // idToken can be at top level OR inside authentication{} depending on plugin version
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

        // 12501 = user cancelled — silent
        const isCancelled =
          errCode === '12501' ||
          errMsg.includes('12501') ||
          errMsg.toLowerCase().includes('cancel') ||
          errCode === 'popup_closed_by_user';

        if (isCancelled) return;

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
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Country codes list
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
    // Trigger entrance animations
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoLoad = () => {
    setLogoLoaded(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Only allow digits for phone input
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
      // Prevent submit if username is taken
      if (usernameStatus.checked && usernameStatus.exists) {
        setFieldErrors({ username: 'Username already exists' });
        showPopup(false, 'Username already exists');
        return;
      }

      const formData = new FormData();

      // Add all form fields
      Object.keys(form).forEach(key => {
        if (key === 'phone') {
          // Add phone with country code
          formData.append(key, `${selectedCountry.code} ${form[key]}`);
        } else {
          formData.append(key, form[key]);
        }
      });
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
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        if (response.status === 409) {
          const field = data.field || '';
          const message = data.message || 'Registration failed';

          if (field) {
            console.log(`⚠️ Conflict on field: ${field}`);
            setFieldErrors({ [field]: message });
            showPopup(false, message); // Always show popup for better feedback
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
  }, [form.password, form.confirmPassword, passwordRules, termsAgreed]);

  const isFormValid = useMemo(() => {
    return isStep1Valid && isStep2Valid && isStep3Valid;
  }, [isStep1Valid, isStep2Valid, isStep3Valid]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        backgroundColor: activeTheme.colors.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        px: { xs: 0, sm: 2 },
        overflow: 'hidden',
        overflowY: 'auto',
      }}
    >
      <Container component="main" maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0, sm: 2 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4, md: 6 },
            borderRadius: 4,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              sx={{
                mt: 0.5,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: TEXT_GRAY,
                textAlign: 'center',
                animation: isLoaded ? `${fadeInUp} 0.6s ease-out 0.4s forwards` : 'none',
                opacity: isLoaded ? 1 : 0,
              }}
            >
              Create your account
            </Typography>
          </Box>
          {/* Step indicator header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 3, sm: 4 }, mt: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: WHATSAPP_TEAL, mb: 1.5 }}>
              Step {currentStep} of 3 — {currentStep === 1 ? 'Name & Profile' : currentStep === 2 ? 'Contact & Verification' : 'Password & Security'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 280, justifyContent: 'center' }}>
              {[1, 2, 3].map((s) => (
                <Box
                  key={s}
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: s === currentStep ? WHATSAPP_GREEN : s < currentStep ? `${WHATSAPP_GREEN}60` : 'rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>
          </Box>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem' }}>
            {/* Step 1: Name & Profile */}
            {currentStep === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                {/* Profile Photo button and preview */}
                <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 } }}>
                  {profilePreview && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Box
                        component="img"
                        src={profilePreview}
                        alt="Profile Preview"
                        sx={{
                          width: { xs: 80, sm: 100 },
                          height: { xs: 80, sm: 100 },
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `3px solid ${WHATSAPP_GREEN}`,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                      />
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    onClick={() => setProfileOpen(true)}
                    sx={{
                      borderColor: WHATSAPP_GREEN,
                      color: WHATSAPP_GREEN,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '&:hover': {
                        backgroundColor: `${WHATSAPP_GREEN}10`,
                        borderColor: WHATSAPP_DARK_GREEN,
                        color: WHATSAPP_DARK_GREEN,
                      },
                    }}
                  >
                    {profilePreview ? 'Change Profile Photo' : 'Add Profile Photo'}
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
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
                      height: { xs: 48, sm: 56 },
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

                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
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
                      height: { xs: 48, sm: 56 },
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
                            <CheckCircleRoundedIcon sx={{ color: WHATSAPP_GREEN }} />
                          </InputAdornment>
                        )
                      ) : null,
                  }}
                />

                {/* Gender Selection - Radio Buttons with Icons */}
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      color: TEXT_GRAY,
                      mb: 1,
                      ml: 0.5,
                      fontWeight: 500,
                    }}
                  >
                    Gender
                  </Typography>
                  <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 } }}>
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
                            gap: { xs: 0.3, sm: 0.5 },
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 1, sm: 2 },
                            borderRadius: 3,
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? `${solidPrimary}14`
                              : LIGHT_GRAY,
                            border: `2px solid ${isSelected ? WHATSAPP_GREEN : 'transparent'
                              }`,
                            boxShadow: isSelected
                              ? `0 2px 12px ${WHATSAPP_GREEN}30`
                              : 'none',
                            transition: 'all 0.25s ease',
                            '&:hover': {
                              borderColor: WHATSAPP_GREEN,
                              backgroundColor: `${solidPrimary}0A`,
                              transform: 'translateY(-1px)',
                            },
                            '&:active': {
                              transform: 'scale(0.97)',
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: { xs: '1.3rem', sm: '1.6rem' },
                              lineHeight: 1,
                              transition: 'transform 0.25s ease',
                              transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                            }}
                          >
                            {option.icon}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.85rem' },
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected
                                ? WHATSAPP_TEAL
                                : TEXT_GRAY,
                              transition: 'all 0.25s ease',
                            }}
                          >
                            {option.label}
                          </Typography>
                          {/* Radio dot indicator */}
                          <Box
                            sx={{
                              width: { xs: 14, sm: 16 },
                              height: { xs: 14, sm: 16 },
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? WHATSAPP_GREEN : `rgba(${rgbText}, 0.25)`
                                }`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mt: 0.3,
                              transition: 'all 0.25s ease',
                            }}
                          >
                            <Box
                              sx={{
                                width: { xs: 7, sm: 8 },
                                height: { xs: 7, sm: 8 },
                                borderRadius: '50%',
                                backgroundColor: isSelected
                                  ? WHATSAPP_GREEN
                                  : 'transparent',
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

                {/* Step 1 Actions */}
                <Button
                  variant="contained"
                  onClick={() => setCurrentStep(2)}
                  disabled={!isStep1Valid}
                  sx={{
                    backgroundColor: WHATSAPP_GREEN,
                    color: '#fff',
                    borderRadius: 3,
                    py: { xs: 1.2, sm: 1.5 },
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    textTransform: 'none',
                    mt: 2,
                    height: { xs: 48, sm: 56 },
                    boxShadow: `0 4px 12px ${WHATSAPP_GREEN}40`,
                    '&:hover': {
                      backgroundColor: WHATSAPP_DARK_GREEN,
                      boxShadow: `0 6px 16px ${WHATSAPP_GREEN}60`,
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                      color: '#666666',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Next
                </Button>
              </Box>
            )}

            {/* Step 2: Email & Phone */}
            {currentStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
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
                      height: { xs: 48, sm: 56 },
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
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Phone Number Input with Built-in Country Code */}
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
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
                        height: { xs: 48, sm: 56 },
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
                    inputProps={{ maxLength: selectedCountry.dialLength, inputMode: 'numeric', pattern: '[0-9]*' }}
                    placeholder={`${selectedCountry.dialLength} digits`}
                    error={!!fieldErrors.phone}
                    helperText={fieldErrors.phone || `${selectedCountry.dialLength} digits`}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            onClick={() => setCountrySelectOpen(true)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              cursor: 'pointer',
                              px: 1,
                              borderRight: `2px solid ${BORDER_GRAY}`,
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              color: TEXT_GRAY,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                color: WHATSAPP_GREEN,
                              },
                            }}
                          >
                            <span>{selectedCountry.flag}</span>
                            <span>{selectedCountry.code}</span>
                          </Box>
                        </InputAdornment>
                      )
                    }}
                  />

                  {/* Country Code Selection Modal */}
                  <Dialog
                    open={countrySelectOpen}
                    onClose={() => setCountrySelectOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{
                      sx: {
                        bgcolor: WHITE,
                        color: INPUT_TEXT_COLOR,
                        borderRadius: 3,
                      }
                    }}
                  >
                    <DialogTitle sx={{ color: WHATSAPP_TEAL, fontWeight: 700, textAlign: 'center' }}>
                      Select Country
                    </DialogTitle>
                    <DialogContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                        {countries.map((country, idx) => (
                          <Box
                            key={idx}
                            onClick={() => {
                              setSelectedCountry(country);
                              setCountrySelectOpen(false);
                              setForm({ ...form, phone: '' });
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: 2,
                              borderRadius: 2,
                              cursor: 'pointer',
                              backgroundColor: selectedCountry.name === country.name ? `${WHATSAPP_GREEN}20` : 'transparent',
                              border: selectedCountry.name === country.name ? `2px solid ${WHATSAPP_GREEN}` : `2px solid transparent`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: `${WHATSAPP_GREEN}10`,
                                border: `2px solid ${WHATSAPP_GREEN}`,
                              },
                            }}
                          >
                            <Typography sx={{ fontSize: '1.5rem' }}>{country.flag}</Typography>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 'bold', color: INPUT_TEXT_COLOR }}>
                                {country.name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.875rem', color: TEXT_GRAY }}>
                                {country.code} • {country.dialLength} digits
                              </Typography>
                            </Box>
                            {selectedCountry.name === country.name && (
                              <CheckCircleRoundedIcon sx={{ color: WHATSAPP_GREEN }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    </DialogContent>
                  </Dialog>
                </Box>

                {/* Step 2 Actions */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep(1)}
                    sx={{
                      flex: 1,
                      borderColor: WHATSAPP_GREEN,
                      color: WHATSAPP_GREEN,
                      height: { xs: 48, sm: 56 },
                      borderRadius: 3,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: WHATSAPP_DARK_GREEN,
                        backgroundColor: 'rgba(37, 211, 102, 0.08)'
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setCurrentStep(3)}
                    disabled={!isStep2Valid}
                    sx={{
                      flex: 1,
                      backgroundColor: WHATSAPP_GREEN,
                      color: '#fff',
                      height: { xs: 48, sm: 56 },
                      borderRadius: 3,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: WHATSAPP_DARK_GREEN },
                      '&:disabled': { backgroundColor: '#cccccc', color: '#666666' }
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3: Security Passwords & Terms */}
            {currentStep === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
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
                      height: { xs: 48, sm: 56 },
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
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowPassword} edge="end" sx={{ color: TEXT_GRAY }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
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
                      height: { xs: 48, sm: 56 },
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
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowConfirmPassword} edge="end" sx={{ color: TEXT_GRAY }}>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password Rules */}
                <Box sx={{ mt: 0.5, mb: 0.5 }}>
                  {passwordRules.map((rule, idx) => {
                    const passed = rule.test(form.password);
                    return (
                      <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        {passed ? (
                          <CheckCircleRoundedIcon sx={{ color: WHATSAPP_GREEN, fontSize: 18 }} />
                        ) : (
                          <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 18 }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: passed ? WHATSAPP_GREEN : "#ef1c1c",
                            fontWeight: passed ? "bold" : "normal",
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {rule.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Terms & Conditions Checkbox */}
                <Box sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={termsAgreed}
                        onChange={handleTermsCheckbox}
                        sx={{
                          color: TEXT_GRAY,
                          '&.Mui-checked': {
                            color: WHATSAPP_GREEN,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '0.9rem', color: TEXT_GRAY }}>
                        I agree to the{' '}
                        <Link
                          component="button"
                          type="button"
                          variant="body2"
                          sx={{
                            color: WHATSAPP_DARK_GREEN,
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
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep(2)}
                    sx={{
                      flex: 1,
                      borderColor: WHATSAPP_GREEN,
                      color: WHATSAPP_GREEN,
                      height: { xs: 48, sm: 56 },
                      borderRadius: 3,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: WHATSAPP_DARK_GREEN,
                        backgroundColor: 'rgba(37, 211, 102, 0.08)'
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!isFormValid}
                    sx={{
                      flex: 1,
                      backgroundColor: WHATSAPP_GREEN,
                      color: '#fff',
                      height: { xs: 48, sm: 56 },
                      borderRadius: 3,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: `0 4px 12px ${WHATSAPP_GREEN}40`,
                      '&:hover': {
                        backgroundColor: WHATSAPP_DARK_GREEN,
                        boxShadow: `0 6px 16px ${WHATSAPP_GREEN}60`
                      },
                      '&:disabled': {
                        backgroundColor: '#cccccc',
                        color: '#666666',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Register
                  </Button>
                </Box>
              </Box>
            )}
          </form>

          {/* --- OR DIVIDER & GOOGLE SIGN-IN BUTTON --- */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
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
                  On Android this overlay would intercept taps before handleGoogleSignInClick()
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

          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center', mt: { xs: 3, sm: 4 }, pb: { xs: 6, sm: 2 } }}>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: TEXT_GRAY }}>
              Already have an account?{' '}
              <Typography
                component="span"
                onClick={() => navigate('/signin')}
                sx={{
                  fontWeight: 'bold',
                  color: WHATSAPP_DARK_GREEN,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign In
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Profile Modal */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            mx: { xs: 2, sm: 'auto' },
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
          }
        }}
      >
        <DialogTitle sx={{ color: WHATSAPP_TEAL, fontWeight: 700, textAlign: 'center' }}>
          Add Profile
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={profilePreview || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
              alt="Profile"
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${WHATSAPP_GREEN}30`,
              }}
            />
            <Button
              component="label"
              variant="outlined"
              sx={{
                backgroundColor: LIGHT_GRAY,
                borderColor: BORDER_GRAY,
                color: TEXT_GRAY,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: `${WHATSAPP_GREEN}10`,
                  borderColor: WHATSAPP_GREEN,
                  color: WHATSAPP_GREEN,
                },
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
              color: WHATSAPP_GREEN,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Popup */}
      <Dialog
        open={popup.open}
        TransitionComponent={Transition}
        keepMounted
        PaperProps={{
          sx: {
            position: "fixed",
            bottom: { xs: 16, sm: 32 },
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
            borderRadius: 3,
            minWidth: { xs: 280, sm: 320 },
            maxWidth: '90vw',
            boxShadow: 6,
            display: "flex",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            zIndex: 1500,
          },
        }}
        hideBackdrop
      >
        <DialogContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 0 }}>
          {popup.success ? (
            <CheckCircleRoundedIcon sx={{ color: WHATSAPP_GREEN, fontSize: { xs: 32, sm: 40 } }} />
          ) : (
            <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: { xs: 32, sm: 40 } }} />
          )}
          <Typography
            variant="subtitle1"
            sx={{
              color: popup.success ? WHATSAPP_GREEN : "#ef1c1c",
              fontWeight: "bold",
              fontFamily: "Pacifico, cursive",
              letterSpacing: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            {popup.message}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Terms & Conditions Dialog */}
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
            borderRadius: 3,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
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
            bgcolor: WHATSAPP_GREEN,
            color: WHITE,
            borderRadius: '12px 12px 0 0',
          }}
        >
          Terms & Conditions
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2.5,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: LIGHT_GRAY,
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: WHATSAPP_GREEN,
              borderRadius: '10px',
              '&:hover': {
                background: WHATSAPP_DARK_GREEN,
              },
            },
          }}
          onScroll={handleTermsScroll}
        >
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.9rem',
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
              bgcolor: 'rgba(236, 64, 122, 0.08)',
              textAlign: 'center',
              borderTop: `1px solid ${BORDER_GRAY}`,
            }}
          >
            <Typography sx={{ fontSize: '0.85rem', color: WHATSAPP_DARK_GREEN, fontWeight: 600 }}>
              ⬇️ Scroll to the bottom to agree
            </Typography>
          </Box>
        )}

        <DialogActions
          sx={{
            p: 2,
            borderTop: `1px solid ${BORDER_GRAY}`,
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            sx={{
              borderColor: TEXT_GRAY,
              color: TEXT_GRAY,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: WHATSAPP_GREEN,
                color: WHATSAPP_GREEN,
              },
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
              bgcolor: termsScrolled ? WHATSAPP_GREEN : '#ccc',
              color: '#fff',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: termsScrolled ? `0 4px 12px ${WHATSAPP_GREEN}40` : 'none',
              '&:hover': {
                bgcolor: termsScrolled ? WHATSAPP_DARK_GREEN : '#ccc',
              },
              cursor: !termsScrolled ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={handleAgreeTerms}
          >
            I Agree
          </Button>
        </DialogActions>
      </Dialog>

      {/* Google Sign In Settings / Credential Input Dialog */}
      <Dialog
        open={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: WHITE,
            color: INPUT_TEXT_COLOR,
          }
        }}
      >
        <DialogTitle sx={{ color: WHATSAPP_TEAL, fontWeight: 700, textAlign: 'center' }}>
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
            sx={{
              backgroundColor: LIGHT_GRAY,
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
          <Button
            onClick={() => setGoogleModalOpen(false)}
            sx={{ color: TEXT_GRAY, fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleManualGoogleSubmit}
            sx={{
              backgroundColor: WHATSAPP_GREEN,
              color: '#fff',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { backgroundColor: WHATSAPP_DARK_GREEN }
            }}
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
    </Box>
  );
}