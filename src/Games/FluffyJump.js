import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

// ============================================================================
//  FLUFFY JUMP - 2-PLAYER RETRO ARCADE JUMP GAME (3 ROUNDS)
//  Faithful recreation matching reference image:
//  - Retro arcade sky with drifting pixel clouds & distant cityscape skyline
//  - Rolling green hills & moving diagonal-striped retro green ground
//  - Classic 3D shaded green pipes with rim lips (top and bottom)
//  - Chubby yellow Fluffy bird with flapping wings, big eyes, and orange beak
//  - Tap / Click / Spacebar to flap & jump through pipes
//  - 3 Rounds total: Player 1 plays, then Player 2 plays; Highest score wins!
//  - Web Audio API zero-latency sound effects
// ============================================================================

const TOTAL_ROUNDS = 3;
const CANVAS_W = 320;
const CANVAS_H = 480;
const GROUND_H = 52;
const GROUND_Y = CANVAS_H - GROUND_H;
const PIPE_W = 52;
const PIPE_LIP_W = 60;
const PIPE_LIP_H = 24;
const PIPE_GAP = 125;
const PIPE_SPEED = 2.0;
const PIPE_SPAWN_DIST = 190;
const GRAVITY = 0.28;
const JUMP_IMPULSE = -6.0;

// --- Web Audio Synthesizer for Retro Arcade Sound FX ---
class RetroAudioSynthesizer {
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
      this.ctx.resume().catch(() => {});
    }
  }
  playFlap() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }
  playScore() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.08); // A5
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    } catch (e) {}
  }
  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {}
  }
  playDie() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.35);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }
  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.1;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.18, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
        osc.start(st);
        osc.stop(st + 0.25);
      });
    } catch (e) {}
  }
}

const audio = new RetroAudioSynthesizer();

