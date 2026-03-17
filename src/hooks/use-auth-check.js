'use client';

import { useEffect, useState } from 'react';
import { hydrateAuthFromStorage } from '@/lib/auth-store';

export default function useAuthCheck() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    hydrateAuthFromStorage();
    setAuthChecked(true);
  }, []);

  return authChecked;
}
