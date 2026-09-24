import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    CircularProgress,
    useMediaQuery,
    Avatar,
    Dialog,
    DialogContent,
    Divider,
    Fade,
    Chip,
    Paper,
    Stack
} from '@mui/material';
import {
    QrCode as QrCodeIcon,
    Refresh as RefreshIcon,
    Smartphone as PhoneIcon,
    HelpOutline as HelpIcon,
    Devices as DevicesIcon,
    Key as KeyIcon,
    LockOutlined as LockIcon,
    FlashOn as FlashIcon,
    Sync as SyncIcon,
    LaptopMac as LaptopIcon,
    ArrowForward as ArrowIcon,
    ErrorOutline as ErrorIcon,
    CheckCircleOutline as CheckIcon,
    ArrowRightAlt as ArrowRightIcon,
    Security as SecurityIcon,
    Fingerprint as FingerprintIcon,
    VerifiedUser as VerifiedIcon,
    ArrowCircleRight as ArrowCircleRightIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './context/socketContext';
import API_BASE_URL from './config/apiConfig';
import logo5Digit from './logo/5digit.png';
import logojuicy2 from './logo/new juicy.png';
import juicyMascot from './bot/juicy_ai_hand_wave_3sec.gif';

export default function WebScanner() {
    const navigate = useNavigate();
    const socket = useSocket();
    const isMobile = useMediaQuery('(max-width: 1024px)');

    // Generate session ID on load
    const [sessionId] = useState(() => `juicy-web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    const [qrCodeValid, setQrCodeValid] = useState(true);
    const [qrTimer, setQrTimer] = useState(30);
    const [isSimulatingScan, setIsSimulatingScan] = useState(false);

    // 5-digit code entry state (Typed on Desktop)
    const [digits, setDigits] = useState(['', '', '', '', '']);
    const [submittingCode, setSubmittingCode] = useState(false);
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const [invalidCodeOpen, setInvalidCodeOpen] = useState(false);

    const digitRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null)
    ];

    const handleCloseInvalidDialog = () => {
        setInvalidCodeOpen(false);
        setDigits(['', '', '', '', '']);
        setTimeout(() => {
            if (digitRefs[0]?.current) {
                digitRefs[0].current.focus();
            }
        }, 100);
    };

    // Initialize QR session in database on mount
    useEffect(() => {
        const initQR = async () => {
            try {
                await fetch(`${API_BASE_URL}/api/link-device/init-qr`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });
            } catch (err) {
                console.error('Error initializing QR session:', err);
            }
        };
        initQR();
    }, [sessionId]);

    // Connect to socket and join room
    useEffect(() => {
        if (socket && sessionId) {
            socket.emit('join_qr_room', { sessionId });

            socket.on('qr_linked', (data) => {
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('profileImage', data.profileImage || '');
                toast.success('Device linked successfully! 🎉');

                setTimeout(() => {
                    navigate('/chat');
                }, 800);
            });

            socket.on('link_rejected', (data) => {
                toast.error(data.message || 'Link request was rejected by phone.');
                setDigits(['', '', '', '', '']);
                setAwaitingConfirmation(false);
            });
        }

        return () => {
            if (socket) {
                socket.off('qr_linked');
                socket.off('link_rejected');
            }
        };
    }, [socket, sessionId, navigate]);

    // QR Code Expiry Timer (Silently refreshes behind the scenes, no visual text show)
    useEffect(() => {
        let interval = null;
        if (qrCodeValid) {
            interval = setInterval(() => {
                setQrTimer((prev) => {
                    if (prev <= 1) {
                        setQrCodeValid(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [qrCodeValid]);

    const handleReloadQR = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/link-device/init-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
            setQrCodeValid(true);
            setQrTimer(30);
            toast.success('QR Code refreshed!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to refresh QR Code');
        }
    };

    // Submit the typed 5 digits to backend
    const handleSubmitCode = async (digitsArray) => {
        const fullCode = digitsArray.join('');
        if (fullCode.length < 5) return;

        setSubmittingCode(true);
        toast.loading('Submitting code...', { id: 'code-toast' });

        try {
            const userAgent = window.navigator.userAgent;
            const isMac = userAgent.includes('Mac');
            const isWin = userAgent.includes('Win');
            const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : 'Web App';

            const response = await fetch(`${API_BASE_URL}/api/link-device/submit-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: fullCode,
                    sessionId,
                    browserName: browser,
                    deviceName: isWin ? 'Windows PC' : isMac ? 'MacBook' : 'PC',
                    osName: isWin ? 'Windows' : isMac ? 'macOS' : 'Linux',
                    ipAddress: '127.0.0.1'
                })
            });

            const result = await response.json();
            if (response.ok) {
                toast.success('Code accepted! Awaiting confirmation on phone.', { id: 'code-toast' });
                setAwaitingConfirmation(true);
            } else {
                toast.dismiss('code-toast');
                setInvalidCodeOpen(true);
            }
        } catch (err) {
            console.error(err);
            toast.error('Connection error. Failed to submit code.', { id: 'code-toast' });
        } finally {
            setSubmittingCode(false);
        }
    };

    const handleDigitChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);

        if (value && index < 4) {
            digitRefs[index + 1].current.focus();
        }

        // When 5th digit is filled, auto-submit
        if (value && index === 4) {
            handleSubmitCode(newDigits);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            digitRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        if (/^\d{5}$/.test(pasteData)) {
            const codeDigits = pasteData.split('');
            setDigits(codeDigits);
            handleSubmitCode(codeDigits);
        }
    };

    // Simulate mobile device scanning the QR code for testing
    const handleSimulateScan = async () => {
        if (!qrCodeValid) {
            toast.error('QR code has expired. Please refresh first.');
            return;
        }

        setIsSimulatingScan(true);
        toast.loading('Simulating scan from phone...', { id: 'sim-scan-toast' });

        try {
            // Direct confirm emulation for scanning QR
            const response = await fetch(`${API_BASE_URL}/api/link-device/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
                },
                body: JSON.stringify({
                    sessionId,
                    confirm: true,
                    browserName: 'Chrome (Simulated)',
                    deviceName: 'Windows PC',
                    osName: 'Windows 11',
                    ipAddress: '127.0.0.1'
                })
            });

            await response.json();
            if (!response.ok) {
                // Fallback: If not logged in, trigger mock login
                console.warn('Confirm API failed. Emulating intern socket room login.');
                setTimeout(() => {
                    if (socket) {
                        socket.emit('join_qr_room', { sessionId });
                        setTimeout(() => {
                            const mockUser = {
                                userId: 'demo-web-user',
                                token: 'demo-web-token-12345',
                                username: 'juicyDesktopWeb',
                                profileImage: ''
                            };
                            localStorage.setItem('userId', mockUser.userId);
                            localStorage.setItem('token', mockUser.token);
                            localStorage.setItem('username', mockUser.username);
                            localStorage.setItem('profileImage', mockUser.profileImage);
                            toast.success('Logged in successfully! 🎉', { id: 'sim-scan-toast' });
                            navigate('/chat');
                        }, 1000);
                    }
                }, 500);
            } else {
                toast.dismiss('sim-scan-toast');
            }
        } catch (err) {
            console.error(err);
            toast.error('Simulation error', { id: 'sim-scan-toast' });
        } finally {
            setIsSimulatingScan(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100dvh',
            width: '100%',
            position: 'relative',
            fontFamily: "'Poppins', sans-serif",
            overflow: { xs: 'auto', lg: 'hidden' },
            background: 'linear-gradient(135deg, #ffe8f0 0%, #fdd5e8 20%, #f8c8e0 40%, #f3b8d8 60%, #edd0ed 80%, #e8d5f5 100%)',
            backgroundSize: '400% 400%',
            animation: 'premiumGradientBG 18s ease infinite',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '@keyframes premiumGradientBG': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
            }
        }}>
            {/* ── AMBIENT GLOW ORBS ── */}
            <Box sx={{
                position: 'fixed', top: -200, right: -160, width: 700, height: 700,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(236,72,153,0.22) 0%, rgba(251,113,133,0.10) 45%, transparent 70%)',
                filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
                animation: 'orbFloat1 20s ease-in-out infinite',
                '@keyframes orbFloat1': {
                    '0%,100%': { transform: 'translate(0,0) scale(1)' },
                    '50%': { transform: 'translate(60px,-70px) scale(1.15)' }
                }
            }} />
            <Box sx={{
                position: 'fixed', bottom: -180, left: -160, width: 650, height: 650,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(236,72,153,0.10) 45%, transparent 70%)',
                filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
                animation: 'orbFloat2 25s ease-in-out infinite',
                '@keyframes orbFloat2': {
                    '0%,100%': { transform: 'translate(0,0) scale(1)' },
                    '50%': { transform: 'translate(-50px,60px) scale(1.12)' }
                }
            }} />
            <Box sx={{
                position: 'fixed', top: '40%', left: '30%', width: 400, height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)',
                filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
                animation: 'orbFloat3 15s ease-in-out infinite',
                '@keyframes orbFloat3': {
                    '0%,100%': { transform: 'translate(0,0)' },
                    '33%': { transform: 'translate(40px,-30px)' },
                    '66%': { transform: 'translate(-30px,40px)' }
                }
            }} />

            {/* ── FLOATING DECORATIVE HEARTS ── */}
            {[
                { top: '12%', left: '8%', size: 18, delay: '0s', dur: '6s', opacity: 0.35 },
                { top: '25%', right: '6%', size: 14, delay: '1.5s', dur: '8s', opacity: 0.28 },
                { top: '60%', left: '5%', size: 22, delay: '3s', dur: '7s', opacity: 0.22 },
                { top: '75%', right: '8%', size: 16, delay: '0.8s', dur: '9s', opacity: 0.30 },
                { top: '40%', right: '3%', size: 12, delay: '2s', dur: '6.5s', opacity: 0.20 },
                { top: '85%', left: '15%', size: 10, delay: '4s', dur: '7.5s', opacity: 0.18 },
            ].map((h, i) => (
                <Box key={i} sx={{
                    position: 'fixed',
                    top: h.top, left: h.left, right: h.right, bottom: h.bottom,
                    width: h.size, height: h.size,
                    opacity: h.opacity,
                    pointerEvents: 'none', zIndex: 0,
                    animation: `heartFloat${i} ${h.dur} ${h.delay} ease-in-out infinite`,
                    [`@keyframes heartFloat${i}`]: {
                        '0%,100%': { transform: 'translateY(0) rotate(-5deg) scale(1)' },
                        '50%': { transform: `translateY(-${20 + i * 5}px) rotate(5deg) scale(1.1)` }
                    }
                }}>
                    <svg viewBox="0 0 24 24" fill="rgba(236,72,153,0.8)" width="100%" height="100%">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </Box>
            ))}

            {/* ── TOP BRAND HEADER ── */}
            <Box sx={{
                position: 'relative', zIndex: 10,
                width: '100%', maxWidth: 1100,
                px: { xs: 2, sm: 3 },
                pt: { xs: 1.5, sm: 2 },
                pb: { xs: 1, sm: 1.5 },
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                {/* Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <img src={logojuicy2} alt="Juicy Web" style={{ height: 42, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(236,72,153,0.3))' }} />
                </Box>

                {/* Encrypted Badge */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.8,
                    px: 2, py: 0.7,
                    borderRadius: '50px',
                    background: 'rgba(255,255,255,0.45)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(236,72,153,0.25)',
                    boxShadow: '0 4px 20px rgba(236,72,153,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                    animation: 'badgePulse 3s ease-in-out infinite',
                    '@keyframes badgePulse': {
                        '0%,100%': { boxShadow: '0 4px 20px rgba(236,72,153,0.12), inset 0 1px 0 rgba(255,255,255,0.8)' },
                        '50%': { boxShadow: '0 4px 28px rgba(236,72,153,0.22), inset 0 1px 0 rgba(255,255,255,0.8)' }
                    }
                }}>
                    <Box sx={{ color: '#ec4899', fontSize: 14, display: 'flex', alignItems: 'center' }}>
                        <VerifiedIcon sx={{ fontSize: 16 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#be185d', letterSpacing: '0.02em' }}>
                        End-to-End Encrypted
                    </Typography>
                </Box>
            </Box>

            {/* ── MAIN CONTENT AREA ── */}
            <Box sx={{
                position: 'relative', zIndex: 5,
                width: '100%', maxWidth: 1100,
                flex: 1,
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                alignItems: 'stretch',
                gap: { xs: 2.5, lg: 2.5 },
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, lg: 1.5 },
                minHeight: 0,
            }}>

                {/* ══ LEFT: QR GLASS CARD ══ */}
                <Box sx={{
                    flex: '0 0 auto',
                    width: { xs: '100%', lg: 310 },
                    display: 'flex', flexDirection: 'column', gap: 0,
                }}>
                    <Box sx={{
                        background: 'rgba(255,255,255,0.52)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        border: '1.5px solid rgba(255,255,255,0.75)',
                        borderRadius: '28px',
                        boxShadow: '0 20px 60px rgba(236,72,153,0.12), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                        p: { xs: 3, sm: 3.5 },
                        display: 'flex', flexDirection: 'column',
                        height: '100%',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 28px 70px rgba(236,72,153,0.18), 0 12px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                        }
                    }}>
                        {/* QR Card Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
                            <Box sx={{
                                width: 36, height: 36, borderRadius: '10px',
                                background: 'linear-gradient(135deg, #ec4899, #f43f8e)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(236,72,153,0.4)'
                            }}>
                                <QrCodeIcon sx={{ fontSize: 20, color: '#fff' }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e1b2e', lineHeight: 1.2 }}>
                                    Scan to Connect
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: '#9d78a0', fontWeight: 500 }}>
                                    Point your phone at this code
                                </Typography>
                            </Box>
                        </Box>

                        {/* QR Code Container */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Box sx={{
                                position: 'relative',
                                width: { xs: 210, sm: 220 }, height: { xs: 210, sm: 220 },
                                borderRadius: '24px',
                                background: '#ffffff',
                                boxShadow: qrCodeValid
                                    ? '0 8px 32px rgba(236,72,153,0.18), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(236,72,153,0.12)'
                                    : '0 4px 16px rgba(0,0,0,0.05)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                p: 1.5,
                                animation: qrCodeValid ? 'qrGlow 3s ease-in-out infinite' : 'none',
                                '@keyframes qrGlow': {
                                    '0%,100%': { boxShadow: '0 8px 32px rgba(236,72,153,0.18), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(236,72,153,0.12)' },
                                    '50%': { boxShadow: '0 12px 44px rgba(236,72,153,0.28), 0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(236,72,153,0.20)' }
                                }
                            }}>
                                {/* Scanning line */}
                                {qrCodeValid && (
                                    <Box sx={{
                                        position: 'absolute', top: 12, left: 12, right: 12,
                                        height: '2px',
                                        background: 'linear-gradient(90deg, transparent, #ec4899, transparent)',
                                        borderRadius: 1, opacity: 0.7, zIndex: 2,
                                        animation: 'qrScanLine 2.8s ease-in-out infinite',
                                        '@keyframes qrScanLine': {
                                            '0%': { top: 12, opacity: 0.3 },
                                            '50%': { opacity: 0.9 },
                                            '100%': { top: 206, opacity: 0.3 }
                                        }
                                    }} />
                                )}

                                {/* Corner Brackets */}
                                {[
                                    { top: 8, left: 8, borderTop: '3px solid #ec4899', borderLeft: '3px solid #ec4899', borderTopLeftRadius: 10 },
                                    { top: 8, right: 8, borderTop: '3px solid #ec4899', borderRight: '3px solid #ec4899', borderTopRightRadius: 10 },
                                    { bottom: 8, left: 8, borderBottom: '3px solid #ec4899', borderLeft: '3px solid #ec4899', borderBottomLeftRadius: 10 },
                                    { bottom: 8, right: 8, borderBottom: '3px solid #ec4899', borderRight: '3px solid #ec4899', borderBottomRightRadius: 10 },
                                ].map((style, i) => (
                                    <Box key={i} sx={{
                                        position: 'absolute', width: 22, height: 22,
                                        opacity: qrCodeValid ? 0.9 : 0.18,
                                        transition: 'opacity 0.3s ease', ...style
                                    }} />
                                ))}

                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=ec4899&bgcolor=ffffff&data=${encodeURIComponent(sessionId)}`}
                                    alt="Scan to login"
                                    style={{ width: 180, height: 180, display: 'block', opacity: qrCodeValid ? 1 : 0.2, transition: 'opacity 0.3s ease', borderRadius: 4 }}
                                />

                                {/* Expired Overlay */}
                                {!qrCodeValid && (
                                    <Box sx={{
                                        position: 'absolute', inset: 0, borderRadius: '24px',
                                        background: 'rgba(255,255,255,0.96)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        gap: 1.5, zIndex: 5, p: 2
                                    }}>
                                        <Box sx={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(244,114,182,0.08))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <RefreshIcon sx={{ fontSize: 28, color: '#ec4899' }} />
                                        </Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1b2e', textAlign: 'center' }}>
                                            QR Code Expired
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleReloadQR}
                                            startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
                                            sx={{
                                                background: 'linear-gradient(135deg, #ec4899, #f43f8e)',
                                                color: '#fff', fontWeight: 600, borderRadius: '10px',
                                                px: 2.5, py: 0.7, textTransform: 'none', fontSize: '0.82rem',
                                                boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
                                                '&:hover': { background: 'linear-gradient(135deg, #db2777, #ec4899)', transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(236,72,153,0.45)' }
                                            }}
                                        >
                                            Refresh Code
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* 3-Step Instructions */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                            {[
                                { num: 1, text: 'Open ', bold: 'Juicy', text2: ' on your phone.' },
                                { num: 2, text: 'Tap your ', bold: 'Profile Icon', text2: ' → ', bold2: 'Linked Devices' },
                                { num: 3, text: 'Point your phone camera at this screen.' }
                            ].map((step, idx) => (
                                <Fade in key={idx} timeout={500 + idx * 200}>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={{
                                            minWidth: 26, height: 26, borderRadius: '50%',
                                            background: `linear-gradient(135deg, #ec4899 ${idx * 20}%, #a855f7)`,
                                            color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                                            boxShadow: '0 3px 10px rgba(236,72,153,0.35)'
                                        }}>{step.num}</Box>
                                        <Typography variant="body2" sx={{ color: '#4b3f72', fontSize: '0.825rem', lineHeight: 1.5, pt: 0.2 }}>
                                            {step.text}
                                            {step.bold && <strong style={{ color: '#be185d' }}>{step.bold}</strong>}
                                            {step.text2}
                                            {step.bold2 && <strong style={{ color: '#be185d' }}>{step.bold2}</strong>}
                                        </Typography>
                                    </Box>
                                </Fade>
                            ))}
                        </Box>

                        {/* Register Link */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 'auto', pt: 1 }}>
                            <Typography variant="body2" sx={{ color: '#9d78a0', fontSize: '0.82rem' }}>
                                Don't have an account?
                            </Typography>
                            <Typography
                                variant="body2"
                                onClick={() => navigate('/signup')}
                                sx={{
                                    color: '#ec4899', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                    background: 'linear-gradient(90deg, #ec4899, #a855f7)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { opacity: 0.8, textDecoration: 'underline' }
                                }}
                            >
                                Register here
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ══ CENTER: HERO AREA ══ */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    py: { xs: 1, lg: 0 },
                    order: { xs: -1, lg: 0 }
                }}>
                    {/* Hero Heading */}
                    <Box sx={{ textAlign: 'center', mb: 1 }}>
                        <Typography sx={{
                            fontWeight: 800,
                            fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem', lg: '2.2rem' },
                            lineHeight: 1.15,
                            letterSpacing: '-0.03em',
                            background: 'linear-gradient(135deg, #be185d 0%, #ec4899 40%, #a855f7 80%, #7c3aed 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            mb: 1,
                            textShadow: 'none',
                        }}>
                            Use Juicy on your<br />computer
                        </Typography>
                        <Typography sx={{
                            fontSize: { xs: '0.82rem', sm: '0.88rem' },
                            color: '#7c4d8a',
                            fontWeight: 500, lineHeight: 1.5, maxWidth: 320, mx: 'auto'
                        }}>
                            Scan the QR code with your phone to link this device instantly.
                        </Typography>
                    </Box>

                    {/* 3D Device Illustration */}
                    <Box sx={{
                        position: 'relative',
                        width: { xs: 240, sm: 280, lg: 300 },
                        height: { xs: 160, sm: 190, lg: 200 },
                        animation: 'heroFloat 5s ease-in-out infinite',
                        '@keyframes heroFloat': {
                            '0%,100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-12px)' }
                        }
                    }}>
                        {/* Laptop body */}
                        <Box sx={{
                            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                            width: '88%', height: '65%',
                            background: 'linear-gradient(160deg, #ffffff 0%, #fce7f3 60%, #f5d0fe 100%)',
                            borderRadius: '16px 16px 0 0',
                            boxShadow: '0 -4px 30px rgba(236,72,153,0.12), 0 8px 40px rgba(0,0,0,0.10)',
                            border: '1.5px solid rgba(255,255,255,0.8)',
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {/* Laptop screen content */}
                            <Box sx={{
                                width: '82%', height: '78%',
                                background: 'linear-gradient(135deg, #fdf2f8 0%, #f5e6ff 100%)',
                                borderRadius: '8px',
                                border: '1px solid rgba(236,72,153,0.15)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 0.8,
                                p: 1.5
                            }}>
                                {/* Mock chat bubbles on screen */}
                                <Box sx={{ width: '70%', height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #ec4899, #f9a8d4)', mb: 0.5 }} />
                                <Box sx={{ display: 'flex', gap: 0.5, alignSelf: 'flex-start', ml: 1 }}>
                                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f8e)' }} />
                                    <Box sx={{ width: 55, height: 16, borderRadius: 4, background: 'linear-gradient(90deg, #fce7f3, #f5d0fe)' }} />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, alignSelf: 'flex-end', mr: 1 }}>
                                    <Box sx={{ width: 40, height: 16, borderRadius: 4, background: 'linear-gradient(90deg, #ec4899, #a855f7)', opacity: 0.75 }} />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, alignSelf: 'flex-start', ml: 1 }}>
                                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }} />
                                    <Box sx={{ width: 48, height: 14, borderRadius: 4, background: 'linear-gradient(90deg, #f5d0fe, #ddd6fe)' }} />
                                </Box>
                                <LaptopIcon sx={{ fontSize: 20, color: 'rgba(236,72,153,0.25)', mt: 0.5 }} />
                            </Box>
                        </Box>
                        {/* Laptop base */}
                        <Box sx={{
                            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                            width: '100%', height: 12,
                            background: 'linear-gradient(180deg, #e8d5f5, #f0e0ff)',
                            borderRadius: '0 0 8px 8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                        }} />

                        {/* Phone (floating, tilted) */}
                        <Box sx={{
                            position: 'absolute',
                            right: { xs: -10, sm: -20 },
                            top: { xs: 10, sm: 0 },
                            width: { xs: 56, sm: 70 },
                            height: { xs: 105, sm: 130 },
                            background: 'linear-gradient(160deg, #ffffff 0%, #fce7f3 80%, #fdf4ff 100%)',
                            borderRadius: '16px',
                            boxShadow: '0 12px 40px rgba(236,72,153,0.18), 0 4px 16px rgba(0,0,0,0.10)',
                            border: '1.5px solid rgba(255,255,255,0.85)',
                            transform: 'rotate(8deg)',
                            animation: 'phoneWiggle 4s 1s ease-in-out infinite',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                            '@keyframes phoneWiggle': {
                                '0%,100%': { transform: 'rotate(8deg) translateY(0)' },
                                '50%': { transform: 'rotate(10deg) translateY(-8px)' }
                            }
                        }}>
                            {/* Phone notch */}
                            <Box sx={{ width: 22, height: 4, borderRadius: 2, background: 'rgba(236,72,153,0.2)', position: 'absolute', top: 8 }} />
                            <PhoneIcon sx={{ fontSize: 20, color: '#ec4899', opacity: 0.7 }} />
                            <Box sx={{ width: 28, height: 4, borderRadius: 2, background: 'linear-gradient(90deg, #ec4899, #a855f7)', opacity: 0.5 }} />
                            <Box sx={{ width: 20, height: 4, borderRadius: 2, background: 'rgba(236,72,153,0.2)', opacity: 0.5 }} />
                        </Box>

                        {/* Floating connection sparkle */}
                        <Box sx={{
                            position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
                            animation: 'sparkleFloat 2s ease-in-out infinite',
                            '@keyframes sparkleFloat': {
                                '0%,100%': { transform: 'translateX(-50%) scale(1)', opacity: 0.9 },
                                '50%': { transform: 'translateX(-50%) scale(1.3)', opacity: 0.6 }
                            }
                        }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {['#ec4899','#f472b6','#a855f7'].map((c,i) => (
                                    <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.8 }} />
                                ))}
                            </Box>
                        </Box>

                        {/* Floating heart near phone */}
                        <Box sx={{
                            position: 'absolute', top: -10, right: { xs: 30, sm: 40 },
                            animation: 'miniHeartFloat 3s 0.5s ease-in-out infinite',
                            '@keyframes miniHeartFloat': {
                                '0%,100%': { transform: 'translateY(0) rotate(-10deg)' },
                                '50%': { transform: 'translateY(-14px) rotate(8deg)' }
                            }
                        }}>
                            <svg viewBox="0 0 24 24" fill="#ec4899" width="20" height="20" style={{ opacity: 0.75 }}>
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </Box>

                        {/* Lock badge */}
                        <Box sx={{
                            position: 'absolute', top: 0, left: { xs: 0, sm: -10 },
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(253,242,248,0.9))',
                            backdropFilter: 'blur(10px)',
                            border: '1.5px solid rgba(236,72,153,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(236,72,153,0.15)',
                            animation: 'lockFloat 6s ease-in-out infinite',
                            '@keyframes lockFloat': {
                                '0%,100%': { transform: 'translate(0,0) rotate(-5deg)' },
                                '50%': { transform: 'translate(-5px,-10px) rotate(5deg)' }
                            }
                        }}>
                            <LockIcon sx={{ fontSize: 20, color: '#ec4899' }} />
                        </Box>
                    </Box>

                    {/* Mascot Robot */}
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8,
                        animation: 'mascotFloat 4s ease-in-out infinite',
                        '@keyframes mascotFloat': {
                            '0%,100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-10px)' }
                        }
                    }}>
                        <Box sx={{
                            width: { xs: 90, sm: 110 }, height: { xs: 90, sm: 110 },
                            borderRadius: '50%',
                            overflow: 'hidden',
                            boxShadow: '0 12px 40px rgba(236,72,153,0.22), 0 4px 16px rgba(0,0,0,0.08)',
                            border: '3px solid rgba(255,255,255,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={juicyMascot}
                                alt="Jerry Bot mascot"
                                style={{
                                    width: '125%',
                                    height: '125%',
                                    objectFit: 'cover',
                                    objectPosition: 'center 85%',
                                    transform: 'translateY(-6px)',
                                    borderRadius: '50%',
                                    pointerEvents: 'none'
                                }}
                            />
                        </Box>
                        <Box sx={{
                            px: 1.5, py: 0.4,
                            background: 'rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '50px',
                            border: '1px solid rgba(236,72,153,0.15)',
                        }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#be185d' }}>
                                Hi! I'm Jerry Bot 🤍
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ══ RIGHT: 5-DIGIT GLASS CARD ══ */}
                <Box sx={{
                    flex: '0 0 auto',
                    width: { xs: '100%', lg: 310 },
                    display: 'flex', flexDirection: 'column',
                }}>
                    <Box sx={{
                        background: 'rgba(255,255,255,0.52)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        border: '1.5px solid rgba(255,255,255,0.75)',
                        borderRadius: '28px',
                        boxShadow: '0 20px 60px rgba(168,85,247,0.10), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                        p: { xs: 3, sm: 3.5 },
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        height: '100%',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 28px 70px rgba(168,85,247,0.16), 0 12px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                        }
                    }}>
                        {/* 5-digit image */}
                        <Box sx={{ mb: 1.5, width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img
                                src={logo5Digit}
                                alt="5 Digit Link"
                                style={{ width: '100%', maxWidth: 200, height: 90, objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(168,85,247,0.22))' }}
                            />
                        </Box>

                        {/* Header */}
                        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.8 }}>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(168,85,247,0.4)'
                                }}>
                                    <KeyIcon sx={{ fontSize: 18, color: '#fff' }} />
                                </Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e1b2e' }}>
                                    Link with 5-digit code
                                </Typography>
                            </Box>
                            <Typography sx={{ color: '#7c4d8a', fontSize: '0.83rem', lineHeight: 1.55, maxWidth: 250, mx: 'auto' }}>
                                Enter the 5-digit code generated by your juicy mobile app to link this device.
                            </Typography>
                        </Box>

                        {/* 5 Digit Input Boxes */}
                        <Box
                            sx={{ display: 'flex', gap: 1.2, justifyContent: 'center', mb: 3 }}
                            onPaste={handlePaste}
                        >
                            {digits.map((digit, index) => (
                                <TextField
                                    key={index}
                                    inputRef={digitRefs[index]}
                                    value={digit}
                                    disabled={awaitingConfirmation}
                                    onChange={(e) => handleDigitChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    variant="outlined"
                                    inputProps={{
                                        maxLength: 1,
                                        style: {
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                            fontWeight: 800,
                                            padding: '12px 4px',
                                            color: '#1e1b2e',
                                            fontFamily: "'Poppins', sans-serif",
                                        }
                                    }}
                                    sx={{
                                        width: { xs: 48, sm: 52 },
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            bgcolor: digit ? 'rgba(236,72,153,0.06)' : 'rgba(255,255,255,0.7)',
                                            backdropFilter: 'blur(8px)',
                                            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                            '& fieldset': {
                                                borderColor: digit ? '#ec4899' : 'rgba(200,160,220,0.4)',
                                                borderWidth: digit ? '2px' : '1.5px',
                                                transition: 'all 0.25s ease',
                                            },
                                            '&:hover fieldset': { borderColor: '#ec4899', borderWidth: '2px' },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#a855f7',
                                                borderWidth: '2.5px',
                                                boxShadow: '0 0 0 5px rgba(168,85,247,0.12)'
                                            },
                                            '&.Mui-focused': {
                                                bgcolor: 'rgba(168,85,247,0.05)',
                                                transform: 'translateY(-2px) scale(1.04)',
                                                boxShadow: '0 8px 24px rgba(168,85,247,0.18)',
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Awaiting Confirmation */}
                        {awaitingConfirmation && (
                            <Fade in>
                                <Box sx={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2,
                                    p: 2, borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(168,85,247,0.06))',
                                    border: '1px solid rgba(236,72,153,0.15)',
                                    width: '100%', mb: 2
                                }}>
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                        <CircularProgress size={28} thickness={3} sx={{ color: '#ec4899' }} />
                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <PhoneIcon sx={{ fontSize: 14, color: '#ec4899' }} />
                                        </Box>
                                    </Box>
                                    <Typography sx={{ color: '#7c4d8a', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem' }}>
                                        Awaiting confirmation on your phone...
                                    </Typography>
                                </Box>
                            </Fade>
                        )}

                        {/* Security Message */}
                        {!awaitingConfirmation && (
                            <Box sx={{ mt: 'auto', pt: 1 }}>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8,
                                    px: 2, py: 1,
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.55)',
                                    border: '1px solid rgba(236,72,153,0.12)',
                                }}>
                                    <SecurityIcon sx={{ fontSize: 16, color: '#a855f7' }} />
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c4d8a' }}>
                                        Your connection is secure and encrypted
                                    </Typography>
                                </Box>

                                {/* Shield icons row */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                    {[LockIcon, FingerprintIcon, VerifiedIcon].map((Icon, i) => (
                                        <Box key={i} sx={{
                                            width: 28, height: 28, borderRadius: '8px',
                                            background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(168,85,247,0.08))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid rgba(236,72,153,0.1)'
                                        }}>
                                            <Icon sx={{ fontSize: 15, color: '#ec4899', opacity: 0.7 }} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── FOOTER GLASS PILL ── */}
            <Box sx={{
                position: 'relative', zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 1,
                px: 3, py: 1,
                borderRadius: '50px',
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(236,72,153,0.18)',
                boxShadow: '0 4px 20px rgba(236,72,153,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                my: 2,
                flexShrink: 0,
            }}>
                <PhoneIcon sx={{ fontSize: 15, color: '#ec4899' }} />
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#7c4d8a' }}>
                    Juicy Web links securely to your mobile account. Your messages stay private.
                </Typography>
                <LockIcon sx={{ fontSize: 14, color: '#a855f7', opacity: 0.7 }} />
            </Box>

            {/* ── INVALID CODE DIALOG ── */}
            <Dialog
                open={invalidCodeOpen}
                onClose={handleCloseInvalidDialog}
                PaperProps={{
                    sx: {
                        borderRadius: '28px',
                        padding: 4,
                        maxWidth: 420,
                        width: '90%',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(236,72,153,0.1)',
                        border: '1.5px solid rgba(255,255,255,0.85)',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0, pt: 1 }}>
                    <Box sx={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.10))',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        mb: 3,
                        animation: 'errorPulse 2s infinite ease-in-out',
                        '@keyframes errorPulse': {
                            '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(236,72,153,0.4)' },
                            '70%': { transform: 'scale(1.06)', boxShadow: '0 0 0 14px rgba(236,72,153,0)' },
                            '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(236,72,153,0)' }
                        }
                    }}>
                        <ErrorIcon sx={{ fontSize: 40, color: '#ec4899' }} />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e1b2e', mb: 1.5, fontSize: '1.3rem' }}>
                        Invalid Code
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#7c4d8a', mb: 4, lineHeight: 1.7, fontSize: '0.9rem', maxWidth: 300 }}>
                        The 5-digit code you entered is incorrect or has expired. Please check the code on your mobile device and try again.
                    </Typography>

                    <Button
                        onClick={handleCloseInvalidDialog}
                        variant="contained"
                        fullWidth
                        sx={{
                            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                            color: '#fff', py: 1.5, borderRadius: '16px',
                            textTransform: 'none', fontWeight: 700, fontSize: '0.95rem',
                            boxShadow: '0 8px 28px rgba(236,72,153,0.30)',
                            transition: 'all 0.25s ease',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #db2777, #9333ea)',
                                boxShadow: '0 12px 36px rgba(236,72,153,0.42)',
                                transform: 'translateY(-2px)'
                            },
                            '&:active': { transform: 'translateY(0)' }
                        }}
                    >
                        Try Again
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
