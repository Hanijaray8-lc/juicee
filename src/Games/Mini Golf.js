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
//  MINI GOLF 3D - 2-PLAYER SKY ISLAND PUTTING GAME (3 ROUNDS x 10 SECONDS)
//  Faithful recreation matching reference image:
//  - Sky island fairway with floating cloud atmosphere & castle turrets
//  - Stone brick perimeter walls (supports trick bank-shots!)
//  - Far-end hole with red flag pin, circular dashed putting ring, & red chevrons
//  - Sand bunker rough on left side & green fairway lawn
//  - Blue metallic putter club head with ripple target aim ring & trajectory dots
//  - Top HUD: Hole / Round badge, 10s Round Timer countdown, & score
//  - 3 Rounds total: 10 seconds per round for Player 1 and Player 2!
//  - Zero-lag Web Audio API sound synthesizer
// ============================================================================

const TOTAL_ROUNDS = 3;
const ROUND_TIME_SECONDS = 10;
const CANVAS_W = 320;
const CANVAS_H = 480;

// Web Audio API Synthesizer for Mini Golf
class GolfAudioSynthesizer {
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
  playPutt() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }
  playWallBounce() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.05);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }
  playHoleInOne() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Cup plunk
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(260, t);
      osc1.frequency.exponentialRampToValueAtTime(80, t + 0.15);
      gain1.gain.setValueAtTime(0.3, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.15);

      // Cheerful fanfare
      const notes = [587.33, 739.99, 880, 1174.66];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + 0.08 + i * 0.06);
        gain.gain.setValueAtTime(0.2, t + 0.08 + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + i * 0.06 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + 0.08 + i * 0.06);
        osc.stop(t + 0.08 + i * 0.06 + 0.28);
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

const audio = new GolfAudioSynthesizer();

