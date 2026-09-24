import receiverAudioFile from '../assets/reciver.mp3';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { saveAppSettingLocally, getAppSettingLocally } from '../db/offlineDb';

const DB_NAME = 'JuicyRingtoneDB';
const DB_VERSION = 1;
const STORE_NAME = 'ringtones';
const CUSTOM_RINGTONE_KEY = 'custom_ringtone_blob';
const SETTINGS_KEY = 'appRingtone';

/**
 * Open or initialize IndexedDB for large audio blob storage
 */
const openRingtoneDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

/**
 * Save audio blob to IndexedDB
 */
export const saveBlobToIndexedDB = async (blob) => {
  try {
    const db = await openRingtoneDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, CUSTOM_RINGTONE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('saveBlobToIndexedDB error:', e);
    return false;
  }
};

/**
 * Get audio blob from IndexedDB
 */
export const getBlobFromIndexedDB = async () => {
  try {
    const db = await openRingtoneDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CUSTOM_RINGTONE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('getBlobFromIndexedDB error:', e);
    return null;
  }
};

/**
 * Delete audio blob from IndexedDB
 */
export const deleteBlobFromIndexedDB = async () => {
  try {
    const db = await openRingtoneDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(CUSTOM_RINGTONE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('deleteBlobFromIndexedDB error:', e);
    return false;
  }
};

/**
 * Retrieve active ringtone settings.
 * Defaults to 'default' (reciver.mp3).
 */
export const getRingtoneSetting = async () => {
  let setting = null;
  try {
    const raw = await getAppSettingLocally(SETTINGS_KEY);
    if (raw) {
      setting = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
  } catch (e) {}

  if (!setting) {
    try {
      const cached = localStorage.getItem(SETTINGS_KEY);
      if (cached) {
        setting = JSON.parse(cached);
      }
    } catch (e) {}
  }

  if (!setting || typeof setting !== 'object') {
    setting = {
      type: 'default',
      name: 'Default',
      customAudio: null
    };
  }

  // Synchronize custom ringtone path for Android AudioRouteBridge and native SharedPreferences
  const customPath = (setting.type === 'custom' && setting.customAudio?.fileUri)
    ? setting.customAudio.fileUri
    : null;
  syncNativeCustomRingtonePath(customPath);

  return setting;
};

/**
 * Synchronize custom ringtone path with Android native SharedPreferences & AudioRouteBridge
 */
const syncNativeCustomRingtonePath = (customPath) => {
  if (typeof window === 'undefined') return;
  window.customRingtonePath = customPath || null;
  if (window.AudioRouteBridge && typeof window.AudioRouteBridge.setCustomRingtonePath === 'function') {
    try { window.AudioRouteBridge.setCustomRingtonePath(customPath || ''); } catch (e) {}
  }
  const { AudioRoute } = window.Capacitor?.Plugins || {};
  if (AudioRoute && typeof AudioRoute.setCustomRingtone === 'function') {
    try { AudioRoute.setCustomRingtone({ path: customPath || null }); } catch (e) {}
  }
};

// Immediately restore custom ringtone path on script evaluation
if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem(SETTINGS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const customPath = (parsed?.type === 'custom' && parsed.customAudio?.fileUri)
        ? parsed.customAudio.fileUri
        : null;
      syncNativeCustomRingtonePath(customPath);
    }
  } catch (e) {}
}

/**
 * Save ringtone setting and broadcast change event
 */
export const saveRingtoneSetting = async (setting) => {
  try {
    const str = JSON.stringify(setting);
    await saveAppSettingLocally(SETTINGS_KEY, str);
    try {
      localStorage.setItem(SETTINGS_KEY, str);
    } catch (e) {}

    // Expose and sync custom ringtone path with Android native SharedPreferences
    const customPath = (setting.type === 'custom' && setting.customAudio?.fileUri)
      ? setting.customAudio.fileUri
      : null;
    syncNativeCustomRingtonePath(customPath);

    // Broadcast change so active screens (like ChatPage) re-bind audio src immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appRingtoneChanged', { detail: setting }));
    }
    return true;
  } catch (e) {
    console.warn('saveRingtoneSetting failed:', e);
    return false;
  }
};

/**
 * Decode an uploaded audio File into an AudioBuffer using Web Audio API
 */
export const decodeAudioFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio API is not supported in this browser/environment');
  }
  const audioContext = new AudioCtx();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Extract waveform peaks for visualization (100 sample bars)
  const channelData = audioBuffer.getChannelData(0);
  const sampleCount = 100;
  const blockSize = Math.floor(channelData.length / sampleCount);
  const peaks = [];
  for (let i = 0; i < sampleCount; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j] || 0);
    }
    peaks.push(Math.min(1, (sum / blockSize) * 2.5));
  }

  return {
    audioBuffer,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    peaks
  };
};

/**
 * Slice/crop an AudioBuffer from startTime to endTime
 */
export const cropAudioBuffer = (audioBuffer, startTime, endTime) => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioCtx();

  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const startOffset = Math.max(0, Math.floor(startTime * sampleRate));
  const endOffset = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
  const frameCount = Math.max(1, endOffset - startOffset);

  const croppedBuffer = audioContext.createBuffer(channels, frameCount, sampleRate);

  for (let channel = 0; channel < channels; channel++) {
    const originalChannelData = audioBuffer.getChannelData(channel);
    const croppedChannelData = croppedBuffer.getChannelData(channel);
    croppedChannelData.set(originalChannelData.subarray(startOffset, endOffset));
  }

  return croppedBuffer;
};

/**
 * Convert AudioBuffer to a standard 16-bit PCM WAV Blob
 */
export const audioBufferToWavBlob = (audioBuffer) => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = audioBuffer.length;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels & write 16-bit PCM samples
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Convert Blob to Base64 string / Data URL
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Write custom ringtone file to Capacitor Filesystem so Android can play natively
 */
export const saveRingtoneToDeviceStorage = async (base64DataUrl) => {
  try {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
      const pureBase64 = base64DataUrl.split(',')[1] || base64DataUrl;
      const fileName = 'custom_ringtone.wav';
      const result = await Filesystem.writeFile({
        path: fileName,
        data: pureBase64,
        directory: Directory.Data
      });

      let fileUri = result.uri;
      if (!fileUri) {
        const uriRes = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Data
        });
        fileUri = uriRes.uri;
      }
      return fileUri;
    }
  } catch (e) {
    console.warn('saveRingtoneToDeviceStorage failed (fallback to blob/dataUrl):', e);
  }
  return null;
};

/**
 * Resolves the actual playable audio src URL for receiver call playback
 */
export const resolvePlayableRingtoneSrc = async () => {
  try {
    const setting = await getRingtoneSetting();
    if (setting && setting.type === 'custom' && setting.customAudio) {
      // 1. Check IndexedDB blob first (best for web/webview memory)
      const blob = await getBlobFromIndexedDB();
      if (blob) {
        return URL.createObjectURL(blob);
      }
      // 2. Check dataUrl
      if (setting.customAudio.dataUrl) {
        return setting.customAudio.dataUrl;
      }
      // 3. Check fileUri
      if (setting.customAudio.fileUri) {
        return setting.customAudio.fileUri;
      }
    }
  } catch (e) {
    console.warn('resolvePlayableRingtoneSrc error:', e);
  }
  // Default to reciver.mp3
  return receiverAudioFile;
};

export { receiverAudioFile };
