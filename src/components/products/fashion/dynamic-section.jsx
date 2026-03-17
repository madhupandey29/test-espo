'use client';
import { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Image from 'next/image';
import Link from 'next/link';

import ErrorMsg from '@/components/common/error-msg';
import { HomeTwoFeaturedPrdLoader } from '@/components/loader';
import { getProductImageUrl } from '@/utils/imageContract';

function getImageUrl(item) {
  const p = item?.product || item;
  return getProductImageUrl(p, { variant: 'card' }) || '/assets/img/product/product-1.jpg';
}

const SLIDER_SETTINGS = {
  slidesPerView: 1,
  spaceBetween: 20,
  loop: false,
  centeredSlides: false,
  touchRatio: 1,
  touchAngle: 45,
  simulateTouch: true,
  allowTouchMove: true,
  touchStartPreventDefault: false,
  touchMoveStopPropagation: false,
  resistanceRatio: 0.85,
  threshold: 5,
  longSwipesRatio: 0.5,
  longSwipesMs: 300,
  followFinger: true,
  grabCursor: true,
  touchEventsTarget: 'container',
  passiveListeners: false,
  watchSlidesProgress: true,
  breakpoints: {
    1400: {
      slidesPerView: 5,
      spaceBetween: 24,
    },
    1200: {
      slidesPerView: 4,
      spaceBetween: 20,
    },
    992: {
      slidesPerView: 3,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 16,
    },
    576: {
      slidesPerView: 2,
      spaceBetween: 12,
    },
    0: {
      slidesPerView: 1,
      spaceBetween: 10,
    },
  },
  keyboard: { enabled: true, onlyInViewport: true },
};

const CARD_W = 280;
const CARD_H = 280;

// Helper function to get product category path
const getProductCategoryPath = (product) => {
  const category = product?.category;
  
  if (!category) return '/fabric'; // Default fallback
  
  const categoryLower = String(category).toLowerCase().trim();
  
  // Map category to route path - handles various category naming patterns from API
  // Categories from API: "Woven Fabrics", "Fashion", "Accessories", etc.
  
  // Fabric-related categories
  if (
    categoryLower === 'fabric' ||
    categoryLower === 'fabrics' ||
    categoryLower === 'woven fabrics' ||
    categoryLower === 'woven fabric' ||
    categoryLower === 'knit fabrics' ||
    categoryLower === 'knit fabric' ||
    categoryLower.includes('fabric')
  ) {
    return '/fabric';
  }
  
  // Fashion-related categories
  if (
    categoryLower === 'fashion' ||
    categoryLower === 'apparel' ||
    categoryLower === 'clothing' ||
    categoryLower.includes('fashion')
  ) {
    return '/fashion';
  }
  
  // Accessories-related categories
  if (
    categoryLower === 'accessories' ||
    categoryLower === 'accessory' ||
    categoryLower.includes('accessories')
  ) {
    return '/accessories';
  }
  
  // Default to fabric if no match
  console.warn(`Unknown category "${category}" - defaulting to /fabric`);
  return '/fabric';
};

const DynamicSection = ({ 
  sectionId, 
  sectionTitle = 'Featured Collection',
  products = [],
  isLoading = false,
  error = null,
  categoryPath = null, // ⚠️ DEPRECATED - Now auto-detected per product
  sectionPath = null,  // ✅ Path for "View All" button (e.g., '/dynamicsection/diwali-collection')
  showViewAll = false, // ✅ Show "View All" button
}) => {
  const swiperRef = useRef(null);
  const uniqueId = `dynamic-section-${sectionId}`;

  useEffect(() => {
    const handleResize = () => {
      if (swiperRef.current && swiperRef.current.swiper) {
        swiperRef.current.swiper.update();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let content = null;
  
  if (isLoading) {
    content = <HomeTwoFeaturedPrdLoader loading />;
  } else if (error) {
    content = (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h4 style={{ color: '#ef4444', marginBottom: '16px' }}>Unable to Load Products</h4>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          {error?.message || 'There was an error loading products'}
        </p>
      </div>
    );
  } else if (!products || products.length === 0) {
    content = <ErrorMsg msg="No Products found!" />;
  } else {
    content = (
      <Swiper
        {...SLIDER_SETTINGS}
        ref={swiperRef}
        modules={[Navigation]}
        className={`${uniqueId}-slider`}
        navigation={{
          nextEl: `.${uniqueId}-next`,
          prevEl: `.${uniqueId}-prev`,
        }}
        onSwiper={(swiper) => {
          swiperRef.current = { swiper };
        }}
      >
        {products.map((item, idx) => {
          const p = item?.product || item;
          const pid = p?._id || p?.id || idx;
          const title = p?.name || item?.title || 'Product Name';
          const imageUrl = getImageUrl(item);
          const eager = idx < 4;
          
          // ✅ Build product link - use section context if available
          const productSlug = p?.productslug || p?.slug || p?.aiTempOutput || p?.fabricCode || pid;
          const productPath = sectionPath 
            ? `${sectionPath}/${productSlug}` 
            : `/fabric/${productSlug}`;

          return (
            <SwiperSlide key={pid} className="dynamic-slide">
              <Link href={productPath} className="product-card-link">
                <div className="product-card">
                  <div className="product-image-wrapper">
                    <Image
                      src={imageUrl}
                      alt={title}
                      width={CARD_W}
                      height={CARD_H}
                      sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 20vw"
                      priority={eager}
                      loading={eager ? 'eager' : 'lazy'}
                      quality={85}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = '/assets/img/product/product-1.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="product-details">
                    <h3 className="product-title">{title}</h3>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    );
  }

  return (
    <section className="dynamic-section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-subtitle">FEATURED COLLECTIONS</span>
            <h2 className="section-title">{sectionTitle}</h2>
          </div>
        </div>

        <div className="slider-wrapper">
          <button className={`slider-arrow slider-arrow--prev ${uniqueId}-prev`} type="button" aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          {content}
          
          <button className={`slider-arrow slider-arrow--next ${uniqueId}-next`} type="button" aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* ✅ "View All" button - bottom center */}
        {showViewAll && sectionPath && (
          <div className="view-all-wrapper">
            <Link href={sectionPath} className="view-all-btn">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
  /* === SECTION === */
  .dynamic-section {
    padding: 80px 0;
    background: linear-gradient(180deg, #fafbff 0%, #f5f7ff 50%, #ffffff 100%);
    font-family: var(--tp-ff-jost), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .dynamic-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 400px;
    background: radial-gradient(ellipse at top, rgba(44, 76, 151, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    position: relative;
    z-index: 1;
  }

  /* === HEADER === */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 24px;
    flex-wrap: wrap;
  }

  .section-subtitle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #D6A74B;
    margin-bottom: 12px;
    text-transform: uppercase;
    position: relative;
  }

  .section-subtitle::before {
    content: '';
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #D6A74B 0%, transparent 100%);
  }

  .section-title {
    font-size: 42px;
    font-weight: 800;
    background: linear-gradient(135deg, #1a1a2e 0%, #2C4C97 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1.2;
    letter-spacing: -1px;
  }

  /* === VIEW ALL BUTTON === */
  .view-all-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }

  .view-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 32px;
    background: linear-gradient(135deg, #2C4C97 0%, #1e3a7a 100%);
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    border-radius: 50px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 24px rgba(44, 76, 151, 0.25);
    position: relative;
    overflow: hidden;
  }

  .view-all-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.6s ease;
  }

  .view-all-btn:hover::before {
    left: 100%;
  }

  .view-all-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(44, 76, 151, 0.35);
  }

  .view-all-btn svg {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .view-all-btn:hover svg {
    transform: translateX(6px);
  }

  /* === SLIDER === */
  .slider-wrapper {
    position: relative;
    padding: 0 70px;
  }

  .slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(44, 76, 151, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2C4C97;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  .slider-arrow--prev {
    left: 0;
  }

  .slider-arrow--next {
    right: 0;
  }

  .slider-arrow:hover {
    background: linear-gradient(135deg, #2C4C97 0%, #1e3a7a 100%);
    color: #ffffff;
    transform: translateY(-50%) scale(1.15);
    box-shadow: 0 12px 36px rgba(44, 76, 151, 0.4);
    border-color: transparent;
  }

  .slider-arrow.swiper-button-disabled {
    opacity: 0.3;
    pointer-events: none;
  }

  /* === CARD === */
  .dynamic-slide {
    height: auto !important;
    padding: 8px;
  }

  .product-card-link {
    text-decoration: none;
    display: block;
  }

  .product-card {
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 2px solid transparent;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    cursor: pointer;
    position: relative;
  }

  .product-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(135deg, #2C4C97, #D6A74B);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .product-card:hover::before {
    opacity: 1;
  }

  .product-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 20px 48px rgba(44, 76, 151, 0.15);
  }

  /* === IMAGE === */
  .product-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  }

  .product-image-wrapper::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 100%);
    pointer-events: none;
  }

  .product-image {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    padding: 24px;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .product-card:hover .product-image {
    transform: scale(1.12) rotate(2deg);
  }

  /* === DETAILS === */
  .product-details {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
    position: relative;
  }

  .product-details::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20px;
    right: 20px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(44, 76, 151, 0.1), transparent);
  }

  .product-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    min-height: 48px;
    transition: all 0.3s ease;
    text-align: center;
    letter-spacing: -0.2px;
  }

  .product-card:hover .product-title {
    color: #2C4C97;
    transform: translateY(-2px);
  }

  /* === RESPONSIVE === */
  @media (max-width: 1200px) {
    .dynamic-section {
      padding: 64px 0;
    }
    .section-title {
      font-size: 36px;
    }
    .slider-wrapper {
      padding: 0 65px;
    }
  }

  @media (max-width: 992px) {
    .dynamic-section {
      padding: 56px 0;
    }
    .section-header {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 32px;
    }
    .slider-wrapper {
      padding: 0 60px;
    }
    .slider-arrow {
      width: 52px;
      height: 52px;
    }
  }

  @media (max-width: 768px) {
    .dynamic-section {
      padding: 48px 0;
    }
    .section-header {
      margin-bottom: 32px;
    }
    .section-subtitle {
      font-size: 12px;
      letter-spacing: 2.5px;
    }
    .section-title {
      font-size: 28px;
    }
    .view-all-btn {
      padding: 12px 24px;
      font-size: 14px;
    }
    .slider-wrapper {
      padding: 0 56px;
    }
    .slider-arrow {
      width: 48px;
      height: 48px;
    }
    .product-card {
      border-radius: 20px;
    }
    .product-details {
      padding: 18px;
    }
    .product-title {
      font-size: 15px;
      min-height: 45px;
    }
  }

  @media (max-width: 576px) {
    .dynamic-section {
      padding: 40px 0;
    }
    .container {
      padding: 0 16px;
    }
    .section-header {
      margin-bottom: 28px;
    }
    .section-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
    }
    .section-subtitle::before {
      width: 30px;
    }
    .section-title {
      font-size: 24px;
    }
    .view-all-btn {
      padding: 10px 20px;
      font-size: 13px;
    }
    .slider-wrapper {
      padding: 0 52px;
    }
    .slider-arrow {
      width: 44px;
      height: 44px;
    }
    .dynamic-slide {
      padding: 6px;
    }
    .product-card {
      border-radius: 18px;
    }
    .product-image {
      padding: 20px;
    }
    .product-details {
      padding: 16px;
    }
    .product-title {
      font-size: 14px;
      min-height: 42px;
    }
  }
`}</style>
    </section>
  );
};

export default DynamicSection;
