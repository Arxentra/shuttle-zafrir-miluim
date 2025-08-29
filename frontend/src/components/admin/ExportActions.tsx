import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
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
  csv_status?: string;
  csv_uploaded_at?: string;
}

interface ShuttleSchedule {
  id: string;
  shuttle_id: string;
  time_slot: string;
  route_description: string;
  is_break: boolean;
  sort_order: number;
}

interface ExportActionsProps {
  data: {
    companies?: Company[];
    shuttles?: Shuttle[];
    schedules?: ShuttleSchedule[];
    currentShuttle?: Shuttle;
  };
  type: 'companies' | 'shuttles' | 'schedules' | 'shuttle-specific';
  title: string;
}

export function ExportActions({ data, type, title }: ExportActionsProps) {
  
  const generateCSVContent = (): string => {
    let csvContent = '';
    const BOM = '\uFEFF'; // UTF-8 BOM for Hebrew support
    
    switch (type) {
      case 'companies':
        csvContent = 'שם חברה,מספר שאטל,סטטוס\n';
        if (data.companies) {
          data.companies.forEach(company => {
            csvContent += `"${company.name}",${company.shuttle_number},"${company.is_active ? 'פעיל' : 'לא פעיל'}"\n`;
          });
        }
        break;
        
      case 'shuttles':
        csvContent = 'שם שאטל,מספר שאטל,חברה,סטטוס,סטטוס CSV,תאריך העלאה\n';
        if (data.shuttles) {
          data.shuttles.forEach(shuttle => {
            const csvStatus = shuttle.csv_status === 'success' ? 'הועלה בהצלחה' : 
                             shuttle.csv_status === 'error' ? 'שגיאה' : 
                             shuttle.csv_status === 'processing' ? 'בעיבוד' : 'לא הועלה';
            const uploadDate = shuttle.csv_uploaded_at ? new Date(shuttle.csv_uploaded_at).toLocaleDateString('he-IL') : 'לא הועלה';
            csvContent += `"${shuttle.name}",${shuttle.shuttle_number},"${shuttle.company?.name || 'לא נמצא'}","${shuttle.is_active ? 'פעיל' : 'לא פעיל'}","${csvStatus}","${uploadDate}"\n`;
          });
        }
        break;
        
      case 'schedules':
        csvContent = 'שאטל,שעה,תיאור מסלול,סוג,סדר\n';
        if (data.schedules && data.shuttles) {
          data.schedules.forEach(schedule => {
            const shuttle = data.shuttles?.find(s => s.id === schedule.shuttle_id);
            csvContent += `"שאטל ${shuttle?.shuttle_number || 'לא ידוע'}","${schedule.time_slot}","${schedule.route_description}","${schedule.is_break ? 'הפסקה/מנוחה' : 'נסיעה'}",${schedule.sort_order}\n`;
          });
        }
        break;
        
      case 'shuttle-specific':
        csvContent = 'שעה,תיאור מסלול,סוג,סדר\n';
        if (data.schedules && data.currentShuttle) {
          const shuttleSchedules = data.schedules.filter(s => s.shuttle_id === data.currentShuttle?.id);
          shuttleSchedules
            .sort((a, b) => a.sort_order - b.sort_order)
            .forEach(schedule => {
              csvContent += `"${schedule.time_slot}","${schedule.route_description}","${schedule.is_break ? 'הפסקה/מנוחה' : 'נסיעה'}",${schedule.sort_order}\n`;
            });
        }
        break;
    }
    
    return BOM + csvContent;
  };

  const downloadCSV = () => {
    try {
      const csvContent = generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${title}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('קובץ CSV הורד בהצלחה');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('שגיאה בהורדת הקובץ');
    }
  };

  const generateWhatsAppMessage = (): string => {
    let message = '';
    
    switch (type) {
      case 'companies':
        message = `🏢 *רשימת חברות השאטלים* 🚌\n\n`;
        if (data.companies) {
          data.companies.forEach((company, index) => {
            message += `${index + 1}. *${company.name}*\n`;
            message += `   🔸 שאטל מספר: ${company.shuttle_number}\n`;
            message += `   🔸 סטטוס: ${company.is_active ? '✅ פעיל' : '❌ לא פעיל'}\n\n`;
          });
        }
        break;
        
      case 'shuttles':
        message = `🚌 *רשימת השאטלים* 🏢\n\n`;
        if (data.shuttles) {
          data.shuttles.forEach((shuttle, index) => {
            message += `${index + 1}. *${shuttle.name}* (שאטל ${shuttle.shuttle_number})\n`;
            message += `   🏢 חברה: ${shuttle.company?.name || 'לא נמצא'}\n`;
            message += `   📊 סטטוס: ${shuttle.is_active ? '✅ פעיל' : '❌ לא פעיל'}\n`;
            const csvStatus = shuttle.csv_status === 'success' ? '✅ הועלה בהצלחה' : 
                             shuttle.csv_status === 'error' ? '❌ שגיאה' : 
                             shuttle.csv_status === 'processing' ? '🔄 בעיבוד' : '⏳ לא הועלה';
            message += `   📄 קובץ CSV: ${csvStatus}\n\n`;
          });
        }
        break;
        
      case 'schedules':
        message = `🕒 *לוחות זמנים כלליים* 📅\n\n`;
        if (data.schedules && data.shuttles) {
          // Group by shuttle
          const schedulesByShuttle = data.schedules.reduce((acc, schedule) => {
            const shuttle = data.shuttles?.find(s => s.id === schedule.shuttle_id);
            const shuttleKey = `שאטל ${shuttle?.shuttle_number || 'לא ידוע'}`;
            if (!acc[shuttleKey]) acc[shuttleKey] = [];
            acc[shuttleKey].push(schedule);
            return acc;
          }, {} as Record<string, typeof data.schedules>);
          
          Object.entries(schedulesByShuttle).forEach(([shuttleName, schedules]) => {
            message += `🚌 *${shuttleName}*\n`;
            schedules
              .sort((a, b) => a.sort_order - b.sort_order)
              .slice(0, 8) // Limit to first 8 schedules per shuttle
              .forEach(schedule => {
                const icon = schedule.is_break ? '☕' : '🚌';
                message += `${icon} ${schedule.time_slot} - ${schedule.route_description}\n`;
              });
            if (schedules.length > 8) {
              message += `   ... ועוד ${schedules.length - 8} זמנים\n`;
            }
            message += '\n';
          });
        }
        break;
        
      case 'shuttle-specific':
        message = `🚌 *לוח זמנים - שאטל ${data.currentShuttle?.shuttle_number}* \n`;
        message += `🏢 ${data.currentShuttle?.company?.name || data.currentShuttle?.name}\n\n`;
        if (data.schedules && data.currentShuttle) {
          const shuttleSchedules = data.schedules
            .filter(s => s.shuttle_id === data.currentShuttle?.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          
          shuttleSchedules.forEach((schedule, index) => {
            const icon = schedule.is_break ? '☕' : '🚌';
            message += `${icon} *${schedule.time_slot}*\n`;
            message += `   📍 ${schedule.route_description}\n`;
            if (schedule.is_break) {
              message += `   💤 הפסקה/מנוחה\n`;
            }
            message += '\n';
          });
        }
        break;
    }
    
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

  const shareWhatsApp = () => {
    try {
      const whatsAppText = generateWhatsAppMessage();
      
      // Encode for WhatsApp URL
      const encodedText = encodeURIComponent(whatsAppText);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      toast.success('נפתח בווטסאפ - הודעה מפורטת ומעוצבת נוצרה');
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error('שגיאה בשיתוף לווטסאפ');
    }
  };

  const getDataCount = (): number => {
    switch (type) {
      case 'companies':
        return data.companies?.length || 0;
      case 'shuttles':
        return data.shuttles?.length || 0;
      case 'schedules':
        return data.schedules?.length || 0;
      case 'shuttle-specific':
        return data.schedules?.filter(s => s.shuttle_id === data.currentShuttle?.id).length || 0;
      default:
        return 0;
    }
  };

  const dataCount = getDataCount();

  if (dataCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2" dir="rtl">
      <Button
        onClick={downloadCSV}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>הורד CSV ({dataCount} שורות)</span>
      </Button>
      
      <Button
        onClick={shareWhatsApp}
        variant="outline" 
        size="sm"
        className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
      >
        <Share className="w-4 h-4" />
        <span>שתף בווטסאפ</span>
      </Button>
    </div>
  );
}