// ============================================================================
//  CANVAS MINI GOLF ENGINE
// ============================================================================
const MiniGolfEngine = ({
  roundIndex = 0,
  bestScore = 250,
  isMyTurn = true,
  onRoundOver,
  onOpenScoreSet
}) => {
  const canvasRef = useRef(null);
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const [isRoundOver, setIsRoundOver] = useState(false);

  const stateRef = useRef({
    score: 0,
    strokes: 0,
    timeLeft: ROUND_TIME_SECONDS,
    isRoundOver: false,
    hasSentScore: false,
    // Golf Ball
    ball: {
      x: CANVAS_W / 2,
      y: 340,
      vx: 0,
      vy: 0,
      radius: 9,
      isRolling: false,
      sunk: false
    },
    // Target Hole & Red Flag (Far End)
    hole: {
      x: CANVAS_W / 2,
      y: 115,
      radius: 14
    },
    // Stone Wall Boundaries (Inner Fairway Playable Area)
    walls: {
      left: 78,
      right: CANVAS_W - 78,
      top: 85,
      bottom: 395
    },
    dragStart: null,
    currentDrag: null,
    popups: [],
    particles: [],
    lastTime: performance.now()
  });

  const toggleSound = (e) => {
    e?.stopPropagation();
    const next = !soundOn;
    setSoundOn(next);
    audio.enabled = next;
  };

  // Drag to Aim & Putt Handlers
  const handlePointerDown = (e) => {
    const s = stateRef.current;
    if (s.isRoundOver || s.ball.isRolling || s.ball.sunk) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    // Check if clicking near the ball or putter
    const dist = Math.hypot(x - s.ball.x, y - s.ball.y);
    if (dist < 65) {
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

    // Drag backward to shoot forward (slingshot / putter stroke)
    const dx = s.dragStart.x - s.currentDrag.x;
    const dy = s.dragStart.y - s.currentDrag.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 15) {
      s.ball.isRolling = true;
      const power = Math.min(dist / 45, 2.8);
      s.ball.vx = (dx / dist) * power * 4.2;
      s.ball.vy = (dy / dist) * power * 4.2;
      s.strokes += 1;
      audio.playPutt();
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
    stateRef.current.strokes = 0;
    stateRef.current.timeLeft = ROUND_TIME_SECONDS;
    stateRef.current.isRoundOver = false;
    stateRef.current.hasSentScore = false;
    stateRef.current.ball.x = CANVAS_W / 2;
    stateRef.current.ball.y = 340;
    stateRef.current.ball.vx = 0;
    stateRef.current.ball.vy = 0;
    stateRef.current.ball.isRolling = false;
    stateRef.current.ball.sunk = false;
    setScore(0);
    setTimeLeft(ROUND_TIME_SECONDS);
    setIsRoundOver(false);

    // DRAW SKY ISLAND & CASTLE WALLS (Matching Image 2)
    const drawSkyIslandAndWalls = () => {
      // 1. Soft Sky & Cloud Atmosphere (Background)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#c7d2fe');
      skyGrad.addColorStop(0.5, '#e0e7ff');
      skyGrad.addColorStop(1, '#f8fafc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Fluffy white background clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(50, 440, 70, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(270, 450, 80, 35, 0, 0, Math.PI * 2);
      ctx.ellipse(160, 470, 100, 35, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Floating Island Rock / Grass Base (Matching Image 2)
      ctx.fillStyle = '#65a30d'; // Grass outer hill
      ctx.beginPath();
      ctx.roundRect(40, 50, CANVAS_W - 80, 380, 48);
      ctx.fill();

      // Island cliff rock underside
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(85, 420);
      ctx.lineTo(CANVAS_W / 2, 465);
      ctx.lineTo(CANVAS_W - 85, 420);
      ctx.closePath();
      ctx.fill();

      // 3. Castle Turrets with Teal Conical Roofs (Matching Image 2)
      const drawTurret = (tx, ty) => {
        ctx.save();
        ctx.translate(tx, ty);
        // Stone tower base
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(-10, -10, 20, 28);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-10, -10, 20, 28);
        // Teal conical roof
        ctx.fillStyle = '#2dd4bf';
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(-14, -10);
        ctx.lineTo(14, -10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f766e';
        ctx.stroke();
        // Little banner flag
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(24, -4);
        ctx.lineTo(14, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      drawTurret(60, 240);
      drawTurret(CANVAS_W - 60, 240);

      // 4. Stone Brick Perimeter Walls (Matching Image 2)
      ctx.save();
      const w = stateRef.current.walls;

      // Stone Wall Outer Rim (Cream Stone with Bevel)
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(w.left - 8, w.top - 8, w.right - w.left + 16, w.bottom - w.top + 16, 28);
      ctx.stroke();

      // Inner Fairway Green Lawn (Vibrant Green)
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.roundRect(w.left, w.top, w.right - w.left, w.bottom - w.top, 24);
      ctx.fill();

      // Sand Bunker / Rough along left edge (Matching Image 2)
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(w.left + 2, w.top + 50, 16, 210, 8);
      ctx.fill();

      // Top Putting Green Oval around the Hole (Matching Image 2)
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.ellipse(CANVAS_W / 2, 115, 52, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // DRAW HOLE, RED FLAG, AND PUTTING RING (Matching Image 2)
    const drawHoleAndFlag = (hole) => {
      ctx.save();

      // Circular Dashed Putting Guide Ring (Matching Image 2)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Red Chevron Arrow pointing towards hole (Matching Image 2)
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hole.x - 14, hole.y - 48);
      ctx.lineTo(hole.x, hole.y - 34);
      ctx.lineTo(hole.x + 14, hole.y - 48);
      ctx.lineTo(hole.x + 8, hole.y - 48);
      ctx.lineTo(hole.x + 8, hole.y - 58);
      ctx.lineTo(hole.x - 8, hole.y - 58);
      ctx.lineTo(hole.x - 8, hole.y - 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // The Golf Hole (Cup)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Flag Pin Pole
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hole.x - 1.5, hole.y - 32, 3, 32);

      // Red Triangular Flag (Matching Image 2)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(hole.x + 1.5, hole.y - 32);
      ctx.lineTo(hole.x + 18, hole.y - 24);
      ctx.lineTo(hole.x + 1.5, hole.y - 16);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // DRAW GOLF BALL & PUTTER CLUB WITH RIPPLE AIM RING (Matching Image 2)
    const drawBallAndPutter = (s) => {
      ctx.save();
      const b = s.ball;

      // 1. Blue Concentric Ripple Aim Rings around ball (Matching Image 2)
      if (!b.isRolling && !b.sunk) {
        ctx.save();
        const pulse = Math.sin(performance.now() * 0.005) * 3;
        // Outer light cyan ring
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 52 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner darker cyan ring
        ctx.fillStyle = 'rgba(2, 132, 199, 0.35)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 36 + pulse * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // White border ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 52 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Dotted Aiming Trajectory line extending towards hole (Matching Image 2)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(s.hole.x, s.hole.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 2. Drag Power Aim Arrow (Red curved arrow from Image 2)
      if (s.dragStart && s.currentDrag && !b.isRolling) {
        ctx.save();
        const dx = s.dragStart.x - s.currentDrag.x;
        const dy = s.dragStart.y - s.currentDrag.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x + dx * 1.5, b.y + dy * 1.5);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(dy, dx);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(b.x + dx * 1.5, b.y + dy * 1.5, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Blue Metallic Putter Club Head behind ball (Matching Image 2)
      if (!b.isRolling && !b.sunk) {
        ctx.save();
        const putterY = b.y + 26;
        // Putter Head (Curved blue metallic half-moon from Image 2)
        const putterGrad = ctx.createLinearGradient(b.x - 16, putterY, b.x + 16, putterY);
        putterGrad.addColorStop(0, '#0284c7');
        putterGrad.addColorStop(0.5, '#38bdf8');
        putterGrad.addColorStop(1, '#0369a1');

        ctx.fillStyle = putterGrad;
        ctx.beginPath();
        ctx.arc(b.x, putterY, 16, Math.PI, 0, true);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Stroke number badge "1" on the club head (Matching Image 2)
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(b.x - 12, putterY + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${s.strokes + 1}`, b.x - 12, putterY + 15);
        ctx.restore();
      }

      // 4. White Golf Ball with Drop Shadow
      if (!b.sunk) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + 6, b.radius, b.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golf ball 3D sphere gradient
        const ballGrad = ctx.createRadialGradient(
          b.x - b.radius * 0.3,
          b.y - b.radius * 0.3,
          1,
          b.x,
          b.y,
          b.radius
        );
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.7, '#f1f5f9');
        ballGrad.addColorStop(1, '#94a3b8');

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Tiny dimple dots on golf ball
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(b.x - 2, b.y - 2, 1.5, 1.5);
        ctx.fillRect(b.x + 2, b.y + 1, 1.5, 1.5);
      }

      ctx.restore();
    };

    // DRAW TOP HUD & SCORE (Matching Image 2)
    const drawHUD = (s) => {
      ctx.save();

      // Top-Left: Hole & Score Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.roundRect(14, 14, 82, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.fillText(`⛳ ${s.score} pts`, 26, 33);

      // Top-Center: 10s Timer Countdown Badge
      const timerBg = s.timeLeft <= 3 ? '#ef4444' : '#f59e0b';
      ctx.fillStyle = timerBg;
      ctx.beginPath();
      ctx.roundRect(CANVAS_W / 2 - 38, 14, 76, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱️ ${s.timeLeft}s`, CANVAS_W / 2, 33);

      // Top-Right: Cancel / Target Icon Button (Matching Image 2)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.arc(CANVAS_W - 28, 28, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚫', CANVAS_W - 28, 33);

      ctx.restore();
    };

    // DRAW POPUPS
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
      if (s.ball.isRolling && !s.ball.sunk) {
        s.ball.x += s.ball.vx;
        s.ball.y += s.ball.vy;

        // Turf friction deceleration
        s.ball.vx *= 0.982;
        s.ball.vy *= 0.982;

        // Sand bunker extra friction on left
        if (s.ball.x < s.walls.left + 18) {
          s.ball.vx *= 0.94;
          s.ball.vy *= 0.94;
        }

        // Stone Wall Bounce Collisions (Realistic Bank-shots!)
        const w = s.walls;
        const br = s.ball.radius;

        // Left wall bounce
        if (s.ball.x - br < w.left) {
          s.ball.x = w.left + br;
          s.ball.vx = -s.ball.vx * 0.75;
          audio.playWallBounce();
        }
        // Right wall bounce
        if (s.ball.x + br > w.right) {
          s.ball.x = w.right - br;
          s.ball.vx = -s.ball.vx * 0.75;
          audio.playWallBounce();
        }
        // Top wall bounce
        if (s.ball.y - br < w.top) {
          s.ball.y = w.top + br;
          s.ball.vy = -s.ball.vy * 0.75;
          audio.playWallBounce();
        }
        // Bottom wall bounce
        if (s.ball.y + br > w.bottom) {
          s.ball.y = w.bottom - br;
          s.ball.vy = -s.ball.vy * 0.75;
          audio.playWallBounce();
        }

        // Check Hole Sinking
        const distToHole = Math.hypot(s.ball.x - s.hole.x, s.ball.y - s.hole.y);
        const ballSpeed = Math.hypot(s.ball.vx, s.ball.vy);

        if (distToHole < s.hole.radius + 2 && ballSpeed < 5.0) {
          // HOLE IN!
          s.ball.sunk = true;
          s.ball.isRolling = false;
          s.score += 100;
          setScore(s.score);
          audio.playHoleInOne();

          s.popups.push({
            x: CANVAS_W / 2,
            y: 135,
            text: '⛳ HOLE IN ONE! +100',
            color: '#facc15',
            alpha: 1.0,
            life: 1.2
          });

          // Reset ball to tee after 650ms
          setTimeout(() => {
            s.ball.x = CANVAS_W / 2;
            s.ball.y = 340;
            s.ball.vx = 0;
            s.ball.vy = 0;
            s.ball.sunk = false;
            s.ball.isRolling = false;
          }, 650);
        }

        // Stop ball if very slow
        if (ballSpeed < 0.12 && !s.ball.sunk) {
          s.ball.vx = 0;
          s.ball.vy = 0;
          s.ball.isRolling = false;
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

      // 1. Sky Island & Castle Walls
      drawSkyIslandAndWalls();

      // 2. Hole & Red Flag
      drawHoleAndFlag(s.hole);

      // 3. Ball & Blue Metallic Putter with Ripple Ring
      drawBallAndPutter(s);

      // 4. Popups & FX
      drawPopups(s);

      // 5. Top HUD
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
            color: '#22c55e',
            border: '1px solid rgba(34, 197, 94, 0.4)',
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
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.4)',
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
            border: '2px solid #22c55e',
            borderRadius: 3,
            px: 2.5,
            py: 1.2,
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <Typography sx={{ color: '#22c55e', fontWeight: 900, fontSize: 16 }}>
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
//  SCORE SET MODAL FOR MINI GOLF
// ============================================================================
const GolfScoreSetDialog = ({
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
        ⛳ Mini Golf - Score Set
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        {/* Total Score Comparison */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 800, display: 'block' }}>
              {player1?.username || 'Player 1'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#22c55e' }}>
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
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: '#22c55e' }}>
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
            <Button variant="contained" onClick={onNextRound} sx={{ fontWeight: 700, bgcolor: '#22c55e' }}>
              Next Round ▶
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
//  MAIN MINI GOLF GAME COMPONENT
// ============================================================================
export const MiniGolfGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
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
      if (winnerId === userId) return { text: '🏆 You Won the Match!', color: '#22c55e' };
      const wName = winnerId === player1?.id ? player1?.username : player2?.username;
      return { text: `👑 ${wName} Won the Match!`, color: '#f59e0b' };
    }
    if (phase === 'result') {
      return { text: `Round ${currentRound} Finished! Check Score Set.`, color: '#38bdf8' };
    }
    if (phase === 'p1') {
      if (isP1 && isMyTurn) return { text: `🎮 Your Turn - Putt the ball into the cup!`, color: '#22c55e' };
      return { text: `⏳ ${player1?.username || 'Player 1'} is playing...`, color: '#94a3b8' };
    }
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = gameData?.p1Score ?? gameData?.p1TotalScore ?? p1TotalScore ?? 0;
      if (isP2 && isMyTurn) return { text: `🎯 Target to beat: ${target} pts! Putt to score!`, color: '#22c55e' };
      return { text: `⏳ ${player2?.username || 'Player 2'} is playing...`, color: '#94a3b8' };
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
          <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player1?.username || 'Player 1'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#22c55e' }}>
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
        <MiniGolfEngine
          key={`engine-${engineKey}-${phase}-${currentRound}`}
          roundIndex={currentRound}
          isMyTurn={true}
          bestScore={Math.max(p1TotalScore, p2TotalScore, 250)}
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
            ⛳
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            {phase === 'p1' ? player1?.username : player2?.username} is Putting on the Green!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
            10-second golf clock running... You will putt next!
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
              <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 700 }}>
                {player1?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#22c55e' }}>
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
                background: 'linear-gradient(135deg, #22c55e, #16a34a)'
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
      <GolfScoreSetDialog
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
export const miniGolfInitialData = (player1, player2) => ({
  gameType: 'minigolf',
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
