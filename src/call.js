import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    useMediaQuery,
    CircularProgress,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
    Chip,
    Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallMissedIcon from '@mui/icons-material/CallMissed';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import PhoneIcon from '@mui/icons-material/Phone';
import VideocamIcon from '@mui/icons-material/Videocam';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ClearIcon from '@mui/icons-material/Clear';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import toast from 'react-hot-toast';
import useSwipeBack from './hooks/useSwipeBack';
import API_BASE_URL from './config/apiConfig';
import { getAllCallLogsLocally } from './db/callLogsDb';

// --- COLOR PALETTE & DESIGN TOKENS ---
const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_DARK_GREEN = '#128C7E';
const MISSED_RED = '#ef4444';
const GRAY_TEXT = '#64748b';

// ⚡ Global module-level in-memory cache for 0ms instant loading
let inMemoryCallLogs = null;
let inMemoryUserId = null;
let inMemoryLastFetch = 0;
let inFlightFetchPromise = null;

// Helper to get cached call logs from memory or localStorage immediately
const getCachedLogs = (userId) => {
    if (inMemoryCallLogs && (!userId || inMemoryUserId === userId)) {
        return inMemoryCallLogs;
    }
    try {
        if (userId) {
            const userCached = localStorage.getItem(`cached_call_logs_${userId}`);
            if (userCached) {
                const parsed = JSON.parse(userCached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    inMemoryCallLogs = parsed;
                    inMemoryUserId = userId;
                    return parsed;
                }
            }
        }
    } catch (_) { }

    try {
        const genericCached = localStorage.getItem('cached_call_logs');
        if (genericCached) {
            const parsed = JSON.parse(genericCached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                inMemoryCallLogs = parsed;
                inMemoryUserId = userId;
                return parsed;
            }
        }
    } catch (_) { }

    return [];
};

// Helper to safely cache call logs without exceeding localStorage quota
const safeCacheCallLogs = (logsToCache, userId) => {
    const currentUserId = userId || (typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null);

    // Keep memory cache updated at 0ms
    if (Array.isArray(logsToCache)) {
        inMemoryCallLogs = logsToCache;
        inMemoryUserId = currentUserId;
    } else {
        inMemoryCallLogs = [];
    }

    if (!logsToCache || !Array.isArray(logsToCache)) {
        try {
            if (currentUserId) localStorage.removeItem(`cached_call_logs_${currentUserId}`);
            localStorage.removeItem('cached_call_logs');
        } catch (_) { }
        return;
    }
    try {
        // Strip heavy base64 profile images (> 500 chars) and cap to 60 items to keep storage lightweight
        const optimized = logsToCache.slice(0, 60).map(item => ({
            ...item,
            image: (typeof item.image === 'string' && (item.image.startsWith('data:') || item.image.length > 500))
                ? ''
                : item.image
        }));
        const jsonStr = JSON.stringify(optimized);
        if (currentUserId) {
            localStorage.setItem(`cached_call_logs_${currentUserId}`, jsonStr);
        }
        localStorage.setItem('cached_call_logs', jsonStr);
    } catch (e) {
        // If quota exceeded or storage restricted, fallback to minified logs without images
        try {
            const minified = logsToCache.slice(0, 40).map(({ id, targetUserId, name, type, time, duration, status }) => ({
                id,
                targetUserId,
                name,
                image: '',
                type,
                time,
                duration,
                status
            }));
            const minifiedStr = JSON.stringify(minified);
            if (currentUserId) {
                localStorage.setItem(`cached_call_logs_${currentUserId}`, minifiedStr);
            }
            localStorage.setItem('cached_call_logs', minifiedStr);
        } catch (innerError) {
            try {
                if (currentUserId) localStorage.removeItem(`cached_call_logs_${currentUserId}`);
                localStorage.removeItem('cached_call_logs');
            } catch (_) { }
        }
    }
};

// ⚡ Dedupe call log entries that represent the same underlying call.
// A single call can get logged twice: once as a transient "calling"/"answered"
// placeholder the moment it starts, and again with its final status
// (completed/missed/rejected/cancelled) when it ends. These two entries get
// different ids from different sources (local SQLite, real-time event, backend
// fetch), so simple id-based dedup doesn't catch them and the same call shows
// twice in the list. This drops the placeholder whenever a final entry for the
// same contact already exists, while leaving genuinely separate calls untouched.
const dedupeCallLogs = (rawLogs) => {
    if (!Array.isArray(rawLogs) || rawLogs.length === 0) return rawLogs;

    // Step 1: drop exact id duplicates, keeping the first occurrence
    const seenIds = new Set();
    const uniqueById = [];
    for (const log of rawLogs) {
        const idKey = String(log?.id);
        if (seenIds.has(idKey)) continue;
        seenIds.add(idKey);
        uniqueById.push(log);
    }

    // Step 2: drop "calling"/"answered" placeholders when a final entry for the
    // same contact already exists elsewhere in the list
    const PLACEHOLDER_STATUSES = new Set(['calling', 'answered']);
    const namesWithFinalStatus = new Set(
        uniqueById
            .filter(l => !PLACEHOLDER_STATUSES.has(l?.status))
            .map(l => (l?.name || '').trim().toLowerCase())
            .filter(Boolean)
    );

    return uniqueById.filter(log => {
        const isPlaceholder = PLACEHOLDER_STATUSES.has(log?.status);
        if (!isPlaceholder) return true;
        const nameKey = (log?.name || '').trim().toLowerCase();
        return !(nameKey && namesWithFinalStatus.has(nameKey));
    });
};

