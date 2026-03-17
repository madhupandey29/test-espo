'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const LazyFloatingButtons = dynamic(() => import('@/components/common/FloatingButtons'), {
  ssr: false,
  loading: () => null,
});

const LazyFloatingChatbot = dynamic(() => import('@/components/chatbot/FloatingChatbot'), {
  ssr: false,
  loading: () => null,
});

const FLOATING_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

export default function ClientOnlyFloating() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId = null;

    const enableFloatingUi = () => {
      setShouldRender((current) => {
        if (!current) {
          cleanup();
        }
        return true;
      });
    };

    const cleanup = () => {
      FLOATING_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, enableFloatingUi, true);
      });
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    FLOATING_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, enableFloatingUi, {
        once: true,
        passive: true,
        capture: true,
      });
    });

    timeoutId = window.setTimeout(enableFloatingUi, 4000);

    return cleanup;
  }, []);

  if (!shouldRender) return null;

  return (
    <>
      <LazyFloatingButtons />
      <LazyFloatingChatbot />
    </>
  );
}
