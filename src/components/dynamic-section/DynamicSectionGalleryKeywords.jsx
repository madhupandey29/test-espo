'use client';

import Image from 'next/image';

const DynamicSectionGalleryKeywords = ({ sectionSlug, topicData, products = [] }) => {
  const firstProduct = products?.[0];
  const collection = firstProduct?.collection;

  // Fallback chain for content
  const paragraph2 = topicData?.p2 || firstProduct?.fullProductDescription || '';
  const image2Url = topicData?.image2CloudUrl || collection?.collectionImage1CloudUrl || null;
  const images = [
    topicData?.image3CloudUrl || firstProduct?.image1CloudUrl || null,
    topicData?.image4CloudUrl || null,
  ];

  // Aggregate keywords from all products if topicData has none
  const topicKeywords = topicData?.keywords || [];
  const productKeywords = topicKeywords.length === 0
    ? [...new Set(products.flatMap(p => p.keywords || []))]
    : topicKeywords;

  const hasImage2 = image2Url && image2Url.trim() !== '';
  const hasP2 = paragraph2 && paragraph2.trim() !== '';
  const hasGalleryImages = images.some(img => img && img.trim() !== '');
  const hasKeywords = productKeywords.length > 0;

  if (!hasP2 && !hasImage2 && !hasGalleryImages && !hasKeywords) return null;

  return (
    <section className="dynamic-gallery-section">
      <div className="container">
        {(hasP2 || hasImage2) && (
          <div className="p2-section">
            {hasImage2 && (
              <div className="p2-image">
                <Image src={image2Url} alt={topicData?.name || sectionSlug} width={400} height={300} className="p2-img" unoptimized />
              </div>
            )}
            {hasP2 && (
              <div className="p2-content">
                <div className="p2-text" dangerouslySetInnerHTML={{ __html: paragraph2 }} />
              </div>
            )}
          </div>
        )}

        {hasGalleryImages && (
          <div className="gallery-grid">
            {images.map((imageUrl, index) => {
              const hasImg = imageUrl && imageUrl.trim() !== '';
              return (
                <div key={index} className={`gallery-item ${!hasImg ? 'placeholder' : ''}`}>
                  {hasImg ? (
                    <Image src={imageUrl} alt={`${topicData?.name || sectionSlug} ${index + 3}`} width={400} height={300} className="gallery-img" unoptimized />
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
      </div>
      <style jsx>{`
        .dynamic-gallery-section { padding: 30px 0 50px 0; background: white; }
        .p2-section { display: flex; align-items: center; gap: 30px; background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%); border-radius: 12px; padding: 30px; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        .p2-image { flex: 0 0 30%; max-width: 30%; }
        .p2-image :global(.p2-img) { width: 100%; height: auto; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .p2-content { flex: 0 0 65%; max-width: 65%; }
        .p2-text { font-size: 14px; color: #555; line-height: 1.7; }
        .gallery-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
        .gallery-item { position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); aspect-ratio: 16/9; transition: transform 0.3s ease; }
        .gallery-item:hover { transform: translateY(-5px); }
        .gallery-item :global(.gallery-img) { width: 100%; height: 100%; object-fit: cover; }
        .gallery-item.placeholder { background: #f0f4ff; display: flex; align-items: center; justify-content: center; }
        .placeholder-content { display: flex; flex-direction: column; align-items: center; color: #2C4C97; }
        .placeholder-content p { margin: 8px 0 0; font-size: 13px; }
        @media (max-width: 991px) {
          .p2-section { flex-direction: column; }
          .p2-image, .p2-content { flex: 1; max-width: 100%; }
        }
        @media (max-width: 767px) {
          .gallery-grid { grid-template-columns: 1fr; }
          .p2-text { font-size: 13px; }
        }
      `}</style>
    </section>
  );
};

export default DynamicSectionGalleryKeywords;
