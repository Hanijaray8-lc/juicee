import { useEffect } from 'react';
import { App } from '@capacitor/app';
import {
  initPushNotifications,
  getFCMToken,
  setupNotificationListeners,
  createNotificationChannels,
  removeNotificationListeners,
  checkCallLaunchIntent,
  setCachedFCMToken
} from './services/pushNotificationService';
import API_BASE_URL from './config/apiConfig';

export const usePushNotifications = (user, setUnread, videoCallRef, navigate) => {
  useEffect(() => {
    let appStateListener = null;

    // 🔔 Handle received push notifications (foreground only — background handled natively)
    const handleNotificationReceived = (notification) => {
      try {
        console.log('🔔 [FCM Foreground] Notification received:', notification);

        const data = notification?.notification?.data || notification?.data || {};
        const type = data.type || '';
        const title = notification?.notification?.title || data.title || '';

        // ── Incoming call via FCM (foreground path) ───────────────────────────────
        // Covers: Socket disconnected, race condition, or late FCM delivery.
        // The native MyFirebaseMessagingService skips showNotification() when foreground
        // so it's safe to trigger the in-app call UI here without duplicates.
        const isCallType = type === 'incoming_call' || type === 'incoming-call'
          || type === 'call' || type === 'audio_call' || type === 'video_call'
          || type === 'audio-call' || type === 'video-call';

        if (isCallType) {
          if (videoCallRef?.current && typeof videoCallRef.current.handleIncomingCall === 'function') {
            // Parse signal if present (may not always be in FCM data payload)
            let parsedSignal = null;
            if (data.signal) {
              try {
                parsedSignal = typeof data.signal === 'string'
                  ? JSON.parse(data.signal)
                  : data.signal;
              } catch (e) {
                console.warn('[FCM Foreground] Could not parse call signal:', e.message);
              }
            }
            const callType = data.callType
              || (String(data.body || title).toLowerCase().includes('video') ? 'video' : 'audio');

            // Guard: Socket may have already triggered receivingCall — don't show twice
            if (!videoCallRef.current.receivingCall) {
              console.log('[FCM Foreground] Routing incoming_call to in-app call UI');
              videoCallRef.current.handleIncomingCall({
                from: data.senderId,
                callerName: data.senderName || title.replace(' is calling...', '') || 'Unknown',
                callType,
                signal: parsedSignal,
              });
            } else {
              console.log('[FCM Foreground] Already receivingCall (Socket delivered first) — skipping duplicate');
            }
          } else {
            console.warn('[FCM Foreground] incoming_call arrived but videoCallRef not ready yet');
          }
          return; // Never update unread for call-type notifications
        }

        // ── Call cancelled / caller hung up ──────────────────────────────────────
        // Silently dismiss the in-app ringing UI without emitting socket rejectCall.
        if (type === 'cancel_call' || type === 'call_cancelled') {
          console.log('[FCM Foreground] cancel_call received — clearing in-app ringing UI');
          if (videoCallRef?.current && videoCallRef.current.receivingCall
            && typeof videoCallRef.current.clearIncomingCallUI === 'function') {
            videoCallRef.current.clearIncomingCallUI();
          }
          return;
        }

        // ── Message: update unread badge ──────────────────────────────────────────
        // Socket.IO already delivered the message to the chat UI in real time.
        // We just need to bump the unread counter for conversations the user isn't viewing.
        if (data.senderId) {
          setUnread(prev => ({
            ...prev,
            [data.senderId]: (prev[data.senderId] || 0) + 1,
          }));
          console.log(`📬 [FCM Foreground] Unread bumped for senderId: ${data.senderId}`);
        }
      } catch (err) {
        console.error('❌ Error handling foreground notification:', err);
      }
    };

    const saveTokenToBackend = async (fcmToken) => {
      if (!fcmToken || !user?._id) return;
      try {
        setCachedFCMToken(fcmToken);
        const response = await fetch(
          `${API_BASE_URL}/api/user/${user._id}/fcm-token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fcmToken }),
          }
        );
        if (response.ok) {
          console.log('✅ FCM token saved to backend');

          // 🔑 Also persist session to Android SharedPreferences so onNewToken()
          // in MyFirebaseMessagingService can send refreshed tokens to the backend
          // even when the app is completely closed.
          try {
            const { AudioRoute } = window?.Capacitor?.Plugins || {};
            if (AudioRoute && typeof AudioRoute.saveSession === 'function') {
              const authToken = localStorage.getItem('token') || '';
              const username = localStorage.getItem('username') || '';
              await AudioRoute.saveSession({
                userId: user._id,
                token: authToken,
                username: username,
                backendUrl: 'https://juicyapp.in', // ✅ persisted for CallActionReceiver
              });
              console.log('[FCM] Session persisted to native SharedPreferences for token refresh support');
            }
          } catch (sessionErr) {
            console.warn('[FCM] Could not save session to native SharedPreferences:', sessionErr.message);
          }
        }
      } catch (err) {
        console.error('❌ Error saving FCM token to backend:', err.message);
      }
    };

    const setupPushNotifications = async () => {
      try {
        // ⚠️ CRITICAL: Check if running on mobile/Capacitor BEFORE any operation
        const isMobileApp = typeof window !== 'undefined' &&
          window.Capacitor &&
          typeof window.Capacitor.isPluginAvailable === 'function';

        if (!isMobileApp) {
          console.log('[FCM] Push notifications only available on Android/iOS app (not on web browser)');
          return;
        }

        // Double-check plugin availability before any calls
        if (!window.Capacitor.isPluginAvailable('PushNotifications')) {
          console.log('[FCM] PushNotifications plugin not available on this platform');
          return;
        }

        console.log('[FCM] Setting up push notifications for user:', user?._id);

        // ── STEP 1: Create notification channels ─────────────────────────────
        // NOTE: Channel creation failure is NON-FATAL — do NOT return on error.
        // A channel error previously aborted the entire FCM pipeline (listeners,
        // register, token). Now it is logged and setup continues regardless.
        try {
          await createNotificationChannels();
          console.log('[FCM] Notification channels created');
        } catch (err) {
          console.warn('[FCM] Channel creation warning (non-fatal, setup continues):', err.message);
          // ✅ NO return here — channel failure must not stop FCM registration
        }

        // ── STEP 2: Setup listeners BEFORE register() so token event is captured
        try {
          setupNotificationListeners(
            (notification) => {
              handleNotificationReceived(notification);
            },
            (data) => {
              console.log('[FCM] Notification tapped by user:', data?.type || 'unknown');
              if (data.senderId && data.conversationId) {
                sessionStorage.setItem('pendingNotification', JSON.stringify(data));
                window.dispatchEvent(new CustomEvent('openChatNotification', { detail: data }));
                if (navigate) {
                  navigate('/chat');
                }
              }
            }
          );
          console.log('[FCM] Listeners registered');
        } catch (err) {
          console.error('[FCM] Error setting up notification listeners:', err.message);
        }

        // ── STEP 3: Request permission + register with FCM ──────────────────
        console.log('[FCM] Requesting notification permission and registering...');
        try {
          const permResult = await initPushNotifications();
          console.log('[FCM] Permission result:', permResult ? permResult.receive : 'null');
          if (!permResult) {
            console.warn('[FCM] Permission not granted — notifications will not appear');
          } else {
            console.log('[FCM] PushNotifications.register() called');
          }
        } catch (err) {
          console.error('[FCM] Error initializing push notifications:', err.message);
          // Non-fatal: try to get token anyway (may have been registered before)
        }

        // ── STEP 4: Get FCM token and sync to backend ───────────────────────
        try {
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            console.log('[FCM] Token obtained ✅ — syncing to backend');
            await saveTokenToBackend(fcmToken);
          } else {
            console.warn('[FCM] Token NOT obtained ❌ — check registrationError in logcat');
          }
        } catch (err) {
          console.error('[FCM] Error with FCM token:', err.message);
        }

        // ── STEP 5: Handle call launch intent ──────────────────────────────
        try {
          const handleCallIntent = (intent) => {
            if (intent && intent.isCall) {
              console.log('[FCM] Processing call intent:', intent.action);
              let parsedSignal = null;
              if (intent.signal) {
                try {
                  parsedSignal = typeof intent.signal === 'string' ? JSON.parse(intent.signal) : intent.signal;
                } catch (e) {
                  console.warn('[FCM] Error parsing intent signal:', e);
                }
              }
              if (intent.action === 'accept') {
                sessionStorage.setItem('pendingCallAccept', JSON.stringify({ ...intent, signal: parsedSignal }));
              }
              if (videoCallRef.current) {
                videoCallRef.current.handleIncomingCall({
                  from: intent.senderId,
                  callerName: intent.senderName,
                  callType: intent.callType,
                  signal: parsedSignal
                });
              }
            }
          };

          // Check if app was launched via a call notification action
          const initialIntent = await checkCallLaunchIntent();
          handleCallIntent(initialIntent);

          // Add listener for when app resumes from background
          appStateListener = await App.addListener('appStateChange', async (state) => {
            if (state.isActive) {
              console.log('[FCM] App resumed — checking call intent and refreshing token');
              const resumedIntent = await checkCallLaunchIntent();
              handleCallIntent(resumedIntent);
              const token = await getFCMToken();
              if (token) saveTokenToBackend(token);
            }
          });
        } catch (intentErr) {
          console.error('[FCM] Error checking call launch intent:', intentErr.message);
        }

        console.log('[FCM] ✅ Push notifications fully initialized');
      } catch (err) {
        console.error('[FCM] Unexpected error in push notification setup:', err.message);
      }
    };

    // Only setup on actual mobile app with valid user
    if (user?._id && typeof window !== 'undefined' && window.Capacitor) {
      setupPushNotifications();
    }

    // Cleanup listeners on unmount (only if Capacitor is available)
    return () => {
      if (appStateListener) {
        try {
          appStateListener.remove();
        } catch (e) {
          console.warn('Error removing appStateChange listener:', e);
        }
      }
      if (typeof window !== 'undefined' && window.Capacitor) {
        try {
          removeNotificationListeners();
        } catch (err) {
          console.debug('Cleanup notification listeners:', err.message);
        }
      }
    };
  }, [user, setUnread, videoCallRef, navigate]);
};
