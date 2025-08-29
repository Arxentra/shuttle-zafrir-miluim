import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // In our backend system, if user exists they are admin
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    authService.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setIsAdmin(true);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authService.signInWithPassword(email, password);
      // Trigger auth state change
      const { data: { session } } = await authService.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(!!session?.user);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await authService.signUp(email, password);
      // Trigger auth state change
      const { data: { session } } = await authService.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(!!session?.user);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPasswordForEmail(email);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const value = {
    user,
    session,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}