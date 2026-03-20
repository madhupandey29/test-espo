'use client';

import React, { useState, useRef } from 'react';
import { debugLog } from '@/utils/debugLog';

const DEFAULT_STORAGE_KEY = 'fabricpro_contact_form';

function headersToObject(headers) {
  const result = {};
  headers.forEach((value, key) => { result[key] = value; });
  return result;
}

function mapToBackend(f) {
  let formattedPhone = '';
  if (f.phone && f.phone.trim()) {
    let cleanPhone = f.phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length >= 7) {
      if (!cleanPhone.startsWith('+')) cleanPhone = '+1' + cleanPhone;
      formattedPhone = cleanPhone;
    }
  }
  return {
    salutationName: f.salutation || '',
    firstName: f.firstName?.trim() || '',
    lastName: f.lastName?.trim() || '',
    middleName: f.middleName?.trim() || '',
    emailAddress: f.email?.trim().toLowerCase() || '',
    phoneNumber: formattedPhone,
    accountName: f.companyName?.trim() || '',
    addressStreet: f.addressStreet?.trim() || '',
    addressCity: f.addressCity?.trim() || '',
    addressState: f.addressState?.trim() || '',
    addressCountry: f.addressCountry?.trim() || '',
    addressPostalCode: f.addressPostalCode?.trim() || '',
    opportunityAmountCurrency: f.opportunityAmountCurrency || 'USD',
    opportunityAmount: f.opportunityAmount ? parseFloat(f.opportunityAmount) : null,
    cBusinessType: f.businessType ? [f.businessType] : [],
    cFabricCategory: f.fabricCategory ? [f.fabricCategory] : [],
    description: f.description?.trim() || '',
  };
}

const EMPTY = {
  salutation: '', firstName: '', lastName: '', middleName: '',
  email: '', phone: '', companyName: '',
  addressStreet: '', addressCity: '', addressState: '', addressCountry: '', addressPostalCode: '',
  opportunityAmountCurrency: 'USD', opportunityAmount: '',
  businessType: '', fabricCategory: '', description: '',
};