// ⚡ Background prefetch function exported for ChatPage & module self-warmup
export const prefetchCallLogs = async (userId) => {
    const currentUserId = userId || (typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null);
    if (!currentUserId) return [];

    // Warm up memory cache from storage if not already loaded
    getCachedLogs(currentUserId);

    // If fetched within last 12 seconds and we have data, avoid redundant network calls
    const now = Date.now();
    if (inMemoryLastFetch && (now - inMemoryLastFetch < 12000) && inMemoryCallLogs?.length > 0) {
        return inMemoryCallLogs;
    }

    if (inFlightFetchPromise) {
        return inFlightFetchPromise;
    }

    inFlightFetchPromise = (async () => {
        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;
            const response = await fetch(`${API_BASE_URL}/api/call-logs/${currentUserId}`, {
                signal: controller?.signal
            });
            if (timeoutId) clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                inMemoryLastFetch = Date.now();
                if (Array.isArray(data)) {
                    const transformedLogs = data.map(log => ({
                        id: log._id || log.id,
                        targetUserId: log.callerId === currentUserId ? log.receiverId : log.callerId,
                        name: log.callerId === currentUserId ? log.receiverUsername : log.callerUsername,
                        image: log.callerId === currentUserId ? log.receiverProfileImage : log.callerProfileImage,
                        type: log.status === 'missed' ? 'missed' : (log.callerId === currentUserId ? 'outgoing' : 'incoming'),
                        time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (log.time || ''),
                        duration: log.duration,
                        status: log.status
                    }));
                    safeCacheCallLogs(transformedLogs, currentUserId);
                    return transformedLogs;
                }
            }
        } catch (err) {
            // Silently fall back to cached data
        } finally {
            inFlightFetchPromise = null;
        }
        return inMemoryCallLogs || [];
    })();

    return inFlightFetchPromise;
};

// ⚡ Auto-warmup on module import if user is logged in
if (typeof window !== 'undefined') {
    try {
        const storedUid = localStorage.getItem('userId');
        if (storedUid) {
            getCachedLogs(storedUid);
            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => prefetchCallLogs(storedUid), { timeout: 1500 });
            } else {
                setTimeout(() => prefetchCallLogs(storedUid), 400);
            }
        }
    } catch (_) { }
}

