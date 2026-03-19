import { useEffect, useCallback } from 'react';

// ============================================
// 🔴 SUBSTITUA PELO SEU PIXEL ID DO FACEBOOK
// ============================================
const FB_PIXEL_ID = '1163164178906906';

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

// Inicializa o Facebook Pixel
const initFacebookPixel = () => {
  if (typeof window === 'undefined') return;
  
  // Evita inicialização duplicada
  if (window.fbq) return;

  // Cria a função fbq
  (function(f: Window, b: Document, e: string, v: string) {
    const n = function(...args: unknown[]) {
      (n as any).callMethod
        ? (n as any).callMethod.apply(n, args)
        : (n as any).queue.push(args);
    };
    
    if (!f._fbq) f._fbq = n;
    (n as any).push = n;
    (n as any).loaded = true;
    (n as any).version = '2.0';
    (n as any).queue = [];
    
    f.fbq = n;

    const t = b.createElement('script') as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName('script')[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  // Inicializa o Pixel com o ID
  window.fbq('init', FB_PIXEL_ID);
  
  // PageView automático na inicialização
  window.fbq('track', 'PageView');
  
  console.log('[FB Pixel] Inicializado com ID:', FB_PIXEL_ID);
};

// Hook principal
export const useFacebookPixel = () => {
  useEffect(() => {
    initFacebookPixel();
  }, []);

  // Retorna funções simples (não hooks) para evitar problemas de HMR
  return {
    trackPageView: () => {
      if (window.fbq) {
        window.fbq('track', 'PageView');
        console.log('[FB Pixel] Evento: PageView');
      }
    },
    trackLead: (contentName?: string) => {
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: contentName || 'Ver Planos',
        });
        console.log('[FB Pixel] Evento: Lead -', contentName);
      }
    },
    trackViewContent: (contentName: string, contentCategory?: string) => {
      if (window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_name: contentName,
          content_category: contentCategory || 'Landing Page',
        });
        console.log('[FB Pixel] Evento: ViewContent -', contentName);
      }
    },
    trackInitiateCheckout: (planType: string, value: number) => {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: `Plano ${planType}`,
          content_category: 'Subscription',
          value: value,
          currency: 'BRL',
          num_items: 1,
        });
        console.log('[FB Pixel] Evento: InitiateCheckout -', planType, value);
      }
    },
    trackAddToCart: (planType: string, value: number) => {
      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_name: `Plano ${planType}`,
          content_type: 'product',
          value: value,
          currency: 'BRL',
        });
        console.log('[FB Pixel] Evento: AddToCart -', planType);
      }
    },
    trackAddPaymentInfo: (planType: string, value: number) => {
      if (window.fbq) {
        window.fbq('track', 'AddPaymentInfo', {
          content_name: `Plano ${planType}`,
          content_category: 'Subscription',
          value: value,
          currency: 'BRL',
        });
        console.log('[FB Pixel] Evento: AddPaymentInfo -', planType, value);
      }
    },
    trackContact: (method: string) => {
      if (window.fbq) {
        window.fbq('track', 'Contact', {
          content_name: method,
        });
        console.log('[FB Pixel] Evento: Contact -', method);
      }
    },
    trackCompleteRegistration: (value?: number) => {
      if (window.fbq) {
        window.fbq('track', 'CompleteRegistration', {
          value: value || 0,
          currency: 'BRL',
        });
        console.log('[FB Pixel] Evento: CompleteRegistration');
      }
    },
    trackCustomEvent: (eventName: string, params?: object) => {
      if (window.fbq) {
        window.fbq('trackCustom', eventName, params);
        console.log('[FB Pixel] Evento Custom:', eventName, params);
      }
    },
  };
};

export default useFacebookPixel;
