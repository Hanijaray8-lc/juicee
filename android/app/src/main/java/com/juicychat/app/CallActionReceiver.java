package com.juicychat.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * BroadcastReceiver to handle background call rejection.
 * Triggered from the "Decline" button on the calling notification.
 * Works even when the app is completely closed.
 */
public class CallActionReceiver extends BroadcastReceiver {

    private static final String TAG = "JuicyCallReceiver";
<<<<<<< HEAD
    // ✅ Use correct production URL that matches server.js
    private static final String DEFAULT_BACKEND_URL = "https://juicyapp.in";
=======
    private static final String DEFAULT_BACKEND_URL = "https://juicy.lcind.space";
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        Log.d(TAG, "Received action: " + action);

        if ("com.juicychat.app.ACTION_REJECT".equals(action)) {
            final String callerId = intent.getStringExtra("callerId");
            final String receiverId = intent.getStringExtra("receiverId");
            final int notificationId = intent.getIntExtra("notificationId", -1);

            // ✅ Read backend URL from SharedPreferences first (saved by AudioRoutePlugin.saveSession)
            // Falls back to hardcoded production URL if not set
            android.content.SharedPreferences prefs = context.getSharedPreferences("JuicyAppPrefs", Context.MODE_PRIVATE);
            String savedUrl = prefs.getString("backendUrl", null);

            // 🔄 Migration: Upgrade legacy Render URL
            if (savedUrl != null && savedUrl.contains("onrender.com")) {
                savedUrl = DEFAULT_BACKEND_URL;
                prefs.edit().putString("backendUrl", DEFAULT_BACKEND_URL).apply();
                Log.d(TAG, "Migrated backendUrl from Render to: " + DEFAULT_BACKEND_URL);
            }

            final String serverUrl = (savedUrl != null && !savedUrl.isEmpty()) ? savedUrl
                    : (intent.getStringExtra("serverUrl") != null ? intent.getStringExtra("serverUrl") : DEFAULT_BACKEND_URL);

            Log.d(TAG, "Rejecting call. Caller: " + callerId + ", Receiver: " + receiverId);

            // 1. Cancel the active notification immediately
            if (notificationId != -1) {
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(notificationId);
                    Log.d(TAG, "Notification cancelled: " + notificationId);
                }
            }

            // 2. Fire background request to backend to notify the caller (running in a background thread)
            if (callerId != null && receiverId != null) {
                Log.d(TAG, "Starting rejection thread for URL: " + serverUrl);
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        HttpURLConnection connection = null;
                        try {
                            URL url = new URL(serverUrl + "/api/notifications/reject-call");
                            connection = (HttpURLConnection) url.openConnection();
                            connection.setRequestMethod("POST");
                            connection.setRequestProperty("Content-Type", "application/json; utf-8");
                            connection.setRequestProperty("Accept", "application/json");
                            connection.setDoOutput(true);
                            connection.setConnectTimeout(10000);
                            connection.setReadTimeout(10000);

                            String jsonInputString = "{\"callerId\": \"" + callerId + "\", \"receiverId\": \"" + receiverId + "\"}";

                            try (OutputStream os = connection.getOutputStream()) {
                                byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
                                os.write(input, 0, input.length);
                            }

                            int code = connection.getResponseCode();
                            Log.d(TAG, "Rejection API response code: " + code);
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to call rejection API: " + e.getMessage(), e);
                        } finally {
                            if (connection != null) {
                                connection.disconnect();
                            }
                        }
                    }
                }).start();
            }
        }
    }
}
