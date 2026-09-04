import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Grid, Button, Typography,
  Paper, IconButton, TextField, Card, CardContent, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Curated questions for Truth or Dare
const TRUTHS = [
  "What is your biggest fear in a relationship?",
  "Have you ever kept a major secret from your best friend?",
  "What is the most embarrassing thing you've done in public?",
  "What was your honest first impression of me?",
  "If you could change one thing about yourself, what would it be?",
  "What is the biggest lie you've ever told?",
  "Who is your secret crush right now?",
  "What is the worst date you've ever been on?",
  "What is one thing you would do if you could be invisible for a day?"
];

const DARES = [
  "Send a funny or silly selfie to me right now! 📸",
  "Sing 15 seconds of a song and send a voice message! 🎤",
  "Write a funny message and send it to a random contact.",
  "Tell an embarrassing story about yourself in detail.",
  "Text your crush and tell them they are cute.",
  "Whisper a secret in a voice message.",
  "Do 10 pushups and send a photo/text confirmation!",
  "Type a paragraph with your nose and send it in chat."
];

// Helper to check Tic Tac Toe winner
const checkWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every(cell => cell !== null)) {
    return 'draw';
  }
  return null;
};

// ----------------------------------------------------
// 1. GAME SELECTOR DIALOG
// ----------------------------------------------------
export const GameSelectorDialog = ({ open, onClose, onSelectGame }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{
      sx: {
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1b4e 100%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 3,
        color: '#fff'
      }
    }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box component="span" sx={{
          fontWeight: 700,
          fontSize: '1.25rem',
          background: 'linear-gradient(90deg, #ff8a00, #e52e71)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Play a Game 🎮
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Tic Tac Toe */}
        <Card onClick={() => onSelectGame('tictactoe')} sx={{
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(229, 46, 113, 0.3)',
            borderColor: '#e52e71'
          }
        }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ fontSize: 32 }}>❌⭕</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>Tic Tac Toe (X O)</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Get three in a row to win!</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Truth or Dare */}
        <Card onClick={() => onSelectGame('truthordare')} sx={{
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0, 242, 254, 0.3)',
            borderColor: '#00f2fe'
          }
        }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ fontSize: 32 }}>📜⚡</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>Truth or Dare</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Fun questions and daring challenges!</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Rock Paper Scissors */}
        <Card onClick={() => onSelectGame('rps')} sx={{
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(62, 184, 229, 0.3)',
            borderColor: '#3eb8e5'
          }
        }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ fontSize: 32 }}>✊✋✌️</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>Rock Paper Scissors</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Settle it quickly with rock, paper, scissors!</Typography>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

