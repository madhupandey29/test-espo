'use client';
import { useEffect } from 'react';

export default function ScrollToTop() {
  useEffect(() => {
    // Double rAF ensures layout is complete before scrolling (fixes mobile/tablet)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    });
  }, []);

  return null;
}
