import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Tooltip
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RadarIcon from '@mui/icons-material/Radar';
import MyLocationIcon from '@mui/icons-material/MyLocation';

// ============================================================================
//  BATTLESHIP - 2-PLAYER NAVAL GRID WARFARE (10x10)
//  Faithful recreation matching reference image 1:
//  - Deep blue naval ocean with coordinates: A-J (vertical) & 1-10 (horizontal)
//  - Player profile avatar & name on top left ("Kevin")
//  - Dynamic turn banner at top: "ENEMY'S TURN" (Orange) / "YOUR TURN" (Blue)
//  - Top-right Enemy's Fleet mini-radar tracking hits
//  - Bottom-center crosshair combat log: "Enemy fired a shot at D4 - MISS!"
//  - Bottom-right Enemy Commander portrait badge ("Giuseppe") with "HIT!" / "MISS!"
//  - Warships: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2)
//  - Realistic cannon blast, water splash, hit explosion, and sonar audio FX
// ============================================================================

const GRID_SIZE = 10;
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COLS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const SHIPS_CONFIG = [
  { id: 'carrier', name: 'Carrier', size: 5, icon: '🚢', color: '#38bdf8' },
  { id: 'battleship', name: 'Battleship', size: 4, icon: '🛳️', color: '#818cf8' },
  { id: 'cruiser', name: 'Cruiser', size: 3, icon: '🚤', color: '#a78bfa' },
  { id: 'submarine', name: 'Submarine', size: 3, icon: '⚓', color: '#34d399' },
  { id: 'destroyer', name: 'Destroyer', size: 2, icon: '🛥️', color: '#f472b6' }
];

const TOTAL_HITS_NEEDED = 5 + 4 + 3 + 3 + 2; // 17

// --- Web Audio Synthesizer for Naval Warfare Sound FX ---
class BattleShipAudioSynthesizer {
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

  playCannonFire() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Cannon blast noise & drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playHitExplosion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Low explosive boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.45);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  playWaterSplash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.12);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  playSonarPing() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
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
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.3);
        osc.start(st);
        osc.stop(st + 0.3);
      });
    } catch (e) {}
  }
}

// Generate valid random placement of the 5 standard warships
export const generateRandomFleet = () => {
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  const ships = [];

  for (const ship of SHIPS_CONFIG) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const isHorizontal = Math.random() < 0.5;
      const r = Math.floor(Math.random() * (isHorizontal ? GRID_SIZE : GRID_SIZE - ship.size + 1));
      const c = Math.floor(Math.random() * (isHorizontal ? GRID_SIZE - ship.size + 1 : GRID_SIZE));

      // Check collision
      let canPlace = true;
      for (let i = 0; i < ship.size; i++) {
        const checkR = isHorizontal ? r : r + i;
        const checkC = isHorizontal ? c + i : c;
        if (grid[checkR][checkC] !== null) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        const coords = [];
        for (let i = 0; i < ship.size; i++) {
          const curR = isHorizontal ? r : r + i;
          const curC = isHorizontal ? c + i : c;
          grid[curR][curC] = ship.id;
          coords.push({ r: curR, c: curC });
        }
        ships.push({
          ...ship,
          coords,
          isHorizontal
        });
        placed = true;
      }
    }
  }

  return ships;
};

