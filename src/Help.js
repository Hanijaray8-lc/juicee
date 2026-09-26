import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardMedia,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ScheduleIcon from '@mui/icons-material/Schedule';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import API_BASE_URL from './config/apiConfig';
import { useNavigate } from 'react-router-dom';
import useSwipeBack from './hooks/useSwipeBack';

const USER_TICKETS_KEY = 'juicy_my_tickets';
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_SCREENSHOTS_COUNT = 3;

const Help = ({ onBack }) => {
  useSwipeBack();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const trackerSectionRef = useRef(null);

  // Form states
  const [name, setName] = useState(() => localStorage.getItem('username') || '');
  const [mobileNumber, setMobileNumber] = useState(() => localStorage.getItem('phone') || localStorage.getItem('userPhone') || '');
  const [category, setCategory] = useState('App Bug / Technical Issue');
  const [issueDescription, setIssueDescription] = useState('');
  const [screenshots, setScreenshots] = useState([]); // array of { file, previewUrl, name, id }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [errors, setErrors] = useState({});

  // User-specific submitted tickets (Confidential: only this user's tickets)
  const [myTickets, setMyTickets] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_TICKETS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [selectedTicketId, setSelectedTicketId] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_TICKETS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id || parsed[0]._id || parsed[0].ticketNumber;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [showIssueDetails, setShowIssueDetails] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Manual ticket lookup state
  const [searchTicketNumber, setSearchTicketNumber] = useState('');
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);

  // Load user tickets from backend for the user's mobile number if available
  const syncMyTicketsFromBackend = useCallback(async (phone) => {
    const targetPhone = phone || mobileNumber;
    if (!targetPhone || !targetPhone.trim()) return;

    try {
      const endpoint = `${API_BASE_URL}/api/help/queries?mobileNumber=${encodeURIComponent(targetPhone.trim())}`;
      const fallback = `https://juicyapp.in/api/help/queries?mobileNumber=${encodeURIComponent(targetPhone.trim())}`;

      let fetched = null;
      for (const url of [endpoint, fallback]) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.queries)) {
              fetched = data.queries.map(q => ({ ...q, id: q._id || q.id }));
              break;
            }
          }
        } catch {
          // try fallback
        }
      }

      if (fetched && fetched.length > 0) {
        setMyTickets(prev => {
          const map = new Map();
          // Add local ones first
          prev.forEach(t => map.set(t.ticketNumber || t.id, t));
          // Merge fetched ones (they have latest server status)
          fetched.forEach(t => map.set(t.ticketNumber || t.id, t));
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          localStorage.setItem(USER_TICKETS_KEY, JSON.stringify(merged));
          return merged;
        });

        if (!selectedTicketId) {
          setSelectedTicketId(fetched[0].id || fetched[0]._id || fetched[0].ticketNumber);
        }
      }
    } catch (err) {
      console.warn('Could not sync user tickets:', err);
    }
  }, [mobileNumber, selectedTicketId]);

  useEffect(() => {
    if (mobileNumber && mobileNumber.trim()) {
      syncMyTicketsFromBackend(mobileNumber.trim());
    }
  }, [mobileNumber, syncMyTicketsFromBackend]);

  // Back handler
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Screenshot File Selection with Size & Count Requirements
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (screenshots.length >= MAX_SCREENSHOTS_COUNT) {
      setSnackbar({
        open: true,
        message: `Maximum limit reached: You can only attach up to ${MAX_SCREENSHOTS_COUNT} screenshots.`,
        severity: 'warning'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const availableSlots = MAX_SCREENSHOTS_COUNT - screenshots.length;
    const filesToProcess = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      setSnackbar({
        open: true,
        message: `Only ${availableSlots} more image(s) allowed (Max ${MAX_SCREENSHOTS_COUNT} total).`,
        severity: 'info'
      });
    }

    const validImages = [];
    let oversizeCount = 0;
    let invalidTypeCount = 0;

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidTypeCount++;
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        oversizeCount++;
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      validImages.push({
        file,
        previewUrl,
        name: file.name,
        sizeFormatted,
        id: `${Date.now()}-${Math.random()}`
      });
    });

    if (oversizeCount > 0) {
      setSnackbar({
        open: true,
        message: `${oversizeCount} file(s) exceeded the ${MAX_IMAGE_SIZE_MB}MB size limit and were rejected.`,
        severity: 'error'
      });
    } else if (invalidTypeCount > 0) {
      setSnackbar({
        open: true,
        message: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.',
        severity: 'warning'
      });
    }

    if (validImages.length > 0) {
      setScreenshots(prev => [...prev, ...validImages]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove Screenshot
  const handleRemoveScreenshot = (id) => {
    setScreenshots(prev => {
      const target = prev.find(item => item.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  // Helper to convert File object to optimized Base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Output as compressed JPEG with 0.8 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(event.target.result);
      };
      reader.onerror = () => resolve(null);
    });
  };

  // Refresh status of currently selected ticket or all user tickets
  const handleRefreshStatus = async () => {
    if (!selectedTicket) {
      if (mobileNumber && mobileNumber.trim()) {
        setIsRefreshingStatus(true);
        await syncMyTicketsFromBackend(mobileNumber.trim());
        setIsRefreshingStatus(false);
      }
      return;
    }

    setIsRefreshingStatus(true);
    const identifier = selectedTicket.ticketNumber || selectedTicket.id || selectedTicket._id;

    try {
      const cleanId = encodeURIComponent(identifier);
      const endpoints = [
        `${API_BASE_URL}/api/help/queries/${cleanId}`,
        `https://juicyapp.in/api/help/queries/${cleanId}`
      ];

      let updated = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.query) {
              updated = { ...data.query, id: data.query._id || data.query.id };
              break;
            }
          }
        } catch {
          // try fallback
        }
      }

      if (updated) {
        setMyTickets(prev => {
          const next = prev.map(t => (t.ticketNumber === updated.ticketNumber || t.id === updated.id ? updated : t));
          localStorage.setItem(USER_TICKETS_KEY, JSON.stringify(next));
          return next;
        });
        setSnackbar({
          open: true,
          message: `Status updated: ${updated.status}`,
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Status is current',
          severity: 'info'
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Could not fetch status update',
        severity: 'warning'
      });
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Search ticket by ticket number
  const handleSearchTicket = async () => {
    if (!searchTicketNumber.trim()) return;

    setIsSearchingTicket(true);
    let term = searchTicketNumber.trim();
    if (!term.startsWith('#') && term.startsWith('JQ-')) {
      term = `#${term}`;
    }

    try {
      const cleanId = encodeURIComponent(term);
      const endpoints = [
        `${API_BASE_URL}/api/help/queries/${cleanId}`,
        `https://juicyapp.in/api/help/queries/${cleanId}`
      ];

      let found = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.query) {
              found = { ...data.query, id: data.query._id || data.query.id };
              break;
            }
          }
        } catch {
          // try fallback
        }
      }

      if (found) {
        setMyTickets(prev => {
          const exists = prev.some(t => t.ticketNumber === found.ticketNumber);
          const next = exists ? prev.map(t => t.ticketNumber === found.ticketNumber ? found : t) : [found, ...prev];
          localStorage.setItem(USER_TICKETS_KEY, JSON.stringify(next));
          return next;
        });
        setSelectedTicketId(found.id || found._id || found.ticketNumber);
        setSearchTicketNumber('');
        setSnackbar({
          open: true,
          message: `Ticket ${found.ticketNumber} loaded!`,
          severity: 'success'
        });
        trackerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setSnackbar({
          open: true,
          message: 'No ticket found with this number',
          severity: 'error'
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Error searching ticket. Check connection.',
        severity: 'error'
      });
    } finally {
      setIsSearchingTicket(false);
    }
  };

  // Copy Ticket Number
  const handleCopyTicket = (ticketNum) => {
    if (!ticketNum) return;
    navigator.clipboard?.writeText(ticketNum);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  // Submit Query
  const handleSubmitQuery = async () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Please enter your name';
    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Please enter your mobile number';
    } else if (!/^[0-9+\s-]{7,15}$/.test(mobileNumber.trim())) {
      newErrors.mobileNumber = 'Enter a valid mobile number';
    }
    if (!issueDescription.trim()) newErrors.issueDescription = 'Please describe your issue';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields.',
        severity: 'error'
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Convert screenshots to Base64
      const convertedScreenshots = [];
      for (const item of screenshots) {
        try {
          const base64 = await fileToBase64(item.file);
          convertedScreenshots.push({
            name: item.name,
            dataUrl: base64
          });
        } catch (err) {
          console.warn('Screenshot conversion error:', err);
        }
      }

      let createdTicket = null;
      const endpoints = [
        `${API_BASE_URL}/api/help/submit`,
        'https://juicyapp.in/api/help/submit'
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              mobileNumber: mobileNumber.trim(),
              category: category || 'App Bug / Technical Issue',
              issueDescription: issueDescription.trim(),
              screenshots: convertedScreenshots,
              userId: localStorage.getItem('userId') || null
            }),
            signal: controller.signal
          });
          clearTimeout(timer);
          if (response.ok) {
            const data = await response.json();
            if (data && data.success && data.ticket) {
              createdTicket = {
                ...data.ticket,
                id: data.ticket._id || data.ticket.id
              };
              break;
            }
          }
        } catch {
          // fallback to next
        }
      }

      // If backend was unreachable, create resilient local ticket
      if (!createdTicket) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        createdTicket = {
          id: `TKT-${Date.now()}`,
          ticketNumber: `#JQ-${randomNum}`,
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          category: category || 'App Bug / Technical Issue',
          issueDescription: issueDescription.trim(),
          screenshots: convertedScreenshots,
          createdAt: new Date().toISOString(),
          status: 'Pending',
          replies: [
            {
              id: `rep_${Date.now()}`,
              sender: 'system',
              senderName: 'Juicy Support Desk',
              message: 'Thank you for reaching out! We have received your query and will update you shortly.',
              timestamp: new Date().toISOString()
            }
          ]
        };
      }

      // Save to this user's tickets list for Help.js tracker
      const nextTickets = [createdTicket, ...myTickets.filter(t => (t.id || t._id) !== createdTicket.id)];
      setMyTickets(nextTickets);
      localStorage.setItem(USER_TICKETS_KEY, JSON.stringify(nextTickets));
      setSelectedTicketId(createdTicket.id || createdTicket._id || createdTicket.ticketNumber);

      // Also update juicy_support_queries so Help&Query desk receives the ticket immediately
      try {
        const supportQueries = JSON.parse(localStorage.getItem('juicy_support_queries') || '[]');
        const updatedSupport = [createdTicket, ...supportQueries.filter(q => (q._id || q.id) !== (createdTicket._id || createdTicket.id))];
        localStorage.setItem('juicy_support_queries', JSON.stringify(updatedSupport));
      } catch (e) { }
      window.dispatchEvent(new CustomEvent('juicy_query_updated', { detail: createdTicket }));

      setSnackbar({
        open: true,
        message: `Query ${createdTicket.ticketNumber} submitted! Tracking status below.`,
        severity: 'success'
      });

      // Reset description and screenshots (keep name & phone)
      setIssueDescription('');
      setScreenshots([]);

      // Scroll smoothly to track line status section below (NO navigation to help&query page!)
      setTimeout(() => {
        trackerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (err) {
      console.error('Error submitting query:', err);
      setSnackbar({
        open: true,
        message: 'Failed to submit query. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Currently selected ticket
  const selectedTicket = myTickets.find(
    t => (t.id || t._id || t.ticketNumber) === selectedTicketId
  ) || myTickets[0] || null;

  // Track Line Stepper helper
  const getStepStatus = (stepName) => {
    const current = selectedTicket?.status || 'Pending';
    if (stepName === 'Submitted') {
      return 'completed';
    }
    if (stepName === 'Under Review') {
      if (current === 'Resolved') return 'completed';
      if (current === 'Under Review') return 'active';
      return 'pending';
    }
    if (stepName === 'Resolved') {
      if (current === 'Resolved') return 'completed';
      return 'pending';
    }
    return 'pending';
  };

  // Status Chip Config
  const getStatusChipConfig = (status) => {
    switch (status) {
      case 'Resolved':
        return {
          label: 'Resolved',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.35)',
          icon: <TaskAltIcon sx={{ fontSize: 16, color: '#10b981' }} />
        };
      case 'Under Review':
        return {
          label: 'Under Review',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.12)',
          border: 'rgba(59, 130, 246, 0.35)',
          icon: <HourglassEmptyIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
        };
      case 'Pending':
      default:
        return {
          label: 'Pending',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.35)',
          icon: <ScheduleIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
        };
    }
  };

  const statusConfig = selectedTicket ? getStatusChipConfig(selectedTicket.status) : null;

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: 'var(--background-color, #fff6f8)',
        color: 'var(--text-color, #000000)',
        fontFamily: 'var(--app-font, "Poppins", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Bar */}
      <Paper
        elevation={0}
        sx={{
          py: 1.5,
          px: 2,
          bgcolor: 'var(--surface-color, #ffffff)',
          color: 'var(--text-color, #000000)',
          borderBottom: '1px solid rgba(128,128,128,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          zIndex: 10,
          flexShrink: 0
        }}
      >
        <Tooltip title="Back">
          <IconButton onClick={handleBack} sx={{ color: 'var(--primary-color, #f06292)' }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpOutlineIcon sx={{ color: 'var(--primary-color, #f06292)' }} />
          <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1.15rem', color: 'var(--text-color, inherit)' }}>
            Help & Support
          </Typography>
        </Box>
        {myTickets.length > 0 && (
          <Tooltip title="Jump to status tracker below">
            <Button
              size="small"
              startIcon={<ScheduleIcon sx={{ fontSize: 16 }} />}
              onClick={() => trackerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              sx={{
                ml: 'auto',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: 'var(--primary-color, #f06292)',
                bgcolor: 'rgba(240, 98, 146, 0.08)',
                border: '1px solid rgba(240, 98, 146, 0.25)',
                '&:hover': { bgcolor: 'rgba(240, 98, 146, 0.16)' }
              }}
            >
              Track Status ({myTickets.length})
            </Button>
          </Tooltip>
        )}
      </Paper>

      {/* Scrollable Content Area */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          p: { xs: 2, sm: 3.5 },
          pb: { xs: 14, sm: 8 },
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            maxWidth: 640,
            width: '100%',
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          {/* Intro Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'var(--surface-color, #ffffff)',
              color: 'var(--text-color, #000000)',
              border: '1px solid rgba(240, 98, 146, 0.25)',
              background: 'linear-gradient(135deg, rgba(240, 98, 146, 0.12) 0%, var(--surface-color, #ffffff) 100%)'
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" color="var(--primary-color, #f06292)" gutterBottom>
              How can we help you?
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'var(--text-color, #000000)', opacity: 0.85 }}>
              Encountering an issue or have a query? Submit your details below. You can track the live progress and support resolution status directly on this page below.
            </Typography>
          </Paper>

          {/* Form Card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              bgcolor: 'var(--surface-color, #ffffff)',
              color: 'var(--text-color, #000000)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              border: '1px solid rgba(128,128,128,0.12)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            {/* Name Field */}
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ mb: 0.8, color: 'var(--text-color, inherit)' }}>
                Your Name *
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                error={!!errors.name}
                helperText={errors.name}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'rgba(128,128,128,0.06)',
                    color: 'var(--text-color, inherit)',
                    '& fieldset': { borderColor: 'rgba(128,128,128,0.25)' },
                    '&:hover fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                    '& input': { color: 'var(--text-color, inherit)' },
                    '& input::placeholder': { color: 'var(--text-color, inherit)', opacity: 0.55 }
                  }
                }}
              />
            </Box>

            {/* Mobile Number Field */}
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ mb: 0.8, color: 'var(--text-color, inherit)' }}>
                Mobile Number *
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                type="tel"
                placeholder="Enter your phone number (e.g., 9486042369)"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value);
                  if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: null }));
                }}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'rgba(128,128,128,0.06)',
                    color: 'var(--text-color, inherit)',
                    '& fieldset': { borderColor: 'rgba(128,128,128,0.25)' },
                    '&:hover fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                    '& input': { color: 'var(--text-color, inherit)' },
                    '& input::placeholder': { color: 'var(--text-color, inherit)', opacity: 0.55 }
                  }
                }}
              />
            </Box>

            {/* Category Field */}
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ mb: 0.8, color: 'var(--text-color, inherit)' }}>
                Category
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  'App Bug / Technical Issue',
                  'Audio / Video Calling',
                  'Chat & Messaging',
                  'Account & Profile',
                  'Feature Request',
                  'General Query'
                ].map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Chip
                      key={cat}
                      label={cat}
                      clickable
                      onClick={() => setCategory(cat)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.76rem',
                        borderRadius: 2,
                        bgcolor: isSelected ? 'var(--primary-color, #f06292)' : 'rgba(128,128,128,0.08)',
                        color: isSelected ? '#ffffff' : 'var(--text-color, inherit)',
                        border: isSelected ? 'none' : '1px solid rgba(128,128,128,0.2)',
                        '&:hover': {
                          bgcolor: isSelected ? 'var(--primary-color, #f06292)' : 'rgba(128,128,128,0.15)'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Description Field */}
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ mb: 0.8, color: 'var(--text-color, inherit)' }}>
                Description about Issue *
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                variant="outlined"
                placeholder="Explain the problem or error you encountered in detail..."
                value={issueDescription}
                onChange={(e) => {
                  setIssueDescription(e.target.value);
                  if (errors.issueDescription) setErrors(prev => ({ ...prev, issueDescription: null }));
                }}
                error={!!errors.issueDescription}
                helperText={errors.issueDescription}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'rgba(128,128,128,0.06)',
                    color: 'var(--text-color, inherit)',
                    '& fieldset': { borderColor: 'rgba(128,128,128,0.25)' },
                    '&:hover fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                    '& textarea': { color: 'var(--text-color, inherit)' },
                    '& textarea::placeholder': { color: 'var(--text-color, inherit)', opacity: 0.55 }
                  }
                }}
              />
            </Box>

            {/* Screenshot Attachments */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="600" sx={{ color: 'var(--text-color, inherit)' }}>
                  Screenshots (Optional)
                </Typography>
                <Chip
                  label={`${screenshots.length}/${MAX_SCREENSHOTS_COUNT} Attached`}
                  size="small"
                  color={screenshots.length > 0 ? 'primary' : 'default'}
                  sx={{
                    height: 22,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    ...(screenshots.length === 0 && {
                      bgcolor: 'rgba(128,128,128,0.15)',
                      color: 'var(--text-color, inherit)'
                    })
                  }}
                />
              </Box>

              {/* Requirement Hint */}
              <Typography variant="caption" sx={{ display: 'block', mb: 1.2, color: 'var(--text-color, inherit)', opacity: 0.65 }}>
                Max {MAX_IMAGE_SIZE_MB}MB per image • Up to {MAX_SCREENSHOTS_COUNT} images (JPG, PNG, WebP)
              </Typography>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                onChange={handleFileSelect}
              />

              <Button
                variant="outlined"
                fullWidth
                disabled={screenshots.length >= MAX_SCREENSHOTS_COUNT}
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  textTransform: 'none',
                  borderColor: 'var(--primary-color, #f06292)',
                  color: 'var(--primary-color, #f06292)',
                  fontWeight: 600,
                  borderStyle: 'dashed',
                  bgcolor: 'rgba(128,128,128,0.04)',
                  '&:hover': {
                    borderColor: 'var(--primary-color, #f06292)',
                    bgcolor: 'rgba(240, 98, 146, 0.08)'
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(128,128,128,0.2)',
                    color: 'rgba(128,128,128,0.5)'
                  }
                }}
              >
                {screenshots.length >= MAX_SCREENSHOTS_COUNT
                  ? `Maximum ${MAX_SCREENSHOTS_COUNT} Images Reached`
                  : 'Add Screenshot Image(s)'}
              </Button>

              {screenshots.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: 1.5,
                    mt: 2,
                    maxHeight: 220,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    p: 0.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(128,128,128,0.08)'
                  }}
                >
                  {screenshots.map((item) => (
                    <Card
                      key={item.id}
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="80"
                        image={item.previewUrl}
                        alt="Screenshot"
                        sx={{ objectFit: 'cover' }}
                      />
                      {item.sizeFormatted && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            left: 2,
                            bgcolor: 'rgba(0, 0, 0, 0.65)',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            px: 0.6,
                            py: 0.2,
                            borderRadius: 1
                          }}
                        >
                          {item.sizeFormatted}
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveScreenshot(item.id)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          color: '#ffffff',
                          p: 0.4,
                          '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.9)' }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            {/* Submit Query Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 20 }} />}
              onClick={handleSubmitQuery}
              disabled={isSubmitting}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 2.5,
                bgcolor: 'var(--primary-color, #f06292)',
                backgroundImage: 'var(--primary-gradient, linear-gradient(135deg, #f06292 0%, #e91e63 100%))',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 16px rgba(240, 98, 146, 0.35)',
                '&:hover': {
                  bgcolor: 'var(--primary-color, #f06292)',
                  boxShadow: '0 6px 20px rgba(240, 98, 146, 0.45)'
                }
              }}
            >
              {isSubmitting ? 'Submitting Query...' : 'Submit Query'}
            </Button>
          </Paper>

          {/* ================= TRACK LINE STATUS SECTION ================= */}
          <Box ref={trackerSectionRef} sx={{ scrollMarginTop: '16px' }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                bgcolor: 'var(--surface-color, #ffffff)',
                color: 'var(--text-color, #000000)',
                border: '1px solid rgba(128,128,128,0.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
              }}
            >
              {/* Tracker Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ color: 'var(--primary-color, #f06292)', fontSize: 22 }} />
                  <Typography variant="subtitle1" fontWeight="700" sx={{ color: 'var(--text-color, inherit)' }}>
                    Track Query Status
                  </Typography>
                </Box>
                {selectedTicket && (
                  <Tooltip title="Refresh status from server">
                    <IconButton
                      size="small"
                      onClick={handleRefreshStatus}
                      disabled={isRefreshingStatus}
                      sx={{ color: 'var(--primary-color, #f06292)' }}
                    >
                      <RefreshIcon
                        sx={{
                          fontSize: 20,
                          animation: isRefreshingStatus ? 'spin 1s linear infinite' : 'none',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Multiple Tickets Selector Tabs */}
              {myTickets.length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    pb: 1.5,
                    mb: 2,
                    '::-webkit-scrollbar': { height: 4 },
                    '::-webkit-scrollbar-thumb': { bgcolor: 'rgba(128,128,128,0.2)', borderRadius: 2 }
                  }}
                >
                  {myTickets.map((t) => {
                    const isSelected = (t.id || t._id || t.ticketNumber) === (selectedTicket?.id || selectedTicket?._id || selectedTicket?.ticketNumber);
                    const cfg = getStatusChipConfig(t.status);
                    return (
                      <Chip
                        key={t.ticketNumber || t.id}
                        label={`${t.ticketNumber} (${t.status || 'Pending'})`}
                        onClick={() => setSelectedTicketId(t.id || t._id || t.ticketNumber)}
                        clickable
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          borderRadius: 2,
                          bgcolor: isSelected ? 'var(--primary-color, #f06292)' : 'rgba(128,128,128,0.08)',
                          color: isSelected ? '#ffffff' : 'var(--text-color, inherit)',
                          border: isSelected ? 'none' : `1px solid ${cfg.border}`,
                          '&:hover': {
                            bgcolor: isSelected ? 'var(--primary-color, #f06292)' : 'rgba(128,128,128,0.15)'
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              {/* Selected Ticket Tracker Card */}
              {selectedTicket ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Ticket Summary Row */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(128,128,128,0.05)',
                      border: '1px solid rgba(128,128,128,0.12)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography variant="subtitle2" fontWeight="700" sx={{ color: 'var(--text-color, inherit)', fontSize: '0.95rem' }}>
                          {selectedTicket.ticketNumber}
                        </Typography>
                        <Tooltip title={copiedTicket ? 'Copied!' : 'Copy ticket number'}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyTicket(selectedTicket.ticketNumber)}
                            sx={{ p: 0.3, color: 'var(--primary-color, #f06292)' }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'var(--text-color, inherit)', opacity: 0.65 }}>
                        Submitted {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={selectedTicket.category || 'General'}
                        size="small"
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          bgcolor: 'rgba(128,128,128,0.08)',
                          color: 'var(--text-color, inherit)'
                        }}
                      />
                      <Chip
                        icon={statusConfig?.icon}
                        label={statusConfig?.label}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor: statusConfig?.bg,
                          color: statusConfig?.color,
                          border: `1px solid ${statusConfig?.border}`
                        }}
                      />
                    </Box>
                  </Box>

                  {/* ================= VISUAL TRACK LINE (STEPPER) ================= */}
                  <Box sx={{ px: { xs: 1, sm: 2 }, py: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative'
                      }}
                    >
                      {/* Milestone 1: Submitted */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#10b981',
                            color: '#ffffff',
                            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 22 }} />
                        </Box>
                        <Typography variant="caption" fontWeight="700" sx={{ mt: 1, color: 'var(--text-color, inherit)', textAlign: 'center' }}>
                          Submitted
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'var(--text-color, inherit)', opacity: 0.6, textAlign: 'center' }}>
                          Received
                        </Typography>
                      </Box>

                      {/* Connecting Line 1 */}
                      <Box
                        sx={{
                          height: 3,
                          flex: 1.2,
                          bgcolor: getStepStatus('Under Review') !== 'pending' ? '#10b981' : 'rgba(128,128,128,0.25)',
                          borderRadius: 2,
                          transition: 'all 0.4s ease',
                          mt: -3.5
                        }}
                      />

                      {/* Milestone 2: Under Review */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, minWidth: 0 }}>
                        {(() => {
                          const state = getStepStatus('Under Review');
                          const isDone = state === 'completed';
                          const isActive = state === 'active';

                          return (
                            <Box
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isDone ? '#10b981' : isActive ? '#3b82f6' : 'rgba(128,128,128,0.18)',
                                color: isDone || isActive ? '#ffffff' : 'rgba(128,128,128,0.5)',
                                border: isActive ? '3px solid #bfdbfe' : 'none',
                                boxShadow: isActive ? '0 0 14px rgba(59, 130, 246, 0.5)' : isDone ? '0 2px 10px rgba(16, 185, 129, 0.35)' : 'none',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {isDone ? (
                                <CheckCircleIcon sx={{ fontSize: 22 }} />
                              ) : isActive ? (
                                <HourglassEmptyIcon sx={{ fontSize: 20 }} />
                              ) : (
                                <ScheduleIcon sx={{ fontSize: 20 }} />
                              )}
                            </Box>
                          );
                        })()}
                        <Typography variant="caption" fontWeight="700" sx={{ mt: 1, color: 'var(--text-color, inherit)', textAlign: 'center' }}>
                          Under Review
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'var(--text-color, inherit)', opacity: 0.6, textAlign: 'center' }}>
                          {getStepStatus('Under Review') === 'active' ? 'Investigating' : getStepStatus('Under Review') === 'completed' ? 'Reviewed' : 'Awaiting review'}
                        </Typography>
                      </Box>

                      {/* Connecting Line 2 */}
                      <Box
                        sx={{
                          height: 3,
                          flex: 1.2,
                          bgcolor: getStepStatus('Resolved') === 'completed' ? '#10b981' : 'rgba(128,128,128,0.25)',
                          borderRadius: 2,
                          transition: 'all 0.4s ease',
                          mt: -3.5
                        }}
                      />

                      {/* Milestone 3: Resolved */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, minWidth: 0 }}>
                        {(() => {
                          const state = getStepStatus('Resolved');
                          const isDone = state === 'completed';

                          return (
                            <Box
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isDone ? '#10b981' : 'rgba(128,128,128,0.18)',
                                color: isDone ? '#ffffff' : 'rgba(128,128,128,0.5)',
                                boxShadow: isDone ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {isDone ? (
                                <TaskAltIcon sx={{ fontSize: 22 }} />
                              ) : (
                                <CheckCircleIcon sx={{ fontSize: 20 }} />
                              )}
                            </Box>
                          );
                        })()}
                        <Typography variant="caption" fontWeight="700" sx={{ mt: 1, color: 'var(--text-color, inherit)', textAlign: 'center' }}>
                          Resolved
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'var(--text-color, inherit)', opacity: 0.6, textAlign: 'center' }}>
                          {getStepStatus('Resolved') === 'completed' ? 'Closed' : 'Pending'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Latest Support Desk Response Box */}
                  {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(240, 98, 146, 0.05)',
                        border: '1px solid rgba(240, 98, 146, 0.2)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                        <SupportAgentIcon sx={{ fontSize: 18, color: 'var(--primary-color, #f06292)' }} />
                        <Typography variant="caption" fontWeight="700" color="var(--primary-color, #f06292)">
                          Latest Support Update:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'var(--text-color, inherit)', lineHeight: 1.5 }}>
                        {selectedTicket.replies[selectedTicket.replies.length - 1].message}
                      </Typography>
                    </Box>
                  )}

                  {/* Submitted Issue Details Accordion */}
                  <Box sx={{ borderTop: '1px solid rgba(128,128,128,0.12)', pt: 1.5 }}>
                    <Button
                      size="small"
                      onClick={() => setShowIssueDetails(prev => !prev)}
                      endIcon={showIssueDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        textTransform: 'none',
                        color: 'var(--primary-color, #f06292)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        p: 0,
                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                      }}
                    >
                      {showIssueDetails ? 'Hide My Submitted Details' : 'View My Submitted Details'}
                    </Button>

                    {showIssueDetails && (
                      <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: 'rgba(128,128,128,0.04)' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.86rem', color: 'var(--text-color, inherit)', whiteSpace: 'pre-wrap' }}>
                          {selectedTicket.issueDescription}
                        </Typography>

                        {selectedTicket.screenshots && selectedTicket.screenshots.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                            {selectedTicket.screenshots.map((img, idx) => (
                              <Card
                                key={idx}
                                onClick={() => setPreviewImage(img.dataUrl || img.previewUrl)}
                                sx={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  border: '1px solid rgba(128,128,128,0.2)',
                                  '&:hover': { opacity: 0.85 }
                                }}
                              >
                                <CardMedia
                                  component="img"
                                  image={img.dataUrl || img.previewUrl}
                                  alt="Attachment"
                                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </Card>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                /* No Submitted Tickets Yet State */
                <Box
                  sx={{
                    py: 3.5,
                    px: 2,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 36, color: 'rgba(128,128,128,0.35)' }} />
                  <Typography variant="body2" fontWeight="600" sx={{ color: 'var(--text-color, inherit)', opacity: 0.75 }}>
                    No queries submitted yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-color, inherit)', opacity: 0.55, maxWidth: 360 }}>
                    Submit a query using the form above to track its live resolution pipeline and updates here.
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2.5, borderColor: 'rgba(128,128,128,0.12)' }} />

              {/* Manual Ticket Lookup Bar */}
              <Box>
                <Typography variant="caption" fontWeight="600" sx={{ mb: 1, display: 'block', color: 'var(--text-color, inherit)', opacity: 0.7 }}>
                  Track an existing ticket by number
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter Ticket # (e.g. #JQ-123456)"
                    value={searchTicketNumber}
                    onChange={(e) => setSearchTicketNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchTicket();
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'rgba(128,128,128,0.05)',
                        color: 'var(--text-color, inherit)',
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: 'rgba(128,128,128,0.2)' },
                        '&:hover fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--primary-color, #f06292)' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSearchTicket}
                    disabled={isSearchingTicket || !searchTicketNumber.trim()}
                    sx={{
                      px: 2.5,
                      borderRadius: 2,
                      bgcolor: 'var(--primary-color, #f06292)',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: 'var(--primary-color, #f06292)' }
                    }}
                  >
                    {isSearchingTicket ? <CircularProgress size={18} color="inherit" /> : 'Track'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="600">Screenshot Preview</Typography>
          <IconButton size="small" onClick={() => setPreviewImage(null)}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              alt="Screenshot Preview"
              sx={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 2, objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily: 'var(--app-font, "Poppins")', fontWeight: 500, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Help;
