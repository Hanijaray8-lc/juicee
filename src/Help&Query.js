import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  TextField,
  Chip,
  Card,
  CardMedia,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import API_BASE_URL from './config/apiConfig';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'juicy_support_queries';

const HelpQuery = ({ onBack }) => {
  const navigate = useNavigate();

  // State
  const [queries, setQueries] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const myTickets = localStorage.getItem('juicy_my_tickets');
      const map = new Map();
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) parsed.forEach(q => map.set(q.id || q._id || q.ticketNumber, q));
      }
      if (myTickets) {
        const parsedMy = JSON.parse(myTickets);
        if (Array.isArray(parsedMy)) parsedMy.forEach(q => map.set(q.id || q._id || q.ticketNumber, q));
      }
      return Array.from(map.values());
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Pending, Under Review, Resolved
  const [activeImageModal, setActiveImageModal] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, queryId: null });
  const [expandedReplyId, setExpandedReplyId] = useState(null);
  const [replyInputText, setReplyInputText] = useState({});
  const [statusMenuAnchor, setStatusMenuAnchor] = useState({ anchorEl: null, queryId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load queries from backend (with localStorage cache fallback)
  const loadQueries = async () => {
    setIsLoading(true);
    // 1. Instant display from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const myTickets = localStorage.getItem('juicy_my_tickets');
      const map = new Map();
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) parsed.forEach(q => map.set(q.id || q._id || q.ticketNumber, q));
      }
      if (myTickets) {
        const parsedMy = JSON.parse(myTickets);
        if (Array.isArray(parsedMy)) parsedMy.forEach(q => map.set(q.id || q._id || q.ticketNumber, q));
      }
      if (map.size > 0) {
        setQueries(Array.from(map.values()));
      }
    } catch (err) {
      console.warn('Error reading local support queries:', err);
    }

    // 2. Fetch fresh data from backend
    const endpoints = [
      `${API_BASE_URL}/api/help/queries`,
      'https://juicyapp.in/api/help/queries'
    ].filter((v, i, a) => a.indexOf(v) === i);

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.queries)) {
            const formatted = data.queries.map(q => ({
              ...q,
              id: q._id || q.id || q.ticketNumber
            }));
            setQueries(formatted);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
            } catch (quotaErr) {
              try {
                const light = formatted.map(q => ({
                  ...q,
                  screenshots: (q.screenshots || []).map(s => ({ name: s.name }))
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(light));
              } catch (e) { }
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fall through to next endpoint or keep local cache
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadQueries();

    // Listen for storage events (e.g. from other tabs or Help.js submissions)
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY || e.key === 'juicy_my_tickets') {
        loadQueries();
      }
    };

    const handleCustomUpdate = () => {
      loadQueries();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('juicy_query_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('juicy_query_updated', handleCustomUpdate);
    };
  }, []);

  // Save queries to localStorage
  const persistQueries = (updatedList) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      setQueries(updatedList);
      window.dispatchEvent(new CustomEvent('juicy_query_updated'));
    } catch (err) {
      console.error('Error saving queries:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update query list in local storage.',
        severity: 'error'
      });
    }
  };

  // Back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/help');
    }
  };


  // Copy Ticket ID
  const handleCopyTicketId = (ticketNumber, e) => {
    e.stopPropagation();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(ticketNumber);
      setSnackbar({
        open: true,
        message: `Ticket ID ${ticketNumber} copied to clipboard!`,
        severity: 'success'
      });
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = ticketNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSnackbar({
        open: true,
        message: `Ticket ID ${ticketNumber} copied!`,
        severity: 'success'
      });
    }
  };

  // Status management
  const handleOpenStatusMenu = (e, queryId) => {
    e.stopPropagation();
    setStatusMenuAnchor({ anchorEl: e.currentTarget, queryId });
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor({ anchorEl: null, queryId: null });
  };

  const handleChangeStatus = async (newStatus) => {
    const { queryId } = statusMenuAnchor;
    if (!queryId) return;

    // 1. Optimistically update local state & cache
    const updated = queries.map((q) => {
      if ((q._id || q.id) === queryId) {
        const replies = q.replies || [];
        const statusReply = {
          id: `status_${Date.now()}`,
          sender: 'system',
          senderName: 'Juicy Support Desk',
          message: `Ticket status updated to: ${newStatus}`,
          timestamp: new Date().toISOString()
        };
        return {
          ...q,
          status: newStatus,
          replies: [...replies, statusReply]
        };
      }
      return q;
    });

    persistQueries(updated);
    handleCloseStatusMenu();
    setSnackbar({
      open: true,
      message: `Status changed to "${newStatus}"`,
      severity: 'info'
    });

    // 2. Sync to backend API
    const endpoints = [
      `https://juicyapp.in/api/help/queries/${queryId}/status`,
      `${API_BASE_URL}/api/help/queries/${queryId}/status`
    ];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) break;
      } catch (e) { }
    }
  };

  // Quick Resolve / Re-open Toggle
  const handleToggleResolved = async (queryId, currentStatus, e) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'Resolved' ? 'Pending' : 'Resolved';

    // 1. Optimistic local update
    const updated = queries.map((q) => {
      if ((q._id || q.id) === queryId) {
        const replies = q.replies || [];
        const statusReply = {
          id: `status_${Date.now()}`,
          sender: 'system',
          senderName: 'Juicy Support Desk',
          message: nextStatus === 'Resolved' ? 'Ticket marked as Resolved.' : 'Ticket re-opened.',
          timestamp: new Date().toISOString()
        };
        return {
          ...q,
          status: nextStatus,
          replies: [...replies, statusReply]
        };
      }
      return q;
    });

    persistQueries(updated);
    setSnackbar({
      open: true,
      message: nextStatus === 'Resolved' ? 'Ticket marked as resolved!' : 'Ticket re-opened!',
      severity: 'success'
    });

    // 2. Sync to backend API
    const endpoints = [
      `https://juicyapp.in/api/help/queries/${queryId}/status`,
      `${API_BASE_URL}/api/help/queries/${queryId}/status`
    ];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) break;
      } catch (e) { }
    }
  };

  // Delete ticket
  const handleDeleteQuery = async (queryId) => {
    // 1. Optimistic local delete
    const updated = queries.filter((q) => (q._id || q.id) !== queryId);
    persistQueries(updated);
    setDeleteConfirmDialog({ open: false, queryId: null });
    setSnackbar({
      open: true,
      message: 'Ticket deleted successfully.',
      severity: 'info'
    });

    // 2. Sync delete to backend API
    const endpoints = [
      `https://juicyapp.in/api/help/queries/${queryId}`,
      `${API_BASE_URL}/api/help/queries/${queryId}`
    ];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { method: 'DELETE' });
        if (res.ok) break;
      } catch (e) { }
    }
  };

  // Add follow-up message / reply
  const handleSendReply = async (queryId) => {
    const text = replyInputText[queryId];
    if (!text || !text.trim()) return;

    const currentUserName = localStorage.getItem('username') || 'You';

    const newReply = {
      id: `rep_${Date.now()}`,
      sender: 'user',
      senderName: currentUserName,
      message: text.trim(),
      timestamp: new Date().toISOString()
    };

    // 1. Optimistic update
    const updated = queries.map((q) => {
      if ((q._id || q.id) === queryId) {
        return {
          ...q,
          replies: [...(q.replies || []), newReply]
        };
      }
      return q;
    });

    persistQueries(updated);
    setReplyInputText((prev) => ({ ...prev, [queryId]: '' }));
    setSnackbar({
      open: true,
      message: 'Follow-up reply added to ticket thread.',
      severity: 'success'
    });

    // 2. Sync reply to backend API
    const endpoints = [
      `https://juicyapp.in/api/help/queries/${queryId}/reply`,
      `${API_BASE_URL}/api/help/queries/${queryId}/reply`
    ];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            senderName: currentUserName,
            sender: 'user'
          })
        });
        if (res.ok) break;
      } catch (e) { }
    }
  };

  // Filtered and searched queries
  const filteredQueries = useMemo(() => {
    return queries.filter((item) => {
      // Status match
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchId = (item.ticketNumber || item.id || '').toLowerCase().includes(q);
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchPhone = (item.mobileNumber || '').toLowerCase().includes(q);
      const matchDesc = (item.issueDescription || item.description || '').toLowerCase().includes(q);
      const matchCategory = (item.category || '').toLowerCase().includes(q);

      return matchId || matchName || matchPhone || matchDesc || matchCategory;
    });
  }, [queries, statusFilter, searchQuery]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = queries.length;
    const pending = queries.filter((q) => q.status === 'Pending').length;
    const underReview = queries.filter((q) => q.status === 'Under Review').length;
    const resolved = queries.filter((q) => q.status === 'Resolved').length;
    return { total, pending, underReview, resolved };
  }, [queries]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Get status badge styling
  const getStatusColorConfig = (status) => {
    switch (status) {
      case 'Resolved':
        return {
          bg: 'rgba(46, 125, 50, 0.12)',
          color: '#2e7d32',
          border: 'rgba(46, 125, 50, 0.3)',
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
        };
      case 'Under Review':
        return {
          bg: 'rgba(2, 136, 209, 0.12)',
          color: '#0288d1',
          border: 'rgba(2, 136, 209, 0.3)',
          icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} />
        };
      case 'Pending':
      default:
        return {
          bg: 'rgba(237, 108, 2, 0.12)',
          color: '#ed6c02',
          border: 'rgba(237, 108, 2, 0.3)',
          icon: <ScheduleIcon sx={{ fontSize: 16 }} />
        };
    }
  };

  return (
    <Box
      sx={{
        height: '100dvh',
        width: '100%',
        bgcolor: 'var(--background-color, #fff7f9)',
        color: 'var(--text-color, #1e293b)',
        fontFamily: 'var(--app-font, "Poppins", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* ─── HEADER BAR ─────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          py: 1.5,
          px: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface-color, #ffffff)',
          color: 'var(--text-color, inherit)',
          borderBottom: '1px solid rgba(128,128,128,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Back to App / Help">
            <IconButton
              onClick={handleBack}
              sx={{
                color: 'var(--primary-color, #f06292)',
                bgcolor: 'rgba(240, 98, 146, 0.08)',
                '&:hover': { bgcolor: 'rgba(240, 98, 146, 0.16)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SupportAgentIcon sx={{ color: 'var(--primary-color, #f06292)', fontSize: 28 }} />
              <Typography
                variant="h6"
                fontWeight="700"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  letterSpacing: '-0.3px',
                  color: 'var(--text-color, inherit)'
                }}
              >
                Help & Query Desk
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: 'var(--text-color, inherit)',
                opacity: 0.7,
                display: 'block',
                mt: -0.3
              }}
            >
              Track and manage all submitted support tickets
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh queries">
            <IconButton
              size="small"
              onClick={loadQueries}
              sx={{
                color: 'var(--text-color, inherit)',
                opacity: 0.7,
                '&:hover': { opacity: 1, bgcolor: 'rgba(128,128,128,0.1)' }
              }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>


        </Box>
      </Paper>

      {/* ─── SCROLLABLE CONTENT BODY ───────────────────────── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          p: { xs: 2, sm: 3 },
          boxSizing: 'border-box'
        }}
      >
        <Box sx={{ maxWidth: 840, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* ── STATS CARDS ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 1.5
            }}
          >
            {/* Total */}
            <Paper
              elevation={0}
              onClick={() => setStatusFilter('ALL')}
              sx={{
                p: 2,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: 'var(--surface-color, #ffffff)',
                border: statusFilter === 'ALL'
                  ? '2px solid var(--primary-color, #f06292)'
                  : '1px solid rgba(128,128,128,0.15)',
                transition: 'all 0.2s ease',
                boxShadow: statusFilter === 'ALL' ? '0 4px 16px rgba(240, 98, 146, 0.18)' : 'none',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Typography variant="caption" sx={{ color: 'var(--text-color, inherit)', opacity: 0.7, fontWeight: 600 }}>
                Total Reports
              </Typography>
              <Typography variant="h5" fontWeight="800" sx={{ mt: 0.5, color: 'var(--primary-color, #f06292)' }}>
                {stats.total}
              </Typography>
            </Paper>

            {/* Pending */}
            <Paper
              elevation={0}
              onClick={() => setStatusFilter('Pending')}
              sx={{
                p: 2,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: 'var(--surface-color, #ffffff)',
                border: statusFilter === 'Pending'
                  ? '2px solid #ed6c02'
                  : '1px solid rgba(128,128,128,0.15)',
                transition: 'all 0.2s ease',
                boxShadow: statusFilter === 'Pending' ? '0 4px 16px rgba(237, 108, 2, 0.18)' : 'none',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#ed6c02', fontWeight: 600 }}>
                  Pending
                </Typography>
                <ScheduleIcon sx={{ fontSize: 16, color: '#ed6c02' }} />
              </Box>
              <Typography variant="h5" fontWeight="800" sx={{ mt: 0.5, color: '#ed6c02' }}>
                {stats.pending}
              </Typography>
            </Paper>

            {/* Under Review */}
            <Paper
              elevation={0}
              onClick={() => setStatusFilter('Under Review')}
              sx={{
                p: 2,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: 'var(--surface-color, #ffffff)',
                border: statusFilter === 'Under Review'
                  ? '2px solid #0288d1'
                  : '1px solid rgba(128,128,128,0.15)',
                transition: 'all 0.2s ease',
                boxShadow: statusFilter === 'Under Review' ? '0 4px 16px rgba(2, 136, 209, 0.18)' : 'none',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#0288d1', fontWeight: 600 }}>
                  In Review
                </Typography>
                <HourglassEmptyIcon sx={{ fontSize: 16, color: '#0288d1' }} />
              </Box>
              <Typography variant="h5" fontWeight="800" sx={{ mt: 0.5, color: '#0288d1' }}>
                {stats.underReview}
              </Typography>
            </Paper>

            {/* Resolved */}
            <Paper
              elevation={0}
              onClick={() => setStatusFilter('Resolved')}
              sx={{
                p: 2,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: 'var(--surface-color, #ffffff)',
                border: statusFilter === 'Resolved'
                  ? '2px solid #2e7d32'
                  : '1px solid rgba(128,128,128,0.15)',
                transition: 'all 0.2s ease',
                boxShadow: statusFilter === 'Resolved' ? '0 4px 16px rgba(46, 125, 50, 0.18)' : 'none',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                  Resolved
                </Typography>
                <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
              </Box>
              <Typography variant="h5" fontWeight="800" sx={{ mt: 0.5, color: '#2e7d32' }}>
                {stats.resolved}
              </Typography>
            </Paper>
          </Box>

          {/* ── SEARCH & FILTER CONTROLS ── */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: 'var(--surface-color, #ffffff)',
              border: '1px solid rgba(128,128,128,0.15)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between'
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search by Ticket ID, keyword, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--text-color, inherit)', opacity: 0.5 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(128,128,128,0.06)',
                  color: 'var(--text-color, inherit)',
                  '& fieldset': { borderColor: 'rgba(128,128,128,0.2)' },
                  '&:hover fieldset': { borderColor: 'var(--primary-color, #f06292)' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--primary-color, #f06292)' }
                }
              }}
            />

            {/* Status Filter Chips */}
            <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', py: 0.5 }}>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'Pending', label: 'Pending' },
                { key: 'Under Review', label: 'Review' },
                { key: 'Resolved', label: 'Resolved' }
              ].map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <Chip
                    key={tab.key}
                    label={tab.label}
                    size="small"
                    clickable
                    onClick={() => setStatusFilter(tab.key)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      borderRadius: 2,
                      bgcolor: isActive ? 'var(--primary-color, #f06292)' : 'rgba(128,128,128,0.08)',
                      color: isActive ? '#ffffff' : 'var(--text-color, inherit)',
                      border: isActive ? 'none' : '1px solid rgba(128,128,128,0.15)',
                      '&:hover': {
                        bgcolor: isActive ? 'var(--primary-color, #f06292)' : 'rgba(128,128,128,0.16)'
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Paper>

          {/* ── TICKETS LIST ── */}
          {/* Query Cards or Empty State / Loading */}
          {isLoading && queries.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 6 },
                borderRadius: 4,
                bgcolor: 'var(--surface-color, #ffffff)',
                border: '1px solid rgba(128,128,128,0.15)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
              }}
            >
              <CircularProgress size={36} sx={{ color: 'var(--primary-color, #f06292)' }} />
              <Typography variant="body2" sx={{ color: 'var(--text-color, inherit)', opacity: 0.7 }}>
                Loading support queries...
              </Typography>
            </Paper>
          ) : filteredQueries.length === 0 ? (
            /* Empty State */
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 6 },
                borderRadius: 4,
                bgcolor: 'var(--surface-color, #ffffff)',
                border: '1px solid rgba(128,128,128,0.15)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
              }}
            >
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  bgcolor: 'rgba(240, 98, 146, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-color, #f06292)'
                }}
              >
                <SupportAgentIcon sx={{ fontSize: 36 }} />
              </Box>

              <Box>
                <Typography variant="h6" fontWeight="700" sx={{ color: 'var(--text-color, inherit)' }}>
                  {queries.length === 0 ? 'No Queries Submitted Yet' : 'No Matching Tickets Found'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--text-color, inherit)', opacity: 0.7, maxWidth: 440, mt: 0.5 }}
                >
                  {queries.length === 0
                    ? 'Whenever you encounter an issue or have a query, submit a report via the Help page. All your tickets and resolution progress will appear here.'
                    : 'Try clearing your search keyword or changing the status filter above.'}
                </Typography>
              </Box>

              {queries.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: 'var(--primary-color, #f06292)',
                    color: 'var(--primary-color, #f06292)'
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Paper>
          ) : (
            filteredQueries.map((ticket) => {
              const statusCfg = getStatusColorConfig(ticket.status);
              const isRepliesOpen = expandedReplyId === ticket.id;
              const replies = ticket.replies || [];
              const replyCount = replies.length;
              const screenshots = ticket.screenshots || [];

              return (
                <Paper
                  key={ticket.id}
                  elevation={0}
                  sx={{
                    p: { xs: 2.2, sm: 3 },
                    borderRadius: 3.5,
                    bgcolor: 'var(--surface-color, #ffffff)',
                    border: '1px solid rgba(128,128,128,0.15)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                      borderColor: 'rgba(240, 98, 146, 0.35)'
                    }
                  }}
                >
                  {/* Ticket Header Row */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mb: 1.5
                    }}
                  >
                    {/* Ticket ID & Time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={ticket.ticketNumber || ticket.id}
                        size="small"
                        icon={<ContentCopyIcon sx={{ fontSize: 13, cursor: 'pointer' }} />}
                        onClick={(e) => handleCopyTicketId(ticket.ticketNumber || ticket.id, e)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          bgcolor: 'rgba(240, 98, 146, 0.1)',
                          color: 'var(--primary-color, #f06292)',
                          borderRadius: 1.5,
                          cursor: 'pointer'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'var(--text-color, inherit)', opacity: 0.6 }}>
                        {formatDate(ticket.createdAt)}
                      </Typography>
                    </Box>

                    {/* Status Badge & Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Status Chip with Click to Change Menu */}
                      <Chip
                        icon={statusCfg.icon}
                        label={ticket.status || 'Pending'}
                        size="small"
                        onClick={(e) => handleOpenStatusMenu(e, ticket.id)}
                        sx={{
                          bgcolor: statusCfg.bg,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.border}`,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          '& .MuiChip-icon': { color: 'inherit' }
                        }}
                      />

                      {/* Delete Ticket */}
                      <Tooltip title="Delete ticket">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirmDialog({ open: true, queryId: ticket.id })}
                          sx={{
                            color: 'rgba(128,128,128,0.5)',
                            '&:hover': { color: '#d32f2f', bgcolor: 'rgba(211, 47, 47, 0.08)' }
                          }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Reporter Meta & Category */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      py: 1,
                      px: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(128,128,128,0.05)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <PersonOutlineIcon sx={{ fontSize: 16, color: 'var(--primary-color, #f06292)' }} />
                      <Typography variant="caption" fontWeight="600" sx={{ color: 'var(--text-color, inherit)' }}>
                        {ticket.name || 'Anonymous User'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <PhoneIphoneIcon sx={{ fontSize: 16, color: 'var(--primary-color, #f06292)' }} />
                      <Typography variant="caption" sx={{ color: 'var(--text-color, inherit)', opacity: 0.85 }}>
                        {ticket.mobileNumber || 'N/A'}
                      </Typography>
                    </Box>

                    {ticket.category && (
                      <Chip
                        label={ticket.category}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: 'rgba(128,128,128,0.12)',
                          color: 'var(--text-color, inherit)'
                        }}
                      />
                    )}
                  </Box>

                  {/* Issue Description */}
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: '0.94rem',
                      lineHeight: 1.65,
                      color: 'var(--text-color, inherit)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      mb: screenshots.length > 0 ? 2 : 1.5
                    }}
                  >
                    {ticket.issueDescription || ticket.description}
                  </Typography>

                  {/* Screenshots Gallery */}
                  {screenshots.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        fontWeight="600"
                        sx={{ display: 'block', mb: 0.8, color: 'var(--text-color, inherit)', opacity: 0.7 }}
                      >
                        Attached Screenshots ({screenshots.length}):
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.2,
                          overflowX: 'auto',
                          py: 0.5,
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        {screenshots.map((img, idx) => {
                          const src = img.dataUrl || img.previewUrl || img;
                          return (
                            <Card
                              key={idx}
                              onClick={() => setActiveImageModal(src)}
                              sx={{
                                width: 84,
                                height: 84,
                                flexShrink: 0,
                                borderRadius: 2,
                                cursor: 'pointer',
                                border: '1px solid rgba(128,128,128,0.2)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.04)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }
                              }}
                            >
                              <CardMedia
                                component="img"
                                image={src}
                                alt={`Screenshot ${idx + 1}`}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Card>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5, borderColor: 'rgba(128,128,128,0.12)' }} />

                  {/* Card Footer: Quick Actions & Thread Toggle */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    {/* View/Toggle Thread */}
                    <Button
                      size="small"
                      startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setExpandedReplyId(isRepliesOpen ? null : ticket.id)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        color: 'var(--primary-color, #f06292)'
                      }}
                    >
                      {isRepliesOpen
                        ? 'Hide Updates & Conversation'
                        : `Conversation & Updates (${replyCount})`}
                    </Button>

                    {/* Quick Resolve / Reopen Button */}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => handleToggleResolved(ticket.id, ticket.status, e)}
                      startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderColor: ticket.status === 'Resolved' ? '#ed6c02' : '#2e7d32',
                        color: ticket.status === 'Resolved' ? '#ed6c02' : '#2e7d32',
                        '&:hover': {
                          borderColor: ticket.status === 'Resolved' ? '#ed6c02' : '#2e7d32',
                          bgcolor: ticket.status === 'Resolved' ? 'rgba(237,108,2,0.08)' : 'rgba(46,125,50,0.08)'
                        }
                      }}
                    >
                      {ticket.status === 'Resolved' ? 'Re-open Ticket' : 'Mark as Resolved'}
                    </Button>
                  </Box>

                  {/* ── EXPANDABLE REPLIES THREAD ── */}
                  {isRepliesOpen && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(128,128,128,0.04)',
                        border: '1px solid rgba(128,128,128,0.1)'
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight="700"
                        sx={{
                          display: 'block',
                          mb: 1.5,
                          color: 'var(--text-color, inherit)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Activity & Updates Timeline
                      </Typography>

                      {replies.length === 0 ? (
                        <Typography
                          variant="caption"
                          sx={{ color: 'var(--text-color, inherit)', opacity: 0.6, fontStyle: 'italic' }}
                        >
                          No updates logged yet. Add a note or message below.
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                          {replies.map((reply) => {
                            const isSys = reply.sender === 'system';
                            return (
                              <Box
                                key={reply.id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2.5,
                                  bgcolor: isSys ? 'rgba(240, 98, 146, 0.08)' : 'var(--surface-color, #ffffff)',
                                  border: isSys
                                    ? '1px solid rgba(240, 98, 146, 0.2)'
                                    : '1px solid rgba(128,128,128,0.15)',
                                  boxShadow: isSys ? 'none' : '0 1px 4px rgba(0,0,0,0.03)'
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 0.5
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight="700"
                                    sx={{
                                      color: isSys ? 'var(--primary-color, #f06292)' : 'var(--text-color, inherit)'
                                    }}
                                  >
                                    {reply.senderName || (isSys ? 'Juicy Support Desk' : 'User')}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'var(--text-color, inherit)', opacity: 0.6, fontSize: '0.72rem' }}
                                  >
                                    {formatDate(reply.timestamp)}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.86rem',
                                    color: 'var(--text-color, inherit)',
                                    lineHeight: 1.5
                                  }}
                                >
                                  {reply.message}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}

                      {/* Reply Input Box */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Type follow-up update or message..."
                          value={replyInputText[ticket.id] || ''}
                          onChange={(e) =>
                            setReplyInputText((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply(ticket.id);
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: 'var(--surface-color, #ffffff)',
                              color: 'var(--text-color, inherit)',
                              fontSize: '0.88rem'
                            }
                          }}
                        />
                        <IconButton
                          color="primary"
                          onClick={() => handleSendReply(ticket.id)}
                          disabled={!replyInputText[ticket.id]?.trim()}
                          sx={{
                            bgcolor: 'var(--primary-color, #f06292)',
                            color: '#ffffff',
                            '&:hover': { bgcolor: 'var(--primary-color, #f06292)' },
                            '&.Mui-disabled': { bgcolor: 'rgba(128,128,128,0.15)', color: 'rgba(128,128,128,0.4)' }
                          }}
                        >
                          <SendIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </Paper>
              );
            })
          )}
        </Box>
      </Box>

      {/* ─── STATUS CHANGE MENU ───────────────────────────── */}
      <Menu
        anchorEl={statusMenuAnchor.anchorEl}
        open={Boolean(statusMenuAnchor.anchorEl)}
        onClose={handleCloseStatusMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2.5,
              mt: 1,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              bgcolor: 'var(--surface-color, #ffffff)',
              color: 'var(--text-color, inherit)'
            }
          }
        }}
      >
        <MenuItem onClick={() => handleChangeStatus('Pending')} sx={{ gap: 1, fontSize: '0.88rem' }}>
          <ScheduleIcon sx={{ fontSize: 18, color: '#ed6c02' }} />
          Mark as Pending
        </MenuItem>
        <MenuItem onClick={() => handleChangeStatus('Under Review')} sx={{ gap: 1, fontSize: '0.88rem' }}>
          <HourglassEmptyIcon sx={{ fontSize: 18, color: '#0288d1' }} />
          Mark as Under Review
        </MenuItem>
        <MenuItem onClick={() => handleChangeStatus('Resolved')} sx={{ gap: 1, fontSize: '0.88rem' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
          Mark as Resolved
        </MenuItem>
      </Menu>

      {/* ─── SCREENSHOT LIGHTBOX MODAL ────────────────────── */}
      <Dialog
        open={Boolean(activeImageModal)}
        onClose={() => setActiveImageModal(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#000000',
              borderRadius: 3,
              overflow: 'hidden',
              p: 0,
              position: 'relative'
            }
          }
        }}
      >
        <IconButton
          onClick={() => setActiveImageModal(null)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#ffffff',
            bgcolor: 'rgba(0,0,0,0.6)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {activeImageModal && (
            <img
              src={activeImageModal}
              alt="Screenshot Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION DIALOG ───────────────────── */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, queryId: null })}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              bgcolor: 'var(--surface-color, #ffffff)',
              color: 'var(--text-color, inherit)',
              p: 1
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Ticket?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Are you sure you want to permanently delete this support ticket? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmDialog({ open: false, queryId: null })}
            sx={{ textTransform: 'none', color: 'inherit' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeleteQuery(deleteConfirmDialog.queryId)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── SNACKBAR ─────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
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

export default HelpQuery;
