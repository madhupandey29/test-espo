'use client';

import { useSyncExternalStore } from 'react';
import { notifyError, notifySuccess } from '@/utils/toast';
import { debugLog } from '@/utils/debugLog';
import { getComparableEntityId } from '@/utils/entityId';
import { getApiBaseUrl } from '@/utils/runtimeConfig';
import { getAuthUserId } from '@/lib/auth-store';

function getWishlistBase() {
  const apiBase = getApiBaseUrl();

  if (!apiBase) {
    throw new Error('API base URL is not configured.');
  }

  return `${apiBase}/wishlist`;
}

const emptyState = Object.freeze({
  wishlist: [],
  loading: false,
  error: null,
  currentUserId: null,
});

function createWishlistStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setState(nextStateOrUpdater) {
      const nextState =
        typeof nextStateOrUpdater === 'function'
          ? nextStateOrUpdater(state)
          : nextStateOrUpdater;

      if (Object.is(nextState, state)) {
        return;
      }

      state = nextState;
      listeners.forEach((listener) => listener());
    },
  };
}

const wishlistStore = createWishlistStore({ ...emptyState });
let activeFetch = null;

function setWishlistState(nextStateOrUpdater) {
  wishlistStore.setState((currentState) => {
    const nextState =
      typeof nextStateOrUpdater === 'function'
        ? nextStateOrUpdater(currentState)
        : nextStateOrUpdater;

    if (
      currentState.wishlist === nextState.wishlist &&
      currentState.loading === nextState.loading &&
      currentState.error === nextState.error &&
      currentState.currentUserId === nextState.currentUserId
    ) {
      return currentState;
    }

    return nextState;
  });
}

function getWishlistProductId(value) {
  return String(getComparableEntityId(value) || '');
}

function shouldKeepWishlistItem(item) {
  return !item?.itemType || item.itemType === 'wishlist';
}

function normalizeWishlistItem(item) {
  if (!item) {
    return null;
  }

  const original = item.__originalWishlistItem || item;
  const product =
    original.product && typeof original.product === 'object'
      ? original.product
      : item.product && typeof item.product === 'object'
      ? item.product
      : null;
  const productId = getComparableEntityId(
    original.productId ||
      item.productId ||
      item._id ||
      item.id ||
      product
  );

  if (!productId) {
    return null;
  }

  const normalizedProductId = String(productId);
  const wishlistItemId =
    item.wishlistItemId ||
    item.__originalWishlistItem?.id ||
    original.wishlistItemId ||
    original.id ||
    null;

  return {
    ...(product || {}),
    ...item,
    wishlistItemId,
    customerAccountId: original.customerAccountId || item.customerAccountId || null,
    itemType: original.itemType || item.itemType || 'wishlist',
    _id: normalizedProductId,
    id: normalizedProductId,
    productId: normalizedProductId,
    name:
      original.productName ||
      item.productName ||
      product?.name ||
      item.name,
    title:
      original.productName ||
      item.productName ||
      product?.name ||
      item.title,
    product: product || item.product || null,
    __originalWishlistItem: item.__originalWishlistItem || original,
  };
}

export function normalizeWishlistItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter(shouldKeepWishlistItem)
    .map(normalizeWishlistItem)
    .filter(Boolean);
}

export function getWishlistState() {
  return wishlistStore.getSnapshot();
}

export function useWishlistState() {
  return useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getSnapshot
  );
}

export function useWishlistItems() {
  return useWishlistState().wishlist;
}

export function useWishlistCount() {
  return useWishlistItems().length;
}

export function clear_wishlist() {
  activeFetch = null;
  setWishlistState({ ...emptyState });
}

export function clear_wishlist_for_user_switch() {
  activeFetch = null;
  setWishlistState((state) => {
    if (
      state.wishlist.length === 0 &&
      !state.loading &&
      !state.error &&
      state.currentUserId === null
    ) {
      return state;
    }

    return {
      wishlist: [],
      loading: false,
      error: null,
      currentUserId: null,
    };
  });
}

export async function fetchWishlist(customerAccountId, options = {}) {
  if (!customerAccountId) {
    clear_wishlist_for_user_switch();
    return [];
  }

  if (!options.force && activeFetch?.userId === customerAccountId) {
    return activeFetch.promise;
  }

  const requestKey = Symbol(`wishlist:${customerAccountId}`);

  setWishlistState((state) => ({
    ...state,
    loading: true,
    error: null,
    currentUserId: customerAccountId,
  }));

  const requestPromise = (async () => {
    try {
      const url = `${getWishlistBase()}/fieldname/customerAccountId/${encodeURIComponent(
        customerAccountId
      )}`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`GET wishlist ${response.status}`);
      }

      const json = await response.json();
      const items = normalizeWishlistItems(
        json.success && Array.isArray(json.data) ? json.data : []
      );

      if (activeFetch?.requestKey === requestKey) {
        setWishlistState((state) => ({
          ...state,
          wishlist: items,
          loading: false,
          error: null,
          currentUserId: customerAccountId,
        }));
      }

      return items;
    } catch (error) {
      if (activeFetch?.requestKey === requestKey) {
        setWishlistState((state) => ({
          ...state,
          loading: false,
          error: error.message || 'Failed fetching wishlist',
          currentUserId: customerAccountId,
        }));
      }

      throw error;
    } finally {
      if (activeFetch?.requestKey === requestKey) {
        activeFetch = null;
      }
    }
  })();

  activeFetch = {
    userId: customerAccountId,
    requestKey,
    promise: requestPromise,
  };

  return requestPromise;
}

