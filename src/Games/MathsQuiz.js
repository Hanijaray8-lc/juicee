import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';

// Maths Quiz - 2 Player
// Each round, both players see the same math question
// First to answer correctly wins the round (buzzed-in style, but turn-based for async)
// Best of 3 rounds wins
// ⏱ 8-second timer per question — auto-submits timeout if time runs out

const TOTAL_ROUNDS = 3;
const QUESTION_TIME = 8; // seconds per question
const TIMEOUT_SENTINEL = '__timeout__';

export function generateQuestion() {
  // Harder difficulty: larger ranges, division, two-step expressions
  const type = Math.floor(Math.random() * 6);
  let question, answer;

  if (type === 0) {
    // Addition: 50–999
    const a = Math.floor(Math.random() * 450) + 50;
    const b = Math.floor(Math.random() * 450) + 50;
    question = `${a} + ${b} = ?`;
    answer = a + b;
  } else if (type === 1) {
    // Subtraction: result always positive, larger numbers
    const a = Math.floor(Math.random() * 400) + 100;
    const b = Math.floor(Math.random() * (a - 1)) + 1;
    question = `${a} - ${b} = ?`;
    answer = a - b;
  } else if (type === 2) {
    // Multiplication: 12–25 range (tricky!)
    const a = Math.floor(Math.random() * 14) + 12;
    const b = Math.floor(Math.random() * 14) + 12;
    question = `${a} × ${b} = ?`;
    answer = a * b;
  } else if (type === 3) {
    // Division: exact integer results, divisors 7–15
    const b = Math.floor(Math.random() * 9) + 7;
    const a = b * (Math.floor(Math.random() * 12) + 3);
    question = `${a} ÷ ${b} = ?`;
    answer = a / b;
  } else if (type === 4) {
    // Two-step: a + b × c  (BODMAS trap)
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 12) + 2;
    const c = Math.floor(Math.random() * 12) + 2;
    question = `${a} + ${b} × ${c} = ?`;
    answer = a + b * c;
  } else {
    // Two-step: a × b - c
    const a = Math.floor(Math.random() * 15) + 5;
    const b = Math.floor(Math.random() * 15) + 5;
    const c = Math.floor(Math.random() * 30) + 5;
    question = `${a} × ${b} - ${c} = ?`;
    answer = a * b - c;
  }

  // Generate 3 plausible wrong answers (close offsets)
  const offsets = [-17, -13, -11, -7, -5, -3, 3, 5, 7, 11, 13, 17, 19, 23];
  const wrong = new Set([answer]);
  let attempts = 0;
  while (wrong.size < 4 && attempts < 60) {
    attempts++;
    const off = offsets[Math.floor(Math.random() * offsets.length)];
    const candidate = answer + off;
    if (candidate > 0) wrong.add(candidate);
  }
  let extra = answer + 2;
  while (wrong.size < 4) { wrong.add(extra); extra += 1; }

  const choices = [...wrong].sort(() => Math.random() - 0.5);
  return { question, answer, choices };
}