export default function ContactForm({ onSuccess, storageKey = DEFAULT_STORAGE_KEY }) {
  const initialSnapshot = (() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [formData, setFormData] = useState(() => ({ ...EMPTY, ...(initialSnapshot?.formData ?? {}) }));
  const [currentStep, setCurrentStep] = useState(() => {
    const s = Number(initialSnapshot?.currentStep);
    return s >= 1 && s <= 3 ? s : 1;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const honeypotRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    if (validationErrors[name] || validationErrors.contact) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        if ((name === 'email' || name === 'phone') && value.trim()) delete next.contact;
        return next;
      });
    }
    const updatedFormData = { ...formData, [name]: value };
    localStorage.setItem(storageKey, JSON.stringify({ formData: updatedFormData, currentStep }));
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email && !formData.phone) errors.contact = 'Please provide either an email address or phone number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address';
    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s\-()\\+]/g, '');
      if (!/^\d{7,15}$/.test(cleanPhone)) errors.phone = 'Please enter a valid phone number (7-15 digits)';
      else if (cleanPhone.length < 10) errors.phone = 'Phone number should be at least 10 digits';
    }
    return errors;
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const goNext = () => {
    if (currentStep === 1) {
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) { setValidationErrors(errors); triggerShake(); return; }
      setValidationErrors({});
    }
    setCurrentStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => { setValidationErrors({}); setCurrentStep((s) => Math.max(1, s - 1)); };

  const goToStep = (step) => {
    if (step < 1 || step > 3) return;
    if (step > currentStep && currentStep === 1) {
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) { setValidationErrors(errors); triggerShake(); return; }
    }
    setValidationErrors({});
    setCurrentStep(step);
  };

  const resetAll = () => { localStorage.removeItem(storageKey); setFormData({ ...EMPTY }); setCurrentStep(1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypotRef.current?.value) { alert('Spam detected'); return; }
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) { setValidationErrors(errors); triggerShake(); return; }
    setIsSubmitting(true);
    try {
      const payload = mapToBackend(formData);
      debugLog('Form data being sent:', payload);
      const apiUrl = 'https://espo.egport.com/api/v1/LeadCapture/a4624c9bb58b8b755e3d94f1a25fc9be';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': navigator.userAgent || 'Unknown' },
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit',
      });
      debugLog('Response status:', response.status);
      debugLog('Response headers:', headersToObject(response.headers));
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { message: errorText }; }
        if (response.status === 400 && errorData?.messageTranslation?.data?.field) {
          const field = errorData.messageTranslation.data.field;
          const fieldMap = { phoneNumber: 'phone', emailAddress: 'email', firstName: 'firstName', lastName: 'lastName' };
          if (fieldMap[field]) {
            setValidationErrors({ [fieldMap[field]]: `Please check your ${fieldMap[field].replace(/([A-Z])/g, ' $1').toLowerCase()}` });
            triggerShake();
            return;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      const result = await response.json();
      debugLog('Success response:', result);
      resetAll();
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); onSuccess?.(); }, 2000);
    } catch (err) {
      console.error('Full error details:', err);
      let msg = 'Failed to submit form. Please try again.';
      if (err?.message?.includes('404')) msg = 'Submission endpoint not found. Please contact support.';
      else if (err?.message?.includes('500')) msg = 'Server error. Please try again later.';
      else if (err?.message?.includes('CORS') || err?.message?.includes('fetch') || err?.message?.includes('NetworkError')) msg = 'Network error. Please check your connection and try again.';
      else if (err?.message?.includes('400')) msg = 'Please check your information and try again.';
      else if (err?.message) msg = err.message;
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="cf-success-wrap">
        <div className="cf-success-box">
          <div className="cf-success-icon">✓</div>
          <h3 className="cf-success-title">Request Submitted</h3>
          <p className="cf-success-msg">Thank you! {`We'll`} contact you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-wrap">
      <div className="cf-inner">
        <div className="cf-progress">
          <div className={currentStep >= 1 ? 'cf-circle cf-circle--active' : 'cf-circle'} onClick={() => goToStep(1)}>1</div>
          <div className="cf-line" />
          <div className={currentStep >= 2 ? 'cf-circle cf-circle--active' : 'cf-circle'} onClick={() => goToStep(2)}>2</div>
          <div className="cf-line" />
          <div className={currentStep >= 3 ? 'cf-circle cf-circle--active' : 'cf-circle'} onClick={() => goToStep(3)}>3</div>
        </div>
        <div className="cf-step-label">Step {currentStep} of 3</div>

        {/* shake is dynamic (JS state) — must stay inline */}
        <form onSubmit={handleSubmit} noValidate className={shake ? 'cf-form--shake' : ''}>
          <div className="cf-honeypot">
            <input ref={honeypotRef} name="hp" type="text" autoComplete="off" />
          </div>

          {currentStep === 1 && (
            <div className="cf-step">
              {validationErrors.contact && <div className="cf-validation-msg">{validationErrors.contact}</div>}
              <InputSelect label="Salutation" name="salutation" value={formData.salutation} onChange={handleInputChange}
                options={[['','Select salutation'],['Mr.','Mr.'],['Ms.','Ms.'],['Mrs.','Mrs.'],['Dr.','Dr.']]} />
              <InputField label="First Name *" name="firstName" placeholder="Your first name" value={formData.firstName}
                onChange={handleInputChange} error={validationErrors.firstName} hasError={!!validationErrors.firstName} />
              <InputField label="Last Name *" name="lastName" placeholder="Your last name" value={formData.lastName}
                onChange={handleInputChange} error={validationErrors.lastName} hasError={!!validationErrors.lastName} />
              <InputField label="Middle Name" name="middleName" placeholder="Your middle name (optional)" value={formData.middleName} onChange={handleInputChange} />
              <InputField label="Email Address *" name="email" type="email" placeholder="your@company.com" value={formData.email}
                onChange={handleInputChange} error={validationErrors.email} hasError={!!validationErrors.email} />
              <InputField label="Phone Number *" name="phone" type="tel" placeholder="+1 (555) 123-4567" value={formData.phone}
                onChange={handleInputChange} error={validationErrors.phone} hasError={!!validationErrors.phone} />
              <div className="cf-hint">* Please provide either an email address or phone number</div>
              <div className="cf-actions">
                <div />
                <button type="button" className="cf-btn cf-btn--primary" onClick={goNext}>Next Step</button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="cf-step">
              <InputField label="Company Name" name="companyName" placeholder="Your company name" value={formData.companyName} onChange={handleInputChange} />
              <InputField label="Street Address" name="addressStreet" placeholder="Street address" value={formData.addressStreet} onChange={handleInputChange} />
              <InputField label="City" name="addressCity" placeholder="City" value={formData.addressCity} onChange={handleInputChange} />
              <InputField label="State/Province" name="addressState" placeholder="State or Province" value={formData.addressState} onChange={handleInputChange} />
              <InputField label="Country" name="addressCountry" placeholder="Country" value={formData.addressCountry} onChange={handleInputChange} />
              <InputField label="Postal Code" name="addressPostalCode" placeholder="Postal/ZIP code" value={formData.addressPostalCode} onChange={handleInputChange} />
              <div className="cf-actions">
                <button type="button" className="cf-btn cf-btn--ghost" onClick={goBack}>Previous</button>
                <button type="button" className="cf-btn cf-btn--primary" onClick={goNext}>Next Step</button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="cf-step">
              <InputSelect label="Business Type" name="businessType" value={formData.businessType} onChange={handleInputChange}
                options={[['','Select business type'],['garment-manufacturer','Garment Manufacturer'],['clothing-retailer','Clothing Retailer'],['fabric-importer','Fabric Importer'],['trading-company','Trading Company'],['other','Other']]} />
              <InputSelect label="Fabric Category" name="fabricCategory" value={formData.fabricCategory} onChange={handleInputChange}
                options={[['','Select fabric category'],['cotton','Cotton'],['silk','Silk'],['polyester','Polyester'],['blends','Blends'],['linen','Linen'],['wool','Wool'],['technical','Technical'],['denim','Denim']]} />
              <div className="cf-amount-row">
                <div className="cf-amount-main">
                  <InputField label="Opportunity Amount" name="opportunityAmount" type="number" placeholder="0.00" value={formData.opportunityAmount} onChange={handleInputChange} />
                </div>
                <div className="cf-amount-currency">
                  <InputSelect label="Currency" name="opportunityAmountCurrency" value={formData.opportunityAmountCurrency} onChange={handleInputChange}
                    options={[['USD','USD'],['EUR','EUR'],['GBP','GBP'],['INR','INR'],['CNY','CNY']]} />
                </div>
              </div>
              <InputTextArea label="Description" name="description" placeholder="Please describe your requirements, specifications, or any additional information"
                value={formData.description} onChange={handleInputChange} />
              <div className="cf-actions">
                <button type="button" className="cf-btn cf-btn--ghost" onClick={goBack}>Previous</button>
                {/* opacity is dynamic (isSubmitting state) — must stay inline */}
                <button type="submit" className={`cf-btn cf-btn--primary${isSubmitting ? ' cf-btn--submitting' : ''}`} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, type = 'text', error, hasError }) {
  return (
    <div className="cf-input-group">
      <label htmlFor={name} className="cf-label">{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
        className={hasError ? 'cf-input cf-input--error' : 'cf-input'} />
      {error && <div className="cf-error-text">{error}</div>}
    </div>
  );
}

function InputSelect({ label, name, value, onChange, options }) {
  return (
    <div className="cf-input-group">
      <label htmlFor={name} className="cf-label">{label}</label>
      <select id={name} name={name} value={value} onChange={onChange} className="cf-input">
        {options.map(([v, text]) => <option key={v + text} value={v}>{text}</option>)}
      </select>
    </div>
  );
}

function InputTextArea({ label, name, value, onChange, placeholder }) {
  return (
    <div className="cf-input-group">
      <label htmlFor={name} className="cf-label">{label}</label>
      <textarea id={name} name={name} placeholder={placeholder} value={value} onChange={onChange} rows={3} className="cf-textarea" />
    </div>
  );
}
