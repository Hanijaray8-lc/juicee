import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

// ============================================================================
//  CHICKEN JUMPER - 2-PLAYER CASUAL ARCADE
//  Faithful recreation matching reference image:
//  - "CHICKEN JUMPER" bubble 3D text header
//  - Cartoon sky cyan background with floating clouds
//  - Floating island blocks with green grass top and orange-brown soil base
//  - Destination block with wooden flag pole and white flag
//  - Cute cubic white chicken with red comb, beak, and flapping wings
//  - Charge & release jump mechanics (hold to charge, release to hop!)
//  - Giant circular blue arrow jump button
//  - Bottom-left (?) help button, bottom-right (+) cheer button
//  - Top-right sound toggle speaker
//  - Web Audio API synthesizer for clucks, jump whooshes, chimes, and fanfare
//  - 2-Player Challenge: Player 1 plays & sets score -> Player 2 accepts & beats it!
// ============================================================================

const CANVAS_W = 340;
const CANVAS_H = 540;
const CHICKEN_SIZE = 38;
const BLOCK_W = 54;
const BLOCK_H = 50;
const BASE_Y = 285;

// Web Audio API Synthesizer for Chicken Jumper FX
class ChickenJumperAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }
  }

  playCharge() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(540, t + 0.6);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    } catch (e) { }
  }

  playJump() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(820, t + 0.16);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) { }
  }

  playLand() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.1);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) { }
  }

  playScore() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [587.33, 880, 1174.66];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.16, this.ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.06);
        osc.stop(this.ctx.currentTime + i * 0.06 + 0.2);
      });
    } catch (e) { }
  }

  playCluck() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Chicken "Bawk-bawk!" sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.linearRampToValueAtTime(520, t + 0.08);
      osc.frequency.linearRampToValueAtTime(280, t + 0.18);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) { }
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.09);
        osc.stop(this.ctx.currentTime + i * 0.09 + 0.25);
      });
    } catch (e) { }
  }
}