async function addToWishlistApi(customerAccountId, productId) {
  const response = await fetch(getWishlistBase(), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerAccountId, productId }),
  });

  if (!response.ok) {
    throw new Error(`POST wishlist ${response.status}`);
  }

  return response.json();
}

async function removeFromWishlistApi(wishlistItemId, customerAccountId, productId) {
  const url = `${getWishlistBase()}/${encodeURIComponent(wishlistItemId)}`;

  debugLog('DELETE API Call:', {
    url,
    wishlistItemId,
    customerAccountId,
    productId,
  });

  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ customerAccountId, productId }),
  });

  debugLog('DELETE Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DELETE wishlist ${response.status}: ${errorText}`);
  }

  return response.json();
}

function buildFallbackWishlistItem(customerAccountId, productId, product) {
  return normalizeWishlistItem({
    wishlistItemId: `temp-${Date.now()}`,
    customerAccountId,
    itemType: 'wishlist',
    productId,
    name: product?.title || product?.name || 'Product',
    title: product?.title || product?.name || 'Product',
    product: product?.product || product,
  });
}

export async function toggleWishlistItem({ customerAccountId, product }) {
  try {
    if (!customerAccountId) {
      throw new Error('Not logged in');
    }

    const current = getWishlistState().wishlist || [];
    const productId = getWishlistProductId(product);

    if (!productId) {
      throw new Error('Product ID missing');
    }

    const existingItem = current.find(
      (item) => getWishlistProductId(item) === productId
    );

    if (existingItem) {
      const wishlistItemId =
        existingItem.wishlistItemId || existingItem.__originalWishlistItem?.id;

      if (!wishlistItemId) {
        throw new Error('Wishlist item ID not found');
      }

      await removeFromWishlistApi(wishlistItemId, customerAccountId, productId);
      notifyError('Removed from wishlist');

      const nextWishlist = current.filter(
        (item) =>
          (item.wishlistItemId || item.__originalWishlistItem?.id) !==
          wishlistItemId
      );

      activeFetch = null;
      setWishlistState((state) => ({
        ...state,
        wishlist: nextWishlist,
        loading: false,
        error: null,
        currentUserId: customerAccountId,
      }));

      return nextWishlist;
    }

    const json = await addToWishlistApi(customerAccountId, productId);
    notifySuccess('Added to wishlist');

    const nextWishlist =
      json.success && Array.isArray(json.data)
        ? normalizeWishlistItems(json.data)
        : [...current, buildFallbackWishlistItem(customerAccountId, productId, product)].filter(Boolean);

    activeFetch = null;
    setWishlistState((state) => ({
      ...state,
      wishlist: nextWishlist,
      loading: false,
      error: null,
      currentUserId: customerAccountId,
    }));

    return nextWishlist;
  } catch (error) {
    setWishlistState((state) => ({
      ...state,
      loading: false,
      error: error.message || 'Failed updating wishlist',
      currentUserId: customerAccountId || state.currentUserId,
    }));
    throw error;
  }
}

export function add_to_wishlist(product) {
  const customerAccountId =
    getWishlistState().currentUserId || getAuthUserId();

  if (!customerAccountId) {
    notifyError('Please login to use wishlist');
    return Promise.resolve([]);
  }

  return toggleWishlistItem({ customerAccountId, product });
}

export async function removeWishlistItem({
  customerAccountId,
  productId,
  title,
}) {
  try {
    if (!customerAccountId) {
      throw new Error('Not logged in');
    }

    const normalizedProductId = getWishlistProductId(productId);

    if (!normalizedProductId) {
      throw new Error('Product ID missing');
    }

    const current = getWishlistState().wishlist || [];
    const item = current.find(
      (wishlistItem) => getWishlistProductId(wishlistItem) === normalizedProductId
    );

    if (!item) {
      throw new Error('Item not found in wishlist');
    }

    const wishlistItemId =
      item.wishlistItemId || item.__originalWishlistItem?.id;

    if (!wishlistItemId) {
      throw new Error('Wishlist item ID not found');
    }

    await removeFromWishlistApi(
      wishlistItemId,
      customerAccountId,
      normalizedProductId
    );

    notifyError(`${title || 'Item'} removed from wishlist`);

    const nextWishlist = current.filter(
      (wishlistItem) =>
        (wishlistItem.wishlistItemId || wishlistItem.__originalWishlistItem?.id) !==
        wishlistItemId
    );

    activeFetch = null;
    setWishlistState((state) => ({
      ...state,
      wishlist: nextWishlist,
      loading: false,
      error: null,
      currentUserId: customerAccountId,
    }));

    return nextWishlist;
  } catch (error) {
    setWishlistState((state) => ({
      ...state,
      loading: false,
      error: error.message || 'Failed removing wishlist item',
      currentUserId: customerAccountId || state.currentUserId,
    }));
    throw error;
  }
}