export const MathsQuizGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1, player2,
    currentQuestion = null,
    roundNum = 0,
    p1Score = 0,
    p2Score = 0,
    phase = 'waiting',
    p1Answer = null,
    p2Answer = null,
    questionStartedAt = null,
    status
  } = gameData;

  // Always keep a ref to the latest gameData so async callbacks never read stale closures
  const gameDataRef = useRef(gameData);
  useEffect(() => { gameDataRef.current = gameData; });

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);

  const isP1 = String(userId) === String(player1?.id);
  const opponentName = isP1 ? player2?.username : player1?.username;
  const myAnswer = isP1 ? p1Answer : p2Answer;
  const oppAnswer = isP1 ? p2Answer : p1Answer;
  const myAnswered = myAnswer !== null;
  const oppAnswered = oppAnswer !== null;
  const p1Color = '#ef4444';
  const p2Color = '#06b6d4';

  const currentP1Score = Number(gameData?.p1Score ?? gameData?.scores?.[player1?.id] ?? p1Score ?? 0);
  const currentP2Score = Number(gameData?.p2Score ?? gameData?.scores?.[player2?.id] ?? p2Score ?? 0);

  // ── Auto-advance to next question upon result ──────────────────────────
  useEffect(() => {
    if (phase === 'result' && status === 'active' && isP1) {
      const autoTimer = setTimeout(() => {
        const nextQ = generateQuestion();
        const gd = gameDataRef.current || gameData;
        onSendGameMessage({
          ...gd,
          currentQuestion: nextQ,
          phase: 'answering',
          p1Answer: null,
          p2Answer: null,
          questionStartedAt: Date.now(),
          turnPlayerId: player1?.id
        });
      }, 2500);
      return () => clearTimeout(autoTimer);
    }
  }, [phase, status, isP1, player1?.id, onSendGameMessage]);

  // ── Auto-start if stuck in waiting state ───────────────────────────────
  useEffect(() => {
    if (phase === 'waiting' && status === 'active' && isP1) {
      const startTimer = setTimeout(() => {
        const nextQ = generateQuestion();
        const gd = gameDataRef.current || gameData;
        onSendGameMessage({
          ...gd,
          currentQuestion: nextQ,
          phase: 'answering',
          p1Answer: null,
          p2Answer: null,
          questionStartedAt: Date.now(),
          turnPlayerId: player1?.id
        });
      }, 400);
      return () => clearTimeout(startTimer);
    }
  }, [phase, status, isP1, player1?.id, onSendGameMessage]);

  // ── Timer logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current);
    hasAutoSubmittedRef.current = false;

    // Only run countdown when game is ACTIVE (not when waiting for challenger to accept)
    if (status === 'active' && phase === 'answering' && !myAnswered && questionStartedAt) {
      const tick = () => {
        const elapsed = Math.floor((Date.now() - questionStartedAt) / 1000);
        const remaining = Math.max(0, QUESTION_TIME - elapsed);
        setTimeLeft(remaining);
        if (remaining <= 0 && !hasAutoSubmittedRef.current) {
          hasAutoSubmittedRef.current = true;
          clearInterval(timerRef.current);
          handleAutoTimeout();
        }
      };
      timerRef.current = setInterval(tick, 200);
      tick();
    } else {
      setTimeLeft(phase === 'answering' && myAnswered ? 0 : QUESTION_TIME);
    }

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, myAnswered, questionStartedAt, status]);

  const handleAutoTimeout = () => {
    // Read from ref to always get fresh gameData (avoids stale closure bug)
    const gd = gameDataRef.current || gameData;
    const {
      p1Answer: latestP1Answer, p2Answer: latestP2Answer,
      currentQuestion: latestQuestion,
      player1: gP1, player2: gP2
    } = gd;

    const latestP1Score = Number(gd.p1Score ?? gd.scores?.[gP1?.id] ?? 0);
    const latestP2Score = Number(gd.p2Score ?? gd.scores?.[gP2?.id] ?? 0);
    const latestRoundNum = Number(gd.roundNum ?? 0);

    const newP1Answer = isP1 ? TIMEOUT_SENTINEL : (latestP1Answer ?? null);
    const newP2Answer = !isP1 ? TIMEOUT_SENTINEL : (latestP2Answer ?? null);
    const bothAnswered = newP1Answer !== null && newP2Answer !== null;

    let newP1Score = latestP1Score;
    let newP2Score = latestP2Score;
    let newRound = latestRoundNum;
    let newPhase = gd.phase;
    let newStatus = gd.status;
    let winnerId = gd.winnerId;

    const targetQ = latestQuestion || currentQuestion;

    if (bothAnswered) {
      const p1Correct = newP1Answer !== TIMEOUT_SENTINEL && Number(newP1Answer) === Number(targetQ?.answer);
      const p2Correct = newP2Answer !== TIMEOUT_SENTINEL && Number(newP2Answer) === Number(targetQ?.answer);

      // Award +1 pt to any player who answered correctly
      if (p1Correct) newP1Score += 1;
      if (p2Correct) newP2Score += 1;

      newRound += 1;
      const isDone = newRound >= TOTAL_ROUNDS;
      newPhase = isDone ? 'done' : 'result';
      if (isDone) {
        newStatus = 'finished';
        winnerId = newP1Score > newP2Score ? gP1?.id : (newP2Score > newP1Score ? gP2?.id : 'draw');
      }
    }

    onSendGameMessage({
      ...gd,
      p1Answer: newP1Answer,
      p2Answer: newP2Answer,
      p1Score: newP1Score,
      p2Score: newP2Score,
      scores: {
        [gP1?.id]: newP1Score,
        [gP2?.id]: newP2Score
      },
      p1TotalScore: newP1Score,
      p2TotalScore: newP2Score,
      p1FinalScore: newP1Score,
      p2FinalScore: newP2Score,
      roundNum: newRound,
      phase: bothAnswered ? newPhase : 'answering',
      status: newStatus,
      winnerId,
      turnPlayerId: isP1 ? gP1?.id : gP2?.id
    });
  };

  const handleStartRound = () => {
    if (!isP1) return;
    const q = generateQuestion();
    const gd = gameDataRef.current || gameData;
    onSendGameMessage({
      ...gd,
      currentQuestion: q,
      phase: 'answering',
      p1Answer: null,
      p2Answer: null,
      questionStartedAt: Date.now(),
      turnPlayerId: userId
    });
  };

  const handleAnswer = (choice) => {
    const gd = gameDataRef.current || gameData;
    if (gd.phase !== 'answering' || myAnswered) return;

    const gP1 = gd.player1 || player1;
    const gP2 = gd.player2 || player2;

    const latestP1Score = Number(gd.p1Score ?? gd.scores?.[gP1?.id] ?? 0);
    const latestP2Score = Number(gd.p2Score ?? gd.scores?.[gP2?.id] ?? 0);
    const latestRoundNum = Number(gd.roundNum ?? 0);

    const newP1Answer = isP1 ? choice : (gd.p1Answer ?? null);
    const newP2Answer = !isP1 ? choice : (gd.p2Answer ?? null);
    const bothAnswered = newP1Answer !== null && newP2Answer !== null;

    let newP1Score = latestP1Score;
    let newP2Score = latestP2Score;
    let newRound = latestRoundNum;
    let newPhase = gd.phase;
    let newStatus = gd.status;
    let winnerId = gd.winnerId;

    const targetQ = gd.currentQuestion || currentQuestion;

    if (bothAnswered) {
      const p1Correct = newP1Answer !== TIMEOUT_SENTINEL && Number(newP1Answer) === Number(targetQ?.answer);
      const p2Correct = newP2Answer !== TIMEOUT_SENTINEL && Number(newP2Answer) === Number(targetQ?.answer);

      // Award +1 pt to any player who answered correctly
      if (p1Correct) newP1Score += 1;
      if (p2Correct) newP2Score += 1;

      newRound += 1;
      const isDone = newRound >= TOTAL_ROUNDS;
      newPhase = isDone ? 'done' : 'result';
      if (isDone) {
        newStatus = 'finished';
        winnerId = newP1Score > newP2Score ? gP1?.id : (newP2Score > newP1Score ? gP2?.id : 'draw');
      }
    }

    onSendGameMessage({
      ...gd,
      p1Answer: newP1Answer,
      p2Answer: newP2Answer,
      p1Score: newP1Score,
      p2Score: newP2Score,
      scores: {
        [gP1?.id]: newP1Score,
        [gP2?.id]: newP2Score
      },
      p1TotalScore: newP1Score,
      p2TotalScore: newP2Score,
      p1FinalScore: newP1Score,
      p2FinalScore: newP2Score,
      roundNum: newRound,
      phase: bothAnswered ? newPhase : 'answering',
      status: newStatus,
      winnerId,
      turnPlayerId: isP1 ? gP1?.id : gP2?.id
    });
  };

  const handleNextRound = () => {
    if (!isP1) return;
    const gd = gameDataRef.current || gameData;
    onSendGameMessage({
      ...gd,
      phase: 'waiting',
      p1Answer: null,
      p2Answer: null,
      currentQuestion: null,
      questionStartedAt: null,
      turnPlayerId: player1?.id
    });
  };

  const getStatusText = () => {
    if (status === 'finished') {
      const gd = gameDataRef.current || gameData;
      const w = gd.winnerId || gameData.winnerId;
      if (w === 'draw') return "It's a Draw! 🤝";
      return String(w) === String(userId) ? 'You Won! 🏆' : `${opponentName} Won! 👑`;
    }
    if (phase === 'waiting') return isP1 ? 'Press "New Question" to start!' : 'Waiting for question...';
    if (phase === 'answering') {
      if (myAnswered) return 'Answer locked! Waiting for opponent...';
      return '⚡ Quick! Pick the correct answer!';
    }
    if (phase === 'result') {
      const targetQ = currentQuestion || gameDataRef.current?.currentQuestion;
      const p1C = p1Answer !== TIMEOUT_SENTINEL && Number(p1Answer) === Number(targetQ?.answer);
      const p2C = p2Answer !== TIMEOUT_SENTINEL && Number(p2Answer) === Number(targetQ?.answer);
      if (p1C && !p2C) return `${player1?.username} scored! ✅ (+1 pt)`;
      if (p2C && !p1C) return `${player2?.username} scored! ✅ (+1 pt)`;
      if (p1C && p2C) return 'Both answered correctly! +1 pt each 🌟';
      return 'Both wrong! No point 😅';
    }
    return '';
  };

  const getChoiceStyle = (choice) => {
    const inResult = phase === 'result';
    const isCorrect = currentQuestion && choice === currentQuestion.answer;
    const wasMyChoice = choice === myAnswer && myAnswer !== TIMEOUT_SENTINEL;

    if (inResult) {
      if (isCorrect) return { bgcolor: 'rgba(34,197,94,0.3)', border: '1.5px solid #22c55e' };
      if (wasMyChoice && !isCorrect) return { bgcolor: 'rgba(239,68,68,0.2)', border: '1.5px solid #ef4444' };
    }
    if (wasMyChoice && myAnswered) return { bgcolor: 'rgba(139,92,246,0.3)', border: '1.5px solid #8b5cf6' };
    return {
      bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      border: `1.5px solid ${isDarkTheme ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      '&:hover': (!myAnswered && phase === 'answering') ? {
        bgcolor: 'rgba(139,92,246,0.15)',
        border: '1.5px solid #8b5cf6',
        transform: 'scale(1.02)'
      } : {}
    };
  };

  // Timer ring colour: green → orange → red
  const timerColor = timeLeft >= 4 ? '#22c55e' : timeLeft >= 2 ? '#f97316' : '#ef4444';
  const timerPercent = (timeLeft / QUESTION_TIME) * 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 1, width: '100%', maxWidth: 300, boxSizing: 'border-box' }}>
      {/* Scoreboard */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 1 }}>
        <Typography variant="caption" sx={{ color: p1Color, fontWeight: 700 }}>
          {player1?.username}: {currentP1Score}pt
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
          Round {Math.min(roundNum + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
        </Typography>
        <Typography variant="caption" sx={{ color: p2Color, fontWeight: 700 }}>
          {player2?.username}: {currentP2Score}pt
        </Typography>
      </Box>

      {/* Status text */}
      <Typography variant="caption" sx={{
        fontWeight: 600, textAlign: 'center',
        color: status === 'finished' ? '#ff9800' : ((phase === 'answering' && !myAnswered) ? '#4caf50' : 'text.secondary')
      }}>
        {getStatusText()}
      </Typography>

      {/* ⏱ Timer ring — only shown while answering and not yet answered */}
      {phase === 'answering' && !myAnswered && (
        <Box sx={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="26" cy="26" r="22" fill="none"
              stroke={isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
              strokeWidth="4" />
            <circle
              cx="26" cy="26" r="22" fill="none"
              stroke={timerColor}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - timerPercent / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s' }}
            />
          </svg>
          <Typography sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontWeight: 800, fontSize: '1.1rem', color: timerColor, lineHeight: 1
          }}>
            {timeLeft}
          </Typography>
        </Box>
      )}

      {/* Question */}
      {currentQuestion && (
        <Box sx={{
          bgcolor: isDarkTheme ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)',
          border: '1.5px solid rgba(139,92,246,0.3)',
          borderRadius: 2, p: 1.5, width: '100%', textAlign: 'center'
        }}>
          <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: 1, color: isDarkTheme ? '#c4b5fd' : '#7c3aed' }}>
            {currentQuestion.question}
          </Typography>
        </Box>
      )}

      {/* Choices */}
      {currentQuestion && (phase === 'answering' || phase === 'result') && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, width: '100%' }}>
          {currentQuestion.choices.map((choice, i) => (
            <Box
              key={i}
              onClick={() => !myAnswered && phase === 'answering' && handleAnswer(choice)}
              sx={{
                p: 1, borderRadius: 1.5,
                cursor: !myAnswered && phase === 'answering' ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                ...getChoiceStyle(choice)
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{choice}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Result answer display */}
      {phase === 'result' && currentQuestion && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {player1?.username}: {p1Answer === TIMEOUT_SENTINEL ? '⏱ Timeout' : p1Answer} {p1Answer !== TIMEOUT_SENTINEL && p1Answer === currentQuestion.answer ? '✅' : '❌'} &nbsp;|&nbsp;
            {player2?.username}: {p2Answer === TIMEOUT_SENTINEL ? '⏱ Timeout' : p2Answer} {p2Answer !== TIMEOUT_SENTINEL && p2Answer === currentQuestion.answer ? '✅' : '❌'}
          </Typography>
        </Box>
      )}

      {/* Controls */}
      {phase === 'result' && status === 'active' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#00f2fe', fontWeight: 700, animation: 'pulse 1s infinite' }}>
            ⚡ Next question starting automatically in 2s...
          </Typography>
          <Button
            size="small"
            variant="contained"
            onClick={handleStartRound}
            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, color: '#fff', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Next Round ▶
          </Button>
        </Box>
      )}
    </Box>
  );
};

export const mathsQuizInitialData = (player1, player2) => ({
  gameType: 'mathsquiz',
  status: 'invited',
  player1,
  player2,
  currentQuestion: generateQuestion(),
  roundNum: 0,
  p1Score: 0,
  p2Score: 0,
  scores: {
    [player1?.id]: 0,
    [player2?.id]: 0
  },
  p1TotalScore: 0,
  p2TotalScore: 0,
  p1FinalScore: 0,
  p2FinalScore: 0,
  phase: 'answering',
  p1Answer: null,
  p2Answer: null,
  questionStartedAt: Date.now(),
  turnPlayerId: player1?.id
});
