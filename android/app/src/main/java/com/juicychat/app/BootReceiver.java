package com.juicychat.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

/**
 * Starts the background service automatically when the device boots up.
 * This ensures that Juicy can receive calls and messages even if the user
 * hasn't manually opened the app since the last restart.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "JuicyBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "Received boot action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            
            Log.d(TAG, "Device booted successfully. FCM MyFirebaseMessagingService handles push wakeups on demand.");
        }
    }
}
