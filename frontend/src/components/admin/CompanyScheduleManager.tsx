import React from 'react';
import { dataService } from '@/services/dataService';
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

interface CompanyScheduleManagerProps {
  companies: Company[];
  shuttles: Shuttle[];
  onUpdate: () => void;
}

// פונקציה לחיפוש חברה לפי מספר שאטל ושעה
export const findCompanyByShuttleAndTime = (
  shuttleNumber: number, 
  timeSlot: string, 
  companies: Company[]
): Company | null => {
  // מציאת החברה לפי מספר השאטל
  const company = companies.find(c => c.shuttle_number === shuttleNumber && c.is_active);
  return company || null;
};

// פונקציה לעדכון שם החברה בכל הלוחות הזמנים הרלוונטיים
export const updateCompanyNameInSchedules = async (
  companyId: string,
  newCompanyName: string,
  onUpdate: () => void
) => {
  try {
    // עדכון שם החברה בטבלת החברות
    await dataService.companies.update(companyId, { name: newCompanyName });

    toast.success(`שם החברה עודכן בהצלחה ל"${newCompanyName}"`);
    onUpdate(); // רענון הנתונים
  } catch (error) {
    toast.error('שגיאה בעדכון שם החברה');
    console.error(error);
  }
};

export default function CompanyScheduleManager({ 
  companies, 
  shuttles, 
  onUpdate 
}: CompanyScheduleManagerProps) {
  return null; // זהו קומפוננט עזר ללא UI
}