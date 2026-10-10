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
  Chip
} from '@mui/material';

// ============================================================================
//  FALLING BOXES - 2-PLAYER GRAVITY STACKER GAME (3 ROUNDS)
//  Matches reference design:
//  - Top wooden box on metallic crane hanger oscillating left/right
//  - Tap anywhere to drop box with realistic gravity
//  - Box stacks on bottom platform or falls off -> Game Over for the round
//  - Score : X displayed at top-left in bold cartoon font
//  - Home & Audio buttons at top-right
//  - 3 Rounds total: Player 1 plays, score sent, then Player 2 plays
//  - Player with highest total score wins with detailed Score Set
// ============================================================================

const TOTAL_ROUNDS = 3;
const CANVAS_W = 320;
const CANVAS_H = 500;
const BOX_W = 96;
const BOX_H = 32;
const GROUND_H = 46;
const GROUND_Y = CANVAS_H - GROUND_H;

// --- Sound Synthesizer via Web Audio API ---
class WebAudioEffects {
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
  playDrop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
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
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.1);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }
  playPerfect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);
        gain.gain.setValueAtTime(0.2, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.18);
      });
    } catch (e) {}
  }
  playFall() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(75, t + 0.45);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch (e) {}
  }
}

const audioFX = new WebAudioEffects();

