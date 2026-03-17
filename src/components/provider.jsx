'use client';

import React from 'react';
import ClientOnlyFloating from '@/components/common/ClientOnlyFloating';

export default function Providers({ children }) {
  return (
    <>
      {children}
      <ClientOnlyFloating />
    </>
  );
}
