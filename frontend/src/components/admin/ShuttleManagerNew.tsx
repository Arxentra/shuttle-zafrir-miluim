import React, { useState, useEffect } from 'react';
import { dataService } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ExportActions } from './ExportActions';
import { Trash2, Plus, Edit, Save, X, Upload } from 'lucide-react';
import { CSVUploader } from './CSVUploader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Shuttle {
  id: string;
  name: string;
  shuttle_number: number;
  company_id: string;
  is_active: boolean;
  csv_file_path?: string;
  csv_uploaded_at?: string;
  csv_status?: string;
}

interface Company {
  id: string;
  name: string;
  shuttle_number: number;
  is_active: boolean;
}

export function ShuttleManagerNew() {
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingShuttle, setEditingShuttle] = useState<Shuttle | null>(null);
  const [newShuttle, setNewShuttle] = useState({
    name: '',
    shuttle_number: 0,
    company_id: '',
    is_active: true
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadShuttles(), loadCompanies()]);
    setLoading(false);
  };

  const loadShuttles = async () => {
    try {
      const data = await dataService.shuttles.getAll();
      // Sort by shuttle_number ascending
      const sortedShuttles = data.sort((a, b) => a.shuttle_number - b.shuttle_number);
      setShuttles(sortedShuttles);
    } catch (error) {
      console.error('Error loading shuttles:', error);
      toast.error('שגיאה בטעינת השאטלים');
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await dataService.companies.getAll();
      // Filter active companies and sort by name
      const activeCompanies = data
        .filter(company => company.is_active)
        .sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(activeCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('שגיאה בטעינת החברות');
    }
  };

  const handleAddShuttle = async () => {
    if (!newShuttle.name.trim() || !newShuttle.company_id || newShuttle.shuttle_number <= 0) {
      toast.error('יש למלא את כל הפרטים הנדרשים');
      return;
    }

    try {
      await dataService.shuttles.create({
        name: newShuttle.name,
        shuttle_number: newShuttle.shuttle_number,
        company_id: newShuttle.company_id,
        is_active: newShuttle.is_active
      });

      toast.success('השאטל נוסף בהצלחה');
      setNewShuttle({ name: '', shuttle_number: 0, company_id: '', is_active: true });
      setShowAddForm(false);
      loadShuttles();
      
      // Trigger global refresh for all components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('global-data-refresh'));
      }, 100);
    } catch (error) {
      console.error('Error adding shuttle:', error);
      toast.error('שגיאה בהוספת השאטל');
    }
  };

  const handleSaveShuttle = async (shuttleId: string) => {
    if (!editingShuttle) return;

    try {
      await dataService.shuttles.update(shuttleId, {
        name: editingShuttle.name,
        shuttle_number: editingShuttle.shuttle_number,
        company_id: editingShuttle.company_id,
        is_active: editingShuttle.is_active
      });

      toast.success('השאטל עודכן בהצלחה');
      setEditingShuttle(null);
      loadShuttles();
      
      // Trigger global refresh for all components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('global-data-refresh'));
      }, 100);
    } catch (error) {
      console.error('Error updating shuttle:', error);
      toast.error('שגיאה בעדכון השאטל');
    }
  };

  const handleDeleteShuttle = async (shuttleId: string) => {
    try {
      await dataService.shuttles.delete(shuttleId);

      toast.success('השאטל נמחק בהצלחה');
      loadShuttles();
      
      // Trigger global refresh for all components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('global-data-refresh'));
      }, 100);
    } catch (error) {
      console.error('Error deleting shuttle:', error);
      toast.error('שגיאה במחיקת השאטל');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול שאטלים</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportActions 
            data={{ shuttles, companies }}
            type="shuttles"
            title="רשימת_שאטלים"
          />
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            הוסף שאטל חדש
          </Button>
        </div>
      </div>

      {/* Add New Shuttle Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>הוספת שאטל חדש</CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-name">שם השאטל</Label>
                  <Input
                    id="new-name"
                    value={newShuttle.name}
                    onChange={(e) => setNewShuttle({ ...newShuttle, name: e.target.value })}
                    placeholder="שם השאטל"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label htmlFor="new-number">מספר שאטל</Label>
                  <Input
                    id="new-number"
                    type="number"
                    value={newShuttle.shuttle_number}
                    onChange={(e) => setNewShuttle({ ...newShuttle, shuttle_number: parseInt(e.target.value) || 0 })}
                    placeholder="מספר שאטל"
                  />
                </div>
                <div>
                  <Label htmlFor="new-company">חברה</Label>
                  <Select
                    value={newShuttle.company_id}
                    onValueChange={(value) => setNewShuttle({ ...newShuttle, company_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר חברה" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>סטטוס</Label>
                  <Select
                    value={newShuttle.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setNewShuttle({ ...newShuttle, is_active: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="inactive">לא פעיל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <X className="w-4 h-4" />
                  <span className="mr-2">ביטול</span>
                </Button>
                <Button onClick={handleAddShuttle} className="w-full sm:w-auto">
                  <Save className="w-4 h-4" />
                  <span className="mr-2">שמור</span>
                </Button>
              </div>
            </CardContent>
        </Card>
      )}

      {/* Shuttles List */}
      <div className="grid gap-6">
        {shuttles.map((shuttle) => (
          <Card key={shuttle.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>שאטל {shuttle.shuttle_number} - {shuttle.name}</span>
                <div className="flex items-center gap-2">
                  {shuttle.csv_status && shuttle.csv_status !== 'none' && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      shuttle.csv_status === 'success' ? 'bg-green-100 text-green-800' :
                      shuttle.csv_status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {shuttle.csv_status === 'success' ? 'CSV מעובד' : 
                       shuttle.csv_status === 'error' ? 'שגיאת CSV' : 'מעבד CSV'}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    shuttle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shuttle.is_active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>

            {editingShuttle?.id === shuttle.id ? (
              // Edit Mode
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`edit-name-${shuttle.id}`}>שם השאטל</Label>
                    <Input
                      id={`edit-name-${shuttle.id}`}
                      value={editingShuttle.name}
                      onChange={(e) => setEditingShuttle({ ...editingShuttle, name: e.target.value })}
                      placeholder="שם השאטל"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-number-${shuttle.id}`}>מספר שאטל</Label>
                    <Input
                      id={`edit-number-${shuttle.id}`}
                      type="number"
                      value={editingShuttle.shuttle_number}
                      onChange={(e) => setEditingShuttle({ ...editingShuttle, shuttle_number: parseInt(e.target.value) || 0 })}
                      placeholder="מספר שאטל"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-company-${shuttle.id}`}>חברה</Label>
                    <Select
                      value={editingShuttle.company_id}
                      onValueChange={(value) => setEditingShuttle({ ...editingShuttle, company_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר חברה" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>סטטוס</Label>
                    <Select
                      value={editingShuttle.is_active ? 'active' : 'inactive'}
                      onValueChange={(value) => setEditingShuttle({ ...editingShuttle, is_active: value === 'active' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">פעיל</SelectItem>
                        <SelectItem value="inactive">לא פעיל</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* CSV Upload Section */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <CSVUploader
                    shuttleId={shuttle.id}
                    shuttleName={shuttle.name}
                    currentStatus={shuttle.csv_status}
                    onUploadComplete={loadShuttles}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setEditingShuttle(null)}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    ביטול
                  </Button>
                  <Button
                    onClick={() => handleSaveShuttle(shuttle.id)}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    שמור
                  </Button>
                </div>
              </CardContent>
            ) : (
              // View Mode
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg">{shuttle.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>מספר שאטל: {shuttle.shuttle_number}</p>
                    <p>חברה: {companies.find(c => c.id === shuttle.company_id)?.name || 'לא נמצא'}</p>
                    <p>סטטוס: {shuttle.is_active ? 'פעיל' : 'לא פעיל'}</p>
                    {shuttle.csv_status && shuttle.csv_status !== 'none' && (
                      <p>קובץ CSV: {shuttle.csv_status === 'success' ? '✅ עובד' : shuttle.csv_status === 'error' ? '❌ שגיאה' : '🔄 בעיבוד'}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setEditingShuttle(shuttle)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="mr-2 hidden sm:inline">ערוך</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                        <span className="mr-2 hidden sm:inline">מחק</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                          פעולה זו תמחק את השאטל "{shuttle.name}" לצמיתות. לא ניתן לבטל פעולה זו.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteShuttle(shuttle.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          כן, מחק
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {shuttles.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">אין שאטלים רשומים במערכת</p>
              <p className="text-sm text-muted-foreground mt-2">
                לחץ על "הוסף שאטל חדש" כדי להתחיל
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}