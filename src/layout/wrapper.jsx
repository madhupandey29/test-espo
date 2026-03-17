'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

import BackToTopCom from '@/components/common/back-to-top';
import Loader from '@/components/loader/loader';
import { ShellBootstrapProvider } from '@/context/shell-bootstrap-context';
import { useProductModalState } from '@/lib/ui-state-store';

const ProductModal = dynamic(() => import('@/components/common/product-modal'), {
  ssr: false,
  loading: () => null,
});

const WrapperShellEffects = dynamic(
  () => import('@/layout/wrapper-shell-effects'),
  {
    ssr: false,
    loading: () => null,
  }
);

const SHELL_BOOTSTRAP_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

const IMMEDIATE_BOOTSTRAP_PATTERNS = [
  /^\/cart(?:\/|$)/,
  /^\/checkout(?:\/|$)/,
  /^\/wishlist(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/order(?:\/|$)/,
  /^\/order-confirmation(?:\/|$)/,
  /^\/login(?:\/|$)/,
  /^\/register(?:\/|$)/,
  /^\/forgot(?:\/|$)/,
  /^\/forget-password(?:\/|$)/,
  /^\/email-verify(?:\/|$)/,
];

const shouldBootstrapImmediately = (pathname = '') =>
  IMMEDIATE_BOOTSTRAP_PATTERNS.some((pattern) => pattern.test(pathname));

const Wrapper = ({ children }) => {
  const { productItem } = useProductModalState();
  const pathname = usePathname();
  const bootstrapImmediately = useMemo(
    () => shouldBootstrapImmediately(pathname),
    [pathname]
  );
  const [shellBootstrapEnabled, setShellBootstrapEnabled] = useState(
    bootstrapImmediately
  );
  const [authChecked, setAuthChecked] = useState(!bootstrapImmediately);

  useEffect(() => {
    if (!document.querySelector('[data-bs-toggle="tab"]')) {
      return;
    }

    import('bootstrap/js/dist/tab').catch(() => {
      // Bootstrap tabs are progressive enhancement.
    });
  }, [pathname]);

  useEffect(() => {
    if (bootstrapImmediately) {
      setShellBootstrapEnabled(true);
      setAuthChecked(false);
      return undefined;
    }

    setShellBootstrapEnabled(false);
    setAuthChecked(true);

    if (typeof window === 'undefined') {
      return undefined;
    }

    let timeoutId = null;
    let idleId = null;

    const enableBootstrap = () => {
      setShellBootstrapEnabled(true);
    };

    const cleanup = () => {
      SHELL_BOOTSTRAP_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, enableBootstrap, true);
      });

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };

    SHELL_BOOTSTRAP_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, enableBootstrap, {
        once: true,
        passive: true,
        capture: true,
      });
    });

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(enableBootstrap, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(enableBootstrap, 1500);
    }

    return cleanup;
  }, [bootstrapImmediately, pathname]);

  if (bootstrapImmediately && !authChecked) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: '100vh' }}
      >
        <Loader spinner="fade" loading />
      </div>
    );
  }

  return (
    <ShellBootstrapProvider value={shellBootstrapEnabled}>
      <div id="wrapper">
        {children}
        <BackToTopCom />
        {shellBootstrapEnabled ? (
          <WrapperShellEffects onAuthChecked={setAuthChecked} />
        ) : null}
        {productItem ? <ProductModal /> : null}
      </div>
    </ShellBootstrapProvider>
  );
};

export default Wrapper;


