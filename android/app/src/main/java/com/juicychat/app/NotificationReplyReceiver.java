package com.juicychat.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Handles true WhatsApp-style inline notification replies (RemoteInput).
 * Operates when app is foreground, background, minimized, or completely killed.
 */
public class NotificationReplyReceiver extends BroadcastReceiver {

    private static final String TAG = "JuicyReply";
    private static final String DEFAULT_BACKEND_URL = "https://juicyapp.in";

    public static final String ACTION_NOTIFICATION_REPLY = "com.juicychat.app.ACTION_NOTIFICATION_REPLY";
    public static final String KEY_TEXT_REPLY = "key_text_reply";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Log.d(TAG, "[JuicyReply] Notification action received: " + action);

        if (!ACTION_NOTIFICATION_REPLY.equals(action) && !"com.juicychat.app.ACTION_REPLY".equals(action)) {
            return;
        }

        // 1. Extract RemoteInput text
        Bundle remoteInputResults = RemoteInput.getResultsFromIntent(intent);
        if (remoteInputResults == null) {
            Log.w(TAG, "[JuicyReply] RemoteInput results null — ignoring action");
            return;
        }

        Log.d(TAG, "[JuicyReply] RemoteInput result found");
        CharSequence replyCharSeq = remoteInputResults.getCharSequence(KEY_TEXT_REPLY);
        if (replyCharSeq == null || replyCharSeq.toString().trim().isEmpty()) {
            Log.w(TAG, "[JuicyReply] Empty or null reply text — rejecting");
            return;
        }

        final String replyText = replyCharSeq.toString().trim();
        Log.d(TAG, "[JuicyReply] Text received: " + replyText);

        // 2. Retrieve conversation parameters passed in intent
        // senderId = person who sent us the notification (our target receiver for reply)
        // receiverId = currently logged-in user (receiving FCM push)
        final String replyTargetUser = intent.getStringExtra("senderId");
        final String fcmReceiverUser = intent.getStringExtra("receiverId");
        final String conversationId = intent.getStringExtra("conversationId");
        final int notificationId   = intent.getIntExtra("notificationId", -1);
        final String channelId       = intent.getStringExtra("channelId") != null ? intent.getStringExtra("channelId") : "chat_messages";

        // 3. Read session credentials from SharedPreferences (JuicyAppPrefs)
        SharedPreferences prefs = context.getSharedPreferences("JuicyAppPrefs", Context.MODE_PRIVATE);
        String savedUrl = prefs.getString("backendUrl", null);
        
        // 🔄 Migration: If saved URL is the old Render one, upgrade to the new primary domain
        if (savedUrl != null && savedUrl.contains("onrender.com")) {
            savedUrl = DEFAULT_BACKEND_URL;
            prefs.edit().putString("backendUrl", DEFAULT_BACKEND_URL).apply();
            Log.d(TAG, "[JuicyReply] Migrated backendUrl from legacy Render to: " + DEFAULT_BACKEND_URL);
        }
        
        final String serverUrl = (savedUrl != null && !savedUrl.isEmpty()) ? savedUrl : DEFAULT_BACKEND_URL;

        String sessionUserId = prefs.getString("userId", null);
        if (sessionUserId == null || sessionUserId.isEmpty()) {
            sessionUserId = fcmReceiverUser;
        }
        final String myUserId = sessionUserId;
        final String authToken = prefs.getString("token", null);

        Log.d(TAG, "[JuicyReply] senderId (target) = " + replyTargetUser);
        Log.d(TAG, "[JuicyReply] receiverId (me) = " + myUserId);
        Log.d(TAG, "[JuicyReply] conversationId = " + conversationId);
        Log.d(TAG, "[JuicyReply] Authentication available = " + (myUserId != null && !myUserId.isEmpty()));

        if (myUserId == null || replyTargetUser == null) {
            Log.e(TAG, "[JuicyReply] Missing user IDs — cannot send reply. myUserId=" + myUserId + ", targetId=" + replyTargetUser);
            showToast(context, "Failed to send reply (User session missing)");
            return;
        }

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // 4. Fire background HTTP request
        Log.d(TAG, "[JuicyReply] Backend request started -> " + serverUrl);
        
        new Thread(() -> {
            boolean success = false;
            int responseCode = -1;

            // A. Primary route: /api/messages/send-from-notification
            String primaryPayload = String.format(
                    "{\"senderId\":\"%s\",\"receiverId\":\"%s\",\"text\":\"%s\",\"conversationId\":\"%s\"}",
                    myUserId, replyTargetUser, sanitizeJson(replyText), conversationId != null ? conversationId : ""
            );
            responseCode = executePost(serverUrl + "/api/messages/send-from-notification", primaryPayload, authToken);
            Log.d(TAG, "[JuicyReply] /api/messages/send-from-notification HTTP status = " + responseCode);

            // B. If primary route returns 404 (e.g. server running existing code before deployment), use /api/notifications/send-message fallback
            if (responseCode == 404) {
                Log.w(TAG, "[JuicyReply] Primary endpoint returned 404 — attempting production fallback endpoint /api/notifications/send-message");
                String fallbackPayload = String.format(
                        "{\"senderId\":\"%s\",\"receiverId\":\"%s\",\"messageText\":\"%s\"}",
                        myUserId, replyTargetUser, sanitizeJson(replyText)
                );
                responseCode = executePost(serverUrl + "/api/notifications/send-message", fallbackPayload, authToken);
                Log.d(TAG, "[JuicyReply] /api/notifications/send-message HTTP status = " + responseCode);
            }

            if (responseCode == 200 || responseCode == 201) {
                success = true;
                Log.d(TAG, "[JuicyReply] Reply successfully processed and delivered");
            } else {
                Log.e(TAG, "[JuicyReply] Reply send failed | Final HTTP status: " + responseCode);
            }

            final boolean isSuccess = success;
            final int status = responseCode;

            // 5. Update Notification / Toast feedback on UI thread
            new Handler(Looper.getMainLooper()).post(() -> {
                if (isSuccess) {
                    // Success: cancel original notification and display feedback
                    if (notificationManager != null && notificationId != -1) {
                        notificationManager.cancel(notificationId);
                    }
                    showToast(context, "Reply sent: " + replyText);
                } else {
                    // Failure: keep or update notification to indicate failure
                    Log.e(TAG, "[JuicyReply] Could not send reply to backend. HTTP status: " + status);
                    showToast(context, "Failed to send message (" + status + ")");
                    
                    if (notificationManager != null && notificationId != -1) {
                        try {
                            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                                    .setSmallIcon(context.getApplicationInfo().icon)
                                    .setContentTitle("Failed to send message")
                                    .setContentText("Tap to open chat and retry: " + replyText)
                                    .setAutoCancel(true)
                                    .setColor(Color.RED)
                                    .setPriority(NotificationCompat.PRIORITY_HIGH);
                            notificationManager.notify(notificationId, builder.build());
                        } catch (Exception e) {
                            Log.w(TAG, "[JuicyReply] Could not post failure notification: " + e.getMessage());
                        }
                    }
                }
            });
        }).start();
    }

    private int executePost(String endpointUrl, String jsonPayload, String authToken) {
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
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);

            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            return connection.getResponseCode();
        } catch (Exception e) {
            Log.e(TAG, "[JuicyReply] HTTP request exception (" + endpointUrl + "): " + e.getMessage());
            return -1;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private String sanitizeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    private void showToast(Context context, String message) {
        try {
            Toast.makeText(context.getApplicationContext(), message, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.w(TAG, "[JuicyReply] Toast display warning: " + e.getMessage());
        }
    }
}
