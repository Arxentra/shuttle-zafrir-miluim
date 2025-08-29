import { useState, useEffect } from 'react';
import { dataService } from '@/services/dataService';

interface Company {
  id: string;
  name: string;
  shuttle_number: number;
  is_active: boolean;
}

interface Shuttle {
  id: string;
  company_id: string;
  name: string;
  shuttle_number: number;
  is_active: boolean;
  company?: Company;
}

interface ShuttleSchedule {
  id: string;
  shuttle_id: string;
  time_slot: string;
  route_description: string;
  is_break: boolean;
  sort_order: number;
}

export interface ShuttleData {
  shuttle: Shuttle;
  company: Company;
  schedules: ShuttleSchedule[];
}

export function useShuttleData() {
  const [shuttleData, setShuttleData] = useState<ShuttleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShuttleData();
  }, []);

  const fetchShuttleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching fresh shuttle data...');

      // Fetch shuttles with companies
      const shuttlesData = await dataService.getShuttles();
      const activeShuttles = (shuttlesData || []).filter(shuttle => shuttle.is_active);

      // Fetch all schedules
      const schedulesData = await dataService.getSchedules();

      // Combine data
      const combinedData: ShuttleData[] = (activeShuttles || []).map(shuttle => ({
        shuttle,
        company: shuttle.company || { id: '', name: '', shuttle_number: 0, is_active: false },
        schedules: (schedulesData || []).filter(schedule => schedule.shuttle_id === shuttle.id)
      }));

      console.log('✅ Successfully fetched shuttle data:', {
        shuttles: activeShuttles?.length || 0,
        schedules: schedulesData?.length || 0,
        combined: combinedData.length
      });

      setShuttleData(combinedData);
    } catch (err) {
      console.error('❌ Error fetching shuttle data:', err);
      setError('שגיאה בטעינת נתוני השאטלים');
    } finally {
      setLoading(false);
    }
  };

  const getCompanyByTime = (time: string): Company | null => {
    for (const data of shuttleData) {
      const matchingSchedule = data.schedules.find(schedule => 
        (schedule.time_slot === time || schedule.time_slot.includes(time)) && !schedule.is_break
      );
      if (matchingSchedule) {
        return data.company;
      }
    }
    return null;
  };

  return {
    shuttleData,
    loading,
    error,
    getCompanyByTime,
    refetch: fetchShuttleData
  };
}