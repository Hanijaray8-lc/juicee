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
//  POGO BOWLING 3D - 2-PLAYER NEON ARCADE GAME (3 ROUNDS x 10 SECONDS)
//  Faithful recreation matching reference image:
//  - Neon "BOWLING CLUB" lounge alley with glowing triangular sign
//  - 3D perspective polished wooden lane with red/yellow chevron guide arrows
//  - 10 classic bowling pins in triangle formation with red neck rings
//  - Glossy 3D bowling ball with 3 finger holes & realistic rolling physics
//  - Top HUD: Player avatars, 10-pin mini status triangles, and neon score badge
//  - Bottom HUD: Colored bowling balls rack (Blue, Red, Yellow)
//  - 3 Rounds total: 10 seconds per round for Player 1 and Player 2!
//  - Zero-lag Web Audio API sound synthesizer
// ============================================================================

const TOTAL_ROUNDS = 3;
const ROUND_TIME_SECONDS = 10;
const CANVAS_W = 320;
const CANVAS_H = 480;

// Web Audio API Synthesizer for Pogo Bowling
class BowlingAudioSynthesizer {
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
  playRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(130, t + 0.5);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }
  playPinCrash(count = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // White noise / clatter burst
      const freqs = [380, 520, 680, 840, 1100];
      freqs.slice(0, Math.min(count, 5)).forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f + Math.random() * 80, t + i * 0.02);
        gain.gain.setValueAtTime(0.2, t + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.02 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.02);
        osc.stop(t + i * 0.02 + 0.18);
      });
    } catch (e) {}
  }
  playStrike() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.08);
        gain.gain.setValueAtTime(0.25, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.35);
      });
    } catch (e) {}
  }
  playTick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }
  playBuzzer() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch (e) {}
  }
}

const audio = new BowlingAudioSynthesizer();

// Standard 10-Pin Triangle Layout
const INITIAL_PINS = [
  // Row 1 (Headpin)
  { id: 1, row: 1, x: CANVAS_W / 2, y: 175, knocked: false, rot: 0, vx: 0, vy: 0 },
  // Row 2
  { id: 2, row: 2, x: CANVAS_W / 2 - 11, y: 168, knocked: false, rot: 0, vx: 0, vy: 0 },
  { id: 3, row: 2, x: CANVAS_W / 2 + 11, y: 168, knocked: false, rot: 0, vx: 0, vy: 0 },
  // Row 3
  { id: 4, row: 3, x: CANVAS_W / 2 - 22, y: 161, knocked: false, rot: 0, vx: 0, vy: 0 },
  { id: 5, row: 3, x: CANVAS_W / 2, y: 161, knocked: false, rot: 0, vx: 0, vy: 0 },
  { id: 6, row: 3, x: CANVAS_W / 2 + 22, y: 161, knocked: false, rot: 0, vx: 0, vy: 0 },
  // Row 4
  { id: 7, row: 4, x: CANVAS_W / 2 - 33, y: 154, knocked: false, rot: 0, vx: 0, vy: 0 },
  { id: 8, row: 4, x: CANVAS_W / 2 - 11, y: 154, knocked: false, rot: 0, vx: 0, vy: 0 },
  { id: 9, row: 4, x: CANVAS_W / 2 + 11, y: 154, knocked: false, rot: 0, vx: 0, vy: 0 },
  { id: 10, row: 4, x: CANVAS_W / 2 + 33, y: 154, knocked: false, rot: 0, vx: 0, vy: 0 }
];

