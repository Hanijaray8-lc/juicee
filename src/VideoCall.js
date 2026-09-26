import { useRef, useState, useCallback, useEffect } from 'react';
import Peer from 'simple-peer';
import { Network } from '@capacitor/network';

/**
 * Custom hook for WebRTC video call management
 * Handles video/audio call initiation, answering, and stream management
 */
const useVideoCall = (socket, user, selectedUser, dbFriends, iceServers, rtcConfig) => {
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
  const streamRef = useRef(null); // ✅ Ref to avoid stale closures holding null/old streams
  const [remoteStream, setRemoteStream] = useState(null); // ✅ NEW: Track remote WebRTC stream state
  const [call, setCall] = useState({});
  // separate Peer instance state so `call` can remain metadata used by the UI
  const [peerInstance, setPeerInstance] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callerId, setCallerId] = useState(null);
  const [calling, setCalling] = useState(false);
  const [isRinging, setIsRinging] = useState(false); // ✅ Track whether remote user's device is online and ringing
  const [callRejected, setCallRejected] = useState(false);
  const [callBusy, setCallBusy] = useState(false); // ✅ NEW: Track busy signal
  const busyAutoEndTimerRef = useRef(null); // ✅ Ref-based busy timer (prevents stale timers across calls)
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
  // ✅ FIX (Root Cause 2): audioContext converted from useState to useRef to prevent stale closures
  const audioContextRef = useRef(null);
  const remoteGainNodeRef = useRef(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true); // ✅ NEW: Speaker phone state for Android
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false); // ✅ NEW: Track remote audio mute state
  // ✅ FIX (Root Cause 2): audioRoutingMode converted to useRef; state preserved for hook return value / UI
  const [audioRoutingMode, setAudioRoutingModeState] = useState('speaker'); // 'speaker' or 'earpiece' for Android
  const audioRoutingModeRef = useRef('speaker');
  const setAudioRoutingMode = useCallback((mode) => {
    audioRoutingModeRef.current = mode;
    setAudioRoutingModeState(mode);
  }, []);
  const [userAcceptedCall, setUserAcceptedCall] = useState(false); // Track deferred accept state
  const ringtoneShouldPlayRef = useRef(false);
  const busyAudioRef = useRef(null);
  const prewarmedStreamRef = useRef(null);
  const prewarmedPromiseRef = useRef(null);
  const receiverPrewarmedTypeRef = useRef(null); // ✅ FIX (Root Cause 5): Track pre-warmed stream type for receiver
  const isIncomingCallActiveRef = useRef(false);
  const isCallActiveRef = useRef(false);
  isCallActiveRef.current = Boolean(calling || receivingCall || callAccepted || callStarted);
  const endCallRef = useRef(null);
  // ── CALL SESSION TRACKING REFS (added for reliability) ──────────────────────
  const activeCallIdRef = useRef(null);        // Current callId from server
  const remoteUserIdRef = useRef(null);         // Authoritative remote userId for endCall
  const isEndingRef = useRef(false);            // Idempotent guard — prevents double socket emits
  const prewarmedCallIdRef = useRef(null);      // Guards pre-warmed stream against wrong-call reuse
  // ── CALLER PRE-WARM REFS (mirrors receiver pre-warm for instant connect) ─────
  const callerPrewarmedStreamRef = useRef(null);   // Pre-warmed stream for outgoing calls
  const callerPrewarmedPromiseRef = useRef(null);  // In-flight Promise for outgoing pre-warmed stream
  const callerPrewarmedTypeRef = useRef(null);      // Type of pre-warmed stream ('audio'|'video')
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * ✅ ENHANCED: Initialize Web Audio API with retries and better error handling
   * ✅ FIX (Root Cause 2): Access audioContextRef directly to avoid stale closures over null
   */
  const initAudioContext = useCallback(async (retries = 3) => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      console.log('✅ Audio context already initialized');
      return audioContextRef.current;
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

        audioContextRef.current = ctx;
        remoteGainNodeRef.current = gainNode;
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
  }, []);

  /**
   * ✅ ENHANCED: Apply audio routing via Capacitor AudioSession and browser setSinkId
   * For video calls: route to speaker (loudspeaker), volume keys = media volume
   * For audio calls: route to earpiece by default, volume keys = call volume
   */
  const applyAudioRouting = useCallback((mode, forCallType) => {
    console.log(`🔊 [AUDIO-ROUTE] applyAudioRouting: mode=${mode}, callType=${forCallType}`);

    // 1. Capacitor Native Android routing (Authoritative on Android)
    try {
      if (typeof window !== 'undefined' && window.Capacitor) {
        const { AudioRoute } = window.Capacitor.Plugins || {};
        if (AudioRoute && typeof AudioRoute.setSpeakerphoneOn === 'function') {
          AudioRoute.setSpeakerphoneOn({ playOnSpeaker: mode === 'speaker' })
            .then(res => console.log(`📱 [ANDROID-AUDIO] AudioRoute: routed to ${res.mode}`))
            .catch(err => console.warn('📱 [ANDROID-AUDIO] AudioRoute error:', err));
        }

        const { AudioSession } = window.Capacitor.Plugins || {};
        if (AudioSession && typeof AudioSession.setCategory === 'function') {
          if (mode === 'speaker') {
            AudioSession.setCategory({
              usage: forCallType === 'video' ? 'media' : 'voice_communication',
              options: ['default_to_speaker']
            });
          } else {
            AudioSession.setCategory({
              usage: 'voice_communication',
              options: []
            });
          }
        }

        const { VolumeControl } = window.Capacitor.Plugins || {};
        if (VolumeControl && typeof VolumeControl.setVolumeStream === 'function') {
          const stream = (mode === 'speaker') ? 'music' : 'voice_call';
          VolumeControl.setVolumeStream({ stream });
        }

        // Return early on Capacitor native app: native Android AudioManager is authoritative!
        // Do NOT call browser setSinkId() as it conflicts with Android 12+ setCommunicationDevice.
        return;
      }
    } catch (err) {
      console.warn('⚠️ Capacitor audio routing failed:', err.message);
    }

    // 2. Web Browser Fallback: Route via HTML5 setSinkId if supported (Only outside native Capacitor)
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

          if (targetDevice && remoteAudioRef.current) {
            remoteAudioRef.current.setSinkId(targetDevice.deviceId)
              .then(() => console.log(`✅ [AUDIO-ROUTE] Browser setSinkId: routed audio to ${targetDevice.label}`))
              .catch(err => console.warn('setSinkId failed:', err));
          }
        })
        .catch(err => console.warn('enumerateDevices failed:', err));
    }
  }, []);

  /**
   * Get or create the ONE authoritative HTML5 audio element for playing remote audio
   */
  const getOrCreateRemoteAudio = useCallback(() => {
    if (typeof document !== 'undefined') {
      let el = document.getElementById('juicy-remote-audio-element');
      if (!el) {
        el = document.createElement('audio'); // ✅ actually create the element
        el.id = 'juicy-remote-audio-element';
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        el.volume = 1.0;
        el.style.position = 'fixed';
        el.style.top = '-9999px';
        el.style.left = '-9999px';
        el.style.width = '1px';
        el.style.height = '1px';
        el.style.opacity = '0.01';
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);
        console.log('🔊 [REMOTE-STREAM] Created authoritative juicy-remote-audio-element on document.body');
      }
      remoteAudioRef.current = el;
      return el;
    }
    return remoteAudioRef.current;
  }, []);

  /**
   * ✅ Play remote stream directly through the authoritative HTML5 audio element
   */
  const playRemoteAudio = useCallback(async (remoteStreamToPlay) => {
    const targetStream = remoteStreamToPlay || remoteStream;
    if (!targetStream) {
      console.warn('⚠️ [REMOTE-STREAM] No remote stream to play');
      return;
    }

    try {
      // Verify stream has audio tracks
      const audioTracks = targetStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️ [REMOTE-STREAM] Remote stream has no audio tracks');
        return;
      }

      // CRITICAL: Explicitly enable ALL audio tracks
      audioTracks.forEach((track, idx) => {
        track.enabled = true;
        console.log(`✅ [REMOTE-STREAM] Audio track ${idx} enabled (id: ${track.id}, state: ${track.readyState})`);
      });

      // Play through authoritative HTML audio element
      const audioEl = getOrCreateRemoteAudio();
      if (audioEl) {
        console.log('🔊 [CALL-AUDIO] Playing remote audio stream via authoritative audio element');
        if (audioEl.srcObject !== targetStream) {
          audioEl.srcObject = targetStream;
        }
        audioEl.muted = false; // Always ensure remote audio is audible
        audioEl.volume = 1.0;
        audioEl.autoplay = true;

        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log('✅ [CALL-AUDIO] Remote audio playing successfully'))
            .catch(err => console.warn('⚠️ [CALL-AUDIO] Remote audio play delayed/warning:', err));
        }
      }
    } catch (err) {
      console.error('❌ [CALL-AUDIO] Error playing remote audio:', err);
    }
  }, [remoteStream, getOrCreateRemoteAudio]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ⚡ FIX 1: waitForVideoUnmute
  // Races a poll interval against the 'unmute' event listener so we NEVER miss
  // an unmute that fires between a one-shot check and the listener attachment.
  // Resolves immediately if the track is already unmuted.
  // ─────────────────────────────────────────────────────────────────────────────
  const waitForVideoUnmute = useCallback((track, timeoutMs = 5000, intervalMs = 150) => {
    return new Promise((resolve) => {
      if (!track || !track.muted) {
        // Already unmuted (or no track) — resolve immediately
        resolve();
        return;
      }
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(pollId);
        clearTimeout(timeoutId);
        track.removeEventListener('unmute', onUnmute);
        resolve();
      };
      // Poll so a missed event between check and listener is caught within intervalMs
      const pollId = setInterval(() => {
        if (!track.muted) finish();
      }, intervalMs);
      // Event listener as the fast path
      const onUnmute = () => finish();
      track.addEventListener('unmute', onUnmute, { once: true });
      // Safety timeout — never block the call forever
      const timeoutId = setTimeout(() => {
        console.warn(`⚠️ [waitForVideoUnmute] Timeout (${timeoutMs}ms) — proceeding anyway`);
        finish();
      }, timeoutMs);
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ⚡ FIX 2: waitForLocalTracksReady
  // Gate before new Peer() — waits for audio track readyState === 'live'
  // (and video track live + not ended for video calls) up to timeoutMs.
  // Prevents sending an offer/answer with a half-initialised stream.
  // ─────────────────────────────────────────────────────────────────────────────
  const waitForLocalTracksReady = useCallback((stream, type, timeoutMs = 5000) => {
    return new Promise((resolve) => {
      if (!stream) { resolve(); return; }
      const deadline = Date.now() + timeoutMs;
      const check = () => {
        const audioOk = stream.getAudioTracks().some(t => t.readyState === 'live');
        const videoOk = type !== 'video' || stream.getVideoTracks().some(
          t => t.readyState === 'live' && !t.ended
        );
        if (audioOk && videoOk) {
          console.log('✅ [waitForLocalTracksReady] All local tracks are live — proceeding to new Peer()');
          resolve();
          return;
        }
        if (Date.now() >= deadline) {
          console.warn(`⚠️ [waitForLocalTracksReady] Timeout (${timeoutMs}ms) — proceeding anyway (audioOk=${audioOk}, videoOk=${videoOk})`);
          resolve();
          return;
        }
        setTimeout(check, 80);
      };
      check();
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ⚡ FIX 5: attachRemoteVideoWhenReady — single canonical attach path
  // Replaces all overlapping retry/unmute/addtrack/useEffect attach loops.
  // Steps:
  //   1. If stream has no video tracks yet → wait for addtrack (+ polling fallback)
  //   2. For each video track: wait for unmute via waitForVideoUnmute (poll+event race)
  //   3. Poll for the React ref to mount (Dialog animation delay)
  //   4. Set srcObject + play()
  // Uses a session token so stale calls from previous call sessions are ignored.
  // ─────────────────────────────────────────────────────────────────────────────
  const attachSessionTokenRef = useRef(0);
  const attachRemoteVideoWhenReady = useCallback(async (stream, videoRef) => {
    if (!stream) return;
    // Increment session token — any previous pending attach with an old token becomes a no-op
    const myToken = ++attachSessionTokenRef.current;
    const stale = () => attachSessionTokenRef.current !== myToken;

    console.log(`🎬 [attachRemoteVideoWhenReady] Starting attach (token=${myToken})`);

    // Helper: poll for the React ref element to mount
    const waitForRef = (timeoutMs = 4000, intervalMs = 100) => new Promise(resolve => {
      if (videoRef && videoRef.current) { resolve(videoRef.current); return; }
      const deadline = Date.now() + timeoutMs;
      const poll = setInterval(() => {
        if (stale()) { clearInterval(poll); resolve(null); return; }
        if (videoRef && videoRef.current) { clearInterval(poll); resolve(videoRef.current); return; }
        if (Date.now() >= deadline) {
          clearInterval(poll);
          console.warn('⚠️ [attachRemoteVideoWhenReady] videoRef never mounted after', timeoutMs, 'ms');
          resolve(null);
        }
      }, intervalMs);
    });

    // Helper: wait for a video track to arrive (handles addtrack + polling fallback)
    const waitForVideoTrack = (timeoutMs = 5000, intervalMs = 150) => new Promise(resolve => {
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) { resolve(tracks[0]); return; }
      const deadline = Date.now() + timeoutMs;
      let done = false;
      const finish = (track) => { if (done) return; done = true; clearInterval(pollId); stream.removeEventListener('addtrack', onAdd); resolve(track || null); };
      const pollId = setInterval(() => {
        if (stale()) { finish(null); return; }
        const t = stream.getVideoTracks();
        if (t.length > 0) finish(t[0]);
        else if (Date.now() >= deadline) finish(null);
      }, intervalMs);
      const onAdd = (e) => { if (e.track && e.track.kind === 'video') finish(e.track); };
      stream.addEventListener('addtrack', onAdd);
    });

    // Step 1: Get video track
    const vTrack = await waitForVideoTrack();
    if (stale()) return;

    if (!vTrack) {
      console.warn('⚠️ [attachRemoteVideoWhenReady] No video track arrived — aborting attach');
      return;
    }

    // Step 2: Wait for the track to unmute (delivers actual frames)
    console.log(`⏳ [attachRemoteVideoWhenReady] Video track ${vTrack.id} muted=${vTrack.muted} — waiting for unmute`);
    await waitForVideoUnmute(vTrack);
    if (stale()) return;
    console.log(`🎬 [attachRemoteVideoWhenReady] Video track ${vTrack.id} is live, waiting for React ref...`);

    // Step 3: Wait for the React video element ref to be mounted by React
    const el = await waitForRef();
    if (stale() || !el) return;

    // Step 4: Attach and play
    try {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        console.log('✅ [attachRemoteVideoWhenReady] srcObject set on video element');
      }
      el.autoplay = true;
      el.playsInline = true;
      el.muted = true; // MUST be muted — audio is via the separate audio element
      el.controls = false;
      const p = el.play();
      if (p !== undefined) {
        p.then(() => console.log('✅ [attachRemoteVideoWhenReady] Remote video playback started'))
          .catch(e => console.warn('⚠️ [attachRemoteVideoWhenReady] play() warning:', e));
      }
    } catch (e) {
      console.error('❌ [attachRemoteVideoWhenReady] Error attaching video stream:', e);
    }
  }, [waitForVideoUnmute]);

  /**
   * Handle incoming trickle ICE candidates from remote peer
   */
  const handleIceCandidate = useCallback((data) => {
    if (!data) return;

    const from = data.from;
    const candidate = data.candidate !== undefined ? data.candidate : data;

    // Ignore null or empty candidates (e.g. end-of-candidates notification)
    if (!candidate || candidate === null) {
      console.log('ℹ️ Null ICE candidate received (end-of-candidates), skipping');
      return;
    }
    if (typeof candidate === 'object' && (candidate.candidate === null || candidate.candidate === '')) {
      console.log('ℹ️ Empty candidate string received, skipping');
      return;
    }

    console.log('📡 Received trickle ICE candidate from:', from);

    /**
     * Normalize the incoming candidate into the shape simple-peer expects:
     *   { type: 'candidate', candidate: { candidate: '...', sdpMid: '...', sdpMLineIndex: N } }
     *
     * Two cases:
     *  A) Already a simple-peer signal object: { type: 'candidate', candidate: {...} }  → pass through
     *  B) Raw RTCIceCandidateInit dict: { candidate: '...', sdpMid: '...', sdpMLineIndex: N } → wrap it
     */
    let signalData = null;
    if (candidate && candidate.type === 'candidate' && candidate.candidate !== undefined) {
      // Case A: already the correct simple-peer shape
      signalData = candidate;
    } else {
      // Case B: raw RTCIceCandidateInit — parse from string if needed, then wrap
      let init = candidate;
      if (typeof candidate === 'string') {
        try { init = JSON.parse(candidate); } catch (e) { init = { candidate }; }
      }
      if (init) {
        signalData = { type: 'candidate', candidate: init };
      }
    }

    if (!signalData || !signalData.candidate) {
      console.log('ℹ️ Invalid candidate format, skipping');
      return;
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
  const processPendingCandidates = useCallback((delayMs = 0) => {
    const drain = () => {
      if (peerRef.current && !peerRef.current.destroyed && pendingCandidatesRef.current.length > 0) {
        console.log(`🧹 Processing ${pendingCandidatesRef.current.length} queued ICE candidate(s)`);
        while (pendingCandidatesRef.current.length > 0) {
          const cand = pendingCandidatesRef.current.shift();
          if (!cand || !cand.candidate) continue;
          try {
            peerRef.current.signal(cand);
            console.log('✅ Applied queued trickle ICE candidate');
          } catch (err) {
            console.warn('⚠️ Error applying queued candidate:', err.message);
          }
        }
      }
    };
    // Defer candidate drain to give simple-peer time to apply remote SDP internally
    if (delayMs > 0) {
      setTimeout(drain, delayMs);
    } else {
      drain();
    }
  }, []);

  /**
   * Deterministically attach stream, start audio playback, and enforce Android audio routing
   */
  // ✅ FIX (Dedup): Guard against stream+track both firing and causing double-play
  const remoteStreamAttachedRef = useRef(null);

  const ensureAudioPlayingAndRouted = useCallback((remoteStreamToAttach, wantVideo) => {
    if (!remoteStreamToAttach) return;
    // Dedup: if we already attached this exact stream object, skip
    if (remoteStreamAttachedRef.current === remoteStreamToAttach) {
      console.log('⏭️ [CALL-AUDIO] Remote stream already attached — skipping duplicate ensureAudioPlayingAndRouted');
      return;
    }
    remoteStreamAttachedRef.current = remoteStreamToAttach;
    console.log(`🎙️ [CALL-AUDIO] ensureAudioPlayingAndRouted triggered (wantVideo=${wantVideo})`);
    setRemoteStream(remoteStreamToAttach);

    // 1. Explicitly enable all audio & video tracks
    remoteStreamToAttach.getAudioTracks().forEach((track, idx) => {
      track.enabled = true;
      console.log(`   ✅ [REMOTE-STREAM] Audio track ${idx} enabled: ${track.id} (${track.readyState})`);
    });

    remoteStreamToAttach.getVideoTracks().forEach((track, idx) => {
      track.enabled = true;
      console.log(`   ✅ [REMOTE-STREAM] Video track ${idx} enabled: ${track.id} (${track.readyState})`);
    });

    // 2. Resume AudioContext FIRST — it may be suspended after ringtone paused on Android
    //    This is the key fix for first-call audio silence.
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      console.log('🔊 [CALL-AUDIO] Resuming suspended AudioContext before play');
      audioContextRef.current.resume().catch(e => console.warn('⚠️ AudioContext resume failed:', e));
    } else {
      initAudioContext();
    }

    // ✅ FIX: Use the current audioRoutingMode (set by initiateCall/answerCall/toggleSpeaker)
    // rather than computing from wantVideo alone. This preserves user's speaker toggle state
    // AND allows the Java layer to auto-detect headsets when mode is 'earpiece'.
    // The native Android plugin (applyRoutingState) handles headset/BT detection internally.
    const mode = audioRoutingModeRef.current || (wantVideo ? 'speaker' : 'earpiece');

    // 3. Apply audio routing BEFORE play — prevents Android AudioManager MODE_NORMAL reset
    applyAudioRouting(mode, wantVideo ? 'video' : 'audio');

    // 4. Play audio stream via the ONE authoritative HTML5 audio element
    playRemoteAudio(remoteStreamToAttach);

    // 5. Attach stream to userVideo element once video track is delivering frames (Root Cause 3 fix)
    // ✅ [FIX: B→A Black Video] userVideo.current may be null when this fires because React
    //    hasn't re-rendered yet after setRemoteStream() to mount the <video> element.
    //    Use a retry loop so we keep trying until the element mounts.
    const attachAndPlayVideo = (retriesLeft = 8, delayMs = 0) => {
      const doAttach = () => {
        if (wantVideo && userVideo.current) {
          try {
            if (userVideo.current.srcObject !== remoteStreamToAttach) {
              userVideo.current.srcObject = remoteStreamToAttach;
            }
            userVideo.current.autoplay = true;
            userVideo.current.playsinline = true;
            userVideo.current.muted = true; // Video element MUST be muted to prevent duplicate audio
            userVideo.current.controls = false;
            const p = userVideo.current.play();
            if (p !== undefined) {
              p.then(() => console.log('✅ [REMOTE-STREAM] Remote video playback started (track delivering frames)'))
                .catch(e => console.warn('⚠️ Remote video autoplay warning:', e));
            }
          } catch (e) {
            console.error('❌ Error attaching video stream:', e);
          }
        } else if (wantVideo && retriesLeft > 0) {
          // ✅ [FIX: B→A Black Video] Video ref not mounted yet — retry after short delay
          console.log(`⏳ [REMOTE-STREAM] userVideo ref not ready in ensureAudio, retrying... (${retriesLeft} left)`);
          setTimeout(() => attachAndPlayVideo(retriesLeft - 1, 150), 150);
        } else if (wantVideo) {
          console.warn('⚠️ [REMOTE-STREAM] userVideo ref never became available after retries in ensureAudio');
        }
      };
      if (delayMs > 0) {
        setTimeout(doAttach, delayMs);
      } else {
        doAttach();
      }
    };

    // ⚡ FIX 5: Use the single consolidated attach path instead of overlapping
    // retry/unmute/addtrack loops — races poll + event, then waits for React ref mount.
    if (wantVideo) {
      attachRemoteVideoWhenReady(remoteStreamToAttach, userVideo);
    }

    // 6. Re-apply routing with safety nets for Android AudioManager delays, and retry audio play (Root Cause 4)
    setTimeout(() => {
      applyAudioRouting(mode, wantVideo ? 'video' : 'audio');
      const audioEl = remoteAudioRef.current;
      if (audioEl && audioEl.srcObject) {
        audioEl.play().catch(e => console.warn('⚠️ Audio retry at 300ms failed in ensureAudioPlayingAndRouted:', e));
      }
    }, 300);
    setTimeout(() => {
      applyAudioRouting(mode, wantVideo ? 'video' : 'audio');
      const audioEl = remoteAudioRef.current;
      if (audioEl && audioEl.srcObject) {
        audioEl.play().catch(e => console.warn('⚠️ Audio retry at 800ms failed in ensureAudioPlayingAndRouted:', e));
      }
    }, 800);
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

      // 3. Attach userVideo element if mounted — with retry for cases where the ref
      //    isn't available immediately (e.g., Dialog animation delay on first render)
      const attachVideoStream = (attemptsLeft = 10) => {
        if (callType === 'video') {
          if (userVideo.current) {
            if (userVideo.current.srcObject !== remoteStream) {
              userVideo.current.srcObject = remoteStream;
              console.log('✅ [REMOTE-STREAM] Attached remote stream to video element in effect');
            }
            userVideo.current.muted = true; // ✅ Video element MUST be muted for mobile autoplay compliance
            userVideo.current.play().then(() => {
              console.log('✅ [REMOTE-STREAM] Remote video playing successfully in effect');
            }).catch(e => console.warn('⚠️ Video element play failed in effect:', e));
          } else if (attemptsLeft > 0) {
            // Video ref not yet mounted — retry after a short delay (Dialog may still be animating)
            console.log(`⏳ [REMOTE-STREAM] Video ref not ready, retrying... (${attemptsLeft} left)`);
            setTimeout(() => attachVideoStream(attemptsLeft - 1), 200);
          } else {
            console.warn('⚠️ [REMOTE-STREAM] Video element ref never became available after retries');
          }
        }
      };

      // ⚡ FIX 5: Use the single consolidated attach path — poll+event race for unmute
      // and ref-mount polling so the two attach paths don't race each other.
      if (callType === 'video') {
        console.log('🎬 [Effect] Delegating video attach to attachRemoteVideoWhenReady');
        attachRemoteVideoWhenReady(remoteStream, userVideo);
      }
    }
  }, [remoteStream, callType, remoteAudioMuted, getOrCreateRemoteAudio, attachRemoteVideoWhenReady]);


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

  /**
   * End the current call
   */
  const endCall = useCallback((skipEmit = false) => {
    console.log('🛑 endCall triggered - stopping all tracks and resetting audio state, skipEmit:', skipEmit);
    if (isEndingRef.current) {
      console.log('🛑 endCall already in progress, skipping duplicate');
      return;
    }
    isEndingRef.current = true;

    isIncomingCallActiveRef.current = false;
    // ⚡ Clean up any pre-warmed media stream immediately
    if (prewarmedStreamRef.current) {
      try {
        prewarmedStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) { }
      prewarmedStreamRef.current = null;
    }
    prewarmedPromiseRef.current = null;
    prewarmedCallIdRef.current = null;
    receiverPrewarmedTypeRef.current = null;
    if (callerPrewarmedStreamRef.current) {
      try {
        callerPrewarmedStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) { }
      callerPrewarmedStreamRef.current = null;
      callerPrewarmedTypeRef.current = null;
    }

    // Clear busy timer if pending
    if (busyAutoEndTimerRef.current) {
      clearTimeout(busyAutoEndTimerRef.current);
      busyAutoEndTimerRef.current = null;
    }

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
    setIsRinging(false);
    setReceivingCall(false);
    setCallBusy(false);
    setCallEnded(true); // ✅ [FixGhostRinging] Signal ringtone useEffect to stop reciver.mp3 immediately
    setIsFrontCamera(true); // Reset to front camera by default for the next call!
    ringtoneShouldPlayRef.current = false;
    // Clear busy audio tone if playing
    if (busyAudioRef.current) {
      try {
        busyAudioRef.current.pause();
        busyAudioRef.current.currentTime = 0;
      } catch (e) {}
      busyAudioRef.current = null;
    }
    // ✅ [FixGhostRinging] Immediately stop both ringtones — don't wait for state re-render
    const _stopRingtones = () => {
      if (callerAudioRef.current) {
        try { callerAudioRef.current.pause(); callerAudioRef.current.currentTime = 0; } catch (e) {}
      }
      if (receiverAudioRef.current) {
        try { receiverAudioRef.current.pause(); receiverAudioRef.current.currentTime = 0; } catch (e) {}
      }
      if (window.AudioRouteBridge && typeof window.AudioRouteBridge.onCallerRingtoneStop === 'function') {
        try { window.AudioRouteBridge.onCallerRingtoneStop(); } catch (e) {}
      }
      if (window.AudioRouteBridge && typeof window.AudioRouteBridge.onReceiverRingtoneStop === 'function') {
        try { window.AudioRouteBridge.onReceiverRingtoneStop(); } catch (e) {}
      }
    };
    _stopRingtones();
    // ✅ [FixGhostRinging] Double-stop after 200ms to catch any play() promise that resolved late
    setTimeout(_stopRingtones, 200);
    // ✅ [FixGhostRinging] Triple-stop after 600ms as a final safety net for all devices
    setTimeout(_stopRingtones, 600);
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

    const activeStream = streamRef.current || stream;
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        console.log('🎤 Stopping track:', track.kind);
        track.stop();
      });
    }
    streamRef.current = null;
    setStream(null);
    if (callerAudioRef.current) {
      try {
        callerAudioRef.current.pause();
        callerAudioRef.current.currentTime = 0;
      } catch (e) { }
    }
    if (receiverAudioRef.current) {
      try {
        receiverAudioRef.current.pause();
        receiverAudioRef.current.currentTime = 0;
      } catch (e) { }
    }
    // ✅ [FixGhostRinging] Do NOT null out remoteAudioRef.current — the React <audio ref={...}> binding
    //    must stay intact so the next call can reuse the same element without creating DOM duplicates.
    //    Just pause + clear srcObject, keep the ref alive.
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      } catch (e) { }
      // ✅ Do NOT set remoteAudioRef.current = null here — React ref must stay intact
    }
    // Also clean up the persistent DOM audio element (created by getOrCreateRemoteAudio)
    if (typeof document !== 'undefined') {
      try {
        const dynAudio = document.getElementById('juicy-remote-audio-element');
        if (dynAudio) {
          dynAudio.pause();
          dynAudio.srcObject = null;
        }
      } catch (e) {}
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

    // Reset default audio routing state for the next call
    setIsSpeakerOn(true);
    setAudioRoutingMode('speaker');

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        console.log('Audio context closed');
        audioContextRef.current = null;
        remoteGainNodeRef.current = null;
      }).catch(err => console.warn('Error closing audio context:', err));
    }

    // Reset native Android audio mode back to MODE_NORMAL and cancel all call notifications
    try {
      if (typeof window !== 'undefined' && window.Capacitor) {
        const { AudioRoute } = window.Capacitor.Plugins || {};
        if (AudioRoute) {
          if (typeof AudioRoute.resetAudioMode === 'function') {
            AudioRoute.resetAudioMode().catch(err => console.warn('Error resetting native audio mode:', err));
          }
          if (typeof AudioRoute.dismissNotification === 'function') {
            AudioRoute.dismissNotification({}).catch(() => {});
          }
          if (typeof AudioRoute.stopForegroundService === 'function') {
            AudioRoute.stopForegroundService({}).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('Capacitor resetAudioMode error:', e);
    }

    // Determine who to notify based on authoritative remote user or call state
    const recipientId = remoteUserIdRef.current || selectedUser?._id || call?.from;

    // Notify peer about call end
    if (socket && recipientId && !skipEmit) {
      console.log('📴 Emitting endCall to:', String(recipientId), 'callId:', activeCallIdRef.current);
      try {
        socket.emit('endCall', {
          to: String(recipientId),
          callId: activeCallIdRef.current
        });
      } catch (error) {
        console.error('❌ Error emitting endCall:', error);
      }
    } else {
      console.log('ℹ️ endCall: skipEmit was', skipEmit, 'or recipientId missing:', recipientId);
    }

    // Clear call metadata
    setCall({});
    setRemoteStream(null); // ✅ Clear remote stream state
    setCallStartTime(null);
    setCallDuration('00:00');
    setIsMicrophoneMuted(false);
    setIsCameraOff(false);

    activeCallIdRef.current = null;
    remoteUserIdRef.current = null;
    isEndingRef.current = false;
  }, [socket, stream, selectedUser, call, dismissCallNotification]);
  endCallRef.current = endCall;

  /**
   * Reusable media constraints helper to ensure consistent configuration across
   * caller/receiver pre-warm, initiateCall, and answerCall (Root Cause 5 fix)
   */
  const getMediaConstraints = (type = 'audio', facing = 'user') => ({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: type === 'video' ? {
      width: { ideal: 1280, min: 640, max: 1920 },
      height: { ideal: 720, min: 480, max: 1080 },
      facingMode: facing,
      frameRate: { ideal: 30, min: 15, max: 60 },
    } : false,
  });

  /**
   * ⚡ Pre-warm caller media BEFORE call is initiated (call on button press/hover)
   * This eliminates the 1-3s getUserMedia hardware wake-up delay for the caller.
   * Safe to call multiple times — re-uses existing stream if type matches.
   */
  const prewarmCallerMedia = useCallback(async (type = 'audio') => {
    try {
      // Reuse if already pre-warmed for the same type
      if (
        callerPrewarmedStreamRef.current &&
        callerPrewarmedTypeRef.current === type &&
        callerPrewarmedStreamRef.current.getAudioTracks().some(t => t.readyState === 'live')
      ) {
        console.log('⚡ [CALLER-PREWARM] Stream already ready, reusing');
        return;
      }
      // Stop any stale pre-warmed stream from a different type
      if (callerPrewarmedStreamRef.current) {
        try { callerPrewarmedStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) { }
        callerPrewarmedStreamRef.current = null;
      }
      console.log('⚡ [CALLER-PREWARM] Pre-warming caller media for type:', type);
      const constraints = getMediaConstraints(type, 'user');
      const promise = navigator.mediaDevices.getUserMedia(constraints);
      callerPrewarmedPromiseRef.current = promise;
      const wStream = await promise;
      callerPrewarmedStreamRef.current = wStream;
      callerPrewarmedTypeRef.current = type;
      callerPrewarmedPromiseRef.current = null;
      console.log('⚡ [CALLER-PREWARM] Caller media pre-warmed successfully!');
    } catch (err) {
      console.warn('⚠️ [CALLER-PREWARM] Pre-warm failed (will fallback in initiateCall):', err.message);
      callerPrewarmedStreamRef.current = null;
      callerPrewarmedPromiseRef.current = null;
    }
  }, []);

  /**
   * ⚡ Pre-warm receiver media when incoming call is detected (before user taps "Answer")
   * Eliminates the getUserMedia hardware wake-up delay on receiver side (Root Cause 5 fix)
   */
  const prewarmReceiverMedia = useCallback(async (type = 'audio') => {
    try {
      // Reuse if already pre-warmed for the same type
      if (
        prewarmedStreamRef.current &&
        receiverPrewarmedTypeRef.current === type &&
        prewarmedStreamRef.current.getAudioTracks().some(t => t.readyState === 'live') &&
        (type !== 'video' || prewarmedStreamRef.current.getVideoTracks().some(t => t.readyState === 'live'))
      ) {
        console.log('⚡ [RECEIVER-PREWARM] Receiver stream already ready, reusing');
        return prewarmedStreamRef.current;
      }
      // Stop any stale pre-warmed stream from a different type
      if (prewarmedStreamRef.current) {
        try { prewarmedStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) { }
        prewarmedStreamRef.current = null;
      }
      console.log('⚡ [RECEIVER-PREWARM] Pre-warming receiver media for type:', type);
      const constraints = getMediaConstraints(type, 'user');
      const promise = navigator.mediaDevices.getUserMedia(constraints);
      prewarmedPromiseRef.current = promise;
      const wStream = await promise;
      if (!isIncomingCallActiveRef.current) {
        console.log('🛑 [RECEIVER-PREWARM] Incoming call ended/cancelled before prewarm completed. Stopping tracks.');
        try { wStream.getTracks().forEach(t => t.stop()); } catch (e) { }
        prewarmedStreamRef.current = null;
        prewarmedPromiseRef.current = null;
        receiverPrewarmedTypeRef.current = null;
        return null;
      }
      prewarmedStreamRef.current = wStream;
      receiverPrewarmedTypeRef.current = type;
      console.log('⚡ [RECEIVER-PREWARM] Receiver media pre-warmed successfully!');
      return wStream;
    } catch (err) {
      console.warn('⚠️ [RECEIVER-PREWARM] Pre-warm failed (will fallback in answerCall):', err.message);
      prewarmedStreamRef.current = null;
      prewarmedPromiseRef.current = null;
      receiverPrewarmedTypeRef.current = null;
      return null;
    }
  }, []);

  const initiateCall = useCallback(
    async (friendId, type = 'audio') => {
      if (!socket || !user) return;
      // Set authoritative remote user and reset cleanup guard for this call session
      remoteUserIdRef.current = friendId;
      isEndingRef.current = false;
      activeCallIdRef.current = null; // Will be set when callAccepted arrives with callId

      setIsFrontCamera(true); // Ensure front camera opens by default when starting a call!
      setCallEnded(false); // ✅ [FixGhostRinging] Reset so receiver ringtone useEffect fires on next call
      setCalling(true);
      setIsRinging(false); // Initially 'Calling...' until remote online/ringing confirmed
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
        // ⚡ INSTANT CONNECT: Check if caller-side pre-warmed stream is ready or in-flight
        let currentStream = null;
        let prewarmed = callerPrewarmedStreamRef.current;
        if (!prewarmed && callerPrewarmedPromiseRef.current) {
          console.log('⏳ [CALLER-PREWARM] Awaiting in-flight caller pre-warmed stream...');
          try {
            prewarmed = await callerPrewarmedPromiseRef.current;
          } catch (e) {
            prewarmed = null;
          }
        }
        const isPrewarmedValid =
          prewarmed &&
          callerPrewarmedTypeRef.current === type &&
          prewarmed.getAudioTracks().some(t => t.readyState === 'live') &&
          (type !== 'video' || prewarmed.getVideoTracks().some(t => t.readyState === 'live'));

        if (isPrewarmedValid) {
          console.log('⚡ [CALLER-PREWARM] Using pre-warmed stream — instant connect!');
          currentStream = prewarmed;
          callerPrewarmedStreamRef.current = null; // consumed
          callerPrewarmedPromiseRef.current = null;
          callerPrewarmedTypeRef.current = null;
        } else {
          // Fallback: Request media based on call type with retry logic (original logic)
          if (prewarmed) {
            try { prewarmed.getTracks().forEach(t => t.stop()); } catch (e) { }
            callerPrewarmedStreamRef.current = null;
          }
          callerPrewarmedPromiseRef.current = null;
          let retries = 3;

          while (retries > 0 && !currentStream) {
            try {
              // ✅ ENHANCED: Android-optimized fast media constraints
              const constraints = getMediaConstraints(type, cameraFacing);
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
        }

        // ✅ [FIX: B→A Video] Explicitly ensure all local video tracks are enabled on caller side
        if (type === 'video' && currentStream) {
          currentStream.getVideoTracks().forEach((track, idx) => {
            track.enabled = true;
            console.log(`   ✅ [CALLER-VIDEO] Local video track ${idx} enabled: ${track.id} (${track.readyState})`);
          });
        }

        setStream(currentStream);
        streamRef.current = currentStream;

        // Play caller ringtone
        if (callerAudioRef.current) {
          callerAudioRef.current.currentTime = 0;
          callerAudioRef.current.play().catch(err => console.warn('Ringtone play failed:', err));
        }

        // ⚡ FIX 2: Wait until all local tracks are truly live before creating the peer.
        // Without this gate, the offer can be sent with half-initialised tracks on cold start.
        await waitForLocalTracksReady(currentStream, type);

        // Create peer connection as initiator with trickle: true and pre-gathered candidate pool
        // Use full rtcConfig if available (includes bundlePolicy, sdpSemantics, iceTransportPolicy)
        const peerConfig = rtcConfig || { iceServers, iceCandidatePoolSize: 10 };
        const peer = new Peer({
          initiator: true,
          trickle: true,
          stream: currentStream,
          config: peerConfig,
        });
        peerRef.current = peer;

        // ── ICE connection state monitoring for the initiator ──────────────────
        // Handles both 'failed' (hard fail) and 'disconnected' (transient — WiFi/4G switch)
        const monitorIceState = () => {
          const pc = peer._pc;
          if (!pc) return;
          let iceRestartAttempted = false;
          let disconnectTimer = null;
          pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            console.log(`🔗 [ICE-INITIATOR] iceConnectionState: ${state}`);
            if (state === 'failed' && !iceRestartAttempted) {
              iceRestartAttempted = true;
              console.warn('⚠️ [ICE-INITIATOR] ICE failed — attempting ICE restart');
              try {
                if (typeof pc.restartIce === 'function') {
                  pc.restartIce();
                  console.log('🔄 [ICE-INITIATOR] restartIce() called on failure');
                }
              } catch (e) {
                console.warn('⚠️ [ICE-INITIATOR] restartIce failed:', e.message);
              }
            }
            // ✅ FIX: 'disconnected' is transient (network switch). Give it 4s to self-recover;
            // if still disconnected, trigger ICE restart instead of letting the call die silently.
            if (state === 'disconnected') {
              console.warn('⚠️ [ICE-INITIATOR] ICE disconnected — waiting 4s before restart...');
              clearTimeout(disconnectTimer);
              disconnectTimer = setTimeout(() => {
                if (pc.iceConnectionState === 'disconnected' && !peer.destroyed) {
                  console.warn('⚠️ [ICE-INITIATOR] Still disconnected after 4s — triggering restart');
                  try {
                    if (typeof pc.restartIce === 'function') pc.restartIce();
                  } catch (e) { console.warn('⚠️ [ICE-INITIATOR] restartIce on disconnect failed:', e.message); }
                }
              }, 4000);
            } else {
              clearTimeout(disconnectTimer);
            }
            if (state === 'connected' || state === 'completed') {
              console.log('✅ [ICE-INITIATOR] P2P connection established!');
              iceRestartAttempted = false; // reset so future drops can also restart
            }
          };
        };
        // Monitor ICE state once the RTCPeerConnection is ready (slight defer for simple-peer internals)
        setTimeout(monitorIceState, 100);
        // ───────────────────────────────────────────────────────────────────────

        // Handle signal generation (send offer or trickle candidate to peer)
        // ✅ FIX: Removed duplicate else-branch that could double-emit callUser for non-offer/non-candidate signals
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
          }
          // Note: simple-peer only generates 'offer' + trickle ICE candidates as initiator.
          // Any other signal type is silently ignored to prevent duplicate socket emits.
        });

        // Handle peer connection established — re-apply audio routing and retry audio play
        peer.on('connect', () => {
          console.log('✅ Peer connection established (initiator side) — re-applying audio routing');
          setCallStartTime(Date.now()); // Accurate call start time
          const isVideoCall = (type === 'video');
          const mode = isVideoCall ? 'speaker' : 'earpiece';
          // Re-assert routing now that media channel is live (Android needs this after ICE)
          applyAudioRouting(mode, type);
          // If stream already arrived before connect, retry play
          const audioEl = remoteAudioRef.current;
          if (audioEl && audioEl.srcObject) {
            audioEl.play().catch(e => console.warn('⚠️ Audio retry on connect failed:', e));
          }

          // 🔊 Root Cause 4 fix: retry audioEl.play() and applyAudioRouting on 300ms/800ms schedule
          setTimeout(() => {
            applyAudioRouting(mode, type);
            const el = remoteAudioRef.current;
            if (el && el.srcObject) {
              el.play().then(() => console.log('✅ [CALL-AUDIO] Audio play retry at 300ms succeeded (initiator)'))
                .catch(e => console.warn('⚠️ Audio retry at 300ms failed (initiator):', e));
            }
          }, 300);

          setTimeout(() => {
            applyAudioRouting(mode, type);
            const el = remoteAudioRef.current;
            if (el && el.srcObject) {
              el.play().then(() => console.log('✅ [CALL-AUDIO] Audio play retry at 800ms succeeded (initiator)'))
                .catch(e => console.warn('⚠️ Audio retry at 800ms failed (initiator):', e));
            }
          }, 800);
        });

        // Handle peer errors — trigger cleanup
        peer.on('error', err => {
          // Suppress expected "User-Initiated Abort" / "Close called" errors that fire
          // when the local user ends the call — these are not real errors.
          const msg = (err?.message || '').toLowerCase();
          const isExpectedClose = msg.includes('user-initiated abort') || msg.includes('close called') || msg.includes('connection failed');
          if (isExpectedClose) {
            console.log('ℹ️ Peer closed (initiator) — call ended by user.');
          } else {
            console.error('❌ Peer connection error (initiator):', err);
          }
          if (endCallRef.current) {
            endCallRef.current();
          } else {
            endCall();
          }
        });

        // Handle peer close — trigger cleanup
        peer.on('close', () => {
          console.log('📴 Peer connection closed (initiator)');
          if (endCallRef.current) {
            endCallRef.current();
          } else {
            endCall();
          }
        });

        // Handle remote stream reception (primary path — fires on most browsers)
        peer.on('stream', receivedRemoteStream => {
          console.log('🎙️ Received remote stream (stream event) in initiateCall');
          setCallStartTime(prev => prev || Date.now());
          ensureAudioPlayingAndRouted(receivedRemoteStream, type === 'video');
        });

        // ── Fallback: peer.on('track') for browsers/devices using unified-plan ─
        // Some Android WebViews and Safari fire 'track' instead of 'stream'.
        // We collect tracks and reconstruct the MediaStream if 'stream' never fires.
        {
          const trackBuffer = [];
          let trackStreamTimer = null;
          peer.on('track', (track, trackStream) => {
            console.log(`🎙️ [TRACK-FALLBACK] Received track: ${track.kind} in initiateCall`);
            // If simple-peer gives us the stream directly with the track, use it
            if (trackStream && trackStream.getTracks().length > 0) {
              ensureAudioPlayingAndRouted(trackStream, type === 'video');
              return;
            }
            // Otherwise buffer tracks and assemble a stream after a brief collect window
            trackBuffer.push(track);
            clearTimeout(trackStreamTimer);
            trackStreamTimer = setTimeout(() => {
              if (trackBuffer.length > 0) {
                const assembledStream = new MediaStream(trackBuffer);
                console.log('🎙️ [TRACK-FALLBACK] Assembled MediaStream from tracks:', trackBuffer.length);
                ensureAudioPlayingAndRouted(assembledStream, type === 'video');
              }
            }, 200);
          });
        }
        // ────────────────────────────────────────────────────────────────────────

        // Handle call acceptance (receive answer) — supports both { signal, callId } and raw signal object/string
        socket.once('callAccepted', (data, maybeCallId) => {
          console.log('✅ Call accepted event received:', data);

          let parsed = data;
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed);
            } catch (e) {
              console.warn('⚠️ Could not parse callAccepted string:', e);
            }
          }

          let sdpSignal = null;
          let callId = maybeCallId || null;

          if (parsed && typeof parsed === 'object') {
            if (parsed.signal) {
              // Wrapped format: { signal: {...}, callId: ... }
              sdpSignal = parsed.signal;
              callId = parsed.callId || callId;
            } else if (parsed.type || parsed.sdp) {
              // Direct SDP answer format: { type: 'answer', sdp: '...' }
              sdpSignal = parsed;
              callId = parsed.callId || callId;
            } else {
              sdpSignal = parsed;
            }
          }

          if (typeof sdpSignal === 'string') {
            try {
              sdpSignal = JSON.parse(sdpSignal);
            } catch (e) {
              console.warn('⚠️ Could not parse sdpSignal as JSON:', e);
            }
          }

          console.log('✅ Call accepted! callId:', callId, 'sdpSignal type:', sdpSignal?.type);

          // Store the server-assigned callId for this session
          if (callId) activeCallIdRef.current = callId;

          // Clear calling timeout since call was answered
          if (callingTimeoutTimerRef.current) {
            clearTimeout(callingTimeoutTimerRef.current);
            callingTimeoutTimerRef.current = null;
          }

          setCallAccepted(true);
          setCallStarted(true);
          setCallStartTime(Date.now());
          setCallingTimeout(false);

          if (sdpSignal && typeof sdpSignal === 'object') {
            try {
              if (peer && !peer.destroyed) {
                peer.signal(sdpSignal);
              } else if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.signal(sdpSignal);
              } else {
                console.warn('⚠️ Peer connection is already destroyed or not initialized');
              }
            } catch (err) {
              console.error('❌ Error signaling SDP answer to peer:', err);
            }
          } else {
            console.error('❌ callAccepted received without a valid SDP signal:', data);
          }

          // ✅ Drain pending ICE candidates with a 50ms delay so remote SDP is applied first
          processPendingCandidates(50);
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

          // Clear remote refs so endCall won't re-emit to receiver (they already rejected)
          remoteUserIdRef.current = null;
          activeCallIdRef.current = null;

          setCalling(false);
          setCallRejected(true);
          setCallingTimeout(false);
          setTimeout(() => setCallRejected(false), 2000);
          if (callerAudioRef.current) callerAudioRef.current.pause();
          const streamToStopReject = streamRef.current || currentStream;
          if (streamToStopReject) {
            streamToStopReject.getTracks().forEach(track => track.stop());
          }
          streamRef.current = null;
          setStream(null);
          setRemoteStream(null); // ✅ Clear remote stream state
        });

        // ✅ NEW: Set 30-second calling timeout - auto-end if no answer
        const timeoutTimer = setTimeout(() => {
          console.log('⏰ 30 seconds elapsed - call not answered, auto-ending');
          setCallingTimeout(true);
          setCalling(false);

          // ✅ FIX: Notify receiver to stop ringing when caller times out
          if (socket && friendId) {
            try {
              socket.emit('endCall', { to: String(friendId), callId: activeCallIdRef.current });
              console.log('📴 [TIMEOUT] Sent endCall to receiver so they stop ringing');
            } catch (e) {
              console.warn('⚠️ [TIMEOUT] endCall emit failed:', e);
            }
          }

          if (callerAudioRef.current) callerAudioRef.current.pause();
          const streamToStopTimeout = streamRef.current || currentStream;
          if (streamToStopTimeout) {
            streamToStopTimeout.getTracks().forEach(track => track.stop());
          }
          streamRef.current = null;
          setStream(null);
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
            streamRef.current = basicStream;
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
    [socket, user, iceServers, cameraFacing, applyAudioRouting, initAudioContext, ensureAudioPlayingAndRouted, waitForLocalTracksReady, rtcConfig, endCall]
  );

  const answerCall = useCallback(async () => {
    if (!socket) { setUserAcceptedCall(true); return; }

    // ✅ ALWAYS unlock audio within the original user gesture, before any early return
    initAudioContext();
    const primingAudioEl = getOrCreateRemoteAudio();
    if (primingAudioEl) {
      primingAudioEl.play().catch(() => {}); // silent priming play, keeps gesture chain alive
    }

    // Set authoritative remote user and reset cleanup guard for this call session
    remoteUserIdRef.current = callerId;
    isEndingRef.current = false;
    console.log('📞 [CALL-AUDIO] answerCall initiated, remoteUser:', callerId);

    // 1. Immediately silence and release incoming ringtone player before VoIP audio routing starts
    ringtoneShouldPlayRef.current = false;
    if (receiverAudioRef.current) {
      try {
        receiverAudioRef.current.pause();
        receiverAudioRef.current.currentTime = 0;
        console.log('🔕 [CALL-AUDIO] Incoming ringtone paused cleanly');
      } catch (e) {
        console.warn('Error pausing incoming ringtone:', e);
      }
    }

    // Clear notification immediately when answering call
    dismissCallNotification(callerId || call?.from);

    if (!callerSignal) {
      console.log('⏳ Accept clicked, but WebRTC offer signal not loaded yet. Waiting for signal...');
      setUserAcceptedCall(true);
      return;
    }

    try {
      // ✅ FIX: Always read callType from server-sent call data.
      // Local `callType` state may still be the default 'audio' when receiver answers.
      const wantVideo = call?.callType === 'video';

      // Set default audio routing based on answered call type: speaker for video, earpiece for audio
      const initialMode = wantVideo ? 'speaker' : 'earpiece';
      setIsSpeakerOn(wantVideo);
      setAudioRoutingMode(initialMode);

      // Apply initial audio routing
      applyAudioRouting(initialMode, wantVideo ? 'video' : 'audio');

      // ⚡ INSTANT MEDIA: Check if pre-warmed stream from ringing phase is ready (Root Cause 5 fix)
      isIncomingCallActiveRef.current = false;
      let currentStream = null;
      let prewarmed = prewarmedStreamRef.current;
      if (!prewarmed && prewarmedPromiseRef.current) {
        console.log('⏳ Awaiting in-flight pre-warmed media stream...');
        try {
          prewarmed = await prewarmedPromiseRef.current;
        } catch (e) {
          prewarmed = null;
        }
      }

      // Check if pre-warmed stream is valid and matches call type
      const isPrewarmedValid =
        prewarmed &&
        (!receiverPrewarmedTypeRef.current || receiverPrewarmedTypeRef.current === (wantVideo ? 'video' : 'audio')) &&
        prewarmed.getAudioTracks().some(t => t.readyState === 'live') &&
        (!wantVideo || prewarmed.getVideoTracks().some(t => t.readyState === 'live'));

      if (isPrewarmedValid) {
        console.log('⚡ [RECEIVER-PREWARM] Using pre-warmed stream — instant connect!');
        currentStream = prewarmed;
        prewarmedStreamRef.current = null; // consumed
        prewarmedPromiseRef.current = null;
        prewarmedCallIdRef.current = null;
        receiverPrewarmedTypeRef.current = null;
      } else {
        if (prewarmed) {
          try { prewarmed.getTracks().forEach(t => t.stop()); } catch (e) { }
          prewarmedStreamRef.current = null;
        }
        prewarmedPromiseRef.current = null;
        receiverPrewarmedTypeRef.current = null;
        console.log('🎙️ Pre-warmed stream not ready or invalid, acquiring media directly...');
        // Request media stream (audio + optional video) with retry logic
        let retries = 3;
        currentStream = null;

        while (retries > 0 && !currentStream) {
          try {
            // ✅ ENHANCED: Fast Android-optimized media constraints for answer
            const constraints = getMediaConstraints(wantVideo ? 'video' : 'audio', cameraFacing);
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
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              throw err;
            }
          }
        }
      }

      // Explicitly verify and enable all local audio and video tracks
      if (currentStream) {
        currentStream.getAudioTracks().forEach((track, idx) => {
          track.enabled = true;
          console.log(`   ✅ [CALL-AUDIO] Local audio track ${idx} verified enabled: ${track.id} (${track.readyState})`);
        });
        if (wantVideo) {
          currentStream.getVideoTracks().forEach((track, idx) => {
            track.enabled = true;
            console.log(`   ✅ [CALL-AUDIO] Local video track ${idx} enabled: ${track.id} (${track.readyState})`);
          });
        }
      }

      setStream(currentStream);
      streamRef.current = currentStream;

      // Create peer connection as non-initiator with trickle: true and pre-gathered candidate pool
      // Use full rtcConfig if available (includes bundlePolicy, sdpSemantics, iceTransportPolicy)
      // ⚡ FIX 2: Wait until all local tracks are truly live before creating the peer.
      // Without this gate, the answer can be sent with half-initialised tracks on cold start.
      await waitForLocalTracksReady(currentStream, wantVideo ? 'video' : 'audio');

      const peerConfig = rtcConfig || { iceServers, iceCandidatePoolSize: 10 };
      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: currentStream,
        config: peerConfig,
      });
      peerRef.current = peer;

      // ── ICE connection state monitoring for the answerer ───────────────────
      // Handles both 'failed' (hard fail) and 'disconnected' (transient — WiFi/4G switch)
      const monitorIceStateAnswerer = () => {
        const pc = peer._pc;
        if (!pc) return;
        let iceRestartAttempted = false;
        let disconnectTimer = null;
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          console.log(`🔗 [ICE-ANSWERER] iceConnectionState: ${state}`);
          if (state === 'failed' && !iceRestartAttempted) {
            iceRestartAttempted = true;
            console.warn('⚠️ [ICE-ANSWERER] ICE failed — attempting ICE restart');
            try {
              if (typeof pc.restartIce === 'function') {
                pc.restartIce();
                console.log('🔄 [ICE-ANSWERER] restartIce() called on failure');
              }
            } catch (e) {
              console.warn('⚠️ [ICE-ANSWERER] restartIce failed:', e.message);
            }
          }
          // ✅ FIX: 'disconnected' is transient (network switch). Give it 4s to self-recover;
          // if still disconnected, trigger ICE restart instead of letting the call die silently.
          if (state === 'disconnected') {
            console.warn('⚠️ [ICE-ANSWERER] ICE disconnected — waiting 4s before restart...');
            clearTimeout(disconnectTimer);
            disconnectTimer = setTimeout(() => {
              if (pc.iceConnectionState === 'disconnected' && !peer.destroyed) {
                console.warn('⚠️ [ICE-ANSWERER] Still disconnected after 4s — triggering restart');
                try {
                  if (typeof pc.restartIce === 'function') pc.restartIce();
                } catch (e) { console.warn('⚠️ [ICE-ANSWERER] restartIce on disconnect failed:', e.message); }
              }
            }, 4000);
          } else {
            clearTimeout(disconnectTimer);
          }
          if (state === 'connected' || state === 'completed') {
            console.log('✅ [ICE-ANSWERER] P2P connection established!');
            iceRestartAttempted = false; // reset so future drops can also restart
          }
        };
      };
      setTimeout(monitorIceStateAnswerer, 100);
      // ───────────────────────────────────────────────────────────────────────

      // Send answer signal or trickle candidate back to caller
      peer.on('signal', data => {
        if (data.type === 'answer') {
          console.log('📤 Sending answer SDP signal to caller:', String(callerId));
          socket.emit('answerCall', {
            to: String(callerId), // ✅ CRITICAL: Ensure callerId is String
            signal: data,
            callId: activeCallIdRef.current  // ✅ Include callId for server-side state transition
          });
        } else if (data.candidate) {
          console.log('📤 Sending trickle ICE candidate to caller:', String(callerId));
          socket.emit('iceCandidate', {
            to: String(callerId),
            candidate: data,
            callId: activeCallIdRef.current
          });
        } else {
          console.log('📤 Sending answer signal to caller:', String(callerId));
          socket.emit('answerCall', {
            to: String(callerId),
            signal: data,
            callId: activeCallIdRef.current
          });
        }
      });

      // Handle peer connection established — re-apply audio routing and retry audio play
      peer.on('connect', () => {
        console.log('✅ Peer connection established (answerer side) — re-applying audio routing');
        setCallStartTime(Date.now()); // Accurate call start time
        // Re-assert routing now that media channel is live (Android needs this after ICE)
        applyAudioRouting(initialMode, wantVideo ? 'video' : 'audio');
        // If stream already arrived before connect, retry play
        const audioEl = remoteAudioRef.current;
        if (audioEl && audioEl.srcObject) {
          audioEl.play().catch(e => console.warn('⚠️ Audio retry on connect (answerer) failed:', e));
        }

        // 🔊 Root Cause 4 fix: retry audioEl.play() and applyAudioRouting on 300ms/800ms schedule
        setTimeout(() => {
          applyAudioRouting(initialMode, wantVideo ? 'video' : 'audio');
          const el = remoteAudioRef.current;
          if (el && el.srcObject) {
            el.play().then(() => console.log('✅ [CALL-AUDIO] Audio play retry at 300ms succeeded (answerer)'))
              .catch(e => console.warn('⚠️ Audio retry at 300ms failed (answerer):', e));
          }
        }, 300);

        setTimeout(() => {
          applyAudioRouting(initialMode, wantVideo ? 'video' : 'audio');
          const el = remoteAudioRef.current;
          if (el && el.srcObject) {
            el.play().then(() => console.log('✅ [CALL-AUDIO] Audio play retry at 800ms succeeded (answerer)'))
              .catch(e => console.warn('⚠️ Audio retry at 800ms failed (answerer):', e));
          }
        }, 800);
      });

      // Handle peer errors — trigger cleanup (suppress expected close/abort errors like initiator side)
      peer.on('error', err => {
        const msg = (err?.message || '').toLowerCase();
        const isExpectedClose = msg.includes('user-initiated abort') || msg.includes('close called') || msg.includes('connection failed');
        if (isExpectedClose) {
          console.log('ℹ️ Peer closed (answerer) — call ended by user.');
        } else {
          console.error('❌ Peer connection error (answerer):', err);
        }
        if (endCallRef.current) {
          endCallRef.current();
        } else {
          endCall();
        }
      });

      // Handle peer close — trigger cleanup
      peer.on('close', () => {
        console.log('📴 Peer connection closed (answerer)');
        if (endCallRef.current) {
          endCallRef.current();
        } else {
          endCall();
        }
      });

      // Receive remote stream (primary path — fires on most browsers)
      peer.on('stream', receivedRemoteStream => {
        console.log('🎤 [CALL-AUDIO] Received remote stream (stream event) in answerCall');
        ensureAudioPlayingAndRouted(receivedRemoteStream, wantVideo);
      });

      // ── Fallback: peer.on('track') for browsers/devices using unified-plan ─
      // Some Android WebViews and Safari fire 'track' instead of 'stream'.
      {
        const trackBuffer = [];
        let trackStreamTimer = null;
        peer.on('track', (track, trackStream) => {
          console.log(`🎤 [TRACK-FALLBACK] Received track: ${track.kind} in answerCall`);
          if (trackStream && trackStream.getTracks().length > 0) {
            ensureAudioPlayingAndRouted(trackStream, wantVideo);
            return;
          }
          trackBuffer.push(track);
          clearTimeout(trackStreamTimer);
          trackStreamTimer = setTimeout(() => {
            if (trackBuffer.length > 0) {
              const assembledStream = new MediaStream(trackBuffer);
              console.log('🎤 [TRACK-FALLBACK] Assembled MediaStream from tracks:', trackBuffer.length);
              ensureAudioPlayingAndRouted(assembledStream, wantVideo);
            }
          }, 200);
        });
      }
      // ────────────────────────────────────────────────────────────────────────

      // Connect to caller's offer signal
      if (callerSignal) {
        let offerSignal = callerSignal;
        if (typeof offerSignal === 'string') {
          try {
            offerSignal = JSON.parse(offerSignal);
          } catch (e) {
            console.warn('⚠️ Could not parse callerSignal JSON:', e);
          }
        }
        if (offerSignal && offerSignal.signal) {
          offerSignal = offerSignal.signal;
        }
        if (typeof offerSignal === 'string') {
          try {
            offerSignal = JSON.parse(offerSignal);
          } catch (e) { }
        }

        if (offerSignal && typeof offerSignal === 'object') {
          try {
            peer.signal(offerSignal);
          } catch (err) {
            console.error('❌ Error signaling caller offer to peer:', err);
          }
        } else {
          console.error('❌ Invalid caller offer signal shape:', callerSignal);
        }
      } else {
        console.warn('⚠️ No caller signal available when answering');
      }

      // ✅ Drain pending ICE candidates with a 50ms delay so remote SDP is applied first
      processPendingCandidates(50);

      // Update states
      setCallAccepted(true);
      setReceivingCall(false);
      setCallStarted(true);
      setCallStartTime(Date.now());
      setPeerInstance(peer);

      // Re-apply audio routing to firmly assert communication mode
      applyAudioRouting(initialMode, wantVideo ? 'video' : 'audio');

      console.log('✅ [CALL-AUDIO] Call answered successfully');

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
  // ✅ FIX: Removed `callType` from deps — wantVideo now reads from `call?.callType` (server data)
  }, [socket, callerSignal, callerId, call, iceServers, cameraFacing, ensureAudioPlayingAndRouted, processPendingCandidates, dismissCallNotification, initAudioContext, getOrCreateRemoteAudio, applyAudioRouting, waitForLocalTracksReady, rtcConfig, endCall]);

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback(() => {
    isIncomingCallActiveRef.current = false;
    // ⚡ Clean up any pre-warmed media stream immediately
    if (prewarmedStreamRef.current) {
      try {
        prewarmedStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) { }
      prewarmedStreamRef.current = null;
    }
    prewarmedPromiseRef.current = null;
    prewarmedCallIdRef.current = null;
    receiverPrewarmedTypeRef.current = null;

    const targetUser = call?.from || remoteUserIdRef.current;
    // Clear notification immediately when rejecting call
    dismissCallNotification(targetUser);

    if (socket && targetUser) {
      socket.emit('rejectCall', {
        to: String(targetUser),
        callId: activeCallIdRef.current
      });
    }

    setReceivingCall(false);
    setIsRinging(false);
    setCall({});
    setCallerSignal(null);
    setCallerId(null);
    ringtoneShouldPlayRef.current = false;
    if (receiverAudioRef.current) receiverAudioRef.current.pause();

    activeCallIdRef.current = null;
    remoteUserIdRef.current = null;
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
      } catch (e) { }
      prewarmedStreamRef.current = null;
    }
    prewarmedPromiseRef.current = null;
    receiverPrewarmedTypeRef.current = null;

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
   * Handle incoming call notification
   */
  const handleIncomingCall = useCallback(
    (data = {}) => {
      const { from, signal, callerName, callType: incomingType, callId } = (data || {});
      // 🚫 WhatsApp-style busy check: if user is already in any call state, reject new caller immediately
      if (calling || receivingCall || callAccepted || callStarted || isCallActiveRef.current) {
        console.log('🚫 User is already in a call. Emitting callBusy to caller:', from, 'callId:', callId);
        if (socket && from) {
          socket.emit('callBusy', { to: from, callId, reason: 'user_busy' });
        }
        return;
      }

      console.log('📲 Incoming call from:', callerName, 'ID:', from, 'type:', incomingType, 'callId:', callId);
      activeCallIdRef.current = callId || null;
      remoteUserIdRef.current = from;
      const currentCallId = callId || from;
      prewarmedCallIdRef.current = currentCallId;

      isIncomingCallActiveRef.current = true;
      setIsFrontCamera(true); // Ensure front camera opens by default when answering!
      setCallEnded(false); // ✅ [FixGhostRinging] Reset so receiver ringtone useEffect fires correctly
      setReceivingCall(true);
      setCall({ from, callerName, callType: incomingType || 'audio', callId });
      setCallType(incomingType || 'audio');

      let validSignal = signal;
      if (typeof validSignal === 'string') {
        try {
          validSignal = JSON.parse(validSignal);
        } catch (e) { }
      }
      if (validSignal && validSignal.signal) {
        validSignal = validSignal.signal;
      }
      if (validSignal) {
        setCallerSignal(validSignal);
      }
      setCallerId(from);

      // 🔔 Receiver is online and processing call — confirm ringing back to caller
      if (socket && from) {
        console.log('🔔 [VideoCall] Confirming callRinging back to caller:', from, 'callId:', callId);
        socket.emit('callRinging', { to: String(from), callId });
      }

      // ⚡ PRE-WARM MEDIA: Start acquiring media stream in background while phone is ringing!
      // This eliminates the 1.5 - 2.5 second hardware wake-up delay on Android when user taps "Accept". (Root Cause 5 fix)
      prewarmReceiverMedia(incomingType || 'audio');
    },
    [socket, calling, receivingCall, callAccepted, callStarted, prewarmReceiverMedia]
  );

  /**
   * ✅ Handle call ringing confirmation from server or receiver
   */
  const handleCallRinging = useCallback(({ callId } = {}) => {
    console.log('🔔 [VideoCall] Call ringing confirmed by server/peer, callId:', callId);
    if (!callId || !activeCallIdRef.current || activeCallIdRef.current === callId) {
      setIsRinging(true);
    }
  }, []);

  /**
   * ✅ Handle busy signal (simultaneous calls detected)
   */
  const handleBusyCall = useCallback(
    ({ from, reason, message }) => {
      console.log('🚫 BUSY SIGNAL RECEIVED:', { from, reason, message });

      // Stop current streams
      const activeStream = streamRef.current || stream;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      streamRef.current = null;
      setStream(null);

      // ⚡ Clean up any pre-warmed media stream immediately
      if (prewarmedStreamRef.current) {
        try {
          prewarmedStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) { }
        prewarmedStreamRef.current = null;
      }
      prewarmedPromiseRef.current = null;
      prewarmedCallIdRef.current = null;
      receiverPrewarmedTypeRef.current = null;
      if (callerPrewarmedStreamRef.current) {
        try {
          callerPrewarmedStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) { }
        callerPrewarmedStreamRef.current = null;
        callerPrewarmedTypeRef.current = null;
      }

      setRemoteStream(null); // ✅ Clear remote stream state

      // Show busy indicator
      setCallBusy(true);
      setCalling(false);
      setIsRinging(false);

      // Play busy tone if available
      try {
        if (busyAudioRef.current) {
          try { busyAudioRef.current.pause(); busyAudioRef.current.currentTime = 0; } catch (e) {}
        }
        const busyAudio = new Audio('/busy.mp3');
        busyAudio.loop = true;
        busyAudioRef.current = busyAudio;
        busyAudio.play().catch(err => console.warn('Could not play busy tone:', err));
      } catch (err) {
        console.warn('Error initializing busy audio:', err);
      }

      // Clear any pending busy timer
      if (busyAutoEndTimerRef.current) {
        clearTimeout(busyAutoEndTimerRef.current);
        busyAutoEndTimerRef.current = null;
      }

      const busyCallId = activeCallIdRef.current;

      // Set 5-second auto-end timer (both audio & video calls)
      busyAutoEndTimerRef.current = setTimeout(() => {
        console.log('⏰ 5 seconds elapsed - auto-ending busy call');
        if (busyAudioRef.current) {
          try { busyAudioRef.current.pause(); busyAudioRef.current.currentTime = 0; } catch (e) {}
          busyAudioRef.current = null;
        }
        if (!activeCallIdRef.current || activeCallIdRef.current === busyCallId) {
          setCallBusy(false);
          setCalling(false);
          setCall({});
          setCallStarted(false);
          setCallAccepted(false);
          activeCallIdRef.current = null;
          remoteUserIdRef.current = null;
        }
      }, 5000);
    },
    [stream]
  );

  /**
   * Toggle microphone (mute/unmute)
   */
  const toggleMicrophone = useCallback(() => {
    const activeStream = streamRef.current || stream;
    if (activeStream) {
      const newMutedState = !isMicrophoneMuted;

      // Mute local stream tracks (this cleanly mutes sending stream without dropping connection)
      activeStream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });

      setIsMicrophoneMuted(newMutedState);
    }
  }, [stream, isMicrophoneMuted]);

  /**
   * Toggle camera on/off
   */
  const toggleCamera = useCallback(() => {
    const activeStream = streamRef.current || stream;
    if (activeStream) {
      const newCameraState = !isCameraOff;
      activeStream.getVideoTracks().forEach(track => {
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
    const newMode = audioRoutingModeRef.current === 'speaker' ? 'earpiece' : 'speaker';
    setAudioRoutingMode(newMode);
    setIsSpeakerOn(newMode === 'speaker');

    console.log(`🔊 Toggled speaker phone: ${audioRoutingModeRef.current} → ${newMode}`);

    // For audio calls: when switching to speaker, unmute the audio element
    // When switching to earpiece, keep unmuted but route to earpiece device
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
    }

    // Apply unified audio routing (handles Capacitor + browser fallback)
    applyAudioRouting(newMode, callType);
  }, [setAudioRoutingMode, callType, applyAudioRouting]);

  /**
   * Attach local stream to self-view (like WhatsApp - small PiP in corner)
   * ✅ FIX: Retry loop so the ref mounting delay (Dialog animation) doesn't cause black self-view
   */
  useEffect(() => {
    if (!stream || callType !== 'video') return;
    const attachSelfView = (attemptsLeft = 10) => {
      if (selfVideoRef.current) {
        if (selfVideoRef.current.srcObject !== stream) {
          selfVideoRef.current.srcObject = stream;
        }
        selfVideoRef.current.muted = true;      // Mute self-audio to avoid echo
        selfVideoRef.current.autoplay = true;
        selfVideoRef.current.playsInline = true;
        selfVideoRef.current.play().catch(err => console.warn('Self-view autoplay failed:', err));
        console.log('✅ [SELF-VIEW] Local stream attached to self-view');
      } else if (attemptsLeft > 0) {
        // selfVideoRef not yet mounted (Dialog animation) — retry after 150ms
        setTimeout(() => attachSelfView(attemptsLeft - 1), 150);
      } else {
        console.warn('⚠️ [SELF-VIEW] selfVideoRef never mounted after retries');
      }
    };
    attachSelfView();
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

  // 🔕 Watchdog: Once a call is active (callStarted or callAccepted), strictly silence all ringtones
  useEffect(() => {
    if (callStarted || callAccepted) {
      ringtoneShouldPlayRef.current = false;
      if (callerAudioRef.current) {
        try {
          callerAudioRef.current.pause();
          callerAudioRef.current.currentTime = 0;
        } catch (e) {}
      }
      if (receiverAudioRef.current) {
        try {
          receiverAudioRef.current.pause();
          receiverAudioRef.current.currentTime = 0;
        } catch (e) {}
      }
      if (window.AudioRouteBridge && typeof window.AudioRouteBridge.onCallerRingtoneStop === 'function') {
        try {
          window.AudioRouteBridge.onCallerRingtoneStop();
        } catch (e) {}
      }
      if (window.AudioRouteBridge && typeof window.AudioRouteBridge.onReceiverRingtoneStop === 'function') {
        try {
          window.AudioRouteBridge.onReceiverRingtoneStop();
        } catch (e) {}
      }
    }
  }, [callStarted, callAccepted]);

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
      const activeStream = streamRef.current || stream;
      if (activeStream) {
        const videoTracks = activeStream.getVideoTracks();
        for (const track of videoTracks) {
          track.stop();
          await Promise.resolve(track.stop()); // Await as requested
        }
        // If stream has a stop method, call and await it
        if (typeof activeStream.stop === 'function') {
          await activeStream.stop();
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
        const activeStreamForAudio = streamRef.current || stream;
        const audioTracks = activeStreamForAudio ? activeStreamForAudio.getAudioTracks() : [];
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
        streamRef.current = merged;

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

  // ✅ Cleanup timers and media on unmount
  useEffect(() => {
    return () => {
      if (busyAutoEndTimerRef.current) {
        console.log('Clearing busy auto-end timer');
        clearTimeout(busyAutoEndTimerRef.current);
        busyAutoEndTimerRef.current = null;
      }
      if (callingTimeoutTimerRef.current) {
        console.log('Clearing calling timeout timer');
        clearTimeout(callingTimeoutTimerRef.current);
        callingTimeoutTimerRef.current = null;
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) { }
        streamRef.current = null;
      }
      if (prewarmedStreamRef.current) {
        try {
          prewarmedStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) { }
        prewarmedStreamRef.current = null;
      }
      prewarmedPromiseRef.current = null;
      receiverPrewarmedTypeRef.current = null;
      if (callerPrewarmedStreamRef.current) {
        try {
          callerPrewarmedStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) { }
        callerPrewarmedStreamRef.current = null;
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

  // ── Proactive ICE restart on network change (4G↔5G, WiFi↔mobile data) ──
  // ✅ Also resets the dedup guard so the new stream after reconnect can play
  useEffect(() => {
    const triggerProactiveIceRestart = () => {
      if (isCallActiveRef.current && peerRef.current) {
        console.log('🌐 [ICE-RESTART] Network change detected during active call, triggering proactive ICE restart...');
        // ✅ Reset dedup guard so the resumed/new remote stream after reconnect re-attaches correctly
        remoteStreamAttachedRef.current = null;
        try {
          if (typeof peerRef.current.restartIce === 'function') {
            peerRef.current.restartIce();
            console.log('🔄 [ICE-RESTART] peer.restartIce() invoked');
          } else if (peerRef.current._pc && typeof peerRef.current._pc.restartIce === 'function') {
            peerRef.current._pc.restartIce();
            console.log('🔄 [ICE-RESTART] peer._pc.restartIce() invoked');
          }
        } catch (e) {
          console.warn('⚠️ [ICE-RESTART] Proactive restartIce failed:', e.message);
        }
      }
    };

    let networkListenerHandle = null;
    try {
      networkListenerHandle = Network.addListener('networkStatusChange', (status) => {
        console.log('🌐 [NETWORK-CHANGE] Capacitor network status changed:', status);
        if (status.connected) {
          triggerProactiveIceRestart();
        }
      });
    } catch (e) {
      console.warn('⚠️ [NETWORK-CHANGE] Capacitor Network listener error:', e.message);
    }

    // Browser fallback / complementary listener: navigator.connection 'change'
    const navConn = typeof navigator !== 'undefined' && (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
    if (navConn && typeof navConn.addEventListener === 'function') {
      try {
        navConn.addEventListener('change', triggerProactiveIceRestart);
      } catch (e) {}
    }

    return () => {
      if (networkListenerHandle) {
        Promise.resolve(networkListenerHandle).then(handle => {
          if (handle && typeof handle.remove === 'function') {
            handle.remove();
          } else if (typeof handle === 'function') {
            handle();
          }
        }).catch(() => {});
      }
      if (navConn && typeof navConn.removeEventListener === 'function') {
        try {
          navConn.removeEventListener('change', triggerProactiveIceRestart);
        } catch (e) {}
      }
    };
  }, []);

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
    isRinging, // ✅ NEW: Track whether receiver device is online and ringing
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
    streamRef, // ✅ Stream ref exposed for direct track access
    setRemoteStream, // ✅ NEW: Track remote WebRTC stream state setter
    setCall,
    setReceivingCall,
    setCallerSignal,
    setCallerId,
    setCalling,
    setIsRinging, // ✅ NEW: Ringing state setter
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
    prewarmCallerMedia, // ⚡ Pre-warm caller media before initiating call
    initiateCall,
    answerCall,
    rejectCall,
    clearIncomingCallUI, // Silently dismiss incoming call UI (used for FCM cancel_call in foreground)
    endCall,
    handleIncomingCall,
    handleCallRinging, // ✅ NEW: Ringing confirmation handler
    handleIceCandidate, // ✅ Trickle ICE candidate handler
    handleBusyCall, // ✅ NEW: Busy signal handler
    toggleMicrophone,
    toggleCamera,
    switchCamera,
    toggleRemoteSpeaker,
    toggleSpeakerPhone, // ✅ Speaker phone toggle (earpiece/speaker routing)
    applyAudioRouting, // ✅ Audio routing helper for external use
    dismissCallNotification, // ✅ Clear call notification helper
    attachRemoteVideoWhenReady, // ⚡ FIX 5: Canonical consolidated video attach utility
    waitForVideoUnmute, // ⚡ FIX 1: Poll+event race unmute utility (exported for use)
  };
};

export default useVideoCall;