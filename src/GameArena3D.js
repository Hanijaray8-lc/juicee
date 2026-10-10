import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, Box, Typography, Button, IconButton, Avatar, Tooltip,
  Zoom, Fade, Card, CardContent, useTheme, useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Import subgame components from Games/ and Game.js
import { DotsAndBoxesGame, dotsAndBoxesInitialData } from './Games/DotsAndBoxes';
import { MemoryGame, memoryGameInitialData } from './Games/MemoryGame';
import { HighStrikerGame, highStrikerInitialData } from './Games/HighStriker';
import { FallingBoxesGame, fallingBoxesInitialData } from './Games/FallingBoxes';
import { MathsQuizGame, mathsQuizInitialData } from './Games/MathsQuiz';
import { FindTheMatchGame, findTheMatchInitialData } from './Games/FindTheMatch';
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
import { TruthOrDareGame } from './Game';

// Web Audio API Sound Synthesizer for instant, zero-lag 3D arcade audio FX
const playSynthSound = (type, soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'score' || type === 'turn') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.09); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'win') {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        gain.gain.setValueAtTime(0.15, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.22);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.22);
      });
    }
  } catch (e) {
    // Audio context not allowed or failed, ignore gracefully
  }
};

// Friendly Game Titles and Emojis
export const GAME_INFO_MAP = {
  tictactoe: { name: 'Tic Tac Toe 3D', icon: '❌⭕', color: '#06b6d4' },
  fallingboxes: { name: 'Falling Boxes 3D', icon: '🔴🟡', color: '#f59e0b' },
  memorygame: { name: 'Memory Match 3D', icon: '🃏✨', color: '#a855f7' },
  highstriker: { name: 'High Striker 3D', icon: '🔔⚡', color: '#f97316' },
  dotsandboxes: { name: 'Dots & Boxes 3D', icon: '🔴🔵', color: '#ef4444' },
  mathsquiz: { name: 'Maths Quiz 3D', icon: '🧮⚡', color: '#22c55e' },
  findthematch: { name: 'Find The Match 3D', icon: '🔍🎯', color: '#00f2fe' },
  fruitcutting: { name: 'Fruit Cutter', icon: '🍉⚔️', color: '#f43f5e' },
  fluffyjump: { name: 'Fluffy Jump', icon: '🐤🪶', color: '#10b981' },
  beerpong: { name: 'Coffee Pong 3D', icon: '🍺🏓', color: '#3b82f6' },
  miniarchery: { name: 'Mini Archery', icon: '🏹🎯', color: '#10b981' },
  pogobowling: { name: 'Pogo Bowling 3D', icon: '🎳✨', color: '#ec4899' },
  minigolf: { name: 'Mini Golf 3D', icon: '⛳🏌️', color: '#22c55e' },
  carrace: { name: 'Car Race 3D', icon: '🏎️⚡', color: '#00f2fe' },
  battleship: { name: 'Battleship Sea 3D', icon: '🚢⚓', color: '#38bdf8' },
  watersort: { name: 'Water Sort 3D', icon: '🧪💧', color: '#f97316' },
  snakeladder: { name: 'Krakens & Ships 3D', icon: '🐙🚢', color: '#0284c7' },
  wordgame: { name: 'Word Search 3D', icon: '🔤🔍', color: '#06b6d4' },
  spacebattle: { name: 'Space Battle 3D', icon: '🚀👾', color: '#8b5cf6' },
  jumpchicken: { name: 'Chicken Jumper 3D', icon: '🐔🪶', color: '#facc15' },
  rps: { name: 'Rock Paper Scissors 3D', icon: '✊✋✌️', color: '#3b82f6' },
  truthordare: { name: 'Truth or Dare 3D', icon: '📜⚡', color: '#ec4899' }
};

