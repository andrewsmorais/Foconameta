import { useEffect } from 'react';

const GOOGLE_ADS_ID = 'AW-17945487409';
const CONVERSION_LABEL = 'yx-VCLrj_P4bELHQie1C';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const initGoogleAds = () => {
  if (typeof window === 'undefined') return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_ADS_ID);

  console.log('[Google Ads] Inicializado com ID:', GOOGLE_ADS_ID);
};

export const useGoogleAds = () => {
  useEffect(() => {
    initGoogleAds();
  }, []);

  return {
    trackPageView: () => {
      if (window.gtag) {
        window.gtag('config', GOOGLE_ADS_ID);
        console.log('[Google Ads] Evento: PageView');
      }
    },
    trackConversion: (transactionId?: string) => {
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}`,
          transaction_id: transactionId || '',
        });
        console.log('[Google Ads] Evento: Conversion -', transactionId);
      }
    },
    trackCustomEvent: (eventName: string, params?: object) => {
      if (window.gtag) {
        window.gtag('event', eventName, params);
        console.log('[Google Ads] Evento Custom:', eventName, params);
      }
    },
  };
};

export default useGoogleAds;
