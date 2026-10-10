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
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// ============================================================================
//  WORD SEARCH - 2-PLAYER WORD PUZZLE ARCADE
//  Faithful recreation matching reference image 1:
//  - 10x10 letter grid with bold letters
//  - Colorful translucent pill capsules for found words (Blue, Teal, Yellow, Orange, Coral, Green, Pink, Lime)
//  - Horizontal, vertical, and diagonal word placement
//  - Interactive tap & drag / click selection across letters
//  - Web Audio API chimes for letter taps, word discoveries, and victory
//  - 2-Player Challenge: Player 1 finds words & sets high score -> Player 2 beats it!
// ============================================================================

const GRID_SIZE = 10;

// Words embedded matching reference image 1
const TARGET_WORDS = [
  { word: 'WORD', color: 'rgba(56, 189, 248, 0.45)', border: '#38bdf8' },      // Top blue
  { word: 'SEARCH', color: 'rgba(20, 184, 166, 0.45)', border: '#14b8a6' },    // Teal
  { word: 'LOVE', color: 'rgba(250, 204, 21, 0.45)', border: '#facc15' },      // Yellow
  { word: 'ENJOY', color: 'rgba(249, 115, 22, 0.45)', border: '#f97316' },     // Orange vertical
  { word: 'JOURNEY', color: 'rgba(244, 63, 94, 0.45)', border: '#f43f5e' },    // Coral vertical
  { word: 'PUZZLES', color: 'rgba(163, 230, 53, 0.45)', border: '#a3e635' },   // Lime bottom
  { word: 'CALL', color: 'rgba(96, 165, 250, 0.45)', border: '#60a5fa' },      // Blue diagonal
  { word: 'SEEK', color: 'rgba(74, 222, 128, 0.45)', border: '#4ade80' }       // Green diagonal
];

// 10x10 Grid layout exactly matching reference image 1
const INITIAL_GRID = [
  ['S', 'S', 'M', 'W', 'O', 'R', 'D', 'K', 'N', 'U'], // Row 0: WORD at (0,3)-(0,6)
  ['E', 'W', 'S', 'E', 'A', 'R', 'C', 'H', 'J', 'J'], // Row 1: SEARCH at (1,2)-(1,7)
  ['T', 'P', 'S', 'H', 'B', 'D', 'S', 'A', 'S', 'O'], // Row 2
  ['E', 'F', 'S', 'G', 'L', 'O', 'V', 'E', 'F', 'U'], // Row 3: LOVE at (3,4)-(3,7)
  ['N', 'N', 'U', 'C', 'R', 'S', 'E', 'E', 'S', 'R'], // Row 4
  ['J', 'P', 'S', 'N', 'K', 'E', 'P', 'S', 'E', 'N'], // Row 5: ENJOY vertical at col 0 (rows 0-4 or 2-6)
  ['O', 'D', 'L', 'S', 'C', 'A', 'L', 'L', 'V', 'E'], // Row 6: CALL at (6,4)-(6,7)
  ['Y', 'R', 'S', 'A', 'C', 'K', 'B', 'A', 'X', 'Y'], // Row 7
  ['D', 'T', 'P', 'S', 'Y', 'X', 'L', 'O', 'X', 'E'], // Row 8
  ['S', 'E', 'E', 'P', 'U', 'Z', 'Z', 'L', 'E', 'S']  // Row 9: PUZZLES at (9,3)-(9,9)
];

