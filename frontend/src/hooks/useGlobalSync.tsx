import { useEffect, useCallback, useRef } from 'react';
import { wsService } from '@/services/websocketService';

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

  useEffect(() => {
    console.log('🔗 Setting up WebSocket real-time sync');
    
    // Set up WebSocket listeners for all table changes
    const scheduleHandler = () => {
      console.log('📅 Schedule changed');
      callbacksRef.current.onScheduleChange?.();
      setTimeout(handleGlobalUpdate, 100);
    };

    const companyHandler = () => {
      console.log('🏢 Company changed');
      callbacksRef.current.onCompanyChange?.();
      setTimeout(handleGlobalUpdate, 100);
    };

    const shuttleHandler = () => {
      console.log('🚌 Shuttle changed');
      callbacksRef.current.onShuttleChange?.();
      setTimeout(handleGlobalUpdate, 100);
    };

    const registrationHandler = () => {
      console.log('📝 Registration changed');
      callbacksRef.current.onShuttleRegistrationChange?.();
      setTimeout(handleGlobalUpdate, 100);
    };

    wsService.on('schedule-updated', scheduleHandler);
    wsService.on('company-updated', companyHandler);
    wsService.on('shuttle-updated', shuttleHandler);
    wsService.on('registration-updated', registrationHandler);

    return () => {
      console.log('🔌 Cleaning up WebSocket listeners');
      wsService.off('schedule-updated', scheduleHandler);
      wsService.off('company-updated', companyHandler);
      wsService.off('shuttle-updated', shuttleHandler);
      wsService.off('registration-updated', registrationHandler);
    };
  }, []); // Empty dependency array - set up once on mount

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