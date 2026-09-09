package com.juicychat.app;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.util.List;

/**
 * Helper class to manage playing caller.mp3 (outgoing call ringtone)
 * strictly via the earpiece speaker during calling time.
 */
public class caller {

    private static final String TAG = "CallerRingtone";

    private static MediaPlayer ringtonePlayer = null;
    private static int originalMode = AudioManager.MODE_NORMAL;
    private static boolean originalSpeakerphoneOn = false;
    private static boolean isRingtoneRoutingActive = false;
    private static AudioFocusRequest focusRequest = null;
    private static final Handler handler = new Handler(Looper.getMainLooper());

    /**
     * Start playing caller.mp3 ringtone strictly via earpiece speaker.
     */
    public static synchronized void start(Context context) {
        if (context == null) return;
        final Context appContext = context.getApplicationContext();

        try {
            configureAudioForEarpiece(appContext);
            playRingtoneNatively(appContext);

            // Re-enforce earpiece routing after 300ms to override any system DAC delayed state
            handler.postDelayed(() -> {
                try {
                    if (isRingtoneRoutingActive) {
                        configureAudioForEarpiece(appContext);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error re-applying earpiece routing", e);
                }
            }, 300);
        } catch (Exception e) {
            Log.e(TAG, "Error starting caller ringtone via earpiece", e);
        }
    }

    /**
     * Stop caller.mp3 ringtone and restore original audio settings.
     */
    public static synchronized void stop(Context context) {
        try {
            stopRingtoneNatively();
            restoreAudioState(context != null ? context.getApplicationContext() : null);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping caller ringtone", e);
        }
    }

    /**
     * Configures AudioManager strictly for earpiece playback.
     */
    public static void configureAudioForEarpiece(Context context) {
        if (context == null) return;
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return;

        try {
            if (!isRingtoneRoutingActive) {
                originalMode = audioManager.getMode();
                originalSpeakerphoneOn = audioManager.isSpeakerphoneOn();
                isRingtoneRoutingActive = true;
                Log.d(TAG, "Saved original audio state: mode=" + originalMode + ", speaker=" + originalSpeakerphoneOn);
            }

            // 1. Request transient audio focus for voice communication
            requestAudioFocus(audioManager);

            // 2. Ensure microphone is unmuted
            audioManager.setMicrophoneMute(false);

            // 3. Force mode to MODE_IN_COMMUNICATION
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

            // 4. Force speakerphone OFF for earpiece output
            audioManager.setSpeakerphoneOn(false);

            // 5. Ensure voice call volume is audible
            try {
                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL);
                int currentVol = audioManager.getStreamVolume(AudioManager.STREAM_VOICE_CALL);
                if (currentVol < maxVol * 0.5) {
                    audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, (int) (maxVol * 0.85), 0);
                }
            } catch (Exception ignored) {}

            // 6. For Android 12+ (API 31+), route explicitly using setCommunicationDevice
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
                        Log.d(TAG, "Routed caller ringtone to earpiece via setCommunicationDevice: " + success);
                    }
                } else {
                    Log.d(TAG, "Headset/Bluetooth connected, skipping explicit earpiece override.");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring audio for earpiece", e);
        }
    }

    /**
     * Helper to restore original audio state.
     */
    public static void restoreAudioState(Context context) {
        if (!isRingtoneRoutingActive) return;

        AudioManager audioManager = context != null ? (AudioManager) context.getSystemService(Context.AUDIO_SERVICE) : null;
        if (audioManager != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    audioManager.clearCommunicationDevice();
                }
                audioManager.setSpeakerphoneOn(originalSpeakerphoneOn);
                audioManager.setMode(originalMode);
                abandonAudioFocus(audioManager);
                Log.d(TAG, "Restored audio state: mode=" + originalMode + ", speaker=" + originalSpeakerphoneOn);
            } catch (Exception e) {
                Log.e(TAG, "Error restoring audio state", e);
            }
        }
        isRingtoneRoutingActive = false;
    }

    /**
     * Start native MediaPlayer ringtone playing on USAGE_VOICE_COMMUNICATION (earpiece).
     * Must set AudioAttributes BEFORE prepare()!
     */
    private static void playRingtoneNatively(Context context) {
        stopRingtoneNatively();
        try {
            ringtonePlayer = new MediaPlayer();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes attributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .build();
                ringtonePlayer.setAudioAttributes(attributes);
            } else {
                ringtonePlayer.setAudioStreamType(AudioManager.STREAM_VOICE_CALL);
            }

            AssetFileDescriptor afd = context.getResources().openRawResourceFd(R.raw.caller);
            if (afd != null) {
                ringtonePlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
                ringtonePlayer.prepare();
                ringtonePlayer.setLooping(true);
                ringtonePlayer.setVolume(1.0f, 1.0f);
                ringtonePlayer.start();
                Log.d(TAG, "Native ringtone player started playing caller.mp3 via earpiece stream.");
            } else {
                Log.e(TAG, "Failed to open raw resource caller.mp3");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start native ringtone player for caller.mp3", e);
        }
    }

    /**
     * Stop and release native MediaPlayer ringtone.
     */
    private static void stopRingtoneNatively() {
        if (ringtonePlayer != null) {
            try {
                if (ringtonePlayer.isPlaying()) {
                    ringtonePlayer.stop();
                }
                ringtonePlayer.release();
                Log.d(TAG, "Native ringtone player stopped and released.");
            } catch (Exception e) {
                Log.e(TAG, "Error releasing native ringtone player", e);
            }
            ringtonePlayer = null;
        }
    }

    private static void requestAudioFocus(AudioManager audioManager) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                        .setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                .build())
                        .setAcceptsDelayedFocusGain(false)
                        .setOnAudioFocusChangeListener(focusChange -> Log.d(TAG, "AudioFocus change: " + focusChange))
                        .build();
                audioManager.requestAudioFocus(focusRequest);
            } else {
                audioManager.requestAudioFocus(
                        focusChange -> Log.d(TAG, "AudioFocus change: " + focusChange),
                        AudioManager.STREAM_VOICE_CALL,
                        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE
                );
            }
        } catch (Exception e) {
            Log.e(TAG, "Error requesting audio focus", e);
        }
    }

    private static void abandonAudioFocus(AudioManager audioManager) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
                audioManager.abandonAudioFocusRequest(focusRequest);
                focusRequest = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error abandoning audio focus", e);
        }
    }
}
