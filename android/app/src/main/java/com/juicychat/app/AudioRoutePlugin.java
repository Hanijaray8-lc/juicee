package com.juicychat.app;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.app.NotificationManager;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import android.content.SharedPreferences;

import android.content.ContentValues;
import android.content.ContentResolver;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
<<<<<<< HEAD
import android.os.PowerManager;
=======
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.net.HttpURLConnection;
import android.media.MediaScannerConnection;

import android.app.NotificationChannel;
import android.app.PendingIntent;
import android.content.Intent;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;

@CapacitorPlugin(name = "AudioRoute")
public class AudioRoutePlugin extends Plugin {

    // Helper to apply speaker/earpiece routing configuration securely
    private void applyRoutingState(AudioManager audioManager, boolean playOnSpeaker) {
        try {
            // 1. Request transient audio focus for VoIP/speech communication
            requestAudioFocus(audioManager);

            // 2. Unmute microphone if muted to ensure call sound captures correctly
            audioManager.setMicrophoneMute(false);

            // 3. Force mode to MODE_IN_COMMUNICATION for voice/video WebRTC routing
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

            // 4. Set speakerphone state
            audioManager.setSpeakerphoneOn(playOnSpeaker);

            // 5. Apply modern Android 12+ communication device routing
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (playOnSpeaker) {
<<<<<<< HEAD
                    // Explicitly route to built-in loudspeaker for Android 12+
                    List<AudioDeviceInfo> commDevices = audioManager.getAvailableCommunicationDevices();
                    AudioDeviceInfo speakerDevice = null;
                    for (AudioDeviceInfo device : commDevices) {
                        if (device.getType() == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                            speakerDevice = device;
                            break;
                        }
                    }
                    if (speakerDevice != null) {
                        boolean success = audioManager.setCommunicationDevice(speakerDevice);
                        Log.d("CALL_AUDIO", "Routed call audio to built-in speaker via setCommunicationDevice: " + success);
                    } else {
                        audioManager.clearCommunicationDevice();
                    }
=======
                    // Reset custom communication routing to fall back to speakerphone
                    audioManager.clearCommunicationDevice();
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
                } else {
                    // Route to earpiece if no external headsets (Wired/Bluetooth) are connected
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
<<<<<<< HEAD
                            boolean success = audioManager.setCommunicationDevice(earpiece);
                            Log.d("CALL_AUDIO", "Routed call audio to earpiece via setCommunicationDevice: " + success);
                        }
                    } else {
                        audioManager.clearCommunicationDevice();
=======
                            audioManager.setCommunicationDevice(earpiece);
                        }
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
                    }
                }
            }

            Log.d("CALL_AUDIO", "Mode=" + audioManager.getMode());
            Log.d("CALL_AUDIO", "Speaker=" + audioManager.isSpeakerphoneOn());
        } catch (Exception e) {
            Log.e("AudioRoute", "Error applying routing state in plugin", e);
        }
    }

    // Helper to request communication audio focus
    private void requestAudioFocus(AudioManager audioManager) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.media.AudioFocusRequest focusRequest = new android.media.AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                        .setAudioAttributes(new android.media.AudioAttributes.Builder()
                                .setUsage(android.media.AudioAttributes.USAGE_VOICE_COMMUNICATION)
                                .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
                                .build())
                        .setAcceptsDelayedFocusGain(false)
                        .setOnAudioFocusChangeListener(focusChange -> {
                            Log.d("AudioRoute", "AudioFocus change: " + focusChange);
                        })
                        .build();
                audioManager.requestAudioFocus(focusRequest);
            } else {
                audioManager.requestAudioFocus(
                        focusChange -> Log.d("AudioRoute", "AudioFocus change: " + focusChange),
                        AudioManager.STREAM_VOICE_CALL,
                        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE
                );
            }
        } catch (Exception e) {
            Log.e("AudioRoute", "Error requesting audio focus in plugin", e);
        }
    }

    @PluginMethod
    public void setSpeakerphoneOn(PluginCall call) {
        Boolean playOnSpeaker = call.getBoolean("playOnSpeaker", true);
        if (playOnSpeaker == null) {
            playOnSpeaker = true;
        }
        Context context = getContext();
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            try {
                final boolean targetState = playOnSpeaker;

                // Apply routing immediately
                applyRoutingState(audioManager, targetState);

                // Run delayed (300ms) to overwrite Chromium WebView/WebRTC AudioTrack initializations
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    applyRoutingState(audioManager, targetState);
                }, 300);

                // Run delayed (800ms) as a backup safety net
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    applyRoutingState(audioManager, targetState);
                }, 800);

