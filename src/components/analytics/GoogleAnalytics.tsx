'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';

const ANALYTICS_DEFER_MS = 8000;
const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

export default function GoogleAnalytics({ gaId: gaIdProp }) {
  const gaId = gaIdProp || process.env.NEXT_PUBLIC_GA_ID;
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!gaId || shouldLoad || typeof window === 'undefined') {
      return;
    }

    let timeoutId = 0;

    const loadAnalytics = () => {
      setShouldLoad((current) => {
        if (current) {
          return current;
        }

        INTERACTION_EVENTS.forEach((eventName) => {
          window.removeEventListener(eventName, loadAnalytics);
        });

        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        return true;
      });
    };

    INTERACTION_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, loadAnalytics, { passive: true });
    });

    timeoutId = window.setTimeout(loadAnalytics, ANALYTICS_DEFER_MS);

    return () => {
      INTERACTION_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, loadAnalytics);
      });

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [gaId, shouldLoad]);

  if (!gaId || !shouldLoad) return null;

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="ga-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
}
