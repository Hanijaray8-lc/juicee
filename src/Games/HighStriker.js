import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';

// High Striker Game - 2 Player
// Each player presses STOP to try to hit the top of a rising bar as close to 100% as possible
// Best of 3 rounds; closest to 100 wins the round

const TOTAL_ROUNDS = 3;

// Speed in % per second (time-based, same on all refresh rates)
const BASE_SPEED = 320;      // round 1
const SPEED_PER_ROUND = 90;  // extra speed each round
const getSpeed = (round) => BASE_SPEED + round * SPEED_PER_ROUND;

const BarMeter = ({ isMyTurn, onStop, disabled, speed = BASE_SPEED }) => {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(null);
  const levelRef = useRef(0);
  const dirRef = useRef(1);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!isMyTurn || disabled) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    // Random start so the timing can't be memorised
    levelRef.current = Math.random() * 100;
    dirRef.current = Math.random() < 0.5 ? 1 : -1;
    lastTimeRef.current = 0;
    setLevel(Math.round(levelRef.current));

    const animate = (now) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      // clamp dt so a lag spike / tab switch doesn't jump the bar
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      levelRef.current += speed * dirRef.current * dt;
      if (levelRef.current >= 100) {
        levelRef.current = 100 - (levelRef.current - 100);
        dirRef.current = -1;
      }
      if (levelRef.current <= 0) {
        levelRef.current = -levelRef.current;
        dirRef.current = 1;
      }
      levelRef.current = Math.max(0, Math.min(100, levelRef.current));
      setLevel(Math.round(levelRef.current));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isMyTurn, disabled, speed]);

  const handleStop = () => {
    if (!isMyTurn || disabled) return;
    cancelAnimationFrame(rafRef.current);
    onStop(Math.round(levelRef.current));
  };

  const getBarColor = (pct) => {
    if (pct >= 90) return '#22c55e';
    if (pct >= 70) return '#eab308';
    if (pct >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 40,
        height: 150,
        bgcolor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        border: '1.5px solid rgba(255,255,255,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Target zone */}
        <Box sx={{
          position: 'absolute',
          bottom: '85%',
          width: '100%',
          height: '15%',
          bgcolor: 'rgba(34,197,94,0.25)',
          borderTop: '2px solid #22c55e'
        }} />
        {/* Rising bar */}
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: `${level}%`,
          bgcolor: getBarColor(level),
          borderRadius: '0 0 4px 4px'
        }} />
        {/* Level text */}
        <Typography sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 11,
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          zIndex: 2
        }}>
          {level}%
        </Typography>
      </Box>
      {isMyTurn && !disabled && (
        <Button
          variant="contained"
          onClick={handleStop}
          sx={{
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            color: '#fff',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: 12,
            px: 2, py: 0.5,
            minWidth: 'auto'
          }}
        >
          STOP!
        </Button>
      )}
    </Box>
  );
};

