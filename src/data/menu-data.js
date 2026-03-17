export const capabilityNavigationItems = [
  {
    id: 'products',
    title: 'Product Range',
    link: '/capabilities#products',
    icon: 'FaIndustry',
    description: 'Comprehensive fabric categories for diverse applications',
  },
  {
    id: 'process',
    title: 'Manufacturing Process',
    link: '/capabilities#process',
    icon: 'FaCogs',
    description: 'Step-by-step process ensuring quality at every stage',
  },
  {
    id: 'machines',
    title: 'Machines & Technology',
    link: '/capabilities#machines',
    icon: 'FaTools',
    description: 'Advanced machinery for superior fabric production',
  },
  {
    id: 'quality',
    title: 'Quality & Testing',
    link: '/capabilities#quality',
    icon: 'FaFlask',
    description: 'Rigorous quality control at every stage of production',
  },
  {
    id: 'certifications',
    title: 'Certifications',
    link: '/capabilities#certifications',
    icon: 'FaAward',
    description: 'International certifications ensuring quality and sustainability',
  },
];

export const primaryNavigation = [
  {
    id: 'home',
    single_link: true,
    title: 'Home',
    link: '/',
  },
  {
    id: 'fabric',
    single_link: true,
    title: 'Fabric',
    link: '/fabric',
  },
  {
    id: 'about',
    single_link: true,
    title: 'About',
    link: '/about',
  },
  {
    id: 'blog',
    single_link: true,
    title: 'Blog',
    link: '/blog',
  },
  {
    id: 'capabilities',
    capabilities: true,
    title: 'Capabilities',
    link: '/capabilities',
    capability_pages: capabilityNavigationItems,
  },
  {
    id: 'contact',
    single_link: true,
    title: 'Contact',
    link: '/contact',
  },
];

export const mobileUtilityLinks = [
  {
    id: 'wishlist',
    single_link: true,
    title: 'Wishlist',
    link: '/wishlist',
  },
];

export default primaryNavigation;
