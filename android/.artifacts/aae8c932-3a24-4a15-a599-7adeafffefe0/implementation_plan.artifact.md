# Implementation Plan - WhatsApp-like Background Handling

The goal is to ensure the app can receive calls and messages even when closed or after a device restart, similar to WhatsApp. This involves ensuring a background service is active and that the app correctly handles boot and network events.

## User Review Required

> [!IMPORTANT]
> To ensure the background service is not killed by the system, the user should be prompted to disable "Battery Optimization" for the app. The `AudioRoutePlugin` already has a method `requestIgnoreBatteryOptimizations` for this.

## Proposed Changes

### Android Manifest & Permissions
#### [MODIFY] [AndroidManifest.xml](file:///D:/react 2/05-02-2026/juicee/Juicy/android/app/src/main/AndroidManifest.xml)
- Add `RECEIVE_BOOT_COMPLETED` permission.
- Register `BootReceiver` to handle device restart.

### Background Persistence
#### [NEW] [BootReceiver.java](file:///D:/react 2/05-02-2026/juicee/Juicy/android/app/src/main/java/com/juicychat/app/BootReceiver.java)
- Implement a `BroadcastReceiver` that starts the `CallForegroundService` when the device finishes booting, but only if a user session exists.

#### [MODIFY] [CallForegroundService.java](file:///D:/react 2/05-02-2026/juicee/Juicy/android/app/src/main/java/com/juicychat/app/CallForegroundService.java)
- Update `onStartCommand` to better handle system-initiated restarts.
- Ensure it uses the saved session information to determine if it should stay active.

#### [MODIFY] [MainActivity.java](file:///D:/react 2/05-02-2026/juicee/Juicy/android/app/src/main/java/com/juicychat/app/MainActivity.java)
- Automatically start the background service if a user is logged in when the app is launched.

## Verification Plan

### Automated Tests
- None (UI/System behavior focused).

### Manual Verification
1.  **Boot Success**: Restart the device and check if the "Juicy is active" notification appears automatically.
2.  **Background Message**: Close the app completely (swipe away from recent apps) and send an FCM message/call to the device. Verify it is received.
3.  **Internet Reconnect**: Turn off internet, send a message (it will be pending in FCM), then turn on internet and verify the message is received as soon as the connection is established.
