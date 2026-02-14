// Permission Service - Backend API Integration
import axios from 'axios';
import { logger } from '../utils/logger';

export interface Permission {
    id: string;
    code: string;
    description: string;
    module: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
}

class PermissionService {
    private getBaseUrl(): string {
        let baseUrl = import.meta.env.VITE_API_URL || '';
        if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.substring(0, baseUrl.length - 4);
        }
        return baseUrl;
    }

    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        return { Authorization: `Bearer ${token}` };
    }

    /**
     * Get all permissions for a specific user based on their role
     */
    async getUserPermissions(userId: string, email?: string): Promise<string[]> {
        try {
            const response = await axios.get(`${this.getBaseUrl()}/api/hrm/user-permissions`, {
                headers: this.getHeaders(),
                params: { userId, email }
            });
            return response.data || [];
        } catch (error) {
            logger.error('❌ Error fetching user permissions:', error);
            return [];
        }
    }

    /**
     * Get all available roles
     */
    async getAllRoles(): Promise<Role[]> {
        try {
            const response = await axios.get(`${this.getBaseUrl()}/api/hrm/roles`, {
                headers: this.getHeaders()
            });
            return response.data || [];
        } catch (error) {
            logger.error('❌ Error fetching roles:', error);
            return [];
        }
    }

    /**
     * Get all available permissions
     */
    async getAllPermissions(): Promise<Permission[]> {
        try {
            const response = await axios.get(`${this.getBaseUrl()}/api/hrm/permissions`, {
                headers: this.getHeaders()
            });
            return response.data || [];
        } catch (error) {
            logger.error('❌ Error fetching permissions:', error);
            return [];
        }
    }

    /**
     * Get permissions assigned to a specific role
     */
    async getRolePermissions(roleId: string): Promise<string[]> {
        try {
            const response = await axios.get(`${this.getBaseUrl()}/api/hrm/role-permissions/${roleId}`, {
                headers: this.getHeaders()
            });
            return response.data || [];
        } catch (error) {
            logger.error('❌ Error fetching role permissions:', error);
            return [];
        }
    }

    /**
     * Update permissions for a role
     */
    async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
        try {
            await axios.put(`${this.getBaseUrl()}/api/hrm/role-permissions/${roleId}`,
                { permissionIds },
                { headers: this.getHeaders() }
            );
        } catch (error) {
            logger.error('❌ Error updating role permissions:', error);
            throw error;
        }
    }
}

export const permissionService = new PermissionService();
export default permissionService;