// ----------------------------------------------------
// 2. TIC TAC TOE COMPONENT
// ----------------------------------------------------
const TicTacToeGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const { board, turn, turnPlayerId, status, player1, player2 } = gameData;
  const isMyTurn = status === 'active' && turnPlayerId === userId;

  const handleCellClick = (idx) => {
    if (!isMyTurn || board[idx] !== null) return;

    const newBoard = [...board];
    const mySymbol = userId === player1.id ? 'X' : 'O';
    newBoard[idx] = mySymbol;

    const winner = checkWinner(newBoard);
    const nextGameData = { ...gameData };

    if (winner) {
      nextGameData.status = 'finished';
      nextGameData.board = newBoard;
      nextGameData.winnerSymbol = winner;
      nextGameData.winnerId = winner === 'draw' ? 'draw' : (winner === 'X' ? player1.id : player2.id);
    } else {
      nextGameData.board = newBoard;
      nextGameData.turn = turn === 'X' ? 'O' : 'X';
      nextGameData.turnPlayerId = userId === player1.id ? player2.id : player1.id;
    }

    onSendGameMessage(nextGameData);
  };

  const getStatusText = () => {
    if (status === 'finished') {
      if (gameData.winnerId === 'draw') return "It's a draw! 🤝";
      return gameData.winnerId === userId ? "You won! 🏆🎉" : `${userId === player1.id ? player2.username : player1.username} won! 👑`;
    }
    return isMyTurn ? "Your Turn (Click a cell)" : `Waiting for ${userId === player1.id ? player2.username : player1.username}...`;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 280, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
      <Typography variant="subtitle2" sx={{
        fontWeight: 'bold',
        mb: 1.5,
        color: status === 'finished' ? '#ff9800' : (isMyTurn ? '#4caf50' : 'text.secondary')
      }}>
        {getStatusText()}
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
        width: '100%',
        maxWidth: 220,
        aspectRatio: '1/1',
        boxSizing: 'border-box'
      }}>
        {board.map((cell, idx) => (
          <Box
            key={idx}
            onClick={() => handleCellClick(idx)}
            sx={{
              width: '100%',
              aspectRatio: '1/1',
              borderRadius: '8px',
              bgcolor: isDarkTheme ? '#1e293b' : '#f1f5f9',
              border: '1.5px solid',
              borderColor: isDarkTheme ? '#334155' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isMyTurn && cell === null ? 'pointer' : 'default',
              transition: 'all 0.15s',
              '&:hover': isMyTurn && cell === null ? {
                bgcolor: isDarkTheme ? '#334155' : '#e2e8f0',
                transform: 'scale(1.05)'
              } : {},
              '&:active': isMyTurn && cell === null ? { transform: 'scale(0.95)' } : {}
            }}
          >
            <Typography sx={{
              fontSize: 'min(8vw, 2.2rem)',
              fontWeight: 'bold',
              lineHeight: 1,
              color: cell === 'X' ? '#ef4444' : '#06b6d4',
              textShadow: cell ? `0 0 8px ${cell === 'X' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)'}` : 'none'
            }}>
              {cell}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 2, px: 2 }}>
        <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>
          X: {player1.username}
        </Typography>
        <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 600 }}>
          O: {player2.username}
        </Typography>
      </Box>
    </Box>
  );
};

