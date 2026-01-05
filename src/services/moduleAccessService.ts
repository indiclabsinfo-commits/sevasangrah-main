/**
 * Module Access Control Service
 * Manages user access to specific modules for phased testing
 * Related to: Magnus Hospital Phased Testing Strategy
 */

import { logger } from '../utils/logger';

export interface Module {
  id: string;
  moduleCode: string;
  moduleName: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  testingStatus: 'NOT_STARTED' | 'IN_DEVELOPMENT' | 'READY_FOR_TESTING' | 'TESTING' | 'APPROVED' | 'DEPLOYED';
  testedBy?: string;
  approvedDate?: string;
}

export interface UserModuleAccess {
  userId: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  accessGrantedAt: string;
  accessExpiresAt?: string;
  isCurrentlyAccessible: boolean;
  notes?: string;
}

export interface ModuleAccessRequest {
  userId: string;
  moduleCodes: string[];
  grantedBy: string;
  expiresAt?: string;
  notes?: string;
}

class ModuleAccessService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';

  /**
   * Get all modules
   */
  async getAllModules(): Promise<Module[]> {
    try {
      logger.log('🔧 [ModuleAccessService] Fetching all modules...');

      const response = await fetch(`${this.baseUrl}/api/modules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('✅ [ModuleAccessService] Modules fetched:', data);
      return data;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error fetching modules:', error);
      throw error;
    }
  }

  /**
   * Get modules accessible by current user
   */
  async getMyModules(): Promise<UserModuleAccess[]> {
    try {
      logger.log('🔧 [ModuleAccessService] Fetching my accessible modules...');

      const response = await fetch(`${this.baseUrl}/api/modules/my-access`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user modules: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('✅ [ModuleAccessService] User modules fetched:', data);
      return data;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error fetching user modules:', error);
      throw error;
    }
  }

  /**
   * Check if current user has access to a specific module
   */
  async hasModuleAccess(moduleCode: string): Promise<boolean> {
    try {
      logger.log(`🔧 [ModuleAccessService] Checking access to module: ${moduleCode}`);

      const response = await fetch(`${this.baseUrl}/api/modules/check-access/${moduleCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check module access: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log(`✅ [ModuleAccessService] Access to ${moduleCode}:`, data.hasAccess);
      return data.hasAccess;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error checking module access:', error);
      return false; // Fail closed - deny access on error
    }
  }

  /**
   * Grant module access to a user (Admin only)
   */
  async grantModuleAccess(request: ModuleAccessRequest): Promise<{ grantedCount: number }> {
    try {
      logger.log('🔧 [ModuleAccessService] Granting module access...', request);

      const response = await fetch(`${this.baseUrl}/api/modules/grant-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to grant module access: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('✅ [ModuleAccessService] Module access granted:', data);
      return data;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error granting module access:', error);
      throw error;
    }
  }

  /**
   * Revoke module access from a user (Admin only)
   */
  async revokeModuleAccess(userId: string, moduleCodes: string[]): Promise<{ revokedCount: number }> {
    try {
      logger.log('🔧 [ModuleAccessService] Revoking module access...', { userId, moduleCodes });

      const response = await fetch(`${this.baseUrl}/api/modules/revoke-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ userId, moduleCodes })
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke module access: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('✅ [ModuleAccessService] Module access revoked:', data);
      return data;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error revoking module access:', error);
      throw error;
    }
  }

  /**
   * Get all users and their module access (Admin only)
   */
  async getUserModuleAccessSummary(): Promise<UserModuleAccess[]> {
    try {
      logger.log('🔧 [ModuleAccessService] Fetching user module access summary...');

      const response = await fetch(`${this.baseUrl}/api/modules/user-access-summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user access summary: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('✅ [ModuleAccessService] User access summary fetched:', data);
      return data;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error fetching user access summary:', error);
      throw error;
    }
  }

  /**
   * Update module testing status (Admin only)
   */
  async updateModuleStatus(
    moduleCode: string,
    status: Module['testingStatus']
  ): Promise<Module> {
    try {
      logger.log(`🔧 [ModuleAccessService] Updating module ${moduleCode} status to ${status}...`);

      const response = await fetch(`${this.baseUrl}/api/modules/${moduleCode}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update module status: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('✅ [ModuleAccessService] Module status updated:', data);
      return data;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error updating module status:', error);
      throw error;
    }
  }

  /**
   * Filter navigation menu items based on user's module access
   */
  async filterNavigationByModuleAccess(
    navigationItems: any[]
  ): Promise<any[]> {
    try {
      // Get user's accessible modules
      const accessibleModules = await this.getMyModules();
      const accessibleModuleCodes = accessibleModules
        .filter(m => m.isCurrentlyAccessible)
        .map(m => m.moduleCode);

      logger.log('🔧 [ModuleAccessService] User has access to modules:', accessibleModuleCodes);

      // Filter navigation items
      const filteredNav = navigationItems.filter(item => {
        // If no module code specified, show to all users
        if (!item.moduleCode) return true;

        // Check if user has access to this module
        return accessibleModuleCodes.includes(item.moduleCode);
      });

      logger.log('✅ [ModuleAccessService] Filtered navigation items:', filteredNav.length);
      return filteredNav;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error filtering navigation:', error);
      // On error, return all items (fail open for navigation to avoid breaking UI)
      return navigationItems;
    }
  }

  /**
   * Get JWT token from localStorage
   */
  private getToken(): string {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  /**
   * Check if user is admin (admins bypass module restrictions)
   */
  isAdmin(): boolean {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;

    try {
      const user = JSON.parse(userStr);
      return user.role?.toLowerCase() === 'admin';
    } catch {
      return false;
    }
  }

  /**
   * Get testing credentials for a user
   */
  async getTestingCredentials(userId: string): Promise<any> {
    try {
      logger.log('🔧 [ModuleAccessService] Fetching testing credentials for user:', userId);

      const response = await fetch(`${this.baseUrl}/api/modules/testing-credentials/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch testing credentials: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('✅ [ModuleAccessService] Testing credentials fetched:', data);
      return data;
    } catch (error) {
      logger.error('❌ [ModuleAccessService] Error fetching testing credentials:', error);
      throw error;
    }
  }
}

export const moduleAccessService = new ModuleAccessService();
export default moduleAccessService;
