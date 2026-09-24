import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Avatar, Typography, Dialog, Paper, IconButton, TextField, Button, Slide, Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  MusicNote as MusicNoteIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Reply as ReplyIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import API_BASE_URL from './config/apiConfig';
import { getProfileImageSrc } from './utils/imageUtils';
import {
  initOfflineDb,
  getMoodsLocally,
  saveMoodsLocally,
  saveSingleMoodLocally,
  deleteMoodLocally
} from './db/offlineDb';
// import { generateUniqueId } from './utils/uniqueIdGenerator';

const moodEmojis = [
  { emoji: "😊", name: "Happy" },
  { emoji: "🤢", name: "Sick" },
  { emoji: "😢", name: "Sad" },
  { emoji: "😴", name: "Tired" },
  { emoji: "😐", name: "Neutral" },
  { emoji: "⚡", name: "Energetic" },
  { emoji: "🥰", name: "In Love" },
  { emoji: "😎", name: "Cool" },
  { emoji: "🤔", name: "Thinking" },
  { emoji: "😤", name: "Frustrated" },
  { emoji: "🎮", name: "Gaming" },
  { emoji: "🎵", name: "Music" },
  { emoji: "🍽️", name: "Eating" },
  { emoji: "💪", name: "Working Out" },
  { emoji: "📚", name: "Studying" }
];

const defaultSongs = [
  {
    trackName: "Pop",
    artistName: "Harry Styles",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/35/b6/a0/35b6a026-26bc-cfb1-30d3-9c3c1820c63f/mzaf_8281785747956416426.plus.aac.p.m4a",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/07/41/6a/07416a78-38b9-2d47-7ce8-8a52a44c510f/196874010112.jpg/100x100bb.jpg"
  },
  {
    trackName: "Rolling in the Deep",
    artistName: "Adele",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/9f/07/1d/9f071dc7-791c-c869-dfa2-06b25936a287/mzaf_11077490630806345321.plus.aac.p.m4a",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/eb/ca/25/ebca2596-cd1e-b295-91a3-771c868d0a79/191404113868.png/100x100bb.jpg"
  },
  {
    trackName: "Kill Bill",
    artistName: "SZA",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/45/2b/ea/452bead6-c7f5-82d4-f5f7-ec876014b4cc/mzaf_2905911853279084717.plus.aac.p.m4a",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/3b/a9/bd3ba9fb-9609-144f-bcfe-ead67b5f6ab3/196589564931.jpg/100x100bb.jpg"
  },
  {
    trackName: "I Feel It Coming (feat. Daft Punk)",
    artistName: "The Weeknd",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/71/af/e0/71afe07f-aae7-c4f0-db02-c05be07591d2/mzaf_5960554915698764959.plus.aac.p.m4a",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e2/61/f8/e261f8c1-73db-9a7a-c89e-1068f19970e0/16UMGIM67863.rgb.jpg/100x100bb.jpg"
  },
  {
    trackName: "When I Was Your Man",
    artistName: "Bruno Mars",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/82/d2/9a/82d29a5f-d9a0-57f4-c0ec-f785969240c3/mzaf_5320660780349800682.plus.aac.p.m4a",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/a4/7c/e0a47c6f-005a-9f9f-ce29-8e858e2bcfcb/075679957283.jpg/100x100bb.jpg"
  },
  {
    trackName: "Thinking Out Loud",
    artistName: "Ed Sheeran",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/78/a5/f2/78a5f25e-ad1b-718d-82ad-b82e676c1855/mzaf_6133970271589343093.plus.aac.p.m4a",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2d/36/f9/2d36f9a7-2c3e-ce0f-7fb6-036feecb221f/825646974450.jpg/100x100bb.jpg"
  }
];

const getMoodCountdown = (moodTimestamp) => {
  try {
    if (!moodTimestamp) return '';
    const moodDate = new Date(moodTimestamp);
    if (isNaN(moodDate.getTime())) return '';
    const now = new Date();
    const expiryTime = new Date(moodDate.getTime() + 24 * 60 * 60 * 1000);
    const timeRemaining = expiryTime - now;

    if (timeRemaining <= 0) return '';

    const totalMinutes = Math.floor(timeRemaining / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  } catch (e) {
    return '';
  }
};

const getProfileSrc = (u) => {
  if (!u) return '';
  const direct = getProfileImageSrc(u.profileImage || u.profilePic || u.image);
  if (direct) return direct;
  // --- Local cache fallback: use the cached image written by UserProfile.js ---
  const currentUserId = localStorage.getItem('userId');
  const uId = u._id || u.id;
  if (currentUserId && uId && String(currentUserId) === String(uId)) {
    const cached = localStorage.getItem('profileImageCache') || localStorage.getItem('profileImage');
    if (cached) return getProfileImageSrc(cached) || '';
  }
  return '';
};

const formatTime = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '--:--';
  }
};

// Custom hook for drag-down-to-close bottom sheet in mobile view
const useDragToClose = (isOpen, onClose, isMobile) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    setDragY(0);
    setIsDragging(false);
  }, [isOpen]);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    const target = e.target;
    if (target && target.closest && target.closest('input, textarea, button, [role="button"], audio')) {
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    const scrollTop = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;

    if (scrollTop <= 0 && deltaY > 0) {
      setDragY(deltaY);
    } else if (deltaY < 0 && dragY > 0) {
      setDragY(Math.max(0, deltaY));
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;
    setIsDragging(false);
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = dragY / (deltaTime || 1);

    if (dragY > 100 || (velocity > 0.35 && dragY > 30)) {
      setDragY(window.innerHeight || 600);
      setTimeout(() => {
        onClose();
        setDragY(0);
      }, 180);
    } else {
      setDragY(0);
    }
  };

  return {
    dragY,
    isDragging,
    scrollContainerRef,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd
    }
  };
};

