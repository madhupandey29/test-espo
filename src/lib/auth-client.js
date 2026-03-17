import {
  clearAuthSession,
  getAuthUserId,
  hydrateAuthFromStorage,
} from '@/lib/auth-store';
import { getApiBaseUrl } from '@/utils/runtimeConfig';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || 'x-api-key';

const normalizePath = (path = '') => String(path || '').replace(/^\/+/, '');

function buildRequestUrl(path) {
  const normalizedPath = normalizePath(path);
  const apiBase = getApiBaseUrl();

  return apiBase ? `${apiBase}/${normalizedPath}` : `/${normalizedPath}`;
}

function buildHeaders(headers, body) {
  const nextHeaders = new Headers(headers || {});

  if (API_KEY) {
    nextHeaders.set(API_KEY_HEADER, API_KEY);
  }

  if (!(body instanceof FormData) && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  return nextHeaders;
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function toAuthError(status, data, fallbackMessage) {
  const message =
    data?.message ||
    data?.error ||
    (typeof data === 'string' ? data : '') ||
    fallbackMessage ||
    'Request failed';

  return {
    status: status || 'CUSTOM_ERROR',
    data: {
      ...(data && typeof data === 'object' ? data : {}),
      message,
      error: data?.error || message,
    },
    message,
  };
}

async function authRequest(path, options = {}) {
  const { body, headers, method = 'GET', ...rest } = options;
  const nextHeaders = buildHeaders(headers, body);
  const nextBody =
    body === undefined || body instanceof FormData || typeof body === 'string'
      ? body
      : JSON.stringify(body);

  let response;
  let data;

  try {
    response = await fetch(buildRequestUrl(path), {
      method,
      credentials: 'include',
      headers: nextHeaders,
      body: nextBody,
      ...rest,
    });
    data = await parseResponse(response);
  } catch (error) {
    throw toAuthError('FETCH_ERROR', undefined, error?.message || 'Network request failed');
  }

  if (!response.ok) {
    throw toAuthError(response.status, data, response.statusText);
  }

  return data;
}

export function buildSessionInfo(user, userId) {
  const resolvedUserId = userId || user?._id || user?.id || getAuthUserId() || '';
  const resolvedUser =
    user || (resolvedUserId ? { id: resolvedUserId, _id: resolvedUserId } : undefined);

  return resolvedUser
    ? {
        session: { user: resolvedUser },
        user: resolvedUser,
      }
    : undefined;
}

export function getSessionInfo(userId) {
  const authState = hydrateAuthFromStorage();
  return buildSessionInfo(authState.user, userId || authState.userId);
}

export async function logoutUser() {
  clearAuthSession();
  return {
    success: true,
    message: 'Logged out successfully',
  };
}

export function confirmEmail(token) {
  return authRequest(`users/verify-email/${token}`, {
    method: 'GET',
    cache: 'no-store',
  });
}

export function requestPasswordReset({ verifyEmail }) {
  return authRequest('users/password/forgot/request', {
    method: 'POST',
    body: { email: verifyEmail },
  });
}

export function confirmForgotPassword({ password, token }) {
  return authRequest('users/password/forgot/confirm', {
    method: 'POST',
    body: { password, token },
  });
}
