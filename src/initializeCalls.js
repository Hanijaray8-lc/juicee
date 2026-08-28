import { useEffect, useCallback, useRef } from 'react';
import useVideoCall from './VideoCall';
import { generateUniqueNumericId } from './utils/uniqueIdGenerator';
import API_BASE_URL from './config/apiConfig';

/**
 * Custom hook to initialize video/audio call configurations, socket listeners,
 * proximity sensors, and wrapper handlers for ChatPage.
 */
export const useInitializeCalls = (socket, user, selectedUser, dbFriends, setCallLogs) => {
  const loggingLockRef = useRef(false);

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
      } else {
        console.error('Failed to save call log to backend');
      }
    } catch (error) {
      console.error('Error saving call log to backend:', error);
    }
  };

  // Add call log locally to the state
  const addCallLog = useCallback((log) => {
    setCallLogs(prev => [
      {
        ...log,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        id: generateUniqueNumericId()
      },
      ...prev
    ]);
  }, [setCallLogs]);

  // ICE servers for NAT traversal and fallback relay
  const iceServers = [
    // STUN servers for direct NAT traversal
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    },
    // TURN servers for relay fallback (supporting UDP & TCP)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: [
        'turn:global.relay.metered.ca:80',
        'turn:global.relay.metered.ca:443',
        'turn:global.relay.metered.ca:443?transport=tcp'
      ],
      username: 'cfb9d79f53f4d7f0ca10c84f',
      credential: 'r3k0rWoUV9pYx/k+'
    }
  ];

  // Initialize video call hook (must be after `iceServers` is defined)
  const videoCall = useVideoCall(socket, user, selectedUser, dbFriends, iceServers);

  // Proximity sensor for screen off during audio calls via Capacitor plugin
  useEffect(() => {
    let proximityEnabled = false;

    const setupProximity = async () => {
      try {
        const { CapacitorProximity } = await import('@capgo/capacitor-proximity');
        const status = await CapacitorProximity.getStatus();
        if (status.available) {
          if (videoCall && videoCall.callStarted && videoCall.callType === 'audio' && !videoCall.isSpeakerOn) {
            await CapacitorProximity.enable();
            proximityEnabled = true;
          } else {
            await CapacitorProximity.disable();
            proximityEnabled = false;
          }
        }
      } catch (err) {
        console.warn('Capacitor Proximity not available:', err);
      }
    };

    setupProximity();

    return () => {
      if (proximityEnabled) {
        import('@capgo/capacitor-proximity').then(({ CapacitorProximity }) => {
          CapacitorProximity.disable().catch(() => { });
        }).catch(() => { });
      }
    };
  }, [videoCall]);

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
  const handleCallEnd = useCallback(async () => {
    // 1. Guard Clause - If we've already logged this call, or there's no active call, skip
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
      const callLogData = isCaller ? {
        callerId: currentUserId,
        receiverId: otherUserId,
        callType: videoCall.callType || 'audio',
        status: callStatus,
        duration: callDurationSeconds,
        startTime: videoCall.callStartTime ? new Date(videoCall.callStartTime) : new Date(),
        endTime: new Date()
      } : {
        callerId: otherUserId,
        receiverId: currentUserId,
        callType: videoCall.callType || 'audio',
        status: callStatus,
        duration: callDurationSeconds,
        startTime: videoCall.callStartTime ? new Date(videoCall.callStartTime) : new Date(),
        endTime: new Date()
      };

      saveCallLogToBackend(callLogData);
    }

    // Dismiss call notification immediately when call ends
    if (typeof videoCall.dismissCallNotification === 'function') {
      videoCall.dismissCallNotification();
    }
    // End the video call in the hook (this will emit endCall to peer)
    videoCall.endCall();
  }, [videoCall, selectedUser]);

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

    socket.on('incomingCall', videoCall.handleIncomingCall);
    return () => socket.off('incomingCall', videoCall.handleIncomingCall);
  }, [socket, videoCall]);

  // Listen for trickle ICE candidate messages from peer
  useEffect(() => {
    if (!socket || !videoCall.handleIceCandidate) return;

    const handleCandidate = (data) => {
      videoCall.handleIceCandidate(data);
    };

    socket.on('iceCandidate', handleCandidate);
    return () => socket.off('iceCandidate', handleCandidate);
  }, [socket, videoCall]);

  useEffect(() => {
    let timer;
    if (videoCall.callStarted && videoCall.callStartTime) {
      timer = setInterval(() => {
        const diff = Math.floor((Date.now() - videoCall.callStartTime) / 1000);
        const min = String(Math.floor(diff / 60)).padStart(2, '0');
        const sec = String(diff % 60).padStart(2, '0');
        videoCall.setCallDuration(`${min}:${sec}`);
      }, 1000);
    } else {
      videoCall.setCallDuration('00:00');
    }
    return () => clearInterval(timer);
  }, [videoCall.callStarted, videoCall.callStartTime, videoCall]);

  useEffect(() => {
    if (!socket) return;

    const handleEndCallFromPeer = () => {
      console.log('📴 [Socket] Received callEnded event from peer - closing UI');
      handleCallEnd();
    };

    console.log('🔔 Setting up callEnded listener');
    socket.on('callEnded', handleEndCallFromPeer);

    return () => {
      console.log('🔔 Removing callEnded listener');
      socket.off('callEnded', handleEndCallFromPeer);
    };
  }, [socket, handleCallEnd]);

  // Listen for busy signal (simultaneous calls detected)
  useEffect(() => {
    if (!socket || !videoCall.handleBusyCall) return;

    const handleBusySignal = (data) => {
      console.log('🚫 [Socket] Received callBusy signal:', data);
      videoCall.handleBusyCall(data);
    };

    console.log('🔔 Setting up callBusy listener');
    socket.on('callBusy', handleBusySignal);

    return () => {
      console.log('🔔 Removing callBusy listener');
      socket.off('callBusy', handleBusySignal);
    };
  }, [socket, videoCall]);

  // Handle auto-ending states (rejection, timeout) for logging - Caller side only
  useEffect(() => {
    if ((videoCall.callRejected || videoCall.callingTimeout) && !videoCall.callAccepted) {
      console.log('📋 Auto-logging call end from caller side (Rejected/Timeout)');
      handleCallEnd();
    }
  }, [videoCall.callRejected, videoCall.callingTimeout, videoCall.callAccepted, handleCallEnd]);

  return {
    videoCall,
    initiateCallHandler,
    handleCallEnd,
    answerCallHandler
  };
};
