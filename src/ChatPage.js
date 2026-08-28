
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from './context/socketContext';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, List,
  ListItem, ListItemButton, ListItemAvatar, ListItemText, Box, Paper, useMediaQuery,
  Button, BottomNavigation, BottomNavigationAction, Tooltip, TextField,
  InputAdornment, Dialog, Card, Badge, Snackbar, Grid, Slider, Menu, MenuItem,
  DialogTitle, DialogContent, DialogActions, Divider,
  Slide, Fab, Checkbox, CircularProgress, SvgIcon
} from '@mui/material';
import ContactSyncDialog from './components/ContactSyncDialog';
import Scanner from './Scanner';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  Search as SearchIcon, ArrowBack as ArrowBackIcon, Settings as SettingsIcon,
  Phone as PhoneIcon, Chat as ChatIcon, AccountCircle as AccountCircleIcon, Info as InfoIcon,
  Videocam as VideocamIcon, PhoneInTalk as PhoneInTalkIcon, VideoCall as VideoCallIcon,
  Mic as MicIcon, Send as SendIcon, Add as AddIcon, FormatUnderlined as FormatUnderlinedIcon,
  Image as ImageIcon, Description as DocumentIcon, Contacts as ContactIcon,
  Notifications as NotificationsIcon, VolumeUp as VolumeUpIcon, FormatItalic as FormatItalicIcon,
  PauseCircleFilled as PauseCircleFilledIcon, MicOff as MicOffIcon, FormatBold as FormatBoldIcon,
  Close as CloseIcon, Save as SaveIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon, Pause as PauseIcon, CameraAlt as CameraAltIcon, Undo as UndoIcon, Flip as FlipIcon,
  Redo as RedoIcon, Crop as CropIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, RotateLeft as RotateLeftIcon, RotateRight as RotateRightIcon,
  Groups as GroupsIcon, MusicNote as MusicNoteIcon, PictureInPicture as PictureInPictureIcon,
  AccessTime as AccessTimeIcon, Message as MessageIcon,
  ArrowDownward as ArrowDownwardIcon, Cancel as CancelIcon, Lock as LockIcon,
} from '@mui/icons-material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CheckIcon from '@mui/icons-material/Check';
import Chip from '@mui/material/Chip';
import GestureIcon from '@mui/icons-material/Gesture';
import { normalizeGesture, matchGestures } from './finder';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import LayersIcon from '@mui/icons-material/Layers';
import NearMeIcon from '@mui/icons-material/NearMe';
import OpacityIcon from '@mui/icons-material/Opacity';
import TransformIcon from '@mui/icons-material/Transform';
import toast from 'react-hot-toast';
import StickerDialog from './Sticker';
import Drawing from './Drawing';
import Yourmood from './Yourmood';
import PenTypingIndicator from './Type';
import { generateUniqueId, generateUniqueNumericId } from './utils/uniqueIdGenerator';
import { usePushNotifications } from './notify';
import { useMessageAnimations, HeartKeyframes, FloatingHearts, CelebrationCanvas } from './MessgeFormat';
import ShareFriendsDialog from './ShareFriends';
import ChatList from './ChatList';
import { UserGuideModal, USER_GUIDE_STORAGE_KEY } from './UserGuideModal';
import { Keyboard } from '@capacitor/keyboard';
import { App as CapacitorApp } from '@capacitor/app';
import './ChatPage.css';
import Call from './call';
import { useInitializeCalls } from './initializeCalls';
import useNetworkStatus from './hooks/useNetworkStatus';
import { useTheme } from '@mui/material/styles';
import API_BASE_URL from './config/apiConfig';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { useNavigate, useLocation } from 'react-router-dom';
import Profile from './Profile';
import newJuicyLogo from './logo/juicee2.png';
import Settings from './Settings';
import SearchPage from './SearchPage';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import UserProfile from './UserProfile';
import callerAudioFile from './assets/caller.mp3';
import receiverAudioFile from './assets/reciver.mp3';
import { createGlobalStyle } from 'styled-components';
import { SketchPicker } from 'react-color';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import BrushIcon from '@mui/icons-material/Brush';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StopIcon from '@mui/icons-material/Stop';
import ReplyIcon from '@mui/icons-material/Reply';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import PrintIcon from '@mui/icons-material/Print';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { VoiceMessageRecorder, VoiceMessagePlayer } from './VoiceMessage';
import { getLoveBotResponse } from './LoveBot';
import loveBotImg from './bot/love.png';
import { GameBubble, GameSelectorDialog } from './Game';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const loveBotUser = {
  _id: 'lovebot',
  username: 'jerry Bot ✨',
  name: 'jerry Bot',
  profilePic: loveBotImg,
  isBot: true,
  online: true
};

// Custom stylish outline icons for sidebar navigation
const SidebarChatIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props.sx }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </SvgIcon>
);

const SidebarPhoneIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props.sx }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </SvgIcon>
);

const SidebarSearchIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props.sx }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </SvgIcon>
);

const SidebarSettingsIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props.sx }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </SvgIcon>
);

// Utility functions for localStorage persistence
const loadMessagesFromStorage = () => {
  try {
    const stored = localStorage.getItem('chatMessages');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.warn('Failed to load messages from localStorage:', e);
    return {};
  }
};

const saveMessagesToStorage = (messagesObj) => {
  try {
    localStorage.setItem('chatMessages', JSON.stringify(messagesObj));
  } catch (e) {
    console.warn('Failed to save messages to localStorage:', e);
  }
};

