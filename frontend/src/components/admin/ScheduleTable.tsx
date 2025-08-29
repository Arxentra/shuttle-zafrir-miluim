import { useState } from 'react';
import { dataService } from '@/services/dataService';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, GripVertical, Edit, Check, X, Clock } from 'lucide-react';
import { updateCompanyNameInSchedules } from './CompanyScheduleManager';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  shuttle_number: number;
  is_active: boolean;
}

interface ShuttleSchedule {
  id: string;
  shuttle_id: string;
  time_slot: string;
  route_description: string;
  is_break: boolean;
  sort_order: number;
}

interface ScheduleTableProps {
  schedules: ShuttleSchedule[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: string, value: any) => void;
  company?: Company;
  onCompanyUpdate?: () => void;
  shuttleNumber?: number;
}

export function ScheduleTable({ schedules, onDelete, onUpdate, company, onCompanyUpdate, shuttleNumber }: ScheduleTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const startEdit = (schedule: ShuttleSchedule, field: string) => {
    setEditingCell({ id: schedule.id, field });
    if (field === 'time_slot') {
      setEditValue(schedule.time_slot);
    } else if (field === 'route_description') {
      setEditValue(schedule.route_description);
    } else if (field === 'company_name') {
      setEditValue(company?.name || '');
    }
    setOpenTooltip(null); // סגירת הטולטיפ בעת תחילת עריכה
  };

  const saveEdit = async () => {
    if (editingCell) {
      if (editingCell.field === 'company_name') {
        // עדכון שם החברה
        if (company?.id) {
          await updateCompanyNameInSchedules(company.id, editValue, onCompanyUpdate || (() => {}));
          // Trigger global refresh after company update
          window.dispatchEvent(new CustomEvent('admin-data-updated', { 
            detail: { type: 'company_update', companyId: company.id, newName: editValue } 
          }));
        }
      } else {
        onUpdate(editingCell.id, editingCell.field, editValue);
        // Trigger global refresh after schedule update
        window.dispatchEvent(new CustomEvent('admin-data-updated', { 
          detail: { type: 'schedule_update', scheduleId: editingCell.id, field: editingCell.field, value: editValue } 
        }));
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const isEditing = (scheduleId: string, field: string) => {
    return editingCell?.id === scheduleId && editingCell?.field === field;
  };

  const getTimeCategory = (timeSlot: string | null, departureTime?: string) => {
    // Use departure_time if time_slot is null or empty
    const timeToUse = timeSlot || departureTime;
    if (!timeToUse) return 'בוקר'; // Default category for null times
    
    const time = timeToUse.split('-')[0] || timeToUse.split(':')[0];
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 6 && hour < 15) return 'בוקר';
    if (hour >= 15 && hour < 20) return 'אחר הצהריים';
    return 'ערב';
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'בוקר':
        return {
          bg: 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
          border: 'border-amber-300 dark:border-amber-600',
          text: 'text-amber-800 dark:text-amber-200',
          icon: 'text-amber-600 dark:text-amber-400'
        };
      case 'אחר הצהריים':
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
          border: 'border-blue-300 dark:border-blue-600',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-600 dark:text-blue-400'
        };
      case 'ערב':
        return {
          bg: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
          border: 'border-purple-300 dark:border-purple-600',
          text: 'text-purple-800 dark:text-purple-200',
          icon: 'text-purple-600 dark:text-purple-400'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          border: 'border-gray-300 dark:border-gray-600',
          text: 'text-gray-800 dark:text-gray-200',
          icon: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const groupSchedulesByTime = (schedules: ShuttleSchedule[]) => {
    const groups = {
      'בוקר': [] as ShuttleSchedule[],
      'אחר הצהריים': [] as ShuttleSchedule[],
      'ערב': [] as ShuttleSchedule[]
    };
    
    schedules.forEach(schedule => {
      const category = getTimeCategory(schedule.time_slot, schedule.departure_time);
      groups[category].push(schedule);
    });
    
    return groups;
  };

  const groupedSchedules = groupSchedulesByTime(schedules);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-6" dir="rtl">
        {Object.entries(groupedSchedules).map(([timeCategory, categorySchedules]) => {
          if (categorySchedules.length === 0) return null;
          
          const styles = getCategoryStyles(timeCategory);
          
          return (
            <div key={timeCategory} className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${styles.bg} ${styles.border} mb-6`}>
                <Clock className={`w-6 h-6 ${styles.icon}`} />
                <h4 className={`font-bold text-xl ${styles.text}`}>{timeCategory}</h4>
                <div className={`flex-1 h-1 rounded-full ${styles.bg.replace('to-', 'from-').replace('from-', 'to-')}`}></div>
              </div>
              
              <div className={`border-2 rounded-xl overflow-hidden shadow-lg ${styles.border} ${styles.bg}`}>
                <Table>
                  <TableHeader>
                    <TableRow className={`${styles.bg} border-b-2 ${styles.border}`}>
                      <TableHead className="w-12 text-right"></TableHead>
                      <TableHead className={`text-right font-semibold ${styles.text}`}>שעה</TableHead>
                      <TableHead className={`text-right font-semibold ${styles.text}`}>תיאור המסלול</TableHead>
                      <TableHead className={`text-right font-semibold ${styles.text}`}>שם החברה</TableHead>
                      <TableHead className={`text-right font-semibold ${styles.text}`}>מספר שאטל</TableHead>
                      <TableHead className={`w-24 text-right font-semibold ${styles.text}`}>הפסקה</TableHead>
                      <TableHead className={`w-24 text-right font-semibold ${styles.text}`}>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorySchedules.map((schedule) => (
                      <SortableScheduleRow
                        key={schedule.id}
                        schedule={schedule}
                        isEditing={isEditing}
                        editingCell={editingCell}
                        editValue={editValue}
                        startEdit={startEdit}
                        saveEdit={saveEdit}
                        cancelEdit={cancelEdit}
                        setEditValue={setEditValue}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                        company={company}
                        onCompanyUpdate={onCompanyUpdate}
                        shuttleNumber={shuttleNumber}
                        openTooltip={openTooltip}
                        setOpenTooltip={setOpenTooltip}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

interface SortableScheduleRowProps {
  schedule: ShuttleSchedule;
  isEditing: (scheduleId: string, field: string) => boolean;
  editingCell: { id: string; field: string } | null;
  editValue: string;
  startEdit: (schedule: ShuttleSchedule, field: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  setEditValue: (value: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: string, value: any) => void;
  company?: Company;
  onCompanyUpdate?: () => void;
  shuttleNumber?: number;
  openTooltip: string | null;
  setOpenTooltip: (id: string | null) => void;
}

function SortableScheduleRow({
  schedule,
  isEditing,
  editingCell,
  editValue,
  startEdit,
  saveEdit,
  cancelEdit,
  setEditValue,
  onDelete,
  onUpdate,
  company,
  onCompanyUpdate,
  shuttleNumber,
  openTooltip,
  setOpenTooltip
}: SortableScheduleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: schedule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging ? 'bg-muted/50' : ''}
        ${schedule.is_break ? 'bg-orange-50 dark:bg-orange-950/20' : ''}
      `}
    >
      <TableCell {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
      </TableCell>
                      
      <TableCell>
        {isEditing(schedule.id, 'time_slot') ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <Button size="sm" variant="ghost" onClick={saveEdit}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Tooltip 
            delayDuration={50}
            open={openTooltip === `${schedule.id}-time`}
            onOpenChange={(open) => {
              if (open) {
                setOpenTooltip(`${schedule.id}-time`);
              } else {
                setOpenTooltip(null);
              }
            }}
          >
            <TooltipTrigger asChild>
              <div 
                className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors text-right"
                onClick={() => {
                  setOpenTooltip(null);
                  startEdit(schedule, 'time_slot');
                }}
                onMouseEnter={() => setOpenTooltip(`${schedule.id}-time`)}
                onMouseLeave={() => setOpenTooltip(null)}
              >
                {schedule.time_slot || 'לחץ לעריכה'}
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-64 p-3" side="top" align="start">
              <div className="space-y-1">
                <div className="font-semibold text-sm">חברה מפעילה</div>
                <div className="text-sm font-medium text-primary">
                  {company?.name || 'לא צוינה חברה'}
                </div>
                <div className="text-xs mt-2 opacity-75">
                  לחץ לעריכת השעה
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>
                      
      <TableCell>
        {isEditing(schedule.id, 'route_description') ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-[40px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <div className="flex flex-col space-y-1">
              <Button size="sm" variant="ghost" onClick={saveEdit}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="cursor-pointer hover:bg-muted/50 p-2 rounded min-h-[40px] transition-colors text-right"
            onClick={() => startEdit(schedule, 'route_description')}
          >
            {schedule.route_description || 'לחץ לעריכה'}
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {isEditing(schedule.id, 'company_name') ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <Button size="sm" variant="ghost" onClick={saveEdit}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div 
              className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors text-right font-medium text-primary flex-1"
              onClick={() => startEdit(schedule, 'company_name')}
            >
              {company?.name || 'לחץ לעריכה'}
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={async () => {
                if (company?.id && onCompanyUpdate) {
                  await onCompanyUpdate();
                  toast.success('שם החברה עודכן בכל הטאב');
                }
              }}
              title="עדכן את כל שמות החברה בטאב"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </div>
        )}
      </TableCell>
      
      <TableCell className="text-center font-medium">
        {shuttleNumber || company?.shuttle_number || '-'}
      </TableCell>
                      
      <TableCell>
        <Switch
          checked={schedule.is_break}
          onCheckedChange={(checked) => onUpdate(schedule.id, 'is_break', checked)}
        />
      </TableCell>
                      
      <TableCell>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(schedule.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}