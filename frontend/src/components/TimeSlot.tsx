
import React, { useState, useEffect } from 'react';
import { useJerusalemTime } from '@/hooks/useJerusalemTime';
import { useRegistrationCount } from '@/hooks/useRegistrationCount';
import RegistrationModal from './RegistrationModal';
import { Users } from 'lucide-react';
import { wsService } from '@/services/websocketService';

interface TimeSlotProps {
  time: string;
  routeType: 'sabidor' | 'kiryat-arie';
  direction: 'outbound' | 'return';
  className?: string;
  children?: React.ReactNode;
}

export function TimeSlot({ 
  time, 
  routeType, 
  direction, 
  className = '', 
  children 
}: TimeSlotProps) {
  const { isTimePassed, canRegister } = useJerusalemTime();
  const { count, loading: countLoading } = useRegistrationCount(time, routeType, direction);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const isPassed = isTimePassed(time);
  const registrationAllowed = canRegister(time);
  const isLunchBreak = time === "12:30-13:30";

  // Enhanced real-time updates with instant synchronization
  useEffect(() => {
    // Set up WebSocket listeners for real-time updates
    wsService.on('registration-updated', () => {
      console.log('🎯 TimeSlot real-time update:', { 
        time, 
        routeType, 
        direction, 
        timestamp: new Date().toLocaleTimeString()
      });
      // Immediate UI update for real-time experience
      setForceUpdate(prev => prev + 1);
      
      // Trigger global refresh after short delay to ensure all components sync
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('global-data-refresh'));
      }, 200);
    });

    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      console.log('🌐 TimeSlot global refresh for:', { time, routeType, direction });
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('global-data-refresh', handleGlobalRefresh);

    return () => {
      wsService.off('registration-updated');
      window.removeEventListener('global-data-refresh', handleGlobalRefresh);
    };
  }, [time, routeType, direction]);

  const handleClick = () => {
    if (isLunchBreak) {
      // Show "אין אפשרות להירשם" message for lunch break
      alert("אין אפשרות להירשם - הפסקת צהריים");
      return;
    }
    
    // Check if this is an arrival time slot (הגעה לצפריר or הגעה לסבידור)
    const pickupText = children?.toString() || '';
    if (pickupText.includes('הגעה לצפריר') || pickupText.includes('הגעה לסבידור')) {
      alert("אין אפשרות להירשם");
      return;
    }
    
    console.log('TimeSlot clicked:', { time, routeType, direction, registrationAllowed, isPassed });
    setIsModalOpen(true);
  };

  const getTimeSlotStyles = () => {
    const baseStyles = 'transition-all duration-300 border-2 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[80px] sm:min-w-[100px] md:min-w-[120px] lg:min-w-[140px] min-h-[80px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[140px] text-center flex flex-col justify-center items-center';
    
    // Lunch break styling - orange theme
    if (isLunchBreak) {
      return `${baseStyles} cursor-pointer bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-800/50 dark:to-orange-900/50 hover:from-orange-300 hover:to-orange-400 dark:hover:from-orange-700/60 dark:hover:to-orange-800/60 text-orange-900 dark:text-orange-100 border-orange-500 dark:border-orange-400 ring-2 ring-orange-300/50 dark:ring-orange-500/30 shadow-orange-200/40 dark:shadow-orange-800/20`;
    }
    
    // Enhanced visibility for passed times - grey theme
    if (isPassed) {
      if (count > 0) {
        return `${baseStyles} cursor-pointer bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white dark:text-gray-200 border-red-500 hover:border-red-600 hover:from-gray-500 hover:to-gray-600 dark:hover:from-gray-500 dark:hover:to-gray-600 ring-2 ring-red-300/60 dark:ring-red-500/40 opacity-80`;
      }
      return `${baseStyles} cursor-pointer bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:from-gray-400 hover:to-gray-500 dark:hover:from-gray-600 dark:hover:to-gray-700 opacity-65`;
    }
    
    // Enhanced visibility for future time slots with registrations - green theme with red border
    if (count > 0) {
      return `${baseStyles} cursor-pointer bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800/50 dark:to-green-900/50 hover:from-green-200 hover:to-green-300 dark:hover:from-green-700/60 dark:hover:to-green-800/60 text-green-900 dark:text-green-100 border-red-500 hover:border-red-600 ring-2 ring-red-300/70 dark:ring-red-500/50 shadow-green-200/50 dark:shadow-green-800/30`;
    }
    
    // Enhanced visibility for available future time slots - green theme
    return `${baseStyles} cursor-pointer bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800/30 dark:to-green-900/30 hover:from-green-200 hover:to-green-300 dark:hover:from-green-700/40 dark:hover:to-green-800/40 text-green-900 dark:text-green-100 border-green-500 dark:border-green-400 ring-2 ring-green-300/50 dark:ring-green-500/30 shadow-green-200/40 dark:shadow-green-800/20`;
  };

  const getTooltipText = () => {
    if (isLunchBreak) {
      return "הפסקת צהריים - אין אפשרות להירשם";
    }
    if (isPassed) {
      return `שעה שעברה - עדיין ניתן להירשם${count > 0 ? ` (${count} נרשמו)` : ''}`;
    }
    return `לחץ להירשם לנסיעה - זמין לכל השעות${count > 0 ? ` (${count} נרשמו)` : ''}`;
  };

  return (
    <>
      <div 
        className={`p-3 sm:p-4 text-center relative ${getTimeSlotStyles()} ${className} rounded-xl font-bold backdrop-blur-sm`}
        onClick={handleClick}
        title={getTooltipText()}
      >
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <span className="text-sm sm:text-base md:text-lg lg:text-xl font-black drop-shadow-sm leading-tight">{children || time}</span>
          {!countLoading && count > 0 && (
            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full bg-white/90 dark:bg-black/40 text-emerald-800 dark:text-emerald-200 border border-emerald-500 dark:border-emerald-400 shadow-md backdrop-blur-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{count}</span>
            </div>
          )}
        </div>
      </div>
      
      <RegistrationModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        timeSlot={time}
        routeType={routeType}
        direction={direction}
      />
    </>
  );
}
