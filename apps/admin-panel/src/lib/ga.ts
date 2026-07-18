import { useEffect } from 'react';

// Google Analytics 4 (GA4) Integration
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

export const initGA = () => {
    if (!GA_TRACKING_ID) return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
        window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID);
};

export const pageview = (url: string) => {
    if (!GA_TRACKING_ID || !window.gtag) return;
    window.gtag('config', GA_TRACKING_ID, {
        page_path: url,
    });
};

export const event = ({ action, category, label, value }: {
    action: string;
    category?: string;
    label?: string;
    value?: number;
}) => {
    if (!window.gtag) return;
    window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
    });
};

// React Hook for tracking page views
export const usePageTracking = () => {
    useEffect(() => {
        initGA();
    }, []);
};
