const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim() !== '' && value !== 'null' && value !== 'undefined';

const absoluteUrlPattern = /^(https?:)?\/\//i;

export const cleanImageUrl = (value) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const cleaned = cleanImageUrl(item);
      if (cleaned) return cleaned;
    }
    return '';
  }

  if (value && typeof value === 'object') {
    return cleanImageUrl(
      value.secure_url ||
        value.url ||
        value.path ||
        value.src ||
        value.key ||
        value.publicUrl ||
        value.imageUrl
    );
  }

  if (!isNonEmptyString(value)) {
    return '';
  }

  const normalized = value.trim().replace(/#$/, '');
  return normalized.startsWith('//') ? `https:${normalized}` : normalized;
};

export const isAbsoluteImageUrl = (value) => absoluteUrlPattern.test(value || '');

const uploadPathToAbsoluteUrl = (
  value,
  baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
) => {
  const cleaned = cleanImageUrl(value);
  if (!cleaned) return '';
  if (isAbsoluteImageUrl(cleaned)) return cleaned;

  const origin = String(baseUrl || '').replace(/\/+$/, '');
  if (!origin) {
    return cleaned.startsWith('/') ? cleaned : `/${cleaned.replace(/^\/+/, '')}`;
  }

  const normalizedPath = cleaned
    .replace(/^\/+/, '')
    .replace(/^api\/uploads\/?/i, '')
    .replace(/^uploads\/?/i, '');

  return `${origin}/uploads/${normalizedPath}`;
};

const getVariantCandidates = (prefix, index, variant) => {
  const slot = `${prefix}${index}`;

  switch (variant) {
    case 'card':
      return [`${slot}CloudUrlCard`, `${slot}CloudUrlWeb`, `${slot}CloudUrl`, slot];
    case 'hero':
      return [
        `${slot}CloudUrlHero`,
        `${slot}CloudUrlWeb`,
        `${slot}CloudUrlLarge`,
        `${slot}CloudUrl`,
        slot,
      ];
    case 'large':
      return [`${slot}CloudUrlLarge`, `${slot}CloudUrlWeb`, `${slot}CloudUrl`, slot];
    case 'metadata':
      return [
        `${slot}CloudUrlOg`,
        `${slot}CloudUrlTwitter`,
        `${slot}CloudUrlShare`,
        `${slot}CloudUrlLarge`,
        `${slot}CloudUrlHero`,
        `${slot}CloudUrlWeb`,
        `${slot}CloudUrl`,
        slot,
      ];
    case 'schema':
      return [`${slot}CloudUrlWeb`, `${slot}CloudUrlLarge`, `${slot}CloudUrl`, slot];
    case 'base':
      return [`${slot}CloudUrlBase`, `${slot}CloudUrlWeb`, `${slot}CloudUrl`, slot];
    case 'web':
    default:
      return [`${slot}CloudUrlWeb`, `${slot}CloudUrl`, slot];
  }
};

export const getImageVariantUrl = (
  entity,
  { prefix = 'image', index = 1, variant = 'web' } = {}
) => {
  if (!entity || typeof entity !== 'object') {
    return '';
  }

  const keys = getVariantCandidates(prefix, index, variant);
  for (const key of keys) {
    const cleaned = cleanImageUrl(entity?.[key]);
    if (cleaned) {
      return cleaned;
    }
  }

  return '';
};

export const getProductImageUrl = (
  product,
  { index = 1, variant = 'web', fallback = true, fallbackValues = [] } = {}
) => {
  const direct = getImageVariantUrl(product, { prefix: 'image', index, variant });
  if (direct) return direct;

  if (!fallback) {
    return '';
  }

  const candidates = [
    ...fallbackValues,
    product?.img,
    product?.image,
    product?.thumbnail,
    product?.images,
    product?.cover,
    product?.photo,
    product?.picture,
    product?.media,
  ];

  return uploadPathToAbsoluteUrl(candidates);
};

export const getProductGalleryImages = (
  product,
  { variant = 'web', includeVideoPoster = false } = {}
) => {
  const images = [1, 2, 3].map((index) => ({
    index,
    url: getProductImageUrl(product, {
      index,
      variant,
      fallbackValues: [product?.[`image${index}`]],
    }),
  }));

  const unique = [];
  const seen = new Set();

  for (const image of images) {
    if (!image.url || seen.has(image.url)) continue;
    seen.add(image.url);
    unique.push(image);
  }

  if (includeVideoPoster) {
    const poster = cleanImageUrl(product?.videoThumbnail);
    if (poster && !seen.has(poster)) {
      unique.push({ index: 'videoPoster', url: poster });
    }
  }

  return unique;
};

export const getCollectionImageUrl = (
  collection,
  { index = 1, variant = 'web', fallback = true } = {}
) => {
  const direct = getImageVariantUrl(collection, {
    prefix: 'collectionImage',
    index,
    variant,
  });
  if (direct) return direct;

  const legacyDirect = cleanImageUrl(collection?.[`collectionimage${index}CloudUrl`]);
  if (legacyDirect) return legacyDirect;

  if (!fallback) {
    return '';
  }

  return uploadPathToAbsoluteUrl([
    collection?.[`collectionImage${index}`],
    collection?.img,
    collection?.image,
  ]);
};

export const getAbsoluteSchemaImageUrl = (
  value,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
) => {
  const cleaned = cleanImageUrl(value);
  if (!cleaned) return '';
  if (isAbsoluteImageUrl(cleaned)) return cleaned;

  const origin = String(siteUrl || '').replace(/\/+$/, '');
  if (!origin) return cleaned;

  return `${origin}${cleaned.startsWith('/') ? cleaned : `/${cleaned}`}`;
};
