import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CasinoIcon from '@mui/icons-material/Casino';
import boardImg from '../gameimgs/snakeladder_board.png';

// ============================================================================
//  KRAKENS & SHIPS (SNAKES & LADDERS) - 2-PLAYER BOARD GAME (1-100)
//  Faithful recreation matching exact authentic sea battle reference board:
//  - 10x10 authentic grid (Tiles 1 to 100)
//  - Sailing Ships (Replacing Ladders): (5->25, 23->40, 31->52, 45->57, 75->85, 87->95)
//  - Fierce Krakens (Replacing Snakes): (98->60, 93->72, 66->47, 43->24, 28->6)
//  - 3D Animated Rolling Dice (1-6) with bonus roll on rolling 6!
//  - Custom Web Audio API synthesizer for ocean waves, ship bells, kraken plunges, victory fanfare
//  - Real-time 2-player turn synchronization
// ============================================================================

export const BOARD_SIZE = 10;
export const TOTAL_TILES = 100;

// Board Krakens (Replacing Snakes: Head -> Deep Sea Tentacle Exit):
// - Kraken 1: 98 -> 60 (Top-left giant kraken down to tile 60)
// - Kraken 2: 93 -> 72 (Top-right kraken down to tile 72)
// - Kraken 3: 66 -> 47 (Center kraken down to tile 47)
// - Kraken 4: 43 -> 24 (Middle-left kraken down to tile 24)
// - Kraken 5: 28 -> 6  (Bottom-right kraken down to tile 6)
export const KRAKENS = {
  98: 60,
  93: 72,
  66: 47,
  43: 24,
  28: 6
};

// Backward-compatible alias for existing logic
export const SNAKES = KRAKENS;

// Board Ships & Anchors (Replacing Ladders: Anchor Base -> Ship at Destination):
// - Ship 1: 5  -> 25 (Anchor at 5 sails ship up to 25)
// - Ship 2: 23 -> 40 (Anchor at 23 sails ship up to 40)
// - Ship 3: 31 -> 52 (Anchor at 31 sails ship up to 52)
// - Ship 4: 45 -> 57 (Anchor at 45 sails ship up to 57)
// - Ship 5: 75 -> 85 (Anchor at 75 sails ship up to 85)
// - Ship 6: 87 -> 95 (Anchor at 87 sails ship up to 95)
export const SHIPS = {
  5: 25,
  23: 40,
  31: 52,
  45: 57,
  75: 85,
  87: 95
};

// Backward-compatible alias for existing logic
export const LADDERS = SHIPS;

// Web Audio API Synthesizer with Ocean Nautical FX for Krakens & Ships
class SnakeLadderAudioSynthesizer {
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

  playDiceRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 200, t + i * 0.05);
        gain.gain.setValueAtTime(0.15, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.06);
      }
    } catch (e) {}
  }

  playHop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.08);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  // Triumphant Nautical Ship Bell & Fanfare (Replacing ladder climb)
  playShipSail() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [392, 493.88, 587.33, 783.99, 987.77, 1174.66];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.07;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.2, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.28);
        osc.start(st);
        osc.stop(st + 0.28);
      });
    } catch (e) {}
  }

  playLadderClimb() {
    this.playShipSail();
  }

  // Deep Sea Kraken Roar & Abyss Plunge (Replacing snake slide)
  playKrakenAttack() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Deep low rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.5);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);

      // Water splash plunge
      const splashOsc = this.ctx.createOscillator();
      const splashGain = this.ctx.createGain();
      splashOsc.type = 'triangle';
      splashOsc.frequency.setValueAtTime(420, t + 0.04);
      splashOsc.frequency.exponentialRampToValueAtTime(80, t + 0.4);
      splashGain.gain.setValueAtTime(0.18, t + 0.04);
      splashGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      splashOsc.connect(splashGain);
      splashGain.connect(this.ctx.destination);
      splashOsc.start(t + 0.04);
      splashOsc.stop(t + 0.4);
    } catch (e) {}
  }

  playSnakeSlide() {
    this.playKrakenAttack();
  }

  // Grand Pirate Victory Fanfare
  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.09;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.22, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
        osc.start(st);
        osc.stop(st + 0.35);
      });
    } catch (e) {}
  }
}

