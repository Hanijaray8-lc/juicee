/**
 * QUICK START: Copy-Paste Integration Examples
 * Use these code snippets to integrate push notifications quickly
 */

// ============================================================================
// BACKEND: server.js - Add these lines
// ============================================================================

// Add to importsheading section
const notificationRoutes = require('./routes/notifications');

// Add to middleware section (after other routes)
app.use(notificationRoutes);

// Save Firebase service account key in backend/.env
/**
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
*/

// ============================================================================
// BACKEND: Update send_message socket event in server.js
// ============================================================================

socket.on('send_message', async (newMessage) => {
  try {
    // ... existing code ...

    // 🔥 ADD THIS: Send FCM notification to recipient
    const { sendMessageNotification } = require('./services/pushNotificationService');
    const Message = require('./models/Message');

    // Get recipient user to access their FCM token
    const User = require('./models/User');
    const recipient = await User.findById(newMessage.receiverId);
    const sender = await User.findById(newMessage.senderId);

    if (recipient && recipient.fcmToken && sender) {
      await sendMessageNotification(
        recipient,
        sender,
        newMessage.text || '[Image]'
      );
    }

    // Broadcast message to room
    io.to(newMessage.roomId).emit('receive_message', newMessage);
  } catch (err) {
    console.error('Error handling send_message:', err);
  }
});

// ============================================================================
// BACKEND: Update incoming call handling in server.js
// ============================================================================

socket.on('callUser', async (data) => {
  try {
    // ... existing code ...

    // 🔥 ADD THIS: Send call notification
    const { sendCallNotification } = require('./services/pushNotificationService');
    const User = require('./models/User');

    const recipient = await User.findById(data.to);
    const caller = await User.findById(data.from);

    if (recipient && recipient.fcmToken && caller) {
      await sendCallNotification(recipient, caller, data.callType || 'audio');
    }

    // Forward signal to recipient
    io.to(data.to).emit('callUser', data);
  } catch (err) {
    console.error('Error in callUser:', err);
  }
});

// ============================================================================
// FRONTEND: ChatPage.js - Add to imports
// ============================================================================

import {
  initPushNotifications,
  getFCMToken,
  setupNotificationListeners,
  createNotificationChannels,
  removeNotificationListeners
} from './services/pushNotificationService';

// ============================================================================
// FRONTEND: ChatPage.js - Add useEffect for push notifications
// ============================================================================

// Add this inside ChatPage component (after other useEffects)
useEffect(() => {
  const setupPushNotifications = async () => {
    try {
      // Create notification channels
      await createNotificationChannels();

      // Request permissions and register with FCM
      await initPushNotifications((notification) => {
        handleNotificationReceived(notification);
      });

      // Get FCM token
      const fcmToken = await getFCMToken();
      console.log('📱 FCM Token:', fcmToken);

      if (fcmToken && user?._id) {
        // Save token to backend
        try {
          const response = await fetch(
<<<<<<< HEAD
            `https://juicyapp.in//api/user/${user._id}/fcm-token`,
=======
            `https://juicyapp.in/api/user/${user._id}/fcm-token`,
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fcmToken }),
            }
          );
          console.log('✅ FCM token saved to backend');
        } catch (err) {
          console.error('❌ Error saving FCM token:', err);
        }
      }

      // Setup listeners for incoming notifications
      setupNotificationListeners((notification) => {
        handleNotificationReceived(notification);
      });

      console.log('✅ Push notifications initialized');
    } catch (err) {
      console.error('❌ Error initializing push notifications:', err);
    }
  };

  // Only setup if this is a Capacitor/mobile app
  if (window.Capacitor && window.Capacitor.isPluginAvailable('PushNotifications')) {
    setupPushNotifications();
  }

  // Cleanup
  return () => {
    removeNotificationListeners();
  };
}, [user]);

// ============================================================================
// FRONTEND: ChatPage.js - Add notification handler
// ============================================================================

const handleNotificationReceived = async (notification) => {
  console.log('🔔 Notification received:', notification);

  const data = notification.notification?.data || notification.data || {};
  const body = notification.notification?.body || '';
  const title = notification.notification?.title || '';

  // Update UI with notification data
  if (data.senderId) {
    // Increment unread count
    setUnread(prev => ({
      ...prev,
      [data.senderId]: (prev[data.senderId] || 0) + 1
    }));

    console.log(`📬 New message from ${title}: ${body}`);

    // Optional: Play notification sound
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.warn('Autoplay prevented:', e));
    } catch (err) {
      console.warn('Error playing sound:', err);
    }
  }

  // Handle call notifications
  if (data.type === 'incoming_call') {
    console.log('📞 Incoming call from:', title);
    // Socket event will handle the actual call UI
  }
};

// ============================================================================
// ANDROID: AndroidManifest.xml - Add these permissions
// ============================================================================

/*
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />

<meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
*/

// ============================================================================
// ANDROID: app/build.gradle - Add dependencies
// ============================================================================

/*
plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'  // Add this line
}

dependencies {
    // Add Firebase
    implementation platform('com.google.firebase:firebase-bom:32.3.1')
    implementation 'com.google.firebase:firebase-messaging:23.2.1'

    // Other dependencies...
}
*/

// ============================================================================
// Test the implementation
// ============================================================================

/**
1. Build Android app: npx cap run android
2. Go to Firebase Console → Cloud Messaging
3. Send test notification to your app
4. Check if notification appears in Android notification bar
5. Tap notification to navigate to chat
*/

// ============================================================================
// Database Migration - Run once
// ============================================================================

/**
// MongoDB - Add these fields to all existing users
db.users.updateMany({}, { $set: {
  fcmToken: null,
  fcmTokens: []
}})
*/

// ============================================================================
// .gitignore - Add these entries
// ============================================================================

/*
# Firebase
backend/serviceAccountKey.json
android/app/google-services.json
.env
*/

// ============================================================================
// Testing Checklist
// ============================================================================

/*
✅ TEST 1: Permission Request
  - App opens → "Allow" button appears for notifications
  - User taps "Allow"
  - Permission is granted

✅ TEST 2: FCM Token Registration
  - Check browser console for "✅ Push notifications registered"
  - Check MongoDB to verify fcmToken is saved for user

✅ TEST 3: Send Test Notification
  - Firebase Console → Cloud Messaging → Send Message
  - Notification appears in Android notification bar
  - App shows unread badge

✅ TEST 4: Notification Tap
  - User has app in background
  - Notification appears in notification bar
  - User taps notification
  - App opens and navigates to correct chat

✅ TEST 5: Message Notification
  - User A sends message to User B
  - User B (on Android) receives notification instantly
  - Notification shows User A's name and message preview

✅ TEST 6: Call Notification
  - User A calls User B
  - User B receives call notification
  - Notification shows "User A is calling" with call icon
  - User B can accept/reject from notification or app
*/
