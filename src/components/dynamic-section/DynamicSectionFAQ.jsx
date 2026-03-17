'use client';

const DynamicSectionFAQ = ({ sectionSlug, topicData }) => {
  // Don't render if no data
  if (!topicData) return null;

  // Build FAQs array from q1-q5 and a1-a5 fields
  const faqs = [];
  for (let i = 1; i <= 5; i++) {
    const question = topicData[`q${i}`];
    const answer = topicData[`a${i}`];
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }

  // Always render FAQ section, show placeholder if no FAQs
  const hasFAQs = faqs.length > 0;

  return (
    <section className="dynamic-faq-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="faq-header text-center">
              <h2 className="faq-title">Frequently Asked Questions</h2>
              <p className="faq-description">
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
                <div className="faq-placeholder">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p>FAQs will be added soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dynamic-faq-section {
          padding: 50px 0;
          background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
        }

        .faq-header {
          margin-bottom: 35px;
        }

        .faq-title {
          font-size: 32px;
          font-weight: 700;
          color: #0f2235;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .faq-description {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 0;
        }

        .faq-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
          background: white;
        }

        .faq-item:hover {
          border-color: #2C4C97;
          box-shadow: 0 4px 12px rgba(44, 76, 151, 0.08);
        }

        .faq-item[open] {
          border-color: #2C4C97;
          box-shadow: 0 6px 16px rgba(44, 76, 151, 0.12);
        }

        .faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
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
          width: 30px;
          height: 30px;
          background: #2C4C97;
          color: white;
          border-radius: 8px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .faq-item[open] .faq-icon {
          background: #D6A74B;
          transform: rotate(45deg);
        }

        .faq-answer {
          padding: 0 18px 18px 18px;
          font-size: 14px;
          line-height: 1.7;
          color: #666;
        }

        .faq-answer p {
          margin: 0;
        }

        .faq-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #2C4C97;
          text-align: center;
        }

        .faq-placeholder svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .faq-placeholder p {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
          opacity: 0.7;
        }

        @media (max-width: 991px) {
          .faq-title {
            font-size: 28px;
          }
        }

        @media (max-width: 767px) {
          .dynamic-faq-section {
            padding: 35px 0;
          }

          .faq-title {
            font-size: 24px;
          }

          .faq-description {
            font-size: 14px;
          }

          .faq-question {
            padding: 16px;
            font-size: 14px;
          }

          .faq-answer {
            padding: 0 16px 16px 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
};

export default DynamicSectionFAQ;
