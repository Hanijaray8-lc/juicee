package com.juicychat.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;

import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import android.app.ActivityManager;
import java.util.List;

/**
 * Handles FCM data-only messages in ALL app states:
 *   - Foreground  → fires and shows notification
 *   - Background  → Android keeps this service alive; fires and shows notification
 *   - Terminated  → Android starts this service on FCM HIGH-priority message; fires and shows notification
 *
 * KEY FIX: Extends FirebaseMessagingService directly (NOT Capacitor's MessagingService).
 * Capacitor's MessagingService depends on the JavaScript bridge being alive — which it is NOT
 * when the app is in background or terminated. By extending Firebase's own class, Android
 * guarantees onMessageReceived() runs regardless of app state.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "JuicyFCM";

    // Production backend URL — must match the URL in server.js
    private static final String BACKEND_URL = "https://juicyapp.in";

    // Notification channels (must match what pushNotificationService.js creates)
    private static final String CHANNEL_MESSAGES = "chat_messages";
    private static final String CHANNEL_CALLS    = "call_notifications";
    private static final String CHANNEL_FRIENDS  = "friend_requests";

    /**
     * Returns true when this app process is in the foreground (user is actively using the app).
     * Used to suppress native notifications that the JS layer will handle via pushNotificationReceived.
     */
    private boolean isAppInForeground() {
        try {
            ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
            List<ActivityManager.RunningAppProcessInfo> processes = am.getRunningAppProcesses();
            if (processes == null) return false;
            String packageName = getPackageName();
            for (ActivityManager.RunningAppProcessInfo proc : processes) {
                if (proc.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                        && proc.processName.equals(packageName)) {
                    return true;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "[FCM] isAppInForeground check failed: " + e.getMessage());
        }
        return false;
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // NOTE: Do NOT call super.onMessageReceived() — the parent is now FirebaseMessagingService
        // whose default implementation does nothing useful for data-only messages.
        Log.d(TAG, "[FCM] Message received from: " + remoteMessage.getFrom());

        // Ensure notification channels exist (safe to call multiple times)
        createChannelsIfNeeded();

        String title        = "Juicy";
        String body         = "You have a new message";
        String senderId     = null;
        String receiverId   = null;
        String conversationId = null;
        String type         = "message";
        String channelId    = CHANNEL_MESSAGES;
        String callerImage  = null;
        String signal       = null;
        String callType     = null;

        // Read from data payload (backend sends DATA-ONLY messages — no notification key)
        Map<String, String> data = remoteMessage.getData();
        if (!data.isEmpty()) {
            if (data.containsKey("title"))          title          = data.get("title");
            if (data.containsKey("body"))           body           = data.get("body");
            if (data.containsKey("message"))        body           = data.get("message");
            if (data.containsKey("content"))        body           = data.get("content");
            if (data.containsKey("text"))           body           = data.get("text");
            
            senderId       = data.get("senderId");
            receiverId     = data.get("receiverId");
            conversationId = data.get("conversationId");
            
            if (data.containsKey("type"))           type           = data.get("type");
            if (data.containsKey("callType"))       callType       = data.get("callType");
            if (data.containsKey("channelId"))      channelId      = data.get("channelId");
            callerImage    = data.get("callerImage");
            if (callerImage == null || callerImage.isEmpty()) {
                if (data.containsKey("senderImage")) callerImage = data.get("senderImage");
                else if (data.containsKey("profilePic")) callerImage = data.get("profilePic");
                else if (data.containsKey("avatar"))     callerImage = data.get("avatar");
                else if (data.containsKey("image"))      callerImage = data.get("image");
            }
            signal         = data.get("signal");
        }

        // Suppress notifications for gesture-locked or muted contacts
        if (isContactLocked(senderId) || isContactMuted(senderId)) {
            Log.d(TAG, "[FCM] Message from locked/muted contact " + senderId + ". Suppressing notification.");
            return;
        }

        // Handle call cancellation — dismiss any existing call notification
        // This must run regardless of foreground state so background/lock-screen notifications are cleared.
        if ("cancel_call".equals(type) || "call_cancelled".equals(type)) {
            if (senderId != null) {
                int notificationId = Math.abs(senderId.hashCode());
                NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(notificationId);
                    Log.d(TAG, "[FCM] Cancelled call notification: " + notificationId);
                }
            }
            return;
        }

        // Fallback: also read notification payload (in case server ever sends both)
        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) title = remoteMessage.getNotification().getTitle();
            if (remoteMessage.getNotification().getBody()  != null) body  = remoteMessage.getNotification().getBody();
        }

        // Route to correct channel based on type
        boolean isCall = "incoming_call".equals(type) || "call".equals(type) || 
                         "incoming-call".equals(type) || "video-call".equals(type) || 
                         "audio-call".equals(type) || "video_call".equals(type) || 
                         "audio_call".equals(type);

        // ── Foreground guard ─────────────────────────────────────────────────────
        // Calls are NEVER skipped — they must always ring and display full-screen UI.
        // For messages, only skip status-bar notification if user is actively in the app.
        if (!isCall && MainActivity.isAppVisible) {
            Log.d(TAG, "[FCM] App is active in foreground — skipping message notification (type=" + type + ")");
            return;
        }
        // ────────────────────────────────────────────────────────────────────────

        if (isCall) {
            channelId = CHANNEL_CALLS;
            boolean isVideo = (callType != null && callType.equalsIgnoreCase("video")) ||
                              body.toLowerCase().contains("video") ||
                              "video-call".equals(type) ||
                              "video_call".equals(type);
            if (callType == null) {
                callType = isVideo ? "video" : "audio";
            }
            Log.d(TAG, "[FCM] Incoming " + (isVideo ? "video" : "audio") + " call received from: " + title);
        } else if ("friend_request".equals(type)) {
            channelId = CHANNEL_FRIENDS;
        } else {
            Log.d(TAG, "[FCM] Message notification received from: " + title);
        }

        // Build and display the notification
        showNotification(title, body, senderId, receiverId, conversationId, channelId, isCall, callerImage, signal, callType);
    }

    /**
     * Called by Firebase when the FCM token changes (e.g. app reinstalled, token rotated).
     * We MUST save the new token to our backend immediately — even if the app is not open.
     * We read userId + auth token from SharedPreferences (saved by AudioRoutePlugin.saveSession()).
     */
    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "[FCM] Token refreshed");

        // Save token locally so it's available when the app next opens
        SharedPreferences prefs = getSharedPreferences("JuicyAppPrefs", MODE_PRIVATE);
        prefs.edit().putString("fcmToken", token).apply();

        // Read the user session persisted by AudioRoutePlugin.saveSession()
        String userId   = prefs.getString("userId",   null);
        String authToken = prefs.getString("token",   null);

        if (userId != null && authToken != null) {
            Log.d(TAG, "[FCM] Sending refreshed token to backend for userId: " + userId);
            sendTokenToBackend(userId, token, authToken);
        } else {
            Log.d(TAG, "[FCM] No session found in SharedPreferences — token will be sent on next login.");
        }
    }

    /**
     * Performs a background HTTP POST to save the FCM token to the backend.
     * Runs on a background thread so it does not block the main thread.
     */
    private void sendTokenToBackend(final String userId, final String token, final String authToken) {
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(BACKEND_URL + "/api/user/" + userId + "/fcm-token");
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json; utf-8");
                connection.setRequestProperty("Accept", "application/json");
                connection.setDoOutput(true);
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);

                String json = "{\"fcmToken\": \"" + token + "\"}";
                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = json.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int code = connection.getResponseCode();
                Log.d(TAG, "[FCM] Token saved to backend — HTTP " + code);
            } catch (Exception e) {
                Log.e(TAG, "[FCM] Failed to send token to backend: " + e.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    /**
     * Displays a system notification.
     * For calls: uses CallStyle (Android 12+) or action buttons (older Android), with
     * full-screen intent so it shows even on the lock screen.
     */
    private void showNotification(String title, String body, String senderId, String receiverId,
                                   String conversationId, String channelId, boolean isCall,
                                   String callerImage, String signal, String callType) {

        int notificationId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
        if (isCall && senderId != null) {
            notificationId = Math.abs(senderId.hashCode());
        } else if (!isCall && conversationId != null) {
            notificationId = Math.abs(conversationId.hashCode());
        }
        int requestCode = (int) System.currentTimeMillis();

        String resolvedCallType = (callType != null && !callType.isEmpty()) ? callType : (body.toLowerCase().contains("video") ? "video" : "audio");

        // Main tap intent — opens app and navigates to the correct screen
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (senderId     != null) intent.putExtra("senderId",       senderId);
        if (conversationId != null) intent.putExtra("conversationId", conversationId);
        if (isCall) {
            intent.putExtra("isCall",      true);
            intent.putExtra("senderName",  title.replace(" is calling...", ""));
            intent.putExtra("callType",    resolvedCallType);
            intent.putExtra("action",      "tapped");
            if (signal != null && !signal.isEmpty()) intent.putExtra("signal", signal);
        } else {
            // ✅ WhatsApp-style: tag message notification taps so MainActivity can route to the chat
            intent.putExtra("openChat",   true);
            intent.putExtra("senderName", title); // title = sender's username from backend
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Download avatar for call or message notifications (on background thread already in FCM)
        Bitmap avatar = null;
        if (callerImage != null && !callerImage.isEmpty()) {
            Bitmap downloaded = getBitmapFromUrl(callerImage);
            if (downloaded != null) {
                avatar = getCircularBitmap(downloaded);
            }
        }
        if (avatar == null && title != null && !title.isEmpty()) {
            avatar = createInitialAvatar(title);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(getSmallIconResource())
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(isCall ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCategory(isCall ? NotificationCompat.CATEGORY_CALL : NotificationCompat.CATEGORY_MESSAGE)
                .setContentIntent(pendingIntent)
                .setAllowSystemGeneratedContextualActions(false);

        if (avatar != null) {
            builder.setLargeIcon(avatar);
        }

        if (isCall) {
            // Full-screen intent: pops the notification even on the lock screen (like WhatsApp)
            // FLAG_SHOW_WHEN_LOCKED + TURN_SCREEN_ON ensure it actually appears over the lock screen
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
                try {
                    android.app.KeyguardManager km = (android.app.KeyguardManager) getSystemService(android.content.Context.KEYGUARD_SERVICE);
                    // On API 27+ we request the activity shows over lock screen via Window flags
                    // This is done in MainActivity via WindowManager, but we set it on the pending intent
                } catch (Exception e) {
                    Log.w(TAG, "KeyguardManager not available: " + e.getMessage());
                }
            }
            builder.setFullScreenIntent(pendingIntent, true);
            builder.setOngoing(true);
            builder.setVibrate(new long[]{0, 500, 1000, 500, 1000, 500, 1000});
            builder.setColor(android.graphics.Color.parseColor("#FF6B35")); // Juicy accent
            builder.setVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            builder.setCategory(NotificationCompat.CATEGORY_CALL);
            builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));

            // Play the ringtone via the notification (for background/terminated state)
            int rawResId = getResources().getIdentifier("receiver", "raw", getPackageName());
            if (rawResId != 0) {
                builder.setSound(Uri.parse("android.resource://" + getPackageName() + "/" + rawResId));
            } else {
                builder.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE));
            }

            // Accept action — opens the app and auto-answers
            Intent acceptIntent = new Intent(this, MainActivity.class);
            acceptIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            acceptIntent.putExtra("isCall",         true);
            acceptIntent.putExtra("senderId",       senderId);
            acceptIntent.putExtra("senderName",     title.replace(" is calling...", ""));
            acceptIntent.putExtra("callType",       resolvedCallType);
            acceptIntent.putExtra("action",         "accept");
            acceptIntent.putExtra("notificationId", notificationId);
            if (signal != null && !signal.isEmpty()) acceptIntent.putExtra("signal", signal);

            PendingIntent acceptPendingIntent = PendingIntent.getActivity(
                    this, requestCode + 1, acceptIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Reject action — triggers CallActionReceiver to reject without opening app
            Intent rejectIntent = new Intent(this, CallActionReceiver.class);
            rejectIntent.setAction("com.juicychat.app.ACTION_REJECT");
            rejectIntent.putExtra("callerId",       senderId);
            rejectIntent.putExtra("receiverId",     receiverId);
            rejectIntent.putExtra("notificationId", notificationId);

            PendingIntent rejectPendingIntent = PendingIntent.getBroadcast(
                    this, requestCode + 2, rejectIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Android 12+ (API 31+): Use CallStyle for WhatsApp-style call notification
            boolean useCallStyle = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                try {
                    Person callerPerson = new Person.Builder()
                            .setName(title.replace(" is calling...", ""))
                            .setIcon(avatar != null ? IconCompat.createWithBitmap(avatar) : null)
                            .setImportant(true)
                            .build();

                    builder.setStyle(
                        NotificationCompat.CallStyle.forIncomingCall(
                            callerPerson,
                            rejectPendingIntent,
                            acceptPendingIntent
                        )
                    );
                    useCallStyle = true;
                } catch (Exception e) {
                    Log.e(TAG, "Failed to apply CallStyle: " + e.getMessage());
                }
            }

            if (!useCallStyle) {
                // Fallback for Android < 12: add action buttons manually
                builder.addAction(android.R.drawable.ic_menu_call,              "Answer",  acceptPendingIntent);
                builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", rejectPendingIntent);
            }

            Log.d(TAG, "[FCM] Call notification shown for: " + title);
        } else {
            builder.setDefaults(NotificationCompat.DEFAULT_ALL);
            builder.setColor(android.graphics.Color.parseColor("#FF4D86")); // App brand color

            // WhatsApp-style MessagingStyle notification UI
            try {
                Person.Builder personBuilder = new Person.Builder()
                        .setName(title);
                if (avatar != null) {
                    personBuilder.setIcon(IconCompat.createWithBitmap(avatar));
                }
                Person sender = personBuilder.build();

                NotificationCompat.MessagingStyle messagingStyle =
                        new NotificationCompat.MessagingStyle(sender)
                                .addMessage(body, System.currentTimeMillis(), sender);

                builder.setStyle(messagingStyle);
            } catch (Exception e) {
                Log.e(TAG, "Error applying MessagingStyle: " + e.getMessage());
                builder.setStyle(new NotificationCompat.BigTextStyle().bigText(body));
            }

            Log.d(TAG, "[FCM] Message notification shown for: " + title);
        }

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(notificationId, builder.build());
        }
    }

    /**
     * Creates all notification channels on Android 8+ (Oreo).
     * Safe to call multiple times — Android ignores duplicate channel creation.
     */
    private void createChannelsIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) return;

        // ── Chat Messages channel ──────────────────────────────────────────
        if (manager.getNotificationChannel(CHANNEL_MESSAGES) == null) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_MESSAGES, "Chat Messages",
                    NotificationManager.IMPORTANCE_HIGH
            );
            ch.setDescription("New chat message notifications");
            ch.enableVibration(true);
            ch.enableLights(true);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(ch);
        }

        // ── Call Notifications channel ─────────────────────────────────────
        // We only recreate if importance is too low. Android doesn't allow upgrading
        // importance of an existing channel without deletion.
        NotificationChannel existingCallChannel = manager.getNotificationChannel(CHANNEL_CALLS);
        if (existingCallChannel == null || existingCallChannel.getImportance() < NotificationManager.IMPORTANCE_HIGH) {
            if (existingCallChannel != null) {
                manager.deleteNotificationChannel(CHANNEL_CALLS);
            }
            NotificationChannel callCh = new NotificationChannel(
                    CHANNEL_CALLS, "Call Notifications",
                    NotificationManager.IMPORTANCE_HIGH
            );
            callCh.setDescription("Incoming audio and video call notifications");
            callCh.enableVibration(true);
            callCh.setVibrationPattern(new long[]{0, 500, 1000, 500, 1000});
            callCh.enableLights(true);
            callCh.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            callCh.setBypassDnd(true); // Bypass Do-Not-Disturb for calls (like WhatsApp)

            // Set ringtone for the channel
            int rawResId = getResources().getIdentifier("receiver", "raw", getPackageName());
            Uri ringtoneUri = (rawResId != 0)
                    ? Uri.parse("android.resource://" + getPackageName() + "/" + rawResId)
                    : RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
            callCh.setSound(ringtoneUri, audioAttributes);
            manager.createNotificationChannel(callCh);
        }

        // ── Friend Requests channel ────────────────────────────────────────
        if (manager.getNotificationChannel(CHANNEL_FRIENDS) == null) {
            NotificationChannel friendCh = new NotificationChannel(
                    CHANNEL_FRIENDS, "Friend Requests",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            friendCh.setDescription("Friend request notifications");
            friendCh.enableVibration(true);
            friendCh.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(friendCh);
        }
    }

    /** Returns the notification icon resource ID (Juicy App Logo for status bar / header). */
    private int getSmallIconResource() {
        int iconRes = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (iconRes != 0) return iconRes;
        iconRes = getResources().getIdentifier("ic_launcher_round", "mipmap", getPackageName());
        if (iconRes != 0) return iconRes;
        return getApplicationInfo().icon;
    }

    private Bitmap getBitmapFromUrl(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.connect();
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            Log.e(TAG, "Error downloading profile image: " + e.getMessage());
            return null;
        }
    }

    private Bitmap getCircularBitmap(Bitmap bitmap) {
        if (bitmap == null) return null;
        try {
            int width   = bitmap.getWidth();
            int height  = bitmap.getHeight();
            int minEdge = Math.min(width, height);
            Bitmap output = Bitmap.createBitmap(minEdge, minEdge, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(output);
            final Paint paint = new Paint();
            final Rect rect    = new Rect((width - minEdge) / 2, (height - minEdge) / 2,
                                          (width + minEdge) / 2, (height + minEdge) / 2);
            final Rect dstRect = new Rect(0, 0, minEdge, minEdge);
            paint.setAntiAlias(true);
            canvas.drawARGB(0, 0, 0, 0);
            paint.setColor(0xff424242);
            canvas.drawCircle(minEdge / 2f, minEdge / 2f, minEdge / 2f, paint);
            paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
            canvas.drawBitmap(bitmap, rect, dstRect, paint);
            return output;
        } catch (Exception e) {
            Log.e(TAG, "Error creating circular bitmap: " + e.getMessage());
            return bitmap;
        }
    }

    private Bitmap createInitialAvatar(String name) {
        try {
            if (name == null || name.trim().isEmpty()) return null;
            int size = 128;
            Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            // Background circle with brand color
            Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            bgPaint.setColor(0xFFFF4D86);
            canvas.drawCircle(size / 2f, size / 2f, size / 2f, bgPaint);

            // Initial letter
            String letter = name.trim().substring(0, 1).toUpperCase();
            Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            textPaint.setColor(0xFFFFFFFF);
            textPaint.setTextSize(64);
            textPaint.setTextAlign(Paint.Align.CENTER);

            Rect textBounds = new Rect();
            textPaint.getTextBounds(letter, 0, 1, textBounds);
            float y = (size / 2f) + (textBounds.height() / 2f) - textBounds.bottom;

            canvas.drawText(letter, size / 2f, y, textPaint);
            return bitmap;
        } catch (Exception e) {
            Log.e(TAG, "Error creating initial avatar: " + e.getMessage());
            return null;
        }
    }

    private boolean isContactLocked(String senderId) {
        if (senderId == null || senderId.isEmpty()) return false;
        try {
            SharedPreferences prefs = getSharedPreferences("JuicyAppPrefs", MODE_PRIVATE);
            java.util.Set<String> lockedContacts = prefs.getStringSet("lockedContacts", null);
            return lockedContacts != null && lockedContacts.contains(senderId);
        } catch (Exception e) {
            Log.e(TAG, "Error checking locked contacts", e);
            return false;
        }
    }

    private boolean isContactMuted(String senderId) {
        if (senderId == null || senderId.isEmpty()) return false;
        try {
            SharedPreferences prefs = getSharedPreferences("JuicyAppPrefs", MODE_PRIVATE);
            java.util.Set<String> mutedContacts = prefs.getStringSet("mutedContacts", null);
            return mutedContacts != null && mutedContacts.contains(senderId);
        } catch (Exception e) {
            Log.e(TAG, "Error checking muted contacts", e);
            return false;
        }
    }
}
