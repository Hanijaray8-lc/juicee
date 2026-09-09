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
  if (u.profileImage) {
    try {
      return u.profileImage.startsWith('data:') ? u.profileImage : `data:image/jpeg;base64,${u.profileImage}`;
    } catch (e) {
      return u.profileImage;
    }
  }
  // --- Local cache fallback: use the cached image written by UserProfile.js ---
  // Only apply for the current logged-in user (matched by userId stored in localStorage)
  const currentUserId = localStorage.getItem('userId');
  const uId = u._id || u.id;
  if (currentUserId && uId && String(currentUserId) === String(uId)) {
    const cached = localStorage.getItem('profileImageCache');
    if (cached) return cached.startsWith('data:') ? cached : `data:image/jpeg;base64,${cached}`;
  }
  return u.profilePic || u.image || '';
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
  const [moods, setMoods] = useState([]);
  const updateMoodsAndCache = React.useCallback((newMoodsOrUpdater) => {
    setMoods(prev => {
      const updated = typeof newMoodsOrUpdater === 'function' ? newMoodsOrUpdater(prev) : newMoodsOrUpdater;
      const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
      if (currentUserId) {
        try {
          localStorage.setItem(`cached_moods_${currentUserId}`, JSON.stringify(updated));
        } catch (e) { }
      }
      return updated;
    });
  }, [user?._id, user?.id]);
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

    try {
      console.log('Instant-Deleting mood locally:', { id, userId: currentUserId });
      const targetIdStr = String(id);

      if (targetIdStr.startsWith('temp-')) {
        pendingTempDeletesRef.current.add(targetIdStr);
      }

      // 1. Instantly update UI and local cache (Optimistic update)
      updateMoodsAndCache(prev => prev.filter(m => {
        const mid = String(m._id || m.id || '');
        if (mid === targetIdStr) return false;
        if (targetIdStr.startsWith('temp-') && mid.startsWith('temp-')) return false;
        return true;
      }));

      // 2. Instantly close view dialog and stop any active audio playback
      setViewingMood(null);
      setPlayingSongUrl(null);

      // 3. Instantly emit delete event to friends via sockets
      if (socket) {
        socket.emit('delete_mood', { id });
      }

      // 4. Perform database deletion if it's a real server ID
      if (!targetIdStr.startsWith('temp-')) {
        await fetch(`${API_BASE_URL}/api/auth/moods/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: currentUserId })
        }).catch((err) => {
          console.error('Backend deletion fetch error:', err);
        });
      }

      // 5. Reload the page after deleting the mood
      window.location.reload();

    } catch (error) {
      console.error('Error in instant-deleting mood:', error);
    }
  };

  const confirmDelete = async () => {
    if (moodToDeleteId) {
      const targetId = typeof moodToDeleteId === 'object' ? (moodToDeleteId.id || moodToDeleteId._id) : moodToDeleteId;
      await handleDeleteMood(targetId);
      setDeleteConfirmOpen(false);
      setMoodToDeleteId(null);
      setSongConfirmationMessage('Note deleted 🗑️');
      setSongSnackbarOpen(true);
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
    const optimisticMood = {
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`,
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
        if (response.status === 429) {
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

      updateMoodsAndCache(prev => prev.map(m => (m.id === optimisticMood.id || m._id === optimisticMood._id ? realMood : m)));
      setViewingMood(prev => (prev && (prev.id === optimisticMood.id || prev._id === optimisticMood._id) ? realMood : prev));
      console.log('Mood saved to backend:', realMood._id || realMood.id);

      // 5. Reload the page after sharing mood
      window.location.reload();

    } catch (err) {
      console.error('Mood share network error:', err);
      window.location.reload();
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

  // Load moods effect with instant local cache
  useEffect(() => {
    if (!user?._id) return;

    const cacheKey = `cached_moods_${user._id}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        setMoods(JSON.parse(cachedData));
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
        updateMoodsAndCache(data);
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
      const valid = list.filter(m => (Date.now() - new Date(m.timestamp).getTime()) < 24 * 60 * 60 * 1000);
      updateMoodsAndCache(valid);
      console.log('initial moods received', valid.length);
    });

    socket.on('receive_mood', (mood) => {
      updateMoodsAndCache(prev => {
        if (prev.some(m => m.id === mood.id)) return prev;
        return [mood, ...prev];
      });
      console.log('receive_mood', mood.id);
    });

    socket.on('delete_mood', ({ id }) => {
      updateMoodsAndCache(prev => prev.filter(m => {
        const mid = m.id || m._id;
        return String(mid) !== String(id);
      }));
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
      socket.off('delete_mood');
      socket.off('receive_mood_like');
    };
  }, [socket, user?._id, updateMoodsAndCache]);

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
        width: !isMobile ? 74 : { xs: 80, sm: 92 },
        bgcolor: '#ffffff',
        borderRadius: '16px',
        py: '5px',
        px: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}>
        {/* Curved thought bubble tail circles */}
        <Box sx={{
          position: 'absolute',
          bottom: -4,
          left: '42%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: '0 1.5px 3px rgba(0,0,0,0.02)'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -9,
          left: '32%',
          width: 3.5,
          height: 3.5,
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: '0 1.5px 3px rgba(0,0,0,0.02)'
        }} />

        {songData && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', justifyContent: 'center', mb: displayText ? '3px' : 0 }}>
            {/* Equalizer Playing Animation in brand color pink */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: 10, width: 8, flexShrink: 0 }}>
              <Box sx={{ width: 1.5, bgcolor: '#ff4d86', borderRadius: '0.3px', animation: 'eqBar1 0.6s ease-in-out infinite alternate' }} />
              <Box sx={{ width: 1.5, bgcolor: '#ff4d86', borderRadius: '0.3px', animation: 'eqBar2 0.4s ease-in-out infinite alternate' }} />
              <Box sx={{ width: 1.5, bgcolor: '#ff4d86', borderRadius: '0.3px', animation: 'eqBar3 0.7s ease-in-out infinite alternate' }} />
            </Box>
            <Typography sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#ff4d86',
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
              fontSize: '1.25rem',
              textAlign: 'center',
              lineHeight: 1.1
            }}>
              {displayText}
            </Typography>
          ) : (
            <Typography sx={{
              fontSize: '0.65rem',
              color: '#262626',
              fontWeight: 400,
              textAlign: 'center',
              lineHeight: 1.15,
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

        {/* Liked Heart Indicator Badge on Note Bubble */}
        {mood.likes && mood.likes.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              bgcolor: '#ffffff',
              borderRadius: '50%',
              width: 17,
              height: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(255, 77, 134, 0.35)',
              zIndex: 12,
              border: '1.5px solid #ffffff'
            }}
          >
            <FavoriteIcon sx={{ color: '#ff4d86', fontSize: 11 }} />
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
        gap: !isMobile ? 2 : { xs: 2.5, sm: 4.5 },
        pt: !isMobile ? (hasAnyActiveNotes ? '35px' : '10px') : (hasAnyActiveNotes ? { xs: '38px', sm: '44px' } : { xs: '8px', sm: '8px' }),
        pb: { xs: 0.5, sm: 0.5 },
        alignItems: 'center',
        overflowX: 'auto',
        px: { xs: 1, sm: 1.5 },
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        transition: 'padding-top 0.2s ease-in-out'
      }}>
        {/* Unified "Your note" item */}
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
            minWidth: !isMobile ? 58 : { xs: 58, sm: 72 },
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={getProfileSrc(user)}
              sx={{
                width: !isMobile ? 52 : { xs: 52, sm: 68 },
                height: !isMobile ? 52 : { xs: 52, sm: 68 },
                border: '1.5px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
              }}
            />

            {/* Overlap badge if inactive */}
            {!ownActiveMood && (
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                bgcolor: '#262626',
                borderRadius: '50%',
                border: '2.5px solid var(--surface-color, #fff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
              }}>
                <AddIcon sx={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }} />
              </Box>
            )}

            {/* Bubble above avatar if active */}
            {ownActiveMood && renderNoteBubble(ownActiveMood)}
          </Box>
          <Typography variant="caption" sx={{ mt: 0.8, color: 'var(--text-color, #262626)', fontWeight: 500, fontSize: '0.75rem', textAlign: 'center' }}>
            Your note
          </Typography>
        </Box>

        {/* Display friends' moods */}
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
                  minWidth: !isMobile ? 58 : { xs: 58, sm: 72 },
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={mood.profilePic}
                    sx={{
                      width: !isMobile ? 52 : { xs: 52, sm: 68 },
                      height: !isMobile ? 52 : { xs: 52, sm: 68 },
                      border: '1.5px solid rgba(0,0,0,0.06)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                    }}
                  />
                  {/* Speech Bubble above avatar */}
                  {renderNoteBubble(mood)}

                  {/* Online dot badge */}
                  {isFriendOnline && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 15,
                      height: 15,
                      bgcolor: '#31a24c',
                      borderRadius: '50%',
                      border: '2.5px solid var(--surface-color, #fff)',
                      zIndex: 3,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                    }} />
                  )}
                </Box>
                <Typography variant="caption" sx={{
                  mt: 0.5,
                  color: 'var(--text-color, #262626)',
                  fontWeight: 500,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  maxWidth: { xs: 58, sm: 72 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}>
                  {mood.username}
                </Typography>
              </Box>
            );
          })}
      </Box>

      {/* Mood viewing dialog (Instagram-style bottom sheet) */}
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
            borderRadius: '20px 20px 0 0',
            width: '100%',
            height: { xs: '82vh', sm: '75vh', md: '60vh' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'var(--surface-color, background.paper)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            transform: viewingDrag.dragY > 0 ? `translateY(${viewingDrag.dragY}px)` : 'none',
            transition: viewingDrag.isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            touchAction: 'pan-y'
          } : {
            borderRadius: '24px',
            width: '480px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'var(--surface-color, background.paper)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          },
          ...viewingDrag.touchHandlers
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.35)' } }}
      >
        {viewingMood && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }}>
            {/* Fancy Header with Gradient */}
            <Box
              sx={{
                px: 2.5,
                pt: isMobile ? 1 : 2,
                pb: isMobile ? 1 : 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isMobile ? 0.5 : 0,
                flexShrink: 0,
                background: 'linear-gradient(90deg, var(--primary-color, #ff7aa3), var(--primary-color, #ff4d86))',
                color: '#fff'
              }}
            >
              {isMobile && (
                <Box
                  sx={{
                    width: 42,
                    height: 5,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255,255,255,0.6)',
                    mb: 0.5
                  }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar
                  src={getProfileSrc(viewingMood.user)}
                  sx={{
                    width: 44,
                    height: 44,
                    border: '2px solid rgba(255,255,255,0.8)'
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 700, color: 'white' }}>
                      {viewingMood.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: -0.2 }}>
                            <MusicNoteIcon sx={{ fontSize: 12, color: 'white' }} />
                            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', flex: 1 }}>
                              <Typography variant="caption" sx={{
                                color: 'white',
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
                      sx={{ color: 'white' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <IconButton
                    key="close-mood-btn"
                    onClick={() => {
                      setViewingMood(null);
                      setPlayingSongUrl(null);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Box
              ref={viewingDrag.scrollContainerRef}
              sx={{
                px: 3, pt: 3, pb: isMobile ? 12 : 4, overflowY: 'auto', flex: 1, bgcolor: 'var(--background-color, #fafafa)'
              }}
            >
              {/* Text Content First - Instagram Style */}
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
                      <Box sx={{ mb: 4, position: 'relative' }}>
                        <Paper sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: 'var(--surface-color, #fff)',
                          width: '100%',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                        }}>
                          <Typography
                            sx={{
                              whiteSpace: 'pre-wrap',
                              fontSize: '1.1rem',
                              lineHeight: 1.6,
                              fontWeight: 500,
                              color: 'var(--text-color, #000)'
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

              {/* Large Centered Emoji with Animation */}
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
                  bgcolor: 'var(--surface-color, #fff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 84,
                  boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
                  animation: 'pulseEmoji 2s infinite ease-in-out',
                  '@keyframes pulseEmoji': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
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
                {/* Heart Like Button */}
                {(() => {
                  const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
                  const likes = viewingMood.likes || [];
                  const isLikedByMe = likes.some(l => String(l.userId) === String(currentUserId));

                  return (
                    <IconButton
                      onClick={() => handleToggleLike(viewingMood)}
                      sx={{
                        position: 'absolute',
                        left: !isOwnMood(viewingMood) ? -8 : 'calc(50% - 22px)',
                        bottom: -8,
                        bgcolor: 'var(--surface-color, #fff)',
                        boxShadow: isLikedByMe
                          ? '0 3px 14px rgba(255, 77, 134, 0.4)'
                          : '0 2px 10px rgba(0,0,0,0.12)',
                        transform: 'scale(1.2)',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '&:hover': {
                          bgcolor: 'var(--background-color, #fff0f4)',
                          transform: 'scale(1.35)'
                        }
                      }}
                    >
                      {isLikedByMe ? (
                        <FavoriteIcon sx={{ color: '#ff4d86', fontSize: 20, animation: 'heartPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ color: 'var(--primary-color, #ff4d86)', fontSize: 20 }} />
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
                      bgcolor: 'var(--surface-color, #fff)',
                      boxShadow: '0 2px 12px rgba(255,77,134,0.2)',
                      transform: 'scale(1.2)',
                      '&:hover': {
                        bgcolor: 'var(--background-color, #fff0f4)',
                        transform: 'scale(1.3)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                  >
                    <ReplyIcon sx={{ color: 'var(--primary-color, #ff4d86)' }} />
                  </IconButton>
                )}
              </Box>

              {/* Instagram-style Likers View */}
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                {viewingMood.likes && viewingMood.likes.length > 0 ? (
                  <Box
                    onClick={() => setShowLikersDialog(true)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(255, 77, 134, 0.08)',
                      border: '1px solid rgba(255, 77, 134, 0.25)',
                      borderRadius: '20px',
                      py: 0.6,
                      px: 1.8,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(255,77,134,0.1)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 77, 134, 0.16)',
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
                            width: 22,
                            height: 22,
                            border: '2px solid #fff',
                            ml: i > 0 ? -1 : 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        />
                      ))}
                    </Box>

                    <FavoriteIcon sx={{ color: '#ff4d86', fontSize: 16 }} />

                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color, #222)' }}>
                      {(() => {
                        const likers = viewingMood.likes;
                        const currentUserId = user?._id || user?.id || localStorage.getItem('userId');
                        const hasLiked = likers.some(l => String(l.userId) === String(currentUserId));
                        const otherCount = likers.length - 1;

                        if (likers.length === 1) {
                          return hasLiked ? 'Liked by you' : `Liked by ${likers[0].username}`;
                        }
                        if (hasLiked) {
                          return `Liked by you and ${otherCount} other${otherCount > 1 ? 's' : ''}`;
                        }
                        return `Liked by ${likers[0].username} and ${otherCount} other${otherCount > 1 ? 's' : ''}`;
                      })()}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    onClick={() => handleToggleLike(viewingMood)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      py: 0.5,
                      px: 1.5,
                      borderRadius: '16px',
                      bgcolor: 'rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'rgba(255,77,134,0.08)' }
                    }}
                  >
                    <FavoriteBorderIcon sx={{ color: '#ff4d86', fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: 'var(--text-color, #666)', fontWeight: 500 }}>
                      Tap to like this mood
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Stats/Info Row */}
              <Box sx={{
                mt: 4,
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                color: 'var(--text-color, #666)'
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography variant="caption">Posted</Typography>
                  <Typography sx={{ fontWeight: 600, color: 'var(--text-color, #000)' }}>
                    {new Date(viewingMood.timestamp).toLocaleTimeString([], {
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
                  <Typography sx={{ fontWeight: 600, color: 'var(--text-color, #000)', fontSize: '1rem' }}>{getMoodCountdown(viewingMood.timestamp)}</Typography>
                  <Typography sx={{ fontWeight: 600, color: 'var(--text-color, #000)', fontSize: '2.5rem', mt: 1 }}>{viewingMood.emoji}</Typography>
                </Box>
              </Box>

              {/* Scrollable Liked Users Section (Marked Area) */}
              <Box
                sx={{
                  mt: 3,
                  mx: 'auto',
                  width: '100%',
                  maxWidth: 360,
                  bgcolor: 'var(--surface-color, #ffffff)',
                  borderRadius: '18px',
                  p: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(255, 77, 134, 0.18)',
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
                    <FavoriteIcon sx={{ color: '#ff4d86', fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color, #111)' }}>
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
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,77,134,0.3)', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#ff4d86' }
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
                            borderRadius: '12px',
                            bgcolor: isMe ? 'rgba(255, 77, 134, 0.06)' : 'rgba(0, 0, 0, 0.02)',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: 'rgba(255, 77, 134, 0.12)',
                              transform: 'translateX(2px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={getProfileSrc(liker)}
                              sx={{ width: 34, height: 34, border: '1.5px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                            />
                            <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-color, #222)' }}>
                              {liker.username || 'User'}
                            </Typography>
                          </Box>
                          {isMe && (
                            <Typography variant="caption" sx={{ color: '#ff4d86', fontWeight: 700, px: 1, py: 0.2, bgcolor: 'rgba(255,77,134,0.1)', borderRadius: '8px' }}>
                              You
                            </Typography>
                          )}
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-color, #888)', fontStyle: 'italic' }}>
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

      {/* Bottom-sheet mood dialog - Instagram style */}
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
            borderRadius: '20px 20px 0 0',
            width: '100%',
            height: { xs: '82vh', sm: '75vh', md: '60vh' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'var(--surface-color, background.paper)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            transform: moodDialogDrag.dragY > 0 ? `translateY(${moodDialogDrag.dragY}px)` : 'none',
            transition: moodDialogDrag.isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            touchAction: 'pan-y'
          } : {
            borderRadius: '24px',
            width: '480px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'var(--surface-color, background.paper)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          },
          ...moodDialogDrag.touchHandlers
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.35)' } }}
      >
        {musicEditorSong ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#121212', color: '#fff' }}>
            <Box sx={{ px: 2, pt: isMobile ? 1 : 2.5, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isMobile && <Box sx={{ width: 42, height: 5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.3)', mb: 2 }} />}
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography onClick={() => { setMusicEditorSong(null); setIsAudioPlaying(true); setClipDuration(15); setShowDurationPicker(false); }} sx={{ cursor: 'pointer', fontSize: 16 }}>Cancel</Typography>
                <Typography onClick={() => {
                  const finalSong = { ...musicEditorSong, duration: clipDuration };
                  setSelectedSong(finalSong);
                  setMusicEditorSong(null);
                  setIsAudioPlaying(true);
                  setSongConfirmationMessage(`"${finalSong.trackName}" added to note ✨`);
                  setSongSnackbarOpen(true);
                }} sx={{ cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>Done</Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Avatar src={musicEditorSong.artworkUrl100} variant="rounded" sx={{ width: 80, height: 80, mb: 3, border: '1px solid rgba(255,255,255,0.2)' }} />
              <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 0.5 }}>{musicEditorSong.trackName}</Typography>
              <Typography sx={{ color: '#aaa', fontSize: 14, mb: 6 }}>{musicEditorSong.artistName}</Typography>

              <Box sx={{ width: '100%', mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Clickable Clip Duration Selector */}
                <Box
                  onClick={() => setShowDurationPicker(prev => !prev)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fff',
                    cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    position: 'relative',
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
                      borderRadius: '8px',
                      py: 0.5,
                      width: 60,
                      zIndex: 20,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
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
                            // Adjust start time if duration pushes it past the 30s boundary
                            if ((musicEditorSong.startTime || 0) + sec > 30) {
                              setMusicEditorSong(prev => ({ ...prev, startTime: Math.max(0, 30 - sec) }));
                            }
                          }}
                          sx={{
                            py: 0.75,
                            textAlign: 'center',
                            color: clipDuration === sec ? '#ff4d86' : '#fff',
                            fontSize: 12,
                            fontWeight: clipDuration === sec ? 700 : 500,
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

                {/* Progress bar */}
                <Box sx={{ flex: 1, height: 4, bgcolor: 'rgba(255,255,255,0.2)', position: 'relative', borderRadius: 1 }}>
                  {/* Selected crop segment (white) */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${(musicEditorSong.startTime || 0) / 30 * 100}%`,
                    width: `${clipDuration / 30 * 100}%`,
                    height: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 1
                  }} />

                  {/* Current playback trace (pink fill up to current time) */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${(musicEditorSong.startTime || 0) / 30 * 100}%`,
                    width: `${Math.max(0, Math.min(clipDuration, currentPlayTime - (musicEditorSong.startTime || 0))) / 30 * 100}%`,
                    height: '100%',
                    bgcolor: '#ff4d86',
                    borderRadius: 1
                  }} />

                  {/* Playback trace thumb/dot */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${(currentPlayTime || 0) / 30 * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#fff',
                    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                    pointerEvents: 'none'
                  }} />
                </Box>

                {/* Play/Stop Audio Button */}
                <Box
                  onClick={() => setIsAudioPlaying(prev => !prev)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': { transform: 'scale(1.05)' },
                    transition: 'all 0.1s ease'
                  }}
                >
                  {isAudioPlaying ? (
                    // Stop Square Icon
                    <Box sx={{ width: 10, height: 10, bgcolor: '#000', borderRadius: 0.5 }} />
                  ) : (
                    // Play Triangle Icon
                    <Box sx={{
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: '9px solid #000',
                      ml: '2px'
                    }} />
                  )}
                </Box>
              </Box>

              <Box sx={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
                {/* Left Arrow Button (Desktop only) */}
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
                      width: 28,
                      height: 28,
                    }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}

                <Box sx={{ position: 'relative', width: '100%', height: 64, overflow: 'hidden' }}>
                  <Box sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 140,
                    height: 64,
                    border: '3px solid white',
                    borderLeft: '6px solid #ff4d86',
                    borderRadius: '8px',
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
                    <Box sx={{ minWidth: 'calc(50% - 70px)' }} />
                    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {Array.from({ length: 60 }).map((_, i) => (
                        <Box key={i} sx={{ width: 3, height: [12, 24, 36, 48, 20, 30, 40, 15, 25, 45][i % 10] * 1.2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }} />
                      ))}
                    </Box>
                    <Box sx={{ minWidth: 'calc(50% - 70px)' }} />
                  </Box>
                </Box>

                {/* Right Arrow Button (Desktop only) */}
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
                      width: 28,
                      height: 28,
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
            <Box sx={{
              px: 2, pt: isMobile ? 1 : 2.5, pb: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'linear-gradient(90deg, var(--primary-color, #ff7aa3), var(--primary-color, #ff4d86))',
              color: '#fff',
              flexShrink: 0
            }}>
              {isMobile && (
                <Box sx={{
                  width: 42, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.6)', mb: 1
                }} />
              )}
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Share your feelings</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.5 }}>Post a mood — lasts 24 hours</Typography>
            </Box>

            <Box
              ref={moodDialogDrag.scrollContainerRef}
              sx={{
                px: 2, pt: 2, pb: 2, flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'var(--background-color, #fafafa)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={getProfileSrc(user)} sx={{ width: 52, height: 52 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '50%', bgcolor: 'var(--surface-color, #fff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid rgba(255,255,255,0.6)', fontSize: 22
                    }}>
                      {selectedMood?.emoji || '🙂'}
                    </Box>
                    <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                      <Box sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        position: 'relative',
                        lineHeight: '1.1'
                      }}>
                        <Box sx={{
                          display: 'inline-block',
                          px: 0.5,
                          animation: moodText ? 'moodMarquee 8s linear infinite' : 'none'
                        }}>
                          <Typography sx={{
                            fontWeight: 600, fontSize: 14, color: 'var(--text-color, #222)'
                          }}>{user?.username || 'You'}</Typography>
                          <Typography variant="body2" sx={{ color: 'var(--text-color, #555)' }}>
                            {moodText || (selectedMood ? selectedMood.name : 'No note')}
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

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(5, 1fr)', sm: 'repeat(6, 1fr)', md: 'repeat(8, 1fr)' },
                gap: 1.25,
                mb: 2
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
                        height: isMobile ? 48 : 58,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        fontSize: isMobile ? 20 : 22,
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'var(--background-color, #fff0f4)' : 'var(--surface-color, #fff)',
                        border: isSelected ? '2px solid var(--primary-color, #ff4d86)' : '1px solid var(--background-color, #f0e6e8)',
                        boxShadow: isSelected ? '0 6px 18px rgba(255,77,134,0.12)' : 'none',
                        '&:hover': {
                          bgcolor: isSelected ? 'var(--background-color, #fff0f4)' : 'var(--background-color, #f5f5f5)',
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      {m.emoji}
                    </Box>
                  );
                })}
              </Box>

              <TextField
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                placeholder="Write something... (optional)"
                fullWidth
                multiline
                minRows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'var(--background-color, #fbfbfb)',
                    borderRadius: 2,
                    color: 'var(--text-color, #000)',
                    '& fieldset': {
                      borderColor: 'var(--primary-color, #ff4d86)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--primary-color, #ff4d86)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary-color, #ff4d86)',
                    },
                  },
                  mb: 2
                }}
              />

              {/* MUSIC SECTION */}
              <Box sx={{ mb: 2 }}>
                {selectedSong ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(255, 77, 134, 0.1) 0%, rgba(255, 122, 163, 0.05) 100%)',
                      border: '1.5px solid rgba(255, 77, 134, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(255, 77, 134, 0.12)'
                    }}
                  >
                    {/* Album Artwork & Music Icon Badge */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Avatar
                        src={selectedSong.artworkUrl100}
                        variant="rounded"
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: '12px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                          border: '1px solid rgba(255, 255, 255, 0.8)'
                        }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        bottom: -3,
                        right: -3,
                        bgcolor: '#ff4d86',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                      }}>
                        <MusicNoteIcon sx={{ color: '#fff', fontSize: 11 }} />
                      </Box>
                    </Box>

                    {/* Track Info & Duration Pill */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-color, #111)' }}>
                          {selectedSong.trackName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: 'rgba(255, 77, 134, 0.15)',
                            color: '#ff4d86',
                            fontWeight: 700,
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '10px',
                            fontSize: '0.65rem'
                          }}
                        >
                          {selectedSong.duration || 15}s
                        </Typography>
                      </Box>

                      <Typography noWrap sx={{ fontSize: '0.78rem', color: 'var(--text-color, #666)', mt: 0.2 }}>
                        {selectedSong.artistName}
                      </Typography>

                      {/* Equalizer Playing Animation Indicator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: 9, width: 8 }}>
                          <Box sx={{ width: 1.5, bgcolor: '#ff4d86', borderRadius: '0.5px', animation: 'eqBar1 0.6s ease-in-out infinite alternate' }} />
                          <Box sx={{ width: 1.5, bgcolor: '#ff4d86', borderRadius: '0.5px', animation: 'eqBar2 0.4s ease-in-out infinite alternate' }} />
                          <Box sx={{ width: 1.5, bgcolor: '#ff4d86', borderRadius: '0.5px', animation: 'eqBar3 0.7s ease-in-out infinite alternate' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#ff4d86', fontWeight: 600, fontSize: '0.7rem' }}>
                          Music attached
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => setMusicEditorSong({ ...selectedSong })}
                        title="Edit clip duration"
                        sx={{
                          bgcolor: 'rgba(255, 77, 134, 0.1)',
                          color: '#ff4d86',
                          p: 0.8,
                          '&:hover': { bgcolor: 'rgba(255, 77, 134, 0.2)' }
                        }}
                      >
                        <MusicNoteIcon sx={{ fontSize: 16 }} />
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
                          color: 'var(--text-color, #666)',
                          p: 0.8,
                          '&:hover': { bgcolor: 'rgba(255, 77, 134, 0.15)', color: '#ff4d86' }
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Paper>
                ) : (
                  <Box>
                    {showMusicSearch ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Search for a song..."
                          value={songSearchQuery}
                          onChange={(e) => handleSearchSong(e.target.value)}
                          autoFocus
                          InputProps={{
                            startAdornment: <MusicNoteIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
                            endAdornment: isSearchingSong ? <Typography variant="caption">...</Typography> : null
                          }}
                        />
                        {((songSearchResults.length > 0) || (!songSearchQuery.trim())) && (
                          <Box sx={{ maxHeight: 150, overflowY: 'auto', border: '1px solid rgba(128, 128, 128, 0.2)', borderRadius: 1, bgcolor: 'var(--surface-color, #ffffff)' }}>
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
                                  cursor: 'pointer', '&:hover': { bgcolor: 'rgba(128, 128, 128, 0.1)' }
                                }}
                              >
                                <Avatar src={song.artworkUrl100} variant="rounded" sx={{ width: 32, height: 32 }} />
                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: 'var(--text-color, #000)' }}>{song.trackName}</Typography>
                                  <Typography noWrap sx={{ fontSize: 11, color: 'var(--text-color, #666)', opacity: 0.8 }}>{song.artistName}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Button
                        variant="text"
                        startIcon={<MusicNoteIcon />}
                        onClick={() => setShowMusicSearch(true)}
                        sx={{ textTransform: 'none', color: 'var(--primary-color, #ff4d86)', fontWeight: 600 }}
                      >
                        Add Music
                      </Button>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-color, #777)', fontSize: 13 }}>
                <Typography sx={{ color: 'var(--text-color, #777)' }}>Visible to friends</Typography>
                <Typography sx={{ color: 'var(--text-color, #777)' }}>{selectedMood ? selectedMood.name : 'No emoji selected'}</Typography>
              </Box>
            </Box>

            <Box sx={{
              display: 'flex',
              gap: 2,
              p: 2,
              pb: isMobile ? 'calc(env(safe-area-inset-bottom) + 8px)' : 2,
              borderTop: '1px solid rgba(128, 128, 128, 0.15)',
              bgcolor: 'var(--surface-color, #ffffff)',
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
                  borderRadius: 10,
                  height: 48,
                  color: 'var(--text-color, #000)',
                  borderColor: 'var(--text-color, #000)',
                  '&:hover': {
                    borderColor: 'var(--primary-color, #ff4d86)',
                    bgcolor: 'rgba(255, 77, 134, 0.08)'
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
                  borderRadius: 10,
                  height: 48,
                  color: '#ffffff',
                  bgcolor: 'var(--primary-color, #ff4d86)',
                  '&:hover': {
                    bgcolor: 'var(--primary-color, #ff3373)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(128, 128, 128, 0.2)',
                    color: 'rgba(128, 128, 128, 0.5)'
                  }
                }}
              >
                Share
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Instagram-style floating song confirmation notification */}
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
            bgcolor: '#1c1c1e',
            color: '#ffffff',
            borderRadius: '24px',
            px: 2.5,
            py: 1.2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff7aa3, #ff4d86)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MusicNoteIcon sx={{ color: '#fff', fontSize: 16 }} />
          </Box>
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
            {songConfirmationMessage}
          </Typography>
        </Paper>
      </Snackbar>

      {/* Delete Note Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setMoodToDeleteId(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            width: '340px',
            maxWidth: '90vw',
            bgcolor: 'var(--surface-color, #ffffff)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' } }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 59, 48, 0.1)',
            color: '#ff3b30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}>
            <DeleteIcon sx={{ fontSize: 28 }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-color, #111)', mb: 1, fontSize: '1.15rem' }}>
            Delete note?
          </Typography>

          <Typography variant="body2" sx={{ color: 'var(--text-color, #666)', fontSize: '0.88rem', lineHeight: 1.4, mb: 3 }}>
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
                borderRadius: '12px',
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                color: 'var(--text-color, #333)',
                borderColor: 'rgba(0,0,0,0.15)',
                '&:hover': {
                  borderColor: 'rgba(0,0,0,0.3)',
                  bgcolor: 'rgba(0,0,0,0.04)'
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
                borderRadius: '12px',
                py: 1,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#ff3b30',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(255, 59, 48, 0.3)',
                '&:hover': {
                  bgcolor: '#e03126',
                  boxShadow: '0 6px 18px rgba(255, 59, 48, 0.4)'
                }
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Likers List Dialog (Instagram-style) */}
      <Dialog
        open={showLikersDialog}
        onClose={() => setShowLikersDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            width: '320px',
            maxWidth: '90vw',
            bgcolor: 'var(--surface-color, #ffffff)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.2)'
          }
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FavoriteIcon sx={{ color: '#ff4d86', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-color, #111)' }}>
              Liked by ({viewingMood?.likes?.length || 0})
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowLikersDialog(false)}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ maxHeight: 300, overflowY: 'auto', py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(viewingMood?.likes || []).map((liker, idx) => (
            <Box key={liker.userId || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
              <Avatar src={getProfileSrc(liker)} sx={{ width: 40, height: 40, border: '1px solid rgba(0,0,0,0.1)' }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-color, #111)' }}>
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
