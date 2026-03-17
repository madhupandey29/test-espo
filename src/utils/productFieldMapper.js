import { cleanImageUrl, getProductGalleryImages } from './imageContract';

/**
 * Product Field Mapper - Handles differences between old and new API structures
 * 
 * Old API Structure:
 * - Fields were nested objects: category.name, substructure.name, etc.
 * - Arrays contained objects: color[].name, content[].name
 * - Used _id for identifiers
 * 
 * New API Structure:
 * - Fields are direct strings/arrays: category, structure, etc.
 * - Arrays contain strings: color[], content[]
 * - Uses id for identifiers
 */

/**
 * Get product ID - handles both old (_id) and new (id) formats
 */
export const getProductId = (product) => {
  return product?.id || product?._id || null;
};

/**
 * Get category name - handles both nested object and direct string
 */
export const getCategoryName = (product) => {
  if (typeof product?.category === 'string') {
    return product.category;
  }
  return product?.category?.name || '';
};

/**
 * Get structure name - handles substructure -> structure rename
 */
export const getStructureName = (product) => {
  if (product?.structure) {
    return typeof product.structure === 'string' ? product.structure : product.structure.name;
  }
  return product?.substructure?.name || '';
};

/**
 * Get content array - handles both object array and string array
 */
export const getContentArray = (product) => {
  if (!product?.content) return [];

  if (Array.isArray(product.content)) {
    if (typeof product.content[0] === 'string') {
      return product.content;
    }
    return product.content.map((item) => item?.name || '').filter(Boolean);
  }

  return [];
};

/**
 * Get first content name
 */
export const getContentName = (product) => {
  const contentArray = getContentArray(product);
  return contentArray[0] || '';
};

/**
 * Get design name - handles both nested object and direct string
 */
export const getDesignName = (product) => {
  if (typeof product?.design === 'string') {
    return product.design;
  }
  return product?.design?.name || '';
};

/**
 * Get color array - handles both object array and string array
 */
export const getColorArray = (product) => {
  if (!product?.color) return [];

  if (Array.isArray(product.color)) {
    if (typeof product.color[0] === 'string') {
      return product.color;
    }
    return product.color.map((item) => item?.name || '').filter(Boolean);
  }

  return [];
};

/**
 * Get first color name
 */
export const getColorName = (product) => {
  const colorArray = getColorArray(product);
  return colorArray[0] || '';
};

/**
 * Get finish array - handles subfinish -> finish rename and format change
 */
export const getFinishArray = (product) => {
  if (Array.isArray(product?.finish)) {
    return product.finish;
  }

  if (product?.subfinish?.name) {
    return [product.subfinish.name];
  }

  return [];
};

/**
 * Get first finish name
 */
export const getFinishName = (product) => {
  const finishArray = getFinishArray(product);
  return finishArray[0] || '';
};

/**
 * Get motif name - handles both nested object and direct string
 */
export const getMotifName = (product) => {
  if (typeof product?.motif === 'string') {
    return product.motif;
  }
  return product?.motif?.name || '';
};

/**
 * Get groupcode name - Note: groupcode removed in new API
 */
export const getGroupcodeName = (product) => {
  if (product?.groupcode?.name) {
    return product.groupcode.name;
  }
  return '';
};

/**
 * Get product weight in oz - handles oz -> ozs rename
 */
export const getProductOz = (product) => {
  return product?.ozs || product?.oz || 0;
};

/**
 * Get product images - handles new detailed image structure
 */
export const getProductImages = (product) => {
  return getProductGalleryImages(product, { variant: 'web' }).reduce((images, image) => {
    if (typeof image.index !== 'number') {
      return images;
    }

    const imageKey = `image${image.index}`;
    images[imageKey] = {
      url: image.url,
      alt:
        product?.[`altTextImage${image.index}`] ||
        product?.[`altimg${image.index}`] ||
        '',
      thumb: cleanImageUrl(product?.[`image${image.index}ThumbUrl`]),
      width: product?.[`image${image.index}Width`],
      height: product?.[`image${image.index}Height`],
    };

    return images;
  }, {});
};

/**
 * Get primary product image URL with hash cleaning
 */
export const getPrimaryImageUrl = (product) => {
  const images = getProductGalleryImages(product, { variant: 'web' });
  return images[0]?.url || '';
};

/**
 * Get product tags - handles productTag -> merchTags rename
 */
export const getProductTags = (product) => {
  if (Array.isArray(product?.merchTags)) {
    return product.merchTags;
  }
  if (Array.isArray(product?.productTag)) {
    return product.productTag;
  }
  return [];
};

/**
 * Get video URL - handles videourl -> videoURL rename
 */
export const getVideoUrl = (product) => {
  return product?.videoURL || product?.videourl || '';
};

/**
 * Get product slug - handles new productslug field
 */
export const getProductSlug = (product) => {
  return product?.productslug || product?.slug || '';
};

/**
 * Get suitable for array - handles subsuitable removal
 */
export const getSuitableArray = (product) => {
  if (Array.isArray(product?.subsuitable)) {
    return product.subsuitable;
  }
  return [];
};

/**
 * Get lead time array - handles leadtime removal
 */
export const getLeadTimeArray = (product) => {
  if (Array.isArray(product?.leadtime)) {
    return product.leadtime;
  }
  return [];
};

/**
 * Complete product field mapper - transforms product object to consistent format
 */
export const mapProductFields = (product) => {
  if (!product) return null;

  return {
    id: getProductId(product),
    name: product.name || '',
    slug: getProductSlug(product),
    category: getCategoryName(product),
    structure: getStructureName(product),
    content: getContentArray(product),
    contentName: getContentName(product),
    design: getDesignName(product),
    color: getColorArray(product),
    colorName: getColorName(product),
    finish: getFinishArray(product),
    finishName: getFinishName(product),
    motif: getMotifName(product),
    gsm: product.gsm || 0,
    oz: getProductOz(product),
    cm: product.cm || 0,
    inch: product.inch || 0,
    productTitle: product.productTitle || '',
    productTagline: product.productTagline || '',
    shortProductDescription: product.shortProductDescription || '',
    fullProductDescription: product.fullProductDescription || '',
    images: getProductImages(product),
    primaryImage: getPrimaryImageUrl(product),
    videoUrl: getVideoUrl(product),
    tags: getProductTags(product),
    rating: product.ratingValue || product.rating || 0,
    ratingCount: product.ratingCount || 0,
    salesMOQ: product.salesMOQ || 0,
    purchaseMOQ: product.purchaseMOQ || 0,
    purchasePrice: product.purchasePrice || 0,
    supplyModel: product.supplyModel || '',
    fabricCode: product.fabricCode || '',
    vendorFabricCode: product.vendorFabricCode || '',
    groupcode: getGroupcodeName(product),
    suitable: getSuitableArray(product),
    leadtime: getLeadTimeArray(product),
    createdAt: product.createdAt || '',
    modifiedAt: product.modifiedAt || product.updatedAt || '',
    _original: product,
  };
};

/**
 * Map array of products
 */
export const mapProductsArray = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(mapProductFields).filter(Boolean);
};
