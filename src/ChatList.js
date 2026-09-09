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
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Gesture as GestureIcon,
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  AddComment as AddCommentIcon
} from '@mui/icons-material';
import Yourmood from './Yourmood';
import loveBotImg from './bot/love.png';
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
  onSignOut
}) => {
  const loveBotFabRef = useRef(null);
  const gestureFabRef = useRef(null);
  const addFabRef = useRef(null);

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
        (loveBotFabRef.current && loveBotFabRef.current.contains(event.target)) ||
        (gestureFabRef.current && gestureFabRef.current.contains(event.target)) ||
        (addFabRef.current && addFabRef.current.contains(event.target));

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
            bgcolor: 'var(--surface-color, #fff)',
            p: !isMobile ? 1.5 : 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            boxShadow: '0px 2px 10px rgba(0,0,0,0.03)',
            borderRight: '1px solid #f1dcdc'
          }}
        >
          {selectedMemberIds.size > 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'var(--primary-color, #ec407a)',
                color: '#fff',
                borderRadius: 8,
                px: 2,
                py: 1,
                mb: 2,
                boxShadow: '0 4px 12px rgba(236, 64, 122, 0.2)',
                minHeight: '40px'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => setSelectedMemberIds(new Set())}
                  sx={{ color: '#fff', p: 0.5 }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
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
                  pb: 1,
                  borderBottom: '1px solid rgba(241, 220, 220, 0.4)'
                }}>
                  <Box
                    component="img"
                    src={logoImage}
                    alt="Juicy"
                    sx={{
                      height: !isMobile ? 38 : 48,
                      width: 'auto',
                      display: 'block'
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* <IconButton 
                      onClick={() => setShowFinder(true)} 
                      sx={{ color: 'var(--text-color, #54656f)', opacity: 0.8 }}
                    >
                      <AddCommentIcon />
                    </IconButton> */}
                    <IconButton
                      onClick={handleMenuOpen}
                      sx={{ color: 'var(--text-color, #54656f)', opacity: 0.8 }}
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
                          bgcolor: 'var(--surface-color, #fff)',
                          color: 'var(--text-color, #000)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          minWidth: '150px'
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
                          color: 'var(--text-color, #000)',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.05)'
                          }
                        }}
                      >
                        Logout
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>
              )}

              <TextField
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mb: !isMobile ? 1.25 : 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'var(--primary-color, #f06292)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 8,
                    bgcolor: 'var(--surface-color, #fcecec)',
                    color: 'var(--text-color, #000)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color, #f06292)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color, #f06292)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary-color, #f06292)'
                    }
                  }
                }}
              />
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
              my: 0.25,
              bgcolor: ' #f4e8ecff',
              opacity: 0.3
            }}
          />
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            pr: 0.5,
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <List>
              {(searchTerm ? filteredMembers : sortedMembers).map((member, index) => (
                <ListItem key={member._id || member.username || index} sx={{ mb: !isMobile ? 0.75 : 1.5 }} disablePadding>
                  <ListItemButton
                    onClick={() => handleItemClick(member)}
                    onMouseDown={(e) => handleStart(e, member)}
                    onTouchStart={(e) => handleStart(e, member)}
                    onMouseUp={handleCancel}
                    onMouseLeave={handleCancel}
                    onTouchEnd={handleCancel}
                    onTouchMove={handleCancel}
                    sx={{
                      borderRadius: 3,
                      px: !isMobile ? 1.5 : 2,
                      py: !isMobile ? 0.75 : 1.2,
                      bgcolor: selectedMemberIds.has(String(member._id))
                        ? 'var(--background-color, #ffecec) !important'
                        : 'transparent',
                      '&:hover': { bgcolor: 'var(--background-color, #ffecec)' },
                      position: 'relative',
                      opacity: member.online ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      transition: 'background-color 0.2s ease'
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
                        <Avatar
                          src={member.profilePic || member.image || undefined}
                          sx={{
                            width: !isMobile ? 40 : 48,
                            height: !isMobile ? 40 : 48,
                            bgcolor: (!member.profilePic && !member.image) ? 'var(--primary-color, #ff4d86)' : 'transparent',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: !isMobile ? '1.1rem' : '1.3rem'
                          }}
                        >
                          {(member.username || member.name || '?')[0].toUpperCase()}
                        </Avatar>
                        {/* Checkmark overlay if selected */}
                        {selectedMemberIds.has(String(member._id)) && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: !isMobile ? 40 : 48,
                              height: !isMobile ? 40 : 48,
                              borderRadius: '50%',
                              bgcolor: 'rgba(236, 64, 122, 0.85)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              zIndex: 2
                            }}
                          >
                            <CheckIcon sx={{ fontSize: !isMobile ? 20 : 24, fontWeight: 'bold' }} />
                          </Box>
                        )}
                        {/* Online/Offline status indicator dot */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: !isMobile ? 12 : 14,
                            height: !isMobile ? 12 : 14,
                            borderRadius: '50%',
                            backgroundColor: member.online ? '#31a24c' : '#bdbdbd',
                            border: !isMobile ? '1.5px solid white' : '2px solid white',
                            boxShadow: '0 0 3px rgba(0,0,0,0.2)',
                            zIndex: 3
                          }}
                        />
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      disableTypography
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography sx={{ fontWeight: 600, color: 'var(--text-color, #000)' }}>
                            {member.username || member.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: member.online ? '#25d366' : '#999',
                              fontWeight: 500,
                              ml: 2
                            }}
                          >
                            {member.online
                              ? '● Online'
                              : `● ${formatLastSeen(lastSeenTimes[member._id?.toString()], 'instagram')}`}
                          </Typography>
                        </Box>
                      }
                      secondary={
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
                            {messages[member._id] && messages[member._id].length > 0 ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: unread[member._id] > 0 ? 'var(--text-color, #000)' : '#777',
                                  fontWeight: unread[member._id] > 0 ? 600 : 400,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontSize: '0.82rem'
                                }}
                              >
                                {(() => {
                                  const lastMsg = messages[member._id][messages[member._id].length - 1];
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
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                No messages yet
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            {messages[member._id] && messages[member._id].length > 0 && (
                              <Typography sx={{ fontSize: '0.75rem', color: '#888', textAlign: 'right' }}>
                                {messages[member._id][messages[member._id].length - 1].timestamp}
                              </Typography>
                            )}
                            {/* WhatsApp-like unread badge */}
                            {unread[member._id] > 0 && (
                              <Box
                                sx={{
                                  bgcolor: '#25d366',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  px: 1.2,
                                  py: 0.2,
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  minWidth: 22,
                                  minHeight: 22,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  ml: 1,
                                  boxShadow: 1
                                }}
                              >
                                {unread[member._id]}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      )}

      {/* LoveBot FAB */}
      {bottomNav === 0 && showChatList && !selectedUser && showFinder && (
        <Fab
          ref={loveBotFabRef}
          aria-label="jerrybot"
          onClick={() => handleSelectUser(loveBotUser)}
          sx={{
            position: 'absolute',
            bottom: isMobile ? 80 : 30,
            right: 100,
            bgcolor: '#ffffff',
            '&:hover': {
              bgcolor: '#fff0f4',
              transform: 'scale(1.1)'
            },
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(255, 77, 134, 0.4)',
            transition: 'all 0.3s ease',
            p: 0,
            overflow: 'hidden'
          }}
        >
          <img src={loveBotImg} alt="jerryBot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Fab>
      )}

      {/* Gesture Draw FAB */}
      {bottomNav === 0 && showChatList && !selectedUser && showFinder && (
        <Fab
          ref={gestureFabRef}
          color="secondary"
          aria-label="gesture"
          onClick={() => setShowGestureOverlay(true)}
          sx={{
            position: 'absolute',
            bottom: isMobile ? 150 : 100,
            right: 30,
            bgcolor: '#7e57c2', // beautiful purple matching juicee accent
            '&:hover': {
              bgcolor: '#5e35b1'
            },
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(126, 87, 194, 0.4)'
          }}
        >
          <GestureIcon />
        </Fab>
      )}

      {/* Contact Sync FAB */}
      {bottomNav === 0 && showChatList && !selectedUser && (
        <Fab
          ref={addFabRef}
          color="primary"
          aria-label="add"
          onClick={() => {
            if (!showFinder) {
              setShowFinder(true);
            } else {
              setContactSyncDialogOpen(true);
            }
          }}
          sx={{
            position: 'absolute',
            bottom: isMobile ? 80 : 30,
            right: 30,
            bgcolor: 'var(--primary-color, #ec407a)',
            '&:hover': {
              bgcolor: 'var(--primary-color, #d81b60)'
            },
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(236, 64, 122, 0.4)'
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Delete Chat Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-chat-dialog-title"
        aria-describedby="delete-chat-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1
          }
        }}
      >
        <DialogTitle id="delete-chat-dialog-title" sx={{ fontWeight: 600 }}>
          Delete Selected Chats?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-chat-dialog-description">
            Are you sure you want to delete the selected chat conversation(s)? This will clear all messages and remove them from your active chats.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#777',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteChats}
            variant="contained"
            color="error"
            sx={{
              bgcolor: 'var(--primary-color, #ec407a)',
              '&:hover': {
                bgcolor: 'var(--primary-color, #d81b60)'
              },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none'
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
