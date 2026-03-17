import React from 'react';
import Wrapper from '@/layout/wrapper';
import HeaderTwo from '@/layout/headers/header-2';
import Footer from '@/layout/footers/footer';
import CompactUniversalBreadcrumb from '@/components/breadcrumb/compact-universal-breadcrumb';
import { BreadcrumbJsonLd } from '@/utils/breadcrumbStructuredData';
import CareersClient from './CareersClient';
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const revalidate = 86400;

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Careers - Join Our Team",
    description: "Explore exciting career opportunities at our company. Join a team of passionate professionals dedicated to excellence in textile manufacturing and innovation.",
    keywords: "careers, jobs, employment, textile jobs, manufacturing careers, join our team",
    path: "/careers",
    ogImage: "/assets/img/logo/logo.svg",
    robots: "index, follow"
  });
}

const CareersPage = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Careers' }
  ];

  const breadcrumbStructuredData = [
    { name: 'Home', url: '/' },
    { name: 'Careers', url: '/careers' }
  ];

  return (
    <>
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
      
      <Wrapper>
        <HeaderTwo style_2={true} />
        <CompactUniversalBreadcrumb items={breadcrumbItems} />
        <CareersClient />
        <Footer primary_style={true} />
      </Wrapper>
    </>
  );
};

export default CareersPage;

