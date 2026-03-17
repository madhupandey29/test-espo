'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaBriefcase, FaMapMarkerAlt, FaClock, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import styles from './Careers.module.scss';

const CareersClient = () => {
  const [applicationForm, setApplicationForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    coverLetter: '',
    resume: null
  });

  const allJobs = [
    {
      id: 1,
      title: 'Production Manager',
      location: 'Ahmedabad, Gujarat',
      type: 'Full-time',
      experience: '5-8 years',
      description: 'Lead our production team to ensure efficient manufacturing processes and quality output.',
      requirements: ['Bachelor\'s degree in Textile Engineering', 'Strong leadership skills', 'Experience in textile manufacturing']
    },
    {
      id: 2,
      title: 'Production Supervisor',
      location: 'Ahmedabad, Gujarat',
      type: 'Full-time',
      experience: '4-6 years',
      description: 'Supervise daily production activities and ensure smooth operations on the factory floor.',
      requirements: ['Experience in textile production', 'Team management skills', 'Problem-solving abilities']
    },
    {
      id: 3,
      title: 'Quality Control Specialist',
      location: 'Ahmedabad, Gujarat',
      type: 'Full-time',
      experience: '3-5 years',
      description: 'Ensure our products meet the highest quality standards through rigorous testing and inspection.',
      requirements: ['Knowledge of textile quality standards', 'Attention to detail', 'Experience with testing equipment']
    },
    {
      id: 4,
      title: 'Sales Executive',
      location: 'Multiple Locations',
      type: 'Full-time',
      experience: '2-4 years',
      description: 'Drive business growth by building relationships with clients and expanding our market presence.',
      requirements: ['Excellent communication skills', 'B2B sales experience', 'Knowledge of textile industry']
    },
    {
      id: 5,
      title: 'Marketing Manager',
      location: 'Ahmedabad, Gujarat',
      type: 'Full-time',
      experience: '5-7 years',
      description: 'Develop and execute marketing strategies to promote our brand and products globally.',
      requirements: ['Marketing degree or equivalent', 'Digital marketing expertise', 'Strategic thinking']
    },
    {
      id: 6,
      title: 'Textile Designer',
      location: 'Ahmedabad, Gujarat',
      type: 'Full-time',
      experience: '3-6 years',
      description: 'Create innovative fabric designs that meet market trends and customer requirements.',
      requirements: ['Degree in Textile Design', 'Proficiency in design software', 'Creative mindset']
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setApplicationForm(prev => ({ ...prev, resume: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!applicationForm.fullName || !applicationForm.email || !applicationForm.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      toast.success('Application submitted successfully! We\'ll be in touch soon.');
      setApplicationForm({
        fullName: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        coverLetter: '',
        resume: null
      });
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    }
  };

  const scrollToForm = (jobTitle) => {
    setApplicationForm(prev => ({ ...prev, position: jobTitle }));
    document.getElementById('application-form').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.careersPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay}></div>
        <div className="container">
          <div className={styles.heroContent}>
            <h1>Join Our Team</h1>
            <p>Build your career with a leading textile manufacturer. Explore opportunities across different departments and grow with us.</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className="container">
          {/* Section Header */}
          <div className={styles.positionsHeader}>
            <h2>Open Positions</h2>
          </div>

          {/* All Jobs Grid */}
          <div className={styles.jobsGrid}>
            {allJobs.map(job => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <h3 className={styles.jobTitle}>{job.title}</h3>
                  <span className={styles.jobType}>{job.type}</span>
                </div>

                <div className={styles.jobMeta}>
                  <span><FaMapMarkerAlt /> {job.location}</span>
                  <span><FaClock /> {job.experience}</span>
                </div>

                <p className={styles.jobDescription}>{job.description}</p>

                <div className={styles.jobRequirements}>
                  <strong>Requirements:</strong>
                  <ul>
                    {job.requirements.map((req, idx) => (
                      <li key={idx}>
                        <FaCheckCircle /> {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  className={styles.applyBtn}
                  onClick={() => scrollToForm(job.title)}
                >
                  Apply Now <FaArrowRight />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Application Form */}
      <section className={styles.applicationSection} id="application-form">
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.headerLine}></div>
            <div>
              <h2>Apply for a Position</h2>
              <p>Fill out the form below and we'll get back to you soon</p>
            </div>
            <div className={styles.headerLine}></div>
          </div>

          <div className={styles.formWrapper}>
            <form onSubmit={handleSubmit} className={styles.applicationForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={applicationForm.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={applicationForm.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={applicationForm.phone}
                    onChange={handleInputChange}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Position Applied For *</label>
                  <select
                    name="position"
                    value={applicationForm.position}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a position</option>
                    {allJobs.map(job => (
                      <option key={job.id} value={job.title}>{job.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Years of Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={applicationForm.experience}
                  onChange={handleInputChange}
                  placeholder="e.g., 5 years"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Cover Letter</label>
                <textarea
                  name="coverLetter"
                  value={applicationForm.coverLetter}
                  onChange={handleInputChange}
                  placeholder="Tell us why you'd be a great fit for this role..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Upload Resume (PDF, DOC, DOCX)</label>
                <input
                  type="file"
                  name="resume"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                Submit Application <FaArrowRight />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersClient;