// ============================================================================
//  CANVAS POGO BOWLING ENGINE
// ============================================================================
const PogoBowlingEngine = ({
  roundIndex = 0,
  bestScore = 300,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  isMyTurn = true,
  onRoundOver,
  onOpenScoreSet
}) => {
  const canvasRef = useRef(null);
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [selectedColor, setSelectedColor] = useState('red');

  const stateRef = useRef({
    score: 0,
    timeLeft: ROUND_TIME_SECONDS,
    isRoundOver: false,
    hasSentScore: false,
    selectedColor: 'red',
    ball: {
      x: CANVAS_W / 2 + 30, // Start slightly to right matching Image 1
      y: 385,
      z: 0, // 0 (near/bottom) to 1.0 (far end at pins)
      vx: 0,
      vy: 0,
      vz: 0,
      spin: 0,
      radius: 20,
      isRolling: false
    },
    pins: JSON.parse(JSON.stringify(INITIAL_PINS)),
    popups: [],
    dragStart: null,
    currentDrag: null,
    lastTime: performance.now()
  });

  const toggleSound = (e) => {
    e?.stopPropagation();
    const next = !soundOn;
    setSoundOn(next);
    audio.enabled = next;
  };

  // Drag / Swipe to Bowl Handlers
  const handlePointerDown = (e) => {
    const s = stateRef.current;
    if (s.isRoundOver || s.ball.isRolling) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    // Check if clicking in the lower lane near the ball
    if (y > 280) {
      s.dragStart = { x, y };
      s.currentDrag = { x, y };
    }
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    if (!s.dragStart || s.ball.isRolling || s.isRoundOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    s.currentDrag = { x, y };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.dragStart || !s.currentDrag || s.ball.isRolling || s.isRoundOver) {
      s.dragStart = null;
      s.currentDrag = null;
      return;
    }

    const dx = s.currentDrag.x - s.dragStart.x;
    const dy = s.dragStart.y - s.currentDrag.y; // Positive upward

    if (dy > 20) {
      s.ball.isRolling = true;
      s.ball.vy = -Math.min(dy * 0.08, 9.0);
      s.ball.vx = dx * 0.04;
      s.ball.spin = dx * 0.005; // Curve hook spin
      s.ball.vz = 0.026;
      audio.playRoll();
    }

    s.dragStart = null;
    s.currentDrag = null;
  };

  // 10-Second Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      stateRef.current.timeLeft -= 1;
      const cur = Math.max(0, stateRef.current.timeLeft);
      setTimeLeft(cur);

      if (cur <= 3 && cur > 0) {
        audio.playTick();
      }

      if (cur <= 0) {
        clearInterval(timer);
        stateRef.current.isRoundOver = true;
        setIsRoundOver(true);
        audio.playBuzzer();
        setTimeout(() => {
          if (!stateRef.current.hasSentScore) {
            stateRef.current.hasSentScore = true;
            if (onRoundOver) onRoundOver(stateRef.current.score);
          }
        }, 1000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onRoundOver]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    stateRef.current.score = 0;
    stateRef.current.timeLeft = ROUND_TIME_SECONDS;
    stateRef.current.isRoundOver = false;
    stateRef.current.hasSentScore = false;
    stateRef.current.pins = JSON.parse(JSON.stringify(INITIAL_PINS));
    setScore(0);
    setTimeLeft(ROUND_TIME_SECONDS);
    setIsRoundOver(false);

    // DRAW NEON BOWLING ALLEY & TRIANGLE SIGN (Matching Image 1)
    const drawAlleyBackground = (time) => {
      // 1. Neon Club Ceiling & Walls
      ctx.fillStyle = '#0a0918';
      ctx.fillRect(0, 0, CANVAS_W, 180);

      // Brick Pillar Backdrop Behind Pins (Matching Image 1)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(CANVAS_W / 2 - 45, 45, 90, 115);
      // Brick mortar lines
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      for (let by = 50; by < 155; by += 10) {
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 - 45, by);
        ctx.lineTo(CANVAS_W / 2 + 45, by);
        ctx.stroke();
      }

      // 2. Large Glowing Triangular Neon Sign: "BOWLING CLUB" (Matching Image 1)
      ctx.save();
      const signY = 68;
      // Glowing Neon Triangle Frame
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, signY + 58);
      ctx.lineTo(CANVAS_W / 2 - 58, signY);
      ctx.lineTo(CANVAS_W / 2 + 58, signY);
      ctx.closePath();
      ctx.stroke();

      // Top Bowling Pin Silhouette & Ball in Sign
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(CANVAS_W / 2 - 18, signY - 14, 8, 18, -0.2, 0, Math.PI * 2);
      ctx.ellipse(CANVAS_W / 2 + 18, signY - 14, 8, 18, 0.2, 0, Math.PI * 2);
      ctx.ellipse(CANVAS_W / 2, signY - 18, 9, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, signY - 4, 14, 0, Math.PI * 2);
      ctx.fill();

      // "BOWLING" Neon Text
      ctx.font = '900 17px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText('BOWLING', CANVAS_W / 2, signY + 24);

      // "CLUB" Neon Text
      ctx.font = '900 15px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillText('CLUB', CANVAS_W / 2, signY + 42);

      // Side Neon Lights & Clocks
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ec4899';
      ctx.beginPath();
      ctx.arc(245, 95, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    // DRAW 3D PERSPECTIVE BOWLING LANE WITH CHEVRON ARROWS (Matching Image 1)
    const drawLane = () => {
      ctx.save();
      const laneNearLeft = 40;
      const laneNearRight = CANVAS_W - 40;
      const laneNearY = 460;

      const laneFarLeft = 115;
      const laneFarRight = CANVAS_W - 115;
      const laneFarY = 175;

      // Outer Gutters with Cyan Neon Glow (Matching Image 1)
      // Left gutter
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(15, laneNearY);
      ctx.lineTo(laneNearLeft, laneNearY);
      ctx.lineTo(laneFarLeft, laneFarY);
      ctx.lineTo(95, laneFarY);
      ctx.closePath();
      ctx.fill();

      // Right gutter
      ctx.beginPath();
      ctx.moveTo(laneNearRight, laneNearY);
      ctx.lineTo(CANVAS_W - 15, laneNearY);
      ctx.lineTo(CANVAS_W - 95, laneFarY);
      ctx.lineTo(laneFarRight, laneFarY);
      ctx.closePath();
      ctx.fill();

      // Cyan Neon Railing Glow
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(laneNearLeft, laneNearY);
      ctx.lineTo(laneFarLeft, laneFarY);
      ctx.moveTo(laneNearRight, laneNearY);
      ctx.lineTo(laneFarRight, laneFarY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Polished Wood Lane (Graduated perspective planks)
      const woodGrad = ctx.createLinearGradient(0, laneFarY, 0, laneNearY);
      woodGrad.addColorStop(0, '#fef3c7');
      woodGrad.addColorStop(0.5, '#fde68a');
      woodGrad.addColorStop(1, '#fef9c3');

      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.moveTo(laneFarLeft, laneFarY);
      ctx.lineTo(laneFarRight, laneFarY);
      ctx.lineTo(laneNearRight, laneNearY);
      ctx.lineTo(laneNearLeft, laneNearY);
      ctx.closePath();
      ctx.fill();

      // Chevron Guide Arrows Painted on the Lane (Matching Image 1)
      const numChevrons = 12;
      for (let i = 0; i < numChevrons; i++) {
        const t = i / numChevrons;
        const cy = laneFarY + 30 + t * (laneNearY - laneFarY - 90);
        const cw = 14 + t * 24;
        const color = i % 2 === 0 ? '#ef4444' : '#f59e0b';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 + 10, cy);
        ctx.lineTo(CANVAS_W / 2 + 10 + cw / 2, cy - 8);
        ctx.lineTo(CANVAS_W / 2 + 10 + cw, cy);
        ctx.lineTo(CANVAS_W / 2 + 10 + cw / 2, cy + 4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    // DRAW 10 BOWLING PINS (Matching Image 1)
    const drawPins = (pins) => {
      // Sort pins by Y to render back row first
      const sorted = [...pins].sort((a, b) => a.y - b.y);

      sorted.forEach((pin) => {
        ctx.save();
        ctx.translate(pin.x, pin.y);
        ctx.rotate(pin.rot);

        // Pin drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 6, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!pin.knocked) {
          // Upright Pin Body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -12, 3.5, 0, Math.PI * 2); // Head
          ctx.ellipse(0, -2, 5, 8, 0, 0, Math.PI * 2); // Belly
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Double Red Neck Stripes (Matching Image 1)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-3, -10, 6, 1.8);
          ctx.fillRect(-3.5, -7, 7, 1.8);
        } else {
          // Knocked Pin Tumbling
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(0, -6, 3, 0, Math.PI * 2);
          ctx.ellipse(0, 0, 4, 7, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });
    };

    // DRAW GLOSSY 3D BOWLING BALL (Matching Image 1)
    const drawBall = (s) => {
      ctx.save();
      const b = s.ball;

      // 3D perspective scale: 1.0 (near) -> 0.4 (at pins)
      const currentScale = Math.max(0.38, 1.0 - b.z * 0.62);
      const drawR = b.radius * currentScale;

      // Drop shadow on lane
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + drawR * 0.85, drawR * 1.05, drawR * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball Color & Metallic Specular Gradient
      let baseColor = '#dc2626';
      let lightColor = '#f87171';
      let darkColor = '#7f1d1d';

      if (s.selectedColor === 'blue') {
        baseColor = '#2563eb';
        lightColor = '#60a5fa';
        darkColor = '#1e3a8a';
      } else if (s.selectedColor === 'yellow') {
        baseColor = '#eab308';
        lightColor = '#fef08a';
        darkColor = '#854d0e';
      }

      const ballGrad = ctx.createRadialGradient(
        b.x - drawR * 0.35,
        b.y - drawR * 0.35,
        drawR * 0.1,
        b.x,
        b.y,
        drawR
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.3, lightColor);
      ballGrad.addColorStop(0.75, baseColor);
      ballGrad.addColorStop(1, darkColor);

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, drawR, 0, Math.PI * 2);
      ctx.fill();

      // 3 Dark Finger Holes (Matching Image 1)
      ctx.fillStyle = '#0f172a';
      const holeR = Math.max(1.5, 3.2 * currentScale);
      ctx.beginPath();
      ctx.arc(b.x - drawR * 0.2, b.y - drawR * 0.15, holeR, 0, Math.PI * 2);
      ctx.arc(b.x + drawR * 0.2, b.y - drawR * 0.15, holeR, 0, Math.PI * 2);
      ctx.arc(b.x, b.y + drawR * 0.15, holeR * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Drag Aim Guide Line
      if (s.dragStart && s.currentDrag && !b.isRolling) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + (s.currentDrag.x - s.dragStart.x) * 0.8, b.y - 70);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    };

    // DRAW TOP HUD WITH PLAYER CARDS & 10 MINI PIN ICONS (Matching Image 1)
    const drawHUD = (s) => {
      ctx.save();

      // --- Left Player Card (Matching Image 1) ---
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(14, 14, 46, 46, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '24px sans-serif';
      ctx.fillText('👤', 25, 46);

      // Mini 10-pin triangle indicator for Player 1
      const drawMiniPins = (startX, startY) => {
        ctx.fillStyle = '#22c55e';
        const pinOffsets = [
          [10, 0],
          [6, 4], [14, 4],
          [2, 8], [10, 8], [18, 8],
          [-2, 12], [6, 12], [14, 12], [22, 12]
        ];
        pinOffsets.forEach(([px, py], idx) => {
          const isKnocked = s.pins[idx]?.knocked;
          ctx.fillStyle = isKnocked ? '#475569' : '#22c55e';
          ctx.beginPath();
          ctx.arc(startX + px, startY + py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      };
      drawMiniPins(27, 65);

      // --- Right Player Card (Matching Image 1) ---
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(CANVAS_W - 60, 14, 46, 46, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '24px sans-serif';
      ctx.fillText('🕶️', CANVAS_W - 49, 46);
      drawMiniPins(CANVAS_W - 47, 65);

      // --- Top Center Neon Score Diamond & Timer (Matching Image 1) ---
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.roundRect(CANVAS_W / 2 - 28, 12, 56, 22, 6);
      ctx.fill();

      ctx.font = '900 14px sans-serif';
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.score}`, CANVAS_W / 2, 28);

      // 10s Timer Badge
      const timerBg = s.timeLeft <= 3 ? '#ef4444' : '#f59e0b';
      ctx.fillStyle = timerBg;
      ctx.beginPath();
      ctx.roundRect(CANVAS_W / 2 - 34, 38, 68, 20, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px sans-serif';
      ctx.fillText(`⏱️ ${s.timeLeft}s`, CANVAS_W / 2, 52);

      // --- Bottom-Left Colored Ball Selector Rack (Matching Image 1) ---
      const rackX = 14;
      const rackY = CANVAS_H - 42;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(rackX, rackY, 82, 32, 16);
      ctx.fill();
      ctx.stroke();

      // Blue, Red, Yellow mini balls
      const colors = [
        { name: 'blue', color: '#2563eb', x: rackX + 16 },
        { name: 'red', color: '#ef4444', x: rackX + 41 },
        { name: 'yellow', color: '#facc15', x: rackX + 66 }
      ];
      colors.forEach((c) => {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, rackY + 16, 9, 0, Math.PI * 2);
        ctx.fill();
        if (s.selectedColor === c.name) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      ctx.restore();
    };

    // DRAW POPUPS (STRIKE! / SPARE! / +10)
    const drawPopups = (s) => {
      s.popups.forEach((pop) => {
        ctx.save();
        ctx.font = '900 24px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = pop.color || '#facc15';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.globalAlpha = pop.alpha;
        ctx.strokeText(pop.text, pop.x, pop.y);
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });
    };

    // MAIN ANIMATION LOOP
    const render = (time) => {
      const s = stateRef.current;
      const dt = Math.min((time - s.lastTime) / 1000, 0.05);
      s.lastTime = time;

      // Update Rolling Ball Physics
      if (s.ball.isRolling) {
        s.ball.y += s.ball.vy;
        s.ball.x += s.ball.vx;
        s.ball.z += s.ball.vz;
        s.ball.vx += s.ball.spin; // Curve hook

        // Check Pin Collisions
        if (s.ball.y <= 185 && s.ball.y >= 145) {
          let newlyKnocked = 0;
          s.pins.forEach((pin) => {
            if (!pin.knocked) {
              const dist = Math.hypot(s.ball.x - pin.x, s.ball.y - pin.y);
              if (dist < 18) {
                pin.knocked = true;
                pin.rot = (Math.random() - 0.5) * 1.5;
                pin.vx = (Math.random() - 0.5) * 4;
                pin.vy = -Math.random() * 2;
                newlyKnocked += 1;
              }
            }
          });

          if (newlyKnocked > 0) {
            const addedScore = newlyKnocked * 10;
            s.score += addedScore;
            setScore(s.score);
            audio.playPinCrash(newlyKnocked);

            // Check Strike (All 10 knocked down)
            if (s.pins.every((p) => p.knocked)) {
              s.score += 50; // Strike Bonus
              setScore(s.score);
              audio.playStrike();
              s.popups.push({
                x: CANVAS_W / 2,
                y: 190,
                text: '⚡ STRIKE! +150',
                color: '#facc15',
                alpha: 1.0,
                life: 1.2
              });
            } else {
              s.popups.push({
                x: CANVAS_W / 2,
                y: 190,
                text: `+${addedScore}`,
                color: '#38bdf8',
                alpha: 1.0,
                life: 0.9
              });
            }
          }
        }

        // Reset Ball after roll finishes
        if (s.ball.y < 135 || s.ball.x < 30 || s.ball.x > CANVAS_W - 30) {
          s.ball.isRolling = false;
          s.ball.x = CANVAS_W / 2 + 30;
          s.ball.y = 385;
          s.ball.z = 0;
          s.ball.vx = 0;
          s.ball.vy = 0;
          s.ball.vz = 0;

          // If all pins knocked or after 2 rolls, reset pin deck
          if (s.pins.every((p) => p.knocked)) {
            setTimeout(() => {
              s.pins = JSON.parse(JSON.stringify(INITIAL_PINS));
            }, 600);
          }
        }
      }

      // Update Popups
      for (let i = s.popups.length - 1; i >= 0; i--) {
        const pop = s.popups[i];
        pop.y -= 22 * dt;
        pop.life -= dt;
        pop.alpha = pop.life;
        if (pop.life <= 0) s.popups.splice(i, 1);
      }

      // ----------------------------------------------------
      // DRAW CANVAS SCENE
      // ----------------------------------------------------
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // 1. Neon Alley & Sign
      drawAlleyBackground(time);

      // 2. 3D Perspective Lane & Chevrons
      drawLane();

      // 3. 10 Bowling Pins
      drawPins(s.pins);

      // 4. Glossy Bowling Ball
      drawBall(s);

      // 5. Popups & FX
      drawPopups(s);

      // 6. Top & Bottom HUD
      drawHUD(s);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [roundIndex, bestScore, onRoundOver]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: CANVAS_W,
        height: CANVAS_H,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
        cursor: 'grab',
        touchAction: 'none',
        mx: 'auto',
        userSelect: 'none'
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onClick={(e) => {
        // Check ball color selection clicks
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const clientX = e.clientX;
        const clientY = e.clientY;
        const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
        const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

        if (y > CANVAS_H - 46 && x < 100) {
          if (x < 40) {
            setSelectedColor('blue');
            stateRef.current.selectedColor = 'blue';
          } else if (x < 65) {
            setSelectedColor('red');
            stateRef.current.selectedColor = 'red';
          } else {
            setSelectedColor('yellow');
            stateRef.current.selectedColor = 'yellow';
          }
        }
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Top Floating Controls */}
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
        <Chip
          label={`Round ${roundIndex + 1}/${TOTAL_ROUNDS}`}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: 10,
            bgcolor: 'rgba(15, 23, 42, 0.75)',
            color: '#ec4899',
            border: '1px solid rgba(236, 72, 153, 0.4)',
            backdropFilter: 'blur(4px)'
          }}
        />

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
              color: '#ec4899',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' }
            }}
          >
            📊 Scores
          </Button>
        </Box>
      </Box>

      {/* Round Finished Banner */}
      {isRoundOver && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid #ec4899',
            borderRadius: 3,
            px: 2.5,
            py: 1.2,
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <Typography sx={{ color: '#ec4899', fontWeight: 900, fontSize: 16 }}>
            ⏱️ TIME UP!
          </Typography>
          <Typography sx={{ color: '#facc15', fontWeight: 800, fontSize: 13 }}>
            Round Score: {score} pts
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
//  SCORE SET MODAL FOR POGO BOWLING
// ============================================================================
const BowlingScoreSetDialog = ({
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
        🎳 Pogo Bowling - Score Set
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        {/* Total Score Comparison */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#ec4899', fontWeight: 800, display: 'block' }}>
              {player1?.username || 'Player 1'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#ec4899' }}>
              {p1TotalScore}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Points</Typography>
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
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Points</Typography>
          </Box>
        </Box>

        {/* Round by Round Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.selected' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>Round (10s)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: '#ec4899' }}>
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
            <Button variant="contained" onClick={onNextRound} sx={{ fontWeight: 700, bgcolor: '#ec4899' }}>
              Next Round ▶
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
//  MAIN POGO BOWLING GAME COMPONENT
// ============================================================================
export const PogoBowlingGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
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
      if (winnerId === userId) return { text: '🏆 You Won the Match!', color: '#ec4899' };
      const wName = winnerId === player1?.id ? player1?.username : player2?.username;
      return { text: `👑 ${wName} Won the Match!`, color: '#f59e0b' };
    }
    if (phase === 'result') {
      return { text: `Round ${currentRound} Finished! Check Score Set.`, color: '#38bdf8' };
    }
    if (phase === 'p1') {
      if (isP1 && isMyTurn) return { text: `🎮 Your Turn - Bowl the pogo ball & strike pins!`, color: '#ec4899' };
      return { text: `⏳ ${player1?.username || 'Player 1'} is bowling...`, color: '#94a3b8' };
    }
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = gameData?.p1Score ?? gameData?.p1TotalScore ?? p1TotalScore ?? 0;
      if (isP2 && isMyTurn) return { text: `🎯 Target to beat: ${target} pins! Bowl to score!`, color: '#ec4899' };
      return { text: `⏳ ${player2?.username || 'Player 2'} is bowling...`, color: '#94a3b8' };
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
          <Typography variant="caption" sx={{ color: '#ec4899', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player1?.username || 'Player 1'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#ec4899' }}>
            {p1TotalScore} <span style={{ fontSize: 10, fontWeight: 600 }}>pts</span>
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
            {p2TotalScore} <span style={{ fontSize: 10, fontWeight: 600 }}>pts</span>
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
        <PogoBowlingEngine
          key={`engine-${engineKey}-${phase}-${currentRound}`}
          roundIndex={currentRound}
          isMyTurn={true}
          bestScore={Math.max(p1TotalScore, p2TotalScore, 300)}
          player1Name={player1?.username || 'P1'}
          player2Name={player2?.username || 'P2'}
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
            🎳
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            {phase === 'p1' ? player1?.username : player2?.username} is Bowling Strikes!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
            10-second bowling clock running... You will roll next!
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
              <Typography variant="caption" sx={{ color: '#ec4899', fontWeight: 700 }}>
                {player1?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#ec4899' }}>
                {p1TotalScore} pts
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'text.disabled' }}>vs</Typography>
            <Box>
              <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 700 }}>
                {player2?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0ea5e9' }}>
                {p2TotalScore} pts
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
                background: 'linear-gradient(135deg, #ec4899, #db2777)'
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
      <BowlingScoreSetDialog
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
export const pogoBowlingInitialData = (player1, player2) => ({
  gameType: 'pogobowling',
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
