import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

// Memory Game - 2 Player turn-based
// Each player takes turns flipping 2 cards; if they match, they score a point and go again
// 16 cards = 8 pairs

const CARD_EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];

function shuffleCards() {
  const cards = [...CARD_EMOJIS, ...CARD_EMOJIS].map((emoji, i) => ({ id: i, emoji, matched: false }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export const MemoryGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1, player2, turnPlayerId,
    cards = [],
    flipped = [],       // indices of currently face-up (not yet matched) cards (max 2)
    matched = [],       // indices of matched cards
    scores = {},
    status,
    pendingFlip = null  // { idx1, idx2 } waiting for hide animation
  } = gameData;

  const [localFlipped, setLocalFlipped] = useState(flipped);
  const [waiting, setWaiting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(5);
  const previewDoneRef = useRef(false);

  useEffect(() => {
    setLocalFlipped(flipped);
    setWaiting(false);
  }, [JSON.stringify(flipped)]);

  // Reveal all cards once at game start for memorization (5s preview)
  useEffect(() => {
    const isFreshGame = matched.length === 0 && (!scores || Object.values(scores).every(s => !s));
    if (status === 'active' && cards.length > 0 && isFreshGame && !previewDoneRef.current) {
      setPreviewing(true);
      setPreviewCountdown(5);

      const timer = setInterval(() => {
        setPreviewCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPreviewing(false);
            previewDoneRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, cards.length, matched.length]);

  const isMyTurn = status === 'active' && String(turnPlayerId) === String(userId);
  const opponentName = String(userId) === String(player1?.id) ? player2?.username : player1?.username;
  const p1Score = scores[player1?.id] || 0;
  const p2Score = scores[player2?.id] || 0;
  const totalPairs = CARD_EMOJIS.length;

  const handleCardClick = (idx) => {
    if (previewing || !isMyTurn || waiting) return;
    if (matched.includes(idx)) return;
    if (localFlipped.includes(idx)) return;
    if (localFlipped.length >= 2) return;

    const newFlipped = [...localFlipped, idx];
    setLocalFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setWaiting(true);
      // Stream both flipped cards immediately so opponent sees card 2 flipped live!
      onSendGameMessage({ ...gameData, flipped: newFlipped });

      const [a, b] = newFlipped;
      const isMatch = cards[a]?.emoji === cards[b]?.emoji;

      setTimeout(() => {
        const newMatched = isMatch ? [...matched, a, b] : matched;
        const newScores = isMatch ? { ...scores, [userId]: (scores[userId] || 0) + 1 } : scores;
        const nextTurn = isMatch ? userId : (String(userId) === String(player1?.id) ? player2?.id : player1?.id);
        const done = newMatched.length === cards.length;

        onSendGameMessage({
          ...gameData,
          flipped: [],
          matched: newMatched,
          scores: newScores,
          turnPlayerId: nextTurn,
          status: done ? 'finished' : 'active',
          winnerId: done ? (
            (newScores[player1?.id] > newScores[player2?.id]) ? player1?.id :
            (newScores[player2?.id] > newScores[player1?.id] ? player2?.id : 'draw')
          ) : undefined,
          lastMatchResult: isMatch ? 'match' : 'no-match'
        });
      }, 1100);
    } else {
      // Stream first flipped card immediately to opponent
      onSendGameMessage({ ...gameData, flipped: newFlipped });
    }
  };

  const isFlipped = (idx) => previewing || localFlipped.includes(idx) || matched.includes(idx);

  const getStatusText = () => {
    if (status === 'finished') {
      const w = gameData.winnerId;
      if (w === 'draw') return "It's a Draw! 🤝";
      return w === userId ? "You Won! 🏆" : `${opponentName} Won! 👑`;
    }
    if (previewing) {
      return `👀 Memorize the cards: ${previewCountdown}s`;
    }
    return isMyTurn ? "Your Turn — flip a card!" : `${opponentName}'s turn...`;
  };

  const getStatusColor = () => {
    if (status === 'finished') return '#ff9800';
    if (previewing) return '#a855f7';
    return isMyTurn ? '#4caf50' : 'text.secondary';
  };

  const p1Color = '#ef4444';
  const p2Color = '#06b6d4';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1, width: '100%', maxWidth: 300, boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1 }}>
        <Typography variant="caption" sx={{ color: p1Color, fontWeight: 700 }}>
          {player1?.username}: {p1Score} 🃏
        </Typography>
        <Typography variant="caption" sx={{ color: p2Color, fontWeight: 700 }}>
          {player2?.username}: {p2Score} 🃏
        </Typography>
      </Box>

      <Typography variant="caption" sx={{
        fontWeight: 700,
        color: getStatusColor(),
        letterSpacing: previewing ? 0.3 : 0,
        transition: 'color 0.2s'
      }}>
        {getStatusText()}
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0.8,
        width: '100%'
      }}>
        {cards.map((card, idx) => {
          const faceUp = isFlipped(idx);
          const isMatched = matched.includes(idx);
          return (
            <Box
              key={idx}
              onClick={() => handleCardClick(idx)}
              sx={{
                aspectRatio: '1/1',
                borderRadius: '8px',
                cursor: !previewing && isMyTurn && !faceUp && !waiting ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 700,
                bgcolor: isMatched
                  ? (isDarkTheme ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)')
                  : (faceUp
                    ? (previewing
                      ? (isDarkTheme ? '#311042' : '#f3e8ff')
                      : (isDarkTheme ? '#1e3a5f' : '#dbeafe'))
                    : (isDarkTheme ? '#1e293b' : '#e2e8f0')),
                border: isMatched
                  ? '1.5px solid rgba(34,197,94,0.5)'
                  : (faceUp
                    ? (previewing ? '1.5px solid #a855f7' : '1.5px solid #3b82f6')
                    : `1.5px solid ${isDarkTheme ? '#334155' : '#cbd5e1'}`),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: faceUp ? 'scale(1.04)' : 'scale(1)',
                '&:hover': !previewing && isMyTurn && !faceUp && !waiting ? {
                  transform: 'scale(1.08)',
                  borderColor: '#8b5cf6'
                } : {}
              }}
            >
              {faceUp ? card.emoji : '❓'}
            </Box>
          );
        })}
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {matched.length / 2}/{totalPairs} pairs found
      </Typography>
    </Box>
  );
};

export const memoryGameInitialData = (player1, player2) => ({
  gameType: 'memorygame',
  status: 'invited',
  player1,
  player2,
  cards: shuffleCards(),
  flipped: [],
  matched: [],
  scores: { [player1.id]: 0, [player2.id]: 0 },
  turnPlayerId: player1.id
});
