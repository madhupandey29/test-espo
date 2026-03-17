'use client';

const DynamicSectionKeywordsFAQ = ({ sectionSlug, topicData }) => {
  // Don't render if no data
  if (!topicData) return null;

  // Get keywords from API
  const keywords = topicData?.keywords || [];

  // Build FAQs array from q1-q5 and a1-a5 fields
  const faqs = [];
  for (let i = 1; i <= 5; i++) {
    const question = topicData[`q${i}`];
    const answer = topicData[`a${i}`];
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }

  const hasKeywords = keywords.length > 0;
  const hasFAQs = faqs.length > 0;

  // Don't render if no content
  if (!hasKeywords && !hasFAQs) return null;

  return (
    <section className="keywords-faq-section">
      <div className="container">
        <div className="keywords-faq-grid">
          {/* FAQ Column */}
          <div className="faq-column">
            <div className="section-header">
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-description">
                Find answers to common questions about our {topicData.name} collection
              </p>
            </div>

            <div className="faq-container">
              {hasFAQs ? (
                faqs.map((faq, index) => (
                  <details key={index} className="faq-item">
                    <summary className="faq-question">
                      <span className="question-text">{faq.question}</span>
                      <span className="faq-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 3.5V12.5M3.5 8H12.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </summary>
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                ))
              ) : (
                <div className="placeholder-box">
                  <p>FAQs will be added soon</p>
                </div>
              )}
            </div>
          </div>

          {/* Keywords Column */}
          <div className="keywords-column">
            <div className="section-header">
              <h2 className="section-title">Popular Keywords</h2>
              <p className="section-description">
                Quick suitability + the common search terms buyers use for this fabric.
              </p>
            </div>

            <div className="keywords-container">
              {hasKeywords ? (
                keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))
              ) : (
                <div className="placeholder-box">
                  <p>Keywords will be added soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .keywords-faq-section {
          padding: 50px 0;
          background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
        }

        .keywords-faq-grid {
          display: grid;
          grid-template-columns: 65% 35%;
          gap: 30px;
        }

        .faq-column,
        .keywords-column {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f2235;
          margin-bottom: 8px;
          line-height: 1.2;
        }

        .section-description {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 0;
        }

        /* FAQ Styles */
        .faq-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .faq-item:hover {
          border-color: #2C4C97;
        }

        .faq-item[open] {
          border-color: #2C4C97;
          box-shadow: 0 2px 8px rgba(44, 76, 151, 0.1);
        }

        .faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #0f2235;
          list-style: none;
        }

        .faq-question::-webkit-details-marker {
          display: none;
        }

        .question-text {
          flex: 1;
          padding-right: 12px;
        }

        .faq-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #2C4C97;
          color: white;
          border-radius: 6px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .faq-item[open] .faq-icon {
          background: #D6A74B;
          transform: rotate(45deg);
        }

        .faq-answer {
          padding: 0 16px 16px 16px;
          font-size: 13px;
          line-height: 1.7;
          color: #666;
        }

        .faq-answer p {
          margin: 0;
        }

        /* Keywords Styles */
        .keywords-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .keyword-tag {
          display: inline-block;
          background: #f0f4ff;
          color: #2C4C97;
          padding: 10px 18px;
          border-radius: 20px;
          font-size: 13px;
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

        .placeholder-box {
          padding: 40px 20px;
          text-align: center;
          color: #999;
          background: #f9fafb;
          border-radius: 8px;
        }

        .placeholder-box p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 991px) {
          .keywords-faq-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .section-title {
            font-size: 22px;
          }
        }

        @media (max-width: 767px) {
          .keywords-faq-section {
            padding: 35px 0;
          }

          .faq-column,
          .keywords-column {
            padding: 20px;
          }

          .section-title {
            font-size: 20px;
          }

          .section-description {
            font-size: 13px;
          }

          .faq-question {
            padding: 14px;
            font-size: 13px;
          }

          .faq-answer {
            padding: 0 14px 14px 14px;
            font-size: 12px;
          }

          .keyword-tag {
            padding: 8px 14px;
            font-size: 12px;
          }
        }
      `}</style>
    </section>
  );
};

export default DynamicSectionKeywordsFAQ;
