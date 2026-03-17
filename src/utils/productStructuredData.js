import { getAbsoluteSchemaImageUrl, getProductGalleryImages } from './imageContract';
import { getSiteUrl } from './siteUrl';

/**
 * Generate JSON-LD structured data for product pages
 * @param {Object} product - Product data from API
 * @returns {Object} JSON-LD structured data object
 */
export const generateProductStructuredData = (product) => {
  if (!product) return null;

  const baseUrl = getSiteUrl();

  const cleanSlug = (slug) => {
    if (!slug || typeof slug !== 'string') return '';
    return slug.trim().replace(/#$/, '');
  };

  const productSlug = cleanSlug(
    product.productslug ||
    product.slug ||
    product.aiTempOutput ||
    product.fabricCode ||
    product.id
  );

  const productUrl = productSlug ? `${baseUrl}/fabric/${productSlug}` : baseUrl;

  const uniqueImages = getProductGalleryImages(product, { variant: 'schema' })
    .map(({ url }) => getAbsoluteSchemaImageUrl(url, baseUrl))
    .filter(Boolean);

  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    '@id': productUrl,
    name: product.productTitle || product.name || 'Product',
    description: product.fullProductDescription || product.shortProductDescription || product.description || '',
    url: productUrl,
  };

  if (product.sku || product.fabricCode || product.productIdentifier) {
    productSchema.sku = product.sku || product.fabricCode || product.productIdentifier;
  }

  if (uniqueImages.length > 0) {
    productSchema.image = uniqueImages.length === 1 ? uniqueImages[0] : uniqueImages;
  }

  productSchema.brand = {
    '@type': 'Brand',
    name: 'Amrita Global Enterprises',
  };

  if (product.ratingValue && product.ratingCount && parseInt(product.ratingCount) > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue.toString(),
      bestRating: '5',
      worstRating: '1',
      ratingCount: product.ratingCount.toString(),
    };
  } else {
    productSchema.offers = {
      '@type': 'Offer',
      url: productUrl,
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    };
  }

  const additionalProperties = [];

  if (product.content) {
    const contentValue = Array.isArray(product.content)
      ? product.content.join(', ')
      : product.content;
    if (contentValue && contentValue !== 'N/A') {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Content',
        value: contentValue,
      });
    }
  }

  const cmNum = product.cm || product.width;
  const inchNum = product.inch;
  if (cmNum || inchNum) {
    const widthParts = [];
    if (cmNum) widthParts.push(`${cmNum} cm`);
    if (inchNum) widthParts.push(`${Math.round(inchNum)} inch`);
    const widthValue = widthParts.join(' / ');
    if (widthValue) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Width',
        value: widthValue,
      });
    }
  }

  if (product.gsm || product.oz) {
    const weightParts = [];
    if (product.gsm) weightParts.push(`${product.gsm} gsm`);
    if (product.oz) weightParts.push(`${Number(product.oz).toFixed(1)} oz`);
    const weightValue = weightParts.join(' / ');
    if (weightValue) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Weight',
        value: weightValue,
      });
    }
  }

  if (product.design) {
    const designValue = typeof product.design === 'object'
      ? product.design.name
      : product.design;
    if (designValue && designValue !== 'N/A') {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Design',
        value: designValue,
      });
    }
  }

  if (product.structure && product.structure !== 'N/A') {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Structure',
      value: product.structure,
    });
  }

  if (product.colors || product.color) {
    const colorsArray = Array.isArray(product.colors)
      ? product.colors
      : Array.isArray(product.color)
        ? product.color
        : [];
    const colorNames = colorsArray
      .map((c) => (typeof c === 'string' ? c : c?.name))
      .filter(Boolean);
    if (colorNames.length > 0) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Colors',
        value: colorNames.join(', '),
      });
    }
  }

  if (product.motif || product.motifsize) {
    const motifValue = typeof product.motif === 'object'
      ? (product.motif.name || product.motif.size)
      : (product.motif || product.motifsize);
    if (motifValue && motifValue !== 'N/A') {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Motif',
        value: motifValue,
      });
    }
  }

  if (product.salesMOQ) {
    const moqValue = product.uM
      ? `${product.salesMOQ} ${product.uM}`
      : product.salesMOQ;
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Sales MOQ',
      value: moqValue.toString(),
    });
  }

  if (product.finish) {
    let finishArray = [];
    if (Array.isArray(product.finish)) {
      finishArray = product.finish.filter(Boolean);
    } else {
      const str = String(product.finish);
      finishArray = str
        .split(/[•,;]|\s-\s/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const cleanedFinishArray = finishArray.map((finish) => {
      let cleaned = finish.trim();
      cleaned = cleaned.replace(/^Chemical\s*-\s*/i, '');
      cleaned = cleaned.replace(/^Mechanical\s*-\s*/i, '');
      return cleaned;
    }).filter(Boolean);

    if (cleanedFinishArray.length > 0) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Finish',
        value: cleanedFinishArray.join(', '),
      });
    }
  }

  if (additionalProperties.length > 0) {
    productSchema.additionalProperty = additionalProperties;
  }

  return productSchema;
};

/**
 * Generate JSON-LD script tag for product pages
 * @param {Object} product - Product data from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateProductJsonLdScript = (product) => {
  const structuredData = generateProductStructuredData(product);

  if (!structuredData) return '';

  return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
};
