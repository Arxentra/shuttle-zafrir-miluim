import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export default function AdminAuth() {
  const [email, setEmail] = useState('kidaryogev@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('שם משתמש או סיסמה שגויים. האם תרצה לאפס את הסיסמה?');
          setShowResetPassword(true);
        } else {
          toast.error('שגיאה בהתחברות: ' + error.message);
        }
        return;
      }

      toast.success('התחברת בהצלחה למערכת האדמין');
      navigate('/admin');
    } catch (error) {
      toast.error('אירעה שגיאה במערכת');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('המשתמש כבר רשום במערכת. נסה להתחבר או לאפס סיסמה.');
          setShowResetPassword(true);
        } else {
          toast.error('שגיאה בהרשמה: ' + error.message);
        }
        return;
      }

      toast.success('הרשמה בוצעה בהצלחה! כעת תוכל להתחבר');
    } catch (error) {
      toast.error('אירעה שגיאה במערכת');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error('שגיאה באיפוס סיסמה: ' + error.message);
        return;
      }

      toast.success('נשלח לך אימייל לאיפוס סיסמה. בדוק את תיבת הדואר שלך.');
      setShowResetPassword(false);
    } catch (error) {
      toast.error('אירעה שגיאה במערכת');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">מערכת אדמין</CardTitle>
          <CardDescription>
            התחבר או הירשם כדי לגשת לממשק הניהול
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResetPassword ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">איפוס סיסמה</span>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">אימייל</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="kidaryogev@gmail.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'שולח...' : 'שלח קישור איפוס'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResetPassword(false)}
                    disabled={isLoading}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">התחברות</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">אימייל</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="kidaryogev@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">סיסמה</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'מתחבר...' : 'התחבר'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setShowResetPassword(true)}
                  disabled={isLoading}
                >
                  שכחתי סיסמה
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">אימייל</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="kidaryogev@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">סיסמה</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'נרשם...' : 'הירשם'}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  רק המשתמש kidaryogev@gmail.com יכול להיות אדמין
                </p>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}