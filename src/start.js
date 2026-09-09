import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import juicyLogo from './logo/juicee2.png';
import API_BASE_URL from './config/apiConfig';

// --- KEYFRAMES ---
const fadeIn = keyframes`
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
`;

const slideUp = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const StartPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load and sync theme
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
      if (savedTheme) {
        return JSON.parse(savedTheme);
      } else {
        localStorage.setItem('appTheme', JSON.stringify(DEFAULT_THEME));
        return DEFAULT_THEME;
      }
    } catch (e) {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    // Apply theme CSS variables to root document
    if (activeTheme && activeTheme.colors) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', activeTheme.colors.primary);
      root.style.setProperty('--background-color', activeTheme.colors.background);
      root.style.setProperty('--surface-color', activeTheme.colors.surface);
      root.style.setProperty('--text-color', activeTheme.colors.text);

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const isGradient = activeTheme.colors.primary.startsWith('linear-gradient');
        metaThemeColor.setAttribute('content', isGradient ? '#f06292' : activeTheme.colors.primary);
      }
    }
  }, [activeTheme]);

  useEffect(() => {
    const pendingNotif = sessionStorage.getItem('pendingNotification');
    const pendingCall = sessionStorage.getItem('pendingCallAccept');
    if (pendingNotif || pendingCall) {
      console.log('⚡ StartPage: Bypassing splash delay due to pending notification/call.');
      navigate('/chat', { replace: true });
      return;
    }

    const checkStartupSession = async () => {
      let token = localStorage.getItem('token');
      let userId = localStorage.getItem('userId');

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
            console.warn('Native getSession error on startup:', err);
          }
        }
      }

      if (token && userId) {
        console.log('⚡ StartPage: Active session found, navigating to /chat immediately (WhatsApp style)');
        // Direct WhatsApp-style instant navigation to chat
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
                AudioRoute.clearSession().catch(() => {});
              }
            }
            navigate('/signin', { replace: true });
          }
        })
        .catch(err => {
          console.warn('Background token verification offline:', err);
        });
        return;
      }

      // No active session: show entrance animation and navigate to signin
      const timer = setTimeout(() => setIsLoaded(true), 100);
      const navigateTimer = setTimeout(() => {
        navigate('/signin', { replace: true });
      }, 1500);

      return () => {
        clearTimeout(timer);
        clearTimeout(navigateTimer);
      };
    };

    checkStartupSession();
  }, [navigate]);

  const isGradient = activeTheme.colors.primary.startsWith('linear-gradient');

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        width: '100vw',
        backgroundColor: activeTheme.colors.background,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Main Logo Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isLoaded ? `${fadeIn} 0.6s ease-out forwards` : 'none',
          opacity: isLoaded ? 1 : 0,
        }}
      >
        {/* juicy Logo */}
        <Box
          sx={{
            width: { xs: 80, sm: 100, md: 120 },
            height: { xs: 80, sm: 100, md: 120 },
            backgroundColor: activeTheme.colors.surface,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isGradient 
              ? '0 4px 20px rgba(0, 0, 0, 0.08)' 
              : `0 4px 15px ${activeTheme.colors.primary}25`,
            animation: isLoaded ? `${pulse} 2s ease-in-out infinite` : 'none',
            animationDelay: '0.6s',
            overflow: 'hidden',
          }}
        >
          <img
            src={juicyLogo}
            alt="juicy Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>

        {/* Tagline */}
        <Typography
          sx={{
            mt: 1.5,
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            fontWeight: 500,
            color: activeTheme.colors.text,
            opacity: 0.7,
            letterSpacing: 0.5,
            textAlign: 'center',
            px: 3,
          }}
        >
          Dripping with sweet gossip in the air.
        </Typography>
      </Box>

      {/* Bottom Section - WhatsApp Style */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 30, sm: 40 },
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: isLoaded ? `${slideUp} 0.8s ease-out 0.4s forwards` : 'none',
          opacity: isLoaded ? 1 : 0,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: activeTheme.colors.text,
            opacity: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 500,
            mb: 0.5,
          }}
        >
          from
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '0.95rem', sm: '1.05rem' },
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            ...(isGradient ? {
              background: activeTheme.colors.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            } : {
              color: activeTheme.colors.primary,
            })
          }}
        >
          LifeChangers Ind
        </Typography>

        {/* Loading Indicator */}
        <Box
          sx={{
            mt: 2.5,
            width: { xs: 40, sm: 45 },
            height: 3,
            backgroundColor: isGradient 
              ? 'rgba(0, 0, 0, 0.08)' 
              : `${activeTheme.colors.primary}20`,
            borderRadius: 1.5,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '40%',
              background: activeTheme.colors.primary,
              borderRadius: 1.5,
              animation: 'loading 1.5s ease-in-out infinite',
              '@keyframes loading': {
                '0%': { left: '-40%' },
                '100%': { left: '100%' },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StartPage;