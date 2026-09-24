import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SignInPage from './SignInPage';
import SignUpPage from './SignUp';
import WebScanner from './WebScanner';
import { useMediaQuery } from '@mui/material';
import ChatPage from './ChatPage';
import Profile from './Profile';
import { StatusBar, Style } from '@capacitor/status-bar';
import StartPage from './start';
import { SocketProvider } from './context/socketContext';
import BlockedUsersPage from './BlockedUserPage';
import FinderPage from './finder';
import Help from './Help';
import HelpQuery from './Help&Query';
import { AppBar, Toolbar, Box } from '@mui/material';

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingIntent, setCheckingIntent] = useState(() => {
    return typeof window !== 'undefined' && !!window.Capacitor;
  });
  const [hasSession] = useState(() => {
    try {
      return Boolean(localStorage.getItem('token') && localStorage.getItem('userId'));
    } catch (e) {
      return false;
    }
  });

  const locationRef = useRef(location);

  // Sync locationRef to avoid stale closure references
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const isMobile = useMediaQuery('(max-width: 1024px)');

  // Show AppBar on these routes
  const showAppBar = isMobile && ['/', '/signin', '/signup'].includes(location.pathname);

  // Apply saved theme variables to documentElement on initial load
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) {
        const themeData = JSON.parse(savedTheme);
        if (themeData && themeData.colors) {
          const root = document.documentElement;
          let primaryVal = themeData.colors.primary || '#ff2d6c';
          let primaryGradient = themeData.colors.primaryGradient;
          if (!primaryGradient) {
            if (primaryVal.includes('gradient')) {
              primaryGradient = primaryVal;
              const match = primaryVal.match(/#(?:[0-9a-fA-F]{3,8})/);
              primaryVal = match ? match[0] : '#f06292';
            } else {
              primaryGradient = `linear-gradient(135deg, ${primaryVal} 0%, ${primaryVal}dd 100%)`;
            }
          } else if (primaryVal.includes('gradient')) {
            const match = primaryVal.match(/#(?:[0-9a-fA-F]{3,8})/);
            primaryVal = match ? match[0] : '#f06292';
          }

          const hexToRgb = (hex) => {
            try {
              const h = (hex || '#f06292').replace('#', '').trim();
              const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
              const bigint = parseInt(full, 16);
              const r = (bigint >> 16) & 255;
              const g = (bigint >> 8) & 255;
              const b = bigint & 255;
              return `${r}, ${g}, ${b}`;
            } catch (e) {
              return '240, 98, 146';
            }
          };

          const primaryRgb = hexToRgb(primaryVal);

          root.style.setProperty('--primary-color', primaryVal);
          root.style.setProperty('--primary-gradient', primaryGradient);
          root.style.setProperty('--primary-rgb', primaryRgb);
          root.style.setProperty('--primary-color-alpha', `rgba(${primaryRgb}, 0.08)`);
          root.style.setProperty('--primary-color-glow', `rgba(${primaryRgb}, 0.35)`);
          root.style.setProperty('--app-primary', primaryVal);
          root.style.setProperty('--app-primary-rgb', primaryRgb);
          root.style.setProperty('--background-color', themeData.colors.background);
          root.style.setProperty('--surface-color', themeData.colors.surface);
          root.style.setProperty('--text-color', themeData.colors.text);
        }
      }
    } catch (e) {}
  }, []);

  const processCallIntent = React.useCallback(async () => {
    if (typeof window !== 'undefined' && window.Capacitor) {
      try {
        const { AudioRoute } = window.Capacitor.Plugins || {};

        if (AudioRoute && typeof AudioRoute.getCallLaunchIntent === 'function') {
          const intent = await AudioRoute.getCallLaunchIntent();
          console.log('📱 App checked intent:', intent);
          if (intent) {
            if (intent.isCall) {
              if (intent.action === 'accept') {
                const stored = JSON.stringify({ ...intent, ts: Date.now() });
                localStorage.setItem('pendingCallAccept', stored);
                sessionStorage.setItem('pendingCallAccept', stored);
                window.dispatchEvent(new CustomEvent('pendingCallAcceptSet'));
              } else {
                localStorage.setItem('pendingCallIncoming', JSON.stringify(intent));
                sessionStorage.setItem('pendingCallIncoming', JSON.stringify(intent));
              }
              const token = localStorage.getItem('token');
              const userId = localStorage.getItem('userId');
              if (token && userId) {
                navigate('/chat', { replace: true });
              }
            } else if (intent.conversationId) {
              sessionStorage.setItem('pendingNotification', JSON.stringify(intent));
              const token = localStorage.getItem('token');
              const userId = localStorage.getItem('userId');
              if (token && userId) {
                console.log('📱 Redirecting immediately to chat page due to pending notification intent');
                navigate('/chat', { replace: true });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking call launch intent:', err);
      }
    }
  }, [navigate]);

  // Check launch intent on startup (cold boot)
  useEffect(() => {
    const checkInitialIntent = async () => {
      if (typeof window !== 'undefined' && window.Capacitor) {
        try {
          const { AudioRoute } = window.Capacitor.Plugins || {};

          // Sync locked contacts from localStorage to native SharedPreferences on boot
          if (AudioRoute && typeof AudioRoute.setLockedContacts === 'function') {
            try {
              const savedGesturesStr = localStorage.getItem('juicy_contact_gestures');
              if (savedGesturesStr) {
                const savedGestures = JSON.parse(savedGesturesStr);
                const contacts = Object.keys(savedGestures);
                await AudioRoute.setLockedContacts({ contacts });
                console.log('📱 App startup synced locked contacts:', contacts);
              }
            } catch (syncErr) {
              console.error('📱 App startup failed to sync locked contacts:', syncErr);
            }
          }

          await processCallIntent();

          // ⚡ FIX 4: Proactively request CAMERA + RECORD_AUDIO on startup when user is
          // already logged in, so the OS permission dialog never blocks getUserMedia()
          // during an actual call (especially on the very first cold-start call).
          if (hasSession) {
            try {
              if (window.PermissionsBridge && typeof window.PermissionsBridge.requestPermissions === 'function') {
                console.log('📱 [PERMISSIONS] Proactively requesting camera/mic permissions on startup (session exists)');
                window.PermissionsBridge.requestPermissions();
              }
            } catch (permErr) {
              console.warn('📱 [PERMISSIONS] Startup permission request error:', permErr);
            }
          }
        } catch (err) {
          console.error('Error checking call launch intent:', err);
        } finally {
          setCheckingIntent(false);
        }
      } else {
        setCheckingIntent(false);
      }
    };
    checkInitialIntent();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for warm-boot call intents (notification Accept tap while app process is alive)
  useEffect(() => {
    const handleJuicyCallIntent = () => {
      processCallIntent();
    };
    window.addEventListener('juicyCallIntent', handleJuicyCallIntent);

    let appStateListener;
    if (window.Capacitor?.Plugins?.App) {
      window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          processCallIntent();
        }
      }).then(l => { appStateListener = l; }).catch(() => {});
    }

    return () => {
      window.removeEventListener('juicyCallIntent', handleJuicyCallIntent);
      if (appStateListener) {
        Promise.resolve(appStateListener).then(h => {
          if (h && typeof h.remove === 'function') {
            h.remove();
          }
        }).catch(() => {});
      }
    };
  }, [processCallIntent]);

  useEffect(() => {
    // ✅ Handle Android back button (only if native)
    let backButtonListener;
    const isNative = typeof window !== 'undefined' && window.Capacitor;

    const handleBackButton = () => {
      const eventDetail = { handled: false };
      const event = new CustomEvent('hardwareBack', { detail: eventDetail });
      window.dispatchEvent(event);

      if (!eventDetail.handled) {
        // ✅ If a call is currently active, NEVER exitApp() and terminate the call!
        if (window.__juicyCallActive) {
          console.log('[App] Active call in progress on back button — keeping call alive');
          if (window.__juicyVideoCallActive && window.Capacitor?.Plugins?.AudioRoute?.enterPipMode) {
            window.Capacitor.Plugins.AudioRoute.enterPipMode().catch(() => {
              window.Capacitor?.Plugins?.AudioRoute?.moveToBackground?.();
            });
          } else if (window.Capacitor?.Plugins?.AudioRoute?.moveToBackground) {
            window.Capacitor.Plugins.AudioRoute.moveToBackground().catch(() => {});
          }
          return;
        }

        const path = locationRef.current.pathname;
        if (path === '/chat' || path === '/' || path === '/signin' || path === '/signup') {
          import('@capacitor/app').then(({ App: CapacitorApp }) => {
            CapacitorApp.exitApp();
          }).catch(err => {
            navigate(-1);
          });
        } else if (path === '/blocked-users' || path === '/finder') {
          navigate('/chat?tab=settings');
        } else {
          navigate(-1);
        }
      }
    };

    if (isNative) {
      try {
        import('@capacitor/app').then(({ App: CapacitorApp }) => {
          if (CapacitorApp && typeof CapacitorApp.addListener === 'function') {
            backButtonListener = CapacitorApp.addListener('backButton', handleBackButton);
          }
        }).catch(err => {
          console.warn('Failed to load Capacitor App plugin:', err);
        });
      } catch (err) {
        console.warn('App back button listener not available:', err);
      }
    }

    // ✅ Fix status bar overlap & set notification status bar for Android
    const setStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark }); // Light icons (white) for dark background
        await StatusBar.setBackgroundColor({ color: '#000000' }); // Black background
      } catch (err) {
        console.log('Status bar not available (Web environment)');
      }
    };
    setStatusBar();



    return () => {
      if (backButtonListener) {
        Promise.resolve(backButtonListener).then(h => {
          if (h && typeof h.remove === 'function') {
            h.remove();
          } else if (typeof h === 'function') {
            h();
          }
        }).catch(err => {});
      }
    };
  }, [navigate]);

  if (checkingIntent) {
    return (
      <div style={{ height: '100dvh', width: '100vw', backgroundColor: '#000000' }} />
    );
  }

  return (
    <SocketProvider>
      {/* ✅ GLOBAL MOBILE SAFE AREA WRAPPER */}
      <div
        style={{
          height: '100dvh', // modern viewport height
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',

          // ✅ Safe area for notch & status bar
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',

          boxSizing: 'border-box',
          backgroundColor: '#000', // optional (avoid white flash)
        }}
      >
  
        {/* ✅ ROUTES */}
        <Routes>
          <Route path="/" element={hasSession ? <ChatPage /> : <StartPage />} />
          <Route path="/signin" element={isMobile ? <SignInPage /> : <WebScanner />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/blocked-users" element={<BlockedUsersPage />} />
          <Route path="/finder" element={<FinderPage />} />
          <Route path="/help" element={<Help />} />
          <Route path="/help&query" element={<HelpQuery />} />
          <Route path="/help-query" element={<HelpQuery />} />
          <Route path="/help%26query" element={<HelpQuery />} />
        </Routes>
      </div>
    </SocketProvider>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;