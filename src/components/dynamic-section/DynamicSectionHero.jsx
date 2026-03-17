'use client';

import Image from 'next/image';

const DynamicSectionHero = ({ sectionSlug, topicData }) => {
  // Don't render if no data
  if (!topicData) return null;

  // Use API data
  const title = topicData?.metaTitle || topicData?.name || 'Premium Collection';
  const paragraph1 = topicData?.p1 || '';
  const paragraph2 = topicData?.p2 || '';
  const imageUrl = topicData?.image1CloudUrlHero || topicData?.image1CloudUrlWeb || topicData?.image1CloudUrl;

  // Always render the hero section with at least the title
  const hasImage = imageUrl && imageUrl.trim() !== '';

  return (
    <section className="dynamic-hero-section">
      <div className="container">
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">
              {title}
            </h1>
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
                <Image
                  src={imageUrl}
                  alt={title}
                  width={400}
                  height={400}
                  className="hero-img"
                  unoptimized
                />
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
        .dynamic-hero-section {
          padding: 25px 0;
          background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
          position: relative;
          overflow: hidden;
        }

        .hero-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
        }

        .hero-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(44, 76, 151, 0.05) 0%, transparent 70%);
          border-radius: 50%;
        }

        .hero-content {
          flex: 0 0 70%;
          max-width: 70%;
          position: relative;
          z-index: 2;
        }

        .hero-title {
          font-size: 30px;
          font-weight: 700;
          color: #0f2235;
          margin-bottom: 15px;
          line-height: 1.3;
        }

        .hero-description {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .hero-description-extra {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        .hero-images {
          display: flex;
          align-items: center;
          position: relative;
          z-index: 2;
          flex: 0 0 25%;
          max-width: 25%;
        }

        .image-item {
          width: 100%;
          height: 180px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
        }

        .image-item:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 40px rgba(44, 76, 151, 0.25);
        }

        .image-item :global(.hero-img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-item.placeholder {
          background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #2C4C97;
          text-align: center;
        }

        .placeholder-content svg {
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .placeholder-content p {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          opacity: 0.7;
        }

        @media (max-width: 991px) {
          .hero-banner {
            flex-direction: column;
            padding: 25px;
            gap: 20px;
          }

          .hero-content {
            max-width: 100%;
            text-align: center;
          }

          .hero-title {
            font-size: 26px;
          }

          .hero-images {
            justify-content: center;
          }

          .image-item {
            width: 300px;
            height: 190px;
          }
        }

        @media (max-width: 767px) {
          .dynamic-hero-section {
            padding: 20px 0;
          }

          .hero-banner {
            padding: 20px;
            gap: 18px;
          }

          .hero-title {
            font-size: 24px;
            margin-bottom: 12px;
          }

          .hero-description,
          .hero-description-extra {
            font-size: 13px;
          }

          .image-item {
            width: 260px;
            height: 165px;
          }
        }

        @media (max-width: 575px) {
          .hero-title {
            font-size: 20px;
          }

          .image-item {
            width: 220px;
            height: 140px;
          }
        }
      `}</style>
    </section>
  );
};

export default DynamicSectionHero;
