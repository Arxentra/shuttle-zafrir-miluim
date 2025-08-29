import { useState } from 'react';
import { dataService } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ScheduleTable } from './ScheduleTable';
import { ExportActions } from './ExportActions';
import { ShuttleExportActions } from './ShuttleExportActions';
import { Plus, Bus, Info } from 'lucide-react';
import { toast } from 'sonner';

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

interface ShuttleManagerProps {
  shuttles: Shuttle[];
  companies: Company[];
  schedules: ShuttleSchedule[];
  onUpdate: () => void;
}

export function ShuttleManager({ shuttles, companies, schedules, onUpdate }: ShuttleManagerProps) {
  const [activeShuttleId, setActiveShuttleId] = useState<string>(shuttles[0]?.id || '');

  const getSchedulesForShuttle = (shuttleId: string) => {
    return schedules
      .filter(schedule => schedule.shuttle_id === shuttleId)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const addNewScheduleRow = async (shuttleId: string) => {
    try {
      const existingSchedules = getSchedulesForShuttle(shuttleId);
      const maxSortOrder = Math.max(0, ...existingSchedules.map(s => s.sort_order));

      await dataService.schedules.create({
        shuttle_id: shuttleId,
        time_slot: '',
        route_description: '',
        route_type: 'regular',
        direction: 'outbound',
        departure_time: '',
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        is_break: false,
        is_active: true,
        sort_order: maxSortOrder + 1
      });

      toast.success('נוספה שורה חדשה');
      onUpdate();
    } catch (error) {
      toast.error('שגיאה בהוספת שורה');
      console.error(error);
    }
  };

  const deleteScheduleRow = async (scheduleId: string) => {
    try {
      await dataService.schedules.delete(scheduleId);

      toast.success('השורה נמחקה');
      onUpdate();
    } catch (error) {
      toast.error('שגיאה במחיקת השורה');
      console.error(error);
    }
  };

  const updateSchedule = async (scheduleId: string, field: string, value: any) => {
    try {
      await dataService.schedules.update(scheduleId, { [field]: value });

      onUpdate();
    } catch (error) {
      toast.error('שגיאה בעדכון הנתונים');
      console.error(error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over || !activeShuttleId || active.id === over.id) return;

    const shuttleSchedules = getSchedulesForShuttle(activeShuttleId);
    const oldIndex = shuttleSchedules.findIndex(item => item.id === active.id);
    const newIndex = shuttleSchedules.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedSchedules = arrayMove(shuttleSchedules, oldIndex, newIndex);

    // Update sort_order for all affected items
    try {
      const updates = reorderedSchedules.map((schedule, index) => ({
        id: schedule.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await dataService.schedules.update(update.id, { sort_order: update.sort_order });
      }

      toast.success('סדר השורות עודכן');
      onUpdate();
    } catch (error) {
      toast.error('שגיאה בעדכון הסדר');
      console.error(error);
    }
  };

  if (shuttles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Bus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">אין שאטלים רשומים במערכת</p>
        </CardContent>
      </Card>
    );
  }

  const getRouteHoverContent = (shuttle: Shuttle) => {
    const shuttleNumber = shuttle.shuttle_number;
    
    if ([1, 2, 5, 6].includes(shuttleNumber)) {
      return {
        title: "מסבידור לסירקין",
        description: "הנסיעה מתחנת רכבת סבידור מרכז בתל אביב אל כפר סירקין היא בערך 18–22 ק\"מ, תלוי במסלול שתבחר (כביש 4, כביש 471 או דרך אם המושבות).",
        timing: "⏱️ זמני נסיעה משוערים ברכב:\n• בלי עומסים – בערך 25–30 דקות\n• בשעות העומס (בוקר או אחה\"צ) – זה יכול לקחת 40–55 דקות, ולעיתים אפילו יותר אם יש פקקים ביציאה מתל אביב, בצומת גהה או בצומת סירקין."
      };
    } else {
      return {
        title: "מקרית אריה לסירקין", 
        description: "בנסיעה רגילה בין תחנת רכבת קריית אריה לבין כפר סירקין המרחק הוא בערך 6–8 ק\"מ (תלוי באיזה חלק של כפר סירקין).",
        timing: "⏱️ זמן נסיעה ברכב:\n• בלי עומסים – בערך 10–15 דקות\n• בשעות עומס (בוקר או אחר הצהריים) – זה יכול לעלות ל־20–30 דקות, לפעמים אפילו יותר אם יש פקקים בצומת סירקין או על כביש ז'בוטינסקי."
      };
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>ניהול שאטלים ולוחות זמנים</CardTitle>
            
            {/* Enhanced Export and Management Actions */}
            <ShuttleExportActions
              shuttles={shuttles}
              schedules={schedules}
              onAddShuttle={() => {
                // This will trigger parent to show add shuttle form
                console.log('Add shuttle clicked');
                toast.info('לחץ על טאב "ניהול שאטלים + CSV" כדי להוסיף שאטל');
              }}
              onRemoveShuttle={() => onUpdate()}
              currentShuttleId={activeShuttleId}
            />
          </CardHeader>
          <CardContent>
            <Tabs value={activeShuttleId} onValueChange={setActiveShuttleId}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 gap-1" style={{ direction: 'rtl' }}>
                {shuttles
                  .sort((a, b) => a.shuttle_number - b.shuttle_number)
                  .map((shuttle) => (
                    <Tooltip key={shuttle.id} delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TabsTrigger 
                          value={shuttle.id}
                          className="text-xs relative cursor-pointer"
                        >
                          שאטל {shuttle.shuttle_number}
                          <Info className="w-3 h-3 mr-1 opacity-50" />
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 p-4" side="bottom" align="center">
                        <div className="space-y-2">
                          <div className="font-semibold text-sm">{getRouteHoverContent(shuttle).title}</div>
                          <p className="text-xs leading-relaxed">
                            {getRouteHoverContent(shuttle).description}
                          </p>
                          <div className="text-xs whitespace-pre-line">
                            {getRouteHoverContent(shuttle).timing}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </TabsList>

          {shuttles.map((shuttle) => (
            <TabsContent key={shuttle.id} value={shuttle.id} className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{shuttle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {shuttle.company?.name} - שאטל מספר {shuttle.shuttle_number}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <ExportActions 
                    data={{ 
                      schedules: getSchedulesForShuttle(shuttle.id),
                      currentShuttle: shuttle 
                    }}
                    type="shuttle-specific"
                    title={`לוח_זמנים_שאטל_${shuttle.shuttle_number}`}
                  />
                  <Button onClick={() => addNewScheduleRow(shuttle.id)}>
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף שורה
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={getSchedulesForShuttle(shuttle.id).map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
            <ScheduleTable
              schedules={getSchedulesForShuttle(shuttle.id)}
              onDelete={deleteScheduleRow}
              onUpdate={updateSchedule}
              company={shuttle.company}
              onCompanyUpdate={onUpdate}
              shuttleNumber={shuttle.shuttle_number}
            />
                </SortableContext>
              </DndContext>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}