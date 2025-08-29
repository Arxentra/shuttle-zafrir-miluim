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


  const handleGlobalUpdate = useCallback(() => {
    console.log('🔄 Global sync triggered - updating all callbacks');
    onShuttleRegistrationChange?.();
    onCompanyChange?.();
    onShuttleChange?.();
    onScheduleChange?.();
    
    // Dispatch custom event for components listening to global refresh
    window.dispatchEvent(new CustomEvent('global-data-refresh', { 
      detail: { timestamp: Date.now() } 
    }));
  }, [onShuttleRegistrationChange, onCompanyChange, onShuttleChange, onScheduleChange]);

  useEffect(() => {
    console.log('🔗 Setting up WebSocket real-time sync');
    
    // Set up WebSocket listeners for all table changes
    wsService.on('schedule-updated', () => {
      console.log('📅 Schedule changed');
      onScheduleChange?.();
      setTimeout(handleGlobalUpdate, 100);
    });

    wsService.on('company-updated', () => {
      console.log('🏢 Company changed');
      onCompanyChange?.();
      setTimeout(handleGlobalUpdate, 100);
    });

    wsService.on('shuttle-updated', () => {
      console.log('🚌 Shuttle changed');
      onShuttleChange?.();
      setTimeout(handleGlobalUpdate, 100);
    });

    wsService.on('registration-updated', () => {
      console.log('📝 Registration changed');
      onShuttleRegistrationChange?.();
      setTimeout(handleGlobalUpdate, 100);
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket listeners');
      wsService.off('schedule-updated');
      wsService.off('company-updated');
      wsService.off('shuttle-updated');
      wsService.off('registration-updated');
    };
  }, [handleGlobalUpdate, onShuttleRegistrationChange, onCompanyChange, onShuttleChange, onScheduleChange]);

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