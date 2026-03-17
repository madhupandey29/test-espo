'use client';

import { useEffect, useRef } from 'react';
import { useAuthUserId } from '@/lib/auth-store';
import {
  clear_wishlist_for_user_switch,
  fetchWishlist,
  useWishlistState,
} from '@/lib/wishlist-store';

export default function useWishlistManager() {
  const userId = useAuthUserId();
  const { currentUserId, wishlist, loading, error } = useWishlistState();
  const previousUserIdRef = useRef(null);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;

    if (previousUserId === userId) {
      if (userId && currentUserId !== userId && !loading) {
        void fetchWishlist(userId);
      }

      return;
    }

    previousUserIdRef.current = userId ?? null;

    if (previousUserId && previousUserId !== userId) {
      clear_wishlist_for_user_switch();
    }

    if (userId) {
      void fetchWishlist(userId);
      return;
    }

    clear_wishlist_for_user_switch();
  }, [userId, currentUserId, loading]);

  useEffect(() => {
    const handleFocus = () => {
      if (userId && currentUserId !== userId) {
        void fetchWishlist(userId);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        userId &&
        currentUserId !== userId
      ) {
        void fetchWishlist(userId);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === 'userId' && event.newValue !== event.oldValue) {
        if (event.newValue) {
          void fetchWishlist(event.newValue, { force: true });
          return;
        }

        clear_wishlist_for_user_switch();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId, currentUserId]);

  return {
    userId,
    currentUserId,
    wishlist,
    loading: loading || (Boolean(userId) && currentUserId !== userId),
    error,
    isUserSwitched:
      Boolean(previousUserIdRef.current) &&
      previousUserIdRef.current !== userId,
    refreshWishlist: () =>
      userId ? fetchWishlist(userId, { force: true }) : Promise.resolve([]),
  };
}
