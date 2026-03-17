'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProductImageUrl } from "@/utils/imageContract";
import { getApiBaseUrl } from "@/utils/runtimeConfig";

// Category information data
const categoryInfo = {
  "Woven Fabrics": {
    introduction: "Woven fabrics are created by interlacing two sets of yarns at right angles to each other. This traditional textile manufacturing technique produces durable, versatile fabrics suitable for a wide range of applications.",
    features: [
      "High durability and strength",
      "Excellent dimensional stability",
      "Wide variety of textures and patterns",
      "Suitable for formal and casual wear"
    ],
    usages: [
      "Apparel: Shirts, trousers, suits, dresses",
      "Home textiles: Curtains, upholstery, bedding",
      "Industrial applications: Bags, filters, technical textiles",
      "Fashion accessories: Scarves, ties, handkerchiefs"
    ]
  },
  "Denim Fabrics": {
    introduction: "Denim is a sturdy cotton warp-faced textile in which the weft passes under two or more warp threads. This twill weaving produces a diagonal ribbing that distinguishes it from other cotton fabrics.",
    features: [
      "Exceptional durability and longevity",
      "Comfortable and breathable",
      "Ages beautifully with wear",
      "Versatile styling options"
    ],
    usages: [
      "Jeans and casual pants",
      "Jackets and outerwear",
      "Shirts and dresses",
      "Bags and accessories"
    ]
  }
};