export const SnakeLadderGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    p1Pos = 1,
    p2Pos = 1,
    turnPlayerId = player1?.id,
    lastDice = null,
    lastAction = null, // { type: 'ship'|'kraken'|'ladder'|'snake'|'move', from, to }
    status = 'active',
    winnerId = null
  } = gameData;

  const isP1 = String(userId) === String(player1?.id);
  const isMyTurn = status === 'active' && String(turnPlayerId) === String(userId);
  const myPlayer = isP1 ? player1 : player2;
  const oppPlayer = isP1 ? player2 : player1;
  const myPos = isP1 ? p1Pos : p2Pos;
  const oppPos = isP1 ? p2Pos : p1Pos;

  const [rolling, setRolling] = useState(false);
  const [displayedDice, setDisplayedDice] = useState(lastDice || 1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new SnakeLadderAudioSynthesizer();
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (audioRef.current) audioRef.current.enabled = next;
  };

  // Sound triggers on action
  useEffect(() => {
    if (lastAction && audioRef.current) {
      if (lastAction.type === 'ship' || lastAction.type === 'ladder') {
        audioRef.current.playShipSail();
      } else if (lastAction.type === 'kraken' || lastAction.type === 'snake') {
        audioRef.current.playKrakenAttack();
      }
    }
  }, [lastAction]);

  // Roll Dice and Execute Turn
  const handleRollDice = () => {
    if (!isMyTurn || rolling || status !== 'active') return;

    setRolling(true);
    if (audioRef.current) audioRef.current.playDiceRoll();

    // Dice animation interval
    let rollCounter = 0;
    const interval = setInterval(() => {
      setDisplayedDice(Math.floor(Math.random() * 6) + 1);
      rollCounter++;
      if (rollCounter >= 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDisplayedDice(finalDice);
        setRolling(false);
        processMove(finalDice);
      }
    }, 60);
  };

  const processMove = (diceValue) => {
    const currentPos = isP1 ? p1Pos : p2Pos;
    let targetPos = currentPos + diceValue;

    // Must not exceed 100
    if (targetPos > TOTAL_TILES) {
      targetPos = currentPos; // Can't move if roll exceeds 100
    }

    let actionType = 'move';
    const originalLanding = targetPos;

    // Check Ship (replacing ladder)
    if (SHIPS[targetPos]) {
      targetPos = SHIPS[targetPos];
      actionType = 'ship';
    }
    // Check Kraken (replacing snake)
    else if (KRAKENS[targetPos]) {
      targetPos = KRAKENS[targetPos];
      actionType = 'kraken';
    }

    const hasWon = targetPos === TOTAL_TILES;
    if (hasWon && audioRef.current) {
      audioRef.current.playWin();
    }

    // Rolling a 6 gives another turn unless player won
    const bonusTurn = diceValue === 6 && !hasWon;
    const nextTurnPlayerId = hasWon ? null : (bonusTurn ? userId : oppPlayer?.id);

    const updatedData = {
      ...gameData,
      p1Pos: isP1 ? targetPos : p1Pos,
      p2Pos: !isP1 ? targetPos : p2Pos,
      lastDice: diceValue,
      turnPlayerId: nextTurnPlayerId,
      status: hasWon ? 'finished' : 'active',
      winnerId: hasWon ? userId : null,
      lastAction: {
        player: myPlayer?.username,
        type: actionType,
        dice: diceValue,
        from: currentPos,
        landing: originalLanding,
        to: targetPos,
        bonus: bonusTurn
      }
    };

    onSendGameMessage(updatedData);
  };

  // Rematch
  const handleRematch = () => {
    onSendGameMessage({
      ...gameData,
      status: 'active',
      winnerId: null,
      p1Pos: 1,
      p2Pos: 1,
      lastDice: null,
      lastAction: null,
      turnPlayerId: player1?.id
    });
  };

  // Build the 10x10 boustrophedon board grid (bottom-to-top)
  const rows = [];
  for (let r = 9; r >= 0; r--) {
    const isEvenRowFromBottom = (r % 2 === 0);
    const rowTiles = [];
    for (let c = 0; c < 10; c++) {
      const tileNum = isEvenRowFromBottom
        ? r * 10 + (c + 1)
        : r * 10 + (10 - c);
      rowTiles.push(tileNum);
    }
    rows.push(rowTiles);
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: 390,
      userSelect: 'none',
      position: 'relative',
      p: 0.5
    }}>
      {/* 1. TOP TURN & STATUS BANNER */}
      <Box sx={{
        width: '100%',
        py: 0.9,
        px: 1.5,
        mb: 1,
        borderRadius: 2.5,
        background: status === 'finished'
          ? (String(winnerId) === String(userId) ? 'linear-gradient(135deg, #15803d, #22c55e)' : 'linear-gradient(135deg, #b91c1c, #ef4444)')
          : (isMyTurn
              ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              : 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
            ),
        border: '1px solid rgba(255, 215, 0, 0.3)',
        boxShadow: isMyTurn ? '0 4px 18px rgba(2, 132, 199, 0.45)' : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Current Players with colored tokens & tile badges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            avatar={
              <Avatar sx={{
                bgcolor: '#dc2626',
                color: '#fff',
                fontSize: 10,
                border: '1px solid #ffd700'
              }}>
                ⚓
              </Avatar>
            }
            label={`${player1?.username}: ${p1Pos}`}
            sx={{
              bgcolor: 'rgba(0,0,0,0.35)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.74rem',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}
          />
          <Chip
            size="small"
            avatar={
              <Avatar sx={{
                bgcolor: '#06b6d4',
                color: '#000',
                fontSize: 10,
                border: '1px solid #ffd700'
              }}>
                🧭
              </Avatar>
            }
            label={`${player2?.username}: ${p2Pos}`}
            sx={{
              bgcolor: 'rgba(0,0,0,0.35)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.74rem',
              border: '1px solid rgba(6, 182, 212, 0.4)'
            }}
          />
        </Box>

        <IconButton size="small" onClick={toggleSound} sx={{ color: '#ffd700', p: 0.4 }}>
          {soundEnabled ? <VolumeUpIcon sx={{ fontSize: 18 }} /> : <VolumeOffIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

      {/* 2. THE AUTHENTIC KRAKENS & SHIPS PIRATE BOARD */}
      <Box sx={{
        width: '100%',
        maxWidth: 360,
        aspectRatio: '1 / 1',
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '3px solid #b45309',
        boxShadow: '0 12px 35px rgba(0,0,0,0.7), inset 0 0 15px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundImage: `url(${boardImg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        bgcolor: '#0f172a'
      }}>
        {/* Interactive 10x10 Token Grid precisely aligned with board squares:
            Left: 3.03%, Top: 8.40%, Width: 93.55%, Height: 83.01% */}
        <Box sx={{
          position: 'absolute',
          top: '8.4%',
          left: '3.0%',
          width: '93.6%',
          height: '83.0%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {rows.map((rowTiles, rIdx) => (
            <Box key={rIdx} sx={{ flex: 1, display: 'flex' }}>
              {rowTiles.map((tileNum) => {
                const hasP1 = p1Pos === tileNum;
                const hasP2 = p2Pos === tileNum;

                return (
                  <Box
                    key={tileNum}
                    sx={{
                      flex: 1,
                      height: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Player 1 Pawn Token (Pirate Red Anchor with golden rim) */}
                    {hasP1 && (
                      <Box sx={{
                        position: 'absolute',
                        width: { xs: 20, sm: 22 },
                        height: { xs: 20, sm: 22 },
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #ef4444, #991b1b)',
                        border: '2px solid #ffd700',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.95), inset 0 1px 2px rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 900,
                        color: '#fff',
                        bottom: hasP2 ? 1 : 'auto',
                        left: hasP2 ? 1 : 'auto',
                        zIndex: 10,
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))'
                      }}>
                        ⚓
                      </Box>
                    )}

                    {/* Player 2 Pawn Token (Ocean Cyan Compass with golden rim) */}
                    {hasP2 && (
                      <Box sx={{
                        position: 'absolute',
                        width: { xs: 20, sm: 22 },
                        height: { xs: 20, sm: 22 },
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #06b6d4, #0e7490)',
                        border: '2px solid #ffd700',
                        boxShadow: '0 0 10px rgba(6, 182, 212, 0.95), inset 0 1px 2px rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 900,
                        color: '#000',
                        top: hasP1 ? 1 : 'auto',
                        right: hasP1 ? 1 : 'auto',
                        zIndex: 11,
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))'
                      }}>
                        🧭
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 3. COMBAT / MOVEMENT STATUS BANNER */}
      <Box sx={{
        width: '100%',
        mt: 1,
        p: 0.9,
        borderRadius: 2,
        bgcolor: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(255, 215, 0, 0.25)',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}>
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, display: 'block', fontSize: '0.78rem' }}>
          {lastAction
            ? (lastAction.type === 'ship' || lastAction.type === 'ladder'
                ? `🚢 ${lastAction.player} rolled ${lastAction.dice} and sailed a ship from anchor ${lastAction.landing} to ${lastAction.to}!`
                : (lastAction.type === 'kraken' || lastAction.type === 'snake'
                    ? `🐙 ${lastAction.player} rolled ${lastAction.dice} and was dragged down by the Kraken to ${lastAction.to}!`
                    : `🎲 ${lastAction.player} rolled ${lastAction.dice} and sailed forward to tile ${lastAction.to}.`
                  )
              )
            : 'Roll the dice to brave the seas and reach the treasure at 100!'
          }
        </Typography>
        {lastAction?.bonus && (
          <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 900, display: 'block', mt: 0.3 }}>
            🎉 ROLLED A 6! BONUS EXTRA ROLL!
          </Typography>
        )}
      </Box>

      {/* 4. 3D DICE & ROLL CONTROLS */}
      {status === 'active' && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          mt: 1.2
        }}>
          {/* 3D Ivory Dice Display */}
          <Box sx={{
            width: 48,
            height: 48,
            bgcolor: '#ffffff',
            borderRadius: 2.5,
            border: '2px solid #b45309',
            boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: rolling ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}>
            <Typography sx={{ fontSize: 28, fontWeight: 900, color: '#000' }}>
              {displayedDice === 1 ? '⚀' :
               displayedDice === 2 ? '⚁' :
               displayedDice === 3 ? '⚂' :
               displayedDice === 4 ? '⚃' :
               displayedDice === 5 ? '⚄' : '⚅'}
            </Typography>
          </Box>

          {/* Roll Button */}
          {isMyTurn ? (
            <Button
              variant="contained"
              size="large"
              onClick={handleRollDice}
              disabled={rolling}
              startIcon={<CasinoIcon />}
              sx={{
                py: 1,
                px: 3,
                borderRadius: 3,
                fontWeight: 900,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                border: '1px solid #ffd700',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.45)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
                  transform: 'scale(1.03)'
                }
              }}
            >
              {rolling ? 'Rolling...' : 'ROLL DICE! 🎲'}
            </Button>
          ) : (
            <Chip
              label={`Waiting for Captain ${oppPlayer?.username} to roll...`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            />
          )}
        </Box>
      )}

      {/* 5. FINISHED / VICTORY OVERLAY */}
      {status === 'finished' && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(10, 15, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
          zIndex: 30,
          gap: 1.5,
          border: '2px solid #ffd700'
        }}>
          <Typography sx={{ fontSize: 50 }}>
            💰🏴‍☠️
          </Typography>
          <Typography variant="h5" sx={{
            fontWeight: 900,
            color: String(winnerId) === String(userId) ? '#22c55e' : '#38bdf8'
          }}>
            {String(winnerId) === String(userId) ? 'TREASURE CLAIMED! 🥇' : `CAPTAIN ${oppPlayer?.username?.toUpperCase()} WON! 🏆`}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 260 }}>
            Braved the perilous seas and reached tile 100 WIN treasure chest!
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
              border: '1px solid #ffd700',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.5)'
            }}
          >
            🔄 Sail Again!
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Initial Data Generator for SnakeLadder (Krakens & Ships)
export const snakeLadderInitialData = (player1, player2) => ({
  gameType: 'snakeladder',
  status: 'invited',
  player1,
  player2,
  p1Pos: 1,
  p2Pos: 1,
  turnPlayerId: player1?.id,
  lastDice: null,
  lastAction: null,
  winnerId: null
});

// Backward-compatibility and semantic aliases
export const KrakensAndShipsGame = SnakeLadderGame;
export const krakensAndShipsInitialData = snakeLadderInitialData;