// ============================================================
// HOW TO PLAY DATA — one entry per gameType
// ============================================================
const GAME_HOW_TO_PLAY = {
  tictactoe: {
    emoji: '❌⭕',
    steps: [
      'Players take turns placing ❌ or ⭕ on the 3×3 grid.',
      'First player to get 3 in a row (horizontal, vertical, or diagonal) wins!',
      'If all 9 cells are filled with no winner, it\'s a draw 🤝',
    ],
    tip: 'Control the center cell for the best strategic advantage!',
  },
  rps: {
    emoji: '✊✋✌️',
    steps: [
      'Both players secretly choose Rock ✊, Paper ✋, or Scissors ✌️.',
      'Rock beats Scissors | Paper beats Rock | Scissors beats Paper.',
      'Both choices are revealed simultaneously — fastest fingers win! ⚡',
    ],
    tip: 'Your choice is hidden until your opponent also picks — no peeking! 🙈',
  },
  truthordare: {
    emoji: '📜⚡',
    steps: [
      'On your turn, choose Truth 📜 or Dare ⚡.',
      'Truth → a random question is generated; type your honest answer.',
      'Dare → your opponent writes a custom dare challenge for you!',
      'After answering, the turn switches to your opponent.',
    ],
    tip: 'Be creative with your dares — keep it fun and friendly! 😄',
  },
  dotsandboxes: {
    emoji: '🔴🔵',
    steps: [
      'Players take turns drawing one line between two adjacent dots.',
      'Complete the 4th side of a box to claim it — your color fills it!',
      'Completing a box earns you a bonus turn — chain them!',
      'The player with the most boxes when all lines are drawn wins 🏆',
    ],
    tip: 'Avoid creating the 3rd side of a box — your opponent will complete it!',
  },
  memorygame: {
    emoji: '🃏✨',
    steps: [
      'All cards are face-down on the grid at the start.',
      'On your turn, flip two cards — if they match, you score a point and go again!',
      'If they don\'t match, they flip back and your turn ends.',
      'The player who finds the most matching pairs wins!',
    ],
    tip: 'Remember the positions of flipped cards — visual memory is key! 🧠',
  },
  highstriker: {
    emoji: '🔔⚡',
    steps: [
      'A strength bar rapidly charges up — tap at the perfect moment!',
      'The closer you tap to the max, the higher your score.',
      'Each player takes their turn — the one with the highest hit wins the round.',
      'Win 2 out of 3 rounds to claim victory! 🔔',
    ],
    tip: 'Wait for the bar to peak just before the very top for maximum power! 💪',
  },
  fallingboxes: {
    emoji: '🔴🟡',
    steps: [
      'Colored boxes fall from the top — tap them before they reach the bottom!',
      'Each successful tap earns you points.',
      'Player with the most points at end of all rounds wins! 🏆',
    ],
    tip: 'Tap faster in the last few seconds — that\'s when points are highest!',
  },
  mathsquiz: {
    emoji: '🧮⚡',
    steps: [
      'A math question appears for both players simultaneously.',
      'First to tap the correct answer earns a point! ⚡',
      'Answer as many questions correctly as possible in the time limit.',
      'Most points after all rounds wins!',
    ],
    tip: 'Mental math shortcut: round numbers first, then adjust! 🧠',
  },
  findthematch: {
    emoji: '🔍🎯',
    steps: [
      'A grid of items appears — find the one that matches the target shown!',
      'First player to tap the correct match earns the point.',
      'Rounds are quick — speed AND accuracy matter.',
      'Most correct matches wins the game! 🎯',
    ],
    tip: 'Focus on the target shape first, then scan the grid rapidly!',
  },
  fruitcutting: {
    emoji: '🍉⚔️',
    steps: [
      'Fruits fly across the screen — swipe your blade to slice them!',
      'Each sliced fruit scores points. Don\'t miss! 🍉',
      'Avoid bombs 💣 — slicing one ends your run early.',
      'Highest score after all rounds wins!',
    ],
    tip: 'Swipe diagonally to cut multiple fruits in one stroke for a combo bonus! ⚔️',
  },
  fluffyjump: {
    emoji: '🐤🪶',
    steps: [
      'Your fluffy character jumps automatically — tap to boost higher!',
      'Avoid obstacles and gaps between platforms.',
      'The farther you jump, the more points you score.',
      'Highest distance after your round wins the duel! 🐤',
    ],
    tip: 'Time your taps rhythmically — too many rapid taps cause erratic jumping!',
  },
  beerpong: {
    emoji: '🍺🏓',
    steps: [
      'Aim your shot using the angle and power slider.',
      'Release at the right moment to arc the ball into the cup! 🏓',
      'Sink as many cups as possible in your round.',
      'Player who sinks the most cups wins!',
    ],
    tip: 'Slightly over-power your shot — cups have a rim-catch mechanic! ☕',
  },
  miniarchery: {
    emoji: '🏹🎯',
    steps: [
      'Draw back your bow — hold and release to fire an arrow! 🏹',
      'Aim for the bullseye: outer rings = 1pt, inner = 5pt, center = 10pt.',
      'Wind direction shown at the top — adjust your aim accordingly!',
      'Most points after all arrows wins!',
    ],
    tip: 'Always account for wind — aim slightly against the wind direction!',
  },
  pogobowling: {
    emoji: '🎳✨',
    steps: [
      'Bounce your pogo-ball down the lane by timing your hops!',
      'Hit as many pins as possible — strike = 10 pins = bonus! 🎳',
      'Two rolls per frame — aim for spares after a non-strike first roll.',
      'Most pins knocked wins!',
    ],
    tip: 'Aim slightly off-center to hit the head pin at an angle for more pin action!',
  },
  minigolf: {
    emoji: '⛳🏌️',
    steps: [
      'Aim the direction arrow at the hole and set your shot power.',
      'Tap and drag to charge — release to putt! 🏌️',
      'Fewest strokes to get the ball in the hole wins each hole.',
      'Lowest total score across all holes wins the match!',
    ],
    tip: 'Use the walls as bumpers — bank shots can be very effective!',
  },
  carrace: {
    emoji: '🏎️⚡',
    steps: [
      'Steer your car with tilt or arrow controls — avoid obstacles!',
      'Collect speed boosts ⚡ for a burst of acceleration.',
      'Race as far as possible before crashing or time runs out.',
      'Player 1 sets the score, Player 2 must beat it to win! 🏁',
    ],
    tip: 'Hug the inside of curves to maintain higher speed through turns!',
  },
  battleship: {
    emoji: '🚢⚓',
    steps: [
      'Place your fleet of ships on your grid — they stay hidden from your opponent.',
      'Take turns firing shots at coordinates on the enemy grid.',
      'HIT 🔴 means you found a ship — MISS ⚪ means open water.',
      'First to sink all of the opponent\'s ships wins! 🚢',
    ],
    tip: 'After a hit, fire around the adjacent cells systematically to sink the whole ship!',
  },
  watersort: {
    emoji: '🧪💧',
    steps: [
      'Sort the colored liquids so each test tube contains only one color.',
      'Tap a tube to pick it up, then tap the destination tube to pour.',
      'You can only pour onto an empty tube or a tube with the same color on top.',
      'Solve faster than your opponent to win! 🧪',
    ],
    tip: 'Create empty tube buffers early — they give you critical extra space to maneuver!',
  },
  snakeladder: {
    emoji: '🐙🚢',
    steps: [
      'Roll the dice on your turn to navigate across the sea tiles.',
      'Land on an anchor ⚓ → sail your ship 🚢 forward to a higher tile!',
      'Land on a Kraken 🐙 → get attacked and dragged down into the abyss!',
      'First captain to reach tile 100 WIN treasure chest wins! 🏆',
    ],
    tip: 'Catch the anchors to sail past dangerous Krakens! 🌊',
  },
  wordgame: {
    emoji: '🔤🔍',
    steps: [
      'A grid of letters appears — find the hidden words!',
      'Tap the first letter, then drag to the last to select a word.',
      'Find as many words as possible — longer words = more points! 🔤',
      'Player with the most points when time runs out wins!',
    ],
    tip: 'Scan diagonals — hidden words often run at angles!',
  },
  spacebattle: {
    emoji: '🚀👾',
    steps: [
      'Control your spaceship and shoot incoming alien invaders! 🚀',
      'Dodge enemy fire — one hit and you lose a life.',
      'Destroy waves of aliens and bosses for maximum points.',
      'Player who survives the longest / scores most wins! 👾',
    ],
    tip: 'Stay mobile — a stationary ship is an easy target for enemy shots!',
  },
  jumpchicken: {
    emoji: '🐔🪶',
    steps: [
      'Your chicken runs automatically — tap to jump over obstacles!',
      'Double-tap quickly for a double jump to clear tall barriers.',
      'The farther your chicken runs, the higher the score. 🐔',
      'Outlast your opponent\'s score to win the round!',
    ],
    tip: 'Save your double jump for the last moment — it refreshes after landing!',
  },
};

