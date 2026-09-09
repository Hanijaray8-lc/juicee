import React from 'react';
import { Dialog, Box, Typography, Avatar, IconButton, Button, Tooltip } from '@mui/material';
import {
  Phone as PhoneIcon,
  Videocam as VideocamIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  Flip as FlipIcon,
  PictureInPicture as PictureInPictureIcon,
  AccessTime as AccessTimeIcon,
  Message as MessageIcon
} from '@mui/icons-material';

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
          onClick={onReject || (() => {})}
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

const Audiocall = ({ videoCall, user, selectedUser, dbFriends, handleCallEnd, answerCallHandler }) => {
  return (
    <>
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
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <Box sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: { xs: 11, sm: 13 },
              zIndex: 5,
              animation: 'slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
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

            {/* Video UI - Remote fullscreen (WhatsApp style - no preview) */}
            {videoCall.callType === 'video' && (
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
                    muted={true}
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

            {/* Audio element for remote peer audio - unmuted for both audio and video calls */}
            <audio
              ref={(el) => {
                if (videoCall.remoteAudioRef) {
                  videoCall.remoteAudioRef.current = el;
                }
                if (el && videoCall.remoteStream && el.srcObject !== videoCall.remoteStream) {
                  console.log('🔊 [Audio Callback Ref] Attaching remoteStream to remote audio element');
                  el.srcObject = videoCall.remoteStream;
                  el.play().catch(err => console.warn('Remote audio autoplay warning:', err));
                }
              }}
              autoPlay={true}
              playsInline={true}
              muted={false}
              controls={false}
              crossOrigin="anonymous"
              preload="auto"
              style={{ display: 'none' }}
            />
          </Box>
        </Dialog>
      )}

    </>
  );
};

export default Audiocall;
