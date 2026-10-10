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
//  BEER PONG 3D - 2-PLAYER FAST ARCADE GAME (3 ROUNDS x 10 SECONDS)
//  Faithful recreation matching reference image:
//  - 3D perspective blue ping pong / beer pong table with white borders
//  - Red party cups with white rims at the far end of the table
//  - Cute animated animal spectators behind the table (bear, squirrel, cat)
//  - Ping pong ball with intuitive swipe-to-flick 3D arc trajectory
//  - Top HUD: Level pill, "Best: 2739", and 10s Round Timer countdown
//  - Bottom HUD: "⚪ x 7" ball counter / score indicator
//  - 3 Rounds total: 10 seconds per round for Player 1 and Player 2!
//  - Zero-lag Web Audio API sound synthesizer
// ============================================================================

const TOTAL_ROUNDS = 3;
const ROUND_TIME_SECONDS = 10;
const CANVAS_W = 320;
const CANVAS_H = 480;

// Web Audio API Synthesizer for Coffee Pong
class CoffeePongAudioSynthesizer {
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
  playThrow() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.1);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) { }
  }
  playBounce() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch (e) { }
  }
  playCupScore() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Splash bell
      const notes = [659.25, 880, 1046.5];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.05);
        gain.gain.setValueAtTime(0.22, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.25);
      });
    } catch (e) { }
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
    } catch (e) { }
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
    } catch (e) { }
  }
}

const audio = new CoffeePongAudioSynthesizer();

// Table surface perspective mapping: z=0 (near player at y=378) -> z=1.0 (far end at y=228)
const getTableSurfaceY = (z) => 378 - z * 150;

