import React from 'react';
import { Box, Typography, Button } from '@mui/material';

// Dots and Boxes Game
// Board: ROWS x COLS dots => (ROWS-1) x (COLS-1) boxes
const ROWS = 4;
const COLS = 4;

const totalHLines = ROWS * (COLS - 1);
const totalVLines = (ROWS - 1) * COLS;
const totalBoxes = (ROWS - 1) * (COLS - 1);

// Web Audio sound effects (pure synthetic audio, zero external dependencies)
const playSound = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'line') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'box') {
      // Pleasant chord for completing a box
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.14, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + 0.28);
      });
    } else if (type === 'win') {
      // Victory fanfare
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.16, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.45);
      });
    }
  } catch {
    // Audio context may be restricted before user gesture, safely ignore
  }
};

// Check if a box (r,c) is completed given hLines and vLines
export function checkBox(r, c, hLines, vLines) {
  const top    = r * (COLS - 1) + c;
  const bottom = (r + 1) * (COLS - 1) + c;
  const left   = r * COLS + c;
  const right  = r * COLS + (c + 1);
  return Boolean(hLines[top] && hLines[bottom] && vLines[left] && vLines[right]);
}

export const DotsAndBoxesGame = ({ gameData, userId, onSendGameMessage, isDarkTheme, isLatest = true }) => {
  const {
    player1,
    player2,
    turnPlayerId,
    hLines = Array(totalHLines).fill(false),
    vLines = Array(totalVLines).fill(false),
    boxOwners = Array(totalBoxes).fill(null),
    scores = {},
    status
  } = gameData || {};

  const p1Id = String(player1?.id || player1?._id || gameData?.player1Id || '');
  const p2Id = String(player2?.id || player2?._id || gameData?.player2Id || '');
  const currentUserId = String(userId || '');
  const isP1 = Boolean(currentUserId && p1Id && currentUserId === p1Id);
  const isP2 = Boolean(currentUserId && p2Id && currentUserId === p2Id);

  // Active turn ID (defaults to p1Id if not yet set)
  const currentTurnId = String(turnPlayerId || p1Id);
  const isMyTurn = Boolean(isLatest && status === 'active' && currentTurnId && currentUserId && currentTurnId === currentUserId);

  const mySymbol = isP1 ? 'P1' : 'P2';
  const opponentName = isP1
    ? (player2?.username || 'Player 2')
    : (player1?.username || 'Player 1');

  const p1Score = Number(scores[p1Id] ?? scores[player1?.id] ?? scores[player1?._id] ?? 0);
  const p2Score = Number(scores[p2Id] ?? scores[player2?.id] ?? scores[player2?._id] ?? 0);

  const handleHLine = (idx) => {
    if (!isLatest || !isMyTurn || hLines[idx]) return;
    const newH = [...hLines];
    newH[idx] = true;

    // Determine which player made this move
    const moverIsP1 = isP1 || (!isP2 && currentTurnId === p1Id);

    const newBoxOwners = [...boxOwners];
    let claimed = 0;
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const bi = r * (COLS - 1) + c;
        if (!newBoxOwners[bi] && checkBox(r, c, newH, vLines)) {
          newBoxOwners[bi] = moverIsP1 ? p1Id : p2Id;
          claimed++;
        }
      }
    }

    const currentScoreKey = moverIsP1 ? p1Id : p2Id;
    const newScores = {
      ...scores,
      [currentScoreKey]: (Number(scores[currentScoreKey] ?? 0)) + claimed
    };
    if (currentUserId && currentUserId !== currentScoreKey) {
      newScores[currentUserId] = newScores[currentScoreKey];
    }

    // Next turn logic:
    // If a box is claimed, current player gets another turn (claimed > 0).
    // Otherwise, turn strictly alternates to the other player.
    const nextPlayerId = moverIsP1 ? p2Id : p1Id;
    const nextTurn = claimed > 0 ? (moverIsP1 ? p1Id : p2Id) : nextPlayerId;

    const newP1Score = Number(newScores[p1Id] ?? (scores[p1Id] || 0) + (moverIsP1 ? claimed : 0));
    const newP2Score = Number(newScores[p2Id] ?? (scores[p2Id] || 0) + (!moverIsP1 ? claimed : 0));
    const done = (newP1Score + newP2Score) >= totalBoxes;

    if (claimed > 0) {
      playSound('box');
    } else {
      playSound('line');
    }
    if (done) {
      setTimeout(() => playSound('win'), 200);
    }

    onSendGameMessage({
      ...gameData,
      hLines: newH,
      vLines: [...vLines],
      boxOwners: newBoxOwners,
      scores: newScores,
      turnPlayerId: nextTurn,
      player1Id: p1Id,
      player2Id: p2Id,
      player1: { ...player1, id: p1Id },
      player2: { ...player2, id: p2Id },
      status: done ? 'finished' : 'active',
      winnerId: done
        ? (newP1Score > newP2Score ? p1Id : (newP2Score > newP1Score ? p2Id : 'draw'))
        : undefined
    });
  };

  const handleVLine = (idx) => {
    if (!isLatest || !isMyTurn || vLines[idx]) return;
    const newV = [...vLines];
    newV[idx] = true;

    // Determine which player made this move
    const moverIsP1 = isP1 || (!isP2 && currentTurnId === p1Id);

    const newBoxOwners = [...boxOwners];
    let claimed = 0;
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const bi = r * (COLS - 1) + c;
        if (!newBoxOwners[bi] && checkBox(r, c, hLines, newV)) {
          newBoxOwners[bi] = moverIsP1 ? p1Id : p2Id;
          claimed++;
        }
      }
    }

    const currentScoreKey = moverIsP1 ? p1Id : p2Id;
    const newScores = {
      ...scores,
      [currentScoreKey]: (Number(scores[currentScoreKey] ?? 0)) + claimed
    };
    if (currentUserId && currentUserId !== currentScoreKey) {
      newScores[currentUserId] = newScores[currentScoreKey];
    }

    const nextPlayerId = moverIsP1 ? p2Id : p1Id;
    const nextTurn = claimed > 0 ? (moverIsP1 ? p1Id : p2Id) : nextPlayerId;

    const newP1Score = Number(newScores[p1Id] ?? (scores[p1Id] || 0) + (moverIsP1 ? claimed : 0));
    const newP2Score = Number(newScores[p2Id] ?? (scores[p2Id] || 0) + (!moverIsP1 ? claimed : 0));
    const done = (newP1Score + newP2Score) >= totalBoxes;

    if (claimed > 0) {
      playSound('box');
    } else {
      playSound('line');
    }
    if (done) {
      setTimeout(() => playSound('win'), 200);
    }

    onSendGameMessage({
      ...gameData,
      hLines: [...hLines],
      vLines: newV,
      boxOwners: newBoxOwners,
      scores: newScores,
      turnPlayerId: nextTurn,
      player1Id: p1Id,
      player2Id: p2Id,
      player1: { ...player1, id: p1Id },
      player2: { ...player2, id: p2Id },
      status: done ? 'finished' : 'active',
      winnerId: done
        ? (newP1Score > newP2Score ? p1Id : (newP2Score > newP1Score ? p2Id : 'draw'))
        : undefined
    });
  };

  const handlePlayAgain = () => {
    playSound('line');
    onSendGameMessage({
      ...gameData,
      hLines: Array(totalHLines).fill(false),
      vLines: Array(totalVLines).fill(false),
      boxOwners: Array(totalBoxes).fill(null),
      scores: { [p1Id]: 0, [p2Id]: 0 },
      turnPlayerId: p1Id,
      player1Id: p1Id,
      player2Id: p2Id,
      player1: { ...player1, id: p1Id },
      player2: { ...player2, id: p2Id },
      status: 'active',
      winnerId: null
    });
  };

  // Modern vibrant neon color tokens
  const p1Color = '#f43f5e'; // Neon Rose / Coral Red
  const p2Color = '#06b6d4'; // Cyan / Electric Blue

  const isP1Turn = status === 'active' && currentTurnId === p1Id;
  const isP2Turn = status === 'active' && currentTurnId === p2Id;

  // Board dimensions
  const cellSize = 58;
  const dotSize = 14;
  const lineThick = 6;
  const boardWidth = (COLS - 1) * cellSize + dotSize;
  const boardHeight = (ROWS - 1) * cellSize + dotSize;

  const getStatusText = () => {
    if (status === 'finished') {
      const w = String(gameData?.winnerId || '');
      if (w === 'draw' || w === 'tie') return "It's a Draw! 🤝";
      const isWinner = w === currentUserId || (isP1 ? w === p1Id : w === p2Id);
      return isWinner ? "You Won the Match! 🏆🎉" : `${opponentName} Won! 👑`;
    }
    if (!isLatest) {
      return "Past Move";
    }
    return isMyTurn ? "Your Turn — tap a line to connect!" : `Waiting for ${opponentName}...`;
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: 340,
      p: { xs: 1.5, sm: 2 },
      borderRadius: 4,
      background: isDarkTheme
        ? 'linear-gradient(145deg, rgba(20, 26, 56, 0.95) 0%, rgba(10, 14, 32, 0.98) 100%)'
        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      border: isDarkTheme
        ? '1.5px solid rgba(255, 255, 255, 0.14)'
        : '1.5px solid rgba(0, 0, 0, 0.08)',
      boxShadow: isDarkTheme
        ? '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.15)'
        : '0 10px 30px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(16px)',
      boxSizing: 'border-box',
      gap: 1.6,
      userSelect: 'none'
    }}>
      {/* 1. TOP SCOREBOARD HEADER */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        px: 0.5
      }}>
        {/* Player 1 Card */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 0.8,
          px: 1.2,
          borderRadius: 3,
          bgcolor: isP1Turn ? 'rgba(244, 63, 94, 0.18)' : (isDarkTheme ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
          border: `1.5px solid ${isP1Turn ? p1Color : (isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')}`,
          boxShadow: isP1Turn ? '0 0 16px rgba(244, 63, 94, 0.35)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: p1Color,
            color: '#fff',
            fontWeight: 900,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(244, 63, 94, 0.5)'
          }}>
            {(player1?.username || 'P1')[0].toUpperCase()}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: isDarkTheme ? '#fff' : '#0f172a',
              lineHeight: 1.1,
              maxWidth: 72,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {isP1 ? 'You' : (player1?.username || 'Player 1')}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: p1Color, mt: 0.2 }}>
              ⭐ {p1Score} {p1Score === 1 ? 'box' : 'boxes'}
            </Typography>
          </Box>
        </Box>

        {/* Center VS & Progress */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
          <Typography sx={{
            fontSize: '0.68rem',
            fontWeight: 900,
            letterSpacing: 1.2,
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)',
            textTransform: 'uppercase'
          }}>
            VS
          </Typography>
          <Box sx={{
            px: 1,
            py: 0.25,
            borderRadius: 2,
            bgcolor: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            border: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b' }}>
              {p1Score + p2Score} / {totalBoxes}
            </Typography>
          </Box>
        </Box>

        {/* Player 2 Card */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 0.8,
          px: 1.2,
          borderRadius: 3,
          bgcolor: isP2Turn ? 'rgba(6, 182, 212, 0.18)' : (isDarkTheme ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
          border: `1.5px solid ${isP2Turn ? p2Color : (isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')}`,
          boxShadow: isP2Turn ? '0 0 16px rgba(6, 182, 212, 0.35)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <Box sx={{ minWidth: 0, textAlign: 'right' }}>
            <Typography sx={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: isDarkTheme ? '#fff' : '#0f172a',
              lineHeight: 1.1,
              maxWidth: 72,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {isP2 ? 'You' : (player2?.username || 'Player 2')}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: p2Color, mt: 0.2 }}>
              ⭐ {p2Score} {p2Score === 1 ? 'box' : 'boxes'}
            </Typography>
          </Box>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: p2Color,
            color: '#fff',
            fontWeight: 900,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(6, 182, 212, 0.5)'
          }}>
            {(player2?.username || 'P2')[0].toUpperCase()}
          </Box>
        </Box>
      </Box>

      {/* 2. TURN / WINNER BANNER */}
      <Box sx={{
        width: '100%',
        py: 0.8,
        px: 1.4,
        borderRadius: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        background: status === 'finished'
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%)'
          : (isMyTurn
            ? (mySymbol === 'P1'
              ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.22) 0%, rgba(225, 29, 72, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.1) 100%)')
            : (isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)')),
        border: status === 'finished'
          ? '1px solid rgba(245, 158, 11, 0.45)'
          : (isMyTurn
            ? (mySymbol === 'P1' ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(6, 182, 212, 0.45)')
            : (isDarkTheme ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)')),
        boxShadow: isMyTurn ? '0 0 14px rgba(0, 242, 254, 0.18)' : 'none'
      }}>
        <Typography sx={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: status === 'finished'
            ? '#fbbf24'
            : (isMyTurn ? (mySymbol === 'P1' ? p1Color : p2Color) : (isDarkTheme ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)')),
          display: 'flex',
          alignItems: 'center',
          gap: 0.6
        }}>
          {getStatusText()}
        </Typography>
      </Box>

      {/* 3. GAME BOARD */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 1.75,
        borderRadius: 3.5,
        bgcolor: isDarkTheme ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        border: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <Box sx={{
          position: 'relative',
          width: boardWidth,
          height: boardHeight
        }}>
        {/* Boxes (captured zones) */}
        {Array.from({ length: ROWS - 1 }).map((_, r) =>
          Array.from({ length: COLS - 1 }).map((_, c) => {
            const bi = r * (COLS - 1) + c;
            const owner = boxOwners[bi];
            const isP1Owner = owner && String(owner) === p1Id;
            const isP2Owner = owner && String(owner) === p2Id;

            return (
              <Box
                key={`box-${r}-${c}`}
                sx={{
                  position: 'absolute',
                  left: c * cellSize + dotSize,
                  top: r * cellSize + dotSize,
                  width: cellSize - dotSize,
                  height: cellSize - dotSize,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.35s ease',
                  background: isP1Owner
                    ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(225, 29, 72, 0.16) 100%)'
                    : (isP2Owner
                      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(14, 165, 233, 0.16) 100%)'
                      : 'transparent'),
                  border: isP1Owner
                    ? '1.5px solid rgba(244, 63, 94, 0.65)'
                    : (isP2Owner
                      ? '1.5px solid rgba(6, 182, 212, 0.65)'
                      : (isDarkTheme ? '1px dashed rgba(255,255,255,0.04)' : '1px dashed rgba(0,0,0,0.04)')),
                  boxShadow: isP1Owner
                    ? 'inset 0 0 14px rgba(244, 63, 94, 0.35), 0 0 10px rgba(244, 63, 94, 0.25)'
                    : (isP2Owner
                      ? 'inset 0 0 14px rgba(6, 182, 212, 0.35), 0 0 10px rgba(6, 182, 212, 0.25)'
                      : 'none'),
                  zIndex: 1
                }}
              >
                {owner && (
                  <Typography sx={{
                    fontSize: '1rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: isP1Owner ? p1Color : p2Color,
                    textShadow: isP1Owner
                      ? '0 0 8px rgba(244, 63, 94, 0.8)'
                      : '0 0 8px rgba(6, 182, 212, 0.8)'
                  }}>
                    {isP1Owner ? '●' : '◆'}
                  </Typography>
                )}
              </Box>
            );
          })
        )}

        {/* Horizontal Lines (with expanded touch hit-box) */}
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS - 1 }).map((_, c) => {
            const idx = r * (COLS - 1) + c;
            const drawn = hLines[idx];
            const canClick = isLatest && isMyTurn && !drawn;

            return (
              <Box
                key={`h-${r}-${c}`}
                onClick={() => handleHLine(idx)}
                sx={{
                  position: 'absolute',
                  left: c * cellSize + dotSize,
                  top: r * cellSize + dotSize / 2 - 12,
                  width: cellSize - dotSize,
                  height: 24, // Expanded 24px hit area for easy finger taps
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canClick ? 'pointer' : 'default',
                  zIndex: 2,
                  '&:hover .h-line-bar': canClick ? {
                    background: mySymbol === 'P1'
                      ? 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)'
                      : 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 100%)',
                    boxShadow: mySymbol === 'P1'
                      ? '0 0 10px rgba(244, 63, 94, 0.8)'
                      : '0 0 10px rgba(6, 182, 212, 0.8)',
                    transform: 'scaleY(1.3)'
                  } : {}
                }}
              >
                <Box
                  className="h-line-bar"
                  sx={{
                    width: '100%',
                    height: lineThick,
                    borderRadius: 3,
                    background: drawn
                      ? 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)'
                      : 'transparent',
                    border: drawn
                      ? 'none'
                      : `1.5px dashed ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    boxShadow: drawn
                      ? '0 0 10px rgba(56, 189, 248, 0.75), 0 0 16px rgba(129, 140, 248, 0.4)'
                      : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </Box>
            );
          })
        )}

        {/* Vertical Lines (with expanded touch hit-box) */}
        {Array.from({ length: ROWS - 1 }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => {
            const idx = r * COLS + c;
            const drawn = vLines[idx];
            const canClick = isLatest && isMyTurn && !drawn;

            return (
              <Box
                key={`v-${r}-${c}`}
                onClick={() => handleVLine(idx)}
                sx={{
                  position: 'absolute',
                  left: c * cellSize + dotSize / 2 - 12,
                  top: r * cellSize + dotSize,
                  width: 24, // Expanded 24px hit area for easy finger taps
                  height: cellSize - dotSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canClick ? 'pointer' : 'default',
                  zIndex: 2,
                  '&:hover .v-line-bar': canClick ? {
                    background: mySymbol === 'P1'
                      ? 'linear-gradient(180deg, #f43f5e 0%, #fb7185 100%)'
                      : 'linear-gradient(180deg, #06b6d4 0%, #38bdf8 100%)',
                    boxShadow: mySymbol === 'P1'
                      ? '0 0 10px rgba(244, 63, 94, 0.8)'
                      : '0 0 10px rgba(6, 182, 212, 0.8)',
                    transform: 'scaleX(1.3)'
                  } : {}
                }}
              >
                <Box
                  className="v-line-bar"
                  sx={{
                    width: lineThick,
                    height: '100%',
                    borderRadius: 3,
                    background: drawn
                      ? 'linear-gradient(180deg, #38bdf8 0%, #818cf8 100%)'
                      : 'transparent',
                    border: drawn
                      ? 'none'
                      : `1.5px dashed ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    boxShadow: drawn
                      ? '0 0 10px rgba(56, 189, 248, 0.75), 0 0 16px rgba(129, 140, 248, 0.4)'
                      : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </Box>
            );
          })
        )}

        {/* 3D Metallic Neon Peg Dots */}
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => (
            <Box
              key={`dot-${r}-${c}`}
              sx={{
                position: 'absolute',
                left: c * cellSize,
                top: r * cellSize,
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 50%, #475569 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.75)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55), 0 0 6px rgba(255, 255, 255, 0.4)',
                zIndex: 3
              }}
            />
          ))
        )}
        </Box>
      </Box>

      {/* 4. PLAY AGAIN BUTTON */}
      {status === 'finished' && isLatest && (
        <Button
          size="small"
          variant="contained"
          onClick={handlePlayAgain}
          sx={{
            py: 0.8,
            px: 3,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            color: '#000',
            fontWeight: 900,
            fontSize: '0.82rem',
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #00d2de 0%, #3e9cee 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px rgba(0, 242, 254, 0.5)'
            }
          }}
        >
          🔄 Play Again
        </Button>
      )}
    </Box>
  );
};

export const dotsAndBoxesInitialData = (player1, player2) => {
  const p1Id = String(player1?.id || player1?._id || '');
  const p2Id = String(player2?.id || player2?._id || '');
  return {
    gameType: 'dotsandboxes',
    status: 'invited',
    player1: { ...player1, id: p1Id },
    player2: { ...player2, id: p2Id },
    player1Id: p1Id,
    player2Id: p2Id,
    hLines: Array(ROWS * (COLS - 1)).fill(false),
    vLines: Array((ROWS - 1) * COLS).fill(false),
    boxOwners: Array((ROWS - 1) * (COLS - 1)).fill(null),
    scores: { [p1Id]: 0, [p2Id]: 0 },
    turnPlayerId: p1Id
  };
};
