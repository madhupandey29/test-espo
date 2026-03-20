'use client';
import React from 'react';
import ContactForm from '../forms/contact-form';
import useOfficeInformation from '@/hooks/use-office-information';
import { normalizeSocialUrl } from '@/utils/socialLinks';

import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaPinterestP } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function ContactArea() {
  const { office, isLoading, error } = useOfficeInformation();

  const contactData = office
    ? {
        email: office.primaryEmail,
        salesEmail: office.salesEmail,
        supportEmail: office.supportEmail,
        phone: office.phone1,
        phone2: office.phone2,
        phone1Dept: office.phone1Dept,
        phone2Dept: office.phone2Dept,
        officeAddress: office.addressStreet && office.addressCity
          ? `${office.addressStreet}, ${office.addressCity}, ${office.addressState}, ${office.addressCountry} — ${office.addressPostalCode}`
          : null,
        factoryAddress: office.factoryAddress || null,
        warehouseAddress: office.warehouseAddress || null,
        uaeOfficeAddress: office.uaeOfficeAddress || null,
        facebook: normalizeSocialUrl(office.facebookUrl, 'facebook'),
        instagram: normalizeSocialUrl(office.instagramUrl, 'instagram'),
        linkedin: normalizeSocialUrl(office.linkedinUrl, 'linkedin'),
        twitter: normalizeSocialUrl(office.xUrl, 'twitter'),
        youtube: normalizeSocialUrl(office.youtubeUrl, 'youtube'),
        pinterest: normalizeSocialUrl(office.pinterestUrl, 'pinterest'),
      }
    : {
        email: null, salesEmail: null, supportEmail: null,
        phone: null, phone2: null, phone1Dept: null, phone2Dept: null,
        officeAddress: null, factoryAddress: null, warehouseAddress: null,
        uaeOfficeAddress: null,
        facebook: '', instagram: '', linkedin: '',
        twitter: '', youtube: '', pinterest: '',
      };

  const socials = React.useMemo(() => {
    return [
      { key: 'facebook', label: 'Facebook', url: contactData.facebook, color: '#1877F2', icon: <FaFacebookF size={18} /> },
      { key: 'instagram', label: 'Instagram', url: contactData.instagram, color: '#E4405F', icon: <FaInstagram size={18} /> },
      { key: 'linkedin', label: 'LinkedIn', url: contactData.linkedin, color: '#0A66C2', icon: <FaLinkedinIn size={18} /> },
      { key: 'twitter', label: 'X', url: contactData.twitter, color: '#111827', icon: <FaXTwitter size={18} /> },
      { key: 'youtube', label: 'YouTube', url: contactData.youtube, color: '#FF0000', icon: <FaYoutube size={20} /> },
      { key: 'pinterest', label: 'Pinterest', url: contactData.pinterest, color: '#E60023', icon: <FaPinterestP size={18} /> },
    ].filter((x) => !!x.url);
  }, [
    contactData.facebook, contactData.instagram, contactData.linkedin,
    contactData.twitter, contactData.youtube, contactData.pinterest,
  ]);

  return (
    <section className="ca-section">
      <div className="ca-wrapper">
        <div className="ca-grid">

          {/* Left: Contact Info */}
          <div className="ca-info-side">
            <div className="ca-heading-block">
              <h2 className="ca-heading">Get in Touch</h2>
              <div className="ca-heading-bar" />
            </div>

            <p className="ca-subtitle">
              We&apos;d love to hear from you. Reach out to us through any of the following channels.
            </p>

            {(contactData.salesEmail || contactData.supportEmail || contactData.email) && (
              <div className="ca-info-line">
                <div className="ca-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ca-info-flex">
                  {contactData.salesEmail && (
                    <div className={contactData.supportEmail ? 'ca-info-sub-gap' : ''}>
                      <span className="ca-label">Sales Email</span>
                      <a href={`mailto:${contactData.salesEmail}`} className="ca-value ca-link ca-link--block">
                        {contactData.salesEmail}
                      </a>
                    </div>
                  )}
                  {contactData.supportEmail && (
                    <div>
                      <span className="ca-label">Support Email</span>
                      <a href={`mailto:${contactData.supportEmail}`} className="ca-value ca-link ca-link--block">
                        {contactData.supportEmail}
                      </a>
                    </div>
                  )}
                  {!contactData.salesEmail && !contactData.supportEmail && contactData.email && (
                    <div>
                      <span className="ca-label">Email</span>
                      <a href={`mailto:${contactData.email}`} className="ca-value ca-link">
                        {contactData.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {contactData.phone && (
              <div className="ca-info-line">
                <div className="ca-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92V19.92C22 20.52 21.39 21 20.92 21C9.11 21 1 12.89 1 1.08C1 0.61 1.48 0 2.08 0H5.08C5.68 0 6.08 0.4 6.08 0.92C6.08 3.29 6.56 5.54 7.47 7.57C7.61 7.89 7.51 8.27 7.22 8.49L5.9 9.52C7.07 11.57 8.43 12.93 10.48 14.1L11.51 12.78C11.73 12.49 12.11 12.39 12.43 12.53C14.46 13.44 16.71 13.92 19.08 13.92C19.6 13.92 20 14.32 20 14.92V16.92H22Z" fill="currentColor" />
                  </svg>
                </div>
                <div className="ca-info-flex">
                  <span className="ca-label">Phone</span>
                  <div>
                    <a href={`tel:${contactData.phone}`} className="ca-value ca-link ca-link--block">
                      {contactData.phone}{contactData.phone1Dept && ` (${contactData.phone1Dept})`}
                    </a>
                    {contactData.phone2 && contactData.phone2 !== contactData.phone && (
                      <a href={`tel:${contactData.phone2}`} className="ca-value ca-link ca-link--block ca-link--small">
                        {contactData.phone2}{contactData.phone2Dept && ` (${contactData.phone2Dept})`}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {contactData.officeAddress && (
              <div className="ca-info-line">
                <div className="ca-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.03 7.03 1 12 1S21 5.03 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ca-info-flex">
                  <span className="ca-label ca-label--gold">Office Address</span>
                  <span className="ca-value">{contactData.officeAddress}</span>
                </div>
              </div>
            )}

            {contactData.factoryAddress && (
              <div className="ca-info-line">
                <div className="ca-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M2 20H22V22H2V20Z" fill="currentColor" />
                    <path d="M3 20V9L8 6V4H10V6L15 9V20H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 9L20 6V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ca-info-flex">
                  <span className="ca-label ca-label--gold">Factory Address</span>
                  <span className="ca-value">{contactData.factoryAddress}</span>
                </div>
              </div>
            )}

            {contactData.warehouseAddress && (
              <div className="ca-info-line">
                <div className="ca-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 8.35L12 2L2 8.35L12 14.7L22 8.35Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 10.1V16.5L12 20L18 16.5V10.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ca-info-flex">
                  <span className="ca-label ca-label--gold">Warehouse Address</span>
                  <span className="ca-value">{contactData.warehouseAddress}</span>
                </div>
              </div>
            )}

            {socials.length > 0 && (
              <div className="ca-info-line">
                <div className="ca-icon ca-icon--social">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 2H6C3.79 2 2 3.79 2 6V18C2 20.21 3.79 22 6 22H18C20.21 22 22 20.21 22 18V6C22 3.79 20.21 2 18 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 12L12 7L17 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ca-info-flex">
                  <span className="ca-label">Follow Us</span>
                  <div className="ca-social-icons" aria-label="Social media links">
                    {socials.map((s) => (
                      <a
                        key={s.key}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ca-social-btn"
                        aria-label={s.label}
                        title={s.label}
                        // color values are dynamic from API — must stay inline
                        style={{
                          borderColor: `${s.color}55`,
                          background: `${s.color}14`,
                          color: s.color,
                        }}
                      >
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="ca-loading">Loading contact information...</div>
            )}

            {error && (
              <div className="ca-error">
                Unable to load contact information. Please try again later.
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="ca-form-side">
            <div className="ca-form-bar" />
            <div className="ca-form-header">
              <h3 className="ca-form-title">Send us a Message</h3>
              <p className="ca-form-desc">
                Fill out the form below and we&apos;ll get back to you shortly.
              </p>
            </div>
            <ContactForm />
          </div>

        </div>
      </div>
    </section>
  );
}
