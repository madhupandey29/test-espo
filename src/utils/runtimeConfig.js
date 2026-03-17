const stripTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');
const INTERNAL_API_BASE = '/api/backend';
const isBrowserRuntime = () => typeof window !== 'undefined';

const toOrigin = (value = '') => {
  const normalized = stripTrailingSlash(value);

  if (!normalized) {
    return '';
  }

  try {
    return new URL(normalized).origin;
  } catch {
    return '';
  }
};

export const getApiBaseUrl = () =>
  isBrowserRuntime()
    ? INTERNAL_API_BASE
    : stripTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '');

export const getApiOrigin = () => {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl.startsWith('/')) {
    return isBrowserRuntime() ? window.location.origin : '';
  }

  return toOrigin(apiBaseUrl);
};

export const getSiteUrl = () =>
  stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');

export const getSiteOrigin = () => toOrigin(getSiteUrl());

export const getCdnBaseUrl = () =>
  stripTrailingSlash(process.env.NEXT_PUBLIC_CDN_BASE || '');

export const getCdnOrigin = () => toOrigin(getCdnBaseUrl());
