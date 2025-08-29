
import { useState, useEffect } from 'react';
import { dataService } from '@/services/dataService';
import { wsService } from '@/services/websocketService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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

interface RegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlot: string;
  routeType: 'sabidor' | 'kiryat-arie';
  direction: 'outbound' | 'return';
}

interface Registration {
  id: string;
  user_name: string;
  phone_number?: string;
  created_at: string;
}

function RegistrationModal({
  isOpen,
  onOpenChange,
  timeSlot,
  routeType,
  direction
}: RegistrationModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Enhanced real-time updates and synchronization
  useEffect(() => {
    if (isOpen) {
      loadRegistrations();
      
      // Set up WebSocket listeners for real-time updates
      wsService.on('registration-updated', () => {
        console.log('📋 Registration Modal real-time update:', { 
          timeSlot, 
          routeType, 
          direction, 
          timestamp: new Date().toLocaleTimeString()
        });
        
        // Immediate reload for real-time experience
        setTimeout(() => {
          loadRegistrations();
        }, 100);
      });

      // Global refresh listener
      const handleGlobalRefresh = () => {
        console.log('🌐 Registration Modal global refresh');
        loadRegistrations();
      };

      window.addEventListener('global-data-refresh', handleGlobalRefresh);

      return () => {
        wsService.off('registration-updated');
        window.removeEventListener('global-data-refresh', handleGlobalRefresh);
      };
    }
  }, [isOpen, timeSlot, routeType, direction]);

  const loadRegistrations = async () => {
    setLoadingRegistrations(true);
    try {
      const data = await dataService.getRegistrations({
        time_slot: timeSlot,
        route_type: routeType,
        direction: direction,
        registration_date: new Date().toISOString().split('T')[0]
      });
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('שגיאה בטעינת ההרשמות');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error('יש להזין שם');
      return;
    }

    setIsLoading(true);
    try {
      await dataService.createRegistration({
        time_slot: timeSlot,
        route_type: routeType,
        direction: direction,
        user_name: name.trim(),
        phone_number: null,
        registration_date: new Date().toISOString().split('T')[0]
      });

      console.log('🎯 Registration successful, triggering real-time updates');
      
      toast.success(`נרשמת בהצלחה לנסיעה בשעה ${timeSlot}`);
      setName('');
      
      // Force immediate global refresh for real-time synchronization
      window.dispatchEvent(new CustomEvent('global-data-refresh'));
      
      // Reload registrations immediately
      setTimeout(() => {
        loadRegistrations();
      }, 100);
      
    } catch (error) {
      console.error('Error registering:', error);
      toast.error('שגיאה בהרשמה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRegistration = async (registrationId: string, userName: string) => {
    try {
      await dataService.deleteRegistration(registrationId);

      console.log('🎯 Registration deleted, triggering real-time updates');

      toast.success(`ההרשמה של ${userName} נמחקה בהצלחה`);
      
      // Force immediate global refresh for real-time synchronization
      window.dispatchEvent(new CustomEvent('global-data-refresh'));
      
      // Reload registrations immediately
      setTimeout(() => {
        loadRegistrations();
      }, 100);
      
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('שגיאה במחיקת ההרשמה');
    }
  };

  const getDirectionText = () => {
    if (routeType === 'kiryat-arie') {
      return direction === 'outbound' ? 'מקריית אריה לצפריר' : 'מצפריר לקריית אריה';
    } else {
      return direction === 'outbound' ? 'מסבידור לצפריר' : 'מצפריר לסבידור';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md mx-auto" dir="rtl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-center justify-center">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            הרשמה לנסיעה
          </DialogTitle>
          <div className="text-center space-y-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-xl border-2 border-emerald-400 dark:border-emerald-500">
              {timeSlot}
            </div>
            <p className="text-base sm:text-lg text-emerald-700 dark:text-emerald-300 font-semibold">
              {getDirectionText()}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              * ההרשמה זמינה לכל השעות
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-lg font-semibold block">שם מלא *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הזן את שמך המלא"
              dir="rtl"
              className="text-lg p-4 border-2 border-emerald-300 focus:border-emerald-500 rounded-xl h-14"
            />
          </div>

          <Button 
            onClick={handleRegister} 
            disabled={isLoading || !name.trim()}
            className="w-full text-lg sm:text-xl py-4 h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                מבצע הרשמה...
              </div>
            ) : (
              'הירשם לנסיעה 🚍'
            )}
          </Button>

          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-lg sm:text-xl text-emerald-700 dark:text-emerald-300">
                נרשמו: {loadingRegistrations ? '...' : registrations.length} אנשים
              </span>
            </div>
            
            {loadingRegistrations ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-base text-muted-foreground">טוען...</p>
              </div>
            ) : registrations.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {registrations.map((reg, index) => (
                  <div key={reg.id} className="text-base p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl flex justify-between items-center border-2 border-emerald-200 dark:border-emerald-700 shadow-md">
                    <span className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
                      {index + 1}. {reg.user_name}
                    </span>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl" className="max-w-sm sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl sm:text-2xl text-center">אתה בטוח?</AlertDialogTitle>
                          <AlertDialogDescription className="text-lg text-center leading-relaxed">
                            פעולה זו תמחק את ההרשמה של <br />
                            <strong className="text-red-600 text-xl">{reg.user_name}</strong><br />
                            לנסיעה בשעה <strong>{timeSlot}</strong>.
                            <br /><br />
                            לא ניתן לבטל פעולה זו.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex gap-3 justify-center">
                          <AlertDialogCancel className="text-lg px-6 py-3">ביטול</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteRegistration(reg.id, reg.user_name)}
                            className="bg-red-600 hover:bg-red-700 text-lg px-6 py-3"
                          >
                            כן, מחק
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-base text-muted-foreground font-medium">
                  עדיין לא נרשם אף אחד לנסיעה זו
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RegistrationModal;
export { RegistrationModal };
