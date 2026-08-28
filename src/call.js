import React, { useState, useEffect } from 'react';
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
    Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallMissedIcon from '@mui/icons-material/CallMissed';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import useSwipeBack from './hooks/useSwipeBack';
import API_BASE_URL from './config/apiConfig';

// --- WHATSAPP COLOR PALETTE (from start.js) ---
const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_DARK_GREEN = '#128C7E';
const WHATSAPP_TEAL = '#075E54';
const WHITE = '#FFFFFF';
const GRAY_TEXT = '#5F6A6A';

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

    // Use backend logs if available, otherwise use props
    const displayLogs = logs.length > 0 ? logs : callLogs;

    // Function to get call icon based on type
    const getCallIcon = (type) => {
        switch (type) {
            case 'incoming':
                return <CallReceivedIcon sx={{ fontSize: '1.2rem', color: WHATSAPP_GREEN }} />;
            case 'outgoing':
                return <CallMadeIcon sx={{ fontSize: '1.2rem', color: WHATSAPP_DARK_GREEN }} />;
            case 'missed':
                return <CallMissedIcon sx={{ fontSize: '1.2rem', color: '#f44336' }} />;
            default:
                return null;
        }
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
        event.stopPropagation();
        setSelectedLogId(logId);
        setDeleteType('single');
        setConfirmOpen(true);
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
                p: isMobile ? 1 : 2,
                pt: isMobile ? 1 : 2,
                overflowY: 'auto',
                bgcolor: 'var(--background-color, #ffffff)',
                fontFamily: 'Poppins, sans-serif',
            }}
        >
            {/* Header with Title and Clear All Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isMobile ? 1 : 2, px: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-color, #000000)' }}>
                    Call History
                </Typography>
                {displayLogs.length > 0 && (
                    <Tooltip title="Delete All Logs">
                        <IconButton
                            onClick={triggerDeleteAllConfirm}
                            sx={{
                                color: 'var(--primary-color, #f44336)',
                                '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' }
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <List>
                    {displayLogs.length === 0 && (
                        <Typography sx={{
                            color: GRAY_TEXT,
                            textAlign: 'center',
                            mt: 4
                        }}>
                            No call logs yet.
                        </Typography>
                    )}
                    {displayLogs.map((log, index) => (
                        <ListItem
                            key={log.id || index}
                            onClick={() => setSelectedCallUser(log)}
                            sx={{
                                bgcolor: 'var(--surface-color, #fff)',
                                borderRadius: 3,
                                mb: 1,
                                boxShadow: '0px 2px 8px rgba(0,0,0,0.03)',
                                px: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: 'var(--background-color, #fff0f4)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0px 4px 12px rgba(0,0,0,0.08)'
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <ListItemAvatar>
                                    <Avatar src={log.image} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getCallIcon(log.type)}
                                            <Typography sx={{
                                                fontWeight: 600,
                                                color: 'var(--text-color, #000000)'
                                            }}>
                                                {log.name}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Typography
                                            sx={{
                                                fontSize: '0.8rem',
                                                color: log.type === 'missed' ? '#f44336' : GRAY_TEXT,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                            }}
                                        >
                                            {log.type === 'missed'
                                                ? 'Missed call'
                                                : log.type === 'incoming'
                                                    ? 'Incoming'
                                                    : 'Outgoing'}
                                        </Typography>
                                    }
                                />
                            </Box>

                            {/* Time, Duration and Delete on the right */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                    <Typography sx={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-color, #000000)',
                                        fontWeight: 500
                                    }}>
                                        {log.time}
                                    </Typography>
                                    {log.duration && log.type !== 'missed' && (
                                        <Typography sx={{
                                            fontSize: '0.75rem',
                                            color: GRAY_TEXT,
                                        }}>
                                            {formatDuration(log.duration)}
                                        </Typography>
                                    )}
                                </Box>
                                <Tooltip title="Delete call log">
                                    <IconButton
                                        onClick={(e) => triggerDeleteSingleConfirm(log.id, e)}
                                        size="small"
                                        sx={{
                                            color: 'var(--primary-color, #ff4d86)',
                                            bgcolor: 'var(--background-color, rgba(244, 67, 54, 0.08))',
                                            borderRadius: '50%',
                                            p: 0.8,
                                            border: '1px solid var(--border-color, rgba(255, 77, 134, 0.2))',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                color: '#f44336',
                                                bgcolor: 'rgba(244, 67, 54, 0.15)',
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* User Caller Section Action Dialog */}
            <Dialog
                open={Boolean(selectedCallUser)}
                onClose={() => setSelectedCallUser(null)}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 2.5,
                        width: '90%',
                        maxWidth: 340,
                        bgcolor: 'var(--surface-color, #ffffff)',
                        color: 'var(--text-color, #000000)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                        textAlign: 'center',
                        position: 'relative'
                    }
                }}
            >
                <IconButton
                    onClick={() => setSelectedCallUser(null)}
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        color: 'var(--text-color, #999)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                {selectedCallUser && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
                        <Avatar
                            src={selectedCallUser.image}
                            sx={{
                                width: 80,
                                height: 80,
                                mb: 1.5,
                                border: '3px solid var(--primary-color, #ff4d86)',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                                fontSize: 32
                            }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-color, #000000)', mb: 0.5 }}>
                            {selectedCallUser.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: GRAY_TEXT, mb: 2.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getCallIcon(selectedCallUser.type)}
                            {selectedCallUser.type === 'missed' ? 'Missed call' : selectedCallUser.type === 'incoming' ? 'Incoming call' : 'Outgoing call'} • {selectedCallUser.time}
                        </Typography>

                        {/* Audio and Video Call Action Buttons */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, width: '100%', mb: 1 }}>
                            {/* Audio Call Button */}
                            <Button
                                variant="contained"
                                onClick={() => {
                                    const target = selectedCallUser.targetUserId || selectedCallUser.id;
                                    if (onInitiateCall) {
                                        onInitiateCall(target, 'audio');
                                    } else {
                                        toast.success(`Starting audio call with ${selectedCallUser.name}...`);
                                    }
                                    setSelectedCallUser(null);
                                }}
                                startIcon={<PhoneInTalkIcon />}
                                sx={{
                                    flex: 1,
                                    bgcolor: '#34c759',
                                    color: '#fff',
                                    borderRadius: 3,
                                    py: 1.2,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px rgba(52, 199, 89, 0.3)',
                                    '&:hover': {
                                        bgcolor: '#28a745',
                                        boxShadow: '0 6px 18px rgba(52, 199, 89, 0.45)',
                                        transform: 'scale(1.02)'
                                    }
                                }}
                            >
                                Audio
                            </Button>

                            {/* Video Call Button */}
                            <Button
                                variant="contained"
                                onClick={() => {
                                    const target = selectedCallUser.targetUserId || selectedCallUser.id;
                                    if (onInitiateCall) {
                                        onInitiateCall(target, 'video');
                                    } else {
                                        toast.success(`Starting video call with ${selectedCallUser.name}...`);
                                    }
                                    setSelectedCallUser(null);
                                }}
                                startIcon={<VideoCallIcon />}
                                sx={{
                                    flex: 1,
                                    bgcolor: 'var(--primary-color, #ff4d86)',
                                    color: '#fff',
                                    borderRadius: 3,
                                    py: 1.2,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px rgba(255, 77, 134, 0.3)',
                                    '&:hover': {
                                        bgcolor: 'var(--primary-color, #ff3373)',
                                        boxShadow: '0 6px 18px rgba(255, 77, 134, 0.45)',
                                        transform: 'scale(1.02)'
                                    }
                                }}
                            >
                                Video
                            </Button>
                        </Box>
                    </Box>
                )}
            </Dialog>

            {/* Custom MUI Delete Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 1.5,
                        minWidth: 280,
                        bgcolor: 'var(--surface-color, #ffffff)',
                        fontFamily: 'Poppins, sans-serif'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, p: 2, pb: 1, fontFamily: 'inherit', color: 'var(--text-color, #000000)' }}>
                    {deleteType === 'all' ? 'Delete All Logs?' : 'Delete Call Log?'}
                </DialogTitle>
                <DialogContent sx={{ p: 2, py: 1 }}>
                    <DialogContentText sx={{ fontFamily: 'inherit', fontSize: '0.9rem', color: GRAY_TEXT }}>
                        {deleteType === 'all'
                            ? 'Are you sure you want to permanently clear your entire call history? This cannot be undone.'
                            : 'Are you sure you want to delete this specific call log from your history?'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 1, pt: 2, gap: 1 }}>
                    <Button
                        onClick={() => setConfirmOpen(false)}
                        sx={{
                            borderRadius: 2,
                            fontFamily: 'inherit',
                            color: GRAY_TEXT,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            fontFamily: 'inherit',
                            bgcolor: '#f44336',
                            color: '#ffffff',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#d32f2f' }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Call;
