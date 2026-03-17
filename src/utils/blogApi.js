import { getApiBaseUrl } from './runtimeConfig';

const stripTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');
const normalizePath = (value = '/blog') => {
  const trimmed = String(value || '/blog').trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/blog';
};

export const getBlogApiUrl = () => {
  const apiBaseUrl = stripTrailingSlash(getApiBaseUrl());

  if (!apiBaseUrl) {
    return '';
  }

  return `${apiBaseUrl}${normalizePath(process.env.NEXT_PUBLIC_API_BLOG_PATH || '/blog')}`;
};
