'use client';

import React from 'react';

import ProductDetailsArea from '@/components/product-details/product-details-area';
import ProductDetailsLoader from '@/components/loader/prd-details-loader';
import ErrorMsg from '@/components/common/error-msg';

import { useGetSingleNewProductQuery } from '@/lib/content-api';
import {
  cleanImageUrl,
  getProductGalleryImages,
  getProductImageUrl,
} from '@/utils/imageContract';

function mapBackendProductToFrontend(p) {
  const mainImg = getProductImageUrl(p, { variant: 'web' }) || p.img || p.image || '';
  const galleryImages = getProductGalleryImages(p, { variant: 'web' }).map(({ url }) => url);
  const imageList = galleryImages.length > 0 ? galleryImages : [mainImg].filter(Boolean);
  const img1 = imageList[0] || '';
  const img2 = imageList[1] || '';
  const img3 = imageList[2] || '';
  const videoUrl = p.videoURL || p.videourl || p.video || '';
  const poster = cleanImageUrl(p.videoThumbnail) || '';

  const images = imageList.map((url) => ({ type: 'image', img: url }));

  if (videoUrl || poster) {
    images.push({ type: 'video', img: poster || mainImg || img1 || img2 || img3, video: videoUrl });
  }

  return {
    _id: p.id || p._id,
    slug: p.productslug || p.slug,
    title: p.name || p.productTitle || p.title,
    productTitle: p.productTitle,
    img: mainImg,
    image1: img1,
    image2: img2,
    image3: img3,
    video: videoUrl,
    videourl: videoUrl,
    videoThumbnail: poster,
    color: p.color || p.colors || [],
    colors: p.colors || p.color || [],
    motif: p.motif || p.motifsize || null,
    motifId: (p.motif && p.motif._id) || p.motif || p.motifsize || null,
    imageURLs: images,
    videoId: videoUrl,
    price: p.salesPrice || p.price,
    description: p.fullProductDescription || p.description || p.productdescription || '',
    shortDescription: p.shortProductDescription || '',
    fullProductDescription: p.fullProductDescription || p.description || p.productdescription || '',
    shortProductDescription: p.shortProductDescription || '',
    status: p.status || 'in-stock',
    sku: p.sku || p.fabricCode,
    category: p.category || '',
    categoryId: p.category?._id || p.category || '',
    structure: p.structure || '',
    structureId: p.structure?._id || p.structure || '',
    content: p.content || [],
    contentId: p.content?._id || p.content || '',
    finish: p.finish || [],
    finishId: p.finish?._id || p.finish || '',
    design: p.design || '',
    designId: p.design?._id || p.design || '',
    motifsizeId: p.motif?._id || p.motif || '',
    suitableforId: p.subsuitable?._id || p.subsuitable || '',
    vendorId: p.vendor?._id || p.vendor || '',
    collectionId: p.collectionId || p.collection?.id || '',
    collection: p.collection || null,
    gsm: p.gsm,
    oz: p.ozs || p.oz,
    cm: p.cm,
    inch: p.inch,
    productIdentifier: p.productIdentifier || p.fabricCode,
    width: p.cm
      ? `${p.cm} cm`
      : p.inch
        ? `${p.inch} inch`
        : 'N/A',
    tags: p.tags || p.merchTags || [],
    offerDate: p.offerDate || { endDate: null },
    additionalInformation: p.additionalInformation || [],
    highlights: p.highlights || [],
    productQ1: p.productQ1,
    productA1: p.productA1,
    productQ2: p.productQ2,
    productA2: p.productA2,
    productQ3: p.productQ3,
    productA3: p.productA3,
    productQ4: p.productQ4,
    productA4: p.productA4,
    productQ5: p.productQ5,
    productA5: p.productA5,
    productQ6: p.productQ6,
    productA6: p.productA6,
    ratingCount: p.ratingCount,
    ratingValue: p.ratingValue,
    keywords: p.keywords || [],
    supplyModel: p.supplyModel,
    salesMOQ: p.salesMOQ,
    uM: p.uM,
    suitability: p.suitability || [],
    aiTempOutput: p.aiTempOutput || '',
    subsuitable: p.subsuitable || [],
    altTextImage1: p.altTextImage1 || '',
    altTextImage2: p.altTextImage2 || '',
    altTextImage3: p.altTextImage3 || '',
    altTextVideo: p.altTextVideo || '',
  };
}

/**
 * Generic Product Details Client Component
 * 
 * @param {Object} props
 * @param {string} props.slug - Product slug
 * @param {Object} props.initialProduct - Initial product data from server
 * @param {string} props.category - Category identifier (optional, for future use)
 */
export default function ProductDetailsClient({ slug, initialProduct = null, category = 'product' }) {
  const cleanSlug = slug ? String(slug).replace(/#$/, '') : slug;

  const {
    data: productData,
    isLoading,
    isError,
  } = useGetSingleNewProductQuery(cleanSlug, { skip: !cleanSlug || !!initialProduct });

  if (initialProduct) {
    const product = mapBackendProductToFrontend(initialProduct?.data ?? initialProduct);
    return <ProductDetailsArea product={product} />;
  }

  if (isLoading) return <ProductDetailsLoader loading />;
  if (isError) return <ErrorMsg msg="There was an error loading the product" />;
  if (!productData?.data) return <ErrorMsg msg="Product not found. Please check the URL or try again." />;

  const product = mapBackendProductToFrontend(productData.data);

  return <ProductDetailsArea product={product} />;
}
