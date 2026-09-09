import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config/apiConfig';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);
 
  useEffect(() => {
    // Prevent multiple socket initializations
    if (isInitializedRef.current || socketRef.current) {
      console.log('Socket already initialized, skipping...');
      return;
    }
    isInitializedRef.current = true;

    // Use the central socket URL configured in apiConfig.js
    const serverUrl = SOCKET_BASE_URL;

    console.log('🔌 [SocketProvider] Connecting to socket server:', serverUrl);

    // Detect if running on Android/iOS native
    const isNative = typeof window !== 'undefined' && window.Capacitor;
    
    // Android and wake-up optimized socket configuration
    const socketConfig = {
      withCredentials: true,
      autoConnect: true,
      // On native mobile APKs, attempt direct WebSocket connection first for lower latency
      transports: isNative ? ['websocket', 'polling'] : ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: isNative ? 20 : 15, // High attempts to allow time for Render container to launch
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      timeout: 60000, // 60 seconds to allow Render's free tier (up to 50s launch time) to boot up without timing out
      pingInterval: isNative ? 15000 : 25000,
      pingTimeout: isNative ? 40000 : 60000,
      maxHttpBufferSize: 5e7,
      forceNew: false,
      multiplex: true
    };

    console.log('⚙️ Socket config for', isNative ? 'NATIVE' : 'WEB', ':', socketConfig);

    // Create socket connection
    const newSocket = io(serverUrl, socketConfig);
    socketRef.current = newSocket;

    // Add connection event listeners
    newSocket.on('connect', () => {
      console.log('✅ [SocketProvider] Socket connected successfully:', newSocket.id);
      setIsConnected(true);
      
      // Authenticate immediately after connect
      const userId = localStorage.getItem('userId');
      if (userId) {
        newSocket.emit('join_room', userId, localStorage.getItem('username') || 'User');
        console.log('🔐 Socket authenticated with userId:', userId);

        // Tell backend this user is now in foreground (connected and active)
        newSocket.emit('app_state', { state: 'foreground' });
        console.log('[SOCKET] Emitted app_state: foreground on connect');
        
        // 🟢 CRITICAL FIX: Request online users after join_room
        setTimeout(() => {
          newSocket.emit('request_online_users');
          console.log('🔄 [SocketProvider] Requested online users list');
        }, 100); // Small delay to ensure join_room completes first
      }
      
      // Clear reconnect timeout if any
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.warn('🔌 [SocketProvider] Socket connection warning:', error.message || error);
      console.debug('📊 Connection error details:', {
        type: error.type,
        description: error.description,
        context: error.context,
        message: error.message
      });
      
      // Specific handling for CORS/polling errors
      if (error.message?.includes('xhr poll error') || error.message?.includes('CORS')) {
        console.warn('⚠️  Polling/CORS error detected. Ensure backend CORS allows this origin.');
        console.warn('🔗 Server URL:', serverUrl);
        console.warn('📱 Is Native:', isNative);
      }
      
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️  [SocketProvider] Socket disconnected. Reason:', reason);
      setIsConnected(false);
      
      // Auto-reconnect on server-initiated disconnect
      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected us, attempting manual reconnect...');
        reconnectTimeoutRef.current = setTimeout(() => {
          if (newSocket && !newSocket.connected) {
            newSocket.connect();
          }
        }, 2000);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [SocketProvider] Successfully reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('🔄 [SocketProvider] Attempting to reconnect...');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('❌ [SocketProvider] Socket error:', error);
    });

    setSocket(newSocket);

    // Handle app pause/resume on Android (only if native)
    let pauseListener = null;
    let resumeListener = null;
    
    if (isNative) {
      try {
        import('@capacitor/app').then(({ App: CapacitorApp }) => {
          if (CapacitorApp && typeof CapacitorApp.addListener === 'function') {
            pauseListener = CapacitorApp.addListener('pause', () => {
              console.log('📱 [SocketProvider] App paused');

              // Tell backend we are in background so it sends FCM for incoming messages
              if (newSocket && newSocket.connected) {
                newSocket.emit('app_state', { state: 'background' });
                console.log('[SOCKET] Emitted app_state: background');
              }
            });

            resumeListener = CapacitorApp.addListener('resume', () => {
              console.log('📱 [SocketProvider] App resumed - checking socket connection');

              if (newSocket && !newSocket.connected) {
                console.log('[SOCKET] Reconnecting after app resume...');
                newSocket.connect();
              }
              // Tell backend we are now in foreground
              if (newSocket && newSocket.connected) {
                newSocket.emit('app_state', { state: 'foreground' });
                console.log('[SOCKET] Emitted app_state: foreground');
              }
            });
          }
        }).catch(err => {
          console.warn('Failed to load Capacitor App plugin:', err);
        });
      } catch (error) {
        console.warn('App lifecycle listeners not available:', error.message);
      }
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 [SocketProvider] Cleaning up socket connection');
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Safely remove listeners (robust against sync/async PluginListenerHandle)
      if (pauseListener) {
        Promise.resolve(pauseListener).then(h => {
          if (h && typeof h.remove === 'function') {
            h.remove();
          } else if (typeof h === 'function') {
            h();
          }
        }).catch(err => console.warn('Error removing pause listener:', err));
      }
      
      if (resumeListener) {
        Promise.resolve(resumeListener).then(h => {
          if (h && typeof h.remove === 'function') {
            h.remove();
          } else if (typeof h === 'function') {
            h();
          }
        }).catch(err => console.warn('Error removing resume listener:', err));
      }
      
      // Clean up socket
      if (newSocket) {
        try {
          newSocket.removeAllListeners();
          newSocket.disconnect();
        } catch (err) {
          console.warn('Error disconnecting socket:', err);
        }
      }
      
      socketRef.current = null;
      isInitializedRef.current = false;
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    console.warn('⚠️  useSocket called outside SocketProvider');
  }
  return socket;
};