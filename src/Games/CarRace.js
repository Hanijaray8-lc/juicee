import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BoltIcon from '@mui/icons-material/Bolt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// ============================================================================
//  CAR RACE - 2-PLAYER ASYNC CHALLENGE ARCADE
//  Faithful recreation matching reference image 2:
//  - Top-down 2D asphalt highway with grass shoulders & curb markings
//  - Dashed white lane dividers, solid yellow lane lines
//  - Blue sports car with dual racing stripes (player)
//  - Magenta/pink coupe, yellow taxi, red racer traffic obstacles
//  - Golden stars for score pickups (⭐ 32 in top left)
//  - Nitro lightning bolt pickups (⚡ boost with speed trails)
//  - Web Audio API Sound Synthesizer for engine, chimes, turbo, and crash
//  - 2-Player Challenge: Player 1 plays & sets score -> Challenge sent to Player 2
//    -> Player 2 accepts & races (Player 1 doesn't show game window)
//    -> Player 2 finishes -> Winner & loser announced!
// ============================================================================

const CANVAS_W = 340;
const CANVAS_H = 520;
const ROAD_LEFT = 45;
const ROAD_RIGHT = CANVAS_W - 45;
const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
const LANE_COUNT = 3;
const LANE_W = ROAD_W / LANE_COUNT;

// Lane center X coordinates
const getLaneX = (lane) => ROAD_LEFT + lane * LANE_W + LANE_W / 2;

// --- Web Audio Synthesizer for Arcade Car Racing FX ---
class CarRaceAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.engineOsc = null;
    this.engineGain = null;
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

  startEngine() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || this.engineOsc) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      // Lowpass filter for deep engine roar
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    } catch (e) {}
  }

  updateEnginePitch(speedRatio) {
    if (!this.engineOsc || !this.ctx) return;
    try {
      const baseFreq = 65 + speedRatio * 85;
      this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    } catch (e) {}
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
  }

  playStarPickup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.12); // D6
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }

  playNitroBoost() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch (e) {}
  }

  playCrash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Low explosion boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.45);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.1;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.18, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.28);
        osc.start(st);
        osc.stop(st + 0.28);
      });
    } catch (e) {}
  }
}

