import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import juicyLogo from './logo/juicee2.png';
import API_BASE_URL from './config/apiConfig';

// ============================================================
// 3D SPLASH ANIMATIONS
// ============================================================

// Main 3D tumble entrance.
// Logo starts deep behind the screen and rotates into position.
const logoTumbleIn = keyframes`
  0% {
    opacity: 0;
    transform:
      perspective(1000px)
      translate3d(0, 0, -500px)
      rotateX(-70deg)
      rotateY(85deg)
      rotateZ(-8deg)
      scale(0.65);
  }

  35% {
    opacity: 1;
    transform:
      perspective(1000px)
      translate3d(0, -8px, 80px)
      rotateX(20deg)
      rotateY(-25deg)
      rotateZ(3deg)
      scale(1.05);
  }

  65% {
    transform:
      perspective(1000px)
      translate3d(0, 2px, 25px)
      rotateX(-8deg)
      rotateY(12deg)
      rotateZ(-1deg)
      scale(1.02);
  }

  85% {
    transform:
      perspective(1000px)
      translate3d(0, -2px, 8px)
      rotateX(3deg)
      rotateY(-4deg)
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

// Continuous subtle 3D floating / coin-like wobble.
const logoFloat = keyframes`
  0% {
    transform:
      perspective(1000px)
      translate3d(0, 0, 0)
      rotateX(0deg)
      rotateY(0deg)
      rotateZ(0deg);
  }

  20% {
    transform:
      perspective(1000px)
      translate3d(0, -5px, 10px)
      rotateX(2deg)
      rotateY(-4deg)
      rotateZ(-0.5deg);
  }

  40% {
    transform:
      perspective(1000px)
      translate3d(0, -8px, 16px)
      rotateX(-2deg)
      rotateY(5deg)
      rotateZ(0.5deg);
  }

  60% {
    transform:
      perspective(1000px)
      translate3d(0, -5px, 10px)
      rotateX(2deg)
      rotateY(-3deg)
      rotateZ(-0.3deg);
  }

  80% {
    transform:
      perspective(1000px)
      translate3d(0, -2px, 5px)
      rotateX(-1deg)
      rotateY(2deg)
      rotateZ(0.2deg);
  }

  100% {
    transform:
      perspective(1000px)
      translate3d(0, 0, 0)
      rotateX(0deg)
      rotateY(0deg)
      rotateZ(0deg);
  }
`;

// Subtle light sweep across the logo.
const logoLightSweep = keyframes`
  0% {
    transform: translateX(-160%) skewX(-18deg);
    opacity: 0;
  }

  20% {
    opacity: 0.25;
  }

  55% {
    opacity: 0.08;
  }

  100% {
    transform: translateX(220%) skewX(-18deg);
    opacity: 0;
  }
`;

// Floating background orb #1.
const orbDriftOne = keyframes`
  0%,
  100% {
    opacity: 0.15;
    transform:
      translate3d(-55px, 35px, -80px)
      scale(0.7);
  }

  50% {
    opacity: 0.5;
    transform:
      translate3d(45px, -40px, 80px)
      scale(1);
  }
`;

// Floating background orb #2.
const orbDriftTwo = keyframes`
  0%,
  100% {
    opacity: 0.15;
    transform:
      translate3d(50px, -40px, -40px)
      scale(0.65);
  }

  50% {
    opacity: 0.45;
    transform:
      translate3d(-45px, 45px, 70px)
      scale(1.05);
  }
`;

// Floating background orb #3.
const orbDriftThree = keyframes`
  0%,
  100% {
    opacity: 0.12;
    transform:
      translate3d(0, 50px, -90px)
      scale(0.55);
  }

  50% {
    opacity: 0.4;
    transform:
      translate3d(55px, -30px, 60px)
      scale(0.9);
  }
`;

// Small floating particle.
const particleFloat = keyframes`
  0%,
  100% {
    opacity: 0.15;
    transform: translate3d(0, 15px, -20px) scale(0.7);
  }

  50% {
    opacity: 0.45;
    transform: translate3d(15px, -20px, 40px) scale(1);
  }
