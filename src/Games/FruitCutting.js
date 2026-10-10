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
//  FRUIT CUTTER / NINJA - 2-PLAYER ARCADE SLICE GAME (3 ROUNDS)
//  Faithful recreation matching reference image:
//  - Wooden dojo plank background with authentic carved sword scratch marks
//  - Top-left HUD: Watermelon icon, golden 3D score, and "BEST: 189" display
//  - Top-right HUD: 3 Strikes (Red ❌ for strikes, Blue ✖️ for remaining lives)
//  - Blazing fiery golden blade trail with sparkling stars & particle glow
//  - Realistic fruits: Watermelon, Pineapple, Coconut, Banana, Apple, Lime/Orange, Bomb
//  - Slicing splits fruit in half with juice splatters & persistent wood stains
//  - "7 FRUIT COMBO +7" glowing combo banner for multi-fruit slices
//  - 3 Rounds total: Player 1 vs Player 2, highest total score wins!
//  - Zero-lag Web Audio API sound synthesizer
// ============================================================================

const TOTAL_ROUNDS = 3;
const CANVAS_W = 340;
const CANVAS_H = 420;
const MAX_STRIKES = 3;

// --- Web Audio Synthesizer for Fruit Ninja Audio FX ---
class FruitNinjaAudioSynthesizer {
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
  playWhoosh() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }
  playSlice() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // High frequency blade slash
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(1200, t);
      osc1.frequency.exponentialRampToValueAtTime(300, t + 0.08);
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.08);

      // Low juicy squelch
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(280, t);
      osc2.frequency.exponentialRampToValueAtTime(90, t + 0.12);
      gain2.gain.setValueAtTime(0.25, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.12);
    } catch (e) {}
  }
  playCombo() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.06;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.2, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
        osc.start(st);
        osc.stop(st + 0.18);
      });
    } catch (e) {}
  }
  playBombExplosion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }
  playStrike() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.setValueAtTime(95, t + 0.1);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }
}

const audio = new FruitNinjaAudioSynthesizer();

// FRUIT DEFINITIONS (Matching Image 2)
const FRUIT_TYPES = [
  {
    type: 'watermelon',
    radius: 34,
    color: '#16a34a',
    fleshColor: '#ef4444',
    seedColor: '#1e293b',
    splatterColor: '#ef4444',
    points: 1
  },
  {
    type: 'pineapple',
    radius: 32,
    color: '#ca8a04',
    fleshColor: '#facc15',
    splatterColor: '#eab308',
    points: 1
  },
  {
    type: 'coconut',
    radius: 30,
    color: '#78350f',
    fleshColor: '#ffffff',
    splatterColor: '#f1f5f9',
    points: 1
  },
  {
    type: 'banana',
    radius: 28,
    color: '#facc15',
    fleshColor: '#fef08a',
    splatterColor: '#fef08a',
    points: 1
  },
  {
    type: 'apple',
    radius: 28,
    color: '#dc2626',
    fleshColor: '#fee2e2',
    splatterColor: '#ef4444',
    points: 1
  },
  {
    type: 'lime',
    radius: 26,
    color: '#65a30d',
    fleshColor: '#84cc16',
    splatterColor: '#84cc16',
    points: 1
  },
  {
    type: 'bomb',
    radius: 26,
    color: '#1e293b',
    isBomb: true,
    points: 0
  }
];

