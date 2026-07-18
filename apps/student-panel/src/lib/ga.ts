declare const process: { env?: Record<string, string | undefined> } | undefined;

type WindowWithGA = Window & {
  gtag?: (...args: unknown[]) => void;
};

const env = typeof process === 'undefined' ? {} : (process.env ?? {});
const GA_TRACKING_ID = env.NEXT_PUBLIC_GA_TRACKING_ID;

export const initGA = () => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;

  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  if (existingScript) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  const win = window as WindowWithGA;
  win.gtag = (...args: unknown[]) => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(args);
  };
  win.gtag('js', new Date());
  win.gtag('config', GA_TRACKING_ID);
};

export const pageview = (url: string) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;
  (window as WindowWithGA).gtag?.('config', GA_TRACKING_ID, { page_path: url });
};
