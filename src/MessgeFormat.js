import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';

export const useMessageAnimations = () => {
  const [hearts, setHearts] = useState([]);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const playedWishesRef = useRef(new Set());

  const detectWishType = useCallback((text) => {
    if (!text || typeof text !== 'string') return null;
    const lowerText = text.trim().toLowerCase();

    // Exact word or full word patterns for celebratory wishes
    const birthdayPatterns = [/\bhbd\b/, /\bhappy\s*birthday\b/, /\bbirthday\b/];
    const congratsPatterns = [/\bcongrats\b/, /\bcongratulation(s)?\b/, /\bcongradulation(s)?\b/];
    const anniversaryPatterns = [/\banniversary\b/, /\bhappy\s*anniversary\b/, /\bbest\s*wishes\b/];
    const kissPatterns = [/\bkiss\b/, /\bkissing\b/, /\bkisses\b/, /\bkissed\b/, /\bmuah\b/, /💋/, /😘/, /😚/, /😙/, /😽/];

    if (birthdayPatterns.some(pattern => pattern.test(lowerText))) {
      return 'birthday';
    }
    if (congratsPatterns.some(pattern => pattern.test(lowerText))) {
      return 'congrats';
    }
    if (anniversaryPatterns.some(pattern => pattern.test(lowerText))) {
      return 'wishes';
    }
    if (kissPatterns.some(pattern => pattern.test(lowerText))) {
      return 'kiss';
    }
    return null;
  }, []);

  const detectHeartKeyword = useCallback((text) => {
    if (!text || typeof text !== 'string') return false;
    const lowerText = text.toLowerCase();
    const heartPatterns = [/\blove\b/i, /\blike\b/i, /\bcrush\b/i];
    return heartPatterns.some(pattern => pattern.test(lowerText));
  }, []);

  const triggerPopAnimation = useCallback((type) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions with high-DPI scaling ONLY if dimension changed
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.floor(window.innerWidth * dpr);
    const targetHeight = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.scale(dpr, dpr);
    }

    let emojis = ['🎉', '✨', '🎈', '🥳', '💖'];
    let colors = ['#FFC107', '#FF4081', '#00E676', '#29B6F6', '#AB47BC', '#FF5722'];

    if (type === 'birthday') {
      emojis = ['🎈', '🎉', '🎂', '🥳', '🧁', '🎁'];
      colors = ['#FF2D55', '#FFCC00', '#4CD964', '#5AC8FA', '#5856D6', '#FF9500'];
    } else if (type === 'congrats') {
      emojis = ['🎉', '✨', '👏', '🏆', '🌟', '🥳'];
      colors = ['#FFD700', '#C0C0C0', '#FF4081', '#00E676', '#29B6F6', '#AB47BC'];
    } else if (type === 'wishes') {
      emojis = ['💖', '✨', '🥂', '🍾', '💐', '❤️'];
      colors = ['#FF2D55', '#FFD700', '#FF69B4', '#DA70D6', '#FF8C00'];
    } else if (type === 'kiss') {
      emojis = ['💋', '😘', '❤️', '💖', '🥰', '😚', '😗', '😙'];
      colors = ['#FF2D55', '#FF4081', '#FF69B4', '#E91E63', '#FF85A2', '#FF007F', '#FF3366'];
    }

    const particleCount = 50;
    const newParticles = [];

    // Confetti particles shooting upwards
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: window.innerWidth * Math.random(),
        y: window.innerHeight + 20 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 12 - 7,
        rotation: Math.random() * 360,
        rvel: (Math.random() - 0.5) * 8,
        size: Math.random() * 7 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        shape: Math.random() > 0.5 ? 'circle' : 'square',
        type: 'confetti',
        gravity: 0.18,
        friction: 0.985
      });
    }

    // Rise & Drift Emoji particles (celebration theme icons)
    const emojiCount = 15;
    for (let i = 0; i < emojiCount; i++) {
      newParticles.push({
        x: window.innerWidth * Math.random(),
        y: window.innerHeight + 20 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 9 - 6,
        rotation: (Math.random() - 0.5) * 20,
        rvel: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 14 + 22,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        opacity: 1,
        type: 'emoji',
        gravity: 0.08,
        friction: 0.99
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];

    if (!animationFrameRef.current) {
      let lastFont = '';
      const runAnimation = () => {
        if (particlesRef.current.length === 0) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          animationFrameRef.current = null;
          return;
        }

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        particlesRef.current.forEach((p) => {
          p.vy += p.gravity;
          p.vx *= p.friction;
          p.vy *= p.friction;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rvel;
          p.opacity -= 0.0075; // slightly faster cleanup

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);

          if (p.type === 'emoji') {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            const fontStr = `${p.size}px sans-serif`;
            if (lastFont !== fontStr) {
              ctx.font = fontStr;
              lastFont = fontStr;
            }
            ctx.fillText(p.emoji, 0, 0);
          } else {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            if (p.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
          }
          ctx.restore();
        });

        particlesRef.current = particlesRef.current.filter(p => p.opacity > 0 && p.y < window.innerHeight + 100);
        animationFrameRef.current = requestAnimationFrame(runAnimation);
      };

      animationFrameRef.current = requestAnimationFrame(runAnimation);
    }
  }, []);

  const triggerHeartAnimation = useCallback((msgId) => {
    if (!msgId) return;
    const newHearts = Array.from({ length: 10 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      msgId,
      left: Math.random() * 80 + 10,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.2,
      size: 12 + Math.random() * 16,
      opacity: 0.7 + Math.random() * 0.3,
      sway: 10 + Math.random() * 20,
      angle: -20 + Math.random() * 40,
      gradientId: `heartGrad${Math.floor(Math.random() * 5) + 1}`
    }));
    setHearts(prev => [...prev, ...newHearts]);

    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    hearts,
    setHearts,
    canvasRef,
    playedWishesRef,
    detectWishType,
    detectHeartKeyword,
    triggerPopAnimation,
    triggerHeartAnimation
  };
};

