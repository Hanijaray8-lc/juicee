import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';

// ============================================================================
//  FIND AND MATCH! (FIND THE PAIR) - 2-PLAYER TURN-BASED
//  Matches reference design:
//  - Title: "Find and Match!"
//  - Subtitle: "Focus on the details of the pictures and improve your powers of observation!"
//  - Dark board with 16 tiles containing unique food/fruit items and ONE MATCHING PAIR
//  - 3-second timer per attempt
//  - Yellow border on selected tiles (matching screenshot)
//  - If wrong or timeout, turn passes to Player 2!
//  - 5 rounds total, highest score wins!
//  - Colorful letter tiles "FIND THE PAIR" at bottom
// ============================================================================

const TOTAL_ROUNDS = 5;
const TURN_TIME_SECONDS = 5;

// Diverse food & fruit emojis matching the reference image
const FOOD_EMOJIS = [
  '🍉', '🍍', '🍏', '🧀', '🌮', '🍑', '🍟', '🍤',
  '🍠', '🍕', '🍒', '🍋', '🍔', '🍓', '🍩', '🥑',
  '🥐', '🍇', '🥞', '🍦', '🍪', '🥨', '🍿', '🧁',
  '🌭', '🥪', '🍜', '🍣', '🍙', '🍎', '🥝', '🎂'
];

// Web Audio synthesizer for crisp game sound effects
class MatchSoundFX {
  constructor() {
    this.ctx = null;
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
  playPop() {
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }
  playMatch() {
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [587.33, 739.99, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);
        gain.gain.setValueAtTime(0.22, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.07 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.16);
      });
    } catch (e) {}
  }
  playWrong() {
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.2);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }
}

const soundFX = new MatchSoundFX();

// Generates a 16-tile board with 14 unique items and EXACTLY ONE MATCHING PAIR
export function generateFindPairRound() {
  const shuffledPool = [...FOOD_EMOJIS].sort(() => Math.random() - 0.5);
  const pairEmoji = shuffledPool[0]; // The duplicate item
  const uniqueItems = shuffledPool.slice(1, 15); // 14 distinct items

  // 16 tiles total: 14 unique + 2 matching
  const tileEmojis = [...uniqueItems, pairEmoji, pairEmoji].sort(() => Math.random() - 0.5);

  const tiles = tileEmojis.map((emoji, index) => ({
    id: index,
    emoji,
    isPair: emoji === pairEmoji
  }));

  return {
    tiles,
    pairEmoji,
    id: Date.now()
  };
}

