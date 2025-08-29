import { api } from './api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_login?: string;
}

export interface Session {
  user: User | null;
  access_token?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private authStateCallbacks: Array<(event: string, session: Session | null) => void> = [];
  
  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login', { email, password });
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      // Trigger auth state change
      const session = { user: response.user, access_token: response.token };
      this.triggerAuthStateChange('SIGNED_IN', session);
    }
    
    return response;
  }

  /**
   * Sign up new user (admin registration)
   */
  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register', { 
      email, 
      password, 
      full_name: fullName 
    });
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      // Trigger auth state change
      const session = { user: response.user, access_token: response.token };
      this.triggerAuthStateChange('SIGNED_IN', session);
    }
    
    return response;
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Always remove token from localStorage
      localStorage.removeItem('token');
      // Trigger auth state change
      this.triggerAuthStateChange('SIGNED_OUT', null);
    }
  }

  /**
   * Reset password for email
   */
  async resetPasswordForEmail(email: string): Promise<{ message: string; tempPassword?: string }> {
    return api.post('/api/auth/reset-password', { email });
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { session: Session } }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { data: { session: { user: null } } };
      }

      const response = await api.get('/api/auth/session');
      return {
        data: {
          session: {
            user: response.user,
            access_token: token
          }
        }
      };
    } catch (error) {
      // If session is invalid, remove token
      localStorage.removeItem('token');
      return { data: { session: { user: null } } };
    }
  }

  /**
   * Verify current token
   */
  async verifyToken(): Promise<{ user: User }> {
    return api.get('/api/auth/verify');
  }

  /**
   * Refresh current token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/api/auth/refresh');
    
    // Update token in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Auth state change listener (enhanced for proper state management)
   */

  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } } {
    this.authStateCallbacks.push(callback);
    
    // Initial check
    this.getSession().then(({ data: { session } }) => {
      callback(session?.user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    });

    // Return subscription with proper cleanup
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.authStateCallbacks.indexOf(callback);
            if (index > -1) {
              this.authStateCallbacks.splice(index, 1);
            }
          }
        }
      }
    };
  }

  /**
   * Trigger auth state change callbacks
   */
  private triggerAuthStateChange(event: 'SIGNED_IN' | 'SIGNED_OUT', session: Session | null) {
    this.authStateCallbacks.forEach(callback => {
      try {
        callback(event, session);
      } catch (error) {
        console.error('Auth state callback error:', error);
      }
    });
  }
}

export const authService = new AuthService();