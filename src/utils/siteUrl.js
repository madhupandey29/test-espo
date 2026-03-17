const stripTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');

const toAbsoluteUrl = (value = '') => {
  const trimmed = stripTrailingSlash(value);

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return '';
};

export const getSiteUrl = () => {
  const envSiteUrl = toAbsoluteUrl(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL
  );
  if (envSiteUrl) {
    return envSiteUrl;
  }

  const vercelProductionUrl = toAbsoluteUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : ''
  );
  if (vercelProductionUrl) {
    return vercelProductionUrl;
  }

  const vercelPreviewUrl = toAbsoluteUrl(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  );
  if (vercelPreviewUrl) {
    return vercelPreviewUrl;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
};