`;

// Bottom content entrance.
const slideUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Loading bar glow.
const loadingGlow = keyframes`
  0% {
    transform: translateX(-130%);
    opacity: 0;
  }

  20% {
    opacity: 1;
  }

  80% {
    opacity: 1;
  }

  100% {
    transform: translateX(250%);
    opacity: 0;
  }
`;

// ============================================================
// START PAGE
// ============================================================

const StartPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // ==========================================================
  // LOAD AND SYNC THEME
  // ==========================================================

  const [activeTheme, setActiveTheme] = useState(() => {
    const DEFAULT_THEME = {
      id: 'light',
      name: 'Light',
      description: 'Bright and clear with soft pastels',
      colors: {
        primary: '#f06292',
        background: '#fff6f8',
        surface: '#ffffff',
        text: '#000000',
      },
      icon: '☀️',
    };

    try {
      const savedTheme = localStorage.getItem('appTheme');

      if (savedTheme) {
        return JSON.parse(savedTheme);
      } else {
        localStorage.setItem(
          'appTheme',
          JSON.stringify(DEFAULT_THEME)
        );

        return DEFAULT_THEME;
      }
    } catch (e) {
      return DEFAULT_THEME;
    }
  });

  // ==========================================================
  // APPLY THEME CSS VARIABLES
  // ==========================================================

  useEffect(() => {
    if (activeTheme && activeTheme.colors) {
      const root = document.documentElement;

      root.style.setProperty(
        '--primary-color',
        activeTheme.colors.primary
      );

      root.style.setProperty(
        '--background-color',
        activeTheme.colors.background
      );

      root.style.setProperty(
        '--surface-color',
        activeTheme.colors.surface
      );

      root.style.setProperty(
        '--text-color',
        activeTheme.colors.text
      );

      const metaThemeColor = document.querySelector(
        'meta[name="theme-color"]'
      );

      if (metaThemeColor) {
        const isGradient =
          activeTheme.colors.primary.startsWith(
            'linear-gradient'
          );

        metaThemeColor.setAttribute(
          'content',
          isGradient
            ? '#f06292'
            : activeTheme.colors.primary
        );
      }
    }
  }, [activeTheme]);

  // ==========================================================
  // STARTUP SESSION CHECK
  // ==========================================================

  useEffect(() => {
    const pendingNotif =
      localStorage.getItem('pendingNotification') ||
      sessionStorage.getItem('pendingNotification');

    const pendingCall =
      localStorage.getItem('pendingCallAccept') ||
      sessionStorage.getItem('pendingCallAccept');

    // If notification/call is pending,
    // immediately go to chat.
    if (pendingNotif || pendingCall) {
      console.log(
        '⚡ StartPage: Bypassing splash delay due to pending notification/call.'
      );

      navigate('/chat', { replace: true });
      return;
    }

    const checkStartupSession = async () => {
      let token = localStorage.getItem('token');
      let userId = localStorage.getItem('userId');

      // ======================================================
      // NATIVE FALLBACK
      // ======================================================

      if (
        (!token || !userId) &&
        typeof window !== 'undefined' &&
        window.Capacitor
      ) {
        const { AudioRoute } =
          window.Capacitor.Plugins || {};

        if (
          AudioRoute &&
          typeof AudioRoute.getSession === 'function'
        ) {
          try {
            const sess =
              await AudioRoute.getSession();

            if (
              sess &&
              sess.token &&
              sess.userId
            ) {
              userId = sess.userId;
              token = sess.token;

              localStorage.setItem(
                'userId',
                sess.userId
              );

              localStorage.setItem(
                'token',
                sess.token
              );

              if (sess.username) {
                localStorage.setItem(
                  'username',
                  sess.username
                );
              }

              if (sess.profileImage) {
                localStorage.setItem(
                  'profileImage',
                  sess.profileImage
                );
              }
            }
          } catch (err) {
            console.warn(
              'Native getSession error on startup:',
              err
            );
          }
        }
      }

      // ======================================================
      // ACTIVE SESSION
      // ======================================================

      if (token && userId) {
        console.log(
          '⚡ StartPage: Active session found, navigating to /chat immediately (WhatsApp style)'
        );

        navigate('/chat', { replace: true });

        // Background silent token verification.
        fetch(`${API_BASE_URL}/api/verify-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (
              res.status === 401 ||
              res.status === 403
            ) {
              return { valid: false };
            }

            return res.ok
              ? res.json()
              : { valid: true };
          })
          .then((data) => {
            if (
              data &&
              data.valid === false
            ) {
              localStorage.removeItem('userId');
              localStorage.removeItem('token');

              if (
                typeof window !== 'undefined' &&
                window.Capacitor
              ) {
                const { AudioRoute } =
                  window.Capacitor.Plugins || {};

                if (
                  AudioRoute &&
                  typeof AudioRoute.clearSession ===
                    'function'
                ) {
                  AudioRoute.clearSession()
                    .catch(() => {});
                }
              }

              navigate('/signin', {
                replace: true,
              });
            }
          })
          .catch((err) => {
            console.warn(
              'Background token verification offline:',
              err
            );
          });

        return;
      }

      // ======================================================
      // NO SESSION
      // SHOW SPLASH ANIMATION
      // ======================================================

      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);

      const navigateTimer = setTimeout(() => {
        navigate('/signin', {
          replace: true,
        });
      }, 1500);

      return () => {
        clearTimeout(timer);
        clearTimeout(navigateTimer);
      };
    };

    checkStartupSession();
  }, [navigate]);

  // ==========================================================
  // GRADIENT CHECK
  // ==========================================================

  const isGradient =
    activeTheme.colors.primary.startsWith(
      'linear-gradient'
    );

  // ==========================================================
  // PRIMARY COLORS FOR EFFECTS
  // ==========================================================

  const primaryColor =
    activeTheme.colors.primary;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        width: '100vw',

        backgroundColor:
          activeTheme.colors.background,

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

        // Important for 3D children.
        perspective: '1200px',
      }}
    >

      {/* =====================================================
          3D ATMOSPHERE / FLOATING ORBS
          ===================================================== */}

      <Box
        sx={{
          position: 'absolute',

          top: '50%',
          left: '50%',

          width: {
            xs: 300,
            sm: 450,
            md: 600,
          },

          height: {
            xs: 250,
            sm: 350,
            md: 450,
          },

          transform:
            'translate(-50%, -55%)',

          perspective: '1000px',

          transformStyle: 'preserve-3d',

          pointerEvents: 'none',
        }}
      >

        {/* Large floating orb */}
        <Box
          sx={{
            position: 'absolute',

            top: '5%',
            left: '5%',

            width: {
              xs: 35,
              sm: 48,
              md: 60,
            },

            height: {
              xs: 35,
              sm: 48,
              md: 60,
            },

            borderRadius: '50%',

            background: `
              radial-gradient(
                circle at 30% 25%,
                rgba(255,255,255,0.95),
                ${primaryColor}99 40%,
                ${primaryColor}18 100%
              )
            `,

            boxShadow: `
              0 0 25px ${primaryColor}35,
              0 10px 30px rgba(0,0,0,0.08)
            `,

            animation: isLoaded
              ? `${orbDriftOne} 5s ease-in-out infinite`
              : 'none',

            transformStyle: 'preserve-3d',
          }}
        />

        {/* Right floating orb */}
        <Box
          sx={{
            position: 'absolute',

            top: '15%',
            right: '2%',

            width: {
              xs: 24,
              sm: 34,
              md: 44,
            },

            height: {
              xs: 24,
              sm: 34,
              md: 44,
            },

            borderRadius: '50%',

            background: `
              radial-gradient(
                circle at 30% 25%,
                rgba(255,255,255,0.95),
                ${primaryColor}88 45%,
                ${primaryColor}15 100%
              )
            `,

            boxShadow:
              `0 0 22px ${primaryColor}30`,

            animation: isLoaded
              ? `${orbDriftTwo} 5.8s ease-in-out infinite 0.5s`
              : 'none',

            transformStyle: 'preserve-3d',
          }}
        />

        {/* Bottom floating orb */}
        <Box
          sx={{
            position: 'absolute',

            bottom: '8%',
            left: '12%',

            width: {
              xs: 18,
              sm: 26,
              md: 34,
            },

            height: {
              xs: 18,
              sm: 26,
              md: 34,
            },

            borderRadius: '50%',

            background: `
              radial-gradient(
                circle at 30% 25%,
                rgba(255,255,255,0.9),
                ${primaryColor}77 45%,
                ${primaryColor}12 100%
              )
            `,

            boxShadow:
              `0 0 18px ${primaryColor}28`,

            animation: isLoaded
              ? `${orbDriftThree} 6.5s ease-in-out infinite 1s`
              : 'none',

            transformStyle: 'preserve-3d',
          }}
        />

        {/* Small particle */}
        <Box
          sx={{
            position: 'absolute',

            bottom: '20%',
            right: '8%',

            width: {
              xs: 9,
              sm: 12,
              md: 15,
            },

            height: {
              xs: 9,
              sm: 12,
              md: 15,
            },

            borderRadius: '50%',

            backgroundColor:
              primaryColor,

            boxShadow:
              `0 0 14px ${primaryColor}45`,

            animation: isLoaded
              ? `${particleFloat} 4.5s ease-in-out infinite 0.8s`
              : 'none',

            transformStyle: 'preserve-3d',
          }}
        />
      </Box>

      {/* =====================================================
          MAIN LOGO SECTION
          ===================================================== */}

      <Box
        sx={{
          display: 'flex',

          flexDirection: 'column',

          alignItems: 'center',

          justifyContent: 'center',

          position: 'relative',

          zIndex: 5,

          width: '100%',

          animation: isLoaded
            ? `${slideUp} 0.7s ease-out forwards`
            : 'none',

          opacity: isLoaded ? 1 : 0,
        }}
      >

        {/* ===================================================
            LOGO 3D STAGE
            =================================================== */}

        <Box
          sx={{
            position: 'relative',

            width: {
              xs: 330,
              sm: 500,
              md: 680,
            },

            height: {
              xs: 170,
              sm: 230,
              md: 290,
            },

            maxWidth: '90vw',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

            perspective: '1200px',

            transformStyle: 'preserve-3d',

            overflow: 'visible',
          }}
        >

          {/* -----------------------------------------------
              Soft logo shadow underneath
              ----------------------------------------------- */}

          <Box
            sx={{
              position: 'absolute',

              bottom: {
                xs: 15,
                sm: 18,
                md: 25,
              },

              left: '50%',

              transform:
                'translateX(-50%)',

              width: {
                xs: 190,
                sm: 300,
                md: 400,
              },

              height: {
                xs: 18,
                sm: 25,
                md: 32,
              },

              borderRadius: '50%',

              backgroundColor:
                primaryColor,

              opacity: 0.12,

              filter: 'blur(18px)',

              animation: isLoaded
                ? `${logoFloat} 4.2s ease-in-out 1.2s infinite`
                : 'none',
            }}
          />

          {/* -----------------------------------------------
              Main 3D logo
              ----------------------------------------------- */}

          <Box
            sx={{
              position: 'relative',

              width: {
                xs: 300,
                sm: 470,
                md: 640,
              },

              maxWidth: '88vw',

              height: 'auto',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              perspective: '1200px',

              transformStyle: 'preserve-3d',

              animation: isLoaded
                ? `
                  ${logoTumbleIn} 1.15s
                  cubic-bezier(0.18, 0.75, 0.2, 1)
                  forwards,
                  ${logoFloat} 4.2s
                  ease-in-out
                  1.2s
                  infinite
                `
                : 'none',

              willChange: 'transform',

              filter: `
                drop-shadow(
                  0 18px 20px
                  rgba(0,0,0,0.12)
                )
                drop-shadow(
                  0 0 18px
                  ${primaryColor}18
                )
              `,

              transformOrigin:
                'center center',

              backfaceVisibility: 'hidden',
            }}
          >

            {/* Actual Juicee logo */}
            <Box
              component="img"
              src={juicyLogo}
              alt="juicy Logo"
              sx={{
                display: 'block',

                width: '100%',

                height: 'auto',

                objectFit: 'contain',

                backfaceVisibility:
                  'hidden',

                transform:
                  'translateZ(0)',

                userSelect: 'none',

                WebkitUserDrag: 'none',
              }}
            />

            {/* -------------------------------------------
                Glossy light sweep
                ------------------------------------------- */}

            <Box
              sx={{
                position: 'absolute',

                top: '-15%',

                left: '-20%',

                width: '18%',

                height: '130%',

                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',

                filter:
                  'blur(5px)',

                transform:
                  'translateX(-160%) skewX(-18deg)',

                pointerEvents: 'none',

                animation: isLoaded
                  ? `${logoLightSweep} 2.8s ease-in-out 1.25s infinite`
                  : 'none',
              }}
            />
          </Box>
        </Box>

        {/* ===================================================
            TAGLINE
            =================================================== */}

        <Typography
          sx={{
            mt: {
              xs: 0.5,
              sm: 1,
              md: 1.5,
            },

            fontSize: {
              xs: '0.78rem',
              sm: '0.9rem',
              md: '1rem',
            },

            fontWeight: 500,

            color:
              activeTheme.colors.text,

            opacity: 0.7,

            letterSpacing: 0.5,

            textAlign: 'center',

            px: 3,

            animation: isLoaded
              ? `${slideUp} 0.8s ease-out 0.25s forwards`
              : 'none',

            transform:
              isLoaded
                ? 'translateY(0)'
                : 'translateY(10px)',

            whiteSpace: 'normal',
          }}
        >
          Dripping with sweet gossip in the air.
        </Typography>
      </Box>

      {/* =====================================================
          BOTTOM SECTION
          ===================================================== */}

      <Box
        sx={{
          position: 'fixed',

          bottom: {
            xs: 28,
            sm: 36,
            md: 42,
          },

          left: 0,
          right: 0,

          display: 'flex',

          flexDirection: 'column',

          alignItems: 'center',

          zIndex: 10,

          animation: isLoaded
            ? `${slideUp} 0.8s ease-out 0.4s forwards`
            : 'none',

          opacity: isLoaded ? 1 : 0,
        }}
      >

        {/* FROM */}
        <Typography
          sx={{
            fontSize: {
              xs: '0.65rem',
              sm: '0.7rem',
              md: '0.75rem',
            },

            color:
              activeTheme.colors.text,

            opacity: 0.5,

            textTransform: 'uppercase',

            letterSpacing: '0.15em',

            fontWeight: 500,

            mb: 0.5,
          }}
        >
          from
        </Typography>

        {/* =================================================
            LIFECHANGERS IND
            ================================================= */}

        <Typography
          sx={{
            fontSize: {
              xs: '0.85rem',
              sm: '0.95rem',
              md: '1.05rem',
            },

            fontWeight: 700,

            letterSpacing: '0.12em',

            textTransform: 'uppercase',

            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

            ...(isGradient
              ? {
                  background:
                    activeTheme.colors.primary,

                  WebkitBackgroundClip:
                    'text',

                  WebkitTextFillColor:
                    'transparent',
                }
              : {
                  color:
                    activeTheme.colors.primary,
                }),
          }}
        >
          LifeChangers Ind
        </Typography>

        {/* =================================================
            LOADING BAR
            ================================================= */}

        <Box
          sx={{
            mt: 2.5,

            width: {
              xs: 42,
              sm: 48,
              md: 55,
            },

            height: 3,

            backgroundColor: isGradient
              ? 'rgba(0, 0, 0, 0.08)'
              : `${activeTheme.colors.primary}20`,

            borderRadius: 1.5,

            overflow: 'hidden',

            position: 'relative',
          }}
        >

          {/* Main loading progress */}
          <Box
            sx={{
              position: 'absolute',

              top: 0,

              left: 0,

              height: '100%',

              width: '40%',

              background:
                activeTheme.colors.primary,

              borderRadius: 1.5,

              animation:
                'loading 1.5s ease-in-out infinite',

              '@keyframes loading': {
                '0%': {
                  left: '-40%',
                },

                '100%': {
                  left: '100%',
                },
              },
            }}
          />

          {/* Subtle shine */}
          <Box
            sx={{
              position: 'absolute',

              top: 0,

              left: 0,

              width: '25%',

              height: '100%',

              background:
                'rgba(255,255,255,0.7)',

              borderRadius: 1.5,

              filter: 'blur(1px)',

              animation: isLoaded
                ? `${loadingGlow} 1.5s ease-in-out infinite`
                : 'none',

              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StartPage;