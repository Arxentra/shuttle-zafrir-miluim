import { useEffect } from 'react';
import { useGlobalSync } from './useGlobalSync';

/**
 * Specialized hook for admin components to ensure real-time updates
 * propagate immediately to the landing page
 */
export function useAdminRealtime(onDataChange?: () => void) {
  const { triggerGlobalRefresh } = useGlobalSync();

  // Auto-trigger refresh after any admin action
  const notifyDataChange = () => {
    console.log('🔄 Admin data change - triggering global sync');
    onDataChange?.();
    triggerGlobalRefresh();
  };

  // Enhanced admin-specific real-time sync
  useEffect(() => {
    console.log('🔧 Admin real-time sync initialized');
    
    // Listen for admin-specific events
    const handleAdminUpdate = () => {
      console.log('🔄 Admin update detected');
      notifyDataChange();
    };

    window.addEventListener('admin-data-updated', handleAdminUpdate);

    return () => {
      window.removeEventListener('admin-data-updated', handleAdminUpdate);
    };
  }, []);

  return {
    notifyDataChange,
    triggerGlobalRefresh
  };
}