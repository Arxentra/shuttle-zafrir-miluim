import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { PickupLocations } from '@/components/PickupLocations';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';
// import shuttleIcon from '@/assets/shuttle-logo-new.png';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useShuttleData } from '@/hooks/useShuttleData';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { TimeSlot } from '@/components/TimeSlot';
import { dataService } from '@/services/dataService';

export default function DynamicShuttleBrochure() {
  const { shuttleData, loading, error, getCompanyByTime, refetch } = useShuttleData();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sabidor');
  const [activeDirection, setActiveDirection] = useState<'outbound' | 'return'>('outbound');

  // Enhanced global real-time synchronization with immediate updates
  const { triggerGlobalRefresh } = useGlobalSync({
    onShuttleRegistrationChange: () => {
      console.log('🔄 Registration change detected - refreshing landing page');
      refetch();
    },
    onCompanyChange: () => {
      console.log('🔄 Company change detected - refreshing landing page');
      refetch();
    },
    onShuttleChange: () => {
      console.log('🔄 Shuttle change detected - refreshing landing page');
      refetch();
    },
    onScheduleChange: () => {
      console.log('🔄 Schedule change detected - refreshing landing page');
      refetch();
    }
  });

  // Enhanced real-time listener with better error handling
  useEffect(() => {
    const handleGlobalRefresh = (event?: CustomEvent) => {
      console.log('🌍 Global refresh event received on landing page', event?.detail);
      refetch();
    };

    // Listen for both standard and custom refresh events
    window.addEventListener('global-data-refresh', handleGlobalRefresh);

    // Add polling fallback every 30 seconds for reliability
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling fallback - refreshing data');
      refetch();
    }, 30000);

    return () => {
      window.removeEventListener('global-data-refresh', handleGlobalRefresh);
      clearInterval(pollInterval);
    };
  }, [refetch]);

  const getRouteHoverContent = (shuttleNumber: number) => {
    switch(shuttleNumber) {
      case 1:
        return `שירות שאטלים סבידור - צפריר
נקודות עצירה:
• יציאה מסבידור תל אביב מרכז
• עצירה בצומת סירקין
• הגעה לצפריר

זמני נסיעה משוערים:
• מסבידור לצומת סירקין: כ-45 דקות
• מצומת סירקין לצפריר: כ-15 דקות`;
      case 2:
        return `שירות שאטלים חזור מצפריר
נקודות עצירה:
• יציאה מצפריר
• הגעה לסבידור תל אביב מרכז

זמני נסיעה משוערים:
• מצפריר לסבידור: כ-60 דקות`;
      case 3:
        return `שירות שאטלים קריית אריה - צפריר
נקודות עצירה:
• יציאה מקריית אריה
• הגעה לצפריר

זמני נסיעה משוערים:
• מקריית אריה לצפריר: כ-45 דקות`;
      case 4:
        return `שירות שאטלים חזור מצפריר
נקודות עצירה:
• יציאה מצפריר
• הגעה לקריית אריה

זמני נסיעה משוערים:
• מצפריר לקריית אריה: כ-45 דקות`;
      default:
        return '';
    }
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
    setTimeout(() => setSelectedTime(null), 3000);
  };

  // Helper function to get company colors
  const getCompanyColor = (index: number) => {
    const colors = [
      'from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 border-emerald-300 dark:border-emerald-600',
      'from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border-blue-300 dark:border-blue-600',
      'from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 border-purple-300 dark:border-purple-600',
      'from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 border-orange-300 dark:border-orange-600',
      'from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 border-red-300 dark:border-red-600',
      'from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/40 border-teal-300 dark:border-teal-600',
      'from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 border-indigo-300 dark:border-indigo-600'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-emerald-700">טוען נתוני שאטלים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Generate dynamic schedules from database instead of static data
  const generateScheduleFromDatabase = () => {
    if (!shuttleData || shuttleData.length === 0) {
      return { sabidorSchedule: { outbound: [], return: [] }, kiryatArieSchedule: { outbound: [], return: [] } };
    }

    const sabidorSchedule = { outbound: [], return: [] };
    const kiryatArieSchedule = { outbound: [], return: [] };

    shuttleData.forEach(({ shuttle, company, schedules }) => {
      schedules.forEach(schedule => {
        const item = {
          pickup: schedule.route_description,
          time: schedule.time_slot,
          shuttle: shuttle.shuttle_number,
          company: company?.name || 'Unknown',
          isBreak: schedule.is_break
        };

        // Determine which schedule and direction based on route description
        const routeDesc = schedule.route_description.toLowerCase();
        const isKiryatArie = routeDesc.includes('קרית אריה') || routeDesc.includes('קריה');
        const isReturn = routeDesc.includes('חזור') || routeDesc.includes('מצפריר');

        if (isKiryatArie) {
          if (isReturn) {
            kiryatArieSchedule.return.push(item);
          } else {
            kiryatArieSchedule.outbound.push(item);
          }
        } else {
          if (isReturn) {
            sabidorSchedule.return.push(item);
          } else {
            sabidorSchedule.outbound.push(item);
          }
        }
      });
    });

    // Sort by time
    const sortByTime = (a, b) => {
      const timeA = a.time.split(':').map(t => parseInt(t.split('-')[0]));
      const timeB = b.time.split(':').map(t => parseInt(t.split('-')[0]));
      return timeA[0] * 60 + (timeA[1] || 0) - timeB[0] * 60 - (timeB[1] || 0);
    };

    sabidorSchedule.outbound.sort(sortByTime);
    sabidorSchedule.return.sort(sortByTime);
    kiryatArieSchedule.outbound.sort(sortByTime);
    kiryatArieSchedule.return.sort(sortByTime);

    return { sabidorSchedule, kiryatArieSchedule };
  };

  const { sabidorSchedule, kiryatArieSchedule } = generateScheduleFromDatabase();

  // Get unique companies for the bottom section by direction
  const getUniqueCompaniesByDirection = (schedule: typeof sabidorSchedule, direction: 'outbound' | 'return') => {
    const companies = new Set<string>();
    schedule[direction].forEach(item => {
      if (item.company !== "הפסקה") {
        companies.add(item.company);
      }
    });
    return Array.from(companies).sort();
  };

  const sabidorOutboundCompanies = getUniqueCompaniesByDirection(sabidorSchedule, 'outbound');
  const sabidorReturnCompanies = getUniqueCompaniesByDirection(sabidorSchedule, 'return');
  const kiryatArieOutboundCompanies = getUniqueCompaniesByDirection(kiryatArieSchedule, 'outbound');
  const kiryatArieReturnCompanies = getUniqueCompaniesByDirection(kiryatArieSchedule, 'return');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        {/* Header with improved responsive logo */}
        <div className="text-center mb-8 mt-8 px-4">
          <div className="flex flex-col items-center">
            {/* Enhanced Logo */}
            <div className="mb-4 p-2 bg-white/80 dark:bg-black/20 rounded-full shadow-2xl border-4 border-primary/20">
              <img 
                src="/lovable-uploads/471a1e15-1e81-4018-a65e-2f62b4361f14.png" 
                alt="לוגו שירות שאטלים צפריר" 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain drop-shadow-lg" 
              />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4 leading-tight">
              שירות שאטלים צפריר
            </h1>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium px-4 mb-6">
            הזמנת נסיעות מהירה ונוחה
          </p>
          <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-primary/20 to-emerald-400/20 dark:from-primary/30 dark:to-emerald-500/30 rounded-2xl border-2 border-primary/40 dark:border-primary/50 shadow-lg max-w-2xl mx-auto">
            <p className="text-base sm:text-lg md:text-xl font-bold text-primary dark:text-primary-foreground animate-pulse">
              בחר בקו המתאים כדי להירשם לנסיעה ⬇️
            </p>
          </div>
        </div>

        {/* Enhanced Tabs with better visibility */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6" dir="rtl">
          <div className="mb-6">
            <TabsList className="w-full bg-emerald-100 dark:bg-emerald-900/30 p-2 sm:p-4 gap-2 sm:gap-4 rounded-xl shadow-lg border-2 border-emerald-300 dark:border-emerald-600 flex flex-col sm:grid sm:grid-cols-2 h-auto">
              <TabsTrigger 
                value="sabidor" 
                className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-base sm:text-lg lg:text-xl font-bold px-4 sm:px-6 py-4 sm:py-5 leading-relaxed rounded-xl transition-all shadow-md w-full h-auto min-h-[3rem] sm:min-h-[4rem] flex items-center justify-center border-2 border-emerald-400 dark:border-emerald-500"
              >
                סבידור תל אביב ──── צפריר
              </TabsTrigger>
              <TabsTrigger 
                value="kiryat-arie" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-base sm:text-lg lg:text-xl font-bold px-4 sm:px-6 py-4 sm:py-5 leading-relaxed rounded-xl transition-all shadow-md w-full h-auto min-h-[3rem] sm:min-h-[4rem] flex items-center justify-center border-2 border-emerald-400 dark:border-emerald-500"
              >
                קריית אריה ──── צפריר
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sabidor" className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 sm:p-8 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600 shadow-xl">
              <PickupLocations routeType="sabidor" />
              
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                           <span className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-3">
                             <img src="/lovable-uploads/471a1e15-1e81-4018-a65e-2f62b4361f14.png" alt="Shuttle Icon" className="w-10 h-10" />
                            שירות שאטלים סבידור ⟵ צפריר
                          </span>
                      </TooltipTrigger>
                      <TooltipContent className="w-96 p-4" side="bottom" align="center">
                        <div className="text-xs leading-relaxed whitespace-pre-line">
                          {getRouteHoverContent(1)}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h2>
              </div>

              {/* Enhanced Direction Toggle Buttons */}
              <div className="flex justify-center mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-2 border-2 border-emerald-300 dark:border-emerald-600 shadow-lg">
                  <Button
                    variant={activeDirection === 'outbound' ? 'default' : 'ghost'}
                    size="lg"
                    onClick={() => setActiveDirection('outbound')}
                    className={`${activeDirection === 'outbound' ? 'bg-emerald-700 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/30'} text-lg font-bold px-6 py-3`}
                  >
                    <ArrowLeft className="w-5 h-5 ml-2" />
                    הלוך
                  </Button>
                  <Button
                    variant={activeDirection === 'return' ? 'default' : 'ghost'}
                    size="lg"
                    onClick={() => setActiveDirection('return')}
                    className={`${activeDirection === 'return' ? 'bg-emerald-700 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/30'} text-lg font-bold px-6 py-3`}
                  >
                    <ArrowRight className="w-5 h-5 ml-2" />
                    חזור
                  </Button>
                </div>
              </div>

              {activeDirection === 'outbound' ? (
                <div className="space-y-6">
                  {/* Enhanced Departure from Sabidor */}
                  <Card className="border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-75 dark:bg-emerald-900/25 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-emerald-800 dark:text-emerald-200 text-center text-2xl font-bold">
                        יציאה מסבידור
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 justify-items-center">
                        {sabidorSchedule.outbound
                          .filter(item => item.pickup === "יציאה מסבידור")
                          .map((item, index) => (
                            <div key={`outbound-${item.time}-${index}`} className="flex flex-col items-center w-full">
                              <TimeSlot
                                time={item.time}
                                routeType="sabidor"
                                direction="outbound"
                                className="w-full max-w-[120px] mx-auto"
                              >
                                <div className="flex flex-col items-center gap-2 p-3">
                                  <span className="font-bold text-lg text-center">{item.time}</span>
                                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-600 text-center min-h-[24px] flex items-center justify-center">
                                    {item.company}
                                  </span>
                                </div>
                              </TimeSlot>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Sirkin Junction */}
                  <Card className="border-2 border-orange-400 dark:border-orange-500 bg-orange-75 dark:bg-orange-900/25 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-orange-800 dark:text-orange-200 text-center text-2xl font-bold">
                        עצירה בצומת סירקין
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-items-center border-2 border-orange-400 dark:border-orange-500 rounded-xl p-4 bg-orange-75 dark:bg-orange-900/25 shadow-xl">
                        <div className="col-span-3 sm:col-span-4 text-center mb-4">
                          <p className="text-orange-800 dark:text-orange-200 font-bold text-lg">
                            💡 עצירת ביניים - ניתן להירשם גם לעצירה זו
                          </p>
                        </div>
                        {sabidorSchedule.outbound
                          .filter(item => item.pickup === "צומת סירקין")
                          .map((item, index) => (
                            <div key={`sirkin-${item.time}-${index}`} className="flex flex-col items-center w-full">
                              <TimeSlot
                                time={item.time}
                                routeType="sabidor"
                                direction="outbound"
                                className="w-full max-w-[120px] mx-auto"
                              >
                                <div className="flex flex-col items-center gap-2 p-4 text-center bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-800 dark:text-orange-200 font-bold cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-all shadow-lg hover:shadow-xl">
                                  <span className="font-bold text-lg">{item.time}</span>
                                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-600 text-center min-h-[24px] flex items-center justify-center">
                                    {item.company}
                                  </span>
                                </div>
                              </TimeSlot>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Arrival at Tzafrir */}
                  <Card className="border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-150 dark:bg-emerald-900/30 shadow-xl">
                    <CardHeader className="pb-4">
                       <CardTitle className="text-emerald-800 dark:text-emerald-200 text-center text-2xl font-bold">
                         צפי הגעה לצפריר
                       </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 justify-items-center">
                        {sabidorSchedule.outbound
                          .filter(item => item.pickup === "הגעה לצפריר")
                          .map((item, index) => (
                            <div key={`tzafrir-${item.time}-${index}`} className="flex flex-col items-center w-full">
                              <div className="border-2 border-emerald-400 dark:border-emerald-500 p-4 text-center bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-800 dark:text-emerald-200 font-bold shadow-lg w-full max-w-[120px]">
                                <div className="flex flex-col items-center gap-2">
                                  <span className="font-bold text-lg">{item.time}</span>
                                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-600 text-center min-h-[24px] flex items-center justify-center">
                                    {item.company}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Enhanced Return Direction Cards */}
                  <Card className="border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-150 dark:bg-emerald-900/30 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-emerald-800 dark:text-emerald-200 text-center text-2xl font-bold">
                        יציאה מצפריר
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 justify-items-center">
                        {sabidorSchedule.return
                          .filter(item => item.pickup === "יציאה מצפריר")
                          .map((item, index) => (
                            <div key={`departure-${item.time}-${index}`} className="flex flex-col items-center w-full">
                              <TimeSlot
                                time={item.time}
                                routeType="sabidor"
                                direction="return"
                                className="w-full max-w-[120px] mx-auto"
                              >
                                <div className="flex flex-col items-center gap-2 p-3">
                                  <span className="font-bold text-lg text-center">{item.time}</span>
                                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-600 text-center min-h-[24px] flex items-center justify-center">
                                    {item.company}
                                  </span>
                                </div>
                              </TimeSlot>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-emerald-600 dark:border-emerald-300 bg-emerald-200 dark:bg-emerald-900/35 shadow-xl">
                    <CardHeader className="pb-4">
                       <CardTitle className="text-emerald-800 dark:text-emerald-200 text-center text-2xl font-bold">
                         צפי הגעה לסבידור
                       </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 justify-items-center">
                        {sabidorSchedule.return
                          .filter(item => item.pickup === "הגעה לסבידור")
                          .map((item, index) => (
                            <div key={`arrival-${item.time}-${index}`} className="flex flex-col items-center w-full">
                              <div className="border-2 border-emerald-400 dark:border-emerald-500 p-4 text-center bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-800 dark:text-emerald-200 font-bold shadow-lg w-full max-w-[120px]">
                                <div className="flex flex-col items-center gap-2">
                                  <span className="font-bold text-lg">{item.time}</span>
                                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-600 text-center min-h-[24px] flex items-center justify-center">
                                    {item.company}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="kiryat-arie" className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 sm:p-8 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600 shadow-xl">
              <PickupLocations routeType="kiryat-arie" />
              
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <span className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-3">
                            <img src="/lovable-uploads/471a1e15-1e81-4018-a65e-2f62b4361f14.png" alt="Shuttle Icon" className="w-10 h-10" />
                            שירות שאטלים קריית אריה ⟵ צפריר
                          </span>
                      </TooltipTrigger>
                      <TooltipContent className="w-96 p-4" side="bottom" align="center">
                        <div className="text-xs leading-relaxed whitespace-pre-line">
                          {getRouteHoverContent(3)}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h2>
              </div>

          {/* Enhanced Direction Toggle Buttons */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2 border-2 border-emerald-300 dark:border-emerald-600 shadow-lg">
              <Button
                variant={activeDirection === 'outbound' ? 'default' : 'ghost'}
                size="lg"
                onClick={() => setActiveDirection('outbound')}
                className={`${activeDirection === 'outbound' ? 'bg-emerald-700 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/30'} text-lg font-bold px-6 py-3`}
              >
                <ArrowLeft className="w-5 h-5 ml-2" />
                הלוך
              </Button>
              <Button
                variant={activeDirection === 'return' ? 'default' : 'ghost'}
                size="lg"
                onClick={() => setActiveDirection('return')}
                className={`${activeDirection === 'return' ? 'bg-emerald-700 text-white shadow-lg' : 'text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/30'} text-lg font-bold px-6 py-3`}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                חזור
              </Button>
            </div>
          </div>

              {activeDirection === 'outbound' ? (
                <div className="space-y-6">
                  <Card className="border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-150 dark:bg-emerald-900/30 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-emerald-800 dark:text-emerald-200 text-center text-2xl font-bold">
                        יציאה מקריית אריה
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 justify-items-center">
                        {kiryatArieSchedule.outbound
                          .filter(item => item.pickup === "יציאה מקרית אריה")
                          .map((item, index) => {
                            if (item.isBreak) {
                              return (
                                <div key={`ka-break-${item.time}-${index}`} className="col-span-4 sm:col-span-5 md:col-span-6 flex justify-center">
                                  <div className="bg-gradient-to-r from-orange-200 to-orange-300 dark:from-orange-800/50 dark:to-orange-900/50 px-4 py-3 rounded-xl border-2 border-orange-400 dark:border-orange-500 shadow-lg">
                                    <span className="font-bold text-orange-800 dark:text-orange-200 text-base">
                                      {item.time} הפסקה
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div key={`ka-outbound-${item.time}-${index}`} className="flex flex-col items-center w-full">
                                <TimeSlot
                                  time={item.time}
                                  routeType="kiryat-arie"
                                  direction="outbound"
                                  className="w-full max-w-[120px] mx-auto"
                                >
                                  <div className="flex flex-col items-center gap-2 p-3">
                                    <span className="font-bold text-base text-center">{item.time}</span>
                                    <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-full border border-blue-300 dark:border-blue-600 text-center min-h-[24px] flex items-center justify-center">
                                      {item.company}
                                    </span>
                                  </div>
                                </TimeSlot>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card className="border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-150 dark:bg-emerald-900/30 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-emerald-800 dark:text-emerald-200 text-center text-2xl font-bold">
                        יציאה מצפריר
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="time-slot-grid justify-items-center px-2">
                        {kiryatArieSchedule.return
                          .filter(item => item.pickup === "יציאה מצפריר")
                          .map((item, index) => (
                            <div key={`ka-return-${item.time}-${index}`} className="flex flex-col items-center w-full">
                              <TimeSlot
                                time={item.time}
                                routeType="kiryat-arie"
                                direction="return"
                                className="w-full"
                              >
                                <div className="flex flex-col items-center gap-2 p-2 sm:p-3">
                                  <span className="font-bold text-responsive-sm text-center">{item.time}</span>
                                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-full border border-blue-300 dark:border-blue-600 text-center min-h-[24px] flex items-center justify-center">
                                    {item.company}
                                  </span>
                                </div>
                              </TimeSlot>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Company Information Section - Mobile Optimized with Dynamic Companies by Direction */}
        <div className="mt-8 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md border-2 border-emerald-300 dark:border-emerald-600 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2 sm:gap-3">
              <img src="/lovable-uploads/471a1e15-1e81-4018-a65e-2f62b4361f14.png" alt="Company Icon" className="w-8 h-8 sm:w-10 sm:h-10" />
              החברות המפעילות נסיעות בקו זה
            </h2>
          </div>
          
          {/* Direction-based Company Display */}
          <Tabs value={activeDirection} onValueChange={(value) => setActiveDirection(value as 'outbound' | 'return')} className="w-full" dir="rtl">
            <TabsList className="w-full bg-emerald-100 dark:bg-emerald-900/30 p-2 gap-2 rounded-xl shadow-lg border-2 border-emerald-300 dark:border-emerald-600 grid grid-cols-2">
              <TabsTrigger 
                value="outbound" 
                className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-sm sm:text-base font-bold px-3 py-2 rounded-lg transition-all"
              >
                הלוך - {activeTab === 'sabidor' ? 'לצפריר' : 'לצפריר'}
              </TabsTrigger>
              <TabsTrigger 
                value="return" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-sm sm:text-base font-bold px-3 py-2 rounded-lg transition-all"
              >
                חזור - {activeTab === 'sabidor' ? 'לסבידור' : 'לקריית אריה'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="outbound" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(activeTab === 'sabidor' ? sabidorOutboundCompanies : kiryatArieOutboundCompanies).map((company, index) => {
                  // Filter companies by time slots for this route and direction
                  const companiesWithTimes = new Set<string>();
                  const schedule = activeTab === 'sabidor' ? sabidorSchedule : kiryatArieSchedule;
                  schedule.outbound.forEach(item => {
                    if (item.company !== "הפסקה") {
                      companiesWithTimes.add(item.company);
                    }
                  });
                  
                  return (
                    <div key={company} className={`bg-gradient-to-br ${getCompanyColor(index)} p-4 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                      <div className="text-center">
                        <div className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200 mb-2">{company}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          השעות: {schedule.outbound
                            .filter(item => item.company === company && item.pickup.includes("יציאה"))
                            .map(item => item.time)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="return" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(activeTab === 'sabidor' ? sabidorReturnCompanies : kiryatArieReturnCompanies).map((company, index) => {
                  // Filter companies by time slots for this route and direction
                  const schedule = activeTab === 'sabidor' ? sabidorSchedule : kiryatArieSchedule;
                  
                  return (
                    <div key={company} className={`bg-gradient-to-br ${getCompanyColor(index)} p-4 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                      <div className="text-center">
                        <div className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200 mb-2">{company}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          השעות: {schedule.return
                            .filter(item => item.company === company && item.pickup.includes("יציאה"))
                            .map(item => item.time)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}