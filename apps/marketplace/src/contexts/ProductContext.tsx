"use client";


import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Prices, SiteBranding, ShippingCosts } from '../lib/database.types';
import { useSiteBranding } from '../hooks/queries/public/useProductDataQuery';

export type { Prices, ShippingCosts, SiteBranding };

interface ProductContextType {
    siteBranding: SiteBranding | null | undefined;
    loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data: siteBranding, isLoading: brandingLoading } = useSiteBranding();
    const loading = brandingLoading;

    const value = useMemo(() => ({
        siteBranding: siteBranding as SiteBranding | null | undefined,
        loading,
    }), [siteBranding, loading]);

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
