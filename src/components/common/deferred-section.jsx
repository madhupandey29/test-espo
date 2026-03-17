'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function DeferredSection({
  children,
  minHeight = 0,
  rootMargin = '320px 0px',
  placeholder = null,
  className = '',
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      return undefined;
    }

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible
        ? children
        : placeholder ?? <div style={{ minHeight }} aria-hidden="true" />}
    </div>
  );
}
