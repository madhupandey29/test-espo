'use client';
import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
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
  slidesPerView: 2,
  spaceBetween: 1,
  loop: true,
  grabCursor: true,
  allowTouchMove: true,
  speed: 600,
  autoplay: {
    delay: 2800,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    1400: { slidesPerView: 6, spaceBetween: 1 },
    1200: { slidesPerView: 5, spaceBetween: 1 },
    992:  { slidesPerView: 4, spaceBetween: 1 },
    768:  { slidesPerView: 3, spaceBetween: 1 },
    576:  { slidesPerView: 2, spaceBetween: 1 },
    0:    { slidesPerView: 2, spaceBetween: 1 },
  },
};

const DynamicSection = ({
  sectionId,
  sectionTitle = 'Featured Collection',
  products = [],
  isLoading = false,
  error = null,
  categoryPath = null,
  sectionPath = null,
  showViewAll = false,
}) => {
  const swiperRef = useRef(null);
  const uniqueId = `ds-${sectionId}`;

  let content = null;

  if (isLoading) {
    content = <HomeTwoFeaturedPrdLoader loading />;
  } else if (error) {
    content = (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h4 style={{ color: '#ef4444' }}>Unable to Load Products</h4>
        <p style={{ color: '#6b7280' }}>{error?.message || 'Error loading products'}</p>
      </div>
    );
  } else if (!products || products.length === 0) {
    content = <ErrorMsg msg="No Products found!" />;
  } else {
    content = (
      <Swiper
        {...SLIDER_SETTINGS}
        ref={swiperRef}
        modules={[Navigation, Autoplay]}
        className={`${uniqueId}-swiper ds-swiper`}
        navigation={{ nextEl: `.${uniqueId}-next`, prevEl: `.${uniqueId}-prev` }}
      >
        {products.map((item, idx) => {
          const p = item?.product || item;
          const pid = p?._id || p?.id || idx;
          const title = p?.name || item?.title || 'Product Name';
          const imageUrl = getImageUrl(item);
          const eager = idx < 6;
          const productSlug = p?.productslug || p?.slug || p?.aiTempOutput || p?.fabricCode || pid;
          const productPath = sectionPath ? `${sectionPath}/${productSlug}` : `/fabric/${productSlug}`;

          return (
            <SwiperSlide key={pid} className="ds-slide">
              <Link href={productPath} className="ds-card-link">
                <div className="ds-card">
                  <div className="ds-img-wrap">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 17vw"
                      priority={eager}
                      loading={eager ? 'eager' : 'lazy'}
                      quality={85}
                      className="ds-img"
                      onError={(e) => { e.target.src = '/assets/img/product/product-1.jpg'; }}
                    />
                    {/* Hover overlay */}
                    <div className="ds-overlay">
                      <span className="ds-overlay-btn">View Details</span>
                    </div>
                  </div>
                  <div className="ds-card-footer">
                    <p className="ds-card-name">{title}</p>
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
    <section className="ds-section">
      <div className="ds-top-bar">
        <div className="ds-top-inner">
          <h2 className="ds-section-title">
            <span className="ds-title-explore">Explore Our</span>
            <span className="ds-title-name">{sectionTitle}</span>
          </h2>
          {showViewAll && sectionPath && (
            <Link href={sectionPath} className="ds-view-all">
              <span className="ds-btn-full">View {sectionTitle} Special</span>
              <span className="ds-btn-short">View Special</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Slider with side nav arrows */}
      <div className="ds-slider-outer">
        <button className={`ds-nav ds-nav-prev ${uniqueId}-prev`} type="button" aria-label="Previous">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="ds-slider-inner">
          {content}
        </div>

        <button className={`ds-nav ds-nav-next ${uniqueId}-next`} type="button" aria-label="Next">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>



      <style jsx global>{`

        /* ── SECTION ── */
        .ds-section {
          background: #ffffff;
          padding: 0;
          font-family: var(--tp-ff-jost), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0 24px;
          border-radius: 12px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        /* ── TOP BAR ── */
        .ds-top-bar {
          padding: 24px 32px 20px;
          border-bottom: 1px solid #eaeaec;
          background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
        }

        .ds-top-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        /* Two-line heading */
        .ds-section-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-left: 16px;
          border-left: 5px solid #D6A74B;
        }

        .ds-title-explore {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #D6A74B;
          line-height: 1;
        }

        .ds-title-name {
          font-size: 28px;
          font-weight: 800;
          color: #2C4C97;
          line-height: 1.15;
          letter-spacing: -0.5px;
          text-transform: capitalize;
        }

        /* Blue pill button */
        .ds-view-all {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, #2C4C97 0%, #1e3a7a 100%);
          text-decoration: none;
          letter-spacing: 0.3px;
          padding: 11px 22px;
          border-radius: 50px;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(44,76,151,0.25);
        }

        .ds-view-all:hover {
          background: linear-gradient(135deg, #1e3a7a 0%, #2C4C97 100%);
          box-shadow: 0 8px 24px rgba(44,76,151,0.38);
          transform: translateY(-2px);
        }

        .ds-view-all svg {
          transition: transform 0.25s ease;
        }

        .ds-view-all:hover svg {
          transform: translateX(4px);
        }

        /* ── SLIDER OUTER ── */
        .ds-slider-outer {
          position: relative;
          display: flex;
          align-items: stretch;
        }

        .ds-slider-inner {
          flex: 1;
          overflow: hidden;
          min-width: 0;
        }

        /* ── NAV ARROWS ── */
        .ds-nav {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 36px;
          background: rgba(255,255,255,0.95);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          color: #1a1a2e;
          transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
          box-shadow: 3px 0 14px rgba(0,0,0,0.1);
        }

        .ds-nav-prev {
          left: 0;
          border-right: 1px solid #eaeaec;
        }

        .ds-nav-next {
          right: 0;
          border-left: 1px solid #eaeaec;
        }

        .ds-nav:hover {
          background: #fff;
          color: #D6A74B;
          box-shadow: 4px 0 22px rgba(0,0,0,0.16);
        }

        .ds-nav.swiper-button-disabled {
          opacity: 0;
          pointer-events: none;
        }

        /* ── SWIPER ── */
        .ds-swiper {
          width: 100%;
        }

        /* ── SLIDE ── */
        .ds-slide {
          height: auto !important;
        }

        .ds-card-link {
          display: block;
          text-decoration: none;
        }

        /* ── CARD ── */
        .ds-card {
          background: #fff;
          border-right: 1px solid #eaeaec;
          cursor: pointer;
          transition: box-shadow 0.25s ease;
          position: relative;
        }

        .ds-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.13);
          z-index: 2;
        }

        /* ── IMAGE ── */
        .ds-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #f5f5f6;
        }

        .ds-img {
          object-fit: cover !important;
          transition: transform 0.5s ease;
        }

        .ds-card:hover .ds-img {
          transform: scale(1.05);
        }

        /* ── HOVER OVERLAY ── */
        .ds-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(26,26,46,0.55) 100%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 18px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .ds-card:hover .ds-overlay {
          opacity: 1;
        }

        .ds-overlay-btn {
          background: #D6A74B;
          color: #1a1a2e;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 7px 18px;
          border-radius: 2px;
          transform: translateY(8px);
          transition: transform 0.3s ease;
        }

        .ds-card:hover .ds-overlay-btn {
          transform: translateY(0);
        }

        /* ── CARD FOOTER ── */
        .ds-card-footer {
          padding: 10px 10px 12px;
          border-top: 1px solid #f5f5f6;
          background: #fff;
        }

        .ds-card-name {
          font-size: 14px;
          font-weight: 700;
          color: #2C4C97;
          margin: 0;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          transition: color 0.2s ease;
        }

        .ds-card:hover .ds-card-name {
          color: #1e3a7a;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1200px) {
          .ds-top-bar { padding: 20px 24px 16px; }
          .ds-title-name { font-size: 24px; }
        }

        @media (max-width: 992px) {
          .ds-top-bar { padding: 18px 20px 14px; }
          .ds-title-name { font-size: 22px; }
          .ds-nav { width: 32px; }
        }

        /* ── BUTTON LABEL TOGGLE ── */
        .ds-btn-short { display: none; }

        @media (max-width: 768px) {
          .ds-section { margin: 0 12px; border-radius: 10px; }
          .ds-top-bar { padding: 16px 16px 13px; }
          .ds-title-explore { font-size: 10px; letter-spacing: 2px; }
          .ds-title-name { font-size: 18px; }
          .ds-view-all { font-size: 11px; padding: 9px 16px; }
          .ds-nav { width: 30px; }
          .ds-card-footer { padding: 8px 8px 10px; }
          .ds-card-name { font-size: 13px; }
        }

        @media (max-width: 576px) {
          .ds-section { margin: 0 8px; border-radius: 8px; }
          .ds-top-bar { padding: 13px 12px 11px; }
          .ds-section-title { padding-left: 10px; border-left-width: 3px; }
          .ds-title-explore { font-size: 9px; letter-spacing: 1.5px; }
          .ds-title-name { font-size: 15px; }
          .ds-view-all { font-size: 10px; padding: 7px 12px; gap: 5px; }
          .ds-nav { width: 26px; }
          .ds-overlay { display: none; }
          .ds-card-footer { padding: 7px 6px 9px; }
          .ds-card-name { font-size: 12px; }
        }

        @media (max-width: 400px) {
          .ds-title-name { font-size: 14px; }
          .ds-view-all { font-size: 9px; padding: 6px 10px; }
        }
      `}</style>
    </section>
  );
};

export default DynamicSection;
