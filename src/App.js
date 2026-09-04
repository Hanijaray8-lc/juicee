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
import { AppBar, Toolbar, Box } from '@mui/material';

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingIntent, setCheckingIntent] = useState(() => {
    return typeof window !== 'undefined' && !!window.Capacitor;
  });

  const locationRef = useRef(location);

  // Sync locationRef to avoid stale closure references
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const isMobile = useMediaQuery('(max-width:768px)');

  // Show AppBar on these routes
  const showAppBar = isMobile && ['/', '/signin', '/signup'].includes(location.pathname);

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

          if (AudioRoute && typeof AudioRoute.getCallLaunchIntent === 'function') {
            const intent = await AudioRoute.getCallLaunchIntent();
            console.log('📱 App startup checked intent:', intent);
            if (intent) {
              if (intent.isCall) {
                if (intent.action === 'accept') {
                  sessionStorage.setItem('pendingCallAccept', JSON.stringify(intent));
                } else {
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
        } finally {
          setCheckingIntent(false);
        }
      } else {
        setCheckingIntent(false);
      }
    };
    checkInitialIntent();
  }, [navigate]);

  useEffect(() => {
    // ✅ Handle Android back button (only if native)
    let backButtonListener;
    const isNative = typeof window !== 'undefined' && window.Capacitor;

    const handleBackButton = () => {
      const eventDetail = { handled: false };
      const event = new CustomEvent('hardwareBack', { detail: eventDetail });
      window.dispatchEvent(event);

      if (!eventDetail.handled) {
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
          <Route path="/" element={<StartPage />} />
          <Route path="/signin" element={isMobile ? <SignInPage /> : <WebScanner />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/blocked-users" element={<BlockedUsersPage />} />
          <Route path="/finder" element={<FinderPage />} />
          <Route path="/help" element={<Help />} />
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