export const CarRaceGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    phase = 'p1_racing', // 'p1_racing' | 'p2_challenge' | 'p2_racing' | 'finished'
    p1Score = null,
    p2Score = null,
    winnerId = null,
    status = 'active',
    challengerId = player1?.id
  } = gameData;

  const isP1 = userId === player1?.id;
  const isP2 = userId === player2?.id;
  const myName = isP1 ? player1?.username : player2?.username;
  const oppName = isP1 ? player2?.username : player1?.username;

  // Determines whether CURRENT user should be driving right now
  const amICurrentDriver =
    (phase === 'p1_racing' && isP1) ||
    (phase === 'p2_racing' && isP2);

  // Canvas and game loop refs
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Game live states
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'running' | 'crashed'
  const [liveScore, setLiveScore] = useState(0);
  const [nitroActive, setNitroActive] = useState(false);
  const [nitroRemaining, setNitroRemaining] = useState(0);
  const [speedMph, setSpeedMph] = useState(85);

  // References for requestAnimationFrame loop
  const pPosRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H - 100, targetX: CANVAS_W / 2 });
  const roadOffsetRef = useRef(0);
  const trafficRef = useRef([]);
  const itemsRef = useRef([]); // stars and nitro pickups
  const particlesRef = useRef([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(5); // pixels per frame
  const nitroTimerRef = useRef(0);
  const animFrameRef = useRef(null);
  const isPausedRef = useRef(false);
  const stateRef = useRef('ready');
  const lastSpawnRef = useRef(0);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new CarRaceAudioSynthesizer();
    return () => {
      if (audioRef.current) audioRef.current.stopEngine();
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (audioRef.current) audioRef.current.enabled = next;
    if (!next && audioRef.current) audioRef.current.stopEngine();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!amICurrentDriver || stateRef.current !== 'running') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        pPosRef.current.targetX = Math.max(ROAD_LEFT + 22, pPosRef.current.targetX - LANE_W);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        pPosRef.current.targetX = Math.min(ROAD_RIGHT - 22, pPosRef.current.targetX + LANE_W);
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        activateNitro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [amICurrentDriver]);

  // Activate Nitro Turbo Boost
  const activateNitro = useCallback(() => {
    if (nitroTimerRef.current <= 0 && stateRef.current === 'running') {
      nitroTimerRef.current = 180; // ~3 seconds at 60fps
      setNitroActive(true);
      if (audioRef.current) audioRef.current.playNitroBoost();
    }
  }, []);

  // Steer left or right via on-screen buttons
  const steerLeft = () => {
    if (!amICurrentDriver || stateRef.current !== 'running') return;
    pPosRef.current.targetX = Math.max(ROAD_LEFT + 22, pPosRef.current.targetX - LANE_W);
  };
  const steerRight = () => {
    if (!amICurrentDriver || stateRef.current !== 'running') return;
    pPosRef.current.targetX = Math.min(ROAD_RIGHT - 22, pPosRef.current.targetX + LANE_W);
  };

  // Start current player's race
  const startRace = () => {
    stateRef.current = 'running';
    setGameState('running');
    scoreRef.current = 0;
    setLiveScore(0);
    speedRef.current = 5;
    nitroTimerRef.current = 0;
    setNitroActive(false);
    trafficRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    pPosRef.current = { x: CANVAS_W / 2, y: CANVAS_H - 100, targetX: CANVAS_W / 2 };
    if (audioRef.current) audioRef.current.startEngine();
  };

  // Main Car Race Game Loop
  useEffect(() => {
    if (!amICurrentDriver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const TRAFFIC_COLORS = [
      { body: '#d946ef', roof: '#a21caf', stripe: '#fdf4ff', type: 'pink_coupe' },   // Reference image pink car
      { body: '#eab308', roof: '#ca8a04', stripe: '#1e293b', type: 'yellow_cab' },
      { body: '#ef4444', roof: '#b91c1c', stripe: '#ffffff', type: 'red_racer' },
      { body: '#10b981', roof: '#047857', stripe: '#ecfdf5', type: 'green_coupe' }
    ];

    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!isPausedRef.current && stateRef.current === 'running') {
        // Calculate speed
        const isNitro = nitroTimerRef.current > 0;
        if (isNitro) {
          nitroTimerRef.current--;
          if (nitroTimerRef.current <= 0) setNitroActive(false);
        }
        const currentSpeed = isNitro ? 10.5 : 5.8 + Math.min(scoreRef.current * 0.05, 3.5);
        speedRef.current = currentSpeed;
        setSpeedMph(Math.round(currentSpeed * 18));
        if (audioRef.current) audioRef.current.updateEnginePitch(currentSpeed / 14);

        // Advance road
        roadOffsetRef.current = (roadOffsetRef.current + currentSpeed) % 40;

        // Smooth player steering interpolation
        pPosRef.current.x += (pPosRef.current.targetX - pPosRef.current.x) * 0.22;

        // Spawn traffic
        lastSpawnRef.current++;
        const spawnInterval = isNitro ? 38 : Math.max(48, 75 - Math.floor(scoreRef.current * 0.5));
        if (lastSpawnRef.current >= spawnInterval) {
          lastSpawnRef.current = 0;
          const lane = Math.floor(Math.random() * LANE_COUNT);
          const laneX = getLaneX(lane);

          // Check if lane is currently clear at the top
          const isClear = !trafficRef.current.some(c => Math.abs(c.x - laneX) < 25 && c.y < 120);
          if (isClear) {
            const colorDef = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
            trafficRef.current.push({
              x: laneX,
              y: -80,
              width: 32,
              height: 56,
              speed: currentSpeed * (0.35 + Math.random() * 0.3),
              color: colorDef
            });
          }

          // Random item spawn: star (65%) or nitro (15%)
          if (Math.random() < 0.6) {
            const itemLane = Math.floor(Math.random() * LANE_COUNT);
            const isStar = Math.random() < 0.8;
            itemsRef.current.push({
              x: getLaneX(itemLane),
              y: -50,
              type: isStar ? 'star' : 'nitro',
              size: 20
            });
          }
        }

        // Update traffic
        trafficRef.current.forEach(c => {
          c.y += (currentSpeed - c.speed);
        });
        trafficRef.current = trafficRef.current.filter(c => c.y < CANVAS_H + 100);

        // Update items
        itemsRef.current.forEach(item => {
          item.y += currentSpeed;
        });

        // Player bounds for collision (bounding box)
        const pCar = {
          x: pPosRef.current.x - 16,
          y: pPosRef.current.y - 28,
          w: 32,
          h: 56
        };

        // Check item collisions
        itemsRef.current = itemsRef.current.filter(item => {
          const dist = Math.hypot(pPosRef.current.x - item.x, pPosRef.current.y - item.y);
          if (dist < 32) {
            if (item.type === 'star') {
              scoreRef.current += 1;
              setLiveScore(scoreRef.current);
              if (audioRef.current) audioRef.current.playStarPickup();
              // Star sparkles
              for (let i = 0; i < 6; i++) {
                particlesRef.current.push({
                  x: item.x,
                  y: item.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: '#fbbf24',
                  life: 20
                });
              }
            } else if (item.type === 'nitro') {
              scoreRef.current += 5;
              setLiveScore(scoreRef.current);
              activateNitro();
            }
            return false;
          }
          return item.y < CANVAS_H + 50;
        });

        // Check traffic collisions
        for (const t of trafficRef.current) {
          const collision =
            pCar.x < t.x + t.width / 2 &&
            pCar.x + pCar.w > t.x - t.width / 2 &&
            pCar.y < t.y + t.height / 2 &&
            pCar.y + pCar.h > t.y - t.height / 2;

          if (collision) {
            if (isNitro) {
              // Nitro ram! Knock enemy car away
              t.y = CANVAS_H + 200;
              scoreRef.current += 2;
              setLiveScore(scoreRef.current);
              // Explosion particles for knocked car
              for (let i = 0; i < 12; i++) {
                particlesRef.current.push({
                  x: t.x,
                  y: t.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#f97316',
                  life: 30
                });
              }
            } else {
              // Crash!
              triggerCrash();
              break;
            }
          }
        }

        // Add speed / exhaust particles
        if (Math.random() < (isNitro ? 0.9 : 0.3)) {
          particlesRef.current.push({
            x: pPosRef.current.x + (Math.random() - 0.5) * 12,
            y: pPosRef.current.y + 28,
            vx: (Math.random() - 0.5) * 1.5,
            vy: currentSpeed * 0.8,
            color: isNitro ? '#00f2fe' : '#ffffff44',
            life: isNitro ? 18 : 12
          });
        }

        // Update particles
        particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      }

      // --- RENDERING ---
      // 1. Grass Shoulders
      ctx.fillStyle = '#22c55e'; // Vibrant grass green matching reference image
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grass texture noise/lines
      ctx.fillStyle = '#16a34a';
      for (let y = (roadOffsetRef.current % 30); y < CANVAS_H; y += 30) {
        ctx.fillRect(0, y, ROAD_LEFT, 6);
        ctx.fillRect(ROAD_RIGHT, y, CANVAS_W - ROAD_RIGHT, 6);
      }

      // 2. Curbs / Road Borders
      const curbW = 8;
      const curbSegH = 20;
      for (let y = -curbSegH + (roadOffsetRef.current % (curbSegH * 2)); y < CANVAS_H; y += curbSegH) {
        const isRed = Math.floor((y + roadOffsetRef.current) / curbSegH) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
        ctx.fillRect(ROAD_LEFT - curbW, y, curbW, curbSegH);
        ctx.fillRect(ROAD_RIGHT, y, curbW, curbSegH);
      }

      // 3. Asphalt Highway
      ctx.fillStyle = '#262a33';
      ctx.fillRect(ROAD_LEFT, 0, ROAD_W, CANVAS_H);

      // Solid yellow center divider or solid side lines (matching reference image)
      ctx.strokeStyle = '#f59e0b'; // Golden yellow divider
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(ROAD_LEFT + ROAD_W / 2, 0);
      ctx.lineTo(ROAD_LEFT + ROAD_W / 2, CANVAS_H);
      ctx.stroke();

      // White dashed lane markers
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([18, 18]);
      ctx.lineDashOffset = -roadOffsetRef.current;

      // Lane 1 divider
      ctx.beginPath();
      ctx.moveTo(ROAD_LEFT + LANE_W, 0);
      ctx.lineTo(ROAD_LEFT + LANE_W, CANVAS_H);
      ctx.stroke();

      // Lane 2 divider
      ctx.beginPath();
      ctx.moveTo(ROAD_LEFT + LANE_W * 2, 0);
      ctx.lineTo(ROAD_LEFT + LANE_W * 2, CANVAS_H);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // 4. Draw Pickups (Stars & Nitro)
      itemsRef.current.forEach(item => {
        if (item.type === 'star') {
          // Golden 5-point Star (matching top-left ⭐ 32 in reference image)
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 11, -Math.sin((18 + i * 72) * Math.PI / 180) * 11);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 5, -Math.sin((54 + i * 72) * Math.PI / 180) * 5);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (item.type === 'nitro') {
          // Lightning bolt badge
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.fillStyle = '#00f2fe';
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', 0, 0);
          ctx.restore();
        }
      });

      // 5. Draw Traffic Cars
      trafficRef.current.forEach(c => {
        drawCar(ctx, c.x, c.y, c.color.body, c.color.roof, c.color.stripe, false);
      });

      // 6. Draw Player Car (Blue Sports Car with dual racing stripes - reference image)
      const isNitro = nitroTimerRef.current > 0;
      drawCar(ctx, pPosRef.current.x, pPosRef.current.y, '#2563eb', '#1d4ed8', '#ffffff', isNitro);

      // 7. Draw Particles (Sparks, Exhaust, Flame)
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.life * 0.18), 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [amICurrentDriver]);

  // Car Renderer (Detailed 2D top-down sports car matching reference)
  const drawCar = (ctx, x, y, bodyColor, roofColor, stripeColor, isNitro) => {
    ctx.save();
    ctx.translate(x, y);

    // Car Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-17, -27, 34, 56, 8);
    ctx.fill();

    // Wheels / Tires
    ctx.fillStyle = '#111827';
    ctx.fillRect(-18, -20, 4, 11); // front-left
    ctx.fillRect(14, -20, 4, 11);  // front-right
    ctx.fillRect(-18, 11, 4, 11);  // rear-left
    ctx.fillRect(14, 11, 4, 11);   // rear-right

    // Nitro exhaust flame
    if (isNitro) {
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(-8, 26);
      ctx.lineTo(0, 42 + Math.random() * 8);
      ctx.lineTo(8, 26);
      ctx.closePath();
      ctx.fill();
    }

    // Main Car Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-15, -26, 30, 52, 6);
    ctx.fill();

    // Front headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-12, -26, 6, 3);
    ctx.fillRect(6, -26, 6, 3);

    // Racing Stripes (White dual stripes down the hood, roof, and trunk)
    ctx.fillStyle = stripeColor;
    ctx.fillRect(-4, -25, 3, 50);
    ctx.fillRect(1, -25, 3, 50);

    // Windshield (front)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.lineTo(11, -12);
    ctx.lineTo(9, -3);
    ctx.lineTo(-9, -3);
    ctx.closePath();
    ctx.fill();

    // Roof
    ctx.fillStyle = roofColor;
    ctx.fillRect(-9, -3, 18, 18);

    // Rear Windshield
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-9, 15);
    ctx.lineTo(9, 15);
    ctx.lineTo(11, 21);
    ctx.lineTo(-11, 21);
    ctx.closePath();
    ctx.fill();

    // Tail lights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-13, 24, 6, 2);
    ctx.fillRect(7, 24, 6, 2);

    ctx.restore();
  };

  // Trigger Crash
  const triggerCrash = () => {
    stateRef.current = 'crashed';
    setGameState('crashed');
    if (audioRef.current) {
      audioRef.current.stopEngine();
      audioRef.current.playCrash();
    }
  };

  // --- SUBMISSION LOGIC ---

  // When Player 1 finishes their race:
  // Player 1 sends the challenge to Player 2 with their final score!
  const handlePlayer1SubmitScore = () => {
    const finalScore = scoreRef.current;
    const challengeData = {
      ...gameData,
      status: 'invited',
      phase: 'p2_challenge',
      p1Score: finalScore,
      p2Score: null,
      winnerId: null,
      challengerId: player1?.id,
      turnPlayerId: player2?.id
    };
    onSendGameMessage(challengeData);
  };

  // When Player 2 finishes their race:
  // Winner is calculated and match ends with winner message!
  const handlePlayer2SubmitScore = () => {
    const finalP2Score = scoreRef.current;
    const p1S = p1Score || 0;
    const p2S = finalP2Score;

    let computedWinner = 'draw';
    if (p1S > p2S) computedWinner = player1?.id;
    else if (p2S > p1S) computedWinner = player2?.id;

    if (audioRef.current) audioRef.current.playFanfare();

    const finishedData = {
      ...gameData,
      status: 'finished',
      phase: 'finished',
      p1Score: p1S,
      p2Score: p2S,
      winnerId: computedWinner,
      winnerScore: Math.max(p1S, p2S),
      loserScore: Math.min(p1S, p2S),
      turnPlayerId: null
    };
    onSendGameMessage(finishedData);
  };

  // Auto-submit score when Player 2 crashes/ends race
  useEffect(() => {
    if (isP2 && phase === 'p2_racing' && gameState === 'crashed') {
      const autoTimer = setTimeout(() => {
        handlePlayer2SubmitScore();
      }, 2500);
      return () => clearTimeout(autoTimer);
    }
  }, [isP2, phase, gameState]);

  // Rematch: resets for a fresh round where the challenger plays first!
  const handleRematch = () => {
    const rematchData = {
      ...gameData,
      status: 'active',
      phase: 'p1_racing',
      p1Score: null,
      p2Score: null,
      winnerId: null,
      turnPlayerId: player1?.id,
      challengerId: player1?.id
    };
    onSendGameMessage(rematchData);
    setGameState('ready');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: { xs: 440, sm: 360 },
      height: { xs: '100%', sm: 'auto' },
      flex: { xs: 1, sm: 'unset' },
      userSelect: 'none',
      position: 'relative',
      minHeight: 0
    }}>
      {/* Tablet / Mobile Device Arcade Frame (faithful to reference image 2) */}
      <Box sx={{
        width: { xs: '100%', sm: CANVAS_W },
        maxWidth: { xs: 440, sm: CANVAS_W },
        height: { xs: '100%', sm: CANVAS_H },
        flex: { xs: 1, sm: 'unset' },
        minHeight: { xs: 460, sm: CANVAS_H },
        borderRadius: { xs: 3, sm: 4 },
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.15)',
        bgcolor: '#000',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Main Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            flex: 1
          }}
        />

        {/* HUD Top Bar Overlay (matches reference image: ⭐ 32 on left, ⏸️ 🔊 🎵 on right) */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {/* Top Left: Golden Star Icon & Score (exactly like reference image ⭐ 32) */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            py: 0.4,
            px: 1.2,
            borderRadius: 3,
            border: '1.5px solid rgba(251, 191, 36, 0.4)'
          }}>
            <Typography sx={{ fontSize: 20, color: '#fbbf24', filter: 'drop-shadow(0 0 6px #f59e0b)' }}>
              ⭐
            </Typography>
            <Typography sx={{
              fontWeight: 900,
              fontSize: '1.25rem',
              color: '#fff',
              fontStyle: 'italic',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
            }}>
              {liveScore}
            </Typography>
          </Box>

          {/* Target Score to beat (shown during Player 2's race) */}
          {phase === 'p2_racing' && p1Score !== null && (
            <Chip
              size="small"
              label={`BEAT: ${p1Score} ⭐`}
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.85)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.75rem'
              }}
            />
          )}

          {/* Top Right Controls (Sound, Pause) */}
          <Box sx={{ display: 'flex', gap: 0.5, pointerEvents: 'auto' }}>
            <IconButton
              size="small"
              onClick={toggleSound}
              sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
            >
              {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>

        {/* Speedometer & Nitro bar at Bottom Left */}
        <Box sx={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: nitroActive ? '#00f2fe' : 'rgba(255,255,255,0.7)',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)'
          }}>
            {nitroActive ? '⚡ NITRO ACTIVE' : `${speedMph} MPH`}
          </Typography>
        </Box>

        {/* Nitro Boost Button at Bottom Right (matches reference image lightning boost button) */}
        {amICurrentDriver && gameState === 'running' && (
          <Box sx={{
            position: 'absolute',
            bottom: 16,
            right: 14,
            zIndex: 10
          }}>
            <IconButton
              onClick={activateNitro}
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'rgba(0, 242, 254, 0.85)',
                color: '#000',
                boxShadow: '0 4px 15px rgba(0, 242, 254, 0.6)',
                '&:hover': { bgcolor: '#00f2fe', transform: 'scale(1.08)' }
              }}
            >
              <BoltIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>
        )}

        {/* READY / START SCREEN OVERLAY */}
        {amICurrentDriver && gameState === 'ready' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.8,
            p: 3,
            textAlign: 'center',
            zIndex: 20
          }}>
            <Typography sx={{ fontSize: 44 }}>🏎️</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff' }}>
              {isP1 ? 'Start Your Race!' : `Can You Beat ${p1Score} ⭐?`}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 240 }}>
              {isP1
                ? 'Dodge incoming traffic, collect golden stars, and set a high score challenge!'
                : `${player1?.username} set a score of ${p1Score} ⭐! Race fast to beat them!`
              }
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={startRace}
              sx={{
                mt: 1,
                py: 1.2,
                px: 4,
                borderRadius: 3,
                fontWeight: 900,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#000',
                boxShadow: '0 6px 20px rgba(0, 242, 254, 0.4)',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              🏁 RACE NOW!
            </Button>
          </Box>
        )}

        {/* CRASHED / FINISHED OVERLAY FOR CURRENT RACER */}
        {amICurrentDriver && gameState === 'crashed' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            p: 3,
            textAlign: 'center',
            zIndex: 20
          }}>
            <Typography sx={{ fontSize: 48 }}>💥</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#ef4444' }}>
              CRASH!
            </Typography>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              p: 1.5,
              borderRadius: 3,
              width: '100%',
              maxWidth: 220
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                YOUR FINAL SCORE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#fbbf24', fontStyle: 'italic' }}>
                ⭐ {liveScore}
              </Typography>
            </Box>

            {/* P1 Submits Score as Challenge to P2 */}
            {isP1 && phase === 'p1_racing' && (
              <Button
                variant="contained"
                onClick={handlePlayer1SubmitScore}
                sx={{
                  py: 1.2,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#fff',
                  boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)'
                }}
              >
                🚀 Challenge {player2?.username}!
              </Button>
            )}

            {/* P2 Submits Score to Complete Game and Announce Winner */}
            {isP2 && phase === 'p2_racing' && (
              <Button
                variant="contained"
                onClick={handlePlayer2SubmitScore}
                sx={{
                  py: 1.2,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#000',
                  boxShadow: '0 6px 20px rgba(0, 242, 254, 0.4)'
                }}
              >
                🏆 View Race Results!
              </Button>
            )}
          </Box>
        )}

        {/* WAITING OVERLAY: When Player 1 is waiting for Player 2 to race */}
        {!amICurrentDriver && phase !== 'finished' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(10, 15, 30, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            p: 3,
            textAlign: 'center',
            zIndex: 20
          }}>
            <Typography sx={{ fontSize: 44 }}>⏳</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
              {phase === 'p2_challenge'
                ? `Challenge Sent to ${player2?.username}!`
                : `${player2?.username} is Racing!`
              }
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 230 }}>
              {phase === 'p2_challenge'
                ? `You set the target: ${p1Score} ⭐! Waiting for ${player2?.username} to accept and race.`
                : `${player2?.username} is currently racing to beat your score of ${p1Score} ⭐!`
              }
            </Typography>
            <Box sx={{
              p: 1.2,
              px: 2,
              borderRadius: 2,
              bgcolor: 'rgba(251, 191, 36, 0.1)',
              border: '1px dashed rgba(251, 191, 36, 0.3)'
            }}>
              <Typography sx={{ color: '#fbbf24', fontWeight: 800 }}>
                Target: {p1Score} Stars ⭐
              </Typography>
            </Box>
          </Box>
        )}

        {/* FINAL WINNER / LOSER ANNOUNCEMENT SCREEN */}
        {phase === 'finished' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(10, 15, 30, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            p: 3,
            textAlign: 'center',
            zIndex: 25
          }}>
            {/* Winner Trophy / Icon */}
            <Typography sx={{ fontSize: 50 }}>
              {winnerId === 'draw' ? '🤝' : (winnerId === userId ? '🏆' : '👑')}
            </Typography>

            <Typography variant="h5" sx={{
              fontWeight: 900,
              color: winnerId === 'draw' ? '#f59e0b' : (winnerId === userId ? '#22c55e' : '#00f2fe')
            }}>
              {winnerId === 'draw'
                ? "It's a Tie Race!"
                : (winnerId === userId ? 'YOU WON! 🥇' : `${oppName} WON! 🏆`)
              }
            </Typography>

            {/* Score Comparison Box */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              width: '100%',
              bgcolor: 'rgba(255,255,255,0.06)',
              p: 1.5,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {/* Player 1 Card */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800 }}>
                  {player1?.username} {winnerId === player1?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
                  {p1Score} ⭐
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                VS
              </Typography>

              {/* Player 2 Card */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#00f2fe', fontWeight: 800 }}>
                  {player2?.username} {winnerId === player2?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
                  {p2Score} ⭐
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {winnerId === 'draw'
                ? 'Both drivers scored identical points!'
                : (winnerId === userId
                    ? `You outraced ${oppName} by ${Math.abs(p1Score - p2Score)} stars!`
                    : `${oppName} won by ${Math.abs(p1Score - p2Score)} stars!`
                  )
              }
            </Typography>

            <Button
              variant="contained"
              onClick={handleRematch}
              sx={{
                mt: 1,
                py: 1,
                px: 3.5,
                borderRadius: 2.5,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
              }}
            >
              🔄 Race Again!
            </Button>
          </Box>
        )}
      </Box>

      {/* On-Screen Touch / Mouse Steering Controls (for mobile & mouse users) */}
      {amICurrentDriver && gameState === 'running' && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: { xs: '100%', sm: CANVAS_W },
          maxWidth: { xs: 440, sm: CANVAS_W },
          mt: 1,
          mb: 0.5,
          px: 1,
          flexShrink: 0
        }}>
          <Button
            variant="contained"
            onClick={steerLeft}
            sx={{
              flex: 1,
              mr: 1,
              py: 1.2,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.1rem',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            ◀ LEFT
          </Button>
          <Button
            variant="contained"
            onClick={steerRight}
            sx={{
              flex: 1,
              ml: 1,
              py: 1.2,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.1rem',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            RIGHT ▶
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Initial Game Data Generator for Car Race
export const carRaceInitialData = (player1, player2) => ({
  gameType: 'carrace',
  status: 'active',
  phase: 'p1_racing',
  player1,
  player2,
  p1Score: null,
  p2Score: null,
  winnerId: null,
  turnPlayerId: player1?.id,
  challengerId: player1?.id
});
