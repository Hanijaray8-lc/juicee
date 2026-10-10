import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Grid, Button, Typography,
  Paper, IconButton, TextField, Card, CardContent, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ---- New Easy Games (Games/ folder) ----
import { DotsAndBoxesGame, dotsAndBoxesInitialData } from './Games/DotsAndBoxes';
import { MemoryGame, memoryGameInitialData } from './Games/MemoryGame';
import { HighStrikerGame, highStrikerInitialData } from './Games/HighStriker';
import { FallingBoxesGame, fallingBoxesInitialData } from './Games/FallingBoxes';
import { MathsQuizGame, mathsQuizInitialData, generateQuestion } from './Games/MathsQuiz';
import { FindTheMatchGame, findTheMatchInitialData, generateFindPairRound } from './Games/FindTheMatch';
import { FluffyJumpGame, fluffyJumpInitialData } from './Games/FluffyJump';
import { FruitCuttingGame, fruitCuttingInitialData } from './Games/FruitCutting';
import { CoffeePongGame, beerPongInitialData } from './Games/Coffee Pong';
import { MiniArcheryGame, miniArcheryInitialData } from './Games/Mini Archery';
import { PogoBowlingGame, pogoBowlingInitialData } from './Games/PogoBowling';
import { MiniGolfGame, miniGolfInitialData } from './Games/Mini Golf';
import { CarRaceGame, carRaceInitialData } from './Games/CarRace';
import { BattleShipGame, battleShipInitialData } from './Games/Battle_ship';
import { WaterSortGame, waterSortInitialData } from './Games/WaterSort';
import { SnakeLadderGame, snakeLadderInitialData } from './Games/SnakeLadder';
import { WordGame, wordGameInitialData } from './Games/WordGame';
import { SpaceBattleGame, spaceBattleInitialData } from './Games/SpaceBattle';
import { JumpChickenGame, jumpChickenInitialData } from './Games/jumpChicken';

// ---- Game Images (gameimgs/ folder) ----
import battleshipImg from './gameimgs/battleship.png';
import dotsandboxesImg from './gameimgs/dotsandboxes.png';
import fallingboxesImg from './gameimgs/fallingboxes.png';
import findthematchImg from './gameimgs/findthematch.png';
import fluffyjumpImg from './gameimgs/fluffyjump.png';
import fruitcuttingImg from './gameimgs/fruitcutting.png';
import highstrikerImg from './gameimgs/highstriker.png';
import mathsquizImg from './gameimgs/mathsquiz.png';
import memorygameImg from './gameimgs/memorygame.png';
import rpsImg from './gameimgs/rps.png';
import snakeladderImg from './gameimgs/1.png';
import tictactoeImg from './gameimgs/tictactoe.png';
import truthordareImg from './gameimgs/truthordare.png';
import coffeepongImg from './gameimgs/coffeepong.png';
import miniarcheryImg from './gameimgs/miniarchery.png';
import bowlingImg from './gameimgs/bowling.png';
import minigolfImg from './gameimgs/minigolf.png';
import carraceImg from './gameimgs/carrace.png';
import watersortImg from './gameimgs/watersort.png';
import wordsearchImg from './gameimgs/wordsearch.png';
import spacebattleImg from './gameimgs/spacebattle.png';
import chickenjumpImg from './gameimgs/chickenjump.png';

export const GAME_IMAGES = {
  battleship: battleshipImg,
  dotsandboxes: dotsandboxesImg,
  fallingboxes: fallingboxesImg,
  findthematch: findthematchImg,
  fluffyjump: fluffyjumpImg,
  fruitcutting: fruitcuttingImg,
  highstriker: highstrikerImg,
  mathsquiz: mathsquizImg,
  memorygame: memorygameImg,
  rps: rpsImg,
  snakeladder: snakeladderImg,
  tictactoe: tictactoeImg,
  truthordare: truthordareImg,
  beerpong: coffeepongImg,
  coffeepong: coffeepongImg,
  miniarchery: miniarcheryImg,
  pogobowling: bowlingImg,
  bowling: bowlingImg,
  minigolf: minigolfImg,
  carrace: carraceImg,
  watersort: watersortImg,
  wordgame: wordsearchImg,
  wordsearch: wordsearchImg,
  spacebattle: spacebattleImg,
  jumpchicken: chickenjumpImg,
  chickenjump: chickenjumpImg,
};

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

// Helper to determine if theme is dark based on prop or Settings.js active theme
export const isThemeDark = (isDarkTheme) => {
  if (typeof isDarkTheme === 'boolean') return isDarkTheme;
  try {
    const saved = localStorage.getItem('appTheme');
    if (saved) {
      const themeData = JSON.parse(saved);
      const bgCol = themeData?.colors?.background;
      if (bgCol && bgCol.startsWith('#')) {
        const hex = bgCol.replace('#', '').trim();
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return ((r * 299 + g * 587 + b * 114) / 1000) < 128;
      }
      const themeIdStr = (themeData?.id || '').toLowerCase();
      return themeIdStr.includes('dark') || themeIdStr.includes('black') || themeIdStr.includes('midnight') || themeIdStr.includes('amoled') || themeIdStr.includes('night');
    }
  } catch (e) {}
  return false;
};

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

// Shared icon renderer – renders game artwork image or fallback emoji/icon
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
const GameIcon = ({ icon, image, size = 32, glow, sx = {} }) => {
  const resolvedImage = image || (
    typeof icon === 'string' && (
      icon.startsWith('data:') ||
      icon.startsWith('/') ||
      icon.startsWith('http') ||
      icon.startsWith('static/') ||
      icon.includes('.') ||
      icon.includes('/')
    ) ? icon : (GAME_IMAGES && GAME_IMAGES[icon] ? GAME_IMAGES[icon] : null)
  );

  if (resolvedImage) {
    return (
      <Box
        component="img"
        src={resolvedImage}
        alt=""
        sx={{
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: `${Math.round(size * 0.25)}px`,
          objectFit: 'cover',
          flexShrink: 0,
          verticalAlign: 'middle',
          userSelect: 'none',
          ...(glow ? { filter: `drop-shadow(0 0 6px ${glow})` } : {}),
          ...sx,
        }}
      />
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        fontSize: size * 0.82,
        lineHeight: 1,
        fontFamily: EMOJI_FONT,
        textAlign: 'center',
        overflow: 'visible',
        userSelect: 'none',
        ...(glow ? { filter: `drop-shadow(0 0 6px ${glow})` } : {}),
        ...sx,
      }}
    >
      {icon}
    </Box>
  );
};

// Individual game tile – round card with image/emoji + label
const GameTile = ({ emoji, image, label, color, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.8,
      p: 1.2,
      borderRadius: '20px',
      background: 'rgba(255,255,255,0.05)',
      border: `1.5px solid rgba(255,255,255,0.1)`,
      cursor: 'pointer',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      '&:hover': {
        transform: 'translateY(-3px) scale(1.04)',
        border: `1.5px solid ${color}`,
        boxShadow: `0 6px 22px ${color}55`,
        background: `${color}18`,
      },
      '&:active': { transform: 'scale(0.94)' }
    }}
  >
    <GameIcon image={image} icon={emoji} size={40} glow={`${color}88`} />
    <Typography sx={{
      fontSize: { xs: '0.62rem', sm: '0.68rem' },
      fontWeight: 700,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      lineHeight: 1.25,
      letterSpacing: 0.2,
      wordBreak: 'break-word'
    }}>
      {label}
    </Typography>
  </Box>
);