export const BattleShipGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    turnPlayerId,
    p1Fleet = [],
    p2Fleet = [],
    p1Shots = [], // Array of { r, c, result: 'hit' | 'miss', shipId: string | null }
    p2Shots = [], // Array of { r, c, result: 'hit' | 'miss', shipId: string | null }
    lastShot = null, // { shooterId, r, c, result, shipSunk }
    status = 'active',
    winnerId = null
  } = gameData;

  const isP1 = String(userId) === String(player1?.id);
  const myPlayer = isP1 ? player1 : player2;
  const oppPlayer = isP1 ? player2 : player1;
  const myFleet = isP1 ? p1Fleet : p2Fleet;
  const oppFleet = isP1 ? p2Fleet : p1Fleet;
  const myShots = isP1 ? p1Shots : p2Shots;       // Shots I have fired at the opponent's fleet
  const oppShots = isP1 ? p2Shots : p1Shots;     // Shots opponent has fired at my fleet

  const isMyTurn = status === 'active' && String(turnPlayerId) === String(userId);
  const audioRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('radar'); // 'radar' (target enemy) | 'fleet' (my own ships)

  useEffect(() => {
    audioRef.current = new BattleShipAudioSynthesizer();
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (audioRef.current) audioRef.current.enabled = next;
  };

  // Sound effects on incoming or outgoing shot
  useEffect(() => {
    if (lastShot && audioRef.current) {
      if (lastShot.result === 'hit') {
        audioRef.current.playHitExplosion();
      } else if (lastShot.result === 'miss') {
        audioRef.current.playWaterSplash();
      }
    }
  }, [lastShot]);

  // Check if a coordinate is already shot by me
  const isAlreadyShot = (r, c) => {
    return myShots.some(s => s.r === r && s.c === c);
  };

  // Calculate sunk status for opponent ships
  const getSunkShips = (fleet, shots) => {
    return fleet.filter(ship => {
      return ship.coords.every(coord =>
        shots.some(s => s.r === coord.r && s.c === coord.c && s.result === 'hit')
      );
    });
  };

  const oppSunkShips = getSunkShips(oppFleet, myShots);
  const mySunkShips = getSunkShips(myFleet, oppShots);
  const myHitsCount = myShots.filter(s => s.result === 'hit').length;
  const oppHitsCount = oppShots.filter(s => s.result === 'hit').length;

  // Handle firing a shot on the enemy radar grid
  const handleFireShot = (r, c) => {
    if (!isMyTurn || isAlreadyShot(r, c)) return;

    if (audioRef.current) audioRef.current.playCannonFire();

    // Check if shot hits any ship in opponent's fleet
    let hitShip = null;
    for (const ship of oppFleet) {
      if (ship.coords.some(coord => coord.r === r && coord.c === c)) {
        hitShip = ship;
        break;
      }
    }

    const isHit = !!hitShip;
    const newShot = {
      r,
      c,
      result: isHit ? 'hit' : 'miss',
      shipId: hitShip ? hitShip.id : null
    };

    const updatedMyShots = [...myShots, newShot];
    const newTotalHits = updatedMyShots.filter(s => s.result === 'hit').length;
    const isGameOver = newTotalHits >= TOTAL_HITS_NEEDED;

    // Check if this shot sank the ship
    let shipSunkName = null;
    if (hitShip) {
      const isSunkNow = hitShip.coords.every(coord =>
        (coord.r === r && coord.c === c) ||
        myShots.some(s => s.r === coord.r && s.c === coord.c && s.result === 'hit')
      );
      if (isSunkNow) shipSunkName = hitShip.name;
    }

    // Check victory condition
    const nextTurnPlayerId = isGameOver
      ? null
      : (isHit ? userId : (isP1 ? player2?.id : player1?.id)); // Turn stays on hit, or switches on miss!

    if (isGameOver && audioRef.current) {
      audioRef.current.playVictory();
    }

    const updatedGameData = {
      ...gameData,
      status: isGameOver ? 'finished' : 'active',
      winnerId: isGameOver ? userId : null,
      turnPlayerId: nextTurnPlayerId,
      p1Shots: isP1 ? updatedMyShots : p1Shots,
      p2Shots: !isP1 ? updatedMyShots : p2Shots,
      lastShot: {
        shooterId: userId,
        shooterName: myPlayer?.username,
        r,
        c,
        coordStr: `${ROWS[r]}${COLS[c]}`,
        result: isHit ? 'hit' : 'miss',
        shipSunk: shipSunkName
      }
    };

    onSendGameMessage(updatedGameData);
  };

  // Re-deploy own fleet before match kicks off or during first round
  const handleRandomizeOwnFleet = () => {
    if (myShots.length > 0 || oppShots.length > 0) return;
    const newFleet = generateRandomFleet();
    if (audioRef.current) audioRef.current.playSonarPing();

    onSendGameMessage({
      ...gameData,
      p1Fleet: isP1 ? newFleet : p1Fleet,
      p2Fleet: !isP1 ? newFleet : p2Fleet
    });
  };

  // Rematch
  const handleRematch = () => {
    onSendGameMessage({
      ...gameData,
      status: 'active',
      winnerId: null,
      p1Fleet: generateRandomFleet(),
      p2Fleet: generateRandomFleet(),
      p1Shots: [],
      p2Shots: [],
      lastShot: null,
      turnPlayerId: player1?.id
    });
  };

  // Helper: Get grid cell status on enemy radar
  const getEnemyCellStatus = (r, c) => {
    const shot = myShots.find(s => s.r === r && s.c === c);
    if (!shot) return 'unrevealed';
    return shot.result; // 'hit' | 'miss'
  };

  // Helper: Get grid cell status on player's own fleet
  const getOwnCellStatus = (r, c) => {
    const hasShip = myFleet.some(ship => ship.coords.some(coord => coord.r === r && coord.c === c));
    const shot = oppShots.find(s => s.r === r && s.c === c);
    return {
      hasShip,
      isHit: shot && shot.result === 'hit',
      isMiss: shot && shot.result === 'miss'
    };
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: 360,
      userSelect: 'none',
      position: 'relative',
      p: 0.5
    }}>
      {/* 1. TOP TURN BANNER (matches reference image: Orange ENEMY'S TURN / Blue YOUR TURN) */}
      <Box sx={{
        width: '100%',
        py: 0.8,
        px: 1.5,
        mb: 1.2,
        borderRadius: 2,
        textAlign: 'center',
        background: status === 'finished'
          ? (winnerId === userId ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #dc2626, #ef4444)')
          : (isMyTurn
              ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' // Blue YOUR TURN
              : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' // Orange ENEMY'S TURN (reference image)
            ),
        boxShadow: isMyTurn ? '0 4px 15px rgba(2, 132, 199, 0.4)' : '0 4px 15px rgba(234, 88, 12, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: Player Badge (Kevin style) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Avatar sx={{
            width: 28,
            height: 28,
            fontSize: 12,
            bgcolor: '#0f172a',
            border: '1.5px solid #fff',
            fontWeight: 800
          }}>
            {myPlayer?.username?.[0]?.toUpperCase() || 'P'}
          </Avatar>
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.82rem', letterSpacing: 0.5 }}>
            {myPlayer?.username}
          </Typography>
        </Box>

        {/* Center: Turn Status text */}
        <Typography sx={{
          fontWeight: 900,
          color: '#fff',
          fontSize: '0.85rem',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          textShadow: '0 1px 3px rgba(0,0,0,0.6)'
        }}>
          {status === 'finished'
            ? (winnerId === userId ? 'VICTORY AT SEA! 🏆' : 'FLEET DESTROYED! 💀')
            : (isMyTurn ? "YOUR TURN - FIRE!" : "ENEMY'S TURN")
          }
        </Typography>

        {/* Right: Sound Toggle */}
        <IconButton size="small" onClick={toggleSound} sx={{ color: '#fff', p: 0.4 }}>
          {soundEnabled ? <VolumeUpIcon sx={{ fontSize: 18 }} /> : <VolumeOffIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

      {/* 2. SUB-HEADER: TABS (RADAR / OWN FLEET) + MINI-RADAR */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        mb: 1
      }}>
        {/* Toggle between targeting Enemy Radar vs viewing Own Sea Fleet */}
        <Box sx={{ display: 'flex', gap: 0.8 }}>
          <Button
            size="small"
            variant={viewMode === 'radar' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('radar')}
            startIcon={<RadarIcon sx={{ fontSize: 16 }} />}
            sx={{
              py: 0.3,
              px: 1.2,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: viewMode === 'radar' ? '#0284c7' : 'transparent',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.2)'
            }}
          >
            Target Radar
          </Button>

          <Button
            size="small"
            variant={viewMode === 'fleet' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('fleet')}
            startIcon={<MyLocationIcon sx={{ fontSize: 16 }} />}
            sx={{
              py: 0.3,
              px: 1.2,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: viewMode === 'fleet' ? '#10b981' : 'transparent',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.2)'
            }}
          >
            My Fleet
          </Button>
        </Box>

        {/* Top-Right Mini Fleet Radar (matches reference image Enemy's Fleet miniature) */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          bgcolor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 2,
          px: 1,
          py: 0.3
        }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
            ENEMY FLEET:
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 900 }}>
            {SHIPS_CONFIG.length - oppSunkShips.length} left
          </Typography>
        </Box>
      </Box>

      {/* 3. MAIN OCEAN GRID BOARD (Faithful 10x10 sea grid from reference image 1) */}
      <Box sx={{
        width: 330,
        height: 330,
        bgcolor: '#092540', // Deep naval blue matching reference image
        backgroundImage: 'radial-gradient(ellipse at center, #103b66 0%, #06182b 100%)',
        borderRadius: 3,
        border: '2px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.6), inset 0 0 20px rgba(2, 132, 199, 0.25)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        p: 0.8,
        boxSizing: 'border-box'
      }}>
        {/* Column Coordinates Header (1 to 10) */}
        <Box sx={{ display: 'flex', ml: 2.2, mb: 0.3 }}>
          {COLS.map(c => (
            <Typography key={c} sx={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.62rem',
              fontWeight: 800,
              color: 'rgba(147, 197, 253, 0.7)'
            }}>
              {c}
            </Typography>
          ))}
        </Box>

        {/* 10 Rows (A to J) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {ROWS.map((rName, rIdx) => (
            <Box key={rName} sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px' }}>
              {/* Row Coordinate Letter (A-J) */}
              <Typography sx={{
                width: 15,
                textAlign: 'center',
                fontSize: '0.62rem',
                fontWeight: 800,
                color: 'rgba(147, 197, 253, 0.7)'
              }}>
                {rName}
              </Typography>

              {/* 10 Grid Cells in Row */}
              {COLS.map((_, cIdx) => {
                if (viewMode === 'radar') {
                  // TARGETING ENEMY RADAR
                  const cellStatus = getEnemyCellStatus(rIdx, cIdx);
                  const isHit = cellStatus === 'hit';
                  const isMiss = cellStatus === 'miss';
                  const isUnshot = cellStatus === 'unrevealed';

                  return (
                    <Box
                      key={cIdx}
                      onClick={() => isMyTurn && isUnshot && handleFireShot(rIdx, cIdx)}
                      sx={{
                        flex: 1,
                        height: '100%',
                        borderRadius: 0.6,
                        border: '1px solid rgba(56, 189, 248, 0.22)',
                        bgcolor: isHit
                          ? 'rgba(239, 68, 68, 0.45)'
                          : (isMiss ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (isMyTurn && isUnshot) ? 'crosshair' : 'default',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: (isMyTurn && isUnshot) ? 'rgba(56, 189, 248, 0.35)' : undefined,
                          borderColor: (isMyTurn && isUnshot) ? '#38bdf8' : undefined
                        }
                      }}
                    >
                      {/* Red Fire Peg / Explosion for Hit (matches reference image red peg) */}
                      {isHit && (
                        <Box sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: '#ef4444',
                          border: '2px solid #fee2e2',
                          boxShadow: '0 0 10px #f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9
                        }}>
                          🔥
                        </Box>
                      )}

                      {/* White Splash / Ring Buoy for Miss (matches reference image white buoy) */}
                      {isMiss && (
                        <Box sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          border: '2px solid rgba(255, 255, 255, 0.75)',
                          bgcolor: 'transparent'
                        }} />
                      )}
                    </Box>
                  );
                } else {
                  // VIEWING OWN FLEET
                  const { hasShip, isHit, isMiss } = getOwnCellStatus(rIdx, cIdx);

                  return (
                    <Box
                      key={cIdx}
                      sx={{
                        flex: 1,
                        height: '100%',
                        borderRadius: 0.6,
                        border: '1px solid rgba(56, 189, 248, 0.22)',
                        bgcolor: hasShip
                          ? (isHit ? 'rgba(239, 68, 68, 0.6)' : 'rgba(14, 165, 233, 0.4)')
                          : (isMiss ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      {hasShip && !isHit && (
                        <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: '#38bdf8' }} />
                      )}
                      {isHit && (
                        <Box sx={{ fontSize: 10 }}>💥</Box>
                      )}
                      {isMiss && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid #fff' }} />
                      )}
                    </Box>
                  );
                }
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 4. BOTTOM COMBAT LOG & ENEMY COMMANDER BADGE (exact match to Giuseppe badge in reference image 1) */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        mt: 1,
        gap: 1
      }}>
        {/* Combat Status Log (matches reference image bottom log: "Enemy fired a shot") */}
        <Box sx={{
          flex: 1,
          bgcolor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 2,
          p: 0.8,
          display: 'flex',
          alignItems: 'center',
          gap: 0.8
        }}>
          <Typography sx={{ fontSize: 16 }}>🎯</Typography>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{
              fontWeight: 700,
              color: '#fff',
              display: 'block',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {lastShot
                ? (lastShot.shooterId === userId
                    ? `You fired at ${lastShot.coordStr} - ${lastShot.result.toUpperCase()}! ${lastShot.shipSunk ? `💥 Sunk ${lastShot.shipSunk}!` : ''}`
                    : `${oppPlayer?.username} fired at ${lastShot.coordStr} - ${lastShot.result.toUpperCase()}!`
                  )
                : 'Awaiting first naval cannon salvo...'
              }
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>
              Hits: You {myHitsCount}/17 • {oppPlayer?.username} {oppHitsCount}/17
            </Typography>
          </Box>
        </Box>

        {/* Enemy Commander Badge (matches reference image Giuseppe badge on bottom-right) */}
        <Box sx={{
          bgcolor: 'rgba(234, 88, 12, 0.85)',
          border: '1.5px solid #fdba74',
          borderRadius: 2,
          py: 0.4,
          px: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 68
        }}>
          <Typography sx={{
            fontSize: '0.65rem',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            {lastShot ? (lastShot.result === 'hit' ? '🔥 HIT!' : '💦 MISS!') : 'COMMANDER'}
          </Typography>
          <Typography sx={{
            fontSize: '0.72rem',
            fontWeight: 900,
            color: '#fef08a',
            lineHeight: 1
          }}>
            {oppPlayer?.username || 'Enemy'}
          </Typography>
        </Box>
      </Box>

      {/* Re-shuffle Fleet button before combat */}
      {myShots.length === 0 && oppShots.length === 0 && status === 'active' && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<ShuffleIcon sx={{ fontSize: 16 }} />}
          onClick={handleRandomizeOwnFleet}
          sx={{
            mt: 1,
            py: 0.4,
            px: 1.5,
            borderRadius: 2,
            fontSize: '0.75rem',
            color: '#38bdf8',
            borderColor: 'rgba(56, 189, 248, 0.4)',
            textTransform: 'none'
          }}
        >
          🎲 Randomize Fleet Positions
        </Button>
      )}

      {/* VICTORY / DEFEAT MODAL OVERLAY */}
      {status === 'finished' && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(5, 12, 28, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
          zIndex: 30,
          gap: 1.5
        }}>
          <Typography sx={{ fontSize: 50 }}>
            {winnerId === userId ? '🏆' : '💀'}
          </Typography>
          <Typography variant="h5" sx={{
            fontWeight: 900,
            color: winnerId === userId ? '#22c55e' : '#ef4444'
          }}>
            {winnerId === userId ? 'NAVAL VICTORY! 🎖️' : 'FLEET DESTROYED!'}
          </Typography>

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 240 }}>
            {winnerId === userId
              ? `Congratulations Admiral ${myPlayer?.username}! All 5 enemy warships were sunk!`
              : `Admiral ${oppPlayer?.username} commanded the seas and eliminated your fleet.`
            }
          </Typography>

          <Box sx={{
            bgcolor: 'rgba(255,255,255,0.06)',
            borderRadius: 2.5,
            p: 1.2,
            width: '100%',
            maxWidth: 240
          }}>
            <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 800, display: 'block' }}>
              BATTLE STATS
            </Typography>
            <Typography variant="caption" sx={{ color: '#fff' }}>
              Shots Fired: {myShots.length} • Accuracy: {myShots.length > 0 ? Math.round((myHitsCount / myShots.length) * 100) : 0}%
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleRematch}
            sx={{
              mt: 1,
              py: 1,
              px: 3,
              borderRadius: 2.5,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
            }}
          >
            🔄 Battle Again!
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Initial Game Data Generator for Battleship
export const battleShipInitialData = (player1, player2) => ({
  gameType: 'battleship',
  status: 'invited',
  player1,
  player2,
  turnPlayerId: player1?.id,
  p1Fleet: generateRandomFleet(),
  p2Fleet: generateRandomFleet(),
  p1Shots: [],
  p2Shots: [],
  lastShot: null,
  winnerId: null
});
