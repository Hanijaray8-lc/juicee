import { useRef, useState, useCallback, useEffect } from 'react';
import Peer from 'simple-peer';

/**
 * Custom hook for WebRTC video call management
 * Handles video/audio call initiation, answering, and stream management
 */
const useVideoCall = (socket, user, selectedUser, dbFriends, iceServers) => {
  const userVideo = useRef();
  const selfVideoRef = useRef(); // Self-view (own camera feed like WhatsApp)
  const remoteAudioRef = useRef(null);
  const callerAudioRef = useRef(null);
  const receiverAudioRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null); // ✅ NEW: Track remote WebRTC stream state
  const [call, setCall] = useState({});
  // separate Peer instance state so `call` can remain metadata used by the UI
  const [peerInstance, setPeerInstance] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callerId, setCallerId] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callRejected, setCallRejected] = useState(false);
  const [callBusy, setCallBusy] = useState(false); // ✅ NEW: Track busy signal
  const [busyAutoEndTimer, setBusyAutoEndTimer] = useState(null); // ✅ NEW: Timer ref for 5sec auto-end
  const [callingTimeout, setCallingTimeout] = useState(false); // ✅ NEW: 30-sec calling timeout
  const callingTimeoutTimerRef = useRef(null); // ✅ NEW: Timeout timer ref
  const [callStarted, setCallStarted] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState('00:00');
  const [callType, setCallType] = useState('audio'); // 'audio' or 'video'
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const cameraFacing = isFrontCamera ? 'user' : 'environment';
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const switchingCameraRef = useRef(false);
  const [isMicrophoneMuted, setIsMicrophoneMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [remoteGainNode, setRemoteGainNode] = useState(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true); // ✅ NEW: Speaker phone state for Android
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false); // ✅ NEW: Track remote audio mute state
  const [audioRoutingMode, setAudioRoutingMode] = useState('speaker'); // 'speaker' or 'earpiece' for Android
  const [userAcceptedCall, setUserAcceptedCall] = useState(false); // Track deferred accept state
  const ringtoneShouldPlayRef = useRef(false);
  const prewarmedStreamRef = useRef(null);
  const prewarmedPromiseRef = useRef(null);
  const isIncomingCallActiveRef = useRef(false);

  /**
   * ✅ ENHANCED: Initialize Web Audio API with retries and better error handling
   */
  const initAudioContext = useCallback(async (retries = 3) => {
    if (audioContext && audioContext.state !== 'closed') {
      console.log('✅ Audio context already initialized');
      return audioContext;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔊 Attempt ${attempt}/${retries} to initialize audio context`);
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 1.0;

        // Resume if suspended (critical for mobile after long delays)
        if (ctx.state === 'suspended') {
          console.log('🔄 Audio context suspended, resuming...');
          await ctx.resume();
          console.log('✅ Audio context resumed');
        } else {
          console.log('✅ Audio context initialized (state: ' + ctx.state + ')');
        }

        setAudioContext(ctx);
        setRemoteGainNode(gainNode);
        return ctx;
      } catch (err) {
        console.warn(`⚠️ Audio context init attempt ${attempt} failed:`, err.message);
        if (attempt < retries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    console.warn('❌ Failed to initialize audio context after ' + retries + ' attempts');
    return null;
  }, [audioContext]);

  /**
   * ✅ ENHANCED: Apply audio routing via Capacitor AudioSession and browser setSinkId
   * For video calls: route to speaker (loudspeaker), volume keys = media volume
   * For audio calls: route to earpiece by default, volume keys = call volume
   */
  const applyAudioRouting = useCallback((mode, forCallType) => {
    console.log(`🔊 applyAudioRouting: mode=${mode}, callType=${forCallType}`);

    // 1. Capacitor Native Android routing (Custom AudioRoutePlugin and legacy fallbacks)
    try {
      if (typeof window !== 'undefined' && window.Capacitor) {
        // Custom plugin created for direct AudioManager speaker/earpiece control
        const { AudioRoute } = window.Capacitor.Plugins || {};
        if (AudioRoute && typeof AudioRoute.setSpeakerphoneOn === 'function') {
          AudioRoute.setSpeakerphoneOn({ playOnSpeaker: mode === 'speaker' })
            .then(res => console.log(`📱 Capacitor AudioRoute: successfully routed to ${res.mode}`))
            .catch(err => console.warn('📱 Capacitor AudioRoute error:', err));
        }

        const { AudioSession } = window.Capacitor.Plugins || {};
        if (AudioSession && typeof AudioSession.setCategory === 'function') {
          if (mode === 'speaker') {
            AudioSession.setCategory({
              usage: forCallType === 'video' ? 'media' : 'voice_communication',
              options: ['default_to_speaker']
            });
            console.log('📱 Capacitor AudioSession: routed to SPEAKER');
          } else {
            AudioSession.setCategory({
              usage: 'voice_communication',
              options: [] // earpiece
            });
            console.log('📱 Capacitor AudioSession: routed to EARPIECE');
          }
        }

        // Set volume stream: media for video/speaker, voice_call for audio earpiece
        const { VolumeControl } = window.Capacitor.Plugins || {};
        if (VolumeControl && typeof VolumeControl.setVolumeStream === 'function') {
          const stream = (mode === 'speaker') ? 'music' : 'voice_call';
          VolumeControl.setVolumeStream({ stream });
          console.log(`📱 Volume stream set to: ${stream}`);
        }
      }
    } catch (err) {
      console.warn('⚠️ Capacitor audio routing failed:', err.message);
    }

    // 2. Web Browser Fallback: Route via HTML5 setSinkId if supported
    if (remoteAudioRef.current && typeof remoteAudioRef.current.setSinkId === 'function' && navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const outputs = devices.filter(d => d.kind === 'audiooutput');
          const targetDevice = outputs.find(d => {
            const label = d.label.toLowerCase();
            if (mode === 'speaker') {
              return label.includes('speaker') || label.includes('loud') || label.includes('external');
            } else {
              return label.includes('earpiece') || label.includes('handset') || label.includes('receiver') || label.includes('phone');
            }
          });

          if (targetDevice) {
            remoteAudioRef.current.setSinkId(targetDevice.deviceId)
              .then(() => console.log(`✅ Browser: routed audio to ${targetDevice.label}`))
              .catch(err => console.warn('setSinkId failed:', err));
          }
        })
        .catch(err => console.warn('enumerateDevices failed:', err));
    }
  }, []);

  /**
   * Get or create a global HTML5 audio element for playing remote audio
   */
  const getOrCreateRemoteAudio = useCallback(() => {
    if (!remoteAudioRef.current && typeof document !== 'undefined') {
      let el = document.getElementById('juicy-remote-audio-element');
      if (!el) {
        el = document.createElement('audio');
        el.id = 'juicy-remote-audio-element';
        el.autoplay = true;
        el.playsInline = true;
        el.style.display = 'none';
        document.body.appendChild(el);
      }
      remoteAudioRef.current = el;
    }
    return remoteAudioRef.current;
  }, []);

  /**
   * ✅ ENHANCED: Play remote stream directly through HTML5 audio element
   */
  const playRemoteAudio = useCallback(async (remoteStreamToPlay) => {
    const targetStream = remoteStreamToPlay || remoteStream;
    if (!targetStream) {
      console.warn('⚠️ No remote stream to play');
      return;
    }

    try {
      // Verify stream has audio tracks
      const audioTracks = targetStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️ Remote stream has no audio tracks');
        return;
      }

      // CRITICAL: Enable ALL audio tracks explicitly
      audioTracks.forEach((track, idx) => {
        track.enabled = true;
        console.log(`✅ Audio track ${idx} enabled (id: ${track.id}, state: ${track.readyState})`);
      });

      // Play through HTML audio element directly
      const audioEl = getOrCreateRemoteAudio();
      if (audioEl) {
        console.log('🔊 Playing remote audio stream via HTML element');
        if (audioEl.srcObject !== targetStream) {
          audioEl.srcObject = targetStream;
        }
        audioEl.muted = remoteAudioMuted;
        audioEl.volume = 1.0;
        audioEl.autoplay = true;

        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log('✅ Remote audio playing successfully'))
            .catch(err => console.warn('⚠️ Remote audio autoplay failed:', err));
        }
      }
    } catch (err) {
      console.error('❌ Error playing remote audio:', err);
    }
  }, [remoteStream, remoteAudioMuted, getOrCreateRemoteAudio]);

  /**
   * Handle incoming trickle ICE candidates from remote peer
   */
  const handleIceCandidate = useCallback(({ from, candidate }) => {
    if (!candidate) return;
    console.log('📡 Received trickle ICE candidate from:', from);

    // Format signal to ensure RTCIceCandidateInit object is passed to simple-peer
    let signalData = candidate;
    if (typeof candidate === 'string') {
      try {
        signalData = JSON.parse(candidate);
      } catch (e) {
        signalData = { type: 'candidate', candidate: { candidate: candidate } };
      }
    }

    if (signalData && typeof signalData.candidate === 'string') {
      // unwrapped object like { candidate: "candidate:...", sdpMid: "0", sdpMLineIndex: 0 }
      signalData = { type: 'candidate', candidate: signalData };
    } else if (signalData && !signalData.type && signalData.candidate && typeof signalData.candidate === 'object') {
      signalData = { type: 'candidate', candidate: signalData.candidate };
    }

    if (peerRef.current && !peerRef.current.destroyed) {
      try {
        peerRef.current.signal(signalData);
        console.log('✅ Applied trickle ICE candidate directly');
      } catch (err) {
        console.warn('⚠️ Error signaling trickle ICE candidate:', err.message);
      }
    } else {
      console.log('⏳ Peer connection not ready yet - queuing trickle candidate');
      pendingCandidatesRef.current.push(signalData);
    }
  }, []);

  /**
   * Process any buffered trickle ICE candidates queued prior to peer initialization
   */
  const processPendingCandidates = useCallback(() => {
    if (peerRef.current && !peerRef.current.destroyed && pendingCandidatesRef.current.length > 0) {
      console.log(`🧹 Processing ${pendingCandidatesRef.current.length} queued ICE candidate(s)`);
      while (pendingCandidatesRef.current.length > 0) {
        const cand = pendingCandidatesRef.current.shift();
        try {
          peerRef.current.signal(cand);
          console.log('✅ Applied queued trickle ICE candidate');
        } catch (err) {
          console.warn('⚠️ Error applying queued candidate:', err.message);
        }
      }
    }
  }, []);

  /**
   * Deterministically attach stream, start audio playback, and enforce Android audio routing
   */
  const ensureAudioPlayingAndRouted = useCallback((remoteStreamToAttach, wantVideo) => {
    if (!remoteStreamToAttach) return;
    console.log(`🎙️ ensureAudioPlayingAndRouted triggered (wantVideo=${wantVideo})`);
    setRemoteStream(remoteStreamToAttach);

    // 1. Explicitly enable all audio & video tracks
    remoteStreamToAttach.getAudioTracks().forEach((track, idx) => {
      track.enabled = true;
      console.log(`   ✅ Audio track ${idx} enabled: ${track.id} (${track.readyState})`);
    });

    remoteStreamToAttach.getVideoTracks().forEach((track, idx) => {
      track.enabled = true;
      console.log(`   ✅ Video track ${idx} enabled: ${track.id} (${track.readyState})`);
    });

    // 2. Initialize/resume audio context
    initAudioContext();

    const mode = wantVideo ? 'speaker' : 'earpiece';

    // 3. Play audio stream via HTML5 audio element
    playRemoteAudio(remoteStreamToAttach);

    // 4. Attach stream to userVideo element if ready
    if (wantVideo && userVideo.current) {
      try {
        userVideo.current.srcObject = remoteStreamToAttach;
        userVideo.current.autoplay = true;
        userVideo.current.playsinline = true;
        userVideo.current.muted = true; // ✅ Video element MUST be muted for mobile autoplay compliance
        userVideo.current.controls = false;
        const p = userVideo.current.play();
        if (p !== undefined) {
          p.then(() => console.log('✅ Remote video playback started')).catch(e => console.warn('⚠️ Remote video autoplay failed:', e));
        }
      } catch (e) {
        console.error('❌ Error attaching video stream:', e);
      }
    }

    // 5. Trigger audio routing
    applyAudioRouting(mode, wantVideo ? 'video' : 'audio');
    setTimeout(() => applyAudioRouting(mode, wantVideo ? 'video' : 'audio'), 300);
    setTimeout(() => applyAudioRouting(mode, wantVideo ? 'video' : 'audio'), 800);
    setTimeout(() => applyAudioRouting(mode, wantVideo ? 'video' : 'audio'), 1200);
  }, [initAudioContext, playRemoteAudio, applyAudioRouting]);

  // 🎙️ Reactive remote stream attachment & playback lifecycle effect
  useEffect(() => {
    if (remoteStream) {
      console.log('🎙️ [Effect] Remote stream active - ensuring track states and playback');

      // 1. Enable tracks
      remoteStream.getAudioTracks().forEach(t => { t.enabled = true; });
      remoteStream.getVideoTracks().forEach(t => { t.enabled = true; });

      // 2. Play audio via hidden audio element
      const audioEl = getOrCreateRemoteAudio();
      if (audioEl) {
        if (audioEl.srcObject !== remoteStream) {
          audioEl.srcObject = remoteStream;
        }
        audioEl.muted = remoteAudioMuted;
        audioEl.volume = 1.0;
        audioEl.play().catch(e => console.warn('⚠️ Audio element play failed in effect:', e));
      }

      // 3. Attach userVideo element if mounted
      if (callType === 'video' && userVideo.current) {
        if (userVideo.current.srcObject !== remoteStream) {
          userVideo.current.srcObject = remoteStream;
        }
        userVideo.current.muted = true; // ✅ Video element MUST be muted for mobile autoplay compliance
        userVideo.current.play().catch(e => console.warn('⚠️ Video element play failed in effect:', e));
      }
    }
  }, [remoteStream, callType, remoteAudioMuted, getOrCreateRemoteAudio]);

  /**
   * Initiate a call (audio or video)
   * @param {string} friendId - ID of friend to call
   * @param {string} type - Call type: 'audio' or 'video'
   */
  const initiateCall = useCallback(
    async (friendId, type = 'audio') => {
      if (!socket || !user) return;
      setIsFrontCamera(true); // Ensure front camera opens by default when starting a call!
      setCalling(true);
      setCallRejected(false);
      setCallType(type || 'audio');

      // ✅ Set default audio routing: speaker for video calls, earpiece for audio calls
      const isVideo = (type === 'video');
      setIsSpeakerOn(isVideo);
      setAudioRoutingMode(isVideo ? 'speaker' : 'earpiece');

      // Apply audio routing immediately for both call types
      applyAudioRouting(isVideo ? 'speaker' : 'earpiece', type);

      // Initialize audio context early for better audio playback
      initAudioContext();

      try {
        // Request media based on call type with retry logic
        let currentStream = null;
        let retries = 3;

        while (retries > 0 && !currentStream) {
          try {
            // ✅ ENHANCED: Android-optimized fast media constraints
            const constraints = {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: type === 'video' ? {
                width: { ideal: 1280, min: 640, max: 1920 },
                height: { ideal: 720, min: 480, max: 1080 },
                facingMode: cameraFacing,
                frameRate: { ideal: 30, min: 15, max: 60 },
              } : false,
            };
            console.log('🎤 Requesting media for', type, 'call with constraints:', constraints);
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Got media stream successfully');
            console.log('   Audio tracks:', currentStream.getAudioTracks().length);
            console.log('   Video tracks:', currentStream.getVideoTracks().length);

            // Verify audio is enabled
            currentStream.getAudioTracks().forEach((track, idx) => {
              track.enabled = true;
              console.log(`   ✅ Audio track ${idx} enabled (${track.label})`);
            });
            break;
          } catch (err) {
            if (err.name === 'OverconstrainedError') {
              console.warn('⚠️ OverconstrainedError detected in initiateCall, falling back to basic media constraints');
              try {
                currentStream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: type === 'video' ? true : false,
                });
                break;
              } catch (fallbackErr) {
                console.error('Fallback getUserMedia failed:', fallbackErr);
              }
            }
            retries--;
            if (retries > 0) {
              console.warn(`⚠️ Media request failed, retrying... (${retries} attempts left):`, err.message);
              // Wait 500ms before retry
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              throw err;
            }
          }
        }

        setStream(currentStream);

        // Play caller ringtone
        if (callerAudioRef.current) {
          callerAudioRef.current.currentTime = 0;
          callerAudioRef.current.play().catch(err => console.warn('Ringtone play failed:', err));
        }

        // Create peer connection as initiator with trickle: true and pre-gathered candidate pool
        const peer = new Peer({
          initiator: true,
          trickle: true,
          stream: currentStream,
          config: {
            iceServers,
            iceCandidatePoolSize: 2,
          },
        });
        peerRef.current = peer;

        // Handle signal generation (send offer or trickle candidate to peer)
        peer.on('signal', data => {
          if (data.type === 'offer') {
            console.log('📤 Sending SDP offer signal to:', friendId, 'from:', String(user._id));
            socket.emit('callUser', {
              to: String(friendId),
              from: String(user._id),
              callerName: user.username,
              signal: data,
              callType: type
            });
          } else if (data.candidate) {
            console.log('📤 Sending trickle ICE candidate to:', friendId);
            socket.emit('iceCandidate', {
              to: String(friendId),
              candidate: data
            });
          } else {
            console.log('📤 Sending call signal to:', friendId);
            socket.emit('callUser', {
              to: String(friendId),
              from: String(user._id),
              callerName: user.username,
              signal: data,
              callType: type
            });
          }
        });

        // Handle peer connection established
        peer.on('connect', () => {
          console.log('✅ Peer connection established (initiator side)');
        });

        // Handle peer errors
        peer.on('error', err => {
          console.error('❌ Peer connection error (initiator):', err);
        });

        // Handle remote stream reception
        peer.on('stream', remoteStream => {
          console.log('🎙️ Received remote stream in initiateCall');
          ensureAudioPlayingAndRouted(remoteStream, type === 'video');
        });

        // Handle call acceptance (receive answer)
        socket.once('callAccepted', signal => {
          console.log('✅ Call accepted!');

          // Clear calling timeout since call was answered
          if (callingTimeoutTimerRef.current) {
            clearTimeout(callingTimeoutTimerRef.current);
            callingTimeoutTimerRef.current = null;
          }

          setCallAccepted(true);
          setCallStarted(true);
          setCallStartTime(Date.now());
          setCallingTimeout(false);
          peer.signal(signal);
          processPendingCandidates();
          setCalling(false);
          if (callerAudioRef.current) callerAudioRef.current.pause();

          // ✅ CRITICAL: Re-assert audio routing immediately.
          // When callerAudioRef pauses, Android native bridge calls caller.stop() which resets MODE_NORMAL.
          // Re-asserting applyAudioRouting restores MODE_IN_COMMUNICATION & VoIP focus so microphone stays unmuted!
          const isVideoCall = (type === 'video');
          const targetMode = isVideoCall ? 'speaker' : 'earpiece';
          applyAudioRouting(targetMode, type);
          setTimeout(() => applyAudioRouting(targetMode, type), 150);
          setTimeout(() => applyAudioRouting(targetMode, type), 600);
        });

        // Handle call rejection
        socket.once('callRejected', () => {
          console.log('❌ Call rejected');

          // Clear calling timeout
          if (callingTimeoutTimerRef.current) {
            clearTimeout(callingTimeoutTimerRef.current);
            callingTimeoutTimerRef.current = null;
          }

          setCalling(false);
          setCallRejected(true);
          setCallingTimeout(false);
          setTimeout(() => setCallRejected(false), 2000);
          if (callerAudioRef.current) callerAudioRef.current.pause();
          currentStream.getTracks().forEach(track => track.stop());
          setStream(null);
          setRemoteStream(null); // ✅ Clear remote stream state
        });

        // ✅ NEW: Set 30-second calling timeout - auto-end if no answer
        const timeoutTimer = setTimeout(() => {
          console.log('⏰ 30 seconds elapsed - call not answered, auto-ending');
          setCallingTimeout(true);
          setCalling(false);

          if (callerAudioRef.current) callerAudioRef.current.pause();
          if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
          setRemoteStream(null); // ✅ Clear remote stream state

          // Show timeout message for 2 seconds then clear
          setTimeout(() => {
            setCallingTimeout(false);
            setCall({});
          }, 2000);
        }, 30000); // 30 seconds

        callingTimeoutTimerRef.current = timeoutTimer;

        // store Peer instance separately (preserve `call` metadata)
        setPeerInstance(peer);
        peerRef.current = peer;
      } catch (err) {
        console.error('❌ Call initiation error:', err);
        setCalling(false);
        // User-friendly error messages
        if (err.name === 'NotAllowedError') {
          alert('Camera/microphone permission denied. Please allow access in browser settings and try again.');
        } else if (err.name === 'NotFoundError') {
          alert('Camera/microphone not found on your device.');
        } else if (err.name === 'NotReadableError') {
          alert('Cannot access camera. It may be in use by another app or browser tab. Close other browser tabs using the camera and try again.');
        } else if (err.name === 'OverconstrainedError') {
          alert('Camera does not support requested resolution. Trying with basic settings...');
          // Fallback to basic constraints without specific resolution
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: type === 'video' ? true : false,
            });
            setStream(basicStream);
            setCalling(true);
            // Continue call setup with fallback stream (will be retried on next call)
            console.log('Using fallback camera settings (no specific resolution)');
          } catch (fallbackErr) {
            console.error('Fallback also failed:', fallbackErr);
            alert('Could not access media. Please check device settings.');
          }
        } else {
          alert('Error accessing camera/microphone: ' + err.message);
        }
      }
    },
    [socket, user, iceServers, cameraFacing]
  );

  /**
   * Dismiss active call notifications (Capacitor custom and standard fallback)
   */
  const dismissCallNotification = useCallback((cId) => {
    const activeId = cId || callerId || call?.from || selectedUser?._id;
    if (!activeId) {
      console.log('⚠️ dismissCallNotification: no active ID found');
      return;
    }

    if (typeof window !== 'undefined' && window.Capacitor) {
      const { AudioRoute, PushNotifications } = window.Capacitor.Plugins || {};
      const javaHashCode = (str) => {
        if (!str) return 0;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (31 * hash + str.charCodeAt(i)) | 0;
        }
        return hash;
      };
      const notificationId = Math.abs(javaHashCode(String(activeId)));
      console.log('📱 Calculated notificationId to dismiss:', notificationId, 'for activeId:', activeId);

      if (AudioRoute && typeof AudioRoute.dismissNotification === 'function') {
        AudioRoute.dismissNotification({ id: String(notificationId) })
          .then(() => console.log('📱 Capacitor AudioRoute: successfully dismissed call notification:', notificationId))
          .catch(err => console.warn('📱 Capacitor AudioRoute dismissNotification error:', err));
      }

      if (PushNotifications && typeof PushNotifications.removeDeliveredNotifications === 'function' &&
          window.Capacitor.isPluginAvailable('PushNotifications')) {
        PushNotifications.removeDeliveredNotifications({
          notifications: [{ id: String(notificationId) }]
        })
          .then(() => console.log('📱 Capacitor PushNotifications: removed call notification:', notificationId))
          .catch(err => console.warn('📱 Capacitor PushNotifications removeDeliveredNotifications error:', err));
      }
    }
  }, [callerId, call, selectedUser]);

  const answerCall = useCallback(async () => {
    if (!socket) return;
    ringtoneShouldPlayRef.current = false;

    // Clear notification immediately when answering call
    dismissCallNotification(callerId || call?.from);

    if (!callerSignal) {
      console.log('⏳ Accept clicked, but WebRTC offer signal not loaded yet. Waiting for signal...');
      setUserAcceptedCall(true);
      return;
    }

    // Initialize audio context early for better audio playback
    initAudioContext();

    try {
      // Determine if answering with video
      const wantVideo = callType === 'video' || call?.callType === 'video';

      // ✅ Set default audio routing based on answered call type
      setIsSpeakerOn(wantVideo);
      setAudioRoutingMode(wantVideo ? 'speaker' : 'earpiece');

      // Apply audio routing for answered call type
      applyAudioRouting(wantVideo ? 'speaker' : 'earpiece', wantVideo ? 'video' : 'audio');

      // ⚡ INSTANT MEDIA: Check if pre-warmed stream from ringing phase is ready
      isIncomingCallActiveRef.current = false;
      let currentStream = prewarmedStreamRef.current;
      if (!currentStream && prewarmedPromiseRef.current) {
        console.log('⏳ Awaiting in-flight pre-warmed media stream...');
        try {
          currentStream = await prewarmedPromiseRef.current;
        } catch (e) {
          currentStream = null;
        }
      }

      // Check if pre-warmed stream is valid and active
      const isPrewarmedValid = currentStream &&
        currentStream.getAudioTracks().some(t => t.readyState === 'live') &&
        (!wantVideo || currentStream.getVideoTracks().some(t => t.readyState === 'live'));

      if (isPrewarmedValid) {
        console.log('⚡ Instant connect: Using pre-warmed media stream (0ms hardware latency)!');
        prewarmedStreamRef.current = null;
        prewarmedPromiseRef.current = null;
      } else {
        console.log('🎙️ Pre-warmed stream not ready or invalid, acquiring media directly...');
        // Request media stream (audio + optional video) with retry logic
        let retries = 3;
        currentStream = null;

        while (retries > 0 && !currentStream) {
          try {
            // ✅ ENHANCED: Fast Android-optimized media constraints for answer
            const constraints = {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: wantVideo ? {
                width: { ideal: 1280, min: 640, max: 1920 },
                height: { ideal: 720, min: 480, max: 1080 },
                facingMode: cameraFacing,
                frameRate: { ideal: 30, min: 15, max: 60 },
              } : false,
            };
            console.log('📹 Requesting media with constraints:', constraints);
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Got media stream successfully');
            break;
          } catch (err) {
            if (err.name === 'OverconstrainedError') {
              console.warn('⚠️ OverconstrainedError detected in answerCall, falling back to basic media constraints');
              try {
                currentStream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: wantVideo ? true : false,
                });
                break;
              } catch (fallbackErr) {
                console.error('Fallback getUserMedia failed:', fallbackErr);
              }
            }
            retries--;
            if (retries > 0) {
              console.warn(`⚠️ Media request failed, retrying... (${retries} attempts left):`, err.message);
              // Wait 500ms before retry
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              throw err;
            }
          }
        }
      }

      setStream(currentStream);

      // Create peer connection as non-initiator with trickle: true and pre-gathered candidate pool
      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: currentStream,
        config: {
          iceServers,
          iceCandidatePoolSize: 2,
        },
      });
      peerRef.current = peer;

      // Send answer signal or trickle candidate back to caller
      peer.on('signal', data => {
        if (data.type === 'answer') {
          console.log('📤 Sending answer SDP signal to caller:', String(callerId));
          socket.emit('answerCall', {
            to: String(callerId), // ✅ CRITICAL: Ensure callerId is String
            signal: data
          });
        } else if (data.candidate) {
          console.log('📤 Sending trickle ICE candidate to caller:', String(callerId));
          socket.emit('iceCandidate', {
            to: String(callerId),
            candidate: data
          });
        } else {
          console.log('📤 Sending answer signal to caller:', String(callerId));
          socket.emit('answerCall', {
            to: String(callerId),
            signal: data
          });
        }
      });

      // Handle peer connection established
      peer.on('connect', () => {
        console.log('✅ Peer connection established (answerer side)');
      });

      // Handle peer errors
      peer.on('error', err => {
        console.error('❌ Peer connection error (answerer):', err);
      });

      // Receive remote stream
      peer.on('stream', remoteStream => {
        console.log('🎙️ Received remote stream in answerCall');
        ensureAudioPlayingAndRouted(remoteStream, wantVideo);
      });

      // Connect to caller's offer signal
      peer.signal(callerSignal);
      processPendingCandidates();

      // Update states
      setCallAccepted(true);
      setReceivingCall(false);
      setCallStarted(true);
      setCallStartTime(Date.now());
      // store Peer instance separately (do not overwrite `call` metadata)
      setPeerInstance(peer);

      if (receiverAudioRef.current) {
        receiverAudioRef.current.pause();
        receiverAudioRef.current.currentTime = 0;
      }

      console.log('✅ Call answered successfully');
    } catch (err) {
      console.error('❌ Error answering call:', err);
      setReceivingCall(false);
      setCall({});
      if (err.name === 'NotAllowedError') {
        alert('Camera/microphone permission denied. Please allow access in browser settings.');
      } else if (err.name === 'NotFoundError') {
        alert('Camera/microphone not found on your device.');
      } else if (err.name === 'NotReadableError') {
        alert('Cannot access camera. It may be in use by another app or browser tab.');
      } else {
        alert('Error accessing media: ' + err.message);
      }
    }
  }, [socket, callerSignal, callerId, callType, call, iceServers, cameraFacing, ensureAudioPlayingAndRouted, processPendingCandidates, dismissCallNotification, initAudioContext, applyAudioRouting]);

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback(() => {
    isIncomingCallActiveRef.current = false;
    // ⚡ Clean up any pre-warmed media stream immediately
    if (prewarmedStreamRef.current) {
      try {
        prewarmedStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      prewarmedStreamRef.current = null;
    }
    prewarmedPromiseRef.current = null;

    // Clear notification immediately when rejecting call
    dismissCallNotification(call?.from);

    socket.emit('rejectCall', { to: call.from });
    setReceivingCall(false);
    setCall({});
    setCallerSignal(null);
    setCallerId(null);
    ringtoneShouldPlayRef.current = false;
    if (receiverAudioRef.current) receiverAudioRef.current.pause();
  }, [socket, call, dismissCallNotification]);

  /**
   * Silently clear the incoming call UI without emitting rejectCall to socket.
   * Used when the caller cancelled before we acted on it (FCM cancel_call arrives in foreground).
   * Prevents a false 'Call Rejected' status from appearing on the caller's screen.
   */
  const clearIncomingCallUI = useCallback(() => {
    console.log('[clearIncomingCallUI] Silently clearing incoming call state');
    isIncomingCallActiveRef.current = false;
    // ⚡ Clean up any pre-warmed media stream immediately
    if (prewarmedStreamRef.current) {
      try {
        prewarmedStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      prewarmedStreamRef.current = null;
    }
    prewarmedPromiseRef.current = null;

    ringtoneShouldPlayRef.current = false;
    setReceivingCall(false);
    setCall({});
    setCallerSignal(null);
    setCallerId(null);
    if (receiverAudioRef.current) {
      receiverAudioRef.current.pause();
      receiverAudioRef.current.currentTime = 0;
    }
  }, []);

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    console.log('🛑 endCall triggered - stopping all tracks and resetting audio state');
    isIncomingCallActiveRef.current = false;
    // ⚡ Clean up any pre-warmed media stream immediately
    if (prewarmedStreamRef.current) {
      try {
        prewarmedStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      prewarmedStreamRef.current = null;
    }
    prewarmedPromiseRef.current = null;

    // Clear call notification immediately when ending call
    dismissCallNotification();

    // Clear timeout timer if pending
    if (callingTimeoutTimerRef.current) {
      clearTimeout(callingTimeoutTimerRef.current);
      callingTimeoutTimerRef.current = null;
    }

    // Clean up one-time call acceptance/rejection socket listeners to avoid stale closures
    if (socket) {
      try {
        socket.off('callAccepted');
        socket.off('callRejected');
      } catch (e) {
        console.warn('Error removing socket call listeners:', e);
      }
    }

    setCallStarted(false);
    setCallAccepted(false);
    setCalling(false);
    setReceivingCall(false);
    setIsFrontCamera(true); // Reset to front camera by default for the next call!
    ringtoneShouldPlayRef.current = false;
    pendingCandidatesRef.current = [];
    setCallerSignal(null); // ✅ Clear stale offer SDP signal
    setCallerId(null); // ✅ Clear stale caller ID
    setUserAcceptedCall(false); // ✅ Reset user acceptance flag

    // Destroy peer connection cleanly
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying peer connection:', e);
      }
      peerRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('🎤 Stopping track:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    if (callerAudioRef.current) callerAudioRef.current.pause();
    if (receiverAudioRef.current) receiverAudioRef.current.pause();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
    if (userVideo.current) {
      try {
        userVideo.current.pause();
        userVideo.current.srcObject = null;
      } catch (e) {
        console.warn('Error pausing userVideo:', e);
      }
    }

    // Clean up dynamic audio element if attached
    if (typeof document !== 'undefined') {
      try {
        const dynAudio = document.getElementById('juicy-remote-audio-element');
        if (dynAudio) {
          dynAudio.pause();
          dynAudio.srcObject = null;
        }
      } catch (e) {
        console.warn('Error cleaning dynamic audio element:', e);
      }
    }

    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().then(() => {
        console.log('Audio context closed');
        setAudioContext(null);
        setRemoteGainNode(null);
      }).catch(err => console.warn('Error closing audio context:', err));
    }

    // Reset native Android audio mode back to MODE_NORMAL
    try {
      if (typeof window !== 'undefined' && window.Capacitor) {
        const { AudioRoute } = window.Capacitor.Plugins || {};
        if (AudioRoute && typeof AudioRoute.resetAudioMode === 'function') {
          AudioRoute.resetAudioMode().catch(err => console.warn('Error resetting native audio mode:', err));
        }
      }
    } catch (e) {
      console.warn('Capacitor resetAudioMode error:', e);
    }

    // Determine who to notify based on call state
    let recipientId = null;

    // If we have selectedUser, use that (we're the initiator)
    if (selectedUser?._id) {
      recipientId = selectedUser._id;
    }
    // If we received the call, notify the caller
    else if (call?.from) {
      recipientId = call.from;
    }

    // Notify peer about call end
    if (socket && recipientId) {
      console.log('📴 Emitting endCall to:', String(recipientId));
      try {
        socket.emit('endCall', { to: String(recipientId) }); // ✅ CRITICAL: Ensure recipientId is String
      } catch (error) {
        console.error('❌ Error emitting endCall:', error);
      }
    } else {
      console.warn('⚠️ Could not emit endCall - socket or recipientId missing', {
        hasSocket: !!socket,
        recipientId,
        hasSelectedUser: !!selectedUser?._id,
        hasCallFrom: !!call?.from
      });
    }

    // Clear call metadata
    setCall({});
    setRemoteStream(null); // ✅ Clear remote stream state
    setCallStartTime(null);
    setCallDuration('00:00');
    setIsMicrophoneMuted(false);
    setIsCameraOff(false);
  }, [socket, stream, selectedUser, call, dismissCallNotification, audioContext]);

  /**
   * Handle incoming call notification
   */
  const handleIncomingCall = useCallback(
    ({ from, signal, callerName, callType: incomingType }) => {
      console.log('📲 Incoming call from:', callerName, 'ID:', from, 'type:', incomingType);
      isIncomingCallActiveRef.current = true;
      setIsFrontCamera(true); // Ensure front camera opens by default when answering!
      setReceivingCall(true);
      setCall({ from, callerName, callType: incomingType || 'audio' });
      setCallType(incomingType || 'audio');
      if (signal) {
        setCallerSignal(signal);
      }
      setCallerId(from);

      // ⚡ PRE-WARM MEDIA: Start acquiring media stream in background while phone is ringing!
      // This eliminates the 1.5 - 2.5 second hardware wake-up delay on Android when user taps "Accept".
      const wantVideo = (incomingType === 'video');
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: wantVideo ? {
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15, max: 60 },
        } : false,
      };

      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        if (prewarmedStreamRef.current) {
          try {
            prewarmedStreamRef.current.getTracks().forEach(t => t.stop());
          } catch (e) {}
          prewarmedStreamRef.current = null;
        }

        prewarmedPromiseRef.current = navigator.mediaDevices.getUserMedia(constraints)
          .then(wStream => {
            if (!isIncomingCallActiveRef.current) {
              console.log('🛑 Incoming call was dismissed/rejected before pre-warm completed. Stopping tracks.');
              try {
                wStream.getTracks().forEach(t => t.stop());
              } catch (e) {}
              prewarmedStreamRef.current = null;
              return null;
            }
            console.log('⚡ Media stream pre-warmed successfully during incoming call ringing');
            prewarmedStreamRef.current = wStream;
            return wStream;
          })
          .catch(err => {
            console.warn('⚠️ Media pre-warm deferred to answer:', err.message);
            prewarmedStreamRef.current = null;
            return null;
          });
      }
    },
    []
  );

  /**
   * ✅ Handle busy signal (simultaneous calls detected)
   */
  const handleBusyCall = useCallback(
    ({ from, reason, message }) => {
      console.log('🚫 BUSY SIGNAL RECEIVED:', { from, reason, message });

      // Stop current streams
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setRemoteStream(null); // ✅ Clear remote stream state

      // Show busy indicator
      setCallBusy(true);
      setCalling(false);

      // Play busy tone if available
      try {
        const busyAudio = new Audio('/busy.mp3');
        busyAudio.loop = true;
        busyAudio.play().catch(err => console.warn('Could not play busy tone:', err));
      } catch (err) {
        console.warn('Error initializing busy audio:', err);
      }

      // Set 5-second auto-end timer (both audio & video calls)
      const timer = setTimeout(() => {
        console.log('⏰ 5 seconds elapsed - auto-ending busy call');
        setCallBusy(false);
        setCalling(false);
        setCall({});
        setCallStarted(false);
        setCallAccepted(false);
      }, 5000);

      setBusyAutoEndTimer(timer);
    },
    [stream]
  );

  /**
   * Toggle microphone (mute/unmute)
   */
  const toggleMicrophone = useCallback(() => {
    if (stream) {
      const newMutedState = !isMicrophoneMuted;

      // Mute local stream tracks (this cleanly mutes sending stream without dropping connection)
      stream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });

      setIsMicrophoneMuted(newMutedState);
    }
  }, [stream, isMicrophoneMuted]);

  /**
   * Toggle camera on/off
   */
  const toggleCamera = useCallback(() => {
    if (stream) {
      const newCameraState = !isCameraOff;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !newCameraState;
      });
      setIsCameraOff(newCameraState);
    }
  }, [stream, isCameraOff]);

  /**
   * ✅ NEW: Toggle remote speaker volume (clean, non-interrupting method)
   */
  const toggleRemoteSpeaker = useCallback(() => {
    const wasMuted = remoteAudioMuted;
    const newMuted = !wasMuted;
    setRemoteAudioMuted(newMuted);

    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = newMuted;
      console.log('🔊 Remote audio element muted state set to:', newMuted);
    } else {
      console.warn('⚠️ No remote audio element available to toggle');
    }
  }, [remoteAudioMuted]);

  /**
   * ✅ NEW: Toggle speaker phone mode (earpiece vs speaker)
   * This controls physical audio routing for native Android and mobile web
   */
  const toggleSpeakerPhone = useCallback(() => {
    const newMode = audioRoutingMode === 'speaker' ? 'earpiece' : 'speaker';
    setAudioRoutingMode(newMode);
    setIsSpeakerOn(newMode === 'speaker');

    console.log(`🔊 Toggled speaker phone: ${audioRoutingMode} → ${newMode}`);

    // For audio calls: when switching to speaker, unmute the audio element
    // When switching to earpiece, keep unmuted but route to earpiece device
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
    }

    // Apply unified audio routing (handles Capacitor + browser fallback)
    applyAudioRouting(newMode, callType);
  }, [audioRoutingMode, callType, applyAudioRouting]);

  /**
   * Attach local stream to self-view (like WhatsApp - small PiP in corner)
   */
  useEffect(() => {
    if (stream && selfVideoRef.current && callType === 'video') {
      selfVideoRef.current.srcObject = stream;
      selfVideoRef.current.muted = true; // Mute self-audio to avoid echo
      selfVideoRef.current.autoplay = true;
      selfVideoRef.current.playsinline = true;
      selfVideoRef.current.play().catch(err => console.warn('Self-view autoplay failed:', err));
    }
  }, [stream, callType]);

  // 🔔 Reactive receiver ringtone lifecycle management (WhatsApp style)
  useEffect(() => {
    if (receivingCall && !callAccepted && !callEnded) {
      if (receiverAudioRef.current) {
        ringtoneShouldPlayRef.current = true;
        receiverAudioRef.current.currentTime = 0;
        const playPromise = receiverAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (!ringtoneShouldPlayRef.current) {
              console.log('🔔 Stopping late-triggered ringtone play promise');
              if (receiverAudioRef.current) {
                receiverAudioRef.current.pause();
                receiverAudioRef.current.currentTime = 0;
              }
            }
          }).catch(err => {
            console.warn('🔔 Ringtone playback failed or was interrupted:', err.message);
          });
        }
      }
    } else {
      ringtoneShouldPlayRef.current = false;
      if (receiverAudioRef.current) {
        receiverAudioRef.current.pause();
        receiverAudioRef.current.currentTime = 0;
      }
    }
  }, [receivingCall, callAccepted, callEnded]);

  /**
   * Switch camera facing mode (front <-> back)
   */
  const switchCamera = useCallback(async () => {
    // 1. Check switching lock and reject additional taps
    if (switchingCameraRef.current) {
      console.log('🔄 [SwitchCamera] Switch already in progress. Ignoring tap.');
      return;
    }

    // Lock and set state
    switchingCameraRef.current = true;
    setSwitchingCamera(true);

    const targetIsFront = !isFrontCamera;
    const targetFacingMode = targetIsFront ? "user" : { exact: "environment" };

    console.log(`🔄 [SwitchCamera] Switching from ${isFrontCamera ? 'Front' : 'Rear'} to ${targetIsFront ? 'Front' : 'Rear'}`);

    let newStream = null;

    try {
      // 2. Properly stop previous video tracks before requesting the new camera
      if (stream) {
        const videoTracks = stream.getVideoTracks();
        for (const track of videoTracks) {
          track.stop();
          await Promise.resolve(track.stop()); // Await as requested
        }
        // If stream has a stop method, call and await it
        if (typeof stream.stop === 'function') {
          await stream.stop();
        }
      }

      // 3. Request the new camera stream using correct constraints and fallbacks
      try {
        const constraints = {
          video: {
            facingMode: targetFacingMode,
            width: { ideal: 1280, min: 640, max: 1920 },
            height: { ideal: 720, min: 480, max: 1080 },
            frameRate: { ideal: 30, min: 15, max: 60 },
            // ✅ HD quality — prevent blur on camera switch
            resizeMode: 'none',
          }
        };
        console.log('🔄 [SwitchCamera] Attempting main constraints:', constraints);
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('⚠️ [SwitchCamera] Main constraints failed, attempting fallback constraints:', err);
        try {
          const fallbackConstraints = {
            video: {
              facingMode: targetIsFront ? "user" : "environment"
            }
          };
          console.log('🔄 [SwitchCamera] Attempting fallback constraints (environment fallback):', fallbackConstraints);
          newStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        } catch (fallbackErr) {
          console.warn('⚠️ [SwitchCamera] Fallback constraints failed, attempting final fallback (any video):', fallbackErr);
          try {
            const finalConstraints = { video: true };
            newStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
          } catch (finalErr) {
            console.error('❌ [SwitchCamera] All camera switch attempts failed:', finalErr);
            throw finalErr;
          }
        }
      }

      if (newStream) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (!newVideoTrack) {
          throw new Error("No video tracks found in new stream.");
        }

        // Preserve existing audio tracks from the active stream
        const audioTracks = stream ? stream.getAudioTracks() : [];
        audioTracks.forEach(track => {
          track.enabled = !isMicrophoneMuted;
        });

        // 4. Replace the outgoing RTCRtpSender video track instead of recreating PeerConnection
        if (peerRef.current && peerRef.current._pc && typeof peerRef.current._pc.getSenders === 'function') {
          const senders = peerRef.current._pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            console.log('🔄 [SwitchCamera] Replacing RTCRtpSender video track...');
            await videoSender.replaceTrack(newVideoTrack);
            console.log('✅ [SwitchCamera] Successfully replaced sender video track');
          } else {
            console.warn('⚠️ [SwitchCamera] No RTCRtpSender video track found to replace');
          }
        }

        // Construct new MediaStream with same audio tracks and new video track
        const merged = new MediaStream([...audioTracks, newVideoTrack].filter(Boolean));
        setStream(merged);

        // 5. Toggle camera state ONLY after successful switch
        setIsFrontCamera(targetIsFront);
        console.log('✅ [SwitchCamera] Camera switch completed successfully!');
      }
    } catch (error) {
      console.error('❌ [SwitchCamera] Camera switch failed:', error);
    } finally {
      // Release lock and update state
      switchingCameraRef.current = false;
      setSwitchingCamera(false);
    }
  }, [isFrontCamera, stream, isMicrophoneMuted]);

  // ✅ Cleanup busy call timer on unmount or when busy state changes
  useEffect(() => {
    return () => {
      if (busyAutoEndTimer) {
        console.log('Clearing busy auto-end timer');
        clearTimeout(busyAutoEndTimer);
      }
    };
  }, [busyAutoEndTimer]);

  // ✅ Cleanup calling timeout timer on unmount or when calling ends
  useEffect(() => {
    return () => {
      if (callingTimeoutTimerRef.current) {
        console.log('Clearing calling timeout timer');
        clearTimeout(callingTimeoutTimerRef.current);
      }
    };
  }, []);

  // ✅ Deferred Call Accept: Trigger answerCall once WebRTC offer signal is delivered
  useEffect(() => {
    if (userAcceptedCall && callerSignal && socket) {
      console.log('🔄 Offer signal received after user tapped Accept. Connecting WebRTC call...');
      setUserAcceptedCall(false);
      answerCall();
    }
  }, [userAcceptedCall, callerSignal, socket, answerCall]);

  // Return all call state and functions
  return {
    // Refs (myVideo removed)
    userVideo,
    selfVideoRef, // Self-view reference for own camera feed
    remoteAudioRef,
    callerAudioRef,
    receiverAudioRef,

    // State
    callAccepted,
    callEnded,
    stream,
    remoteStream, // ✅ NEW: Track remote WebRTC stream state
    call,
    receivingCall,
    callerSignal,
    callerId,
    calling,
    callRejected,
    callBusy, // ✅ NEW: Busy signal state
    callingTimeout, // ✅ NEW: 30-sec calling timeout state
    callStarted,
    callStartTime,
    callDuration,
    callType,
    isMicrophoneMuted,
    isCameraOff,
    isSpeakerOn, // ✅ NEW: Speaker phone state
    remoteAudioMuted, // ✅ NEW: Remote audio mute state
    audioRoutingMode, // ✅ NEW: Audio routing mode (speaker/earpiece)
    cameraFacing,
    isFrontCamera,
    switchingCamera,

    // State setters
    setCallDuration,
    setCallAccepted,
    setCallEnded,
    setStream,
    setRemoteStream, // ✅ NEW: Track remote WebRTC stream state setter
    setCall,
    setReceivingCall,
    setCallerSignal,
    setCallerId,
    setCalling,
    setCallRejected,
    setCallBusy, // ✅ NEW: Busy signal setter
    setCallingTimeout, // ✅ NEW: Calling timeout setter
    setCallStarted,
    setCallStartTime,
    setCallType,
    setIsSpeakerOn, // ✅ NEW: Speaker phone setter
    setRemoteAudioMuted, // ✅ NEW: Remote audio mute setter
    setAudioRoutingMode, // ✅ NEW: Audio routing mode setter

    // Functions
    initiateCall,
    answerCall,
    rejectCall,
    clearIncomingCallUI, // Silently dismiss incoming call UI (used for FCM cancel_call in foreground)
    endCall,
    handleIncomingCall,
    handleIceCandidate, // ✅ Trickle ICE candidate handler
    handleBusyCall, // ✅ NEW: Busy signal handler
    toggleMicrophone,
    toggleCamera,
    switchCamera,
    toggleRemoteSpeaker,
    toggleSpeakerPhone, // ✅ Speaker phone toggle (earpiece/speaker routing)
    applyAudioRouting, // ✅ Audio routing helper for external use
    dismissCallNotification, // ✅ Clear call notification helper
  };
};

export default useVideoCall;