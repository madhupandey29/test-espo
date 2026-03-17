const IMAGE_ASSET_EXTENSIONS = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:$|[?#])/i;

const PLATFORM_HOSTS = {
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
  youtube: ['youtube.com', 'youtu.be'],
  twitter: ['twitter.com', 'x.com'],
  pinterest: ['pinterest.com', 'pin.it'],
};

const hasAllowedHost = (hostname, platform) => {
  const allowedHosts = PLATFORM_HOSTS[platform];

  if (!allowedHosts?.length) {
    return true;
  }

  return allowedHosts.some(
    (allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
  );
};

export const normalizeSocialUrl = (value, platform) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || IMAGE_ASSET_EXTENSIONS.test(trimmed)) {
    return '';
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.startsWith('//')
      ? `https:${trimmed}`
      : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }

    if (IMAGE_ASSET_EXTENSIONS.test(url.pathname)) {
      return '';
    }

    if (!hasAllowedHost(url.hostname.toLowerCase(), platform)) {
      return '';
    }

    return url.toString();
  } catch {
    return '';
  }
};