const SlideToAnswer = ({ onAnswer, onReject }) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 280,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        userSelect: 'none'
      }}
    >
      {/* Accept Call Button (Left Side) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={onAnswer}
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#34c759',
            backgroundImage: 'linear-gradient(135deg, #34c759 0%, #28a745 100%)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(52, 199, 89, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            '&:hover': {
              bgcolor: '#28a745',
              transform: 'scale(1.12)',
              boxShadow: '0 12px 30px rgba(52, 199, 89, 0.6)'
            },
            '&:active': {
              transform: 'scale(0.95)'
            },
            '@keyframes accept-pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(52, 199, 89, 0.6)' },
              '70%': { boxShadow: '0 0 0 15px rgba(52, 199, 89, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(52, 199, 89, 0)' }
            },
            animation: 'accept-pulse 2s infinite',
            zIndex: 2
          }}
        >
          <PhoneIcon
            sx={{
              fontSize: 28,
              '@keyframes wiggle': {
                '0%, 100%': { transform: 'rotate(0deg)' },
                '15%': { transform: 'rotate(-15deg)' },
                '30%': { transform: 'rotate(12deg)' },
                '45%': { transform: 'rotate(-10deg)' },
                '60%': { transform: 'rotate(8deg)' },
                '75%': { transform: 'rotate(0deg)' }
              },
              animation: 'wiggle 2.5s infinite ease-in-out'
            }}
          />
        </IconButton>
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            opacity: 0.95,
            fontWeight: 600,
            fontSize: '0.85rem',
            letterSpacing: 0.5,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Accept
        </Typography>
      </Box>

      {/* Decline Call Button (Right Side) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={onReject || (() => { })}
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#ff3b30',
            backgroundImage: 'linear-gradient(135deg, #ff3b30 0%, #d32f2f 100%)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(255, 59, 48, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:hover': {
              bgcolor: '#d32f2f',
              transform: 'scale(1.12)',
              boxShadow: '0 12px 30px rgba(255, 59, 48, 0.6)'
            },
            '&:active': {
              transform: 'scale(0.95)'
            }
          }}
        >
          <PhoneIcon sx={{ fontSize: 28, transform: 'rotate(135deg)' }} />
        </IconButton>
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            opacity: 0.95,
            fontWeight: 600,
            fontSize: '0.85rem',
            letterSpacing: 0.5,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Decline
        </Typography>
      </Box>
    </Box>
  );
};

const ChatPage = () => {
  // Get socket from context (initialized globally in SocketProvider)
  const socket = useSocket();
  const {
    hearts,
    setHearts,
    canvasRef,
    playedWishesRef,
    detectWishType,
    detectHeartKeyword,
    triggerPopAnimation,
    triggerHeartAnimation
  } = useMessageAnimations();
  // Monitor network status for Android
  const { isOnline, networkType, isConnecting } = useNetworkStatus();
  const videoCallRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedUser, setSelectedUser] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [bottomNav, setBottomNav] = useState(0);
  const [isNotificationView, setIsNotificationView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(loadMessagesFromStorage);
  const [unread, setUnread] = useState({}); // { userId: count }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPreviewUrl, setRecordingPreviewUrl] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((mouseMoveEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX - 64;
      const clampedWidth = Math.max(280, Math.min(newWidth, 480));
      setSidebarWidth(clampedWidth);
    }
  }, [isResizing]);

  React.useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if ((location.search && location.search.includes('tab=settings')) || location.state?.tab === 'settings' || location.state?.openSettings) {
      setBottomNav(3);
    }
  }, [location.search, location.state]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [friendRequestsList, setFriendRequestsList] = useState([]);
  const [friends, setFriends] = useState([]);
  const [dbFriends, setDbFriends] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [lastSeenTimes, setLastSeenTimes] = useState({});
  const [orderedChatIds, setOrderedChatIds] = useState(() => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const saved = localStorage.getItem(`juicy_chat_order_${storedUserId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load chat order from storage:', e);
    }
    return [];
  });

  const moveChatToTop = useCallback((chatId) => {
    if (!chatId) return;
    const idStr = String(chatId);
    setOrderedChatIds(prev => {
      const filtered = prev.filter(id => String(id) !== idStr);
      const nextOrder = [idStr, ...filtered];
      const currentUserId = localStorage.getItem('userId') || (user && user._id);
      if (currentUserId) {
        try {
          localStorage.setItem(`juicy_chat_order_${currentUserId}`, JSON.stringify(nextOrder));
        } catch (e) { }
      }
      return nextOrder;
    });
  }, [user]);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);
  const [unblockConfirmOpen, setUnblockConfirmOpen] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState(null);

  const fetchBlockedStatus = useCallback(() => {
    const loggedInUserId = localStorage.getItem('userId') || (user && user._id);
    if (!loggedInUserId) return;

    fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/blocked`)
      .then(res => res.json())
      .then(data => setBlockedUsers(data.map(u => u.userId || u._id)))
      .catch(err => console.error('Error fetching blocked users:', err));

    fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/blocked-by`)
      .then(res => res.json())
      .then(data => setBlockedBy(data.map(u => u.userId || u._id)))
      .catch(err => console.error('Error fetching blocked by:', err));
  }, [user]);

  useEffect(() => {
    fetchBlockedStatus();
  }, [fetchBlockedStatus, bottomNav]);

  const handleInitiateCall = (targetId, type) => {
    if (blockedUsers.includes(targetId)) {
      toast.error("Unblock this contact to make a call");
      return;
    }
    if (blockedBy.includes(targetId)) {
      toast.error("Contact is currently unavailable");
      return;
    }
    initiateCallHandler(targetId, type);
  };

  useEffect(() => {
    if (Array.isArray(dbFriends)) {
      setLastSeenTimes((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        dbFriends.forEach((friend) => {
          if (friend && friend._id && friend.lastSeen) {
            const fid = friend._id.toString();
            if (updated[fid] !== friend.lastSeen) {
              updated[fid] = friend.lastSeen;
              hasChanges = true;
            }
          }
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [dbFriends]);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDialogUser, setProfileDialogUser] = useState(null);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [replyMetadata, setReplyMetadata] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [usersInChat, setUsersInChat] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [captureFacingMode, setCaptureFacingMode] = useState('user'); // 'user' or 'environment' for chat capture camera
  const [capturedImage, setCapturedImage] = useState(null);
  const captureInputRef = useRef(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const [playingAudioIdx, setPlayingAudioIdx] = useState(null);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null); // <-- New state for camera stream
  const [savedImages, setSavedImages] = useState([]); // Add new state for saved images
  const [fullScreenImage, setFullScreenImage] = useState(null); // { src, id, senderKey, ephemeral, roomId }
  // Zoom state for fullscreen image viewer
  const [imgZoom, setImgZoom] = useState(1);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const imgDragRef = useRef({ dragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });
  const imgPinchRef = useRef({ pinching: false, startDist: 0, startZoom: 1 });
  const imgLastTapRef = useRef(0);
  const imgZoomContainerRef = useRef(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [friendSnackbarOpen, setFriendSnackbarOpen] = useState(false);
  const [latestRequest, setLatestRequest] = useState(null);
  const prevFriendReqCountRef = useRef(0);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const headerRef = useRef(null);
  const inputRef = useRef(null);
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);
  const longPressTimer = useRef(null);
  const isLongPressActive = useRef(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);
  const [isInChat, setIsInChat] = useState(false); // Add this state near other useState declarations
  const [showGestureOverlay, setShowGestureOverlay] = useState(false);
  const [isDrawingGesture, setIsDrawingGesture] = useState(false);
  const [gesturePoints, setGesturePoints] = useState([]);
  const [gestureStatus, setGestureStatus] = useState(null); // { success: boolean, message: string }
  const gestureCanvasRef = useRef(null);
  const [gestureUnlockTarget, setGestureUnlockTarget] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [showStickerDialog, setShowStickerDialog] = useState(false);
  const isDraggingRef = useRef(false);
  const [mobileActiveTab, setMobileActiveTab] = React.useState(0);
  const [contactSyncDialogOpen, setContactSyncDialogOpen] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
  const [hasLoadedFriends, setHasLoadedFriends] = useState(false);
  const dbFriendsRef = useRef([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedShareFriends, setSelectedShareFriends] = useState([]);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docDialogFile, setDocDialogFile] = useState(null); // { name: '', data: '' }
  const [showReaderSelection, setShowReaderSelection] = useState(false);
  const [selectedReader, setSelectedReader] = useState('browser'); // 'drive', 'office', 'browser', 'download'
  const [openingSimulated, setOpeningSimulated] = useState(false);
  const [simulatedAppName, setSimulatedAppName] = useState('');
  const typingTimeoutRef = useRef(null);

  const notifBannerTimerRef = useRef(null);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [notifBannerData, setNotifBannerData] = useState(null);

  // --- DOCUMENT PREVIEW STATE ---
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('other'); // 'pdf' | 'image' | 'text' | 'other'
  const [previewTheme, setPreviewTheme] = useState('drive'); // 'drive' | 'office'
  const [previewName, setPreviewName] = useState('');
  const [previewTextContent, setPreviewTextContent] = useState('');
  const [previewZoom, setPreviewZoom] = useState(100);
  const [gameSelectorOpen, setGameSelectorOpen] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);

  // Initialize push notification hook (Android/iOS only)
  usePushNotifications(user, setUnread, videoCallRef, navigate);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        const emojiBtn = document.getElementById('emoji-picker-button');
        if (!emojiBtn || !emojiBtn.contains(e.target)) {
          setShowEmojiPicker(false);
        }
      }
      if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        const attachBtn = document.getElementById('attach-menu-button');
        if (!attachBtn || !attachBtn.contains(e.target)) {
          setShowAttachMenu(false);
        }
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showEmojiPicker, showAttachMenu]);


  // Revoke Blob URLs on change or unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {
          console.warn('Failed to revoke object URL:', e);
        }
      }
    };
  }, [previewUrl]);

  const getBlobUrlFromDataUrl = (dataUrl) => {
    try {
      if (!dataUrl) return '';
      // If already a blob URL or external URL, return it
      if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        return dataUrl;
      }
      const parts = dataUrl.split(';base64,');
      if (parts.length < 2) return dataUrl;
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Failed to convert base64 to Blob URL:', e);
      return dataUrl;
    }
  };

  const getFileType = (fileName) => {
    if (!fileName) return 'other';
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['txt', 'log', 'json', 'js', 'html', 'css', 'csv'].includes(ext)) return 'text';
    return 'other';
  };

  // Helper: get MIME type from file name
  const getMimeType = (fileName) => {
    if (!fileName) return 'application/octet-stream';
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeMap = {
      pdf: 'application/pdf',
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
      txt: 'text/plain', log: 'text/plain', csv: 'text/csv', json: 'application/json',
      js: 'text/javascript', html: 'text/html', css: 'text/css',
      doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      zip: 'application/zip', rar: 'application/x-rar-compressed',
      mp3: 'audio/mpeg', mp4: 'video/mp4', wav: 'audio/wav',
      apk: 'application/vnd.android.package-archive'
    };
    return mimeMap[ext] || 'application/octet-stream';
  };

  // Helper: detect if running on native Capacitor
  const isNativeApp = () => {
    return typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  };

  // Helper: check and request permission for writing to public directories
  const requestStoragePermission = async () => {
    try {
      const status = await Filesystem.checkPermissions();
      if (status.publicStorage !== 'granted') {
        const request = await Filesystem.requestPermissions();
        return request.publicStorage === 'granted';
      }
      return true;
    } catch (err) {
      console.warn('Filesystem permissions check failed or not supported:', err);
      return true;
    }
  };

  const getOfficeColor = (fileName) => {
    if (!fileName) return '#2b579a';
    const ext = fileName.toLowerCase().split('.').pop();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '#107c41'; // Excel green
    if (['ppt', 'pptx'].includes(ext)) return '#d83b01'; // PowerPoint orange
    return '#2b579a'; // Word blue
  };

  const readTextFileContent = (base64Data) => {
    try {
      if (!base64Data) return '';
      const parts = base64Data.split(';base64,');
      if (parts.length < 2) return '';
      const decoded = atob(parts[1]);
      return decoded;
    } catch (e) {
      console.error('Failed to decode text file:', e);
      return '';
    }
  };

  // --- WhatsApp-style Document Open Handler ---
  // On Android: writes file to cache → opens with system default app via FileOpener
  // On Web: uses Blob URL for browser display or anchor download
  const performOpen = async (readerType) => {
    if (!docDialogFile?.data) return;

    const fileName = docDialogFile.name;
    const mimeType = getMimeType(fileName);

    // --- NATIVE (Android/iOS via Capacitor) ---
    if (isNativeApp()) {
      try {
        // Extract base64 data (strip the data URL prefix)
        const base64Data = docDialogFile.data.includes(';base64,')
          ? docDialogFile.data.split(';base64,')[1]
          : docDialogFile.data;

        if (readerType === 'download') {
          // Ask for storage permission first
          const hasPermission = await requestStoragePermission();
          if (!hasPermission) {
            toast.error('Permission denied: cannot save file.');
            return;
          }

          // Save to Downloads directory (persistent, user-visible)
          try {
            const { AudioRoute } = window.Capacitor.Plugins || {};
            if (AudioRoute && typeof AudioRoute.saveFileToDownloads === 'function') {
              await AudioRoute.saveFileToDownloads({
                base64Data: base64Data,
                fileName: fileName,
                mimeType: mimeType
              });
              toast.success(`Saved to device Downloads: ${fileName}`);
            } else {
              const savedFile = await Filesystem.writeFile({
                path: `Download/${fileName}`,
                data: base64Data,
                directory: Directory.ExternalStorage,
                recursive: true
              });
              console.log('File saved to Downloads:', savedFile.uri);
              toast.success(`Saved to device: Download/${fileName}`);
            }
          } catch (writeErr) {
            console.warn('Failed to write to ExternalStorage, trying Documents folder...', writeErr);
            try {
              const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents,
                recursive: true
              });
              console.log('File saved to Documents:', savedFile.uri);
              toast.success(`Saved to Documents: ${fileName}`);
            } catch (docErr) {
              console.error('Failed to write to Documents folder:', docErr);
              toast.error('Could not save file to device storage.');
            }
          }
        } else {
          // Write to app cache (temporary) and open with system default app
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          // Open with system default app (WhatsApp-style intent chooser)
          await FileOpener.openFile({
            path: savedFile.uri,
            mimeType: mimeType
          });
        }
      } catch (err) {
        console.error('Native file operation failed:', err);
        toast.error('Could not open file natively. Opening preview...');

        // Fallback: try web-based opening or in-app previewer
        try {
          const blobUrl = getBlobUrlFromDataUrl(docDialogFile.data);
          const fileType = getFileType(fileName);
          if (fileType === 'text') {
            const text = readTextFileContent(docDialogFile.data);
            setPreviewTextContent(text);
          } else {
            setPreviewTextContent('');
          }
          setPreviewUrl(blobUrl);
          setPreviewType(fileType);
          setPreviewName(fileName);
          setPreviewTheme('drive');
          setPreviewZoom(100);
          setPreviewDialogOpen(true);
        } catch (fallbackErr) {
          console.error('Fallback open also failed:', fallbackErr);
          toast.error('Failed to preview document.');
        }
      }
      return;
    }

    // --- WEB BROWSER ---
    const blobUrl = getBlobUrlFromDataUrl(docDialogFile.data);

    if (readerType === 'download') {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (readerType === 'open') {
      // Open built-in premium viewer for supported types, or new tab
      const fileType = getFileType(fileName);
      if (fileType === 'text') {
        const text = readTextFileContent(docDialogFile.data);
        setPreviewTextContent(text);
      } else {
        setPreviewTextContent('');
      }
      setPreviewUrl(blobUrl);
      setPreviewType(fileType);
      setPreviewName(fileName);
      setPreviewTheme('drive');
      setPreviewZoom(100);
      setPreviewDialogOpen(true);
    } else {
      // Fallback: open in new browser tab
      window.open(blobUrl, '_blank');
    }
  };

  // --- WHATSAPP DOCUMENT DOWNLOAD STATE ---
  const [downloadingDocs, setDownloadingDocs] = useState({}); // { [msgId]: { progress: number, active: boolean, completed: boolean } }
  const downloadIntervalsRef = useRef({});

  // Cleanup download intervals on unmount
  useEffect(() => {
    return () => {
      if (downloadIntervalsRef.current) {
        Object.values(downloadIntervalsRef.current).forEach(clearInterval);
      }
    };
  }, []);

  // WhatsApp-style "Open With" handler — simplified to Open or Download
  const handleOpenWithApp = (actionType) => {
    if (!docDialogFile?.data) return;

    const appName = actionType === 'download' ? 'Saving to Device...' : 'Opening...';
    setSimulatedAppName(appName);
    setOpeningSimulated(true);

    setTimeout(async () => {
      try {
        await performOpen(actionType);
      } catch (e) {
        console.error('Failed to open document:', e);
      }

      setDocDialogOpen(false);
      setShowReaderSelection(false);
      setOpeningSimulated(false);
    }, 800);
  };

  // --- WhatsApp-style Download Handler ---
  // On Android: writes the file to Downloads via Capacitor Filesystem
  // On Web: uses anchor element click download
  const handleStartDownload = (msgId, documentName, documentData) => {
    if (!msgId || !documentData) return;

    if (downloadIntervalsRef.current[msgId]) {
      clearInterval(downloadIntervalsRef.current[msgId]);
    }

    setDownloadingDocs(prev => ({
      ...prev,
      [msgId]: { progress: 0, active: true, completed: false }
    }));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 6;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        delete downloadIntervalsRef.current[msgId];

        // Perform actual download/save
        (async () => {
          try {
            if (isNativeApp()) {
              // Ask for storage permission first
              const hasPermission = await requestStoragePermission();
              if (!hasPermission) {
                toast.error('Permission denied: cannot save file.');
                return;
              }

              const base64Data = documentData.includes(';base64,')
                ? documentData.split(';base64,')[1]
                : documentData;

              // Save to Downloads directory (persistent, user-visible)
              try {
                const { AudioRoute } = window.Capacitor.Plugins || {};
                if (AudioRoute && typeof AudioRoute.saveFileToDownloads === 'function') {
                  await AudioRoute.saveFileToDownloads({
                    base64Data: base64Data,
                    fileName: documentName,
                    mimeType: getMimeType(documentName)
                  });
                  toast.success(`Saved to device Downloads: ${documentName}`);
                } else {
                  const savedFile = await Filesystem.writeFile({
                    path: `Download/${documentName}`,
                    data: base64Data,
                    directory: Directory.ExternalStorage,
                    recursive: true
                  });
                  console.log('File saved to Downloads:', savedFile.uri);
                  toast.success(`Saved to device: Download/${documentName}`);
                }
              } catch (writeErr) {
                console.warn('Failed to write to ExternalStorage, trying Documents folder...', writeErr);
                try {
                  const savedFile = await Filesystem.writeFile({
                    path: documentName,
                    data: base64Data,
                    directory: Directory.Documents,
                    recursive: true
                  });
                  console.log('File saved to Documents:', savedFile.uri);
                  toast.success(`Saved to Documents: ${documentName}`);
                } catch (docErr) {
                  console.error('Failed to write to Documents folder:', docErr);
                  toast.error('Could not save file to device storage.');
                }
              }
            } else {
              // Web: anchor download
              const link = document.createElement('a');
              link.href = documentData;
              link.download = documentName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } catch (e) {
            console.error('Failed to trigger download:', e);
            toast.error('Failed to download document.');
          }
        })();

        setDownloadingDocs(prev => ({
          ...prev,
          [msgId]: { progress: 100, active: false, completed: true }
        }));
      } else {
        setDownloadingDocs(prev => ({
          ...prev,
          [msgId]: { progress: currentProgress, active: true, completed: false }
        }));
      }
    }, 120);

    downloadIntervalsRef.current[msgId] = interval;
  };

  const handleCancelDownload = (msgId) => {
    if (downloadIntervalsRef.current[msgId]) {
      clearInterval(downloadIntervalsRef.current[msgId]);
      delete downloadIntervalsRef.current[msgId];
    }
    setDownloadingDocs(prev => {
      const updated = { ...prev };
      delete updated[msgId];
      return updated;
    });
  };

  // States and Handlers for Chat Message Options Menu (Reply, Edit, Delete)
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMenuMessage, setSelectedMenuMessage] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [quickProfileUser, setQuickProfileUser] = useState(null);

  const startLongPress = (e, msg) => {
    if (msg.type === 'deleted' || msg.deletedForEveryone) return;
    // Only handle left clicks for mouse events
    if (e.type === 'mousedown' && e.button !== 0) return;

    const currentTarget = e.currentTarget;
    isLongPressActive.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      handleMessageMenuOpen({ currentTarget }, msg);
      longPressTimer.current = null;
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMessageMenuOpen = (event, msg) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMenuMessage(msg);
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMenuMessage(null);
  };

  const handleReactMessage = (msg, emoji) => {
    if (!msg || !emoji || !socket || !user || !selectedUser) return;
    const roomId = [user._id, selectedUser._id].sort().join('-');

    // Emit socket event to the server
    socket.emit('react_message', {
      messageId: String(msg.id),
      emoji,
      roomId,
      userId: user._id,
      username: user.username
    });

    // Optimistic UI update: local messages state
    setMessages(prev => {
      const updated = { ...prev };
      const userIdStr = String(selectedUser._id);
      if (updated[userIdStr]) {
        updated[userIdStr] = updated[userIdStr].map(m => {
          if (String(m.id) === String(msg.id)) {
            const currentReactions = m.reactions ? [...m.reactions] : [];
            const existingIdx = currentReactions.findIndex(r => String(r.userId) === String(user._id));

            if (existingIdx !== -1) {
              if (currentReactions[existingIdx].emoji === emoji) {
                // Remove reaction if identical
                currentReactions.splice(existingIdx, 1);
              } else {
                // Update reaction if different
                currentReactions[existingIdx] = { ...currentReactions[existingIdx], emoji };
              }
            } else {
              // Add reaction
              currentReactions.push({ userId: user._id, username: user.username, emoji });
            }

            return { ...m, reactions: currentReactions };
          }
          return m;
        });
      }
      return updated;
    });

    handleMessageMenuClose();
  };

  const handleEditClick = () => {
    if (selectedMenuMessage) {
      const msgTime = new Date(selectedMenuMessage.createdAt || selectedMenuMessage.timestamp || 0).getTime();
      if (!isNaN(msgTime) && (Date.now() - msgTime > 15 * 60 * 1000)) {
        toast.error('You can only edit messages within 15 minutes');
        handleMessageMenuClose();
        return;
      }
      setEditingMessage(selectedMenuMessage);
      setEditText(selectedMenuMessage.text || '');
      setEditDialogOpen(true);
    }
    handleMessageMenuClose();
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editText.trim() || !socket || !user || !selectedUser) return;

    let textToSave = editText.trim();
    const domainPattern = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am|ig\.me|facebook\.com|fb\.com|fb\.me|x\.com|twitter\.com|threads\.net)\b/i;
    const platformPattern = /(?:instagram|facebook|threads|twitter|facbook|threat)\s*(?:id|username|profile|handle|link)?\s*[:@\s-]\s*([a-z0-9_.-]+)/i;

    if (domainPattern.test(textToSave) || platformPattern.test(textToSave)) {
      textToSave = "Social media links are restricted";
    }

    const roomId = [user._id, selectedUser._id].sort().join('-');

    socket.emit('edit_message', {
      messageId: String(editingMessage.id),
      newText: textToSave,
      roomId
    });

    setMessages(prev => {
      const updated = { ...prev };
      const userId = String(selectedUser._id);
      if (updated[userId]) {
        updated[userId] = updated[userId].map(m =>
          String(m.id) === String(editingMessage.id) ? { ...m, text: textToSave, edited: true } : m
        );
      }
      return updated;
    });

    setEditDialogOpen(false);
    setEditingMessage(null);
  };

  const handleDeleteForMe = async () => {
    if (!selectedMenuMessage || !selectedUser) return;

    const messageId = String(selectedMenuMessage.id);
    const loggedInUserId = user?._id || localStorage.getItem('userId');

    // Optimistic UI update: local messages state
    setMessages(prev => {
      const updated = { ...prev };
      const userId = String(selectedUser._id);
      if (updated[userId]) {
        updated[userId] = updated[userId].filter(m => String(m.id) !== messageId);
      }
      return updated;
    });

    handleMessageMenuClose();

    // Call backend API to persist "Delete for Me"
    if (loggedInUserId) {
      try {
        await fetch(`${API_BASE_URL}/api/messages/${messageId}/delete-for-me`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: loggedInUserId })
        });
      } catch (err) {
        console.error('Failed to notify backend about delete-for-me:', err);
      }
    }
  };

  const handleDeleteForEveryone = () => {
    if (!selectedMenuMessage || !socket || !user || !selectedUser) return;

    // Enforce 15-minute time restriction for WhatsApp style "Delete for Everyone"
    const msgTime = new Date(selectedMenuMessage.createdAt || selectedMenuMessage.timestamp || 0).getTime();
    if (!isNaN(msgTime) && (Date.now() - msgTime > 15 * 60 * 1000)) {
      toast.error('You can only delete messages for everyone within 15 minutes');
      handleMessageMenuClose();
      return;
    }

    const roomId = [user._id, selectedUser._id].sort().join('-');

    socket.emit('delete_message', {
      messageId: String(selectedMenuMessage.id),
      roomId
    });

    setMessages(prev => {
      const updated = { ...prev };
      const userId = String(selectedUser._id);
      if (updated[userId]) {
        updated[userId] = updated[userId].map(m =>
          String(m.id) === String(selectedMenuMessage.id)
            ? {
              ...m,
              originalText: m.text || (m.image ? '📷 Photo' : m.audio ? '🎵 Voice message' : m.document ? `📄 ${m.document}` : ''),
              text: 'You deleted this message',
              type: 'deleted',
              deletedForEveryone: true,
              image: '',
              audio: '',
              document: '',
              documentData: '',
              contact: null,
              youtube: null
            }
            : m
        );
      }
      return updated;
    });

    handleMessageMenuClose();
  };

  const handleDeleteChats = async (selectedIds) => {
    try {
      const loggedInUserId = user?._id || localStorage.getItem('userId');
      if (!loggedInUserId) return;

      for (const friendId of selectedIds) {
        // Delete messages in database between current user and friend
        await fetch(`${API_BASE_URL}/api/messages/${loggedInUserId}/${friendId}`, {
          method: 'DELETE'
        });

        // Remove friend relation from database
        await fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/remove-friend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId })
        });
      }

      // Convert selected IDs to string list for reliable filtering
      const stringSelectedIds = selectedIds.map(id => String(id));

      // Update local state: remove from dbFriends
      setDbFriends((prev) => prev.filter(f => !stringSelectedIds.includes(String(f._id))));

      // Update local state: delete messages from state and storage
      setMessages((prev) => {
        const updated = { ...prev };
        stringSelectedIds.forEach(id => {
          delete updated[id];
        });
        return updated;
      });

      // Clear unread counts for these deleted chats
      setUnread((prev) => {
        const updated = { ...prev };
        stringSelectedIds.forEach(id => {
          delete updated[id];
        });
        return updated;
      });

      // If currently active chat is one of the deleted chats, close it
      if (selectedUser && stringSelectedIds.includes(String(selectedUser._id))) {
        setSelectedUser(null);
      }

      toast.success('Selected chats deleted successfully');
    } catch (err) {
      console.error('Error deleting chats:', err);
      toast.error('Failed to delete selected chats');
    }
  };






  const handleSelectFromContacts = async (contactUser) => {
    setContactSyncDialogOpen(false);
    setShowFinder(false);

    // Check if this user is already in our friends list
    const isAlreadyFriend = dbFriends.some(f => String(f._id) === String(contactUser._id));

    if (!isAlreadyFriend) {
      try {
        const loggedInUserId = user?._id || localStorage.getItem('userId');
        if (!loggedInUserId) throw new Error('No user ID found');
        const response = await fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/add-friend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId: contactUser._id })
        });

        if (response.ok) {
          const friendsRes = await fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/friends`);
          if (friendsRes.ok) {
            const friendsData = await friendsRes.json();
            setDbFriends(friendsData);
          }
          toast.success(`Started chat with ${contactUser.username}`);
        }
      } catch (err) {
        console.error('Error adding friend from contacts:', err);
      }
    }

    setSelectedUser({
      _id: contactUser._id,
      username: contactUser.username,
      profilePic: contactUser.profileImage || '',
      name: contactUser.name || contactUser.username
    });

    if (isMobile) {
      setIsInChat(true);
    }
  };

  const handleSelectAllFromContacts = async (contactUsers) => {
    setContactSyncDialogOpen(false);
    setShowFinder(false);

    if (!contactUsers || contactUsers.length === 0) return;

    const newContacts = contactUsers.filter(contactUser =>
      !dbFriends.some(f => String(f._id) === String(contactUser._id))
    );

    if (newContacts.length === 0) {
      toast.success('All contacts are already imported.');
      return;
    }

    try {
      const loggedInUserId = user?._id || localStorage.getItem('userId');
      if (!loggedInUserId) throw new Error('No user ID found');
      await Promise.all(newContacts.map(contactUser =>
        fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/add-friend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId: contactUser._id })
        })
      ));

      const friendsRes = await fetch(`${API_BASE_URL}/api/user/${loggedInUserId}/friends`);
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setDbFriends(friendsData);
      }
      toast.success(`Successfully imported ${newContacts.length} new contact${newContacts.length !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error adding friends from contacts:', err);
      toast.error('Failed to import some contacts');
    }
  };

  // font size in pixels
  const [backgroundPattern, setBackgroundPattern] = useState({
    id: 'none',
    pattern: 'none',
    size: '20px 20px',
    opacity: 0.05
  });

  // Ref for the new StickerDialog component
  const stickerRef = useRef(null);
  const REPLY_MARKER_START = '‹reply›';
  const REPLY_MARKER_END = '‹/reply›';

  // Helper function to safely extract and clean reply markers from text
  const extractAndCleanReplyMarkers = (textWithMarkers) => {
    if (!textWithMarkers || typeof textWithMarkers !== 'string') {
      return { replyObj: null, cleanText: textWithMarkers };
    }

    let replyObj = null;
    let cleanText = textWithMarkers;

    if (cleanText.startsWith(REPLY_MARKER_START)) {
      try {
        const endIdx = cleanText.indexOf(REPLY_MARKER_END);
        if (endIdx !== -1) {
          const jsonPart = cleanText.substring(REPLY_MARKER_START.length, endIdx);
          try {
            replyObj = JSON.parse(jsonPart);
          } catch (e) {
            replyObj = { originalContent: jsonPart };
          }
          cleanText = cleanText.substring(endIdx + REPLY_MARKER_END.length).trim();
        }
      } catch (e) {
        console.warn('Error extracting reply markers:', e);
      }
    }

    return { replyObj, cleanText };
  };

  const formatReplyContent = (content) => {
    if (content && typeof content === 'string' && content.startsWith('JUICY_GAME:')) {
      try {
        const jsonStr = content.indexOf('{') !== -1 ? content.slice(content.indexOf('{')) : content.substring(11);
        const gameData = JSON.parse(jsonStr);
        const gameType = gameData.gameType;
        const gameName = gameType === 'tictactoe'
          ? 'Tic Tac Toe'
          : (gameType === 'truthordare' ? 'Truth or Dare' : 'Rock Paper Scissors');
        return `🎮 Game: ${gameName}`;
      } catch (e) {
        return '🎮 Game';
      }
    }
    return content;
  };

  const scrollToMessage = (targetMsgId, originalContent, timestamp) => {
    let targetElement = null;

    if (targetMsgId) {
      targetElement = document.getElementById(`msg-${targetMsgId}`);
    }

    // If not found by ID, search by scanning data attributes in the DOM
    if (!targetElement && originalContent) {
      const msgElements = document.querySelectorAll('[data-msg-text]');
      for (const el of msgElements) {
        const contentText = el.getAttribute('data-msg-text');
        if (contentText === originalContent) {
          targetElement = el;
          break;
        }
      }
    }

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Flash animation
      targetElement.classList.remove('reply-highlight-flash');
      void targetElement.offsetWidth; // force reflow
      targetElement.classList.add('reply-highlight-flash');

      setTimeout(() => {
        if (targetElement) {
          targetElement.classList.remove('reply-highlight-flash');
        }
      }, 1500);
    } else {
      toast.error('Original message not found');
    }
  };



  // --- DOODLE / DRAWING TOOL: add these near other state/ref declarations ---
  const [doodleMode, setDoodleMode] = useState(false);

  // Filter effects


  // show snackbar when a new friend request arrives
  useEffect(() => {
    const prev = prevFriendReqCountRef.current || 0;
    const curr = (friendRequestsList && friendRequestsList.length) || 0;
    if (curr > prev) {
      const newest = friendRequestsList[friendRequestsList.length - 1];
      setLatestRequest(newest);
      setFriendSnackbarOpen(true);
    }
    prevFriendReqCountRef.current = curr;
  }, [friendRequestsList]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetch(`${API_BASE_URL}/api/user/${userId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && data._id) {
            setUser(data);
            if (data.gestures) {
              localStorage.setItem('juicy_contact_gestures', JSON.stringify(data.gestures));
            }
            // Show user guide only once for new users
            const userGuideKey = `juicy_has_seen_user_guide_${data._id}`;
            const hasSeenGuide = localStorage.getItem(userGuideKey) || localStorage.getItem(USER_GUIDE_STORAGE_KEY);
            if (!hasSeenGuide) {
              setShowUserGuide(true);
            }

            // 🔑 Persist session to native SharedPreferences for background FCM token refresh
            if (typeof window !== 'undefined' && window.Capacitor) {
              const { AudioRoute } = window.Capacitor.Plugins || {};
              if (AudioRoute && typeof AudioRoute.saveSession === 'function') {
                const authToken = localStorage.getItem('token') || '';
                AudioRoute.saveSession({
                  userId: data._id,
                  token: authToken,
                  username: data.username || '',
                  profileImage: data.profilePic || data.profileImage || '',
                  backendUrl: API_BASE_URL
                }).then(() => {
                  console.log('✅ Native session synced to SharedPreferences from ChatPage');
                }).catch(err => console.warn('Failed to sync session from ChatPage:', err));
              }
            }
          } else {
            console.warn('Invalid user data fetched:', data);
          }
        })
        .catch(err => console.warn('Failed to fetch user:', err));
    }
  }, []);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      fetch(`${API_BASE_URL}/api/user/${currentUserId}/friends`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setDbFriends(data);
            setHasLoadedFriends(true);
          } else {
            console.warn('Friends data is not an array:', data);
            setDbFriends([]);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch friends:', err);
          setDbFriends([]);
        });
    }
  }, [friendRequestsList, selectedUser]);

  useEffect(() => {
    dbFriendsRef.current = dbFriends;
  }, [dbFriends]);

  // Auto-prompt new user (with 0 friends) to sync contacts once
  useEffect(() => {
    if (hasLoadedFriends && dbFriends.length === 0 && user) {
      const promptedKey = `contacts_prompted_${user._id}`;
      if (!localStorage.getItem(promptedKey)) {
        setContactSyncDialogOpen(true);
        localStorage.setItem(promptedKey, 'true');
      }
    }
  }, [hasLoadedFriends, dbFriends, user]);

  // Background function to sync new registered contacts silently
  const syncNewRegisteredContacts = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const rawNumbers = localStorage.getItem(`synced_phone_numbers_${userId}`);
      if (!rawNumbers) return;

      const phoneNumbers = JSON.parse(rawNumbers);
      if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) return;

      const response = await fetch(`${API_BASE_URL}/api/search-by-phones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers,
          userId
        })
      });

      if (!response.ok) return;

      const matchedUsers = await response.json();
      if (!Array.isArray(matchedUsers) || matchedUsers.length === 0) return;

      // Filter matched users that are not already friends
      const currentFriendIds = new Set(Array.isArray(dbFriendsRef.current) ? dbFriendsRef.current.map(f => String(f._id)) : []);
      const newContacts = matchedUsers.filter(u => !currentFriendIds.has(String(u._id)));

      if (newContacts.length === 0) return;

      console.log(`[Auto Sync] Found ${newContacts.length} new registered contacts! Adding as friends...`);

      // Add each new contact as a friend
      await Promise.all(newContacts.map(contactUser =>
        fetch(`${API_BASE_URL}/api/user/${userId}/add-friend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId: contactUser._id })
        })
      ));

      // Refresh friends list
      const friendsRes = await fetch(`${API_BASE_URL}/api/user/${userId}/friends`);
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setDbFriends(friendsData);
        toast.success(`Automatically synced ${newContacts.length} new contact${newContacts.length !== 1 ? 's' : ''}!`);
      }
    } catch (err) {
      console.warn('Background contact sync failed:', err);
    }
  };

  // Run initial background check & setup periodic interval check
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    if (hasLoadedFriends) {
      syncNewRegisteredContacts();
    }

    const intervalId = setInterval(() => {
      syncNewRegisteredContacts();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [hasLoadedFriends]);

  useEffect(() => {
    if (!user || !Array.isArray(dbFriends) || dbFriends.length === 0) return;

    dbFriends.forEach(friend => {
      const friendIdStr = String(friend._id);
      // Only fetch if we don't have messages for this friend in state yet
      if (!messages[friendIdStr] || messages[friendIdStr].length === 0) {
        fetch(`${API_BASE_URL}/api/messages/${user._id}/${friend._id}`)
          .then(res => {
            if (res.ok) return res.json();
          })
          .then(dbMessages => {
            if (dbMessages && dbMessages.length > 0) {
              setMessages(prev => {
                const updated = { ...prev };
                const newMapped = dbMessages.map(msg => {
                  const senderId = String(msg.senderId);
                  let replyObj = null;
                  let cleanText = msg.text || '';

                  if (cleanText.startsWith(REPLY_MARKER_START)) {
                    const { replyObj: extracted, cleanText: cleaned } = extractAndCleanReplyMarkers(cleanText);
                    if (extracted) {
                      replyObj = extracted;
                      cleanText = cleaned;
                    }
                  }

                  return {
                    id: String(msg._id),
                    sender: msg.senderUsername || senderId,
                    senderId: senderId,
                    receiverId: String(msg.receiverId),
                    text: msg.deletedForEveryone
                      ? (String(senderId) === String(user?._id) ? 'You deleted this message' : 'This message was deleted')
                      : cleanText,
                    image: msg.image || '',
                    audio: msg.audio || '',
                    youtube: msg.youtube || null,
                    type: msg.type || (msg.youtube ? 'youtube' : null),
                    document: msg.document || '',
                    documentData: msg.documentData || '',
                    contact: msg.contact || null,
                    replyTo: replyObj,
                    read: msg.read || false,
                    readAt: msg.readAt || null,
                    reactions: msg.reactions || [],
                    timestamp: formatTime(new Date(msg.timestamp)),
                    date: formatDate(new Date(msg.timestamp)),
                    createdAt: msg.timestamp,
                    deletedForEveryone: msg.deletedForEveryone || false,
                    originalText: msg.originalText || ''
                  };
                });

                const dbMessagesMap = new Map(newMapped.map(m => [m.id, m]));
                const localMessages = updated[friendIdStr] || [];
                const merged = [...newMapped];

                localMessages.forEach(localMsg => {
                  const isTempId = !/^[0-9a-fA-F]{24}$/.test(String(localMsg.id));
                  if (isTempId && !dbMessagesMap.has(localMsg.id)) {
                    merged.push(localMsg);
                  }
                });

                merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                updated[friendIdStr] = merged;
                saveMessagesToStorage(updated);
                return updated;
              });
            }
          })
          .catch(err => console.warn('Failed to pre-fetch messages for friend:', friend._id, err));
      }
    });
  }, [dbFriends, user]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (notifBannerTimerRef.current) {
        clearTimeout(notifBannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetch(`${API_BASE_URL}/api/user/${userId}/friendRequests`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setFriendRequestsList(data);
          } else {
            console.warn('Friend requests is not an array:', data);
            setFriendRequestsList([]);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch friend requests:', err);
          setFriendRequestsList([]);
        });
    }
  }, []);

  // Derive clean pending incoming friend requests (filters out accepted friends, blocked users, non-receivers)
  const pendingIncomingRequests = React.useMemo(() => {
    if (!Array.isArray(friendRequestsList)) return [];

    const friendIdsSet = new Set(
      (Array.isArray(dbFriends) ? dbFriends : []).map(f => String(f._id || f.friendId || f))
    );
    const blockedIdsSet = new Set(
      (Array.isArray(blockedUsers) ? blockedUsers : []).map(b => String(b.userId || b._id || b))
    );
    const currentUserId = user && user._id ? String(user._id) : localStorage.getItem('userId');

    const uniqueMap = new Map();

    friendRequestsList.forEach(req => {
      if (!req) return;
      const sId = String(req.senderId || req.from || req._id || req);
      if (!sId) return;

      // Do not count if sender is current user (outgoing)
      if (currentUserId && sId === currentUserId) return;
      // Do not count if receiverId is explicitly specified and doesn't match current user
      if (req.receiverId && currentUserId && String(req.receiverId) !== currentUserId) return;
      // Do not count if sender is already a friend
      if (friendIdsSet.has(sId)) return;
      // Do not count if sender is blocked
      if (blockedIdsSet.has(sId)) return;

      if (!uniqueMap.has(sId)) {
        uniqueMap.set(sId, {
          ...req,
          senderId: sId
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [friendRequestsList, dbFriends, blockedUsers, user]);

  const handleAcceptFriend = async (req) => {
    const userId = localStorage.getItem('userId') || (user && user._id);
    const targetSenderId = req.senderId || req._id;
    if (!userId || !targetSenderId) return;

    // Optimistically remove accepted request from state immediately
    setFriendRequestsList(prev => (prev || []).filter(r => {
      const sId = String(r.senderId || r.from || r._id || r);
      return sId !== String(targetSenderId);
    }));

    try {
      await fetch(`${API_BASE_URL}/api/friendRequests/${targetSenderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      });
      fetch(`${API_BASE_URL}/api/user/${userId}/friendRequests`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setFriendRequestsList(data);
        })
        .catch(err => console.warn('Failed to fetch friend requests:', err));
      fetch(`${API_BASE_URL}/api/user/${userId}/friends`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setDbFriends(data);
        })
        .catch(err => console.warn('Failed to fetch friends:', err));
    } catch (err) {
      console.error('Error accepting friend:', err);
    }
  };


  const showChatList = isMobile ? !selectedUser : true;
  const showChatPane = isMobile ? !!selectedUser : true;

  const allChatMembers = Array.isArray(dbFriends) ? dbFriends.map(f => ({
    name: f.username,
    image: f.profilePic || '',
    online: onlineUserIds.includes(f._id.toString()),
    _id: f._id,
    username: f.username,
    profilePic: f.profilePic
  })) : [];
  // filteredMembers is declared below, after sortedMembers (which merges dbFriends + unknown senders)


  const formatDate = (date) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
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

  // Function to check if a message is expired (older than 7 days)
  const isMessageExpired = (messageTimestamp) => {
    try {
      if (!messageTimestamp) return false;
      const messageDate = new Date(messageTimestamp);
      if (isNaN(messageDate.getTime())) return false;
      const now = new Date();
      const ageInDays = (now - messageDate) / (1000 * 60 * 60 * 24);
      return ageInDays > 7;
    } catch (e) {
      return false;
    }
  };

  // Function to get time remaining until message expires
  const getTimeUntilExpiry = (messageTimestamp) => {
    try {
      if (!messageTimestamp) return '';
      const messageDate = new Date(messageTimestamp);
      if (isNaN(messageDate.getTime())) return '';
      const now = new Date();
      const expiryDate = new Date(messageDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const timeRemaining = expiryDate - now;

      if (timeRemaining <= 0) return 'Expired';

      const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (daysRemaining > 0) {
        return `Expires in ${daysRemaining}d ${hoursRemaining}h`;
      }
      return `Expires in ${hoursRemaining}h`;
    } catch (e) {
      return '';
    }
  };
  const getProfileSrc = (u) => {
    if (!u) return '';   // prefer data URL or full URL fields you might have
    if (u.profileImage) {
      try {
        return u.profileImage.startsWith('data:') ? u.profileImage : `data:image/jpeg;base64,${u.profileImage}`;
      } catch (e) {
        return u.profileImage;
      }
    }
    return u.profilePic || u.image || '';
  };

  // Helper function to check if a user is online
  const isUserOnline = (userId) => {
    return onlineUserIds.includes(userId) || onlineUserIds.includes(userId.toString());
  };

  const formatLastSeen = (timestamp, formatType = 'whatsapp') => {
    if (!timestamp) return 'Offline';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Offline';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.max(0, Math.floor(diffMs / 3600000));
    const diffDays = Math.max(0, Math.floor(diffMs / 86400000));

    if (formatType === 'instagram') {
      if (diffMins < 1) return 'Active moments ago';
      if (diffMins < 60) return `Active ${diffMins}m ago`;
      if (diffHours < 24) return `Active ${diffHours}h ago`;
      if (diffDays === 1) return 'Active yesterday';
      return `Active ${diffDays}d ago`;
    }

    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === now.toDateString()) {
      return `Last seen today at ${timeString}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Last seen yesterday at ${timeString}`;
    }

    const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `Last seen on ${dateString} at ${timeString}`;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  const handleSendBotMessage = async () => {
    const textToSend = message.trim();
    if (!textToSend) return;
    moveChatToTop('lovebot');
    setMessage('');

    const userMsgId = generateUniqueId();
    const botMsgId = generateUniqueId();

    const userMsg = {
      id: userMsgId,
      localId: userMsgId,
      sender: 'You',
      senderId: user._id,
      receiverId: 'lovebot',
      text: textToSend,
      timestamp: formatTime(new Date()),
      date: formatDate(new Date()),
      createdAt: new Date().toISOString(),
      read: true
    };

    setMessages(prev => {
      const updated = { ...prev };
      if (!updated['lovebot']) updated['lovebot'] = [];
      updated['lovebot'].push(userMsg);
      saveMessagesToStorage(updated);
      return updated;
    });

    // Refocus text input field to keep the keyboard open
    if (messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current.focus();
      }, 50);
    }

    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50);

    setOtherTyping(true);

    try {
      const currentHistory = messages['lovebot'] || [];
      const botResponseText = await getLoveBotResponse(textToSend, currentHistory);

      const botMsg = {
        id: botMsgId,
        localId: botMsgId,
        sender: 'jerry Bot',
        senderId: 'lovebot',
        receiverId: user._id,
        text: botResponseText,
        timestamp: formatTime(new Date()),
        date: formatDate(new Date()),
        createdAt: new Date().toISOString(),
        read: true
      };

      setMessages(prev => {
        const updated = { ...prev };
        if (!updated['lovebot']) updated['lovebot'] = [];
        updated['lovebot'].push(botMsg);
        saveMessagesToStorage(updated);
        return updated;
      });

      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error('Error fetching bot response:', err);
    } finally {
      setOtherTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedUser || !user || !user._id) return;

    if (selectedUser.isBot) {
      handleSendBotMessage();
      return;
    }

    if (!socket) return;

    moveChatToTop(selectedUser._id);

    // Build text payload. If replying to a mood, embed a small JSON marker at the start of the text.
    let textToSend = message.trim();

    // Enforce social media link/ID restrictions
    const domainPattern = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am|ig\.me|facebook\.com|fb\.com|fb\.me|x\.com|twitter\.com|threads\.net)\b/i;
    const platformPattern = /(?:instagram|facebook|threads|twitter|facbook|threat)\s*(?:id|username|profile|handle|link)?\s*[:@\s-]\s*([a-z0-9_.-]+)/i;

    if (domainPattern.test(textToSend) || platformPattern.test(textToSend)) {
      textToSend = "Social media links are restricted";
    }
    if (replyMetadata) {
      try {
        const markerJson = JSON.stringify({
          type: replyMetadata.type || 'mood_reply',
          originalContent: String(replyMetadata.originalContent || ''),
          originalType: replyMetadata.originalType || 'text',
          moodId: replyMetadata.moodId || null,
          timestamp: replyMetadata.timestamp || null
        });
        textToSend = `${REPLY_MARKER_START}${markerJson}${REPLY_MARKER_END}${textToSend}`;
      } catch (e) {
        // fallback: don't block sending if JSON fails
        console.warn('Failed to serialize reply metadata', e);
      }
    }

    // Detect YouTube link and prepare a lightweight preview object (similar to WhatsApp preview)
    const extractYouTubeId = (url) => {
      if (!url) return null;
      // common YouTube URL formats
      const re = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
      const m = url.match(re);
      return m ? m[1] : null;
    };

    const youTubeId = extractYouTubeId(textToSend);

    const msgId = generateUniqueId();
    const newMessage = {
      id: msgId,
      text: textToSend,
      senderId: user._id,
      senderUsername: user.username,
      receiverId: selectedUser._id,
      receiverUsername: selectedUser.username,
      roomId: [user._id, selectedUser._id].sort().join('-'),
      timestamp: new Date().toISOString()
      // NOTE: we intentionally embed reply metadata into text so server forwards it reliably
    };

    // If it's a YouTube link, attach a small `youtube` preview object but keep `text` unchanged.
    if (youTubeId) {
      try {
        newMessage.youtube = {
          videoId: youTubeId,
          url: textToSend,
          thumbnail: `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${youTubeId}`
        };
        newMessage.type = 'youtube';
      } catch (e) {
        console.warn('Failed to attach YouTube preview', e);
      }
    }

    // Emit message to server
    socket.emit('send_message', newMessage);

    // Add to local messages for sender's view (store parsed replyTo separately for UI)
    setMessages(prev => {
      const updated = { ...prev };
      if (!updated[selectedUser._id]) updated[selectedUser._id] = [];

      // Extract and clean the reply markers from text
      const { replyObj: localReplyTo, cleanText: displayText } = extractAndCleanReplyMarkers(textToSend);

      const localEntry = {
        id: msgId,
        localId: msgId,
        sender: 'You',
        senderId: user._id,
        receiverId: selectedUser._id,
        text: displayText,
        replyTo: localReplyTo,
        timestamp: formatTime(new Date()),
        date: formatDate(new Date()),
        createdAt: new Date().toISOString(),
        read: false,
        readAt: null
      };

      // If we created a YouTube preview, copy that into the local entry so UI can render it immediately
      if (newMessage.youtube) {
        localEntry.youtube = { ...newMessage.youtube };
        localEntry.type = 'youtube';
      }

      updated[selectedUser._id].push(localEntry);
      return updated;
    });

    // Clear message + reply metadata after sending
    setMessage('');
    setReplyMetadata(null);

    // Refocus text input field to keep the keyboard open
    if (messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current.focus();
      }, 50);
    }

    // Scroll to bottom after sending
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }

    // Trigger Pop Animation on send if wish keywords detected
    const wishType = detectWishType(message);
    if (wishType) {
      playedWishesRef.current.add(msgId);
      setTimeout(() => triggerPopAnimation(wishType), 100);
    }

    // Trigger Heart Animation on send if love/like keywords detected
    if (detectHeartKeyword(message)) {
      playedWishesRef.current.add(msgId);
      setTimeout(() => triggerHeartAnimation(msgId), 100);
    }
  };

  const sendGameMoveMessage = (newGameData) => {
    if (!selectedUser || !socket || !user || !user._id) return;
    moveChatToTop(selectedUser._id);
    const msgId = generateUniqueId();
    const textToSend = `JUICY_GAME:${JSON.stringify(newGameData)}`;
    const newMessage = {
      id: msgId,
      text: textToSend,
      senderId: user._id,
      senderUsername: user.username,
      receiverId: selectedUser._id,
      receiverUsername: selectedUser.username,
      roomId: [user._id, selectedUser._id].sort().join('-'),
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', newMessage);

    setMessages(prev => {
      const updated = { ...prev };
      if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
      updated[selectedUser._id].push({
        id: msgId,
        localId: msgId,
        sender: 'You',
        senderId: user._id,
        receiverId: selectedUser._id,
        text: textToSend,
        timestamp: formatTime(new Date()),
        date: formatDate(new Date()),
        createdAt: new Date().toISOString(),
        read: false,
        readAt: null
      });
      return updated;
    });

    if (messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  const handleSelectGame = (gameType) => {
    setGameSelectorOpen(false);

    let initialGameData = {};
    if (gameType === 'tictactoe') {
      initialGameData = {
        gameType: 'tictactoe',
        status: 'invited',
        gameId: generateUniqueId(),
        player1: { id: user._id, username: user.username },
        player2: { id: selectedUser._id, username: selectedUser.username }
      };
    } else if (gameType === 'truthordare') {
      initialGameData = {
        gameType: 'truthordare',
        status: 'invited',
        gameId: generateUniqueId(),
        player1: { id: user._id, username: user.username },
        player2: { id: selectedUser._id, username: selectedUser.username }
      };
    } else if (gameType === 'rps') {
      initialGameData = {
        gameType: 'rps',
        status: 'invited',
        gameId: generateUniqueId(),
        player1Id: user._id,
        player2Id: selectedUser._id,
        player1Selected: false,
        player2Selected: false
      };
    }

    sendGameMoveMessage(initialGameData);
  };

  const handleMicClick = () => {
    setIsRecording(true);
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    setMessage(val);

    if (!socket || !selectedUser || !user) return;

    const roomId = [user._id, selectedUser._id].sort().join('-');

    if (val && !isTyping) {
      socket.emit('typing', {
        roomId,
        senderId: user._id
      });
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (val) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          roomId,
          senderId: user._id
        });
        setIsTyping(false);
      }, 2000);
    } else if (isTyping) {
      socket.emit('stop_typing', {
        roomId,
        senderId: user._id
      });
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!socket || !user) return;

    const handleTypingEvent = ({ senderId }) => {
      if (senderId !== user._id) {
        setOtherTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId !== user._id) {
        setOtherTyping(false);
      }
    };

    socket.on('typing', handleTypingEvent);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('typing', handleTypingEvent);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, user]);
  // ...existing code...
  const handleReceiveMessage = useCallback((message) => {
    const msgId = message._id || message.id || String(Date.now());
    const senderId = message.senderId;
    const receiverId = message.receiverId;
    if (!senderId || !receiverId) return;

    // Determine conversation key relative to current user
    let otherId;
    let isSenderCurrentUser = false;

    if (user && String(senderId) === String(user._id)) {
      // This is current user's sent message - use database ID to track read receipts
      isSenderCurrentUser = true;
      otherId = String(receiverId);
    } else {
      // This is a received message
      otherId = String(senderId);
    }

    // Extract reply marker from text if present
    let replyObj = message.replyTo || message.replyMetadata || null;
    let cleanedText = message.text || '';

    // Use helper to parse reply markers if not already provided
    if (!replyObj && cleanedText) {
      const { replyObj: extracted, cleanText: cleaned } = extractAndCleanReplyMarkers(cleanedText);
      if (extracted) {
        replyObj = extracted;
        cleanedText = cleaned;
      }
    }

    // Also normalize if server provided separate replyTo property (best-effort)
    if (!replyObj) {
      let maybe = message.replyTo || message.reply || message.replyMetadata || null;
      if (maybe && typeof maybe === 'string') {
        try { maybe = JSON.parse(maybe); } catch (e) { maybe = { originalContent: maybe }; }
      }
      if (maybe) replyObj = maybe;
    }

    setMessages(prev => {
      const updated = { ...prev };
      if (!updated[otherId]) updated[otherId] = [];

      // For sender's own messages, check if it exists with a local ID and update it with database ID
      if (isSenderCurrentUser) {
        // Try to match by the original message.id (which the client set when sending) against local id or localId
        const originalId = message.id;
        let msgIndex = -1;
        if (originalId) {
          msgIndex = updated[otherId].findIndex(m =>
            String(m.id) === String(originalId) || String(m.localId) === String(originalId)
          );
        }
        // Fallback: match by senderId + receiverId for messages without localId (e.g., images)
        if (msgIndex === -1) {
          msgIndex = updated[otherId].findIndex(m =>
            String(m.senderId) === String(senderId) &&
            String(m.receiverId) === String(receiverId) &&
            m.id !== String(message._id) && // Make sure it's not already the DB ID
            m.id !== msgId
          );
        }

        if (msgIndex !== -1) {
          // Update existing local message with database ID for proper read receipt tracking
          updated[otherId][msgIndex] = {
            ...updated[otherId][msgIndex],
            id: msgId, // Update to database ID
            read: message.read || false,
            readAt: message.readAt || null
          };
          return updated;
        }
      }

      // avoid duplicates by checking local ID, database ID, localId, and content signature
      const isDuplicate = updated[otherId].some(m =>
        (msgId && String(m.id) === String(msgId)) ||
        (message._id && String(m.id) === String(message._id)) ||
        (message.id && String(m.id) === String(message.id)) ||
        (m.localId && (String(m.localId) === String(message.id) || String(m.localId) === String(message._id) || String(m.localId) === String(msgId))) ||
        (m.text && cleanedText && String(m.senderId) === String(senderId) && m.text === cleanedText && Math.abs(new Date(m.createdAt || m.timestamp || 0).getTime() - new Date(message.timestamp || Date.now()).getTime()) < 4000)
      );
      if (!isDuplicate) {
        // Move conversation to top of stable chat list on new message
        moveChatToTop(otherId);

        updated[otherId].push({
          id: msgId,
          sender: message.senderUsername || message.sender || senderId,
          senderId,
          receiverId,
          text: cleanedText,
          image: message.image || '',
          audio: message.audio || '',
          document: message.document || '',
          documentData: message.documentData || '',
          contact: message.contact || null,
          youtube: message.youtube || null,
          type: message.type || (message.youtube ? 'youtube' : null),
          // Attach parsed reply object so UI can render "Replying to ..." for receiver
          replyTo: replyObj || null,
          reactions: message.reactions || [],
          timestamp: formatTime(new Date(message.timestamp || Date.now())),
          date: formatDate(new Date(message.timestamp || Date.now())),
          createdAt: message.timestamp || new Date().toISOString(),
          read: message.read || false,
          readAt: message.readAt || null
        });

        // increment unread if not currently viewing that conversation (only for received messages)
        if (!isSenderCurrentUser && (!selectedUser || String(selectedUser._id) !== otherId)) {
          setUnread(prev => ({ ...prev, [otherId]: (prev[otherId] || 0) + 1 }));

          // Show WhatsApp style top card banner
          const senderUser = dbFriendsRef.current.find(f => String(f._id) === String(otherId));
          const senderName = senderUser ? (senderUser.username || senderUser.name) : (message.senderUsername || message.sender || 'New Message');
          const avatar = senderUser ? (senderUser.profilePic || senderUser.image) : (message.profilePic || '');

          let previewText = cleanedText;
          if (message.image) {
            previewText = '📷 Photo';
          } else if (message.audio) {
            previewText = '🎵 Voice message';
          } else if (message.document) {
            previewText = `📄 Document: ${message.document}`;
          } else if (message.contact) {
            previewText = '👤 Contact';
          } else if (cleanedText && cleanedText.startsWith('JUICY_GAME:')) {
            try {
              const jsonStr = cleanedText.indexOf('{') !== -1 ? cleanedText.slice(cleanedText.indexOf('{')) : cleanedText.substring(11);
              const gameData = JSON.parse(jsonStr);
              const gameType = gameData.gameType;
              const gameName = gameType === 'tictactoe'
                ? 'Tic Tac Toe'
                : (gameType === 'truthordare' ? 'Truth or Dare' : 'Rock Paper Scissors');
              previewText = `🎮 Game: ${gameName}`;
            } catch (e) {
              previewText = '🎮 Game';
            }
          }

          setNotifBannerData({
            senderId: otherId,
            senderName,
            text: previewText,
            avatar
          });
          setShowNotifBanner(true);

          if (notifBannerTimerRef.current) {
            clearTimeout(notifBannerTimerRef.current);
          }
          notifBannerTimerRef.current = setTimeout(() => {
            setShowNotifBanner(false);
          }, 4000);
        }

        // Trigger real-time Pop Animation on receive if wish keywords detected and active chat
        if (!isSenderCurrentUser && selectedUser && String(selectedUser._id) === String(senderId)) {
          const wishType = detectWishType(cleanedText);
          if (wishType && !playedWishesRef.current.has(msgId)) {
            playedWishesRef.current.add(msgId);
            setTimeout(() => triggerPopAnimation(wishType), 200);
          }

          // Trigger real-time Heart Animation on receive if love/like keywords detected
          if (detectHeartKeyword(cleanedText) && !playedWishesRef.current.has(msgId)) {
            playedWishesRef.current.add(msgId);
            setTimeout(() => triggerHeartAnimation(msgId), 200);
          }
        }
      }

      return updated;
    });
  }, [selectedUser, user, moveChatToTop]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);
  // ...existing code...



  useEffect(() => {
    // Use socket from context - don't create a new one!
    if (!socket) {
      console.log('⚠️  Socket not ready yet');
      return;
    }

    console.log('📡 [ChatPage] Setting up socket listeners');
    setConnectionStatus(socket.connected ? 'connected' : 'disconnected');

    // Update connection status when socket connects/disconnects
    const handleConnect = () => {
      console.log('✅ [ChatPage] Socket connected to:', socket.id);
      setConnectionStatus('connected');
    };

    const handleConnectError = (error) => {
      console.error('❌ [ChatPage] Socket connection error:', error);
      setConnectionStatus('disconnected');
    };

    const handleDisconnect = (reason) => {
      console.log('⚠️  [ChatPage] Socket disconnected:', reason);
      setConnectionStatus('disconnected');
    };

    const handleReceiveMessageWrapper = (message) => {
      handleReceiveMessage(message);

      // Emit read receipt to sender
      if (message._id && message.senderId && user && String(message.receiverId) === String(user._id)) {
        setTimeout(() => {
          socket.emit('mark_message_read', {
            messageId: message._id,
            senderId: message.senderId
          });
        }, 500); // Small delay to ensure message is processed
      }
    };

    // listen for server delete (supporting WhatsApp style deletion)
    const handleServerDelete = ({ id, deletedForEveryone }) => {
      if (!id) return;
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (deletedForEveryone) {
            updated[key] = updated[key].map(m =>
              String(m.id) === String(id)
                ? {
                  ...m,
                  originalText: m.text || (m.image ? '📷 Photo' : m.audio ? '🎵 Voice message' : m.document ? `📄 ${m.document}` : ''),
                  text: (String(m.senderId) === String(user?._id) || m.sender === 'You')
                    ? 'You deleted this message'
                    : 'This message was deleted',
                  type: 'deleted',
                  deletedForEveryone: true,
                  image: '',
                  audio: '',
                  document: '',
                  documentData: '',
                  contact: null,
                  youtube: null
                }
                : m
            );
          } else {
            updated[key] = updated[key].filter(m => String(m.id) !== String(id));
          }
        });
        return updated;
      });
    };

    // Listen for server message edits
    const handleMessageEdited = ({ messageId, newText }) => {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(msg =>
            (msg.id === messageId || String(msg.id) === String(messageId))
              ? { ...msg, text: newText, edited: true }
              : msg
          );
        });
        return updated;
      });
    };

    // Listen for read receipts from receiver
    const handleMessageRead = ({ messageId }) => {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(msg =>
            (msg.id === messageId || msg.id === String(messageId) || String(msg.id) === String(messageId))
              ? { ...msg, read: true, readAt: new Date() }
              : msg
          );
        });
        return updated;
      });
    };

    // Listen for real-time emoji reactions
    const handleMessageReacted = ({ messageId, reactions }) => {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(msg =>
            (msg.id === messageId || String(msg.id) === String(messageId))
              ? { ...msg, reactions: reactions || [] }
              : msg
          );
        });
        return updated;
      });
    };

    // Listen for friend requests in real-time
    const handleFriendRequestReceived = (request) => {
      if (!request) return;
      const currentUserId = user && user._id ? String(user._id) : localStorage.getItem('userId');
      if (request.receiverId && currentUserId && String(request.receiverId) !== currentUserId) {
        return; // Ignore if request is intended for another user
      }
      const reqSenderId = String(request.senderId || request.from || request._id || request);
      if (!reqSenderId || (currentUserId && reqSenderId === currentUserId)) return;

      // Check if already friends or blocked
      const isFriend = Array.isArray(dbFriends) && dbFriends.some(f => String(f._id || f.friendId || f) === reqSenderId);
      if (isFriend) return;

      setFriendRequestsList(prev => {
        const exists = (prev || []).some(r => {
          const sId = String(r.senderId || r.from || r._id || r);
          return sId === reqSenderId;
        });
        if (exists) return prev;
        return [request, ...(prev || [])];
      });
    };

    const handleLogoutDevice = (data) => {
      const currentToken = localStorage.getItem('token');
      if (data && data.token === currentToken) {
        toast.error('This device has been remotely unlinked.');
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('profileImage');
        if (typeof window !== 'undefined' && window.Capacitor) {
          const { AudioRoute } = window.Capacitor.Plugins || {};
          if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
            AudioRoute.clearSession().catch(() => { });
          }
        }
        socket.disconnect();
        setTimeout(() => { window.location.href = "/signin"; }, 500);
      }
    };

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleReceiveMessageWrapper);
    socket.on('delete_message', handleServerDelete);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_read', handleMessageRead);
    socket.on('message_reacted', handleMessageReacted);
    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('logout_device', handleLogoutDevice);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message', handleReceiveMessageWrapper);
      socket.off('delete_message', handleServerDelete);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_read', handleMessageRead);
      socket.off('message_reacted', handleMessageReacted);
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('logout_device', handleLogoutDevice);
    };
  }, [socket, handleReceiveMessage, user]);

  useEffect(() => {
    if (!socket || !user || !selectedUser) return;
    const roomId = [user._id, selectedUser._id].sort().join('-');
    // Join conversation chat room via join_chat_room to avoid polluting online status tracking
    socket.emit('join_chat_room', { userId: user._id, chatWithId: selectedUser._id });

    return () => {
      socket.emit('leave_room', roomId);
    };
  }, [socket, user, selectedUser]);

  useEffect(() => {
    if (!socket || !user || !user._id) return;
    socket.emit('join_room', user._id, user.username);
  }, [socket, user]);

  useEffect(() => {
    if (!selectedUser) {
      setMessages(prev => {
        const updated = { ...prev };
        return updated;
      });
    } else if (user && selectedUser._id) {
      // Fetch historical messages from database when conversation is opened
      const fetchHistoricalMessages = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/messages/${user._id}/${selectedUser._id}`
          );
          if (response.ok) {
            const dbMessages = await response.json();

            setMessages(prev => {
              const updated = { ...prev };
              const userId = String(selectedUser._id);

              const mappedDbMessages = dbMessages.map(msg => {
                const senderId = String(msg.senderId);
                let replyObj = null;
                let cleanText = msg.text || '';

                if (cleanText.startsWith(REPLY_MARKER_START)) {
                  const { replyObj: extracted, cleanText: cleaned } = extractAndCleanReplyMarkers(cleanText);
                  if (extracted) {
                    replyObj = extracted;
                    cleanText = cleaned;
                  }
                }

                return {
                  id: String(msg._id),
                  sender: msg.senderUsername || senderId,
                  senderId: senderId,
                  receiverId: String(msg.receiverId),
                  text: msg.deletedForEveryone
                    ? (String(senderId) === String(user?._id) ? 'You deleted this message' : 'This message was deleted')
                    : cleanText,
                  image: msg.image || '',
                  audio: msg.audio || '',
                  youtube: msg.youtube || null,
                  type: msg.type || (msg.youtube ? 'youtube' : null),
                  document: msg.document || '',
                  documentData: msg.documentData || '',
                  contact: msg.contact || null,
                  replyTo: replyObj,
                  read: msg.read || false,
                  readAt: msg.readAt || null,
                  reactions: msg.reactions || [],
                  timestamp: formatTime(new Date(msg.timestamp)),
                  date: formatDate(new Date(msg.timestamp)),
                  createdAt: msg.timestamp,
                  deletedForEveryone: msg.deletedForEveryone || false,
                  originalText: msg.originalText || ''
                };
              });

              const dbMessagesMap = new Map(mappedDbMessages.map(m => [m.id, m]));
              const localMessages = updated[userId] || [];
              const merged = [...mappedDbMessages];

              localMessages.forEach(localMsg => {
                const isTempId = !/^[0-9a-fA-F]{24}$/.test(String(localMsg.id));
                if (isTempId && !dbMessagesMap.has(localMsg.id)) {
                  merged.push(localMsg);
                }
              });

              merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              updated[userId] = merged;
              return updated;
            });
          }
        } catch (err) {
          console.warn('Failed to fetch historical messages:', err);
        }
      };

      fetchHistoricalMessages();
    }
  }, [selectedUser, user]);

  // Auto-scroll to bottom of message list when chat opens or new message is added
  const prevMessagesLengthRef = useRef(0);

  // Scroll to bottom when entering a chat (instant, like WhatsApp)
  useEffect(() => {
    if (!selectedUser) {
      prevMessagesLengthRef.current = 0;
      return;
    }
    prevMessagesLengthRef.current = 0; // reset so new-message effect triggers on open
    const t = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
      } else if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 80);
    return () => clearTimeout(t);
  }, [selectedUser]);

  // Scroll to bottom when a new message arrives (smooth)
  useEffect(() => {
    if (!selectedUser) return;
    const currentMessages = messages[selectedUser._id] || [];
    const currentLength = currentMessages.length;
    if (currentLength > prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = currentLength;
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } else {
      prevMessagesLengthRef.current = currentLength;
    }
  }, [selectedUser, messages]);

  // Mark all unread messages as read when conversation is opened
  useEffect(() => {
    if (!selectedUser || !user || !socket) return;

    const unreadMessages = (messages[selectedUser._id] || []).filter(
      msg =>
        String(msg.senderId) === String(selectedUser._id) &&
        !msg.read
    );

    if (unreadMessages.length > 0) {
      // Check if any unread message contains celebratory wish keywords or love/like keywords to auto-trigger pop/heart animation
      let firstWishType = null;
      const heartTriggerIds = [];
      for (const msg of unreadMessages) {
        if (msg.text) {
          const wishType = detectWishType(msg.text);
          if (wishType && !playedWishesRef.current.has(msg.id)) {
            playedWishesRef.current.add(msg.id);
            firstWishType = wishType;
          }
          if (detectHeartKeyword(msg.text) && !playedWishesRef.current.has(msg.id)) {
            playedWishesRef.current.add(msg.id);
            heartTriggerIds.push(msg.id);
          }
        }
      }
      if (firstWishType) {
        setTimeout(() => triggerPopAnimation(firstWishType), 400);
      }
      if (heartTriggerIds.length > 0) {
        heartTriggerIds.forEach(id => {
          setTimeout(() => triggerHeartAnimation(id), 400);
        });
      }

      // Mark all unread messages as read in local state
      setMessages(prev => {
        const updated = { ...prev };
        const userId = String(selectedUser._id);

        if (updated[userId]) {
          updated[userId] = updated[userId].map(msg =>
            String(msg.senderId) === String(selectedUser._id) && !msg.read
              ? { ...msg, read: true, readAt: new Date() }
              : msg
          );
        }

        return updated;
      });

      // Emit read receipts to sender for all unread messages
      unreadMessages.forEach(msg => {
        socket.emit('mark_message_read', {
          messageId: msg.id,
          senderId: msg.senderId
        });
      });
    }
  }, [selectedUser, user, socket]);

  useEffect(() => {
    if (user && user._id) {
      console.log('Logged-in user ID:', user._id);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (ids) => {
      console.log('📡 [Socket] Received online_users:', ids);
      const stringIds = ids.map(String);
      console.log('✅ [State] Setting onlineUserIds:', stringIds);
      setOnlineUserIds((prevOnlineIds) => {
        const now = new Date().toISOString();
        setLastSeenTimes((prevLastSeen) => {
          const updated = { ...prevLastSeen };
          prevOnlineIds.forEach((id) => {
            if (!stringIds.includes(id)) {
              updated[id] = now;
            }
          });
          stringIds.forEach((id) => {
            if (updated[id]) {
              delete updated[id];
            }
          });
          return updated;
        });
        return stringIds;
      });
    };

    socket.on('online_users', handleOnlineUsers);

    // 🟢 CRITICAL FIX: Request current online users on mount/reconnect
    // This ensures we always have the latest list even if initial broadcast was missed
    socket.emit('request_online_users');
    console.log('🔄 [Client] Requested current online users from server');

    return () => socket.off('online_users', handleOnlineUsers);
  }, [socket]);

  // Monitor network status and handle reconnection
  useEffect(() => {
    if (!socket) return;

    console.log('🌐 Network Status Changed:', {
      isOnline,
      networkType,
      isConnecting,
      socketConnected: socket?.connected
    });

    if (isOnline && isConnecting && socket && !socket.connected) {
      console.log('🔌 Network restored! Attempting to reconnect socket...');
      socket.connect();
    }

    if (!isOnline && socket && socket.connected) {
      console.log('📡 Network lost - waiting for reconnection...');
    }
  }, [isOnline, isConnecting, socket]);

  // Update mood countdown every minute
  /* useEffect(() => {
    if (!viewingMood) return;
    const timer = setInterval(() => {
      setViewingMood(prev => ({ ...prev })); // trigger re-render to update countdown
    }, 60000); // update every 60 seconds
    return () => clearInterval(timer);
  }, [viewingMood]); */

  // Build the known-friend IDs set for quick lookup
  const friendIdSet = new Set(Array.isArray(dbFriends) ? dbFriends.map(f => String(f._id)) : []);

  // Derive lockedSet of gesture-locked contact IDs
  const savedGesturesStr = localStorage.getItem('juicy_contact_gestures');
  let gestureLockedUserIds = [];
  if (savedGesturesStr) {
    try {
      gestureLockedUserIds = Object.keys(JSON.parse(savedGesturesStr));
    } catch (e) {
      console.error('Failed to parse gestures:', e);
    }
  }
  const lockedSet = new Set(gestureLockedUserIds);

  // Derive 'ghost' entries for any incoming conversation from an unknown sender
  // (i.e. messages[senderId] exists but senderId is not in dbFriends)
  // This lets User2 see and open chats from User1 even if User2 hasn't added User1.
  const unknownSenderEntries = Object.keys(messages)
    .filter(otherId => otherId !== 'lovebot' && !friendIdSet.has(otherId))
    .filter(otherId => {
      const conv = messages[otherId] || [];
      // Only show if there is at least one message received FROM that sender
      return conv.some(m => m.senderId && String(m.senderId) !== String(user?._id));
    })
    .map(otherId => {
      const conv = messages[otherId] || [];
      // Use sender info from the most recent message they sent
      const incoming = conv.filter(m => m.senderId && String(m.senderId) !== String(user?._id));
      const latest = incoming[incoming.length - 1] || conv[conv.length - 1] || {};
      return {
        _id: otherId,
        username: latest.sender || latest.senderUsername || 'Unknown',
        profilePic: latest.profilePic || '',
        online: onlineUserIds.includes(otherId),
        _isUnknownSender: true // flag for display differentiation if needed
      };
    });

  // Sync dbFriends and unknownSenderEntries into orderedChatIds without altering existing relative order
  useEffect(() => {
    if (!Array.isArray(dbFriends) && unknownSenderEntries.length === 0) return;

    setOrderedChatIds(prev => {
      const currentSet = new Set(prev.map(id => String(id)));
      const newIds = [];

      if (Array.isArray(dbFriends)) {
        dbFriends.forEach(f => {
          if (f && f._id) {
            const idStr = String(f._id);
            if (!currentSet.has(idStr)) {
              currentSet.add(idStr);
              newIds.push(idStr);
            }
          }
        });
      }

      unknownSenderEntries.forEach(u => {
        if (u && u._id) {
          const idStr = String(u._id);
          if (!currentSet.has(idStr)) {
            currentSet.add(idStr);
            newIds.push(idStr);
          }
        }
      });

      if (newIds.length === 0) return prev;
      const next = [...prev, ...newIds];
      const currentUserId = localStorage.getItem('userId') || (user && user._id);
      if (currentUserId) {
        try {
          localStorage.setItem(`juicy_chat_order_${currentUserId}`, JSON.stringify(next));
        } catch (e) { }
      }
      return next;
    });
  }, [dbFriends, unknownSenderEntries, user]);

  // Stable WhatsApp-style chat list: derived strictly from orderedChatIds
  const sortedMembers = React.useMemo(() => {
    const membersMap = new Map();

    if (Array.isArray(dbFriends)) {
      dbFriends.forEach(f => {
        if (f && f._id) {
          const idStr = String(f._id);
          membersMap.set(idStr, {
            ...f,
            online: onlineUserIds.includes(idStr)
          });
        }
      });
    }

    unknownSenderEntries.forEach(u => {
      if (u && u._id) {
        const idStr = String(u._id);
        if (!membersMap.has(idStr)) {
          membersMap.set(idStr, {
            ...u,
            online: onlineUserIds.includes(idStr)
          });
        }
      }
    });

    const result = [];
    const addedSet = new Set();

    // 1. Add members following the exact sequence in orderedChatIds
    orderedChatIds.forEach(id => {
      const idStr = String(id);
      if (membersMap.has(idStr) && !lockedSet.has(idStr) && !addedSet.has(idStr)) {
        result.push(membersMap.get(idStr));
        addedSet.add(idStr);
      }
    });

    // 2. Fallback: append any remaining members in membersMap not yet in orderedChatIds
    membersMap.forEach((member, idStr) => {
      if (!lockedSet.has(idStr) && !addedSet.has(idStr)) {
        result.push(member);
        addedSet.add(idStr);
      }
    });

    return result;
  }, [orderedChatIds, dbFriends, unknownSenderEntries, onlineUserIds, lockedSet]);

  // filteredMembers: derived from sortedMembers so search also finds unknown senders
  const filteredMembers = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sortedMembers.filter((member) => {
      const name = member.username || member.name || '';
      return typeof name === 'string' && name.toLowerCase().includes(term);
    });
  }, [sortedMembers, searchTerm]);

  // Initialize video call hook (moved below `iceServers` declaration)

  // Initialize call management hook and handlers
  const {
    videoCall,
    initiateCallHandler,
    handleCallEnd,
    answerCallHandler
  } = useInitializeCalls(socket, user, selectedUser, dbFriends, setCallLogs);

  useEffect(() => {
    videoCallRef.current = videoCall;
  }, [videoCall]);

  // Auto-answer calls accepted from background
  useEffect(() => {
    if (videoCall && videoCall.receivingCall && videoCall.callerSignal) {
      const pendingStr = sessionStorage.getItem('pendingCallAccept');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          const activeCallerId = videoCall.call?.from || videoCall.callerId;
          if (String(pending.senderId) === String(activeCallerId)) {
            console.log('🚀 Auto-answering call accepted from background...');
            sessionStorage.removeItem('pendingCallAccept');
            answerCallHandler();
          }
        } catch (err) {
          console.error('Error parsing pendingCallAccept:', err);
        }
      }
    }
  }, [videoCall, answerCallHandler]);

  // Auto-open conversation from message notification click (cold-boot)
  // Reads from localStorage (survives app kill) — written by MainActivity.injectPendingChatNavigation()
  // Also still supports legacy sessionStorage path for compatibility
  useEffect(() => {
    const pendingStr = localStorage.getItem('pendingNotification') || sessionStorage.getItem('pendingNotification');
    if (pendingStr && (hasLoadedFriends || (dbFriends && dbFriends.length > 0))) {
      try {
        const pending = JSON.parse(pendingStr);
        console.log('📬 ChatPage: Processing pending message notification for senderId:', pending.senderId);

        // Find the friend in our friends list
        const targetFriend = dbFriends && dbFriends.find(f => String(f._id) === String(pending.senderId));

        if (targetFriend) {
          console.log('✅ ChatPage: Found friend in dbFriends, auto-selecting conversation:', targetFriend.username);
          openChatNormally(targetFriend);
          localStorage.removeItem('pendingNotification');
          sessionStorage.removeItem('pendingNotification');
        } else {
          // If not in friends list, fetch details from backend
          console.log('⚠️ ChatPage: Friend not in dbFriends, fetching user details...');
          fetch(`${API_BASE_URL}/api/user/${pending.senderId}`)
            .then(res => res.json())
            .then(fetchedUser => {
              if (fetchedUser && fetchedUser._id) {
                openChatNormally(fetchedUser);
              } else {
                openChatNormally({
                  _id: pending.senderId,
                  username: pending.senderName || 'Chat',
                  profilePic: ''
                });
              }
              localStorage.removeItem('pendingNotification');
              sessionStorage.removeItem('pendingNotification');
            })
            .catch(err => {
              console.error('Failed to fetch user details:', err);
              openChatNormally({
                _id: pending.senderId,
                username: pending.senderName || 'Chat',
                profilePic: ''
              });
              localStorage.removeItem('pendingNotification');
              sessionStorage.removeItem('pendingNotification');
            });
        }
      } catch (err) {
        console.error('Error handling pendingNotification:', err);
        localStorage.removeItem('pendingNotification');
        sessionStorage.removeItem('pendingNotification');
      }
    }
  }, [dbFriends, hasLoadedFriends]);

  // Handle background tap events (warm boot) when ChatPage is already mounted
  useEffect(() => {
    const handleOpenChatNotif = (e) => {
      const data = e.detail;
      if (data && data.senderId) {
        console.log('📬 ChatPage: Received custom openChatNotification event:', data);
        const targetFriend = dbFriends && dbFriends.find(f => String(f._id) === String(data.senderId));
        if (targetFriend) {
          openChatNormally(targetFriend);
        } else {
          fetch(`${API_BASE_URL}/api/user/${data.senderId}`)
            .then(res => res.json())
            .then(fetchedUser => {
              if (fetchedUser && fetchedUser._id) {
                openChatNormally(fetchedUser);
              } else {
                openChatNormally({
                  _id: data.senderId,
                  username: data.senderName || 'Chat',
                  profilePic: ''
                });
              }
            })
            .catch(err => {
              console.error('Failed to fetch user details on warm event:', err);
              openChatNormally({
                _id: data.senderId,
                username: data.senderName || 'Chat',
                profilePic: ''
              });
            });
        }
      }
    };
    window.addEventListener('openChatNotification', handleOpenChatNotif);
    return () => window.removeEventListener('openChatNotification', handleOpenChatNotif);
  }, [dbFriends]);

  useEffect(() => {
    if (!socket) return;
    const handleUsersInChat = (data) => setUsersInChat(data);
    socket.on('users_in_chat', handleUsersInChat);
    return () => socket.off('users_in_chat', handleUsersInChat);
  }, [socket]);

  useEffect(() => {
    if (!socket || !user || !selectedUser) return;
    socket.emit('in_chat', { userId: user._id, chatWith: selectedUser._id });
    return () => {
      socket.emit('left_chat', { userId: user._id });
    };
  }, [socket, user, selectedUser]);



  // Note: handlePlayAudio and handlePauseAudio have been moved to VoiceMessagePlayer inside VoiceMessage.js

  const handleSaveImage = (imageUrl) => {
    setSavedImages(prev => [...prev, imageUrl]);
    // Prevent auto-deletion for saved images
    setMessages(prev => {
      const updated = { ...prev };
      if (updated[selectedUser._id]) {
        updated[selectedUser._id] = updated[selectedUser._id].map(msg => {
          if (msg.image === imageUrl) {
            return { ...msg, ephemeral: false };
          }
          return msg;
        });
      }
      return updated;
    });
  };

  const handleDeleteImage = (msgId, userId) => {
    if (!msgId || !userId) return;

    setMessages(prev => {
      const updated = { ...prev };
      if (updated[userId]) updated[userId] = updated[userId].filter(msg => msg.id !== msgId);
      return updated;
    });

    // Also remove from saved images if it was saved
    if (selectedUser && selectedUser._id === userId) {
      const message = messages[userId]?.find(msg => msg.id === msgId);
      if (message?.image) {
        setSavedImages(prev => prev.filter(img => img !== message.image));
      }
    }
  };

  const handleImageClick = (imageUrl) => {
    setFullScreenImage(imageUrl);
  };

  // view-once handler
  const handleViewImage = (msg) => {
    if (!msg || !msg.image) return;

    setFullScreenImage({
      src: msg.image,
      id: msg.id,
      roomId: [user._id, selectedUser._id].sort().join('-')
    });
  };

  const handleCloseFullScreen = () => {
    setFullScreenImage(null);
    setImgZoom(1);
    setImgPos({ x: 0, y: 0 });
  }

  // Attach non-passive wheel listener for zoom (fixes passive event listener error)
  useEffect(() => {
    const el = imgZoomContainerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      setImgZoom(prev => {
        const next = prev + (e.deltaY < 0 ? 0.2 : -0.2);
        const clamped = Math.min(Math.max(next, 1), 5);
        if (clamped === 1) setImgPos({ x: 0, y: 0 });
        return clamped;
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  });

  const compressImage = (dataUrl, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  // Image sending (file or dataURL)
  const handleSendImage = (fileOrDataUrl, overrideUser = null) => {
    const targetUser = overrideUser || selectedUser;
    if (!targetUser || !socket || !user) return;
    moveChatToTop(targetUser._id);
    const sendDataUrl = (dataUrl) => {
      const msgId = generateUniqueNumericId();
      const newMessage = {
        id: msgId,
        senderId: user._id,
        senderUsername: user.username,
        receiverId: targetUser._id,
        receiverUsername: targetUser.username,
        roomId: [user._id, targetUser._id].sort().join('-'),
        image: dataUrl,
        timestamp: Date.now()
      };
      socket.emit('send_message', newMessage);

      setMessages(prev => {
        const updated = { ...prev };
        if (!updated[targetUser._id]) updated[targetUser._id] = [];
        // append to end
        updated[targetUser._id].push({
          id: msgId,
          localId: msgId,
          sender: 'You',
          senderId: user._id,
          receiverId: targetUser._id,
          image: dataUrl,
          timestamp: formatTime(new Date()),
          date: formatDate(new Date()),
          createdAt: new Date().toISOString()
        });
        return updated;
      });
    };

    if (typeof fileOrDataUrl === 'string') {
      sendDataUrl(fileOrDataUrl);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => sendDataUrl(reader.result);
    reader.readAsDataURL(fileOrDataUrl);
  };

  const handleCaptureClick = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this device');
        return;
      }
      setCaptureFacingMode('user'); // Reset to front camera when first opening
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setCameraStream(stream);
      setShowCamera(true);

      // Wait for the dialog to open before setting video source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error('Error playing video:', err));
        }
      }, 100);

    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please allow camera access.');
    }
  };

  const handleSwitchCaptureCamera = async () => {
    const newFacing = captureFacingMode === 'user' ? 'environment' : 'user';
    setCaptureFacingMode(newFacing);

    // Stop current stream tracks
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      // Request camera with new facing mode and flexible ideal resolutions
      const constraints = {
        video: {
          facingMode: newFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      console.log('🔄 Switching capture camera facingMode:', newFacing, 'with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error('Error playing video:', err));
      }
    } catch (err) {
      console.warn('⚠️ Switch capture camera failed with resolution constraints, retrying with simple facingMode:', err);
      try {
        // Fallback: simple facingMode without resolution parameters to prevent OverconstrainedError
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing }
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error('Error playing video:', err));
        }
      } catch (fallbackErr) {
        console.error('❌ Error switching camera:', fallbackErr);
        alert('Could not switch camera. Device may not support this facing mode.');
      }
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;

    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    setCameraStream(null);
    setShowCamera(false);
    setCapturedImage(imageData);
    setImagePreviewOpen(true);
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowCamera(false);
  };

  const handleFileSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
      setImagePreviewOpen(true);
      // clear input so subsequent captures trigger change
      if (captureInputRef.current) captureInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSendCaptured = () => {
    if (!capturedImage) return;

    if (selectedUser) {
      handleSendImage(capturedImage);
      setImagePreviewOpen(false);
      setCapturedImage(null);
    } else {
      setSelectedShareFriends([]);
      setShareDialogOpen(true);
    }
  };

  const handleConfirmShare = () => {
    if (selectedShareFriends.length === 0) return;

    selectedShareFriends.forEach(friend => {
      handleSendImage(capturedImage, friend);
    });

    setShareDialogOpen(false);
    setImagePreviewOpen(false);
    setCapturedImage(null);
    setSelectedShareFriends([]);
    toast.success(`Sent to ${selectedShareFriends.length} friend${selectedShareFriends.length > 1 ? 's' : ''}`);
  };

  const handleCancelCaptured = () => {
    setImagePreviewOpen(false);
    setCapturedImage(null);
  };

  const handleRetake = () => {
    setImagePreviewOpen(false);
    setCapturedImage(null);
    handleCaptureClick();
  };

  // ensure isInChat is used as the single source of truth for "in a conversation"
  const handleSelectUser = (user) => {
    // Check if a gesture password is set for this user
    const savedGesturesStr = localStorage.getItem('juicy_contact_gestures');
    if (savedGesturesStr) {
      try {
        const savedGestures = JSON.parse(savedGesturesStr);
        if (savedGestures[user._id]) {
          // Yes! This chat is gesture-locked. Show the gesture overlay for this target.
          setGestureUnlockTarget(user);
          setShowGestureOverlay(true);
          return; // Block direct opening!
        }
      } catch (err) {
        console.error('Error parsing gestures:', err);
      }
    }

    openChatNormally(user);
  };

  const openChatNormally = (user) => {
    setSelectedUser(user);
    setIsInChat(true);
    setBottomNav(0);
    setMessages(prev => ({
      ...prev,
      [user._id]: prev[user._id] || []
    }));
    setUnread(prev => ({
      ...prev,
      [user._id]: 0
    }));

    // Add small delay to ensure DOM has updated
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setIsInChat(false); // leaving chat -> show top AppBar again
  };

  // WhatsApp-style back navigation: overlays → open chat → non-chat tab → (exit on chats)
  useEffect(() => {
    // Core back-press logic shared by both native and browser back buttons
    const handleBackPress = (markHandled) => {
      if (fullScreenImage) {
        setFullScreenImage(null);
        markHandled();
      } else if (imagePreviewOpen) {
        setImagePreviewOpen(false);
        markHandled();
      } else if (showCamera) {
        if (cameraStream) {
          try {
            cameraStream.getTracks().forEach(track => track.stop());
          } catch (err) {
            console.warn('Error stopping camera tracks on back press:', err);
          }
          setCameraStream(null);
        }
        setShowCamera(false);
        markHandled();
      } else if (showStickerDialog) {
        setShowStickerDialog(false);
        markHandled();
      } else if (selectedUser) {
        // Inside an open chat → go back to chat list
        handleBackToList();
        markHandled();
      } else if (bottomNav !== 0) {
        // If a modal or subview (such as Theme dialog, Edit Profile, Pattern dialog in Settings) is open,
        // child component's back handler will close it, so do not navigate away from current tab yet.
        const isModalOrSubViewOpen = Boolean(
          document.querySelector('.MuiDialog-root') ||
          document.querySelector('.MuiModal-root') ||
          document.querySelector('[data-settings-subview="true"]')
        );
        if (isModalOrSubViewOpen) {
          markHandled();
          return;
        }

        // On Calls / Search / Settings tab → go back to Chats tab (like WhatsApp)
        setBottomNav(0);
        markHandled();
      }
      // else: already on Chats with no chat open → let OS handle (app exit)
    };

    // --- Native Android back button via Capacitor App plugin ---
    let capListenerHandle = null;
    try {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        handleBackPress(() => { /* handled — prevent default exit */ });
      }).then(handle => {
        capListenerHandle = handle;
      }).catch(() => { });
    } catch (e) { /* not a Capacitor env */ }

    // --- Legacy hardwareBack event (fallback for custom dispatchers) ---
    const handleHardwareBack = (e) => {
      handleBackPress(() => { e.detail.handled = true; });
    };
    window.addEventListener('hardwareBack', handleHardwareBack);

    // --- Browser / PWA mobile back button via popstate ---
    const handlePopState = (e) => {
      // Re-push state so we always have an entry to pop from
      handleBackPress(() => {
        window.history.pushState({ juicy: true }, '');
      });
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('hardwareBack', handleHardwareBack);
      window.removeEventListener('popstate', handlePopState);
      if (capListenerHandle && typeof capListenerHandle.remove === 'function') {
        capListenerHandle.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, fullScreenImage, imagePreviewOpen, showCamera, cameraStream, showStickerDialog, bottomNav]);

  // Push a fake history state whenever user switches to a non-chat tab so
  // the browser back button has something to pop (needed for PWA/mobile browsers)
  useEffect(() => {
    if (bottomNav !== 0) {
      window.history.pushState({ juicy: true, tab: bottomNav }, '');
    }
  }, [bottomNav]);

  // Gesture Drawing Logic
  useEffect(() => {
    if (showGestureOverlay && gestureCanvasRef.current) {
      const canvas = gestureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ec407a'; // Match Juicee Pink
      ctx.shadowColor = '#ec407a';
      ctx.shadowBlur = 8;
      setGesturePoints([]);
      setGestureStatus(null);
    }
  }, [showGestureOverlay]);

  const clearGestureCanvas = () => {
    const canvas = gestureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setGesturePoints([]);
    setGestureStatus(null);
  };

  const getCanvasTouchPos = (canvas, touchEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touchEvent.touches[0].clientX - rect.left,
      y: touchEvent.touches[0].clientY - rect.top
    };
  };

  const handleGestureStart = (e) => {
    const canvas = gestureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();

    let pos;
    if (e.touches) {
      e.preventDefault();
      pos = getCanvasTouchPos(canvas, e);
    } else {
      const rect = canvas.getBoundingClientRect();
      pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    ctx.moveTo(pos.x, pos.y);
    setIsDrawingGesture(true);
    setGesturePoints([pos]);
    setGestureStatus(null);
  };

  const handleGestureDraw = (e) => {
    if (!isDrawingGesture) return;
    const canvas = gestureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let pos;
    if (e.touches) {
      e.preventDefault();
      pos = getCanvasTouchPos(canvas, e);
    } else {
      const rect = canvas.getBoundingClientRect();
      pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setGesturePoints(prev => [...prev, pos]);
  };

  const handleGestureEnd = () => {
    if (!isDrawingGesture) return;
    setIsDrawingGesture(false);

    if (gesturePoints.length < 5) {
      setGestureStatus({ success: false, message: 'Stroke too short. Try again!' });
      setTimeout(() => setGestureStatus(null), 1500);
      return;
    }

    // Process gesture points
    const normalizedDrawn = normalizeGesture(gesturePoints, 32, 200);

    // Retrieve saved gestures
    const savedGesturesStr = localStorage.getItem('juicy_contact_gestures');
    if (!savedGesturesStr) {
      setGestureStatus({ success: false, message: 'No contact gestures mapped yet!' });
      setTimeout(() => setGestureStatus(null), 2000);
      return;
    }

    let savedGestures;
    try {
      savedGestures = JSON.parse(savedGesturesStr);
    } catch (err) {
      console.error('Error parsing gestures:', err);
      setGestureStatus({ success: false, message: 'Error loading gestures.' });
      return;
    }

    const MATCH_THRESHOLD = 45;

    // Targeted Unlock Mode
    if (gestureUnlockTarget) {
      const targetGesture = savedGestures[gestureUnlockTarget._id];
      if (!targetGesture) {
        setGestureStatus({ success: false, message: 'No gesture set for this contact.' });
        setTimeout(() => {
          setGestureUnlockTarget(null);
          setShowGestureOverlay(false);
          clearGestureCanvas();
        }, 1500);
        return;
      }

      const dist = matchGestures(normalizedDrawn, targetGesture.points);
      if (dist < MATCH_THRESHOLD) {
        setGestureStatus({
          success: true,
          message: `Correct gesture! Unlocking chat with ${gestureUnlockTarget.username || gestureUnlockTarget.name}...`
        });
        setTimeout(() => {
          openChatNormally(gestureUnlockTarget);
          setGestureUnlockTarget(null);
          setShowGestureOverlay(false);
          clearGestureCanvas();
        }, 1200);
      } else {
        setGestureStatus({ success: false, message: 'Incorrect gesture! Try again.' });
        setTimeout(() => {
          clearGestureCanvas();
        }, 1200);
      }
      return;
    }

    // Shortcut Mode (Search all templates)
    let minDistance = Infinity;
    let matchedFriendId = null;

    Object.keys(savedGestures).forEach(friendId => {
      const template = savedGestures[friendId].points;
      const dist = matchGestures(normalizedDrawn, template);
      if (dist < minDistance) {
        minDistance = dist;
        matchedFriendId = friendId;
      }
    });

    if (matchedFriendId && minDistance < MATCH_THRESHOLD) {
      const matchedFriend = dbFriends.find(f => String(f._id) === String(matchedFriendId));
      if (matchedFriend) {
        setGestureStatus({
          success: true,
          message: `Matched with ${matchedFriend.username || matchedFriend.name}! Opening chat...`
        });
        setTimeout(() => {
          openChatNormally(matchedFriend);
          setShowGestureOverlay(false);
          clearGestureCanvas();
        }, 1200);
      } else {
        setGestureStatus({ success: false, message: 'Matched contact not found in friends list.' });
        setTimeout(() => setGestureStatus(null), 2000);
      }
    } else {
      setGestureStatus({ success: false, message: 'No match found. Try again!' });
      setTimeout(() => {
        clearGestureCanvas();
      }, 1200);
    }
  };

  useEffect(() => {
    if (!socket) return;
    // ensure server-side deletion events also mark viewed locally
    const handleDelete = ({ id }) => {
      if (!id) return;
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(k => {
          updated[k] = updated[k].filter(m => m.id !== id);
        });
        return updated;
      });
    };
    socket.on('delete_message', handleDelete);
    return () => socket.off('delete_message', handleDelete);
  }, [socket]);

  useEffect(() => {
    if (!selectedUser) {
      setMessages({});
      setUnread({});
    }
  }, [selectedUser]);

  useEffect(() => {
    if (user && user._id) {
      console.log('Logged-in user ID:', user._id);
    }
  }, [user]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser || !socket || !user) {
      if (event.target) event.target.value = '';
      setShowAttachMenu(false);
      return;
    }

    if (file.type.startsWith('image/')) {
      // Handle image files
      const reader = new FileReader();
      reader.onload = () => {
        handleSendImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle other file types
      const reader = new FileReader();
      reader.onload = () => {
        const msgId = generateUniqueId();
        const newMessage = {
          id: msgId,
          senderId: user._id,
          senderUsername: user.username,
          receiverId: selectedUser._id,
          receiverUsername: selectedUser.username,
          roomId: [user._id, selectedUser._id].sort().join('-'),
          document: file.name,
          documentData: reader.result,
          type: 'document',
          timestamp: Date.now()
        };

        socket.emit('send_message', newMessage);
        moveChatToTop(selectedUser._id);

        setMessages(prev => {
          const updated = { ...prev };
          if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
          updated[selectedUser._id].push({
            id: msgId,
            localId: msgId,
            sender: 'You',
            senderId: user._id,
            receiverId: selectedUser._id,
            document: file.name,
            documentData: reader.result,
            timestamp: formatTime(new Date()),
            date: formatDate(new Date()),
            createdAt: new Date().toISOString()
          });
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset file input and close menu
    if (event.target) event.target.value = '';
    setShowAttachMenu(false);
  };

  // Sticker functions are migrated to Sticker.js

  // Doodle functions are migrated to Drawing.js

  useEffect(() => {
    // Apply saved theme & patterns to documentElement on mount
    const applySavedThemeAndPattern = () => {
      const root = document.documentElement;

      // 1. Theme
      let savedTheme = localStorage.getItem('appTheme');
      if (!savedTheme) {
        const DEFAULT_THEME = {
          id: 'light',
          name: 'Light',
          description: 'Bright and clear with soft pastels',
          colors: { primary: '#f06292', background: '#fff6f8', surface: '#ffffff', text: '#000000' },
          icon: '☀️'
        };
        localStorage.setItem('appTheme', JSON.stringify(DEFAULT_THEME));
        savedTheme = JSON.stringify(DEFAULT_THEME);
      }
      let isDark = false;
      if (savedTheme) {
        try {
          const themeData = JSON.parse(savedTheme);
          root.style.setProperty('--primary-color', themeData.colors.primary);
          root.style.setProperty('--background-color', themeData.colors.background);
          root.style.setProperty('--surface-color', themeData.colors.surface);
          root.style.setProperty('--text-color', themeData.colors.text);

          const bgCol = themeData.colors.background;
          if (bgCol && bgCol.startsWith('#')) {
            try {
              const hex = bgCol.replace('#', '').trim();
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
              isDark = brightness < 128;
            } catch (e) {
              const themeIdStr = (themeData.id || '').toLowerCase();
              isDark = themeIdStr.includes('dark') || themeIdStr.includes('black') || themeIdStr.includes('midnight') || themeIdStr.includes('amoled') || themeIdStr.includes('night');
            }
          } else {
            const themeIdStr = (themeData.id || '').toLowerCase();
            isDark = themeIdStr.includes('dark') || themeIdStr.includes('black') || themeIdStr.includes('midnight') || themeIdStr.includes('amoled') || themeIdStr.includes('night');
          }

          const metaThemeColor = document.querySelector('meta[name="theme-color"]');
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeData.colors.primary);
          }
        } catch (e) {
          console.warn('Error loading theme in ChatPage:', e);
        }
      }
      root.style.setProperty('--pattern-color', isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)');
      setIsDarkTheme(isDark);

      // 2. Pattern
      const savedPattern = localStorage.getItem('appPattern');
      let isWallpaper = false;
      if (savedPattern) {
        try {
          const patternData = JSON.parse(savedPattern);
          isWallpaper = patternData.isWallpaper || patternData.type === 'custom-image' || patternData.type === 'image' ||
            ['sunset', 'aurora', 'magic', 'mint', 'ocean', 'darkness', 'peach'].includes(patternData.id);

          if (patternData.id === 'none' || patternData.id === 'none_image') {
            root.style.setProperty('--background-pattern', 'none');
            root.style.setProperty('--pattern-repeat', 'repeat');
            root.style.setProperty('--pattern-position', 'center');
          } else if (patternData.type === 'custom-image') {
            root.style.setProperty('--background-pattern', `url("${patternData.url}")`);
            root.style.setProperty('--pattern-size', patternData.size || 'cover');
            root.style.setProperty('--pattern-repeat', 'no-repeat');
            root.style.setProperty('--pattern-position', 'center');
          } else if (isWallpaper) {
            root.style.setProperty('--background-pattern', patternData.pattern);
            root.style.setProperty('--pattern-size', patternData.size || 'cover');
            root.style.setProperty('--pattern-repeat', 'no-repeat');
            root.style.setProperty('--pattern-position', 'center');
          } else {
            root.style.setProperty('--background-pattern', patternData.pattern);
            root.style.setProperty('--pattern-size', patternData.size || '20px 20px');
            root.style.setProperty('--pattern-repeat', 'repeat');
            root.style.setProperty('--pattern-position', 'center');
          }
        } catch (e) {
          console.warn('Error loading pattern in ChatPage:', e);
        }
      }

      // 3. Opacity
      const savedOpacity = localStorage.getItem('patternOpacity');
      const parsedPattern = savedPattern ? JSON.parse(savedPattern) : null;
      if (parsedPattern && (parsedPattern.id === 'none' || parsedPattern.id === 'none_image')) {
        root.style.setProperty('--pattern-opacity', '0');
      } else {
        const defaultOpacity = savedOpacity !== null ? parseInt(savedOpacity) : (isWallpaper ? 100 : 5);
        root.style.setProperty('--pattern-opacity', (defaultOpacity / 100).toString());
      }
    };

    applySavedThemeAndPattern();

    const handlePatternChange = (event) => {
      if (event?.detail) {
        setBackgroundPattern(prev => ({ ...prev, ...(typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail) }));
        // Apply the changed pattern to root style immediately
        const root = document.documentElement;
        const patternData = event.detail;
        const isWall = patternData.isWallpaper || patternData.type === 'custom-image' || patternData.type === 'image' ||
          ['sunset', 'aurora', 'magic', 'mint', 'ocean', 'darkness', 'peach'].includes(patternData.id);

        if (patternData.id === 'none' || patternData.id === 'none_image') {
          root.style.setProperty('--background-pattern', 'none');
          root.style.setProperty('--pattern-repeat', 'repeat');
          root.style.setProperty('--pattern-position', 'center');
          root.style.setProperty('--pattern-opacity', '0');
        } else if (patternData.type === 'custom-image') {
          root.style.setProperty('--background-pattern', `url("${patternData.url}")`);
          root.style.setProperty('--pattern-size', patternData.size || 'cover');
          root.style.setProperty('--pattern-repeat', 'no-repeat');
          root.style.setProperty('--pattern-position', 'center');
          const savedOpacity = localStorage.getItem('patternOpacity');
          const opacityVal = savedOpacity !== null ? parseInt(savedOpacity) : 100;
          root.style.setProperty('--pattern-opacity', (opacityVal / 100).toString());
        } else if (isWall) {
          root.style.setProperty('--background-pattern', patternData.pattern);
          root.style.setProperty('--pattern-size', patternData.size || 'cover');
          root.style.setProperty('--pattern-repeat', 'no-repeat');
          root.style.setProperty('--pattern-position', 'center');
          const savedOpacity = localStorage.getItem('patternOpacity');
          const opacityVal = savedOpacity !== null ? parseInt(savedOpacity) : 100;
          root.style.setProperty('--pattern-opacity', (opacityVal / 100).toString());
        } else {
          root.style.setProperty('--background-pattern', patternData.pattern);
          root.style.setProperty('--pattern-size', patternData.size || '20px 20px');
          root.style.setProperty('--pattern-repeat', 'repeat');
          root.style.setProperty('--pattern-position', 'center');

          const savedOpacity = localStorage.getItem('patternOpacity');
          const opacityVal = savedOpacity !== null ? parseInt(savedOpacity) : 5;
          root.style.setProperty('--pattern-opacity', (opacityVal / 100).toString());
        }
      }
    };

    const handleOpacityChange = (event) => {
      if (event?.detail) {
        const root = document.documentElement;
        const opacity = event.detail.opacity !== undefined ? event.detail.opacity : event.detail;
        root.style.setProperty('--pattern-opacity', (opacity / 100).toString());
      }
    };

    window.addEventListener('patternChanged', handlePatternChange);
    window.addEventListener('opacityChanged', handleOpacityChange);

    // load saved pattern (if any)
    try {
      const saved = localStorage.getItem('appPattern');
      if (saved) setBackgroundPattern(prev => ({ ...prev, ...(JSON.parse(saved) || {}) }));
    } catch (e) { /* ignore parse errors */ }

    return () => {
      window.removeEventListener('patternChanged', handlePatternChange);
      window.removeEventListener('opacityChanged', handleOpacityChange);
    };
  }, []);

  useEffect(() => {
    const keys = ['app.primaryColor', 'appPrimaryColor', 'appPrimary', 'primaryColor'];
    let col = null;
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) { col = v; break; }
    }
    if (!col) col = '#ff4d86';

    const hexToRgb = (hex) => {
      const h = hex.replace('#', '').trim();
      const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const bigint = parseInt(full, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r},${g},${b}`;
    };
    try {
      const rgb = hexToRgb(col);
      const root = document.documentElement.style;
      root.setProperty('--app-primary', col);
      root.setProperty('--app-primary-rgb', rgb);
      root.setProperty('--app-primary-06', `rgba(${rgb},0.06)`);
      root.setProperty('--app-primary-08', `rgba(${rgb},0.08)`);
      root.setProperty('--app-primary-20', `rgba(${rgb},0.20)`);
    } catch (e) {
      // fallback - set raw var if parsing fails
      document.documentElement.style.setProperty('--app-primary', col);
    }
  }, []);

  // Background style computed inline where needed

  const inputBarHeight = isMobile ? 72 : 56;
  const topAppBarHeight = (isMobile && !isInChat) ? 120 : 64;
  const bottomNavHeight = 0;

  // Total unread message count across all chats
  const totalUnreadCount = Object.values(unread).reduce((sum, count) => sum + count, 0);


  console.log('dbFriends:', dbFriends || 'undefined');
  console.log('sortedMembers:', sortedMembers || 'undefined');
  console.log('filteredMembers:', filteredMembers || 'undefined');


  // Messages for the currently selected conversation (exclude expired, deduplicate, and sort chronologically)
  const currentConversationMessages = React.useMemo(() => {
    if (!selectedUser || !messages[selectedUser._id]) return [];
    const rawList = messages[selectedUser._id] || [];
    const seenKeys = new Set();
    const deduplicated = [];

    for (const msg of rawList) {
      if (!msg) continue;
      if (isMessageExpired(msg.createdAt || msg.timestamp)) continue;

      const primaryKey = msg.id ? String(msg.id) : '';
      const localKey = msg.localId ? String(msg.localId) : '';

      if (primaryKey && seenKeys.has(primaryKey)) continue;
      if (localKey && seenKeys.has(localKey)) continue;

      const content = msg.text || msg.image || msg.audio || msg.document || '';
      const sender = String(msg.senderId || msg.sender || '');
      const timeSec = Math.floor(new Date(msg.createdAt || msg.timestamp || 0).getTime() / 4000);
      const signature = `${sender}_${content}_${timeSec}`;

      if (content && seenKeys.has(signature)) continue;

      if (primaryKey) seenKeys.add(primaryKey);
      if (localKey) seenKeys.add(localKey);
      if (content) seenKeys.add(signature);

      deduplicated.push(msg);
    }

    return deduplicated.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return timeA - timeB;
    });
  }, [selectedUser, messages]);

  const handleNotifBannerClick = () => {
    if (!notifBannerData) return;
    const senderId = notifBannerData.senderId;
    const senderUser = dbFriends.find(f => String(f._id) === String(senderId)) || {
      _id: senderId,
      username: notifBannerData.senderName,
      name: notifBannerData.senderName,
      profilePic: notifBannerData.avatar
    };

    handleSelectUser(senderUser);
    setShowNotifBanner(false);
    setBottomNav(0);
  };

  // --- KEYBOARD HANDLING ---
  // Monitor Keyboard events (Capacitor Keyboard Plugin)
  useEffect(() => {
    if (!isNativeApp()) return;

    let willShowListener, willHideListener, didShowListener, didHideListener;

    try {
      willShowListener = Keyboard.addListener('keyboardWillShow', (info) => {
        setIsKeyboardOpen(true);
        // Only manually set keyboardHeight if VisualViewport is not active or not resizing WebView
        if (!window.visualViewport) {
          setKeyboardHeight(info.keyboardHeight);
        }
        setTimeout(scrollToBottom, 50);
      });

      willHideListener = Keyboard.addListener('keyboardWillHide', () => {
        setIsKeyboardOpen(false);
        if (!window.visualViewport) {
          setKeyboardHeight(0);
        }
      });

      didShowListener = Keyboard.addListener('keyboardDidShow', () => {
        setTimeout(scrollToBottom, 50);
      });

      didHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setTimeout(scrollToBottom, 50);
      });
    } catch (err) {
      console.warn('Keyboard listeners failed to register:', err);
    }

    return () => {
      if (willShowListener) willShowListener.remove();
      if (willHideListener) willHideListener.remove();
      if (didShowListener) didShowListener.remove();
      if (didHideListener) didHideListener.remove();
    };
  }, [scrollToBottom]);

  // Monitor VisualViewport API resize events (handles Android resizing dynamically and smoothly)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportResize = () => {
      const vv = window.visualViewport;
      const windowHeight = window.innerHeight;

      // If the visual viewport height is smaller than innerHeight, a keyboard is likely open.
      // In a natively resized WebView (adjustResize), windowHeight shrinks, so diff is 0 or very small.
      // In a non-resized WebView (or full screen edge-to-edge), windowHeight is constant, so diff is the keyboard height.
      const diff = windowHeight - vv.height;
      const calculatedKbHeight = diff > 80 ? diff : 0;

      setKeyboardHeight(calculatedKbHeight);

      if (calculatedKbHeight > 0) {
        setTimeout(scrollToBottom, 80);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, [scrollToBottom]);

  // Dynamically calculate and set CSS variables for header and bottom input heights
  useEffect(() => {
    const updateHeights = () => {
      const pane = document.querySelector('.chat-pane-container');
      if (!pane) return;

      const headerEl = headerRef.current || pane.querySelector('.chat-header-fixed');
      const inputEl = inputRef.current || pane.querySelector('.chat-input-bar-container');

      if (headerEl) {
        pane.style.setProperty('--header-height', `${headerEl.offsetHeight}px`);
      }
      if (inputEl) {
        pane.style.setProperty('--input-height', `${inputEl.offsetHeight}px`);
      }
    };

    updateHeights();
    // Schedule short delayed measurements to capture complete DOM layout passes
    const t1 = setTimeout(updateHeights, 50);
    const t2 = setTimeout(updateHeights, 150);
    const t3 = setTimeout(updateHeights, 300);

    window.addEventListener('resize', updateHeights);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeights);
      window.visualViewport.addEventListener('scroll', updateHeights);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateHeights);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeights);
        window.visualViewport.removeEventListener('scroll', updateHeights);
      }
    };
  }, [selectedUser, keyboardHeight]);

  return (
    <>
      <Slide direction="down" in={showNotifBanner} mountOnEnter unmountOnExit>
        <Card
          onClick={handleNotifBannerClick}
          sx={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%) !important',
            width: 'min(92vw, 420px)',
            zIndex: 9999,
            bgcolor: isDarkTheme ? '#1f2c34' : '#ffffff',
            color: isDarkTheme ? '#e9edef' : '#111b21',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            p: 1.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            border: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            '&:hover': {
              transform: 'translateX(-50%) scale(1.02) !important',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
            }
          }}
        >
          {/* Left Side: Avatar */}
          <Avatar
            src={notifBannerData?.avatar}
            sx={{
              width: 44,
              height: 44,
              border: '1.5px solid var(--primary-color, #25D366)'
            }}
          />

          {/* Center: Message Details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {notifBannerData?.senderName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDarkTheme ? '#8696a0' : '#667781',
                  fontSize: '0.72rem',
                  whiteSpace: 'nowrap',
                  ml: 1
                }}
              >
                now
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: isDarkTheme ? '#d1d7db' : '#3b4a54',
                fontSize: '0.85rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.3
              }}
            >
              {notifBannerData?.text}
            </Typography>
          </Box>

          {/* Right: Close Button & Green Dot */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              flexShrink: 0
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#25D366',
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifBanner(false);
              }}
              sx={{
                color: isDarkTheme ? '#8696a0' : '#667781',
                p: 0.25,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Card>
      </Slide>

      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1201,
        bgcolor: '#000',
        pt: 'env(safe-area-inset-top, 24px)',
        display: isMobile && !isInChat ? 'block' : 'none'
      }}>
        <AppBar
          position="static"
          sx={{
            bgcolor: 'var(--surface-color, #fff)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(241,220,220,0.6)',
            // Smooth transitions
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Top Toolbar with Logo and Actions */}
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: { xs: 56, sm: 60, md: 72 },
              px: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 0.5, sm: 1, md: 1.5 },
              gap: { xs: 1, sm: 1.5, md: 2 }
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                userSelect: 'none',
                ml: 0
              }}
            >
              <Box
                component="img"
                src={newJuicyLogo}
                alt="Juicy"
                sx={{
                  height: { xs: 50, sm: 56, md: 62 }, // Slightly larger viewable size
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </Box>

            {/* Right Actions - Perfect gaps */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 0.75, md: 1 }
              }}
            >
              {/* Camera Icon */}
              <IconButton
                key="camera-btn"
                onClick={handleCaptureClick}
                sx={{
                  p: { xs: 1, sm: 1.25, md: 1.5 },
                  color: 'var(--text-color, #000)',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(240, 98, 146, 0.08)',
                    transform: 'scale(1.05)'
                  },
                  '&:active': { transform: 'scale(0.95)' }
                }}
                aria-label="camera"
                size="medium"
              >
                <CameraAltIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />
              </IconButton>

              {/* Search Icon */}
              <IconButton
                key="search-btn"
                onClick={() => { setBottomNav(2); setSelectedUser(null); }}
                sx={{
                  p: { xs: 1, sm: 1.25, md: 1.5 },
                  color: 'var(--text-color, #000)',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(240, 98, 146, 0.08)',
                    transform: 'scale(1.05)'
                  },
                  '&:active': { transform: 'scale(0.95)' }
                }}
                aria-label="search"
                size="medium"
              >
                <SearchIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />
              </IconButton>

              {/* Notification Icon with Badge */}
              <IconButton
                key="notifications-btn"
                onClick={() => { setIsNotificationView(true); setBottomNav(4); setSelectedUser(null); }}
                sx={{
                  p: { xs: 1, sm: 1.25, md: 1.5 },
                  color: pendingIncomingRequests.length > 0 ? '#fff' : 'var(--text-color, #000)',
                  bgcolor: pendingIncomingRequests.length > 0 ? 'var(--primary-color, #f06292)' : 'transparent',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: pendingIncomingRequests.length > 0
                      ? 'var(--primary-color, #e91e63)'
                      : 'rgba(240, 98, 146, 0.08)',
                    transform: 'scale(1.05)'
                  },
                  '&:active': { transform: 'scale(0.95)' }
                }}
                aria-label="friend-requests"
                size="medium"
              >
                <Badge
                  badgeContent={pendingIncomingRequests.length}
                  overlap="circular"
                  invisible={pendingIncomingRequests.length === 0}
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ff1744',
                      color: '#fff',
                      fontWeight: 700,
                      minWidth: 18,
                      height: 18,
                      fontSize: '0.7rem',
                      padding: '0 4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />
                </Badge>
              </IconButton>

              {/* Profile Menu */}
              <IconButton
                key="profile-menu-btn"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  p: { xs: 0.5, sm: 0.75, md: 1 },
                  ml: { xs: 0.25, sm: 0.5, md: 0.75 },
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(240, 98, 146, 0.08)',
                    transform: 'scale(1.05)'
                  },
                  '&:active': { transform: 'scale(0.95)' }
                }}
                aria-label="profile-menu"
                size="medium"
              >
                {user && user.profileImage ? (
                  <Avatar
                    src={user.profileImage.startsWith('data:') ? user.profileImage : `data:image/jpeg;base64,${user.profileImage}`}
                    sx={{
                      width: { xs: 30, sm: 34, md: 38 },
                      height: { xs: 30, sm: 34, md: 38 },
                      border: '2px solid var(--primary-color, #f06292)',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ) : (
                  <MoreVertIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />
                )}
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    bgcolor: 'var(--surface-color, #fff)',
                    color: 'var(--text-color, #000)',
                    mt: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    minWidth: 180,
                    overflow: 'hidden',
                    '& .MuiMenuItem-root': {
                      fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                      py: { xs: 1.25, sm: 1.5, md: 1.75 },
                      px: { xs: 2, sm: 2.5, md: 3 },
                      gap: 1.5,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: 'rgba(240, 98, 146, 0.06)'
                      }
                    }
                  }
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                transitionDuration={200}
              >
                <MenuItem
                  key="account-menu"
                  onClick={() => { setAnchorEl(null); setIsNotificationView(false); setBottomNav(4); }}
                  sx={{ color: 'var(--text-color, #000)' }}
                >
                  <AccountCircleIcon sx={{ fontSize: 20, color: 'var(--primary-color, #f06292)', opacity: 0.8 }} />
                  Account
                </MenuItem>
                <MenuItem
                  key="scanner-menu"
                  onClick={() => { setAnchorEl(null); setScannerOpen(true); }}
                  sx={{ color: 'var(--text-color, #000)' }}
                >
                  <QrCodeScannerIcon sx={{ fontSize: 20, color: 'var(--primary-color, #f06292)', opacity: 0.8 }} />
                  Linked Devices
                </MenuItem>
                <MenuItem
                  key="signout-menu"
                  onClick={() => { setAnchorEl(null); setSignOutDialogOpen(true); }}
                  sx={{ color: 'var(--text-color, #000)' }}
                >
                  <LogoutIcon sx={{ fontSize: 20, color: 'var(--primary-color, #f06292)', opacity: 0.8 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>

          {/* Divider */}
          <Box sx={{
            height: '1px',
            bgcolor: 'rgba(241,220,220,0.4)',
            mx: { xs: 1.5, sm: 2, md: 3 }
          }} />

          {/* Tab Navigation - WhatsApp Style (No Box wrapper, direct in AppBar) */}
          <Tabs
            value={bottomNav}
            onChange={(event, newValue) => { setBottomNav(newValue); }}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
            sx={{
              minHeight: { xs: 44, sm: 48, md: 52 },
              px: { xs: 0.5, sm: 1, md: 2 },
              '& .MuiTabs-flexContainer': {
                justifyContent: 'space-around',
                gap: { xs: 0, sm: 0.5, md: 1 }
              },
              '& .MuiTabs-indicator': {
                height: { xs: 2.5, sm: 3, md: 3 },
                borderRadius: '3px 3px 0 0',
                bgcolor: 'var(--primary-color, #f06292)'
              },
              '& .MuiTab-root': {
                minHeight: { xs: 44, sm: 48, md: 52 },
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.9375rem' },
                fontWeight: 500,
                color: 'var(--text-color, #666)',
                px: { xs: 1, sm: 1.5, md: 2 },
                py: { xs: 1, sm: 1.25, md: 1.5 },
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(240, 98, 146, 0.04)',
                  color: 'var(--primary-color, #f06292)'
                },
                '&.Mui-selected': {
                  fontWeight: 700,
                  color: 'var(--primary-color, #f06292)'
                }
              }
            }}
          >
            <Tab
              value={0}
              key="chats-tab"
              label={
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.4, sm: 0.5, md: 0.75 }
                }}>
                  <Typography
                    component="span"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'inherit',
                      fontSize: 'inherit'
                    }}
                  >
                    Chats
                  </Typography>
                  {totalUnreadCount > 0 && (
                    <Box
                      sx={{
                        bgcolor: 'var(--primary-color, #f06292)',
                        color: '#fff',
                        borderRadius: totalUnreadCount > 99 ? '10px' : '50%',
                        width: totalUnreadCount > 99 ? 'auto' : { xs: 18, sm: 20, md: 22 },
                        height: { xs: 18, sm: 20, md: 22 },
                        px: totalUnreadCount > 99 ? 0.6 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                        fontWeight: 700,
                        minWidth: { xs: 18, sm: 20, md: 22 },
                        boxShadow: '0 2px 4px rgba(240, 98, 146, 0.3)',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </Box>
                  )}
                </Box>
              }
              onClick={() => { setBottomNav(0); handleBackToList(); }}
            />

            <Tab
              value={2}
              key="search-tab"
              label="Search"
              onClick={() => setBottomNav(2)}
            />

            <Tab
              value={1}
              key="calls-tab"
              label="Calls"
              onClick={() => { setBottomNav(1); setSelectedUser(null); }}
            />

            <Tab
              value={3}
              key="settings-tab"
              label="Settings"
              onClick={() => { setBottomNav(3); setSelectedUser(null); }}
            />
          </Tabs>

          {/* Add pulse animation */}
          <Box
            component="style"
            sx={{ display: 'none' }}
          >
            {`
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
        `}
          </Box>
        </AppBar>
      </Box>

      {/* Sign Out Confirmation Dialog */}
      <Dialog
        open={signOutDialogOpen}
        onClose={() => setSignOutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
        PaperProps={{ sx: { backgroundColor: 'var(--surface-color, #ffffff)', color: 'var(--text-color, #000)', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.16)' } }}
      >
        <DialogTitle sx={{ color: 'var(--primary-color)', fontWeight: 700 }}>Sign Out</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1, color: 'var(--text-color, #000)' }}>Are you sure you want to sign out? You will be returned to the sign-in screen.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button key="cancel-btn" onClick={() => setSignOutDialogOpen(false)} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2, borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>Cancel</Button>
          <Button key="signout-btn" onClick={async () => {
            setSignOutDialogOpen(false);
            localStorage.removeItem("userId");
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("profileImage");
            if (typeof window !== 'undefined' && window.Capacitor) {
              const { AudioRoute } = window.Capacitor.Plugins || {};
              if (AudioRoute && typeof AudioRoute.clearSession === 'function') {
                try {
                  await AudioRoute.clearSession();
                } catch (err) {
                  console.warn('Native clearSession error:', err);
                }
              }
            }
            if (socket) socket.disconnect();
            window.location.href = "/signin";
          }} variant="contained" sx={{ bgcolor: '#d32f2f', color: '#ffffff', textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#b71c1c' } }}>Yes, Sign Out</Button>
        </DialogActions>
      </Dialog>

      {/* Linked Devices Scanner Dialog */}
      <Scanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        user={user}
        onUserScanned={handleSelectFromContacts}
      />

      <Box
        sx={{
          height: '100dvh',
          bgcolor: 'var(--background-color, #fff)',
          position: 'relative',
          fontFamily: `'Poppins', sans-serif`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          pt: (isMobile && !isInChat) ? {
            xs: 'calc(101px + env(safe-area-inset-top, 24px))',
            sm: 'calc(109px + env(safe-area-inset-top, 24px))',
            md: 'calc(125px + env(safe-area-inset-top, 24px))'
          } : 0,
          // merge computed background style from theme portion
        }}
      >
        {/* Audio elements for ringtones - always mounted */}
        <audio ref={videoCall.callerAudioRef} src={callerAudioFile} loop />
        <audio ref={videoCall.receiverAudioRef} src={receiverAudioFile} loop />

        <Box
          sx={{
            height: '100%',
            display: 'flex',
            overflow: 'hidden'
          }}
        >
          {!isMobile && (
            <Box sx={{
              width: 64,
              bgcolor: isDarkTheme ? '#202c33' : '#f0f2f5',
              borderRight: isDarkTheme ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2,
              gap: 2,
              height: '100%',
              boxSizing: 'border-box'
            }}>
              {/* TOP ICONS */}
              <IconButton
                key="nav-chats"
                onClick={() => { setBottomNav(0); handleBackToList(); }}
                sx={{
                  color: bottomNav === 0 ? (isDarkTheme ? '#00a884' : '#008069') : (isDarkTheme ? '#aeacb4' : '#54656f'),
                  bgcolor: bottomNav === 0 ? (isDarkTheme ? 'rgba(0, 168, 132, 0.1)' : 'rgba(0, 128, 105, 0.1)') : 'transparent',
                  borderRadius: '12px',
                  p: 1.25,
                  '&:hover': {
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }
                }}
              >
                <Badge
                  badgeContent={totalUnreadCount}
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      minWidth: 16,
                      height: 16,
                      bgcolor: '#00a884',
                      color: '#fff'
                    }
                  }}
                >
                  <SidebarChatIcon />
                </Badge>
              </IconButton>

              <IconButton
                key="nav-phone"
                onClick={() => { setBottomNav(1); setSelectedUser(null); }}
                sx={{
                  color: bottomNav === 1 ? (isDarkTheme ? '#00a884' : '#008069') : (isDarkTheme ? '#aeacb4' : '#54656f'),
                  bgcolor: bottomNav === 1 ? (isDarkTheme ? 'rgba(0, 168, 132, 0.1)' : 'rgba(0, 128, 105, 0.1)') : 'transparent',
                  borderRadius: '12px',
                  p: 1.25,
                  '&:hover': {
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }
                }}
              >
                <SidebarPhoneIcon />
              </IconButton>

              <IconButton
                key="nav-search"
                onClick={() => setBottomNav(2)}
                sx={{
                  color: bottomNav === 2 ? (isDarkTheme ? '#00a884' : '#008069') : (isDarkTheme ? '#aeacb4' : '#54656f'),
                  bgcolor: bottomNav === 2 ? (isDarkTheme ? 'rgba(0, 168, 132, 0.1)' : 'rgba(0, 128, 105, 0.1)') : 'transparent',
                  borderRadius: '12px',
                  p: 1.25,
                  '&:hover': {
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }
                }}
              >
                <SidebarSearchIcon />
              </IconButton>

              <IconButton
                key="nav-settings"
                onClick={() => setBottomNav(3)}
                sx={{
                  color: bottomNav === 3 ? (isDarkTheme ? '#00a884' : '#008069') : (isDarkTheme ? '#aeacb4' : '#54656f'),
                  bgcolor: bottomNav === 3 ? (isDarkTheme ? 'rgba(0, 168, 132, 0.1)' : 'rgba(0, 128, 105, 0.1)') : 'transparent',
                  borderRadius: '12px',
                  p: 1.25,
                  '&:hover': {
                    bgcolor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }
                }}
              >
                <SidebarSettingsIcon />
              </IconButton>

              {/* Spacer */}
              <Box sx={{ flexGrow: 1 }} />

              {/* BOTTOM PROFILE ICON */}
              <IconButton
                key="nav-profile"
                onClick={() => { setIsNotificationView(false); setBottomNav(4); setSelectedUser(null); }}
                sx={{
                  p: 0.5,
                  border: bottomNav === 4 ? `2px solid ${isDarkTheme ? '#00a884' : '#008069'}` : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                {user && user.profileImage ? (
                  <Avatar
                    src={user.profileImage.startsWith('data:') ? user.profileImage : `data:image/jpeg;base64,${user.profileImage}`}
                    sx={{ width: 34, height: 34 }}
                  />
                ) : (
                  <Avatar sx={{ width: 34, height: 34, bgcolor: 'var(--primary-color, #f06292)' }}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                )}
              </IconButton>
            </Box>
          )}

          {/* List/Sidebar Area */}
          {/* On mobile: displayed if bottomNav === 0 AND selectedUser is null */}
          {/* On desktop: always displayed */}
          {(!isMobile || (bottomNav === 0 && !selectedUser)) && (
            <Box
              sx={{
                width: isMobile ? '100%' : `${sidebarWidth}px`,
                minWidth: isMobile ? '100%' : `${sidebarWidth}px`,
                maxWidth: isMobile ? '100%' : `${sidebarWidth}px`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'var(--surface-color, #fff)',
                borderRight: isMobile ? 'none' : (isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1dcdc'),
                overflow: 'hidden'
              }}
            >
              {isMobile ? (
                <ChatList
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  user={user}
                  dbFriends={dbFriends}
                  lockedSet={lockedSet}
                  onlineUserIds={onlineUserIds}
                  socket={socket}
                  handleSelectUser={handleSelectUser}
                  setReplyMetadata={setReplyMetadata}
                  setMessage={setMessage}
                  isMobile={true}
                  filteredMembers={filteredMembers}
                  sortedMembers={sortedMembers}
                  setQuickProfileUser={setQuickProfileUser}
                  formatLastSeen={formatLastSeen}
                  lastSeenTimes={lastSeenTimes}
                  messages={messages}
                  unread={unread}
                  setShowGestureOverlay={setShowGestureOverlay}
                  setContactSyncDialogOpen={setContactSyncDialogOpen}
                  bottomNav={bottomNav}
                  showChatList={true}
                  selectedUser={selectedUser}
                  showFinder={showFinder}
                  setShowFinder={setShowFinder}
                  handleDeleteChats={handleDeleteChats}
                  onSignOut={() => setSignOutDialogOpen(true)}
                />
              ) : (
                // Desktop always displays ChatList in this column
                <ChatList
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  user={user}
                  dbFriends={dbFriends}
                  lockedSet={lockedSet}
                  onlineUserIds={onlineUserIds}
                  socket={socket}
                  handleSelectUser={handleSelectUser}
                  setReplyMetadata={setReplyMetadata}
                  setMessage={setMessage}
                  isMobile={false}
                  filteredMembers={filteredMembers}
                  sortedMembers={sortedMembers}
                  setQuickProfileUser={setQuickProfileUser}
                  formatLastSeen={formatLastSeen}
                  lastSeenTimes={lastSeenTimes}
                  messages={messages}
                  unread={unread}
                  setShowGestureOverlay={setShowGestureOverlay}
                  setContactSyncDialogOpen={setContactSyncDialogOpen}
                  bottomNav={bottomNav}
                  showChatList={true}
                  selectedUser={selectedUser}
                  showFinder={showFinder}
                  setShowFinder={setShowFinder}
                  handleDeleteChats={handleDeleteChats}
                  onSignOut={() => setSignOutDialogOpen(true)}
                />
              )}
            </Box>
          )}

          {/* Resizable Divider Line for Desktop */}
          {!isMobile && (
            <Box
              onMouseDown={startResizing}
              sx={{
                width: '4px',
                cursor: 'col-resize',
                height: '100%',
                zIndex: 10,
                position: 'relative',
                left: '-2px',
                marginRight: '-4px',
                bgcolor: isResizing ? (isDarkTheme ? '#00a884' : '#008069') : 'transparent',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: isDarkTheme ? '#00a884' : '#008069',
                }
              }}
            />
          )}

          {/* Mobile-only page targets (SearchPage, Settings, UserProfile, Call) if bottomNav is not 0 */}
          {isMobile && bottomNav === 1 && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 0 }}>
              <Call callLogs={callLogs} onInitiateCall={handleInitiateCall} onSelectUser={handleSelectUser} />
            </Box>
          )}
          {isMobile && bottomNav === 2 && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: { xs: 0, md: 2 } }}>
              <SearchPage />
            </Box>
          )}
          {isMobile && bottomNav === 3 && (
            <Settings onBack={() => setBottomNav(0)} />
          )}
          {isMobile && bottomNav === 4 && (
            <UserProfile
              friendRequestsList={pendingIncomingRequests}
              onAcceptFriend={handleAcceptFriend}
              onBlockChange={fetchBlockedStatus}
              hideProfileCard={isNotificationView}
              initialTab={isNotificationView ? 1 : 0}
            />
          )}

          {/* Chat details pane (for active chat) or desktop splash screen */}
          {showChatPane && selectedUser ? (
            <Box
              className="chat-pane-container"
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                bgcolor: 'var(--background-color, #fff)',
                paddingBottom: isMobile ? `${keyboardHeight}px` : 0,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--background-pattern, none)',
                  backgroundSize: 'var(--pattern-size, 20px 20px)',
                  backgroundRepeat: 'var(--pattern-repeat, repeat)',
                  backgroundPosition: 'var(--pattern-position, center)',
                  opacity: 'var(--pattern-opacity, 0.05)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }
              }}
            >
              <Box
                ref={headerRef}
                className="chat-header-fixed"
                sx={isMobile ? {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'fixed !important',
                  top: 'calc(env(safe-area-inset-top, 0px) + 10px) !important',
                  left: '12px !important',
                  right: '12px !important',
                  width: 'calc(100% - 24px) !important',
                  zIndex: 1200,
                  flexShrink: 0,
                  bgcolor: 'transparent',
                  border: 'none',
                  p: 0,
                  gap: '8px',
                  boxSizing: 'border-box',
                  animation: 'slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  '@keyframes slideDownFade': {
                    '0%': {
                      transform: 'translateY(-10px)',
                      opacity: 0
                    },
                    '100%': {
                      transform: 'translateY(0)',
                      opacity: 1
                    }
                  }
                } : {
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'var(--surface-color, #fff)',
                  borderBottom: '1px solid #f1dcdc',
                  justifyContent: 'space-between',
                  p: 1,
                  position: 'sticky !important',
                  top: '0 !important',
                  left: 'auto !important',
                  right: 'auto !important',
                  width: '100% !important',
                  height: '56px !important',
                  zIndex: 1200,
                  flexShrink: 0,
                  boxSizing: 'border-box'
                }}
              >
                {isMobile ? (
                  <>
                    {/* Back Button Pill */}
                    <IconButton
                      onClick={handleBackToList}
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        background: 'var(--surface-color, #fff) !important',
                        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        color: 'var(--text-color, #000) !important',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 0,
                        flexShrink: 0
                      }}
                    >
                      <ArrowBackIcon sx={{ color: 'var(--text-color, #000)', fontSize: 24 }} />
                    </IconButton>

                    {/* User Card Pill */}
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        height: 52,
                        borderRadius: '26px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        background: 'var(--surface-color, #fff)',
                        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        gap: 1.5
                      }}
                    >
                      <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                          src={selectedUser.profilePic || selectedUser.image || undefined}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: (!selectedUser.profilePic && !selectedUser.image) ? 'var(--primary-color, #ff4d86)' : 'transparent',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}
                        >
                          {(selectedUser.username || selectedUser.name || '?')[0].toUpperCase()}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: selectedUser.isBot ? '#31a24c' : (isUserOnline(selectedUser._id) ? '#31a24c' : '#bdbdbd'),
                            border: '2px solid var(--surface-color, #fff)',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                          }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontWeight: 'bold',
                            color: 'var(--text-color, #000)',
                            fontSize: '15px',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {selectedUser.username || selectedUser.name}
                        </Typography>
                        {(() => {
                          const statusText = selectedUser.isBot ? 'AI Love Assistant 🤖' : (isUserOnline(selectedUser._id) ? 'Online' : formatLastSeen(lastSeenTimes[selectedUser._id?.toString()], 'whatsapp'));
                          const isLong = statusText && statusText.length > 15 && !isUserOnline(selectedUser._id);
                          return (
                            <div className="lastseen-scroll-container">
                              <span
                                className={`lastseen-scroll-text ${isLong ? 'marquee-active' : ''}`}
                                style={{
                                  fontSize: '11px',
                                  color: selectedUser.isBot ? '#ff4d86' : (isUserOnline(selectedUser._id) ? '#31a24c' : 'var(--text-color, #666)'),
                                  opacity: selectedUser.isBot || isUserOnline(selectedUser._id) ? 1 : 0.7,
                                }}
                              >
                                {isLong ? `${statusText} \u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 ${statusText} \u00a0\u00a0\u00a0\u00a0\u00a0\u00a0` : statusText}
                              </span>
                            </div>
                          );
                        })()}
                      </Box>
                    </Box>

                    {/* Action Buttons Pill */}
                    {!selectedUser.isBot && (
                      <Box
                        sx={{
                          height: 52,
                          borderRadius: '26px',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          background: 'var(--surface-color, #fff)',
                          border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          px: 1,
                          gap: 0.5,
                          flexShrink: 0
                        }}
                      >
                        <IconButton
                          key="audio-call-btn"
                          onClick={() => handleInitiateCall(selectedUser._id, 'audio')}
                          disabled={videoCall.switchingCamera}
                          title="Audio call"
                          sx={{
                            color: '#34c759 !important',
                            width: 36,
                            height: 36,
                            '&:hover': {
                              background: 'rgba(52, 199, 89, 0.1)',
                              transform: 'scale(1.08)'
                            },
                            '&:active': {
                              transform: 'scale(0.95)'
                            }
                          }}
                        >
                          <PhoneInTalkIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <IconButton
                          key="video-call-btn"
                          onClick={() => handleInitiateCall(selectedUser._id, 'video')}
                          disabled={videoCall.switchingCamera}
                          title="Video call"
                          sx={{
                            color: 'var(--primary-color, #ff4d86) !important',
                            width: 36,
                            height: 36,
                            '&:hover': {
                              background: 'rgba(255, 77, 134, 0.1)',
                              transform: 'scale(1.08)'
                            },
                            '&:active': {
                              transform: 'scale(0.95)'
                            }
                          }}
                        >
                          <VideoCallIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={handleBackToList}
                        sx={{ mr: 1 }}
                      >
                        <ArrowBackIcon sx={{ color: 'var(--text-color, #000)' }} />
                      </IconButton>
                      <Box sx={{ position: 'relative', mr: 1 }}>
                        <Avatar
                          src={selectedUser.profilePic || selectedUser.image || undefined}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: (!selectedUser.profilePic && !selectedUser.image) ? 'var(--primary-color, #ff4d86)' : 'transparent',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}
                        >
                          {(selectedUser.username || selectedUser.name || '?')[0].toUpperCase()}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: selectedUser.isBot ? '#31a24c' : (isUserOnline(selectedUser._id) ? '#31a24c' : '#bdbdbd'),
                            border: '2px solid white',
                            boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 500, color: 'var(--text-color, #000)' }}>
                          {selectedUser.username || selectedUser.name}
                        </Typography>
                        {(() => {
                          const statusText = selectedUser.isBot ? 'AI Love Assistant 🤖' : (isUserOnline(selectedUser._id) ? 'Online' : formatLastSeen(lastSeenTimes[selectedUser._id?.toString()], 'whatsapp'));
                          const isLong = statusText && statusText.length > 20 && !isUserOnline(selectedUser._id);
                          return (
                            <div className="lastseen-scroll-container" style={{ maxWidth: '180px' }}>
                              <span
                                className={`lastseen-scroll-text ${isLong ? 'marquee-active' : ''}`}
                                style={{
                                  fontSize: '0.75rem',
                                  color: selectedUser.isBot ? 'var(--primary-color, #ff4d86)' : (isUserOnline(selectedUser._id) ? '#31a24c' : '#999'),
                                }}
                              >
                                {isLong ? `${statusText} \u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 ${statusText} \u00a0\u00a0\u00a0\u00a0\u00a0\u00a0` : statusText}
                              </span>
                            </div>
                          );
                        })()}
                      </Box>
                    </Box>

                    {!selectedUser.isBot && (
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <IconButton
                          key="audio-call-btn"
                          disabled={videoCall.switchingCamera}
                          onClick={() => {
                            handleInitiateCall(selectedUser._id, 'audio');
                          }}
                          title="Audio call"
                          sx={{
                            background: 'linear-gradient(135deg, rgba(76, 217, 100, 0.08), rgba(52, 199, 89, 0.15))',
                            border: '1px solid rgba(52, 199, 89, 0.25)',
                            borderRadius: '12px',
                            p: 1,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(76, 217, 100, 0.15), rgba(52, 199, 89, 0.25))',
                              transform: 'translateY(-2px) scale(1.08)',
                              boxShadow: '0 4px 12px rgba(52, 199, 89, 0.2)',
                              borderColor: 'rgba(52, 199, 89, 0.45)',
                            },
                            '&:active': {
                              transform: 'translateY(0) scale(0.95)',
                            }
                          }}
                        >
                          <PhoneInTalkIcon sx={{ color: '#34c759', fontSize: 20 }} />
                        </IconButton>
                        <IconButton
                          key="video-call-btn"
                          disabled={videoCall.switchingCamera}
                          onClick={() => {
                            handleInitiateCall(selectedUser._id, 'video');
                          }}
                          title="Video call"
                          sx={{
                            background: 'linear-gradient(135deg, rgba(255, 77, 134, 0.08), rgba(240, 98, 146, 0.15))',
                            border: '1px solid rgba(255, 77, 134, 0.25)',
                            borderRadius: '12px',
                            p: 1,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(255, 77, 134, 0.15), rgba(240, 98, 146, 0.25))',
                              transform: 'translateY(-2px) scale(1.08)',
                              boxShadow: '0 4px 12px rgba(255, 77, 134, 0.2)',
                              borderColor: 'rgba(255, 77, 134, 0.45)',
                            },
                            '&:active': {
                              transform: 'translateY(0) scale(0.95)',
                            }
                          }}
                        >
                          <VideoCallIcon sx={{ color: 'var(--primary-color, #ff4d86)', fontSize: 20 }} />
                        </IconButton>
                      </Box>
                    )}
                  </>
                )}
              </Box>

              <Box
                className="chat-messages-wrapper"
                sx={{
                  flex: 1,
                  position: 'relative',
                  margin: '0 !important',
                  bgcolor: 'transparent',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Floating Hearts Defs & Keyframes */}
                <HeartKeyframes heartsCount={hearts.length} />

                {/* Scrollable messages container – NO background pattern here */}
                <Box
                  ref={messagesContainerRef}
                  className="chat-messages-scroll-area"
                  sx={{
                    position: 'relative',
                    zIndex: 1,            // so messages are above pattern
                    flex: 1,
                    overflowY: 'auto !important',
                    pl: 2,
                    pr: 2,
                    pb: 2,
                    pt: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 10px + var(--header-height, 52px) + 12px) !important' : '16px !important',
                    height: '0 !important', // Important for proper flex scrolling
                    minHeight: '100% !important', // Ensures it takes available space
                    '&::-webkit-scrollbar': {
                      display: 'none'
                    },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {/* Messages mapped with date separators */}
                  {currentConversationMessages.map((msg, idx) => (
                    <React.Fragment key={msg.id || idx}>
                      {(() => {
                        const prev = currentConversationMessages[idx - 1];
                        const showDateSeparator = !prev || prev.date !== msg.date;
                        return showDateSeparator ? (
                          <Box sx={{ textAlign: 'center', mb: 2, mt: 2 }}>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                              {msg.date || formatDate(new Date(msg.timestamp || Date.now()))}
                            </Typography>
                          </Box>
                        ) : null;
                      })()}
                      <Box
                        className="message-swipe-container"
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          e.currentTarget.dataset.startX = touch.clientX;
                          e.currentTarget.dataset.startY = touch.clientY;
                          e.currentTarget.dataset.isSwiping = 'false';
                        }}
                        onTouchMove={(e) => {
                          const startX = parseFloat(e.currentTarget.dataset.startX);
                          const startY = parseFloat(e.currentTarget.dataset.startY);
                          if (isNaN(startX) || isNaN(startY)) return;

                          const touch = e.touches[0];
                          const deltaX = touch.clientX - startX;
                          const deltaY = touch.clientY - startY;

                          if (e.currentTarget.dataset.isSwiping !== 'true') {
                            if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
                              e.currentTarget.dataset.isSwiping = 'true';
                            }
                          }

                          if (e.currentTarget.dataset.isSwiping === 'true') {
                            const paper = e.currentTarget.querySelector('.message-paper-swipe');
                            if (paper) {
                              const translateX = Math.max(0, Math.min(deltaX, 60));
                              paper.style.transform = `translateX(${translateX}px)`;
                            }
                          }
                        }}
                        onTouchEnd={(e) => {
                          const paper = e.currentTarget.querySelector('.message-paper-swipe');
                          if (e.currentTarget.dataset.isSwiping === 'true') {
                            const startX = parseFloat(e.currentTarget.dataset.startX);
                            const touch = e.changedTouches[0];
                            const deltaX = touch.clientX - startX;

                            if (deltaX > 40) {
                              const content = msg.text || (msg.image ? 'Photo' : 'Message');
                              const replyMetadataObj = {
                                type: 'message_reply',
                                originalContent: content,
                                originalType: msg.image ? 'image' : 'text',
                                msgId: msg.id || msg._id,
                                timestamp: msg.timestamp || Date.now()
                              };
                              setReplyMetadata(replyMetadataObj);

                              setTimeout(() => {
                                const inputElement = document.querySelector('input[placeholder="Type a message"]');
                                if (inputElement) inputElement.focus();
                              }, 100);
                            }
                          }

                          if (paper) {
                            paper.style.transition = 'transform 0.2s ease-out';
                            paper.style.transform = 'translateX(0px)';
                            setTimeout(() => {
                              if (paper) paper.style.transition = '';
                            }, 200);
                          }

                          e.currentTarget.dataset.startX = '';
                          e.currentTarget.dataset.startY = '';
                          e.currentTarget.dataset.isSwiping = 'false';
                        }}
                        sx={{
                          mb: (msg.reactions && msg.reactions.length > 0) ? 3.5 : 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: (msg.senderId === user?._id || msg.sender === 'You') ? 'flex-end' : 'flex-start',
                          pr: (msg.senderId === user?._id || msg.sender === 'You') ? 2 : 0,
                          pl: (msg.senderId === user?._id || msg.sender === 'You') ? 0 : 2,
                          overflow: 'visible'
                        }}
                      >
                        <Paper
                          id={`msg-${msg.id || msg._id}`}
                          data-msg-id={msg.id || msg._id}
                          data-msg-text={msg.text || ''}
                          data-msg-time={msg.timestamp || ''}
                          className="message-paper-swipe"
                          onMouseDown={(e) => startLongPress(e, msg)}
                          onMouseUp={cancelLongPress}
                          onMouseLeave={cancelLongPress}
                          onTouchStart={(e) => startLongPress(e, msg)}
                          onTouchEnd={cancelLongPress}
                          onTouchMove={cancelLongPress}
                          onClick={(e) => {
                            if (isLongPressActive.current) {
                              e.stopPropagation();
                              isLongPressActive.current = false;
                              return;
                            }
                            const msgWishType = detectWishType(msg.text);
                            if (msgWishType) {
                              triggerPopAnimation(msgWishType);
                            } else if (detectHeartKeyword(msg.text)) {
                              triggerHeartAnimation(msg.id || msg._id);
                            }
                          }}

                          sx={{
                            p: msg.type === 'sticker' ? 0.5 : '8px 12px 6px',
                            maxWidth: msg.document ? { xs: '85%', sm: '75%' } : '75%',
                            borderRadius: msg.type === 'sticker' ? 0 : ((msg.senderId === user?._id || msg.sender === 'You') ? '8px 0px 8px 8px' : '0px 8px 8px 8px'),
                            bgcolor: msg.type === 'sticker' ? 'transparent' : ((msg.senderId === user?._id || msg.sender === 'You') ? (isDarkTheme ? '#005c4b' : '#d9fdd3') : (isDarkTheme ? '#202c33' : '#ffffff')),
                            color: msg.type === 'sticker' ? 'inherit' : (isDarkTheme ? '#e9edef' : '#111b21'),
                            boxShadow: msg.type === 'sticker' ? 'none' : '0 1px 1.5px rgba(0,0,0,0.12)',
                            position: 'relative',
                            overflow: 'visible',
                            cursor: (detectWishType(msg.text) || detectHeartKeyword(msg.text)) ? 'pointer' : 'default',
                            transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                            '&:hover': (detectWishType(msg.text) || detectHeartKeyword(msg.text)) ? {
                              transform: 'scale(1.03)',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            } : {},
                            '&:active': (detectWishType(msg.text) || detectHeartKeyword(msg.text)) ? {
                              transform: 'scale(0.98)',
                            } : {},
                            // WhatsApp-style bubble tail
                            '&::after': (msg.type === 'sticker' || msg.type === 'deleted' || msg.deletedForEveryone) ? {} : {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              right: (msg.senderId === user?._id || msg.sender === 'You') ? -8 : 'auto',
                              left: (msg.senderId === user?._id || msg.sender === 'You') ? 'auto' : -8,
                              width: 8,
                              height: 13,
                              bgcolor: (msg.senderId === user?._id || msg.sender === 'You') ? (isDarkTheme ? '#005c4b' : '#d9fdd3') : (isDarkTheme ? '#202c33' : '#ffffff'),
                              clipPath: (msg.senderId === user?._id || msg.sender === 'You') ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)',
                              zIndex: 1
                            },
                            ...(msg.replyTo && {
                              mt: 1,
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: -8,
                                left: (msg.senderId === user?._id || msg.sender === 'You') ? 'auto' : 12,
                                right: (msg.senderId === user?._id || msg.sender === 'You') ? 12 : 'auto',
                                width: 2,
                                height: 8,
                                bgcolor: 'var(--primary-color, #ff4d86)'
                              }
                            })
                          }}
                        >
                          {/* Local floating hearts inside the card */}
                          <FloatingHearts
                            hearts={hearts}
                            msgId={msg.id || msg._id}
                            localId={msg.localId}
                            text={msg.text}
                            detectHeartKeyword={detectHeartKeyword}
                          />

                          {msg.type === 'deleted' || msg.deletedForEveryone ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.5, pr: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                <Box component="span" sx={{ fontSize: '0.9rem', color: '#999', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                                  🚫
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'text.secondary',
                                    fontStyle: 'italic',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {String(msg.senderId) === String(user?._id) || msg.sender === 'You'
                                    ? 'You deleted this message'
                                    : 'This message was deleted'}
                                </Typography>
                              </Box>
                              {/* {msg.originalText && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isDarkTheme ? '#888' : '#777',
                                    textDecoration: 'line-through',
                                    fontStyle: 'italic',
                                    pl: 2.8,
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {msg.originalText}
                                </Typography>
                              )} */}
                            </Box>
                          ) : (
                            <>
                              {(msg.replyTo || msg.replyMetadata) && ['mood_reply', 'message_reply'].includes((msg.replyTo || msg.replyMetadata).type) && (
                                <Box
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rep = msg.replyTo || msg.replyMetadata;
                                    if (rep) {
                                      scrollToMessage(rep.msgId, rep.originalContent, rep.timestamp);
                                    }
                                  }}
                                  sx={{
                                    bgcolor: 'rgba(0,0,0,0.04)',
                                    borderLeft: '4px solid var(--primary-color, #ff4d86)',
                                    borderRadius: '4px',
                                    p: 1,
                                    mb: 1,
                                    fontSize: '0.9em',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'background-color 0.2s ease',
                                    '&:hover': {
                                      bgcolor: 'rgba(0,0,0,0.08)'
                                    },
                                    '&:active': {
                                      bgcolor: 'rgba(0,0,0,0.12)'
                                    }
                                  }}
                                >
                                  <Typography variant="caption" sx={{ color: 'var(--primary-color, #ff4d86)', fontWeight: 700 }}>
                                    {((msg.replyTo || msg.replyMetadata).type === 'message_reply')
                                      ? '💬 Replying to message'
                                      : (((msg.replyTo || msg.replyMetadata).originalType === 'emoji') ? '😊 Replying to emoji' : '💬 Replying to mood')}
                                  </Typography>
                                  <Typography sx={{ color: 'text.secondary', mt: 0.25, wordBreak: 'break-word' }}>
                                    {formatReplyContent((msg.replyTo || msg.replyMetadata).originalContent)}
                                  </Typography>
                                </Box>
                              )}

                              {msg.text && !msg.text.startsWith(REPLY_MARKER_START) && (
                                msg.text.startsWith('JUICY_GAME:') ? (
                                  <GameBubble
                                    msg={msg}
                                    userId={user?._id}
                                    username={user?.username}
                                    selectedUser={selectedUser}
                                    onSendGameMessage={sendGameMoveMessage}
                                    isDarkTheme={isDarkTheme}
                                  />
                                ) : (
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      color: msg.text === "Social media links are restricted"
                                        ? '#90a4ae' // Light Ash color
                                        : 'inherit', // Inherits correct light/dark color from parent Paper
                                      fontStyle: msg.text === "Social media links are restricted" ? 'italic' : 'normal',
                                      wordBreak: 'break-word',
                                      lineHeight: 1.4,
                                      whiteSpace: 'pre-wrap'
                                    }}
                                  >
                                    {msg.text}
                                  </Typography>
                                )
                              )}

                              {msg.image && (
                                <Box
                                  sx={{
                                    mt: msg.text ? 1 : 0,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    maxWidth: msg.type === 'sticker'
                                      ? { xs: '100px', sm: '130px' }
                                      : { xs: '220px', sm: '260px' },
                                    maxHeight: msg.type === 'sticker' ? 'none' : '200px',
                                    background: 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: msg.type === 'sticker' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <img
                                    src={msg.image}
                                    alt={msg.type === 'sticker' ? 'sticker' : 'sent-img'}
                                    style={{
                                      width: '100%',
                                      height: msg.type === 'sticker' ? 'auto' : '200px',
                                      objectFit: msg.type === 'sticker' ? 'contain' : 'cover',
                                      display: 'block',
                                      cursor: msg.type === 'sticker' ? 'default' : 'pointer'
                                    }}
                                    onClick={msg.type === 'sticker' ? undefined : () => handleViewImage(msg)}
                                  />
                                </Box>
                              )}

                              {/* YouTube preview (thumbnail + link) */}
                              {msg.youtube && (
                                <Box
                                  sx={{
                                    mt: msg.text ? 1 : 0,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    maxWidth: '100%',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    try { window.open(msg.youtube.url || `https://youtu.be/${msg.youtube.videoId}`, '_blank'); } catch (e) { console.warn(e); }
                                  }}
                                >
                                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                      src={msg.youtube.thumbnail}
                                      alt="youtube-thumb"
                                      style={{ display: 'block', width: 320, maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                                    />
                                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                      <PlayArrowIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.9)' }} />
                                    </Box>
                                  </Box>
                                  <Typography variant="body2" sx={{ mt: 0.5, color: 'inherit', wordBreak: 'break-word' }}>
                                    {msg.youtube.url || (msg.youtube.videoId ? `https://youtu.be/${msg.youtube.videoId}` : 'YouTube video')}
                                  </Typography>
                                </Box>
                              )}

                              {(msg.opened) && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" sx={{ color: '#888' }}>
                                    Opened
                                  </Typography>
                                </Box>
                              )}

                              {msg.document && (() => {
                                const isPdf = msg.document.toLowerCase().endsWith('.pdf');
                                const extension = msg.document.split('.').pop().toUpperCase() || 'FILE';
                                const isSent = String(msg.senderId) === String(user?._id) || msg.sender === 'You';

                                let sizeStr = '0.0 KB';
                                if (msg.documentData) {
                                  const base64Length = msg.documentData.length - (msg.documentData.indexOf(',') + 1);
                                  const sizeInBytes = (base64Length * 3) / 4;
                                  if (sizeInBytes > 1024 * 1024) {
                                    sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
                                  } else {
                                    sizeStr = `${(sizeInBytes / 1024).toFixed(0)} KB`;
                                  }
                                }

                                const downloadState = downloadingDocs[msg.id];
                                const isDownloading = downloadState?.active;
                                const progress = downloadState?.progress || 0;
                                const isCompleted = downloadState?.completed || isSent;

                                const handleCardClick = () => {
                                  if (isCompleted && msg.documentData) {
                                    setDocDialogFile({ name: msg.document, data: msg.documentData });
                                    setDocDialogOpen(true);
                                  }
                                };

                                return (
                                  <Box
                                    onClick={handleCardClick}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      width: '100%',
                                      minWidth: { xs: 200, sm: 250 },
                                      maxWidth: 290,
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      border: '1px solid rgba(0, 0, 0, 0.08)',
                                      bgcolor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : (isSent ? '#d9fdd3' : '#ffffff'),
                                      mt: 1,
                                      p: 1.2,
                                      gap: 1.2,
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                      cursor: isCompleted ? 'pointer' : 'default',
                                      transition: 'opacity 0.2s',
                                      '&:hover': isCompleted ? { opacity: 0.95 } : {},
                                    }}
                                  >
                                    {/* Icon or Download Trigger */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                      {!isCompleted && !isDownloading ? (
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (msg.documentData) {
                                              handleStartDownload(msg.id, msg.document, msg.documentData);
                                            }
                                          }}
                                          disabled={!msg.documentData}
                                          sx={{
                                            bgcolor: '#075E54',
                                            color: '#fff',
                                            '&:hover': { bgcolor: '#128C7E' },
                                            width: 36,
                                            height: 36,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                          }}
                                        >
                                          <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      ) : isDownloading ? (
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelDownload(msg.id);
                                          }}
                                          sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: 'rgba(0,0,0,0.05)',
                                            color: '#ff2d55',
                                            '&:hover': { bgcolor: 'rgba(255,45,85,0.1)' }
                                          }}
                                        >
                                          <CancelIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      ) : (
                                        <Box
                                          sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '6px',
                                            bgcolor: isPdf ? '#ff2d55' : '#128C7E',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontWeight: 800,
                                            fontSize: '0.65rem',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                          }}
                                        >
                                          {isPdf ? 'PDF' : extension.slice(0, 3)}
                                        </Box>
                                      )}
                                    </Box>

                                    {/* Filename and size info */}
                                    <Box
                                      sx={{
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 600,
                                          color: 'inherit',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        {msg.document}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: 'text.secondary',
                                          display: 'block',
                                          fontSize: '0.75rem',
                                          mt: 0.1
                                        }}
                                      >
                                        {isDownloading ? (
                                          <span style={{ color: '#075E54', fontWeight: 600 }}>Downloading... {progress}%</span>
                                        ) : (
                                          `${sizeStr} · ${extension}`
                                        )}
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              })()}

                              {msg.contact && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" sx={{ color: 'inherit' }}>📱 <strong>{msg.contact.name}</strong></Typography>
                                  <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>{msg.contact.phone}</Typography>
                                </Box>
                              )}

                              {msg.audio && (
                                <VoiceMessagePlayer
                                  msg={msg}
                                  idx={idx}
                                  selectedUser={selectedUser}
                                  playingAudioIdx={playingAudioIdx}
                                  setPlayingAudioIdx={setPlayingAudioIdx}
                                  handleAudioMenuOpen={handleMessageMenuOpen}
                                />
                              )}
                            </>
                          )}

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 0.5,
                              mt: 0.5,
                              ml: 'auto',
                              alignSelf: 'flex-end',
                            }}
                          >
                            {msg.edited && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: isDarkTheme ? '#8696a0' : '#667781',
                                  fontSize: '0.65rem',
                                  mr: 0.5,
                                }}
                              >
                                edited
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDarkTheme ? '#8696a0' : '#667781',
                                fontSize: '0.7rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {msg.timestamp}
                            </Typography>
                            {(msg.senderId === user?._id || msg.sender === 'You') && (() => {
                              // WhatsApp-style read receipts
                              // single gray tick  → sent (temp ID, not yet confirmed by server)
                              // double gray ticks → delivered (server confirmed, not yet read)
                              // double teal ticks → read/seen
                              const isTempId = msg.id && !/^[0-9a-fA-F]{24}$/.test(String(msg.id));
                              const isRead = msg.read === true;
                              const isDelivered = !isTempId; // has a real MongoDB _id → delivered

                              if (isRead) {
                                // Double teal ticks (seen)
                                return (
                                  <Box
                                    component="span"
                                    sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.3, flexShrink: 0 }}
                                    title="Seen"
                                  >
                                    <svg width="18" height="11" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      {/* First tick */}
                                      <path d="M1 5.5L4.5 9L10 2" stroke="#53BDEB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      {/* Second tick (offset right) */}
                                      <path d="M6 5.5L9.5 9L17 1" stroke="#53BDEB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </Box>
                                );
                              } else if (isDelivered) {
                                // Double gray ticks (delivered, not yet read)
                                return (
                                  <Box
                                    component="span"
                                    sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.3, flexShrink: 0 }}
                                    title="Delivered"
                                  >
                                    <svg width="18" height="11" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 5.5L4.5 9L10 2" stroke={isDarkTheme ? '#8696a0' : '#92A8B4'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M6 5.5L9.5 9L17 1" stroke={isDarkTheme ? '#8696a0' : '#92A8B4'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </Box>
                                );
                              } else {
                                // Single gray tick (sent, pending server confirmation)
                                return (
                                  <Box
                                    component="span"
                                    sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.3, flexShrink: 0 }}
                                    title="Sent"
                                  >
                                    <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 5.5L4.5 9L11 1" stroke={isDarkTheme ? '#8696a0' : '#92A8B4'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </Box>
                                );
                              }
                            })()}
                            {getTimeUntilExpiry && getTimeUntilExpiry(msg.timestamp) && (
                              <Typography variant="caption" sx={{ color: '#ff9800', fontSize: '0.65rem', ml: 0.5 }}>
                                {getTimeUntilExpiry(msg.timestamp)}
                              </Typography>
                            )}
                          </Box>

                          {/* Reactions Pill (WhatsApp Style) */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -10,
                                right: (msg.senderId === user._id || msg.sender === 'You') ? 16 : 'auto',
                                left: (msg.senderId === user._id || msg.sender === 'You') ? 'auto' : 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                bgcolor: 'var(--surface-color, #fff)',
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: '12px',
                                px: '6px',
                                py: '1.5px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
                                zIndex: 3,
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.08)',
                                  boxShadow: '0 3px 8px rgba(0,0,0,0.18)'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const myReaction = msg.reactions.find(r => String(r.userId) === String(user?._id));
                                if (myReaction) {
                                  handleReactMessage(msg, myReaction.emoji);
                                } else {
                                  handleMessageMenuOpen(e, msg);
                                }
                              }}
                            >
                              {/* List unique emojis */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                                {Array.from(new Set(msg.reactions.map(r => r.emoji))).slice(0, 3).map((emoji, i) => (
                                  <span key={i} style={{ fontSize: '0.85rem' }}>{emoji}</span>
                                ))}
                              </Box>
                              {/* Show count if more than 1 reaction */}
                              {msg.reactions.length > 1 && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    pl: '2px'
                                  }}
                                >
                                  {msg.reactions.length}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    </React.Fragment>
                  ))}
                  {/* Sentinel element – scroll anchor for auto-scroll to bottom */}
                  <div ref={messagesEndRef} style={{ height: 0, width: '100%' }} />

                </Box>
              </Box>
              <Box
                ref={inputRef}
                className="chat-input-bar-container"
                sx={{
                  p: 0,
                  borderTop: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  bgcolor: 'transparent',
                  position: isMobile ? 'relative !important' : 'relative',
                  bottom: 'auto !important',
                  left: 'auto !important',
                  right: 'auto !important',
                  width: '100%',
                  zIndex: 1100,
                  boxShadow: 'none',
                  flexShrink: 0,
                  pb: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 8px) !important' : '8px !important'
                }}
              >
                {/* Typing Indicator above type field */}
                {otherTyping && (
                  <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center' }}>
                    <PenTypingIndicator userName={selectedUser?.name} />
                  </Box>
                )}
                {/* Reply Badge (when active, show above input) */}
                {replyMetadata && (
                  <Paper sx={{ p: 1, bgcolor: '#fff0f4', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1, mx: 1, mt: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: '#ff4d86', fontWeight: 700 }}>
                        Replying to
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatReplyContent(replyMetadata.originalContent)}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReplyMetadata(null)} sx={{ bgcolor: '#fff', flexShrink: 0, p: 0.5 }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Paper>
                )}

                {/* Single Merged Row: + icon, type bar, mic/send button (OR recording state) */}
                {selectedUser && blockedUsers.includes(selectedUser._id) ? (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 1.5,
                    px: 3,
                    bgcolor: 'rgba(255, 145, 0, 0.08)',
                    borderRadius: '18px',
                    mx: 1.5,
                    my: 1,
                    border: '1px solid rgba(255, 145, 0, 0.2)',
                    width: '100%'
                  }}>
                    <Typography sx={{ color: '#ff9100', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
                      You blocked this contact.{' '}
                      <span
                        style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => {
                          setUserToUnblock(selectedUser);
                          setUnblockConfirmOpen(true);
                        }}
                      >
                        Tap to unblock.
                      </span>
                    </Typography>
                  </Box>
                ) : !isRecording && !recordingPreviewUrl ? (
                  <Box sx={{
                    position: 'relative',
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    bgcolor: 'transparent',
                    width: '100%',
                  }}>
                    {/* Input Pill */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      bgcolor: 'var(--surface-color, #fff)',
                      borderRadius: '24px',
                      px: 1,
                      py: 0.5,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      position: 'relative',
                    }}>
                      {/* Attach button */}
                      {!selectedUser.isBot && (
                        <IconButton
                          id="attach-menu-button"
                          onClick={() => {
                            setShowAttachMenu(!showAttachMenu);
                            setShowEmojiPicker(false);
                          }}
                          sx={{
                            color: 'var(--primary-color, #ff4d4d)',
                            '&:hover': { bgcolor: 'rgba(255, 77, 77, 0.08)' },
                            flexShrink: 0,
                            p: 0.75,
                          }}
                        >
                          <AttachFileIcon sx={{ fontSize: 24, transform: 'rotate(45deg)' }} />
                        </IconButton>
                      )}

                      {showAttachMenu && (
                        <Box
                          ref={attachMenuRef}
                          sx={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 8,
                            bgcolor: 'var(--surface-color, #fff)',
                            borderRadius: 2,
                            boxShadow: 3,
                            p: 2,
                            display: 'flex',
                            gap: 2,
                            zIndex: 2001,
                            mb: 1.5
                          }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon sx={{ color: 'var(--primary-color, #ff4d4d)', fontSize: 28 }} />
                            <Typography variant="caption" sx={{ color: 'var(--text-color, #000)' }}>File</Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => {
                              handleCaptureClick();
                              setShowAttachMenu(false);
                            }}
                          >
                            <CameraAltIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                            <Typography variant="caption" sx={{ color: 'var(--text-color, #000)' }}>Camera</Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => {
                              setShowStickerDialog(true);
                              setShowAttachMenu(false);
                            }}
                          >
                            <EmojiEmotionsIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
                            <Typography variant="caption" sx={{ color: 'var(--text-color, #000)' }}>Sticker</Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => {
                              setDoodleMode(true);
                              setShowAttachMenu(false);
                            }}
                          >
                            <BrushIcon sx={{ color: '#6b21a8', fontSize: 28 }} />
                            <Typography variant="caption" sx={{ color: 'var(--text-color, #000)' }}>Draw</Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                            onClick={() => {
                              setGameSelectorOpen(true);
                              setShowAttachMenu(false);
                            }}
                          >
                            <SportsEsportsIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                            <Typography variant="caption" sx={{ color: 'var(--text-color, #000)' }}>Games</Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Text input */}
                      <TextField
                        inputRef={messageInputRef}
                        value={message}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        onFocus={() => {
                          setShowEmojiPicker(false);
                          setShowAttachMenu(false);
                          setTimeout(() => {
                            if (messagesContainerRef.current) {
                              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                            }
                          }, 150);
                        }}
                        placeholder="Type something"
                        multiline
                        maxRows={6}
                        variant="standard"
                        fullWidth
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            px: 1,
                            fontSize: '0.95rem',
                            color: 'var(--text-color, #000)',
                            '& textarea': {
                              padding: '4px 0',
                            }
                          }
                        }}
                        sx={{
                          flex: 1,
                          mx: 0.5
                        }}
                      />

                      {/* Emoji button */}
                      <IconButton
                        id="emoji-picker-button"
                        onClick={() => {
                          setShowEmojiPicker((prev) => !prev);
                          setShowAttachMenu(false);
                        }}
                        sx={{
                          color: 'var(--primary-color, #ff4d4d)',
                          '&:hover': { bgcolor: 'rgba(255, 77, 77, 0.08)' },
                          flexShrink: 0,
                          p: 0.75,
                        }}
                      >
                        <InsertEmoticonIcon sx={{ fontSize: 24 }} />
                      </IconButton>

                    </Box>

                    {showEmojiPicker && (
                      <Box
                        ref={emojiPickerRef}
                        sx={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          right: 'auto',
                          zIndex: 2000,
                          width: 'min(calc(100vw - 24px), 350px)',
                          bgcolor: 'transparent',
                          borderRadius: 2,
                          boxShadow: 3,
                          overflow: 'hidden',
                          mb: 1.5
                        }}>
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji) => {
                            setMessage((prev) => prev + emoji.native);
                          }}
                          theme="light"
                          maxFrequentRows={2}
                        />
                      </Box>
                    )}

                    {/* Circular Action Button */}
                    {message.trim() || selectedUser.isBot ? (
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        sx={{
                          bgcolor: 'var(--primary-color, #ff4d4d)',
                          color: '#ffffff',
                          width: 46,
                          height: 46,
                          '&:hover': {
                            bgcolor: 'var(--primary-color, #ff4d4d)',
                            opacity: 0.9,
                          },
                          '&.Mui-disabled': {
                            bgcolor: isDarkTheme ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                            color: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.35)',
                            border: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(0, 0, 0, 0.08)',
                          },
                          flexShrink: 0,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <SendIcon sx={{ fontSize: 22 }} />
                      </IconButton>
                    ) : (
                      <IconButton
                        onClick={handleMicClick}
                        sx={{
                          bgcolor: 'var(--primary-color, #ff4d4d)',
                          color: '#fff',
                          width: 46,
                          height: 46,
                          '&:hover': {
                            bgcolor: 'var(--primary-color, #ff4d4d)',
                            opacity: 0.9,
                          },
                          flexShrink: 0,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <MicIcon sx={{ fontSize: 22 }} />
                      </IconButton>
                    )}
                  </Box>
                ) : (
                  <VoiceMessageRecorder
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    recordingPreviewUrl={recordingPreviewUrl}
                    setRecordingPreviewUrl={setRecordingPreviewUrl}
                    onSendAudio={(base64Audio) => {
                      if (selectedUser && socket && user) {
                        const newMessage = {
                          id: generateUniqueId(),
                          senderId: user._id,
                          senderUsername: user.username,
                          receiverId: selectedUser._id,
                          receiverUsername: selectedUser.username,
                          roomId: [user._id, selectedUser._id].sort().join('-'),
                          audio: base64Audio,
                          timestamp: formatTime(new Date()),
                          date: formatDate(new Date()),
                        };
                        socket.emit('send_message', newMessage);
                        moveChatToTop(selectedUser._id);

                        setMessages(prev => {
                          const updated = { ...prev };
                          if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
                          updated[selectedUser._id].push({
                            id: newMessage.id,
                            sender: 'You',
                            audio: base64Audio,
                            timestamp: newMessage.timestamp,
                            date: newMessage.date,
                            createdAt: new Date().toISOString(),
                          });
                          return updated;
                        });
                      }
                    }}
                  />
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />

              </Box>
            </Box>
          ) : (
            !isMobile && (
              bottomNav === 1 ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    bgcolor: 'var(--background-color, #fff6f8)',
                    borderLeft: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(241,220,220,0.5)',
                  }}
                >
                  <Call callLogs={callLogs} onInitiateCall={handleInitiateCall} onSelectUser={handleSelectUser} />
                </Box>
              ) : bottomNav === 2 ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    bgcolor: 'var(--background-color, #fff6f8)',
                    borderLeft: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(241,220,220,0.5)',
                  }}
                >
                  <SearchPage />
                </Box>
              ) : bottomNav === 3 ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    bgcolor: 'var(--background-color, #fff6f8)',
                    borderLeft: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(241,220,220,0.5)',
                  }}
                >
                  <Settings onBack={() => setBottomNav(0)} />
                </Box>
              ) : bottomNav === 4 ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    bgcolor: 'var(--background-color, #fff6f8)',
                    borderLeft: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(241,220,220,0.5)',
                  }}
                >
                  <UserProfile
                    friendRequestsList={pendingIncomingRequests}
                    onAcceptFriend={handleAcceptFriend}
                    onBlockChange={fetchBlockedStatus}
                    hideProfileCard={isNotificationView}
                    initialTab={isNotificationView ? 1 : 0}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isDarkTheme ? '#222e35' : '#f8f9fa',
                    position: 'relative',
                    px: 4,
                    textAlign: 'center',
                    borderLeft: isDarkTheme ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(241,220,220,0.5)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--background-pattern, none)',
                      backgroundSize: 'var(--pattern-size, 20px 20px)',
                      opacity: 0.03,
                      pointerEvents: 'none'
                    }
                  }}
                >
                  <Box sx={{ maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      component="img"
                      src={newJuicyLogo}
                      alt="Juicy Web"
                      sx={{
                        width: 120,
                        height: 'auto',
                        mb: 3,
                        opacity: 0.8,
                        filter: isDarkTheme ? 'drop-shadow(0 0 12px rgba(236, 64, 122, 0.2))' : 'none'
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 300, color: 'var(--text-color, #000)', mb: 1 }}>
                      Juicy for Web
                    </Typography>
                    <Typography sx={{ color: 'var(--text-color, #666)', fontSize: '0.875rem', mb: 4, lineHeight: 1.6 }}>
                      Send and receive messages without keeping your phone online.<br />
                      Use Juicy on up to 4 linked devices and 1 phone at the same time.
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, color: 'var(--text-color, #999)', fontSize: '0.75rem' }}>
                      <Box component="span" sx={{ fontSize: '0.85rem' }}>🔒</Box>
                      <Typography variant="caption" sx={{ color: 'inherit' }}>
                        End-to-end encrypted
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            )
          )}
        </Box>

      </Box>

      {/* WhatsApp-style Quick Profile Dialog */}
      <Dialog
        open={Boolean(quickProfileUser)}
        onClose={() => setQuickProfileUser(null)}
        PaperProps={{
          sx: {
            width: 250,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            p: 0,
            m: 0,
            bgcolor: 'var(--surface-color, #fff)'
          }
        }}
      >
        {quickProfileUser && (
          <Box sx={{ position: 'relative', width: '100%', height: 250 }}>
            {/* Overlay contact name */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)',
                color: '#fff',
                px: 2,
                py: 1.5,
                zIndex: 2,
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                {quickProfileUser.username || quickProfileUser.name}
              </Typography>
            </Box>

            {/* Profile Image */}
            <Box
              component="img"
              src={
                quickProfileUser.profileImage
                  ? (quickProfileUser.profileImage.startsWith('data:')
                    ? quickProfileUser.profileImage
                    : `data:image/jpeg;base64,${quickProfileUser.profileImage}`)
                  : (quickProfileUser.profilePic || quickProfileUser.image || 'https://via.placeholder.com/250')
              }
              alt={quickProfileUser.username || quickProfileUser.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.03)' }
              }}
              onClick={() => {
                // Open the full-screen image viewer for the profile picture
                const imgSrc = quickProfileUser.profileImage
                  ? (quickProfileUser.profileImage.startsWith('data:')
                    ? quickProfileUser.profileImage
                    : `data:image/jpeg;base64,${quickProfileUser.profileImage}`)
                  : (quickProfileUser.profilePic || quickProfileUser.image || '');
                if (imgSrc) {
                  setFullScreenImage({ src: imgSrc, isProfileImage: true });
                }
                setQuickProfileUser(null);
              }}
            />
          </Box>
        )}

        {/* Quick Action Buttons at the Bottom */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            bgcolor: 'var(--surface-color, #fff)',
            py: 1,
            borderTop: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          {/* Chat Icon */}
          <IconButton
            onClick={() => {
              if (quickProfileUser) {
                handleSelectUser(quickProfileUser);
              }
              setQuickProfileUser(null);
            }}
            sx={{ color: 'var(--primary-color, #ec407a)', '&:hover': { bgcolor: 'var(--background-color, #ffecec)' } }}
          >
            <ChatIcon />
          </IconButton>

          {/* Voice Call Icon */}
          <IconButton
            onClick={async () => {
              if (quickProfileUser) {
                handleSelectUser(quickProfileUser);
                setTimeout(() => {
                  handleInitiateCall(quickProfileUser._id, 'audio');
                }, 100);
              }
              setQuickProfileUser(null);
            }}
            sx={{ color: 'var(--primary-color, #ec407a)', '&:hover': { bgcolor: 'var(--background-color, #ffecec)' } }}
          >
            <PhoneIcon />
          </IconButton>

          {/* Video Call Icon */}
          <IconButton
            onClick={async () => {
              if (quickProfileUser) {
                handleSelectUser(quickProfileUser);
                setTimeout(() => {
                  handleInitiateCall(quickProfileUser._id, 'video');
                }, 100);
              }
              setQuickProfileUser(null);
            }}
            sx={{ color: 'var(--primary-color, #ec407a)', '&:hover': { bgcolor: 'var(--background-color, #ffecec)' } }}
          >
            <VideocamIcon />
          </IconButton>

          {/* Info Icon */}
          <IconButton
            onClick={() => {
              if (quickProfileUser) {
                const imgSrc = quickProfileUser.profileImage
                  ? (quickProfileUser.profileImage.startsWith('data:')
                    ? quickProfileUser.profileImage
                    : `data:image/jpeg;base64,${quickProfileUser.profileImage}`)
                  : (quickProfileUser.profilePic || quickProfileUser.image || '');
                if (imgSrc) {
                  setFullScreenImage({ src: imgSrc, isProfileImage: true });
                }
              }
              setQuickProfileUser(null);
            }}
            sx={{ color: 'var(--primary-color, #ec407a)', '&:hover': { bgcolor: 'var(--background-color, #ffecec)' } }}
          >
            <InfoIcon />
          </IconButton>
        </Box>
      </Dialog>

      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{
          bgcolor: 'var(--surface-color, #fff)',
          color: 'var(--text-color, #000)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          <Avatar
            src={
              profileDialogUser?.profileImage
                ? (profileDialogUser.profileImage.startsWith('data:')
                  ? profileDialogUser.profileImage
                  : `data:image/jpeg;base64,${profileDialogUser.profileImage}`)
                : (profileDialogUser?.profilePic || profileDialogUser?.image)
            }
            sx={{
              width: 100, height: 100, mb: 2, bgcolor: 'var(--primary-color, #f8bbd0)',
              border: '3px solid var(--primary-color, #ec407a)', fontSize: 40
            }}
          />
          {profileDialogUser?.about && (
            <Box sx={{
              bgcolor: 'var(--background-color, #fff0f4)',
              borderRadius: 2, p: 2, width: '100%', mb: 2
            }}>
              <Typography fontWeight={500} sx={{ mb: 1, color: 'var(--text-color, #000)' }}>About</Typography>
              <Typography fontSize={14} sx={{ color: 'var(--text-color, #000)' }}>{profileDialogUser.about}</Typography>
            </Box>
          )}
          <Button
            onClick={() => setProfileDialogOpen(false)}
            sx={{
              mt: 2,
              color: 'var(--primary-color, #ec407a)',
              background: 'var(--surface-color, #fff)',
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 1,
              border: '1px solid var(--primary-color, #ec407a)',
              '&:hover': {
                background: 'var(--background-color, #ffe4ec)',
                borderColor: 'var(--primary-color, #d81b60)'
              }
            }}
            fullWidth
          >
            Close
          </Button>
        </Box>
      </Dialog>

      {/* Camera dialog for capturing images */}
      <Dialog
        open={showCamera}
        onClose={handleCloseCamera}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: '#000', // Camera background should always be black
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: captureFacingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
          />
          <Box sx={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2
          }}>
            <IconButton
              onClick={handleCloseCamera}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <CloseIcon />
            </IconButton>
            <IconButton
              onClick={handleCapture}
              sx={{
                color: '#000',
                bgcolor: '#fff',
                width: 64,
                height: 64,
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              <CameraAltIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <IconButton
              onClick={handleSwitchCaptureCamera}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <FlipIcon />
            </IconButton>
          </Box>
        </Box>
      </Dialog>

      {/* Image preview (WhatsApp-style full screen) */}
      <Dialog
        open={imagePreviewOpen}
        onClose={handleCancelCaptured}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
      >
        {/* Header with close button */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <IconButton
            onClick={handleCancelCaptured}
            sx={{
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Photo Preview</Typography>
          <Box sx={{ width: 40 }} /> {/* Spacer for centering */}
        </Box>

        {/* Image display area - fill screen */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#000',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {capturedImage && (
            <Box
              component="img"
              src={capturedImage}
              alt="preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                animation: 'fadeIn 0.3s ease-in',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0 },
                  '100%': { opacity: 1 }
                }
              }}
            />
          )}
        </Box>

        {/* Bottom action buttons - WhatsApp style */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          p: 3,
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          gap: 2
        }}>
          {/* Retake button */}
          <Button
            variant="outlined"
            onClick={handleRetake}
            startIcon={<CameraAltIcon />}
            sx={{
              color: '#fff',
              borderColor: '#fff',
              borderRadius: 50,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#fff',
                bgcolor: 'rgba(255,255,255,0.15)',
                transform: 'scale(1.05)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            Retake
          </Button>

          {/* Send button - prominent */}
          <Button
            variant="contained"
            onClick={handleSendCaptured}
            startIcon={<SendIcon />}
            sx={{
              bgcolor: 'var(--primary-color, #ff4d86)',
              color: '#fff',
              borderRadius: 50,
              px: 5,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '1.05rem',
              boxShadow: '0 8px 24px rgba(255,77,134,0.4)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                bgcolor: 'var(--primary-color, #ff3373)',
                boxShadow: '0 12px 32px rgba(255,77,134,0.6)',
                transform: 'scale(1.08)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            Send
          </Button>
        </Box>
      </Dialog>

      <div>
        {/* Other UI components like chat list, messages, etc. */}
        {videoCall.calling && !videoCall.callAccepted && (
          <Dialog
            open={videoCall.calling && !videoCall.callAccepted}
            onClose={() => { }}
            fullScreen
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
                backdropFilter: 'blur(10px)'
              }
            }}
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.45)' } }}
          >
            <Box sx={{
              height: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              color: '#fff',
              overflow: 'hidden',
              p: 3
            }}>
              {/* Status bar (top) */}
              <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
              }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Typography>
              </Box>

              {/* Animated background circles */}
              <Box sx={{
                position: 'absolute',
                width: 400,
                height: 400,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.06)',
                top: '-100px',
                left: '-100px',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%': { transform: 'translate(0, 0)' },
                  '50%': { transform: 'translate(20px, 20px)' },
                  '100%': { transform: 'translate(0, 0)' }
                }
              }} />
              <Box sx={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.04)',
                bottom: '-80px',
                right: '-80px',
                animation: 'float 8s ease-in-out infinite reverse'
              }} />

              {/* Receiver Avatar with pulsing ring (same as incoming) */}
              <Box sx={{
                position: 'relative',
                mt: { xs: 8, sm: 10 },
                animation: 'slideDown 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                '@keyframes slideDown': {
                  '0%': { transform: 'translateY(-80px)', opacity: 0 },
                  '100%': { transform: 'translateY(0)', opacity: 1 }
                }
              }}>
                <Avatar
                  src={selectedUser?.profilePic || selectedUser?.image}
                  sx={{
                    width: { xs: 120, sm: 140 },
                    height: { xs: 120, sm: 140 },
                    border: '6px solid rgba(255,255,255,0.35)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.35)'
                  }}
                />
                <Box sx={{
                  position: 'absolute',
                  inset: -16,
                  borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.38)',
                  animation: 'ringing 2s ease-out infinite',
                  '@keyframes ringing': {
                    '0%': { transform: 'scale(1)', opacity: 1 },
                    '100%': { transform: 'scale(1.45)', opacity: 0 }
                  }
                }} />
              </Box>

              {/* Local video preview for video calls */}
              {videoCall.callType === 'video' && (
                <Box sx={{
                  position: 'absolute',
                  top: 40,
                  right: 0,
                  width: { xs: '100%', sm: '100%' },
                  height: { xs: '100%', sm: '100%' },
                  zIndex: 1
                }}>
                  <video
                    ref={videoCall.myVideo}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)'
                    }}
                  />
                </Box>
              )}

              {/* Calling info (center) */}
              <Box sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 5 }}>
                <Typography sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' }, opacity: 0.9, mb: 1.5, fontWeight: 500 }}>
                  {videoCall.callType === 'video' ? 'VIDEO CALLING' : 'CALLING'}
                </Typography>
                <Typography sx={{ fontSize: { xs: 28, sm: 36 }, fontWeight: 700, mb: 2 }}>
                  {selectedUser?.username || selectedUser?.name || 'Unknown'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, animation: 'pulse 2s ease-in-out infinite' }}>
                  <Box sx={{
                    width: 10, height: 10, borderRadius: '50%', bgcolor: '#4fc3f7',
                    animation: 'blink 1s ease-in-out infinite',
                    '@keyframes blink': {
                      '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 }
                    }
                  }} />
                  <Typography sx={{ fontSize: '1rem', opacity: 0.95 }}>{videoCall.callType === 'video' ? 'Video calling…' : 'Calling…'}</Typography>
                </Box>
              </Box>



              {/* Cancel button (bottom) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, pb: { xs: 6, sm: 8 }, zIndex: 5 }}>
                <IconButton
                  onClick={() => {
                    handleCallEnd();
                  }}
                  sx={{ width: { xs: 72, sm: 80 }, height: { xs: 72, sm: 80 }, borderRadius: '50%', bgcolor: '#ff3b30', color: '#fff' }}
                >
                  <PhoneIcon sx={{ transform: 'rotate(135deg)', fontSize: 34 }} />
                </IconButton>
                <Typography variant="body2" sx={{ color: '#fff', opacity: 0.85, fontWeight: 600 }}>Cancel</Typography>
              </Box>
            </Box>
          </Dialog>
        )}

        {/* ✅ CALLING DIALOG - Show "Calling..." with 30-second timeout */}
        {videoCall.calling && !videoCall.callAccepted && !videoCall.callBusy && (
          <Dialog
            open={videoCall.calling && !videoCall.callAccepted && !videoCall.callBusy}
            onClose={() => { }}
            fullScreen
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
                backdropFilter: 'blur(10px)'
              }
            }}
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
          >
            <Box sx={{
              height: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              color: '#fff',
              background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
              overflow: 'hidden'
            }}>
              {/* Status bar simulation (top) */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                pt: 1.5,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                zIndex: 10,
                height: 40
              }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Typography>
              </Box>

              {/* Animated background circles */}
              <Box sx={{
                position: 'absolute',
                width: 400,
                height: 400,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.08)',
                top: '-100px',
                left: '-100px',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%': { transform: 'translate(0, 0)' },
                  '50%': { transform: 'translate(20px, 20px)' },
                  '100%': { transform: 'translate(0, 0)' }
                }
              }} />
              <Box sx={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.05)',
                bottom: '-80px',
                right: '-80px',
                animation: 'float 8s ease-in-out infinite reverse'
              }} />

              {/* Recipient Avatar - Large centered */}
              <Box sx={{
                position: 'relative',
                mt: { xs: 8, sm: 10 },
                animation: 'slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '@keyframes slideDown': {
                  '0%': { transform: 'translateY(-80px)', opacity: 0 },
                  '100%': { transform: 'translateY(0)', opacity: 1 }
                }
              }}>
                <Avatar
                  src={selectedUser?.profilePic}
                  sx={{
                    width: { xs: 100, sm: 130 },
                    height: { xs: 100, sm: 130 },
                    border: '4px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>

              {/* Name */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5" sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.8rem' },
                  mb: 0.5
                }}>
                  {selectedUser?.username}
                </Typography>
                <Typography sx={{
                  fontSize: '1rem',
                  opacity: 0.9,
                  mb: 2
                }}>
                  {videoCall.callType === 'video' ? '📹 Video Call' : '📞 Audio Call'}
                </Typography>

                {/* Calling... with timeout indicator */}
                <Typography sx={{
                  fontSize: '0.95rem',
                  opacity: 0.8,
                  mb: 1,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.8 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.8 }
                  }
                }}>
                  {videoCall.callingTimeout ? '❌ Call not answered' : '📞 Calling...'}
                </Typography>

                {/* 30-second countdown timer display */}
                <Typography sx={{
                  fontSize: '0.85rem',
                  opacity: 0.7,
                  mt: 1
                }}>
                  Waiting for response... (up to 30 seconds)
                </Typography>
              </Box>

              {/* Animated calling pulses */}
              <Box sx={{
                position: 'relative',
                my: 3,
                height: 120,
                width: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Outer pulse ring */}
                <Box sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px solid rgba(76, 175, 80, 0.3)',
                  animation: 'ring 2s ease-out infinite',
                  '@keyframes ring': {
                    '0%': { transform: 'scale(0.5)', opacity: 1 },
                    '100%': { transform: 'scale(1.3)', opacity: 0 }
                  }
                }} />

                {/* Middle pulse ring */}
                <Box sx={{
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  borderRadius: '50%',
                  border: '2px solid rgba(76, 175, 80, 0.5)',
                  animation: 'ring 2s ease-out 0.4s infinite',
                  '@keyframes ring': {
                    '0%': { transform: 'scale(0.5)', opacity: 1 },
                    '100%': { transform: 'scale(1.3)', opacity: 0 }
                  }
                }} />

                {/* Inner call icon */}
                <Box sx={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '2.5rem'
                }}>
                  📞
                </Box>
              </Box>

              {/* End Call Button */}
              <Box sx={{ mb: 4, width: '100%', px: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCallEnd}
                  sx={{
                    height: 56,
                    borderRadius: 50,
                    bgcolor: '#f44336',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#d32f2f' },
                    boxShadow: '0 4px 20px rgba(244, 67, 54, 0.4)'
                  }}
                >
                  End Call
                </Button>
              </Box>
            </Box>
          </Dialog>
        )}

        {/* ✅ BUSY SIGNAL DIALOG - Show when simultaneous calls detected */}
        {videoCall.callBusy && (
          <Dialog
            open={videoCall.callBusy}
            onClose={() => { }}
            fullScreen
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
                backdropFilter: 'blur(10px)'
              }
            }}
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
          >
            <Box sx={{
              height: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              color: '#fff',
              background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
              overflow: 'hidden',
              gap: 3
            }}>
              {/* Status bar simulation (top) */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                pt: 1.5,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                zIndex: 10,
                height: 40
              }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Typography>
              </Box>

              {/* Busy Icon with Pulse Animation */}
              <Box sx={{
                position: 'relative',
                mt: 8,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                  '100%': { transform: 'scale(1)', opacity: 1 }
                }
              }}>
                <Box sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem'
                }}>
                  📞
                </Box>
              </Box>

              {/* Line Busy Text */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="h4" sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.8rem', sm: '2.2rem' },
                  mb: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  Line Busy
                </Typography>
                <Typography sx={{
                  fontSize: '1rem',
                  opacity: 0.9,
                  textShadow: '0 1px 5px rgba(0,0,0,0.2)'
                }}>
                  Simultaneous calls detected
                </Typography>
                <Typography sx={{
                  fontSize: '0.85rem',
                  opacity: 0.8,
                  mt: 2,
                  textShadow: '0 1px 5px rgba(0,0,0,0.2)'
                }}>
                  Auto-ending in 30 seconds...
                </Typography>
              </Box>

              {/* Busy Sound Indicator */}
              <Box sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                justifyContent: 'center',
                mt: 3
              }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <Box
                    key={i}
                    sx={{
                      width: 4,
                      height: { xs: 20 + i * 6, sm: 24 + i * 8 },
                      bgcolor: '#fff',
                      borderRadius: 2,
                      animation: `wave 0.6s ease-in-out ${i * 0.1}s infinite`,
                      '@keyframes wave': {
                        '0%': { height: 20 + i * 6 },
                        '50%': { height: 40 + i * 10 },
                        '100%': { height: 20 + i * 6 }
                      }
                    }}
                  />
                ))}
              </Box>

              {/* Busy.mp3 Audio Element (plays via VideoCall.js) */}
              <audio autoPlay loop style={{ display: 'none' }} id="busy-audio" src="/busy.mp3" />
            </Box>
          </Dialog>
        )}

        {videoCall.receivingCall && (
          <Dialog
            open={videoCall.receivingCall}
            onClose={() => { }}
            fullScreen
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
                backdropFilter: 'blur(10px)'
              }
            }}
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
          >
            <Box sx={{
              height: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              color: '#fff',
              background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
              overflow: 'hidden' // Prevent scroll
            }}>
              {/* Status bar simulation (top) */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                pt: 1.5,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                zIndex: 10,
                height: 40
              }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Typography>
              </Box>

              {/* Animated background circles */}
              <Box sx={{
                position: 'absolute',
                width: 400,
                height: 400,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.08)',
                top: '-100px',
                left: '-100px',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%': { transform: 'translate(0, 0)' },
                  '50%': { transform: 'translate(20px, 20px)' },
                  '100%': { transform: 'translate(0, 0)' }
                }
              }} />
              <Box sx={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.05)',
                bottom: '-80px',
                right: '-80px',
                animation: 'float 8s ease-in-out infinite reverse'
              }} />

              {/* Caller Avatar - Large centered with border */}
              <Box sx={{
                position: 'relative',
                mt: { xs: 8, sm: 10 },
                animation: 'slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '@keyframes slideDown': {
                  '0%': { transform: 'translateY(-80px)', opacity: 0 },
                  '100%': { transform: 'translateY(0)', opacity: 1 }
                }
              }}>
                <Avatar
                  src={videoCall.call?.from ? dbFriends.find(f => f._id === videoCall.call.from)?.profilePic : selectedUser?.profilePic}
                  sx={{
                    width: { xs: 120, sm: 140 },
                    height: { xs: 120, sm: 140 },
                    border: '6px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                    fontSize: 50
                  }}
                />
                {/* Pulsing ring animation */}
                <Box sx={{
                  position: 'absolute',
                  inset: -16,
                  borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.4)',
                  animation: 'ringing 2s ease-out infinite',
                  '@keyframes ringing': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1
                    },
                    '100%': {
                      transform: 'scale(1.5)',
                      opacity: 0
                    }
                  }
                }} />
              </Box>

              {/* Caller Info - Username below avatar */}
              <Box sx={{
                textAlign: 'center',
                mt: { xs: 3, sm: 4 },
                zIndex: 5
              }}>
                <Typography sx={{
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  opacity: 0.9,
                  letterSpacing: 1,
                  mb: 1.5,
                  fontWeight: 500
                }}>
                  {videoCall.callType === 'video' ? 'INCOMING VIDEO CALL' : 'INCOMING CALL'}
                </Typography>

                {/* Caller Name */}
                <Typography sx={{
                  fontSize: { xs: 28, sm: 36 },
                  fontWeight: 700,
                  mb: 1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  {videoCall.call.callerName || 'Unknown'}
                </Typography>

                {/* Ringing status with dot */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  <Box sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#4fc3f7',
                    animation: 'blink 1s ease-in-out infinite',
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 }
                    }
                  }} />
                  <Typography sx={{
                    fontSize: '1rem',
                    opacity: 0.95,
                    fontWeight: 500,
                    letterSpacing: 0.5
                  }}>
                    {videoCall.callType === 'video' ? 'Incoming video call...' : 'Ringing...'}
                  </Typography>
                </Box>
              </Box>

              {/* Option Buttons: Decline & Message */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                width: '100%',
                maxWidth: 290,
                mt: { xs: 4, sm: 6 },
                mb: 2,
                zIndex: 5,
                animation: 'slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                {/* Remind Me / Decline Option */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={videoCall.rejectCall}
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(5px)',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 59, 48, 0.2)',
                        color: '#ff3b30',
                        border: '1px solid rgba(255, 59, 48, 0.4)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: '#fff', opacity: 0.8, fontWeight: 500 }}>
                    Remind Me
                  </Typography>
                </Box>

                {/* Message Option */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={videoCall.rejectCall}
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(5px)',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <MessageIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: '#fff', opacity: 0.8, fontWeight: 500 }}>
                    Message
                  </Typography>
                </Box>
              </Box>

              {/* Slide to Answer component at the bottom */}
              <Box sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                pb: { xs: 8, sm: 10 },
                zIndex: 5,
                animation: 'slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <SlideToAnswer onAnswer={answerCallHandler} onReject={videoCall.rejectCall} />
              </Box>
            </Box>
          </Dialog>
        )}
        {videoCall.callAccepted && videoCall.callStarted && (
          <Dialog
            open={videoCall.callAccepted && videoCall.callStarted}
            onClose={() => { }}
            fullScreen
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
                backdropFilter: 'blur(10px)'
              }
            }}
            BackdropProps={{ sx: { backgroundColor: 'transparent' } }}
          >
            <Box sx={{
              height: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              color: '#fff',
              background: 'linear-gradient(135deg, var(--primary-color, #ff4d86) 0%, #0f0507 100%)',
              overflow: 'hidden'
            }}>
              {/* Status bar */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                pt: 1.5,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                zIndex: 10,
                height: 40
              }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Typography>
              </Box>

              {/* Animated background */}
              <Box sx={{
                position: 'absolute',
                width: 400,
                height: 400,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.08)',
                top: '-100px',
                left: '-100px',
                animation: 'float 6s ease-in-out infinite'
              }} />

              {/* Call Header - Display correct username on top */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                pt: { xs: 3, sm: 4 },
                pb: { xs: 2, sm: 3 },
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                zIndex: 5
              }}>
                {/* Display correct name */}
                <Typography sx={{
                  fontSize: { xs: 28, sm: 36 },
                  fontWeight: 700,
                  color: '#fff',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  {(() => {
                    // If we initiated, show selectedUser name
                    if (selectedUser) {
                      return selectedUser?.username || selectedUser?.name || 'Unknown';
                    }
                    // If we received, show caller name
                    if (videoCall.call?.callerName) {
                      return videoCall.call.callerName;
                    }
                    return 'Unknown';
                  })()}
                </Typography>
              </Box>

              {/* Avatar & Call Info - Display profile picture with duration and status below */}
              {/* Hidden during video call once remote stream arrives (WhatsApp style) */}
              {!(videoCall.callType === 'video' && videoCall.remoteStream) && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mt: { xs: 11, sm: 13 },
                  zIndex: 10,
                  animation: 'slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  pointerEvents: 'none',
                }}>
                  {/* Get the correct profile picture */}
                  {(() => {
                    // If we initiated the call, show selectedUser (receiver)
                    if (selectedUser) {
                      return (
                        <Avatar
                          src={selectedUser?.profilePic || selectedUser?.image}
                          sx={{
                            width: { xs: 120, sm: 140 },
                            height: { xs: 120, sm: 140 },
                            border: '6px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                            fontSize: 50
                          }}
                        />
                      );
                    }
                    // If we received the call, show the caller (from dbFriends)
                    if (videoCall.call?.from) {
                      const callerUser = dbFriends.find(f => f._id === videoCall.call.from);
                      return (
                        <Avatar
                          src={callerUser?.profilePic || callerUser?.image}
                          sx={{
                            width: { xs: 120, sm: 140 },
                            height: { xs: 120, sm: 140 },
                            border: '6px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                            fontSize: 50
                          }}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Call Duration Timer - Moved to bottom of profile image */}
                  <Typography sx={{
                    fontSize: { xs: 18, sm: 22 },
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: '#fff',
                    opacity: 0.9,
                    mt: 2,
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {videoCall.callDuration}
                  </Typography>

                  {/* Call Status - Moved to bottom of profile image */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#4fc3f7',
                      animation: 'blink 1s ease-in-out infinite'
                    }} />
                    <Typography sx={{
                      fontSize: '0.9rem',
                      color: '#fff',
                      opacity: 0.85,
                      fontWeight: 500,
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                    }}>
                      {videoCall.stream ? 'Connected' : 'Connecting...'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Video UI - Remote fullscreen (WhatsApp style - no preview) */}
              {videoCall.callType === 'video' && videoCall.remoteStream && (
                <>
                  <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: '#000' }}>
                    <video
                      ref={(el) => {
                        if (videoCall.userVideo) {
                          videoCall.userVideo.current = el;
                        }
                        if (el && videoCall.remoteStream) {
                          if (el.srcObject !== videoCall.remoteStream) {
                            console.log('📺 [Callback Ref] Attaching remoteStream to remote video element');
                            el.srcObject = videoCall.remoteStream;
                            const playPromise = el.play();
                            if (playPromise !== undefined) {
                              playPromise
                                .then(() => console.log('✅ Remote video play successful via callback ref'))
                                .catch(err => console.warn('Remote video autoplay failed:', err));
                            }
                          }
                        }
                      }}
                      autoPlay={true}
                      playsInline={true}
                      muted={false}
                      controls={false}
                      crossOrigin="anonymous"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        background: '#000',
                        display: 'block'
                      }}
                    />
                  </Box>

                  {/* Local Self Video (PiP Style Overlay) */}
                  {videoCall.stream && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: { xs: 80, sm: 90 },
                        right: 20,
                        width: { xs: 110, sm: 140 },
                        height: { xs: 150, sm: 190 },
                        borderRadius: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                        overflow: 'hidden',
                        zIndex: 4,
                        backgroundColor: '#1c1c1e',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {!videoCall.isCameraOff ? (
                        <>
                          <video
                            ref={(el) => {
                              if (el && videoCall.stream) {
                                if (el.srcObject !== videoCall.stream) {
                                  el.srcObject = videoCall.stream;
                                  el.muted = true;
                                  el.play().catch(err => console.warn('Self-video play failed:', err));
                                }
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transform: videoCall.cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
                              display: 'block'
                            }}
                          />
                          {/* Round Arrow Switch Camera Button overlayed on PiP (WhatsApp style) */}
                          <IconButton
                            disabled={videoCall.switchingCamera}
                            onClick={(e) => {
                              e.stopPropagation();
                              videoCall.switchCamera();
                            }}
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              zIndex: 5,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.8)',
                                transform: 'scale(1.1) rotate(180deg)'
                              },
                              '&:active': {
                                transform: 'scale(0.95)'
                              }
                            }}
                          >
                            <FlipIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 2 }}>
                          <Avatar
                            src={user?.profilePic || user?.image}
                            sx={{
                              width: { xs: 44, sm: 54 },
                              height: { xs: 44, sm: 54 },
                              border: '2px solid rgba(255,255,255,0.4)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, textAlign: 'center' }}>
                            Camera Off
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}

              {/* WhatsApp-style Call Control Icons - Floating at bottom */}
              <Box sx={{
                display: 'flex',
                gap: { xs: 2, sm: 3 },
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                bottom: { xs: 20, sm: 30 },
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 5,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '50px',
                padding: { xs: '12px 24px', sm: '14px 28px' },
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                {/* Mute/Unmute - Microphone */}
                <IconButton
                  onClick={videoCall.toggleMicrophone}
                  sx={{
                    width: { xs: 48, sm: 54 },
                    height: { xs: 48, sm: 54 },
                    borderRadius: '50%',
                    bgcolor: videoCall.isMicrophoneMuted ? 'rgba(255, 100, 87, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: videoCall.isMicrophoneMuted ? '2px solid #ff6457' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}>
                  {videoCall.isMicrophoneMuted ? (
                    <MicOffIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
                  ) : (
                    <MicIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
                  )}
                </IconButton>

                {/* Camera On/Off - only for video calls */}
                {videoCall.callType === 'video' && (
                  <IconButton
                    onClick={videoCall.toggleCamera}
                    sx={{
                      width: { xs: 48, sm: 54 },
                      height: { xs: 48, sm: 54 },
                      borderRadius: '50%',
                      bgcolor: videoCall.isCameraOff ? 'rgba(255, 100, 87, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      border: videoCall.isCameraOff ? '2px solid #ff6457' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                        transform: 'scale(1.1)'
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      }
                    }}>
                    {videoCall.isCameraOff ? (
                      <VideocamIcon sx={{ fontSize: { xs: 24, sm: 26 }, opacity: 0.5 }} />
                    ) : (
                      <VideocamIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
                    )}
                  </IconButton>
                )}

                {/* Switch Camera - Rotate front/back */}
                {videoCall.callType === 'video' && (
                  <Tooltip title="Rotate Camera">
                    <IconButton
                      disabled={videoCall.switchingCamera}
                      onClick={videoCall.switchCamera}
                      sx={{
                        width: { xs: 48, sm: 54 },
                        height: { xs: 48, sm: 54 },
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          transform: 'scale(1.1)'
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        }
                      }}>
                      <FlipIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Native Picture in Picture */}
                {videoCall.callType === 'video' && document.pictureInPictureEnabled && (
                  <Tooltip title="Multitask PiP">
                    <IconButton
                      onClick={async () => {
                        try {
                          if (document.pictureInPictureElement) {
                            await document.exitPictureInPicture();
                          } else if (videoCall.userVideo.current) {
                            await videoCall.userVideo.current.requestPictureInPicture();
                          }
                        } catch (err) {
                          console.error('Failed to toggle Picture-in-Picture:', err);
                        }
                      }}
                      sx={{
                        width: { xs: 48, sm: 54 },
                        height: { xs: 48, sm: 54 },
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          transform: 'scale(1.1)'
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        }
                      }}>
                      <PictureInPictureIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Speaker Phone - Toggle earpiece/speaker for Android */}
                <Tooltip title={videoCall.isSpeakerOn ? "Switch to earpiece" : "Switch to speaker"}>
                  <IconButton
                    onClick={videoCall.toggleSpeakerPhone}
                    sx={{
                      width: { xs: 48, sm: 54 },
                      height: { xs: 48, sm: 54 },
                      borderRadius: '50%',
                      bgcolor: videoCall.isSpeakerOn ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      border: videoCall.isSpeakerOn ? '2px solid #4caf50' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                        transform: 'scale(1.1)'
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      }
                    }}>
                    {videoCall.isSpeakerOn ? (
                      <VolumeUpIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
                    ) : (
                      <PhoneIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
                    )}
                  </IconButton>
                </Tooltip>

                {/* End Call - Red button */}
                <Box sx={{ width: '1px', height: 30, bgcolor: 'rgba(255,255,255,0.2)' }} />

                <IconButton
                  onClick={handleCallEnd}
                  sx={{
                    width: { xs: 48, sm: 54 },
                    height: { xs: 48, sm: 54 },
                    borderRadius: '50%',
                    bgcolor: '#ef4444',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                    '&:hover': {
                      bgcolor: '#dc2626',
                      transform: 'scale(1.1)',
                      boxShadow: '0 6px 24px rgba(239, 68, 68, 0.6)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}>
                  <PhoneIcon sx={{ fontSize: { xs: 24, sm: 26 }, transform: 'rotate(135deg)' }} />
                </IconButton>
              </Box>

              {/* Audio element for remote peer audio */}
              {/* For video calls: muted (video element handles audio via speaker) */}
              {/* For audio calls: unmuted (this is the primary audio path for earpiece/speaker routing) */}
              <audio
                ref={videoCall.remoteAudioRef}
                autoPlay={true}
                playsInline={true}
                muted={videoCall.callType === 'video'}
                controls={false}
                crossOrigin="anonymous"
                preload="auto"
                style={{ display: 'none' }}
              />
            </Box>
          </Dialog>
        )}
      </div>


      {/* Sticker dialog */}
      <StickerDialog
        ref={stickerRef}
        open={showStickerDialog}
        setOpen={setShowStickerDialog}
        user={user}
        selectedUser={selectedUser}
        socket={socket}
        setMessages={setMessages}
      />


      {/* Drawing (Doodle) Dialog */}
      <Drawing
        open={doodleMode}
        onClose={() => setDoodleMode(false)}
        user={user}
        selectedUser={selectedUser}
        socket={socket}
        setMessages={setMessages}
      />

      {/* Game Selector Dialog */}
      <GameSelectorDialog
        open={gameSelectorOpen}
        onClose={() => setGameSelectorOpen(false)}
        onSelectGame={handleSelectGame}
      />



      {/* WhatsApp-style Full-Screen Image Preview */}
      <Dialog
        open={!!fullScreenImage}
        onClose={handleCloseFullScreen}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <IconButton
            onClick={handleCloseFullScreen}
            sx={{
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Photo</Typography>
          <Box sx={{ width: 40 }} /> {/* Spacer */}
        </Box>

        {/* Image Display Area - Full Screen Zoomable */}
        <Box
          ref={imgZoomContainerRef}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#000',
            position: 'relative',
            overflow: 'hidden',
            touchAction: 'none',
            cursor: imgZoom > 1 ? 'grab' : 'default',
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            if (imgZoom <= 1) return;
            imgDragRef.current = { dragging: true, startX: e.clientX - imgPos.x, startY: e.clientY - imgPos.y, lastX: imgPos.x, lastY: imgPos.y };
          }}
          onMouseMove={(e) => {
            if (!imgDragRef.current.dragging) return;
            setImgPos({ x: e.clientX - imgDragRef.current.startX, y: e.clientY - imgDragRef.current.startY });
          }}
          onMouseUp={() => { imgDragRef.current.dragging = false; }}
          onMouseLeave={() => { imgDragRef.current.dragging = false; }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              // Pinch start
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              imgPinchRef.current = { pinching: true, startDist: Math.hypot(dx, dy), startZoom: imgZoom };
            } else if (e.touches.length === 1) {
              // Double-tap detection
              const now = Date.now();
              if (now - imgLastTapRef.current < 300) {
                // Double tap: toggle zoom
                if (imgZoom > 1) {
                  setImgZoom(1);
                  setImgPos({ x: 0, y: 0 });
                } else {
                  setImgZoom(2.5);
                }
                imgLastTapRef.current = 0;
              } else {
                imgLastTapRef.current = now;
                // Pan start
                if (imgZoom > 1) {
                  imgDragRef.current = { dragging: true, startX: e.touches[0].clientX - imgPos.x, startY: e.touches[0].clientY - imgPos.y };
                }
              }
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && imgPinchRef.current.pinching) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              const dist = Math.hypot(dx, dy);
              const scale = dist / imgPinchRef.current.startDist;
              const next = Math.min(Math.max(imgPinchRef.current.startZoom * scale, 1), 5);
              if (next === 1) setImgPos({ x: 0, y: 0 });
              setImgZoom(next);
            } else if (e.touches.length === 1 && imgDragRef.current.dragging && imgZoom > 1) {
              setImgPos({ x: e.touches[0].clientX - imgDragRef.current.startX, y: e.touches[0].clientY - imgDragRef.current.startY });
            }
          }}
          onTouchEnd={(e) => {
            if (e.touches.length < 2) imgPinchRef.current.pinching = false;
            if (e.touches.length === 0) imgDragRef.current.dragging = false;
          }}
        >
          {fullScreenImage && (
            <Box
              component="img"
              src={fullScreenImage.src}
              alt="full-screen"
              draggable={false}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${imgZoom}) translate(${imgPos.x / imgZoom}px, ${imgPos.y / imgZoom}px)`,
                transition: imgDragRef.current?.dragging ? 'none' : 'transform 0.2s ease-out',
                pointerEvents: 'none',
                animation: 'fadeIn 0.3s ease-in',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0 },
                  '100%': { opacity: 1 }
                }
              }}
            />
          )}
        </Box>

        {/* Bottom Info Bar - WhatsApp Style */}
        <Box sx={{
          display: 'flex',
          justifyContent: fullScreenImage?.isProfileImage ? 'center' : 'space-between',
          alignItems: 'center',
          p: 2,
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          gap: 2
        }}>
          {/* Download button - hidden for profile images */}
          {!fullScreenImage?.isProfileImage && (
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={async () => {
                const imgSrc = fullScreenImage?.src || (typeof fullScreenImage === 'string' ? fullScreenImage : null);
                if (!imgSrc) return;

                if (isNativeApp()) {
                  const hasPermission = await requestStoragePermission();
                  if (!hasPermission) {
                    toast.error('Permission denied: cannot save photo.');
                    return;
                  }

                  try {
                    const { AudioRoute } = window.Capacitor?.Plugins || {};
                    const fileName = `photo-${Date.now()}.jpg`;
                    let base64Data = null;

                    if (imgSrc.startsWith('data:image')) {
                      base64Data = imgSrc.includes(';base64,') ? imgSrc.split(';base64,')[1] : imgSrc;
                    }

                    if (AudioRoute && (typeof AudioRoute.saveImageToGallery === 'function' || typeof AudioRoute.saveFileToDownloads === 'function')) {
                      const saveMethod = AudioRoute.saveImageToGallery || AudioRoute.saveFileToDownloads;
                      if (base64Data) {
                        await saveMethod({
                          base64Data: base64Data,
                          fileName: fileName,
                          mimeType: 'image/jpeg'
                        });
                      } else {
                        await saveMethod({
                          url: imgSrc,
                          fileName: fileName,
                          mimeType: 'image/jpeg'
                        });
                      }
                      toast.success('Photo saved to device!');
                    } else {
                      if (!base64Data && (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'))) {
                        const res = await fetch(imgSrc);
                        const blob = await res.blob();
                        base64Data = await new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result.split(',')[1]);
                          reader.readAsDataURL(blob);
                        });
                      }

                      if (base64Data) {
                        await Filesystem.writeFile({
                          path: `Download/${fileName}`,
                          data: base64Data,
                          directory: Directory.ExternalStorage,
                          recursive: true
                        });
                        toast.success('Photo saved to device Downloads!');
                      } else {
                        toast.error('Could not save photo.');
                      }
                    }
                  } catch (err) {
                    console.error('Failed to save image natively:', err);
                    toast.error('Failed to save photo.');
                  }
                } else {
                  try {
                    const link = document.createElement('a');
                    link.href = imgSrc;
                    link.download = `photo-${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Photo download started.');
                  } catch (err) {
                    console.error('Failed to trigger web download:', err);
                    toast.error('Could not download photo.');
                  }
                }
              }}
              sx={{
                color: '#fff',
                borderColor: '#fff',
                borderRadius: 50,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              Save
            </Button>
          )}

          {/* Share button - hidden for profile images */}
          {!fullScreenImage?.isProfileImage && (
            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={() => {
                if (fullScreenImage?.src) {
                  setCapturedImage(fullScreenImage.src);
                  setSelectedShareFriends([]);
                  setShareDialogOpen(true);
                }
              }}
              sx={{
                color: '#fff',
                borderColor: '#fff',
                borderRadius: 50,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              Share
            </Button>
          )}

          {/* Close button - round icon for profile images, normal button for chat images */}
          {fullScreenImage?.isProfileImage ? (
            <IconButton
              onClick={handleCloseFullScreen}
              sx={{
                bgcolor: 'var(--primary-color, #ff4d86)',
                color: '#fff',
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(255,77,134,0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'var(--primary-color, #ff3373)',
                  boxShadow: '0 6px 16px rgba(255,77,134,0.6)',
                  transform: 'scale(1.1)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          ) : (
            <Button
              variant="contained"
              startIcon={<CloseIcon />}
              onClick={handleCloseFullScreen}
              sx={{
                bgcolor: 'var(--primary-color, #ff4d86)',
                color: '#fff',
                borderRadius: 50,
                px: 3,
                py: 1.2,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(255,77,134,0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'var(--primary-color, #ff3373)',
                  boxShadow: '0 6px 16px rgba(255,77,134,0.6)',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              Close
            </Button>
          )}
        </Box>
      </Dialog>
      {/* Gesture Drawing Overlay */}
      {showGestureOverlay && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            bgcolor: 'rgba(15, 12, 25, 0.9)', // nice deep dark glass backdrop
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            touchAction: 'none'
          }}
        >
          {/* Header */}
          <Box sx={{ position: 'absolute', top: 20, width: '100%', px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5, background: 'linear-gradient(45deg, #ec407a, #7e57c2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {gestureUnlockTarget ? "Unlock Chat" : "Gesture Unlock Chat"}
            </Typography>
            <IconButton onClick={() => { setShowGestureOverlay(false); setGestureUnlockTarget(null); clearGestureCanvas(); }} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Canvas Wrapper */}
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ textAlign: 'center', maxWidth: '300px' }}>
              {gestureUnlockTarget
                ? `Draw the custom sign for ${gestureUnlockTarget.username || gestureUnlockTarget.name} to unlock this chat.`
                : "Draw a contact's sign in a single continuous stroke to open their chat."
              }
            </Typography>

            <Box
              sx={{
                width: 320,
                height: 320,
                borderRadius: 4,
                border: '2px solid rgba(236, 64, 122, 0.3)',
                boxShadow: '0 8px 32px rgba(236, 64, 122, 0.15)',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <canvas
                ref={gestureCanvasRef}
                width={320}
                height={320}
                onMouseDown={handleGestureStart}
                onMouseMove={handleGestureDraw}
                onMouseUp={handleGestureEnd}
                onTouchStart={handleGestureStart}
                onTouchMove={handleGestureDraw}
                onTouchEnd={handleGestureEnd}
                style={{ cursor: 'crosshair', display: 'block' }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={clearGestureCanvas}
                sx={{
                  borderRadius: 5,
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff',
                  '&:hover': { borderColor: '#fff' }
                }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setShowGestureOverlay(false);
                  setGestureUnlockTarget(null);
                  clearGestureCanvas();
                  navigate('/finder');
                }}
                sx={{
                  borderRadius: 5,
                  textTransform: 'none',
                  bgcolor: 'var(--primary-color, #ff4d86)',
                  color: '#fff',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'var(--primary-color, #ff3373)',
                    transform: 'scale(1.05)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                Add new
              </Button>
            </Box>
          </Box>

          {/* Feedback/Status overlay inside drawing page */}
          {gestureStatus && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 60,
                px: 3,
                py: 1,
                borderRadius: 5,
                bgcolor: gestureStatus.success ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)',
                color: '#fff',
                fontWeight: 600,
                boxShadow: 4,
                animation: 'bounce 0.5s ease'
              }}
            >
              {gestureStatus.message}
            </Box>
          )}
        </Box>
      )}



      {/* WhatsApp-style Document Open Dialog */}
      <Dialog
        open={docDialogOpen}
        onClose={() => {
          setDocDialogOpen(false);
          setShowReaderSelection(false);
          setOpeningSimulated(false);
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            padding: 0,
            maxWidth: '360px',
            width: '90%',
            boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
            bgcolor: 'var(--dialog-bg, #ffffff)',
            color: 'var(--text-color, #000)',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out'
          }
        }}
      >
        {openingSimulated ? (
          // Loading state while opening/saving
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#25D366', mb: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {simulatedAppName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
              Please wait...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)',
              px: 2.5,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              {/* File type badge */}
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem', letterSpacing: 0.5 }}>
                  {docDialogFile?.name?.split('.').pop()?.toUpperCase()?.slice(0, 4) || 'FILE'}
                </Typography>
              </Box>
              {/* File info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{
                  color: '#fff',
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.95rem'
                }}>
                  {docDialogFile?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', mt: 0.3 }}>
                  {(() => {
                    if (!docDialogFile?.data) return '';
                    const base64Length = docDialogFile.data.length - (docDialogFile.data.indexOf(',') + 1);
                    const sizeInBytes = (base64Length * 3) / 4;
                    if (sizeInBytes > 1024 * 1024) return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
                    return `${(sizeInBytes / 1024).toFixed(0)} KB`;
                  })()} · {docDialogFile?.name?.split('.').pop()?.toUpperCase() || 'FILE'} document
                </Typography>
              </Box>
              {/* Close X */}
              <IconButton
                onClick={() => {
                  setDocDialogOpen(false);
                  setShowReaderSelection(false);
                }}
                sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff' } }}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Open Button */}
              <Button
                fullWidth
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() => handleOpenWithApp('open')}
                sx={{
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1.5,
                  fontSize: '0.95rem',
                  bgcolor: '#25D366',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                  '&:hover': {
                    bgcolor: '#128C7E',
                    boxShadow: '0 6px 18px rgba(18, 140, 126, 0.4)'
                  },
                  '&:active': { transform: 'scale(0.98)' },
                  transition: 'all 0.2s ease'
                }}
              >
                {isNativeApp() ? 'Open with...' : 'Open'}
              </Button>

              {/* Save to Device Button */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowDownwardIcon />}
                onClick={() => handleOpenWithApp('download')}
                sx={{
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.3,
                  fontSize: '0.9rem',
                  borderColor: 'rgba(0,0,0,0.12)',
                  color: 'var(--text-color, #333)',
                  '&:hover': {
                    borderColor: '#25D366',
                    bgcolor: 'rgba(37, 211, 102, 0.06)',
                    color: '#075E54'
                  },
                  '&:active': { transform: 'scale(0.98)' },
                  transition: 'all 0.2s ease'
                }}
              >
                Save to Device
              </Button>
            </Box>
          </>
        )}
      </Dialog>

      {/* Premium Interactive Document Previewer Dialog (Drive & Office style) */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        fullScreen={isMobile}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: isMobile ? '100%' : '85vh',
            maxHeight: isMobile ? '100%' : '800px',
            bgcolor: previewTheme === 'drive' ? '#202124' : '#f3f2f1',
            color: previewTheme === 'drive' ? '#ffffff' : '#323130',
            borderRadius: isMobile ? 0 : '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }
        }}
      >
        {/* Header bar */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: previewTheme === 'drive' ? '#2d2e30' : getOfficeColor(previewName),
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 10,
          flexShrink: 0
        }}>
          {/* File info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: '50%' }}>
            <IconButton onClick={() => setPreviewDialogOpen(false)} size="small" sx={{ color: '#ffffff' }}>
              <ArrowBackIcon />
            </IconButton>
            <DocumentIcon sx={{ fontSize: 24, color: '#ffffff' }} />
            <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ color: '#ffffff' }}>
              {previewName}
            </Typography>
          </Box>

          {/* Action Tools */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
            {/* Zoom controls for Image & Text */}
            {(previewType === 'image' || previewType === 'text') && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: { xs: 0.5, sm: 2 } }}>
                <IconButton
                  onClick={() => setPreviewZoom(prev => Math.max(25, prev - 25))}
                  size="small"
                  sx={{ color: '#ffffff' }}
                  title="Zoom Out"
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center', fontWeight: 600 }}>
                  {previewZoom}%
                </Typography>
                <IconButton
                  onClick={() => setPreviewZoom(prev => Math.min(300, prev + 25))}
                  size="small"
                  sx={{ color: '#ffffff' }}
                  title="Zoom In"
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* Print (Only for PDF and Image on desktop) */}
            {!isMobile && (previewType === 'pdf' || previewType === 'image') && (
              <IconButton
                onClick={() => {
                  try {
                    const printWindow = window.open(previewUrl);
                    if (printWindow) printWindow.print();
                  } catch (e) {
                    console.error('Print failed:', e);
                  }
                }}
                size="small"
                sx={{ color: '#ffffff' }}
                title="Print"
              >
                <PrintIcon />
              </IconButton>
            )}

            {/* Open in New Tab */}
            <IconButton
              onClick={() => {
                if (isNativeApp()) {
                  setPreviewDialogOpen(false);
                  performOpen('open');
                } else {
                  window.open(previewUrl, '_blank');
                }
              }}
              size="small"
              sx={{ color: '#ffffff' }}
              title={isNativeApp() ? "Open Natively" : "Open in Browser Tab"}
            >
              <OpenInNewIcon />
            </IconButton>

            {/* Download */}
            <IconButton
              onClick={() => {
                if (isNativeApp()) {
                  performOpen('download');
                } else {
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = previewName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              size="small"
              sx={{ color: '#ffffff' }}
              title={isNativeApp() ? "Save to Device" : "Download File"}
            >
              <DownloadIcon />
            </IconButton>

            {/* Close */}
            <IconButton onClick={() => setPreviewDialogOpen(false)} size="small" sx={{ color: '#ffffff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content Viewer Area */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: previewType === 'other' ? 'center' : 'flex-start',
          bgcolor: previewTheme === 'drive' ? '#1e1e1e' : '#fdfdfd',
          p: previewType === 'other' ? 4 : 0,
        }}>
          {previewType === 'pdf' && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {isNativeApp() ? (
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center',
                  bgcolor: '#1e1e1e',
                  color: '#fff'
                }}>
                  <DocumentIcon sx={{ fontSize: 64, color: '#ff5722', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#fff' }}>
                    PDF Preview Not Available Natively
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa', mb: 3, maxWidth: '280px' }}>
                    Android WebView does not support rendering PDF documents inline.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setPreviewDialogOpen(false);
                        performOpen('open');
                      }}
                      sx={{
                        bgcolor: '#25D366',
                        color: '#fff',
                        fontWeight: 700,
                        px: 3,
                        borderRadius: '12px',
                        '&:hover': { bgcolor: '#128C7E' }
                      }}
                    >
                      Open Natively
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        performOpen('download');
                      }}
                      sx={{
                        borderColor: '#fff',
                        color: '#fff',
                        fontWeight: 600,
                        px: 3,
                        borderRadius: '12px',
                        '&:hover': { borderColor: '#25D366', color: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.05)' }
                      }}
                    >
                      Save to Device
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  {/* Optional mobile banner */}
                  {isMobile && (
                    <Box
                      onClick={() => window.open(previewUrl, '_blank')}
                      sx={{
                        bgcolor: '#25D366',
                        color: '#fff',
                        textAlign: 'center',
                        py: 1,
                        px: 2,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}
                    >
                      <OpenInNewIcon fontSize="small" />
                      Tap here if PDF doesn't load or to view fullscreen
                    </Box>
                  )}
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', background: '#ffffff', flex: 1 }}
                    title="Google Drive PDF Previewer"
                  />
                </>
              )}
            </Box>
          )}

          {previewType === 'image' && (
            <Box sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              p: 2
            }}>
              <img
                src={previewUrl}
                alt={previewName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${previewZoom / 100})`,
                  transition: 'transform 0.15s ease-out',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              />
            </Box>
          )}

          {previewType === 'text' && (
            <Box sx={{
              width: '100%',
              maxWidth: '800px',
              mx: 'auto',
              p: 3,
              boxSizing: 'border-box'
            }}>
              <Paper sx={{
                p: 3,
                bgcolor: previewTheme === 'drive' ? '#2d2d2d' : '#f9f9f9',
                color: previewTheme === 'drive' ? '#e0e0e0' : '#333333',
                borderRadius: '8px',
                border: previewTheme === 'drive' ? '1px solid #444' : '1px solid #ddd',
                overflowX: 'auto',
              }}>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
                  fontSize: `${14 * (previewZoom / 100)}px`,
                  lineHeight: 1.6
                }}>
                  {previewTextContent}
                </pre>
              </Paper>
            </Box>
          )}

          {previewType === 'other' && (
            <Card sx={{
              p: 4,
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              bgcolor: 'var(--surface-color, #ffffff)',
              color: 'var(--text-color, #000000)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              <Avatar sx={{
                bgcolor: previewTheme === 'drive' ? '#34A853' : getOfficeColor(previewName),
                color: '#fff',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}>
                <DocumentIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No Preview Available
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                This file format is not supported for inline rendering. You can open it in a new tab or download it directly to view.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (isNativeApp()) {
                      setPreviewDialogOpen(false);
                      performOpen('open');
                    } else {
                      window.open(previewUrl, '_blank');
                    }
                  }}
                  startIcon={<OpenInNewIcon />}
                  sx={{
                    borderRadius: '24px',
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#2196F3',
                    color: '#fff',
                    '&:hover': { bgcolor: '#1976D2' }
                  }}
                >
                  {isNativeApp() ? 'Open Natively' : 'Open in Browser Tab'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (isNativeApp()) {
                      performOpen('download');
                    } else {
                      const link = document.createElement('a');
                      link.href = previewUrl;
                      link.download = previewName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderRadius: '24px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#ccc',
                    color: 'text.primary',
                    '&:hover': { borderColor: '#999', bgcolor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  {isNativeApp() ? 'Save to Device' : 'Download File'}
                </Button>
              </Box>
            </Card>
          )}
        </Box>
      </Dialog>

      {/* Contact Sync Dialog */}
      <ContactSyncDialog
        open={contactSyncDialogOpen}
        onClose={() => {
          setContactSyncDialogOpen(false);
          setShowFinder(false);
        }}
        onSelectUser={handleSelectFromContacts}
        onSelectAllUsers={handleSelectAllFromContacts}
      />

      {/* Share to Friends Dialog */}
      <ShareFriendsDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        dbFriends={dbFriends}
        selectedShareFriends={selectedShareFriends}
        setSelectedShareFriends={setSelectedShareFriends}
        onConfirmShare={handleConfirmShare}
        getProfileSrc={getProfileSrc}
      />

      {/* Message Options Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
        disableRestoreFocus
        keepMounted={false}
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface-color, #fff)',
            color: 'var(--text-color, #000)',
            mt: 0.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 160,
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              py: 1,
              px: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'rgba(240, 98, 146, 0.06)'
              }
            }
          }
        }}
      >
        {/* WhatsApp Reaction Row */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: 0.8,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: 'rgba(0, 0, 0, 0.02)',
          gap: 0.5
        }}>
          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => {
            const hasReacted = selectedMenuMessage?.reactions?.some(r => String(r.userId) === String(user?._id) && r.emoji === emoji);
            return (
              <IconButton
                key={emoji}
                size="small"
                onClick={() => handleReactMessage(selectedMenuMessage, emoji)}
                sx={{
                  fontSize: '1.25rem',
                  p: 0.5,
                  transition: 'transform 0.15s ease',
                  bgcolor: hasReacted ? 'rgba(0,0,0,0.08)' : 'transparent',
                  border: hasReacted ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    transform: 'scale(1.25)',
                    bgcolor: 'rgba(0,0,0,0.06)'
                  }
                }}
              >
                {emoji}
              </IconButton>
            );
          })}
        </Box>

        <MenuItem onClick={() => {
          if (selectedMenuMessage) {
            const content = selectedMenuMessage.text || (selectedMenuMessage.image ? 'Photo' : 'Message');
            const replyMetadataObj = {
              type: 'message_reply',
              originalContent: content,
              originalType: selectedMenuMessage.image ? 'image' : 'text',
              msgId: selectedMenuMessage.id || selectedMenuMessage._id,
              timestamp: selectedMenuMessage.timestamp || Date.now()
            };
            setReplyMetadata(replyMetadataObj);
            setTimeout(() => {
              const inputElement = document.querySelector('input[placeholder="Type..."]');
              if (inputElement) inputElement.focus();
            }, 100);
          }
          handleMessageMenuClose();
        }}>
          Reply
        </MenuItem>

        {selectedMenuMessage && (String(selectedMenuMessage.senderId) === String(user?._id) || selectedMenuMessage.sender === 'You') && selectedMenuMessage.text && (() => {
          const msgTime = new Date(selectedMenuMessage.createdAt || selectedMenuMessage.timestamp || 0).getTime();
          const isWithin15Min = !isNaN(msgTime) && (Date.now() - msgTime <= 15 * 60 * 1000);
          return isWithin15Min ? (
            <MenuItem onClick={handleEditClick}>
              Edit
            </MenuItem>
          ) : null;
        })()}

        <MenuItem onClick={handleDeleteForMe}>
          Delete for Me
        </MenuItem>

        {selectedMenuMessage && (String(selectedMenuMessage.senderId) === String(user?._id) || selectedMenuMessage.sender === 'You') && (() => {
          const msgTime = new Date(selectedMenuMessage.createdAt || selectedMenuMessage.timestamp || 0).getTime();
          const isWithin15Min = !isNaN(msgTime) && (Date.now() - msgTime <= 15 * 60 * 1000);
          return isWithin15Min ? (
            <MenuItem onClick={handleDeleteForEveryone} sx={{ color: '#d32f2f' }}>
              Delete for Everyone
            </MenuItem>
          ) : null;
        })()}
      </Menu>

      {/* Edit Message Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setEditingMessage(null); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'var(--surface-color, #fff)',
            color: 'var(--text-color, #000)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            maxRows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setEditDialogOpen(false); setEditingMessage(null); }} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            sx={{
              bgcolor: 'var(--primary-color, #ec407a)',
              color: '#fff',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: 'var(--primary-color, #d81b60)' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unblock Message Dialog */}
      <Dialog
        open={unblockConfirmOpen}
        onClose={() => setUnblockConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckIcon sx={{ color: '#4caf50' }} />
            </Box>
            <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: '1.1rem' }}>
              Unblock Contact
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Are you sure you want to unblock <Box component="span" sx={{ fontWeight: 700, color: '#ec407a' }}>{userToUnblock?.username || userToUnblock?.name}</Box>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setUnblockConfirmOpen(false)}
            sx={{
              color: '#888',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (userToUnblock) {
                try {
                  await fetch(`${API_BASE_URL}/api/user/${user._id}/unblock`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unblockUserId: userToUnblock._id }),
                  });
                  setBlockedUsers(prev => prev.filter(id => id !== userToUnblock._id));
                  setUnblockConfirmOpen(false);
                  toast.success("User unblocked successfully");
                } catch (e) {
                  toast.error("Failed to unblock user");
                }
              }
            }}
            variant="contained"
            color="success"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              bgcolor: '#4caf50',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                bgcolor: '#45a049',
              },
            }}
          >
            Unblock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Celebration animation canvas overlay */}
      <CelebrationCanvas canvasRef={canvasRef} />

      {/* User Guide Modal - shows only once for new users */}
      <UserGuideModal
        open={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        initialStep={0}
        isDarkTheme={isDarkTheme}
      />
    </>
  );
};

export default ChatPage;
