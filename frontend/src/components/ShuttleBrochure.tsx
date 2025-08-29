import React, { useState } from 'react';
import { Bus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useShuttleData } from '@/hooks/useShuttleData';
import { TimeSlot } from './TimeSlot';
import { PickupLocations } from './PickupLocations';
import Navigation from './Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ShuttleBrochure = () => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sabidor');
  const { shuttleData, getCompanyByTime, loading } = useShuttleData();

  // Updated schedule data to reflect the correct schedule from database
  const sabidorSchedule = {
    outbound: {
      departure: ['7:00', '8:00', '9:30', '11:40', '14:00', '17:00', '19:00', '21:15', '22:00'],
      junction: ['7:45', '8:45', '10:15', '12:10', '14:45', '17:15', '19:30'],
      arrival: ['8:00', '9:00', '10:30', '12:20', '15:00', '17:45', '19:45', '22:00', '22:45']
    },
    return: {
      departure: ['8:15', '9:15', '10:45', '15:30', '17:45', '20:15', '22:15', '23:15'],
      arrival: ['9:15', '10:15', '11:30', '16:15', '19:00', '21:00', '23:00', '23:59']
    }
  };

  const kiryatArieSchedule = {
    outbound: ['6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:30', '14:45', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '21:30', '22:30'],
    return: ['7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:15', '15:20', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:30', '21:00', '22:00', '23:00']
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
    const company = getCompanyByTime(time);
    
    if (company) {
      toast.success(`מפעיל: ${company.name} - יציאה: ${time}`, {
        duration: 3000,
      });
    } else {
      toast.success(`שעת יציאה: ${time}`, {
        duration: 2000,
      });
    }
    
    setTimeout(() => setSelectedTime(null), 2000);
  };

  const getRouteInfo = (route: string) => {
    if (route === 'sabidor') {
      return "מסבידור לסירקין - הנסיעה מתחנת רכבת סבידור מרכז בתל אביב אל כפר סירקין היא בערך 18–22 ק\"מ, תלוי במסלול שתבחר (כביש 4, כביש 471 או דרך אם המושבות). ⏱️ זמני נסיעה משוערים ברכב: • בלי עומסים – בערך 25–30 דקות • בשעות העומס (בוקר או אחה\"צ) – זה יכול לקחת 40–55 דקות, ולעיתים אפילו יותר אם יש פקקים ביציאה מתל אביב, בצומת גהה או בצומת סירקין.";
    } else {
      return "מקרית אריה לסירקין - בנסיעה רגילה בין תחנת רכבת קריית אריה לבין כפר סירקין המרחק הוא בערך 6–8 ק\"מ (תלוי באיזה חלק של כפר סירקין). ⏱️ זמן נסיעה ברכב: • בלי עומסים – בערך 10–15 דקות • בשעות עומס (בוקר או אחר הצהריים) – זה יכול לעלות ל־20–30 דקות, לפעמים אפילו יותר אם יש פקקים בצומת סירקין או על כביש ז'בוטינסקי.";
    }
  };

  const getTimeCategory = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'בוקר';
    if (hour >= 12 && hour < 18) return 'אחר הצהריים';
    return 'ערב';
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'בוקר':
        return {
          bg: 'bg-amber-100 dark:bg-amber-800/60',
          hover: 'hover:bg-amber-200 dark:hover:bg-amber-700/70',
          text: 'text-amber-800 dark:text-amber-100',
          header: 'bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100'
        };
      case 'צהריים':
        return {
          bg: 'bg-orange-100 dark:bg-orange-800/60',
          hover: 'hover:bg-orange-200 dark:hover:bg-orange-700/70',
          text: 'text-orange-800 dark:text-orange-100',
          header: 'bg-orange-200 dark:bg-orange-700 text-orange-900 dark:text-orange-100'
        };
      case 'אחר הצהריים':
        return {
          bg: 'bg-blue-100 dark:bg-blue-800/60',
          hover: 'hover:bg-blue-200 dark:hover:bg-blue-700/70',
          text: 'text-blue-800 dark:text-blue-100',
          header: 'bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100'
        };
      case 'ערב':
        return {
          bg: 'bg-purple-100 dark:bg-purple-800/60',
          hover: 'hover:bg-purple-200 dark:hover:bg-purple-700/70',
          text: 'text-purple-800 dark:text-purple-100',
          header: 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700/60',
          hover: 'hover:bg-gray-200 dark:hover:bg-gray-600/70',
          text: 'text-gray-800 dark:text-gray-100',
          header: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        };
    }
  };

  const TimeSlotOld = ({ time }: { time: string }) => {
    const category = getTimeCategory(time);
    const styles = getCategoryStyles(category);
    const company = getCompanyByTime(time);
    
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span 
              onClick={() => handleTimeClick(time)}
              className={`p-3 rounded text-base font-medium cursor-pointer transition-all ${styles.bg} ${styles.hover} ${styles.text} ${
                selectedTime === time ? 'ring-2 ring-emerald-500 scale-105 shadow-lg' : ''
              }`}
            >
              {time}
            </span>
          </TooltipTrigger>
          <TooltipContent className="w-64 p-3" side="top" align="center">
            <div className="space-y-1">
              <div className="font-semibold text-sm">מפעיל השאטל</div>
              <div className="text-sm font-medium text-primary">
                {company?.name || 'לא נמצא מפעיל'}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                לחץ לבחירת הנסיעה
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const TimeGroupSection = ({ title, times, colors }: { title: string, times: string[], colors: any }) => {
    if (times.length === 0) return null;
    
    return (
      <div className="mb-4">
        <div className={`${colors.header} p-3 rounded-lg text-center font-bold text-base mb-3 shadow-sm`}>
          {title}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {times.map((time, index) => (
            <TimeSlotOld key={`${title}-${index}`} time={time} />
          ))}
        </div>
      </div>
    );
  };

  const renderMobileTimeGroups = (times: string[], direction: string) => {
    const allTimesWithBreaks = [...times, '12:30-13:30'].sort((a, b) => {
      const getHour = (time: string) => {
        const hour = parseInt(time.split(':')[0]);
        return hour;
      };
      return getHour(a) - getHour(b);
    });

    const groups = {
      'בוקר': [] as string[],
      'צהריים': [] as string[],
      'הפסקה': [] as string[],
      'אחר הצהריים': [] as string[],
      'ערב': [] as string[]
    };
    
    allTimesWithBreaks.forEach(time => {
      if (time === '12:30-13:30') {
        groups['הפסקה'].push(time);
        return;
      }
      
      const hour = parseInt(time.split(':')[0]);
      let category;
      if (hour >= 6 && hour < 11) category = 'בוקר';
      else if (hour >= 11 && hour < 14) category = 'צהריים';
      else if (hour >= 14 && hour < 18) category = 'אחר הצהריים';
      else category = 'ערב';
      
      groups[category].push(time);
    });

    return (
      <div className="space-y-4">
        <TimeGroupSection 
          title="בוקר" 
          times={groups.בוקר} 
          colors={getCategoryStyles('בוקר')} 
        />
        <TimeGroupSection 
          title="צהריים" 
          times={groups.צהריים} 
          colors={getCategoryStyles('צהריים')} 
        />
        
        {/* Break Notice in chronological order */}
        {groups.הפסקה.length > 0 && (
          <div className="bg-red-100 dark:bg-red-800/60 p-3 rounded-lg text-center border border-red-200 dark:border-red-600">
            <div className="bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg text-center font-bold text-base mb-2 shadow-sm">
              הפסקה
            </div>
            <span className="text-red-800 dark:text-red-100 font-bold text-sm">
              🕐 הפסקה: 12:30-13:30
            </span>
          </div>
        )}
        
        <TimeGroupSection 
          title="אחר הצהריים" 
          times={groups['אחר הצהריים']} 
          colors={getCategoryStyles('אחר הצהריים')} 
        />
        <TimeGroupSection 
          title="ערב" 
          times={groups.ערב} 
          colors={getCategoryStyles('ערב')} 
        />
      </div>
    );
  };

  const renderTableRows = (mainSchedule: string[], returnSchedule?: string[], isKiryatArie: boolean = false, isReturn: boolean = false) => {
    const safeMainSchedule = mainSchedule || [];
    const safeReturnSchedule = returnSchedule || [];
    const allTimes = isKiryatArie ? [...safeMainSchedule, ...safeReturnSchedule] : safeMainSchedule;
    const sortedTimes = [...new Set(allTimes)].sort((a: string, b: string) => {
      const getHour = (time: string) => parseInt(time.split(':')[0]);
      const getMinute = (time: string) => parseInt(time.split(':')[1]);
      const aHour = getHour(a);
      const bHour = getHour(b);
      const aMinute = getMinute(a);
      const bMinute = getMinute(b);
      return aHour === bHour ? aMinute - bMinute : aHour - bHour;
    });

    const rows: JSX.Element[] = [];
    let currentPeriod = '';
    let breakAdded = false;

    sortedTimes.forEach((time: string, index) => {
      const hour = parseInt(time.split(':')[0]);
      let period = '';
      
      if (hour >= 6 && hour < 11) period = 'בוקר';
      else if (hour >= 11 && hour < 14) period = 'צהריים';
      else if (hour >= 14 && hour < 18) period = 'אחר הצהריים';
      else period = 'ערב';

      // Add break row between noon and afternoon chronologically
      if (!breakAdded && hour >= 12 && hour < 14 && index > 0) {
        rows.push(
          <tr key="break-row" className="bg-red-50 dark:bg-red-900/20">
            <td colSpan={isKiryatArie ? 3 : (isReturn ? 3 : 4)} className="border border-red-300 dark:border-red-600 p-3 text-center">
              <div className="bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg font-bold">
                הפסקה: 12:30-13:30
              </div>
            </td>
          </tr>
        );
        breakAdded = true;
      }

      const showPeriod = period !== currentPeriod;
      currentPeriod = period;

      if (isKiryatArie) {
        const outboundTime = mainSchedule.includes(time) ? time : '';
        const returnTime = returnSchedule?.includes(time) ? time : '';
        
        rows.push(
          <tr key={`table-${index}`} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            <td className="border border-emerald-300 dark:border-emerald-600 p-2 text-center">
              {showPeriod && (
                <div className={`${getCategoryStyles(period).header} p-2 rounded text-sm font-bold mb-1`}>
                  {period}
                </div>
              )}
            </td>
            <td className="border border-emerald-300 dark:border-emerald-600 p-2 text-center">
              {outboundTime && (
                <TimeSlot 
                  time={outboundTime} 
                  routeType="kiryat-arie" 
                  direction="outbound" 
                />
              )}
            </td>
            <td className="border border-emerald-300 dark:border-emerald-600 p-2 text-center">
              {returnTime && (
                <TimeSlot 
                  time={returnTime} 
                  routeType="kiryat-arie" 
                  direction="return" 
                />
              )}
            </td>
          </tr>
        );
      } else {
        const depTime = mainSchedule.includes(time) ? time : '';
        const junctionTime = isReturn ? '' : (sabidorSchedule.outbound.junction[sabidorSchedule.outbound.departure.indexOf(time)] || '');
        const arrivalTime = isReturn ? (sabidorSchedule.return.arrival[sabidorSchedule.return.departure.indexOf(time)] || '') : (sabidorSchedule.outbound.arrival[sabidorSchedule.outbound.departure.indexOf(time)] || '');

        if (depTime) {
          rows.push(
            <tr key={`table-${index}`} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <td className="border border-emerald-300 dark:border-emerald-600 p-2 text-center">
                {showPeriod && (
                  <div className={`${getCategoryStyles(period).header} p-2 rounded text-sm font-bold mb-1`}>
                    {period}
                  </div>
                )}
              </td>
              <td className="border border-emerald-300 dark:border-emerald-600 p-2 text-center">
                <TimeSlot 
                  time={depTime} 
                  routeType="sabidor" 
                  direction={isReturn ? "return" : "outbound"} 
                />
              </td>
              {!isReturn && (
                <td className="border border-emerald-300 dark:border-emerald-600 p-2 text-center">
                  {junctionTime ? (
                    <TimeSlot 
                      time={junctionTime} 
                      routeType="sabidor" 
                      direction="outbound" 
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              )}
              <td className="border border-emerald-300 dark:border-emerald-600 p-2 text-center">
                {arrivalTime ? (
                  <TimeSlot 
                    time={arrivalTime} 
                    routeType="sabidor" 
                    direction={isReturn ? "return" : "outbound"} 
                  />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          );
        }
      }
    });

    return rows;
  };

  const renderDesktopTables = (schedule: any, isKiryatArie: boolean = false) => {
    if (isKiryatArie) {
      return (
        <div className="space-y-6">
          {/* Outbound Table */}
          <div className="bg-emerald-600 text-white p-3 rounded-lg text-center">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              הלוך - מקריית אריה לצפריר
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <thead>
                <tr className="bg-emerald-100 dark:bg-emerald-900/30">
                  <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">חלקי היום</th>
                  <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">יציאה מקריית אריה</th>
                  <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">חזור מצפריר</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRows(schedule.outbound, schedule.return, isKiryatArie)}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Outbound Table */}
        <div className="bg-emerald-600 text-white p-3 rounded-lg text-center">
          <h3 className="font-bold text-lg flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            הלוך - מסבידור לצפריר
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-emerald-100 dark:bg-emerald-900/30">
                <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">חלקי היום</th>
                <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">יציאה מסבידור</th>
                <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">צומת סירקין</th>
                <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">הגעה לצפריר</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(isKiryatArie ? schedule.outbound : schedule.outbound.departure, isKiryatArie ? schedule.return : null, isKiryatArie)}
            </tbody>
          </table>
        </div>

        {/* Return Table */}
        <div className="bg-emerald-500 text-white p-3 rounded-lg text-center">
          <h3 className="font-bold text-lg flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            חזור - מצפריר לסבידור
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-emerald-100 dark:bg-emerald-900/30">
                <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">חלקי היום</th>
                <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">יציאה מצפריר</th>
                <th className="border border-emerald-300 dark:border-emerald-600 p-3 text-emerald-800 dark:text-emerald-200 font-bold">הגעה לסבידור</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(schedule.return.departure, null, false, true)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-emerald-700 dark:text-emerald-300">טוען נתוני השאטלים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 dark:text-white p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <Navigation />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6" dir="rtl">
          <div className="mb-8">
            <TabsList className="w-full bg-emerald-50 dark:bg-gray-800 p-3 gap-3 rounded-lg shadow-sm border border-emerald-200 dark:border-gray-600 flex flex-col lg:grid lg:grid-cols-2 h-auto">
              <TabsTrigger value="sabidor" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white hover:bg-emerald-100 dark:hover:bg-gray-700 text-base lg:text-lg font-bold px-4 py-4 leading-relaxed rounded-lg transition-all shadow-md w-full h-auto min-h-[3rem] flex items-center justify-center border border-emerald-300 dark:border-gray-600">
                סבידור תל אביב ──── צפריר
              </TabsTrigger>
              <TabsTrigger value="kiryat-arie" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white hover:bg-emerald-100 dark:hover:bg-gray-700 text-base lg:text-lg font-bold px-4 py-4 leading-relaxed rounded-lg transition-all shadow-md w-full h-auto min-h-[3rem] flex items-center justify-center border border-emerald-300 dark:border-gray-600">
                קריית אריה ──── צפריר
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Sabidor Tel Aviv - Tzafrir */}
          <TabsContent value="sabidor" className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 p-3 sm:p-6 rounded-xl border border-emerald-200 dark:border-gray-600">
              <PickupLocations routeType="sabidor" />
              
              <div className="text-center mb-6">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-200 mb-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
                        <Bus className="w-6 h-6" />
                        שירות שאטלים סבידור ⟵ צפריר
                      </h2>
                    </TooltipTrigger>
                    <TooltipContent className="w-96 p-4" side="bottom" align="center">
                      <div className="text-xs leading-relaxed whitespace-pre-line">
                        {getRouteInfo('sabidor')}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-emerald-600 dark:text-emerald-300 text-sm sm:text-base">
                  לחץ על השעה להרשמה לנסיעה • לחץ על הכותרת למידע על המסלול
                </p>
                <img src="/lovable-uploads/3ac31ab8-381b-4db4-8d24-78c6d40ab109.png" alt="מיניבוס" className="w-60 h-48 mx-auto mt-4 object-contain" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'}} />
                
        {/* כפתורי הלוך וחזור */}
        <div className="flex justify-center gap-4 mb-8 p-4 bg-muted/20 rounded-lg">
          <Button variant="outline" size="lg" className="flex items-center gap-2">
            <span>←</span>
            הלוך
          </Button>
          <Button variant="outline" size="lg" className="flex items-center gap-2">
            חזור
            <span>→</span>
          </Button>
        </div>

        {/* Mobile Navigation Buttons */}
                <div className="flex gap-4 justify-center mt-4 lg:hidden">
                  <button 
                    onClick={() => document.getElementById('sabidor-outbound')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    הלוך
                  </button>
                  <button 
                    onClick={() => document.getElementById('sabidor-return')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    חזור
                  </button>
                </div>
              </div>

              {/* Mobile Time Groups View */}
              <div className="block lg:hidden space-y-6">
                {/* Outbound Section */}
                <div id="sabidor-outbound" className="bg-emerald-600 text-white p-3 rounded-lg text-center">
                  <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    הלוך - מסבידור לצפריר
                  </h3>
                </div>
                
                {renderMobileTimeGroups(sabidorSchedule.outbound.departure, 'outbound')}

                {/* Return Section */}
                <div id="sabidor-return" className="bg-emerald-500 text-white p-3 rounded-lg text-center mt-8">
                  <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    חזור - מצפריר לסבידור
                  </h3>
                </div>
                
                {renderMobileTimeGroups(sabidorSchedule.return.departure, 'return')}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                {renderDesktopTables(sabidorSchedule)}
              </div>
              
            </div>
          </TabsContent>

          {/* Tab 2: Kiryat Arie - Tzafrir */}
          <TabsContent value="kiryat-arie" className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 p-3 sm:p-6 rounded-xl border border-emerald-200 dark:border-gray-600">
              <PickupLocations routeType="kiryat-arie" />
              
              <div className="text-center mb-6">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-200 mb-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
                        <Bus className="w-6 h-6" />
                        שירות שאטלים קריית אריה ⟵ צפריר
                      </h2>
                    </TooltipTrigger>
                    <TooltipContent className="w-96 p-4" side="bottom" align="center">
                      <div className="text-xs leading-relaxed whitespace-pre-line">
                        {getRouteInfo('kiryat-arie')}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-emerald-600 dark:text-emerald-300 text-sm sm:text-base">
                  לחץ על השעה להרשמה לנסיעה • לחץ על הכותרת למידע על המסלול
                </p>
                <img src="/lovable-uploads/3ac31ab8-381b-4db4-8d24-78c6d40ab109.png" alt="מיניבוס" className="w-60 h-48 mx-auto mt-4 object-contain" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'}} />
                
                {/* Mobile Navigation Buttons */}
                <div className="flex gap-4 justify-center mt-4 lg:hidden">
                  <button 
                    onClick={() => document.getElementById('kiryat-outbound')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    הלוך
                  </button>
                  <button 
                    onClick={() => document.getElementById('kiryat-return')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    חזור
                  </button>
                </div>
              </div>

              {/* Mobile Time Groups View */}
              <div className="block lg:hidden space-y-6">
                {/* Outbound Section */}
                <div id="kiryat-outbound" className="bg-emerald-600 text-white p-3 rounded-lg text-center">
                  <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    הלוך - מקריית אריה לצפריר
                  </h3>
                </div>
                
                {renderMobileTimeGroups(kiryatArieSchedule.outbound, 'outbound')}

                {/* Return Section */}
                <div id="kiryat-return" className="bg-emerald-500 text-white p-3 rounded-lg text-center mt-8">
                  <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    חזור - מצפריר לקריית אריה
                  </h3>
                </div>
                
                {renderMobileTimeGroups(kiryatArieSchedule.return, 'return')}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                {renderDesktopTables(kiryatArieSchedule, true)}
              </div>
              
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ShuttleBrochure;