// ============================================================================
//  CANVAS BEER PONG ENGINE
// ============================================================================
const CoffeePongEngine = ({
  roundIndex = 0,
  bestScore = 2739,
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
    timeLeft: ROUND_TIME_SECONDS,
    isRoundOver: false,
    ballsLeft: 7,
    hasSentScore: false,
    ball: {
      x: CANVAS_W / 2,
      z: 0, // 0 (near/player side) to 1.0 (far end at cups)
      height: 0, // pixels above the table plane
      vx: 0,
      vz: 0,
      vHeight: 0,
      radius: 12,
      isFlying: false,
      bounced: false,
      sunk: false,
      sunkCupId: null
    },
    // Cups arranged at far end of the table
    cups: [
      { id: 1, x: CANVAS_W / 2 - 42, y: 220, z: 0.90, hit: false, scale: 0.95 },
      { id: 2, x: CANVAS_W / 2, y: 215, z: 0.92, hit: false, scale: 0.95 },
      { id: 3, x: CANVAS_W / 2 + 42, y: 220, z: 0.90, hit: false, scale: 0.95 },
      { id: 4, x: CANVAS_W / 2 - 22, y: 236, z: 0.84, hit: false, scale: 1.0 },
      { id: 5, x: CANVAS_W / 2 + 22, y: 236, z: 0.84, hit: false, scale: 1.0 },
      { id: 6, x: CANVAS_W / 2, y: 252, z: 0.78, hit: false, scale: 1.05 }
    ],
    particles: [],
    popups: [],
    dragStart: null,
    currentDrag: null,
    spectatorTime: 0,
    lastTime: performance.now()
  });

  const toggleSound = (e) => {
    e?.stopPropagation();
    const next = !soundOn;
    setSoundOn(next);
    audio.enabled = next;
  };

  // Drag to Throw Handlers (Supports both upward flick and slingshot pull)
  const handlePointerDown = (e) => {
    const s = stateRef.current;
    if (s.isRoundOver || s.ball.isFlying) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    // Check if clicked near the ball (within 80px) or in bottom throwing zone (y > 320)
    const ballScreenY = getTableSurfaceY(s.ball.z) - s.ball.height;
    const distToBall = Math.hypot(x - s.ball.x, y - ballScreenY);
    if (distToBall < 85 || y > 320) {
      s.dragStart = { x, y };
      s.currentDrag = { x, y };
    }
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    if (!s.dragStart || s.ball.isFlying) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;

    s.currentDrag = { x, y };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.dragStart || !s.currentDrag || s.ball.isFlying || s.isRoundOver) {
      s.dragStart = null;
      s.currentDrag = null;
      return;
    }

    const rawDx = s.currentDrag.x - s.dragStart.x;
    const rawDy = s.dragStart.y - s.currentDrag.y; // Positive if dragged UP, negative if dragged DOWN
    const dist = Math.hypot(rawDx, rawDy);

    // Minimum drag distance required to register toss
    if (dist >= 16) {
      let aimX = rawDx;
      let aimY = rawDy;

      // If user pulled DOWN like a slingshot, invert to launch forward towards cups
      if (rawDy < -10) {
        aimX = -rawDx;
        aimY = -rawDy;
      }

      aimY = Math.max(aimY, 20);
      const powerNorm = Math.min(Math.max((aimY - 15) / 65, 0.65), 1.45);

      s.ball.isFlying = true;
      s.ball.bounced = false;
      s.ball.sunk = false;
      s.ball.sunkCupId = null;

      // Forward depth velocity (smoothly reaches cups at z=0.78-0.95 in ~40-48 frames)
      s.ball.vz = 0.018 * powerNorm + 0.003;

      // Arc height velocity (parabolic flight reaching ~65-105px above table)
      s.ball.vHeight = 6.0 * Math.sqrt(powerNorm);

      // Horizontal velocity (dx directs ball left/right towards target cups)
      s.ball.vx = (aimX / Math.max(30, aimY)) * 2.8 * powerNorm;

      audio.playThrow();
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

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    stateRef.current.score = 0;
    stateRef.current.timeLeft = ROUND_TIME_SECONDS;
    stateRef.current.isRoundOver = false;
    stateRef.current.hasSentScore = false;
    stateRef.current.ballsLeft = 7;
    setScore(0);
    setTimeLeft(ROUND_TIME_SECONDS);
    setIsRoundOver(false);

    // DRAW ROOM & CUTE ANIMAL SPECTATORS (Matching Image 1)
    const drawSpectatorsAndRoom = (time) => {
      // 1. Room Sky-Blue Wall
      const wallGrad = ctx.createLinearGradient(0, 0, 0, 200);
      wallGrad.addColorStop(0, '#8ec5fc');
      wallGrad.addColorStop(1, '#b0d6fb');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, CANVAS_W, 200);

      // Floor
      const floorGrad = ctx.createLinearGradient(0, 200, 0, CANVAS_H);
      floorGrad.addColorStop(0, '#98cbfd');
      floorGrad.addColorStop(1, '#7bb8f8');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 200, CANVAS_W, CANVAS_H - 200);

      // 2. Animal Spectators Behind the Table (Bear, Squirrel, Cat from Image 1)
      const sway = Math.sin(time * 0.003) * 3;

      // SPECTATOR 1: Brown Bear in Dark Hoodie (Center-left)
      ctx.save();
      ctx.translate(150 + sway * 0.5, 125);
      // Navy Hoodie Body
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, 38, 28, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Bear Head
      ctx.fillStyle = '#8c593b';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      // Bear Ears
      ctx.beginPath();
      ctx.arc(-20, -18, 9, 0, Math.PI * 2);
      ctx.arc(20, -18, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b48160';
      ctx.beginPath();
      ctx.arc(-20, -18, 5, 0, Math.PI * 2);
      ctx.arc(20, -18, 5, 0, Math.PI * 2);
      ctx.fill();
      // Bear Snout & Eyes
      ctx.fillStyle = '#b48160';
      ctx.beginPath();
      ctx.ellipse(0, 7, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b18';
      ctx.beginPath();
      ctx.arc(0, 4, 3.5, 0, Math.PI * 2); // Nose
      ctx.arc(-8, -3, 2.5, 0, Math.PI * 2); // Left eye
      ctx.arc(8, -3, 2.5, 0, Math.PI * 2); // Right eye
      ctx.fill();
      ctx.restore();

      // SPECTATOR 2: Chipmunk / Squirrel (Center-right)
      ctx.save();
      ctx.translate(210 - sway * 0.4, 128);
      // Clothes
      ctx.fillStyle = '#3b4252';
      ctx.beginPath();
      ctx.ellipse(0, 36, 20, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#d4976a';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.arc(-13, -14, 6, 0, Math.PI * 2);
      ctx.arc(13, -14, 6, 0, Math.PI * 2);
      ctx.fill();
      // Cheeks & Eyes
      ctx.fillStyle = '#fce4cf';
      ctx.beginPath();
      ctx.arc(-7, 4, 6, 0, Math.PI * 2);
      ctx.arc(7, 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b18';
      ctx.beginPath();
      ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
      ctx.arc(-6, -2, 2, 0, Math.PI * 2);
      ctx.arc(6, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // SPECTATOR 3: Grey Striped Cat (Far right)
      ctx.save();
      ctx.translate(260 + sway * 0.3, 130);
      // Navy Hoodie
      ctx.fillStyle = '#2e3440';
      ctx.beginPath();
      ctx.ellipse(0, 35, 20, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Pointy Ears
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(-14, -20);
      ctx.lineTo(-4, -14);
      ctx.closePath();
      ctx.moveTo(16, -6);
      ctx.lineTo(14, -20);
      ctx.lineTo(4, -14);
      ctx.closePath();
      ctx.fill();
      // White muzzle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 6, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes & Pink nose
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-6, -2, 2, 0, Math.PI * 2);
      ctx.arc(6, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(0, 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // DRAW 3D PERSPECTIVE BLUE PING PONG TABLE (Matching Image 1)
    const drawTable = () => {
      ctx.save();

      // Table Perspective Points
      const tNearLeft = 0;
      const tNearRight = CANVAS_W;
      const tNearY = 410;

      const tFarLeft = 70;
      const tFarRight = CANVAS_W - 70;
      const tFarY = 205;

      // Table Legs underneath
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(20, tNearY, 18, 65);
      ctx.fillRect(CANVAS_W - 38, tNearY, 18, 65);
      ctx.fillRect(80, tFarY + 15, 12, 45);
      ctx.fillRect(CANVAS_W - 92, tFarY + 15, 12, 45);

      // Table Bevel Under-edge (Dark Royal Blue)
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(tNearLeft, tNearY);
      ctx.lineTo(tNearRight, tNearY);
      ctx.lineTo(tNearRight, tNearY + 14);
      ctx.lineTo(tNearLeft, tNearY + 14);
      ctx.closePath();
      ctx.fill();

      // Main Table Surface (Vibrant Blue from Image 1)
      const tableGrad = ctx.createLinearGradient(0, tFarY, 0, tNearY);
      tableGrad.addColorStop(0, '#1d4ed8');
      tableGrad.addColorStop(0.7, '#2563eb');
      tableGrad.addColorStop(1, '#1d4ed8');

      ctx.fillStyle = tableGrad;
      ctx.beginPath();
      ctx.moveTo(tFarLeft, tFarY);
      ctx.lineTo(tFarRight, tFarY);
      ctx.lineTo(tNearRight, tNearY);
      ctx.lineTo(tNearLeft, tNearY);
      ctx.closePath();
      ctx.fill();

      // Crisp White Border Lines (Perspective)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Outer border
      ctx.moveTo(tFarLeft + 3, tFarY + 2);
      ctx.lineTo(tFarRight - 3, tFarY + 2);
      ctx.lineTo(tNearRight - 4, tNearY - 3);
      ctx.lineTo(tNearLeft + 4, tNearY - 3);
      ctx.closePath();
      ctx.stroke();

      // Center Divider Line
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, tFarY + 2);
      ctx.lineTo(CANVAS_W / 2, tNearY - 3);
      ctx.stroke();

      ctx.restore();
    };

    // DRAW RED PARTY CUPS (Matching Image 1)
    const drawCups = (cups) => {
      // Sort cups by Y so closer cups overlap far cups correctly
      const sortedCups = [...cups].sort((a, b) => a.y - b.y);

      sortedCups.forEach((cup) => {
        if (cup.hit) return;
        ctx.save();
        ctx.translate(cup.x, cup.y);
        ctx.scale(cup.scale, cup.scale);

        // Cup Drop Shadow on Table
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 24, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cup Body (Red Plastic Cup with 3D gradient)
        const cupGrad = ctx.createLinearGradient(-18, 0, 18, 0);
        cupGrad.addColorStop(0, '#b91c1c'); // Shadow left
        cupGrad.addColorStop(0.25, '#ef4444'); // Highlight
        cupGrad.addColorStop(0.65, '#dc2626'); // Main red
        cupGrad.addColorStop(1, '#991b1b'); // Shadow right

        ctx.fillStyle = cupGrad;
        ctx.beginPath();
        ctx.moveTo(-18, -12);
        ctx.lineTo(18, -12);
        ctx.lineTo(13, 24);
        ctx.lineTo(-13, 24);
        ctx.closePath();
        ctx.fill();

        // Dark red ribs/ridges on cup
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-16, 2);
        ctx.lineTo(16, 2);
        ctx.moveTo(-15, 12);
        ctx.lineTo(15, 12);
        ctx.stroke();

        // White Inner Rim (Top Lip)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, -12, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner Liquid (Golden Coffee from Image 1)
        const beerGrad = ctx.createRadialGradient(0, -12, 2, 0, -12, 16);
        beerGrad.addColorStop(0, '#fef08a');
        beerGrad.addColorStop(0.8, '#f59e0b');
        beerGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = beerGrad;
        ctx.beginPath();
        ctx.ellipse(0, -11, 15, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    };

    // DRAW PING PONG BALL & SWIPE AIM INDICATOR
    const drawBallAndAim = (s) => {
      ctx.save();
      const b = s.ball;

      const surfaceY = getTableSurfaceY(b.z);
      const screenX = b.x;
      const screenY = surfaceY - Math.max(0, b.height);

      // Dynamic perspective scale: near (z=0) is 1.0 -> far (z=1.0) is 0.48
      const currentScale = Math.max(0.42, 1.0 - b.z * 0.52);
      const drawRadius = b.radius * currentScale;

      // 1. Ball shadow on table plane
      if (b.z >= 0 && b.z <= 1.08) {
        const shadowAlpha = Math.max(0.08, 0.42 - (Math.max(0, b.height) / 120) * 0.28);
        ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(screenX, surfaceY + 4, drawRadius * 1.15, drawRadius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Ball 3D Shading
      const ballGrad = ctx.createRadialGradient(
        screenX - drawRadius * 0.35,
        screenY - drawRadius * 0.35,
        drawRadius * 0.1,
        screenX,
        screenY,
        drawRadius
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.7, '#f1f5f9');
      ballGrad.addColorStop(1, '#94a3b8');

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, drawRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3. Aim Guide when ready to toss
      if (!b.isFlying && !s.isRoundOver) {
        if (!s.dragStart) {
          // Idle pulsing guide arrow pointing UP towards cups
          ctx.save();
          const pulse = Math.sin(performance.now() * 0.007) * 4;
          const arrowBaseY = screenY - 20;
          const arrowTopY = screenY - 65;

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(screenX, arrowBaseY);
          ctx.lineTo(screenX, arrowTopY + pulse);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(screenX - 6, arrowTopY + 8 + pulse);
          ctx.lineTo(screenX, arrowTopY + pulse);
          ctx.lineTo(screenX + 6, arrowTopY + 8 + pulse);
          ctx.stroke();

          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Swipe UP to toss 🎯', screenX, arrowTopY - 7 + pulse);
          ctx.restore();
        } else if (s.currentDrag) {
          // Active drag: draw trajectory arc and target reticle
          const rawDx = s.currentDrag.x - s.dragStart.x;
          const rawDy = s.dragStart.y - s.currentDrag.y;
          const isPull = rawDy < -10;
          const aimX = isPull ? -rawDx : rawDx;
          const aimY = isPull ? -rawDy : Math.max(10, rawDy);
          const powerNorm = Math.min(Math.max((aimY - 15) / 65, 0.65), 1.45);

          const predZ = Math.min(0.98, 0.45 + powerNorm * 0.45);
          const predSurfaceY = getTableSurfaceY(predZ);
          const predX = Math.max(50, Math.min(CANVAS_W - 50, CANVAS_W / 2 + (aimX / Math.max(30, aimY)) * 80 * powerNorm));

          ctx.save();
          // Trajectory arc dots
          const steps = 7;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const dotZ = predZ * t;
            const dotSurfaceY = getTableSurfaceY(dotZ);
            const dotHeight = Math.sin(t * Math.PI) * (42 * Math.sqrt(powerNorm));
            const dotX = CANVAS_W / 2 + (predX - CANVAS_W / 2) * t;
            const dotY = dotSurfaceY - dotHeight;
            const dotRadius = Math.max(2, (1 - dotZ * 0.5) * 3.5);

            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + t * 0.5})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Target reticle on table
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(predX, predSurfaceY, 15 * (1 - predZ * 0.4), 6 * (1 - predZ * 0.4), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fill();

          // Dotted pull line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(s.currentDrag.x, s.currentDrag.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      ctx.restore();
    };

    // DRAW TOP & BOTTOM HUD
    const drawHUD = (s) => {
      ctx.save();

      // --- 1. Top Level / Round Pill: e.g. "Round 1 / 3" ---
      const pillW = 130;
      const pillH = 18;
      const pillX = (CANVAS_W - pillW) / 2;
      const pillY = 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 9);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pillX + 9, pillY + 9, 10, 0, Math.PI * 2);
      ctx.arc(pillX + pillW - 9, pillY + 9, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '900 11px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(`${roundIndex + 1}`, pillX + 9, pillY + 13);
      ctx.fillText(`${TOTAL_ROUNDS}`, pillX + pillW - 9, pillY + 13);

      // --- 2. Best / Current Score ---
      ctx.font = '900 15px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(`Best: ${Math.max(bestScore, s.score)}`, CANVAS_W / 2, 46);
      ctx.shadowBlur = 0;

      // --- 3. 10-Second Timer Badge ---
      const timerBg = s.timeLeft <= 3 ? '#ef4444' : '#f59e0b';
      ctx.fillStyle = timerBg;
      ctx.beginPath();
      ctx.roundRect(CANVAS_W / 2 - 40, 52, 80, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱️ ${s.timeLeft}s`, CANVAS_W / 2, 67);

      // --- 4. Bottom HUD: Cups Sunk & Points ---
      const sunkCount = s.cups.filter((c) => c.hit).length;
      ctx.font = '900 16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(`🍺 Sunk: ${sunkCount}/6  •  ⭐ ${s.score} pts`, CANVAS_W / 2, CANVAS_H - 18);
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    // DRAW POPUP TEXT & PARTICLES
    const drawEffects = (s) => {
      // Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Popups
      s.popups.forEach((pop) => {
        ctx.save();
        ctx.font = '900 18px sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.globalAlpha = pop.alpha;
        ctx.strokeText(pop.text, pop.x, pop.y);
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });
    };

    // Reset ball back to player side
    const resetBall = () => {
      const s = stateRef.current;
      s.ball.isFlying = false;
      s.ball.bounced = false;
      s.ball.sunk = false;
      s.ball.sunkCupId = null;
      s.ball.x = CANVAS_W / 2;
      s.ball.z = 0;
      s.ball.height = 0;
      s.ball.vx = 0;
      s.ball.vz = 0;
      s.ball.vHeight = 0;
    };

    // MAIN ANIMATION LOOP
    const render = (time) => {
      const s = stateRef.current;
      const dt = Math.min((time - s.lastTime) / 1000, 0.05);
      s.lastTime = time;

      // Update Flying Ball Physics
      if (s.ball.isFlying) {
        if (s.ball.sunk) {
          // Ball sunk into cup: drops inside cup liquid
          s.ball.height = Math.max(-12, s.ball.height - 1.5);
        } else {
          s.ball.x += s.ball.vx;
          s.ball.z += s.ball.vz;
          s.ball.height += s.ball.vHeight;
          s.ball.vHeight -= 0.26; // Smooth gravity

          // Check Table Bounce:
          // Bounces ONLY when ball descends (vHeight < 0) to table level (height <= 0)
          // while over the mid-table surface (z between 0.20 and 0.72)
          if (s.ball.height <= 0 && s.ball.vHeight < 0 && s.ball.z >= 0.20 && s.ball.z < 0.72 && !s.ball.bounced) {
            s.ball.height = 0;
            s.ball.vHeight = -s.ball.vHeight * 0.58;
            s.ball.vz *= 0.92;
            s.ball.bounced = true;
            audio.playBounce();
          }

          const ballScreenX = s.ball.x;
          const surfaceY = getTableSurfaceY(s.ball.z);
          const ballScreenY = surfaceY - Math.max(0, s.ball.height);

          // Check Cup Hit (when ball reaches cups depth and descends near cup top rim)
          if (s.ball.z >= 0.72 && s.ball.z <= 1.06 && s.ball.height <= 22 && s.ball.vHeight <= 1.5) {
            for (const cup of s.cups) {
              if (!cup.hit) {
                const rimX = cup.x;
                const rimY = cup.y - 12 * cup.scale;
                const dist = Math.hypot(ballScreenX - rimX, ballScreenY - rimY);

                if (dist < 22 * cup.scale) {
                  // CUP SUNK!
                  cup.hit = true;
                  s.ball.sunk = true;
                  s.ball.sunkCupId = cup.id;
                  s.ball.vx = 0;
                  s.ball.vz = 0;
                  s.ball.vHeight = 0;
                  s.ball.x = rimX;
                  s.score += 100;
                  setScore(s.score);
                  audio.playCupScore();

                  // Golden splash particles
                  for (let i = 0; i < 16; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = 1.5 + Math.random() * 3.5;
                    s.particles.push({
                      x: rimX,
                      y: rimY,
                      vx: Math.cos(angle) * spd,
                      vy: Math.sin(angle) * spd - 2,
                      radius: 2 + Math.random() * 3,
                      color: '#f59e0b',
                      alpha: 1.0,
                      life: 0.6
                    });
                  }

                  // Popup "+100"
                  s.popups.push({
                    x: rimX,
                    y: rimY - 20,
                    text: '🍺 +100',
                    alpha: 1.0,
                    life: 0.8
                  });

                  // Reset all cups if all 6 are sunk
                  if (s.cups.every((c) => c.hit)) {
                    setTimeout(() => {
                      s.cups.forEach((c) => (c.hit = false));
                      s.popups.push({
                        x: CANVAS_W / 2,
                        y: 180,
                        text: '🔥 ALL CUPS SUNK! +200',
                        alpha: 1.0,
                        life: 1.2
                      });
                      s.score += 200;
                      setScore(s.score);
                    }, 400);
                  }

                  // Reset ball for next toss after short splash
                  setTimeout(() => {
                    resetBall();
                  }, 350);
                  break;
                }
              }
            }
          }

          // Reset Ball after shot finishes (overshoots table, falls off sides, or drops)
          if (
            s.ball.z > 1.18 ||
            ballScreenY > CANVAS_H + 20 ||
            ballScreenX < -30 ||
            ballScreenX > CANVAS_W + 30 ||
            (s.ball.z > 0.65 && s.ball.height < -40)
          ) {
            resetBall();
          }
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= dt;
        p.alpha = Math.max(0, p.life);
        if (p.life <= 0) s.particles.splice(i, 1);
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

      // 1. Room & Spectators
      drawSpectatorsAndRoom(time);

      // 2. 3D Perspective Blue Table
      drawTable();

      // 3. Red Cups
      drawCups(s.cups);

      // 4. Ball & Aim Indicator
      drawBallAndAim(s);

      // 5. Effects & Particles
      drawEffects(s);

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
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
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
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
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

      {/* Round Finished Banner */}
      {isRoundOver && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid #38bdf8',
            borderRadius: 3,
            px: 2.5,
            py: 1.2,
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <Typography sx={{ color: '#38bdf8', fontWeight: 900, fontSize: 16 }}>
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
//  SCORE SET MODAL FOR BEER PONG
// ============================================================================
const CoffeePongScoreSetDialog = ({
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
        🍺 Coffee Pong - Score Set
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        {/* Total Score Comparison */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800, display: 'block' }}>
              {player1?.username || 'Player 1'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#3b82f6' }}>
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
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: '#3b82f6' }}>
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
            <Button variant="contained" onClick={onNextRound} sx={{ fontWeight: 700, bgcolor: '#3b82f6' }}>
              Next Round ▶
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
//  MAIN BEER PONG GAME COMPONENT
// ============================================================================
export const CoffeePongGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
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
      if (winnerId === userId) return { text: '🏆 You Won the Match!', color: '#3b82f6' };
      const wName = winnerId === player1?.id ? player1?.username : player2?.username;
      return { text: `👑 ${wName} Won the Match!`, color: '#f59e0b' };
    }
    if (phase === 'result') {
      return { text: `Round ${currentRound} Finished! Check Score Set.`, color: '#38bdf8' };
    }
    if (phase === 'p1') {
      if (isP1 && isMyTurn) return { text: `🎮 Your Turn - Toss ping pong balls into cups!`, color: '#3b82f6' };
      return { text: `⏳ ${player1?.username || 'Player 1'} is playing...`, color: '#94a3b8' };
    }
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = gameData?.p1Score ?? gameData?.p1TotalScore ?? p1TotalScore ?? 0;
      if (isP2 && isMyTurn) return { text: `🎯 Target to beat: ${target} cups! Toss to score!`, color: '#3b82f6' };
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
          <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player1?.username || 'Player 1'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#3b82f6' }}>
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
        <CoffeePongEngine
          key={`engine-${engineKey}-${phase}-${currentRound}`}
          roundIndex={currentRound}
          isMyTurn={true}
          bestScore={Math.max(p1TotalScore, p2TotalScore, 2739)}
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
            🍺
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            {phase === 'p1' ? player1?.username : player2?.username} is Sinking Cups!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
            10-second shot clock running... You will throw next!
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
              <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                {player1?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#3b82f6' }}>
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
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
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
      <CoffeePongScoreSetDialog
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
export const beerPongInitialData = (player1, player2) => ({
  gameType: 'beerpong',
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
