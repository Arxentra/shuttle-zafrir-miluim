import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeSlot } from './TimeSlot';
import { dataService, type OrganizedSchedules, type ScheduleEntry } from '@/services/dataService';
import { ArrowRight, Clock, Users, Bus, Building2 } from 'lucide-react';

export function ScheduleDisplay() {
  const [schedules, setSchedules] = useState<OrganizedSchedules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchSchedules = async (date?: string) => {
    try {
      setLoading(true);
      const data = await dataService.schedules.getOrganizedForDisplay(date);
      setSchedules(data);
    } catch (err) {
      setError('שגיאה בטעינת לוחות הזמנים');
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const renderScheduleSection = (
    title: string,
    entries: ScheduleEntry[],
    routeType: 'sabidor' | 'kiryat-arie',
    direction: 'outbound' | 'return',
    description: string
  ) => {
    if (entries.length === 0) {
      return (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-right flex items-center justify-end gap-2">
              <Bus className="w-5 h-5" />
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-right">{description}</p>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">אין נסיעות זמינות</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-end gap-2">
            <Bus className="w-5 h-5" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-right">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {entries.map((entry, index) => (
              <TimeSlot
                key={`${entry.time}-${index}`}
                time={entry.time}
                routeType={routeType}
                direction={direction}
                className="bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="text-lg font-bold">{entry.time}</div>
                  {entry.registeredCount > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <Users className="w-3 h-3" />
                      {entry.registeredCount}
                    </Badge>
                  )}
                  <div className="text-xs text-muted-foreground text-center">
                    {entry.shuttleName}
                  </div>
                </div>
              </TimeSlot>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchSchedules(selectedDate)} variant="outline">
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!schedules) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>לא נמצאו לוחות זמנים</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Date Selector */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-right">לוח זמנים - שאטלים לצפריר</h1>
        <div className="flex items-center justify-center gap-4 mb-6">
          <label htmlFor="date-select" className="text-sm font-medium">תאריך:</label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-3 py-2 border rounded-md bg-background"
          />
          <Button 
            onClick={() => fetchSchedules(selectedDate)} 
            variant="outline" 
            size="sm"
          >
            רענן
          </Button>
        </div>
      </div>

      <Tabs defaultValue="savidor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="savidor" className="text-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              סבידור מרכז ↔ צפריר
            </div>
          </TabsTrigger>
          <TabsTrigger value="kiryat" className="text-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              קרית אריה ↔ צפריר
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="savidor">
          <div className="space-y-6">
            {renderScheduleSection(
              'יציאה מסבידור לצפריר',
              schedules.savidor_to_tzafrir.outbound,
              'sabidor',
              'outbound',
              'נסיעות מסבידור מרכז לאתר צפריר'
            )}
            
            {renderScheduleSection(
              'יציאה מצפריר לסבידור',
              schedules.savidor_to_tzafrir.return,
              'sabidor',
              'return',
              'נסיעות חזרה מאתר צפריר לסבידור מרכז'
            )}
          </div>
        </TabsContent>

        <TabsContent value="kiryat">
          <div className="space-y-6">
            {renderScheduleSection(
              'יציאה מקרית אריה לצפריר',
              schedules.kiryat_aryeh_to_tzafrir.outbound,
              'kiryat-arie',
              'outbound',
              'נסיעות מקרית אריה לאתר צפריר'
            )}
            
            {renderScheduleSection(
              'יציאה מצפריר לקרית אריה',
              schedules.kiryat_aryeh_to_tzafrir.return,
              'kiryat-arie',
              'return',
              'נסיעות חזרה מאתר צפריר לקרית אריה'
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">סבידור מרכז ↔ צפריר</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{schedules.savidor_to_tzafrir.outbound.length}</span>
                <span>יציאות מסבידור:</span>
              </div>
              <div className="flex justify-between">
                <span>{schedules.savidor_to_tzafrir.return.length}</span>
                <span>יציאות מצפריר:</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">קרית אריה ↔ צפריר</CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{schedules.kiryat_aryeh_to_tzafrir.outbound.length}</span>
                <span>יציאות מקרית אריה:</span>
              </div>
              <div className="flex justify-between">
                <span>{schedules.kiryat_aryeh_to_tzafrir.return.length}</span>
                <span>יציאות מצפריר:</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}