import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import BoltIcon from '@mui/icons-material/Bolt';

// ============================================================================
//  SPACE BATTLE - 2-PLAYER GALACTIC BOSS SHOOTER
//  Faithful recreation matching reference image 2:
//  - Deep space background with twinkling parallax starfield
//  - Top HUD: "LEVEL OVERVIEW", "TOTAL COINS", "TOTAL GEMS", "HI" score
//  - Cyan Boss Shield / Health Bar across upper screen
//  - Giant Cosmic Alien Boss with swaying tentacles firing red plasma torpedoes
//  - Player Fighter Jet with dual cyan lasers, thruster flames & responsive steering
//  - Web Audio API Sound Synthesizer for lasers, explosions, and coin pick-ups
//  - 2-Player Challenge: Player 1 sets damage/coin score -> Player 2 beats it!
// ============================================================================

const CANVAS_W = 340;
const CANVAS_H = 520;
const BOSS_MAX_HP = 120;

// Web Audio API Sound Synthesizer for Space Battle FX
class SpaceBattleAudioSynthesizer {
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

  playLaser() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  playExplosion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playCoinPickup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t);
      osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.1);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.1;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.2, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
        osc.start(st);
        osc.stop(st + 0.25);
      });
    } catch (e) {}
  }
}

export const SpaceBattleGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    phase = 'p1_battle', // 'p1_battle' | 'p2_challenge' | 'p2_battle' | 'finished'
    p1Score = null,
    p1Coins = 0,
    p1Gems = 0,
    p2Score = null,
    p2Coins = 0,
    p2Gems = 0,
    winnerId = null,
    status = 'active'
  } = gameData;

  const isP1 = userId === player1?.id;
  const isP2 = userId === player2?.id;
  const myName = isP1 ? player1?.username : player2?.username;
  const oppName = isP1 ? player2?.username : player1?.username;

  // Determines if current user is actively piloting
  const amICurrentPilot =
    (phase === 'p1_battle' && isP1) ||
    (phase === 'p2_battle' && isP2);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'running' | 'gameover'
  const [liveScore, setLiveScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP);

  // References for requestAnimationFrame game loop
  const pPosRef = useRef({ x: CANVAS_W / 2, y: CANVAS_H - 70, targetX: CANVAS_W / 2 });
  const starsRef = useRef([]);
  const lasersRef = useRef([]);
  const enemyMissilesRef = useRef([]);
  const itemsRef = useRef([]); // coins & gems
  const particlesRef = useRef([]);
  const bossRef = useRef({ x: CANVAS_W / 2, y: 130, vx: 1.8, hp: BOSS_MAX_HP, flash: 0, animTime: 0 });
  const animFrameRef = useRef(null);
  const stateRef = useRef('ready');
  const fireCooldownRef = useRef(0);
  const bossAttackCooldownRef = useRef(0);

  useEffect(() => {
    audioRef.current = new SpaceBattleAudioSynthesizer();
    // Initialize stars
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
    starsRef.current = stars;
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (audioRef.current) audioRef.current.enabled = next;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!amICurrentPilot || stateRef.current !== 'running') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        pPosRef.current.targetX = Math.max(30, pPosRef.current.targetX - 25);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        pPosRef.current.targetX = Math.min(CANVAS_W - 30, pPosRef.current.targetX + 25);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [amICurrentPilot]);

  // Touch & Mouse steering
  const handleTouchMove = (e) => {
    if (!amICurrentPilot || stateRef.current !== 'running') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const relX = clientX - rect.left;
    pPosRef.current.targetX = Math.max(30, Math.min(CANVAS_W - 30, relX));
  };

  // Start battle
  const startBattle = () => {
    stateRef.current = 'running';
    setGameState('running');
    setLiveScore(0);
    setCoins(0);
    setGems(0);
    setBossHp(BOSS_MAX_HP);
    bossRef.current = { x: CANVAS_W / 2, y: 130, vx: 1.8, hp: BOSS_MAX_HP, flash: 0, animTime: 0 };
    lasersRef.current = [];
    enemyMissilesRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    pPosRef.current = { x: CANVAS_W / 2, y: CANVAS_H - 70, targetX: CANVAS_W / 2 };
  };

  // Main Space Battle Loop
  useEffect(() => {
    if (!amICurrentPilot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (time) => {
      if (stateRef.current === 'running') {
        // 1. Move Stars
        starsRef.current.forEach(s => {
          s.y += s.speed;
          if (s.y > CANVAS_H) {
            s.y = 0;
            s.x = Math.random() * CANVAS_W;
          }
        });

        // 2. Smooth Player Movement
        pPosRef.current.x += (pPosRef.current.targetX - pPosRef.current.x) * 0.25;

        // 3. Auto-Fire Twin Lasers
        fireCooldownRef.current++;
        if (fireCooldownRef.current >= 12) {
          fireCooldownRef.current = 0;
          const px = pPosRef.current.x;
          const py = pPosRef.current.y - 25;
          lasersRef.current.push({ x: px - 10, y: py, vy: -12 });
          lasersRef.current.push({ x: px + 10, y: py, vy: -12 });
          if (audioRef.current) audioRef.current.playLaser();
        }

        // 4. Update Player Lasers
        lasersRef.current.forEach(l => {
          l.y += l.vy;
        });
        lasersRef.current = lasersRef.current.filter(l => l.y > -20);

        // 5. Update Boss
        const boss = bossRef.current;
        boss.animTime += 0.05;
        boss.x += boss.vx;
        if (boss.x < 70) {
          boss.x = 70;
          boss.vx = Math.abs(boss.vx);
        } else if (boss.x > CANVAS_W - 70) {
          boss.x = CANVAS_W - 70;
          boss.vx = -Math.abs(boss.vx);
        }
        if (boss.flash > 0) boss.flash--;

        // 6. Boss Attacks: Spawns red torpedoes
        bossAttackCooldownRef.current++;
        if (bossAttackCooldownRef.current >= 45) {
          bossAttackCooldownRef.current = 0;
          enemyMissilesRef.current.push({ x: boss.x - 22, y: boss.y + 25, vy: 4.5 });
          enemyMissilesRef.current.push({ x: boss.x + 22, y: boss.y + 25, vy: 4.5 });
        }

        // 7. Update Enemy Missiles
        enemyMissilesRef.current.forEach(m => {
          m.y += m.vy;
        });
        enemyMissilesRef.current = enemyMissilesRef.current.filter(m => m.y < CANVAS_H + 20);

        // 8. Laser vs Boss Collisions
        lasersRef.current = lasersRef.current.filter(l => {
          const hit = Math.hypot(l.x - boss.x, l.y - boss.y) < 48;
          if (hit) {
            boss.hp = Math.max(0, boss.hp - 1);
            boss.flash = 4;
            setBossHp(boss.hp);
            setLiveScore(s => s + 25);

            // Spawn particles
            for (let i = 0; i < 3; i++) {
              particlesRef.current.push({
                x: l.x,
                y: l.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#00f2fe',
                life: 14
              });
            }

            // Random drop: Coin (25%) or Gem (10%)
            if (Math.random() < 0.25) {
              itemsRef.current.push({
                x: boss.x + (Math.random() - 0.5) * 40,
                y: boss.y + 20,
                type: Math.random() < 0.7 ? 'coin' : 'gem',
                vy: 2.5
              });
            }

            // Check Boss Defeated
            if (boss.hp <= 0) {
              triggerGameOver(true);
            }
            return false;
          }
          return true;
        });

        // 9. Update Dropped Items (Coins & Gems)
        itemsRef.current.forEach(item => {
          item.y += item.vy;
        });

        // Check Item Pickup
        itemsRef.current = itemsRef.current.filter(item => {
          const dist = Math.hypot(pPosRef.current.x - item.x, pPosRef.current.y - item.y);
          if (dist < 34) {
            if (item.type === 'coin') {
              setCoins(c => c + 1);
              setLiveScore(s => s + 50);
            } else {
              setGems(g => g + 1);
              setLiveScore(s => s + 150);
            }
            if (audioRef.current) audioRef.current.playCoinPickup();
            return false;
          }
          return item.y < CANVAS_H + 20;
        });

        // 10. Check Enemy Missiles vs Player
        for (const m of enemyMissilesRef.current) {
          const hitPlayer = Math.hypot(m.x - pPosRef.current.x, m.y - pPosRef.current.y) < 26;
          if (hitPlayer) {
            triggerGameOver(false);
            break;
          }
        }

        // 11. Update Particles
        particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      }

      // --- RENDERING ---
      // Space Background
      ctx.fillStyle = '#050714';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Starfield
      starsRef.current.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player Lasers (Cyan Twin Plasma Bolts - exact match to reference image 2)
      lasersRef.current.forEach(l => {
        ctx.fillStyle = '#00f2fe';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(l.x - 2, l.y - 10, 4, 16, 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Enemy Torpedoes (Red-tipped rockets - exact match to reference image 2)
      enemyMissilesRef.current.forEach(m => {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(m.x - 3, m.y, 6, 15, 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(m.x - 2, m.y + 4, 4, 6);
        ctx.shadowBlur = 0;
      });

      // Pickups (Coins 🟡 & Gems 🟣)
      itemsRef.current.forEach(item => {
        if (item.type === 'coin') {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#c084fc';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(item.x, item.y, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      });

      // Alien Tentacled Boss (matches reference image 2 cephalopod boss)
      drawAlienBoss(ctx, bossRef.current);

      // Player Starfighter Jet (matches reference image 2 fighter jet)
      drawPlayerFighter(ctx, pPosRef.current.x, pPosRef.current.y);

      // Particles
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [amICurrentPilot]);

  // Draw Giant Cosmic Alien Boss (cephalopod with swaying tentacles from reference image 2)
  const drawAlienBoss = (ctx, boss) => {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const isFlashing = boss.flash > 0;
    const bodyColor = isFlashing ? '#ffffff' : '#6b21a8';
    const tentacleColor = isFlashing ? '#ffffff' : '#4c1d95';

    // 8 Swaying Tentacles
    ctx.strokeStyle = tentacleColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) {
      const angleOffset = Math.sin(boss.animTime + i) * 12;
      ctx.beginPath();
      ctx.moveTo(i * 10, 10);
      ctx.quadraticCurveTo(i * 18 + angleOffset, 30, i * 15 - angleOffset, 48);
      ctx.stroke();
    }

    // Alien Main Head Dome
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    // Central Glowing Eye / Core
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Outer Antenna / Spikes
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(-25, -15);
    ctx.lineTo(-40, -30);
    ctx.lineTo(-20, -25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(25, -15);
    ctx.lineTo(40, -30);
    ctx.lineTo(20, -25);
    ctx.fill();

    ctx.restore();
  };

  // Draw Player Starfighter (matches reference image 2 fighter jet)
  const drawPlayerFighter = (ctx, x, y) => {
    ctx.save();
    ctx.translate(x, y);

    // Jet Engine Thruster Exhaust Flame
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-6, 22);
    ctx.lineTo(0, 38 + Math.random() * 8);
    ctx.lineTo(6, 22);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Delta Wings
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(-28, 18);
    ctx.lineTo(28, 18);
    ctx.closePath();
    ctx.fill();

    // Red Wingtips & Accents
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-28, 10, 4, 10);
    ctx.fillRect(24, 10, 4, 10);
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(-6, -16);
    ctx.lineTo(6, -16);
    ctx.closePath();
    ctx.fill();

    // Fuselage
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(-8, -20, 16, 42, 4);
    ctx.fill();

    // Cockpit Canopy (Cyan Glow)
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.roundRect(-4, -12, 8, 14, 3);
    ctx.fill();

    ctx.restore();
  };

  // Trigger Game Over
  const triggerGameOver = (bossDefeated) => {
    stateRef.current = 'gameover';
    setGameState('gameover');
    if (audioRef.current) {
      if (bossDefeated) audioRef.current.playVictory();
      else audioRef.current.playExplosion();
    }
  };

  // Submit Player 1 Challenge
  const handlePlayer1Submit = () => {
    onSendGameMessage({
      ...gameData,
      status: 'invited',
      phase: 'p2_challenge',
      p1Score: liveScore,
      p1Coins: coins,
      p1Gems: gems,
      turnPlayerId: player2?.id
    });
  };

  // Submit Player 2 Result and Determine Winner
  const handlePlayer2Submit = () => {
    const p1S = p1Score || 0;
    const p2S = liveScore;

    let finalWinner = 'draw';
    if (p1S > p2S) finalWinner = player1?.id;
    else if (p2S > p1S) finalWinner = player2?.id;

    onSendGameMessage({
      ...gameData,
      status: 'finished',
      phase: 'finished',
      p2Score: p2S,
      p2Coins: coins,
      p2Gems: gems,
      winnerId: finalWinner
    });
  };

  // Auto-submit score when Player 2 finishes battle / game over
  useEffect(() => {
    if (isP2 && phase === 'p2_battle' && gameState === 'gameover') {
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
      phase: 'p1_battle',
      p1Score: null,
      p1Coins: 0,
      p1Gems: 0,
      p2Score: null,
      p2Coins: 0,
      p2Gems: 0,
      winnerId: null,
      turnPlayerId: player1?.id
    });
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
      {/* Device Frame */}
      <Box
        onMouseMove={handleTouchMove}
        onTouchMove={handleTouchMove}
        sx={{
          width: { xs: '100%', sm: CANVAS_W },
          maxWidth: { xs: 440, sm: CANVAS_W },
          height: { xs: '100%', sm: CANVAS_H },
          flex: { xs: 1, sm: 'unset' },
          minHeight: { xs: 460, sm: CANVAS_H },
          borderRadius: { xs: 3, sm: 4 },
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
          bgcolor: '#000',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', flex: 1 }}
        />

        {/* TOP HUD BAR (Exact match to reference image 2: LEVEL OVERVIEW, TOTAL COINS, TOTAL GEMS, HI 0) */}
        <Box sx={{
          position: 'absolute',
          top: 6,
          left: 6,
          right: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {/* Level Overview Button */}
          <Box sx={{
            bgcolor: '#dc2626',
            color: '#fff',
            py: 0.2,
            px: 0.8,
            borderRadius: 1.5,
            fontSize: '0.62rem',
            fontWeight: 900
          }}>
            LEVEL 1
          </Box>

          {/* Center Coins & Gems Badges (Reference image styling) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, alignItems: 'center' }}>
            <Box sx={{
              bgcolor: 'rgba(2, 132, 199, 0.85)',
              color: '#fff',
              py: 0.2,
              px: 1.2,
              borderRadius: 3,
              fontSize: '0.62rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 0.4
            }}>
              <span>🟡</span> TOTAL COINS: {coins}
            </Box>
            <Box sx={{
              bgcolor: 'rgba(147, 51, 234, 0.85)',
              color: '#fff',
              py: 0.2,
              px: 1.2,
              borderRadius: 3,
              fontSize: '0.62rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 0.4
            }}>
              <span>🟣</span> TOTAL GEMS: {gems}
            </Box>
          </Box>

          {/* High Score Box */}
          <Box sx={{
            bgcolor: 'rgba(255,255,255,0.95)',
            color: '#000',
            py: 0.2,
            px: 0.8,
            borderRadius: 1.5,
            fontSize: '0.62rem',
            fontWeight: 900
          }}>
            HI {liveScore}
          </Box>
        </Box>

        {/* Boss Shield / Health Bar (Exact match to cyan bar across upper screen) */}
        <Box sx={{
          position: 'absolute',
          top: 55,
          left: 35,
          right: 35,
          height: 8,
          bgcolor: 'rgba(255,255,255,0.15)',
          borderRadius: 4,
          border: '1px solid rgba(0, 242, 254, 0.5)',
          overflow: 'hidden',
          zIndex: 10
        }}>
          <Box sx={{
            height: '100%',
            width: `${(bossHp / BOSS_MAX_HP) * 100}%`,
            background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
            transition: 'width 0.15s ease'
          }} />
        </Box>

        {/* READY / START SCREEN */}
        {amICurrentPilot && gameState === 'ready' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(5, 7, 20, 0.85)',
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
            <Typography sx={{ fontSize: 44 }}>🚀</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff' }}>
              {isP1 ? 'Galactic Boss Battle!' : `Can You Beat ${p1Score} PTS?`}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 240 }}>
              {isP1
                ? 'Pilot your starfighter, dodge red alien torpedoes, destroy the cosmic boss, and collect gems!'
                : `${player1?.username} scored ${p1Score} PTS! Launch into orbit and outscore them!`
              }
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={startBattle}
              sx={{
                py: 1.2,
                px: 4,
                borderRadius: 3,
                fontWeight: 900,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#000',
                boxShadow: '0 6px 20px rgba(0, 242, 254, 0.5)'
              }}
            >
              ⚡ LAUNCH FIGHTER!
            </Button>
          </Box>
        )}

        {/* GAME OVER OVERLAY */}
        {amICurrentPilot && gameState === 'gameover' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(5, 7, 20, 0.9)',
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
            <Typography sx={{ fontSize: 44 }}>
              {bossHp <= 0 ? '🏆' : '💥'}
            </Typography>
            <Typography variant="h5" sx={{
              fontWeight: 900,
              color: bossHp <= 0 ? '#22c55e' : '#ef4444'
            }}>
              {bossHp <= 0 ? 'BOSS DESTROYED!' : 'MISSION OVER'}
            </Typography>

            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              p: 1.5,
              borderRadius: 3,
              width: '100%',
              maxWidth: 220
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                YOUR SCORE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#00f2fe' }}>
                {liveScore} PTS
              </Typography>
              <Typography variant="caption" sx={{ color: '#fbbf24' }}>
                🟡 {coins} Coins • 🟣 {gems} Gems
              </Typography>
            </Box>

            {isP1 && phase === 'p1_battle' && (
              <Button
                variant="contained"
                onClick={handlePlayer1Submit}
                sx={{
                  py: 1,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#fff'
                }}
              >
                🚀 Challenge {player2?.username}!
              </Button>
            )}

            {isP2 && phase === 'p2_battle' && (
              <Button
                variant="contained"
                onClick={handlePlayer2Submit}
                sx={{
                  py: 1,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#000'
                }}
              >
                🏆 View Match Results!
              </Button>
            )}
          </Box>
        )}

        {/* WAITING OVERLAY */}
        {!amICurrentPilot && phase !== 'finished' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(5, 7, 20, 0.92)',
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
            <Typography sx={{ fontSize: 40 }}>⏳</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
              {phase === 'p2_challenge'
                ? `Challenge Sent to ${player2?.username}!`
                : `${player2?.username} is in Space Combat!`
              }
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 240 }}>
              {phase === 'p2_challenge'
                ? `You scored ${p1Score} PTS! Waiting for ${player2?.username} to accept and pilot.`
                : `${player2?.username} is currently fighting the cosmic boss to beat ${p1Score} PTS!`
              }
            </Typography>
          </Box>
        )}

        {/* FINISHED / RESULTS OVERLAY */}
        {phase === 'finished' && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(5, 7, 20, 0.95)',
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
            <Typography sx={{ fontSize: 44 }}>
              {winnerId === 'draw' ? '🤝' : (winnerId === userId ? '🏆' : '👑')}
            </Typography>
            <Typography variant="h5" sx={{
              fontWeight: 900,
              color: winnerId === 'draw' ? '#f59e0b' : (winnerId === userId ? '#22c55e' : '#00f2fe')
            }}>
              {winnerId === 'draw'
                ? "It's a Tie!"
                : (winnerId === userId ? 'YOU WON THE BATTLE! 🚀' : `${oppName} WON! 🏆`)
              }
            </Typography>

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              p: 1.5,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.06)'
            }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800 }}>
                  {player1?.username} {winnerId === player1?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
                  {p1Score} PTS
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>VS</Typography>

              <Box>
                <Typography variant="caption" sx={{ color: '#00f2fe', fontWeight: 800 }}>
                  {player2?.username} {winnerId === player2?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff' }}>
                  {p2Score} PTS
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleRematch}
              sx={{
                py: 1,
                px: 3.5,
                borderRadius: 2.5,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff'
              }}
            >
              🔄 Battle Again!
            </Button>
          </Box>
        )}
      </Box>

      {/* On-screen Left/Right Buttons */}
      {amICurrentPilot && gameState === 'running' && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: CANVAS_W,
          mt: 1.5,
          px: 1
        }}>
          <Button
            variant="contained"
            onClick={() => { pPosRef.current.targetX = Math.max(30, pPosRef.current.targetX - 35); }}
            sx={{ flex: 1, mr: 1, py: 1.2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900 }}
          >
            ◀ LEFT
          </Button>
          <Button
            variant="contained"
            onClick={() => { pPosRef.current.targetX = Math.min(CANVAS_W - 30, pPosRef.current.targetX + 35); }}
            sx={{ flex: 1, ml: 1, py: 1.2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900 }}
          >
            RIGHT ▶
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Initial Data Generator for SpaceBattle
export const spaceBattleInitialData = (player1, player2) => ({
  gameType: 'spacebattle',
  status: 'active',
  phase: 'p1_battle',
  player1,
  player2,
  p1Score: null,
  p1Coins: 0,
  p1Gems: 0,
  p2Score: null,
  p2Coins: 0,
  p2Gems: 0,
  winnerId: null,
  turnPlayerId: player1?.id
});
