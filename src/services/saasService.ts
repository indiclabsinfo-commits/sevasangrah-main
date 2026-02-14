import axios from 'axios';
import { logger } from '../utils/logger';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    isActive: boolean;
}

export interface Subscription {
    orgId: string;
    isOpdEnabled: boolean;
    isIpdEnabled: boolean;
    isHrmEnabled: boolean;
    isTallyEnabled: boolean;
    isPharmaEnabled: boolean;
    isLabEnabled: boolean;
    maxUsers: number;
    maxBeds: number;
}

export class SaasService {
    private static getBaseUrl() {
        return import.meta.env.VITE_API_URL || '';
    }

    /**
     * Resolve an organization by its slug (subdomain)
     */
    static async getOrganizationBySlug(slug: string): Promise<Organization | null> {
        try {
            logger.log(`🏢 Resolving organization for slug: ${slug}`);
            const response = await axios.get(`${this.getBaseUrl()}/api/saas/organizations/${slug}`);
            return response.data;
        } catch (error) {
            logger.error(`🚨 Error resolving organization ${slug}:`, error);
            return null;
        }
    }

    /**
     * Get subscription details for an organization
     */
    static async getSubscription(orgId: string): Promise<Subscription | null> {
        try {
            logger.log(`💳 Fetching subscription for org: ${orgId}`);
            const response = await axios.get(`${this.getBaseUrl()}/api/saas/subscriptions/${orgId}`);
            return response.data;
        } catch (error) {
            logger.error(`🚨 Error fetching subscription for ${orgId}:`, error);
            return null;
        }
    }
}
