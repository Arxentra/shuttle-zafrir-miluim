import { useState, useEffect } from 'react';
import { dataService } from '@/services/dataService';

export function useRegistrationCount(
  timeSlot: string,
  routeType: 'sabidor' | 'kiryat-arie',
  direction: 'outbound' | 'return'
) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!timeSlot) return;

    const fetchCount = async () => {
      setLoading(true);
      try {
        const registrations = await dataService.getRegistrations({
          time_slot: timeSlot,
          route_type: routeType,
          direction: direction,
          registration_date: new Date().toISOString().split('T')[0]
        });
        
        const registrationCount = registrations ? registrations.length : 0;
        setCount(registrationCount);
      } catch (error) {
        console.error('Error fetching registration count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Note: Real-time updates disabled (WebSocket removed)

    // Global refresh listener for cross-component updates
    const handleGlobalRefresh = () => {
      fetchCount();
    };

    window.addEventListener('global-data-refresh', handleGlobalRefresh);

    return () => {
      window.removeEventListener('global-data-refresh', handleGlobalRefresh);
    };
  }, [timeSlot, routeType, direction]);

  return { count, loading };
}