const Call = ({ callLogs = [], onInitiateCall, onSelectUser }) => {
    useSwipeBack(); // Default threshold is 80px
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width: 1024px)');
    const currentUserId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;

    const [currentIsDark, setCurrentIsDark] = useState(() => {
        try {
            const saved = localStorage.getItem('appTheme');
            if (saved) {
                const parsed = JSON.parse(saved);
                const bgCol = parsed?.colors?.background;
                if (bgCol && bgCol.startsWith('#')) {
                    const hex = bgCol.replace('#', '').trim();
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
                }
            }
        } catch (e) { }
        return theme.palette.mode === 'dark';
    });
    const isDark = currentIsDark;

    useEffect(() => {
        const handleThemeChange = () => {
            try {
                const saved = localStorage.getItem('appTheme');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const bgCol = parsed?.colors?.background;
                    if (bgCol && bgCol.startsWith('#')) {
                        const hex = bgCol.replace('#', '').trim();
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        setCurrentIsDark((r * 299 + g * 587 + b * 114) / 1000 < 128);
                        return;
                    }
                }
            } catch (e) { }
            setCurrentIsDark(theme.palette.mode === 'dark');
        };
        window.addEventListener('themeChanged', handleThemeChange);
        return () => window.removeEventListener('themeChanged', handleThemeChange);
    }, [theme.palette.mode]);

    // ⚡ Instant Cache Hydration: Read memory/localStorage/props at 0ms delay
    const [logs, setLogs] = useState(() => {
        const cached = getCachedLogs(currentUserId);
        if (cached && cached.length > 0) return cached;
        if (Array.isArray(callLogs) && callLogs.length > 0) return callLogs;
        return [];
    });

    // Loading is false if we already have any cached logs or props, avoiding blocking spinner
    const [loading, setLoading] = useState(() => {
        const cached = getCachedLogs(currentUserId);
        return (!cached || cached.length === 0) && (!callLogs || callLogs.length === 0);
    });

    // Custom Confirmation Dialog States
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteType, setDeleteType] = useState(null); // 'all' | 'single'
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [selectedCallUser, setSelectedCallUser] = useState(null);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'missed'

    // Helper to get friend avatar if call log image is empty (e.g. stripped from cache)
    const getFriendAvatar = useMemo(() => {
        const friendsMap = {};
        try {
            if (currentUserId) {
                const raw = localStorage.getItem(`juicy_cached_friends_${currentUserId}`);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(f => {
                            const fId = f._id || f.id || f.friendId;
                            const pic = f.profilePic || f.image || f.profileImage;
                            if (fId && pic) friendsMap[String(fId)] = pic;
                        });
                    }
                }
            }
        } catch (_) { }
        return (targetUserId) => friendsMap[String(targetUserId)] || '';
    }, [currentUserId]);

    // ⚡ Sync with SQLite & Backend in background (Stale-While-Revalidate pattern)
    useEffect(() => {
        let isMounted = true;

        const syncCallLogs = async () => {
            if (!currentUserId) {
                if (isMounted) setLoading(false);
                return;
            }

            // 1. Immediately load local SQLite logs for offline-first speed
            getAllCallLogsLocally().then(localRows => {
                if (!isMounted || !Array.isArray(localRows) || localRows.length === 0) return;
                const formatted = localRows.map(row => ({
                    id: row.id,
                    targetUserId: row.callerId === currentUserId ? row.receiverId : row.callerId,
                    name: row.name || 'Unknown Contact',
                    image: row.image || '',
                    type: row.status === 'missed' ? 'missed' : (row.direction || (row.callerId === currentUserId ? 'outgoing' : 'incoming')),
                    time: row.startTime ? new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (row.createdAt ? new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
                    duration: row.duration || 0,
                    status: row.status || 'completed'
                }));

                setLogs(prev => {
                    const existingIds = new Set(prev.map(p => String(p.id)));
                    const toAdd = formatted.filter(f => !existingIds.has(String(f.id)));
                    if (toAdd.length > 0) {
                        const merged = [...toAdd, ...prev];
                        safeCacheCallLogs(merged, currentUserId);
                        return merged;
                    }
                    return prev;
                });
                if (isMounted) setLoading(false);
            }).catch(() => { });

            // 2. Fetch fresh logs from backend in background
            try {
                const freshLogs = await prefetchCallLogs(currentUserId);
                if (isMounted && Array.isArray(freshLogs) && freshLogs.length > 0) {
                    setLogs(prev => {
                        const serverIds = new Set(freshLogs.map(l => String(l.id)));
                        const localOnly = prev.filter(l => !serverIds.has(String(l.id)));
                        return [...localOnly, ...freshLogs];
                    });
                }
            } catch (err) {
                console.warn('Call logs background sync notice:', err?.message || err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        syncCallLogs();

        // 3. Real-time update listener: when a call ends anywhere in the app, update list instantly
        const handleNewLogAdded = (event) => {
            const newLog = event?.detail;
            if (!newLog || !isMounted) return;
            setLogs(prev => {
                const exists = prev.some(l => String(l.id) === String(newLog.id));
                if (exists) return prev;
                const updated = [newLog, ...prev];
                safeCacheCallLogs(updated, currentUserId);
                return updated;
            });
            if (isMounted) setLoading(false);
        };

        window.addEventListener('juicy_call_log_added', handleNewLogAdded);

        return () => {
            isMounted = false;
            window.removeEventListener('juicy_call_log_added', handleNewLogAdded);
        };
    }, [currentUserId]);

    // Keep in sync with parent's callLogs prop if passed
    useEffect(() => {
        if (Array.isArray(callLogs) && callLogs.length > 0) {
            setLogs(prev => {
                const existingIds = new Set(prev.map(l => String(l.id)));
                const toAdd = callLogs.filter(l => !existingIds.has(String(l.id)));
                if (toAdd.length > 0) {
                    const merged = [...toAdd, ...prev];
                    safeCacheCallLogs(merged, currentUserId);
                    return merged;
                }
                return prev;
            });
            setLoading(false);
        }
    }, [callLogs, currentUserId]);

    // Base display logs — deduplicated so a call logged as both an in-progress
    // placeholder and a final entry doesn't render twice in the UI
    const baseLogs = useMemo(() => dedupeCallLogs(logs), [logs]);

    // Filtered logs by active tab and search query
    const filteredLogs = useMemo(() => {
        return baseLogs.filter(log => {
            // Tab filter: 'all' vs 'missed'
            if (activeFilter === 'missed' && log.type !== 'missed') {
                return false;
            }
            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const nameMatch = (log.name || '').toLowerCase().includes(query);
                return nameMatch;
            }
            return true;
        });
    }, [baseLogs, activeFilter, searchQuery]);

    // Counts
    const missedCount = useMemo(() => {
        return baseLogs.filter(l => l.type === 'missed').length;
    }, [baseLogs]);

    // Function to get call icon based on type
    const getCallIcon = (type, size = 16) => {
        switch (type) {
            case 'incoming':
                return <CallReceivedIcon sx={{ fontSize: size, color: WHATSAPP_GREEN }} />;
            case 'outgoing':
                return <CallMadeIcon sx={{ fontSize: size, color: WHATSAPP_DARK_GREEN }} />;
            case 'missed':
                return <CallMissedIcon sx={{ fontSize: size, color: MISSED_RED }} />;
            default:
                return null;
        }
    };

    // Call icon badge component for avatar corner
    const renderCallTypeBadge = (type) => {
        const isMissed = type === 'missed';
        const isIncoming = type === 'incoming';
        const bgColor = isMissed ? 'rgba(239, 68, 68, 0.15)' : isIncoming ? 'rgba(37, 211, 102, 0.15)' : 'rgba(18, 140, 126, 0.15)';
        const iconColor = isMissed ? MISSED_RED : isIncoming ? WHATSAPP_GREEN : WHATSAPP_DARK_GREEN;

        return (
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: 'var(--surface-color, #ffffff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    border: '1.5px solid var(--surface-color, #ffffff)',
                    zIndex: 2
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        bgcolor: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {type === 'incoming' && <CallReceivedIcon sx={{ fontSize: 11, color: iconColor }} />}
                    {type === 'outgoing' && <CallMadeIcon sx={{ fontSize: 11, color: iconColor }} />}
                    {type === 'missed' && <CallMissedIcon sx={{ fontSize: 11, color: iconColor }} />}
                </Box>
            </Box>
        );
    };

    // Function to format duration
    const formatDuration = (durationInSeconds) => {
        if (!durationInSeconds) return '';
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        if (minutes === 0) {
            return `${seconds}s`;
        }
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };

    // Trigger confirmation dialog for clearing all logs
    const triggerDeleteAllConfirm = () => {
        setDeleteType('all');
        setConfirmOpen(true);
    };

    // Trigger confirmation dialog for single log delete
    const triggerDeleteSingleConfirm = (logId, event) => {
        if (event) event.stopPropagation();
        setSelectedLogId(logId);
        setDeleteType('single');
        setConfirmOpen(true);
    };

    // Quick direct call handler
    const handleQuickCall = (log, type, event) => {
        if (event) event.stopPropagation();
        const target = log.targetUserId || log.id;
        if (onInitiateCall) {
            onInitiateCall(target, type);
        } else {
            toast.success(`Starting ${type} call with ${log.name}...`);
        }
    };

    // Open chat conversation if onSelectUser is provided
    const handleOpenChat = (log) => {
        setSelectedCallUser(null);
        if (onSelectUser) {
            onSelectUser({
                _id: log.targetUserId || log.id,
                id: log.targetUserId || log.id,
                username: log.name,
                name: log.name,
                profilePic: log.image
            });
        } else {
            toast.success(`Chatting with ${log.name}`);
        }
    };

    // Perform deletion based on confirmed type (optimistic instant update)
    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (deleteType === 'all') {
            try {
                if (!currentUserId) return;

                // Optimistic instant clear
                setLogs([]);
                safeCacheCallLogs([], currentUserId);

                const response = await fetch(`${API_BASE_URL}/api/call-logs/${currentUserId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    toast.success('All call logs deleted successfully');
                } else {
                    toast.error('Failed to delete call logs');
                }
            } catch (error) {
                console.error('Error deleting all call logs:', error);
                toast.error('Error deleting call logs');
            }
        } else if (deleteType === 'single' && selectedLogId) {
            try {
                const idToRemove = selectedLogId;
                // Optimistic instant removal
                setLogs(prev => {
                    const updated = prev.filter(log => log.id !== idToRemove);
                    safeCacheCallLogs(updated, currentUserId);
                    return updated;
                });

                const response = await fetch(`${API_BASE_URL}/api/call-logs/single/${selectedLogId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    toast.success('Call log deleted');
                } else {
                    toast.error('Failed to delete call log');
                }
            } catch (error) {
                console.error('Error deleting call log:', error);
                toast.error('Error deleting call log');
            }
        }
        // Reset deletion states
        setDeleteType(null);
        setSelectedLogId(null);
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'var(--background-color, #fff7f9)',
                backgroundImage: isDark
                    ? 'radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 15% 70%, rgba(255, 255, 255, 0.03) 0%, transparent 45%)'
                    : 'radial-gradient(circle at 90% 8%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 10% 65%, rgba(0, 0, 0, 0.02) 0%, transparent 45%)',
                fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                overflow: 'hidden',
                boxSizing: 'border-box',
                position: 'relative'
            }}
        >
            {/* Top Bar Header Area */}
            <Box
                sx={{
                    px: isMobile ? 2 : 3,
                    pt: isMobile ? 2 : 2.5,
                    pb: 1.8,
                    flexShrink: 0,
                    bgcolor: isDark ? 'rgba(18, 15, 23, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(180, 180, 180, 0.2)',
                    position: 'relative',
                    zIndex: 2
                }}
            >
                {/* Header Title + Action Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                background: isDark
                                    ? 'linear-gradient(135deg, #ffffff 0%, var(--primary-color, #fda4af) 100%)'
                                    : 'linear-gradient(135deg, var(--text-color, #1e1b2e) 0%, var(--primary-color, #ff2d6c) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px',
                                fontSize: isMobile ? '1.45rem' : '1.75rem'
                            }}
                        >
                            Calls
                        </Typography>
                        {baseLogs.length > 0 && (
                            <Chip
                                label={baseLogs.length}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                    fontWeight: 750,
                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                    color: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.25)'
                                }}
                            />
                        )}
                    </Box>

                    {/* Clear All Logs Button */}
                    {baseLogs.length > 0 && (
                        <Tooltip title="Clear Call History">
                            <IconButton
                                onClick={triggerDeleteAllConfirm}
                                size="small"
                                sx={{
                                    color: '#ef4444',
                                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                    border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '14px',
                                    p: 1.1,
                                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.25)' : '0 4px 12px rgba(239, 68, 68, 0.12)',
                                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        color: '#ffffff',
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        borderColor: '#ef4444',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 18px rgba(239, 68, 68, 0.35)'
                                    },
                                    '&:active': {
                                        transform: 'scale(0.96)'
                                    }
                                }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {/* Filter Tabs / Pills */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.6 }}>
                    <Chip
                        label={`All (${baseLogs.length})`}
                        onClick={() => setActiveFilter('all')}
                        sx={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            borderRadius: '20px',
                            px: 1,
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeFilter === 'all'
                                ? 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))'
                                : isDark ? 'rgba(255, 255, 255, 0.06)' : 'var(--surface-color, rgba(255, 255, 255, 0.85))',
                            color: activeFilter === 'all'
                                ? '#ffffff'
                                : isDark ? '#94a3b8' : '#64748b',
                            border: activeFilter === 'all'
                                ? '1px solid rgba(255, 255, 255, 0.3)'
                                : isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
                            boxShadow: activeFilter === 'all'
                                ? '0 6px 16px rgba(0, 0, 0, 0.18)'
                                : isDark ? '0 2px 6px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                background: activeFilter === 'all'
                                    ? 'var(--primary-gradient, linear-gradient(135deg, #f72363 0%, #ff4d84 100%))'
                                    : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 1)'
                            }
                        }}
                    />
                    <Chip
                        label={`Missed ${missedCount > 0 ? `(${missedCount})` : ''}`}
                        onClick={() => setActiveFilter('missed')}
                        sx={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            borderRadius: '20px',
                            px: 1,
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeFilter === 'missed'
                                ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                                : isDark ? 'rgba(255, 255, 255, 0.06)' : 'var(--surface-color, rgba(255, 255, 255, 0.85))',
                            color: activeFilter === 'missed'
                                ? '#ffffff'
                                : missedCount > 0 ? '#ef4444' : isDark ? '#94a3b8' : '#64748b',
                            border: activeFilter === 'missed'
                                ? '1px solid rgba(255, 255, 255, 0.3)'
                                : isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
                            boxShadow: activeFilter === 'missed'
                                ? '0 6px 16px rgba(239, 68, 68, 0.35)'
                                : isDark ? '0 2px 6px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                background: activeFilter === 'missed'
                                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                                    : 'rgba(239, 68, 68, 0.08)'
                            }
                        }}
                    />
                </Box>

                {/* Search Input Bar */}
                {baseLogs.length > 0 && (
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search call history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'var(--primary-color, #ff4d86)', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchQuery('')}
                                        sx={{ color: 'var(--text-color, #94a3b8)', p: 0.5 }}
                                    >
                                        <ClearIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                            sx: {
                                borderRadius: '24px',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface-color, rgba(255, 255, 255, 0.9))',
                                backdropFilter: 'blur(10px)',
                                fontSize: '0.88rem',
                                color: 'var(--text-color, #0f172a)',
                                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.25)' : '0 4px 18px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.25s ease',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(180, 180, 180, 0.25)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--primary-color, #ff2d6c)'
                                },
                                '&.Mui-focused': {
                                    boxShadow: '0 6px 22px rgba(0, 0, 0, 0.12)',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--primary-color, #ff2d6c)',
                                        borderWidth: '1.5px'
                                    }
                                }
                            }
                        }}
                    />
                )}
            </Box>

            {/* Main Content Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: isMobile ? 1.5 : 2.5,
                    pt: 1.5,
                    /* Clean scrollable area without pink side bar */
                    '&::-webkit-scrollbar': {
                        display: 'none'
                    },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                        <CircularProgress
                            size={40}
                            thickness={4}
                            sx={{ color: 'var(--primary-color, #ff2d6c)' }}
                        />
                        <Typography sx={{ fontSize: '0.9rem', color: GRAY_TEXT, fontWeight: 500 }}>
                            Loading calls...
                        </Typography>
                    </Box>
                ) : filteredLogs.length === 0 ? (
                    /* Modern Empty State */
                    <Fade in timeout={300}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: isMobile ? 8 : 12,
                                px: 3,
                                textAlign: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 86,
                                    height: 86,
                                    borderRadius: '50%',
                                    background: activeFilter === 'missed'
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)'
                                        : 'linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, transparent 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2.5,
                                    border: activeFilter === 'missed'
                                        ? '1.5px dashed rgba(239, 68, 68, 0.3)'
                                        : '1.5px dashed var(--primary-color, rgba(255, 45, 108, 0.3))',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                {activeFilter === 'missed' ? (
                                    <PhoneMissedIcon sx={{ fontSize: 40, color: '#ef4444' }} />
                                ) : (
                                    <PhoneInTalkIcon sx={{ fontSize: 40, color: 'var(--primary-color, #ff2d6c)' }} />
                                )}
                            </Box>

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 750,
                                    color: 'var(--text-color, #0f172a)',
                                    mb: 0.8,
                                    fontSize: '1.15rem',
                                    letterSpacing: '-0.3px'
                                }}
                            >
                                {searchQuery
                                    ? 'No matches found'
                                    : activeFilter === 'missed'
                                        ? 'No missed calls'
                                        : 'No call history yet'}
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: '0.86rem',
                                    color: GRAY_TEXT,
                                    maxWidth: 320,
                                    lineHeight: 1.5
                                }}
                            >
                                {searchQuery
                                    ? `No call logs matching "${searchQuery}". Try a different name.`
                                    : activeFilter === 'missed'
                                        ? 'You have answered all incoming calls. None missed!'
                                        : 'Calls made or received with your contacts will be saved here.'}
                            </Typography>

                            {searchQuery && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setSearchQuery('')}
                                    sx={{
                                        mt: 2.5,
                                        borderRadius: '20px',
                                        textTransform: 'none',
                                        fontWeight: 650,
                                        color: 'var(--primary-color, #ff2d6c)',
                                        borderColor: 'var(--primary-color, rgba(255, 45, 108, 0.4))',
                                        px: 2.5,
                                        '&:hover': {
                                            borderColor: 'var(--primary-color, #ff2d6c)',
                                            bgcolor: 'rgba(0, 0, 0, 0.05)'
                                        }
                                    }}
                                >
                                    Clear Search
                                </Button>
                            )}
                        </Box>
                    </Fade>
                ) : (
                    /* Call Logs List */
                    <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
                        {filteredLogs.map((log, index) => {
                            const isMissed = log.type === 'missed';
                            return (
                                <ListItem
                                    key={log.id || index}
                                    onClick={() => setSelectedCallUser(log)}
                                    sx={{
                                        bgcolor: isDark ? 'rgba(28, 22, 38, 0.75)' : 'var(--surface-color, rgba(255, 255, 255, 0.88))',
                                        backdropFilter: 'blur(14px)',
                                        WebkitBackdropFilter: 'blur(14px)',
                                        borderRadius: '22px',
                                        px: isMobile ? 1.6 : 2.2,
                                        py: 1.3,
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
                                        boxShadow: isDark
                                            ? '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
                                            : '0 8px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            borderColor: isMissed
                                                ? 'rgba(239, 68, 68, 0.45)'
                                                : 'var(--primary-color, rgba(255, 45, 108, 0.45))',
                                            boxShadow: isDark
                                                ? '0 12px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                                                : '0 12px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)'
                                        },
                                        '&:active': {
                                            transform: 'scale(0.99)'
                                        }
                                    }}
                                >
                                    {/* Left: Avatar with Call Type Badge + Name & Info */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                        <ListItemAvatar sx={{ minWidth: 56 }}>
                                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                <Box
                                                    sx={{
                                                        p: '2.5px',
                                                        borderRadius: '50%',
                                                        background: isMissed
                                                            ? 'linear-gradient(135deg, #ef4444 0%, #fda4af 100%)'
                                                            : 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff8da1 100%))',
                                                        boxShadow: isMissed
                                                            ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                                                            : '0 4px 12px rgba(0, 0, 0, 0.12)'
                                                    }}
                                                >
                                                    <Avatar
                                                        src={log.image || getFriendAvatar(log.targetUserId)}
                                                        alt={log.name}
                                                        sx={{
                                                            width: 44,
                                                            height: 44,
                                                            fontSize: '1.1rem',
                                                            fontWeight: 700,
                                                            bgcolor: !(log.image || getFriendAvatar(log.targetUserId))
                                                                ? 'var(--primary-color, #ff4d86)'
                                                                : 'transparent',
                                                            color: '#ffffff',
                                                            border: isDark ? '2px solid #1c1626' : '2px solid #ffffff'
                                                        }}
                                                    >
                                                        {(!(log.image || getFriendAvatar(log.targetUserId)) && log.name) ? log.name[0].toUpperCase() : '?'}
                                                    </Avatar>
                                                </Box>
                                                {/* Mini status indicator badge on bottom-right of avatar */}
                                                {renderCallTypeBadge(log.type)}
                                            </Box>
                                        </ListItemAvatar>

                                        <ListItemText
                                            disableTypography
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                                                    <Typography
                                                        noWrap
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: isMobile ? '0.96rem' : '1.04rem',
                                                            color: isMissed
                                                                ? '#ef4444'
                                                                : 'var(--text-color, #0f172a)',
                                                            letterSpacing: '-0.2px'
                                                        }}
                                                    >
                                                        {log.name || 'Unknown Contact'}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4, flexWrap: 'wrap' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                        {getCallIcon(log.type, 14)}
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.78rem',
                                                                fontWeight: 600,
                                                                color: isMissed ? '#ef4444' : GRAY_TEXT
                                                            }}
                                                        >
                                                            {isMissed
                                                                ? 'Missed call'
                                                                : log.type === 'incoming'
                                                                    ? 'Incoming'
                                                                    : 'Outgoing'}
                                                        </Typography>
                                                    </Box>

                                                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(100, 116, 139, 0.5)' }}>
                                                        •
                                                    </Typography>

                                                    <Typography sx={{ fontSize: '0.78rem', color: GRAY_TEXT, fontWeight: 500 }}>
                                                        {log.time}
                                                    </Typography>

                                                    {log.duration && !isMissed ? (
                                                        <Chip
                                                            size="small"
                                                            icon={<AccessTimeIcon sx={{ fontSize: '11px !important', color: 'inherit' }} />}
                                                            label={formatDuration(log.duration)}
                                                            sx={{
                                                                height: 19,
                                                                fontSize: '0.68rem',
                                                                fontWeight: 600,
                                                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.05)',
                                                                color: 'var(--primary-color, #ff2d6c)',
                                                                borderRadius: '8px',
                                                                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(180, 180, 180, 0.2)',
                                                                '& .MuiChip-label': { px: 0.7 }
                                                            }}
                                                        />
                                                    ) : null}
                                                </Box>
                                            }
                                        />
                                    </Box>

                                    {/* Right: Quick Action Controls */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: isMobile ? 0.7 : 1,
                                            ml: 1,
                                            flexShrink: 0
                                        }}
                                    >
                                        {/* Direct Audio Call Button */}
                                        <Tooltip title="Voice Call">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleQuickCall(log, 'audio', e)}
                                                sx={{
                                                    color: '#ffffff',
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                                                    borderRadius: '50%',
                                                    p: 1,
                                                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                                        transform: 'scale(1.12)',
                                                        boxShadow: '0 6px 16px rgba(16, 185, 129, 0.5)'
                                                    },
                                                    '&:active': {
                                                        transform: 'scale(0.96)'
                                                    }
                                                }}
                                            >
                                                <PhoneIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                                            </IconButton>
                                        </Tooltip>

                                        {/* Direct Video Call Button */}
                                        <Tooltip title="Video Call">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleQuickCall(log, 'video', e)}
                                                sx={{
                                                    color: '#ffffff',
                                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                                    borderRadius: '50%',
                                                    p: 1,
                                                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        filter: 'brightness(1.08)',
                                                        transform: 'scale(1.12)',
                                                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)'
                                                    },
                                                    '&:active': {
                                                        transform: 'scale(0.96)'
                                                    }
                                                }}
                                            >
                                                <VideocamIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                                            </IconButton>
                                        </Tooltip>

                                        {/* Single Delete Button */}
                                        <Tooltip title="Delete from history">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => triggerDeleteSingleConfirm(log.id, e)}
                                                sx={{
                                                    color: '#ef4444',
                                                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                                    border: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.15)',
                                                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(239, 68, 68, 0.1)',
                                                    borderRadius: '50%',
                                                    p: 1,
                                                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        color: '#ffffff',
                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                        borderColor: '#ef4444',
                                                        transform: 'scale(1.12)',
                                                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                                                    },
                                                    '&:active': {
                                                        transform: 'scale(0.96)'
                                                    }
                                                }}
                                            >
                                                <DeleteOutlineIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Box>

            {/* Selected User Call Detail Bottom-Sheet / Dialog */}
            <Dialog
                open={Boolean(selectedCallUser)}
                onClose={() => setSelectedCallUser(null)}
                PaperProps={{
                    sx: {
                        borderRadius: '28px',
                        p: 3.5,
                        width: '92%',
                        maxWidth: 380,
                        bgcolor: isDark ? 'rgba(26, 20, 36, 0.95)' : 'var(--surface-color, rgba(255, 255, 255, 0.95))',
                        backdropFilter: 'blur(20px)',
                        color: 'var(--text-color, #0f172a)',
                        boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 24px 60px rgba(0, 0, 0, 0.12)',
                        textAlign: 'center',
                        position: 'relative',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(180, 180, 180, 0.2)'
                    }
                }}
            >
                <IconButton
                    onClick={() => setSelectedCallUser(null)}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        color: isDark ? '#94a3b8' : '#a0aec0',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.04)',
                        borderRadius: '50%',
                        p: 0.8,
                        '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0,0,0,0.08)',
                            color: isDark ? '#ffffff' : '#0f172a'
                        }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                {selectedCallUser && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
                        {/* Avatar with Glow Ring */}
                        <Box sx={{ position: 'relative', mb: 2 }}>
                            <Box
                                sx={{
                                    p: '4px',
                                    borderRadius: '50%',
                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff8da1 100%))',
                                    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.15)',
                                    display: 'inline-block'
                                }}
                            >
                                <Avatar
                                    src={selectedCallUser.image || getFriendAvatar(selectedCallUser.targetUserId || selectedCallUser.id)}
                                    alt={selectedCallUser.name}
                                    sx={{
                                        width: 86,
                                        height: 86,
                                        fontSize: 34,
                                        fontWeight: 700,
                                        bgcolor: !(selectedCallUser.image || getFriendAvatar(selectedCallUser.targetUserId || selectedCallUser.id)) ? 'var(--primary-color, #ff4d86)' : 'transparent',
                                        color: '#ffffff',
                                        border: isDark ? '3px solid #1a1424' : '3px solid #ffffff'
                                    }}
                                >
                                    {(!(selectedCallUser.image || getFriendAvatar(selectedCallUser.targetUserId || selectedCallUser.id)) && selectedCallUser.name) ? selectedCallUser.name[0].toUpperCase() : '?'}
                                </Avatar>
                            </Box>
                        </Box>

                        {/* Contact Name */}
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 750,
                                color: 'var(--text-color, #0f172a)',
                                mb: 0.5,
                                fontSize: '1.25rem',
                                letterSpacing: '-0.3px'
                            }}
                        >
                            {selectedCallUser.name || 'Unknown Contact'}
                        </Typography>

                        {/* Call Detail Capsule */}
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.8,
                                px: 1.8,
                                py: 0.7,
                                borderRadius: '20px',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(180, 180, 180, 0.2)',
                                mb: 3
                            }}
                        >
                            {getCallIcon(selectedCallUser.type, 15)}
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 650, color: selectedCallUser.type === 'missed' ? '#ef4444' : GRAY_TEXT }}>
                                {selectedCallUser.type === 'missed'
                                    ? 'Missed call'
                                    : selectedCallUser.type === 'incoming'
                                        ? 'Incoming'
                                        : 'Outgoing'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(100, 116, 139, 0.6)' }}>•</Typography>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: GRAY_TEXT }}>
                                {selectedCallUser.time}
                            </Typography>
                            {selectedCallUser.duration && selectedCallUser.type !== 'missed' && (
                                <>
                                    <Typography sx={{ fontSize: '0.78rem', color: 'rgba(100, 116, 139, 0.6)' }}>•</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 650, color: 'var(--primary-color, #ff2d6c)' }}>
                                        {formatDuration(selectedCallUser.duration)}
                                    </Typography>
                                </>
                            )}
                        </Box>

                        {/* Primary Action Buttons: Voice & Video */}
                        <Box sx={{ display: 'flex', gap: 1.5, width: '100%', mb: 1.5 }}>
                            {/* Audio Call Action */}
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => {
                                    handleQuickCall(selectedCallUser, 'audio');
                                    setSelectedCallUser(null);
                                }}
                                startIcon={<PhoneIcon />}
                                sx={{
                                    py: 1.4,
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '0.92rem',
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                                    transition: 'all 0.22s ease',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5)',
                                        transform: 'translateY(-2px)'
                                    },
                                    '&:active': {
                                        transform: 'scale(0.98)'
                                    }
                                }}
                            >
                                Voice
                            </Button>

                            {/* Video Call Action */}
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => {
                                    handleQuickCall(selectedCallUser, 'video');
                                    setSelectedCallUser(null);
                                }}
                                startIcon={<VideocamIcon />}
                                sx={{
                                    py: 1.4,
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '0.92rem',
                                    textTransform: 'none',
                                    background: 'var(--primary-gradient, linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%))',
                                    color: '#ffffff',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                                    transition: 'all 0.22s ease',
                                    '&:hover': {
                                        filter: 'brightness(1.08)',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                                        transform: 'translateY(-2px)'
                                    },
                                    '&:active': {
                                        transform: 'scale(0.98)'
                                    }
                                }}
                            >
                                Video
                            </Button>
                        </Box>

                        {/* Secondary Action: Message Contact */}
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handleOpenChat(selectedCallUser)}
                            startIcon={<ChatBubbleOutlineIcon />}
                            sx={{
                                py: 1.2,
                                borderRadius: '16px',
                                fontWeight: 650,
                                fontSize: '0.9rem',
                                textTransform: 'none',
                                color: isDark ? '#f8fafc' : '#0f172a',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(180, 180, 180, 0.25)',
                                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0, 0, 0, 0.02)',
                                '&:hover': {
                                    borderColor: 'var(--primary-color, #ff2d6c)',
                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                    color: 'var(--primary-color, #ff2d6c)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Send Message
                        </Button>
                    </Box>
                )}
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        p: 2.5,
                        minWidth: 300,
                        maxWidth: 400,
                        bgcolor: isDark ? '#1a1424' : '#ffffff',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 105, 150, 0.2)',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                        textAlign: 'center'
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
                    <Box
                        sx={{
                            width: 58,
                            height: 58,
                            borderRadius: '50%',
                            bgcolor: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1.8,
                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        <WarningAmberRoundedIcon sx={{ fontSize: 34 }} />
                    </Box>

                    <DialogTitle
                        sx={{
                            fontWeight: 750,
                            p: 0,
                            mb: 1,
                            fontSize: '1.25rem',
                            color: 'var(--text-color, #0f172a)'
                        }}
                    >
                        {deleteType === 'all' ? 'Clear Call History?' : 'Delete Call Log?'}
                    </DialogTitle>

                    <DialogContent sx={{ p: 0, px: 1, mb: 2.5 }}>
                        <DialogContentText
                            sx={{
                                fontSize: '0.88rem',
                                color: GRAY_TEXT,
                                lineHeight: 1.5
                            }}
                        >
                            {deleteType === 'all'
                                ? 'Are you sure you want to permanently clear your entire call history? This action cannot be undone.'
                                : 'Are you sure you want to remove this call entry from your history?'}
                        </DialogContentText>
                    </DialogContent>

                    <DialogActions sx={{ width: '100%', p: 0, display: 'flex', gap: 1.2 }}>
                        <Button
                            fullWidth
                            onClick={() => setConfirmOpen(false)}
                            sx={{
                                borderRadius: '18px',
                                py: 1.2,
                                color: isDark ? '#94a3b8' : '#64748b',
                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                textTransform: 'none',
                                fontWeight: 650,
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            onClick={handleConfirmDelete}
                            variant="contained"
                            sx={{
                                borderRadius: '18px',
                                py: 1.2,
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: '#ffffff',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.92rem',
                                boxShadow: '0 6px 18px rgba(239, 68, 68, 0.35)',
                                transition: 'all 0.22s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                                    transform: 'translateY(-1px)'
                                },
                                '&:active': {
                                    transform: 'scale(0.98)'
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    );
};

export default Call;