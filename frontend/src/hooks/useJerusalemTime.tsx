import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

const JERUSALEM_TIMEZONE = 'Asia/Jerusalem';

export function useJerusalemTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    // Update every minute
    const interval = setInterval(updateTime, 60000);
    
    // Update immediately
    updateTime();

    return () => clearInterval(interval);
  }, []);

  const getCurrentJerusalemTime = () => {
    return formatInTimeZone(currentTime, JERUSALEM_TIMEZONE, 'HH:mm');
  };

  const isTimePassed = (timeSlot: string) => {
    try {
      const currentJerusalemTime = getCurrentJerusalemTime();
      const [currentHour, currentMinute] = currentJerusalemTime.split(':').map(Number);
      
      // Extract time from time slot (could be "07:30" or "07:30-08:00")
      const timeMatch = timeSlot.match(/^(\d{1,2}):(\d{2})/);
      if (!timeMatch) return false;
      
      const [, timeHour, timeMinute] = timeMatch;
      const slotHour = parseInt(timeHour);
      const slotMinute = parseInt(timeMinute);
      
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const slotTotalMinutes = slotHour * 60 + slotMinute;
      
      return currentTotalMinutes > slotTotalMinutes;
    } catch (error) {
      console.error('Error checking if time passed:', error);
      return false;
    }
  };

  const canRegister = (timeSlot: string) => {
    // Allow registration on all time slots as requested
    return true;
  };

  return {
    currentTime,
    getCurrentJerusalemTime,
    isTimePassed,
    canRegister
  };
}