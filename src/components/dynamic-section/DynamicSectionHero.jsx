'use client';

import Image from 'next/image';

const DynamicSectionHero = ({ sectionSlug, topicData, products = [] }) => {
  const firstProduct = products?.[0];
  const collection = firstProduct?.collection;

  // Fallback chain: topicData → collection → first product → slug
  const title =
    topicData?.metaTitle ||
    topicData?.name ||
    collection?.name ||
    firstProduct?.category ||
    sectionSlug?.replace(/-/g, ' ') ||
    'Premium Collection';

  const paragraph1 =
    topicData?.p1 ||
    firstProduct?.shortProductDescription ||
    '';

  const imageUrl =
    topicData?.image1CloudUrl ||
    collection?.collectionImage1CloudUrl ||
    firstProduct?.image1CloudUrl ||
    null;

  const hasImage = imageUrl && imageUrl.trim() !== '';

  return (
    <section className="dynamic-hero-section">
      <div className="container">
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">{title}</h1>
            {paragraph1 && (
              <p
                className="hero-description"
                dangerouslySetInnerHTML={{ __html: paragraph1 }}
              />
            )}
          </div>
          <div className="hero-images">
            <div className={`image-item ${!hasImage ? 'placeholder' : ''}`}>
              {hasImage ? (
                <Image src={imageUrl} alt={title} width={400} height={400} className="hero-img" unoptimized />
              ) : (
                <div className="placeholder-content">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p>Image Coming Soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .dynamic-hero-section { padding: 25px 0; background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%); }
        .hero-banner { display: flex; align-items: center; justify-content: space-between; gap: 35px; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .hero-content { flex: 0 0 70%; max-width: 70%; }
        .hero-title { font-size: 30px; font-weight: 700; color: #0f2235; margin-bottom: 15px; line-height: 1.3; text-transform: capitalize; }
        .hero-description { font-size: 14px; color: #555; line-height: 1.6; margin: 0; }
        .hero-images { flex: 0 0 25%; max-width: 25%; }
        .image-item { width: 100%; height: 180px; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 25px rgba(0,0,0,0.12); position: relative; }
        .image-item :global(.hero-img) { width: 100%; height: 100%; object-fit: cover; }
        .image-item.placeholder { background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%); display: flex; align-items: center; justify-content: center; }
        .placeholder-content { display: flex; flex-direction: column; align-items: center; color: #2C4C97; text-align: center; }
        .placeholder-content p { margin: 8px 0 0; font-size: 14px; }
        @media (max-width: 991px) {
          .hero-banner { flex-direction: column; }
          .hero-content { max-width: 100%; text-align: center; }
          .hero-images { width: 100%; display: flex; justify-content: center; }
          .image-item { width: 300px; height: 190px; }
        }
        @media (max-width: 767px) {
          .hero-title { font-size: 22px; }
          .image-item { width: 240px; height: 150px; }
        }
      `}</style>
    </section>
  );
};

export default DynamicSectionHero;
