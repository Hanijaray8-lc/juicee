import React, { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ZEGO_CONFIG } from '../config/zegoConfig';

/**
 * ZegoCallRoom
 * High-performance 1-on-1 audio and video call container powered by ZegoCloud SD-RTN.
 * Optimized for WhatsApp-style edge-to-edge full-screen mobile video and Capacitor Android audio routing (earpiece / speaker).
 */
const ZegoCallRoom = ({
  roomID,
  userID,
  userName = 'User',
  callType = 'video',
  isSpeakerOn,
  onToggleSpeaker,
  applyAudioRouting,
  onLeave,
  containerStyle = {}
}) => {
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  // Track speaker state (defaults: Video = speaker, Audio = earpiece)
  const [speakerActive, setSpeakerActive] = useState(
    typeof isSpeakerOn === 'boolean' ? isSpeakerOn : (callType === 'video')
  );

  useEffect(() => {
    if (typeof isSpeakerOn === 'boolean') {
      setSpeakerActive(isSpeakerOn);
    }
  }, [isSpeakerOn]);

  // Initial routing on mount: Audio calls -> earpiece, Video calls -> loudspeaker
  useEffect(() => {
    const defaultMode = (callType === 'video') ? 'speaker' : 'earpiece';
    if (applyAudioRouting) {
      applyAudioRouting(defaultMode, callType);
    } else if (typeof window !== 'undefined' && window.Capacitor) {
      const { AudioRoute } = window.Capacitor.Plugins || {};
      if (AudioRoute && typeof AudioRoute.setSpeakerphoneOn === 'function') {
        AudioRoute.setSpeakerphoneOn({ playOnSpeaker: defaultMode === 'speaker' }).catch(() => {});
      }
    }
  }, [callType, applyAudioRouting]);

  const handleSpeakerToggle = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const nextState = !speakerActive;
    setSpeakerActive(nextState);

    console.log('🔊 [ZegoCallRoom] Speaker toggled to:', nextState ? 'SPEAKER' : 'EARPIECE');

    if (onToggleSpeaker) {
      onToggleSpeaker();
    }
    if (applyAudioRouting) {
      applyAudioRouting(nextState ? 'speaker' : 'earpiece', callType);
    }
    if (typeof window !== 'undefined' && window.Capacitor) {
      const { AudioRoute } = window.Capacitor.Plugins || {};
      if (AudioRoute && typeof AudioRoute.setSpeakerphoneOn === 'function') {
        AudioRoute.setSpeakerphoneOn({ playOnSpeaker: nextState })
          .then(res => console.log('📱 [ANDROID-AUDIO] AudioRoute result:', res))
          .catch(err => console.warn('📱 [ANDROID-AUDIO] AudioRoute error:', err));
      }
    }
  };

  // Dedicated end call handler that destroys Zego and notifies parent
  const handleEndCall = () => {
    console.log('🛑 [ZegoCallRoom] Ending call via handleEndCall');
    if (zpRef.current) {
      try {
        zpRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying Zego instance:', e);
      }
      zpRef.current = null;
    }
    if (onLeaveRef.current) {
      onLeaveRef.current();
    }
  };

  // Generate unique session userID (prevents Error 1002050 when testing on same account / multiple tabs)
  const sessionUserIdRef = useRef(
    `${String(userID || 'user').replace(/[^a-zA-Z0-9_]/g, '')}_${Math.random().toString(36).substring(2, 6)}`
  );

  useEffect(() => {
    let isCleanedUp = false;

    if (hasJoinedRef.current) {
      return;
    }

    const startZegoCall = async () => {
      if (!containerRef.current || !roomID) {
        console.warn('⚠️ [ZegoCallRoom] Missing required parameters:', { roomID, userID });
        return;
      }

      hasJoinedRef.current = true;
      const cleanRoomID = String(roomID).replace(/[^a-zA-Z0-9_]/g, '');
      const cleanUserID = sessionUserIdRef.current;
      const displayName = String(userName || 'User');

      try {
        console.log('🚀 [ZegoCallRoom] Joining ZegoCloud room in full-screen WhatsApp mode:', {
          roomID: cleanRoomID,
          userID: cleanUserID,
          userName: displayName,
          callType
        });

        // 1. Generate Kit Token with unique session userID
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          Number(ZEGO_CONFIG.appID),
          ZEGO_CONFIG.serverSecret,
          cleanRoomID,
          cleanUserID,
          displayName
        );

        // 2. Create ZegoUIKitPrebuilt instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        if (isCleanedUp) {
          zp.destroy();
          return;
        }

        const isVideo = (callType === 'video');

        // 3. Join Room configured for WhatsApp-style full-screen layout
        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall
          },
          showPreJoinView: false,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: isVideo,
          useFrontFacingCamera: true,
          showMyCameraToggleButton: isVideo,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          showLeavingView: false,
          showLeaveRoomConfirmDialog: false, // ✅ CRITICAL: Do NOT block end-call with confirmation popup!
          showRoomTimer: true,
          showLayoutButton: false,
          autoHideFooter: false,
          maxUsers: 2,
          layout: 'Auto',
          // ✅ WhatsApp full screen edge-to-edge fill mode
          videoScreenConfig: {
            objectFit: 'cover',
            localMirror: true
          },
          onLeaveRoom: () => {
            console.log('🚪 [ZegoCallRoom] onLeaveRoom fired');
            handleEndCall();
          },
          onUserLeave: () => {
            console.log('🚪 [ZegoCallRoom] Remote user left room');
            handleEndCall();
          },
          onYouRemovedFromRoom: () => {
            console.log('🚪 [ZegoCallRoom] onYouRemovedFromRoom fired');
            handleEndCall();
          }
        });
      } catch (err) {
        console.error('❌ [ZegoCallRoom] Error joining Zego room:', err);
        hasJoinedRef.current = false;
      }
    };

    startZegoCall();

    return () => {
      isCleanedUp = true;
      hasJoinedRef.current = false;
      if (zpRef.current) {
        console.log('🧹 [ZegoCallRoom] Cleaning up Zego instance');
        try {
          zpRef.current.destroy();
        } catch (err) {
          console.warn('⚠️ [ZegoCallRoom] Error during destroy:', err);
        }
        zpRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID, callType]);

  return (
    <div
      className="zego-call-room-wrapper"
      style={{
        width: '100vw',
        height: '100dvh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        overflow: 'hidden',
        zIndex: 9999,
        ...containerStyle
      }}
    >
      {/* 1. Dedicated Zego UI container — isolated so Zego does not wipe custom overlay buttons */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}
      />

      {/* 2. 🔊 Floating Speaker / Earpiece Toggle Button (Rendered as SIBLING with max z-index) */}
      <button
        type="button"
        onClick={handleSpeakerToggle}
        title={speakerActive ? "Speakerphone ON (Click for Earpiece)" : "Earpiece ON (Click for Speakerphone)"}
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 16px) + 12px)',
          left: '16px',
          zIndex: 2147483647, // Above all Zego layers
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '24px',
          backgroundColor: speakerActive ? 'rgba(34, 197, 94, 0.95)' : 'rgba(30, 30, 30, 0.85)',
          border: speakerActive ? '2px solid #22c55e' : '1.5px solid rgba(255, 255, 255, 0.4)',
          color: '#fff',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
          fontSize: '14px',
          fontWeight: 700,
          pointerEvents: 'auto',
          userSelect: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        {speakerActive ? (
          // Speaker icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        ) : (
          // Earpiece / Phone icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        )}
        <span>{speakerActive ? 'Speaker' : 'Earpiece'}</span>
      </button>

      {/* 3. 🛑 Direct End Call Overlay Button (Guaranteed instant termination) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleEndCall();
        }}
        title="End Call"
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 16px) + 12px)',
          right: '16px',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 16px',
          borderRadius: '24px',
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          border: '1.5px solid #ef4444',
          color: '#fff',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 6px 20px rgba(239, 68, 68, 0.5)',
          fontSize: '14px',
          fontWeight: 700,
          pointerEvents: 'auto',
          userSelect: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'rotate(135deg)' }}>
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
        <span>End</span>
      </button>

      <style>{`
        /* WhatsApp-style edge-to-edge full-screen video */
        .zego-call-room-wrapper video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
        }
        /* Style the small floating PiP view (self camera) */
        .zego-call-room-wrapper div[class*="small"] video,
        .zego-call-room-wrapper div[class*="Small"] video {
          border-radius: 12px !important;
          object-fit: cover !important;
        }
        /* Ensure zero unwanted gaps/margins */
        .zego-call-room-wrapper div {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default ZegoCallRoom;
