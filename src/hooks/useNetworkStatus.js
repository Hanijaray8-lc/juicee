import { useEffect, useState, useCallback } from 'react';
import { Network } from '@capacitor/network';

/**
 * Hook to monitor network status on Android/iOS
 * Returns: { isOnline, networkType, isConnecting }
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState('unknown');
  const [isConnecting, setIsConnecting] = useState(false);

  const checkNetworkStatus = useCallback(async () => {
    try {
      const status = await Network.getStatus();
      console.log('📡 Network Status:', {
        connected: status.connected,
        connectionType: status.connectionType
      });
      
      setIsOnline(status.connected);
      setNetworkType(status.connectionType || 'unknown');
    } catch (error) {
      console.error('Error checking network status:', error);
      // Default to online if check fails
      setIsOnline(true);
    }
  }, []);

  useEffect(() => {
    // Check initial network status
    checkNetworkStatus();

    // Register network status listener
    let unsubscribe;
    
    try {
      unsubscribe = Network.addListener('networkStatusChange', (status) => {
        console.log('🌐 Network Status Changed:', {
          connected: status.connected,
          connectionType: status.connectionType,
          timestamp: new Date().toISOString()
        });
        
        setIsOnline(status.connected);
        setNetworkType(status.connectionType || 'unknown');
        
        // If network goes from offline to online, set connecting flag
        if (status.connected) {
          setIsConnecting(true);
          // Clear flag after 2 seconds
          setTimeout(() => setIsConnecting(false), 2000);
        }
      });
    } catch (error) {
      console.warn('Network listener not available (web environment):', error.message);
    }

    // Handle app pause/resume for Android background handling (only if native)
    let resumeListener;
    const isNative = typeof window !== 'undefined' && window.Capacitor;
    if (isNative) {
      try {
        import('@capacitor/app').then(({ App: CapacitorApp }) => {
          if (CapacitorApp && typeof CapacitorApp.addListener === 'function') {
            resumeListener = CapacitorApp.addListener('resume', () => {
              console.log('📱 App resumed - checking network status');
              checkNetworkStatus();
              setIsConnecting(true);
              setTimeout(() => setIsConnecting(false), 2000);
            });
          }
        }).catch(err => {
          console.warn('Failed to load Capacitor App plugin:', err);
        });
      } catch (error) {
        console.warn('Resume listener not available:', error.message);
      }
    }

    // Cleanup
    return () => {
      if (unsubscribe) {
        Promise.resolve(unsubscribe).then(h => {
          if (h && typeof h.remove === 'function') {
            h.remove();
          } else if (typeof h === 'function') {
            h();
          }
        }).catch(err => {});
      }
      if (resumeListener) {
        Promise.resolve(resumeListener).then(h => {
          if (h && typeof h.remove === 'function') {
            h.remove();
          } else if (typeof h === 'function') {
            h();
          }
        }).catch(err => {});
      }
    };
  }, [checkNetworkStatus]);

  return { isOnline, networkType, isConnecting };
};

export default useNetworkStatus;
