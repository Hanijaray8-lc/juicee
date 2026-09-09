import { Buffer } from 'buffer';

// Polyfill for process, global, and Buffer objects required by simple-peer and readable-stream in browser environments
if (typeof window !== 'undefined') {
  if (!window.global) {
    window.global = window;
  }
  if (!window.Buffer) {
    window.Buffer = Buffer;
  }
  if (!window.process) {
    window.process = {};
  }
  if (!window.process.env) {
    window.process.env = { NODE_ENV: 'development' };
  }
  window.process.browser = true;
  if (typeof window.process.nextTick !== 'function') {
    window.process.nextTick = function (cb, ...args) {
      if (typeof cb !== 'function') {
        throw new TypeError('Callback must be a function');
      }
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => cb(...args));
      } else {
        Promise.resolve().then(() => cb(...args));
      }
    };
  }
}
