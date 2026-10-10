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
import UndoIcon from '@mui/icons-material/Undo';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// ============================================================================
//  WATER SORT PUZZLE - 2-PLAYER COLOR SORTING ARCADE
//  Faithful recreation matching reference image 1:
//  - Glass test tubes with rounded bottoms and glass reflection sheen
//  - Colorful liquid layers (Vibrant Orange, Crimson Red, Neon Blue, Emerald)
//  - Animated pouring stream from tilted tube into target tube
//  - Web Audio API liquid pouring, bubble splash, and completion sound effects
//  - 2-Player Challenge: Player 1 sorts & sets move/time score -> Player 2 beats it!
// ============================================================================

const TUBE_CAPACITY = 4;

// Colors matching reference image 1
export const LIQUID_COLORS = {
  orange: { bg: '#f97316', top: '#fb923c', name: 'Orange' },
  red:    { bg: '#ef4444', top: '#f87171', name: 'Red' },
  blue:   { bg: '#2563eb', top: '#60a5fa', name: 'Blue' },
  green:  { bg: '#10b981', top: '#34d399', name: 'Green' }
};

// Default initial tubes (matching 3 mixed tubes + 2 empty tubes from reference image 1)
export const getInitialTubes = () => [
  ['orange', 'blue', 'red', 'orange'],
  ['blue', 'red', 'blue', 'green'],
  ['red', 'green', 'green', 'orange'],
  ['green', 'orange', 'red', 'blue'],
  [],
  []
];

// --- Web Audio Synthesizer for Water Sort Liquids ---
class WaterSortAudioSynthesizer {
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