const Yourmood = ({
  user,
  dbFriends,
  onlineUserIds = [],
  socket,
  handleSelectUser,
  setReplyMetadata,
  setMessage,
  isMobile
}) => {
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodText, setMoodText] = useState('');
  const [moods, setMoods] = useState(() => {
    const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
    if (!currentUserId) return [];
    try {
      const cached = localStorage.getItem(`cached_moods_${currentUserId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const updateMoodsAndCache = React.useCallback((newMoodsOrUpdater) => {
    setMoods(prev => {
      const updated = typeof newMoodsOrUpdater === 'function' ? newMoodsOrUpdater(prev) : newMoodsOrUpdater;
      const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
      if (currentUserId && Array.isArray(updated)) {
        try {
          localStorage.setItem(`cached_moods_${currentUserId}`, JSON.stringify(updated));
        } catch (e) { }
        saveMoodsLocally(currentUserId, updated).catch(() => {});
      }
      return updated;
    });
  }, [user?._id, user?.id]);

  // --- Deleted mood IDs helpers (persisted in localStorage to survive refresh) ---
  const getDeletedMoodIds = () => {
    try {
      const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
      if (!currentUserId) return new Set();
      const stored = localStorage.getItem(`deleted_mood_ids_${currentUserId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) { return new Set(); }
  };

  const saveDeletedMoodId = (id) => {
    try {
      const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
      if (!currentUserId || !id) return;
      const existing = getDeletedMoodIds();
      existing.add(String(id));
      localStorage.setItem(`deleted_mood_ids_${currentUserId}`, JSON.stringify([...existing]));
    } catch (e) { }
  };

  const filterDeletedMoods = (list) => {
    const deletedIds = getDeletedMoodIds();
    if (deletedIds.size === 0) return list;
    return list.filter(m => !deletedIds.has(String(m._id || m.id || '')));
  };
  const [viewingMood, setViewingMood] = useState(null);

  const viewingDrag = useDragToClose(
    !!viewingMood,
    React.useCallback(() => {
      setViewingMood(null);
      setPlayingSongUrl(null);
    }, []),
    isMobile
  );

  const moodDialogDrag = useDragToClose(
    showMoodDialog,
    React.useCallback(() => {
      setShowMoodDialog(false);
    }, []),
    isMobile
  );

  // music states
  const [isSearchingSong, setIsSearchingSong] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [songSearchResults, setSongSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [playingSongUrl, setPlayingSongUrl] = useState(null);
  const [playingSongStartTime, setPlayingSongStartTime] = useState(0);
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [musicEditorSong, setMusicEditorSong] = useState(null);
  const [clipDuration, setClipDuration] = useState(15);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(true);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [songSnackbarOpen, setSongSnackbarOpen] = useState(false);
  const [songConfirmationMessage, setSongConfirmationMessage] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [moodToDeleteId, setMoodToDeleteId] = useState(null);
  const [showLikersDialog, setShowLikersDialog] = useState(false);
  const musicAudioRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pendingTempDeletesRef = useRef(new Set());

  const handleNudgeScroll = (direction) => {
    if (scrollContainerRef.current) {
      const nudgeAmount = 40;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -nudgeAmount : nudgeAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const isOwnMood = (mood) => {
    if (!mood) return false;
    const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
    if (!currentUserId) return false;
    const mUserId = mood.userId?._id || mood.userId || mood.user?._id || mood.user;
    return (
      String(mUserId) === String(currentUserId) ||
      String(mood.userId) === String(currentUserId) ||
      String(mood.user) === String(currentUserId) ||
      String(mood.id || '').startsWith('temp-')
    );
  };

  const handleToggleLike = async (moodToLike) => {
    const mood = moodToLike || viewingMood;
    if (!mood || !user?._id) return;
    const mId = mood.id || mood._id;
    if (!mId) return;

    const currentUserId = user._id || user.id || localStorage.getItem('userId');
    const likes = mood.likes || [];
    const hasLiked = likes.some(l => String(l.userId) === String(currentUserId));

    const updatedLikes = hasLiked
      ? likes.filter(l => String(l.userId) !== String(currentUserId))
      : [
        ...likes,
        {
          userId: currentUserId,
          username: user.username || 'You',
          profilePic: getProfileSrc(user),
          timestamp: new Date().toISOString()
        }
      ];

    const updatedMood = { ...mood, likes: updatedLikes };

    updateMoodsAndCache(prev => prev.map(m => (String(m.id || m._id) === String(mId) ? updatedMood : m)));
    if (viewingMood && String(viewingMood.id || viewingMood._id) === String(mId)) {
      setViewingMood(updatedMood);
    }

    if (socket) {
      const targetUserId = mood.userId?._id || mood.userId || mood.user?._id || mood.user;
      socket.emit('like_mood', {
        moodId: mId,
        targetUserId,
        likes: updatedLikes,
        likerUserId: currentUserId,
        isLiked: !hasLiked
      });
    }

    try {
      await fetch(`${API_BASE_URL}/api/auth/moods/${mId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: currentUserId })
      }).catch(() => { });
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // reply UI state for mood dialog
  /* const [replyText, setReplyText] = useState('');
  const [replyToEmoji, setReplyToEmoji] = useState(null);
  const [replyToText, setReplyToText] = useState(null); */

  const handleSearchSong = async (query) => {
    setSongSearchQuery(query);
    if (!query.trim()) {
      setSongSearchResults([]);
      return;
    }
    try {
      setIsSearchingSong(true);
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`);
      const data = await res.json();
      if (data && data.results) {
        const results = data.results.map(r => ({
          trackName: r.trackName,
          artistName: r.artistName,
          previewUrl: r.previewUrl,
          artworkUrl100: r.artworkUrl100
        })).filter(r => r.previewUrl);
        setSongSearchResults(results);
      }
    } catch (e) {
      console.error('Error fetching songs', e);
    } finally {
      setIsSearchingSong(false);
    }
  };

  const handleViewMood = (mood) => {
    setViewingMood(mood);
    const text = mood?.text || '';
    const songMatch = text.match(/‹song›(.*?)‹\/song›/);
    if (songMatch) {
      try {
        const songData = JSON.parse(songMatch[1]);
        setPlayingSongUrl(songData.previewUrl);
        setPlayingSongStartTime(songData.startTime || 0);
      } catch (e) {
        setPlayingSongUrl(null);
        setPlayingSongStartTime(0);
      }
    } else {
      setPlayingSongUrl(null);
      setPlayingSongStartTime(0);
    }
  };

  const handleDeleteMood = async (moodId) => {
    const id = moodId || viewingMood?.id || viewingMood?._id;
    if (!id) {
      console.error('Missing required data for delete:', { moodId, viewingMood });
      return;
    }

    const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
    const targetIdStr = String(id);

    // Keep snapshot of current state for rollback if deletion fails
    let deletedMood = null;
    let deletedIndex = -1;
    setMoods(prev => {
      deletedIndex = prev.findIndex(m => String(m._id || m.id || '') === targetIdStr);
      if (deletedIndex !== -1) {
        deletedMood = prev[deletedIndex];
      }
      return prev;
    });

    try {
      console.log('Instant-Deleting mood locally:', { id, userId: currentUserId });

      if (targetIdStr.startsWith('temp-')) {
        pendingTempDeletesRef.current.add(targetIdStr);
      }

      // Save deleted ID to localStorage so it survives page refresh
      saveDeletedMoodId(targetIdStr);

      // 1. Instantly update UI and local cache (Optimistic update)
      updateMoodsAndCache(prev => prev.filter(m => {
        const mid = String(m._id || m.id || '');
        if (mid === targetIdStr) return false;
        if (targetIdStr.startsWith('temp-') && mid.startsWith('temp-')) return false;
        return true;
      }));

      // Delete from SQLite database
      if (currentUserId) {
        deleteMoodLocally(currentUserId, targetIdStr).catch(() => {});
      }

      // 2. Instantly close view dialog and stop any active audio playback
      setViewingMood(null);
      setPlayingSongUrl(null);

      // 3. Instantly emit delete event to friends via sockets
      if (socket) {
        socket.emit('delete_mood', { id });
      }

      // 4. Perform database deletion in background if it's a real server ID
      if (!targetIdStr.startsWith('temp-')) {
        const response = await fetch(`${API_BASE_URL}/api/auth/moods/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: currentUserId })
        });
        if (!response.ok) {
          throw new Error(`Server delete failed with status ${response.status}`);
        }
      }

    } catch (error) {
      console.error('Error in instant-deleting mood, rolling back:', error);
      // Rollback: restore mood to state if deletion failed
      if (deletedMood) {
        updateMoodsAndCache(prev => {
          const restored = [...prev];
          if (deletedIndex >= 0 && deletedIndex <= restored.length) {
            restored.splice(deletedIndex, 0, deletedMood);
            return restored;
          }
          return [...prev, deletedMood];
        });
        if (currentUserId) {
          saveSingleMoodLocally(currentUserId, deletedMood).catch(() => {});
        }
        setSongConfirmationMessage('Failed to delete note. Restored.');
        setSongSnackbarOpen(true);
      }
    }
  };

  // Helper compatibility functions for Mood Songs
  const handleDeleteSong = async (songId) => {
    return handleDeleteMood(songId);
  };

  const handleAddSong = async (songData) => {
    try {
      if (songData) {
        setSelectedSong(songData);
      }
    } catch (err) {
      console.error('Error adding song:', err);
    }
  };

  const confirmDelete = async () => {
    if (moodToDeleteId) {
      const targetId = typeof moodToDeleteId === 'object' ? (moodToDeleteId.id || moodToDeleteId._id) : moodToDeleteId;
      // Optimistically close confirmation modal immediately (no freeze/delay)
      setDeleteConfirmOpen(false);
      setMoodToDeleteId(null);
      setSongConfirmationMessage('Note deleted 🗑️');
      setSongSnackbarOpen(true);

      // Trigger deletion in background
      handleDeleteMood(targetId);
    }
  };

  const handleMoodReplyInChat = (mood, replyToEmoji, replyToText, originalTypeOverride) => {
    console.log("handleMoodReplyInChat clicked:", { mood, replyToEmoji, replyToText });

    const targetUserId = mood.userId?._id || mood.userId || mood.user?._id || mood.user;
    if (!targetUserId) {
      console.warn("No target user ID found in mood:", mood);
      return;
    }

    const moodUser = dbFriends.find(f => {
      const friendId = f._id?.toString() || f._id;
      const parsedTargetId = targetUserId?.toString() || targetUserId;
      return String(friendId) === String(parsedTargetId);
    });

    if (!moodUser) {
      console.warn("No friend found in dbFriends matching ID:", targetUserId, "dbFriends:", dbFriends);
      return;
    }

    setViewingMood(null);
    handleSelectUser(moodUser);

    const quoteText = replyToEmoji || replyToText || '';
    const replyMetadataObj = {
      type: 'mood_reply',
      originalContent: quoteText,
      originalType: originalTypeOverride || (replyToEmoji ? 'emoji' : 'text'),
      moodId: mood.id || mood._id,
      timestamp: mood.timestamp || Date.now()
    };

    setReplyMetadata(replyMetadataObj);
    setMessage('');

    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder="Type a message"]');
      if (inputElement) {
        inputElement.focus();
      }
    }, 120);
  };

  const handleShareMood = async () => {
    if (!selectedMood && !moodText.trim() && !selectedSong) return;

    // Build the mood text payload
    const moodTextPayload = selectedSong
      ? `${moodText.trim()} ‹song›${JSON.stringify(selectedSong)}‹/song›`
      : moodText.trim();

    // 1. Instantly build an optimistic mood object for immediate UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMood = {
      id: tempId,
      _id: tempId,
      userId: user._id,
      username: user.username,
      profilePic: user.profilePic || user.profileImage || '',
      emoji: selectedMood?.emoji || '💭',
      text: moodTextPayload,
      timestamp: new Date().toISOString(),
      user: user
    };

    // 2. Instantly add to local state and cache so it appears in the UI immediately
    updateMoodsAndCache(prev => [optimisticMood, ...prev]);

    if (selectedSong) {
      setSongConfirmationMessage(`🎵 Music note shared with friends!`);
      setSongSnackbarOpen(true);
    }

    // 3. Instantly close the dialog and reset all editor state
    setSelectedMood(null);
    setMoodText('');
    setSelectedSong(null);
    setShowMusicSearch(false);
    setSongSearchQuery('');
    setSongSearchResults([]);
    setShowMoodDialog(false);

    try {
      // 4. Persist to backend
      const response = await fetch(`${API_BASE_URL}/api/auth/moods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id,
          emoji: selectedMood?.emoji || '💭',
          text: moodTextPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Mood share failed with status:', response.status, errorData);
        if (response.status === 401) {
          // Remove optimistic mood and prompt user to re-login
          updateMoodsAndCache(prev => prev.filter(m => m.id !== optimisticMood.id));
          alert('Your session has expired. Please log out and sign in again.');
        } else if (response.status === 429) {
          // Remove the optimistic mood if rate-limited, so user knows it failed
          updateMoodsAndCache(prev => prev.filter(m => m.id !== optimisticMood.id));
          alert('You can only post one mood per day. Delete your previous mood to post a new one.');
        }
        return;
      }

      // Replace optimistic mood with the real one from the server
      const realMood = await response.json();

      if (pendingTempDeletesRef.current.has(optimisticMood.id)) {
        pendingTempDeletesRef.current.delete(optimisticMood.id);
        const realId = realMood._id || realMood.id;
        if (realId) {
          await fetch(`${API_BASE_URL}/api/auth/moods/${realId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user._id })
          }).catch(() => { });
        }
        return;
      }

      updateMoodsAndCache(prev => prev.map(m => {
        const mId = String(m.id || m._id || '');
        const oId = String(optimisticMood.id || optimisticMood._id || '');
        // Match by temp id OR by real server id (in case socket already replaced it)
        if (mId === oId || mId === String(realMood._id || realMood.id || '')) {
          return realMood;
        }
        return m;
      }));
      setViewingMood(prev => (prev && (prev.id === optimisticMood.id || prev._id === optimisticMood._id) ? realMood : prev));
      console.log('Mood saved to backend:', realMood._id || realMood.id);

      if (user?._id) {
        saveSingleMoodLocally(user._id, realMood).catch(() => {});
      }

    } catch (err) {
      console.error('Mood share network error:', err);
      // Show error message but keep the optimistic mood visible
      setSongConfirmationMessage('Note saved locally, will sync when online');
      setSongSnackbarOpen(true);
    }
  };


  // Sync audio element current time when crop start time changes during dragging/scrolling
  useEffect(() => {
    if (musicAudioRef.current && musicEditorSong) {
      const st = musicEditorSong.startTime || 0;
      // Seek the audio if the difference is significant
      if (Math.abs(musicAudioRef.current.currentTime - st) > 0.3) {
        musicAudioRef.current.currentTime = st;
      }
    }
  }, [musicEditorSong?.startTime]);

  // Reset or initialize currentPlayTime state when musicEditorSong changes
  useEffect(() => {
    if (musicEditorSong) {
      setCurrentPlayTime(musicEditorSong.startTime || 0);
    } else {
      setCurrentPlayTime(0);
    }
  }, [musicEditorSong]);

  // Load moods from SQLite offline database on mount
  useEffect(() => {
    const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
    if (!currentUserId) return;

    let isMounted = true;
    const loadFromSqlite = async () => {
      try {
        await initOfflineDb();
        const sqliteMoods = await getMoodsLocally(currentUserId);
        if (isMounted && Array.isArray(sqliteMoods) && sqliteMoods.length > 0) {
          // Filter out any previously deleted moods before showing
          setMoods(filterDeletedMoods(sqliteMoods));
        }
      } catch (err) {
        console.warn('⚠️ [SQLITE] Error loading moods from SQLite:', err);
      }
    };

    loadFromSqlite();
    return () => { isMounted = false; };
  }, [user?._id, user?.id]);

  // Load moods effect with instant local cache and SQLite sync
  useEffect(() => {
    if (!user?._id) return;

    const cacheKey = `cached_moods_${user._id}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        // Filter deleted moods from cache before restoring
        setMoods(filterDeletedMoods(JSON.parse(cachedData)));
      } catch (e) { }
    }

    const loadMoods = async () => {
      try {
        console.log('Loading moods...');
        const response = await fetch(`${API_BASE_URL}/api/mood/${user._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          console.error('Response status:', response.status);
          throw new Error('Failed to load moods');
        }

        const data = await response.json();
        console.log('Loaded moods:', data);
        if (Array.isArray(data)) {
          // Filter deleted moods from server response before merging
          const filteredData = filterDeletedMoods(data);
          // Merge server data with existing optimistic (temp) moods to avoid flicker
          updateMoodsAndCache(prev => {
            const tempMoods = prev.filter(m => String(m.id || m._id || '').startsWith('temp-'));
            // Keep temp moods that haven't been confirmed by server yet
            const survivingTemps = tempMoods.filter(t => {
              const tUserId = String(t.userId?._id || t.userId || t.user?._id || t.user || '');
              return !filteredData.some(s => String(s.userId?._id || s.userId || s.user?._id || s.user || '') === tUserId);
            });
            return [...survivingTemps, ...filteredData];
          });
          saveMoodsLocally(user._id, filteredData).catch(() => {});
        }
      } catch (error) {
        console.error('Error loading moods:', error);
      }
    };

    loadMoods();
  }, [user?._id, updateMoodsAndCache]);

  // Update mood countdown every minute
  useEffect(() => {
    if (!viewingMood) return;
    const timer = setInterval(() => {
      setViewingMood(prev => prev ? ({ ...prev }) : null); // trigger re-render to update countdown
    }, 60000); // update every 60 seconds
    return () => clearInterval(timer);
  }, [viewingMood]);

  // Periodically clean up expired moods from local state and trigger re-render
  useEffect(() => {
    const interval = setInterval(() => {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      updateMoodsAndCache(prev => {
        const filtered = prev.filter(m => new Date(m.timestamp).getTime() > twentyFourHoursAgo);
        return filtered;
      });
    }, 30000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [user?._id, updateMoodsAndCache]);

  // Socket effects
  useEffect(() => {
    if (!socket) return;

    socket.on('initial_moods', (list) => {
      // Filter out deleted moods from socket's initial list
      const valid = filterDeletedMoods(
        list.filter(m => (Date.now() - new Date(m.timestamp).getTime()) < 24 * 60 * 60 * 1000)
      );
      updateMoodsAndCache(valid);
      console.log('initial moods received', valid.length);
    });

    socket.on('receive_mood', (mood) => {
      if (!mood) return;
      const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
      const incomingId = String(mood._id || mood.id || '');
      const incomingUserId = String(mood.userId?._id || mood.userId || mood.user?._id || mood.user || '');
      updateMoodsAndCache(prev => {
        // Check if exact ID already exists
        if (incomingId && prev.some(m => String(m._id || m.id || '') === incomingId)) {
          return prev;
        }
        // Check if a temp mood for the same user exists — replace it seamlessly
        const tempIdx = prev.findIndex(m =>
          String(m.id || m._id || '').startsWith('temp-') &&
          String(m.userId?._id || m.userId || m.user?._id || m.user || '') === incomingUserId
        );
        if (tempIdx !== -1) {
          // Replace the temp mood with the real one in-place (no flicker)
          const next = [...prev];
          next[tempIdx] = mood;
          return next;
        }
        return [mood, ...prev];
      });
      if (currentUserId && mood) {
        saveSingleMoodLocally(currentUserId, mood).catch(() => {});
      }
      console.log('receive_mood', incomingId);
    });

    // songAdded duplicate-safe socket listener
    socket.on('songAdded', (newSong) => {
      if (!newSong) return;
      const incomingId = String(newSong._id || newSong.id || '');
      updateMoodsAndCache(prev => {
        if (incomingId && prev.some(m => String(m._id || m.id || '') === incomingId)) {
          return prev;
        }
        return [newSong, ...prev];
      });
    });

    socket.on('delete_mood', ({ id }) => {
      const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
      updateMoodsAndCache(prev => prev.filter(m => {
        const mid = m.id || m._id;
        return String(mid) !== String(id);
      }));
      if (currentUserId && id) {
        deleteMoodLocally(currentUserId, id).catch(() => {});
      }
      console.log('delete_mood', id);
    });

    socket.on('receive_mood_like', ({ moodId, likes }) => {
      updateMoodsAndCache(prev => prev.map(m => {
        const mid = m.id || m._id;
        if (String(mid) === String(moodId)) {
          return { ...m, likes: likes || [] };
        }
        return m;
      }));

      setViewingMood(prev => {
        if (prev && String(prev.id || prev._id) === String(moodId)) {
          return { ...prev, likes: likes || [] };
        }
        return prev;
      });
    });

    return () => {
      socket.off('initial_moods');
      socket.off('receive_mood');
      socket.off('songAdded');
      socket.off('delete_mood');
      socket.off('receive_mood_like');
    };
  }, [socket, user?._id, user?.id, updateMoodsAndCache]);

  const renderNoteBubble = (mood) => {
    if (!mood) return null;
    const text = mood.text || '';
    const songMatch = text.match(/‹song›(.*?)‹\/song›/);
    let displayText = text;
    let songData = null;

    if (songMatch) {
      try {
        songData = JSON.parse(songMatch[1]);
        displayText = text.replace(songMatch[0], '').trim();
      } catch (e) { }
    }

    if (!displayText && !songData) return null;

    const isSingleEmoji = displayText && (displayText.length <= 4) && /[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]/u.test(displayText);

    return (
      <Box sx={{
        position: 'absolute',
        bottom: 'calc(100% - 6px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: !isMobile ? 78 : { xs: 84, sm: 96 },
        bgcolor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(14px)',
        borderRadius: '20px',
        py: '6px',
        px: '9px',
        border: '1.5px solid rgba(229, 46, 113, 0.16)',
        boxShadow: '0 8px 22px rgba(229, 46, 113, 0.15), 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Curved thought bubble tail circles with 3D depth */}
        <Box sx={{
          position: 'absolute',
          bottom: -4.5,
          left: '42%',
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: '#ffffff',
          border: '1.5px solid rgba(229, 46, 113, 0.2)',
          boxShadow: '0 2px 5px rgba(229, 46, 113, 0.12)'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -9.5,
          left: '32%',
          width: 4,
          height: 4,
          borderRadius: '50%',
          bgcolor: '#ffffff',
          border: '1.5px solid rgba(229, 46, 113, 0.2)',
          boxShadow: '0 1.5px 4px rgba(229, 46, 113, 0.1)'
        }} />

        {songData && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, width: '100%', justifyContent: 'center', mb: displayText ? '3px' : 0 }}>
            {/* Equalizer Playing Animation in Juicy brand pink */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: 10, width: 8, flexShrink: 0 }}>
              <Box sx={{ width: 1.5, bgcolor: '#e52e71', borderRadius: '0.5px', animation: 'eqBar1 0.6s ease-in-out infinite alternate' }} />
              <Box sx={{ width: 1.5, bgcolor: '#e52e71', borderRadius: '0.5px', animation: 'eqBar2 0.4s ease-in-out infinite alternate' }} />
              <Box sx={{ width: 1.5, bgcolor: '#e52e71', borderRadius: '0.5px', animation: 'eqBar3 0.7s ease-in-out infinite alternate' }} />
            </Box>
            <Typography sx={{
              fontSize: '0.65rem',
              fontWeight: 750,
              color: '#e52e71',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.1
            }}>
              {songData.trackName}
            </Typography>
          </Box>
        )}

        {displayText && (
          isSingleEmoji ? (
            <Typography sx={{
              fontSize: '1.35rem',
              textAlign: 'center',
              lineHeight: 1.1,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
              {displayText}
            </Typography>
          ) : (
            <Typography sx={{
              fontSize: '0.66rem',
              color: '#172033',
              fontWeight: 600,
              textAlign: 'center',
              lineHeight: 1.2,
              wordBreak: 'break-word',
              width: '100%',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {displayText}
            </Typography>
          )
        )}

        {/* Liked Heart Indicator Badge on Note Bubble with 3D pop */}
        {mood.likes && mood.likes.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              bgcolor: '#ffffff',
              borderRadius: '50%',
              width: 19,
              height: 19,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(229, 46, 113, 0.35)',
              zIndex: 12,
              border: '1.5px solid #ffffff'
            }}
          >
            <FavoriteIcon sx={{ color: '#e52e71', fontSize: 11 }} />
          </Box>
        )}
      </Box>
    );
  };

  const ownActiveMood = moods.find(
    mood => isOwnMood(mood) && (new Date() - new Date(mood.timestamp) <= 24 * 60 * 60 * 1000)
  );

  const friendsMoods = moods.filter(
    mood => !isOwnMood(mood) && dbFriends.some(f => {
      const friendId = f._id?.toString() || f._id;
      const moodUserId = mood.userId?._id || mood.userId || mood.user?._id || mood.user;
      return String(friendId) === String(moodUserId);
    }) && (new Date() - new Date(mood.timestamp) <= 24 * 60 * 60 * 1000)
  );

  const hasAnyActiveNotes = ownActiveMood || friendsMoods.length > 0;

  return (
    <>
      <Box component="style">{`
        @keyframes eqBar1 {
          0% { height: 3px; }
          100% { height: 11px; }
        }
        @keyframes eqBar2 {
          0% { height: 11px; }
          100% { height: 3px; }
        }
        @keyframes eqBar3 {
          0% { height: 5px; }
          100% { height: 12px; }
        }
      `}</Box>

      {/* Daily mood row */}
      <Box sx={{
        display: 'flex',
        gap: !isMobile ? 2.2 : { xs: 2.5, sm: 4.2 },
        pt: !isMobile ? (hasAnyActiveNotes ? '36px' : '10px') : (hasAnyActiveNotes ? { xs: '38px', sm: '44px' } : { xs: '8px', sm: '8px' }),
        pb: { xs: 0.6, sm: 0.8 },
        alignItems: 'center',
        overflowX: 'auto',
        px: { xs: 1.2, sm: 1.8 },
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        transition: 'padding-top 0.2s ease-in-out'
      }}>
        {/* Unified "Your note" item with 3D depth */}
        <Box
          key="own-note-item"
          onClick={() => {
            if (ownActiveMood) {
              handleViewMood(ownActiveMood);
            } else {
              setShowMoodDialog(true);
            }
          }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: !isMobile ? 64 : { xs: 64, sm: 78 },
            cursor: 'pointer',
            position: 'relative',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:hover': {
              transform: 'translateY(-2px)'
            },
            '&:active': {
              transform: 'scale(0.96)'
            }
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                p: '2.5px',
                borderRadius: '50%',
                background: ownActiveMood
                  ? 'linear-gradient(135deg, #ff5c8d 0%, #e52e71 100%)'
                  : 'linear-gradient(135deg, rgba(229, 46, 113, 0.35) 0%, rgba(255, 255, 255, 0.8) 100%)',
                boxShadow: ownActiveMood
                  ? '0 4px 14px rgba(229, 46, 113, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : '0 3px 10px rgba(0,0,0,0.06)'
              }}
            >
              <Avatar
                src={getProfileSrc(user)}
                sx={{
                  width: !isMobile ? 52 : { xs: 52, sm: 66 },
                  height: !isMobile ? 52 : { xs: 52, sm: 66 },
                  border: '2.5px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
              />
            </Box>

            {/* 3D Overlap badge if inactive */}
            {!ownActiveMood && (
              <Box sx={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 24,
                height: 24,
                background: 'linear-gradient(135deg, #ff5c8d 0%, #e52e71 100%)',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                boxShadow: '0 3px 10px rgba(229, 46, 113, 0.45), inset 0 1px 0 rgba(255,255,255,0.4)'
              }}>
                <AddIcon sx={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }} />
              </Box>
            )}

            {/* Bubble above avatar if active */}
            {ownActiveMood && renderNoteBubble(ownActiveMood)}
          </Box>
          <Typography variant="caption" sx={{ mt: 0.8, color: '#172033', fontWeight: 650, fontSize: '0.78rem', textAlign: 'center', letterSpacing: '-0.2px' }}>
            Your note
          </Typography>
        </Box>

        {/* Display friends' moods with 3D styling */}
        {friendsMoods
          .map((mood, index) => {
            const moodUserId = mood.userId?._id || mood.userId || mood.user?._id || mood.user;
            const isFriendOnline = onlineUserIds.some(oid => String(oid) === String(moodUserId));

            return (
              <Box
                key={mood._id || mood.id || `friend-${index}`}
                onClick={() => handleViewMood(mood)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: !isMobile ? 64 : { xs: 64, sm: 78 },
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  },
                  '&:active': {
                    transform: 'scale(0.96)'
                  }
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Box
                    sx={{
                      p: '2.5px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff5c8d 0%, #e52e71 100%)',
                      boxShadow: '0 4px 14px rgba(229, 46, 113, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                    }}
                  >
                    <Avatar
                      src={mood.profilePic}
                      sx={{
                        width: !isMobile ? 52 : { xs: 52, sm: 66 },
                        height: !isMobile ? 52 : { xs: 52, sm: 66 },
                        border: '2.5px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                      }}
                    />
                  </Box>
                  {/* Speech Bubble above avatar */}
                  {renderNoteBubble(mood)}

                  {/* 3D Online dot badge */}
                  {isFriendOnline && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 1,
                      right: 1,
                      width: 15,
                      height: 15,
                      bgcolor: '#10b981',
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      zIndex: 3,
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.55)'
                    }} />
                  )}
                </Box>
                <Typography variant="caption" sx={{
                  mt: 0.8,
                  color: '#172033',
                  fontWeight: 650,
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  maxWidth: { xs: 64, sm: 78 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  letterSpacing: '-0.2px'
                }}>
                  {mood.username}
                </Typography>
              </Box>
            );
          })}
      </Box>

      {/* Mood viewing dialog (3D Elevated Bottom Sheet / Modal) */}
      <Dialog
        open={!!viewingMood}
        onClose={() => {
          setViewingMood(null);
          setPlayingSongUrl(null);
        }}
        fullWidth
        maxWidth="sm"
        TransitionComponent={isMobile ? Slide : undefined}
        TransitionProps={isMobile ? { direction: "up" } : undefined}
        PaperProps={{
          sx: isMobile ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            m: 0,
            borderRadius: '26px 26px 0 0',
            width: '100%',
            height: { xs: '82vh', sm: '75vh', md: '60vh' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#fffafb',
            boxShadow: '0 -10px 40px rgba(30, 41, 59, 0.16)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            transform: viewingDrag.dragY > 0 ? `translateY(${viewingDrag.dragY}px)` : 'none',
            transition: viewingDrag.isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            touchAction: 'pan-y'
          } : {
            borderRadius: '26px',
            width: '480px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#fffafb',
            border: '1px solid rgba(229, 46, 113, 0.12)',
            boxShadow: '0 24px 64px rgba(30, 41, 59, 0.18)',
          },
          ...viewingDrag.touchHandlers
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(23, 32, 51, 0.45)', backdropFilter: 'blur(4px)' } }}
      >
        {viewingMood && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }}>
            {/* 3D Header with Juicy pink gradient */}
            <Box
              sx={{
                px: 2.5,
                pt: isMobile ? 1.2 : 2,
                pb: isMobile ? 1.2 : 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isMobile ? 0.6 : 0,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #ff5c8d 0%, #e52e71 100%)',
                color: '#fff',
                boxShadow: '0 4px 18px rgba(229, 46, 113, 0.25)'
              }}
            >
              {isMobile && (
                <Box
                  sx={{
                    width: 44,
                    height: 5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.65)',
                    mb: 0.8
                  }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, width: '100%' }}>
                <Avatar
                  src={getProfileSrc(viewingMood.user)}
                  sx={{
                    width: 46,
                    height: 46,
                    border: '2.5px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 750, color: 'white', fontSize: '1.02rem', letterSpacing: '-0.2px' }}>
                      {viewingMood.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.74rem' }}>
                      {formatTime(new Date(viewingMood.timestamp || Date.now()))}
                    </Typography>
                  </Box>
                  {(() => {
                    const text = viewingMood.text || '';
                    const songMatch = text.match(/‹song›(.*?)‹\/song›/);
                    if (songMatch) {
                      try {
                        const songData = JSON.parse(songMatch[1]);
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.2 }}>
                            <MusicNoteIcon sx={{ fontSize: 13, color: 'white' }} />
                            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', flex: 1 }}>
                              <Typography variant="caption" sx={{
                                color: 'white',
                                fontWeight: 600,
                                display: 'inline-block',
                                animation: 'marquee 10s linear infinite',
                                '@keyframes marquee': {
                                  '0%': { transform: 'translateX(100%)' },
                                  '100%': { transform: 'translateX(-100%)' }
                                }
                              }}>
                                {songData.trackName} • {songData.artistName}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      } catch (e) { }
                    }
                    return null;
                  })()}
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  {isOwnMood(viewingMood) && (
                    <IconButton
                      key="delete-mood-btn"
                      onClick={() => {
                        const id = viewingMood?.id || viewingMood?._id;
                        if (id) {
                          setMoodToDeleteId(id);
                          setDeleteConfirmOpen(true);
                        }
                      }}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '50%',
                        p: 0.8,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)', transform: 'scale(1.05)' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                  <IconButton
                    key="close-mood-btn"
                    onClick={() => {
                      setViewingMood(null);
                      setPlayingSongUrl(null);
                    }}
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: '50%',
                      p: 0.8,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)', transform: 'scale(1.05)' }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Box
              ref={viewingDrag.scrollContainerRef}
              sx={{
                px: 3, pt: 3, pb: isMobile ? 12 : 4, overflowY: 'auto', flex: 1, bgcolor: '#fffafb'
              }}
            >
              {/* Text Content First - 3D White Card */}
              {(() => {
                const text = viewingMood.text || '';
                const songMatch = text.match(/‹song›(.*?)‹\/song›/);
                let displayText = text;
                let songDuration = 15;
                if (songMatch) {
                  try {
                    const songData = JSON.parse(songMatch[1]);
                    displayText = text.replace(songMatch[0], '').trim();
                    songDuration = songData.duration || 15;
                  } catch (e) { }
                }

                return (
                  <>
                    {displayText && (
                      <Box sx={{ mb: 3.5, position: 'relative' }}>
                        <Paper sx={{
                          p: 3,
                          borderRadius: '22px',
                          bgcolor: '#ffffff',
                          border: '1px solid rgba(229, 46, 113, 0.12)',
                          width: '100%',
                          boxShadow: '0 8px 24px rgba(30, 41, 59, 0.06)'
                        }}>
                          <Typography
                            sx={{
                              whiteSpace: 'pre-wrap',
                              fontSize: '1.1rem',
                              lineHeight: 1.6,
                              fontWeight: 600,
                              color: '#172033'
                            }}
                          >
                            {displayText}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                    {playingSongUrl && (
                      <audio
                        autoPlay
                        src={playingSongUrl}
                        onTimeUpdate={(e) => {
                          if (e.target.currentTime >= playingSongStartTime + songDuration) {
                            e.target.currentTime = playingSongStartTime;
                            e.target.play().catch(err => console.error("Audio replay error:", err));
                          }
                        }}
                        onLoadedMetadata={(e) => {
                          e.target.currentTime = playingSongStartTime;
                        }}
                        onEnded={(e) => {
                          e.target.currentTime = playingSongStartTime;
                          e.target.play().catch(err => console.error("Audio replay error:", err));
                        }}
                      />
                    )}
                  </>
                );
              })()}

              {/* Large Centered 3D Floating Emoji Sphere / Artwork */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'relative',
                  mt: 2
                }}
              >
                <Box sx={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 84,
                  border: '4px solid #ffffff',
                  boxShadow: '0 18px 40px rgba(229, 46, 113, 0.22), 0 4px 12px rgba(0,0,0,0.06)',
                  animation: 'pulseEmoji 2.5s infinite ease-in-out',
                  '@keyframes pulseEmoji': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.04)' },
                    '100%': { transform: 'scale(1)' }
                  },
                  overflow: 'hidden'
                }}>
                  {(() => {
                    const text = viewingMood.text || '';
                    const songMatch = text.match(/‹song›(.*?)‹\/song›/);
                    if (songMatch) {
                      try {
                        const songData = JSON.parse(songMatch[1]);
                        if (songData.artworkUrl100) {
                          const artworkUrl = songData.artworkUrl100.replace('100x100bb', '250x250bb');
                          return (
                            <Box
                              component="img"
                              src={artworkUrl}
                              alt="song-artwork"
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          );
                        }
                      } catch (e) { }
                    }
                    return viewingMood.emoji;
                  })()}
                </Box>
                {/* 3D Heart Like Button */}
                {(() => {
                  const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
                  const likes = viewingMood.likes || [];
                  const isLikedByMe = likes.some(l => String(l.userId) === String(currentUserId));

                  return (
                    <IconButton
                      onClick={() => handleToggleLike(viewingMood)}
                      sx={{
                        position: 'absolute',
                        left: !isOwnMood(viewingMood) ? -8 : 'calc(50% - 24px)',
                        bottom: -8,
                        bgcolor: '#ffffff',
                        border: '1.5px solid rgba(229, 46, 113, 0.2)',
                        boxShadow: isLikedByMe
                          ? '0 6px 20px rgba(229, 46, 113, 0.45)'
                          : '0 4px 14px rgba(30, 41, 59, 0.12)',
                        transform: 'scale(1.2)',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '&:hover': {
                          bgcolor: '#fff0f5',
                          transform: 'scale(1.35)'
                        }
                      }}
                    >
                      {isLikedByMe ? (
                        <FavoriteIcon sx={{ color: '#e52e71', fontSize: 20, animation: 'heartPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ color: '#e52e71', fontSize: 20 }} />
                      )}
                    </IconButton>
                  );
                })()}

                {!isOwnMood(viewingMood) && (
                  <IconButton
                    onClick={() => {
                      const text = viewingMood.text || '';
                      const songMatch = text.match(/‹song›(.*?)‹\/song›/);
                      if (songMatch) {
                        try {
                          const songData = JSON.parse(songMatch[1]);
                          handleMoodReplyInChat(viewingMood, null, `🎵 ${songData.trackName} - ${songData.artistName}`, 'song');
                        } catch (e) {
                          handleMoodReplyInChat(viewingMood, viewingMood.emoji, null);
                        }
                      } else {
                        handleMoodReplyInChat(viewingMood, viewingMood.emoji, null);
                      }
                    }}
                    sx={{
                      position: 'absolute',
                      right: -8,
                      bottom: -8,
                      bgcolor: '#ffffff',
                      border: '1.5px solid rgba(229, 46, 113, 0.2)',
                      boxShadow: '0 6px 18px rgba(229, 46, 113, 0.25)',
                      transform: 'scale(1.2)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#fff0f5',
                        transform: 'scale(1.35)'
                      }
                    }}
                  >
                    <ReplyIcon sx={{ color: '#e52e71' }} />
                  </IconButton>
                )}
              </Box>

              {/* 3D Likers Pill View */}
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                {viewingMood.likes && viewingMood.likes.length > 0 ? (
                  <Box
                    onClick={() => setShowLikersDialog(true)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      bgcolor: '#fff0f5',
                      border: '1px solid rgba(229, 46, 113, 0.25)',
                      borderRadius: '24px',
                      py: 0.7,
                      px: 2,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(229, 46, 113, 0.12)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(229, 46, 113, 0.14)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    {/* Overlapping Likers Avatars */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {viewingMood.likes.slice(0, 3).map((liker, i) => (
                        <Avatar
                          key={liker.userId || i}
                          src={getProfileSrc(liker)}
                          sx={{
                            width: 24,
                            height: 24,
                            border: '2px solid #ffffff',
                            ml: i > 0 ? -1 : 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                      ))}
                    </Box>

                    <FavoriteIcon sx={{ color: '#e52e71', fontSize: 16 }} />

                    <Typography sx={{ fontSize: '0.84rem', fontWeight: 650, color: '#172033' }}>
                      {(() => {
                        const likers = viewingMood.likes;
                        const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
                        const hasLiked = likers.some(l => String(l.userId) === String(currentUserId));
                        const otherCount = likers.length - 1;

                        if (likers.length === 1) {
                          return hasLiked ? 'Liked by you' : `Liked by ${likers[0].username || 'someone'}`;
                        } else if (hasLiked) {
                          return `Liked by you and ${otherCount} other${otherCount > 1 ? 's' : ''}`;
                        } else {
                          return `Liked by ${likers[0].username || 'someone'} and ${otherCount} other${otherCount > 1 ? 's' : ''}`;
                        }
                      })()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: '#718096', fontStyle: 'italic', fontSize: '0.8rem' }}>
                    Tap heart to be the first to like
                  </Typography>
                )}
              </Box>

              {/* 3D Countdown & Time Info Card */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mt: 3,
                  bgcolor: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid rgba(229, 46, 113, 0.12)',
                  boxShadow: '0 4px 18px rgba(30, 41, 59, 0.05)'
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#172033', fontSize: '0.92rem' }}>Status Active</Typography>
                  <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.8rem', mt: 0.3 }}>
                    Posted {new Date(viewingMood.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ fontWeight: 750, color: '#e52e71', fontSize: '1rem' }}>{getMoodCountdown(viewingMood.timestamp)}</Typography>
                  <Typography sx={{ fontSize: '2rem', mt: 0.5 }}>{viewingMood.emoji}</Typography>
                </Box>
              </Box>

              {/* Scrollable Liked Users Section - 3D Card */}
              <Box
                sx={{
                  mt: 3,
                  mx: 'auto',
                  width: '100%',
                  maxWidth: 380,
                  bgcolor: '#ffffff',
                  borderRadius: '20px',
                  p: 2,
                  boxShadow: '0 6px 22px rgba(30, 41, 59, 0.06)',
                  border: '1px solid rgba(229, 46, 113, 0.12)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    pb: 1,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FavoriteIcon sx={{ color: '#e52e71', fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 750, fontSize: '0.95rem', color: '#172033' }}>
                      Liked Users ({viewingMood?.likes?.length || 0})
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    maxHeight: 160,
                    overflowY: 'auto',
                    pr: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.03)', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(229,46,113,0.3)', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#e52e71' }
                  }}
                >
                  {viewingMood?.likes && viewingMood.likes.length > 0 ? (
                    viewingMood.likes.map((liker, idx) => {
                      const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
                      const isMe = String(liker.userId) === String(currentUserId);
                      return (
                        <Box
                          key={liker.userId || idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            borderRadius: '14px',
                            bgcolor: isMe ? '#fff0f5' : 'rgba(30, 41, 59, 0.02)',
                            border: isMe ? '1px solid rgba(229, 46, 113, 0.2)' : 'none',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: 'rgba(229, 46, 113, 0.12)',
                              transform: 'translateX(2px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={getProfileSrc(liker)}
                              sx={{ width: 34, height: 34, border: '1.5px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                            />
                            <Typography sx={{ fontWeight: 650, fontSize: '0.88rem', color: '#172033' }}>
                              {liker.username || 'User'}
                            </Typography>
                          </Box>
                          {isMe && (
                            <Typography variant="caption" sx={{ color: '#e52e71', fontWeight: 750, px: 1.2, py: 0.3, bgcolor: 'rgba(229,46,113,0.12)', borderRadius: '10px' }}>
                              You
                            </Typography>
                          )}
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#718096', fontStyle: 'italic' }}>
                        No likes yet. Be the first to like!
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Bottom-sheet mood dialog (Create Note) - 3D Elevated Dialog */}
      <Dialog
        open={showMoodDialog}
        onClose={() => setShowMoodDialog(false)}
        fullWidth
        maxWidth="sm"
        TransitionComponent={isMobile ? Slide : undefined}
        TransitionProps={isMobile ? { direction: "up" } : undefined}
        PaperProps={{
          sx: isMobile ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            m: 0,
            borderRadius: '26px 26px 0 0',
            width: '100%',
            height: { xs: '84vh', sm: '78vh', md: '62vh' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#fffafb',
            boxShadow: '0 -10px 40px rgba(30, 41, 59, 0.16)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            transform: moodDialogDrag.dragY > 0 ? `translateY(${moodDialogDrag.dragY}px)` : 'none',
            transition: moodDialogDrag.isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            touchAction: 'pan-y'
          } : {
            borderRadius: '26px',
            width: '480px',
            maxWidth: '90vw',
            maxHeight: '86vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#fffafb',
            border: '1px solid rgba(229, 46, 113, 0.12)',
            boxShadow: '0 24px 64px rgba(30, 41, 59, 0.18)',
          },
          ...moodDialogDrag.touchHandlers
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(23, 32, 51, 0.45)', backdropFilter: 'blur(4px)' } }}
      >
        {musicEditorSong ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#121212', color: '#fff' }}>
            <Box sx={{ px: 2.5, pt: isMobile ? 1.2 : 2.5, pb: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isMobile && <Box sx={{ width: 44, height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.3)', mb: 2 }} />}
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography onClick={() => { setMusicEditorSong(null); setIsAudioPlaying(true); setClipDuration(15); setShowDurationPicker(false); }} sx={{ cursor: 'pointer', fontSize: 15, color: '#aaa', fontWeight: 600 }}>Cancel</Typography>
                <Typography onClick={() => {
                  const finalSong = { ...musicEditorSong, duration: clipDuration };
                  setSelectedSong(finalSong);
                  setMusicEditorSong(null);
                  setIsAudioPlaying(true);
                  setSongConfirmationMessage(`"${finalSong.trackName}" added to note ✨`);
                  setSongSnackbarOpen(true);
                }} sx={{ cursor: 'pointer', fontSize: 15, fontWeight: 750, color: '#e52e71' }}>Done</Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Avatar src={musicEditorSong.artworkUrl100} variant="rounded" sx={{ width: 88, height: 88, mb: 2.5, borderRadius: '20px', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} />
              <Typography sx={{ fontWeight: 750, fontSize: 19, mb: 0.5 }}>{musicEditorSong.trackName}</Typography>
              <Typography sx={{ color: '#aaa', fontSize: 14, mb: 5 }}>{musicEditorSong.artistName}</Typography>

              <Box sx={{ width: '100%', mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Clickable Clip Duration Selector */}
                <Box
                  onClick={() => setShowDurationPicker(prev => !prev)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  {clipDuration}

                  {/* Duration Picker Dropdown List */}
                  {showDurationPicker && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: '#1c1c1e',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      py: 0.5,
                      width: 64,
                      zIndex: 20,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {[5, 10, 15, 30].map((sec) => (
                        <Box
                          key={sec}
                          onClick={(e) => {
                            e.stopPropagation();
                            setClipDuration(sec);
                            setShowDurationPicker(false);
                            if ((musicEditorSong.startTime || 0) + sec > 30) {
                              setMusicEditorSong(prev => ({ ...prev, startTime: Math.max(0, 30 - sec) }));
                            }
                          }}
                          sx={{
                            py: 0.75,
                            textAlign: 'center',
                            color: clipDuration === sec ? '#e52e71' : '#fff',
                            fontSize: 13,
                            fontWeight: clipDuration === sec ? 750 : 500,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                          }}
                        >
                          {sec}s
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Progress bar with 3D trace */}
                <Box sx={{ flex: 1, height: 5, bgcolor: 'rgba(255,255,255,0.2)', position: 'relative', borderRadius: 2 }}>
                  {/* Selected crop segment */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${(musicEditorSong.startTime || 0) / 30 * 100}%`,
                    width: `${clipDuration / 30 * 100}%`,
                    height: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.35)',
                    borderRadius: 2
                  }} />

                  {/* Current playback trace (pink fill) */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${(musicEditorSong.startTime || 0) / 30 * 100}%`,
                    width: `${Math.max(0, Math.min(clipDuration, currentPlayTime - (musicEditorSong.startTime || 0))) / 30 * 100}%`,
                    height: '100%',
                    bgcolor: '#e52e71',
                    borderRadius: 2
                  }} />

                  {/* Playback trace thumb */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${(currentPlayTime || 0) / 30 * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#fff',
                    boxShadow: '0 0 6px rgba(0,0,0,0.6)',
                    pointerEvents: 'none'
                  }} />
                </Box>

                {/* 3D Play/Stop Audio Button */}
                <Box
                  onClick={() => setIsAudioPlaying(prev => !prev)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    '&:hover': { transform: 'scale(1.08)' },
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isAudioPlaying ? (
                    <Box sx={{ width: 11, height: 11, bgcolor: '#000', borderRadius: 0.5 }} />
                  ) : (
                    <Box sx={{
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderLeft: '10px solid #000',
                      ml: '2px'
                    }} />
                  )}
                </Box>
              </Box>

              <Box sx={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
                {!isMobile && (
                  <IconButton
                    onClick={() => handleNudgeScroll('left')}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      zIndex: 10,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                      width: 30,
                      height: 30,
                    }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}

                <Box sx={{ position: 'relative', width: '100%', height: 68, overflow: 'hidden' }}>
                  <Box sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 144,
                    height: 68,
                    border: '3px solid white',
                    borderLeft: '6px solid #e52e71',
                    borderRadius: '10px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                    pointerEvents: 'none',
                    zIndex: 2
                  }} />

                  <Box
                    ref={scrollContainerRef}
                    sx={{
                      width: '100%',
                      height: '100%',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      scrollBehavior: 'smooth',
                      '&::-webkit-scrollbar': { display: 'none' }
                    }}
                    onScroll={(e) => {
                      const maxScroll = e.target.scrollWidth - e.target.clientWidth;
                      if (maxScroll > 0) {
                        const percentage = e.target.scrollLeft / maxScroll;
                        const maxStartTime = Math.max(0, 30 - clipDuration);
                        const newStartTime = percentage * maxStartTime;
                        setMusicEditorSong(prev => ({ ...prev, startTime: newStartTime }));
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 'calc(50% - 72px)' }} />
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {Array.from({ length: 60 }).map((_, i) => (
                        <Box key={i} sx={{ width: 3, height: [12, 24, 36, 48, 20, 30, 40, 15, 25, 45][i % 10] * 1.2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }} />
                      ))}
                    </Box>
                    <Box sx={{ minWidth: 'calc(50% - 72px)' }} />
                  </Box>
                </Box>

                {!isMobile && (
                  <IconButton
                    onClick={() => handleNudgeScroll('right')}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      zIndex: 10,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                      width: 30,
                      height: 30,
                    }}
                  >
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Box>
            </Box>

            {isAudioPlaying && (
              <audio
                ref={musicAudioRef}
                autoPlay
                src={musicEditorSong.previewUrl}
                onTimeUpdate={(e) => {
                  const st = musicEditorSong.startTime || 0;
                  setCurrentPlayTime(e.target.currentTime);
                  if (e.target.currentTime < st || e.target.currentTime >= st + clipDuration) {
                    e.target.currentTime = st;
                    e.target.play().catch(err => console.error("Audio error:", err));
                  }
                }}
                onLoadedMetadata={(e) => {
                  e.target.currentTime = musicEditorSong.startTime || 0;
                  setCurrentPlayTime(musicEditorSong.startTime || 0);
                }}
              />
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }}>
            {/* 3D Juicy Pink Banner */}
            <Box sx={{
              px: 2.5, pt: isMobile ? 1.2 : 2.5, pb: 1.8, display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'linear-gradient(135deg, #ff5c8d 0%, #e52e71 100%)',
              color: '#fff',
              boxShadow: '0 4px 18px rgba(229, 46, 113, 0.25)',
              flexShrink: 0
            }}>
              {isMobile && (
                <Box sx={{
                  width: 44, height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.65)', mb: 1.2
                }} />
              )}
              <Typography sx={{ fontWeight: 750, fontSize: '1.1rem', letterSpacing: '-0.2px' }}>Share your feelings</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.4, fontSize: '0.78rem' }}>Post a mood note — lasts 24 hours</Typography>
            </Box>

            <Box
              ref={moodDialogDrag.scrollContainerRef}
              sx={{
                px: 2.5, pt: 2.5, pb: 2.5, flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: '#fffafb'
              }}
            >
              {/* User Preview 3D Card */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2.5,
                p: 1.8,
                bgcolor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #f1e5eb',
                boxShadow: '0 4px 18px rgba(30, 41, 59, 0.05)'
              }}>
                <Avatar src={getProfileSrc(user)} sx={{ width: 54, height: 54, border: '2.5px solid #ffffff', boxShadow: '0 3px 8px rgba(0,0,0,0.1)' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '50%', bgcolor: '#fff0f5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1.5px solid rgba(229, 46, 113, 0.2)', fontSize: 22,
                      boxShadow: '0 2px 8px rgba(229, 46, 113, 0.15)',
                      flexShrink: 0
                    }}>
                      {selectedMood?.emoji || '🙂'}
                    </Box>
                    <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                      <Box sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        position: 'relative',
                        lineHeight: '1.2'
                      }}>
                        <Box sx={{
                          display: 'inline-block',
                          px: 0.5,
                          animation: moodText ? 'moodMarquee 8s linear infinite' : 'none'
                        }}>
                          <Typography sx={{
                            fontWeight: 750, fontSize: 14, color: '#172033', letterSpacing: '-0.2px'
                          }}>{user?.username || 'You'}</Typography>
                          <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.82rem', mt: 0.2 }}>
                            {moodText || (selectedMood ? selectedMood.name : 'No note yet')}
                          </Typography>
                        </Box>
                        <Box component="style">{`
                        @keyframes moodMarquee {
                          0% { transform: translateX(100%); }
                          100% { transform: translateX(-100%); }
                        }
                      `}</Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* 3D Emojis Tactile Grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(5, 1fr)', sm: 'repeat(6, 1fr)', md: 'repeat(8, 1fr)' },
                gap: 1.2,
                mb: 2.5
              }}>
                {moodEmojis.map((m) => {
                  const isSelected = selectedMood?.emoji === m.emoji;
                  return (
                    <Box
                      key={m.emoji}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMood(null);
                          setMoodText(prev => (prev || '').replace(new RegExp(`^${m.emoji}\\s?`, 'g'), ''));
                        } else {
                          setSelectedMood(m);
                          setMoodText(prev => {
                            const without = (prev || '').replace(/^(\p{Emoji_Presentation}|\p{Emoji})+\s?/u, '');
                            return `${m.emoji} ${without}`.trim();
                          });
                        }
                      }}
                      sx={{
                        height: isMobile ? 50 : 58,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        fontSize: isMobile ? 22 : 24,
                        cursor: 'pointer',
                        bgcolor: isSelected ? '#fff0f5' : '#ffffff',
                        border: isSelected ? '2px solid #e52e71' : '1px solid #f1e5eb',
                        boxShadow: isSelected
                          ? '0 6px 18px rgba(229, 46, 113, 0.25)'
                          : '0 4px 12px rgba(30, 41, 59, 0.04)',
                        transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                        transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        '&:hover': {
                          bgcolor: isSelected ? '#fff0f5' : '#ffffff',
                          transform: isSelected ? 'scale(1.08)' : 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(30, 41, 59, 0.08)',
                          borderColor: isSelected ? '#e52e71' : 'rgba(229, 46, 113, 0.3)'
                        }
                      }}
                    >
                      {m.emoji}
                    </Box>
                  );
                })}
              </Box>

              {/* 3D Rounded Note Text Input */}
              <TextField
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                placeholder="Write something... (optional)"
                fullWidth
                multiline
                minRows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#ffffff',
                    borderRadius: '18px',
                    color: '#172033',
                    fontSize: '0.94rem',
                    boxShadow: '0 2px 10px rgba(30, 41, 59, 0.03)',
                    '& fieldset': {
                      borderColor: '#f1e5eb',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(229, 46, 113, 0.35)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#e52e71',
                      borderWidth: '2px'
                    },
                  },
                  mb: 2.5
                }}
              />

              {/* 3D MUSIC SECTION */}
              <Box sx={{ mb: 2.5 }}>
                {selectedSong ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #fff0f5 0%, #ffffff 100%)',
                      border: '1.5px solid rgba(229, 46, 113, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.6,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 6px 22px rgba(229, 46, 113, 0.14)'
                    }}
                  >
                    {/* Album Artwork & Music Icon Badge */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Avatar
                        src={selectedSong.artworkUrl100}
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '14px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          border: '1.5px solid rgba(255, 255, 255, 0.9)'
                        }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        bottom: -3,
                        right: -3,
                        bgcolor: '#e52e71',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(229, 46, 113, 0.4)'
                      }}>
                        <MusicNoteIcon sx={{ color: '#fff', fontSize: 12 }} />
                      </Box>
                    </Box>

                    {/* Track Info & Duration Pill */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography noWrap sx={{ fontWeight: 750, fontSize: '0.92rem', color: '#172033' }}>
                          {selectedSong.trackName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: 'rgba(229, 46, 113, 0.12)',
                            color: '#e52e71',
                            fontWeight: 750,
                            px: 1,
                            py: 0.25,
                            borderRadius: '10px',
                            fontSize: '0.68rem'
                          }}
                        >
                          {selectedSong.duration || 15}s
                        </Typography>
                      </Box>

                      <Typography noWrap sx={{ fontSize: '0.78rem', color: '#718096', mt: 0.3 }}>
                        {selectedSong.artistName}
                      </Typography>

                      {/* Equalizer Indicator in Juicy pink */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: 9, width: 8 }}>
                          <Box sx={{ width: 1.5, bgcolor: '#e52e71', borderRadius: '0.5px', animation: 'eqBar1 0.6s ease-in-out infinite alternate' }} />
                          <Box sx={{ width: 1.5, bgcolor: '#e52e71', borderRadius: '0.5px', animation: 'eqBar2 0.4s ease-in-out infinite alternate' }} />
                          <Box sx={{ width: 1.5, bgcolor: '#e52e71', borderRadius: '0.5px', animation: 'eqBar3 0.7s ease-in-out infinite alternate' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#e52e71', fontWeight: 700, fontSize: '0.72rem' }}>
                          Music attached
                        </Typography>
                      </Box>
                    </Box>

                    {/* 3D Action Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <IconButton
                        size="small"
                        onClick={() => setMusicEditorSong({ ...selectedSong })}
                        title="Edit clip duration"
                        sx={{
                          bgcolor: 'rgba(229, 46, 113, 0.12)',
                          color: '#e52e71',
                          p: 0.8,
                          borderRadius: '12px',
                          '&:hover': { bgcolor: 'rgba(229, 46, 113, 0.22)' }
                        }}
                      >
                        <MusicNoteIcon sx={{ fontSize: 17 }} />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedSong(null);
                          setSongConfirmationMessage('Song removed');
                          setSongSnackbarOpen(true);
                        }}
                        title="Remove song"
                        sx={{
                          bgcolor: 'rgba(0, 0, 0, 0.05)',
                          color: '#718096',
                          p: 0.8,
                          borderRadius: '12px',
                          '&:hover': { bgcolor: 'rgba(229, 46, 113, 0.15)', color: '#e52e71' }
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>
                  </Paper>
                ) : (
                  <Box>
                    {showMusicSearch ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                        <TextField
                          size="small"
                          placeholder="Search for a song..."
                          value={songSearchQuery}
                          onChange={(e) => handleSearchSong(e.target.value)}
                          autoFocus
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#ffffff',
                              borderRadius: '16px',
                              '& fieldset': { borderColor: '#f1e5eb' },
                              '&:hover fieldset': { borderColor: '#e52e71' },
                              '&.Mui-focused fieldset': { borderColor: '#e52e71' }
                            }
                          }}
                          InputProps={{
                            startAdornment: <MusicNoteIcon sx={{ color: '#e52e71', mr: 1, fontSize: 19 }} />,
                            endAdornment: isSearchingSong ? <Typography variant="caption" sx={{ color: '#e52e71' }}>...</Typography> : null
                          }}
                        />
                        {((songSearchResults.length > 0) || (!songSearchQuery.trim())) && (
                          <Box sx={{
                            maxHeight: 160,
                            overflowY: 'auto',
                            border: '1px solid #f1e5eb',
                            borderRadius: '16px',
                            bgcolor: '#ffffff',
                            boxShadow: '0 8px 24px rgba(30, 41, 59, 0.08)',
                            p: 0.5
                          }}>
                            {((songSearchResults.length > 0) ? songSearchResults : defaultSongs).map((song, idx) => (
                              <Box
                                key={idx}
                                onClick={() => {
                                  setMusicEditorSong({ ...song, startTime: 0 });
                                  setShowMusicSearch(false);
                                  setSongSearchResults([]);
                                  setSongSearchQuery('');
                                }}
                                sx={{
                                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1,
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  '&:hover': { bgcolor: '#fff0f5', transform: 'translateX(2px)' }
                                }}
                              >
                                <Avatar src={song.artworkUrl100} variant="rounded" sx={{ width: 36, height: 36, borderRadius: '10px' }} />
                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>{song.trackName}</Typography>
                                  <Typography noWrap sx={{ fontSize: 11, color: '#718096' }}>{song.artistName}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<MusicNoteIcon />}
                        onClick={() => setShowMusicSearch(true)}
                        sx={{
                          textTransform: 'none',
                          color: '#e52e71',
                          borderColor: 'rgba(229, 46, 113, 0.25)',
                          bgcolor: '#fff0f5',
                          borderRadius: '16px',
                          fontWeight: 700,
                          px: 2,
                          py: 0.8,
                          boxShadow: '0 2px 8px rgba(229, 46, 113, 0.08)',
                          '&:hover': {
                            borderColor: '#e52e71',
                            bgcolor: 'rgba(229, 46, 113, 0.12)'
                          }
                        }}
                      >
                        Add Music 🎵
                      </Button>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#718096', fontSize: 13 }}>
                <Typography sx={{ color: '#718096', fontSize: '0.82rem' }}>Visible to friends</Typography>
                <Typography sx={{ color: '#e52e71', fontWeight: 650, fontSize: '0.82rem' }}>{selectedMood ? selectedMood.name : 'No emoji selected'}</Typography>
              </Box>
            </Box>

            {/* 3D Footer Action Buttons */}
            <Box sx={{
              display: 'flex',
              gap: 1.5,
              p: 2,
              pb: isMobile ? 'calc(env(safe-area-inset-bottom) + 10px)' : 2,
              borderTop: '1px solid #f1e5eb',
              bgcolor: '#ffffff',
              flexShrink: 0
            }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSelectedMood(null);
                  setMoodText('');
                  setSelectedSong(null);
                  setShowMusicSearch(false);
                  setSongSearchQuery('');
                  setSongSearchResults([]);
                  setShowMoodDialog(false);
                }}
                sx={{
                  borderRadius: '16px',
                  height: 48,
                  color: '#718096',
                  borderColor: '#f1e5eb',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.92rem',
                  '&:hover': {
                    borderColor: 'rgba(229, 46, 113, 0.3)',
                    bgcolor: '#fff0f5',
                    color: '#e52e71'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleShareMood}
                disabled={!selectedMood && !moodText.trim() && !selectedSong}
                sx={{
                  borderRadius: '16px',
                  height: 48,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #ff5c8d 0%, #e52e71 100%)',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.92rem',
                  boxShadow: '0 6px 20px rgba(229, 46, 113, 0.3)',
                  '&:hover': {
                    background: '#d02061',
                    boxShadow: '0 8px 24px rgba(229, 46, 113, 0.4)'
                  },
                  '&.Mui-disabled': {
                    background: '#f1e5eb',
                    color: '#a0aec0',
                    boxShadow: 'none'
                  }
                }}
              >
                Share
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Floating song confirmation notification with 3D glass look */}
      <Snackbar
        open={songSnackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSongSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      >
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(23, 32, 51, 0.92)',
            color: '#ffffff',
            borderRadius: '24px',
            px: 2.5,
            py: 1.2,
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff5c8d, #e52e71)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MusicNoteIcon sx={{ color: '#fff', fontSize: 16 }} />
          </Box>
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 650 }}>
            {songConfirmationMessage}
          </Typography>
        </Paper>
      </Snackbar>

      {/* 3D Delete Note Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setMoodToDeleteId(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1,
            width: '340px',
            maxWidth: '90vw',
            bgcolor: '#ffffff',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(23, 32, 51, 0.45)', backdropFilter: 'blur(4px)' } }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)'
          }}>
            <DeleteIcon sx={{ fontSize: 28 }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 750, color: '#172033', mb: 1, fontSize: '1.15rem' }}>
            Delete note?
          </Typography>

          <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.88rem', lineHeight: 1.4, mb: 3 }}>
            This note will be permanently removed for you and your friends.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setMoodToDeleteId(null);
              }}
              sx={{
                borderRadius: '16px',
                py: 1.1,
                textTransform: 'none',
                fontWeight: 650,
                color: '#718096',
                borderColor: '#f1e5eb',
                '&:hover': {
                  borderColor: 'rgba(0,0,0,0.25)',
                  bgcolor: 'rgba(0,0,0,0.03)'
                }
              }}
            >
              Cancel
            </Button>

            <Button
              fullWidth
              variant="contained"
              onClick={confirmDelete}
              sx={{
                borderRadius: '16px',
                py: 1.1,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#ef4444',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                '&:hover': {
                  bgcolor: '#dc2626',
                  boxShadow: '0 6px 18px rgba(239, 68, 68, 0.4)'
                }
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* 3D Likers List Dialog */}
      <Dialog
        open={showLikersDialog}
        onClose={() => setShowLikersDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            width: '320px',
            maxWidth: '90vw',
            bgcolor: '#ffffff',
            border: '1px solid rgba(229, 46, 113, 0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(23, 32, 51, 0.45)', backdropFilter: 'blur(4px)' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 1, borderBottom: '1px solid #f1e5eb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FavoriteIcon sx={{ color: '#e52e71', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 750, fontSize: '1rem', color: '#172033' }}>
              Liked by ({viewingMood?.likes?.length || 0})
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowLikersDialog(false)} sx={{ color: '#718096' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ maxHeight: 300, overflowY: 'auto', py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {(viewingMood?.likes || []).map((liker, idx) => (
            <Box key={liker.userId || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.5, borderRadius: '12px', transition: 'background 0.15s ease', '&:hover': { bgcolor: '#fff0f5' } }}>
              <Avatar src={getProfileSrc(liker)} sx={{ width: 40, height: 40, border: '2px solid #ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }} />
              <Typography sx={{ fontWeight: 650, fontSize: '0.92rem', color: '#172033' }}>
                {liker.username}
              </Typography>
            </Box>
          ))}
        </Box>
      </Dialog>
    </>
  );
};

export default Yourmood;