const FLOAT_STYLE = (
  <style>{`
    @keyframes floatUp {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg) scale(0.3);
        opacity: 0;
      }
      15% {
        opacity: var(--max-opacity, 0.9);
        transform: translateY(-15vh) translateX(var(--sway-left)) rotate(var(--rot-angle)) scale(1.1);
      }
      45% {
        transform: translateY(-45vh) translateX(var(--sway-right)) rotate(calc(var(--rot-angle) * -0.8)) scale(0.9);
      }
      75% {
        transform: translateY(-75vh) translateX(var(--sway-left)) rotate(calc(var(--rot-angle) * 0.6)) scale(1.0);
      }
      100% {
        transform: translateY(-110vh) translateX(var(--sway-right)) rotate(calc(var(--rot-angle) * -0.4)) scale(0.6);
        opacity: 0;
      }
    }
  `}</style>
);

export const HeartKeyframes = React.memo(({ heartsCount }) => {
  if (heartsCount === 0) return null;
  return (
    <Box sx={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none', zIndex: -1 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="heartGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3366" />
            <stop offset="100%" stopColor="#ff5e62" />
          </linearGradient>
          <linearGradient id="heartGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ee0979" />
            <stop offset="100%" stopColor="#ff6a00" />
          </linearGradient>
          <linearGradient id="heartGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f093fb" />
            <stop offset="100%" stopColor="#f5576c" />
          </linearGradient>
          <linearGradient id="heartGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e52d27" />
            <stop offset="100%" stopColor="#b31217" />
          </linearGradient>
          <linearGradient id="heartGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff758c" />
            <stop offset="100%" stopColor="#ff7eb3" />
          </linearGradient>
        </defs>
      </svg>
      {FLOAT_STYLE}
    </Box>
  );
});

export const FloatingHearts = React.memo(({ hearts, msgId, localId, text, detectHeartKeyword }) => {
  const hasKeyword = React.useMemo(() => detectHeartKeyword(text), [text, detectHeartKeyword]);
  if (!hasKeyword) return null;

  const filteredHearts = hearts.filter(
    h => h.msgId === msgId || (localId && h.msgId === localId)
  );

  if (filteredHearts.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible'
      }}
    >
      {filteredHearts.map(heart => (
        <div
          key={heart.id}
          style={{
            position: 'absolute',
            left: `${heart.left}%`,
            bottom: 0,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
            opacity: heart.opacity,
            pointerEvents: 'none',
            '--sway-left': `${-heart.sway}px`,
            '--sway-right': `${heart.sway}px`,
            '--rot-angle': `${heart.angle}deg`,
            '--max-opacity': heart.opacity,
            animation: `floatUp ${heart.duration}s ease-in-out ${heart.delay}s forwards`,
            willChange: 'transform, opacity'
          }}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path
              fill={`url(#${heart.gradientId})`}
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
      ))}
    </Box>
  );
});

export const CelebrationCanvas = React.memo(({ canvasRef }) => {
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99999,
        willChange: 'transform'
      }}
    />
  );
});

