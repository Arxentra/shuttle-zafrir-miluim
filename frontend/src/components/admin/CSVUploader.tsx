import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '@/services/dataService';

interface CSVUploaderProps {
  shuttleId: string;
  shuttleName: string;
  currentStatus?: string;
  onUploadComplete?: () => void;
}

export function CSVUploader({ shuttleId, shuttleName, currentStatus, onUploadComplete }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('יש להעלות קובץ CSV בלבד');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('יש לבחור קובץ CSV');
      return;
    }

    setUploading(true);
    setProcessing(true);
    
    try {
      // Upload and process file in one step using our backend API
      const result = await dataService.csv.uploadAndProcess(shuttleId, file);

      toast.success(`הקובץ עובד בהצלחה! עובדו ${result.processed_records} רשומות`);
      setFile(null);
      onUploadComplete?.();

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בלתי צפויה');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'success':
        return 'עובד בהצלחה';
      case 'error':
        return 'שגיאה בעיבוד';
      case 'processing':
        return 'מעבד...';
      default:
        return 'לא הועלה קובץ';
    }
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="w-5 h-5" />
          העלאת קובץ CSV - {shuttleName}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getStatusIcon()}
          <span>סטטוס: {getStatusText()}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`csv-file-${shuttleId}`} className="text-sm font-medium">
            בחר קובץ CSV
          </Label>
          <Input
            id={`csv-file-${shuttleId}`}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={uploading || processing}
            className="cursor-pointer"
          />
          {file && (
            <p className="text-sm text-green-600">
              נבחר קובץ: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-sm mb-2">פורמט הקובץ הנדרש:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• עמודה 1: זמן (time_slot)</li>
            <li>• עמודה 2: תיאור מסלול (route_description)</li>
            <li>• עמודה 3: מספר סידורי (sort_order) - אופציונלי</li>
            <li>• עמודה 4: האם זו הפסקה (is_break) - true/false אופציונלי</li>
          </ul>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading || processing}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              מעלה קובץ...
            </>
          ) : processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              מעבד נתונים...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              העלה ועבד קובץ
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}