export const FindTheMatchGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    currentRound = null,
    roundNum = 0,
    p1Score = 0,
    p2Score = 0,
    turnPlayerId = player1?.id,
    phase = 'playing', // 'playing' | 'finished'
    roundAttempts = 0, // 0: first player trying; 1: second player trying
    status = 'active',
    winnerId
  } = gameData || {};

  const isP1 = String(userId) === String(player1?.id);
  const isP2 = String(userId) === String(player2?.id);
  const isMyTurn = status === 'active' && String(turnPlayerId) === String(userId);
  const currentTurnPlayer = String(turnPlayerId) === String(player1?.id) ? player1 : player2;
  const opponentPlayer = isP1 ? player2 : player1;
  const opponentName = opponentPlayer?.username || 'Opponent';

  // Local turn state
  const [selectedIds, setSelectedIds] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_SECONDS);
  const [turnActive, setTurnActive] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'match' | 'wrong' | 'timeout', text: string }

  // Reset local state upon turn or round change
  useEffect(() => {
    setSelectedIds(gameData?.selectedTileIds || []);
    setTimeLeft(TURN_TIME_SECONDS);
    setFeedback(null);
    setTurnActive(isMyTurn && phase === 'playing');
  }, [phase, roundNum, turnPlayerId, currentRound?.id, isMyTurn, gameData?.selectedTileIds]);

  // Auto-start if waiting
  useEffect(() => {
    if (phase === 'waiting' && status === 'active' && isP1) {
      const timer = setTimeout(() => {
        handleStartRound();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, status, isP1]);

  // Handle Timeout (5 seconds expired)
  const handleTimeout = useCallback(() => {
    if (!isMyTurn || phase !== 'playing') return;

    soundFX.playWrong();
    setTurnActive(false);
    setFeedback({ type: 'timeout', text: "⏰ Time's up!" });

    setTimeout(() => {
      if (roundAttempts === 0) {
        // First player timed out -> switch turn to Player 2
        onSendGameMessage({
          ...gameData,
          turnPlayerId: opponentPlayer?.id,
          roundAttempts: 1,
          phase: 'playing',
          selectedTileIds: []
        });
      } else {
        // Both players failed -> reveal pair and advance round
        const nextRoundNum = roundNum + 1;
        const isDone = nextRoundNum >= TOTAL_ROUNDS;
        const overallWinner = isDone
          ? (p1Score > p2Score ? player1?.id : p2Score > p1Score ? player2?.id : 'draw')
          : undefined;

        onSendGameMessage({
          ...gameData,
          roundNum: nextRoundNum,
          roundAttempts: 0,
          turnPlayerId: player1?.id,
          status: isDone ? 'finished' : 'active',
          winnerId: overallWinner,
          phase: isDone ? 'finished' : 'playing',
          currentRound: isDone ? null : generateFindPairRound(),
          selectedTileIds: []
        });
      }
    }, 1200);
  }, [isMyTurn, phase, roundAttempts, roundNum, p1Score, p2Score, player1, player2, opponentPlayer, gameData, onSendGameMessage]);

  // 5-Second Countdown Timer
  useEffect(() => {
    if (!turnActive || !isMyTurn || phase !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turnActive, isMyTurn, phase, handleTimeout]);

  // Start New Round (Initiated by Player 1 or turn player)
  const handleStartRound = () => {
    const newRound = generateFindPairRound();
    onSendGameMessage({
      ...gameData,
      currentRound: newRound,
      phase: 'playing',
      roundAttempts: 0,
      turnPlayerId: player1?.id,
      selectedTileIds: []
    });
  };

  // Play Again Handler
  const handlePlayAgain = () => {
    onSendGameMessage({
      ...gameData,
      status: 'active',
      roundNum: 0,
      p1Score: 0,
      p2Score: 0,
      currentRound: generateFindPairRound(),
      phase: 'playing',
      roundAttempts: 0,
      selectedTileIds: [],
      winnerId: undefined,
      turnPlayerId: player1?.id
    });
  };

  // Card Tile Click Handler
  const handleTileClick = (tile) => {
    if (!isMyTurn || phase !== 'playing' || !turnActive) return;
    if (selectedIds.includes(tile.id)) return;
    if (selectedIds.length >= 2) return;

    soundFX.playPop();
    const newSelected = [...selectedIds, tile.id];
    setSelectedIds(newSelected);

    if (newSelected.length === 2) {
      setTurnActive(false); // Stop countdown timer
      const tile1 = currentRound.tiles[newSelected[0]];
      const tile2 = currentRound.tiles[newSelected[1]];
      const isMatch = tile1.emoji === tile2.emoji;

      if (isMatch) {
        // MATCH FOUND!
        soundFX.playMatch();
        setFeedback({ type: 'match', text: `🎉 MATCH FOUND! ${tile1.emoji} +1 pt` });

        setTimeout(() => {
          const newP1Score = isP1 ? p1Score + 1 : p1Score;
          const newP2Score = isP2 ? p2Score + 1 : p2Score;
          const nextRoundNum = roundNum + 1;
          const isDone = nextRoundNum >= TOTAL_ROUNDS;
          const overallWinner = isDone
            ? (newP1Score > newP2Score ? player1?.id : newP2Score > newP1Score ? player2?.id : 'draw')
            : undefined;

          onSendGameMessage({
            ...gameData,
            p1Score: newP1Score,
            p2Score: newP2Score,
            roundNum: nextRoundNum,
            roundAttempts: 0,
            turnPlayerId: player1?.id,
            status: isDone ? 'finished' : 'active',
            winnerId: overallWinner,
            phase: isDone ? 'finished' : 'playing',
            currentRound: isDone ? null : generateFindPairRound(),
            selectedTileIds: []
          });
        }, 1200);
      } else {
        // WRONG PAIR!
        soundFX.playWrong();
        setFeedback({ type: 'wrong', text: '❌ Wrong Pair!' });

        setTimeout(() => {
          if (roundAttempts === 0) {
            // First player wrong -> Switch turn to Player 2
            onSendGameMessage({
              ...gameData,
              turnPlayerId: opponentPlayer?.id,
              roundAttempts: 1,
              phase: 'playing',
              selectedTileIds: []
            });
          } else {
            // Both players wrong -> reveal pair and advance
            const nextRoundNum = roundNum + 1;
            const isDone = nextRoundNum >= TOTAL_ROUNDS;
            const overallWinner = isDone
              ? (p1Score > p2Score ? player1?.id : p2Score > p1Score ? player2?.id : 'draw')
              : undefined;

            onSendGameMessage({
              ...gameData,
              roundNum: nextRoundNum,
              roundAttempts: 0,
              turnPlayerId: player1?.id,
              status: isDone ? 'finished' : 'active',
              winnerId: overallWinner,
              phase: isDone ? 'finished' : 'playing',
              currentRound: isDone ? null : generateFindPairRound(),
              selectedTileIds: []
            });
          }
        }, 1200);
      }
    } else {
      // Sync first card pick live to opponent
      onSendGameMessage({
        ...gameData,
        selectedTileIds: newSelected
      });
    }
  };

  // Status banner text
  const getBannerText = () => {
    if (status === 'finished') {
      if (winnerId === 'draw') return "🤝 It's a Tie Match!";
      return winnerId === userId ? '🏆 You Won the Match!' : `👑 ${opponentName} Won!`;
    }
    if (feedback) {
      return feedback.text;
    }
    if (phase === 'waiting') {
      return isP1 ? 'Tap "Start Round" to begin!' : `Waiting for ${player1?.username || 'Player 1'} to start...`;
    }
    if (phase === 'playing') {
      if (isMyTurn) {
        return `⚡ Your Turn! Find the matching pair (${timeLeft}s)`;
      }
      return `👀 ${currentTurnPlayer?.username || 'Opponent'}'s turn to spot the pair...`;
    }
    return 'Find the Pair!';
  };

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
      {/* 1. Header Title matching reference image */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 900,
          color: '#facc15',
          textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 0 10px rgba(250, 204, 21, 0.4)',
          letterSpacing: 1,
          mb: 0.3,
          fontFamily: '"Fredoka One", "Arial Rounded MT Bold", sans-serif',
          textAlign: 'center'
        }}
      >
        Find and Match!
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: isDarkTheme ? '#94a3b8' : '#64748b',
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 600,
          mb: 1.5,
          maxWidth: 280,
          lineHeight: 1.2
        }}
      >
        Focus on the details of the pictures and improve your powers of observation!
      </Typography>

      {/* 2. Main Dark Card Container matching screenshot */}
      <Box
        sx={{
          width: '100%',
          bgcolor: '#2b2d33',
          borderRadius: '24px',
          p: 1.8,
          boxShadow: '0 12px 35px rgba(0,0,0,0.45)',
          border: '1.5px solid rgba(255,255,255,0.08)',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Top Stats Bar inside the dark card */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2, px: 0.5 }}>
          {/* Score display on left */}
          <Box>
            <Typography sx={{ color: '#ef4444', fontSize: 11, fontWeight: 800 }}>
              {player1?.username || 'P1'}: {p1Score * 100}
            </Typography>
            <Typography sx={{ color: '#38bdf8', fontSize: 11, fontWeight: 800 }}>
              {player2?.username || 'P2'}: {p2Score * 100}
            </Typography>
          </Box>

          {/* Timer in center */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                color: timeLeft <= 1 && turnActive ? '#ef4444' : '#ffffff',
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: 1,
                fontFamily: 'monospace'
              }}
            >
              00:0{timeLeft}
            </Typography>
            {/* Dots indicator */}
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 0.2 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    bgcolor: i === roundNum ? '#facc15' : 'rgba(255,255,255,0.25)'
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Round counter on right */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ color: '#facc15', fontSize: 12, fontWeight: 900 }}>
              Round {Math.min(roundNum + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
              {roundAttempts === 0 ? 'Turn 1/2' : 'Turn 2/2'}
            </Typography>
          </Box>
        </Box>

        {/* Turn & Status Message */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 11,
            color: feedback?.type === 'match' ? '#4ade80' : feedback?.type ? '#f87171' : isMyTurn ? '#facc15' : '#94a3b8',
            mb: 1.2
          }}
        >
          {getBannerText()}
        </Typography>

        {/* 16 Tiles Grid (4x4) */}
        {currentRound && phase === 'playing' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0.8,
              justifyItems: 'center',
              my: 0.5
            }}
          >
            {currentRound.tiles.map((tile) => {
              const isSelected = selectedIds.includes(tile.id);
              const isRevealed = feedback?.type === 'match' && tile.isPair;
              const isWrong = feedback?.type === 'wrong' && isSelected;

              return (
                <Box
                  key={tile.id}
                  onClick={() => handleTileClick(tile)}
                  sx={{
                    width: '100%',
                    aspectRatio: '1/1',
                    bgcolor: '#3b3e46',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.65rem',
                    cursor: isMyTurn && turnActive ? 'pointer' : 'default',
                    // Yellow outline matching screenshot when selected!
                    border: isRevealed
                      ? '3px solid #22c55e'
                      : isWrong
                      ? '3px solid #ef4444'
                      : isSelected
                      ? '3px solid #facc15'
                      : '2px solid transparent',
                    boxShadow: isSelected
                      ? '0 0 14px rgba(250, 204, 21, 0.75)'
                      : '0 4px 10px rgba(0,0,0,0.3)',
                    transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': isMyTurn && turnActive ? {
                      bgcolor: '#464a54',
                      transform: 'scale(1.05)'
                    } : {}
                  }}
                >
                  {tile.emoji}
                </Box>
              );
            })}
          </Box>
        ) : (
          /* Waiting / Start Round View inside card */
          <Box
            sx={{
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 2
            }}
          >
            {status === 'finished' ? (
              <>
                <Typography sx={{ fontSize: 36, mb: 0.5 }}>🏆</Typography>
                <Typography variant="h6" sx={{ color: '#facc15', fontWeight: 900 }}>
                  {winnerId === 'draw' ? 'Match Draw!' : winnerId === userId ? 'You Won! 🎉' : `${opponentName} Won! 👑`}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 2 }}>
                  Final: {p1Score * 100} vs {p2Score * 100} points
                </Typography>
                <Button
                  variant="contained"
                  onClick={handlePlayAgain}
                  sx={{
                    background: 'linear-gradient(135deg, #facc15, #eab308)',
                    color: '#000',
                    fontWeight: 900,
                    textTransform: 'none',
                    borderRadius: 3
                  }}
                >
                  Play Again 🔄
                </Button>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: 36, mb: 1 }}>🔍🎯</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>
                  {isP1 ? 'Ready to Spot the Matching Pair?' : `Waiting for ${player1?.username || 'Player 1'} to Start`}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 2 }}>
                  Find the 2 identical images within 5 seconds!
                </Typography>
                {isP1 && (
                  <Button
                    variant="contained"
                    onClick={handleStartRound}
                    sx={{
                      background: 'linear-gradient(135deg, #facc15, #eab308)',
                      color: '#000',
                      fontWeight: 900,
                      textTransform: 'none',
                      borderRadius: 3,
                      px: 3
                    }}
                  >
                    Start Round {roundNum + 1} ▶
                  </Button>
                )}
              </>
            )}
          </Box>
        )}

        {/* 3 Circular Badges at the bottom inside card matching screenshot */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, mt: 1.8, pt: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Target Tool Badge */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15
              }}
            >
              🎯
            </Box>
            <Typography sx={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, mt: 0.3 }}>
              {Math.min(roundNum + 1, TOTAL_ROUNDS)}
            </Typography>
          </Box>

          {/* Turn / Share Badge */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15
              }}
            >
              👥
            </Box>
            <Typography sx={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, mt: 0.3 }}>
              {roundAttempts + 1}
            </Typography>
          </Box>

          {/* Clock Tool Badge */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#eab308',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15
              }}
            >
              ⏱️
            </Box>
            <Typography sx={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, mt: 0.3 }}>
              {timeLeft}s
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 3. Colorful Letter Blocks "FIND THE PAIR" matching screenshot */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mt: 2 }}>
        {/* Row 1: F I N D */}
        <Box sx={{ display: 'flex', gap: 0.6 }}>
          {[
            { letter: 'F', bg: '#fde047', border: '#ca8a04' },
            { letter: 'I', bg: '#f87171', border: '#dc2626' },
            { letter: 'N', bg: '#4ade80', border: '#16a34a' },
            { letter: 'D', bg: '#fb923c', border: '#ea580c' }
          ].map((item, idx) => (
            <Box
              key={idx}
              sx={{
                width: 24,
                height: 24,
                bgcolor: item.bg,
                border: `2px solid ${item.border}`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 900,
                color: '#1e293b',
                boxShadow: '0 2px 0 rgba(0,0,0,0.15)'
              }}
            >
              {item.letter}
            </Box>
          ))}
        </Box>

        {/* Row 2: T H E */}
        <Box sx={{ display: 'flex', gap: 0.6 }}>
          {[
            { letter: 'T', bg: '#38bdf8', border: '#0284c7' },
            { letter: 'H', bg: '#2dd4bf', border: '#0d9488' },
            { letter: 'E', bg: '#818cf8', border: '#4f46e5' }
          ].map((item, idx) => (
            <Box
              key={idx}
              sx={{
                width: 24,
                height: 24,
                bgcolor: item.bg,
                border: `2px solid ${item.border}`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 900,
                color: '#1e293b',
                boxShadow: '0 2px 0 rgba(0,0,0,0.15)'
              }}
            >
              {item.letter}
            </Box>
          ))}
        </Box>

        {/* Row 3: P A I R */}
        <Box sx={{ display: 'flex', gap: 0.6 }}>
          {[
            { letter: 'P', bg: '#06b6d4', border: '#0891b2' },
            { letter: 'A', bg: '#f472b6', border: '#db2777' },
            { letter: 'I', bg: '#ef4444', border: '#b91c1c' },
            { letter: 'R', bg: '#34d399', border: '#059669' }
          ].map((item, idx) => (
            <Box
              key={idx}
              sx={{
                width: 24,
                height: 24,
                bgcolor: item.bg,
                border: `2px solid ${item.border}`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 900,
                color: '#1e293b',
                boxShadow: '0 2px 0 rgba(0,0,0,0.15)'
              }}
            >
              {item.letter}
            </Box>
          ))}
        </Box>

        <Typography variant="caption" sx={{ color: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 10, mt: 0.5 }}>
          Find the pairs among the various picture cards!
        </Typography>
      </Box>
    </Box>
  );
};

export const findTheMatchInitialData = (player1, player2) => ({
  gameType: 'findthematch',
  status: 'invited',
  player1,
  player2,
  currentRound: generateFindPairRound(),
  roundNum: 0,
  p1Score: 0,
  p2Score: 0,
  turnPlayerId: player1?.id,
  phase: 'playing',
  roundAttempts: 0,
  selectedTileIds: [],
  winnerId: undefined
});
