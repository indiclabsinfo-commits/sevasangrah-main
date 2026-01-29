import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Organization, Subscription } from '../services/saasService';
import { SaasService } from '../services/saasService';
import { logger } from '../utils/logger';

interface SaasContextType {
    organization: Organization | null;
    subscription: Subscription | null;
    currentSlug: string | null;
    loading: boolean;
    isModuleEnabled: (moduleName: keyof Omit<Subscription, 'orgId' | 'maxUsers' | 'maxBeds'>) => boolean;
}

const SaasContext = createContext<SaasContextType | undefined>(undefined);

export const SaasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [currentSlug, setCurrentSlug] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const resolveTenant = async () => {
            try {
                setLoading(true);

                // 1. Detect Slug from Subdomain
                // Examples: magnus.hms.pro -> magnus, locahost:3000 -> default
                const hostname = window.location.hostname;
                const parts = hostname.split('.');

                let slug = 'magnus'; // Default/Fallback

                if (parts.length > 2 && parts[0] !== 'www') {
                    slug = parts[0];
                }

                setCurrentSlug(slug);
                logger.log(`🌍 Detected tenant slug: ${slug}`);

                // 2. Fetch Organization and Subscription
                const org = await SaasService.getOrganizationBySlug(slug);
                if (org) {
                    setOrganization(org);
                    const sub = await SaasService.getSubscription(org.id);
                    setSubscription(sub);
                } else {
                    logger.warn(`⚠️ Organization not found for slug: ${slug}. Using defaults.`);
                }

            } catch (error) {
                logger.error('❌ Error resolving SaaS tenant:', error);
            } finally {
                setLoading(false);
            }
        };

        resolveTenant();
    }, []);

    const isModuleEnabled = (moduleName: keyof Omit<Subscription, 'orgId' | 'maxUsers' | 'maxBeds'>): boolean => {
        if (!subscription) return true; // Default to true if not loaded yet or in dev
        return subscription[moduleName] === true;
    };

    const value: SaasContextType = {
        organization,
        subscription,
        currentSlug,
        loading,
        isModuleEnabled
    };

    return (
        <SaasContext.Provider value={value}>
            {children}
        </SaasContext.Provider>
    );
};

export const useSaas = (): SaasContextType => {
    const context = useContext(SaasContext);
    if (context === undefined) {
        throw new Error('useSaas must be used within a SaasProvider');
    }
    return context;
};

export default SaasContext;
