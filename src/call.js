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

// --- COLOR PALETTE & DESIGN TOKENS ---
const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_DARK_GREEN = '#128C7E';
const MISSED_RED = '#ef4444';
const GRAY_TEXT = '#64748b';

const Call = ({ callLogs = [], onInitiateCall, onSelectUser }) => {
    useSwipeBack(); // Default threshold is 80px
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [logs, setLogs] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_call_logs');
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });

    const [loading, setLoading] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_call_logs');
            return cached ? JSON.parse(cached).length === 0 : true;
        } catch (e) {
            return true;
        }
    });

    // Custom Confirmation Dialog States
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteType, setDeleteType] = useState(null); // 'all' | 'single'
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [selectedCallUser, setSelectedCallUser] = useState(null);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'missed'

    // Fetch call logs from backend on mount
    useEffect(() => {
        const fetchCallLogs = async () => {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    setLoading(false);
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/api/call-logs/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    // Transform backend data to match UI format
                    const transformedLogs = data.map(log => ({
                        id: log._id,
                        targetUserId: log.callerId === userId ? log.receiverId : log.callerId,
                        name: log.callerId === userId ? log.receiverUsername : log.callerUsername,
                        image: log.callerId === userId ? log.receiverProfileImage : log.callerProfileImage,
                        type: log.status === 'missed' ? 'missed' : (log.callerId === userId ? 'outgoing' : 'incoming'),
                        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        duration: log.duration,
                        status: log.status
                    }));
                    setLogs(transformedLogs);
                    localStorage.setItem('cached_call_logs', JSON.stringify(transformedLogs));
                }
            } catch (error) {
                console.error('Error fetching call logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCallLogs();
    }, []);

    // Base display logs
    const baseLogs = logs.length > 0 ? logs : callLogs;

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

    // Perform deletion based on confirmed type
    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (deleteType === 'all') {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) return;

                const response = await fetch(`${API_BASE_URL}/api/call-logs/${userId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setLogs([]);
                    localStorage.setItem('cached_call_logs', JSON.stringify([]));
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
                const response = await fetch(`${API_BASE_URL}/api/call-logs/single/${selectedLogId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setLogs(prev => {
                        const updated = prev.filter(log => log.id !== selectedLogId);
                        localStorage.setItem('cached_call_logs', JSON.stringify(updated));
                        return updated;
                    });
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
                height: isMobile ? 'calc(100dvh - 120px)' : '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'var(--background-color, #ffffff)',
                fontFamily: 'Poppins, sans-serif',
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}
        >
            {/* Top Bar Header Area */}
            <Box
                sx={{
                    px: isMobile ? 2 : 3,
                    pt: isMobile ? 1.5 : 2.5,
                    pb: 1.5,
                    flexShrink: 0,
                    bgcolor: 'var(--background-color, #ffffff)',
                    borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.06))'
                }}
            >
                {/* Header Title + Action Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                color: 'var(--text-color, #0f172a)',
                                letterSpacing: '-0.5px',
                                fontSize: isMobile ? '1.35rem' : '1.6rem'
                            }}
                        >
                            Calls
                        </Typography>
                        {baseLogs.length > 0 && (
                            <Chip
                                label={baseLogs.length}
                                size="small"
                                sx={{
                                    height: 22,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    bgcolor: 'var(--primary-color, #ff4d86)',
                                    color: '#ffffff',
                                    borderRadius: '12px'
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
                                    color: 'var(--text-color, #64748b)',
                                    bgcolor: 'var(--surface-color, #ffffff)',
                                    border: '1px solid var(--border-color, rgba(0, 0, 0, 0.08))',
                                    borderRadius: 2.5,
                                    p: 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        color: '#ef4444',
                                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                                        borderColor: 'rgba(239, 68, 68, 0.3)',
                                        transform: 'scale(1.05)'
                                    }
                                }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                {/* Filter Tabs / Pills */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Chip
                        label={`All (${baseLogs.length})`}
                        onClick={() => setActiveFilter('all')}
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            bgcolor: activeFilter === 'all'
                                ? 'var(--primary-color, #ff4d86)'
                                : 'var(--surface-color, #f1f5f9)',
                            color: activeFilter === 'all'
                                ? '#ffffff'
                                : 'var(--text-color, #64748b)',
                            border: activeFilter === 'all'
                                ? '1px solid transparent'
                                : '1px solid var(--border-color, rgba(0,0,0,0.06))',
                            '&:hover': {
                                bgcolor: activeFilter === 'all'
                                    ? 'var(--primary-color, #ff3373)'
                                    : 'rgba(0,0,0,0.05)'
                            }
                        }}
                    />
                    <Chip
                        label={`Missed ${missedCount > 0 ? `(${missedCount})` : ''}`}
                        onClick={() => setActiveFilter('missed')}
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            bgcolor: activeFilter === 'missed'
                                ? '#ef4444'
                                : 'var(--surface-color, #f1f5f9)',
                            color: activeFilter === 'missed'
                                ? '#ffffff'
                                : missedCount > 0 ? '#ef4444' : 'var(--text-color, #64748b)',
                            border: activeFilter === 'missed'
                                ? '1px solid transparent'
                                : '1px solid var(--border-color, rgba(0,0,0,0.06))',
                            '&:hover': {
                                bgcolor: activeFilter === 'missed'
                                    ? '#dc2626'
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
                        placeholder="Search call logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'var(--text-color, #94a3b8)', fontSize: 20 }} />
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
                                borderRadius: 3,
                                bgcolor: 'var(--surface-color, #f8fafc)',
                                fontSize: '0.88rem',
                                color: 'var(--text-color, #0f172a)',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--border-color, rgba(0,0,0,0.08))'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--primary-color, #ff4d86)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--primary-color, #ff4d86)',
                                    borderWidth: '1.5px'
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
                    /* Custom sleek scrollbar */
                    '&::-webkit-scrollbar': {
                        width: '6px'
                    },
                    '&::-webkit-scrollbar-track': {
                        bgcolor: 'transparent'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: 'rgba(0,0,0,0.12)',
                        borderRadius: '10px'
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        bgcolor: 'rgba(0,0,0,0.2)'
                    }
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                        <CircularProgress
                            size={40}
                            thickness={4}
                            sx={{ color: 'var(--primary-color, #ff4d86)' }}
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
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: activeFilter === 'missed'
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : 'var(--surface-color, rgba(255, 77, 134, 0.08))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2.5,
                                    border: '1px dashed var(--border-color, rgba(255, 77, 134, 0.3))'
                                }}
                            >
                                {activeFilter === 'missed' ? (
                                    <PhoneMissedIcon sx={{ fontSize: 38, color: '#ef4444' }} />
                                ) : (
                                    <PhoneInTalkIcon sx={{ fontSize: 38, color: 'var(--primary-color, #ff4d86)' }} />
                                )}
                            </Box>

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: 'var(--text-color, #0f172a)',
                                    mb: 0.8,
                                    fontSize: '1.1rem'
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
                                    fontSize: '0.85rem',
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
                                        mt: 2,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        color: 'var(--primary-color, #ff4d86)',
                                        borderColor: 'var(--primary-color, #ff4d86)',
                                        '&:hover': {
                                            borderColor: 'var(--primary-color, #ff3373)',
                                            bgcolor: 'rgba(255, 77, 134, 0.05)'
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
                    <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                        {filteredLogs.map((log, index) => {
                            const isMissed = log.type === 'missed';
                            return (
                                <ListItem
                                    key={log.id || index}
                                    onClick={() => setSelectedCallUser(log)}
                                    sx={{
                                        bgcolor: 'var(--surface-color, #ffffff)',
                                        borderRadius: 3.5,
                                        px: isMobile ? 1.5 : 2,
                                        py: 1.2,
                                        border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            bgcolor: 'var(--surface-color, #ffffff)',
                                            borderColor: isMissed
                                                ? 'rgba(239, 68, 68, 0.3)'
                                                : 'var(--primary-color, rgba(255, 77, 134, 0.35))',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
                                        },
                                        '&:active': {
                                            transform: 'scale(0.99)'
                                        }
                                    }}
                                >
                                    {/* Left: Avatar with Call Type Badge + Name & Info */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                        <ListItemAvatar sx={{ minWidth: 54 }}>
                                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                <Avatar
                                                    src={log.image}
                                                    alt={log.name}
                                                    sx={{
                                                        width: 46,
                                                        height: 46,
                                                        fontSize: '1.1rem',
                                                        fontWeight: 700,
                                                        bgcolor: !log.image
                                                            ? 'var(--primary-color, #ff4d86)'
                                                            : 'transparent',
                                                        color: '#ffffff',
                                                        border: isMissed
                                                            ? '2px solid rgba(239, 68, 68, 0.4)'
                                                            : '2px solid var(--border-color, rgba(0,0,0,0.06))',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                                    }}
                                                >
                                                    {(!log.image && log.name) ? log.name[0].toUpperCase() : '?'}
                                                </Avatar>
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
                                                            fontWeight: 650,
                                                            fontSize: isMobile ? '0.94rem' : '1.02rem',
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
                                                                fontWeight: 500,
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
                                                                height: 18,
                                                                fontSize: '0.68rem',
                                                                fontWeight: 600,
                                                                bgcolor: 'var(--background-color, rgba(0,0,0,0.04))',
                                                                color: GRAY_TEXT,
                                                                borderRadius: '6px',
                                                                '& .MuiChip-label': { px: 0.6 }
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
                                            gap: isMobile ? 0.6 : 1,
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
                                                    color: WHATSAPP_GREEN,
                                                    bgcolor: 'rgba(37, 211, 102, 0.1)',
                                                    borderRadius: '50%',
                                                    p: 0.9,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        bgcolor: WHATSAPP_GREEN,
                                                        color: '#ffffff',
                                                        transform: 'scale(1.1)',
                                                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
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
                                                    color: 'var(--primary-color, #ff4d86)',
                                                    bgcolor: 'var(--surface-color, rgba(255, 77, 134, 0.1))',
                                                    borderRadius: '50%',
                                                    p: 0.9,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        bgcolor: 'var(--primary-color, #ff4d86)',
                                                        color: '#ffffff',
                                                        transform: 'scale(1.1)',
                                                        boxShadow: '0 4px 12px rgba(255, 77, 134, 0.35)'
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
                                                    color: 'var(--text-color, #94a3b8)',
                                                    borderRadius: '50%',
                                                    p: 0.8,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        color: '#ef4444',
                                                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                        transform: 'scale(1.08)'
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
                        borderRadius: 4.5,
                        p: 3,
                        width: '92%',
                        maxWidth: 360,
                        bgcolor: 'var(--surface-color, #ffffff)',
                        color: 'var(--text-color, #0f172a)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                        textAlign: 'center',
                        position: 'relative',
                        border: '1px solid var(--border-color, rgba(0,0,0,0.08))'
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
                        color: 'var(--text-color, #94a3b8)',
                        bgcolor: 'var(--background-color, rgba(0,0,0,0.04))',
                        borderRadius: '50%',
                        p: 0.8,
                        '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.08)',
                            color: 'var(--text-color, #0f172a)'
                        }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                {selectedCallUser && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
                        {/* Avatar with Glow Ring */}
                        <Box sx={{ position: 'relative', mb: 2 }}>
                            <Avatar
                                src={selectedCallUser.image}
                                alt={selectedCallUser.name}
                                sx={{
                                    width: 86,
                                    height: 86,
                                    fontSize: 34,
                                    fontWeight: 700,
                                    bgcolor: !selectedCallUser.image ? 'var(--primary-color, #ff4d86)' : 'transparent',
                                    color: '#ffffff',
                                    border: '3px solid var(--primary-color, #ff4d86)',
                                    boxShadow: '0 8px 24px rgba(255, 77, 134, 0.25)'
                                }}
                            >
                                {(!selectedCallUser.image && selectedCallUser.name) ? selectedCallUser.name[0].toUpperCase() : '?'}
                            </Avatar>
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
                                px: 1.5,
                                py: 0.6,
                                borderRadius: '20px',
                                bgcolor: 'var(--background-color, #f1f5f9)',
                                mb: 3
                            }}
                        >
                            {getCallIcon(selectedCallUser.type, 15)}
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: selectedCallUser.type === 'missed' ? '#ef4444' : GRAY_TEXT }}>
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
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: GRAY_TEXT }}>
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
                                    py: 1.3,
                                    borderRadius: 3,
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    textTransform: 'none',
                                    bgcolor: '#25D366',
                                    backgroundImage: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                    color: '#ffffff',
                                    boxShadow: '0 6px 18px rgba(37, 211, 102, 0.3)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundImage: 'linear-gradient(135deg, #22be5b 0%, #0e7266 100%)',
                                        boxShadow: '0 8px 24px rgba(37, 211, 102, 0.45)',
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
                                    py: 1.3,
                                    borderRadius: 3,
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    textTransform: 'none',
                                    bgcolor: 'var(--primary-color, #ff4d86)',
                                    backgroundImage: 'linear-gradient(135deg, #ff4d86 0%, #ff175e 100%)',
                                    color: '#ffffff',
                                    boxShadow: '0 6px 18px rgba(255, 77, 134, 0.3)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundImage: 'linear-gradient(135deg, #ff3373 0%, #e60047 100%)',
                                        boxShadow: '0 8px 24px rgba(255, 77, 134, 0.45)',
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
                                py: 1.1,
                                borderRadius: 3,
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                textTransform: 'none',
                                color: 'var(--text-color, #0f172a)',
                                borderColor: 'var(--border-color, rgba(0,0,0,0.12))',
                                '&:hover': {
                                    borderColor: 'var(--primary-color, #ff4d86)',
                                    bgcolor: 'rgba(255, 77, 134, 0.05)',
                                    color: 'var(--primary-color, #ff4d86)'
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
                        borderRadius: 4,
                        p: 2,
                        minWidth: 290,
                        maxWidth: 380,
                        bgcolor: 'var(--surface-color, #ffffff)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
                        textAlign: 'center'
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
                    <Box
                        sx={{
                            width: 54,
                            height: 54,
                            borderRadius: '50%',
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1.5
                        }}
                    >
                        <WarningAmberRoundedIcon sx={{ fontSize: 32 }} />
                    </Box>

                    <DialogTitle
                        sx={{
                            fontWeight: 750,
                            p: 0,
                            mb: 1,
                            fontSize: '1.2rem',
                            color: 'var(--text-color, #0f172a)'
                        }}
                    >
                        {deleteType === 'all' ? 'Clear Call History?' : 'Delete Call Log?'}
                    </DialogTitle>

                    <DialogContent sx={{ p: 0, px: 1, mb: 2 }}>
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
                                borderRadius: 2.5,
                                py: 1,
                                color: 'var(--text-color, #64748b)',
                                bgcolor: 'var(--background-color, #f1f5f9)',
                                textTransform: 'none',
                                fontWeight: 650,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            onClick={handleConfirmDelete}
                            variant="contained"
                            sx={{
                                borderRadius: 2.5,
                                py: 1,
                                bgcolor: '#ef4444',
                                color: '#ffffff',
                                textTransform: 'none',
                                fontWeight: 650,
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                '&:hover': {
                                    bgcolor: '#dc2626',
                                    boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)'
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