// Big circular category picker button
const CategoryCircle = ({ emoji, image, label, sublabel, color, glow, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1.5,
      cursor: 'pointer',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      '&:hover': { transform: 'scale(1.06)' },
      '&:active': { transform: 'scale(0.93)' },
    }}
  >
    {/* Outer glow ring */}
    <Box sx={{
      width: { xs: 110, sm: 128 },
      height: { xs: 110, sm: 128 },
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}22 0%, ${color}06 60%, transparent 100%)`,
      border: `2px solid ${color}55`,
      boxShadow: `0 0 0 6px ${color}18, 0 0 32px ${color}44`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transition: 'box-shadow 0.22s ease',
      '&:hover': {
        boxShadow: `0 0 0 8px ${color}28, 0 0 48px ${color}66`,
        border: `2px solid ${color}aa`,
      },
    }}>
      {/* Inner filled circle */}
      <Box sx={{
        width: { xs: 82, sm: 96 },
        height: { xs: 82, sm: 96 },
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}33 0%, ${color}18 100%)`,
        border: `1.5px solid ${color}66`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
      }}>
        <GameIcon image={image} icon={emoji} size={44} glow={`${color}cc`} />
        {/* Badge */}
        <Box sx={{
          px: 0.9, py: 0.2, borderRadius: 1,
          background: `${color}33`,
          border: `1px solid ${color}66`,
        }}>
          <Typography sx={{ fontSize: 8, fontWeight: 800, color, letterSpacing: 0.6 }}>
            {sublabel}
          </Typography>
        </Box>
      </Box>
    </Box>
    {/* Label below circle */}
    <Box sx={{ textAlign: 'center' }}>
      <Typography sx={{
        fontWeight: 900,
        fontSize: { xs: '0.92rem', sm: '1rem' },
        color: '#fff',
        letterSpacing: 0.3,
      }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

// Game card used in the selector grid (white card + colored icon tile, with custom game artwork)
const GameGridCard = ({ image, emoji, label, color, badge, onClick, index }) => (
  <Box
    onClick={onClick}
    sx={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.8,
      pt: 1.2,
      pb: 1,
      px: 0.6,
      borderRadius: '18px',
      background: '#ffffff',
      boxShadow: '0 4px 0 rgba(0,0,0,0.18), 0 6px 14px rgba(0,0,0,0.22)',
      cursor: 'pointer',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      animation: 'gameCardPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      animationDelay: `${Math.min(index, 12) * 35}ms`,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      '@keyframes gameCardPop': {
        '0%': { opacity: 0, transform: 'scale(0.7) translateY(14px)' },
        '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
      },
      '&:hover': { transform: 'translateY(-3px)' },
      '&:active': { transform: 'scale(0.94)', boxShadow: '0 1px 0 rgba(0,0,0,0.18)' },
    }}
  >
    {/* Corner badge */}
    <Box sx={{
      position: 'absolute', top: -6, right: -4,
      px: 0.7, py: 0.15, borderRadius: '8px',
      background: color, color: '#fff',
      fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      zIndex: 2,
    }}>
      {badge}
    </Box>

    {/* Icon tile */}
    <Box sx={{
      width: { xs: 60, sm: 68 },
      height: { xs: 60, sm: 68 },
      borderRadius: '18px',
      background: image ? 'transparent' : `linear-gradient(145deg, ${color} 0%, ${color}99 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: image ? `0 4px 12px ${color}33, 0 2px 6px rgba(0,0,0,0.15)` : `inset 0 -4px 0 rgba(0,0,0,0.18), 0 3px 8px ${color}66`,
      overflow: 'hidden',
    }}>
      {image ? (
        <Box
          component="img"
          src={image}
          alt={label}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '18px',
            display: 'block',
          }}
        />
      ) : (
        <GameIcon icon={emoji} size={38} glow="rgba(0,0,0,0.25)" />
      )}
    </Box>

    <Typography sx={{
      fontSize: { xs: '0.66rem', sm: '0.72rem' },
      fontWeight: 800,
      color: '#1e293b',
      textAlign: 'center',
      lineHeight: 1.2,
      minHeight: '1.7em',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      wordBreak: 'break-word',
    }}>
      {label}
    </Typography>
  </Box>
);

export const GameSelectorDialog = ({ open, onClose, onSelectGame }) => {
  const [category, setCategory] = useState('live'); // 'live' | 'challenge'

  // Always start on Live whenever the dialog opens
  React.useEffect(() => {
    if (open) setCategory('live');
  }, [open]);

  const LIVE_GAMES = [
    { image: tictactoeImg, label: 'Tic Tac Toe', color: '#e52e71', id: 'tictactoe' },
    { image: truthordareImg, label: 'Truth or Dare', color: '#06b6d4', id: 'truthordare' },
    { image: rpsImg, label: 'Rock Paper', color: '#3eb8e5', id: 'rps' },
    { image: dotsandboxesImg, label: 'Dots & Boxes', color: '#ef4444', id: 'dotsandboxes' },
    { image: memorygameImg, label: 'Memory Match', color: '#a855f7', id: 'memorygame' },
    { image: mathsquizImg, label: 'Maths Quiz', color: '#22c55e', id: 'mathsquiz' },
    { image: findthematchImg, label: 'Find Match', color: '#0891b2', id: 'findthematch' },
    { image: battleshipImg, label: 'Battleship', color: '#38bdf8', id: 'battleship' },
    { image: snakeladderImg, label: 'Krakens & Ships', color: '#0284c7', id: 'snakeladder' },
  ];

  const CHALLENGE_GAMES = [
    { image: highstrikerImg, label: 'High Striker', color: '#f97316', id: 'highstriker' },
    { image: fallingboxesImg, label: 'Falling Boxes', color: '#f59e0b', id: 'fallingboxes' },
    { image: fruitcuttingImg, label: 'Fruit Cutter', color: '#f43f5e', id: 'fruitcutting' },
    { image: fluffyjumpImg, label: 'Fluffy Jump', color: '#10b981', id: 'fluffyjump' },
    { image: coffeepongImg, label: 'Coffee Pong', color: '#3b82f6', id: 'beerpong' },
    { image: miniarcheryImg, label: 'Mini Archery', color: '#14b8a6', id: 'miniarchery' },
    { image: bowlingImg, label: 'Pogo Bowling', color: '#ec4899', id: 'pogobowling' },
    { image: minigolfImg, label: 'Mini Golf', color: '#22c55e', id: 'minigolf' },
    { image: carraceImg, label: 'Car Race', color: '#0ea5e9', id: 'carrace' },
    { image: watersortImg, label: 'Water Sort', color: '#fb923c', id: 'watersort' },
    { image: wordsearchImg, label: 'Word Search', color: '#06b6d4', id: 'wordgame' },
    { image: spacebattleImg, label: 'Space Battle', color: '#8b5cf6', id: 'spacebattle' },
    { image: chickenjumpImg, label: 'Chicken Jump', color: '#eab308', id: 'jumpchicken' },
  ];

  const CHAT_GAMES = [
    { image: tictactoeImg, label: 'Tic Tac Toe', color: '#e52e71', id: 'tictactoe' },
    { image: rpsImg, label: 'Rock Paper', color: '#3eb8e5', id: 'rps' },
  ];

  const isLive = category === 'live';
  const isChat = category === 'chat';
  const games = isLive ? LIVE_GAMES : (isChat ? CHAT_GAMES : CHALLENGE_GAMES);
  const catColor = isLive ? '#22c55e' : (isChat ? '#06b6d4' : '#f59e0b');
  const catSub = isLive
    ? 'Both players compete head-to-head in real-time 3D Arena'
    : (isChat
      ? '💬 Play directly inside chat while messaging each other!'
      : 'You play first, set a score — friend tries to beat it!');
  const badge = isLive ? 'LIVE' : (isChat ? 'CHAT' : 'SCORE');

  const ToggleButton = ({ id, emoji, label, color, count }) => {
    const active = category === id;
    return (
      <Box
        onClick={() => setCategory(id)}
        sx={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.4, sm: 0.7 },
          py: 1, px: { xs: 0.4, sm: 0.8 }, borderRadius: '14px',
          cursor: 'pointer', userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          background: active ? `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)` : '#ffffff',
          color: active ? '#fff' : '#475569',
          boxShadow: active
            ? `0 4px 0 rgba(0,0,0,0.25), 0 6px 16px ${color}77`
            : '0 3px 0 rgba(0,0,0,0.12)',
          transform: active ? 'translateY(-1px)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          '&:active': { transform: 'scale(0.96)' },
        }}
      >
        <GameIcon icon={emoji} size={18} />
        <Typography sx={{ fontWeight: 900, fontSize: { xs: '0.74rem', sm: '0.84rem' }, letterSpacing: 0.2, color: 'inherit', whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
        <Box sx={{
          minWidth: 16, px: 0.4, py: 0.1, borderRadius: '8px', textAlign: 'center',
          background: active ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.08)',
          fontSize: 9, fontWeight: 900,
        }}>
          {count}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{
      sx: {
        background: 'linear-gradient(180deg, #8fd3f4 0%, #6bb8ec 100%)',
        borderRadius: 4,
        color: '#1e293b',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        maxHeight: '88vh',
      }
    }}>

      {/* Header (yellow banner like the reference) */}
      <Box sx={{
        position: 'relative',
        background: 'linear-gradient(180deg, #ffd23f 0%, #ffb300 100%)',
        px: 2.5, pt: 2, pb: 2.2,
        textAlign: 'center',
        borderBottom: '4px solid rgba(0,0,0,0.12)',
      }}>
        <Typography sx={{
          fontWeight: 900,
          fontSize: '1.5rem',
          letterSpacing: 2,
          color: '#fff',
          textShadow: '0 3px 0 #2b3a8f, 0 0 2px #2b3a8f, 2px 2px 0 #2b3a8f, -2px 2px 0 #2b3a8f',
          textTransform: 'uppercase',
        }}>
          Games
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{
          position: 'absolute', top: 10, right: 10,
          color: '#fff',
          bgcolor: '#29b6f6',
          boxShadow: '0 3px 0 rgba(0,0,0,0.25)',
          '&:hover': { bgcolor: '#0ea5e9' }
        }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <DialogContent sx={{ px: 2, pt: 2, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>

        {/* Live / Chat Play / Challenge toggle */}
        <Box sx={{ display: 'flex', gap: { xs: 0.6, sm: 1 } }}>
          <ToggleButton id="live" emoji="⚡" label="Live" color="#22c55e" count={LIVE_GAMES.length} />
          <ToggleButton id="chat" emoji="💬" label="In Chat" color="#06b6d4" count={CHAT_GAMES.length} />
          <ToggleButton id="challenge" emoji="🏆" label="Challenge" color="#f59e0b" count={CHALLENGE_GAMES.length} />
        </Box>

        {/* Description of the selected mode */}
        <Typography sx={{
          fontSize: '0.7rem', fontWeight: 700,
          color: '#0f3a5f', textAlign: 'center',
          background: 'rgba(255,255,255,0.45)',
          border: `1.5px dashed ${catColor}`,
          borderRadius: '12px', py: 0.7, px: 1,
        }}>
          {catSub}
        </Typography>

        {/* Games grid – changes with the toggle */}
        <Box
          key={category}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: { xs: 1.3, sm: 1.6 },
            pt: 1,
            pb: 0.5,
            px: 0.3,
            maxHeight: '50vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.25)', borderRadius: 2 },
          }}
        >
          {games.map((g, i) => (
            <GameGridCard
              key={g.id}
              index={i}
              image={g.image}
              emoji={g.emoji}
              label={g.label}
              color={g.color}
              badge={badge}
              onClick={() => onSelectGame(g.id, category)}
            />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ----------------------------------------------------
// 2. TIC TAC TOE COMPONENT
// ----------------------------------------------------
const TicTacToeGame = ({ gameData, userId, onSendGameMessage, isDarkTheme, isLatest = true }) => {
  const dark = isThemeDark(isDarkTheme);
  const { board, turn, turnPlayerId, status, player1, player2 } = gameData;
  const isMyTurn = isLatest && status === 'active' && turnPlayerId === userId;

  const handleCellClick = (idx) => {
    if (!isLatest || !isMyTurn || board[idx] !== null) return;

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
    if (!isLatest) {
      const lastMovedBy = turn === 'X' ? player2?.username : player1?.username;
      return lastMovedBy ? `Move played by ${lastMovedBy}` : "Move played";
    }
    return isMyTurn ? "Your Turn (Click a cell)" : `Waiting for ${userId === player1.id ? player2.username : player1.username}...`;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 280, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
      <Typography variant="subtitle2" sx={{
        fontWeight: 'bold',
        mb: 1.5,
        color: status === 'finished' ? '#ff9800' : (isMyTurn ? '#22c55e' : (dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)'))
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
              bgcolor: dark ? '#1e293b' : '#f1f5f9',
              border: '1.5px solid',
              borderColor: dark ? '#334155' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isLatest && isMyTurn && cell === null ? 'pointer' : 'default',
              transition: 'all 0.15s',
              '&:hover': isLatest && isMyTurn && cell === null ? {
                bgcolor: dark ? '#334155' : '#e2e8f0',
                transform: 'scale(1.05)'
              } : {},
              '&:active': isLatest && isMyTurn && cell === null ? { transform: 'scale(0.95)' } : {}
            }}
          >
            <Typography sx={{
              fontSize: 'min(8vw, 2.2rem)',
              fontWeight: 'bold',
              lineHeight: 1,
              color: cell === 'X' ? '#ef4444' : (dark ? '#06b6d4' : '#0284c7'),
              textShadow: cell ? `0 0 8px ${cell === 'X' ? 'rgba(239, 68, 68, 0.4)' : (dark ? 'rgba(6, 182, 212, 0.4)' : 'rgba(2, 132, 199, 0.25)')}` : 'none'
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
        <Typography variant="caption" sx={{ color: dark ? '#06b6d4' : '#0284c7', fontWeight: 600 }}>
          O: {player2.username}
        </Typography>
      </Box>

      {status === 'finished' && isLatest && (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            onSendGameMessage({
              ...gameData,
              status: 'active',
              board: Array(9).fill(null),
              turn: 'X',
              turnPlayerId: player1?.id || player1?._id,
              winnerId: null,
              winnerSymbol: null
            });
          }}
          sx={{
            mt: 1.5,
            py: 0.6,
            px: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.8rem',
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(0, 242, 254, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00d2de 0%, #3e9cee 100%)',
            }
          }}
        >
          🔄 Play Again
        </Button>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 3. TRUTH OR DARE COMPONENT
// ----------------------------------------------------
// Truth or Dare scoring / game-end rules (4 rounds total: 2 turns each player)
const TOD_TURNS_PER_PLAYER = 2;                          // every player gets 2 turns
const TOD_TOTAL_TURNS = 4;                               // game ends after 4 rounds/turns
const TOD_POINTS = { truth: 1, dare: 2 };                // points for completing a turn (skip = 0)

export const TruthOrDareGame = ({ gameData, userId, username, onSendGameMessage, isDarkTheme }) => {
  const dark = isThemeDark(isDarkTheme);
  const { player1, player2, turnPlayerId, selectedCategory, prompt, answered, lastRound, status } = gameData;
  const isFinished = status === 'finished';
  const isMyTurn = !isFinished && String(turnPlayerId) === String(userId);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [customDare, setCustomDare] = useState('');

  const isP1 = String(userId) === String(player1?.id);
  const me = isP1 ? player1 : player2;
  const opp = isP1 ? player2 : player1;
  const opponentName = opp?.username;

  // ---- Score / turn tracking (safe defaults for older game messages) ----
  const scores = gameData.scores || {};
  const turnsPlayed = Number(gameData.turnsPlayed ?? 0);

  const handleChoose = (category) => {
    if (!isMyTurn || selectedCategory) return;

    if (category === 'truth') {
      // Avoid repeating truths until every question has been used
      const used = Array.isArray(gameData.usedTruths) ? gameData.usedTruths : [];
      let pool = TRUTHS.filter((t) => !used.includes(t));
      let baseUsed = used;
      if (pool.length === 0) {
        pool = TRUTHS;
        baseUsed = [];
      }
      const selectedPrompt = pool[Math.floor(Math.random() * pool.length)];
      onSendGameMessage({
        ...gameData,
        selectedCategory: 'truth',
        prompt: selectedPrompt,
        usedTruths: [...baseUsed, selectedPrompt],
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

  // Completes the current turn: adds score, advances turn, ends the game after the last turn
  const completeTurn = (answerText, skipped = false) => {
    if (!isMyTurn || !selectedCategory || prompt === '__AWAITING_CUSTOM_DARE__') return;

    const earned = skipped ? 0 : (TOD_POINTS[selectedCategory] || 1);
    const newScores = {
      [player1?.id]: Number(scores[player1?.id] ?? 0) + (isP1 ? earned : 0),
      [player2?.id]: Number(scores[player2?.id] ?? 0) + (isP1 ? 0 : earned)
    };
    const newTurnsPlayed = turnsPlayed + 1;
    const gameOver = newTurnsPlayed >= TOD_TOTAL_TURNS;

    const nextGameData = {
      ...gameData,
      status: gameOver ? 'finished' : 'active',
      scores: newScores,
      turnsPlayed: newTurnsPlayed,
      answered: true,
      answer: answerText,
      lastRound: {
        player: username || me?.username,
        category: selectedCategory,
        prompt: prompt,
        answer: answerText,
        points: earned,
        skipped
      },
      selectedCategory: null,
      prompt: null,
      turnPlayerId: opp?.id
    };

    if (gameOver) {
      const s1 = newScores[player1?.id];
      const s2 = newScores[player2?.id];
      nextGameData.winnerId = s1 > s2 ? player1?.id : (s2 > s1 ? player2?.id : 'draw');
    }

    onSendGameMessage(nextGameData);
  };

  const handleSubmitAnswer = () => {
    if (!typedAnswer.trim()) return;
    completeTurn(typedAnswer.trim(), false);
    setTypedAnswer('');
  };

  const handleSkip = () => {
    completeTurn('Skipped ⏭️', true);
    setTypedAnswer('');
  };

  const winnerId = gameData.winnerId;
  const isDraw = winnerId === 'draw' || winnerId === 'tie';
  const iWon = !isDraw && winnerId !== undefined && winnerId !== null && String(winnerId) === String(userId);

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
      {/* Turn indicator banner (scores hidden for Truth or Dare) */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        py: 0.9,
        borderRadius: 2,
        bgcolor: isFinished
          ? (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
          : (isMyTurn ? (dark ? 'rgba(0, 242, 254, 0.12)' : 'rgba(2, 132, 199, 0.08)') : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')),
        border: '1px solid',
        borderColor: isFinished
          ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')
          : (isMyTurn ? (dark ? 'rgba(0, 242, 254, 0.45)' : 'rgba(2, 132, 199, 0.35)') : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')),
        boxShadow: isMyTurn ? '0 0 12px rgba(0, 242, 254, 0.25)' : 'none'
      }}>
        <Typography variant="subtitle2" sx={{
          fontWeight: 800,
          fontSize: '0.88rem',
          color: isFinished ? '#ff9800' : (isMyTurn ? (dark ? '#00f2fe' : '#0284c7') : (dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)')),
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          textAlign: 'center'
        }}>
          {isFinished
            ? '🏁 Game Completed'
            : (isMyTurn ? '🎯 Your Turn!' : `⏳ Waiting for ${opponentName}...`)}
        </Typography>
      </Box>

      {/* Last Round History Banner */}
      {lastRound && (
        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          borderLeft: '3px solid #ff9800',
          fontSize: '0.8rem'
        }}>
          <Typography variant="caption" fontWeight="bold" sx={{ color: '#ff9800', display: 'block', wordBreak: 'break-word' }}>
            Last Round: {lastRound.player} ({lastRound.category.toUpperCase()})
          </Typography>
          <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 0.5, wordBreak: 'break-word' }}>
            "{lastRound.prompt}"
          </Typography>
          <Typography variant="caption" fontWeight={600} sx={{ display: 'block', wordBreak: 'break-word' }}>
            Answer: {lastRound.answer}
          </Typography>
        </Box>
      )}

      {/* Game Over result */}
      {isFinished && (
        <Box sx={{
          textAlign: 'center',
          py: 1.2,
          px: 1,
          borderRadius: 2,
          bgcolor: isDraw ? 'rgba(245,158,11,0.12)' : (iWon ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)'),
          border: isDraw ? '1px solid rgba(245,158,11,0.35)' : (iWon ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.35)')
        }}>
          <Typography sx={{ fontSize: 26, lineHeight: 1 }}>
            {isDraw ? '🤝' : (iWon ? '🏆' : '👑')}
          </Typography>
          <Typography sx={{
            fontWeight: 900,
            fontSize: '0.95rem',
            color: isDraw ? '#fbbf24' : (iWon ? '#4ade80' : '#f87171'),
            mt: 0.3
          }}>
            {isDraw ? "It's a draw!" : (iWon ? 'You won! 🎉' : `${opponentName} won!`)}
          </Typography>
        </Box>
      )}

      {/* Main turn area */}
      {!isFinished && (
        <>
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
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)' }}>
                    Waiting for {opponentName} to write a dare for you... ⏳
                  </Typography>
                </Box>
              )}

              {/* Phase 2B: Answer the challenge */}
              {selectedCategory && prompt !== '__AWAITING_CUSTOM_DARE__' && !answered && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" fontWeight="bold" sx={{ color: selectedCategory === 'truth' ? (dark ? '#00f2fe' : '#0284c7') : '#ff0844' }}>
                    {selectedCategory.toUpperCase()}:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontStyle: 'italic', mb: 1, wordBreak: 'break-word', color: dark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)' }}>
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
                    sx={{
                      bgcolor: dark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        color: dark ? '#ffffff' : '#1e293b',
                        borderRadius: '12px',
                        caretColor: '#00f2fe',
                        '& fieldset': {
                          borderColor: dark ? 'rgba(0, 242, 254, 0.45)' : '#cbd5e1',
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: '#00f2fe',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00f2fe',
                          boxShadow: '0 0 10px rgba(0, 242, 254, 0.35)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: dark ? '#ffffff' : '#1e293b',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        '&::placeholder': {
                          color: dark ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                          opacity: 1,
                        },
                      },
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
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleSkip}
                    sx={{ color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)', textTransform: 'none', fontSize: '0.72rem' }}
                  >
                    Skip ⏭️
                  </Button>
                </Box>
              )}
            </>
          ) : (
            /* Opponent's turn */
            <Box sx={{ py: 1 }}>
              {!selectedCategory && (
                <Typography variant="body2" align="center" sx={{ fontStyle: 'italic', color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)' }}>
                  Choosing truth or dare...
                </Typography>
              )}

              {selectedCategory === 'dare' && prompt === '__AWAITING_CUSTOM_DARE__' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff0844' }}>
                    {opponentName} chose Dare! ⚡
                  </Typography>
                  <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)', mb: 0.5 }}>
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
                    sx={{
                      bgcolor: dark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        color: dark ? '#ffffff' : '#1e293b',
                        borderRadius: '12px',
                        caretColor: '#ff0844',
                        '& fieldset': {
                          borderColor: dark ? 'rgba(255, 8, 68, 0.45)' : '#cbd5e1',
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: '#ff0844',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ff0844',
                          boxShadow: '0 0 10px rgba(255, 8, 68, 0.35)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: dark ? '#ffffff' : '#1e293b',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        '&::placeholder': {
                          color: dark ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                          opacity: 1,
                        },
                      },
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
                  <Typography variant="caption" fontWeight="bold" sx={{ color: selectedCategory === 'truth' ? (dark ? '#00f2fe' : '#0284c7') : '#ff0844' }}>
                    CHALLENGE ({selectedCategory.toUpperCase()}):
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 600, wordBreak: 'break-word', color: dark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)' }}>
                    "{prompt}"
                  </Typography>
                  <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', mt: 0.5 }}>
                    Answering in progress...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 4. ROCK PAPER SCISSORS COMPONENT
// ----------------------------------------------------
const RockPaperScissorsGame = ({ gameData, userId, onSendGameMessage, isDarkTheme, isLatest = true }) => {
  const dark = isThemeDark(isDarkTheme);
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
    if (!isLatest) return;
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

          const p1Prev = gameData.scores?.[player1Id] ?? (gameData.p1Score ?? 0);
          const p2Prev = gameData.scores?.[player2Id] ?? (gameData.p2Score ?? 0);
          const p1New = calculatedWinner === player1Id ? p1Prev + 1 : p1Prev;
          const p2New = calculatedWinner === player2Id ? p2Prev + 1 : p2Prev;

          onSendGameMessage({
            ...gameData,
            status: 'finished',
            player1Move: p1Move,
            player2Move: p2Move,
            winnerId: calculatedWinner,
            scores: { [player1Id]: p1New, [player2Id]: p2New },
            p1Score: p1New,
            p2Score: p2New
          });
        }
      }
    }
  }, [player1Selected, player2Selected, status, isP1, localKey, player1Move, player2Move, player1Id, player2Id, gameData, onSendGameMessage, isLatest]);

  const handleChoice = (choice) => {
    if (!isLatest) return;
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
      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: status === 'finished' ? '#ff9800' : (dark ? '#00f2fe' : '#0284c7') }}>
        {status === 'finished'
          ? (winnerId === 'draw' ? "It's a draw! 🤝" : (winnerId === userId ? "You won! 🏆🎉" : "Opponent won! 👑"))
          : "Rock Paper Scissors!"}
      </Typography>

      {status === 'active' && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          {!isLatest ? (
            <Box sx={{ textAlign: 'center', py: 0.5 }}>
              <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)', fontStyle: 'italic', fontWeight: 600 }}>
                Turn played
              </Typography>
            </Box>
          ) : !mySelected ? (
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
                    bgcolor: dark ? '#1e293b' : '#f1f5f9',
                    fontSize: { xs: 20, sm: 24 },
                    boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
                    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                    transition: 'all 0.15s',
                    '&:hover': {
                      transform: 'scale(1.15)',
                      bgcolor: dark ? '#334155' : '#e2e8f0'
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
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                ✅ You chose {getMoveEmoji(myLocalChoice || mySelected)}
              </Typography>
              <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', display: 'block', mt: 0.5, fontWeight: 500 }}>
                {oppSelected ? "Revealing moves..." : "Waiting for opponent to choose..."}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {status === 'finished' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', px: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 85 }}>
              <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)', fontWeight: 700, mb: 0.5 }}>You played</Typography>
              <Typography variant="h3">{getMoveEmoji(isP1 ? player1Move : player2Move)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 85 }}>
              <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)', fontWeight: 700, mb: 0.5 }}>Opponent played</Typography>
              <Typography variant="h3">{getMoveEmoji(isP1 ? player2Move : player1Move)}</Typography>
            </Box>
          </Box>
          {isLatest && (
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                onSendGameMessage({
                  ...gameData,
                  status: 'active',
                  player1Selected: false,
                  player2Selected: false,
                  player1Move: null,
                  player2Move: null,
                  winnerId: null
                });
              }}
              sx={{
                mt: 1,
                py: 0.6,
                px: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.8rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(0, 242, 254, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00d2de 0%, #3e9cee 100%)',
                }
              }}
            >
              🔄 Play Again
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// CHALLENGE GAMES HELPERS & RESULT COMPONENT
// ----------------------------------------------------
export const CHALLENGE_GAME_IDS = [
  'highstriker', 'fallingboxes', 'fruitcutting', 'fluffyjump', 'beerpong',
  'miniarchery', 'pogobowling', 'minigolf', 'carrace', 'watersort',
  'wordgame', 'spacebattle', 'jumpchicken'
];

export const isChallengeGameType = (type) => CHALLENGE_GAME_IDS.includes(type);

export const extractChallengeScores = (gd) => {
  if (!gd) return { p1Score: null, p2Score: null };
  let p1Score = null;
  let p2Score = null;

  if (gd.p1Score !== undefined && gd.p1Score !== null) p1Score = Number(gd.p1Score);
  else if (gd.p1FinalScore !== undefined && gd.p1FinalScore !== null) p1Score = Number(gd.p1FinalScore);
  else if (gd.p1ChallengeScore !== undefined && gd.p1ChallengeScore !== null) p1Score = Number(gd.p1ChallengeScore);
  else if (gd.p1TotalScore !== undefined && gd.p1TotalScore !== null) p1Score = Number(gd.p1TotalScore);
  else if (gd.p1RoundWins !== undefined && gd.p1RoundWins !== null) p1Score = Number(gd.p1RoundWins);
  else if (gd.rounds && gd.rounds.length > 0 && gd.rounds[0]?.p1Score !== null && gd.rounds[0]?.p1Score !== undefined) p1Score = Number(gd.rounds[0].p1Score);
  else if (gd.scores && gd.player1?.id) p1Score = Number(gd.scores[gd.player1.id]);

  if (gd.p2Score !== undefined && gd.p2Score !== null) p2Score = Number(gd.p2Score);
  else if (gd.p2FinalScore !== undefined && gd.p2FinalScore !== null) p2Score = Number(gd.p2FinalScore);
  else if (gd.p2TotalScore !== undefined && gd.p2TotalScore !== null) p2Score = Number(gd.p2TotalScore);
  else if (gd.p2RoundWins !== undefined && gd.p2RoundWins !== null) p2Score = Number(gd.p2RoundWins);
  else if (gd.rounds && gd.rounds.length > 0 && gd.rounds[0]?.p2Score !== null && gd.rounds[0]?.p2Score !== undefined) p2Score = Number(gd.rounds[0].p2Score);
  else if (gd.scores && gd.player2?.id) p2Score = Number(gd.scores[gd.player2.id]);

  return { p1Score, p2Score };
};

// Component that renders the head-to-head score match and who won / who lost
export const ChallengeScoreMatchCard = ({ gameData, userId, oppName, gameInfo, onOpenArena }) => {
  const { p1Score, p2Score } = extractChallengeScores(gameData);
  const p1 = gameData.player1 || { id: gameData.player1Id, username: 'Player 1' };
  const p2 = gameData.player2 || { id: gameData.player2Id, username: oppName || 'Player 2' };

  let computedWinner = gameData.winnerId;
  const n1 = p1Score !== null && p1Score !== undefined ? Number(p1Score) : null;
  const n2 = p2Score !== null && p2Score !== undefined ? Number(p2Score) : null;
  if (!computedWinner || computedWinner === 'null' || computedWinner === 'undefined' || (computedWinner === 'draw' && n1 !== null && n2 !== null && n1 !== n2)) {
    if (n1 !== null && n2 !== null) {
      if (n1 > n2) computedWinner = p1.id;
      else if (n2 > n1) computedWinner = p2.id;
      else computedWinner = 'draw';
    }
  }

  const isDraw = computedWinner === 'draw' || computedWinner === 'tie';
  const isP1Winner = !isDraw && String(computedWinner) === String(p1.id);
  const isP2Winner = !isDraw && String(computedWinner) === String(p2.id);
  const isMeWinner = !isDraw && String(computedWinner) === String(userId);

  const winnerName = isP1Winner ? p1.username : (isP2Winner ? p2.username : '');
  const diff = (p1Score !== null && p2Score !== null) ? Math.abs(p1Score - p2Score) : null;

  return (
    <Box sx={{
      p: 2,
      width: '100%',
      maxWidth: '100%',
      borderRadius: 4,
      background: 'linear-gradient(145deg, rgba(20, 26, 56, 0.96) 0%, rgba(10, 14, 32, 0.98) 100%)',
      border: isDraw
        ? '1.5px solid rgba(245, 158, 11, 0.45)'
        : (isMeWinner
          ? '1.5px solid rgba(34, 197, 94, 0.55)'
          : '1.5px solid rgba(0, 242, 254, 0.4)'),
      boxShadow: isDraw
        ? '0 12px 35px rgba(0,0,0,0.6), 0 0 25px rgba(245, 158, 11, 0.2)'
        : (isMeWinner
          ? '0 12px 35px rgba(0,0,0,0.6), 0 0 30px rgba(34, 197, 94, 0.25)'
          : '0 12px 35px rgba(0,0,0,0.6), 0 0 25px rgba(0, 242, 254, 0.2)'),
      display: 'flex',
      flexDirection: 'column',
      gap: 1.3,
      color: '#fff',
      userSelect: 'none',
      position: 'relative'
    }}>
      {/* Top Header Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GameIcon image={gameInfo?.image} icon={gameInfo?.icon || '🎮'} size={28} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
            {gameInfo?.name || 'Challenge Game'}
          </Typography>
        </Box>
        <Box sx={{
          px: 1, py: 0.3, borderRadius: 1.5,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
          color: '#00f2fe'
        }}>
          🏆 CHALLENGE RESULT
        </Box>
      </Box>

      {/* Big Winner Announcement Banner */}
      <Box sx={{
        textAlign: 'center',
        py: 1,
        px: 1.5,
        borderRadius: 2.5,
        background: isDraw
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'
          : (isMeWinner
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)'),
        border: isDraw
          ? '1px solid rgba(245, 158, 11, 0.3)'
          : (isMeWinner
            ? '1px solid rgba(34, 197, 94, 0.35)'
            : '1px solid rgba(239, 68, 68, 0.3)')
      }}>
        <Box sx={{ fontSize: 26, mb: 0.2 }}>
          {isDraw ? '🤝' : (isMeWinner ? '🎉' : '👑')}
        </Box>
        <Typography sx={{
          fontWeight: 900,
          fontSize: '1rem',
          color: isDraw ? '#fbbf24' : (isMeWinner ? '#4ade80' : '#f87171'),
          lineHeight: 1.2
        }}>
          {isDraw
            ? 'MATCH DRAW! SCORES TIED!'
            : (isMeWinner
              ? 'VICTORY! YOU WON!'
              : `${winnerName || 'Opponent'} WON!`)}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', mt: 0.3 }}>
          {isDraw
            ? 'Both players set equal high scores!'
            : (diff !== null
              ? `${winnerName || 'Winner'} won by ${diff} points!`
              : `${winnerName || 'Winner'} won the challenge!`)}
        </Typography>
      </Box>

      {/* SCORE MATCH TABLE: P1 vs P2 (Who Win / Who Lose) */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.2,
        borderRadius: 2.5,
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Player 1 Box */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.4,
          p: 0.8,
          borderRadius: 2,
          background: isP1Winner ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
          border: isP1Winner ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid transparent'
        }}>
          <Typography sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            maxWidth: 90,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {p1.username} {String(p1.id) === String(userId) ? '(You)' : ''}
          </Typography>
          <Typography sx={{
            fontSize: '1.2rem',
            fontWeight: 900,
            color: isP1Winner ? '#4ade80' : '#fbbf24',
            lineHeight: 1
          }}>
            ⭐ {p1Score ?? 0}
          </Typography>
          <Box sx={{
            px: 0.9, py: 0.2, borderRadius: 1,
            fontSize: 9, fontWeight: 900,
            bgcolor: isDraw ? 'rgba(245, 158, 11, 0.2)' : (isP1Winner ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.2)'),
            color: isDraw ? '#fbbf24' : (isP1Winner ? '#4ade80' : '#f87171')
          }}>
            {isDraw ? '🤝 DRAW' : (isP1Winner ? '👑 WIN' : '❌ LOSE')}
          </Box>
        </Box>

        {/* Center VS Indicator */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 1,
          flexShrink: 0
        }}>
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 1
          }}>
            VS
          </Typography>
          {diff !== null && (
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#00f2fe' }}>
              {isDraw ? '0' : `±${diff}`}
            </Typography>
          )}
        </Box>

        {/* Player 2 Box */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.4,
          p: 0.8,
          borderRadius: 2,
          background: isP2Winner ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
          border: isP2Winner ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid transparent'
        }}>
          <Typography sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            maxWidth: 90,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {p2.username} {String(p2.id) === String(userId) ? '(You)' : ''}
          </Typography>
          <Typography sx={{
            fontSize: '1.2rem',
            fontWeight: 900,
            color: isP2Winner ? '#4ade80' : '#fbbf24',
            lineHeight: 1
          }}>
            ⭐ {p2Score ?? 0}
          </Typography>
          <Box sx={{
            px: 0.9, py: 0.2, borderRadius: 1,
            fontSize: 9, fontWeight: 900,
            bgcolor: isDraw ? 'rgba(245, 158, 11, 0.2)' : (isP2Winner ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.2)'),
            color: isDraw ? '#fbbf24' : (isP2Winner ? '#4ade80' : '#f87171')
          }}>
            {isDraw ? '🤝 DRAW' : (isP2Winner ? '👑 WIN' : '❌ LOSE')}
          </Box>
        </Box>
      </Box>

      {/* Button to View Arena / Rematch */}
      {onOpenArena && (
        <Button
          variant="outlined"
          fullWidth
          size="small"
          onClick={() => onOpenArena(gameData)}
          sx={{
            py: 0.8,
            borderRadius: 2.5,
            borderColor: 'rgba(255, 255, 255, 0.25)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.82rem',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#00f2fe',
              bgcolor: 'rgba(0, 242, 254, 0.1)'
            }
          }}
        >
          🎮 View 3D Arena / Rematch
        </Button>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 5. MAIN GAME BUBBLE CONTROLLER
// ----------------------------------------------------
export const GameBubble = ({
  msg,
  userId,
  username,
  selectedUser,
  onSendGameMessage,
  isDarkTheme,
  onOpenArena,
  onAcceptGame,
  isLatest = true
}) => {
  const dark = isThemeDark(isDarkTheme);
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

  const { gameType, status, player1, player2, player1Id, player2Id, turnPlayerId, winnerId } = gameData;
  const resolvedP1Id = String(player1Id || player1?.id || player1?._id || '');
  const isInviter = gameType === 'rps' ? (String(userId) === String(player1Id)) : (String(userId) === resolvedP1Id);
  const oppName = gameType === 'rps'
    ? (selectedUser?.username || 'Opponent')
    : (isInviter ? (player2?.username || 'Opponent') : (player1?.username || 'Opponent'));

  const GAME_NAMES = {
    tictactoe: { name: 'Tic Tac Toe 3D', image: tictactoeImg, color: '#06b6d4' },
    fallingboxes: { name: 'Falling Boxes 3D', image: fallingboxesImg, color: '#f59e0b' },
    memorygame: { name: 'Memory Match 3D', image: memorygameImg, color: '#a855f7' },
    highstriker: { name: 'High Striker 3D', image: highstrikerImg, color: '#f97316' },
    dotsandboxes: { name: 'Dots & Boxes 3D', image: dotsandboxesImg, color: '#ef4444' },
    mathsquiz: { name: 'Maths Quiz 3D', image: mathsquizImg, color: '#22c55e' },
    findthematch: { name: 'Find The Match 3D', image: findthematchImg, color: '#00f2fe' },
    fruitcutting: { name: 'Fruit Cutter', image: fruitcuttingImg, color: '#f43f5e' },
    fluffyjump: { name: 'Fluffy Jump', image: fluffyjumpImg, color: '#10b981' },
    beerpong: { name: 'Coffee Pong 3D', image: coffeepongImg, color: '#3b82f6' },
    miniarchery: { name: 'Mini Archery', image: miniarcheryImg, color: '#10b981' },
    pogobowling: { name: 'Pogo Bowling 3D', image: bowlingImg, color: '#ec4899' },
    minigolf: { name: 'Mini Golf 3D', image: minigolfImg, color: '#22c55e' },
    carrace: { name: 'Car Race 3D', image: carraceImg, color: '#0ea5e9' },
    battleship: { name: 'Battleship Sea 3D', image: battleshipImg, color: '#38bdf8' },
    watersort: { name: 'Water Sort 3D', image: watersortImg, color: '#f97316' },
    snakeladder: { name: 'Krakens & Ships 3D', image: snakeladderImg, color: '#0284c7' },
    wordgame: { name: 'Word Search 3D', image: wordsearchImg, color: '#06b6d4' },
    spacebattle: { name: 'Space Battle 3D', image: spacebattleImg, color: '#8b5cf6' },
    jumpchicken: { name: 'Chicken Jumper 3D', image: chickenjumpImg, color: '#facc15' },
    rps: { name: 'Rock Paper Scissors 3D', image: rpsImg, color: '#3b82f6' },
    truthordare: { name: 'Truth or Dare 3D', image: truthordareImg, color: '#ec4899' }
  };

  const gameInfo = GAME_NAMES[gameType] || { name: gameType, image: GAME_IMAGES[gameType], icon: '🎮', color: '#00f2fe' };

  // 1. Invite View
  if (status === 'invited') {
    if (!isLatest) {
      return (
        <Box sx={{
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.2
        }}>
          <GameIcon image={gameInfo.image} icon={gameInfo.icon} size={28} />
          <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)', fontWeight: 600 }}>
            {gameInfo.name} • Invitation accepted
          </Typography>
        </Box>
      );
    }

    const handleAccept = () => {
      let activeData = { ...gameData, status: 'active' };
      if (gameType === 'tictactoe') {
        activeData.board = Array(9).fill(null);
        activeData.turn = 'X';
        activeData.turnPlayerId = player1.id;
      } else if (gameType === 'truthordare') {
        activeData.turnPlayerId = userId;
        activeData.selectedCategory = null;
        activeData.prompt = null;
        activeData.answered = false;
        activeData.scores = { [player1.id]: 0, [player2.id]: 0 };
        activeData.turnsPlayed = 0;
        activeData.usedTruths = [];
      } else if (gameType === 'rps') {
        activeData.player1Selected = false;
        activeData.player2Selected = false;
      } else if (gameType === 'dotsandboxes') {
        const p1Id = String(player1?.id || player1?._id || player1Id || '');
        const p2Id = String(player2?.id || player2?._id || player2Id || '');
        activeData.hLines = Array(12).fill(false);
        activeData.vLines = Array(12).fill(false);
        activeData.boxOwners = Array(9).fill(null);
        activeData.scores = { [p1Id]: 0, [p2Id]: 0 };
        activeData.turnPlayerId = p1Id;
        activeData.player1Id = p1Id;
        activeData.player2Id = p2Id;
      } else if (gameType === 'memorygame') {
        activeData.flipped = [];
        activeData.matched = [];
        activeData.scores = { [player1.id]: 0, [player2.id]: 0 };
        activeData.turnPlayerId = player1.id;
      } else if (gameType === 'highstriker') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'fallingboxes') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'mathsquiz') {
        activeData.currentQuestion = generateQuestion();
        activeData.roundNum = 0;
        activeData.p1Score = 0;
        activeData.p2Score = 0;
        activeData.phase = 'answering';
        activeData.p1Answer = null;
        activeData.p2Answer = null;
        activeData.questionStartedAt = Date.now();
        activeData.turnPlayerId = player1.id;
      } else if (gameType === 'findthematch') {
        activeData.currentRound = generateFindPairRound();
        activeData.roundNum = 0;
        activeData.p1Score = 0;
        activeData.p2Score = 0;
        activeData.p1Pick = null;
        activeData.p2Pick = null;
        activeData.phase = 'playing';
        activeData.roundAttempts = 0;
        activeData.selectedTileIds = [];
        activeData.turnPlayerId = player1.id;
      } else if (gameType === 'fruitcutting') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'fluffyjump') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'beerpong') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'miniarchery') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'pogobowling') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'minigolf') {
        activeData.phase = 'p2';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'carrace') {
        activeData.phase = 'p2_racing';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'battleship') {
        activeData.turnPlayerId = player1.id;
      } else if (gameType === 'watersort') {
        activeData.phase = 'p2_sorting';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'snakeladder') {
        activeData.p1Pos = 1;
        activeData.p2Pos = 1;
        activeData.turnPlayerId = player1.id;
      } else if (gameType === 'wordgame') {
        activeData.phase = 'p2_finding';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'spacebattle') {
        activeData.phase = 'p2_battle';
        activeData.turnPlayerId = userId;
      } else if (gameType === 'jumpchicken') {
        activeData.phase = 'p2_jumping';
        activeData.turnPlayerId = userId;
      }

      if (isChallengeGameType(gameType)) {
        const extractedP1 = extractChallengeScores(gameData).p1Score;
        if (extractedP1 !== null && extractedP1 !== undefined) {
          activeData.p1Score = extractedP1;
          activeData.p1TotalScore = extractedP1;
          activeData.p1FinalScore = extractedP1;
        }
      }

      if (onAcceptGame) {
        onAcceptGame(activeData);
      } else {
        onSendGameMessage(activeData);
      }
    };

    return (
      <Box sx={{
        p: 2,
        width: '100%',
        maxWidth: '100%',
        borderRadius: 3.5,
        background: 'linear-gradient(135deg, rgba(20, 26, 56, 0.95) 0%, rgba(10, 14, 32, 0.98) 100%)',
        border: '1.5px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(6, 182, 212, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        color: '#fff'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
          <GameIcon image={gameInfo.image} icon={gameInfo.icon} size={36} glow="rgba(255,255,255,0.4)" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.1,
              fontSize: '0.95rem'
            }}>
              {gameInfo.name}
            </Typography>
            {isChallengeGameType(gameType) && extractChallengeScores(gameData).p1Score !== null ? (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" sx={{
                  color: isInviter ? '#38bdf8' : '#fbbf24',
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.78rem'
                }}>
                  {isInviter
                    ? `🚀 You scored ⭐ ${extractChallengeScores(gameData).p1Score}! Waiting for ${oppName} to beat it...`
                    : `🎯 ${oppName} scored ⭐ ${extractChallengeScores(gameData).p1Score}! Can you beat it?`
                  }
                </Typography>
                {!isInviter && (
                  <Box sx={{
                    mt: 0.8,
                    p: 0.8,
                    borderRadius: 2,
                    bgcolor: 'rgba(251, 191, 36, 0.12)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    textAlign: 'center'
                  }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24' }}>
                      🎯 TARGET TO BEAT: ⭐ {extractChallengeScores(gameData).p1Score}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: gameData.mode === 'chat' ? '#00f2fe' : 'rgba(255,255,255,0.6)', display: 'block', mt: 0.3, fontWeight: gameData.mode === 'chat' ? 700 : 400 }}>
                {gameData.mode === 'chat'
                  ? `💬 Play While Chat • ${isInviter ? `Challenged ${oppName}` : `${oppName} challenged you!`}`
                  : (isInviter ? `Challenged ${oppName}` : `${oppName} challenged you!`)}
              </Typography>
            )}
          </Box>
        </Box>

        {!isInviter ? (
          <Box sx={{ display: 'flex', gap: 1.2, width: '100%', mt: 0.5 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleAccept}
              sx={{
                flex: 1.6,
                py: 1,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#000',
                fontWeight: 900,
                fontSize: '0.85rem',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00d2de 0%, #3e9cee 100%)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {gameData.mode === 'chat'
                ? '💬 Accept & Play in Chat'
                : (isChallengeGameType(gameType) ? '⚡ Accept & Play Challenge' : '⚡ Accept & Play')}
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSendGameMessage({ ...gameData, status: 'declined' })}
              sx={{
                flex: 1,
                py: 1,
                borderRadius: 2.5,
                borderColor: 'rgba(244, 67, 54, 0.4)',
                color: '#ff4d6d',
                fontWeight: 700,
                fontSize: '0.82rem',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#f44336',
                  bgcolor: 'rgba(244, 67, 54, 0.1)'
                }
              }}
            >
              Decline
            </Button>
          </Box>
        ) : (
          <Box sx={{
            width: '100%',
            py: 1,
            px: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px dashed rgba(255,255,255,0.15)',
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{
              fontStyle: 'italic',
              color: '#00f2fe',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.6
            }}>
              ⏳ Waiting for {oppName} to accept...
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // 2. Declined View
  if (status === 'declined') {
    return (
      <Box sx={{
        p: 1.5,
        minWidth: 200,
        borderRadius: 2.5,
        bgcolor: 'rgba(244, 67, 54, 0.1)',
        border: '1px solid rgba(244, 67, 54, 0.25)',
        textAlign: 'center'
      }}>
        <Typography variant="caption" sx={{ color: '#ff4d6d', fontWeight: 600 }}>
          ❌ Game challenge was declined.
        </Typography>
      </Box>
    );
  }

  // 2.5 Ended View
  if (status === 'ended') {
    if (isChallengeGameType(gameType) && (winnerId || gameData.p1Score !== null || gameData.p2Score !== null)) {
      return (
        <ChallengeScoreMatchCard
          gameData={gameData}
          userId={userId}
          oppName={oppName}
          gameInfo={gameInfo}
          onOpenArena={onOpenArena}
        />
      );
    }
    if (winnerId) {
      const isWinner = winnerId === userId;
      const isDraw = winnerId === 'draw' || winnerId === 'tie';
      return (
        <Box sx={{
          p: 2,
          width: '100%',
          maxWidth: '100%',
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #141a38 0%, #0a0e20 100%)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.2,
          color: '#fff',
          backdropFilter: 'none',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
            <Box sx={{ fontSize: 30 }}>
              {isDraw ? '🤝' : (isWinner ? '🏆' : '👑')}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{
                fontWeight: 800,
                color: isDraw ? '#f59e0b' : (isWinner ? '#ffd700' : '#00f2fe'),
                lineHeight: 1.1
              }}>
                {isDraw ? 'Match Draw!' : (isWinner ? 'You Won! 🎉' : `${oppName} Won! 👑`)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 0.3 }}>
                {gameInfo.name} • Match Ended
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    // Game closed without a winner (mid-game close)
    const isMe = gameData.endedBy === userId;
    const enderName = isMe ? 'You' : (gameData.endedByUsername || oppName);
    return (
      <Box sx={{
        p: 1.6,
        width: '100%',
        maxWidth: '100%',
        borderRadius: 3,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.4,
      }}>
        {/* Game icon circle */}
        <Box sx={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <GameIcon image={gameInfo.image} icon={gameInfo.icon} size={24} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontWeight: 700,
            fontSize: '0.82rem',
            color: '#fff',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {gameInfo.name} <Typography component="span" sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>Ended</Typography>
          </Typography>
          <Typography sx={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.5)',
            mt: 0.3,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}>
            🛑 Closed by {enderName}
          </Typography>
        </Box>
      </Box>
    );
  }

  // 3. Active View (Compact 3D Arena Trigger Card)
  if (status === 'active') {
    const isMyTurn = String(turnPlayerId) === String(userId);

    if (onOpenArena && gameData.mode !== 'chat') {
      return (
        <Box sx={{
          p: 2,
          width: '100%',
          maxWidth: '100%',
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, rgba(20, 26, 56, 0.95) 0%, rgba(10, 14, 32, 0.98) 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 25px rgba(6, 182, 212, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          color: '#fff'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
            <GameIcon image={gameInfo.image} icon={gameInfo.icon} size={34} glow="rgba(255,255,255,0.4)" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                {gameInfo.name}
              </Typography>
              <Typography variant="caption" sx={{
                color: isMyTurn ? '#22c55e' : '#f59e0b',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.3
              }}>
                ● {isMyTurn ? (gameType === 'truthordare' ? 'Your Turn!' : 'Your Turn to Move!') : `Waiting for ${oppName}...`}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={() => onOpenArena(gameData)}
            sx={{
              py: 1,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.85rem',
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00d2de 0%, #3e9cee 100%)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            🚀 Open 3D Game Arena
          </Button>
        </Box>
      );
    }
  }

  // 4. Finished View
  if (status === 'finished') {
    if (isChallengeGameType(gameType)) {
      return (
        <ChallengeScoreMatchCard
          gameData={gameData}
          userId={userId}
          oppName={oppName}
          gameInfo={gameInfo}
          onOpenArena={onOpenArena}
        />
      );
    }

    const isWinner = winnerId === userId;
    const isDraw = winnerId === 'draw' || winnerId === 'tie';

    if (onOpenArena && gameData.mode !== 'chat') {
      return (
        <Box sx={{
          p: 2,
          width: '100%',
          maxWidth: '100%',
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, rgba(20, 26, 56, 0.95) 0%, rgba(10, 14, 32, 0.98) 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          color: '#fff'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
            <Box sx={{ fontSize: 32 }}>
              {isDraw ? '🤝' : (isWinner ? '🏆' : '👑')}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{
                fontWeight: 800,
                color: isDraw ? '#f59e0b' : (isWinner ? '#ffd700' : '#00f2fe'),
                lineHeight: 1.1
              }}>
                {isDraw ? 'Match Draw!' : (isWinner ? 'You Won! 🎉' : `${oppName} Won! 👑`)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 0.3 }}>
                {gameInfo.name} Completed
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            size="small"
            onClick={() => onOpenArena(gameData)}
            sx={{
              py: 0.8,
              borderRadius: 2.5,
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#00f2fe',
                bgcolor: 'rgba(0, 242, 254, 0.1)'
              }
            }}
          >
            🎮 View 3D Arena / Rematch
          </Button>
        </Box>
      );
    }
  }

  // Fallback inline active game views if onOpenArena is not provided
  if (gameType === 'tictactoe') {
    return <TicTacToeGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={dark} isLatest={isLatest} />;
  }
  if (gameType === 'truthordare') {
    return <TruthOrDareGame gameData={gameData} userId={userId} username={username} onSendGameMessage={onSendGameMessage} isDarkTheme={dark} />;
  }
  if (gameType === 'rps') {
    return <RockPaperScissorsGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={dark} isLatest={isLatest} />;
  }
  if (gameType === 'dotsandboxes') {
    return (
      <DotsAndBoxesGame
        gameData={{
          ...gameData,
          player1: player1 || { id: player1Id },
          player2: player2 || { id: player2Id },
          player1Id: player1?.id || player1?._id || player1Id,
          player2Id: player2?.id || player2?._id || player2Id
        }}
        userId={userId}
        onSendGameMessage={onSendGameMessage}
        isDarkTheme={dark}
        isLatest={isLatest}
      />
    );
  }
  if (gameType === 'memorygame') {
    return <MemoryGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'highstriker') {
    return <HighStrikerGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'fallingboxes') {
    return <FallingBoxesGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'mathsquiz') {
    return <MathsQuizGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'findthematch') {
    return <FindTheMatchGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'fruitcutting') {
    return <FruitCuttingGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'fluffyjump') {
    return <FluffyJumpGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'beerpong') {
    return <CoffeePongGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'miniarchery') {
    return <MiniArcheryGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'pogobowling') {
    return <PogoBowlingGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'minigolf') {
    return <MiniGolfGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'carrace') {
    return <CarRaceGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'battleship') {
    return <BattleShipGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'watersort') {
    return <WaterSortGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'snakeladder') {
    return <SnakeLadderGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'wordgame') {
    return <WordGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'spacebattle') {
    return <SpaceBattleGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }
  if (gameType === 'jumpchicken') {
    return <JumpChickenGame gameData={gameData} userId={userId} onSendGameMessage={onSendGameMessage} isDarkTheme={isDarkTheme} />;
  }

  return null;
};