// --- Drawing Helper Functions ---
function drawWoodPlank(ctx, x, y, w, h) {
  ctx.save();
  // Main wood gradient
  const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
  woodGrad.addColorStop(0, '#e09540');
  woodGrad.addColorStop(0.18, '#c67d2d');
  woodGrad.addColorStop(0.82, '#a65c19');
  woodGrad.addColorStop(1, '#7d400e');
  ctx.fillStyle = woodGrad;

  // Box border with rounded corners
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();

  // Top highlight
  ctx.fillStyle = 'rgba(255, 235, 185, 0.45)';
  ctx.fillRect(x + 2, y + 2, Math.max(w - 4, 0), 3);

  // Bottom shadow
  ctx.fillStyle = 'rgba(60, 25, 5, 0.45)';
  ctx.fillRect(x + 2, y + h - 5, Math.max(w - 4, 0), 3);

  // Subtle wood grain lines
  ctx.strokeStyle = 'rgba(85, 40, 10, 0.28)';
  ctx.lineWidth = 1;
  const grainOffsets = [8, 16, 24];
  grainOffsets.forEach((gy) => {
    ctx.beginPath();
    ctx.moveTo(x + 4, y + gy);
    ctx.bezierCurveTo(x + w * 0.3, y + gy - 1.5, x + w * 0.7, y + gy + 1.5, x + w - 4, y + gy);
    ctx.stroke();
  });

  // Corner rivets / bolts
  const rivetColor = '#451d04';
  const rivetHighlight = '#fde68a';
  const rivetPositions = [
    [x + 5, y + 6],
    [x + w - 6, y + 6],
    [x + 5, y + h - 6],
    [x + w - 6, y + h - 6]
  ];
  rivetPositions.forEach(([rx, ry]) => {
    ctx.fillStyle = rivetColor;
    ctx.beginPath();
    ctx.arc(rx, ry, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rivetHighlight;
    ctx.beginPath();
    ctx.arc(rx - 0.6, ry - 0.6, 0.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Dark border
  ctx.strokeStyle = '#451d04';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.stroke();

  ctx.restore();
}

function drawCraneHanger(ctx, boxX, boxY, boxW) {
  ctx.save();
  const centerX = boxX + boxW / 2;

  // Suspension rod from top
  const rodGrad = ctx.createLinearGradient(centerX - 4, 0, centerX + 4, 0);
  rodGrad.addColorStop(0, '#334155');
  rodGrad.addColorStop(0.5, '#64748b');
  rodGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = rodGrad;
  ctx.fillRect(centerX - 3.5, 0, 7, boxY);

  // Metallic clamp plate
  const clampW = Math.min(boxW * 0.8, 110);
  const clampH = 14;
  const clampX = centerX - clampW / 2;
  const clampY = boxY - clampH;

  const clampGrad = ctx.createLinearGradient(clampX, clampY, clampX, clampY + clampH);
  clampGrad.addColorStop(0, '#94a3b8');
  clampGrad.addColorStop(0.4, '#475569');
  clampGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = clampGrad;
  ctx.beginPath();
  ctx.roundRect(clampX, clampY, clampW, clampH, [4, 4, 0, 0]);
  ctx.fill();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Clamp bolts
  [clampX + 12, clampX + clampW - 12].forEach((bx) => {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bx, clampY + 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(bx - 0.7, clampY + 6.3, 1, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawBackgroundScene(ctx, width, height, groundY, clouds) {
  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, '#0284c7');
  skyGrad.addColorStop(0.45, '#38bdf8');
  skyGrad.addColorStop(0.85, '#7dd3fc');
  skyGrad.addColorStop(1, '#bae6fd');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Clouds
  clouds.forEach((cloud) => {
    drawCloud(ctx, cloud.x, cloud.y, cloud.scale);
  });

  // 3. Distant City Skyline Silhouettes
  ctx.fillStyle = 'rgba(147, 197, 253, 0.45)';
  const skylineY = groundY - 48;
  const buildings = [
    { x: 10, w: 32, h: 42 },
    { x: 44, w: 26, h: 60 },
    { x: 72, w: 40, h: 36 },
    { x: 114, w: 35, h: 54 },
    { x: 151, w: 46, h: 48 },
    { x: 200, w: 30, h: 64 },
    { x: 232, w: 38, h: 38 },
    { x: 272, w: 42, h: 52 }
  ];
  buildings.forEach((b) => {
    ctx.fillRect(b.x, skylineY - (b.h - 36), b.w, b.h + 20);
    // Battlements / steps on top
    ctx.fillRect(b.x + 4, skylineY - (b.h - 36) - 5, b.w - 8, 5);
  });

  // 4. Ground Layer
  // Upper Grass
  const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 12);
  grassGrad.addColorStop(0, '#4ade80');
  grassGrad.addColorStop(0.3, '#22c55e');
  grassGrad.addColorStop(1, '#16a34a');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, groundY, width, 12);

  // Grass blades / fringe
  ctx.fillStyle = '#4ade80';
  for (let gx = 0; gx < width; gx += 8) {
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx + 4, groundY - 4);
    ctx.lineTo(gx + 8, groundY);
    ctx.fill();
  }

  // Lower Cliff / Rock face
  const rockGrad = ctx.createLinearGradient(0, groundY + 12, 0, height);
  rockGrad.addColorStop(0, '#451a03');
  rockGrad.addColorStop(0.5, '#291203');
  rockGrad.addColorStop(1, '#170801');
  ctx.fillStyle = rockGrad;
  ctx.fillRect(0, groundY + 12, width, height - (groundY + 12));

  // Rock facets & cracks
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 1.2;
  const cracks = [
    [[20, groundY + 12], [28, groundY + 28], [35, height]],
    [[85, groundY + 12], [80, groundY + 30], [95, height]],
    [[160, groundY + 12], [172, groundY + 24], [168, height]],
    [[240, groundY + 12], [235, groundY + 32], [250, height]]
  ];
  cracks.forEach((pts) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][1] ? pts[0][0] : 0, pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();
  });
}

function drawCloud(ctx, cx, cy, scale = 1) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.beginPath();
  const r = 18 * scale;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.arc(cx + r * 1.1, cy - r * 0.1, r * 0.85, 0, Math.PI * 2);
  ctx.arc(cx + r * 2.1, cy + r * 0.1, r * 0.75, 0, Math.PI * 2);
  ctx.arc(cx - r * 1.0, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.9, cy + r * 0.4, r * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Soft shaded bottom
  ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
  ctx.beginPath();
  ctx.arc(cx + r * 0.9, cy + r * 0.5, r * 0.65, 0, Math.PI * 2);
  ctx.arc(cx + r * 1.8, cy + r * 0.35, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Circular UI button drawing on canvas
function drawTopHUD(ctx, score, width, soundEnabled) {
  ctx.save();

  // "Score : X" in cartoon bold black font matching screenshot
  ctx.font = '900 24px "Fredoka One", "Comic Sans MS", "Arial Rounded MT Bold", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Subtle dark drop-shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillText(`Score : ${score}`, 14, 29);

  // Main black score text
  ctx.fillStyle = '#000000';
  ctx.fillText(`Score : ${score}`, 13, 27);

  // Top right Home & Music icon buttons
  const homeBtn = { x: width - 66, y: 27, r: 15 };
  const soundBtn = { x: width - 26, y: 27, r: 15 };

  // Draw Home button circle
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(homeBtn.x, homeBtn.y, homeBtn.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw Home icon
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const hx = homeBtn.x;
  const hy = homeBtn.y;
  ctx.moveTo(hx, hy - 7);
  ctx.lineTo(hx - 7, hy - 1);
  ctx.lineTo(hx - 5, hy - 1);
  ctx.lineTo(hx - 5, hy + 6);
  ctx.lineTo(hx - 1, hy + 6);
  ctx.lineTo(hx - 1, hy + 1);
  ctx.lineTo(hx + 1, hy + 1);
  ctx.lineTo(hx + 1, hy + 6);
  ctx.lineTo(hx + 5, hy + 6);
  ctx.lineTo(hx + 5, hy - 1);
  ctx.lineTo(hx + 7, hy - 1);
  ctx.closePath();
  ctx.fill();

  // Draw Sound button circle
  ctx.beginPath();
  ctx.arc(soundBtn.x, soundBtn.y, soundBtn.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw Music notes icon
  const sx = soundBtn.x;
  const sy = soundBtn.y;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sx - 3.5, sy + 3.5, 2.5, 0, Math.PI * 2);
  ctx.arc(sx + 3.5, sy + 1.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(sx - 2, sy - 5, 2, 8);
  ctx.fillRect(sx + 5, sy - 7, 2, 8);
  ctx.fillRect(sx - 2, sy - 6.5, 9, 3);

  if (!soundEnabled) {
    // Red diagonal slash
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx - 9, sy - 9);
    ctx.lineTo(sx + 9, sy + 9);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
//  StackerGameEngine Component (Interactive Canvas)
// ============================================================================
const StackerGameEngine = ({ roundIndex, isMyTurn, onRoundOver, onOpenScoreSet }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const [soundActive, setSoundActive] = useState(true);

  // Initialize or reset game state
  const resetGame = useCallback(() => {
    const baseX = (CANVAS_W - BOX_W) / 2;
    const baseY = GROUND_Y - BOX_H;
    const moverSpeed = 110 + roundIndex * 25;

    stateRef.current = {
      score: 0,
      cameraY: 0,
      targetCameraY: 0,
      gameOver: false,
      bannerText: null,
      bannerColor: '#ffffff',
      // Mover sliding at top
      mover: {
        x: 16,
        y: 28,
        w: BOX_W,
        dir: 1,
        speed: moverSpeed,
        visible: true
      },
      // Dropping box
      falling: null,
      // Stack of boxes (starts with foundation on grass)
      stack: [
        { x: baseX, y: baseY, w: BOX_W, h: BOX_H }
      ],
      // Clouds
      clouds: [
        { x: 180, y: 110, scale: 1.1, speed: 12 },
        { x: 40, y: 175, scale: 0.8, speed: 7 },
        { x: 260, y: 220, scale: 0.9, speed: 9 }
      ],
      // Visual particle effects
      particles: [],
      floatingTexts: []
    };
  }, [roundIndex]);

  // Handle Drop Action
  const dropBox = useCallback(() => {
    if (!isMyTurn) return;
    const s = stateRef.current;
    if (!s || s.gameOver || s.falling || !s.mover.visible) return;

    audioFX.playDrop();
    s.falling = {
      x: s.mover.x,
      y: s.mover.y,
      w: s.mover.w,
      h: BOX_H,
      vy: 0,
      vx: 0,
      angle: 0,
      vAngle: 0,
      fallingOff: false
    };
    s.mover.visible = false;
  }, [isMyTurn]);

  // Click / Touch Handler on Canvas
  const handleCanvasInteraction = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Check Home button click
    const homeBtn = { x: CANVAS_W - 66, y: 27, r: 18 };
    const distHome = Math.hypot(x - homeBtn.x, y - homeBtn.y);
    if (distHome <= homeBtn.r) {
      if (onOpenScoreSet) onOpenScoreSet();
      return;
    }

    // Check Sound button click
    const soundBtn = { x: CANVAS_W - 26, y: 27, r: 18 };
    const distSound = Math.hypot(x - soundBtn.x, y - soundBtn.y);
    if (distSound <= soundBtn.r) {
      audioFX.enabled = !audioFX.enabled;
      setSoundActive(audioFX.enabled);
      return;
    }

    // Otherwise drop the box!
    dropBox();
  }, [dropBox, onOpenScoreSet]);

  // Main Game Loop
  useEffect(() => {
    resetGame();
    lastTimeRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (now) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const s = stateRef.current;
      if (!s) return;

      // 1. Update Clouds
      s.clouds.forEach((cloud) => {
        cloud.x += cloud.speed * dt;
        if (cloud.x > CANVAS_W + 60) {
          cloud.x = -60;
        }
      });

      // 2. Smooth Camera Scroll
      s.cameraY += (s.targetCameraY - s.cameraY) * 0.1;

      // 3. Update Mover
      if (s.mover.visible && !s.falling) {
        s.mover.x += s.mover.dir * s.mover.speed * dt;
        const minX = 14;
        const maxX = CANVAS_W - s.mover.w - 14;
        if (s.mover.x >= maxX) {
          s.mover.x = maxX;
          s.mover.dir = -1;
        } else if (s.mover.x <= minX) {
          s.mover.x = minX;
          s.mover.dir = 1;
        }
      }

      // 4. Update Falling Box
      if (s.falling) {
        const f = s.falling;
        const gravity = 1350;
        f.vy += gravity * dt;
        f.y += f.vy * dt;
        f.x += f.vx * dt;
        f.angle += f.vAngle * dt;

        if (!f.fallingOff) {
          // Check collision with top box in stack
          const topBox = s.stack[s.stack.length - 1];
          const targetY = topBox.y;

          if (f.y + BOX_H >= targetY) {
            // Calculate horizontal overlap
            const overlapLeft = Math.max(f.x, topBox.x);
            const overlapRight = Math.min(f.x + f.w, topBox.x + topBox.w);
            const overlap = overlapRight - overlapLeft;

            if (overlap > 12) {
              // LANDED SUCCESSFULLY!
              const landedX = f.x;
              const landedY = targetY - BOX_H;
              s.stack.push({
                x: landedX,
                y: landedY,
                w: f.w,
                h: BOX_H
              });

              // Check for Perfect placement
              const centerDiff = Math.abs((f.x + f.w / 2) - (topBox.x + topBox.w / 2));
              if (centerDiff <= 5) {
                audioFX.playPerfect();
                s.score += 1;
                s.floatingTexts.push({
                  text: 'PERFECT! +1 🌟',
                  x: CANVAS_W / 2,
                  y: landedY - s.cameraY - 14,
                  life: 1.2,
                  color: '#fef08a'
                });
              } else {
                audioFX.playLand();
                s.score += 1;
              }

              // Spawn dust particles
              for (let p = 0; p < 8; p++) {
                s.particles.push({
                  x: overlapLeft + Math.random() * overlap,
                  y: targetY - s.cameraY,
                  vx: (Math.random() - 0.5) * 80,
                  vy: -Math.random() * 40 - 15,
                  r: Math.random() * 3 + 2,
                  life: 0.4
                });
              }

              s.falling = null;

              // Camera adjusts up if stack grows tall
              if (s.stack.length > 4) {
                s.targetCameraY = (s.stack.length - 4) * BOX_H;
              }

              // Respawn mover after short delay
              setTimeout(() => {
                const curState = stateRef.current;
                if (curState && !curState.gameOver) {
                  curState.mover.visible = true;
                  curState.mover.dir = Math.random() < 0.5 ? 1 : -1;
                  curState.mover.x = curState.mover.dir === 1 ? 16 : CANVAS_W - curState.mover.w - 16;
                  curState.mover.speed = Math.min(curState.mover.speed + 4, 250);
                }
              }, 220);
            } else {
              // MISSED / FALL OFF!
              f.fallingOff = true;
              audioFX.playFall();
              const dir = f.x + f.w / 2 > topBox.x + topBox.w / 2 ? 1 : -1;
              f.vx = dir * 110;
              f.vAngle = dir * 5.5;
              f.vy = -120; // slight bounce off edge

              s.bannerText = '💥 BOX FELL! MISSED!';
              s.bannerColor = '#ef4444';
            }
          }
        }

        // If falling off screen
        if (f.fallingOff && f.y > CANVAS_H + 120 && !s.gameOver) {
          s.gameOver = true;
          s.falling = null;
          const finalScore = s.score;

          setTimeout(() => {
            if (onRoundOver) onRoundOver(finalScore);
          }, 1000);
        }
      }

      // 5. Update Particles & Floating Text
      s.particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      });
      s.particles = s.particles.filter((p) => p.life > 0);

      s.floatingTexts.forEach((ft) => {
        ft.y -= 30 * dt;
        ft.life -= dt;
      });
      s.floatingTexts = s.floatingTexts.filter((ft) => ft.life > 0);

      // ======================================================================
      // RENDER FRAME
      // ======================================================================
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw Sky, Clouds, Skyline, Ground
      drawBackgroundScene(ctx, CANVAS_W, CANVAS_H, GROUND_Y, s.clouds);

      // Draw Stack (with camera scroll offset)
      ctx.save();
      s.stack.forEach((box) => {
        const renderY = box.y + s.cameraY;
        drawWoodPlank(ctx, box.x, renderY, box.w, box.h);
      });

      // Draw Falling Box
      if (s.falling) {
        const f = s.falling;
        ctx.save();
        const centerX = f.x + f.w / 2;
        const centerY = f.y + s.cameraY + f.h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(f.angle);
        drawWoodPlank(ctx, -f.w / 2, -f.h / 2, f.w, f.h);
        ctx.restore();
      }

      // Draw Crane & Mover Box at top
      if (s.mover.visible) {
        drawCraneHanger(ctx, s.mover.x, s.mover.y, s.mover.w);
        drawWoodPlank(ctx, s.mover.x, s.mover.y, s.mover.w, BOX_H);
      }
      ctx.restore();

      // Draw Particles
      ctx.save();
      s.particles.forEach((p) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(p.life / 0.4, 0)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Floating Texts
      s.floatingTexts.forEach((ft) => {
        ctx.font = '900 16px "Fredoka One", "Arial Rounded MT Bold", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.restore();

      // Draw Top HUD (Score & Buttons)
      drawTopHUD(ctx, s.score, CANVAS_W, audioFX.enabled);

      // Draw Banner (Missed / Game Over)
      if (s.bannerText) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, CANVAS_H / 2 - 40, CANVAS_W, 70);
        ctx.font = '900 22px "Fredoka One", "Arial Rounded MT Bold", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = s.bannerColor;
        ctx.fillText(s.bannerText, CANVAS_W / 2, CANVAS_H / 2 - 8);
        ctx.font = '700 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Final Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 18);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resetGame, onRoundOver]);

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCanvasInteraction}
        onTouchStart={handleCanvasInteraction}
        style={{
          width: '100%',
          maxWidth: CANVAS_W,
          height: 'auto',
          aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.45), 0 0 1px rgba(255,255,255,0.2)',
          cursor: isMyTurn ? 'pointer' : 'not-allowed',
          display: 'block',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
      />
      {isMyTurn && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.8,
            fontWeight: 700,
            fontSize: 11,
            color: 'text.secondary',
            letterSpacing: 0.5
          }}
        >
          👇 TAP ANYWHERE TO DROP THE BOX!
        </Typography>
      )}
    </Box>
  );
};

// ============================================================================
//  ScoreSetModal Component (Score Set View)
// ============================================================================
const ScoreSetModal = ({ open, onClose, rounds, p1TotalScore, p2TotalScore, player1, player2, status, winnerId, isP1, onNextRound, currentRound }) => {
  const isFinished = status === 'finished';
  const p1SNum = Number(p1TotalScore) || 0;
  const p2SNum = Number(p2TotalScore) || 0;
  const winnerName = winnerId === player1?.id
    ? player1?.username
    : winnerId === player2?.id
      ? player2?.username
      : (p1SNum > p2SNum ? player1?.username : (p2SNum > p1SNum ? player2?.username : null));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, pb: 1, fontSize: 18 }}>
        🏆 Falling Boxes - Score Set
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        {/* Total Score Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800, display: 'block' }}>
              {player1?.username || 'Player 1'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#ef4444' }}>
              {p1SNum}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Points</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.disabled' }}>VS</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 800, display: 'block' }}>
              {player2?.username || 'Player 2'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0ea5e9' }}>
              {p2SNum}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Points</Typography>
          </Box>
        </Box>

        {/* Round by Round Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.selected' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>Round</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: '#ef4444' }}>
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
                const rData = rounds[rNum - 1] || (rNum === 1 && (p1SNum > 0 || p2SNum > 0 || isFinished) ? { p1Score: p1SNum, p2Score: p2SNum } : null);
                const p1ScoreVal = rData && rData.p1Score !== null && rData.p1Score !== undefined ? rData.p1Score : (rNum === 1 && isFinished ? p1SNum : '-');
                const p2ScoreVal = rData && rData.p2Score !== null && rData.p2Score !== undefined ? rData.p2Score : (rNum === 1 && isFinished ? p2SNum : '-');
                let roundWinner = null;
                if (rData && p1ScoreVal !== '-' && p2ScoreVal !== '-' && p1ScoreVal !== null && p2ScoreVal !== null) {
                  if (Number(p1ScoreVal) > Number(p2ScoreVal)) roundWinner = player1?.username;
                  else if (Number(p2ScoreVal) > Number(p1ScoreVal)) roundWinner = player2?.username;
                  else roundWinner = 'Tie';
                }

                return (
                  <TableRow key={rNum} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700 }}>Round {rNum}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{p1ScoreVal}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{p2ScoreVal}</TableCell>
                    <TableCell align="right">
                      {roundWinner ? (
                        <Chip label={roundWinner} size="small" color={roundWinner === 'Tie' ? 'default' : 'primary'} sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
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
              {(p1SNum === p2SNum && (winnerId === 'draw' || !winnerName)) ? '🤝 It is a Tie Game!' : `👑 ${winnerName} Wins the Game!`}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Final: {p1SNum} vs {p2SNum} Points
            </Typography>
          </Box>
        )}

        {/* Next Round Action */}
        {!isFinished && onNextRound && (
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              onClose();
              onNextRound();
            }}
            sx={{
              mt: 1,
              py: 1,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)' }
            }}
          >
            Start Round {Math.min(currentRound + 1, TOTAL_ROUNDS)} ▶
          </Button>
        )}

        <Button fullWidth variant="outlined" onClick={onClose} sx={{ mt: 1, fontWeight: 700, textTransform: 'none' }}>
          Back to Game
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
//  MAIN FALLING BOXES GAME COMPONENT
// ============================================================================
export const FallingBoxesGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
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

  const p1SDisplay = Number(gameData?.p1TotalScore ?? gameData?.p1Score ?? gameData?.p1FinalScore ?? p1TotalScore ?? 0);
  const p2SDisplay = Number(gameData?.p2TotalScore ?? gameData?.p2Score ?? gameData?.p2FinalScore ?? p2TotalScore ?? 0);

  const isP1 = userId === player1?.id;
  const isP2 = userId === player2?.id;
  const isPlayer = isP1 || isP2;
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
      const p1S = Number(gameData?.p1Score ?? gameData?.p1TotalScore ?? gameData?.p1FinalScore ?? p1TotalScore ?? 0);
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
      if (winnerId === userId) return { text: '🏆 You Won the Match!', color: '#22c55e' };
      const wName = winnerId === player1?.id ? player1?.username : player2?.username;
      return { text: `👑 ${wName} Won the Match!`, color: '#f59e0b' };
    }
    if (phase === 'result') {
      return { text: `Round ${currentRound} Finished! Check Score Set.`, color: '#38bdf8' };
    }
    if (phase === 'p1') {
      if (isP1 && isMyTurn) return { text: `🎮 Your Turn - Tap anywhere to drop & stack!`, color: '#22c55e' };
      return { text: `⏳ ${player1?.username || 'Player 1'} is playing...`, color: '#94a3b8' };
    }
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = p1SDisplay;
      if (isP2 && isMyTurn) return { text: `🎯 Target to beat: ${target} pts! Tap to drop!`, color: '#f59e0b' };
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
          <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800, display: 'block', fontSize: 11 }}>
            {player1?.username || 'Player 1'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 900, color: '#ef4444' }}>
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
        <StackerGameEngine
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
            📦
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            {phase === 'p1' ? player1?.username : player2?.username} is Dropping Boxes!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
            Waiting for their round score... You will play next!
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

      {/* Round Finished / Result Overview Card */}
      {phase === 'result' && (
        <Box
          sx={{
            width: '100%',
            p: 2,
            borderRadius: 3,
            bgcolor: isDarkTheme ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.9)',
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
              <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700 }}>
                {player1?.username}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#ef4444' }}>
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

      {/* Score Set Modal */}
      <ScoreSetModal
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
export const fallingBoxesInitialData = (player1, player2) => ({
  gameType: 'fallingboxes',
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
