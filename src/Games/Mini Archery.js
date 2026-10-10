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
//  MINI ARCHERY - 2-PLAYER FAST ARCADE GAME (3 ROUNDS x 10 SECONDS)
//  Faithful recreation matching reference image:
//  - Minimalist vector art style: Teal sky with Mount Fuji snowy peak in background
//  - White pill clouds, green meadow with bushes, and paved shooting range lane
//  - Cute Robin Hood archer on the left with red cap, green feather, and bow
//  - Target on tall wooden post with concentric ring scoring and impact wave rings
//  - Top-left red wind banner (speed & direction) and top-right arrow badge
//  - Center ⏱️ 10s Round Timer countdown
//  - Bottom-right hits indicator (e.g. 1 / 1)
//  - 3 Rounds total: 10 seconds per round for Player 1 and Player 2!
//  - Zero-lag Web Audio API sound synthesizer
// ============================================================================

const TOTAL_ROUNDS = 3;
const ROUND_TIME_SECONDS = 10;
const CANVAS_W = 320;
const CANVAS_H = 480;

// Web Audio API Synthesizer for Mini Archery
class MiniArcheryAudioSynthesizer {
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
  playBowDraw() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(280, t + 0.12);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }
  playArrowShoot() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }
  playTargetHit(isBullseye = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Target wooden thud
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220, t);
      osc1.frequency.exponentialRampToValueAtTime(70, t + 0.1);
      gain1.gain.setValueAtTime(0.3, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.1);

      // Bullseye chime
      if (isBullseye) {
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(987.77, t); // B5
        gain2.gain.setValueAtTime(0.2, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(t);
        osc2.stop(t + 0.3);
      }
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

const audio = new MiniArcheryAudioSynthesizer();

// ============================================================================
//  CANVAS MINI ARCHERY ENGINE
// ============================================================================
const MiniArcheryEngine = ({
  roundIndex = 0,
  bestScore = 150,
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
    hits: 0,
    arrowsFired: 0,
    timeLeft: ROUND_TIME_SECONDS,
    isRoundOver: false,
    hasSentScore: false,
    wind: (Math.random() * 4 - 2).toFixed(1), // e.g. -2.0 to +2.0
    // Archer Character
    archer: {
      x: 48,
      y: 215,
      isAiming: false,
      aimAngle: 0,
      drawPower: 0
    },
    // Target on Wooden Post (Right side)
    target: {
      x: 265,
      y: 150,
      baseY: 150,
      radius: 26,
      speedY: 0.9,
      dirY: 1
    },
    // In-flight arrows
    arrows: [],
    // Impact rings / Popups
    impactRings: [],
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

  // Drag & Aim Handlers
  const handlePointerDown = (e) => {
    const s = stateRef.current;
    if (s.isRoundOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    s.dragStart = { x, y };
    s.currentDrag = { x, y };
    s.archer.isAiming = true;
    audio.playBowDraw();
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    if (!s.dragStart || s.isRoundOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    s.currentDrag = { x, y };
    const dx = s.dragStart.x - x; // Pulling back to the left
    const dy = y - s.dragStart.y;
    s.archer.aimAngle = Math.atan2(dy, Math.max(10, dx));
    s.archer.drawPower = Math.min(1.0, Math.hypot(dx, dy) / 70);
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.dragStart || !s.currentDrag || s.isRoundOver) {
      s.dragStart = null;
      s.currentDrag = null;
      s.archer.isAiming = false;
      return;
    }

    const dx = s.dragStart.x - s.currentDrag.x;
    const dy = s.dragStart.y - s.currentDrag.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 15) {
      // Fire Arrow!
      const power = Math.max(0.3, Math.min(1.0, dist / 60));
      const speed = 11.5 + power * 6.5;
      const angle = -Math.atan2(dy, Math.max(10, dx));

      s.arrows.push({
        x: s.archer.x + 18,
        y: s.archer.y - 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        stuck: false,
        stuckOffset: { x: 0, y: 0 }
      });

      s.arrowsFired += 1;
      audio.playArrowShoot();
    }

    s.dragStart = null;
    s.currentDrag = null;
    s.archer.isAiming = false;
    s.archer.drawPower = 0;
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
    stateRef.current.hits = 0;
    stateRef.current.arrowsFired = 0;
    stateRef.current.timeLeft = ROUND_TIME_SECONDS;
    stateRef.current.isRoundOver = false;
    stateRef.current.hasSentScore = false;
    stateRef.current.arrows = [];
    stateRef.current.impactRings = [];
    stateRef.current.popups = [];
    setScore(0);
    setTimeLeft(ROUND_TIME_SECONDS);
    setIsRoundOver(false);

    // DRAW BACKGROUND: TEAL SKY, MOUNT FUJI, PILL CLOUDS, MEADOW (Matching Image 2)
    const drawBackground = (time) => {
      // 1. Teal Sky (Matching Image 2)
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(0, 0, CANVAS_W, 110);

      // 2. White Pill Clouds
      ctx.fillStyle = '#e6fffa';
      const cloudPill = (x, y, w) => {
        ctx.beginPath();
        ctx.roundRect(x, y, w, 11, 5.5);
        ctx.fill();
      };
      cloudPill(28, 66, 38);
      cloudPill(145, 16, 38);
      cloudPill(240, 52, 38);

      // 3. Mount Fuji Style Mountain Peak in Background (Matching Image 2)
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.moveTo(105, 110);
      ctx.lineTo(170, 48);
      ctx.lineTo(235, 110);
      ctx.closePath();
      ctx.fill();

      // White Snowy Cap on Peak
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(160, 58);
      ctx.lineTo(170, 48);
      ctx.lineTo(180, 58);
      ctx.lineTo(174, 62);
      ctx.lineTo(170, 60);
      ctx.lineTo(166, 62);
      ctx.closePath();
      ctx.fill();

      // 4. Lime Green Meadow (Matching Image 2)
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(0, 110, CANVAS_W, CANVAS_H - 110);

      // 5. Rounded Bush Clusters on Meadow (Matching Image 2)
      const drawBush = (bx, by, scale = 1.0) => {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.arc(-14, 0, 14, 0, Math.PI * 2);
        ctx.arc(0, -6, 18, 0, Math.PI * 2);
        ctx.arc(14, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // White floral specks on bush
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -4, 2, 2);
        ctx.fillRect(8, 2, 2, 2);
        ctx.fillRect(-10, 4, 2, 2);
        ctx.restore();
      };

      drawBush(55, 160, 0.85);
      drawBush(195, 140, 0.75);
      drawBush(240, 310, 1.1);
      drawBush(90, 400, 1.2);

      // 6. White Paved Shooting Lane (Matching Image 2)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(CANVAS_W, 200);
      ctx.lineTo(CANVAS_W, 275);
      ctx.lineTo(0, 275);
      ctx.closePath();
      ctx.fill();

      // Lane Border Rails (Green)
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(0, 198, CANVAS_W, 4);
      ctx.fillRect(0, 273, CANVAS_W, 4);

      // Diagonal lane division line (Matching Image 2)
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 202);
      ctx.lineTo(95, 273);
      ctx.stroke();
    };

    // DRAW CUTE ARCHER CHARACTER (Robin Hood style from Image 2)
    const drawArcher = (archer) => {
      ctx.save();
      ctx.translate(archer.x, archer.y);

      // Archer Head & Cap
      ctx.fillStyle = '#ea580c'; // Red Cap from Image 2
      ctx.beginPath();
      ctx.ellipse(0, -26, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cap Visor
      ctx.fillRect(0, -25, 16, 4);

      // Green Robin Hood Feather! (Matching Image 2)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(-10, -28);
      ctx.quadraticCurveTo(-22, -38, -20, -42);
      ctx.quadraticCurveTo(-14, -36, -6, -30);
      ctx.closePath();
      ctx.fill();

      // Peach Skin Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -18, 9, 0, Math.PI * 2);
      ctx.fill();

      // Archer Eye & mouth
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, -20, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -15, 4, 2); // Determined teeth/mouth

      // Dark Green Body Tunic (Matching Image 2)
      ctx.fillStyle = '#1e3a1e';
      ctx.fillRect(-10, -9, 20, 24);
      // Belt & green stripe
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-10, 10, 20, 3);

      // Archer Hands & Wooden Recurve Bow (Matching Image 2)
      const drawOffset = archer.isAiming ? archer.drawPower * 8 : 0;
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(10 - drawOffset, -2, 4, 0, Math.PI * 2); // Hand holding string
      ctx.fill();

      // Wooden Bow Arc
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(16, -2, 16, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      // Bowstring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(16 + Math.cos(-Math.PI * 0.45) * 16, -2 + Math.sin(-Math.PI * 0.45) * 16);
      ctx.lineTo(10 - drawOffset, -2);
      ctx.lineTo(16 + Math.cos(Math.PI * 0.45) * 16, -2 + Math.sin(Math.PI * 0.45) * 16);
      ctx.stroke();

      // Trajectory Guide when aiming
      if (archer.isAiming) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(16, -2);
        ctx.lineTo(16 + Math.cos(archer.aimAngle) * 60, -2 + Math.sin(archer.aimAngle) * 60);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    };

    // DRAW ARCHERY TARGET & WOODEN POST (Matching Image 2)
    const drawTarget = (target) => {
      ctx.save();
      ctx.translate(target.x, target.y);

      // Tall Wooden Post from ground (Matching Image 2)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-5, 0, 10, 115);

      // Post shadow base on ground
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 115, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Rings Archery Target (Matching Image 2)
      // 1. Outer White Ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Middle Dark/Red Ring (Matching Image 2)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, target.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // 3. Center Golden Bullseye (Matching Image 2)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, target.radius * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // DRAW FLYING & STUCK ARROWS
    const drawArrows = (arrows, target) => {
      arrows.forEach((arr) => {
        ctx.save();
        if (arr.stuck) {
          ctx.translate(target.x + arr.stuckOffset.x, target.y + arr.stuckOffset.y);
        } else {
          ctx.translate(arr.x, arr.y);
          ctx.rotate(Math.atan2(arr.vy, arr.vx));
        }

        // Arrow Shaft
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // Arrow Head
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(8, -3);
        ctx.lineTo(14, 0);
        ctx.lineTo(8, 3);
        ctx.closePath();
        ctx.fill();

        // Green / Red Feather Fletching (Matching Image 2)
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-18, -4, 4, 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-18, 1, 4, 3);

        ctx.restore();
      });
    };

    // DRAW IMPACT WAVES & POPUPS (Matching the white ripple circles in Image 2)
    const drawImpactEffects = (s) => {
      // Concentric Expanding White Rings (Image 2 style)
      s.impactRings.forEach((r) => {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Floating Score Popups (e.g. "+10" / "+1" from Image 2)
      s.popups.forEach((pop) => {
        ctx.save();
        ctx.font = '900 20px sans-serif';
        ctx.fillStyle = pop.color || '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.globalAlpha = pop.alpha;
        ctx.strokeText(pop.text, pop.x, pop.y);
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });
    };

    // DRAW TOP HUD & BOTTOM SCORE (Matching Image 2)
    const drawHUD = (s) => {
      ctx.save();

      // --- 1. Top-Left: Red Wind Banner (Speed & Direction from Image 2) ---
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(14, 16, 85, 26, 13);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      const windDir = s.wind >= 0 ? '➡️' : '⬅️';
      ctx.fillText(`${windDir} ${Math.abs(s.wind)}m/s`, 56, 34);

      // --- 2. Top-Center: 10-Second Timer Badge ---
      const timerBg = s.timeLeft <= 3 ? '#ef4444' : '#f59e0b';
      ctx.fillStyle = timerBg;
      ctx.beginPath();
      ctx.roundRect(CANVAS_W / 2 - 38, 16, 76, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.fillText(`⏱️ ${s.timeLeft}s`, CANVAS_W / 2, 34);

      // --- 3. Top-Right: Black Rounded Arrow Badge (Matching Image 2: "5 ⬆️") ---
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(CANVAS_W - 68, 16, 54, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 14px sans-serif';
      ctx.fillText(`${s.score} ⬆️`, CANVAS_W - 41, 34);

      // --- 4. Bottom-Right: Hits Fraction Indicator (Matching Image 2: "1 / 1") ---
      ctx.font = '900 28px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 4;
      ctx.textAlign = 'right';

      ctx.strokeText(`${s.hits}`, CANVAS_W - 20, CANVAS_H - 42);
      ctx.fillText(`${s.hits}`, CANVAS_W - 20, CANVAS_H - 42);

      // Horizontal division line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(CANVAS_W - 42, CANVAS_H - 36);
      ctx.lineTo(CANVAS_W - 16, CANVAS_H - 36);
      ctx.stroke();

      ctx.strokeText(`${Math.max(1, s.arrowsFired)}`, CANVAS_W - 20, CANVAS_H - 12);
      ctx.fillText(`${Math.max(1, s.arrowsFired)}`, CANVAS_W - 20, CANVAS_H - 12);

      ctx.restore();
    };

    // MAIN ANIMATION LOOP
    const render = (time) => {
      const s = stateRef.current;
      const dt = Math.min((time - s.lastTime) / 1000, 0.05);
      s.lastTime = time;

      // Update Target Gentle Bobbing Motion
      s.target.y += s.target.speedY * s.target.dirY;
      if (s.target.y > s.target.baseY + 28) s.target.dirY = -1;
      if (s.target.y < s.target.baseY - 28) s.target.dirY = 1;

      // Update In-flight Arrows Physics
      for (let i = s.arrows.length - 1; i >= 0; i--) {
        const arr = s.arrows[i];
        if (arr.stuck) continue;

        // Apply wind & gravity
        arr.vx += parseFloat(s.wind) * 0.035;
        arr.vy += 0.22;
        arr.x += arr.vx;
        arr.y += arr.vy;

        // Check Target Hit Collision
        const dist = Math.hypot(arr.x - s.target.x, arr.y - s.target.y);
        if (dist <= s.target.radius + 4) {
          arr.stuck = true;
          arr.stuckOffset = { x: arr.x - s.target.x, y: arr.y - s.target.y };

          let points = 3;
          let label = '+3';
          let isBull = false;

          if (dist <= s.target.radius * 0.35) {
            points = 10;
            label = '🎯 +10';
            isBull = true;
          } else if (dist <= s.target.radius * 0.7) {
            points = 7;
            label = '+7';
          }

          s.score += points;
          s.hits += 1;
          setScore(s.score);
          audio.playTargetHit(isBull);

          // Spawn Expanding Impact Rings (Matching Image 2)
          s.impactRings.push({
            x: arr.x,
            y: arr.y,
            radius: 8,
            alpha: 1.0
          });

          // Spawn Floating Popup Text
          s.popups.push({
            x: arr.x,
            y: arr.y - 15,
            text: label,
            color: isBull ? '#facc15' : '#ffffff',
            alpha: 1.0,
            life: 0.85
          });
        }

        // Remove offscreen missed arrows
        if (arr.x > CANVAS_W + 50 || arr.y > CANVAS_H + 50) {
          s.arrows.splice(i, 1);
        }
      }

      // Update Impact Rings
      for (let i = s.impactRings.length - 1; i >= 0; i--) {
        const ring = s.impactRings[i];
        ring.radius += 38 * dt;
        ring.alpha -= 1.8 * dt;
        if (ring.alpha <= 0) s.impactRings.splice(i, 1);
      }

      // Update Popups
      for (let i = s.popups.length - 1; i >= 0; i--) {
        const pop = s.popups[i];
        pop.y -= 25 * dt;
        pop.life -= dt;
        pop.alpha = pop.life;
        if (pop.life <= 0) s.popups.splice(i, 1);
      }

      // ----------------------------------------------------
      // DRAW CANVAS SCENE
      // ----------------------------------------------------
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // 1. Teal Sky, Clouds, Mountain, Meadow, Range
      drawBackground(time);

      // 2. Archery Target on Post
      drawTarget(s.target);

      // 3. Arrows
      drawArrows(s.arrows, s.target);

      // 4. Archer Character
      drawArcher(s.archer);

      // 5. Impact Rings & Popups
      drawImpactEffects(s);

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
            color: '#4ade80',
            border: '1px solid rgba(74, 222, 128, 0.4)',
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
              color: '#4ade80',
              border: '1px solid rgba(74, 222, 128, 0.4)',
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
//  SCORE SET MODAL FOR MINI ARCHERY
// ============================================================================
const ArcheryScoreSetDialog = ({
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
        🏹 Mini Archery - Score Set
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
//  MAIN MINI ARCHERY GAME COMPONENT
// ============================================================================
export const MiniArcheryGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
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
      if (winnerId === userId) return { text: '🏆 You Won the Match!', color: '#10b981' };
      const wName = winnerId === player1?.id ? player1?.username : player2?.username;
      return { text: `👑 ${wName} Won the Match!`, color: '#f59e0b' };
    }
    if (phase === 'result') {
      return { text: `Round ${currentRound} Finished! Check Score Set.`, color: '#38bdf8' };
    }
    if (phase === 'p1') {
      if (isP1 && isMyTurn) return { text: `🎮 Your Turn - Shoot arrows at the target!`, color: '#10b981' };
      return { text: `⏳ ${player1?.username || 'Player 1'} is playing...`, color: '#94a3b8' };
    }
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = gameData?.p1Score ?? gameData?.p1TotalScore ?? p1TotalScore ?? 0;
      if (isP2 && isMyTurn) return { text: `🎯 Target to beat: ${target} pts! Shoot arrows!`, color: '#10b981' };
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
          <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player1?.username || 'Player 1'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#10b981' }}>
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
        <MiniArcheryEngine
          key={`engine-${engineKey}-${phase}-${currentRound}`}
          roundIndex={currentRound}
          isMyTurn={true}
          bestScore={Math.max(p1TotalScore, p2TotalScore, 150)}
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
            🏹
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            {phase === 'p1' ? player1?.username : player2?.username} is Shooting Arrows!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
            10-second archery clock running... You will shoot next!
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
      <ArcheryScoreSetDialog
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
export const miniArcheryInitialData = (player1, player2) => ({
  gameType: 'miniarchery',
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