// ============================================================
// HOW TO PLAY CARD COMPONENT (first-time overlay)
// ============================================================
const HowToPlayCard = ({ gameType, gameInfo, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the arena dialog finishes mounting
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  const instructions = GAME_HOW_TO_PLAY[gameType];
  if (!instructions) {
    onDismiss();
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 280);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(18px)',
        background: 'rgba(5, 7, 20, 0.82)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease',
        p: 2,
        pt: { xs: 'calc(max(env(safe-area-inset-top, 0px), 38px) + 12px)', sm: 2 },
        pb: { xs: 'calc(max(env(safe-area-inset-bottom, 0px), 12px) + 12px)', sm: 2 },
      }}
    >
      {/* Card */}
      <Box
        sx={{
          maxWidth: 380,
          width: '100%',
          maxHeight: { xs: '85vh', sm: '90vh' },
          borderRadius: 4,
          background: 'linear-gradient(145deg, rgba(20,26,60,0.97) 0%, rgba(10,14,36,0.99) 100%)',
          border: `1.5px solid ${gameInfo.color}55`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 30px 70px rgba(0,0,0,0.7), 0 0 40px ${gameInfo.color}33`,
          p: { xs: 2.5, sm: 3.5 },
          position: 'relative',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
          transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Top glow blob */}
        <Box sx={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 260,
          height: 130,
          background: `radial-gradient(circle, ${gameInfo.color}55 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }} />

        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, position: 'relative' }}>
          <Box sx={{
            fontSize: 38,
            lineHeight: 1,
            filter: `drop-shadow(0 0 12px ${gameInfo.color}99)`,
            animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {instructions.emoji}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{
              fontWeight: 900,
              fontSize: { xs: '1rem', sm: '1.15rem' },
              background: `linear-gradient(90deg, #fff 0%, ${gameInfo.color} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}>
              How to Play
            </Typography>
            <Typography sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: gameInfo.color,
              letterSpacing: 0.5,
              mt: 0.3,
            }}>
              {gameInfo.name}
            </Typography>
          </Box>
          {/* New Player badge */}
          <Box sx={{
            px: 1.2,
            py: 0.4,
            borderRadius: 2,
            background: `${gameInfo.color}22`,
            border: `1px solid ${gameInfo.color}55`,
            flexShrink: 0,
          }}>
            <Typography sx={{ fontSize: 9, fontWeight: 800, color: gameInfo.color, letterSpacing: 0.8 }}>
              NEW PLAYER
            </Typography>
          </Box>
        </Box>

        {/* Steps */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4, mb: 2.5, position: 'relative' }}>
          {instructions.steps.map((step, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
              {/* Step number bubble */}
              <Box sx={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${gameInfo.color}cc, ${gameInfo.color}66)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 0.1,
                boxShadow: `0 0 8px ${gameInfo.color}55`,
              }}>
                <Typography sx={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{i + 1}</Typography>
              </Box>
              <Typography sx={{
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.55,
                flex: 1,
              }}>
                {step}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Pro tip */}
        <Box sx={{
          p: 1.5,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${gameInfo.color}18 0%, rgba(255,255,255,0.03) 100%)`,
          border: `1px solid ${gameInfo.color}33`,
          mb: 2.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          position: 'relative',
        }}>
          <Typography sx={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>💡</Typography>
          <Box>
            <Typography sx={{ fontSize: 9, fontWeight: 800, color: gameInfo.color, letterSpacing: 1, mb: 0.3 }}>
              PRO TIP
            </Typography>
            <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.78rem' }, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              {instructions.tip}
            </Typography>
          </Box>
        </Box>

        {/* CTA button */}
        <Button
          fullWidth
          onClick={handleDismiss}
          sx={{
            py: 1.4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${gameInfo.color} 0%, ${gameInfo.color}bb 100%)`,
            color: '#000',
            fontWeight: 900,
            fontSize: { xs: '0.9rem', sm: '0.95rem' },
            textTransform: 'none',
            boxShadow: `0 8px 25px ${gameInfo.color}55`,
            position: 'relative',
            '&:hover': {
              background: `linear-gradient(135deg, ${gameInfo.color}dd 0%, ${gameInfo.color}99 100%)`,
              transform: 'translateY(-2px)',
              boxShadow: `0 12px 30px ${gameInfo.color}66`,
            },
            transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          🎮 Got it — Let's Play!
        </Button>

        {/* Fine print */}
        <Typography sx={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', mt: 1.2 }}>
          This guide only shows once per game ✨
        </Typography>
      </Box>
    </Box>
  );
};

// Check Tic Tac Toe winner helper
const checkTicTacToeWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', line: null };
  }
  return null;
};

// Dedicated 3D Tic Tac Toe Board
const TicTacToe3D = ({ gameData, userId, onSendGameMessage, soundEnabled }) => {
  const { board, turn, turnPlayerId, status, player1, player2 } = gameData;
  const isMyTurn = status === 'active' && turnPlayerId === userId;
  const isP1 = userId === player1?.id;
  const mySymbol = isP1 ? 'X' : 'O';

  const winResult = checkTicTacToeWinner(board || Array(9).fill(null));
  const winLine = winResult?.line || [];

  const handleCellClick = (idx) => {
    if (!isMyTurn || board[idx] !== null) return;
    playSynthSound('move', soundEnabled);

    const newBoard = [...board];
    newBoard[idx] = mySymbol;

    const res = checkTicTacToeWinner(newBoard);
    const nextGameData = { ...gameData };

    if (res) {
      nextGameData.status = 'finished';
      nextGameData.board = newBoard;
      nextGameData.winnerSymbol = res.winner;
      nextGameData.winnerId = res.winner === 'draw' ? 'draw' : (res.winner === 'X' ? player1.id : player2.id);
      playSynthSound('win', soundEnabled);
    } else {
      nextGameData.board = newBoard;
      nextGameData.turn = turn === 'X' ? 'O' : 'X';
      nextGameData.turnPlayerId = isP1 ? player2.id : player1.id;
    }

    onSendGameMessage(nextGameData);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      perspective: '1000px'
    }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1.8,
        width: { xs: 260, sm: 300 },
        height: { xs: 260, sm: 300 },
        p: 2,
        borderRadius: 4,
        background: 'linear-gradient(145deg, rgba(25, 30, 60, 0.8) 0%, rgba(10, 15, 35, 0.9) 100%)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.12)',
        transform: 'rotateX(10deg)',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s ease'
      }}>
        {(board || Array(9).fill(null)).map((cell, idx) => {
          const isWinningCell = winLine.includes(idx);
          const isPlayable = isMyTurn && cell === null;

          return (
            <Box
              key={idx}
              onClick={() => handleCellClick(idx)}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: 2.5,
                background: cell
                  ? (cell === 'X'
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.4) 100%)'
                    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(14, 116, 144, 0.4) 100%)')
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                border: '1.5px solid',
                borderColor: isWinningCell
                  ? '#ffdd00'
                  : (cell
                    ? (cell === 'X' ? '#ef4444' : '#06b6d4')
                    : (isPlayable ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)')),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlayable ? 'pointer' : 'default',
                transformStyle: 'preserve-3d',
                boxShadow: isWinningCell
                  ? '0 0 25px #ffdd00, inset 0 0 15px rgba(255,221,0,0.5)'
                  : (cell
                    ? '0 8px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)'
                    : '0 4px 10px rgba(0,0,0,0.2)'),
                transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': isPlayable ? {
                  transform: 'translateZ(14px) scale(1.05)',
                  borderColor: mySymbol === 'X' ? '#ef4444' : '#06b6d4',
                  boxShadow: `0 12px 24px rgba(0,0,0,0.5), 0 0 18px ${mySymbol === 'X' ? 'rgba(239,68,68,0.5)' : 'rgba(6,182,212,0.5)'}`,
                  background: 'rgba(255,255,255,0.1)'
                } : {},
                '&:active': isPlayable ? {
                  transform: 'translateZ(4px) scale(0.97)'
                } : {}
              }}
            >
              {cell && (
                <Typography sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem' },
                  fontWeight: 900,
                  lineHeight: 1,
                  color: cell === 'X' ? '#ff4d6d' : '#00f2fe',
                  textShadow: cell === 'X' ? '0 0 20px rgba(255, 77, 109, 0.6)' : '0 0 20px rgba(0, 242, 254, 0.6)',
                  transform: 'translateZ(10px)'
                }}>
                  {cell}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// Dedicated 3D Rock Paper Scissors
const RockPaperScissors3D = ({ gameData, userId, onSendGameMessage, soundEnabled }) => {
  const { status, player1Id, player2Id, player1Selected, player2Selected, player1Move, player2Move, winnerId } = gameData;
  const isP1 = String(userId) === String(player1Id);
  const mySelected = isP1 ? player1Selected : player2Selected;
  const oppSelected = isP1 ? player2Selected : player1Selected;
  const myMove = isP1 ? player1Move : player2Move;
  const oppMove = isP1 ? player2Move : player1Move;

  const handleChoice = (choice) => {
    playSynthSound('move', soundEnabled);

    const nextGameData = {
      ...gameData,
      ...(isP1
        ? { player1Selected: true, player1Move: choice }
        : { player2Selected: true, player2Move: choice })
    };

    const p1M = isP1 ? choice : player1Move;
    const p2M = !isP1 ? choice : player2Move;

    if (p1M && p2M) {
      let calculatedWinner = 'draw';
      if (p1M !== p2M) {
        if (
          (p1M === 'rock' && p2M === 'scissors') ||
          (p1M === 'paper' && p2M === 'rock') ||
          (p1M === 'scissors' && p2M === 'paper')
        ) {
          calculatedWinner = player1Id;
        } else {
          calculatedWinner = player2Id;
        }
      }
      playSynthSound('win', soundEnabled);
      nextGameData.status = 'finished';
      nextGameData.winnerId = calculatedWinner;
      nextGameData.player1Move = p1M;
      nextGameData.player2Move = p2M;

      const p1Prev = gameData.scores?.[player1Id] ?? (gameData.p1Score ?? 0);
      const p2Prev = gameData.scores?.[player2Id] ?? (gameData.p2Score ?? 0);
      const p1New = calculatedWinner === player1Id ? p1Prev + 1 : p1Prev;
      const p2New = calculatedWinner === player2Id ? p2Prev + 1 : p2Prev;
      nextGameData.scores = { [player1Id]: p1New, [player2Id]: p2New };
      nextGameData.p1Score = p1New;
      nextGameData.p2Score = p2New;
    }

    onSendGameMessage(nextGameData);
  };

  const getMoveEmoji = (m) => m === 'rock' ? '✊' : (m === 'paper' ? '✋' : (m === 'scissors' ? '✌️' : '❓'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
      {status === 'active' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {!mySelected ? (
            <>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Select Your Weapon ⚔️
              </Typography>
              <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center' }}>
                {[
                  { id: 'rock', emoji: '✊', name: 'Rock' },
                  { id: 'paper', emoji: '✋', name: 'Paper' },
                  { id: 'scissors', emoji: '✌️', name: 'Scissors' }
                ].map((item) => (
                  <Button
                    key={item.id}
                    onClick={() => handleChoice(item.id)}
                    sx={{
                      width: { xs: 70, sm: 85 },
                      height: { xs: 70, sm: 85 },
                      borderRadius: 4,
                      background: 'linear-gradient(145deg, rgba(30, 41, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.1)',
                        borderColor: '#00f2fe',
                        boxShadow: '0 15px 30px rgba(0, 242, 254, 0.4)'
                      }
                    }}
                  >
                    <Typography sx={{ fontSize: 32 }}>{item.emoji}</Typography>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                      {item.name}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </>
          ) : (
            <Box sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}>
              <Typography sx={{ fontSize: 48, mb: 1 }}>{getMoveEmoji(myMove)}</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#22c55e' }}>
                Choice Locked In! 🔒
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 1 }}>
                {oppSelected ? 'Revealing showdown...' : 'Waiting for challenger to choose... ⏳'}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {status === 'finished' && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: 340,
          p: 2,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>You</Typography>
            <Typography sx={{ fontSize: 44, my: 0.5 }}>{getMoveEmoji(myMove)}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#00f2fe' }}>
              {myMove?.toUpperCase()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>VS</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Challenger</Typography>
            <Typography sx={{ fontSize: 44, my: 0.5 }}>{getMoveEmoji(oppMove)}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#ff4d6d' }}>
              {oppMove?.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Challenge games where Player 1 sets score -> Player 2 accepts & plays -> game ends -> close window -> match scores
export const CHALLENGE_GAME_IDS = [
  'highstriker', 'fallingboxes', 'fruitcutting', 'fluffyjump', 'beerpong',
  'miniarchery', 'pogobowling', 'minigolf', 'carrace', 'watersort',
  'wordgame', 'spacebattle', 'jumpchicken'
];

// ============================================================
// MAIN 3D GAMING ARENA DIALOG
// ============================================================
export const GameArena3D = ({
  open,
  onClose,
  gameData,
  userId,
  username,
  userAvatar,
  opponentUser,
  onSendGameMessage,
  isDarkTheme = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const prevTurnPlayerIdRef = useRef(null);
  const seenGamesKeyPrefix = 'juicy_htp_seen_';

  // Handle game moves with challenge-mode auto-close logic
  const handleArenaGameMessage = useCallback((newGameData) => {
    // 1. Forward the message to socket/parent
    onSendGameMessage(newGameData);

    // 2. Only execute auto-close for Challenge Games
    const isChallenge = CHALLENGE_GAME_IDS.includes(newGameData?.gameType || gameData?.gameType);
    if (!isChallenge) return;

    // A. Player 1 sends challenge request with their score -> close game window
    const isP1SubmitChallenge =
      newGameData?.phase === 'p2_challenge' ||
      (newGameData?.status === 'invited' && (newGameData?.p1Score !== null && newGameData?.p1Score !== undefined));

    if (isP1SubmitChallenge) {
      setTimeout(() => {
        onClose();
      }, 350);
      return;
    }

    // B. Player 2 completes or game ends (status finished or phase finished) -> close game window
    const isGameFinished =
      newGameData?.status === 'finished' ||
      newGameData?.phase === 'finished';

    if (isGameFinished) {
      setTimeout(() => {
        onClose();
      }, 500);
      return;
    }
  }, [onSendGameMessage, onClose, gameData?.gameType]);

  // Show How-To-Play once per user per game type
  useEffect(() => {
    if (!open || !gameData || !userId) return;
    const key = `juicy_htp_seen_${userId}_${gameData.gameType}`;
    const alreadySeen = localStorage.getItem(key);
    if (!alreadySeen && GAME_HOW_TO_PLAY[gameData.gameType]) {
      setShowHowToPlay(true);
    } else {
      setShowHowToPlay(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameData?.gameType, userId]);

  const handleDismissHowToPlay = useCallback(() => {
    if (gameData && userId) {
      const key = `juicy_htp_seen_${userId}_${gameData.gameType}`;
      localStorage.setItem(key, '1');
    }
    setShowHowToPlay(false);
  }, [gameData, userId]);

  // Trigger sound when turn switches to current user
  useEffect(() => {
    if (!gameData || !open) return;
    if (gameData.status === 'active' && gameData.turnPlayerId === userId && prevTurnPlayerIdRef.current !== userId) {
      playSynthSound('turn', soundEnabled);
    }
    prevTurnPlayerIdRef.current = gameData.turnPlayerId;
  }, [gameData?.turnPlayerId, gameData?.status, userId, soundEnabled, open]);

  if (!gameData) return null;

  const {
    gameType,
    status,
    player1,
    player2,
    player1Id,
    player2Id,
    turnPlayerId,
    winnerId
  } = gameData;

  const p1Name = player1?.username || (String(userId) === String(player1Id || player1?.id) ? (username || 'Player 1') : (opponentUser?.username || 'Player 1'));
  const p2Name = player2?.username || (String(userId) === String(player2Id || player2?.id) ? (username || 'Player 2') : (opponentUser?.username || 'Player 2'));
  const p1 = { id: player1Id || player1?.id, username: p1Name, ...player1 };
  const p2 = { id: player2Id || player2?.id, username: p2Name, ...player2 };

  const isP1 = String(userId) === String(p1.id);
  const isMyTurn = status === 'active' && String(turnPlayerId) === String(userId);
  const myPlayer = isP1 ? p1 : p2;
  const oppPlayer = isP1 ? p2 : p1;

  const info = GAME_INFO_MAP[gameType] || { name: 'Arcade Arena 3D', icon: '🎮', color: '#ff8a00' };

  // Calculate live scores depending on game type
  let myScore = 0;
  let oppScore = 0;

  if (gameType === 'rps' || gameType === 'rockpaperscissors') {
    const p1S = gameData.scores?.[p1.id] ?? (gameData.p1Score !== undefined && gameData.p1Score !== null ? gameData.p1Score : (winnerId === p1.id ? 1 : 0));
    const p2S = gameData.scores?.[p2.id] ?? (gameData.p2Score !== undefined && gameData.p2Score !== null ? gameData.p2Score : (winnerId === p2.id ? 1 : 0));
    myScore = isP1 ? p1S : p2S;
    oppScore = isP1 ? p2S : p1S;
  } else if (gameType === 'tictactoe') {
    const p1S = gameData.scores?.[p1.id] ?? (gameData.p1Score !== undefined && gameData.p1Score !== null ? gameData.p1Score : (winnerId === p1.id ? 1 : 0));
    const p2S = gameData.scores?.[p2.id] ?? (gameData.p2Score !== undefined && gameData.p2Score !== null ? gameData.p2Score : (winnerId === p2.id ? 1 : 0));
    myScore = isP1 ? p1S : p2S;
    oppScore = isP1 ? p2S : p1S;
  } else if (gameType === 'highstriker') {
    myScore = isP1 ? (gameData.p1RoundWins || 0) : (gameData.p2RoundWins || 0);
    oppScore = isP1 ? (gameData.p2RoundWins || 0) : (gameData.p1RoundWins || 0);
  } else if (gameType === 'mathsquiz' || gameType === 'findthematch') {
    myScore = isP1 ? (gameData.p1Score || 0) : (gameData.p2Score || 0);
    oppScore = isP1 ? (gameData.p2Score || 0) : (gameData.p1Score || 0);
  } else if (gameType === 'fallingboxes' || gameType === 'fruitcutting' || gameType === 'fluffyjump' || gameType === 'beerpong' || gameType === 'miniarchery' || gameType === 'pogobowling' || gameType === 'minigolf') {
    const p1S = Number(gameData.p1TotalScore ?? gameData.p1Score ?? gameData.p1FinalScore ?? 0);
    const p2S = Number(gameData.p2TotalScore ?? gameData.p2Score ?? gameData.p2FinalScore ?? 0);
    myScore = isP1 ? p1S : p2S;
    oppScore = isP1 ? p2S : p1S;
  } else if (gameType === 'carrace') {
    const p1S = gameData.p1Score ?? gameData.p1FinalScore ?? 0;
    const p2S = gameData.p2Score ?? gameData.p2FinalScore ?? 0;
    myScore = isP1 ? p1S : p2S;
    oppScore = isP1 ? p2S : p1S;
  } else if (gameType === 'battleship') {
    const p1Hits = (gameData.p1Shots || []).filter(s => s.result === 'hit').length;
    const p2Hits = (gameData.p2Shots || []).filter(s => s.result === 'hit').length;
    myScore = isP1 ? p1Hits : p2Hits;
    oppScore = isP1 ? p2Hits : p1Hits;
  } else if (gameType === 'watersort') {
    const p1S = gameData.p1Score ?? gameData.p1FinalScore ?? 0;
    const p2S = gameData.p2Score ?? gameData.p2FinalScore ?? 0;
    myScore = isP1 ? p1S : p2S;
    oppScore = isP1 ? p2S : p1S;
  } else if (gameType === 'snakeladder') {
    myScore = isP1 ? (gameData.p1Pos || 1) : (gameData.p2Pos || 1);
    oppScore = isP1 ? (gameData.p2Pos || 1) : (gameData.p1Pos || 1);
  } else if (gameType === 'wordgame' || gameType === 'spacebattle' || gameType === 'jumpchicken') {
    const p1S = gameData.p1Score ?? gameData.p1FinalScore ?? 0;
    const p2S = gameData.p2Score ?? gameData.p2FinalScore ?? 0;
    myScore = isP1 ? p1S : p2S;
    oppScore = isP1 ? p2S : p1S;
  } else if (gameType === 'dotsandboxes' && gameData.scores) {
    myScore = gameData.scores[userId] ?? gameData.scores[myPlayer?.id] ?? 0;
    oppScore = gameData.scores[oppPlayer?.id] ?? 0;
  } else if (gameType === 'truthordare') {
    myScore = gameData.scores?.[userId] || 0;
    oppScore = gameData.scores?.[oppPlayer?.id] || 0;
  } else if (gameData.scores) {
    myScore = gameData.scores[userId] || 0;
    oppScore = gameData.scores[oppPlayer.id] || 0;
  }

  // Handle Rematch
  const handleRematch = () => {
    playSynthSound('move', soundEnabled);
    let freshData = { ...gameData, status: 'active', winnerId: undefined };

    if (gameType === 'tictactoe') {
      freshData.board = Array(9).fill(null);
      freshData.turn = 'X';
      freshData.turnPlayerId = p1.id;
    } else if (gameType === 'rps') {
      freshData.player1Selected = false;
      freshData.player2Selected = false;
      freshData.player1Move = null;
      freshData.player2Move = null;
      freshData.scores = gameData.scores || { [p1.id]: 0, [p2.id]: 0 };
      freshData.p1Score = gameData.p1Score || 0;
      freshData.p2Score = gameData.p2Score || 0;
    } else if (gameType === 'fallingboxes') {
      freshData = { ...fallingBoxesInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'memorygame') {
      freshData = { ...memoryGameInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'dotsandboxes') {
      freshData = { ...dotsAndBoxesInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'highstriker') {
      freshData = { ...highStrikerInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'mathsquiz') {
      freshData = { ...mathsQuizInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'findthematch') {
      freshData = { ...findTheMatchInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'fruitcutting') {
      freshData = { ...fruitCuttingInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'fluffyjump') {
      freshData = { ...fluffyJumpInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'beerpong') {
      freshData = { ...beerPongInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'miniarchery') {
      freshData = { ...miniArcheryInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'pogobowling') {
      freshData = { ...pogoBowlingInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'minigolf') {
      freshData = { ...miniGolfInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'carrace') {
      freshData = { ...carRaceInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'battleship') {
      freshData = { ...battleShipInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'watersort') {
      freshData = { ...waterSortInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'snakeladder') {
      freshData = { ...snakeLadderInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'wordgame') {
      freshData = { ...wordGameInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'spacebattle') {
      freshData = { ...spaceBattleInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'jumpchicken') {
      freshData = { ...jumpChickenInitialData(p1, p2), status: 'active', gameId: gameData.gameId };
    } else if (gameType === 'truthordare') {
      freshData.turnPlayerId = p1.id;
      freshData.selectedCategory = null;
      freshData.prompt = null;
      freshData.answered = false;
      freshData.answer = '';
      freshData.lastRound = null;
      freshData.scores = { [p1.id]: 0, [p2.id]: 0 };
      freshData.turnsPlayed = 0;
      freshData.usedTruths = [];
    }

    onSendGameMessage(freshData);
  };

  const isFinished = status === 'finished';
  let effectiveWinnerId = winnerId;
  if (isFinished && (!effectiveWinnerId || effectiveWinnerId === 'null' || effectiveWinnerId === 'undefined' || (effectiveWinnerId === 'draw' && myScore !== oppScore))) {
    if (myScore > oppScore) effectiveWinnerId = userId;
    else if (oppScore > myScore) effectiveWinnerId = oppPlayer?.id;
    else effectiveWinnerId = 'draw';
  }
  const isWinner = isFinished && String(effectiveWinnerId) === String(userId);
  const isDraw = isFinished && (effectiveWinnerId === 'draw' || effectiveWinnerId === 'tie');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          background: 'radial-gradient(ellipse at 50% 0%, #161a38 0%, #0a0c1a 70%, #05060e 100%)',
          borderRadius: { xs: 0, sm: 5 },
          border: { xs: 'none', sm: '1.5px solid rgba(255, 255, 255, 0.15)' },
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(6, 182, 212, 0.15)',
          color: '#fff',
          overflow: 'hidden',
          height: { xs: '100%', sm: 'auto' },
          minHeight: { xs: '100%', sm: 600 },
          maxHeight: { xs: '100%', sm: '94vh' },
          m: { xs: 0, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }
      }}
    >
      {/* 3D Cyber Ambient Light Effects */}
      <Box sx={{
        position: 'absolute',
        top: -80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 380,
        height: 180,
        background: `radial-gradient(circle, ${info.color}44 0%, transparent 70%)`,
        filter: 'blur(45px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top 3D Arena Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 'calc(max(env(safe-area-inset-left, 0px), 0px) + 12px)', sm: 3 },
        pt: {
          xs: 'calc(max(env(safe-area-inset-top, 0px), 38px) + 8px)',
          sm: 1.5
        },
        pb: { xs: 1, sm: 1.5 },
        pr: { xs: 'calc(max(env(safe-area-inset-right, 0px), 0px) + 12px)', sm: 3 },
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        background: 'rgba(10, 12, 26, 0.5)',
        zIndex: 2,
        flexShrink: 0
      }}>
        {/* Game Title with 3D Holographic Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
          <Box sx={{
            fontSize: { xs: 22, sm: 26 },
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))',
            flexShrink: 0
          }}>
            {info.icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{
              fontWeight: 800,
              fontSize: { xs: '0.95rem', sm: '1.15rem' },
              color: '#fff',
              background: `linear-gradient(90deg, #fff 0%, ${info.color} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 0.5,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {info.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.2 }}>
              <FiberManualRecordIcon sx={{ fontSize: 9, color: '#22c55e', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                REALTIME 3D ARENA
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Controls: Sound & Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1 }, flexShrink: 0 }}>
          <Tooltip title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}>
            <IconButton
              size="small"
              onClick={() => setSoundEnabled(!soundEnabled)}
              sx={{
                width: { xs: 34, sm: 36 },
                height: { xs: 34, sm: 36 },
                color: soundEnabled ? '#00f2fe' : 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }
              }}
            >
              {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Close & End Game">
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                width: { xs: 34, sm: 36 },
                height: { xs: 34, sm: 36 },
                color: 'rgba(255,255,255,0.7)',
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.2)', color: '#ef4444' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 3D Head-to-Head Battle HUD (P1 vs P2) */}
      <Box sx={{
        px: { xs: 'calc(max(env(safe-area-inset-left, 0px), 0px) + 8px)', sm: 3 },
        pr: { xs: 'calc(max(env(safe-area-inset-right, 0px), 0px) + 8px)', sm: 3 },
        py: { xs: 0.8, sm: 2 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: 0.5, sm: 1 },
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        zIndex: 2,
        flexShrink: 0
      }}>
        {/* Player 1 (You) 3D Glass Card */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.6, sm: 1.8 },
          p: { xs: 0.7, sm: 1.5 },
          borderRadius: { xs: 2, sm: 3 },
          background: isMyTurn
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(10, 25, 45, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
          border: '1.5px solid',
          borderColor: isMyTurn ? '#00f2fe' : 'rgba(255,255,255,0.1)',
          boxShadow: isMyTurn
            ? '0 0 16px rgba(0, 242, 254, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          transform: isMyTurn ? 'translateY(-1px)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          minWidth: 0
        }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={userAvatar}
              sx={{
                width: { xs: 30, sm: 46 },
                height: { xs: 30, sm: 46 },
                bgcolor: '#00f2fe',
                fontWeight: 800,
                fontSize: { xs: 12, sm: 16 },
                boxShadow: isMyTurn ? '0 0 12px #00f2fe' : 'none'
              }}
            >
              {myPlayer.username?.[0]?.toUpperCase() || 'Y'}
            </Avatar>
            {isMyTurn && (
              <Box sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: { xs: 8, sm: 12 },
                height: { xs: 8, sm: 12 },
                borderRadius: '50%',
                bgcolor: '#22c55e',
                border: '2px solid #0a0c1a',
                animation: 'pulse 1.2s infinite'
              }} />
            )}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexWrap: 'nowrap' }}>
              <Typography sx={{
                fontWeight: 800,
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: 52, sm: 100 }
              }}>
                {myPlayer.username}
              </Typography>
              <Typography sx={{
                px: 0.5,
                py: 0.1,
                borderRadius: 0.8,
                fontSize: { xs: 7, sm: 9 },
                fontWeight: 700,
                bgcolor: 'rgba(0, 242, 254, 0.2)',
                color: '#00f2fe',
                flexShrink: 0
              }}>
                YOU
              </Typography>
            </Box>
            <Typography sx={{
              fontSize: { xs: '0.6rem', sm: '0.7rem' },
              fontWeight: isMyTurn ? 800 : 400,
              color: isMyTurn ? '#22c55e' : 'rgba(255,255,255,0.4)',
              mt: 0.2,
              whiteSpace: 'nowrap'
            }}>
              {isMyTurn ? '🎯 YOUR TURN' : 'Waiting...'}
            </Typography>
          </Box>
          {gameType !== 'truthordare' && (
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: 7, sm: 9 }, fontWeight: 700 }}>
                SCORE
              </Typography>
              <Typography sx={{
                fontWeight: 900,
                fontSize: { xs: 16, sm: 22 },
                color: '#00f2fe',
                lineHeight: 1,
                textShadow: '0 0 10px rgba(0, 242, 254, 0.6)'
              }}>
                {myScore}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Center 3D "VS" Crest */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 0.5, sm: 1 },
          flexShrink: 0
        }}>
          <Box sx={{
            width: { xs: 28, sm: 42 },
            height: { xs: 28, sm: 42 },
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: { xs: 10, sm: 15 },
            boxShadow: '0 0 14px rgba(245, 158, 11, 0.5), inset 0 1px 1px rgba(255,255,255,0.4)',
            border: '2px solid rgba(255,255,255,0.3)',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            VS
          </Box>
          <Typography sx={{
            fontSize: { xs: 7, sm: 9 },
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            mt: 0.3,
            letterSpacing: 1
          }}>
            MATCH
          </Typography>
        </Box>

        {/* Player 2 (Challenger) 3D Glass Card */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.6, sm: 1.8 },
          p: { xs: 0.7, sm: 1.5 },
          borderRadius: { xs: 2, sm: 3 },
          minWidth: 0,
          background: (!isMyTurn && status === 'active')
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(45, 15, 25, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
          border: '1.5px solid',
          borderColor: (!isMyTurn && status === 'active') ? '#ff4d6d' : 'rgba(255,255,255,0.1)',
          boxShadow: (!isMyTurn && status === 'active')
            ? '0 0 25px rgba(239, 68, 68, 0.35), inset 0 1px 1px rgba(255,255,255,0.3)'
            : '0 4px 15px rgba(0,0,0,0.3)',
          transform: (!isMyTurn && status === 'active') ? 'translateY(-2px)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          {gameType !== 'truthordare' && (
            <Box sx={{ textAlign: 'left', flexShrink: 0 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: 7, sm: 9 }, fontWeight: 700 }}>
                SCORE
              </Typography>
              <Typography sx={{
                fontWeight: 900,
                fontSize: { xs: 16, sm: 22 },
                color: '#ff4d6d',
                lineHeight: 1,
                textShadow: '0 0 10px rgba(255, 77, 109, 0.6)'
              }}>
                {oppScore}
              </Typography>
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
            <Typography sx={{
              fontWeight: 800,
              fontSize: { xs: '0.7rem', sm: '0.875rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {oppPlayer.username}
            </Typography>
            <Typography sx={{
              fontSize: { xs: '0.6rem', sm: '0.7rem' },
              fontWeight: (!isMyTurn && status === 'active') ? 800 : 400,
              color: (!isMyTurn && status === 'active') ? '#f59e0b' : 'rgba(255,255,255,0.4)',
              mt: 0.2,
              whiteSpace: 'nowrap'
            }}>
              {(!isMyTurn && status === 'active') ? '⏳ PLAYING...' : 'Waiting...'}
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={opponentUser?.profilePic || opponentUser?.image}
              sx={{
                width: { xs: 30, sm: 46 },
                height: { xs: 30, sm: 46 },
                bgcolor: '#ff4d6d',
                fontWeight: 800,
                fontSize: { xs: 12, sm: 16 },
                boxShadow: (!isMyTurn && status === 'active') ? '0 0 12px #ff4d6d' : 'none'
              }}
            >
              {oppPlayer.username?.[0]?.toUpperCase() || 'C'}
            </Avatar>
            {!isMyTurn && status === 'active' && (
              <Box sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: { xs: 8, sm: 12 },
                height: { xs: 8, sm: 12 },
                borderRadius: '50%',
                bgcolor: '#f59e0b',
                border: '2px solid #0a0c1a',
                animation: 'pulse 1.2s infinite'
              }} />
            )}
          </Box>
        </Box>
      </Box>

      {/* Main 3D Game Battle Stage */}
      <Box sx={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        p: { xs: 0.5, sm: 3 },
        pt: { xs: 1, sm: 3 },
        pb: { xs: 'calc(max(env(safe-area-inset-bottom, 0px), 12px) + 8px)', sm: 3 },
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        minHeight: 0
      }}>
        {/* Waiting for opponent banner if invited */}
        {status === 'invited' && (
          <Box sx={{
            p: 2.5,
            mb: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            flexDirection: 'column'
          }}>
            <Typography variant="body1" sx={{ color: '#f59e0b', fontWeight: 700 }}>
              ⏳ Waiting for {oppPlayer.username} to accept...
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Game will start automatically as soon as your challenger accepts!
            </Typography>
          </Box>
        )}

        {/* Render the Active Game Component */}
        {gameType === 'tictactoe' && (
          <TicTacToe3D
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            soundEnabled={soundEnabled}
          />
        )}

        {gameType === 'truthordare' && (
          <TruthOrDareGame
            gameData={gameData}
            userId={userId}
            username={username}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'rps' && (
          <RockPaperScissors3D
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            soundEnabled={soundEnabled}
          />
        )}

        {gameType === 'fallingboxes' && (
          <FallingBoxesGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'memorygame' && (
          <MemoryGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'highstriker' && (
          <HighStrikerGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'dotsandboxes' && (
          <DotsAndBoxesGame
            gameData={{
              ...gameData,
              player1: p1,
              player2: p2,
              player1Id: p1?.id || gameData?.player1Id,
              player2Id: p2?.id || gameData?.player2Id
            }}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'mathsquiz' && (
          <MathsQuizGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'findthematch' && (
          <FindTheMatchGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'fruitcutting' && (
          <FruitCuttingGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'fluffyjump' && (
          <FluffyJumpGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'beerpong' && (
          <CoffeePongGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'miniarchery' && (
          <MiniArcheryGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'pogobowling' && (
          <PogoBowlingGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'minigolf' && (
          <MiniGolfGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'carrace' && (
          <CarRaceGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'battleship' && (
          <BattleShipGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'watersort' && (
          <WaterSortGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'snakeladder' && (
          <SnakeLadderGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'wordgame' && (
          <WordGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'spacebattle' && (
          <SpaceBattleGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}

        {gameType === 'jumpchicken' && (
          <JumpChickenGame
            gameData={gameData}
            userId={userId}
            onSendGameMessage={handleArenaGameMessage}
            isDarkTheme={isDarkTheme}
          />
        )}
      </Box>

      {/* 3D Victory / Defeat Podium Overlay when Match is Finished */}
      {isFinished && (
        <Fade in={isFinished}>
          <Box sx={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(16px)',
            background: 'rgba(5, 7, 18, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            pt: { xs: 'calc(max(env(safe-area-inset-top, 0px), 38px) + 16px)', sm: 3 },
            pb: { xs: 'calc(max(env(safe-area-inset-bottom, 0px), 12px) + 16px)', sm: 3 },
            overflowY: 'auto',
            zIndex: 10,
            textAlign: 'center'
          }}>
            {/* Glowing 3D Trophy / Medal */}
            <Box sx={{
              fontSize: { xs: 64, sm: 80 },
              animation: 'bounce 1s infinite alternate',
              filter: isWinner
                ? 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.8))'
                : (isDraw ? 'drop-shadow(0 0 18px rgba(245, 158, 11, 0.7))' : 'drop-shadow(0 0 20px rgba(0, 242, 254, 0.5))'),
              mb: 1
            }}>
              {isDraw ? '\uD83E\uDD1D' : (isWinner ? '\uD83C\uDFC6' : '\uD83D\uDC51')}
            </Box>

            {/* Win / Lose / Draw title — solid color to avoid invisible gradient-fill bug */}
            <Typography variant="h4" sx={{
              fontWeight: 900,
              fontSize: { xs: '1.6rem', sm: '2.2rem' },
              color: isDraw ? '#f59e0b' : (isWinner ? '#ffd700' : '#00f2fe'),
              textShadow: isDraw
                ? '0 0 24px rgba(245,158,11,0.6)'
                : (isWinner ? '0 0 24px rgba(255,215,0,0.6)' : '0 0 24px rgba(0,242,254,0.6)'),
              mb: 0.5
            }}>
              {isDraw ? 'EPIC DRAW!' : (isWinner ? 'VICTORY IS YOURS! 🎉' : `${oppPlayer.username} WINS! 👑`)}
            </Typography>

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              {isDraw
                ? 'Both players fought with equal strength!'
                : (isWinner
                  ? `You conquered ${oppPlayer.username} in ${info.name}!`
                  : `Well played! Challenge ${oppPlayer.username} to a rematch.`)}
            </Typography>

            {/* Score Summary Box */}
            {gameType !== 'truthordare' && (
              <Box sx={{
                display: 'flex',
                gap: { xs: 2, sm: 3 },
                mb: { xs: 2.5, sm: 4 },
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <Box sx={{ textAlign: 'center', minWidth: { xs: 70, sm: 90 } }}>
                  <Typography variant="caption" sx={{ color: '#00f2fe', fontWeight: 700 }}>YOU</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{myScore}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>—</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: { xs: 70, sm: 90 } }}>
                  <Typography variant="caption" sx={{ color: '#ff4d6d', fontWeight: 700 }}>{oppPlayer.username}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{oppScore}</Typography>
                </Box>
              </Box>
            )}

            {/* Action Buttons: Rematch & Close */}
            <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, width: '100%', maxWidth: { xs: '100%', sm: 360 } }}>
              <Button
                variant="contained"
                onClick={handleRematch}
                startIcon={<RefreshIcon />}
                sx={{
                  flex: 1,
                  py: { xs: 1.1, sm: 1.4 },
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: { xs: '0.82rem', sm: '0.95rem' },
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(0, 242, 254, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00d2de 0%, #3e9cee 100%)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                ⚡ Rematch
              </Button>

              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  flex: 1,
                  py: { xs: 1.1, sm: 1.4 },
                  borderRadius: 3,
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: { xs: '0.82rem', sm: '0.95rem' },
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255,255,255,0.06)'
                  }
                }}
              >
                ✕ Exit Arena
              </Button>
            </Box>
          </Box>
        </Fade>
      )}

      {/* First-time How To Play instruction card */}
      {showHowToPlay && (
        <HowToPlayCard
          gameType={gameType}
          gameInfo={info}
          onDismiss={handleDismissHowToPlay}
        />
      )}
    </Dialog>
  );
};
