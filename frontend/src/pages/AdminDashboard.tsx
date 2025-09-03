import React, { useState, useEffect } from 'react';
import { dataService } from '@/services/dataService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompanyManager } from '@/components/admin/CompanyManager';
import { ShuttleManager } from '@/components/admin/ShuttleManager';
import { ShuttleManagerNew } from '@/components/admin/ShuttleManagerNew';
import CompanyScheduleManager from '@/components/admin/CompanyScheduleManager';
import { BulkCompanyEditor } from '@/components/admin/BulkCompanyEditor';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { Users, Bus, Calendar, FileEdit, Upload, LogOut, Settings } from 'lucide-react';

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
  csv_file_path?: string;
  csv_uploaded_at?: string;
  csv_status?: string;
}

interface ShuttleSchedule {
  id: string;
  shuttle_id: string;
  time_slot: string;
  route_description: string;
  is_break: boolean;
  sort_order: number;
}

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [schedules, setSchedules] = useState<ShuttleSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies
      const companiesData = await dataService.getCompanies();
      
      // Fetch shuttles with companies
      const shuttlesData = await dataService.getShuttles();
      
      // Fetch schedules
      const schedulesData = await dataService.getSchedules();

      setCompanies(companiesData || []);
      setShuttles(shuttlesData || []);
      setSchedules(schedulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced global real-time synchronization
  const { triggerGlobalRefresh } = useGlobalSync({
    onCompanyChange: loadData,
    onShuttleChange: loadData,
    onScheduleChange: loadData
  });

  useEffect(() => {
    loadData();
    // Note: WebSocket functionality removed
    // No need to duplicate them here
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('התנתקת בהצלחה');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 order-2 sm:order-1">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              שלום, {user?.email}
            </span>
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="w-4 h-4" />
              <span className="mr-2 hidden sm:inline">התנתק</span>
            </Button>
          </div>
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-center">מערכת ניהול צפריר</h1>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">שאטלים פעילים</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shuttles.filter(s => s.is_active).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חברות רשומות</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ נסיעות</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedules.filter(s => !s.is_break).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">קבצי CSV</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shuttles.filter(s => s.csv_status === 'success').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-2xl" dir="rtl">
          <Card className="w-full max-w-6xl shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
              <CardTitle className="text-3xl font-bold text-center">
                מערכת ניהול צפריר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="schedules" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 gap-1" dir="rtl">
                  <TabsTrigger value="schedules" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">לוחות זמנים</span>
                    <span className="sm:hidden">זמנים</span>
                  </TabsTrigger>
                  <TabsTrigger value="companies" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">חברות</span>
                    <span className="sm:hidden">חברות</span>
                  </TabsTrigger>
                  <TabsTrigger value="bulk-edit" className="flex items-center gap-1 text-xs sm:text-sm">
                    <FileEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">עריכה מהירה</span>
                    <span className="sm:hidden">עריכה</span>
                  </TabsTrigger>
                  <TabsTrigger value="shuttles-new" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">ניהול שאטלים + CSV</span>
                    <span className="sm:hidden">שאטלים</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="shuttles-new">
                  <ShuttleManagerNew />
                </TabsContent>

                <TabsContent value="schedules">
                  <ShuttleManager 
                    shuttles={shuttles} 
                    companies={companies} 
                    schedules={schedules}
                    onUpdate={() => {
                      console.log('🔄 Schedule manager update triggered');
                      loadData();
                      // Dispatch admin update event
                      window.dispatchEvent(new CustomEvent('admin-data-updated', { 
                        detail: { type: 'schedule_manager_update', timestamp: Date.now() } 
                      }));
                    }}
                  />
                </TabsContent>

                <TabsContent value="companies">
                  <CompanyManager 
                    companies={companies} 
                    onUpdate={() => {
                      console.log('🔄 Company manager update triggered');
                      loadData();
                      // Dispatch admin update event
                      window.dispatchEvent(new CustomEvent('admin-data-updated', { 
                        detail: { type: 'company_manager_update', timestamp: Date.now() } 
                      }));
                    }} 
                  />
                </TabsContent>

                <TabsContent value="bulk-edit">
                  <BulkCompanyEditor 
                    companies={companies} 
                    onUpdate={() => {
                      console.log('🔄 Bulk editor update triggered');
                      loadData();
                      // Dispatch admin update event
                      window.dispatchEvent(new CustomEvent('admin-data-updated', { 
                        detail: { type: 'bulk_edit_update', timestamp: Date.now() } 
                      }));
                    }} 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}