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
  Paper,
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

// Import tutorial images from Tuto folder
import image1 from './Tuto/1.jpeg';
import image2 from './Tuto/2.jpeg';
import image3 from './Tuto/3.jpeg';
import image4 from './Tuto/4.jpeg';
import image5 from './Tuto/5.jpeg';
import image6 from './Tuto/6.jpeg';
import image7 from './Tuto/7.jpeg';
import image8 from './Tuto/8.jpeg';
import image9 from './Tuto/9.jpeg';
import image10 from './Tuto/10.jpeg';

// Key for LocalStorage
export const USER_GUIDE_STORAGE_KEY = 'juicy_has_seen_user_guide';

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
      subtitle: "Map custom gesture shapes to contacts to open chats instantly!",
      icon: <GestureIcon sx={{ color: '#fff', fontSize: isMobile ? 22 : 26 }} />,
      color: '#f06292',
      image: image9,
      instructions: [
        { num: '1', badgeBg: '#f06292', text: 'Map Gesture: Go to Settings → Contact Gestures. Tap "Map Gesture" next to any contact.' },
        { num: '2', badgeBg: '#ab47bc', text: 'Draw & Save: Draw a custom symbol (⭐ star, ❤️ heart, ⚡ lightning) and click Save Gesture.' },
        { num: '3', badgeBg: '#16a34a', text: 'Draw to Open Chat: From your main chat list screen, after clicking the + icon (or ✍️ Gesture button), draw your saved shape to open your contact\'s chat room instantly!' }
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
          background: 'linear-gradient(145deg, #ffffff 0%, #f7f9fd 100%)',
          color: '#1a1a2e',
          borderRadius: isMobile ? 0 : 4,
          maxHeight: isMobile ? '100dvh' : '94vh',
          height: isMobile ? '100dvh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMobile ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: isMobile ? 'none' : '1px solid rgba(229, 46, 113, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: isMobile ? 1 : 1.5,
          pt: isMobile ? 'calc(env(safe-area-inset-top) + 10px)' : 2,
          px: isMobile ? 2 : 3,
          flexShrink: 0,
          background: 'linear-gradient(90deg, rgba(229,46,113,0.08) 0%, rgba(255,138,0,0.08) 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.2 : 1.5, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: isMobile ? 34 : 42,
              height: isMobile ? 34 : 42,
              minWidth: isMobile ? 34 : 42,
              borderRadius: isMobile ? '10px' : '12px',
              background: activeStepObj.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
            }}
          >
            {activeStepObj.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              fontWeight={800}
              sx={{
                lineHeight: 1.2,
                color: '#1a1a2e',
                fontSize: isMobile ? '0.98rem' : '1.25rem',
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
                color: 'rgba(0,0,0,0.65)',
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

        <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(0,0,0,0.6)', ml: 1 }}>
          <CloseIcon fontSize={isMobile ? "small" : "medium"} />
        </IconButton>
      </DialogTitle>

      {/* Progress Bar & Dots Indicator */}
      <Box sx={{ width: '100%', bgcolor: '#edf2f7', flexShrink: 0 }}>
        <LinearProgress
          variant="determinate"
          value={((currentStep + 1) / 10) * 100}
          sx={{
            height: isMobile ? 4 : 5,
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #ff8a00 0%, #e52e71 100%)'
            }
          }}
        />
        <Box sx={{ px: isMobile ? 1.5 : 2, py: isMobile ? 0.4 : 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={`Step ${currentStep + 1}/10`}
              size="small"
              sx={{
                height: isMobile ? 20 : 22,
                bgcolor: '#e52e71',
                color: '#fff',
                fontWeight: 800,
                fontSize: isMobile ? '0.68rem' : '0.75rem'
              }}
            />
            {/* Mobile Dots Indicator */}
            {isMobile && (
              <Box sx={{ display: 'flex', gap: '3px', ml: 1 }}>
                {STEPS_DATA.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    sx={{
                      width: currentStep === index ? 14 : 5,
                      height: 5,
                      borderRadius: 3,
                      bgcolor: currentStep === index ? '#e52e71' : 'rgba(0,0,0,0.18)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
          <Typography variant="caption" fontWeight={600} sx={{ color: '#718096', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
            {Math.round(((currentStep + 1) / 10) * 100)}% Completed
          </Typography>
        </Box>
      </Box>

      {/* Content Area */}
      <DialogContent
        sx={{
          p: isMobile ? 1.2 : 2,
          flex: '1 1 auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          bgcolor: '#f8fafd'
        }}
      >
        <Card
          sx={{
            bgcolor: '#ffffff',
            border: `1px solid ${activeStepObj.color}33`,
            borderRadius: isMobile ? 2.5 : 3,
            p: isMobile ? 1.2 : 2,
            boxShadow: isMobile ? '0 4px 16px rgba(0,0,0,0.04)' : '0 8px 30px rgba(0,0,0,0.06)',
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
              borderRadius: isMobile ? 2.5 : 3,
              background: 'linear-gradient(135deg, rgba(240,98,146,0.06) 0%, rgba(255,138,0,0.06) 100%)',
              border: `1px solid ${activeStepObj.color}25`
            }}
          >
            {/* Phone Bezel Frame */}
            <Box
              sx={{
                width: { xs: 200, sm: 230, md: 250 },
                height: { xs: 330, sm: 370, md: 400 },
                borderRadius: '24px',
                border: '4px solid #1e293b',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.16)',
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
                  width: 44,
                  height: 4,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  position: 'absolute',
                  top: 6,
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
                  variant={selectedGameTab === 'tictactoe' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedGameTab('tictactoe')}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: selectedGameTab === 'tictactoe' ? 'linear-gradient(90deg, #ff8a00, #e52e71)' : '#fff',
                    color: selectedGameTab === 'tictactoe' ? '#fff' : '#e52e71',
                    fontSize: isMobile ? '0.75rem' : '0.8125rem'
                  }}
                >
                  ❌⭕ Tic Tac Toe
                </Button>
                <Button
                  size="small"
                  variant={selectedGameTab === 'truthordare' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedGameTab('truthordare')}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: selectedGameTab === 'truthordare' ? 'linear-gradient(90deg, #00b4d8, #0077b6)' : '#fff',
                    color: selectedGameTab === 'truthordare' ? '#fff' : '#00b4d8',
                    fontSize: isMobile ? '0.75rem' : '0.8125rem'
                  }}
                >
                  📜⚡ Truth or Dare
                </Button>
                <Button
                  size="small"
                  variant={selectedGameTab === 'rps' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedGameTab('rps')}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: selectedGameTab === 'rps' ? 'linear-gradient(90deg, #8b5cf6, #6d28d9)' : '#fff',
                    color: selectedGameTab === 'rps' ? '#fff' : '#8b5cf6',
                    fontSize: isMobile ? '0.75rem' : '0.8125rem'
                  }}
                >
                  ✊✋✌️ Rock Paper Scissors
                </Button>
              </Box>
              {selectedGameTab === 'tictactoe' && (
                <Typography variant="body2" sx={{ color: '#2d3748', p: 1.2, bgcolor: '#fff6f8', borderRadius: 2, border: '1px solid #ff8a00', fontSize: isMobile ? '0.78rem' : '0.875rem' }}>
                  <strong>Tic Tac Toe:</strong> Tap 🎮 Game button → Pick Tic Tac Toe. Take turns marking X & O. Be the first to match 3 in a row to win! 🏆
                </Typography>
              )}
              {selectedGameTab === 'truthordare' && (
                <Typography variant="body2" sx={{ color: '#2d3748', p: 1.2, bgcolor: '#edf9fc', borderRadius: 2, border: '1px solid #00b4d8', fontSize: isMobile ? '0.78rem' : '0.875rem' }}>
                  <strong>Truth or Dare:</strong> Pick 📜 Truth question or ⚡ Dare challenge. Complete prompt with photo/voice and pass turn for continuous fun!
                </Typography>
              )}
              {selectedGameTab === 'rps' && (
                <Typography variant="body2" sx={{ color: '#2d3748', p: 1.2, bgcolor: '#f5f3ff', borderRadius: 2, border: '1px solid #8b5cf6', fontSize: isMobile ? '0.78rem' : '0.875rem' }}>
                  <strong>Rock Paper Scissors:</strong> Pick ✊, ✋, or ✌️ secretly. Moves reveal simultaneously! ✊ beats ✌️, ✌️ beats ✋, ✋ beats ✊.
                </Typography>
              )}
            </Box>
          )}

          {/* INSTRUCTIONS LIST */}
          {activeStepObj.instructions && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 1.5 }}>
              {activeStepObj.instructions.map((inst, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: isMobile ? 1.2 : 1.5,
                    bgcolor: '#f8fafc',
                    p: isMobile ? 1 : 1.2,
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <Chip
                    label={inst.num}
                    size="small"
                    sx={{
                      bgcolor: inst.badgeBg,
                      color: '#fff',
                      fontWeight: 800,
                      mt: 0.2,
                      minWidth: isMobile ? 22 : 24,
                      height: isMobile ? 22 : 24,
                      fontSize: isMobile ? '0.72rem' : '0.8rem'
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#2d3748',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      lineHeight: 1.45
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

      <Divider sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />

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
          background: '#ffffff',
          borderTop: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        {/* Skip Button */}
        {!hideSkipButton && (
          <Button
            size="small"
            onClick={handleSkip}
            sx={{
              color: '#718096',
              fontWeight: 700,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              textTransform: 'none',
              px: isMobile ? 1 : 1.5,
              '&:hover': { color: '#e52e71', bgcolor: 'rgba(229,46,113,0.08)' }
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
                color: '#2d3748',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: isMobile ? '0.78rem' : '0.875rem',
                px: isMobile ? 1.2 : 1.5
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
                background: 'linear-gradient(90deg, #ff8a00 0%, #e52e71 100%)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 2,
                px: isMobile ? 1.8 : 2.5,
                py: isMobile ? 0.6 : 0.8,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(229, 46, 113, 0.25)'
              }}
            >
              Next Step
            </Button>
          ) : (
            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircleIcon fontSize={isMobile ? "small" : "medium"} />}
              onClick={handleClose}
              sx={{
                background: 'linear-gradient(90deg, #4caf50 0%, #2e7d32 100%)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 2,
                px: isMobile ? 2 : 3,
                py: isMobile ? 0.6 : 0.8,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
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