export const HighStrikerGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1, player2, turnPlayerId,
    rounds = [],        // array of { p1Score, p2Score } per round
    currentRound = 0,
    p1RoundWins = 0,
    p2RoundWins = 0,
    phase = 'p1',       // 'p1' | 'p2' | 'result'
    p1Hit = null,
    p2Hit = null,
    status
  } = gameData;

  const isP1 = userId === player1?.id;
  const isP2 = userId === player2?.id;
  const isMyTurn = (status === 'active' || (isP1 && phase === 'p1') || (isP2 && (phase === 'p2' || phase === 'p2_challenge'))) && (turnPlayerId === userId || (!turnPlayerId && isP1));
  const opponentName = isP1 ? player2?.username : player1?.username;
  const myName = isP1 ? player1?.username : player2?.username;
  const barSpeed = getSpeed(currentRound);

  const handleStop = (score) => {
    if (!isMyTurn) return;

    if (phase === 'p1') {
      // P1 hit -> send challenge to P2 with P1 score
      onSendGameMessage({
        ...gameData,
        status: 'invited',
        phase: 'p2_challenge',
        p1Score: score,
        p1Hit: score,
        p1RoundWins: score,
        p2Score: null,
        p2Hit: null,
        turnPlayerId: player2?.id,
        challengerId: player1?.id
      });
    } else if (phase === 'p2' || phase === 'p2_challenge') {
      // P2 hit -> calculate winner and finish match
      const p1S = gameData?.p1Score ?? gameData?.p1Hit ?? p1Hit ?? 0;
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
        p1Hit: p1S,
        p2Hit: p2S,
        p1RoundWins: p1S,
        p2RoundWins: p2S,
        winnerId: overallWinner,
        turnPlayerId: null
      });
    }
  };

  const handleNextRound = () => {
    onSendGameMessage({
      ...gameData,
      phase: 'p1',
      p1Hit: null,
      p2Hit: null,
      turnPlayerId: player1?.id
    });
  };

  const getStatusText = () => {
    if (status === 'finished') {
      const w = gameData.winnerId;
      if (w === 'draw') return "It's a Draw! 🤝";
      return w === userId ? "You Won! 🏆" : `${opponentName} Won! 👑`;
    }
    if (phase === 'result') return `Round ${currentRound} done!`;
    if (phase === 'p1') return isP1 && isMyTurn ? "Your turn! Press STOP at the peak!" : `${player1?.username}'s turn...`;
    if (phase === 'p2' || phase === 'p2_challenge') {
      const target = gameData?.p1Score ?? gameData?.p1Hit ?? 0;
      return isP2 && isMyTurn ? `Target to beat: ${target}%! Press STOP at the peak!` : `${player2?.username}'s turn...`;
    }
    return '';
  };

  const canGoNext = phase === 'result' && status === 'active' && isP1; // P1 advances round

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 1, width: '100%', maxWidth: 300, boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1 }}>
        <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700 }}>
          {player1?.username}: {p1RoundWins}W
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Round {Math.min(currentRound + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
        </Typography>
        <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 700 }}>
          {player2?.username}: {p2RoundWins}W
        </Typography>
      </Box>

      <Typography variant="caption" sx={{
        fontWeight: 600,
        color: status === 'finished' ? '#ff9800' : (isMyTurn ? '#4caf50' : 'text.secondary'),
        textAlign: 'center'
      }}>
        {getStatusText()}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, fontSize: 10 }}>
            {player1?.username}
          </Typography>
          {phase === 'result' || status === 'finished' ? (
            <Box sx={{
              width: 40, height: 150,
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: 2, border: '1.5px solid rgba(255,255,255,0.1)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Box sx={{
                position: 'absolute', bottom: 0, width: '100%',
                height: `${p1Hit || 0}%`,
                bgcolor: p1Hit >= 85 ? '#22c55e' : p1Hit >= 60 ? '#eab308' : '#ef4444',
                borderRadius: '0 0 4px 4px'
              }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', zIndex: 2, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {p1Hit}%
              </Typography>
            </Box>
          ) : (
            <BarMeter
              isMyTurn={isP1 && isMyTurn && phase === 'p1'}
              onStop={handleStop}
              disabled={phase !== 'p1' || !isP1}
              speed={barSpeed}
            />
          )}
        </Box>

        {/* Striker icon */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 1 }}>
          <Typography sx={{ fontSize: 24 }}>🔔</Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>GOAL</Typography>
          <Typography sx={{ fontSize: 9, color: 'rgba(34,197,94,0.7)' }}>85%+</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 600, fontSize: 10 }}>
            {player2?.username}
          </Typography>
          {phase === 'result' || status === 'finished' ? (
            <Box sx={{
              width: 40, height: 150,
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: 2, border: '1.5px solid rgba(255,255,255,0.1)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Box sx={{
                position: 'absolute', bottom: 0, width: '100%',
                height: `${p2Hit || 0}%`,
                bgcolor: p2Hit >= 85 ? '#22c55e' : p2Hit >= 60 ? '#eab308' : '#06b6d4',
                borderRadius: '0 0 4px 4px'
              }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', zIndex: 2, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {p2Hit !== null ? `${p2Hit}%` : '?'}
              </Typography>
            </Box>
          ) : (
            <BarMeter
              isMyTurn={!isP1 && isMyTurn && (phase === 'p2' || phase === 'p2_challenge')}
              onStop={handleStop}
              disabled={(phase !== 'p2' && phase !== 'p2_challenge') || isP1}
              speed={barSpeed}
            />
          )}
        </Box>
      </Box>

      {phase === 'result' && rounds.length > 0 && (
        <Box sx={{ textAlign: 'center' }}>
          {(() => {
            const last = rounds[rounds.length - 1];
            const p1Won = last.p1Score > last.p2Score;
            const p2Won = last.p2Score > last.p1Score;
            return (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {p1Won ? `${player1?.username} wins round! (${last.p1Score} vs ${last.p2Score})` :
                 p2Won ? `${player2?.username} wins round! (${last.p2Score} vs ${last.p1Score})` :
                 `Tie round! (${last.p1Score} vs ${last.p2Score})`}
              </Typography>
            );
          })()}
        </Box>
      )}

      {canGoNext && status === 'active' && (
        <Button
          size="small"
          variant="contained"
          onClick={handleNextRound}
          sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, color: '#fff', textTransform: 'none' }}
        >
          Next Round ▶
        </Button>
      )}
    </Box>
  );
};

export const highStrikerInitialData = (player1, player2) => ({
  gameType: 'highstriker',
  status: 'active',
  player1,
  player2,
  rounds: [],
  currentRound: 0,
  p1RoundWins: 0,
  p2RoundWins: 0,
  phase: 'p1',
  p1Hit: null,
  p2Hit: null,
  p1Score: null,
  p2Score: null,
  turnPlayerId: player1?.id,
  challengerId: player1?.id
});