// Authentication Service - Zero Backend
// Uses Supabase Auth directly, no API dependencies

import { getSupabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'STAFF' | 'RECEPTION';
  first_name: string;
  last_name: string;
  hospital_id?: string;
}

// For compatibility with existing code
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
  department?: string;
}

// Hardcoded admin users (fallback when Supabase Auth is not configured)
const HARDCODED_USERS: AuthUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'admin@hospital.com',
    role: 'ADMIN',
    first_name: 'System',
    last_name: 'Administrator'
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'doctor@hospital.com',
    role: 'DOCTOR',
    first_name: 'Demo',
    last_name: 'Doctor'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'reception@hospital.com',
    role: 'RECEPTION',
    first_name: 'Demo',
    last_name: 'Reception'
  }
];

export class AuthService {
  private static currentUser: AuthUser | null = null;
  private static token: string | null = null;

  // Initialize auth on app start
  static async initialize() {
    try {
      // Try Supabase Auth first
      const supabase = await getSupabase();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.warn('⚠️ Supabase Auth not available:', error.message);
        return this.initializeHardcodedAuth();
      }
      
      if (session?.user) {
        this.token = session.access_token;
        
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
        
        if (profile) {
          this.currentUser = profile as AuthUser;
          logger.log('✅ Authenticated via Supabase:', this.currentUser.email);
        } else {
          // Create from auth user
          this.currentUser = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'STAFF',
            first_name: session.user.user_metadata?.first_name || 'User',
            last_name: session.user.user_metadata?.last_name || ''
          };
        }
      } else {
        this.initializeHardcodedAuth();
      }
    } catch (error) {
      logger.error('❌ Auth initialization failed:', error);
      this.initializeHardcodedAuth();
    }
  }

  // Fallback to hardcoded auth
  private static initializeHardcodedAuth() {
    logger.log('🔓 Using hardcoded authentication');
    // Auto-login as admin for demo
    this.currentUser = HARDCODED_USERS[0];
    this.token = 'hardcoded-token-' + Date.now();
    
    // Store in localStorage for persistence
    localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
    localStorage.setItem('auth_token', this.token);
    
    logger.log('✅ Logged in as hardcoded admin:', this.currentUser.email);
  }

  // Login with email/password
  static async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      // Try Supabase Auth
      const supabase = await getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        logger.warn('⚠️ Supabase login failed:', error.message);
        // Fallback to hardcoded users
        return this.loginHardcoded(email, password);
      }
      
      if (data.user) {
        this.token = data.session?.access_token || null;
        
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();
        
        if (profile) {
          this.currentUser = profile as AuthUser;
        } else {
          this.currentUser = {
            id: data.user.id,
            email: data.user.email || '',
            role: 'STAFF',
            first_name: data.user.user_metadata?.first_name || 'User',
            last_name: data.user.user_metadata?.last_name || ''
          };
        }
        
        // Store
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
        if (this.token) {
          localStorage.setItem('auth_token', this.token);
        }
        
        logger.log('✅ Login successful via Supabase:', this.currentUser.email);
        return this.currentUser;
      }
    } catch (error) {
      logger.error('❌ Login error:', error);
    }
    
    return this.loginHardcoded(email, password);
  }

  // Hardcoded login (demo fallback)
  private static loginHardcoded(email: string, password: string): AuthUser | null {
    // Simple password check for demo
    const user = HARDCODED_USERS.find(u => u.email === email);
    
    if (user) {
      this.currentUser = user;
      this.token = 'hardcoded-token-' + Date.now();
      
      localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
      localStorage.setItem('auth_token', this.token);
      
      logger.log('✅ Login successful (hardcoded):', user.email);
      return user;
    }
    
    logger.warn('❌ Invalid credentials for hardcoded login');
    return null;
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
    } catch (error) {
      logger.warn('⚠️ Supabase logout failed:', error);
    }
    
    this.currentUser = null;
    this.token = null;
    
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    
    logger.log('✅ Logged out');
  }

  // Get current user
  static getCurrentUser(): AuthUser | null {
    if (!this.currentUser) {
      // Try to load from localStorage
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
        this.token = localStorage.getItem('auth_token');
      }
    }
    return this.currentUser;
  }

  // Get auth token
  static getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  // Check if user has role
  static hasRole(role: AuthUser['role'] | AuthUser['role'][]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  // Check if user is admin
  static isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // Check if user is doctor
  static isDoctor(): boolean {
    return this.hasRole('DOCTOR');
  }

  // Check if authenticated
  static isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  // Auto-login for demo
  static autoLoginDemo(): AuthUser {
    this.initializeHardcodedAuth();
    return this.getCurrentUser()!;
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  AuthService.initialize().catch(err => {
    logger.error('❌ Auto-auth initialization failed:', err);
    console.error('Auth initialization error:', err);
  });
}

// Debug: Log auth status
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const user = AuthService.getCurrentUser();
    console.log('🔍 AuthService debug - Current user:', user);
    console.log('🔍 AuthService debug - Is authenticated:', AuthService.isAuthenticated());
  }, 1000);
}

// Export an instance for compatibility with existing code
export const authService = {
  // User management
  getCurrentUser: () => AuthService.getCurrentUser(),
  login: async (credentials: LoginCredentials) => {
    const user = await AuthService.login(credentials.email, credentials.password);
    return { 
      success: !!user, 
      error: user ? undefined : 'Invalid credentials',
      user
    };
  },
  logout: () => AuthService.logout(),
  isAdmin: (user?: AuthUser | null) => {
    const currentUser = user || AuthService.getCurrentUser();
    return currentUser?.role === 'ADMIN';
  },
  isDoctor: () => AuthService.isDoctor(),
  isAuthenticated: () => AuthService.isAuthenticated(),
  hasRole: (role: AuthUser['role'] | AuthUser['role'][]) => AuthService.hasRole(role),
  
  // For compatibility with old code
  onAuthStateChange: (callback: (user: any) => void) => {
    // Simplified implementation - in real app, use Supabase auth state change
    const user = AuthService.getCurrentUser();
    if (user) callback(user);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  
  // Placeholder methods for compatibility
  register: async (userData: RegisterData) => ({ 
    success: false, 
    error: 'Registration not implemented in zero-backend mode. Use hardcoded accounts.' 
  }),
  updateProfile: async (updates: Partial<AuthUser>) => ({ 
    success: false, 
    error: 'Profile update not implemented' 
  }),
  resetPassword: async (email: string) => ({ 
    success: false, 
    error: 'Password reset not implemented' 
  }),
  updatePassword: async (newPassword: string) => ({ 
    success: false, 
    error: 'Password update not implemented' 
  })
};