// ============================================================================
//  CANVAS FLUFFY JUMP ENGINE
// ============================================================================
const FluffyJumpEngine = ({
  roundIndex = 0,
  isMyTurn = true,
  onRoundOver,
  onOpenScoreSet
}) => {
  const canvasRef = useRef(null);
  const [soundOn, setSoundOn] = useState(true);
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'crashed'
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'idle',
    score: 0,
    bird: {
      x: 75,
      y: 200,
      vy: 0,
      radius: 14,
      rotation: 0,
      wingTimer: 0,
      wingFrame: 0
    },
    pipes: [],
    groundOffset: 0,
    cloudOffset: 0,
    cityOffset: 0,
    hillsOffset: 0,
    flashAlpha: 0,
    lastTime: 0,
    spawnTimer: 0,
    hasSentScore: false
  });

  const toggleSound = (e) => {
    e?.stopPropagation();
    const next = !soundOn;
    setSoundOn(next);
    audio.enabled = next;
  };

  const handleFlap = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'idle') {
      s.gameState = 'playing';
      setGameState('playing');
      s.bird.vy = JUMP_IMPULSE;
      s.bird.rotation = -0.35;
      audio.playFlap();
      return;
    }
    if (s.gameState === 'playing') {
      s.bird.vy = JUMP_IMPULSE;
      s.bird.rotation = -0.35;
      audio.playFlap();
    }
  }, []);

  // Keyboard spacebar and up-arrow support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap]);

  // Main game animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    // Reset game state on mount
    stateRef.current = {
      gameState: 'idle',
      score: 0,
      bird: {
        x: 75,
        y: 210,
        vy: 0,
        radius: 14,
        rotation: 0,
        wingTimer: 0,
        wingFrame: 0
      },
      pipes: [
        {
          x: CANVAS_W + 40,
          topH: 140,
          bottomY: 140 + PIPE_GAP,
          passed: false
        }
      ],
      groundOffset: 0,
      cloudOffset: 0,
      cityOffset: 0,
      hillsOffset: 0,
      flashAlpha: 0,
      lastTime: performance.now(),
      spawnTimer: 0,
      hasSentScore: false
    };
    setScore(0);
    setGameState('idle');

    // Drawing Helpers
    const drawSkyAndClouds = (s) => {
      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, '#59bfcb');
      skyGrad.addColorStop(0.65, '#78d2dd');
      skyGrad.addColorStop(1, '#9ee2ea');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

      // 2. Pixel Clouds in Background
      const cloudSpeed = s.gameState === 'crashed' ? 0 : 0.3;
      s.cloudOffset = (s.cloudOffset + cloudSpeed) % (CANVAS_W + 120);

      const renderCloud = (baseX, baseY, scale) => {
        ctx.save();
        ctx.translate(baseX - s.cloudOffset, baseY);
        if (baseX - s.cloudOffset < -120) {
          ctx.translate(CANVAS_W + 120, 0);
        }
        ctx.fillStyle = '#ffffff';
        // Fluffy rounded cloud clusters
        ctx.beginPath();
        ctx.arc(20 * scale, 18 * scale, 16 * scale, 0, Math.PI * 2);
        ctx.arc(38 * scale, 10 * scale, 22 * scale, 0, Math.PI * 2);
        ctx.arc(58 * scale, 14 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.arc(76 * scale, 20 * scale, 14 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(10 * scale, 18 * scale, 75 * scale, 14 * scale);
        // Soft pixel bottom shadow
        ctx.fillStyle = '#d3eff3';
        ctx.fillRect(12 * scale, 26 * scale, 71 * scale, 6 * scale);
        ctx.restore();
      };

      renderCloud(60, 60, 0.9);
      renderCloud(240, 110, 0.7);
      renderCloud(400, 75, 1.0);

      // 3. Distant City Skyline (Matching Image 1)
      const cityY = GROUND_Y - 55;
      ctx.fillStyle = '#8bd5c0';
      const cityBuildings = [
        { x: 0, w: 26, h: 48 }, { x: 30, w: 20, h: 36 },
        { x: 54, w: 32, h: 54 }, { x: 90, w: 24, h: 42 },
        { x: 118, w: 28, h: 62 }, { x: 150, w: 22, h: 38 },
        { x: 176, w: 34, h: 50 }, { x: 214, w: 25, h: 44 },
        { x: 243, w: 30, h: 58 }, { x: 277, w: 24, h: 36 },
        { x: 305, w: 35, h: 52 }
      ];
      cityBuildings.forEach((b) => {
        ctx.fillRect(b.x, cityY + (60 - b.h), b.w, b.h);
        // Tiny pixel windows
        ctx.fillStyle = '#bfeee0';
        for (let wy = cityY + (60 - b.h) + 6; wy < cityY + 54; wy += 8) {
          for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 6) {
            ctx.fillRect(wx, wy, 2, 4);
          }
        }
        ctx.fillStyle = '#8bd5c0';
      });

      // 4. Rolling Green Bush Hills in front of City (Matching Image 1)
      ctx.fillStyle = '#59c277';
      ctx.beginPath();
      ctx.arc(30, GROUND_Y - 6, 38, Math.PI, 0);
      ctx.arc(100, GROUND_Y - 4, 46, Math.PI, 0);
      ctx.arc(175, GROUND_Y - 8, 42, Math.PI, 0);
      ctx.arc(245, GROUND_Y - 5, 48, Math.PI, 0);
      ctx.arc(310, GROUND_Y - 7, 40, Math.PI, 0);
      ctx.fill();

      // Bush highlights
      ctx.fillStyle = '#77d490';
      ctx.beginPath();
      ctx.arc(100, GROUND_Y - 4, 38, Math.PI * 1.15, Math.PI * 1.85);
      ctx.fill();
    };

    // Draw Pipe with 3D Bevel & Rims (Matching Image 1)
    const drawPipe = (x, y, w, h, isTop) => {
      ctx.save();
      const pipeX = Math.round(x);
      const pipeY = Math.round(y);

      // Pipe Main Shaft
      const shaftGrad = ctx.createLinearGradient(pipeX, 0, pipeX + w, 0);
      shaftGrad.addColorStop(0, '#2e6b12'); // Dark left outline
      shaftGrad.addColorStop(0.12, '#559c25');
      shaftGrad.addColorStop(0.25, '#9ce343'); // Specular highlight stripe
      shaftGrad.addColorStop(0.55, '#73bf2e'); // Main vibrant green
      shaftGrad.addColorStop(0.85, '#4e911c'); // Shadow edge
      shaftGrad.addColorStop(1, '#25580e'); // Far dark edge

      ctx.fillStyle = shaftGrad;
      ctx.fillRect(pipeX, pipeY, w, h);

      // Outer borders
      ctx.strokeStyle = '#1b450a';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(pipeX, pipeY, w, h);

      // Pipe Lip / Collar
      const lipX = pipeX - (PIPE_LIP_W - w) / 2;
      const lipY = isTop ? pipeY + h - PIPE_LIP_H : pipeY;

      const lipGrad = ctx.createLinearGradient(lipX, 0, lipX + PIPE_LIP_W, 0);
      lipGrad.addColorStop(0, '#2e6b12');
      lipGrad.addColorStop(0.12, '#559c25');
      lipGrad.addColorStop(0.25, '#a5ec4b');
      lipGrad.addColorStop(0.55, '#73bf2e');
      lipGrad.addColorStop(0.85, '#4e911c');
      lipGrad.addColorStop(1, '#25580e');

      ctx.fillStyle = lipGrad;
      ctx.fillRect(lipX, lipY, PIPE_LIP_W, PIPE_LIP_H);

      // Lip border
      ctx.strokeStyle = '#1b450a';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(lipX, lipY, PIPE_LIP_W, PIPE_LIP_H);

      // Highlight line on lip collar
      ctx.fillStyle = '#bdf46d';
      ctx.fillRect(lipX + 12, lipY + 3, 5, PIPE_LIP_H - 6);

      ctx.restore();
    };

    // Draw Ground with Scrolling 45° Diagonal Stripes (Matching Image 1)
    const drawGround = (offset) => {
      // 1. Dark Top Border
      ctx.fillStyle = '#22500d';
      ctx.fillRect(0, GROUND_Y, CANVAS_W, 4);

      // 2. Bright Lime Accent Line
      ctx.fillStyle = '#a6f23c';
      ctx.fillRect(0, GROUND_Y + 4, CANVAS_W, 3);

      // 3. Ground Striped Body
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(0, GROUND_Y + 7, CANVAS_W, GROUND_H - 7);

      // 4. Scrolling 45° Diagonal Alternating Retro Stripes
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, GROUND_Y + 7, CANVAS_W, GROUND_H - 7);
      ctx.clip();

      ctx.fillStyle = '#8ce037';
      const stripeW = 16;
      const totalW = CANVAS_W + stripeW * 2;
      const shift = offset % (stripeW * 2);

      for (let x = -stripeW * 2; x < totalW; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x - shift, GROUND_Y + GROUND_H);
        ctx.lineTo(x + stripeW - shift, GROUND_Y + GROUND_H);
        ctx.lineTo(x + stripeW + 28 - shift, GROUND_Y + 7);
        ctx.lineTo(x + 28 - shift, GROUND_Y + 7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Bottom baseline border
      ctx.fillStyle = '#1b450a';
      ctx.fillRect(0, CANVAS_H - 3, CANVAS_W, 3);
    };

    // Draw Fluffy Bird (Chubby Yellow Bird with Big Eyes and Beak from Image 1)
    const drawBird = (bird) => {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // --- 1. Tail Feather ---
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-21, -4);
      ctx.lineTo(-21, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // --- 2. Chubby Yellow Body ---
      const bodyGrad = ctx.createRadialGradient(-2, -4, 3, 0, 0, 16);
      bodyGrad.addColorStop(0, '#fef08a'); // Soft top highlight
      bodyGrad.addColorStop(0.35, '#facc15'); // Bright yellow
      bodyGrad.addColorStop(0.85, '#eab308'); // Golden yellow
      bodyGrad.addColorStop(1, '#ca8a04'); // Darker yellow outline

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.stroke();

      // White chest belly
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, 4, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- 3. Flapping Wing ---
      const wingYOffsets = [0, -3, 3];
      const wingDY = wingYOffsets[bird.wingFrame % 3];
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(-5, 1 + wingDY, 8, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // --- 4. Big Eye ---
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(8, -5, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Catchlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9, -6, 1, 0, Math.PI * 2);
      ctx.fill();

      // --- 5. Chunky Orange Beak / Lips (Matching Image 1) ---
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      // Upper lip
      ctx.moveTo(10, -3);
      ctx.quadraticCurveTo(20, -4, 18, 0);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Lower lip
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(18, 1, 16, 5);
      ctx.quadraticCurveTo(11, 5, 10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    };

    // Main Animation Frame
    const render = (time) => {
      const s = stateRef.current;
      const dt = Math.min((time - s.lastTime) / 1000, 0.05);
      s.lastTime = time;

      // Update Bird Wing Animation
      s.bird.wingTimer += dt;
      if (s.bird.wingTimer > 0.12) {
        s.bird.wingTimer = 0;
        s.bird.wingFrame = (s.bird.wingFrame + 1) % 3;
      }

      // STATE: IDLE (Gentle hover)
      if (s.gameState === 'idle') {
        s.groundOffset += PIPE_SPEED;
        s.bird.y = 205 + Math.sin(time / 240) * 8;
        s.bird.rotation = 0;
      }

      // STATE: PLAYING
      if (s.gameState === 'playing') {
        s.groundOffset += PIPE_SPEED;

        // Apply Gravity
        s.bird.vy += GRAVITY;
        s.bird.y += s.bird.vy;

        // Rotate bird based on velocity
        if (s.bird.vy < 0) {
          s.bird.rotation = Math.max(-0.4, s.bird.rotation - 0.05);
        } else {
          s.bird.rotation = Math.min(1.2, s.bird.rotation + 0.06);
        }

        // Spawn / Move Pipes
        s.pipes.forEach((p) => {
          p.x -= PIPE_SPEED;
        });

        // Add new pipe
        const lastPipe = s.pipes[s.pipes.length - 1];
        if (!lastPipe || lastPipe.x < CANVAS_W - PIPE_SPAWN_DIST) {
          const minH = 50;
          const maxH = GROUND_Y - PIPE_GAP - minH;
          const topH = Math.floor(minH + Math.random() * (maxH - minH));
          s.pipes.push({
            x: CANVAS_W + 10,
            topH,
            bottomY: topH + PIPE_GAP,
            passed: false
          });
        }

        // Remove offscreen pipes
        if (s.pipes.length > 0 && s.pipes[0].x < -PIPE_LIP_W - 20) {
          s.pipes.shift();
        }

        // Check Score Passing
        s.pipes.forEach((p) => {
          if (!p.passed && p.x + PIPE_W < s.bird.x) {
            p.passed = true;
            s.score += 1;
            setScore(s.score);
            audio.playScore();
          }
        });

        // Check Ground / Sky Collision
        if (s.bird.y + s.bird.radius >= GROUND_Y) {
          s.bird.y = GROUND_Y - s.bird.radius;
          s.gameState = 'crashed';
          s.flashAlpha = 0.65;
          audio.playHit();
          audio.playDie();
        }
        if (s.bird.y - s.bird.radius <= 0) {
          s.bird.y = s.bird.radius;
          s.bird.vy = 0;
        }

        // Check Pipe Collision
        const bx = s.bird.x;
        const by = s.bird.y;
        const br = s.bird.radius - 2;

        for (const p of s.pipes) {
          // Top pipe rect: [p.x, 0, PIPE_W, p.topH]
          if (
            bx + br > p.x &&
            bx - br < p.x + PIPE_W &&
            by - br < p.topH
          ) {
            s.gameState = 'crashed';
            s.flashAlpha = 0.65;
            audio.playHit();
            audio.playDie();
            break;
          }
          // Bottom pipe rect: [p.x, p.bottomY, PIPE_W, GROUND_Y - p.bottomY]
          if (
            bx + br > p.x &&
            bx - br < p.x + PIPE_W &&
            by + br > p.bottomY
          ) {
            s.gameState = 'crashed';
            s.flashAlpha = 0.65;
            audio.playHit();
            audio.playDie();
            break;
          }
        }
      }

      // STATE: CRASHED (Bird drops to ground, then triggers end)
      if (s.gameState === 'crashed') {
        if (s.bird.y + s.bird.radius < GROUND_Y) {
          s.bird.vy += GRAVITY * 1.5;
          s.bird.y += s.bird.vy;
          s.bird.rotation = Math.min(1.5, s.bird.rotation + 0.1);
        } else {
          s.bird.y = GROUND_Y - s.bird.radius;
          if (!s.hasSentScore) {
            s.hasSentScore = true;
            setGameState('crashed');
            setTimeout(() => {
              if (onRoundOver) onRoundOver(s.score);
            }, 850);
          }
        }
      }

      // ----------------------------------------------------
      // DRAW SCENE
      // ----------------------------------------------------
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Sky, Clouds, City, Hills
      drawSkyAndClouds(s);

      // Pipes
      s.pipes.forEach((p) => {
        // Top pipe
        drawPipe(p.x, 0, PIPE_W, p.topH, true);
        // Bottom pipe
        drawPipe(p.x, p.bottomY, PIPE_W, GROUND_Y - p.bottomY, false);
      });

      // Ground
      drawGround(s.groundOffset);

      // Bird
      drawBird(s.bird);

      // White flash on collision
      if (s.flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.flashAlpha})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        s.flashAlpha = Math.max(0, s.flashAlpha - 0.08);
      }

      // Score Display at Top Center (Classic 3D Bold Arcade Font)
      if (s.gameState === 'playing' || s.gameState === 'crashed') {
        ctx.save();
        ctx.font = '900 38px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        // Black outline & shadow
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.strokeText(`${s.score}`, CANVAS_W / 2, 60);
        // White face
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${s.score}`, CANVAS_W / 2, 60);
        ctx.restore();
      }

      // Ready banner if idle
      if (s.gameState === 'idle') {
        ctx.save();
        ctx.font = '900 24px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 5;
        ctx.strokeText('GET READY!', CANVAS_W / 2, 140);
        ctx.fillStyle = '#facc15';
        ctx.fillText('GET READY!', CANVAS_W / 2, 140);

        ctx.font = '700 13px sans-serif';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeText('TAP / SPACE TO FLAP', CANVAS_W / 2, 168);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TAP / SPACE TO FLAP', CANVAS_W / 2, 168);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [roundIndex, onRoundOver]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: CANVAS_W,
        height: CANVAS_H,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        mx: 'auto'
      }}
      onClick={handleFlap}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Top Overlay Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        {/* Round Badge */}
        <Chip
          label={`Round ${roundIndex + 1}/${TOTAL_ROUNDS}`}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: 11,
            bgcolor: 'rgba(15, 23, 42, 0.75)',
            color: '#facc15',
            border: '1px solid rgba(250, 204, 21, 0.4)',
            backdropFilter: 'blur(4px)'
          }}
        />

        {/* Audio Toggle & Score Set Button */}
        <Box sx={{ display: 'flex', gap: 0.5, pointerEvents: 'auto' }}>
          <IconButton
            size="small"
            onClick={toggleSound}
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              color: soundOn ? '#22c55e' : '#94a3b8',
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' }
            }}
          >
            {soundOn ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
          </IconButton>
          <Button
            size="small"
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenScoreSet) onOpenScoreSet();
            }}
            sx={{
              fontSize: 10,
              fontWeight: 800,
              minWidth: 'auto',
              px: 1,
              py: 0.2,
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' }
            }}
          >
            📊 Scores
          </Button>
        </Box>
      </Box>

      {/* Crash overlay banner */}
      {gameState === 'crashed' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(15, 23, 42, 0.88)',
            border: '2px solid #ef4444',
            borderRadius: 3,
            px: 2.5,
            py: 1,
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <Typography sx={{ color: '#ef4444', fontWeight: 900, fontSize: 16 }}>
            💥 CRASHED!
          </Typography>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>
            Round Score: {score}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
//  SCORE SET MODAL FOR FLUFFY JUMP
// ============================================================================
const FluffyScoreSetDialog = ({
  open,
  onClose,
  rounds = [],
  p1TotalScore = 0,
  p2TotalScore = 0,
  player1,
  player2,
  status,
  winnerId,
  isP1,
  onNextRound,
  currentRound = 0
}) => {
  const isFinished = status === 'finished';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, pb: 1, fontSize: 18 }}>
        🐤 Fluffy Jump - Score Set
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        {/* Total Score Comparison */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 800, display: 'block' }}>
              {player1?.username || 'Player 1'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981' }}>
              {p1TotalScore}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Pipes Passed</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.disabled' }}>VS</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 800, display: 'block' }}>
              {player2?.username || 'Player 2'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0ea5e9' }}>
              {p2TotalScore}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Pipes Passed</Typography>
          </Box>
        </Box>

        {/* Round by Round Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.selected' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>Round</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: '#10b981' }}>
                  {player1?.username || 'P1'}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: '#0ea5e9' }}>
                  {player2?.username || 'P2'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3].map((rNum) => {
                const rData = rounds[rNum - 1];
                const p1Score = rData ? rData.p1Score : '-';
                const p2Score = rData ? rData.p2Score : '-';
                let roundWinner = null;
                if (rData) {
                  if (rData.p1Score > rData.p2Score) roundWinner = player1?.username;
                  else if (rData.p2Score > rData.p1Score) roundWinner = player2?.username;
                  else roundWinner = 'Tie';
                }

                return (
                  <TableRow key={rNum} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700 }}>Round {rNum}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{p1Score}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{p2Score}</TableCell>
                    <TableCell align="right">
                      {roundWinner ? (
                        <Chip
                          label={roundWinner}
                          size="small"
                          color={roundWinner === 'Tie' ? 'default' : 'primary'}
                          sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>Pending</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Winner Banner if Finished */}
        {isFinished && (
          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2, mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {winnerId === 'draw' ? '🤝 It is a Tie Match!' : `🏆 ${winnerId === player1?.id ? player1?.username : player2?.username} Wins the Match!`}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button>
          {!isFinished && onNextRound && (
            <Button variant="contained" onClick={onNextRound} sx={{ fontWeight: 700, bgcolor: '#10b981' }}>
              Next Round ▶
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
//  MAIN FLUFFY JUMP GAME COMPONENT
// ============================================================================
export const FluffyJumpGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    turnPlayerId,
    rounds = [],
    currentRound = 0,
    p1TotalScore = 0,
    p2TotalScore = 0,
    p1RoundScore = null,
    p2RoundScore = null,
    phase = 'p1',
    status = 'active',
    winnerId
  } = gameData || {};

  const isP1 = userId === player1?.id;
  const isP2 = userId === player2?.id;
  const isMyTurn = (status === 'active' || (isP1 && phase === 'p1') || (isP2 && (phase === 'p2' || phase === 'p2_challenge'))) && (turnPlayerId === userId || (!turnPlayerId && isP1));
  const myName = isP1 ? player1?.username : player2?.username;
  const opponentName = isP1 ? player2?.username : player1?.username;

  const [scoreSetOpen, setScoreSetOpen] = useState(false);
  const [engineKey, setEngineKey] = useState(0);

  // Remount canvas engine upon turn / round change
  useEffect(() => {
    setEngineKey((prev) => prev + 1);
  }, [phase, currentRound, turnPlayerId]);

  // Round Over Handler (from Canvas Engine)
  const handleRoundOver = useCallback((score) => {
    if (!isMyTurn) return;

    if (phase === 'p1') {
      // Player 1 finished challenge round -> Send challenge to Player 2 with score!
      onSendGameMessage({
        ...gameData,
        status: 'invited',
        phase: 'p2_challenge',
        p1Score: score,
        p1TotalScore: score,
        p1RoundScore: score,
        p2Score: null,
        p2TotalScore: 0,
        turnPlayerId: player2?.id,
        challengerId: player1?.id
      });
    } else if (phase === 'p2' || phase === 'p2_challenge') {
      // Player 2 finished their challenge round -> Calculate match winner & finish
      const p1S = gameData?.p1Score ?? gameData?.p1TotalScore ?? p1TotalScore ?? 0;
      const p2S = score;
      let overallWinner = 'draw';
      if (p2S > p1S) overallWinner = player2?.id;
      else if (p1S > p2S) overallWinner = player1?.id;

      onSendGameMessage({
        ...gameData,
        status: 'finished',
        phase: 'finished',
        p1Score: p1S,
        p2Score: p2S,
        p1TotalScore: p1S,
        p2TotalScore: p2S,
        winnerId: overallWinner,
        turnPlayerId: null
      });
      setScoreSetOpen(true);
    }
  }, [isMyTurn, phase, gameData, p1TotalScore, player1, player2, onSendGameMessage]);

  // Next Round Handler
  const handleNextRound = () => {
    setScoreSetOpen(false);
    onSendGameMessage({
      ...gameData,
      phase: 'p1',
      p1RoundScore: null,
      p2RoundScore: null,
      turnPlayerId: player1?.id
    });
  };

  // Play Again Handler
  const handlePlayAgain = () => {
    onSendGameMessage({
      ...gameData,
      status: 'active',
      rounds: [],
      currentRound: 0,
      p1TotalScore: 0,
      p2TotalScore: 0,
      phase: 'p1',
      p1RoundScore: null,
      p2RoundScore: null,
      winnerId: undefined,
      turnPlayerId: player1?.id
    });
    setScoreSetOpen(false);
  };

  // Status banner text
  const getBannerInfo = () => {
    if (status === 'finished') {
      if (winnerId === 'draw') return { text: '🤝 It is a Draw Match!', color: '#f59e0b' };
      if (winnerId === userId) return { text: '🏆 You Won the Match!', color: '#10b981' };
      const wName = winnerId === player1?.id ? player1?.username : player2?.username;
      return { text: `👑 ${wName} Won the Match!`, color: '#f59e0b' };
    }
    if (phase === 'result') {
      return { text: `Round ${currentRound} Finished! Check Score Set.`, color: '#38bdf8' };
    }
    if (phase === 'p1') {
      if (isP1 && isMyTurn) return { text: `🎮 Your Turn - Tap anywhere to Fly Fluffy!`, color: '#10b981' };
      return { text: `⏳ ${player1?.username || 'Player 1'} is flying...`, color: '#94a3b8' };
    }
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = gameData?.p1Score ?? gameData?.p1TotalScore ?? p1TotalScore ?? 0;
      if (isP2 && isMyTurn) return { text: `🎯 Target to beat: ${target} pts! Tap to Fly!`, color: '#10b981' };
      return { text: `⏳ ${player2?.username || 'Player 2'} is flying...`, color: '#94a3b8' };
    }
    return { text: 'Waiting for game to begin...', color: '#94a3b8' };
  };

  const banner = getBannerInfo();
  const showPlayableCanvas = phase !== 'result' && phase !== 'finished' && isMyTurn;
  const isSpectating = phase !== 'result' && phase !== 'finished' && !isMyTurn;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        mx: 'auto',
        p: 1,
        boxSizing: 'border-box',
        userSelect: 'none'
      }}
    >
      {/* Top Header Card */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          px: 1.2,
          py: 0.8,
          mb: 1,
          borderRadius: 2.5,
          bgcolor: isDarkTheme ? 'rgba(15, 23, 42, 0.75)' : 'rgba(241, 245, 249, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid',
          borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player1?.username || 'Player 1'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#10b981' }}>
            {p1TotalScore} <span style={{ fontSize: 10, fontWeight: 600 }}>pipes</span>
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Chip
            label={`Round ${Math.min(currentRound + 1, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`}
            size="small"
            sx={{ fontWeight: 800, fontSize: 11, bgcolor: 'action.selected', height: 22 }}
          />
          <Typography
            variant="caption"
            onClick={() => setScoreSetOpen(true)}
            sx={{
              display: 'block',
              fontSize: 10,
              fontWeight: 700,
              color: 'primary.main',
              cursor: 'pointer',
              textDecoration: 'underline',
              mt: 0.2
            }}
          >
            View Scores
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player2?.username || 'Player 2'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#0ea5e9' }}>
            {p2TotalScore} <span style={{ fontSize: 10, fontWeight: 600 }}>pipes</span>
          </Typography>
        </Box>
      </Box>

      {/* Status Banner */}
      <Typography
        variant="caption"
        sx={{
          color: banner.color,
          fontWeight: 800,
          textAlign: 'center',
          mb: 1,
          px: 1,
          display: 'block'
        }}
      >
        {banner.text}
      </Typography>

      {/* Main Interactive Canvas Engine (When it is your turn) */}
      {showPlayableCanvas && (
        <FluffyJumpEngine
          key={`engine-${engineKey}-${phase}-${currentRound}`}
          roundIndex={currentRound}
          isMyTurn={true}
          onRoundOver={handleRoundOver}
          onOpenScoreSet={() => setScoreSetOpen(true)}
        />
      )}

      {/* Spectator Screen (When it is opponent's turn) */}
      {isSpectating && (
        <Box
          sx={{
            width: CANVAS_W,
            height: 220,
            borderRadius: 3.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2.5,
            textAlign: 'center',
            bgcolor: isDarkTheme ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.7)',
            border: '2px dashed',
            borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
            maxWidth: '100%'
          }}
        >
          <Typography sx={{ fontSize: 36, mb: 1 }}>
            🐤
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            {phase === 'p1' ? player1?.username : player2?.username} is Flying Fluffy!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
            Waiting for their flight score... You will fly next!
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setScoreSetOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            📊 View Score Set
          </Button>
        </Box>
      )}

      {/* Round Result Summary Screen */}
      {phase === 'result' && (
        <Box
          sx={{
            width: CANVAS_W,
            p: 2.5,
            borderRadius: 3.5,
            bgcolor: isDarkTheme ? 'rgba(15, 23, 42, 0.8)' : 'rgba(241, 245, 249, 0.9)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            🎉 Round {currentRound} Complete!
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                {player1?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#10b981' }}>
                {p1TotalScore} pipes
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'text.disabled' }}>vs</Typography>
            <Box>
              <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 700 }}>
                {player2?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0ea5e9' }}>
                {p2TotalScore} pipes
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={() => setScoreSetOpen(true)}
            sx={{
              mr: 1,
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)'
            }}
          >
            📊 Score Set
          </Button>

          {status === 'active' && isP1 && (
            <Button
              variant="contained"
              onClick={handleNextRound}
              sx={{
                fontWeight: 800,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)'
              }}
            >
              Next Round ▶
            </Button>
          )}

          {status === 'finished' && (
            <Button
              variant="contained"
              onClick={handlePlayAgain}
              sx={{
                fontWeight: 800,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)'
              }}
            >
              Play Again 🔄
            </Button>
          )}
        </Box>
      )}

      {/* Score Set Dialog */}
      <FluffyScoreSetDialog
        open={scoreSetOpen}
        onClose={() => setScoreSetOpen(false)}
        rounds={rounds}
        p1TotalScore={p1TotalScore}
        p2TotalScore={p2TotalScore}
        player1={player1}
        player2={player2}
        status={status}
        winnerId={winnerId}
        isP1={isP1}
        onNextRound={status === 'active' && phase === 'result' && isP1 ? handleNextRound : null}
        currentRound={currentRound}
      />
    </Box>
  );
};

// ============================================================================
//  Initial Game Data Creator
// ============================================================================
export const fluffyJumpInitialData = (player1, player2) => ({
  gameType: 'fluffyjump',
  status: 'active',
  player1,
  player2,
  rounds: [],
  currentRound: 0,
  p1TotalScore: 0,
  p2TotalScore: 0,
  p1Score: null,
  p2Score: null,
  phase: 'p1',
  p1RoundScore: null,
  p2RoundScore: null,
  turnPlayerId: player1?.id,
  challengerId: player1?.id,
  lastMove: null
});
