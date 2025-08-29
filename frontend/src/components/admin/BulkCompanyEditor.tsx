import { useState } from 'react';
import { dataService } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { ExportActions } from './ExportActions';

interface Company {
  id: string;
  name: string;
  shuttle_number: number;
  is_active: boolean;
}

interface BulkCompanyEditorProps {
  companies: Company[];
  onUpdate: () => void;
}

export function BulkCompanyEditor({ companies, onUpdate }: BulkCompanyEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedCompanies, setEditedCompanies] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Initialize with current company names
      const initialData: {[key: string]: string} = {};
      companies.forEach(company => {
        initialData[company.id] = company.name;
      });
      setEditedCompanies(initialData);
    }
  };

  const handleNameChange = (companyId: string, newName: string) => {
    setEditedCompanies(prev => ({
      ...prev,
      [companyId]: newName
    }));
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      // Validation
      const updates = Object.entries(editedCompanies).map(([id, name]) => ({
        id,
        name: name.trim()
      }));

      // Check for empty names
      const emptyNames = updates.filter(update => !update.name);
      if (emptyNames.length > 0) {
        toast.error('אסור להשאיר שמות חברות ריקים');
        setIsLoading(false);
        return;
      }

      // Update all companies in batch
      for (const update of updates) {
        await dataService.updateCompany(update.id, { name: update.name });
      }

      toast.success('כל שמות החברות עודכנו בהצלחה');
      setIsOpen(false);
      onUpdate();
      
      // Trigger global refresh for all components
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('global-data-refresh'));
      }, 100);
    } catch (error) {
      toast.error('שגיאה בעדכון שמות החברות');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl hover:bg-primary hover:text-primary-foreground"
        >
          <Edit className="w-4 h-4 ml-2" />
          עריכה מהירה של כל השמות
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכה מהירה של כל שמות החברות</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">עריכת {companies.length} חברות</h3>
            <ExportActions 
              data={{ companies }}
              type="companies"
              title="רשימת_חברות_מעודכנת"
            />
          </div>
          <div className="grid gap-4">
            {companies.map((company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary text-primary-foreground font-bold text-lg px-3 py-2 rounded-lg min-w-[60px] text-center">
                      {company.shuttle_number}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`company-${company.id}`} className="text-sm font-medium mb-2 block">
                        שם החברה
                      </Label>
                      <Input
                        id={`company-${company.id}`}
                        value={editedCompanies[company.id] || ''}
                        onChange={(e) => handleNameChange(company.id, e.target.value)}
                        placeholder="שם החברה"
                        className="text-lg"
                      />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      company.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {company.is_active ? 'פעיל' : 'לא פעיל'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Save className="w-4 h-4 ml-2" />
              {isLoading ? 'שומר...' : 'שמור הכל'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}