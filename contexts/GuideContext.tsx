import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { GuideSettings } from '../types';

interface GuideContextProps {
    guide: GuideSettings;
    loading: boolean;
    error: string | null;
    refreshGuide: () => Promise<void>;
    updateGuideSettings: (newSettings: Partial<GuideSettings>) => Promise<void>;
}

const defaultGuide: GuideSettings = {
    app_name: 'Guia Boipeba',
    whatsapp: '',
    favicon_url: '',
    splash_url: '',
    app_icon_url: ''
};

const GuideContext = createContext<GuideContextProps | undefined>(undefined);

export const GuideProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [guide, setGuide] = useState<GuideSettings>(defaultGuide);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGuideSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            // SAAS TODO: Determine tenant based on domain/subdomain or path
            // const hostname = window.location.hostname;
            // const slug = hostname.split('.')[0]; 
            // await supabase.from('guide_settings').select('*').eq('slug', slug).single();

            // Current behavior: Singleton 'id = true'
            // We use 'maybeSingle' to avoid errors if table is empty
            const { data, error } = await supabase
                .from('guide_settings')
                .select('*')
                .eq('id', true) // Legacy/Single-tenant mode
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setGuide({
                    id: data.id,
                    app_name: data.app_name || defaultGuide.app_name,
                    whatsapp: data.whatsapp || '',
                    favicon_url: data.favicon_url || '',
                    splash_url: data.splash_url || '',
                    app_icon_url: data.app_icon_url || '',
                    slug: data.slug,
                    organization_id: data.organization_id
                });

                // Dynamic title/favicon update based on loaded settings
                if (data.app_name) document.title = data.app_name;
                if (data.favicon_url) {
                    let fav = document.querySelector<HTMLLinkElement>('link[rel="icon"]#dynamic-favicon');
                    if (!fav) {
                        fav = document.createElement('link');
                        fav.rel = 'icon';
                        fav.id = 'dynamic-favicon';
                        document.head.appendChild(fav);
                    }
                    fav.href = data.favicon_url;
                }
            }
        } catch (err: any) {
            console.error('Error fetching guide settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateGuideSettings = async (newSettings: Partial<GuideSettings>) => {
        try {
            setLoading(true);
            // Construct payload. If we are in single tenant mode, id is true.
            // In SaaS, we would use the guide.id we fetched.

            const payload = {
                ...newSettings,
                updated_at: new Date().toISOString()
            };

            // If we strictly follow the current app logic where id is boolean true:
            const idToUpdate = guide.id || true;

            const { error } = await supabase
                .from('guide_settings')
                .upsert({ ...payload, id: idToUpdate })
                .eq('id', idToUpdate); // This .eq might be redundant with upsert but safer

            if (error) throw error;

            await fetchGuideSettings();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuideSettings();
    }, []);

    return (
        <GuideContext.Provider value={{ guide, loading, error, refreshGuide: fetchGuideSettings, updateGuideSettings }}>
            {children}
        </GuideContext.Provider>
    );
};

export const useGuide = () => {
    const context = useContext(GuideContext);
    if (context === undefined) {
        throw new Error('useGuide must be used within a GuideProvider');
    }
    return context;
};