  playPourStream() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Filtered liquid trickle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(780, t + 0.18);
      osc.frequency.linearRampToValueAtTime(520, t + 0.35);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playTubeTap() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(980, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  playTubeComplete() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [587.33, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.18, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
        osc.start(st);
        osc.stop(st + 0.25);
      });
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

// Check if the puzzle is completely solved
const checkPuzzleSolved = (tubes) => {
  return tubes.every(tube => {
    if (tube.length === 0) return true;
    if (tube.length !== TUBE_CAPACITY) return false;
    const firstColor = tube[0];
    return tube.every(c => c === firstColor);
  });
};

export const WaterSortGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    phase = 'p1_sorting', // 'p1_sorting' | 'p2_challenge' | 'p2_sorting' | 'finished'
    p1Score = null,
    p1Moves = null,
    p1Time = null,
    p2Score = null,
    p2Moves = null,
    p2Time = null,
    winnerId = null,
    status = 'active',
    puzzleSeed = 1
  } = gameData;

  const isP1 = userId === player1?.id;
  const isP2 = userId === player2?.id;
  const myName = isP1 ? player1?.username : player2?.username;
  const oppName = isP1 ? player2?.username : player1?.username;

  // Determines if current user is the one solving right now
  const amICurrentSolver =
    (phase === 'p1_sorting' && isP1) ||
    (phase === 'p2_sorting' && isP2);

  // Local game state
  const [tubes, setTubes] = useState(getInitialTubes);
  const [selectedTube, setSelectedTube] = useState(null);
  const [pouringInfo, setPouringInfo] = useState(null); // { fromIdx, toIdx, color }
  const [history, setHistory] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    audioRef.current = new WaterSortAudioSynthesizer();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (audioRef.current) audioRef.current.enabled = next;
  };

  // Timer loop while solving
  useEffect(() => {
    if (amICurrentSolver && !isSolved) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [amICurrentSolver, isSolved]);

  // Restart puzzle
  const handleRestart = () => {
    setTubes(getInitialTubes());
    setSelectedTube(null);
    setPouringInfo(null);
    setHistory([]);
    setMoveCount(0);
    setTimerSeconds(0);
    setIsSolved(false);
    if (audioRef.current) audioRef.current.playTubeTap();
  };

  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isSolved) return;
    const prev = history[history.length - 1];
    setTubes(prev);
    setHistory(h => h.slice(0, h.length - 1));
    setSelectedTube(null);
    setPouringInfo(null);
    setMoveCount(m => Math.max(0, m - 1));
    if (audioRef.current) audioRef.current.playTubeTap();
  };

  // Handle clicking on a tube
  const handleTubeClick = (tubeIdx) => {
    if (!amICurrentSolver || isSolved || pouringInfo) return;

    if (selectedTube === null) {
      // Selecting source tube
      if (tubes[tubeIdx].length === 0) return; // Can't pick empty tube
      setSelectedTube(tubeIdx);
      if (audioRef.current) audioRef.current.playTubeTap();
    } else {
      if (selectedTube === tubeIdx) {
        // Deselect
        setSelectedTube(null);
        return;
      }

      // Attempt to pour from selectedTube -> tubeIdx
      const fromTube = tubes[selectedTube];
      const toTube = tubes[tubeIdx];

      if (toTube.length >= TUBE_CAPACITY) {
        // Target is full, change selection
        setSelectedTube(tubeIdx);
        if (audioRef.current) audioRef.current.playTubeTap();
        return;
      }

      const topColor = fromTube[fromTube.length - 1];
      const targetTopColor = toTube.length > 0 ? toTube[toTube.length - 1] : null;

      if (targetTopColor === null || targetTopColor === topColor) {
        // Valid pour! Calculate how many contiguous blocks of topColor we can pour
        let countToPour = 0;
        for (let i = fromTube.length - 1; i >= 0; i--) {
          if (fromTube[i] === topColor) countToPour++;
          else break;
        }

        const availableSpace = TUBE_CAPACITY - toTube.length;
        const actualPourCount = Math.min(countToPour, availableSpace);

        // Save history for Undo
        setHistory(prev => [...prev, tubes.map(t => [...t])]);

        // Trigger Pouring Stream Animation
        setPouringInfo({
          fromIdx: selectedTube,
          toIdx: tubeIdx,
          color: topColor
        });

        if (audioRef.current) audioRef.current.playPourStream();

        setTimeout(() => {
          setTubes(prev => {
            const next = prev.map(t => [...t]);
            const moved = next[selectedTube].splice(next[selectedTube].length - actualPourCount, actualPourCount);
            next[tubeIdx].push(...moved);

            // Check if target tube is now completely filled with 1 color
            if (next[tubeIdx].length === TUBE_CAPACITY && next[tubeIdx].every(c => c === next[tubeIdx][0])) {
              if (audioRef.current) audioRef.current.playTubeComplete();
            }

            // Check if whole puzzle is solved
            if (checkPuzzleSolved(next)) {
              setIsSolved(true);
              if (audioRef.current) audioRef.current.playVictory();
            }

            return next;
          });

          setSelectedTube(null);
          setPouringInfo(null);
          setMoveCount(m => m + 1);
        }, 350);
      } else {
        // Invalid target, switch selection if not empty
        if (toTube.length > 0) {
          setSelectedTube(tubeIdx);
          if (audioRef.current) audioRef.current.playTubeTap();
        } else {
          setSelectedTube(null);
        }
      }
    }
  };

  // Calculate puzzle efficiency score: higher is better
  const calculateScore = (moves, timeSec) => {
    return Math.max(100, 1000 - moves * 20 - timeSec * 5);
  };

  // Submit Player 1 Challenge
  const handlePlayer1Submit = () => {
    const finalScore = calculateScore(moveCount, timerSeconds);
    onSendGameMessage({
      ...gameData,
      status: 'invited',
      phase: 'p2_challenge',
      p1Score: finalScore,
      p1Moves: moveCount,
      p1Time: timerSeconds,
      turnPlayerId: player2?.id
    });
  };

  // Submit Player 2 Result and Determine Winner
  const handlePlayer2Submit = () => {
    const finalP2Score = calculateScore(moveCount, timerSeconds);
    const p1S = p1Score || 0;
    const p2S = finalP2Score;

    let finalWinner = 'draw';
    if (p1S > p2S) finalWinner = player1?.id;
    else if (p2S > p1S) finalWinner = player2?.id;

    onSendGameMessage({
      ...gameData,
      status: 'finished',
      phase: 'finished',
      p2Score: p2S,
      p2Moves: moveCount,
      p2Time: timerSeconds,
      winnerId: finalWinner
    });
  };

  // Auto-submit score when Player 2 finishes puzzle
  useEffect(() => {
    if (isP2 && phase === 'p2_sorting' && isSolved) {
      const autoTimer = setTimeout(() => {
        handlePlayer2Submit();
      }, 2500);
      return () => clearTimeout(autoTimer);
    }
  }, [isP2, phase, isSolved]);

  // Rematch
  const handleRematch = () => {
    onSendGameMessage({
      ...gameData,
      status: 'active',
      phase: 'p1_sorting',
      p1Score: null,
      p1Moves: null,
      p1Time: null,
      p2Score: null,
      p2Moves: null,
      p2Time: null,
      winnerId: null,
      turnPlayerId: player1?.id
    });
    handleRestart();
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
      p: 1
    }}>
      {/* 1. TOP HEADER & HUD BAR */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        mb: 1.5,
        px: 0.5
      }}>
        {/* Moves & Timer Badges */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label={`Moves: ${moveCount}`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          />
          <Chip
            size="small"
            label={`⏱️ ${timerSeconds}s`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#00f2fe',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}
          />
        </Box>

        {/* Controls: Undo, Restart, Sound */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={handleUndo}
            disabled={history.length === 0 || isSolved || !amICurrentSolver}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', p: 0.5 }}
          >
            <UndoIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleRestart}
            disabled={isSolved || !amICurrentSolver}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', p: 0.5 }}
          >
            <RestartAltIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={toggleSound}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', p: 0.5 }}
          >
            {soundEnabled ? <VolumeUpIcon sx={{ fontSize: 18 }} /> : <VolumeOffIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Target to beat badge for Player 2 */}
      {phase === 'p2_sorting' && p1Score !== null && (
        <Box sx={{
          width: '100%',
          py: 0.6,
          px: 1.5,
          mb: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center'
        }}>
          <Typography sx={{ color: '#f87171', fontWeight: 800, fontSize: '0.8rem' }}>
            TARGET TO BEAT: {p1Moves} MOVES ({p1Time}s) • {p1Score} PTS
          </Typography>
        </Box>
      )}

      {/* 2. MAIN TEST TUBE PUZZLE ARENA (Exact match to reference image 1) */}
      <Box sx={{
        width: '100%',
        minHeight: 280,
        bgcolor: '#121418', // Sleek dark lab background from reference image 1
        borderRadius: 3.5,
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
        p: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Test Tubes Container (2 Rows: 3 on top, 3 on bottom or 4 and 2) */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2.2,
          justifyItems: 'center',
          alignItems: 'end',
          width: '100%',
          maxWidth: 290,
          position: 'relative',
          py: 1
        }}>
          {tubes.map((tube, idx) => {
            const isSelected = selectedTube === idx;
            const isPouringSource = pouringInfo && pouringInfo.fromIdx === idx;
            const isPouringTarget = pouringInfo && pouringInfo.toIdx === idx;

            // Tilt angle toward target
            let tiltTransform = 'none';
            if (isPouringSource) {
              const diff = pouringInfo.toIdx - pouringInfo.fromIdx;
              const angle = diff > 0 ? 60 : -60;
              tiltTransform = `translateY(-30px) rotate(${angle}deg)`;
            } else if (isSelected) {
              tiltTransform = 'translateY(-16px)';
            }

            return (
              <Box
                key={idx}
                onClick={() => handleTubeClick(idx)}
                sx={{
                  position: 'relative',
                  width: 44,
                  height: 140,
                  cursor: amICurrentSolver && !isSolved ? 'pointer' : 'default',
                  transform: tiltTransform,
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: isPouringSource ? 20 : (isSelected ? 10 : 1)
                }}
              >
                {/* Glass Test Tube Body with rounded bottom (radius 22px) */}
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  border: isSelected ? '2px solid #00f2fe' : '1.5px solid rgba(255, 255, 255, 0.45)',
                  borderTop: 'none',
                  borderRadius: '0 0 22px 22px',
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(4px)',
                  boxShadow: isSelected
                    ? '0 0 16px rgba(0, 242, 254, 0.5)'
                    : 'inset 0 0 10px rgba(255,255,255,0.06)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  overflow: 'hidden'
                }}>
                  {/* Glass Top Rim / Lip */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: -2,
                    right: -2,
                    height: 4,
                    border: '1.5px solid rgba(255,255,255,0.6)',
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)'
                  }} />

                  {/* Glass Highlight Sheen along left side */}
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    bottom: 12,
                    left: 4,
                    width: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    zIndex: 5,
                    pointerEvents: 'none'
                  }} />

                  {/* Liquid Segments (Bottom to Top) */}
                  {tube.map((colorKey, segIdx) => {
                    const colorData = LIQUID_COLORS[colorKey] || { bg: '#3b82f6', top: '#60a5fa' };
                    const isTopSegment = segIdx === tube.length - 1;

                    return (
                      <Box
                        key={segIdx}
                        sx={{
                          width: '100%',
                          height: '25%', // 4 segments = 100%
                          bgcolor: colorData.bg,
                          borderTop: isTopSegment ? `2px solid ${colorData.top}` : '1px solid rgba(0,0,0,0.15)',
                          position: 'relative',
                          transition: 'height 0.2s ease',
                          boxShadow: `inset 0 0 8px rgba(0,0,0,0.2)`
                        }}
                      >
                        {/* Meniscus wave curve for top of liquid layer */}
                        {isTopSegment && (
                          <Box sx={{
                            position: 'absolute',
                            top: -2,
                            left: 0,
                            right: 0,
                            height: 4,
                            bgcolor: colorData.top,
                            borderRadius: '50%'
                          }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Dynamic Pouring Stream Line (matching pouring stream in reference image 1!) */}
        {pouringInfo && (
          <Box sx={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 15,
            width: 3.5,
            bgcolor: LIQUID_COLORS[pouringInfo.color]?.bg || '#f97316',
            boxShadow: `0 0 8px ${LIQUID_COLORS[pouringInfo.color]?.bg || '#f97316'}`,
            borderRadius: 2,
            animation: 'pourFlow 0.35s ease-out infinite'
          }} />
        )}
      </Box>

      {/* 3. SOLVED BANNER / SUBMIT BUTTONS */}
      {amICurrentSolver && isSolved && (
        <Box sx={{
          mt: 2,
          p: 2,
          borderRadius: 3,
          bgcolor: 'rgba(16, 185, 129, 0.15)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          width: '100%',
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#10b981', mb: 0.5 }}>
            🎉 PUZZLE SOLVED!
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1.5 }}>
            Completed in <b>{moveCount} moves</b> ({timerSeconds}s)! Score: <b>{calculateScore(moveCount, timerSeconds)} pts</b>
          </Typography>

          {isP1 && phase === 'p1_sorting' && (
            <Button
              variant="contained"
              onClick={handlePlayer1Submit}
              sx={{
                py: 1,
                px: 3,
                borderRadius: 2.5,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              🚀 Challenge {player2?.username}!
            </Button>
          )}

          {isP2 && phase === 'p2_sorting' && (
            <Button
              variant="contained"
              onClick={handlePlayer2Submit}
              sx={{
                py: 1,
                px: 3,
                borderRadius: 2.5,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#000',
                boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)'
              }}
            >
              🏆 View Match Results!
            </Button>
          )}
        </Box>
      )}

      {/* WAITING SCREEN: When Player 1 has set score and is waiting for Player 2 */}
      {!amICurrentSolver && phase !== 'finished' && (
        <Box sx={{
          mt: 2,
          p: 2,
          borderRadius: 3,
          bgcolor: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255,255,255,0.15)',
          width: '100%',
          textAlign: 'center'
        }}>
          <Typography sx={{ fontSize: 32 }}>⏳</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff', mt: 0.5 }}>
            {phase === 'p2_challenge'
              ? `Challenge Sent to ${player2?.username}!`
              : `${player2?.username} is Solving the Tubes!`
            }
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 0.5 }}>
            You solved it in {p1Moves} moves ({p1Time}s). Waiting for them to complete!
          </Typography>
        </Box>
      )}

      {/* FINISHED SCREEN: Winner & Loser Announcement */}
      {phase === 'finished' && (
        <Box sx={{
          mt: 2,
          p: 2,
          borderRadius: 3,
          bgcolor: 'rgba(10, 15, 30, 0.95)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          width: '100%',
          textAlign: 'center'
        }}>
          <Typography sx={{ fontSize: 36 }}>
            {winnerId === 'draw' ? '🤝' : (winnerId === userId ? '🏆' : '👑')}
          </Typography>
          <Typography variant="h6" sx={{
            fontWeight: 900,
            color: winnerId === 'draw' ? '#f59e0b' : (winnerId === userId ? '#22c55e' : '#00f2fe')
          }}>
            {winnerId === 'draw'
              ? "It's a Tie!"
              : (winnerId === userId ? 'YOU WON THE SORT! 🎉' : `${oppName} WON! 🏆`)
            }
          </Typography>

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-around',
            my: 1.5,
            p: 1.2,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.06)'
          }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800 }}>
                {player1?.username} {winnerId === player1?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#fff' }}>
                {p1Moves} moves ({p1Time}s)
              </Typography>
              <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 700 }}>
                {p1Score} pts
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>VS</Typography>

            <Box>
              <Typography variant="caption" sx={{ color: '#00f2fe', fontWeight: 800 }}>
                {player2?.username} {winnerId === player2?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#fff' }}>
                {p2Moves} moves ({p2Time}s)
              </Typography>
              <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 700 }}>
                {p2Score} pts
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={handleRematch}
            sx={{
              py: 0.8,
              px: 3,
              borderRadius: 2,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff'
            }}
          >
            🔄 Play Again!
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Initial Data Generator for WaterSort
export const waterSortInitialData = (player1, player2) => ({
  gameType: 'watersort',
  status: 'active',
  phase: 'p1_sorting',
  player1,
  player2,
  p1Score: null,
  p1Moves: null,
  p1Time: null,
  p2Score: null,
  p2Moves: null,
  p2Time: null,
  winnerId: null,
  turnPlayerId: player1?.id
});
