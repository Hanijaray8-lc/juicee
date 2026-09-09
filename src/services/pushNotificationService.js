/**
 * Push Notifications Service for Capacitor Android App
 * Handles FCM registration, permission requests, and notification listeners
 */

import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Notification Channel Configuration
 * Centralized settings for all notification types
 */
const NOTIFICATION_CONFIG = {
  channels: {
    messages: {
      id: 'chat_messages',
      name: 'Chat Messages',
      icon: 'ic_notification',
      color: '#FF6B35',
      importance: 5,
      sound: 'default',
      vibration: true,
      lights: true,
    },
    calls: {
      id: 'call_notifications',
      name: 'Call Notifications',
      icon: 'ic_notification',
      color: '#FF6B35',
      importance: 5,
      sound: 'receiver.mp3',
      vibration: true,
      lights: true,
    },
    friendRequests: {
      id: 'friend_requests',
      name: 'Friend Requests',
      icon: 'ic_notification',
      color: '#FF6B35',
      importance: 4,
      sound: 'default',
      vibration: true,
    },
  },
  smallIcon: 'ic_notification',
  color: '#FF6B35',
};

// Store the FCM token in memory so it can be retrieved anytime
let _cachedFCMToken = null;

export const setCachedFCMToken = (token) => {
  if (token) {
    _cachedFCMToken = token;
  }
};

// Initialize push notifications
export const initPushNotifications = async (onNotificationReceived) => {
  try {
    // Web-safe: Check if running on Capacitor
    if (!window.Capacitor || typeof window.Capacitor.isPluginAvailable !== 'function') {
      console.log('ℹ️ Push notifications not available on web (Capacitor not detected)');
      return null;
    }

    if (!window.Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('ℹ️ PushNotifications plugin not available on this platform');
      return null;
    }

    // Request notification permissions (required for Android 13+)
    const permission = await PushNotifications.requestPermissions();
    console.log('Notification permission:', permission);

    if (permission.receive === 'granted') {
      // Register with FCM
      await PushNotifications.register();
      console.log('✅ Push notifications registered successfully');

      // Process any notifications that were delivered while the app was closed
      try {
        const delivered = await PushNotifications.getDeliveredNotifications();
        if (delivered && delivered.notifications && delivered.notifications.length > 0) {
          console.log(`📬 ${delivered.notifications.length} delivered notification(s) found`);
        }
      } catch (deliveredErr) {
        console.debug('Info: Could not check delivered notifications:', deliveredErr.message);
      }

      return permission;
    } else {
      console.warn('⚠️ Notification permissions not granted');
      return null;
    }
  } catch (err) {
    console.error('❌ Error initializing push notifications:', err.message || err);
    return null;
  }
};

// Get FCM Token — returns the cached token or waits for the registration event
export const getFCMToken = async () => {
  try {
    // Web-safe: Check if Capacitor is available 
    if (!window.Capacitor || typeof window.Capacitor.isPluginAvailable !== 'function') {
      console.log('ℹ️ FCM tokens only available on mobile app');
      return null;
    }

    if (!window.Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('ℹ️ PushNotifications plugin not available');
      return null;
    }

    // Return cached token if available
    if (_cachedFCMToken) {
      return _cachedFCMToken;
    }

    // Wait for the registration event to fire with the token
    return new Promise((resolve) => {
      let listenerHandler = null;
      const timeout = setTimeout(() => {
        if (_cachedFCMToken) {
          resolve(_cachedFCMToken);
        } else {
          console.warn('⚠️ FCM token registration timed out after 10s');
          resolve(null);
        }
      }, 10000);

      PushNotifications.addListener('registration', (token) => {
        clearTimeout(timeout);
        if (token && token.value) {
          _cachedFCMToken = token.value;
          console.log('📱 FCM Token received via registration event');
          resolve(token.value);
        }
      }).then(handler => {
        listenerHandler = handler;
        if (_cachedFCMToken) {
          clearTimeout(timeout);
          resolve(_cachedFCMToken);
        }
      }).catch(err => {
        console.warn('Error setting registration listener:', err);
      });
    });
  } catch (err) {
    console.error('❌ Error getting FCM token:', err.message || err);
    return null;
  }
};

// Add notification listeners
export const setupNotificationListeners = (handleNotification, handleNotificationTapCallback) => {
  try {
    // Web-safe: Check if Capacitor is available
    if (!window.Capacitor || typeof window.Capacitor.isPluginAvailable !== 'function') {
      console.log('ℹ️ Notification listeners only available on mobile app');
      return;
    }

    if (!window.Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('ℹ️ PushNotifications plugin not available');
      return;
    }

    // Clear existing listeners to prevent duplicates
    try {
      PushNotifications.removeAllListeners();
    } catch (e) {
      console.warn('Error clearing old listeners:', e);
    }

    // FCM token registration listener — caches token for getFCMToken()
    PushNotifications.addListener('registration', (token) => {
      _cachedFCMToken = token.value;
      console.log('🔑 FCM Token registered:', token.value ? '✅ (token received)' : '❌');
    });

    // Foreground notification received
    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification) => {
        console.log('🔔 Foreground notification received:', notification);
        // NOTE: MyFirebaseMessagingService handles displaying system notifications for
        // background/terminated state. In foreground, we just update in-app UI state.
        // Do NOT show a duplicate system notification here — the native service handles that.
        handleNotification(notification);
      }
    );

    // Background notification tapped/clicked
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async (notification) => {
        console.log('✋ User tapped notification:', notification);

        const data = notification.notification.data;

        // Navigate to chat when notification is tapped
        if (data.senderId && data.conversationId) {
          if (handleNotificationTapCallback) {
            handleNotificationTapCallback(data);
          } else {
            handleNotificationTap(data);
          }
        }
      }
    );

    // Error handling
    PushNotifications.addListener('registrationError', (err) => {
      console.error('❌ Registration error:', err.error);
    });

    console.log('✅ Notification listeners registered');
  } catch (err) {
    console.error('❌ Error setting up notification listeners:', err.message || err);
  }
};

