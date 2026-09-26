import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Checkbox,
  TextField,
  InputAdornment,
  Divider,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  AutoAwesome as AutoAwesomeIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  AddComment as AddCommentIcon
} from '@mui/icons-material';
import Yourmood from './Yourmood';
import loveBotImg from './bot/jerry.gif';
import logoImage from './logo/juicee2.png';

const loveBotUser = {
  _id: 'lovebot',
  username: 'jerry Bot ✨',
  name: 'jerry Bot',
  profilePic: loveBotImg,
  isBot: true,
  online: true
};

const ChatList = ({
  searchTerm,
  setSearchTerm,
  user,
  dbFriends,
  lockedSet,
  onlineUserIds,
  socket,
  handleSelectUser,
  setReplyMetadata,
  setMessage,
  isMobile,
  filteredMembers,
  sortedMembers,
  setQuickProfileUser,
  formatLastSeen,
  lastSeenTimes,
  messages,
  unread,
  setShowGestureOverlay,
  setContactSyncDialogOpen,
  bottomNav,
  showChatList,
  selectedUser,
  showFinder,
  setShowFinder,
  handleDeleteChats,
  onSignOut,
  hideJerryBot = false
}) => {
  const loveBotFabRef = useRef(null);

  const [currentIsDark, setCurrentIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('appTheme');
      if (saved) {
        const parsed = JSON.parse(saved);
        const bg = parsed.colors?.background;
        if (bg && bg.startsWith('#')) {
          const hex = bg.replace('#', '').trim();
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return (r * 299 + g * 587 + b * 114) / 1000 < 128;
        }
        const id = (parsed.id || '').toLowerCase();
        return id.includes('dark') || id.includes('black') || id.includes('midnight') || id.includes('night');
      }
    } catch (e) { }
    return false;
  });

  useEffect(() => {
    const handleThemeChanged = () => {
      try {
        const saved = localStorage.getItem('appTheme');
        if (saved) {
          const parsed = JSON.parse(saved);
          const bg = parsed.colors?.background;
          if (bg && bg.startsWith('#')) {
            const hex = bg.replace('#', '').trim();
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            setCurrentIsDark((r * 299 + g * 587 + b * 114) / 1000 < 128);
            return;
          }
          const id = (parsed.id || '').toLowerCase();
          setCurrentIsDark(id.includes('dark') || id.includes('black') || id.includes('midnight') || id.includes('night'));
        }
      } catch (e) { }
    };
    window.addEventListener('themeChanged', handleThemeChanged);
    return () => window.removeEventListener('themeChanged', handleThemeChanged);
  }, []);

  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const longPressTimeout = useRef(null);
  const isLongPressActive = useRef(false);

  const handleMenuOpen = (event) => setMenuAnchorEl(event.currentTarget);
  const handleMenuClose = () => setMenuAnchorEl(null);

  const handleStart = (e, member) => {
    // Only handle left clicks for mouse events
    if (e.type === 'mousedown' && e.button !== 0) return;

    isLongPressActive.current = false;
    longPressTimeout.current = setTimeout(() => {
      isLongPressActive.current = true;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      toggleSelectMember(member._id);
    }, 600);
  };

  const handleCancel = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const toggleSelectMember = (memberId) => {
    const mIdStr = String(memberId);
    setSelectedMemberIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(mIdStr)) {
        updated.delete(mIdStr);
      } else {
        updated.add(mIdStr);
      }
      return updated;
    });
  };

  const handleItemClick = (member) => {
    if (isLongPressActive.current) {
      // It was a long press, do nothing (already toggled selection)
      return;
    }

    if (selectedMemberIds.size > 0) {
      toggleSelectMember(member._id);
    } else {
      handleSelectUser(member);
    }
  };

  const confirmDeleteChats = () => {
    if (handleDeleteChats) {
      handleDeleteChats(Array.from(selectedMemberIds));
    }
    setSelectedMemberIds(new Set());
    setDeleteDialogOpen(false);
  };

  useEffect(() => {
    if (!showFinder) return;

    const handleClickOutside = (event) => {
      const clickInside =
        (loveBotFabRef.current && loveBotFabRef.current.contains(event.target));

      if (!clickInside) {
        setShowFinder(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showFinder, setShowFinder]);

  return (
    <>
      {showChatList && (
        <Box
          sx={{
            width: '100%',
            background: currentIsDark ? '#120f17' : 'var(--background-color, #fff7f9)',
            p: !isMobile ? 1.5 : 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            boxShadow: currentIsDark ? 'none' : '0px 4px 20px rgba(0, 0, 0, 0.04)',
            borderRight: currentIsDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)'
          }}
        >
          {selectedMemberIds.size > 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--primary-gradient, linear-gradient(135deg, #ff5c8d 0%, #ff2d6c 100%))',
                color: '#fff',
                borderRadius: '24px',
                px: 2.5,
                py: 1.2,
                mb: 2,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                minHeight: '44px'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => setSelectedMemberIds(new Set())}
                  sx={{ color: '#fff', p: 0.5 }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                  {selectedMemberIds.size} selected
                </Typography>
              </Box>
              <IconButton
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ color: '#fff', p: 0.5 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ) : (
            <>
              {/* Desktop Header: Brand & Menu */}
              {!isMobile && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  pb: 1.5,
                  borderBottom: currentIsDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)'
                }}>
                  <Box
                    component="img"
                    src={logoImage}
                    alt="Juicy"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (setShowGestureOverlay) setShowGestureOverlay(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (setShowGestureOverlay) setShowGestureOverlay(true);
                      }
                    }}
                    aria-label="Open gesture drawing"
                    title="Tap to draw gesture to open chat"
                    sx={{
                      height: !isMobile ? 38 : 48,
                      width: 'auto',
                      display: 'block',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        filter: 'drop-shadow(0 4px 12px rgba(255, 64, 129, 0.35))'
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      onClick={handleMenuOpen}
                      sx={{
                        color: currentIsDark ? '#cbd5e1' : '#64748b',
                        bgcolor: currentIsDark ? 'rgba(255, 255, 255, 0.06)' : 'var(--surface-color, rgba(255, 255, 255, 0.8))',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(125, 125, 125, 0.15)',
                        '&:hover': {
                          bgcolor: currentIsDark ? 'rgba(255, 255, 255, 0.1)' : 'var(--background-color, rgba(255, 240, 246, 0.95))',
                          color: 'var(--primary-color, #ff4081)'
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={menuAnchorEl}
                      open={Boolean(menuAnchorEl)}
                      onClose={handleMenuClose}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      PaperProps={{
                        sx: {
                          bgcolor: currentIsDark ? 'rgba(26, 20, 36, 0.96)' : 'var(--surface-color, rgba(255, 255, 255, 0.96))',
                          backdropFilter: 'blur(16px)',
                          color: 'var(--text-color, #1e293b)',
                          boxShadow: currentIsDark ? '0 12px 36px rgba(0,0,0,0.5)' : '0 12px 36px rgba(0, 0, 0, 0.08)',
                          borderRadius: '18px',
                          border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(125, 125, 125, 0.15)',
                          minWidth: '160px',
                          p: 0.5
                        }
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          handleMenuClose();
                          if (onSignOut) onSignOut();
                        }}
                        sx={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          borderRadius: '12px',
                          color: 'var(--text-color, #1e293b)',
                          '&:hover': {
                            bgcolor: currentIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(125, 125, 125, 0.08)',
                            color: 'var(--primary-color, #ff4081)'
                          }
                        }}
                      >
                        Logout
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>
              )}

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  mb: !isMobile ? 1.5 : 2
                }}
              >
                <TextField
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search chats..."
                  variant="outlined"
                  size="small"
                  sx={{
                    flex: 1,
                    minWidth: 0
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'var(--primary-color, #ff4081)', fontSize: 22 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '28px',
                      bgcolor: currentIsDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface-color, rgba(255, 255, 255, 0.95))',
                      backdropFilter: 'blur(12px)',
                      color: 'var(--text-color, #1e293b)',
                      boxShadow: currentIsDark ? '0 4px 16px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: currentIsDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(125, 125, 125, 0.2)',
                        borderWidth: '1.5px'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color, #ff6595)'
                      },
                      '&.Mui-focused': {
                        boxShadow: currentIsDark ? '0 6px 22px rgba(0,0,0,0.4)' : '0 6px 22px rgba(0, 0, 0, 0.1)'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-color, #ff4081)',
                        borderWidth: '1.5px'
                      },
                      '& input::placeholder': {
                        color: currentIsDark ? '#64748b' : '#94a3b8',
                        fontWeight: 500,
                        opacity: 1
                      }
                    }
                  }}
                />

                {/* Contact Sync Button with Phone Icon & "Sync" */}
                <Tooltip title="Sync Contacts / Add Friends" arrow>
                  <Button
                    onClick={() => {
                      if (setContactSyncDialogOpen) {
                        setContactSyncDialogOpen(true);
                      }
                    }}
                    aria-label="sync contacts"
                    startIcon={<PhoneIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#ffffff' }} />}
                    sx={{
                      height: 40,
                      px: { xs: 1.5, sm: 2 },
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: { xs: '0.82rem', sm: '0.88rem' },
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      background: 'var(--primary-gradient, linear-gradient(135deg, #ff6595 0%, #ff2d6c 100%))',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      boxShadow: '0 4px 14px rgba(255, 45, 108, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.03)',
                        boxShadow: '0 6px 18px rgba(255, 45, 108, 0.4)',
                        background: 'var(--primary-gradient, linear-gradient(135deg, #ff5085 0%, #eb1a5b 100%))'
                      },
                      '&:active': {
                        transform: 'scale(0.96)'
                      }
                    }}
                  >
                    Sync
                  </Button>
                </Tooltip>
              </Box>
            </>
          )}

          {/* Daily mood row */}
          <Yourmood
            user={user}
            dbFriends={dbFriends.filter((f) => f && !lockedSet.has(String(f._id)))}
            onlineUserIds={onlineUserIds}
            socket={socket}
            handleSelectUser={handleSelectUser}
            setReplyMetadata={setReplyMetadata}
            setMessage={setMessage}
            isMobile={isMobile}
          />
          <Divider
            sx={{
              my: 0.75,
              borderColor: currentIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(125, 125, 125, 0.15)',
              opacity: 0.6
            }}
          />
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            pr: 0.5,
            pt: 0.5,
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <List sx={{ pt: 0 }}>
              {(searchTerm ? filteredMembers : sortedMembers).map((member, index) => (
                <ListItem key={member._id || member.username || index} sx={{ mb: !isMobile ? 1 : 1.5 }} disablePadding>
                  <ListItemButton
                    onClick={() => handleItemClick(member)}
                    onMouseDown={(e) => handleStart(e, member)}
                    onTouchStart={(e) => handleStart(e, member)}
                    onMouseUp={handleCancel}
                    onMouseLeave={handleCancel}
                    onTouchEnd={handleCancel}
                    onTouchMove={handleCancel}
                    sx={{
                      borderRadius: '22px',
                      px: !isMobile ? 1.75 : 2,
                      py: !isMobile ? 1.2 : 1.4,
                      bgcolor: selectedMemberIds.has(String(member._id))
                        ? (currentIsDark ? 'rgba(255, 255, 255, 0.12) !important' : 'rgba(125, 125, 125, 0.12) !important')
                        : (currentIsDark ? 'rgba(255, 255, 255, 0.04)' : 'var(--surface-color, rgba(255, 255, 255, 0.92))'),
                      backdropFilter: 'blur(12px)',
                      border: selectedMemberIds.has(String(member._id))
                        ? '1.5px solid var(--primary-color, #ff4081)'
                        : (currentIsDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(125, 125, 125, 0.15)'),
                      boxShadow: selectedMemberIds.has(String(member._id))
                        ? '0 6px 20px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255,255,255,0.6)'
                        : '0 4px 16px rgba(0, 0, 0, 0.04)',
                      '&:hover': {
                        bgcolor: currentIsDark ? 'rgba(255, 255, 255, 0.07)' : 'var(--surface-color, rgba(255, 248, 251, 0.98))',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                        borderColor: 'var(--primary-color, #ff4081)'
                      },
                      '&:active': {
                        transform: 'scale(0.985)'
                      },
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%'
                    }}
                  >
                    <ListItemAvatar>
                      <Box
                        sx={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedMemberIds.size > 0) {
                            toggleSelectMember(member._id);
                          } else {
                            setQuickProfileUser(member);
                          }
                        }}
                      >
                        <Box
                          sx={{
                            p: '2.5px',
                            borderRadius: '50%',
                            background: member.online
                              ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                              : 'linear-gradient(135deg, rgba(255, 105, 145, 0.35) 0%, rgba(255, 182, 205, 0.15) 100%)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                          }}
                        >
                          <Avatar
                            src={member.profilePic || member.image || undefined}
                            sx={{
                              width: !isMobile ? 42 : 48,
                              height: !isMobile ? 42 : 48,
                              bgcolor: (!member.profilePic && !member.image) ? 'var(--primary-color, #ff4081)' : 'transparent',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: !isMobile ? '1.1rem' : '1.3rem',
                              border: currentIsDark ? '2px solid #1a1424' : '2px solid #ffffff',
                              '& .MuiAvatar-img': (member?.isBot || member?._id === 'lovebot') ? {
                                objectPosition: 'center 35%',
                                transform: 'scale(1.25)'
                              } : {}
                            }}
                          >
                            {(member.username || member.name || '?')[0].toUpperCase()}
                          </Avatar>
                        </Box>
                        {/* Checkmark overlay if selected */}
                        {selectedMemberIds.has(String(member._id)) && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              width: !isMobile ? 42 : 48,
                              height: !isMobile ? 42 : 48,
                              borderRadius: '50%',
                              bgcolor: 'var(--primary-color, rgba(255, 45, 108, 0.88))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              zIndex: 2,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                            }}
                          >
                            <CheckIcon sx={{ fontSize: !isMobile ? 22 : 26, fontWeight: 'bold' }} />
                          </Box>
                        )}
                        {/* Online/Offline status indicator dot */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 1,
                            right: 1,
                            width: !isMobile ? 13 : 15,
                            height: !isMobile ? 13 : 15,
                            borderRadius: '50%',
                            backgroundColor: member.online ? '#10b981' : '#cbd5e1',
                            border: currentIsDark ? '2.5px solid #1a1424' : '2.5px solid #ffffff',
                            boxShadow: member.online ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 1px 3px rgba(0,0,0,0.15)',
                            zIndex: 3
                          }}
                        />
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      disableTypography
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-color, #1e293b)' }}>
                            {member.username || member.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: member.online ? '#10b981' : (currentIsDark ? '#64748b' : '#94a3b8'),
                              fontWeight: 600,
                              ml: 2
                            }}
                          >
                            {member.online
                              ? '● Online'
                              : `● ${formatLastSeen(lastSeenTimes[member._id?.toString()], 'instagram')}`}
                          </Typography>
                        </Box>
                      }
                      secondary={(() => {
                        const memberId = member._id ? String(member._id) : (member.id ? String(member.id) : '');
                        const memberMsgs = (messages && (messages[memberId] || (member._id && messages[member._id]) || (member.id && messages[member.id]))) || [];
                        const hasMsgs = memberMsgs.length > 0;
                        const memberUnread = (unread && (unread[memberId] || (member._id && unread[member._id]) || 0)) || 0;
                        const lastMsg = hasMsgs ? memberMsgs[memberMsgs.length - 1] : null;

                        return (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              position: 'relative',
                              width: '100%',
                              mt: 0.5
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '70%', overflow: 'hidden' }}>
                              {hasMsgs && lastMsg ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: memberUnread > 0 ? 'var(--text-color, #1e293b)' : (currentIsDark ? '#94a3b8' : '#64748b'),
                                    fontWeight: memberUnread > 0 ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: '0.86rem'
                                  }}
                                >
                                  {(() => {
                                    if (lastMsg.text) {
                                      if (lastMsg.text.startsWith('JUICY_GAME:')) {
                                        try {
                                          const jsonStr = lastMsg.text.indexOf('{') !== -1 ? lastMsg.text.slice(lastMsg.text.indexOf('{')) : lastMsg.text.substring(11);
                                          const gameData = JSON.parse(jsonStr);
                                          const gameType = gameData.gameType;
                                          const gameName = gameType === 'tictactoe'
                                            ? 'Tic Tac Toe'
                                            : (gameType === 'truthordare' ? 'Truth or Dare' : 'Rock Paper Scissors');
                                          return `🎮 ${gameName}`;
                                        } catch (e) {
                                          return '🎮 Game';
                                        }
                                      }
                                      return lastMsg.text;
                                    }
                                    if (lastMsg.image) return '📷 Photo';
                                    if (lastMsg.audio) return '🎵 Voice message';
                                    if (lastMsg.document) return '📄 Document';
                                    return 'Media';
                                  })()}
                                </Typography>
                              ) : (
                                <Typography variant="body2" sx={{ color: currentIsDark ? '#64748b' : '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic' }}>
                                  No messages yet
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                              {hasMsgs && lastMsg && (
                                <Typography sx={{ fontSize: '0.74rem', color: currentIsDark ? '#64748b' : '#94a3b8', fontWeight: 500, textAlign: 'right' }}>
                                  {lastMsg.timestamp}
                                </Typography>
                              )}
                              {/* Unread badge */}
                              {memberUnread > 0 && (
                                <Box
                                  sx={{
                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff5c8d 0%, #ff2d6c 100%))',
                                    color: '#fff',
                                    borderRadius: '12px',
                                    px: 1.1,
                                    py: 0.2,
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    minWidth: 22,
                                    minHeight: 22,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ml: 1,
                                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)'
                                  }}
                                >
                                  {memberUnread}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })()}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      )}

      {/* Jerry Bot Mascot - Floating at the bottom right */}
      {bottomNav === 0 && showChatList && !selectedUser && !hideJerryBot && (
        <Tooltip title="Chat with Jerry Bot ✨" placement="left" arrow>
          <Box
            ref={loveBotFabRef}
            component="button"
            type="button"
            aria-label="Chat with Jerry Bot"
            onClick={() => handleSelectUser(loveBotUser)}
            className="jerry-bot-floating-btn"
            sx={{
              position: 'absolute',
              bottom: isMobile ? 80 : 30,
              right: isMobile ? 20 : 30,
              width: isMobile ? 75 : 85,
              height: isMobile ? 75 : 85,
              bgcolor: 'transparent',
              background: 'none',
              border: 'none',
              outline: 'none',
              p: 0,
              m: 0,
              cursor: 'pointer',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
              '&:focus': {
                outline: 'none'
              }
            }}
          >
            <img
              src={loveBotImg}
              alt="jerryBot"
              className="jerry-bot-img"
            />
          </Box>
        </Tooltip>
      )}

      {/* Delete Chat Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-chat-dialog-title"
        aria-describedby="delete-chat-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            bgcolor: currentIsDark ? 'rgba(26, 20, 36, 0.96)' : 'var(--surface-color, rgba(255, 255, 255, 0.96))',
            backdropFilter: 'blur(20px)',
            border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(125, 125, 125, 0.2)',
            boxShadow: currentIsDark ? '0 16px 48px rgba(0, 0, 0, 0.5)' : '0 16px 48px rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        <DialogTitle id="delete-chat-dialog-title" sx={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-color, #1e293b)' }}>
          Delete Selected Chats?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-chat-dialog-description" sx={{ color: currentIsDark ? '#94a3b8' : '#64748b' }}>
            Are you sure you want to delete the selected chat conversation(s)? This will clear all messages and remove them from your active chats.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: currentIsDark ? '#94a3b8' : '#64748b',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '12px',
              px: 2
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteChats}
            variant="contained"
            sx={{
              background: 'var(--primary-gradient, linear-gradient(135deg, #ff5c8d 0%, #ff2d6c 100%))',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              '&:hover': {
                opacity: 0.9,
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)'
              },
              fontWeight: 700,
              borderRadius: '12px',
              textTransform: 'none',
              px: 2.5
            }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatList;
