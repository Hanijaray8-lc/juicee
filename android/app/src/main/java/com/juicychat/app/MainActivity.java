package com.juicychat.app;

import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.MediaPlayer;
<<<<<<< HEAD
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.net.Uri;
=======
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
<<<<<<< HEAD
import android.app.KeyguardManager;
import android.view.WindowManager;
=======
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
import androidx.core.view.ViewCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.JSObject;
<<<<<<< HEAD
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
=======
import java.util.List;

>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
public class MainActivity extends BridgeActivity {
    
    public static boolean isAppVisible = false;
    private static JSObject lastCallIntent = null;
    // Pending message notification data (from notification tap cold-boot)
    private static String pendingChatSenderId = null;
    private static String pendingChatSenderName = null;

    // Save original audio settings to restore them afterwards
    private int originalMode = AudioManager.MODE_NORMAL;
    private boolean originalSpeakerphoneOn = false;
    private boolean isRingtoneRoutingActive = false;

    // Native ringtone MediaPlayer to play caller.mp3 via the communication/voice stream
    private MediaPlayer ringtonePlayer = null;

    public static JSObject getLastCallIntent() {
        JSObject temp = lastCallIntent;
        lastCallIntent = null; // Clear after reading once
        return temp;
    }

<<<<<<< HEAD
=======
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AudioRoutePlugin.class);
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
        
        // Reset webview parent padding to prevent double inset conflicts
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();

            // Add JavaScript interface for Audio Route interception
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void onCallerRingtoneStart() {
                    runOnUiThread(() -> {
                        configureAudioForEarpiece();
                        playRingtoneNatively();
                    });
                }

                @JavascriptInterface
                public void onCallerRingtoneStop() {
                    runOnUiThread(() -> {
                        stopRingtoneNatively();
                        restoreAudioState();
                    });
                }
            }, "AudioRouteBridge");

            // Override WebViewClient to inject audio interception script
            webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    injectAudioInterception(view);
                }
            });

            webView.post(() -> {
                try {
                    View parent = (View) webView.getParent();
                    ViewCompat.setOnApplyWindowInsetsListener(parent, (v, insets) -> {
                        v.setPadding(0, 0, 0, 0);
                        return insets;
                    });
                    webView.requestApplyInsets();
                } catch (Exception e) {
                    android.util.Log.e("MainActivity", "Error setting window insets listener", e);
                }
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onDestroy() {
        stopRingtoneNatively();
        restoreAudioState();
        super.onDestroy();
    }

>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
    private void handleIntent(Intent intent) {
        if (intent != null) {
            if (intent.hasExtra("notificationId")) {
                int notificationId = intent.getIntExtra("notificationId", -1);
                if (notificationId != -1) {
                    try {
                        android.app.NotificationManager manager = (android.app.NotificationManager) getSystemService(android.content.Context.NOTIFICATION_SERVICE);
                        if (manager != null) {
                            manager.cancel(notificationId);
                            android.util.Log.d("MainActivity", "Cancelled notification: " + notificationId);
                        }
                    } catch (Exception e) {
                        android.util.Log.e("MainActivity", "Error cancelling notification", e);
                    }
                }
            }
            if (intent.hasExtra("isCall")) {
                JSObject data = new JSObject();
                data.put("isCall", intent.getBooleanExtra("isCall", false));
                data.put("senderId", intent.getStringExtra("senderId"));
                data.put("senderName", intent.getStringExtra("senderName"));
                data.put("callType", intent.getStringExtra("callType"));
                data.put("action", intent.getStringExtra("action"));
                if (intent.hasExtra("signal")) {
                    data.put("signal", intent.getStringExtra("signal"));
                }
                lastCallIntent = data;
            } else if (intent.getBooleanExtra("openChat", false) && intent.hasExtra("senderId")) {
                // ✅ WhatsApp-style: launched from a message notification tap
                // Store in pending map; JS side reads this via window.juicyOpenChat or localStorage
                String senderId = intent.getStringExtra("senderId");
                String senderName = intent.getStringExtra("senderName");
                android.util.Log.d("MainActivity", "[Notif] Opened from message notification — senderId=" + senderId);

                // Store for cold-boot: JS reads from localStorage via pendingNavigation key
                pendingChatSenderId = senderId;
                pendingChatSenderName = senderName;
            } else if (intent.hasExtra("conversationId")) {
                JSObject data = new JSObject();
                data.put("isCall", false);
                data.put("senderId", intent.getStringExtra("senderId"));
                data.put("conversationId", intent.getStringExtra("conversationId"));
                lastCallIntent = data;
            }
        }
    }

<<<<<<< HEAD
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // ── Chat Messages ─────────────────────────────────────────────
            // Only create if it doesn't already exist (IMPORTANCE_HIGH is correct here)
            if (manager.getNotificationChannel("chat_messages") == null) {
                NotificationChannel messagesChannel = new NotificationChannel(
                        "chat_messages", "Chat Messages",
                        NotificationManager.IMPORTANCE_HIGH
                );
                messagesChannel.setDescription("New chat message notifications");
                messagesChannel.enableVibration(true);
                messagesChannel.enableLights(true);
                messagesChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(messagesChannel);
            }

            // ── Call Notifications ────────────────────────────────────────
            // Android does NOT allow upgrading an existing channel's importance after first creation.
            // We only recreate if importance is too low.
            NotificationChannel existingCallChannel = manager.getNotificationChannel("call_notifications");
            if (existingCallChannel == null || existingCallChannel.getImportance() < NotificationManager.IMPORTANCE_HIGH) {
                if (existingCallChannel != null) {
                    manager.deleteNotificationChannel("call_notifications");
                }
                NotificationChannel callsChannel = new NotificationChannel(
                        "call_notifications", "Call Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                callsChannel.setDescription("Incoming audio and video call notifications");
                callsChannel.enableVibration(true);
                callsChannel.setVibrationPattern(new long[]{0, 500, 1000, 500, 1000});
                callsChannel.enableLights(true);
                callsChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                callsChannel.setBypassDnd(true); // Bypass Do-Not-Disturb (like WhatsApp calls)

                // Use raw resource ID to avoid extension lookup issues
                int rawResId = getResources().getIdentifier("receiver", "raw", getPackageName());
                Uri ringtoneUri = (rawResId != 0)
                        ? Uri.parse("android.resource://" + getPackageName() + "/" + rawResId)
                        : android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build();
                callsChannel.setSound(ringtoneUri, audioAttributes);
                manager.createNotificationChannel(callsChannel);
            }

            // ── Friend Requests ───────────────────────────────────────────
            if (manager.getNotificationChannel("friend_requests") == null) {
                NotificationChannel friendsChannel = new NotificationChannel(
                        "friend_requests", "Friend Requests",
                        NotificationManager.IMPORTANCE_DEFAULT
                );
                friendsChannel.setDescription("Friend request notifications");
                friendsChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(friendsChannel);
=======
    // Helper to configure audio routing for earpiece
    private void configureAudioForEarpiece() {
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            try {
                if (!isRingtoneRoutingActive) {
                    originalMode = audioManager.getMode();
                    originalSpeakerphoneOn = audioManager.isSpeakerphoneOn();
                    isRingtoneRoutingActive = true;
                    android.util.Log.d("MainActivity", "Saved original audio state: mode=" + originalMode + ", speaker=" + originalSpeakerphoneOn);
                }

                // 1. Set mode to MODE_IN_COMMUNICATION (VoIP call mode)
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

                // 2. Disable speakerphone
                audioManager.setSpeakerphoneOn(false);

                // 3. For Android 12+ (API 31+), route using setCommunicationDevice
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    boolean isHeadsetConnected = false;
                    AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                    for (AudioDeviceInfo device : devices) {
                        int type = device.getType();
                        if (type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                            type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                            type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                            type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                            type == AudioDeviceInfo.TYPE_USB_HEADSET) {
                            isHeadsetConnected = true;
                            break;
                        }
                    }

                    if (!isHeadsetConnected) {
                        List<AudioDeviceInfo> commDevices = audioManager.getAvailableCommunicationDevices();
                        AudioDeviceInfo earpiece = null;
                        for (AudioDeviceInfo device : commDevices) {
                            if (device.getType() == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) {
                                earpiece = device;
                                break;
                            }
                        }
                        if (earpiece != null) {
                            boolean success = audioManager.setCommunicationDevice(earpiece);
                            android.util.Log.d("MainActivity", "Routed outgoing call ringtone to earpiece via setCommunicationDevice: " + success);
                        }
                    } else {
                        android.util.Log.d("MainActivity", "Headset/Bluetooth connected, routing skipped.");
                    }
                }
            } catch (Exception e) {
                android.util.Log.e("MainActivity", "Error configuring audio for earpiece", e);
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
            }
        }
    }

<<<<<<< HEAD
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AudioRoutePlugin.class);
        registerPlugin(GoogleAuth.class);
        super.onCreate(savedInstanceState);
        
        // Unlock and wake screen for incoming call / notification launches
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        // Create notification channels for FCM
        createNotificationChannels();

        handleIntent(getIntent());

        // Remove any persistent background notification (FCM handles background wake-ups cleanly)
        stopPersistentBackgroundService();
        
        // Reset webview parent padding to prevent double inset conflicts
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();

            // Add JavaScript interface for Audio Route interception
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void onCallerRingtoneStart() {
                    runOnUiThread(() -> {
                        caller.start(MainActivity.this);
                    });
                }

                @JavascriptInterface
                public void onCallerRingtoneStop() {
                    runOnUiThread(() -> {
                        caller.stop(MainActivity.this);
                    });
                }
            }, "AudioRouteBridge");

            // Override WebViewClient to inject audio interception script AND pending notification
            webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    injectAudioInterception(view);
                    // ✅ WhatsApp-style: inject pending message notification into JS after page load
                    injectPendingChatNavigation(view);
                }
            });

            webView.post(() -> {
                try {
                    View parent = (View) webView.getParent();
                    ViewCompat.setOnApplyWindowInsetsListener(parent, (v, insets) -> {
                        v.setPadding(0, 0, 0, 0);
                        return insets;
                    });
                    webView.requestApplyInsets();
                } catch (Exception e) {
                    android.util.Log.e("MainActivity", "Error setting window insets listener", e);
                }
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
        // ✅ Warm-boot: app already running, dispatch JS event immediately
        if (intent != null && intent.getBooleanExtra("openChat", false) && intent.hasExtra("senderId")) {
            String sid = intent.getStringExtra("senderId");
            String sname = intent.getStringExtra("senderName") != null ? intent.getStringExtra("senderName") : "";
            if (sid != null && getBridge() != null && getBridge().getWebView() != null) {
                String escapedId   = sid.replace("\\", "\\\\").replace("\"", "\\\"");
                String escapedName = sname.replace("\\", "\\\\").replace("\"", "\\\"");
                String js = "window.dispatchEvent(new CustomEvent('openChatNotification', " +
                        "{ detail: { senderId: \"" + escapedId + "\", senderName: \"" + escapedName + "\" } }))";
                getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
                android.util.Log.d("MainActivity", "[Notif] Warm-boot: dispatched openChatNotification for " + sid);
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        isAppVisible = true;
    }

    @Override
    public void onPause() {
        super.onPause();
        isAppVisible = false;
    }

    @Override
    public void onDestroy() {
        caller.stop(this);
        super.onDestroy();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper: inject pending message notification navigation into JS (cold-boot)
    // Called from onPageFinished after every WebView page load.
    // Sets localStorage['pendingNotification'] → ChatPage useEffect reads it → navigates to chat.
    // ─────────────────────────────────────────────────────────────────────────────
    private void injectPendingChatNavigation(WebView webView) {
        if (pendingChatSenderId == null) return;
        final String sid   = pendingChatSenderId;
        final String sname = pendingChatSenderName != null ? pendingChatSenderName : "";
        // Clear immediately so it only fires once per cold-boot
        pendingChatSenderId   = null;
        pendingChatSenderName = null;

        String escapedId   = sid.replace("\\", "\\\\").replace("\"", "\\\"");
        String escapedName = sname.replace("\\", "\\\\").replace("\"", "\\\"");

        // Write to localStorage so ChatPage's pendingNotification useEffect handles it
        String js = "(function() {" +
                "  try {" +
                "    var payload = JSON.stringify({ senderId: \"" + escapedId + "\", senderName: \"" + escapedName + "\" });" +
                "    localStorage.setItem('pendingNotification', payload);" +
                "    console.log('[MainActivity] pendingNotification written to localStorage for senderId: " + escapedId + "');" +
                "    window.dispatchEvent(new CustomEvent('openChatNotification', { detail: { senderId: \"" + escapedId + "\", senderName: \"" + escapedName + "\" } }));" +
                "  } catch(e) { console.error('[MainActivity] Failed to inject pendingNotification:', e); }" +
                "})();";
        webView.evaluateJavascript(js, null);
        android.util.Log.d("MainActivity", "[Notif] Cold-boot: injected pendingNotification JS for senderId=" + sid);
=======
    // Helper to restore original audio state
    private void restoreAudioState() {
        if (isRingtoneRoutingActive) {
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        audioManager.clearCommunicationDevice();
                    }
                    audioManager.setSpeakerphoneOn(originalSpeakerphoneOn);
                    audioManager.setMode(originalMode);
                    android.util.Log.d("MainActivity", "Restored audio state: mode=" + originalMode + ", speaker=" + originalSpeakerphoneOn);
                } catch (Exception e) {
                    android.util.Log.e("MainActivity", "Error restoring audio state", e);
                }
            }
            isRingtoneRoutingActive = false;
        }
    }

    // Helper to start native MediaPlayer ringtone playing on voice communication stream
    private void playRingtoneNatively() {
        stopRingtoneNatively(); // Ensure previous player is released
        try {
            ringtonePlayer = MediaPlayer.create(this, R.raw.caller);
            if (ringtonePlayer != null) {
                // Route to voice communication so it plays via earpiece/receiver speaker
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes attributes = new AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                            .build();
                    ringtonePlayer.setAudioAttributes(attributes);
                } else {
                    ringtonePlayer.setAudioStreamType(AudioManager.STREAM_VOICE_CALL);
                }
                ringtonePlayer.setLooping(true);
                ringtonePlayer.start();
                android.util.Log.d("MainActivity", "Native ringtone player started playing.");
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Failed to start native ringtone player", e);
        }
    }

    // Helper to stop and release native MediaPlayer ringtone
    private void stopRingtoneNatively() {
        if (ringtonePlayer != null) {
            try {
                if (ringtonePlayer.isPlaying()) {
                    ringtonePlayer.stop();
                }
                ringtonePlayer.release();
                android.util.Log.d("MainActivity", "Native ringtone player stopped and released.");
            } catch (Exception e) {
                android.util.Log.e("MainActivity", "Error releasing native ringtone player", e);
            }
            ringtonePlayer = null;
        }
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
    }

    // Helper to inject audio interception script
    private void injectAudioInterception(WebView webView) {
        String js = "(function() {\n" +
                "    if (window.AudioRouteBridgePatched) return;\n" +
                "    window.AudioRouteBridgePatched = true;\n" +
                "    console.log('AudioRouteBridge: Injecting prototype overrides');\n" +
                "    var originalPlay = HTMLMediaElement.prototype.play;\n" +
                "    HTMLMediaElement.prototype.play = function() {\n" +
<<<<<<< HEAD
                "        var src = (this.src || this.currentSrc || '').toLowerCase();\n" +
                "        if (src.indexOf('caller') !== -1) {\n" +
                "            console.log('AudioRouteBridge: Intercepted play of caller ringtone:', src);\n" +
=======
                "        var src = this.src || '';\n" +
                "        if (src.indexOf('caller.mp3') !== -1) {\n" +
                "            console.log('AudioRouteBridge: Intercepted play of caller.mp3');\n" +
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
                "            if (window.AudioRouteBridge) {\n" +
                "                window.AudioRouteBridge.onCallerRingtoneStart();\n" +
                "            }\n" +
                "            // Return a resolved promise to satisfy the calling JS code\n" +
                "            // without actually playing the HTMLMediaElement\n" +
                "            return Promise.resolve();\n" +
                "        }\n" +
                "        return originalPlay.apply(this, arguments);\n" +
                "    };\n" +
                "    var originalPause = HTMLMediaElement.prototype.pause;\n" +
                "    HTMLMediaElement.prototype.pause = function() {\n" +
<<<<<<< HEAD
                "        var src = (this.src || this.currentSrc || '').toLowerCase();\n" +
                "        if (src.indexOf('caller') !== -1) {\n" +
                "            console.log('AudioRouteBridge: Intercepted pause of caller ringtone:', src);\n" +
=======
                "        var src = this.src || '';\n" +
                "        if (src.indexOf('caller.mp3') !== -1) {\n" +
                "            console.log('AudioRouteBridge: Intercepted pause of caller.mp3');\n" +
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
                "            if (window.AudioRouteBridge) {\n" +
                "                window.AudioRouteBridge.onCallerRingtoneStop();\n" +
                "            }\n" +
                "            return;\n" +
                "        }\n" +
                "        return originalPause.apply(this, arguments);\n" +
                "    };\n" +
                "})();";
        webView.evaluateJavascript(js, null);
    }
<<<<<<< HEAD

    /**
     * Stops the legacy persistent background service and cancels its notification.
     * FCM handles background notifications and calls on-demand.
     */
    private void stopPersistentBackgroundService() {
        try {
            Intent serviceIntent = new Intent(this, CallForegroundService.class);
            stopService(serviceIntent);

            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.cancel(123456); // Cancel CallForegroundService NOTIFICATION_ID
            }
            android.util.Log.d("MainActivity", "Persistent background service stopped and notification dismissed.");
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Note stopping background service: " + e.getMessage());
        }
    }
=======
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
}

