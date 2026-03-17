import Cookies from 'js-cookie';
import { useSyncExternalStore } from 'react';

const USER_INFO_COOKIE = 'userInfo';
const USER_ID_STORAGE_KEY = 'userId';
const SESSION_ID_STORAGE_KEY = 'sessionId';
const COOKIE_OPTIONS = {
  expires: 7,
  sameSite: 'lax',
  path: '/',
};
const emptyState = Object.freeze({
  accessToken: undefined,
  user: undefined,
  userId: undefined,
});

function createAuthStore(initialState) {
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

const authStore = createAuthStore({ ...emptyState });
let storageSyncBound = false;

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function readStoredUserId() {
  if (!canUseDOM()) {
    return undefined;
  }

  try {
    return window.localStorage.getItem(USER_ID_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

function writeStoredUserId(userId) {
  if (!canUseDOM()) {
    return;
  }

  try {
    if (userId) {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
    } else {
      window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

function readUserInfoCookie() {
  if (!canUseDOM()) {
    return {};
  }

  try {
    const rawCookie = Cookies.get(USER_INFO_COOKIE);
    return rawCookie ? JSON.parse(rawCookie) : {};
  } catch {
    return {};
  }
}

function getCookieUser(cookieData) {
  if (!cookieData || typeof cookieData !== 'object' || Array.isArray(cookieData)) {
    return undefined;
  }

  if (cookieData.user && typeof cookieData.user === 'object') {
    return cookieData.user;
  }

  if (
    cookieData._id ||
    cookieData.id ||
    cookieData.email ||
    cookieData.name ||
    cookieData.firstName ||
    cookieData.lastName
  ) {
    return cookieData;
  }

  return undefined;
}

function resolveUserId(userId, user) {
  return userId || user?._id || user?.id || readStoredUserId() || undefined;
}

function readBrowserState() {
  const cookieData = readUserInfoCookie();
  const user = getCookieUser(cookieData);

  return {
    accessToken: cookieData?.accessToken,
    user,
    userId: resolveUserId(undefined, user),
  };
}

function ensureStorageSync() {
  if (!canUseDOM() || storageSyncBound) {
    return;
  }

  storageSyncBound = true;

  window.addEventListener('storage', (event) => {
    if (!event.key || event.key === USER_ID_STORAGE_KEY || event.key === SESSION_ID_STORAGE_KEY) {
      hydrateAuthFromStorage();
    }
  });
}

function setSnapshot(nextStateOrUpdater) {
  authStore.setState((currentState) => {
    const nextState =
      typeof nextStateOrUpdater === 'function'
        ? nextStateOrUpdater(currentState)
        : nextStateOrUpdater;

    if (
      currentState.accessToken === nextState.accessToken &&
      currentState.user === nextState.user &&
      currentState.userId === nextState.userId
    ) {
      return currentState;
    }

    return nextState;
  });
}

function persistUserInfoCookie({ accessToken, user }) {
  if (!canUseDOM()) {
    return;
  }

  const previousCookie = readUserInfoCookie();
  const nextCookie = { ...previousCookie };

  if (accessToken !== undefined) {
    nextCookie.accessToken = accessToken;
  }

  if (user !== undefined) {
    nextCookie.user = user;
  }

  if (!nextCookie.user && nextCookie.accessToken === undefined) {
    Cookies.remove(USER_INFO_COOKIE, { path: '/' });
    return;
  }

  Cookies.set(USER_INFO_COOKIE, JSON.stringify(nextCookie), COOKIE_OPTIONS);
}

export function getAuthState() {
  ensureStorageSync();
  return authStore.getSnapshot();
}

export function getAuthUserId() {
  return getAuthState().userId || readStoredUserId() || undefined;
}

export function hydrateAuthFromStorage() {
  ensureStorageSync();

  if (!canUseDOM()) {
    return authStore.getSnapshot();
  }

  const browserState = readBrowserState();
  setSnapshot(browserState);
  return authStore.getSnapshot();
}

export function setAuthSession({ accessToken, user, userId } = {}) {
  ensureStorageSync();

  setSnapshot((currentState) => {
    const nextUser = user === undefined ? currentState.user : user;
    const nextAccessToken =
      accessToken === undefined ? currentState.accessToken : accessToken;
    const nextUserId = resolveUserId(userId, nextUser) || currentState.userId;

    persistUserInfoCookie({
      accessToken: nextAccessToken,
      user: nextUser,
    });
    writeStoredUserId(nextUserId);

    return {
      accessToken: nextAccessToken,
      user: nextUser,
      userId: nextUserId,
    };
  });

  return authStore.getSnapshot();
}

export function setAuthUserId(userId) {
  ensureStorageSync();

  setSnapshot((currentState) => {
    const nextUserId = userId ? String(userId) : undefined;
    writeStoredUserId(nextUserId);

    return {
      ...currentState,
      userId: nextUserId,
    };
  });

  return authStore.getSnapshot();
}

export function clearAuthSession() {
  ensureStorageSync();

  if (canUseDOM()) {
    try {
      window.localStorage.removeItem(USER_ID_STORAGE_KEY);
      window.localStorage.removeItem(SESSION_ID_STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }

    Cookies.remove(USER_INFO_COOKIE, { path: '/' });
    Cookies.remove(SESSION_ID_STORAGE_KEY, { path: '/' });
    Cookies.remove(USER_ID_STORAGE_KEY, { path: '/' });
  }

  setSnapshot({ ...emptyState });
  return authStore.getSnapshot();
}

export function useAuthState() {
  ensureStorageSync();

  return useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot
  );
}

export function useAuthUserId() {
  return useAuthState().userId || null;
}

export function useAuthUser() {
  return useAuthState().user || null;
}

if (canUseDOM()) {
  hydrateAuthFromStorage();
}
