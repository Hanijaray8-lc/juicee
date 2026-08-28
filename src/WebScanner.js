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

export default function WebScanner() {
    const navigate = useNavigate();
    const socket = useSocket();
    const isMobile = useMediaQuery('(max-width:768px)');

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
            height: '100dvh',
            maxHeight: '100dvh',
            width: '100%',
            bgcolor: '#fff0f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            fontFamily: "'Poppins', sans-serif",
            overflow: { xs: 'auto', md: 'hidden' },
            background: 'linear-gradient(-45deg, #fff0f5, #fce4ec, #f8bbd0, #f48fb1, #f8bbd0, #fce4ec)',
            backgroundSize: '400% 400%',
            animation: 'pinkGradientBG 12s ease infinite',
            boxSizing: 'border-box',
            py: { xs: 1, sm: 1.5 },
            '@keyframes pinkGradientBG': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
            }
        }}>
            {/* Animated pink glowing background mesh elements */}
            <Box sx={{
                position: 'absolute',
                top: -120,
                right: -100,
                width: 520,
                height: 520,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240, 98, 146, 0.32) 0%, rgba(255, 64, 129, 0.12) 50%, transparent 70%)',
                zIndex: 0,
                pointerEvents: 'none',
                filter: 'blur(40px)',
                animation: 'floatPinkOrb1 16s ease-in-out infinite',
                '@keyframes floatPinkOrb1': {
                    '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
                    '50%': { transform: 'translate(40px, -45px) scale(1.15)' }
                }
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: -100,
                left: -100,
                width: 560,
                height: 560,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 128, 171, 0.28) 0%, rgba(240, 98, 146, 0.12) 50%, transparent 70%)',
                zIndex: 0,
                pointerEvents: 'none',
                filter: 'blur(40px)',
                animation: 'floatPinkOrb2 20s ease-in-out infinite',
                '@keyframes floatPinkOrb2': {
                    '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
                    '50%': { transform: 'translate(-45px, 40px) scale(1.12)' }
                }
            }} />

            {/* Brand Header */}
            <Box sx={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: 1100,
                px: { xs: 2, sm: 3 },
                pt: { xs: 0.5, sm: 1 },
                pb: { xs: 0.5, sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <img
                        src={logojuicy2}
                        alt="juicy Web"
                        style={{ height: 38, objectFit: 'contain' }}
                    />
                </Box>
                <Chip
                    icon={<VerifiedIcon sx={{ fontSize: 14, color: 'var(--primary-color, #f06292)' }} />}
                    label="End-to-End Encrypted"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(240, 98, 146, 0.08)',
                        color: '#54656f',
                        fontWeight: 500,
                        fontSize: '0.72rem',
                        height: 26,
                        border: '1px solid rgba(240, 98, 146, 0.15)',
                        '& .MuiChip-icon': { color: 'var(--primary-color, #f06292)' }
                    }}
                />
            </Box>

            {/* Main Container Card */}
            <Card sx={{
                position: 'relative',
                zIndex: 1,
                width: '92%',
                maxWidth: 1100,
                flex: 1,
                maxHeight: { md: 'calc(100vh - 110px)' },
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(240, 98, 146, 0.06)',
                my: { xs: 1, sm: 1.5 },
                bgcolor: '#ffffff',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' }
            }}>
                {/* Left Side: QR Code + Instructions */}
                <Box sx={{
                    flex: 1.1,
                    p: { xs: 2.5, sm: 3, md: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRight: { md: '1px solid rgba(0,0,0,0.04)' },
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Subtle decorative gradient on left side */}
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 100,
                        background: 'linear-gradient(180deg, rgba(240, 98, 146, 0.03) 0%, transparent 100%)',
                        pointerEvents: 'none'
                    }} />

                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h5" sx={{
                                fontWeight: 700,
                                color: '#1a1a2e',
                                mb: 0.5,
                                fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
                                letterSpacing: '-0.01em'
                            }}>
                                Use Juicy on your computer
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: '#6b7280',
                                mb: 2,
                                fontSize: '0.85rem',
                                lineHeight: 1.4
                            }}>
                                Scan the QR code with your phone to link this device instantly.
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                                {[
                                    { num: 1, text: 'Open ', bold: 'Juicy', text2: ' on your phone.' },
                                    { num: 2, text: 'Tap your ', bold: 'Profile Icon', text2: ' and select ', bold2: 'Linked Devices' },
                                    { num: 3, text: 'Point your phone camera at this screen to scan the QR code.' }
                                ].map((step, idx) => (
                                    <Fade in key={idx} timeout={500 + idx * 200}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                            <Box sx={{
                                                minWidth: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                bgcolor: 'var(--primary-color, #f06292)',
                                                color: '#fff',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                boxShadow: '0 2px 6px rgba(240, 98, 146, 0.3)',
                                                mt: 0.1
                                            }}>{step.num}</Box>
                                            <Typography variant="body2" sx={{
                                                color: '#4b5563',
                                                fontSize: '0.825rem',
                                                lineHeight: 1.4,
                                                pt: 0.1
                                            }}>
                                                {step.text}
                                                {step.bold && <strong style={{ color: '#1a1a2e' }}>{step.bold}</strong>}
                                                {step.text2}
                                                {step.bold2 && <strong style={{ color: '#1a1a2e' }}>{step.bold2}</strong>}
                                                {step.num === 3 && '.'}
                                            </Typography>
                                        </Box>
                                    </Fade>
                                ))}
                            </Box>
                        </Box>

                        {/* QR Code Container */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 'auto' }}>
                            <Paper elevation={0} sx={{
                                position: 'relative',
                                width: { xs: 200, sm: 230 },
                                height: { xs: 200, sm: 230 },
                                p: 1.5,
                                borderRadius: '20px',
                                bgcolor: '#ffffff',
                                boxShadow: qrCodeValid
                                    ? '0 6px 24px rgba(240, 98, 146, 0.12), 0 2px 8px rgba(0,0,0,0.06)'
                                    : '0 4px 16px rgba(0,0,0,0.04)',
                                border: '1px solid rgba(240, 98, 146, 0.12)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mb: 1.5,
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': qrCodeValid ? {
                                    boxShadow: '0 10px 32px rgba(240, 98, 146, 0.18), 0 4px 12px rgba(0,0,0,0.08)',
                                    transform: 'translateY(-2px)'
                                } : {}
                            }}>
                                {/* Animated scanning line */}
                                {qrCodeValid && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 10,
                                        right: 10,
                                        height: 2,
                                        bgcolor: 'var(--primary-color, #f06292)',
                                        borderRadius: 1,
                                        opacity: 0.6,
                                        animation: 'scanLine 2.5s ease-in-out infinite',
                                        zIndex: 2,
                                        '@keyframes scanLine': {
                                            '0%': { top: 10, opacity: 0.3 },
                                            '50%': { opacity: 0.8 },
                                            '100%': { top: 208, opacity: 0.3 }
                                        }
                                    }} />
                                )}

                                {/* Corner decorations */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: 10,
                                    left: 10,
                                    width: 20,
                                    height: 20,
                                    borderTop: '3px solid var(--primary-color, #f06292)',
                                    borderLeft: '3px solid var(--primary-color, #f06292)',
                                    borderTopLeftRadius: 8,
                                    opacity: qrCodeValid ? 0.8 : 0.2,
                                    transition: 'opacity 0.3s ease'
                                }} />
                                <Box sx={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    width: 20,
                                    height: 20,
                                    borderTop: '3px solid var(--primary-color, #f06292)',
                                    borderRight: '3px solid var(--primary-color, #f06292)',
                                    borderTopRightRadius: 8,
                                    opacity: qrCodeValid ? 0.8 : 0.2,
                                    transition: 'opacity 0.3s ease'
                                }} />
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 10,
                                    left: 10,
                                    width: 20,
                                    height: 20,
                                    borderBottom: '3px solid var(--primary-color, #f06292)',
                                    borderLeft: '3px solid var(--primary-color, #f06292)',
                                    borderBottomLeftRadius: 8,
                                    opacity: qrCodeValid ? 0.8 : 0.2,
                                    transition: 'opacity 0.3s ease'
                                }} />
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 10,
                                    right: 10,
                                    width: 20,
                                    height: 20,
                                    borderBottom: '3px solid var(--primary-color, #f06292)',
                                    borderRight: '3px solid var(--primary-color, #f06292)',
                                    borderBottomRightRadius: 8,
                                    opacity: qrCodeValid ? 0.8 : 0.2,
                                    transition: 'opacity 0.3s ease'
                                }} />

                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=f06292&data=${encodeURIComponent(sessionId)}`}
                                    alt="Scan to login"
                                    style={{
                                        width: 180,
                                        height: 180,
                                        display: 'block',
                                        opacity: qrCodeValid ? 1 : 0.25,
                                        transition: 'opacity 0.3s ease',
                                        borderRadius: 4
                                    }}
                                />

                                {/* Expired Overlay */}
                                {!qrCodeValid && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        bgcolor: 'rgba(255,255,255,0.95)',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        p: 2,
                                        zIndex: 4,
                                        gap: 1
                                    }}>
                                        <RefreshIcon sx={{
                                            fontSize: 34,
                                            color: 'var(--primary-color, #f06292)',
                                            mb: 0.2
                                        }} />
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600,
                                            color: '#1a1a2e',
                                            fontSize: '0.9rem'
                                        }}>
                                            QR Code Expired
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleReloadQR}
                                            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                                            sx={{
                                                bgcolor: 'var(--primary-color, #f06292)',
                                                color: '#fff',
                                                fontWeight: 600,
                                                borderRadius: '8px',
                                                px: 2.5,
                                                py: 0.6,
                                                textTransform: 'none',
                                                fontSize: '0.82rem',
                                                boxShadow: '0 4px 12px rgba(240, 98, 146, 0.3)',
                                                '&:hover': {
                                                    bgcolor: 'var(--primary-color, #e91e63)',
                                                    boxShadow: '0 6px 16px rgba(240, 98, 146, 0.4)'
                                                }
                                            }}
                                        >
                                            Refresh Code
                                        </Button>
                                    </Box>
                                )}
                            </Paper>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mt: 0.5
                            }}>
                                <Typography variant="body2" sx={{
                                    color: '#6b7280',
                                    fontSize: '0.85rem'
                                }}>
                                    Don't have an account?
                                </Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => navigate('/signup')}
                                    sx={{
                                        color: 'var(--primary-color, #f06292)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                            color: '#d81b60'
                                        }
                                    }}
                                >
                                    Register here
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Right Side: 5-Digit Code Entry */}
                <Box sx={{
                    flex: 1,
                    p: { xs: 2.5, sm: 3, md: 3.5 },
                    bgcolor: '#fafbfc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative dots pattern */}
                    <Box sx={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        width: 80,
                        height: 80,
                        backgroundImage: 'radial-gradient(circle, rgba(240, 98, 146, 0.1) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                        pointerEvents: 'none'
                    }} />
                    <Box sx={{
                        position: 'absolute',
                        bottom: 30,
                        left: 20,
                        width: 60,
                        height: 60,
                        backgroundImage: 'radial-gradient(circle, rgba(240, 98, 146, 0.06) 1px, transparent 1px)',
                        backgroundSize: '10px 10px',
                        pointerEvents: 'none'
                    }} />

                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <img
                                src={logo5Digit}
                                alt="5 Digit Link Logo"
                                style={{
                                    width: '100%',
                                    maxWidth: 260,
                                    height: 120,
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))'
                                }}
                            />
                        </Box>

                        <Box sx={{
                            textAlign: 'center',
                            mb: 2.5
                        }}>
                            <Typography variant="h5" sx={{
                                fontWeight: 700,
                                color: '#1a1a2e',
                                mb: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                fontSize: { xs: '1.2rem', md: '1.3rem' }
                            }}>
                                <KeyIcon sx={{ color: 'var(--primary-color, #f06292)', fontSize: 22 }} />
                                Link with 5-digit code
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: '#6b7280',
                                fontSize: '0.85rem',
                                lineHeight: 1.4,
                                maxWidth: 280,
                                mx: 'auto'
                            }}>
                                Enter the 5-digit code generated by your juicy mobile app to link this device.
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                            alignItems: 'center'
                        }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1.2,
                                    justifyContent: 'center'
                                }}
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
                                                fontSize: '1.4rem',
                                                fontWeight: 'bold',
                                                padding: '10px 4px',
                                                color: '#1a1a2e'
                                            }
                                        }}
                                        sx={{
                                            width: { xs: 44, sm: 48 },
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                bgcolor: digit ? 'rgba(240, 98, 146, 0.06)' : '#ffffff',
                                                transition: 'all 0.3s ease',
                                                '& fieldset': {
                                                    borderColor: digit
                                                        ? 'var(--primary-color, #f06292)'
                                                        : 'rgba(0,0,0,0.1)',
                                                    borderWidth: digit ? '2px' : '1.5px',
                                                    transition: 'all 0.3s ease'
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'var(--primary-color, #e91e63)',
                                                    borderWidth: '2px'
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'var(--primary-color, #d81b60)',
                                                    borderWidth: '2.5px',
                                                    boxShadow: '0 0 0 4px rgba(240, 98, 146, 0.1)'
                                                }
                                            }
                                        }}
                                    />
                                ))}
                            </Box>

                            {awaitingConfirmation && (
                                <Fade in>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: 1.5,
                                        borderRadius: '12px',
                                        bgcolor: 'rgba(240, 98, 146, 0.04)',
                                        border: '1px solid rgba(240, 98, 146, 0.1)',
                                        width: '100%',
                                        maxWidth: 280
                                    }}>
                                        <Box sx={{ position: 'relative' }}>
                                            <CircularProgress
                                                size={24}
                                                thickness={3}
                                                sx={{ color: 'var(--primary-color, #f06292)' }}
                                            />
                                            <Box sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)'
                                            }}>
                                                <PhoneIcon sx={{
                                                    fontSize: 12,
                                                    color: 'var(--primary-color, #f06292)'
                                                }} />
                                            </Box>
                                        </Box>
                                        <Typography variant="caption" sx={{
                                            color: '#6b7280',
                                            textAlign: 'center',
                                            fontWeight: 500,
                                            fontSize: '0.8rem'
                                        }}>
                                            Awaiting confirmation on your phone...
                                        </Typography>
                                    </Box>
                                </Fade>
                            )}

                            {!awaitingConfirmation && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    color: '#9ca3af'
                                }}>
                                    <SecurityIcon sx={{ fontSize: 15 }} />
                                    <Typography variant="caption" sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        Your connection is secure and encrypted
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Card>

            {/* Footer Info */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#374151',
                bgcolor: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(8px)',
                px: 2.5,
                py: 0.75,
                borderRadius: '20px',
                border: '1px solid rgba(240, 98, 146, 0.18)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                zIndex: 1,
                mb: 1,
                flexShrink: 0
            }}>
                <PhoneIcon sx={{ fontSize: 16, color: 'var(--primary-color, #f06292)' }} />
                <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#374151' }}>
                    Juicy Web links securely to your mobile account. Your messages stay private.
                </Typography>
            </Box>

            {/* Invalid Code Dialog */}
            <Dialog
                open={invalidCodeOpen}
                onClose={handleCloseInvalidDialog}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        padding: 4,
                        maxWidth: 420,
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(240, 98, 146, 0.1)',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogContent sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 0,
                    pt: 1
                }}>
                    <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'rgba(240, 98, 146, 0.08)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 3,
                        color: 'var(--primary-color, #f06292)',
                        animation: 'pulse 2s infinite ease-in-out',
                        '@keyframes pulse': {
                            '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(240, 98, 146, 0.4)' },
                            '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 12px rgba(240, 98, 146, 0)' },
                            '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(240, 98, 146, 0)' }
                        }
                    }}>
                        <ErrorIcon sx={{ fontSize: 40 }} />
                    </Box>

                    <Typography variant="h5" sx={{
                        fontWeight: 700,
                        color: '#1a1a2e',
                        mb: 1.5,
                        fontSize: '1.3rem'
                    }}>
                        Invalid Code
                    </Typography>

                    <Typography variant="body2" sx={{
                        color: '#6b7280',
                        mb: 4,
                        lineHeight: 1.7,
                        fontSize: '0.9rem',
                        maxWidth: 300
                    }}>
                        The 5-digit code you entered is incorrect or has expired. Please check the code on your mobile device and try again.
                    </Typography>

                    <Button
                        onClick={handleCloseInvalidDialog}
                        variant="contained"
                        fullWidth
                        sx={{
                            bgcolor: 'var(--primary-color, #f06292)',
                            color: '#fff',
                            py: 1.4,
                            borderRadius: '14px',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            boxShadow: '0 8px 24px rgba(240, 98, 146, 0.25)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: 'var(--primary-color, #e91e63)',
                                boxShadow: '0 10px 28px rgba(240, 98, 146, 0.35)',
                                transform: 'translateY(-1px)'
                            },
                            '&:active': {
                                transform: 'translateY(0)'
                            }
                        }}
                    >
                        Try Again
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
}