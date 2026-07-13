"use client";


import React, { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import type { Prices, SiteBranding, ShippingCosts } from '../lib/database.types';
import { useToast } from './ToastContext';
import { usePrices, useSiteBranding, useShippingCosts } from '../hooks/queries/public/useProductDataQuery';
import { useProductSettingsMutations } from '../hooks/mutations/useProductSettingsMutations';

export type { Prices, ShippingCosts, SiteBranding };

interface ProductContextType {
    prices: Prices | null | undefined;
    siteBranding: SiteBranding | null | undefined;
    shippingCosts: ShippingCosts | null | undefined;
    setPrices: (newPrices: Prices) => Promise<any>;
    setSiteBranding: (newBranding: Partial<SiteBranding>) => Promise<any>;
    setShippingCosts: (newCosts: ShippingCosts) => Promise<any>;
    loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addToast } = useToast();
    const [queriesEnabled, setQueriesEnabled] = useState(false);

    useEffect(() => {
        const win = window as any;
        if (typeof win.requestIdleCallback === 'function') {
            const idleId = win.requestIdleCallback(() => setQueriesEnabled(true), { timeout: 1500 });
            return () => win.cancelIdleCallback?.(idleId);
        }

        const timer = window.setTimeout(() => setQueriesEnabled(true), 600);
        return () => window.clearTimeout(timer);
    }, []);

    const { data: prices, isLoading: pricesLoading } = usePrices(queriesEnabled);
    const { data: siteBranding, isLoading: brandingLoading } = useSiteBranding(queriesEnabled);
    const { data: shippingCosts, isLoading: shippingLoading } = useShippingCosts(queriesEnabled);

    const { updatePrices, updateBranding, updateShippingCosts } = useProductSettingsMutations();

    const setPrices = async (newPrices: Prices) => {
        return updatePrices.mutateAsync(newPrices);
    };

    const setSiteBranding = async (newBranding: Partial<SiteBranding>) => {
        return updateBranding.mutateAsync(newBranding);
    };
    
    const setShippingCosts = async (newCosts: ShippingCosts) => {
        return updateShippingCosts.mutateAsync(newCosts);
    };

    const loading = queriesEnabled && (pricesLoading || brandingLoading || shippingLoading);

    const value = useMemo(() => ({
        prices,
        siteBranding: siteBranding as SiteBranding | null | undefined,
        shippingCosts,
        setPrices,
        setSiteBranding,
        setShippingCosts,
        loading,
    }), [prices, siteBranding, shippingCosts, loading]);

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProduct = (): ProductContextType => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProduct must be used within a ProductProvider');
    }
    return context;
};