export const JumpChickenGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    phase = 'p1_jumping', // 'p1_jumping' | 'p2_challenge' | 'p2_jumping' | 'finished'
    p1Score = null,
    p2Score = null,
    winnerId = null,
    status = 'active'
  } = gameData;

  const isP1 = userId === player1?.id;
  const isP2 = userId === player2?.id;
  const myName = isP1 ? player1?.username : player2?.username;
  const oppName = isP1 ? player2?.username : player1?.username;

  // Determines whether current user is active jumper
  const amICurrentJumper =
    (phase === 'p1_jumping' && isP1) ||
    (phase === 'p2_jumping' && isP2);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isCharging, setIsCharging] = useState(false);

  // References for continuous animation loop
  const chickenRef = useRef({
    x: 68,
    y: BASE_Y - CHICKEN_SIZE,
    vx: 0,
    vy: 0,
    isJumping: false,
    squashY: 1,
    wingFlap: 0
  });

  const platformsRef = useRef([
    { x: 60, y: BASE_Y, hasFlag: false },
    { x: 142, y: BASE_Y, hasFlag: false },
    { x: 224, y: BASE_Y, hasFlag: true }
  ]);

  const currentPlatformIdxRef = useRef(0);
  const chargeTimeRef = useRef(0);
  const chargeIntervalRef = useRef(null);
  const cloudsRef = useRef([
    { x: 25, y: 75, speed: 0.25, size: 48 },
    { x: 175, y: 130, speed: 0.2, size: 56 },
    { x: 270, y: 65, speed: 0.22, size: 42 }
  ]);
  const animFrameRef = useRef(null);
  const stateRef = useRef('ready');

  useEffect(() => {
    audioRef.current = new ChickenJumperAudioSynthesizer();
    return () => {
      if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (audioRef.current) audioRef.current.enabled = next;
  };

  // Start / Reset local jump run
  const resetLocalGame = () => {
    stateRef.current = 'ready';
    setGameState('ready');
    setScore(0);
    currentPlatformIdxRef.current = 0;
    platformsRef.current = [
      { x: 60, y: BASE_Y, hasFlag: false },
      { x: 142, y: BASE_Y, hasFlag: false },
      { x: 224, y: BASE_Y, hasFlag: true }
    ];
    chickenRef.current = {
      x: 60 + (BLOCK_W - CHICKEN_SIZE) / 2,
      y: BASE_Y - CHICKEN_SIZE,
      vx: 0,
      vy: 0,
      isJumping: false,
      squashY: 1,
      wingFlap: 0
    };
  };

  // Charging Jump Mechanics (Hold to charge power, release to hop!)
  const startCharging = () => {
    if (!amICurrentJumper || chickenRef.current.isJumping) return;

    if (stateRef.current === 'ready') {
      stateRef.current = 'playing';
      setGameState('playing');
    }

    if (stateRef.current !== 'playing') return;

    setIsCharging(true);
    chargeTimeRef.current = 0;
    if (audioRef.current) audioRef.current.playCharge();

    if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
    chargeIntervalRef.current = setInterval(() => {
      chargeTimeRef.current = Math.min(chargeTimeRef.current + 1, 24);
      // Squash chicken down cutely as power charges
      chickenRef.current.squashY = Math.max(0.65, 1 - chargeTimeRef.current * 0.016);
    }, 30);
  };

  const releaseJump = () => {
    if (!isCharging || !amICurrentJumper || chickenRef.current.isJumping) return;
    setIsCharging(false);
    if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);

    const rawPower = chargeTimeRef.current;
    // Minimum jump power ensures even a quick tap hops
    const power = Math.max(rawPower, 5);
    chickenRef.current.squashY = 1;
    chickenRef.current.isJumping = true;

    // Calculate jump velocity calibrated for platform gaps
    const jumpVx = 2.4 + power * 0.16;
    const jumpVy = -6.8 - power * 0.18;
    chickenRef.current.vx = jumpVx;
    chickenRef.current.vy = jumpVy;

    if (audioRef.current) audioRef.current.playJump();
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      // 1. Move Clouds in cartoon sky
      cloudsRef.current.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > CANVAS_W + 60) cloud.x = -70;
      });

      // 2. Physics if Chicken is in Air
      const chicken = chickenRef.current;
      if (chicken.isJumping && stateRef.current === 'playing') {
        chicken.x += chicken.vx;
        chicken.y += chicken.vy;
        chicken.vy += 0.52; // Gravity
        chicken.wingFlap += 0.35;

        // Check landing on platforms
        if (chicken.vy > 0 && chicken.y >= BASE_Y - CHICKEN_SIZE) {
          const chickenCenter = chicken.x + CHICKEN_SIZE / 2;
          let landedPlatform = null;

          for (let i = 0; i < platformsRef.current.length; i++) {
            const p = platformsRef.current[i];
            if (chickenCenter >= p.x - 6 && chickenCenter <= p.x + BLOCK_W + 6) {
              landedPlatform = { ...p, index: i };
              break;
            }
          }

          if (landedPlatform) {
            // Landed safely on a platform!
            chicken.y = BASE_Y - CHICKEN_SIZE;
            chicken.vy = 0;
            chicken.vx = 0;
            chicken.isJumping = false;
            chicken.wingFlap = 0;

            if (landedPlatform.index > currentPlatformIdxRef.current) {
              const hops = landedPlatform.index - currentPlatformIdxRef.current;
              currentPlatformIdxRef.current = landedPlatform.index;
              setScore(s => s + hops);
              if (audioRef.current) audioRef.current.playScore();

              // Spawn new forward platforms
              const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
              const nextDistance = 75 + Math.floor(Math.random() * 40);
              platformsRef.current.push({
                x: lastPlatform.x + nextDistance,
                y: BASE_Y,
                hasFlag: Math.random() < 0.4
              });

              // Smoothly scroll camera & platforms left to keep chicken in front
              if (chicken.x > 140) {
                const shiftX = chicken.x - 70;
                chicken.x -= shiftX;
                platformsRef.current.forEach(p => { p.x -= shiftX; });
              }
            } else {
              if (audioRef.current) audioRef.current.playLand();
            }
          } else if (chicken.y > BASE_Y + 50) {
            // Missed platform and fell down into the abyss!
            stateRef.current = 'gameover';
            setGameState('gameover');
            if (audioRef.current) audioRef.current.playCluck();
          }
        }
      }

      // --- RENDERING ---
      // 1. Sky Cyan Cartoon Background (matching reference image #4dd0e1)
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, '#53d7e8');
      grad.addColorStop(1, '#80e7d9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // 2. Cartoon Floating Clouds
      cloudsRef.current.forEach(c => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 0.5, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.35, c.y - 10, c.size * 0.45, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.7, c.y, c.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Floating Island Platforms (Grass top & clay base matching reference image)
      platformsRef.current.forEach(p => {
        drawPlatform(ctx, p.x, p.y, BLOCK_W, BLOCK_H, p.hasFlag);
      });

      // 4. Draw Cute Square White Chicken (matching reference image)
      drawChicken(ctx, chicken.x, chicken.y, chicken.squashY, chicken.wingFlap);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Platform Renderer matching reference image
  const drawPlatform = (ctx, x, y, w, h, hasFlag) => {
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    // Clay / Earthy Dirt bottom
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(x, y + 14, w, h - 14, [0, 0, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Grass Top block
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 16, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Destination Flag Pole if present (matches reference image flag)
    if (hasFlag) {
      // Wooden Pole
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(x + w / 2 - 2, y - 26, 4, 26);
      ctx.strokeRect(x + w / 2 - 2, y - 26, 4, 26);

      // White Flag banner
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + 2, y - 26);
      ctx.lineTo(x + w / 2 + 18, y - 18);
      ctx.lineTo(x + w / 2 + 2, y - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  // Chicken Renderer matching reference image
  const drawChicken = (ctx, x, y, squashY, wingFlap) => {
    ctx.save();
    ctx.translate(x + CHICKEN_SIZE / 2, y + CHICKEN_SIZE);
    ctx.scale(1 / squashY, squashY);
    ctx.translate(-(x + CHICKEN_SIZE / 2), -(y + CHICKEN_SIZE));

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    // Red Comb on Top (3 lobes matching cartoon style)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 14, y - 3, 5, 0, Math.PI * 2);
    ctx.arc(x + 22, y - 5, 6, 0, Math.PI * 2);
    ctx.arc(x + 29, y - 3, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Square White Chicken Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, CHICKEN_SIZE, CHICKEN_SIZE, 8);
    ctx.fill();
    ctx.stroke();

    // Big Cartoon Eye with Pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + 26, y + 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 27, y + 15, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Beak pointing right
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x + CHICKEN_SIZE - 2, y + 14);
    ctx.lineTo(x + CHICKEN_SIZE + 9, y + 19);
    ctx.lineTo(x + CHICKEN_SIZE - 2, y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Little Wing on the side
    const flapAngle = Math.sin(wingFlap) * 16;
    ctx.save();
    ctx.translate(x + 11, y + 23);
    ctx.rotate(flapAngle * Math.PI / 180);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  };

  // Submit Player 1 Challenge
  const handlePlayer1Submit = () => {
    onSendGameMessage({
      ...gameData,
      status: 'invited',
      phase: 'p2_challenge',
      p1Score: score,
      turnPlayerId: player2?.id
    });
  };

  // Submit Player 2 Result and Determine Winner
  const handlePlayer2Submit = () => {
    const p1S = p1Score || 0;
    const p2S = score;

    let finalWinner = 'draw';
    if (p1S > p2S) finalWinner = player1?.id;
    else if (p2S > p1S) finalWinner = player2?.id;

    if (audioRef.current) audioRef.current.playVictory();

    onSendGameMessage({
      ...gameData,
      status: 'finished',
      phase: 'finished',
      p2Score: p2S,
      winnerId: finalWinner
    });
  };

  // Auto-submit score when Player 2 finishes jumping / game over
  useEffect(() => {
    if (isP2 && phase === 'p2_jumping' && gameState === 'gameover') {
      const autoTimer = setTimeout(() => {
        handlePlayer2Submit();
      }, 2500);
      return () => clearTimeout(autoTimer);
    }
  }, [isP2, phase, gameState]);

  // Rematch
  const handleRematch = () => {
    onSendGameMessage({
      ...gameData,
      status: 'active',
      phase: 'p1_jumping',
      p1Score: null,
      p2Score: null,
      winnerId: null,
      turnPlayerId: player1?.id
    });
    resetLocalGame();
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: 360,
      userSelect: 'none',
      position: 'relative'
    }}>
      {/* Device Frame */}
      <Box sx={{
        width: CANVAS_W,
        height: CANVAS_H,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        bgcolor: '#4dd0e1'
      }}>
        {/* Main Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: CANVAS_W, height: CANVAS_H, display: 'block' }}
        />

        {/* Top Sound Toggle (Matching reference image top-right 🔊 icon) */}
        <IconButton
          onClick={toggleSound}
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            color: '#ffffff',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            zIndex: 10
          }}
        >
          {soundEnabled ? <VolumeUpIcon sx={{ fontSize: 32 }} /> : <VolumeOffIcon sx={{ fontSize: 32 }} />}
        </IconButton>

        {/* Top Title: "CHICKEN JUMPER" (Exact match to reference image 3D bubble title) */}
        <Box sx={{
          position: 'absolute',
          top: 36,
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <Typography sx={{
            fontFamily: '"Fredoka One", "Arial Black", system-ui, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 0 #000',
            letterSpacing: 2,
            lineHeight: 1,
            mb: 0.5
          }}>
            CHICKEN
          </Typography>
          <Typography sx={{
            fontFamily: '"Fredoka One", "Arial Black", system-ui, sans-serif',
            fontSize: '2.85rem',
            fontWeight: 900,
            color: '#fef08a', // Creamy yellow matching reference image
            textShadow: '-3px -3px 0 #1b380f, 3px -3px 0 #1b380f, -3px 3px 0 #1b380f, 3px 3px 0 #1b380f, 0 6px 0 #142a0a, 0 8px 12px rgba(0,0,0,0.5)',
            letterSpacing: 3,
            lineHeight: 1
          }}>
            JUMPER
          </Typography>

          {/* Current Score Badge */}
          {stateRef.current === 'playing' && (
            <Box sx={{
              display: 'inline-block',
              mt: 1,
              bgcolor: '#ffffff',
              py: 0.3,
              px: 2,
              borderRadius: 3,
              border: '2.5px solid #000',
              boxShadow: '0 4px 0 #000'
            }}>
              <Typography sx={{ fontWeight: 900, color: '#000', fontSize: '1.15rem' }}>
                ⭐ {score}
              </Typography>
            </Box>
          )}

          {/* Target Score to beat (shown during Player 2's turn) */}
          {phase === 'p2_jumping' && p1Score !== null && (
            <Box sx={{ mt: 0.8 }}>
              <Typography sx={{
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.85rem',
                textShadow: '0 2px 4px #000'
              }}>
                TARGET TO BEAT: {p1Score} ⭐
              </Typography>
            </Box>
          )}
        </Box>

        {/* CONTROLS (Exact match to reference image:
            - Giant Circular Blue Arrow jump button centered in lower area
            - Bottom-left (?) button
            - Bottom-right (+) button)
        */}
        {amICurrentJumper && (gameState === 'ready' || gameState === 'playing') && (
          <>
            {/* Giant Circular Blue Arrow Jump Button */}
            <Box
              onMouseDown={startCharging}
              onMouseUp={releaseJump}
              onTouchStart={startCharging}
              onTouchEnd={releaseJump}
              sx={{
                position: 'absolute',
                top: 360,
                left: '50%',
                transform: isCharging ? 'translateX(-50%) translateY(4px) scale(0.96)' : 'translateX(-50%)',
                width: 96,
                height: 96,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                border: '4px solid #000000',
                boxShadow: isCharging
                  ? '0 3px 0 #000000, 0 6px 12px rgba(0,0,0,0.3)'
                  : '0 8px 0 #000000, 0 12px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                zIndex: 10
              }}
            >
              {/* Right Arrow matching reference image */}
              <svg width="48" height="48" viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }}>
                <path
                  d="M 18 36 L 50 36 L 50 18 L 84 50 L 50 82 L 50 64 L 18 64 Z"
                  fill="#7dd3fc"
                  stroke="#000000"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>

            {/* Instruction Tip in Ready State */}
            {gameState === 'ready' && (
              <Box sx={{
                position: 'absolute',
                top: 468,
                left: 0,
                right: 0,
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 10
              }}>
                <Typography sx={{
                  fontFamily: 'sans-serif',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                }}>
                  Hold & Release to Hop!
                </Typography>
              </Box>
            )}

            {/* Bottom Left (?) Button */}
            <IconButton
              onClick={() => setHelpOpen(true)}
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                border: '3px solid #000000',
                boxShadow: '0 5px 0 #000000, 0 8px 12px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': { bgcolor: '#fef9c3' },
                zIndex: 10
              }}
            >
              <Typography sx={{
                fontSize: 28,
                fontWeight: 900,
                color: '#ea580c',
                WebkitTextStroke: '1.2px #000000',
                lineHeight: 1,
                fontFamily: '"Arial Black", sans-serif'
              }}>
                ?
              </Typography>
            </IconButton>

            {/* Bottom Right (+) Button */}
            <IconButton
              onClick={() => {
                if (audioRef.current) audioRef.current.playScore();
              }}
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                border: '3px solid #000000',
                boxShadow: '0 5px 0 #000000, 0 8px 12px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': { bgcolor: '#fef9c3' },
                zIndex: 10
              }}
            >
              <Typography sx={{
                fontSize: 30,
                fontWeight: 900,
                color: '#ea580c',
                WebkitTextStroke: '1.2px #000000',
                lineHeight: 1,
                fontFamily: '"Arial Black", sans-serif'
              }}>
                +
              </Typography>
            </IconButton>
          </>
        )}

        {/* GAME OVER SCREEN */}
        {amICurrentJumper && gameState === 'gameover' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            p: 3,
            textAlign: 'center',
            zIndex: 20
          }}>
            <Typography sx={{ fontSize: 44 }}>💥</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#f87171', textShadow: '0 2px 0 #000' }}>
              MISSED PLATFORM!
            </Typography>

            <Box sx={{
              bgcolor: '#ffffff',
              border: '2.5px solid #000',
              borderRadius: 3,
              p: 1.5,
              width: 180,
              boxShadow: '0 6px 0 #000'
            }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                SCORE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#000' }}>
                ⭐ {score}
              </Typography>
            </Box>

            {isP1 && phase === 'p1_jumping' && (
              <Button
                variant="contained"
                onClick={handlePlayer1Submit}
                sx={{
                  py: 1,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 900,
                  bgcolor: '#22c55e',
                  color: '#fff',
                  border: '2.5px solid #000',
                  boxShadow: '0 5px 0 #000',
                  '&:hover': { bgcolor: '#16a34a' }
                }}
              >
                🚀 Challenge {player2?.username}!
              </Button>
            )}

            {isP2 && phase === 'p2_jumping' && (
              <Button
                variant="contained"
                onClick={handlePlayer2Submit}
                sx={{
                  py: 1,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 900,
                  bgcolor: '#38bdf8',
                  color: '#000',
                  border: '2.5px solid #000',
                  boxShadow: '0 5px 0 #000',
                  '&:hover': { bgcolor: '#0ea5e9' }
                }}
              >
                🏆 View Match Results!
              </Button>
            )}

            <Button
              variant="text"
              onClick={resetLocalGame}
              sx={{ color: '#fef08a', fontWeight: 800, textDecoration: 'underline' }}
            >
              Try Jump Again
            </Button>
          </Box>
        )}

        {/* WAITING SCREEN (Shown to Player 1 while Player 2 is playing) */}
        {!amICurrentJumper && phase !== 'finished' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            p: 3,
            textAlign: 'center',
            zIndex: 20
          }}>
            <Typography sx={{ fontSize: 38 }}>⏳</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
              {phase === 'p2_challenge'
                ? `Challenge Sent to ${player2?.username}!`
                : `${player2?.username} is Hopping!`
              }
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 220 }}>
              You jumped across {p1Score} platforms. Waiting for {player2?.username} to beat your score!
            </Typography>
          </Box>
        )}

        {/* FINISHED / RESULTS SCREEN */}
        {phase === 'finished' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            p: 3,
            textAlign: 'center',
            zIndex: 25
          }}>
            <Typography sx={{ fontSize: 44 }}>
              {winnerId === 'draw' ? '🤝' : (winnerId === userId ? '🏆' : '👑')}
            </Typography>
            <Typography variant="h5" sx={{
              fontWeight: 900,
              color: winnerId === 'draw' ? '#facc15' : (winnerId === userId ? '#4ade80' : '#38bdf8')
            }}>
              {winnerId === 'draw'
                ? "It's a Tie!"
                : (winnerId === userId ? 'YOU WON THE HOP! 🐔' : `${oppName} WON! 🏆`)
              }
            </Typography>

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              p: 1.5,
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: '2.5px solid #000',
              boxShadow: '0 6px 0 #000'
            }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 900 }}>
                  {player1?.username} {winnerId === player1?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#000' }}>
                  {p1Score} ⭐
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: '#94a3b8', alignSelf: 'center', fontWeight: 900 }}>VS</Typography>

              <Box>
                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 900 }}>
                  {player2?.username} {winnerId === player2?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#000' }}>
                  {p2Score} ⭐
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleRematch}
              sx={{
                py: 1,
                px: 3.5,
                borderRadius: 3,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                border: '2px solid #000',
                boxShadow: '0 4px 0 #000'
              }}
            >
              🔄 Hop Again!
            </Button>
          </Box>
        )}
      </Box>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>How to Play Chicken Jumper 🐔</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            1. <b>Hold</b> the giant Blue Arrow button to charge your chicken's jump power.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            2. <b>Release</b> to hop onto the next grass island platform!
          </Typography>
          <Typography variant="body2">
            3. Time your charge carefully so your chicken doesn't fall between the platforms!
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Initial Data Generator for JumpChicken
export const jumpChickenInitialData = (player1, player2) => ({
  gameType: 'jumpchicken',
  status: 'active',
  phase: 'p1_jumping',
  player1,
  player2,
  p1Score: null,
  p2Score: null,
  winnerId: null,
  turnPlayerId: player1?.id
});

export default JumpChickenGame;
