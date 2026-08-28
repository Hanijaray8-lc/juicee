import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Send as SendIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

// --- VOICE MESSAGE RECORDER COMPONENT ---
export const VoiceMessageRecorder = ({
  isRecording,
  setIsRecording,
  recordingPreviewUrl,
  setRecordingPreviewUrl,
  onSendAudio
}) => {
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const previewAudioRef = useRef(null);

  // Format duration helper (seconds -> mm:ss)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new window.MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setRecordingPreviewUrl(url);
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);

        setRecordingDuration(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        alert('Microphone permission denied. Please allow access in your browser settings.');
        setIsRecording(false);
      }
    } else {
      alert('Microphone recording is not supported in this browser.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleMicClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleSendClick = () => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onload = () => {
        onSendAudio(reader.result);
        handleCancelClick();
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const handleCancelClick = () => {
    if (recordingPreviewUrl) {
      try {
        URL.revokeObjectURL(recordingPreviewUrl);
      } catch (e) {
        console.warn(e);
      }
    }
    setRecordingPreviewUrl(null);
    setAudioBlob(null);
    setIsPreviewingAudio(false);
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const togglePreviewPlay = () => {
    if (previewAudioRef.current) {
      if (isPreviewingAudio) {
        previewAudioRef.current.pause();
        setIsPreviewingAudio(false);
      } else {
        previewAudioRef.current.play();
        setIsPreviewingAudio(true);
      }
    }
  };

  useEffect(() => {
    if (isRecording && !mediaRecorderRef.current) {
      startRecording();
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  if (isRecording) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'var(--surface-color, #fff)',
        borderRadius: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        px: 2,
        py: 0.75,
        mx: 1.5,
        my: 1,
        width: 'calc(100% - 24px)',
        boxSizing: 'border-box'
      }}>
        <Box sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: '#ff4d4d',
          animation: 'pulse 1s infinite',
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.4 },
            '100%': { opacity: 1 },
          }
        }} />
        <Typography variant="caption" sx={{ color: '#ff4d4d', fontWeight: 600, flex: 1 }}>
          Recording... {formatDuration(recordingDuration)}
        </Typography>
        <IconButton onClick={handleMicClick} size="small" sx={{ bgcolor: 'rgba(255, 77, 77, 0.08)', color: '#ff4d4d', p: 0.5 }}>
          <StopIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  if (recordingPreviewUrl) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'var(--surface-color, #fff)',
        borderRadius: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        px: 2,
        py: 0.75,
        mx: 1.5,
        my: 1,
        width: 'calc(100% - 24px)',
        boxSizing: 'border-box'
      }}>
        <IconButton
          size="small"
          onClick={togglePreviewPlay}
          sx={{ color: '#25d366', p: 0.5 }}
        >
          {isPreviewingAudio ? (
            <PauseIcon fontSize="small" />
          ) : (
            <PlayArrowIcon fontSize="small" />
          )}
        </IconButton>

        <Box sx={{ flex: 1, height: 20, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {[...Array(10)].map((_, i) => (
            <Box
              key={`waveform-bar-${i}`}
              sx={{
                width: 2,
                height: Math.random() * 14 + 4,
                bgcolor: '#25d366',
                borderRadius: 1,
                flex: 1
              }}
            />
          ))}
        </Box>

        <IconButton
          onClick={handleSendClick}
          sx={{
            color: 'var(--primary-color, #ff4d4d)',
            '&:hover': {
              bgcolor: 'rgba(255, 77, 77, 0.08)',
              transform: 'scale(1.05)'
            },
            p: 1,
            transition: 'transform 0.2s'
          }}
          size="medium"
        >
          <SendIcon fontSize="medium" />
        </IconButton>

        <IconButton
          size="medium"
          onClick={handleCancelClick}
          sx={{
            color: '#ff4d4d',
            p: 1,
            '&:hover': {
              bgcolor: 'rgba(255, 77, 77, 0.08)',
              transform: 'scale(1.05)'
            },
            transition: 'transform 0.2s'
          }}
        >
          <CloseIcon fontSize="medium" />
        </IconButton>

        <audio
          ref={previewAudioRef}
          src={recordingPreviewUrl}
          onEnded={() => setIsPreviewingAudio(false)}
          style={{ display: 'none' }}
        />
      </Box>
    );
  }

  return null;
};

// --- VOICE MESSAGE PLAYER COMPONENT ---
export const VoiceMessagePlayer = ({
  msg,
  idx,
  selectedUser,
  playingAudioIdx,
  setPlayingAudioIdx,
  handleAudioMenuOpen
}) => {
  const audioRef = useRef(null);
  const isPlaying = playingAudioIdx === idx;

  useEffect(() => {
    if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setPlayingAudioIdx(null);
    } else {
      if (playingAudioIdx !== null) {
        // Find and pause previously playing audio message
        const prevAudio = document.getElementById(`audio-msg-${selectedUser?._id}-${playingAudioIdx}`);
        if (prevAudio) {
          prevAudio.pause();
        }
      }
      audioRef.current.play();
      setPlayingAudioIdx(idx);
    }
  };

  const handleEnded = () => {
    setPlayingAudioIdx(null);
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      bgcolor: '#f7f7f7',
      borderRadius: 2,
      px: 1.5,
      py: 1,
      mt: 1,
      position: 'relative',
      minWidth: 180,
      maxWidth: 280,
    }}>
      <IconButton
        size="small"
        sx={{ mr: 1 }}
        onClick={handlePlayPause}
      >
        {isPlaying ? (
          <PauseIcon sx={{ color: '#25d366', fontSize: 28 }} />
        ) : (
          <PlayArrowIcon sx={{ color: '#25d366', fontSize: 28 }} />
        )}
      </IconButton>
      <Box sx={{ flex: 1, mx: 1 }}>
        <svg height="24" width="100%">
          <polyline
            points="2,12 6,8 10,16 14,6 18,18 22,8 26,16 30,10 34,14 38,8 42,16"
            stroke="#25d366"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </Box>
      <IconButton
        size="small"
        onClick={(e) => handleAudioMenuOpen(e, msg)}
      >
        <MoreVertIcon sx={{ color: '#888' }} />
      </IconButton>
      <audio
        id={`audio-msg-${selectedUser?._id}-${idx}`}
        ref={audioRef}
        src={msg.audio}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />
    </Box>
  );
};
