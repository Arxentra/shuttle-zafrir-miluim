import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '@/services/dataService';

interface Shuttle {
  id: string;
  company_id: string;
  name: string;
  shuttle_number: number;
  is_active: boolean;
  company?: {
    id: string;
    name: string;
    shuttle_number: number;
    is_active: boolean;
  };
}

interface ShuttleSchedule {
  id: string;
  shuttle_id: string;
  time_slot: string;
  route_description: string;
  is_break: boolean;
  sort_order: number;
}

interface ShuttleExportActionsProps {
  shuttles: Shuttle[];
  schedules: ShuttleSchedule[];
  onAddShuttle: () => void;
  onRemoveShuttle: (shuttleId: string) => void;
  currentShuttleId?: string;
}

export function ShuttleExportActions({ 
  shuttles, 
  schedules, 
  onAddShuttle, 
  onRemoveShuttle, 
  currentShuttleId 
}: ShuttleExportActionsProps) {

  const generateAllSchedulesCSV = (): string => {
    let csvContent = '';
    const BOM = '\uFEFF'; // UTF-8 BOM for Hebrew support
    
    csvContent = 'שאטל,מספר שאטל,חברה,שעה,תיאור מסלול,סוג,סדר\n';
    
    schedules.forEach(schedule => {
      const shuttle = shuttles.find(s => s.id === schedule.shuttle_id);
      csvContent += `"${shuttle?.name || 'לא ידוע'}",${shuttle?.shuttle_number || 0},"${shuttle?.company?.name || 'לא ידוע'}","${schedule.time_slot}","${schedule.route_description}","${schedule.is_break ? 'הפסקה/מנוחה' : 'נסיעה'}",${schedule.sort_order}\n`;
    });
    
    return BOM + csvContent;
  };

  const generateWhatsAppMessage = (): string => {
    let message = `🚌 *לוחות זמנים - כל השאטלים* 📅\n\n`;
    
    // Group schedules by shuttle
    const schedulesByShuttle = schedules.reduce((acc, schedule) => {
      const shuttle = shuttles.find(s => s.id === schedule.shuttle_id);
      const shuttleKey = `שאטל ${shuttle?.shuttle_number || 'לא ידוע'} - ${shuttle?.company?.name || 'לא ידוע'}`;
      if (!acc[shuttleKey]) acc[shuttleKey] = [];
      acc[shuttleKey].push(schedule);
      return acc;
    }, {} as Record<string, ShuttleSchedule[]>);
    
    Object.entries(schedulesByShuttle).forEach(([shuttleName, shuttleSchedules]) => {
      message += `🚌 *${shuttleName}*\n`;
      shuttleSchedules
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, 8) // Limit to first 8 schedules per shuttle
        .forEach(schedule => {
          const icon = schedule.is_break ? '☕' : '🚌';
          message += `${icon} ${schedule.time_slot} - ${schedule.route_description}\n`;
        });
      if (shuttleSchedules.length > 8) {
        message += `   ... ועוד ${shuttleSchedules.length - 8} זמנים\n`;
      }
      message += '\n';
    });
    
    message += `📅 *נוצר ב:* ${new Date().toLocaleDateString('he-IL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}\n`;
    message += `🏢 *מערכת ניהול צפריר* 🚌`;
    
    return message;
  };

  const downloadAllSchedulesCSV = () => {
    try {
      const csvContent = generateAllSchedulesCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `כל_לוחות_הזמנים_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('קובץ CSV של כל לוחות הזמנים הורד בהצלחה');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('שגיאה בהורדת הקובץ');
    }
  };

  const shareAllSchedulesWhatsApp = () => {
    try {
      const whatsAppText = generateWhatsAppMessage();
      
      // Encode for WhatsApp URL
      const encodedText = encodeURIComponent(whatsAppText);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      toast.success('נפתח בווטסאפ - כל לוחות הזמנים');
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error('שגיאה בשיתוף לווטסאפ');
    }
  };

  const handleRemoveShuttle = async () => {
    if (!currentShuttleId) {
      toast.error('אין שאטל נבחר למחיקה');
      return;
    }

    try {
      // First delete all schedules for this shuttle
      const shuttleSchedules = await dataService.schedules.getByShuttle(currentShuttleId);
      for (const schedule of shuttleSchedules) {
        await dataService.schedules.delete(schedule.id);
      }

      // Then delete the shuttle
      await dataService.shuttles.delete(currentShuttleId);

      toast.success('השאטל נמחק בהצלחה');
      onRemoveShuttle(currentShuttleId);
    } catch (error) {
      console.error('Error removing shuttle:', error);
      toast.error('שגיאה במחיקת השאטל');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-6" dir="rtl">
      {/* Export Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={downloadAllSchedulesCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>הורד CSV כללי ({schedules.length} שורות)</span>
        </Button>
        
        <Button
          onClick={shareAllSchedulesWhatsApp}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          <Share className="w-4 h-4" />
          <span>שתף בווטסאפ</span>
        </Button>
      </div>

      {/* Shuttle Management Actions */}
      <div className="flex flex-col sm:flex-row gap-2 border-r-2 border-gray-200 pr-2">
        <Button
          onClick={onAddShuttle}
          variant="default"
          size="sm"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>הוסף שאטל</span>
        </Button>
        
        {currentShuttleId && (
          <Button
            onClick={handleRemoveShuttle}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>הסר שאטל נבחר</span>
          </Button>
        )}
      </div>
    </div>
  );
}