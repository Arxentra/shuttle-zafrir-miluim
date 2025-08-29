import { useState } from 'react';
import { dataService } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExportActions } from './ExportActions';
import { BulkCompanyEditor } from './BulkCompanyEditor';

interface Company {
  id: string;
  name: string;
  shuttle_number: number;
  is_active: boolean;
}

interface CompanyManagerProps {
  companies: Company[];
  onUpdate: () => void;
}

export function CompanyManager({ companies, onUpdate }: CompanyManagerProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shuttle_number: 0,
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      shuttle_number: 0,
      is_active: true
    });
    setEditingCompany(null);
  };

  const handleAdd = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('שם החברה הוא שדה חובה');
      return;
    }
    
    if (!formData.shuttle_number || formData.shuttle_number <= 0) {
      toast.error('מספר שאטל חייב להיות מספר חיובי');
      return;
    }

    try {
      await dataService.createCompany({
        name: formData.name.trim(),
        shuttle_number: formData.shuttle_number,
        is_active: formData.is_active
      });

      toast.success('החברה נוספה בהצלחה');
      setIsAddDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error('שגיאה בהוספת החברה');
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!editingCompany) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('שם החברה הוא שדה חובה');
      return;
    }
    
    if (!formData.shuttle_number || formData.shuttle_number <= 0) {
      toast.error('מספר שאטל חייב להיות מספר חיובי');
      return;
    }

    try {
      await dataService.updateCompany(editingCompany.id, {
        name: formData.name.trim(),
        shuttle_number: formData.shuttle_number,
        is_active: formData.is_active
      });

      toast.success('החברה עודכנה בהצלחה - השינויים יתעדכנו מיידית בכל האתר');
      setIsEditDialogOpen(false);
      resetForm();
      onUpdate();
      
      // Trigger global refresh for all components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('global-data-refresh'));
      }, 100);
    } catch (error) {
      toast.error('שגיאה בעדכון החברה');
      console.error(error);
    }
  };

  const handleDelete = async (id: string, companyName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את החברה "${companyName}"? פעולה זו אינה ניתנת לביטול.`)) return;

    try {
      await dataService.deleteCompany(id);

      toast.success(`החברה "${companyName}" נמחקה בהצלחה - השינויים יתעדכנו מיידית בכל האתר`);
      onUpdate();
      
      // Trigger global refresh for all components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('global-data-refresh'));
      }, 100);
    } catch (error) {
      toast.error('שגיאה במחיקת החברה');
      console.error(error);
    }
  };

  const startEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      shuttle_number: company.shuttle_number,
      is_active: company.is_active
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>חברות השאטלים</CardTitle>
          <div className="flex gap-3">
            <BulkCompanyEditor 
              companies={companies} 
              onUpdate={onUpdate}
            />
            <ExportActions 
              data={{ companies }}
              type="companies"
              title="רשימת_חברות"
            />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף חברה חדשה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>הוסף חברה חדשה</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">שם החברה</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="שם החברה"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shuttle_number">מספר שאטל</Label>
                    <Input
                      id="shuttle_number"
                      type="number"
                      min="1"
                      value={formData.shuttle_number || ''}
                      onChange={(e) => {
                        const num = parseInt(e.target.value);
                        setFormData({...formData, shuttle_number: isNaN(num) ? 0 : num});
                      }}
                      placeholder="מספר שאטל"
                    />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">פעיל</Label>
                  </div>
                  <Button onClick={handleAdd} className="w-full">הוסף חברה</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="text-right min-w-[100px]">מספר שאטל</TableHead>
                <TableHead className="text-right min-w-[150px]">שם החברה</TableHead>
                <TableHead className="text-center min-w-[100px]">סטטוס</TableHead>
                <TableHead className="text-center min-w-[120px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-muted/30 transition-colors duration-200 hover:shadow-lg">
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg px-3 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                      {company.shuttle_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-base lg:text-lg hover:text-primary transition-colors duration-200 hover:scale-105 break-words">
                      {company.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 lg:px-3 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm ${
                      company.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 hover:shadow-green-200/50' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 hover:shadow-red-200/50'
                    }`}>
                      {company.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1 lg:gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEdit(company)}
                        className="hover:bg-primary/20 hover:border-primary hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg hover:text-primary px-2 lg:px-3"
                      >
                        <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(company.id, company.name)}
                        className="hover:scale-110 transition-transform duration-200 shadow-md hover:shadow-lg px-2 lg:px-3"
                      >
                        <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>עריכת חברה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">שם החברה</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="שם החברה"
                />
              </div>
              <div>
                <Label htmlFor="edit_shuttle_number">מספר שאטל</Label>
                <Input
                  id="edit_shuttle_number"
                  type="number"
                  min="1"
                  value={formData.shuttle_number || ''}
                  onChange={(e) => {
                    const num = parseInt(e.target.value);
                    setFormData({...formData, shuttle_number: isNaN(num) ? 0 : num});
                  }}
                  placeholder="מספר שאטל"
                />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="edit_is_active">פעיל</Label>
              </div>
              <Button onClick={handleEdit} className="w-full">עדכן חברה</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}