// Helper: Line Segment to Circle Collision for accurate slicing
function segmentIntersectsCircle(p1, p2, c, r) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const distSq = (p1.x - c.x) * (p1.x - c.x) + (p1.y - c.y) * (p1.y - c.y);
    return distSq <= r * r;
  }
  let t = ((c.x - p1.x) * dx + (c.y - p1.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nearestX = p1.x + t * dx;
  const nearestY = p1.y + t * dy;
  const distSq = (nearestX - c.x) * (nearestX - c.x) + (nearestY - c.y) * (nearestY - c.y);
  return distSq <= r * r;
}

// ============================================================================
//  CANVAS FRUIT CUTTER ENGINE
// ============================================================================
const FruitCutterEngine = ({
  roundIndex = 0,
  bestScore = 189,
  isMyTurn = true,
  onRoundOver,
  onOpenScoreSet
}) => {
  const canvasRef = useRef(null);
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const onRoundOverRef = useRef(onRoundOver);
  useEffect(() => {
    onRoundOverRef.current = onRoundOver;
  });

  const stateRef = useRef({
    score: 0,
    strikes: 0,
    isGameOver: false,
    fruits: [],
    halfFruits: [],
    particles: [],
    splatters: [],
    bladePoints: [],
    comboAlerts: [],
    isSwiping: false,
    currentSwipeSlices: 0,
    nextSpawnTime: 1.0,
    gameTime: 0,
    lastTime: performance.now(),
    flashAlpha: 0,
    hasFinishedRound: false
  });

  const toggleSound = (e) => {
    e?.stopPropagation();
    const next = !soundOn;
    setSoundOn(next);
    audio.enabled = next;
  };

  // Touch / Mouse Swipe Handlers
  const handlePointerDown = (e) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    s.isSwiping = true;
    s.currentSwipeSlices = 0;
    s.bladePoints = [{ x, y, time: performance.now() }];
    audio.playWhoosh();
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    if (!s.isSwiping || s.isGameOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    const now = performance.now();
    const lastP = s.bladePoints[s.bladePoints.length - 1];
    s.bladePoints.push({ x, y, time: now });

    // Slice check along the new blade segment
    if (lastP) {
      sliceFruitCheck(lastP, { x, y });
    }
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    s.isSwiping = false;

    // Trigger combo if >= 3 fruits were sliced in this single swipe
    if (s.currentSwipeSlices >= 3) {
      const bonus = s.currentSwipeSlices;
      s.score += bonus;
      setScore(s.score);
      audio.playCombo();

      // Find average position of sliced fruits or center
      s.comboAlerts.push({
        text: `${s.currentSwipeSlices} FRUIT COMBO`,
        bonusText: `+${bonus}`,
        x: CANVAS_W / 2 + (Math.random() * 40 - 20),
        y: 200 + (Math.random() * 40 - 20),
        opacity: 1.0,
        scale: 1.3,
        timer: 1.5
      });
    }
    s.currentSwipeSlices = 0;
  };

  // Slice Fruit Check against line segment
  const sliceFruitCheck = (p1, p2) => {
    const s = stateRef.current;
    if (s.isGameOver) return;

    for (let i = s.fruits.length - 1; i >= 0; i--) {
      const f = s.fruits[i];
      if (f.sliced) continue;

      if (segmentIntersectsCircle(p1, p2, { x: f.x, y: f.y }, f.radius)) {
        f.sliced = true;

        if (f.isBomb) {
          // HIT BOMB! Instant screen shake, flash, and 3 strikes
          audio.playBombExplosion();
          s.flashAlpha = 0.95;
          s.strikes = MAX_STRIKES;
          setStrikes(MAX_STRIKES);
          s.isGameOver = true;
          setIsGameOver(true);
          s.fruits.splice(i, 1);
          triggerRoundEnd();
          return;
        }

        // Fruit sliced successfully
        s.currentSwipeSlices += 1;
        s.score += f.points;
        setScore(s.score);
        audio.playSlice();

        // Calculate slice angle
        const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        // Spawn two half fruits flying apart
        const speed = 2.8 + Math.random() * 1.5;
        const perpAngle = sliceAngle + Math.PI / 2;

        s.halfFruits.push({
          type: f.type,
          x: f.x,
          y: f.y,
          vx: f.vx + Math.cos(perpAngle) * speed,
          vy: f.vy + Math.sin(perpAngle) * speed - 1,
          radius: f.radius,
          rotation: f.rotation,
          rotSpeed: 0.12,
          half: 1,
          sliceAngle,
          color: f.color,
          fleshColor: f.fleshColor,
          seedColor: f.seedColor
        });

        s.halfFruits.push({
          type: f.type,
          x: f.x,
          y: f.y,
          vx: f.vx - Math.cos(perpAngle) * speed,
          vy: f.vy - Math.sin(perpAngle) * speed - 1,
          radius: f.radius,
          rotation: f.rotation,
          rotSpeed: -0.12,
          half: 2,
          sliceAngle,
          color: f.color,
          fleshColor: f.fleshColor,
          seedColor: f.seedColor
        });

        // Spawn 16 juice splatter particles
        for (let j = 0; j < 16; j++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pSpeed = 1.5 + Math.random() * 4.5;
          s.particles.push({
            x: f.x,
            y: f.y,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed - 1,
            radius: 2 + Math.random() * 3.5,
            color: f.splatterColor,
            alpha: 1.0,
            life: 0.6 + Math.random() * 0.4
          });
        }

        // Add persistent juice splatter stain on the wooden wall
        s.splatters.push({
          x: f.x,
          y: f.y,
          radius: f.radius * (1.2 + Math.random() * 0.6),
          color: f.splatterColor,
          alpha: 0.45,
          fading: false
        });
        if (s.splatters.length > 25) {
          s.splatters.shift();
        }

        // Remove sliced fruit
        s.fruits.splice(i, 1);
      }
    }
  };

  // Trigger End of Round
  const triggerRoundEnd = () => {
    const s = stateRef.current;
    if (s.hasFinishedRound) return;
    s.hasFinishedRound = true;
    const finalScore = Number(s.score) || 0;
    setTimeout(() => {
      if (onRoundOverRef.current) onRoundOverRef.current(finalScore);
    }, 1100);
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    stateRef.current = {
      score: 0,
      strikes: 0,
      isGameOver: false,
      fruits: [],
      halfFruits: [],
      particles: [],
      splatters: [],
      bladePoints: [],
      comboAlerts: [],
      isSwiping: false,
      currentSwipeSlices: 0,
      nextSpawnTime: 0.8,
      gameTime: 0,
      lastTime: performance.now(),
      flashAlpha: 0,
      hasFinishedRound: false
    };
    setScore(0);
    setStrikes(0);
    setIsGameOver(false);

    // DRAW WOODEN BACKGROUND & KNIFE SCRATCH MARKS (Matching Image 2)
    const drawWoodBackground = () => {
      // 1. Wood Planks
      const plankW = CANVAS_W / 4;
      for (let i = 0; i < 4; i++) {
        const x = i * plankW;
        const grad = ctx.createLinearGradient(x, 0, x + plankW, 0);
        grad.addColorStop(0, '#2d1810');
        grad.addColorStop(0.3, '#3c2216');
        grad.addColorStop(0.7, '#351d13');
        grad.addColorStop(1, '#23120b');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, plankW, CANVAS_H);

        // Plank seam shadow
        ctx.fillStyle = '#140804';
        ctx.fillRect(x + plankW - 2, 0, 2, CANVAS_H);
      }

      // 2. Subtle Wood Grain Lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      for (let y = 15; y < CANVAS_H; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(CANVAS_W * 0.3, y + 4, CANVAS_W * 0.7, y - 4, CANVAS_W, y);
        ctx.stroke();
      }

      // 3. Authentic Carved Sword Slash Marks on the Wood (Matching Image 2)
      ctx.save();
      const scratches = [
        { x1: 20, y1: 80, x2: 120, y2: 140 },
        { x1: 180, y1: 50, x2: 290, y2: 130 },
        { x1: 240, y1: 100, x2: 320, y2: 170 },
        { x1: 40, y1: 220, x2: 160, y2: 310 },
        { x1: 210, y1: 260, x2: 310, y2: 370 },
        { x1: 15, y1: 360, x2: 140, y2: 440 }
      ];
      scratches.forEach((sc) => {
        // Deep shadow groove
        ctx.strokeStyle = 'rgba(15, 6, 2, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sc.x1, sc.y1);
        ctx.lineTo(sc.x2, sc.y2);
        ctx.stroke();

        // Highlight carved rim
        ctx.strokeStyle = 'rgba(255, 180, 120, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sc.x1 + 1, sc.y1 + 1);
        ctx.lineTo(sc.x2 + 1, sc.y2 + 1);
        ctx.stroke();
      });
      ctx.restore();

      // 4. Draw Persistent Fruit Juice Splatters on Wood
      stateRef.current.splatters.forEach((sp) => {
        ctx.save();
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    };

    // DRAW WHOLE FRUITS WITH RICH DETAIL
    const drawWholeFruit = (f) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);

      if (f.type === 'watermelon') {
        // Green striped watermelon
        const grad = ctx.createRadialGradient(-6, -6, 4, 0, 0, f.radius);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(0.7, '#15803d');
        grad.addColorStop(1, '#14532d');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dark green jagged stripes
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 3.5;
        for (let a = -Math.PI / 2; a < Math.PI / 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.arc(0, 0, f.radius - 2, a - 0.2, a + 0.2);
          ctx.stroke();
        }
      } else if (f.type === 'pineapple') {
        // Golden textured pineapple with green spiky crown
        const grad = ctx.createRadialGradient(-4, -4, 4, 0, 0, f.radius);
        grad.addColorStop(0, '#facc15');
        grad.addColorStop(0.7, '#ca8a04');
        grad.addColorStop(1, '#78350f');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 4, f.radius * 0.85, f.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pineapple crown leaves
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(-12, -f.radius + 4);
        ctx.lineTo(-18, -f.radius - 16);
        ctx.lineTo(-4, -f.radius - 6);
        ctx.lineTo(0, -f.radius - 20);
        ctx.lineTo(6, -f.radius - 6);
        ctx.lineTo(18, -f.radius - 16);
        ctx.lineTo(12, -f.radius + 4);
        ctx.closePath();
        ctx.fill();
      } else if (f.type === 'coconut') {
        // Hairy brown coconut
        const grad = ctx.createRadialGradient(-5, -5, 4, 0, 0, f.radius);
        grad.addColorStop(0, '#a16207');
        grad.addColorStop(0.75, '#78350f');
        grad.addColorStop(1, '#451a03');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        ctx.fill();
        // Coconut 3 eye dots
        ctx.fillStyle = '#1e0c03';
        ctx.beginPath();
        ctx.arc(-5, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(0, 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'banana') {
        // Vibrant curved yellow banana
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 0, f.radius * 1.3, f.radius * 0.45, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Green stem & brown tip
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(-f.radius * 1.3 - 3, -4, 6, 6);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(f.radius * 1.3 - 2, -2, 5, 4);
      } else if (f.type === 'apple') {
        // Glossy red apple with highlight
        const grad = ctx.createRadialGradient(-6, -6, 3, 0, 0, f.radius);
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(0.65, '#dc2626');
        grad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-2, -f.radius - 6, 4, 8);
      } else if (f.type === 'lime') {
        // Bright citrus lime/orange
        const grad = ctx.createRadialGradient(-4, -4, 3, 0, 0, f.radius);
        grad.addColorStop(0, '#bef264');
        grad.addColorStop(0.7, '#65a30d');
        grad.addColorStop(1, '#365314');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'bomb') {
        // Cast-iron black bomb with burning fuse
        const grad = ctx.createRadialGradient(-6, -6, 3, 0, 0, f.radius);
        grad.addColorStop(0, '#64748b');
        grad.addColorStop(0.5, '#1e293b');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        ctx.fill();
        // Brass cap
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-4, -f.radius - 5, 8, 5);
        // Burning fuse line
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -f.radius - 5);
        ctx.quadraticCurveTo(8, -f.radius - 12, 12, -f.radius - 18);
        ctx.stroke();
        // Fiery fuse spark
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(12, -f.radius - 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(12, -f.radius - 18, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // DRAW SLICED HALF FRUITS
    const drawHalfFruit = (hf) => {
      ctx.save();
      ctx.translate(hf.x, hf.y);
      ctx.rotate(hf.rotation);

      // Clip half-circle along slice line
      ctx.beginPath();
      if (hf.half === 1) {
        ctx.arc(0, 0, hf.radius, hf.sliceAngle, hf.sliceAngle + Math.PI);
      } else {
        ctx.arc(0, 0, hf.radius, hf.sliceAngle + Math.PI, hf.sliceAngle + Math.PI * 2);
      }
      ctx.closePath();
      ctx.fillStyle = hf.fleshColor;
      ctx.fill();
      ctx.strokeStyle = hf.color;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Sliced seeds for watermelon
      if (hf.type === 'watermelon') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(6, 4, 2, 0, Math.PI * 2);
        ctx.arc(-8, -2, 2, 0, Math.PI * 2);
        ctx.arc(0, 8, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // DRAW BLAZING FIERY ENERGY BLADE TRAIL WITH SPARKLING STARS (Matching Image 2)
    const drawBladeTrail = (points) => {
      if (points.length < 2) return;
      const now = performance.now();
      const validPoints = points.filter((p) => now - p.time < 220);
      if (validPoints.length < 2) return;

      ctx.save();
      // 1. Fiery Outer Glow Aura
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#f97316';

      for (let i = 1; i < validPoints.length; i++) {
        const p1 = validPoints[i - 1];
        const p2 = validPoints[i];
        const progress = i / validPoints.length; // 0 (tail) -> 1 (head)
        const width = progress * 14;

        ctx.strokeStyle = 'rgba(255, 120, 0, 0.75)';
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // 2. Pure White-Yellow Blazing Core
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#fef08a';
      for (let i = 1; i < validPoints.length; i++) {
        const p1 = validPoints[i - 1];
        const p2 = validPoints[i];
        const progress = i / validPoints.length;
        const width = progress * 6;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // 3. Sparkling Golden 4-Point Stars along the Blade Trail (Matching Image 2)
      validPoints.forEach((p, idx) => {
        if (idx % 2 === 0) {
          const starSize = 5 + (idx / validPoints.length) * 5;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(0, -starSize);
          ctx.quadraticCurveTo(0, 0, starSize, 0);
          ctx.quadraticCurveTo(0, 0, 0, starSize);
          ctx.quadraticCurveTo(0, 0, -starSize, 0);
          ctx.quadraticCurveTo(0, 0, 0, -starSize);
          ctx.fill();
          ctx.restore();
        }
      });

      ctx.restore();
    };

    // DRAW COMBO POPUP BANNER (e.g. "7 FRUIT COMBO +7" exactly like Image 2!)
    const drawComboAlerts = (alerts) => {
      alerts.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        ctx.globalAlpha = Math.max(0, c.opacity);

        ctx.textAlign = 'center';
        ctx.font = '900 24px "Impact", "Arial Black", sans-serif';

        // Outer glow & bevel shadow
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#431407';
        ctx.lineWidth = 5;
        ctx.strokeText(c.text, 0, 0);

        // Radiant golden face
        const textGrad = ctx.createLinearGradient(0, -18, 0, 8);
        textGrad.addColorStop(0, '#fef08a');
        textGrad.addColorStop(0.4, '#facc15');
        textGrad.addColorStop(1, '#ea580c');
        ctx.fillStyle = textGrad;
        ctx.fillText(c.text, 0, 0);

        // Bonus points text (+7)
        ctx.font = '900 36px "Impact", "Arial Black", sans-serif';
        ctx.strokeText(c.bonusText, 0, 36);
        ctx.fillText(c.bonusText, 0, 36);

        ctx.restore();
      });
    };

    // DRAW TOP HUD (Matching Image 2: Sliced Watermelon + Score + BEST + 3 Strikes)
    const drawHUD = (s) => {
      ctx.save();

      // --- Top Left: Watermelon Slice + Golden 3D Score + BEST ---
      // Watermelon Icon
      ctx.font = '32px sans-serif';
      ctx.fillText('🍉', 14, 46);

      // Score in big bold 3D golden numbers
      ctx.font = '900 42px "Impact", "Arial Black", sans-serif';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 6;
      ctx.strokeText(`${s.score}`, 58, 48);

      const scoreGrad = ctx.createLinearGradient(58, 16, 58, 48);
      scoreGrad.addColorStop(0, '#fef08a');
      scoreGrad.addColorStop(0.5, '#facc15');
      scoreGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = scoreGrad;
      ctx.fillText(`${s.score}`, 58, 48);

      // "BEST: 189" underneath
      ctx.font = '900 13px "Impact", "Arial Black", sans-serif';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.strokeText(`BEST: ${Math.max(bestScore, s.score)}`, 58, 66);
      ctx.fillStyle = '#facc15';
      ctx.fillText(`BEST: ${Math.max(bestScore, s.score)}`, 58, 66);

      // --- Top Right: 3 Strikes (Red ❌ for strikes, Blue ✖️ for remaining lives from Image 2) ---
      const strikeX = CANVAS_W - 85;
      for (let i = 0; i < MAX_STRIKES; i++) {
        const x = strikeX + i * 26;
        if (i < s.strikes) {
          // Incurred strike: Glowing Red ❌
          ctx.font = '900 24px sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.fillText('❌', x, 40);
        } else {
          // Remaining lives: Blue ✖️ (Matching Image 2)
          ctx.font = '900 24px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 6;
          ctx.fillText('✖️', x, 40);
        }
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    // MAIN ANIMATION FRAME
    const render = (time) => {
      const s = stateRef.current;
      const dt = Math.min((time - s.lastTime) / 1000, 0.05);
      s.lastTime = time;
      s.gameTime += dt;

      // 1. Spawning Fruits in Batches
      if (!s.isGameOver) {
        s.nextSpawnTime -= dt;
        if (s.nextSpawnTime <= 0) {
          s.nextSpawnTime = 1.4 + Math.random() * 1.0;
          const batchSize = Math.random() < 0.4 ? 2 : (Math.random() < 0.25 ? 3 : 1);

          for (let b = 0; b < batchSize; b++) {
            // Pick random fruit (occasional bomb)
            const isBomb = Math.random() < 0.18;
            const t = isBomb
              ? FRUIT_TYPES.find((f) => f.type === 'bomb')
              : FRUIT_TYPES[Math.floor(Math.random() * (FRUIT_TYPES.length - 1))];

            const startX = 60 + Math.random() * (CANVAS_W - 120);
            const targetX = CANVAS_W / 2 + (Math.random() * 80 - 40);
            const vx = (targetX - startX) * (0.012 + Math.random() * 0.008);
            const vy = -(11.5 + Math.random() * 3.5);

            s.fruits.push({
              ...t,
              x: startX,
              y: CANVAS_H + 30,
              vx,
              vy,
              rotation: Math.random() * Math.PI,
              rotSpeed: (Math.random() - 0.5) * 0.08,
              sliced: false
            });
          }
        }
      }

      // 2. Update Whole Fruits
      for (let i = s.fruits.length - 1; i >= 0; i--) {
        const f = s.fruits[i];
        f.vy += 0.26; // Gravity
        f.x += f.vx;
        f.y += f.vy;
        f.rotation += f.rotSpeed;

        // Dropped below bottom screen unsliced -> STRIKE!
        if (f.y > CANVAS_H + 40 && f.vy > 0) {
          if (!f.isBomb && !s.isGameOver) {
            s.strikes += 1;
            setStrikes(s.strikes);
            audio.playStrike();

            if (s.strikes >= MAX_STRIKES) {
              s.isGameOver = true;
              setIsGameOver(true);
              triggerRoundEnd();
            }
          }
          s.fruits.splice(i, 1);
        }
      }

      // 3. Update Half Sliced Fruits
      for (let i = s.halfFruits.length - 1; i >= 0; i--) {
        const hf = s.halfFruits[i];
        hf.vy += 0.28;
        hf.x += hf.vx;
        hf.y += hf.vy;
        hf.rotation += hf.rotSpeed;
        if (hf.y > CANVAS_H + 50) {
          s.halfFruits.splice(i, 1);
        }
      }

      // 4. Update Splatter Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.vy += 0.22;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
        p.alpha = Math.max(0, p.life);
        if (p.life <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // 5. Update Combo Alerts
      for (let i = s.comboAlerts.length - 1; i >= 0; i--) {
        const c = s.comboAlerts[i];
        c.y -= 25 * dt;
        c.timer -= dt;
        c.opacity = c.timer;
        if (c.timer <= 0) {
          s.comboAlerts.splice(i, 1);
        }
      }

      // Clean old blade points
      const now = performance.now();
      s.bladePoints = s.bladePoints.filter((p) => now - p.time < 220);

      // ----------------------------------------------------
      // DRAW CANVAS SCENE
      // ----------------------------------------------------
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // 1. Dark Wood Planks & Gouges
      drawWoodBackground();

      // 2. Whole Fruits
      s.fruits.forEach(drawWholeFruit);

      // 3. Sliced Half Fruits
      s.halfFruits.forEach(drawHalfFruit);

      // 4. Juice Droplet Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Fiery Golden Blade Trail
      drawBladeTrail(s.bladePoints);

      // 6. Combo Alerts
      drawComboAlerts(s.comboAlerts);

      // 7. Screen Flash (Bomb Explosion)
      if (s.flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.flashAlpha})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        s.flashAlpha = Math.max(0, s.flashAlpha - 0.05);
      }

      // 8. Top HUD (Watermelon, Score, Strikes)
      drawHUD(s);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [roundIndex]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: CANVAS_W,
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
        cursor: 'crosshair',
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
            color: '#facc15',
            border: '1px solid rgba(250, 204, 21, 0.4)',
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
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' }
            }}
          >
            📊 Scores
          </Button>
        </Box>
      </Box>

      {/* Game Over Banner */}
      {isGameOver && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid #ef4444',
            borderRadius: 3,
            px: 2.5,
            py: 1.2,
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <Typography sx={{ color: '#ef4444', fontWeight: 900, fontSize: 16 }}>
            ⚔️ ROUND FINISHED!
          </Typography>
          <Typography sx={{ color: '#facc15', fontWeight: 800, fontSize: 13 }}>
            Slices: {score} pts
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
//  SCORE SET MODAL FOR FRUIT CUTTER
// ============================================================================
const FruitScoreSetDialog = ({
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
        🍉 Fruit Cutter - Score Set
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        {/* Total Score Comparison */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#f43f5e', fontWeight: 800, display: 'block' }}>
              {player1?.username || 'Player 1'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#f43f5e' }}>
              {p1TotalScore}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Fruit Sliced</Typography>
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
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Fruit Sliced</Typography>
          </Box>
        </Box>

        {/* Round by Round Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.selected' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>Round</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: '#f43f5e' }}>
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
            <Button variant="contained" onClick={onNextRound} sx={{ fontWeight: 700, bgcolor: '#f43f5e' }}>
              Next Round ▶
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
//  MAIN FRUIT CUTTING GAME COMPONENT
// ============================================================================
export const FruitCuttingGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
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

  const isP1 = String(userId || '') === String(player1?.id || '');
  const isP2 = String(userId || '') === String(player2?.id || '');
  const isMyTurn = (status === 'active' || (isP1 && phase === 'p1') || (isP2 && (phase === 'p2' || phase === 'p2_challenge'))) && (String(turnPlayerId || '') === String(userId || '') || (!turnPlayerId && isP1));
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
      const finalP1Score = Number(score) || 0;
      onSendGameMessage({
        ...gameData,
        status: 'invited',
        phase: 'p2_challenge',
        p1Score: finalP1Score,
        p1TotalScore: finalP1Score,
        p1RoundScore: finalP1Score,
        p1FinalScore: finalP1Score,
        p2Score: null,
        p2TotalScore: 0,
        p2RoundScore: null,
        p2FinalScore: null,
        rounds: [{ p1Score: finalP1Score, p2Score: null }],
        turnPlayerId: player2?.id,
        challengerId: player1?.id
      });
    } else if (phase === 'p2' || phase === 'p2_challenge') {
      // Player 2 finished their challenge round -> Calculate match winner & finish
      const p1S = Number(
        gameData?.p1Score ??
        gameData?.p1TotalScore ??
        gameData?.p1FinalScore ??
        gameData?.p1ChallengeScore ??
        (gameData?.rounds && gameData.rounds[0]?.p1Score) ??
        p1TotalScore ??
        0
      );
      const p2S = Number(score) || 0;
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
        p1FinalScore: p1S,
        p2FinalScore: p2S,
        rounds: [{ p1Score: p1S, p2Score: p2S }],
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
      if (winnerId === userId) return { text: '🏆 You Won the Match!', color: '#f43f5e' };
      const wName = winnerId === player1?.id ? player1?.username : player2?.username;
      return { text: `👑 ${wName} Won the Match!`, color: '#f59e0b' };
    }
    if (phase === 'result') {
      return { text: `Round ${currentRound} Finished! Check Score Set.`, color: '#38bdf8' };
    }
    if (phase === 'p1') {
      if (isP1 && isMyTurn) return { text: `🎮 Your Turn - Swipe to Slice Fruits!`, color: '#f43f5e' };
      return { text: `⏳ ${player1?.username || 'Player 1'} is slicing...`, color: '#94a3b8' };
    }
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = gameData?.p1Score ?? gameData?.p1TotalScore ?? p1TotalScore ?? 0;
      if (isP2 && isMyTurn) return { text: `🎯 Target to beat: ${target} pts! Swipe to Slice!`, color: '#f43f5e' };
      return { text: `⏳ ${player2?.username || 'Player 2'} is slicing...`, color: '#94a3b8' };
    }
    return { text: 'Waiting for game to begin...', color: '#94a3b8' };
  };

  const p1SDisplay = Number(gameData?.p1TotalScore ?? gameData?.p1Score ?? gameData?.p1FinalScore ?? p1TotalScore ?? 0);
  const p2SDisplay = Number(gameData?.p2TotalScore ?? gameData?.p2Score ?? gameData?.p2FinalScore ?? p2TotalScore ?? 0);

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
        maxWidth: 360,
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
          <Typography variant="caption" sx={{ color: '#f43f5e', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player1?.username || 'Player 1'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#f43f5e' }}>
            {p1SDisplay} <span style={{ fontSize: 10, fontWeight: 600 }}>pts</span>
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
            {p2SDisplay} <span style={{ fontSize: 10, fontWeight: 600 }}>pts</span>
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
        <FruitCutterEngine
          key={`engine-${engineKey}-${phase}-${currentRound}`}
          roundIndex={currentRound}
          isMyTurn={true}
          bestScore={Math.max(p1TotalScore, p2TotalScore, 189)}
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
            🍉
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            {phase === 'p1' ? player1?.username : player2?.username} is Slicing Fruits!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
            Waiting for their slice score... You will slice next!
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
              <Typography variant="caption" sx={{ color: '#f43f5e', fontWeight: 700 }}>
                {player1?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#f43f5e' }}>
                {p1SDisplay} pts
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'text.disabled' }}>vs</Typography>
            <Box>
              <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 700 }}>
                {player2?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0ea5e9' }}>
                {p2SDisplay} pts
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
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)'
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
      <FruitScoreSetDialog
        open={scoreSetOpen}
        onClose={() => setScoreSetOpen(false)}
        rounds={rounds && rounds.length > 0 ? rounds : [{ p1Score: p1SDisplay, p2Score: (phase === 'finished' || status === 'finished') ? p2SDisplay : null }]}
        p1TotalScore={p1SDisplay}
        p2TotalScore={p2SDisplay}
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
export const fruitCuttingInitialData = (player1, player2) => ({
  gameType: 'fruitcutting',
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
