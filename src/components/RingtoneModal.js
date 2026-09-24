import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Slider,
  CircularProgress,
  Chip
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';

import {
  getRingtoneSetting,
  saveRingtoneSetting,
  decodeAudioFile,
  cropAudioBuffer,
  audioBufferToWavBlob,
  blobToBase64,
  saveBlobToIndexedDB,
  deleteBlobFromIndexedDB,
  saveRingtoneToDeviceStorage,
  getBlobFromIndexedDB,
  receiverAudioFile
} from '../utils/ringtoneManager';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const MAX_RECOMMENDED_DURATION = 35; // 35 seconds recommended for incoming ringtone
const MIN_DURATION = 2; // minimum 2 seconds

const RingtoneModal = ({ open, onClose, isDark = false, onShowSnackbar }) => {
  const [currentSetting, setCurrentSetting] = useState({
    type: 'default',
    name: 'Default',
    customAudio: null
  });
  const [loading, setLoading] = useState(true);

  // Preview Player State for the List View
  const [playingTrack, setPlayingTrack] = useState(null); // 'default' | 'custom' | null
  const listAudioRef = useRef(null);

  // Audio Trimmer View State
  const [trimmerActive, setTrimmerActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioData, setAudioData] = useState(null); // { audioBuffer, duration, peaks }
  const [decoding, setDecoding] = useState(false);
  const [savingCrop, setSavingCrop] = useState(false);

  // Trimmer Sliders: [startTime, endTime]
  const [trimRange, setTrimRange] = useState([0, 20]);
  const [trimmerPlaying, setTrimmerPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);

  const trimmerAudioCtxRef = useRef(null);
  const trimmerSourceNodeRef = useRef(null);
  const trimmerAnimationRef = useRef(null);
  const trimmerStartTimeRef = useRef(0);
  const fileInputRef = useRef(null);

  // Stop Trimmer audio & cancel animation frame
  const stopTrimmerAudio = useCallback(() => {
    if (trimmerSourceNodeRef.current) {
      try {
        trimmerSourceNodeRef.current.stop();
        trimmerSourceNodeRef.current.disconnect();
      } catch (e) {}
      trimmerSourceNodeRef.current = null;
    }
    if (trimmerAudioCtxRef.current) {
      try {
        trimmerAudioCtxRef.current.close();
      } catch (e) {}
      trimmerAudioCtxRef.current = null;
    }
    if (trimmerAnimationRef.current) {
      cancelAnimationFrame(trimmerAnimationRef.current);
      trimmerAnimationRef.current = null;
    }
    setTrimmerPlaying(false);
  }, []);

  // Clean up any playing audio when unmounting or switching views
  const stopAllAudio = useCallback(() => {
    if (listAudioRef.current) {
      listAudioRef.current.pause();
      listAudioRef.current = null;
    }
    setPlayingTrack(null);
    stopTrimmerAudio();
  }, [stopTrimmerAudio]);

  // Load existing ringtone configuration
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const setting = await getRingtoneSetting();
      setCurrentSetting(setting);
    } catch (e) {
      console.warn('Failed to load ringtone settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadSettings();
    } else {
      stopAllAudio();
      setTrimmerActive(false);
      setAudioData(null);
      setSelectedFile(null);
    }
  }, [open, loadSettings, stopAllAudio]);

  // Play preview in List View
  const handleTogglePlayList = async (trackType) => {
    if (playingTrack === trackType) {
      stopAllAudio();
      return;
    }

    stopAllAudio();

    try {
      let src = null;
      if (trackType === 'default') {
        src = receiverAudioFile;
      } else if (trackType === 'custom') {
        // Try IndexedDB blob first
        const blob = await getBlobFromIndexedDB();
        if (blob) {
          src = URL.createObjectURL(blob);
        } else if (currentSetting.customAudio?.dataUrl) {
          src = currentSetting.customAudio.dataUrl;
        } else if (currentSetting.customAudio?.fileUri) {
          src = currentSetting.customAudio.fileUri;
        }
      }

      if (!src) return;

      const audio = new Audio(src);
      listAudioRef.current = audio;
      setPlayingTrack(trackType);

      audio.onended = () => {
        setPlayingTrack(null);
      };
      audio.onerror = () => {
        setPlayingTrack(null);
      };

      await audio.play();
    } catch (e) {
      console.warn('Playback error:', e);
      setPlayingTrack(null);
    }
  };

  // Switch Active Ringtone ('default' | 'custom')
  const handleSelectRingtone = async (type) => {
    stopAllAudio();
    let updated;
    if (type === 'default') {
      updated = {
        ...currentSetting,
        type: 'default'
      };
    } else {
      if (!currentSetting.customAudio) {
        // No custom audio yet, open file picker
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        return;
      }
      updated = {
        ...currentSetting,
        type: 'custom'
      };
    }

    setCurrentSetting(updated);
    await saveRingtoneSetting(updated);
    if (onShowSnackbar) {
      onShowSnackbar(
        type === 'default'
          ? 'Default ringtone activated'
          : 'Custom ringtone activated',
        'success'
      );
    }
  };

  // Handle Audio File Input from Mobile Device
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can re-pick same file if desired
    e.target.value = '';

    stopAllAudio();
    setSelectedFile(file);
    setDecoding(true);
    setTrimmerActive(true);

    try {
      const decoded = await decodeAudioFile(file);
      setAudioData(decoded);

      // Default crop: start at 0, end at min(duration, 25)
      const initialEnd = Math.min(decoded.duration, 25);
      setTrimRange([0, initialEnd]);
      setPreviewCurrentTime(0);
    } catch (err) {
      console.error('Audio decode error:', err);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to decode audio file. Please select MP3, WAV, or AAC.', 'error');
      }
      setTrimmerActive(false);
    } finally {
      setDecoding(false);
    }
  };

  // Handle Range Slider Change
  const handleSliderChange = (event, newValue) => {
    let [newStart, newEnd] = newValue;
    if (newEnd - newStart < MIN_DURATION) {
      if (newStart !== trimRange[0]) {
        newStart = Math.max(0, newEnd - MIN_DURATION);
      } else {
        newEnd = Math.min(audioData?.duration || 30, newStart + MIN_DURATION);
      }
    }
    setTrimRange([newStart, newEnd]);
    setPreviewCurrentTime(newStart);
    if (trimmerPlaying) {
      stopTrimmerAudio();
    }
  };

  // Nudge start/end times with ±0.5s buttons
  const nudgeStart = (delta) => {
    const maxStart = trimRange[1] - MIN_DURATION;
    const newStart = Math.max(0, Math.min(maxStart, +(trimRange[0] + delta).toFixed(1)));
    setTrimRange([newStart, trimRange[1]]);
    setPreviewCurrentTime(newStart);
    if (trimmerPlaying) stopTrimmerAudio();
  };

  const nudgeEnd = (delta) => {
    const totalDuration = audioData?.duration || 30;
    const minEnd = trimRange[0] + MIN_DURATION;
    const newEnd = Math.max(minEnd, Math.min(totalDuration, +(trimRange[1] + delta).toFixed(1)));
    setTrimRange([trimRange[0], newEnd]);
    setPreviewCurrentTime(trimRange[0]);
    if (trimmerPlaying) stopTrimmerAudio();
  };

  // Play / Pause preview in Audio Trimmer view
  const handleToggleTrimmerPlay = () => {
    if (trimmerPlaying) {
      stopTrimmerAudio();
      return;
    }

    if (!audioData?.audioBuffer) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      trimmerAudioCtxRef.current = ctx;

      const source = ctx.createBufferSource();
      source.buffer = audioData.audioBuffer;
      source.connect(ctx.destination);
      trimmerSourceNodeRef.current = source;

      const [startSec, endSec] = trimRange;
      const sliceDuration = endSec - startSec;

      source.start(0, startSec, sliceDuration);
      trimmerStartTimeRef.current = ctx.currentTime;
      setTrimmerPlaying(true);

      const updateProgress = () => {
        if (!trimmerAudioCtxRef.current) return;
        const elapsed = trimmerAudioCtxRef.current.currentTime - trimmerStartTimeRef.current;
        const currentPos = startSec + elapsed;

        if (currentPos >= endSec || elapsed >= sliceDuration) {
          setPreviewCurrentTime(startSec);
          setTrimmerPlaying(false);
          stopTrimmerAudio();
          return;
        }

        setPreviewCurrentTime(currentPos);
        trimmerAnimationRef.current = requestAnimationFrame(updateProgress);
      };

      trimmerAnimationRef.current = requestAnimationFrame(updateProgress);

      source.onended = () => {
        setTrimmerPlaying(false);
        setPreviewCurrentTime(startSec);
      };
    } catch (e) {
      console.warn('Trimmer audio playback error:', e);
      setTrimmerPlaying(false);
    }
  };

  // Crop & Save Audio to Ringtone
  const handleSaveCroppedAudio = async () => {
    if (!audioData?.audioBuffer) return;
    setSavingCrop(true);
    stopTrimmerAudio();

    try {
      const [startSec, endSec] = trimRange;
      const croppedBuffer = cropAudioBuffer(audioData.audioBuffer, startSec, endSec);
      const wavBlob = audioBufferToWavBlob(croppedBuffer);
      const base64DataUrl = await blobToBase64(wavBlob);

      // 1. Save to IndexedDB
      await saveBlobToIndexedDB(wavBlob);

      // 2. Save to native storage if Capacitor platform
      const fileUri = await saveRingtoneToDeviceStorage(base64DataUrl);

      // 3. Save setting
      const customTitle = selectedFile?.name
        ? selectedFile.name.replace(/\.[^/.]+$/, '')
        : 'Custom Ringtone';

      const customDuration = +(endSec - startSec).toFixed(1);

      const newSetting = {
        type: 'custom',
        name: customTitle,
        customAudio: {
          title: customTitle,
          fileName: selectedFile?.name || 'custom_ringtone.wav',
          duration: customDuration,
          startTime: startSec,
          endTime: endSec,
          dataUrl: base64DataUrl,
          fileUri: fileUri || null,
          updatedAt: Date.now()
        }
      };

      await saveRingtoneSetting(newSetting);
      setCurrentSetting(newSetting);
      setTrimmerActive(false);

      if (onShowSnackbar) {
        onShowSnackbar(`Custom ringtone "${customTitle}" cropped and saved!`, 'success');
      }
    } catch (err) {
      console.error('Save cropped audio failed:', err);
      if (onShowSnackbar) {
        onShowSnackbar('Failed to crop and save ringtone. Please try again.', 'error');
      }
    } finally {
      setSavingCrop(false);
    }
  };

  // Delete Custom Ringtone
  const handleDeleteCustomRingtone = async (e) => {
    e.stopPropagation();
    stopAllAudio();
    try {
      await deleteBlobFromIndexedDB();
      const updated = {
        type: 'default',
        name: 'Default',
        customAudio: null
      };
      await saveRingtoneSetting(updated);
      setCurrentSetting(updated);
      if (onShowSnackbar) {
        onShowSnackbar('Custom ringtone deleted. Reverted to Default.', 'info');
      }
    } catch (err) {
      console.warn('Error deleting custom ringtone:', err);
    }
  };

  const selectedDuration = +(trimRange[1] - trimRange[0]).toFixed(1);

  return (
    <Dialog
      open={open}
      onClose={() => {
        stopAllAudio();
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '28px',
          bgcolor: isDark ? 'rgba(24, 18, 34, 0.96)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)'
            : '0 24px 48px rgba(255, 45, 108, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Hidden file input for picking audio from device */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header */}
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {trimmerActive ? (
            <IconButton
              onClick={() => {
                stopTrimmerAudio();
                setTrimmerActive(false);
              }}
              sx={{
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                color: isDark ? '#fff' : '#1e293b'
              }}
              size="small"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff2d6c 0%, #ff6b8b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(255, 45, 108, 0.35)'
              }}
            >
              <MusicNoteRoundedIcon sx={{ fontSize: 22 }} />
            </Box>
          )}

          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 750,
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
                color: isDark ? '#fff' : '#0f172a',
                lineHeight: 1.2
              }}
            >
              {trimmerActive ? 'Crop Audio Ringtone' : 'Incoming Call Ringtone'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                fontSize: '0.78rem'
              }}
            >
              {trimmerActive
                ? 'Select start and end points to create ringtone'
                : 'Select default ringtone or customize from device'}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={() => {
            stopAllAudio();
            onClose();
          }}
          size="small"
          sx={{
            color: isDark ? '#94a3b8' : '#64748b',
            '&:hover': { color: isDark ? '#fff' : '#0f172a' }
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, maxHeight: '72vh', overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
            <CircularProgress size={36} sx={{ color: '#ff2d6c' }} />
          </Box>
        ) : trimmerActive ? (
          /* ========================================================== */
          /* AUDIO TRIMMER / CROPPER VIEW                               */
          /* ========================================================== */
          decoding ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={42} sx={{ color: '#ff2d6c', mb: 2 }} />
              <Typography sx={{ fontWeight: 650, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                Analyzing & Decoding Audio...
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Preparing visual waveform and crop tools
              </Typography>
            </Box>
          ) : audioData ? (
            <Box>
              {/* File Info Bar */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  mb: 2,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                  <GraphicEqRoundedIcon sx={{ color: '#ff2d6c', fontSize: 24, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 650,
                        fontSize: '0.88rem',
                        color: isDark ? '#f1f5f9' : '#0f172a'
                      }}
                    >
                      {selectedFile?.name || 'Selected Audio File'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                      Total Duration: {formatTime(audioData.duration)}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<UploadFileRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#ff2d6c',
                    borderRadius: '10px'
                  }}
                >
                  Change
                </Button>
              </Box>

              {/* Waveform Visualizer */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '20px',
                  bgcolor: isDark ? 'rgba(15, 11, 22, 0.85)' : '#fff0f4',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 45, 108, 0.2)' : 'rgba(255, 45, 108, 0.15)',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.05)',
                  mb: 2.5
                }}
              >
                <Box
                  sx={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '2px',
                    position: 'relative',
                    px: 0.5
                  }}
                >
                  {audioData.peaks.map((peak, index) => {
                    const barTime = (index / audioData.peaks.length) * audioData.duration;
                    const isInsideCrop = barTime >= trimRange[0] && barTime <= trimRange[1];
                    const heightPercent = Math.max(12, Math.round(peak * 100));

                    return (
                      <Box
                        key={index}
                        sx={{
                          flex: 1,
                          height: `${heightPercent}%`,
                          borderRadius: '3px',
                          transition: 'all 0.15s ease',
                          bgcolor: isInsideCrop
                            ? '#ff2d6c'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.18)'
                            : 'rgba(0, 0, 0, 0.15)',
                          boxShadow: isInsideCrop
                            ? '0 0 6px rgba(255, 45, 108, 0.4)'
                            : 'none'
                        }}
                      />
                    );
                  })}

                  {/* Animated Playhead Indicator */}
                  {trimmerPlaying && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${(previewCurrentTime / audioData.duration) * 100}%`,
                        width: '2.5px',
                        bgcolor: '#ffffff',
                        boxShadow: '0 0 8px #ff2d6c, 0 0 4px #ffffff',
                        zIndex: 2,
                        borderRadius: '2px',
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </Box>

                {/* Trimmer Range Slider */}
                <Box sx={{ px: 1, pt: 1.5 }}>
                  <Slider
                    value={trimRange}
                    onChange={handleSliderChange}
                    min={0}
                    max={audioData.duration}
                    step={0.1}
                    valueLabelDisplay="off"
                    sx={{
                      color: '#ff2d6c',
                      height: 6,
                      '& .MuiSlider-track': {
                        bgcolor: '#ff2d6c',
                        border: 'none'
                      },
                      '& .MuiSlider-rail': {
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                        opacity: 1
                      },
                      '& .MuiSlider-thumb': {
                        width: 18,
                        height: 18,
                        bgcolor: '#ffffff',
                        border: '3px solid #ff2d6c',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(255, 45, 108, 0.2)'
                        }
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Precise Time Controls & Badges */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 2.5
                }}
              >
                {/* Start Time Control */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    p: 1,
                    borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem' }}>
                      START TIME
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                      {formatTime(trimRange[0])}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                    <IconButton size="small" onClick={() => nudgeStart(0.5)} sx={{ p: 0.4 }}>
                      <AddRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => nudgeStart(-0.5)} sx={{ p: 0.4 }}>
                      <RemoveRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Duration Badge */}
                <Box sx={{ textAlign: 'center' }}>
                  <Chip
                    icon={<TuneRoundedIcon style={{ fontSize: 14, color: '#ff2d6c' }} />}
                    label={`Length: ${selectedDuration}s`}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      height: 28,
                      bgcolor: isDark ? 'rgba(255, 45, 108, 0.18)' : 'rgba(255, 45, 108, 0.1)',
                      color: '#ff2d6c',
                      border: '1px solid rgba(255, 45, 108, 0.3)'
                    }}
                  />
                  {selectedDuration > MAX_RECOMMENDED_DURATION && (
                    <Typography variant="caption" display="block" sx={{ color: '#f59e0b', fontSize: '0.68rem', mt: 0.4 }}>
                      ⚠️ Recommended ≤ 30s
                    </Typography>
                  )}
                </Box>

                {/* End Time Control */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    p: 1,
                    borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem' }}>
                      END TIME
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                      {formatTime(trimRange[1])}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                    <IconButton size="small" onClick={() => nudgeEnd(0.5)} sx={{ p: 0.4 }}>
                      <AddRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => nudgeEnd(-0.5)} sx={{ p: 0.4 }}>
                      <RemoveRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* Playback Preview Controls */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <Button
                  onClick={handleToggleTrimmerPlay}
                  variant="outlined"
                  startIcon={trimmerPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                  sx={{
                    borderRadius: '14px',
                    borderColor: '#ff2d6c',
                    color: '#ff2d6c',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    '&:hover': {
                      borderColor: '#ff2d6c',
                      bgcolor: 'rgba(255, 45, 108, 0.08)'
                    }
                  }}
                >
                  {trimmerPlaying ? 'Pause Preview' : 'Play Selected Clip'}
                </Button>
              </Box>
            </Box>
          ) : null
        ) : (
          /* ========================================================== */
          /* RINGTONE SELECTION LIST VIEW                               */
          /* ========================================================== */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* OPTION 1: DEFAULT RINGTONE (reciver.mp3) */}
            <Box
              onClick={() => handleSelectRingtone('default')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: '20px',
                cursor: 'pointer',
                bgcolor:
                  currentSetting.type === 'default'
                    ? isDark
                      ? 'rgba(255, 45, 108, 0.15)'
                      : 'rgba(255, 45, 108, 0.08)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                border: '2px solid',
                borderColor:
                  currentSetting.type === 'default'
                    ? '#ff2d6c'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: '#ff2d6c',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                {currentSetting.type === 'default' ? (
                  <CheckCircleRoundedIcon sx={{ color: '#ff2d6c', fontSize: 24, flexShrink: 0 }} />
                ) : (
                  <RadioButtonUncheckedRoundedIcon
                    sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 24, flexShrink: 0 }}
                  />
                )}

                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                    >
                      Default Ringtone
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.8rem' }}
                  >
                    Original Juicy incoming call ringtone
                  </Typography>
                </Box>
              </Box>

              {/* Play / Pause Preview Button */}
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePlayList('default');
                }}
                sx={{
                  bgcolor: playingTrack === 'default' ? '#ff2d6c' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  color: playingTrack === 'default' ? '#fff' : '#ff2d6c',
                  boxShadow: playingTrack === 'default' ? '0 4px 12px rgba(255, 45, 108, 0.35)' : 'none',
                  '&:hover': {
                    bgcolor: '#ff2d6c',
                    color: '#fff'
                  }
                }}
              >
                {playingTrack === 'default' ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
              </IconButton>
            </Box>

            {/* OPTION 2: CUSTOM RINGTONE */}
            <Box
              onClick={() => handleSelectRingtone('custom')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: '20px',
                cursor: 'pointer',
                bgcolor:
                  currentSetting.type === 'custom'
                    ? isDark
                      ? 'rgba(255, 45, 108, 0.15)'
                      : 'rgba(255, 45, 108, 0.08)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                border: '2px solid',
                borderColor:
                  currentSetting.type === 'custom'
                    ? '#ff2d6c'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: '#ff2d6c',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                {currentSetting.type === 'custom' ? (
                  <CheckCircleRoundedIcon sx={{ color: '#ff2d6c', fontSize: 24, flexShrink: 0 }} />
                ) : (
                  <RadioButtonUncheckedRoundedIcon
                    sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 24, flexShrink: 0 }}
                  />
                )}

                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                    >
                      Custom Ringtone
                    </Typography>
                    {currentSetting.customAudio && (
                      <Chip
                        size="small"
                        label={`${currentSetting.customAudio.duration || 0}s`}
                        sx={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          height: 20,
                          borderRadius: '6px',
                          bgcolor: 'rgba(255, 45, 108, 0.12)',
                          color: '#ff2d6c'
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    noWrap
                    display="block"
                    sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.8rem' }}
                  >
                    {currentSetting.customAudio
                      ? currentSetting.customAudio.title || currentSetting.customAudio.fileName
                      : 'Choose an audio file from your mobile to crop'}
                  </Typography>
                </Box>
              </Box>

              {/* Right Side Actions for Custom */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {currentSetting.customAudio ? (
                  <>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlayList('custom');
                      }}
                      sx={{
                        bgcolor:
                          playingTrack === 'custom'
                            ? '#ff2d6c'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        color: playingTrack === 'custom' ? '#fff' : '#ff2d6c',
                        boxShadow:
                          playingTrack === 'custom'
                            ? '0 4px 12px rgba(255, 45, 108, 0.35)'
                            : 'none',
                        '&:hover': {
                          bgcolor: '#ff2d6c',
                          color: '#fff'
                        }
                      }}
                    >
                      {playingTrack === 'custom' ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={handleDeleteCustomRingtone}
                      sx={{
                        color: '#ef4444',
                        bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                        '&:hover': {
                          bgcolor: 'rgba(239, 68, 68, 0.2)'
                        }
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    startIcon={<ContentCutRoundedIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%)',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      boxShadow: '0 4px 12px rgba(255, 45, 108, 0.3)'
                    }}
                  >
                    Select & Crop
                  </Button>
                )}
              </Box>
            </Box>

            {/* If custom audio is set, give option to crop another file */}
            {currentSetting.customAudio && (
              <Box sx={{ textAlign: 'center', pt: 1 }}>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<ContentCutRoundedIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#ff2d6c',
                    borderRadius: '14px',
                    fontSize: '0.86rem'
                  }}
                >
                  Pick & Crop Another Audio File
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions
        sx={{
          p: { xs: 2, sm: 2.5 },
          pt: 1.5,
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          justifyContent: trimmerActive ? 'space-between' : 'flex-end'
        }}
      >
        {trimmerActive ? (
          <>
            <Button
              onClick={() => {
                stopTrimmerAudio();
                setTrimmerActive(false);
              }}
              sx={{
                borderRadius: '14px',
                color: isDark ? '#94a3b8' : '#64748b',
                textTransform: 'none',
                fontWeight: 650
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              disabled={savingCrop || !audioData}
              onClick={handleSaveCroppedAudio}
              startIcon={savingCrop ? <CircularProgress size={16} color="inherit" /> : <ContentCutRoundedIcon />}
              sx={{
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%)',
                boxShadow: '0 4px 14px rgba(255, 45, 108, 0.35)',
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #e0245e 0%, #ff4b80 100%)'
                }
              }}
            >
              {savingCrop ? 'Cropping & Saving...' : 'Crop & Set Ringtone'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            sx={{
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ff2d6c 0%, #ff5c8d 100%)',
              fontWeight: 700,
              textTransform: 'none',
              px: 3.5,
              boxShadow: '0 4px 14px rgba(255, 45, 108, 0.3)'
            }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RingtoneModal;
