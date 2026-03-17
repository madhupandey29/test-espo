'use client';

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ErrorMsg from "../common/error-msg";

const HomeCategorySection = ({ categorySummaries = [] }) => {
  const router = useRouter();

  const handleCategoryClick = (categoryName) => {
    const slug = categoryName.toLowerCase().replace("&", "").split(" ").join("-");
    router.push(`/category/${slug}`);
  };

  const handleCategoryKeyDown = (event, categoryName) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryClick(categoryName);
    }
  };

  const displayCategories = categorySummaries.slice(0, 8);

  const content = displayCategories.length > 0
    ? displayCategories.map((item, index) => (
        <div key={item.name} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
          <div
            className="tp-category-card"
            role="link"
            tabIndex={0}
            onClick={() => handleCategoryClick(item.name)}
            onKeyDown={(event) => handleCategoryKeyDown(event, item.name)}
          >
            <div className="tp-category-img-wrapper">
              <Image
                src={item.image || '/assets/img/about/about1.jpg'}
                alt={item.name}
                width={300}
                height={300}
                sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, (max-width: 1200px) 33vw, 25vw"
                loading={index === 0 ? 'eager' : 'lazy'}
                className="tp-category-img"
                onError={(event) => {
                  event.currentTarget.src = '/assets/img/about/about1.jpg';
                }}
              />
              <div className="tp-category-overlay"></div>
            </div>
            <div className="tp-category-content">
              <h3 className="tp-category-title">{item.name}</h3>
              <span className="tp-category-count">{item.count} Products</span>
            </div>
          </div>
        </div>
      ))
    : <ErrorMsg msg="No categories found!" />;

  return (
    <>
      <section className="tp-category-section pt-70 pb-70">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              <div className="tp-section-title-wrapper-2 text-center mb-50">
                <span className="tp-section-title-pre-2">
                  Browse Categories
                  <svg className="tp-shape-line" width="60" height="4" viewBox="0 0 60 4" fill="none">
                    <path d="M0 2H60" stroke="var(--tp-theme-secondary)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
                <h2 className="tp-section-title-2">Shop by Category</h2>
                <p className="tp-section-description">Explore our wide range of fabric categories</p>
              </div>
            </div>
          </div>
          <div className="row">{content}</div>
        </div>
      </section>

      <style jsx global>{`
        .tp-category-section {
          background: var(--tp-grey-1);
          position: relative;
        }

        .tp-category-card {
          background: var(--tp-common-white);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15, 34, 53, 0.06);
          border: 1px solid rgba(44, 76, 151, 0.08);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          height: 100%;
          margin-bottom: 30px;
          position: relative;
        }

        .tp-category-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(44, 76, 151, 0.03) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.35s ease;
          z-index: 1;
          pointer-events: none;
        }

        .tp-category-card:hover,
        .tp-category-card:focus-visible {
          transform: translateY(-8px);
          box-shadow: 0 16px 40px rgba(44, 76, 151, 0.12);
          border-color: rgba(44, 76, 151, 0.2);
        }

        .tp-category-card:focus-visible {
          outline: 2px solid var(--tp-theme-primary);
          outline-offset: 3px;
        }

        .tp-category-card:hover::before,
        .tp-category-card:focus-visible::before {
          opacity: 1;
        }

        .tp-category-img-wrapper {
          position: relative;
          overflow: hidden;
          aspect-ratio: 4/3;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .tp-category-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          filter: brightness(0.98);
        }

        .tp-category-card:hover .tp-category-img,
        .tp-category-card:focus-visible .tp-category-img {
          transform: scale(1.08);
          filter: brightness(1.02);
        }

        .tp-category-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg,
            rgba(1, 15, 28, 0) 0%,
            rgba(1, 15, 28, 0.15) 50%,
            rgba(1, 15, 28, 0.4) 100%
          );
          opacity: 0;
          transition: opacity 0.35s ease;
          z-index: 2;
        }

        .tp-category-card:hover .tp-category-overlay,
        .tp-category-card:focus-visible .tp-category-overlay {
          opacity: 1;
        }

        .tp-category-content {
          padding: 28px 24px;
          text-align: center;
          background: var(--tp-common-white);
          position: relative;
          z-index: 3;
        }

        .tp-category-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--tp-text-1);
          margin-bottom: 10px;
          font-family: var(--tp-ff-jost);
          transition: color 0.25s ease;
          letter-spacing: -0.3px;
        }

        .tp-category-card:hover .tp-category-title,
        .tp-category-card:focus-visible .tp-category-title {
          color: var(--tp-theme-primary);
        }

        .tp-category-count {
          font-size: 14px;
          color: var(--tp-text-2);
          font-family: var(--tp-ff-roboto);
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--tp-grey-1);
          border-radius: 20px;
          transition: all 0.25s ease;
        }

        .tp-category-count::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--tp-theme-primary);
          border-radius: 50%;
          display: inline-block;
        }

        .tp-category-card:hover .tp-category-count,
        .tp-category-card:focus-visible .tp-category-count {
          background: rgba(44, 76, 151, 0.1);
          color: var(--tp-theme-primary);
        }

        @media (max-width: 1200px) {
          .tp-category-title {
            font-size: 19px;
          }
        }

        @media (max-width: 992px) {
          .tp-category-content {
            padding: 24px 20px;
          }

          .tp-category-title {
            font-size: 18px;
          }

          .tp-category-count {
            font-size: 13px;
            padding: 5px 12px;
          }
        }

        @media (max-width: 768px) {
          .tp-category-section {
            padding: 50px 0;
          }

          .tp-section-title-wrapper-2 {
            margin-bottom: 35px !important;
          }

          .tp-category-card {
            margin-bottom: 24px;
          }

          .tp-category-content {
            padding: 22px 18px;
          }

          .tp-category-title {
            font-size: 17px;
            margin-bottom: 8px;
          }

          .tp-category-count {
            font-size: 13px;
          }

          .tp-category-img-wrapper {
            aspect-ratio: 1;
          }
        }

        @media (max-width: 576px) {
          .tp-category-section {
            padding: 40px 0;
          }

          .tp-category-card {
            margin-bottom: 20px;
          }

          .tp-category-title {
            font-size: 16px;
          }

          .tp-category-count {
            font-size: 12px;
            padding: 4px 10px;
          }

          .tp-category-count::before {
            width: 5px;
            height: 5px;
          }
        }

        .theme-dark .tp-category-section {
          background: var(--tp-grey-1);
        }

        .theme-dark .tp-category-card {
          background: var(--tp-common-white);
          border-color: rgba(44, 76, 151, 0.1);
        }

        .theme-dark .tp-category-img-wrapper {
          background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        }

        .theme-dark .tp-category-count {
          background: rgba(44, 76, 151, 0.08);
        }
      `}</style>
    </>
  );
};

export default HomeCategorySection;
