'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthUserId } from '@/lib/auth-store';
import { fetchCartData } from '@/lib/cart-client';

export function getCartItemsFromResponse(cartData) {
  if (Array.isArray(cartData?.data?.items)) {
    return cartData.data.items;
  }

  if (Array.isArray(cartData?.items)) {
    return cartData.items;
  }

  return [];
}

export function getCartProductId(item) {
  return (
    item?.productId?._id ||
    item?.product?._id ||
    (typeof item?.productId === 'string' ? item.productId : null) ||
    item?._id ||
    item?.id ||
    null
  );
}

export default function useCartProducts(enabled = true) {
  const userId = useAuthUserId();
  const shouldFetch = enabled && Boolean(userId);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(() => shouldFetch);
  const [error, setError] = useState(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refetch = useCallback(async () => {
    const isInitialLoad = dataRef.current === undefined;

    if (!shouldFetch) {
      setData(undefined);
      setError(null);
      setIsLoading(false);
      return { data: undefined };
    }

    setIsLoading(isInitialLoad);
    setError(null);

    try {
      const nextData = await fetchCartData(userId);
      setData(nextData);
      return { data: nextData };
    } catch (fetchError) {
      setError(fetchError);
      return { error: fetchError };
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetch, userId]);

  useEffect(() => {
    if (!shouldFetch) {
      setData(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);
    void refetch();
  }, [shouldFetch, refetch]);

  useEffect(() => {
    if (!shouldFetch || typeof window === 'undefined') {
      return undefined;
    }

    const syncCart = () => {
      void refetch();
    };

    window.addEventListener('focus', syncCart);
    window.addEventListener('online', syncCart);

    return () => {
      window.removeEventListener('focus', syncCart);
      window.removeEventListener('online', syncCart);
    };
  }, [shouldFetch, refetch]);

  const cartItems = useMemo(() => getCartItemsFromResponse(data), [data]);
  const cartProductIds = useMemo(
    () =>
      new Set(
        cartItems.map((item) => String(getCartProductId(item))).filter(Boolean)
      ),
    [cartItems]
  );

  return {
    data,
    error,
    isLoading,
    userId,
    shouldFetch,
    cartItems,
    cartProductIds,
    refetch,
  };
}
