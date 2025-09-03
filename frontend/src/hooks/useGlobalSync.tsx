import { useEffect, useCallback, useRef } from 'react';

interface UseGlobalSyncOptions {
  onShuttleRegistrationChange?: () => void;
  onCompanyChange?: () => void;
  onShuttleChange?: () => void;
  onScheduleChange?: () => void;
}

export function useGlobalSync(options: UseGlobalSyncOptions = {}) {
  const {
    onShuttleRegistrationChange,
    onCompanyChange,
    onShuttleChange,
    onScheduleChange
  } = options;

  // Use refs to maintain stable references
  const callbacksRef = useRef({
    onShuttleRegistrationChange,
    onCompanyChange,
    onShuttleChange,
    onScheduleChange
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onShuttleRegistrationChange,
      onCompanyChange,
      onShuttleChange,
      onScheduleChange
    };
  }, [onShuttleRegistrationChange, onCompanyChange, onShuttleChange, onScheduleChange]);

  const handleGlobalUpdate = useCallback(() => {
    console.log('🔄 Global sync triggered - updating all callbacks');
    callbacksRef.current.onShuttleRegistrationChange?.();
    callbacksRef.current.onCompanyChange?.();
    callbacksRef.current.onShuttleChange?.();
    callbacksRef.current.onScheduleChange?.();
    
    // Dispatch custom event for components listening to global refresh
    window.dispatchEvent(new CustomEvent('global-data-refresh', { 
      detail: { timestamp: Date.now() } 
    }));
  }, []);

  const triggerGlobalRefresh = useCallback(() => {
    console.log('🔄 Manual global refresh triggered');
    handleGlobalUpdate();
    
    // Additional fallback refresh after short delay
    setTimeout(() => {
      console.log('🔄 Fallback refresh executed');
      window.dispatchEvent(new CustomEvent('global-data-refresh', { 
        detail: { timestamp: Date.now(), type: 'fallback' } 
      }));
    }, 200);
  }, [handleGlobalUpdate]);

  return {
    triggerGlobalRefresh
  };
}