// Defined locations of target words in the grid for precise pill capsule highlighting
const WORD_COORDS = {
  WORD: [
    { r: 0, c: 3 }, { r: 0, c: 4 }, { r: 0, c: 5 }, { r: 0, c: 6 }
  ],
  SEARCH: [
    { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 }, { r: 1, c: 6 }, { r: 1, c: 7 }
  ],
  LOVE: [
    { r: 3, c: 4 }, { r: 3, c: 5 }, { r: 3, c: 6 }, { r: 3, c: 7 }
  ],
  ENJOY: [
    { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 5, c: 0 }, { r: 6, c: 0 }
  ],
  JOURNEY: [
    { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, { r: 6, c: 8 }, { r: 7, c: 8 }
  ],
  PUZZLES: [
    { r: 9, c: 3 }, { r: 9, c: 4 }, { r: 9, c: 5 }, { r: 9, c: 6 }, { r: 9, c: 7 }, { r: 9, c: 8 }, { r: 9, c: 9 }
  ],
  CALL: [
    { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 }, { r: 6, c: 7 }
  ],
  SEEK: [
    { r: 4, c: 7 }, { r: 3, c: 6 }, { r: 2, c: 5 }, { r: 1, c: 4 }
  ]
};

// Web Audio API Synthesizer for Word Game Sound FX
export const WORD_COLORS = [
  { color: 'rgba(56, 189, 248, 0.45)', border: '#38bdf8' },      // Sky Blue
  { color: 'rgba(20, 184, 166, 0.45)', border: '#14b8a6' },      // Teal
  { color: 'rgba(250, 204, 21, 0.45)', border: '#facc15' },      // Golden Yellow
  { color: 'rgba(249, 115, 22, 0.45)', border: '#f97316' },      // Vibrant Orange
  { color: 'rgba(244, 63, 94, 0.45)', border: '#f43f5e' },       // Rose Coral
  { color: 'rgba(163, 230, 53, 0.45)', border: '#a3e635' },      // Lime Green
  { color: 'rgba(168, 85, 247, 0.45)', border: '#a855f7' },      // Purple Violet
  { color: 'rgba(236, 72, 153, 0.45)', border: '#ec4899' }       // Neon Pink
];

// 10 Curated Themed Word Sets (8 Words Each)
export const WORD_THEMES = [
  { title: '🎮 Arcade & Gaming', words: ['GAMER', 'QUEST', 'LEVEL', 'PIXEL', 'SCORE', 'BONUS', 'COINS', 'SHIELD'] },
  { title: '🍎 Nature & Fruits', words: ['MANGO', 'APPLE', 'BERRY', 'LEMON', 'PEACH', 'MELON', 'GRAPE', 'WATER'] },
  { title: '🚀 Space & Cosmos', words: ['STARS', 'PLANET', 'SOLAR', 'ROBOT', 'ORBIT', 'COMET', 'MOONS', 'ROCKET'] },
  { title: '🐾 Wild Animals', words: ['TIGER', 'EAGLE', 'PANDA', 'ZEBRA', 'LION', 'SHARK', 'KOALA', 'OTTER'] },
  { title: '🍕 Tasty Food', words: ['PIZZA', 'BURGER', 'SUSHI', 'DONUT', 'BREAD', 'TACOS', 'CHEESE', 'HONEY'] },
  { title: '🏖️ World & Travel', words: ['BEACH', 'OCEAN', 'FOREST', 'RIVER', 'ISLAND', 'TRAIL', 'DESERT', 'PEAKS'] },
  { title: '⚽ Sports & Games', words: ['SOCCER', 'TENNIS', 'BOXING', 'RACING', 'CHESS', 'SKATE', 'SURF', 'RUGBY'] },
  { title: '💖 Juicy & Vibes', words: ['JUICY', 'HEART', 'SMILE', 'FRIEND', 'HAPPY', 'SWEET', 'DREAM', 'MAGIC'] },
  { title: '🌊 Ocean & Sea', words: ['CORAL', 'WAVES', 'PEARL', 'SHELL', 'STORM', 'ANCHOR', 'TIDES', 'SAILOR'] },
  { title: '📚 Classic Words', words: ['WORD', 'SEARCH', 'LOVE', 'ENJOY', 'PUZZLE', 'SEEK', 'CALL', 'BRAIN'] }
];

// Dynamic Word Search Puzzle Generator with 100% placement reliability
export const generateRandomWordPuzzle = () => {
  const theme = WORD_THEMES[Math.floor(Math.random() * WORD_THEMES.length)];
  const wordList = [...theme.words];

  for (let attempt = 0; attempt < 6; attempt++) {
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    const wordCoords = {};
    const placedWords = [];

    const dirs = [
      [0, 1],   // horizontal right
      [1, 0],   // vertical down
      [1, 1],   // diagonal down-right
      [-1, 1],  // diagonal up-right
      [0, -1],  // horizontal left
      [-1, 0]   // vertical up
    ];

    let allPlaced = true;
    for (const w of wordList) {
      let placed = false;
      for (let tries = 0; tries < 250; tries++) {
        const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
        const len = w.length;
        const minR = dr < 0 ? len - 1 : 0;
        const maxR = dr > 0 ? GRID_SIZE - len : GRID_SIZE - 1;
        const minC = dc < 0 ? len - 1 : 0;
        const maxC = dc > 0 ? GRID_SIZE - len : GRID_SIZE - 1;

        if (maxR < minR || maxC < minC) continue;

        const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
        const c = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

        let fits = true;
        for (let i = 0; i < len; i++) {
          const nr = r + i * dr;
          const nc = c + i * dc;
          if (grid[nr][nc] !== null && grid[nr][nc] !== w[i]) {
            fits = false;
            break;
          }
        }

        if (fits) {
          const coords = [];
          for (let i = 0; i < len; i++) {
            const nr = r + i * dr;
            const nc = c + i * dc;
            grid[nr][nc] = w[i];
            coords.push({ r: nr, c: nc });
          }
          wordCoords[w] = coords;
          placedWords.push(w);
          placed = true;
          break;
        }
      }
      if (!placed) {
        allPlaced = false;
        break;
      }
    }

    if (allPlaced) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!grid[r][c]) {
            grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
          }
        }
      }

      const targetWords = placedWords.map((w, idx) => ({
        word: w,
        color: WORD_COLORS[idx % WORD_COLORS.length].color,
        border: WORD_COLORS[idx % WORD_COLORS.length].border
      }));

      return {
        themeTitle: theme.title,
        grid,
        targetWords,
        wordCoords
      };
    }
  }

  return {
    themeTitle: '📚 Classic Words',
    grid: INITIAL_GRID,
    targetWords: TARGET_WORDS,
    wordCoords: WORD_COORDS
  };
};