// ----------------------------------------------------
// 3. TRUTH OR DARE COMPONENT
// ----------------------------------------------------
const TruthOrDareGame = ({ gameData, userId, username, onSendGameMessage, isDarkTheme }) => {
  const { player1, player2, turnPlayerId, selectedCategory, prompt, answered, answer, lastRound, status } = gameData;
  const isMyTurn = turnPlayerId === userId;
  const [typedAnswer, setTypedAnswer] = useState('');
  const [customDare, setCustomDare] = useState('');
  const opponentName = userId === player1.id ? player2.username : player1.username;

  const handleChoose = (category) => {
    if (!isMyTurn) return;

    if (category === 'truth') {
      const list = TRUTHS;
      const selectedPrompt = list[Math.floor(Math.random() * list.length)];
      onSendGameMessage({
        ...gameData,
        selectedCategory: 'truth',
        prompt: selectedPrompt,
        answered: false,
        answer: ''
      });
    } else {
      // For Dare, set placeholder to await custom input from opponent
      onSendGameMessage({
        ...gameData,
        selectedCategory: 'dare',
        prompt: '__AWAITING_CUSTOM_DARE__',
        answered: false,
        answer: ''
      });
    }
  };

  const handleSubmitAnswer = () => {
    if (!typedAnswer.trim()) return;
    onSendGameMessage({
      ...gameData,
      answered: true,
      answer: typedAnswer.trim(),
      lastRound: {
        player: username,
        category: selectedCategory,
        prompt: prompt,
        answer: typedAnswer.trim()
      },
      selectedCategory: null,
      prompt: null,
      turnPlayerId: userId === player1.id ? player2.id : player1.id
    });
    setTypedAnswer('');
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: { xs: 220, sm: 260 },
      p: { xs: 0.5, sm: 1 },
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      boxSizing: 'border-box'
    }}>
      {/* Last Round History Banner */}
      {lastRound && (
        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: isDarkTheme ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          borderLeft: '3px solid #ff9800',
          fontSize: '0.8rem'
        }}>
          <Typography variant="caption" fontWeight="bold" sx={{ color: '#ff9800', display: 'block', wordBreak: 'break-word' }}>
            Last Turn: {lastRound.player} ({lastRound.category.toUpperCase()})
          </Typography>
          <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 0.5, wordBreak: 'break-word' }}>
            "{lastRound.prompt}"
          </Typography>
          <Typography variant="caption" fontWeight={600} sx={{ display: 'block', wordBreak: 'break-word' }}>
            Answer: {lastRound.answer}
          </Typography>
        </Box>
      )}

      {/* Main turn area */}
      <Box sx={{ textAlign: 'center', py: 0.5 }}>
        <Typography variant="subtitle2" fontWeight="bold" color={isMyTurn ? 'primary' : 'text.secondary'}>
          {isMyTurn ? "Your Turn!" : `Waiting for ${opponentName}...`}
        </Typography>
      </Box>

      {isMyTurn ? (
        <>
          {/* Phase 1: Choose category */}
          {!selectedCategory && (
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => handleChoose('truth')}
                sx={{
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  flex: 1
                }}
              >
                Truth 📜
              </Button>
              <Button
                variant="contained"
                onClick={() => handleChoose('dare')}
                sx={{
                  background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  flex: 1
                }}
              >
                Dare ⚡
              </Button>
            </Box>
          )}

          {/* Phase 2A: Waiting for opponent to write custom dare */}
          {selectedCategory === 'dare' && prompt === '__AWAITING_CUSTOM_DARE__' && (
            <Box sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Waiting for {opponentName} to write a dare for you... ⏳
              </Typography>
            </Box>
          )}

          {/* Phase 2B: Answer the challenge */}
          {selectedCategory && prompt !== '__AWAITING_CUSTOM_DARE__' && !answered && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ color: selectedCategory === 'truth' ? '#00f2fe' : '#ff0844' }}>
                {selectedCategory.toUpperCase()}:
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontStyle: 'italic', mb: 1, wordBreak: 'break-word' }}>
                "{prompt}"
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your answer here..."
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                variant="outlined"
                InputProps={{
                  sx: { fontSize: '0.85rem' }
                }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={handleSubmitAnswer}
                disabled={!typedAnswer.trim()}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' }, color: '#fff', textTransform: 'none' }}
              >
                Submit Answer
              </Button>
            </Box>
          )}
        </>
      ) : (
        /* Opponent's turn */
        <Box sx={{ py: 1 }}>
          {!selectedCategory && (
            <Typography variant="body2" align="center" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              Choosing truth or dare...
            </Typography>
          )}

          {selectedCategory === 'dare' && prompt === '__AWAITING_CUSTOM_DARE__' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff0844' }}>
                {opponentName} chose Dare! ⚡
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5 }}>
                Type a custom dare challenge for {opponentName}:
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type the dare challenge..."
                value={customDare}
                onChange={(e) => setCustomDare(e.target.value)}
                variant="outlined"
                InputProps={{
                  sx: { fontSize: '0.85rem' }
                }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  if (!customDare.trim()) return;
                  onSendGameMessage({
                    ...gameData,
                    prompt: customDare.trim()
                  });
                  setCustomDare('');
                }}
                disabled={!customDare.trim()}
                sx={{
                  background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  mt: 0.5
                }}
              >
                Send Dare
              </Button>
            </Box>
          )}

          {selectedCategory && prompt !== '__AWAITING_CUSTOM_DARE__' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, textAlign: 'center' }}>
              <Typography variant="caption" fontWeight="bold" sx={{ color: selectedCategory === 'truth' ? '#00f2fe' : '#ff0844' }}>
                CHALLENGE ({selectedCategory.toUpperCase()}):
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 600, wordBreak: 'break-word' }}>
                "{prompt}"
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Answering in progress...
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 4. ROCK PAPER SCISSORS COMPONENT
// ----------------------------------------------------
const RockPaperScissorsGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const { gameId, status, player1Id, player2Id, player1Selected, player2Selected, player1Move, player2Move, winnerId } = gameData;
  const isP1 = userId === player1Id;
  const mySelected = isP1 ? player1Selected : player2Selected;
  const oppSelected = isP1 ? player2Selected : player1Selected;

  const localKey = `rps_choice_${gameId}`;
  const [myLocalChoice, setMyLocalChoice] = useState(() => localStorage.getItem(localKey));

  useEffect(() => {
    // Keep local choice state synced
    const checkChoice = () => {
      setMyLocalChoice(localStorage.getItem(localKey));
    };
    window.addEventListener('storage', checkChoice);
    return () => window.removeEventListener('storage', checkChoice);
  }, [localKey]);

  // Background check for automatic reveal by first player
  useEffect(() => {
    if (status === 'active' && player1Selected && player2Selected) {
      const storedMove = localStorage.getItem(localKey);
      if (storedMove) {
        let p1Move = isP1 ? storedMove : player1Move;
        let p2Move = isP1 ? player2Move : storedMove;

        if (p1Move && p2Move) {
          let calculatedWinner = 'draw';
          if (p1Move !== p2Move) {
            if (
              (p1Move === 'rock' && p2Move === 'scissors') ||
              (p1Move === 'paper' && p2Move === 'rock') ||
              (p1Move === 'scissors' && p2Move === 'paper')
            ) {
              calculatedWinner = player1Id;
            } else {
              calculatedWinner = player2Id;
            }
          }

          localStorage.removeItem(localKey);

          onSendGameMessage({
            ...gameData,
            status: 'finished',
            player1Move: p1Move,
            player2Move: p2Move,
            winnerId: calculatedWinner
          });
        }
      }
    }
  }, [player1Selected, player2Selected, status, isP1, localKey, player1Move, player2Move, player1Id, player2Id, gameData, onSendGameMessage]);

  const handleChoice = (choice) => {
    localStorage.setItem(localKey, choice);
    setMyLocalChoice(choice);

    const nextGameData = { ...gameData };
    if (isP1) {
      nextGameData.player1Selected = true;
      // If P2 has already played, P1 is playing second, so P1 can submit their move directly in the message to trigger reveal
      if (player2Selected) {
        nextGameData.player1Move = choice;
      }
    } else {
      nextGameData.player2Selected = true;
      // If P1 has already played, P2 is playing second, so P2 submits move directly in the message
      if (player1Selected) {
        nextGameData.player2Move = choice;
      }
    }

    onSendGameMessage(nextGameData);
  };

  const getMoveEmoji = (move) => {
    if (move === 'rock') return '✊';
    if (move === 'paper') return '✋';
    if (move === 'scissors') return '✌️';
    return '❓';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 280, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, boxSizing: 'border-box' }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: status === 'finished' ? '#ff9800' : 'primary' }}>
        {status === 'finished'
          ? (winnerId === 'draw' ? "It's a draw! 🤝" : (winnerId === userId ? "You won! 🏆🎉" : "Opponent won! 👑"))
          : "Rock Paper Scissors!"}
      </Typography>

      {status === 'active' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          {!mySelected ? (
            /* We haven't selected: show choices */
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
              {['rock', 'paper', 'scissors'].map((choice) => (
                <Button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  sx={{
                    minWidth: 44,
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    borderRadius: '50%',
                    bgcolor: isDarkTheme ? '#1e293b' : '#f1f5f9',
                    fontSize: { xs: 20, sm: 24 },
                    boxShadow: 2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.15s',
                    '&:hover': {
                      transform: 'scale(1.15)',
                      bgcolor: isDarkTheme ? '#334155' : '#e2e8f0'
                    }
                  }}
                >
                  {getMoveEmoji(choice)}
                </Button>
              ))}
            </Box>
          ) : (
            /* We have selected: show status */
            <Box sx={{ textAlign: 'center', py: 0.5 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                ✅ You chose {getMoveEmoji(myLocalChoice || mySelected)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {oppSelected ? "Revealing moves..." : "Waiting for opponent to choose..."}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {status === 'finished' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>You played</Typography>
              <Typography variant="h3">{getMoveEmoji(isP1 ? player1Move : player2Move)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Opponent played</Typography>
              <Typography variant="h3">{getMoveEmoji(isP1 ? player2Move : player1Move)}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 5. MAIN GAME BUBBLE CONTROLLER
// ----------------------------------------------------
export const GameBubble = ({ msg, userId, username, selectedUser, onSendGameMessage, isDarkTheme }) => {
  const textStr = msg.text || '';
  if (!textStr.startsWith('JUICY_GAME:')) return null;

  let gameData = null;
  try {
    const jsonStr = textStr.indexOf('{') !== -1 ? textStr.slice(textStr.indexOf('{')) : textStr.substring(11);
    gameData = JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse game data:', e, 'Raw text:', textStr);
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="caption" sx={{ color: 'error.main', fontStyle: 'italic', display: 'block' }}>
          ⚠️ Failed to parse game data: {e.message}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', wordBreak: 'break-all', mt: 0.5 }}>
          Raw data: {textStr}
        </Typography>
      </Box>
    );
  }

  const { gameType, status, player1, player2, player1Id, player2Id } = gameData;
  const isInviter = gameType === 'rps' ? (userId === player1Id) : (userId === player1?.id);
  const oppName = gameType === 'rps' 
    ? (selectedUser?.username || 'Opponent')
    : (isInviter ? (player2?.username || 'Opponent') : (player1?.username || 'Opponent'));

  // Invite view
  if (status === 'invited') {
    return (
      <Box sx={{ p: 1.5, minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="bold" align="center">
          {isInviter ? `🎮 Invited ${oppName} to play` : `🎮 ${oppName} invited you to play`}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', align: 'center', display: 'block' }}>
          Game: {gameType === 'tictactoe' ? 'Tic Tac Toe' : (gameType === 'truthordare' ? 'Truth or Dare' : 'Rock Paper Scissors')}
        </Typography>

        {!isInviter ? (
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                let activeData = { ...gameData, status: 'active' };
                if (gameType === 'tictactoe') {
                  activeData.board = Array(9).fill(null);
                  activeData.turn = 'X';
                  activeData.turnPlayerId = player1.id;
                } else if (gameType === 'truthordare') {
                  activeData.turnPlayerId = userId; // User who accepted goes first
                  activeData.selectedCategory = null;
                  activeData.prompt = null;
                  activeData.answered = false;
                } else if (gameType === 'rps') {
                  activeData.player1Selected = false;
                  activeData.player2Selected = false;
                }
                onSendGameMessage(activeData);
              }}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' }, color: '#fff', flex: 1, textTransform: 'none' }}
            >
              Accept
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSendGameMessage({ ...gameData, status: 'declined' })}
              sx={{ color: '#f44336', borderColor: '#f44336', '&:hover': { borderColor: '#d32f2f', bgcolor: 'rgba(244, 67, 54, 0.08)' }, flex: 1, textTransform: 'none' }}
            >
              Decline
            </Button>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            Waiting for response...
          </Typography>
        )}
      </Box>
    );
  }

  if (status === 'declined') {
    return (
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          🎮 Game invite declined by {isInviter ? oppName : 'you'}.
        </Typography>
      </Box>
    );
  }

  // Active game view
  if (gameType === 'tictactoe') {
    return <TicTacToeGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'truthordare') {
    return <TruthOrDareGame gameData={gameData} userId={userId} username={username} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'rps') {
    return <RockPaperScissorsGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }

  return null;
};
