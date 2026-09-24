import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  Chip,
  Divider,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GestureIcon from '@mui/icons-material/Gesture';
import BrushIcon from '@mui/icons-material/Brush';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PaletteIcon from '@mui/icons-material/Palette';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Import tutorial images from Tuto folder
import image1 from './Tuto/1.jpeg';
import image2 from './Tuto/2.jpeg';
import image3 from './Tuto/3.jpeg';
import image4 from './Tuto/4.jpeg';
import image5 from './Tuto/5.jpeg';
import image6 from './Tuto/6.png';
import image7 from './Tuto/7.jpeg';
import image8 from './Tuto/8.jpeg';
import image9 from './Tuto/9.jpeg';
import image10 from './Tuto/10.jpeg';

// Key for LocalStorage
export const USER_GUIDE_STORAGE_KEY = 'juicy_has_seen_user_guide';

// ─── Catalog data (mirrors STEPS_DATA titles/icons) ────────────────────────
const CATALOG_ITEMS = [
  { stepIndex: 0, emoji: '🌟', title: 'Daily Moods',       subtitle: 'Status notes & 15s music clips', color: '#9c27b0', bg: 'linear-gradient(135deg,#9c27b0,#e52e71)' },
  { stepIndex: 1, emoji: '😀', title: 'Stickers',          subtitle: 'Animated packs & trending emojis', color: '#ff8a00', bg: 'linear-gradient(135deg,#ff8a00,#ffb347)' },
  { stepIndex: 2, emoji: '🎨', title: 'Doodle Canvas',     subtitle: 'Draw & send sketches in chat',     color: '#e52e71', bg: 'linear-gradient(135deg,#e52e71,#ff8a00)' },
  { stepIndex: 3, emoji: '🎮', title: 'Play Games',        subtitle: 'Tic Tac Toe, Truth or Dare & more', color: '#00b4d8', bg: 'linear-gradient(135deg,#00b4d8,#0077b6)' },
  { stepIndex: 4, emoji: '💬', title: 'Message Reactions', subtitle: 'Long-press for reactions & options', color: '#38a169', bg: 'linear-gradient(135deg,#38a169,#2f855a)' },
  { stepIndex: 5, emoji: '🤖', title: 'Jerry Bot AI',      subtitle: '24/7 AI assistant for anything',    color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { stepIndex: 6, emoji: '☀️', title: 'App Theme',         subtitle: 'Light, dark & vibrant palettes',    color: '#8b5cf6', bg: 'linear-gradient(135deg,#8b5cf6,#d946ef)' },
  { stepIndex: 7, emoji: '🖼️', title: 'Wallpapers',        subtitle: 'Custom chat backgrounds & patterns', color: '#0284c7', bg: 'linear-gradient(135deg,#0284c7,#38bdf8)' },
  { stepIndex: 8, emoji: '✍️', title: 'Gestures',          subtitle: 'Tap logo → draw to open chats',     color: '#f06292', bg: 'linear-gradient(135deg,#f06292,#ab47bc)' },
  { stepIndex: 9, emoji: '👤', title: 'Edit Profile',      subtitle: 'Avatar, bio & privacy settings',    color: '#d97706', bg: 'linear-gradient(135deg,#d97706,#f59e0b)' },
];

// Step detail data used by CatalogStepContent
const STEP_DETAIL_DATA = [
  {
    image: image1,
    instructions: [
      { num: '1', badgeBg: '#9c27b0', text: 'Tap "Your note" (+): Located at the top of your chat list, tap your profile avatar note to post an update.' },
      { num: '2', badgeBg: '#e52e71', text: 'Add Music & Emojis: Write your thoughts and search for your favorite song preview 🎵 (15s audio clip).' },
      { num: '3', badgeBg: '#0284c7', text: 'React to Friends: Tap any friend\'s status bubble to listen to their music clip and send instant reactions!' }
    ]
  },
  {
    image: image2,
    instructions: [
      { num: '1', badgeBg: '#ff8a00', text: 'Open Sticker Bar: Tap the 😀 emoji icon in the chat input bar to open the sticker drawer.' },
      { num: '2', badgeBg: '#e52e71', text: 'Select Packs: Browse through animated sticker categories, meme packs, and emojis.' },
      { num: '3', badgeBg: '#16a34a', text: 'Instant Send: Tap any sticker to send it instantly in full animated detail to your chat partner!' }
    ]
  },
  {
    image: image3,
    instructions: [
      { num: '1', badgeBg: '#e52e71', text: 'Open Canvas: Click the 🎨 paintbrush icon in the chat input controls.' },
      { num: '2', badgeBg: '#9c27b0', text: 'Customize Colors & Brushes: Choose brush sizes and colors.' },
      { num: '3', badgeBg: '#16a34a', text: 'Send Sketch: Click Send to share your custom drawing directly inside the conversation.' }
    ]
  },
  {
    image: image4,
    instructions: [
      { num: '1', badgeBg: '#00b4d8', text: 'Tic Tac Toe: Tap 🎮 Game button → Pick Tic Tac Toe. Take turns marking X & O. First to match 3 in a row wins! 🏆' },
      { num: '2', badgeBg: '#0284c7', text: 'Truth or Dare: Pick 📜 Truth question or ⚡ Dare challenge. Complete prompt and pass turn!' },
      { num: '3', badgeBg: '#8b5cf6', text: 'Rock Paper Scissors: Pick ✊, ✋, or ✌️ secretly. Moves reveal simultaneously! ✊ beats ✌️, ✋ beats ✊.' }
    ]
  },
  {
    image: image5,
    instructions: [
      { num: '1', badgeBg: '#38a169', text: 'Long Press Message: Tap and hold any message bubble on mobile or click options on desktop.' },
      { num: '2', badgeBg: '#0284c7', text: 'Emoji Reactions: Tap ❤️, 👍, 😂, 😮, or 🔥 to attach instant reactions to messages.' },
      { num: '3', badgeBg: '#9c27b0', text: 'Reply & Copy: Use quick action buttons to reply directly to messages or copy text.' },
      { num: '4', badgeBg: '#e52e71', text: 'Delete Chat / User: Long press on a specific user in your chat list to delete or remove that chat conversation.' }
    ]
  },
  {
    image: image6,
    instructions: [
      { num: '1', badgeBg: '#6366f1', text: 'Open AI ChatBot: Tap Jerry Bot 🤖 at the top of your chat list to start an instant AI conversation.' },
      { num: '2', badgeBg: '#e52e71', text: 'Ask Anything: Type any question, ask for recipes, coding help, advice, jokes, or writing assistance.' },
      { num: '3', badgeBg: '#16a34a', text: 'Instant 24/7 Smart Answers: Get instant, intelligent AI answers anytime, day or night!' }
    ]
  },
  {
    image: image7,
    instructions: [
      { num: '1', badgeBg: '#8b5cf6', text: 'Go to Settings → Appearance in the app menu.' },
      { num: '2', badgeBg: '#e52e71', text: 'Select ☀️ Light Mode or 🌙 Dark Mode toggle.' },
      { num: '3', badgeBg: '#0284c7', text: 'Choose vibrant accent colors (Juicy Pink, Ocean Blue, Emerald Green, Royal Purple).' }
    ]
  },
  {
    image: image8,
    instructions: [
      { num: '1', badgeBg: '#0284c7', text: 'Go to Settings → Background Wallpapers.' },
      { num: '2', badgeBg: '#ff8a00', text: 'Pick curated wallpapers or upload custom photos from your device.' },
      { num: '3', badgeBg: '#16a34a', text: 'Adjust doodle pattern overlays and slider opacity to personalize your look!' }
    ]
  },
  {
    image: image9,
    instructions: [
      { num: '1', badgeBg: '#f06292', text: '⚙️ Setup First: Go to Settings → Contact Gestures. Tap "Map Gesture" next to any contact.' },
      { num: '2', badgeBg: '#ab47bc', text: '✏️ Draw & Save: Draw a unique symbol (⭐ star, ❤️ heart, ⚡ lightning bolt) then tap "Save Gesture".' },
      { num: '3', badgeBg: '#e91e63', text: '👆 Tap the App Logo: Go back to the chat list. Tap the Juicy 🍊 logo — this opens the Gesture Canvas!' },
      { num: '4', badgeBg: '#16a34a', text: '🚀 Draw to Open Chat: Draw the same shape you saved to instantly open that contact\'s chat room!' }
    ]
  },
  {
    image: image10,
    instructions: [
      { num: '1', badgeBg: '#d97706', text: 'Go to Settings → Edit Profile.' },
      { num: '2', badgeBg: '#e52e71', text: 'Upload a new profile picture and crop to perfection.' },
      { num: '3', badgeBg: '#0284c7', text: 'Update display name, personal bio status, and privacy settings.' }
    ]
  }
];

/** Renders the image + instruction list for a given step index inline */
const CatalogStepContent = ({ stepIndex, isMobile, isDarkTheme }) => {
  const step = CATALOG_ITEMS[stepIndex];
  const detail = STEP_DETAIL_DATA[stepIndex];
  if (!step || !detail) return null;
  return (
    <Box
      sx={{
        bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
        borderRadius: isMobile ? '20px' : '22px',
        border: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
        p: isMobile ? 1.4 : 2,
        boxShadow: isDarkTheme ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(30,41,59,0.05)'
      }}
    >
      {/* Phone frame with screenshot */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          borderRadius: isMobile ? '16px' : '18px',
          bgcolor: isDarkTheme ? 'rgba(229,46,113,0.06)' : '#fffafb',
          border: isDarkTheme ? '1px solid rgba(229,46,113,0.15)' : '1px solid #f1e5eb'
        }}
      >
        <Box
          sx={{
            width: { xs: 195, sm: 225, md: 245 },
            height: { xs: 320, sm: 360, md: 390 },
            borderRadius: '24px',
            border: '3px solid #1e293b',
            boxShadow: '0 12px 30px rgba(30,41,59,0.14)',
            bgcolor: '#000000',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Speaker notch */}
          <Box
            sx={{
              width: 40,
              height: 3.5,
              bgcolor: 'rgba(255,255,255,0.35)',
              borderRadius: 2,
              position: 'absolute',
              top: 5,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2
            }}
          />
          <Box
            component="img"
            src={detail.image}
            alt={step.title}
            sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </Box>
      </Box>

      {/* Instructions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 1.2 }}>
        {detail.instructions.map((inst, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: isMobile ? 1.2 : 1.5,
              bgcolor: isDarkTheme ? 'rgba(255,255,255,0.04)' : '#ffffff',
              p: isMobile ? '10px 12px' : '12px 14px',
              borderRadius: '16px',
              border: isDarkTheme ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1e5eb',
              boxShadow: isDarkTheme ? 'none' : '0 2px 8px rgba(30,41,59,0.03)'
            }}
          >
            <Box
              sx={{
                bgcolor: isDarkTheme ? 'rgba(229,46,113,0.18)' : '#fff0f5',
                color: '#e52e71',
                fontWeight: 800,
                mt: 0.2,
                minWidth: isMobile ? 22 : 24,
                width: isMobile ? 22 : 24,
                height: isMobile ? 22 : 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                border: isDarkTheme ? 'none' : '1px solid rgba(229,46,113,0.15)',
                flexShrink: 0
              }}
            >
              {inst.num}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: isDarkTheme ? '#f8fafc' : '#172033',
                fontSize: isMobile ? '0.8rem' : '0.88rem',
                lineHeight: 1.45,
                fontWeight: 500
              }}
            >
              {inst.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Feature Catalog Modal — accessible from Settings -> App Tutorial & User Guide.
 * Lists all app features as tap-able cards. Selecting a card
 * opens the matching step detail with prev/next arrows.
 */
export const FeatureCatalogModal = ({ open, onClose, isDarkTheme = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // null = catalog view; number = detail view for that stepIndex
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    if (!open) {
      setActiveIndex(null);
    }
  }, [open]);

  const handleCardClick = (stepIndex) => setActiveIndex(stepIndex);
  const handleDetailClose = () => setActiveIndex(null);

  const handlePrev = () =>
    setActiveIndex(prev => (prev > 0 ? prev - 1 : CATALOG_ITEMS.length - 1));
  const handleNext = () =>
    setActiveIndex(prev => (prev < CATALOG_ITEMS.length - 1 ? prev + 1 : 0));

  const handleFinish = () => {
    const loggedInUserId = localStorage.getItem('userId');
    if (loggedInUserId) {
      localStorage.setItem(`juicy_has_seen_user_guide_${loggedInUserId}`, 'true');
    }
    localStorage.setItem(USER_GUIDE_STORAGE_KEY, 'true');
    setActiveIndex(null);
    onClose();
  };

  return (
    <>
      {/* ── CATALOG GRID DIALOG ── */}
      <Dialog
        open={open && activeIndex === null}
        onClose={handleFinish}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkTheme ? '#181824' : '#fffafb',
            color: isDarkTheme ? '#ffffff' : '#172033',
            borderRadius: isMobile ? 0 : '24px',
            maxHeight: isMobile ? '100dvh' : '92vh',
            height: isMobile ? '100dvh' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isMobile ? 'none' : (isDarkTheme ? '0 24px 64px rgba(0,0,0,0.45)' : '0 24px 64px rgba(30,41,59,0.12)'),
            border: isMobile ? 'none' : (isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb'),
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            pt: isMobile ? 'calc(env(safe-area-inset-top) + 12px)' : '18px',
            pb: isMobile ? '12px' : '16px',
            px: isMobile ? 2 : 2.5,
            bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
            borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: '12px',
                bgcolor: isDarkTheme ? 'rgba(229,46,113,0.18)' : '#fff0f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '1.2rem' : '1.35rem',
                border: '1px solid rgba(229,46,113,0.15)'
              }}
            >
              🍊
            </Box>
            <Box>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                fontWeight={800}
                sx={{
                  color: isDarkTheme ? '#ffffff' : '#172033',
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                Juicy <Box component="span" sx={{ color: '#e52e71' }}>Guide</Box>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDarkTheme ? 'rgba(255,255,255,0.6)' : '#718096',
                  display: 'block',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  lineHeight: 1.2
                }}
              >
                Feature Catalog & Walkthrough
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handleFinish}
            size="small"
            sx={{
              color: isDarkTheme ? 'rgba(255,255,255,0.7)' : '#718096',
              bgcolor: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#fff0f5',
              borderRadius: '50%',
              p: 0.8,
              border: isDarkTheme ? 'none' : '1px solid #f1e5eb',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(229,46,113,0.12)',
                color: '#e52e71',
                transform: 'scale(1.05)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Catalog Grid */}
        <DialogContent
          sx={{
            p: isMobile ? 1.4 : 2,
            flex: '1 1 auto',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            bgcolor: isDarkTheme ? '#181824' : '#fffafb'
          }}
        >
          {/* Hero Welcome Section */}
          <Box
            sx={{
              p: isMobile ? '14px 14px' : '18px 20px',
              mb: isMobile ? 1.5 : 2,
              borderRadius: isMobile ? '20px' : '22px',
              bgcolor: isDarkTheme ? 'rgba(229,46,113,0.08)' : '#fff0f5',
              border: isDarkTheme ? '1px solid rgba(229,46,113,0.2)' : '1px solid #f1e5eb',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 1.5 : 2
            }}
          >
            <Box
              sx={{
                width: isMobile ? 48 : 54,
                height: isMobile ? 48 : 54,
                borderRadius: '16px',
                bgcolor: isDarkTheme ? 'rgba(229,46,113,0.25)' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '1.8rem' : '2rem',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(229,46,113,0.12)',
                border: '1px solid rgba(229,46,113,0.15)'
              }}
            >
              ✨
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.3 }}>
                <Typography
                  variant={isMobile ? 'subtitle1' : 'h6'}
                  fontWeight={800}
                  sx={{
                    color: isDarkTheme ? '#ffffff' : '#172033',
                    lineHeight: 1.2,
                    letterSpacing: '-0.2px'
                  }}
                >
                  Welcome to Juicy!
                </Typography>
                <Box component="span" sx={{ fontSize: '0.85rem' }}>💕</Box>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: isDarkTheme ? 'rgba(255,255,255,0.7)' : '#718096',
                  fontSize: isMobile ? '0.74rem' : '0.82rem',
                  lineHeight: 1.35
                }}
              >
                Explore Juicy features and learn how everything works.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 1.1 : 1.3
            }}
          >
            {CATALOG_ITEMS.map((item) => (
              <Box
                key={item.stepIndex}
                onClick={() => handleCardClick(item.stepIndex)}
                sx={{
                  borderRadius: '18px',
                  bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
                  border: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(229,46,113,0.10)',
                  boxShadow: isDarkTheme ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 18px rgba(30,41,59,0.06)',
                  p: isMobile ? '11px 14px' : '14px 16px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 1.4 : 1.6,
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.18s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: isDarkTheme ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 22px rgba(30,41,59,0.1)',
                    borderColor: isDarkTheme ? 'rgba(229,46,113,0.3)' : 'rgba(229,46,113,0.22)'
                  },
                  '&:active': { transform: 'scale(0.99)' }
                }}
              >
                {/* Emoji Avatar */}
                <Box
                  sx={{
                    width: isMobile ? 42 : 46,
                    height: isMobile ? 42 : 46,
                    borderRadius: '14px',
                    bgcolor: isDarkTheme ? 'rgba(229,46,113,0.15)' : '#fff0f5',
                    color: '#e52e71',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '1.4rem' : '1.55rem',
                    flexShrink: 0,
                    border: isDarkTheme ? '1px solid rgba(229,46,113,0.25)' : '1px solid rgba(229,46,113,0.12)'
                  }}
                >
                  {item.emoji}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    fontWeight={700}
                    sx={{
                      color: isDarkTheme ? '#ffffff' : '#172033',
                      fontSize: isMobile ? '0.9rem' : '0.96rem',
                      lineHeight: 1.25,
                      mb: 0.25
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: isDarkTheme ? 'rgba(255,255,255,0.6)' : '#718096',
                      fontSize: isMobile ? '0.74rem' : '0.78rem',
                      lineHeight: 1.35
                    }}
                  >
                    {item.subtitle}
                  </Typography>
                </Box>

                {/* Right-side pink chevron button */}
                <Box
                  sx={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    borderRadius: '50%',
                    bgcolor: isDarkTheme ? 'rgba(229,46,113,0.15)' : '#fff0f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: isDarkTheme ? 'none' : '1px solid rgba(229,46,113,0.15)',
                    transition: 'transform 0.18s ease',
                    '&:hover': { transform: 'translateX(2px)' }
                  }}
                >
                  <ArrowForwardIosIcon sx={{ color: '#e52e71', fontSize: isMobile ? '0.72rem' : '0.8rem', ml: '2px' }} />
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>

        {/* Footer */}
        <Box
          sx={{
            px: isMobile ? 2 : 2.5,
            py: isMobile ? 1.2 : 1.4,
            pb: isMobile ? 'calc(env(safe-area-inset-bottom) + 10px)' : undefined,
            bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
            borderTop: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Typography variant="caption" sx={{ color: isDarkTheme ? 'rgba(255,255,255,0.5)' : '#718096', fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 600 }}>
            {CATALOG_ITEMS.length} features available
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckCircleIcon fontSize="small" />}
            onClick={handleFinish}
            sx={{
              bgcolor: '#e52e71',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: '14px',
              textTransform: 'none',
              px: isMobile ? 2 : 2.5,
              py: 0.7,
              fontSize: isMobile ? '0.78rem' : '0.84rem',
              boxShadow: '0 4px 14px rgba(229,46,113,0.25)',
              '&:hover': {
                bgcolor: '#d02061',
                boxShadow: '0 6px 18px rgba(229,46,113,0.35)'
              }
            }}
          >
            Got it! 🎉
          </Button>
        </Box>
      </Dialog>

      {/* ── DETAIL DIALOG (UserGuideModal) with prev/next arrows ── */}
      {activeIndex !== null && (
        <Dialog
          open={open && activeIndex !== null}
          onClose={handleDetailClose}
          fullScreen={isMobile}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: isDarkTheme ? '#181824' : '#fffafb',
              color: isDarkTheme ? '#ffffff' : '#172033',
              borderRadius: isMobile ? 0 : '24px',
              maxHeight: isMobile ? '100dvh' : '94vh',
              height: isMobile ? '100dvh' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isMobile ? 'none' : (isDarkTheme ? '0 24px 64px rgba(0,0,0,0.45)' : '0 20px 60px rgba(30,41,59,0.12)'),
              border: isMobile ? 'none' : (isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb'),
              overflow: 'hidden'
            }
          }}
        >
          {/* Detail Header */}
          <Box
            sx={{
              pt: isMobile ? 'calc(env(safe-area-inset-top) + 10px)' : '16px',
              pb: isMobile ? '10px' : '14px',
              px: isMobile ? 1.5 : 2.5,
              bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
              borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            {/* Back to catalog */}
            <IconButton
              onClick={handleDetailClose}
              size="small"
              sx={{
                color: isDarkTheme ? 'rgba(255,255,255,0.7)' : '#718096',
                bgcolor: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#fff0f5',
                borderRadius: '50%',
                p: 0.8,
                border: isDarkTheme ? 'none' : '1px solid #f1e5eb',
                '&:hover': {
                  bgcolor: 'rgba(229,46,113,0.12)',
                  color: '#e52e71'
                }
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" sx={{ ml: '4px' }} />
            </IconButton>

            <Box sx={{ flex: 1, mx: 1.5, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box
                sx={{
                  width: isMobile ? 34 : 38,
                  height: isMobile ? 34 : 38,
                  borderRadius: '12px',
                  bgcolor: isDarkTheme ? 'rgba(229,46,113,0.18)' : '#fff0f5',
                  color: '#e52e71',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '1.15rem' : '1.3rem',
                  flexShrink: 0,
                  border: isDarkTheme ? 'none' : '1px solid rgba(229,46,113,0.15)'
                }}
              >
                {CATALOG_ITEMS[activeIndex].emoji}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  fontWeight={750}
                  sx={{
                    fontSize: isMobile ? '0.92rem' : '1.05rem',
                    color: isDarkTheme ? '#ffffff' : '#172033',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2
                  }}
                >
                  {CATALOG_ITEMS[activeIndex].title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkTheme ? 'rgba(255,255,255,0.55)' : '#718096',
                    fontSize: isMobile ? '0.68rem' : '0.74rem',
                    display: 'block'
                  }}
                >
                  Feature {activeIndex + 1} of {CATALOG_ITEMS.length}
                </Typography>
              </Box>
            </Box>

            <Chip
              label={`${activeIndex + 1}/${CATALOG_ITEMS.length}`}
              size="small"
              sx={{
                bgcolor: isDarkTheme ? 'rgba(229,46,113,0.2)' : '#fff0f5',
                color: '#e52e71',
                fontWeight: 800,
                fontSize: '0.72rem',
                border: isDarkTheme ? 'none' : '1px solid rgba(229,46,113,0.2)',
                mr: 0.5
              }}
            />
            <IconButton
              onClick={handleDetailClose}
              size="small"
              sx={{
                color: isDarkTheme ? 'rgba(255,255,255,0.7)' : '#718096',
                bgcolor: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#fff0f5',
                borderRadius: '50%',
                p: 0.8,
                border: isDarkTheme ? 'none' : '1px solid #f1e5eb',
                '&:hover': {
                  bgcolor: 'rgba(229,46,113,0.12)',
                  color: '#e52e71'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Progress bar */}
          <Box sx={{ width: '100%', bgcolor: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#f1e5eb', flexShrink: 0, height: 3.5 }}>
            <Box
              sx={{
                height: '100%',
                width: `${((activeIndex + 1) / CATALOG_ITEMS.length) * 100}%`,
                bgcolor: '#e52e71',
                transition: 'width 0.35s ease'
              }}
            />
          </Box>

          {/* Inline step content */}
          <Box sx={{ flex: '1 1 auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch', p: isMobile ? 1.4 : 2, bgcolor: isDarkTheme ? '#181824' : '#fffafb' }}>
            <CatalogStepContent stepIndex={activeIndex} isMobile={isMobile} isDarkTheme={isDarkTheme} />
          </Box>

          {/* Prev / Next arrow footer */}
          <Box
            sx={{
              px: isMobile ? 1.5 : 2.5,
              py: isMobile ? 1.2 : 1.4,
              pb: isMobile ? 'calc(env(safe-area-inset-bottom) + 8px)' : undefined,
              bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
              borderTop: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            {/* Prev arrow */}
            <Button
              size="small"
              startIcon={<ArrowBackIosNewIcon fontSize="small" />}
              onClick={handlePrev}
              sx={{
                borderRadius: '14px',
                fontWeight: 700,
                textTransform: 'none',
                border: '1px solid rgba(229,46,113,0.3)',
                color: '#e52e71',
                bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff',
                fontSize: isMobile ? '0.78rem' : '0.84rem',
                px: isMobile ? 1.6 : 2,
                py: 0.7,
                '&:hover': {
                  bgcolor: '#fff0f5',
                  borderColor: '#e52e71'
                }
              }}
            >
              Prev
            </Button>

            {/* Dot indicators */}
            <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {CATALOG_ITEMS.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  sx={{
                    width: activeIndex === i ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: activeIndex === i ? '#e52e71' : (isDarkTheme ? 'rgba(255,255,255,0.2)' : '#f1e5eb'),
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>

            {/* Next / Done arrow */}
            {activeIndex < CATALOG_ITEMS.length - 1 ? (
              <Button
                size="small"
                variant="contained"
                endIcon={<ArrowForwardIosIcon fontSize="small" />}
                onClick={handleNext}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: '#e52e71',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.78rem' : '0.84rem',
                  px: isMobile ? 1.8 : 2.2,
                  py: 0.7,
                  boxShadow: '0 4px 14px rgba(229,46,113,0.25)',
                  '&:hover': {
                    bgcolor: '#d02061',
                    boxShadow: '0 6px 18px rgba(229,46,113,0.35)'
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckCircleIcon fontSize="small" />}
                onClick={handleFinish}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: '#e52e71',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.78rem' : '0.84rem',
                  px: isMobile ? 1.8 : 2.2,
                  py: 0.7,
                  boxShadow: '0 4px 14px rgba(229,46,113,0.25)',
                  '&:hover': {
                    bgcolor: '#d02061',
                    boxShadow: '0 6px 18px rgba(229,46,113,0.35)'
                  }
                }}
              >
                Done 🎉
              </Button>
            )}
          </Box>
        </Dialog>
      )}
    </>
  );
};


/**
 * 10-Step Onboarding Walkthrough User Guide Modal (with AI ChatBot Guide)
 */
export const UserGuideModal = ({
  open,
  onClose,
  initialStep = 0,
  isDarkTheme = false,
  hideSkipButton = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [selectedGameTab, setSelectedGameTab] = useState('tictactoe');

  useEffect(() => {
    if (open) {
      setCurrentStep(initialStep);
    }
  }, [open, initialStep]);

  const handleClose = () => {
    const loggedInUserId = localStorage.getItem('userId');
    if (loggedInUserId) {
      localStorage.setItem(`juicy_has_seen_user_guide_${loggedInUserId}`, 'true');
    }
    localStorage.setItem(USER_GUIDE_STORAGE_KEY, 'true');
    onClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleNext = () => {
    if (currentStep < 9) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const STEPS_DATA = [
    {
      title: "1. How to Add Daily Moods 🌟",
      subtitle: "Share status notes, daily thoughts & 15s music song clips!",
      icon: <AutoAwesomeIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#9c27b0',
      image: image1,
      instructions: [
        { num: '1', badgeBg: '#9c27b0', text: 'Tap "Your note" (+): Located at the top of your chat list, tap your profile avatar note to post an update.' },
        { num: '2', badgeBg: '#e52e71', text: 'Add Music & Emojis: Write your thoughts and search for your favorite song preview 🎵 (15s audio clip).' },
        { num: '3', badgeBg: '#0284c7', text: 'React to Friends: Tap any friend\'s status bubble to listen to their music clip and send instant reactions!' }
      ]
    },
    {
      title: "2. How to Create & Send Stickers 😀",
      subtitle: "Express feelings with animated sticker packs and trending emojis!",
      icon: <EmojiEmotionsIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#ff8a00',
      image: image2,
      instructions: [
        { num: '1', badgeBg: '#ff8a00', text: 'Open Sticker Bar: Tap the 😀 emoji icon in the chat input bar to open the sticker drawer.' },
        { num: '2', badgeBg: '#e52e71', text: 'Select Packs: Browse through animated sticker categories, meme packs, and emojis.' },
        { num: '3', badgeBg: '#16a34a', text: 'Instant Send: Tap any sticker to send it instantly in full animated detail to your chat partner!' }
      ]
    },
    {
      title: "3. How to Draw & Doodle Canvas 🎨",
      subtitle: "Sketch handwritten notes, doodles & artwork directly in chat!",
      icon: <BrushIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#e52e71',
      image: image3,
      instructions: [
        { num: '1', badgeBg: '#e52e71', text: 'Open Canvas: Click the 🎨 paintbrush icon in the chat input controls.' },
        { num: '2', badgeBg: '#9c27b0', text: 'Customize Colors & Brushes: Choose brush sizes and choose colors.' },
        { num: '3', badgeBg: '#16a34a', text: 'Send Sketch: Click Send to share your custom drawing directly inside the conversation.' }
      ]
    },
    {
      title: "4. How to Play 3 Games 🎮",
      subtitle: "Tic Tac Toe ❌⭕, Truth or Dare 📜⚡ & Rock Paper Scissors ✊✌️!",
      icon: <SportsEsportsIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#00b4d8',
      image: image4,
      customGameTab: true
    },
    {
      title: "5. Long Press Message Reactions & Options 💬",
      subtitle: "Long press messages for reactions, or long press a user in chat list to delete!",
      icon: <TouchAppIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#38a169',
      image: image5,
      instructions: [
        { num: '1', badgeBg: '#38a169', text: 'Long Press Message: Tap and hold any message bubble on mobile or click options on desktop.' },
        { num: '2', badgeBg: '#0284c7', text: 'Emoji Reactions: Tap ❤️, 👍, 😂, 😮, or 🔥 to attach instant reactions to messages.' },
        { num: '3', badgeBg: '#9c27b0', text: 'Reply & Copy: Use quick action buttons to reply directly to messages or copy text.' },
        { num: '4', badgeBg: '#e52e71', text: 'Delete Chat / User: Long press on a specific user in your chat list to delete or remove that chat conversation.' }
      ]
    },
    {
      title: "6. How to Chat with Jerry Bot AI 🤖",
      subtitle: "Your 24/7 personal AI assistant for answers, advice, recipes & smart chats!",
      icon: <SmartToyIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#6366f1',
      image: image6,
      instructions: [
        { num: '1', badgeBg: '#6366f1', text: 'Open AI ChatBot: Tap Jerry Bot 🤖 at the top of your chat list to start an instant AI conversation.' },
        { num: '2', badgeBg: '#e52e71', text: 'Ask Anything: Type any question, ask for recipes, coding help, advice, jokes, or writing assistance.' },
        { num: '3', badgeBg: '#16a34a', text: 'Instant 24/7 Smart Answers: Get instant, intelligent AI answers anytime, day or night!' }
      ]
    },
    {
      title: "7. How to Set App Theme ☀️🌙",
      subtitle: "Switch light mode, dark mode & vibrant color palettes!",
      icon: <PaletteIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#8b5cf6',
      image: image7,
      instructions: [
        { num: '1', badgeBg: '#8b5cf6', text: 'Go to Settings → Appearance in the app menu.' },
        { num: '2', badgeBg: '#e52e71', text: 'Select ☀️ Light Mode or 🌙 Dark Mode toggle.' },
        { num: '3', badgeBg: '#0284c7', text: 'Choose vibrant accent colors (Juicy Pink, Ocean Blue, Emerald Green, Royal Purple).' }
      ]
    },
    {
      title: "8. Background Wallpapers & Patterns 🖼️",
      subtitle: "Customize your chat background wallpapers & pattern opacity!",
      icon: <WallpaperIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#0284c7',
      image: image8,
      instructions: [
        { num: '1', badgeBg: '#0284c7', text: 'Go to Settings → Background Wallpapers.' },
        { num: '2', badgeBg: '#ff8a00', text: 'Pick curated wallpapers or upload custom photos from your device.' },
        { num: '3', badgeBg: '#16a34a', text: 'Adjust doodle pattern overlays and slider opacity to personalize your look!' }
      ]
    },
    {
      title: "9. How to Set Contact Gestures ✍️",
      subtitle: "Tap the Juicy logo → Draw your gesture → Open chat instantly!",
      icon: <GestureIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#f06292',
      image: image9,
      instructions: [
        { num: '1', badgeBg: '#f06292', text: '⚙️ Setup First: Go to Settings → Contact Gestures. Tap "Map Gesture" next to any contact you want to assign a shortcut to.' },
        { num: '2', badgeBg: '#ab47bc', text: '✏️ Draw & Save: Draw a unique symbol on the canvas — try a ⭐ star, ❤️ heart, or ⚡ lightning bolt — then tap "Save Gesture" to store it.' },
        { num: '3', badgeBg: '#e91e63', text: '👆 Tap the App Logo: Go back to the main chat list screen. Tap the Juicy 🍊 logo at the top of the screen — this opens the Gesture Canvas!' },
        { num: '4', badgeBg: '#16a34a', text: '🚀 Draw to Open Chat: On the Gesture Canvas, draw the same shape you saved. The app will instantly recognize it and open that contact\'s chat room — no searching needed!' }
      ]
    },
    {
      title: "10. How to Edit Profile & Bio 👤",
      subtitle: "Update profile avatar, display name, bio description & privacy!",
      icon: <AccountCircleIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#d97706',
      image: image10,
      instructions: [
        { num: '1', badgeBg: '#d97706', text: 'Go to Settings → Edit Profile.' },
        { num: '2', badgeBg: '#e52e71', text: 'Upload a new profile picture and crop to perfection.' },
        { num: '3', badgeBg: '#0284c7', text: 'Update display name, personal bio status, and privacy settings.' }
      ]
    }
  ];

  const activeStepObj = STEPS_DATA[currentStep];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: isDarkTheme ? '#181824' : '#fffafb',
          color: isDarkTheme ? '#ffffff' : '#172033',
          borderRadius: isMobile ? 0 : '24px',
          maxHeight: isMobile ? '100dvh' : '94vh',
          height: isMobile ? '100dvh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMobile ? 'none' : (isDarkTheme ? '0 24px 64px rgba(0,0,0,0.45)' : '0 20px 60px rgba(30,41,59,0.12)'),
          border: isMobile ? 'none' : (isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb'),
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: isMobile ? 1.2 : 1.5,
          pt: isMobile ? 'calc(env(safe-area-inset-top) + 10px)' : 2,
          px: isMobile ? 2 : 2.5,
          flexShrink: 0,
          bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
          borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.2 : 1.5, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: isMobile ? 36 : 42,
              height: isMobile ? 36 : 42,
              minWidth: isMobile ? 36 : 42,
              borderRadius: isMobile ? '12px' : '14px',
              bgcolor: isDarkTheme ? 'rgba(229,46,113,0.18)' : '#fff0f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isDarkTheme ? 'none' : '1px solid rgba(229,46,113,0.15)',
              '& .MuiSvgIcon-root': {
                color: '#e52e71 !important',
                fontSize: isMobile ? 20 : 24
              }
            }}
          >
            {activeStepObj.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              fontWeight={750}
              sx={{
                lineHeight: 1.2,
                color: isDarkTheme ? '#ffffff' : '#172033',
                fontSize: isMobile ? '0.94rem' : '1.15rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeStepObj.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDarkTheme ? 'rgba(255,255,255,0.6)' : '#718096',
                display: 'block',
                fontSize: isMobile ? '0.7rem' : '0.78rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeStepObj.subtitle}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: isDarkTheme ? 'rgba(255,255,255,0.7)' : '#718096',
            bgcolor: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#fff0f5',
            borderRadius: '50%',
            p: 0.8,
            ml: 1,
            border: isDarkTheme ? 'none' : '1px solid #f1e5eb',
            '&:hover': {
              bgcolor: 'rgba(229,46,113,0.12)',
              color: '#e52e71'
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Progress Bar & Dots Indicator */}
      <Box sx={{ width: '100%', bgcolor: isDarkTheme ? 'rgba(255,255,255,0.06)' : '#f1e5eb', flexShrink: 0 }}>
        <LinearProgress
          variant="determinate"
          value={((currentStep + 1) / 10) * 100}
          sx={{
            height: 3.5,
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#e52e71'
            }
          }}
        />
        <Box
          sx={{
            px: isMobile ? 1.5 : 2.5,
            py: 0.8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
            borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1e5eb'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`Step ${currentStep + 1}/10`}
              size="small"
              sx={{
                height: 22,
                bgcolor: isDarkTheme ? 'rgba(229,46,113,0.2)' : '#fff0f5',
                color: '#e52e71',
                fontWeight: 750,
                fontSize: isMobile ? '0.68rem' : '0.74rem',
                border: isDarkTheme ? 'none' : '1px solid rgba(229,46,113,0.2)'
              }}
            />
            {/* Dots Indicator */}
            <Box sx={{ display: 'flex', gap: '3px' }}>
              {STEPS_DATA.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  sx={{
                    width: currentStep === index ? 14 : 5,
                    height: 5,
                    borderRadius: 3,
                    bgcolor: currentStep === index ? '#e52e71' : (isDarkTheme ? 'rgba(255,255,255,0.2)' : '#f1e5eb'),
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
          </Box>
          <Typography variant="caption" fontWeight={600} sx={{ color: isDarkTheme ? 'rgba(255,255,255,0.6)' : '#718096', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
            {Math.round(((currentStep + 1) / 10) * 100)}% Completed
          </Typography>
        </Box>
      </Box>

      {/* Content Area */}
      <DialogContent
        sx={{
          p: isMobile ? 1.4 : 2,
          flex: '1 1 auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          bgcolor: isDarkTheme ? '#181824' : '#fffafb'
        }}
      >
        <Card
          sx={{
            bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
            border: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
            borderRadius: isMobile ? '20px' : '22px',
            p: isMobile ? 1.4 : 2,
            boxShadow: isDarkTheme ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(30,41,59,0.05)',
            overflow: 'hidden'
          }}
        >
          {/* PORTRAIT MOBILE PHONE HERO IMAGE FRAME */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: isMobile ? 1.5 : 2,
              px: 1,
              mb: isMobile ? 1.5 : 2,
              borderRadius: isMobile ? '16px' : '18px',
              bgcolor: isDarkTheme ? 'rgba(229,46,113,0.06)' : '#fffafb',
              border: isDarkTheme ? '1px solid rgba(229,46,113,0.15)' : '1px solid #f1e5eb'
            }}
          >
            {/* Phone Bezel Frame */}
            <Box
              sx={{
                width: { xs: 195, sm: 225, md: 245 },
                height: { xs: 320, sm: 360, md: 390 },
                borderRadius: '24px',
                border: '3px solid #1e293b',
                boxShadow: '0 12px 30px rgba(30,41,59,0.14)',
                bgcolor: '#000000',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Phone Speaker Notch */}
              <Box
                sx={{
                  width: 40,
                  height: 3.5,
                  bgcolor: 'rgba(255,255,255,0.35)',
                  borderRadius: 2,
                  position: 'absolute',
                  top: 5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2
                }}
              />

              {/* Portrait Screenshot Image */}
              <Box
                component="img"
                src={activeStepObj.image}
                alt={activeStepObj.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </Box>
          </Box>

          {/* GAME TAB SELECTOR (STEP 4) */}
          {activeStepObj.customGameTab && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  overflowX: isMobile ? 'auto' : 'visible',
                  pb: isMobile ? 0.5 : 0,
                  justifyContent: isMobile ? 'flex-start' : 'center',
                  mb: 1.5,
                  WebkitOverflowScrolling: 'touch',
                  '&::-webkit-scrollbar': { display: 'none' }
                }}
              >
                <Button
                  size="small"
                  onClick={() => setSelectedGameTab('tictactoe')}
                  sx={{
                    borderRadius: '20px',
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    bgcolor: selectedGameTab === 'tictactoe' ? '#e52e71' : (isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    color: selectedGameTab === 'tictactoe' ? '#ffffff' : (isDarkTheme ? 'rgba(255,255,255,0.8)' : '#718096'),
                    border: selectedGameTab === 'tictactoe' ? '1px solid #e52e71' : (isDarkTheme ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1e5eb'),
                    boxShadow: selectedGameTab === 'tictactoe' ? '0 4px 12px rgba(229,46,113,0.25)' : 'none',
                    fontSize: isMobile ? '0.75rem' : '0.8125rem',
                    px: 1.8,
                    py: 0.6,
                    '&:hover': {
                      bgcolor: selectedGameTab === 'tictactoe' ? '#d02061' : '#fff0f5',
                      color: selectedGameTab === 'tictactoe' ? '#ffffff' : '#e52e71'
                    }
                  }}
                >
                  ❌⭕ Tic Tac Toe
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedGameTab('truthordare')}
                  sx={{
                    borderRadius: '20px',
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    bgcolor: selectedGameTab === 'truthordare' ? '#e52e71' : (isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    color: selectedGameTab === 'truthordare' ? '#ffffff' : (isDarkTheme ? 'rgba(255,255,255,0.8)' : '#718096'),
                    border: selectedGameTab === 'truthordare' ? '1px solid #e52e71' : (isDarkTheme ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1e5eb'),
                    boxShadow: selectedGameTab === 'truthordare' ? '0 4px 12px rgba(229,46,113,0.25)' : 'none',
                    fontSize: isMobile ? '0.75rem' : '0.8125rem',
                    px: 1.8,
                    py: 0.6,
                    '&:hover': {
                      bgcolor: selectedGameTab === 'truthordare' ? '#d02061' : '#fff0f5',
                      color: selectedGameTab === 'truthordare' ? '#ffffff' : '#e52e71'
                    }
                  }}
                >
                  📜⚡ Truth or Dare
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedGameTab('rps')}
                  sx={{
                    borderRadius: '20px',
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    bgcolor: selectedGameTab === 'rps' ? '#e52e71' : (isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    color: selectedGameTab === 'rps' ? '#ffffff' : (isDarkTheme ? 'rgba(255,255,255,0.8)' : '#718096'),
                    border: selectedGameTab === 'rps' ? '1px solid #e52e71' : (isDarkTheme ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1e5eb'),
                    boxShadow: selectedGameTab === 'rps' ? '0 4px 12px rgba(229,46,113,0.25)' : 'none',
                    fontSize: isMobile ? '0.75rem' : '0.8125rem',
                    px: 1.8,
                    py: 0.6,
                    '&:hover': {
                      bgcolor: selectedGameTab === 'rps' ? '#d02061' : '#fff0f5',
                      color: selectedGameTab === 'rps' ? '#ffffff' : '#e52e71'
                    }
                  }}
                >
                  ✊✋✌️ Rock Paper Scissors
                </Button>
              </Box>
              {selectedGameTab === 'tictactoe' && (
                <Typography
                  variant="body2"
                  sx={{
                    color: isDarkTheme ? '#f8fafc' : '#172033',
                    p: 1.4,
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.04)' : '#fffafc',
                    borderRadius: '16px',
                    border: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
                    fontSize: isMobile ? '0.78rem' : '0.875rem',
                    lineHeight: 1.45
                  }}
                >
                  <strong>Tic Tac Toe:</strong> Tap 🎮 Game button → Pick Tic Tac Toe. Take turns marking X & O. Be the first to match 3 in a row to win! 🏆
                </Typography>
              )}
              {selectedGameTab === 'truthordare' && (
                <Typography
                  variant="body2"
                  sx={{
                    color: isDarkTheme ? '#f8fafc' : '#172033',
                    p: 1.4,
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.04)' : '#fffafc',
                    borderRadius: '16px',
                    border: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
                    fontSize: isMobile ? '0.78rem' : '0.875rem',
                    lineHeight: 1.45
                  }}
                >
                  <strong>Truth or Dare:</strong> Pick 📜 Truth question or ⚡ Dare challenge. Complete prompt with photo/voice and pass turn for continuous fun!
                </Typography>
              )}
              {selectedGameTab === 'rps' && (
                <Typography
                  variant="body2"
                  sx={{
                    color: isDarkTheme ? '#f8fafc' : '#172033',
                    p: 1.4,
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.04)' : '#fffafc',
                    borderRadius: '16px',
                    border: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb',
                    fontSize: isMobile ? '0.78rem' : '0.875rem',
                    lineHeight: 1.45
                  }}
                >
                  <strong>Rock Paper Scissors:</strong> Pick ✊, ✋, or ✌️ secretly. Moves reveal simultaneously! ✊ beats ✌️, ✌️ beats ✋, ✋ beats ✊.
                </Typography>
              )}
            </Box>
          )}

          {/* INSTRUCTIONS LIST */}
          {activeStepObj.instructions && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 1.2 }}>
              {activeStepObj.instructions.map((inst, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: isMobile ? 1.2 : 1.5,
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    p: isMobile ? '10px 12px' : '12px 14px',
                    borderRadius: '16px',
                    border: isDarkTheme ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1e5eb',
                    boxShadow: isDarkTheme ? 'none' : '0 2px 8px rgba(30,41,59,0.03)'
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: isDarkTheme ? 'rgba(229,46,113,0.18)' : '#fff0f5',
                      color: '#e52e71',
                      fontWeight: 800,
                      mt: 0.2,
                      minWidth: isMobile ? 22 : 24,
                      width: isMobile ? 22 : 24,
                      height: isMobile ? 22 : 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '0.72rem' : '0.78rem',
                      border: isDarkTheme ? 'none' : '1px solid rgba(229,46,113,0.15)',
                      flexShrink: 0
                    }}
                  >
                    {inst.num}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkTheme ? '#f8fafc' : '#172033',
                      fontSize: isMobile ? '0.8rem' : '0.88rem',
                      lineHeight: 1.45,
                      fontWeight: 500
                    }}
                  >
                    {inst.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          p: isMobile ? 1.2 : 2,
          pb: isMobile ? 'calc(env(safe-area-inset-bottom) + 10px)' : 2,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          bgcolor: isDarkTheme ? '#1e1e2d' : '#ffffff',
          borderTop: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1e5eb'
        }}
      >
        {/* Skip Button */}
        {!hideSkipButton && (
          <Button
            size="small"
            onClick={handleSkip}
            sx={{
              color: isDarkTheme ? 'rgba(255,255,255,0.5)' : '#718096',
              fontWeight: 600,
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              textTransform: 'none',
              px: isMobile ? 1 : 1.5,
              '&:hover': { color: '#e52e71', bgcolor: 'transparent' }
            }}
          >
            Skip
          </Button>
        )}

        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          {currentStep > 0 && (
            <Button
              size="small"
              startIcon={<NavigateBeforeIcon fontSize={isMobile ? "small" : "medium"} />}
              onClick={handleBack}
              sx={{
                borderRadius: '14px',
                fontWeight: 700,
                textTransform: 'none',
                border: '1px solid rgba(229,46,113,0.3)',
                color: '#e52e71',
                bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff',
                fontSize: isMobile ? '0.78rem' : '0.85rem',
                px: isMobile ? 1.5 : 2,
                py: 0.7,
                '&:hover': {
                  bgcolor: '#fff0f5',
                  borderColor: '#e52e71'
                }
              }}
            >
              Back
            </Button>
          )}

          {currentStep < 9 ? (
            <Button
              size="small"
              variant="contained"
              endIcon={<NavigateNextIcon fontSize={isMobile ? "small" : "medium"} />}
              onClick={handleNext}
              sx={{
                bgcolor: '#e52e71',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '14px',
                px: isMobile ? 2 : 2.5,
                py: 0.7,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(229, 46, 113, 0.25)',
                '&:hover': {
                  bgcolor: '#d02061',
                  boxShadow: '0 6px 18px rgba(229, 46, 113, 0.35)'
                }
              }}
            >
              Next Step
            </Button>
          ) : (
            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircleIcon fontSize="small" />}
              onClick={handleClose}
              sx={{
                bgcolor: '#e52e71',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '14px',
                px: isMobile ? 2.2 : 2.8,
                py: 0.7,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(229, 46, 113, 0.25)',
                '&:hover': {
                  bgcolor: '#d02061',
                  boxShadow: '0 6px 18px rgba(229, 46, 113, 0.35)'
                }
              }}
            >
              Finish 🎉
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default UserGuideModal;
