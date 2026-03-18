'use client';

import Image from 'next/image';

const DynamicSectionGalleryKeywords = ({ sectionSlug, topicData }) => {
  // Guard: nothing to render if topicData is missing
  if (!topicData) return null;

  // Get paragraph 2 and image 2
  const paragraph2 = topicData?.p2 || '';
  const image2Url = topicData?.image2CloudUrl;
  
  // Get images for gallery (image 3 and 4)
  const images = [
    topicData?.image3CloudUrl,
    topicData?.image4CloudUrl,
  ];

  // Get keywords from API
  const keywords = topicData?.keywords || [];

  // Check if we have content to show
  const hasImage2 = image2Url && image2Url.trim() !== '';
  const hasP2 = paragraph2 && paragraph2.trim() !== '';
  const hasGalleryImages = images.some(img => img && img.trim() !== '');
  const hasKeywords = keywords.length > 0;

  // Don't render if no content at all
  if (!hasP2 && !hasImage2 && !hasGalleryImages && !hasKeywords) return null;

  return (
    <section className="dynamic-gallery-section">
      <div className="container">
        {/* Paragraph 2 with Image 2 Section */}
        {(hasP2 || hasImage2) && (
          <div className="p2-section">
            {hasImage2 && (
              <div className="p2-image">
                <Image
                  src={image2Url}
                  alt={`${topicData.name} Collection`}
                  width={400}
                  height={300}
                  className="p2-img"
                  unoptimized
                />
              </div>
            )}
            {hasP2 && (
              <div className="p2-content">
                <div 
                  className="p2-text"
                  dangerouslySetInnerHTML={{ __html: paragraph2 }}
                />
              </div>
            )}
          </div>
        )}

        {hasGalleryImages && (
          <div className="gallery-grid">
            {images.map((imageUrl, index) => {
              const hasImage = imageUrl && imageUrl.trim() !== '';
              return (
                <div key={index} className={`gallery-item ${!hasImage ? 'placeholder' : ''}`}>
                  {hasImage ? (
                    <Image
                      src={imageUrl}
                      alt={`${topicData.name} Collection ${index + 3}`}
                      width={400}
                      height={300}
                      className="gallery-img"
                      unoptimized
                    />
                  ) : (
                    <div className="placeholder-content">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p>Image {index + 3}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {keywords.length > 0 && (
          <div className="keywords-faq-wrapper">
          </div>
        )}
      </div>

      <style jsx>{`
        .dynamic-gallery-section {
          padding: 30px 0 50px 0;
          background: white;
        }

        .p2-section {
          display: flex;
          align-items: center;
          gap: 30px;
          background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 40px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .p2-image {
          flex: 0 0 30%;
          max-width: 30%;
        }

        .p2-image :global(.p2-img) {
          width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }

        .p2-content {
          flex: 0 0 65%;
          max-width: 65%;
        }

        .p2-text {
          font-size: 14px;
          color: #555;
          line-height: 1.7;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        .gallery-item {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          aspect-ratio: 16/9;
        }

        .gallery-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(44, 76, 151, 0.2);
        }

        .gallery-item :global(.gallery-img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .keywords-section {
          background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
          border-radius: 12px;
          padding: 30px;
          text-align: center;
        }

        .keywords-title {
          font-size: 22px;
          font-weight: 600;
          color: #0f2235;
          margin-bottom: 20px;
        }

        .keywords-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .keyword-tag {
          display: inline-block;
          background: white;
          color: #2C4C97;
          padding: 10px 20px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .keyword-tag:hover {
          background: #2C4C97;
          color: white;
          border-color: #2C4C97;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(44, 76, 151, 0.2);
        }

        @media (max-width: 991px) {
          .p2-section {
            flex-direction: column;
            gap: 20px;
          }

          .p2-image,
          .p2-content {
            flex: 1;
            max-width: 100%;
          }

          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .gallery-item:last-child:nth-child(odd) {
            grid-column: 1 / -1;
            max-width: 50%;
            margin: 0 auto;
          }
        }

        @media (max-width: 767px) {
          .dynamic-gallery-section {
            padding: 25px 0 35px 0;
          }

          .p2-section {
            padding: 20px;
          }

          .p2-text {
            font-size: 13px;
          }

          .gallery-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .gallery-item:last-child:nth-child(odd) {
            max-width: 100%;
          }

          .keywords-section {
            padding: 25px 20px;
          }

          .keywords-title {
            font-size: 20px;
          }

          .keyword-tag {
            padding: 8px 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
};

export default DynamicSectionGalleryKeywords;