const CategoryDetailClient = ({ categoryName, slug }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const info = categoryInfo[categoryName] || {
    introduction: `Discover our premium ${categoryName} collection. High-quality fabrics crafted for excellence.`,
    features: [
      "Premium quality materials",
      "Versatile applications",
      "Durable and long-lasting",
      "Wide range of options"
    ],
    usages: [
      "Apparel manufacturing",
      "Home textiles",
      "Fashion accessories",
      "Custom projects"
    ]
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const apiBase = getApiBaseUrl();
        
        // Fetch all products with pagination
        let allProducts = [];
        const firstPageRes = await fetch(`${apiBase}/product?page=1&limit=20`);
        if (!firstPageRes.ok) throw new Error("Failed to fetch products");

        const firstPageData = await firstPageRes.json();
        const firstPageProducts = firstPageData?.data || [];
        allProducts = [...firstPageProducts];
        const totalPages = firstPageData?.pagination?.totalPages || 1;

        if (totalPages > 1) {
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(
              fetch(`${apiBase}/product?page=${page}&limit=20`).then(res => res.json())
            );
          }

          const remainingPages = await Promise.all(pagePromises);
          remainingPages.forEach(pageData => {
            const pageProducts = pageData?.data || [];
            allProducts = [...allProducts, ...pageProducts];
          });
        }

        // Filter products by category and merchTags
        const filteredProducts = allProducts.filter((product) => {
          const matchesCategory = product.category === categoryName;
          const merchTags = product.merchTags || [];
          const hasEcatalogue = Array.isArray(merchTags) 
            ? merchTags.some(tag => tag?.toLowerCase().includes('ecatalogue'))
            : String(merchTags).toLowerCase().includes('ecatalogue');
          
          return matchesCategory && hasEcatalogue;
        });

        setProducts(filteredProducts);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName]);

  const getProductImage = (product) => {
    return getProductImageUrl(product, { variant: 'card' }) || '/assets/img/product/product-1.jpg';
  };

  const handleProductClick = (product) => {
    const slug = product?.slug || product?.productslug || product?.seoSlug || 
                 product?.aiTempOutput || product?.fabricCode || product?._id;
    if (slug) {
      router.push(`/fabric/${slug}`);
    }
  };

  return (
    <>
      <section className="category-detail-area pt-80 pb-80">
        <div className="container">
          {/* Hero Section */}
          <div className="row mb-70">
            <div className="col-xl-12">
              <div className="category-hero-wrapper">
                <div className="category-hero-bg"></div>
                <div className="category-hero-content">
                  <span className="category-hero-label">Fabric Category</span>
                  <h1 className="category-hero-title">{categoryName}</h1>
                  <p className="category-hero-text">{info.introduction}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features & Usages */}
          <div className="row mb-80">
            <div className="col-lg-6">
              <div className="category-info-card">
                <div className="category-info-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3 className="category-info-title">Key Features</h3>
                <ul className="category-info-list">
                  {info.features.map((feature, index) => (
                    <li key={index}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="category-info-card">
                <div className="category-info-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <h3 className="category-info-title">Common Usages</h3>
                <ul className="category-info-list">
                  {info.usages.map((usage, index) => (
                    <li key={index}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {usage}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Collection Header */}
          <div className="row mb-50">
            <div className="col-xl-12">
              <div className="category-collection-header">
                <div className="category-collection-header-content">
                  <span className="category-collection-label">Explore Our Range</span>
                  <h2 className="category-collection-title">Our Collection</h2>
                  <p className="category-collection-subtitle">
                    {loading ? 'Loading products...' : `Discover ${products.length} premium quality products`}
                  </p>
                </div>
                <div className="category-collection-divider"></div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="row">
            {loading ? (
              <div className="col-12">
                <div className="category-loading">
                  <div className="category-spinner"></div>
                  <p>Loading our finest collection...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="col-12">
                <div className="category-empty">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <h3>No Products Available</h3>
                  <p>We're currently updating our {categoryName} collection. Please check back soon!</p>
                </div>
              </div>
            ) : (
              products.map((product, index) => (
                <div key={product._id || index} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                  <div className="category-product-card" onClick={() => handleProductClick(product)}>
                    <div className="category-product-badge">Premium</div>
                    <div className="category-product-img-wrapper">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name || 'Product'}
                        width={300}
                        height={300}
                        className="category-product-img"
                        onError={(e) => {
                          e.target.src = '/assets/img/product/product-1.jpg';
                        }}
                      />
                      <div className="category-product-overlay">
                        <button className="category-product-quick-view">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Quick View
                        </button>
                      </div>
                    </div>
                    <div className="category-product-info">
                      <h4 className="category-product-title">{product.name || 'Product'}</h4>
                      <div className="category-product-meta">
                        <span className="category-product-category">{categoryName}</span>
                      </div>
                      <button className="category-product-btn">
                        View Specifications
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <style jsx global>{`
        .category-detail-area {
          background: var(--tp-grey-1);
        }

        /* Hero Section */
        .category-hero-wrapper {
          position: relative;
          padding: 80px 60px;
          background: var(--tp-common-white);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(15, 34, 53, 0.08);
        }

        .category-hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(44, 76, 151, 0.05) 0%, 
            rgba(44, 76, 151, 0.02) 50%,
            transparent 100%
          );
          z-index: 0;
        }

        .category-hero-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(44, 76, 151, 0.08) 0%, transparent 70%);
          border-radius: 50%;
        }

        .category-hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .category-hero-label {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(44, 76, 151, 0.1);
          color: var(--tp-theme-primary);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border-radius: 30px;
          margin-bottom: 20px;
          font-family: var(--tp-ff-roboto);
        }

        .category-hero-title {
          font-size: 52px;
          font-weight: 700;
          color: var(--tp-text-1);
          margin-bottom: 24px;
          font-family: var(--tp-ff-jost);
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .category-hero-text {
          font-size: 18px;
          line-height: 1.8;
          color: var(--tp-text-2);
          font-family: var(--tp-ff-roboto);
          font-weight: 400;
        }

        /* Info Cards */
        .category-info-card {
          background: var(--tp-common-white);
          padding: 45px 40px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(15, 34, 53, 0.06);
          border: 1px solid rgba(44, 76, 151, 0.08);
          height: 100%;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .category-info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, var(--tp-theme-primary) 0%, var(--tp-theme-secondary) 100%);
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .category-info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(44, 76, 151, 0.12);
        }

        .category-info-card:hover::before {
          transform: scaleY(1);
        }

        .category-info-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(44, 76, 151, 0.1) 0%, rgba(44, 76, 151, 0.05) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: var(--tp-theme-primary);
        }

        .category-info-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--tp-text-1);
          margin-bottom: 28px;
          font-family: var(--tp-ff-jost);
        }

        .category-info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .category-info-list li {
          padding: 16px 0;
          color: var(--tp-text-2);
          font-size: 15px;
          line-height: 1.6;
          font-family: var(--tp-ff-roboto);
          border-bottom: 1px solid rgba(44, 76, 151, 0.06);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .category-info-list li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .category-info-list li:hover {
          color: var(--tp-theme-primary);
          padding-left: 8px;
        }

        .category-info-list li svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--tp-theme-primary);
        }

        /* Collection Header */
        .category-collection-header {
          text-align: center;
          position: relative;
        }

        .category-collection-label {
          display: inline-block;
          padding: 6px 16px;
          background: rgba(44, 76, 151, 0.08);
          color: var(--tp-theme-primary);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          border-radius: 20px;
          margin-bottom: 16px;
          font-family: var(--tp-ff-roboto);
        }

        .category-collection-title {
          font-size: 40px;
          font-weight: 700;
          color: var(--tp-text-1);
          margin-bottom: 12px;
          font-family: var(--tp-ff-jost);
          letter-spacing: -0.5px;
        }

        .category-collection-subtitle {
          font-size: 17px;
          color: var(--tp-text-2);
          font-family: var(--tp-ff-roboto);
        }

        .category-collection-divider {
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, transparent, var(--tp-theme-primary), transparent);
          margin: 30px auto 0;
          border-radius: 2px;
        }

        /* Loading */
        .category-loading {
          text-align: center;
          padding: 80px 20px;
        }

        .category-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(44, 76, 151, 0.1);
          border-top-color: var(--tp-theme-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .category-loading p {
          color: var(--tp-text-2);
          font-size: 16px;
          font-family: var(--tp-ff-roboto);
        }

        /* Empty State */
        .category-empty {
          text-align: center;
          padding: 80px 20px;
        }

        .category-empty svg {
          color: var(--tp-text-3);
          margin-bottom: 20px;
        }

        .category-empty h3 {
          font-size: 24px;
          font-weight: 600;
          color: var(--tp-text-1);
          margin-bottom: 12px;
          font-family: var(--tp-ff-jost);
        }

        .category-empty p {
          color: var(--tp-text-2);
          font-size: 16px;
          font-family: var(--tp-ff-roboto);
        }

        /* Product Cards */
        .category-product-card {
          background: var(--tp-common-white);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(15, 34, 53, 0.06);
          border: 1px solid rgba(44, 76, 151, 0.08);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          margin-bottom: 30px;
          position: relative;
        }

        .category-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 48px rgba(44, 76, 151, 0.15);
          border-color: rgba(44, 76, 151, 0.2);
        }

        .category-product-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 14px;
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border-radius: 20px;
          z-index: 2;
          font-family: var(--tp-ff-roboto);
        }

        .category-product-img-wrapper {
          position: relative;
          overflow: hidden;
          aspect-ratio: 1;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .category-product-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .category-product-card:hover .category-product-img {
          transform: scale(1.1);
        }

        .category-product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(1, 15, 28, 0.7) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        .category-product-card:hover .category-product-overlay {
          opacity: 1;
        }

        .category-product-quick-view {
          padding: 12px 24px;
          background: var(--tp-common-white);
          color: var(--tp-theme-primary);
          border: none;
          border-radius: 30px;
          font-weight: 600;
          font-size: 14px;
          font-family: var(--tp-ff-roboto);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transform: translateY(10px);
          transition: all 0.3s ease;
        }

        .category-product-card:hover .category-product-quick-view {
          transform: translateY(0);
        }

        .category-product-quick-view:hover {
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
        }

        .category-product-info {
          padding: 24px 20px;
        }

        .category-product-title {
          font-size: 17px;
          font-weight: 600;
          color: var(--tp-text-1);
          margin-bottom: 10px;
          font-family: var(--tp-ff-jost);
          min-height: 44px;
          display: flex;
          align-items: center;
          line-height: 1.4;
          transition: color 0.2s ease;
        }

        .category-product-card:hover .category-product-title {
          color: var(--tp-theme-primary);
        }

        .category-product-meta {
          margin-bottom: 16px;
        }

        .category-product-category {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(44, 76, 151, 0.08);
          color: var(--tp-theme-primary);
          font-size: 12px;
          font-weight: 500;
          border-radius: 12px;
          font-family: var(--tp-ff-roboto);
        }

        .category-product-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 20px;
          background: var(--tp-common-white);
          color: var(--tp-theme-primary);
          border: 2px solid var(--tp-theme-primary);
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          font-family: var(--tp-ff-roboto);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-product-btn:hover {
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(44, 76, 151, 0.2);
        }

        .category-product-btn svg {
          transition: transform 0.3s ease;
        }

        .category-product-btn:hover svg {
          transform: translateX(4px);
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .category-hero-title { font-size: 44px; }
          .category-collection-title { font-size: 36px; }
        }

        @media (max-width: 992px) {
          .category-hero-wrapper { padding: 60px 40px; }
          .category-hero-title { font-size: 38px; }
          .category-hero-text { font-size: 16px; }
          .category-info-card { padding: 35px 30px; margin-bottom: 30px; }
          .category-collection-title { font-size: 32px; }
        }

        @media (max-width: 768px) {
          .category-detail-area { padding: 50px 0; }
          .category-hero-wrapper { padding: 40px 30px; border-radius: 16px; }
          .category-hero-title { font-size: 32px; }
          .category-hero-text { font-size: 15px; }
          .category-info-card { padding: 30px 25px; }
          .category-info-icon { width: 56px; height: 56px; }
          .category-info-title { font-size: 22px; }
          .category-collection-title { font-size: 28px; }
          .category-product-card { margin-bottom: 24px; }
        }

        @media (max-width: 576px) {
          .category-hero-wrapper { padding: 30px 20px; }
          .category-hero-title { font-size: 28px; }
          .category-info-card { padding: 25px 20px; }
          .category-collection-title { font-size: 26px; }
          .category-product-title { font-size: 16px; min-height: 40px; }
        }
      `}</style>
    </>
  );
};

export default CategoryDetailClient;