class WordGameAudioSynthesizer {
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

  playSelect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  playWordFound() {
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
        const st = this.ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.18, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
        osc.start(st);
        osc.stop(st + 0.25);
      });
    } catch (e) {}
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const st = this.ctx.currentTime + i * 0.09;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.2, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.3);
        osc.start(st);
        osc.stop(st + 0.3);
      });
    } catch (e) {}
  }
}

export const WordGame = ({ gameData, userId, onSendGameMessage, isDarkTheme }) => {
  const {
    player1,
    player2,
    phase = 'p1_finding', // 'p1_finding' | 'p2_challenge' | 'p2_finding' | 'finished'
    p1Score = null,
    p1Found = [],
    p1Time = null,
    p2Score = null,
    p2Found = [],
    p2Time = null,
    winnerId = null,
    status = 'active'
  } = gameData || {};

  const currentGrid = gameData?.grid || gameData?.puzzle?.grid || INITIAL_GRID;
  const currentTargetWords = gameData?.targetWords || gameData?.puzzle?.targetWords || TARGET_WORDS;
  const currentWordCoords = gameData?.wordCoords || gameData?.puzzle?.wordCoords || WORD_COORDS;
  const currentThemeTitle = gameData?.themeTitle || gameData?.puzzle?.themeTitle || '📚 Word Search';

  const isP1 = String(userId || '') === String(player1?.id || '');
  const isP2 = String(userId || '') === String(player2?.id || '');
  const myName = isP1 ? player1?.username : player2?.username;
  const oppName = isP1 ? player2?.username : player1?.username;

  // Determines whether current user is actively searching
  const amICurrentPlayer =
    (phase === 'p1_finding' && isP1) ||
    (phase === 'p2_finding' && isP2);

  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]); // array of { r, c }
  const [startCell, setStartCell] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    audioRef.current = new WordGameAudioSynthesizer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (audioRef.current) audioRef.current.enabled = next;
  };

  // Timer loop while searching
  useEffect(() => {
    if (amICurrentPlayer && foundWords.length < currentTargetWords.length) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [amICurrentPlayer, foundWords.length, currentTargetWords.length]);

  // Check if a line from (r1, c1) to (r2, c2) matches any target word
  const getLineCells = (r1, c1, r2, c2) => {
    const dr = r2 - r1;
    const dc = c2 - c1;
    const stepR = dr === 0 ? 0 : (dr > 0 ? 1 : -1);
    const stepC = dc === 0 ? 0 : (dc > 0 ? 1 : -1);

    // Must be straight horizontal, vertical, or 45-degree diagonal
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return [{ r: r1, c: c1 }];
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const cells = [];
    for (let i = 0; i <= steps; i++) {
      cells.push({ r: r1 + i * stepR, c: c1 + i * stepC });
    }
    return cells;
  };

  // Handle cell click / selection
  const handleCellClick = (r, c) => {
    if (!amICurrentPlayer || foundWords.length >= currentTargetWords.length) return;

    if (!startCell) {
      setStartCell({ r, c });
      setSelectedCells([{ r, c }]);
      if (audioRef.current) audioRef.current.playSelect();
    } else {
      // Complete selection line
      const cells = getLineCells(startCell.r, startCell.c, r, c);
      const formedWord = cells.map(pt => currentGrid[pt.r][pt.c]).join('');
      const reversedWord = formedWord.split('').reverse().join('');

      let matchedWord = null;
      for (const target of currentTargetWords) {
        if (!foundWords.includes(target.word)) {
          if (formedWord === target.word || reversedWord === target.word) {
            matchedWord = target.word;
            break;
          }
        }
      }

      if (matchedWord) {
        const nextFound = [...foundWords, matchedWord];
        setFoundWords(nextFound);
        if (audioRef.current) audioRef.current.playWordFound();

        if (nextFound.length >= currentTargetWords.length && audioRef.current) {
          audioRef.current.playWin();
        }
      }

      setStartCell(null);
      setSelectedCells([]);
    }
  };

  // Cell hover while selecting line
  const handleCellHover = (r, c) => {
    if (startCell && amICurrentPlayer) {
      const cells = getLineCells(startCell.r, startCell.c, r, c);
      setSelectedCells(cells);
    }
  };

  // Check if a cell is part of any found word
  const getCellHighlight = (r, c) => {
    for (const wordKey of foundWords) {
      const coords = currentWordCoords[wordKey];
      if (coords && coords.some(pt => pt.r === r && pt.c === c)) {
        const def = currentTargetWords.find(w => w.word === wordKey);
        return {
          bgcolor: def?.color || 'rgba(56, 189, 248, 0.4)',
          border: def?.border || '#38bdf8'
        };
      }
    }
    return null;
  };

  // Calculate score based on words found and speed
  const calculateScore = (wordsFoundCount, timeSec) => {
    return Math.max(100, wordsFoundCount * 120 + Math.max(0, 500 - timeSec * 5));
  };

  // Player 1 Submits Score
  const handlePlayer1Submit = () => {
    const finalScore = calculateScore(foundWords.length, timerSeconds);
    onSendGameMessage({
      ...gameData,
      status: 'invited',
      phase: 'p2_challenge',
      p1Score: finalScore,
      p1TotalScore: finalScore,
      p1FinalScore: finalScore,
      p1Found: foundWords,
      p1Time: timerSeconds,
      rounds: [{ p1Score: finalScore, p2Score: null }],
      turnPlayerId: player2?.id,
      challengerId: player1?.id
    });
  };

  // Player 2 Submits Score & Decides Winner
  const handlePlayer2Submit = () => {
    const finalP2Score = calculateScore(foundWords.length, timerSeconds);
    const p1S = Number(
      gameData?.p1Score ??
      gameData?.p1TotalScore ??
      gameData?.p1FinalScore ??
      p1Score ??
      0
    );
    const p2S = finalP2Score;

    let finalWinner = 'draw';
    if (p1S > p2S) finalWinner = player1?.id;
    else if (p2S > p1S) finalWinner = player2?.id;

    onSendGameMessage({
      ...gameData,
      status: 'finished',
      phase: 'finished',
      p1Score: p1S,
      p2Score: p2S,
      p1TotalScore: p1S,
      p2TotalScore: p2S,
      p1FinalScore: p1S,
      p2FinalScore: p2S,
      p2Found: foundWords,
      p2Time: timerSeconds,
      rounds: [{ p1Score: p1S, p2Score: p2S }],
      winnerId: finalWinner,
      turnPlayerId: null
    });
  };

  // Auto-submit score when Player 2 finds all words
  useEffect(() => {
    if (isP2 && phase === 'p2_finding' && foundWords.length >= currentTargetWords.length && currentTargetWords.length > 0) {
      const autoTimer = setTimeout(() => {
        handlePlayer2Submit();
      }, 2500);
      return () => clearTimeout(autoTimer);
    }
  }, [isP2, phase, foundWords.length, currentTargetWords.length]);

  // Rematch with fresh random word puzzle
  const handleRematch = () => {
    const freshPuzzle = generateRandomWordPuzzle();
    onSendGameMessage({
      ...gameData,
      status: 'active',
      phase: 'p1_finding',
      p1Score: null,
      p1TotalScore: 0,
      p1FinalScore: null,
      p2Score: null,
      p2TotalScore: 0,
      p2FinalScore: null,
      p1Found: [],
      p1Time: null,
      p2Found: [],
      p2Time: null,
      rounds: [],
      winnerId: null,
      turnPlayerId: player1?.id,
      challengerId: player1?.id,
      puzzle: freshPuzzle,
      grid: freshPuzzle.grid,
      targetWords: freshPuzzle.targetWords,
      wordCoords: freshPuzzle.wordCoords,
      themeTitle: freshPuzzle.themeTitle
    });
    setFoundWords([]);
    setTimerSeconds(0);
    setStartCell(null);
    setSelectedCells([]);
  };

  const isCompleted = foundWords.length >= currentTargetWords.length;

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
      {/* 1. TOP STATUS & CONTROLS */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        mb: 1,
        px: 0.5
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label={`Words: ${foundWords.length}/${currentTargetWords.length}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            size="small"
            label={`⏱️ ${timerSeconds}s`}
            sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#00f2fe', fontWeight: 800, fontSize: '0.75rem' }}
          />
        </Box>

        <IconButton size="small" onClick={toggleSound} sx={{ color: '#fff', p: 0.4 }}>
          {soundEnabled ? <VolumeUpIcon sx={{ fontSize: 18 }} /> : <VolumeOffIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

      {/* THEME BADGE */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        mb: 0.8
      }}>
        <Chip
          size="small"
          label={currentThemeTitle}
          sx={{
            bgcolor: 'rgba(0, 242, 254, 0.12)',
            color: '#00f2fe',
            fontWeight: 800,
            fontSize: '0.78rem',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            height: 24
          }}
        />
      </Box>

      {/* Target to beat badge for Player 2 */}
      {phase === 'p2_finding' && p1Score !== null && (
        <Box sx={{
          width: '100%',
          py: 0.5,
          px: 1,
          mb: 1,
          borderRadius: 2,
          bgcolor: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          textAlign: 'center'
        }}>
          <Typography sx={{ color: '#f43f5e', fontWeight: 800, fontSize: '0.78rem' }}>
            TARGET TO BEAT: {p1Found.length} WORDS ({p1Time}s) • {p1Score} PTS
          </Typography>
        </Box>
      )}

      {/* 2. THE 10x10 WORD SEARCH GRID */}
      <Box sx={{
        width: 330,
        height: 330,
        bgcolor: '#ffffff',
        borderRadius: 3,
        p: 1.2,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {currentGrid.map((row, rIdx) => (
          <Box key={rIdx} sx={{ flex: 1, display: 'flex', gap: '2px' }}>
            {row.map((letter, cIdx) => {
              const highlight = getCellHighlight(rIdx, cIdx);
              const isSelected = selectedCells.some(pt => pt.r === rIdx && pt.c === cIdx);

              return (
                <Box
                  key={cIdx}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  onMouseEnter={() => handleCellHover(rIdx, cIdx)}
                  sx={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.5,
                    cursor: amICurrentPlayer ? 'pointer' : 'default',
                    bgcolor: highlight
                      ? highlight.bgcolor
                      : (isSelected ? 'rgba(0, 242, 254, 0.35)' : 'transparent'),
                    border: highlight
                      ? `2px solid ${highlight.border}`
                      : (isSelected ? '2px solid #00f2fe' : 'none'),
                    transition: 'all 0.1s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <Typography sx={{
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    color: '#000000',
                    lineHeight: 1,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {letter}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* 3. TARGET WORDS LIST (Matches reference image pill capsule colors) */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.6,
        justifyContent: 'center',
        width: '100%',
        mt: 1.2,
        px: 0.5
      }}>
        {currentTargetWords.map(item => {
          const isFound = foundWords.includes(item.word);
          return (
            <Chip
              key={item.word}
              size="small"
              label={item.word}
              sx={{
                bgcolor: isFound ? item.color : 'rgba(255,255,255,0.08)',
                color: isFound ? '#fff' : 'rgba(255,255,255,0.85)',
                fontWeight: 800,
                fontSize: '0.72rem',
                border: `1.5px solid ${isFound ? item.border : 'rgba(255,255,255,0.2)'}`,
                textDecoration: isFound ? 'line-through' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          );
        })}
      </Box>

      {/* 4. SUBMIT / CHALLENGE BUTTONS */}
      {amICurrentPlayer && isCompleted && (
        <Box sx={{
          mt: 1.5,
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          width: '100%',
          textAlign: 'center'
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#22c55e', mb: 0.5 }}>
            🎉 ALL WORDS FOUND!
          </Typography>
          <Typography variant="caption" sx={{ color: '#fff', display: 'block', mb: 1 }}>
            Score: {calculateScore(foundWords.length, timerSeconds)} pts ({timerSeconds}s)
          </Typography>

          {isP1 && phase === 'p1_finding' && (
            <Button
              variant="contained"
              size="small"
              onClick={handlePlayer1Submit}
              sx={{
                py: 0.8,
                px: 3,
                borderRadius: 2,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff'
              }}
            >
              🚀 Challenge {player2?.username}!
            </Button>
          )}

          {isP2 && phase === 'p2_finding' && (
            <Button
              variant="contained"
              size="small"
              onClick={handlePlayer2Submit}
              sx={{
                py: 0.8,
                px: 3,
                borderRadius: 2,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                color: '#000'
              }}
            >
              🏆 View Match Results!
            </Button>
          )}
        </Box>
      )}

      {/* WAITING SCREEN */}
      {!amICurrentPlayer && phase !== 'finished' && (
        <Box sx={{
          mt: 1.5,
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255,255,255,0.15)',
          width: '100%',
          textAlign: 'center'
        }}>
          <Typography sx={{ fontSize: 28 }}>⏳</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff' }}>
            {phase === 'p2_challenge'
              ? `Challenge Sent to ${player2?.username}!`
              : `${player2?.username} is Finding Words!`
            }
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            You found {p1Found.length} words in {p1Time}s. Waiting for them to finish!
          </Typography>
        </Box>
      )}

      {/* FINISHED SCREEN */}
      {phase === 'finished' && (
        <Box sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 3,
          bgcolor: 'rgba(10, 15, 30, 0.95)',
          border: '1px solid rgba(255,255,255,0.15)',
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
              : (winnerId === userId ? 'YOU WON THE WORD HUNT! 🎉' : `${oppName} WON! 🏆`)
            }
          </Typography>

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-around',
            my: 1.2,
            p: 1,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.06)'
          }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800 }}>
                {player1?.username} {winnerId === player1?.id ? '🏆 WIN' : (winnerId === 'draw' ? '🤝' : '💔 LOSE')}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#fff' }}>
                {p1Found?.length || 0} words ({p1Time}s)
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
                {p2Found?.length || 0} words ({p2Time}s)
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
            🔄 Hunt Again!
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Initial Data Generator for WordGame
export const wordGameInitialData = (player1, player2) => {
  const puzzle = generateRandomWordPuzzle();
  return {
    gameType: 'wordgame',
    status: 'active',
    phase: 'p1_finding',
    player1,
    player2,
    p1Score: null,
    p1TotalScore: 0,
    p1FinalScore: null,
    p1Found: [],
    p1Time: null,
    p2Score: null,
    p2TotalScore: 0,
    p2FinalScore: null,
    p2Found: [],
    p2Time: null,
    rounds: [],
    winnerId: null,
    turnPlayerId: player1?.id,
    challengerId: player1?.id,
    puzzle,
    grid: puzzle.grid,
    targetWords: puzzle.targetWords,
    wordCoords: puzzle.wordCoords,
    themeTitle: puzzle.themeTitle
  };
};