<<<<<<< HEAD
                // Run delayed (1200ms) as final safety net for slow devices
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    applyRoutingState(audioManager, targetState);
                }, 1200);

=======
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("mode", playOnSpeaker ? "speaker" : "earpiece");
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        } else {
            call.reject("AudioManager not available");
        }
    }

    @PluginMethod
    public void resetAudioMode(PluginCall call) {
        Context context = getContext();
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            try {
                audioManager.setSpeakerphoneOn(false);
                audioManager.setMode(AudioManager.MODE_NORMAL);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    audioManager.clearCommunicationDevice();
                }
                Log.d("CALL_AUDIO", "Reset audio mode to MODE_NORMAL");
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        } else {
            call.reject("AudioManager not available");
        }
    }

    @PluginMethod
    public void getSpeakerphoneStatus(PluginCall call) {
        Context context = getContext();
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            JSObject ret = new JSObject();
            boolean isSpeakerOn = audioManager.isSpeakerphoneOn();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AudioDeviceInfo currentDevice = audioManager.getCommunicationDevice();
                if (currentDevice != null) {
                    isSpeakerOn = (currentDevice.getType() == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);
                }
            }
            ret.put("isSpeakerphoneOn", isSpeakerOn);
            ret.put("mode", audioManager.getMode());
            call.resolve(ret);
        } else {
            call.reject("AudioManager not available");
        }
    }

    @PluginMethod
    public void getCallLaunchIntent(PluginCall call) {
        JSObject intentData = MainActivity.getLastCallIntent();
        if (intentData != null) {
            call.resolve(intentData);
        } else {
            JSObject ret = new JSObject();
            ret.put("isCall", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void dismissNotification(PluginCall call) {
        String idStr = call.getString("id");
        Context context = getContext();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            try {
                if (idStr != null) {
                    int notificationId = Integer.parseInt(idStr);
                    manager.cancel(notificationId);
                    Log.d("AudioRoute", "Cancelled notification: " + notificationId);
                } else {
                    manager.cancelAll();
                    Log.d("AudioRoute", "Cancelled all notifications");
                }
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        } else {
            call.reject("NotificationManager not available");
        }
    }

    @PluginMethod
    public void saveFileToDownloads(PluginCall call) {
        saveFileInternal(call, false);
    }

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        saveFileInternal(call, true);
    }

    private void saveFileInternal(PluginCall call, boolean forceGallery) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType");
        String urlStr = call.getString("url");

        if (fileName == null || fileName.trim().isEmpty()) {
            String ext = (mimeType != null && mimeType.contains("png")) ? ".png" : ".jpg";
            fileName = "photo-" + System.currentTimeMillis() + ext;
        }

        if (mimeType == null || mimeType.trim().isEmpty()) {
            if (fileName.endsWith(".png")) mimeType = "image/png";
            else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) mimeType = "image/jpeg";
            else if (fileName.endsWith(".webp")) mimeType = "image/webp";
            else mimeType = "application/octet-stream";
        }

        final String finalFileName = fileName;
        final String finalMimeType = mimeType;
        final String finalBase64 = base64Data;
        final String finalUrl = urlStr;

        new Thread(() -> {
            try {
                byte[] fileBytes = null;

                if (finalBase64 != null && !finalBase64.trim().isEmpty()) {
                    String cleanBase64 = finalBase64.trim();
                    if (cleanBase64.contains(";base64,")) {
                        cleanBase64 = cleanBase64.split(";base64,")[1];
                    }
                    fileBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                } else if (finalUrl != null && !finalUrl.trim().isEmpty()) {
                    String cleanUrl = finalUrl.trim();
                    if (cleanUrl.startsWith("data:")) {
                        String cleanBase64 = cleanUrl;
                        if (cleanBase64.contains(";base64,")) {
                            cleanBase64 = cleanBase64.split(";base64,")[1];
                        }
                        fileBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                    } else {
                        URL u = new URL(cleanUrl);
                        HttpURLConnection conn = (HttpURLConnection) u.openConnection();
                        conn.setDoInput(true);
                        conn.setConnectTimeout(10000);
                        conn.setReadTimeout(15000);
                        conn.connect();
                        try (InputStream is = conn.getInputStream();
                             ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
                            int nRead;
                            byte[] data = new byte[8192];
                            while ((nRead = is.read(data, 0, data.length)) != -1) {
                                buffer.write(data, 0, nRead);
                            }
                            buffer.flush();
                            fileBytes = buffer.toByteArray();
                        }
                    }
                }

                if (fileBytes == null || fileBytes.length == 0) {
                    call.reject("No valid base64Data or url provided");
                    return;
                }

                Context context = getContext();
                Uri fileUri = null;
                File savedFile = null;

                boolean isImage = finalMimeType.startsWith("image/");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, finalFileName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, finalMimeType);

                    Uri collection;
                    if (forceGallery || isImage) {
                        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Juicy");
                        collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    } else {
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                        collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    }

                    ContentResolver resolver = context.getContentResolver();
                    fileUri = resolver.insert(collection, values);

                    if (fileUri != null) {
                        try (OutputStream os = resolver.openOutputStream(fileUri)) {
                            if (os != null) {
                                os.write(fileBytes);
                                os.flush();
                            }
                        }
                    }
                } else {
                    File targetDir;
                    if (forceGallery || isImage) {
                        targetDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                    } else {
                        targetDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    }
                    if (!targetDir.exists()) {
                        targetDir.mkdirs();
                    }
                    savedFile = new File(targetDir, finalFileName);
                    try (FileOutputStream fos = new FileOutputStream(savedFile)) {
                        fos.write(fileBytes);
                        fos.flush();
                    }
                    try {
                        fileUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", savedFile);
                    } catch (Exception e) {
                        fileUri = Uri.fromFile(savedFile);
                    }
                }

                if (fileUri != null) {
                    if (savedFile != null) {
                        MediaScannerConnection.scanFile(
                            context,
                            new String[]{ savedFile.getAbsolutePath() },
                            new String[]{ finalMimeType },
                            null
                        );
                    }

                    sendDownloadNotification(context, finalFileName, fileUri, finalMimeType);

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("uri", fileUri.toString());
                    call.resolve(ret);
                } else {
                    call.reject("Could not create file URI");
                }
            } catch (Exception e) {
                Log.e("AudioRoute", "Failed to save file", e);
                call.reject(e.getMessage());
            }
        }).start();
    }

    private void sendDownloadNotification(Context context, String fileName, Uri fileUri, String mimeType) {
        String channelId = "downloads_channel";
        String channelName = "File Downloads";
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (manager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        channelId, channelName,
                        NotificationManager.IMPORTANCE_DEFAULT
                );
                channel.setDescription("Notifications for file downloads");
                manager.createNotificationChannel(channel);
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(fileUri, mimeType != null ? mimeType : "*/*");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            PendingIntent pendingIntent;
            int requestCode = (int) System.currentTimeMillis();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingIntent = PendingIntent.getActivity(
                        context, requestCode, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
            } else {
                pendingIntent = PendingIntent.getActivity(
                        context, requestCode, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT
                );
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(android.R.drawable.stat_sys_download_done)
                    .setContentTitle("Download Complete")
                    .setContentText(fileName)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT);

            manager.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), builder.build());
        }
    }

    @PluginMethod
    public void shareImage(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName");

        if (base64Data == null || fileName == null) {
            call.reject("base64Data and fileName are required");
            return;
        }

        try {
            // Strip data URI prefix if present (e.g. "data:image/png;base64,...")
            if (base64Data.contains(";base64,")) {
                base64Data = base64Data.split(";base64,")[1];
            }
            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);

            Context context = getContext();

            // Write image to app cache directory (no storage permission needed)
            File cacheDir = new File(context.getCacheDir(), "shared_images");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            File imageFile = new File(cacheDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                fos.write(imageBytes);
                fos.flush();
            }

            // Get a content URI via FileProvider for secure sharing
            Uri imageUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                imageFile
            );

            // Create share intent
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("image/*");
            shareIntent.putExtra(Intent.EXTRA_STREAM, imageUri);

            String text = call.getString("text");
            if (text == null || text.trim().isEmpty()) {
                text = "Connect with me on Juicy! Scan my QR code to start a conversation.";
            }
            shareIntent.putExtra(Intent.EXTRA_TEXT, text);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // If phone or phoneNumber is provided, direct WhatsApp to open the specific contact chat
            String phone = call.getString("phone");
            if (phone == null || phone.trim().isEmpty()) {
                phone = call.getString("phoneNumber");
            }
            if (phone != null && !phone.trim().isEmpty()) {
                String cleanPhone = phone.replaceAll("[^0-9]", "");
                if (!cleanPhone.isEmpty()) {
                    String jid = cleanPhone + "@s.whatsapp.net";
                    shareIntent.putExtra("jid", jid);
                    Log.d("AudioRoute", "Targeting specific WhatsApp JID: " + jid);
                }
            }

            String pkg = call.getString("package");
            if (pkg != null && !pkg.trim().isEmpty()) {
                try {
                    shareIntent.setPackage(pkg);
                    shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(shareIntent);
                } catch (Exception pkgErr) {
                    try {
                        // Try WhatsApp Business package as fallback
                        shareIntent.setPackage("com.whatsapp.w4b");
                        shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(shareIntent);
                    } catch (Exception w4bErr) {
                        shareIntent.setPackage(null);
                        Intent chooser = Intent.createChooser(shareIntent, "Share via");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(chooser);
                    }
                }
            } else {
                Intent chooser = Intent.createChooser(shareIntent, "Share");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            Log.d("AudioRoute", "Share sheet opened for image: " + fileName);
        } catch (Exception e) {
            Log.e("AudioRoute", "Failed to share image", e);
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void setLockedContacts(PluginCall call) {
        JSArray contacts = call.getArray("contacts");
        if (contacts == null) {
            call.reject("contacts array is required");
            return;
        }
        try {
            List<String> list = contacts.toList();
            Context context = getContext();
            SharedPreferences sharedPref = context.getSharedPreferences("JuicyAppPrefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPref.edit();
            Set<String> set = new HashSet<>(list);
            editor.putStringSet("lockedContacts", set);
            editor.apply();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            Log.d("AudioRoute", "Updated locked contacts in SharedPreferences: " + set.toString());
        } catch (Exception e) {
            Log.e("AudioRoute", "Error updating locked contacts", e);
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
<<<<<<< HEAD
    public void startForegroundService(PluginCall call) {
        try {
            String title = call.getString("title");
            String content = call.getString("content");
            String type = call.getString("type", "call"); // "call" or "background"

            Context context = getContext();
            Intent intent = new Intent(context, CallForegroundService.class);
            intent.putExtra("type", type);
            if (title != null) intent.putExtra("title", title);
            if (content != null) intent.putExtra("content", content);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void enableBackgroundMode(PluginCall call) {
        // No-op: FCM handles background push notifications without needing persistent status bar notification
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void disableBackgroundMode(PluginCall call) {
        stopForegroundService(call);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        try {
            Context context = getContext();
            String packageName = context.getPackageName();
            Intent intent = new Intent();
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            
            if (pm != null && pm.isIgnoringBatteryOptimizations(packageName)) {
                JSObject ret = new JSObject();
                ret.put("isIgnoring", true);
                call.resolve(ret);
                return;
            }

            intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + packageName));
            context.startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        try {
            Context context = getContext();
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            boolean isIgnoring = false;
            if (pm != null) {
                isIgnoring = pm.isIgnoringBatteryOptimizations(context.getPackageName());
            }
            JSObject ret = new JSObject();
            ret.put("isIgnoring", isIgnoring);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(context, CallForegroundService.class);
            context.stopService(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void saveSession(PluginCall call) {
        String userId = call.getString("userId");
        String token = call.getString("token");
        String username = call.getString("username", "");
        String profileImage = call.getString("profileImage", "");
        // ✅ Optional: persist backend URL so native receivers (CallActionReceiver) can find the server
        String backendUrl = call.getString("backendUrl", "");

        if (userId == null || token == null) {
            call.reject("userId and token are required");
            return;
        }

        try {
            Context context = getContext();
            SharedPreferences sharedPref = context.getSharedPreferences("JuicyAppPrefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.putString("userId", userId);
            editor.putString("token", token);
            editor.putString("username", username);
            editor.putString("profileImage", profileImage);
            if (backendUrl != null && !backendUrl.isEmpty()) {
                editor.putString("backendUrl", backendUrl);
            }
            editor.apply();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            Log.d("AudioRoute", "Native session saved for userId: " + userId);
        } catch (Exception e) {
            Log.e("AudioRoute", "Error saving session", e);
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void getSession(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences sharedPref = context.getSharedPreferences("JuicyAppPrefs", Context.MODE_PRIVATE);
            String userId = sharedPref.getString("userId", null);
            String token = sharedPref.getString("token", null);
            String username = sharedPref.getString("username", "");
            String profileImage = sharedPref.getString("profileImage", "");

            JSObject ret = new JSObject();
            ret.put("userId", userId);
            ret.put("token", token);
            ret.put("username", username);
            ret.put("profileImage", profileImage);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e("AudioRoute", "Error getting session", e);
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void clearSession(PluginCall call) {
        try {
            Context context = getContext();
            
            // Stop the background service on logout
            Intent serviceIntent = new Intent(context, CallForegroundService.class);
            context.stopService(serviceIntent);

            SharedPreferences sharedPref = context.getSharedPreferences("JuicyAppPrefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.remove("userId");
            editor.remove("token");
            editor.remove("username");
            editor.remove("profileImage");
            editor.apply();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            Log.d("AudioRoute", "Native session cleared and service stopped");
        } catch (Exception e) {
            Log.e("AudioRoute", "Error clearing session", e);
=======
    public void shareImage(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName");
        if (base64Data == null || fileName == null) {
            call.reject("base64Data and fileName are required");
            return;
        }
        try {
            if (base64Data.contains(";base64,")) {
                base64Data = base64Data.split(";base64,")[1];
            }
            byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Context context = getContext();
            
            // Save to cache directory
            File cachePath = new File(context.getCacheDir(), "images");
            if (!cachePath.exists()) {
                cachePath.mkdirs();
            }
            File file = new File(cachePath, fileName);
            try (FileOutputStream stream = new FileOutputStream(file)) {
                stream.write(fileBytes);
                stream.flush();
            }
            
            // Get content URI via FileProvider
            Uri contentUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
            if (contentUri != null) {
                Intent shareIntent = new Intent();
                shareIntent.setAction(Intent.ACTION_SEND);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                shareIntent.setType("image/png");
                
                Intent chooser = Intent.createChooser(shareIntent, "Share QR Code");
                if (getActivity() != null) {
                    getActivity().startActivity(chooser);
                } else {
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(chooser);
                }
                
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } else {
                call.reject("Could not create content URI");
            }
        } catch (Exception e) {
            Log.e("AudioRoute", "Failed to share image", e);
>>>>>>> 46ed5e03c779c926a8d8f3605df7acf2a76e2e4d
            call.reject(e.getMessage());
        }
    }
}