// Handle notification tap
const handleNotificationTap = (data) => {
  // Store in localStorage (NOT sessionStorage — sessionStorage is wiped when Android kills the app).
  // ChatPage's useEffect reads this on mount and navigates to the correct conversation.
  localStorage.setItem('pendingNotification', JSON.stringify(data));

  // Also fire a custom event in case the app is already running (warm-boot)
  try {
    window.dispatchEvent(new CustomEvent('openChatNotification', { detail: data }));
  } catch (e) {
    // ignore — older WebViews may not support CustomEvent constructor
  }

  console.log('Navigating to chat:', data.senderId);
};

// Create notification channel (Android 8+)
export const createNotificationChannels = async () => {
  try {
    // Web-safe: Check if Capacitor is available
    if (!window.Capacitor || typeof window.Capacitor.isPluginAvailable !== 'function') {
      console.log('ℹ️ Notification channels only available on Android 8+ app');
      return;
    }

    if (!window.Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('ℹ️ PushNotifications plugin not available');
      return;
    }

    // Create each notification channel with icon and color configuration
    for (const [key, channel] of Object.entries(NOTIFICATION_CONFIG.channels)) {
      await PushNotifications.createChannel({
        id: channel.id,
        name: channel.name,
        importance: channel.importance,
        sound: channel.sound,
        vibration: channel.vibration,
        lights: channel.lights,
        // 🔔 NOTIFICATION ICON & COLOR - Set here without affecting other code
        lightColor: channel.color,
        smallIcon: channel.icon,
      });
      console.log(`✅ Notification channel created: ${channel.name}`);
    }
    console.log('✅ All notification channels configured with custom icon & color');
  } catch (err) {
    console.error('❌ Error creating notification channels:', err.message || err);
  }
};

// Remove notification listeners when cleanup
export const removeNotificationListeners = () => {
  try {
    // Web-safe: Only remove if Capacitor is available
    if (!window.Capacitor || typeof window.Capacitor.isPluginAvailable !== 'function') {
      return; // Not on mobile, nothing to cleanup
    }

    if (!window.Capacitor.isPluginAvailable('PushNotifications')) {
      return; // Plugin not available, nothing to cleanup
    }

    PushNotifications.removeAllListeners();
    console.log('✅ Notification listeners removed');
  } catch (err) {
    console.debug('Info: Notification listeners cleanup:', err.message || err);
  }
};

/**
 * Get notification configuration
 * Can be used across the app for consistent styling
 */
export const getNotificationConfig = () => NOTIFICATION_CONFIG;

/**
 * Update notification icon or color globally
 * Example: updateNotificationIcon('#FF0000', 'ic_new_icon')
 * Note: Only works on mobile/Capacitor app, safe to call on web
 */
export const updateNotificationIcon = (newColor, newIconName) => {
  try {
    // Web-safe: Check if Capacitor is available
    if (!window.Capacitor || typeof window.Capacitor.isPluginAvailable !== 'function') {
      console.log('ℹ️ Icon updates only available on mobile app');
      return;
    }

    if (!window.Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('ℹ️ PushNotifications plugin not available');
      return;
    }

    if (newColor) NOTIFICATION_CONFIG.color = newColor;
    if (newIconName) NOTIFICATION_CONFIG.smallIcon = newIconName;

    // Recreate channels with new settings
    createNotificationChannels();
    console.log('✅ Notification icon/color updated');
  } catch (err) {
    console.error('❌ Error updating notification icon:', err.message || err);
  }
};

// Check if the app was launched from a call notification action
export const checkCallLaunchIntent = async () => {
  try {
    if (!window.Capacitor || typeof window.Capacitor.isPluginAvailable !== 'function') {
      return null;
    }
    const { AudioRoute } = window.Capacitor.Plugins || {};
    if (AudioRoute && typeof AudioRoute.getCallLaunchIntent === 'function') {
      const res = await AudioRoute.getCallLaunchIntent();
      console.log('📱 Checked call launch intent:', res);
      if (res && res.isCall) {
        return res;
      }
    }
  } catch (err) {
    console.error('❌ Error checking call launch intent:', err);
  }
  return null;
};

export default {
  initPushNotifications,
  getFCMToken,
  setupNotificationListeners,
  createNotificationChannels,
  removeNotificationListeners,
  getNotificationConfig,
  updateNotificationIcon,
  checkCallLaunchIntent,
};
