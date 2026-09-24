import { useEffect, useCallback, useRef } from 'react';
import useVideoCall from './VideoCall';
import { generateUniqueNumericId } from './utils/uniqueIdGenerator';
import API_BASE_URL from './config/apiConfig';
import { initCallLogsDb, saveCallLogLocally, markCallLogSynced } from './db/callLogsDb';

// ICE servers for NAT traversal and fallback relay (optimized for fast mobile P2P & candidate gathering)
// Defined at module level so reference remains completely stable across re-renders
const iceServers = [
  // Public STUN
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302'
    ]
  },

  // Your self-hosted STUN
  {
    urls: [
      'stun:turn.juicyapp.in:3478',
      'stun:turn.juicyapp.in:443'
    ]
  },

  // Your self-hosted TURN (Port 3478 + Port 443 for strict firewall bypass)
  {
    urls: [
      'turn:turn.juicyapp.in:3478?transport=udp',
      'turn:turn.juicyapp.in:3478?transport=tcp',
      'turn:turn.juicyapp.in:443?transport=tcp',
      'turn:turn.juicyapp.in:443?transport=udp',
      'turns:turn.juicyapp.in:443?transport=tcp'
    ],
    username: 'juicee',
    credential: 'JuicYCoTurnCALL'
  },

  // Temporary fallback TURN
  {
    urls: [
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:80'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];
/**
 * RTCPeerConnection configuration for both initiator and answerer peers.
 * - bundlePolicy: 'max-bundle'  → All media on one transport (lower latency, fewer TURN relay ports)
 * - sdpSemantics: 'unified-plan' → Modern SDP format required for reliable track events on all browsers
 * - iceTransportPolicy: 'all'   → Try STUN (direct) AND TURN (relay) candidates simultaneously
 * - iceCandidatePoolSize: 10    → Pre-gather candidates before offer/answer (speeds up ICE)
 */
const rtcConfig = {
  iceServers,
  bundlePolicy: 'max-bundle',
  sdpSemantics: 'unified-plan',
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
};

/**
 * Custom hook to initialize video/audio call configurations, socket listeners,
 * proximity sensors, and wrapper handlers for ChatPage.
 */
export const useInitializeCalls = (socket, user, selectedUser, dbFriends, setCallLogs) => {
  const loggingLockRef = useRef(false);
  // Ref so callEnded socket listener always calls latest handleCallEnd (prevents stale closure race)
  const handleCallEndRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // ⚡ FIX 3: TURN/ICE Pre-warm
  // Create a throwaway RTCPeerConnection with the same iceServers, trigger ICE gathering,
  // then close it. This caches the TURN allocation and STUN binding so the first real call
  // is not a cold start.
  // ─────────────────────────────────────────────────────────────────────────────
  const prewarmIceAndTurn = useCallback(async (cfg) => {
    if (!cfg || !cfg.iceServers) return;
    let pc = null;
    try {
      console.log('⚡ [ICE-PREWARM] Warming up TURN allocation and STUN binding...');
      pc = new RTCPeerConnection(cfg);
      // Add a data channel so the offer includes ICE gathering
      pc.createDataChannel('prewarm');
      // Create offer and set local description to trigger ICE candidate gathering
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // Wait for ICE gathering to complete or timeout (5 seconds max)
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 5000);
        const check = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            resolve();
          }
        };
        pc.onicegatheringstatechange = check;
        check(); // already complete if candidates pre-cached
      });
      console.log('✅ [ICE-PREWARM] ICE gathering complete — TURN/STUN warmed up');
    } catch (err) {
      console.warn('⚠️ [ICE-PREWARM] Prewarm failed (non-fatal):', err.message);
    } finally {
      // Always close the throwaway peer — NO candidates are sent anywhere
      if (pc) {
        try { pc.close(); } catch (e) {}
      }
    }
  }, []);

  // Save call log to backend
  const saveCallLogToBackend = async (callData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/call-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData)
      });

      if (response.ok) {
        console.log('Call log saved to backend');
        if (callData?.id) {
          markCallLogSynced(callData.id);
        }
      } else {
        console.error('Failed to save call log to backend');
      }
    } catch (error) {
      console.error('Error saving call log to backend:', error);
    }
  };

  // Add call log locally to the state and SQLite cache
  const addCallLog = useCallback((log) => {
    const logEntry = {
      ...log,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      id: log?.id || generateUniqueNumericId()
    };
    setCallLogs(prev => [
      logEntry,
      ...prev
    ]);
    saveCallLogLocally(logEntry);
  }, [setCallLogs]);

  // Initialize video call hook (must be after `iceServers` and `rtcConfig` are defined)
  const videoCall = useVideoCall(socket, user, selectedUser, dbFriends, iceServers, rtcConfig);

  // Stable ref for videoCall instance so socket listeners don't re-bind on every render
  const videoCallRef = useRef(videoCall);
  useEffect(() => {
    videoCallRef.current = videoCall;
  }, [videoCall]);

  // Proximity sensor for screen off during audio calls (Android Native WakeLock + iOS Capgo plugin)
  useEffect(() => {
    let isCapgoActive = false;

    const manageProximity = async () => {
      const isAudioCallActive = Boolean(videoCall && videoCall.callStarted && videoCall.callType === 'audio');
      const isEarpieceMode = Boolean(!videoCall || !videoCall.isSpeakerOn);
      const shouldEnableProximity = isAudioCallActive && isEarpieceMode;

      const { AudioRoute } = window.Capacitor?.Plugins || {};

      if (shouldEnableProximity) {
        // 1. Primary: Native Android PROXIMITY_SCREEN_OFF_WAKE_LOCK (true screen black out + touch disable)
        if (AudioRoute && typeof AudioRoute.acquireProximityLock === 'function') {
          AudioRoute.acquireProximityLock().catch(err => {
            console.warn('AudioRoute acquireProximityLock error:', err);
          });
        }

        // 2. Secondary / iOS: Capgo Proximity plugin
        try {
          const { CapacitorProximity } = await import('@capgo/capacitor-proximity');
          const status = await CapacitorProximity.getStatus();
          if (status?.available) {
            await CapacitorProximity.enable();
            isCapgoActive = true;
          }
        } catch (err) {
          // Silent catch if plugin is unavailable on platform
        }
      } else {
        // Turn off proximity lock (Speaker ON, Video call, or Call ended)
        if (AudioRoute && typeof AudioRoute.releaseProximityLock === 'function') {
          AudioRoute.releaseProximityLock().catch(() => { });
        }

        if (isCapgoActive) {
          try {
            const { CapacitorProximity } = await import('@capgo/capacitor-proximity');
            await CapacitorProximity.disable();
            isCapgoActive = false;
          } catch (err) {
            // Silent catch
          }
        }
      }
    };

    manageProximity();

    return () => {
      const { AudioRoute } = window.Capacitor?.Plugins || {};
      if (AudioRoute && typeof AudioRoute.releaseProximityLock === 'function') {
        AudioRoute.releaseProximityLock().catch(() => { });
      }
      if (isCapgoActive) {
        import('@capgo/capacitor-proximity').then(({ CapacitorProximity }) => {
          CapacitorProximity.disable().catch(() => { });
        }).catch(() => { });
      }
    };
  }, [videoCall?.callStarted, videoCall?.callType, videoCall?.isSpeakerOn]);

  // ✅ [WhatsApp-style Background Calling]
  // Start the foreground service at ALL active call phases so the notification
  // appears BEFORE the user can swipe the app away:
  //   Phase 1 — calling (outgoing, waiting for receiver to pick up)
  //   Phase 2 — callAccepted (receiver accepted, RTC connecting)
  //   Phase 3 — callStarted (both sides, RTC connected, media flowing)
  // The FGS keeps the WebView process alive with WakeLock + WifiLock even when
  // the user backgrounds or swipes away the app from recents.
  useEffect(() => {
    if (!window.Capacitor) return; // Only on native Android

    const { AudioRoute } = window.Capacitor.Plugins || {};
    if (!AudioRoute || typeof AudioRoute.startForegroundService !== 'function') return;

    const isCalling      = Boolean(videoCall?.calling);      // Outgoing call — ringing phase
    const isAccepted     = Boolean(videoCall?.callAccepted); // Receiver accepted, connecting
    const isStarted      = Boolean(videoCall?.callStarted);  // RTC fully connected
    const isAnyCallPhase = isCalling || isAccepted || isStarted;

    if (isAnyCallPhase) {
      const callerName = videoCall.call?.callerName || selectedUser?.username || selectedUser?.name || 'Juicy Call';
      const callTypeLabel = videoCall.callType === 'video' ? '📹 Video Call' : '📞 Audio Call';

      let title, content;
      if (isStarted) {
        title   = `${callTypeLabel} in Progress`;
        content = `${callerName} • Tap to return to call`;
      } else if (isAccepted) {
        title   = `${callTypeLabel} Connecting...`;
        content = `${callerName} • Tap to return`;
      } else {
        // isCalling — outgoing ring phase
        title   = `${callTypeLabel} in Progress`;
        content = `Calling ${callerName}... • Tap to return`;
      }

      console.log('📱 [FGS] Starting foreground service —', title);
      AudioRoute.startForegroundService({ type: 'call', title, content })
        .catch(err => console.warn('📱 [FGS] startForegroundService error:', err));
    } else {
      // No active call phase — stop foreground service
      if (typeof AudioRoute.stopForegroundService === 'function') {
        console.log('📱 [FGS] Stopping foreground service — call ended or no active call');
        AudioRoute.stopForegroundService({})
          .catch(err => console.warn('📱 [FGS] stopForegroundService error:', err));
      }
    }
  }, [
    videoCall?.calling,
    videoCall?.callAccepted,
    videoCall?.callStarted,
    videoCall?.callType,
    videoCall?.call?.callerName,
    selectedUser
  ]);



  // Wrapper to initiate call and log it
  const initiateCallHandler = useCallback(async (friendId, type = 'audio') => {
    loggingLockRef.current = false; // Reset log lock for new call
    await videoCall.initiateCall(friendId, type);
    addCallLog({
      name: selectedUser?.username || selectedUser?.name || 'Unknown',
      type: 'outgoing',
      image: selectedUser?.profilePic || selectedUser?.image || '',
      status: 'calling'
    });
  }, [videoCall, selectedUser, addCallLog]);

  // Comprehensive call end handler that saves to backend
  const handleCallEnd = useCallback(async (skipEmit = false) => {
    // ✅ [GhostRingFix] Always stop ringtone / cleanup call UI FIRST, unconditionally.
    // Must never be gated by the logging guards below — those only protect against
    // duplicate backend log writes, not against a stuck ringtone. videoCall.endCall()
    // is internally idempotent (isEndingRef guard), so calling it here even when a
    // duplicate handleCallEnd fires later is always safe.
    if (typeof videoCall.dismissCallNotification === 'function') {
      videoCall.dismissCallNotification();
    }
    videoCall.endCall(skipEmit);

    // 1. Guard Clause - If we've already logged this call, or there's no active call, skip logging
    if (loggingLockRef.current) {
      console.log('🛑 Duplicate log prevented via Ref Lock');
      return;
    }

    if (!videoCall.calling && !videoCall.receivingCall && !videoCall.callAccepted && !videoCall.callStarted && !videoCall.callRejected && !videoCall.callingTimeout) {
      console.log('⚠️ Call already ended or never started - skipping duplicate log');
      return;
    }

    // Set lock immediately to prevent race conditions from peer signals
    loggingLockRef.current = true;

    // Calculate call duration
    let callDurationSeconds = 0;
    if (videoCall.callStartTime) {
      callDurationSeconds = Math.floor((Date.now() - videoCall.callStartTime) / 1000);
    }

    // Determine call status and participants
    const currentUserId = localStorage.getItem('userId');
    let otherUserId = null;
    let callStatus = 'missed'; // default status
    let isCaller = false;

    // Determine who we are and what the status should be
    if (videoCall.callRejected) {
      callStatus = 'rejected';
      isCaller = true;
      otherUserId = selectedUser?._id;
    } else if (videoCall.callingTimeout) {
      callStatus = 'missed';
      isCaller = true;
      otherUserId = selectedUser?._id;
    } else if (videoCall.calling && !videoCall.callAccepted) {
      // We initiated and cancelled before answer
      callStatus = 'cancelled';
      isCaller = true;
      otherUserId = selectedUser?._id;
    } else if (videoCall.receivingCall && !videoCall.callAccepted) {
      // We received and rejected/ended without answering
      callStatus = 'missed';
      otherUserId = videoCall.call?.from;
    } else if (videoCall.call?.from) {
      // We're the receiver
      callStatus = videoCall.callAccepted ? (videoCall.callStarted ? 'completed' : 'rejected') : 'missed';
      otherUserId = videoCall.call.from;
    } else {
      // We're the caller
      callStatus = videoCall.callAccepted ? (videoCall.callStarted ? 'completed' : 'rejected') : 'cancelled';
      otherUserId = selectedUser?._id;
      isCaller = true;
    }

    // Save call log to backend - ONLY FOR THE CALLER
    if (currentUserId && otherUserId && isCaller) {
      const callLogId = generateUniqueNumericId();
      const callLogData = isCaller ? {
        id: callLogId,
        callerId: currentUserId,
        receiverId: otherUserId,
        callType: videoCall.callType || 'audio',
        status: callStatus,
        duration: callDurationSeconds,
        startTime: videoCall.callStartTime ? new Date(videoCall.callStartTime) : new Date(),
        endTime: new Date(),
        name: selectedUser?.username || selectedUser?.name || 'Unknown',
        image: selectedUser?.profilePic || selectedUser?.image || '',
        direction: 'outgoing'
      } : {
        id: callLogId,
        callerId: otherUserId,
        receiverId: currentUserId,
        callType: videoCall.callType || 'audio',
        status: callStatus,
        duration: callDurationSeconds,
        startTime: videoCall.callStartTime ? new Date(videoCall.callStartTime) : new Date(),
        endTime: new Date(),
        name: selectedUser?.username || selectedUser?.name || 'Unknown',
        image: selectedUser?.profilePic || selectedUser?.image || '',
        direction: 'incoming'
      };

      saveCallLogToBackend(callLogData);
      addCallLog(callLogData);
    }
  }, [videoCall, selectedUser, addCallLog]);

  // Wrapper to answer call and log it
  const answerCallHandler = useCallback(async () => {
    loggingLockRef.current = false; // Reset log lock for new incoming call being answered
    await videoCall.answerCall();
    addCallLog({
      name: videoCall.call?.callerName || 'Unknown',
      type: 'incoming',
      image: selectedUser?.profilePic || selectedUser?.image || '',
      status: 'answered'
    });
  }, [videoCall, selectedUser, addCallLog]);

  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = (data) => {
      if (videoCallRef.current?.handleIncomingCall) {
        videoCallRef.current.handleIncomingCall(data);
      }
    };

    socket.on('incomingCall', onIncomingCall);
    return () => socket.off('incomingCall', onIncomingCall);
  }, [socket]);

  // Listen for trickle ICE candidate messages from peer
  useEffect(() => {
    if (!socket) return;

    const handleCandidate = (data) => {
      if (videoCallRef.current?.handleIceCandidate) {
        videoCallRef.current.handleIceCandidate(data);
      }
    };

    socket.on('iceCandidate', handleCandidate);
    return () => socket.off('iceCandidate', handleCandidate);
  }, [socket]);

  useEffect(() => {
    let timer;
    if (videoCall.callStarted) {
      const startTime = videoCall.callStartTime || Date.now();
      if (!videoCall.callStartTime && typeof videoCall.setCallStartTime === 'function') {
        videoCall.setCallStartTime(startTime);
      }

      const updateDuration = () => {
        const currentStart = videoCall.callStartTime || startTime;
        const diff = Math.max(0, Math.floor((Date.now() - currentStart) / 1000));
        const min = String(Math.floor(diff / 60)).padStart(2, '0');
        const sec = String(diff % 60).padStart(2, '0');
        videoCall.setCallDuration(`${min}:${sec}`);
      };

      updateDuration();
      timer = setInterval(updateDuration, 1000);
    } else {
      videoCall.setCallDuration('00:00');
    }
    return () => clearInterval(timer);
  }, [videoCall.callStarted, videoCall.callStartTime, videoCall.setCallDuration, videoCall.setCallStartTime]);

  // Keep ref always pointing to the latest handleCallEnd so the socket listener never goes stale
  useEffect(() => {
    handleCallEndRef.current = handleCallEnd;
  }, [handleCallEnd]);

  useEffect(() => {
    if (!socket) return;

    const handleEndCallFromPeer = () => {
      console.log('📴 [Socket] Received callEnded event from peer - closing UI');
      // Use ref so we always call the latest version regardless of closure age
      if (handleCallEndRef.current) {
        handleCallEndRef.current(true);
      }
    };

    console.log('🔔 Setting up callEnded listener');
    socket.on('callEnded', handleEndCallFromPeer);

    return () => {
      console.log('🔔 Removing callEnded listener');
      socket.off('callEnded', handleEndCallFromPeer);
    };
  }, [socket]); // ✅ Depends only on socket — ref keeps handleCallEnd fresh without re-registering

  // Listen for busy signal (simultaneous calls detected)
  useEffect(() => {
    if (!socket) return;

    const handleBusySignal = (data) => {
      console.log('🚫 [Socket] Received callBusy signal:', data);
      if (videoCallRef.current?.handleBusyCall) {
        videoCallRef.current.handleBusyCall(data);
      }
    };

    console.log('🔔 Setting up callBusy listener');
    socket.on('callBusy', handleBusySignal);

    return () => {
      console.log('🔔 Removing callBusy listener');
      socket.off('callBusy', handleBusySignal);
    };
  }, [socket]);

  // Listen for ringing signal (when receiver device is online and ringing)
  useEffect(() => {
    if (!socket) return;

    const handleRingingSignal = (data) => {
      console.log('🔔 [Socket] Received callRinging signal:', data);
      if (videoCallRef.current?.handleCallRinging) {
        videoCallRef.current.handleCallRinging(data);
      }
    };

    console.log('🔔 Setting up callRinging listener');
    socket.on('callRinging', handleRingingSignal);

    return () => {
      console.log('🔔 Removing callRinging listener');
      socket.off('callRinging', handleRingingSignal);
    };
  }, [socket]);

  // Handle auto-ending states (rejection, timeout) for logging - Caller side only
  useEffect(() => {
    if ((videoCall.callRejected || videoCall.callingTimeout) && !videoCall.callAccepted) {
      console.log('📋 Auto-logging call end from caller side (Rejected/Timeout)');
      handleCallEnd();
    }
  }, [videoCall.callRejected, videoCall.callingTimeout, videoCall.callAccepted, handleCallEnd]);

  // Standalone SQLite DB initialization on mount
  useEffect(() => {
    initCallLogsDb();
    // ⚡ FIX 3: Trigger ICE/TURN pre-warm on first mount so the first real call is never a cold start.
    // Non-blocking — runs silently in the background, closes the throwaway PC when done.
    prewarmIceAndTurn(rtcConfig);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoCall,
    initiateCallHandler,
    handleCallEnd,
    answerCallHandler,
    prewarmCallerMedia: videoCall.prewarmCallerMedia // ⚡ Expose pre-warm for call button trigger
  };
};
