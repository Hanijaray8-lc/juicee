package com.juicychat.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.RemoteInput;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

/**
 * Handles action button clicks on WhatsApp-style message notifications:
 *   - "Reply"        → inline RemoteInput text reply sent directly to backend
 *   - "Mark as read" → cancels notification and marks conversation read
 *   - "Mute"         → mutes notifications for senderId in SharedPreferences
 */
public class NotificationActionReceiver extends BroadcastReceiver {

    private static final String TAG = "JuicyNotifReceiver";
    private static final String DEFAULT_BACKEND_URL = "https://juicyapp.in";

    public static final String ACTION_REPLY = "com.juicychat.app.ACTION_REPLY";
    public static final String ACTION_MARK_READ = "com.juicychat.app.ACTION_MARK_READ";
    public static final String ACTION_MUTE = "com.juicychat.app.ACTION_MUTE";
    public static final String KEY_TEXT_REPLY = "key_text_reply";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        final String senderId = intent.getStringExtra("senderId"); // The person who messaged us
        final String receiverIdExtra = intent.getStringExtra("receiverId"); // Our user ID
        final int notificationId = intent.getIntExtra("notificationId", -1);

        SharedPreferences prefs = context.getSharedPreferences("JuicyAppPrefs", Context.MODE_PRIVATE);
        String savedUrl = prefs.getString("backendUrl", null);

        // 🔄 Migration: Upgrade from legacy Render URL to new primary domain
        if (savedUrl != null && savedUrl.contains("onrender.com")) {
            savedUrl = DEFAULT_BACKEND_URL;
            prefs.edit().putString("backendUrl", DEFAULT_BACKEND_URL).apply();
            Log.d(TAG, "[NotificationAction] Migrated backendUrl from Render to: " + DEFAULT_BACKEND_URL);
        }

        final String serverUrl = (savedUrl != null && !savedUrl.isEmpty()) ? savedUrl : DEFAULT_BACKEND_URL;
        
        // Resolve our logged in user ID (fallback to receiverId extra from FCM payload)
        String userIdStr = prefs.getString("userId", null);
        if (userIdStr == null || userIdStr.isEmpty()) {
            userIdStr = receiverIdExtra;
        }
        final String currentUserId = userIdStr;
        final String authToken = prefs.getString("token", null);

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (ACTION_REPLY.equals(action)) {
            Bundle remoteInputResults = RemoteInput.getResultsFromIntent(intent);
            if (remoteInputResults != null) {
                CharSequence replyTextChar = remoteInputResults.getCharSequence(KEY_TEXT_REPLY);
                if (replyTextChar != null && replyTextChar.length() > 0) {
                    final String replyText = replyTextChar.toString().trim();
                    Log.d(TAG, "[NotificationAction] Inline reply received from user " + currentUserId + " for sender " + senderId + ": " + replyText);

                    // 1. Dismiss notification banner immediately
                    if (notificationManager != null && notificationId != -1) {
                        notificationManager.cancel(notificationId);
                    }

                    // 2. Feedback toast on UI thread
                    showToast(context, "Reply sent: " + replyText);

                    // 3. Send message via backend API in background thread
                    if (currentUserId != null && senderId != null && !replyText.isEmpty()) {
                        new Thread(() -> {
                            // A. Send message HTTP POST
                            sendHttpRequest(serverUrl + "/api/messages",
                                    String.format("{\"senderId\":\"%s\",\"receiverId\":\"%s\",\"text\":\"%s\",\"content\":\"%s\",\"message\":\"%s\"}",
                                            currentUserId, senderId, sanitize(replyText), sanitize(replyText), sanitize(replyText)),
                                    authToken);

                            // B. Notify FCM backend to trigger push notification for receiver
                            sendHttpRequest(serverUrl + "/api/notifications/send",
                                    String.format("{\"senderId\":\"%s\",\"receiverId\":\"%s\",\"title\":\"New Message\",\"body\":\"%s\",\"text\":\"%s\"}",
                                            currentUserId, senderId, sanitize(replyText), sanitize(replyText)),
                                    authToken);
                        }).start();
                    } else {
                        Log.w(TAG, "[NotificationAction] Could not send reply: currentUserId=" + currentUserId + ", senderId=" + senderId);
                    }
                }
            }
        } else if (ACTION_MARK_READ.equals(action)) {
            Log.d(TAG, "[NotificationAction] Mark as read clicked for senderId: " + senderId);
            if (notificationManager != null && notificationId != -1) {
                notificationManager.cancel(notificationId);
            }

            if (currentUserId != null && senderId != null) {
                new Thread(() -> {
                    sendHttpRequest(serverUrl + "/api/messages/mark-read",
                            String.format("{\"userId\":\"%s\",\"chatWithId\":\"%s\"}", currentUserId, senderId),
                            authToken);
                }).start();
            }
        } else if (ACTION_MUTE.equals(action)) {
            Log.d(TAG, "[NotificationAction] Mute clicked for senderId: " + senderId);
            if (notificationManager != null && notificationId != -1) {
                notificationManager.cancel(notificationId);
            }

            if (senderId != null) {
                Set<String> muted = new HashSet<>(prefs.getStringSet("mutedContacts", new HashSet<>()));
                muted.add(senderId);
                prefs.edit().putStringSet("mutedContacts", muted).apply();
                Log.d(TAG, "[NotificationAction] Added " + senderId + " to mutedContacts");
                showToast(context, "Muted notifications for this contact");
            }
        }
    }

    private void sendHttpRequest(String endpointUrl, String jsonPayload, String authToken) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(endpointUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json; utf-8");
            connection.setRequestProperty("Accept", "application/json");
            if (authToken != null && !authToken.isEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer " + authToken);
            }
            connection.setDoOutput(true);
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);

            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int code = connection.getResponseCode();
            Log.d(TAG, "[NotificationAction] API (" + endpointUrl + ") response code: " + code);
        } catch (Exception e) {
            Log.w(TAG, "[NotificationAction] API (" + endpointUrl + ") request exception: " + e.getMessage());
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private String sanitize(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private void showToast(Context context, String msg) {
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                Toast.makeText(context.getApplicationContext(), msg, Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Log.w(TAG, "Could not show toast: " + e.getMessage());
            }
        });
    }
}
