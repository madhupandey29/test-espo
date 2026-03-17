# Career Page - Ultra-Modern Design Documentation

## Overview
A beautifully designed, modern, and professional career page that seamlessly integrates with your existing theme.

## Features Implemented

### 1. **Hero Section** ✨
- Animated gradient background with floating shapes
- Dynamic "We're Hiring!" badge with pulse animation
- Gradient text highlight effect
- Dual CTA buttons (Explore Opportunities & Apply Now)
- Smooth scroll navigation
- Fully responsive with fade-in animations

### 2. **Company Stats Section** 📊
- 4 animated stat cards showing:
  - 500+ Team Members
  - 25+ Years Experience
  - 50+ Countries Served
  - 98% Employee Satisfaction
- Hover effects with elevation
- Staggered fade-in animations

### 3. **Benefits & Perks Section** 🎁
- 6 colorful benefit cards with unique gradients:
  - Health & Wellness (Red gradient)
  - Learning & Development (Teal gradient)
  - Performance Rewards (Yellow gradient)
  - Work-Life Balance (Purple gradient)
  - Innovation Culture (Orange gradient)
  - Team Collaboration (Green gradient)
- Animated icons with glow effects
- Hover animations with arrow indicators
- Glassmorphism design elements

### 4. **Job Openings Section** 💼
- Department filter with 5 categories:
  - All Positions
  - Production
  - Quality Control
  - Sales & Marketing
  - Design & Development
- 6 sample job listings with:
  - Job badge icons
  - Full-time tags
  - Location and experience requirements
  - Detailed descriptions
  - Key requirements with checkmarks
  - "Apply for this Position" buttons
- Hover effects with top gradient bar
- Active state highlighting
- Smooth filtering animations

### 5. **Application Form Section** 📝
- Professional form with fields:
  - Full Name (required)
  - Email Address (required)
  - Phone Number
  - Position dropdown (required)
  - Years of Experience
  - Cover Letter textarea
  - Resume file upload
- Modern input styling with focus effects
- Glassmorphism card design
- Form validation with toast notifications
- Smooth scroll to form when clicking "Apply Now"

## Design Features

### Color Palette
- **Primary Blue**: #2C4C97 (AGE Blue)
- **Secondary Gold**: #D6A74B (AGE Gold)
- **Gradients**: Multiple custom gradients for each benefit card
- **Text Colors**: Consistent with your theme tokens

### Typography
- **Headings**: Poppins/Jost (var(--tp-ff-jost))
- **Body**: Inter/Roboto (var(--tp-ff-roboto))
- **Font Sizes**: Responsive scaling from mobile to desktop

### Animations
- **fadeInUp**: Smooth entrance animations
- **float**: Floating shapes in hero background
- **pulse**: Pulsing badge effect
- **shimmer**: Subtle shimmer effects on hover
- **Staggered delays**: Sequential animations for cards

### Modern UI Elements
- **Glassmorphism**: Frosted glass effects with backdrop-filter
- **Neumorphism**: Soft shadows and depth
- **Gradient Overlays**: Multi-layer gradients
- **Smooth Transitions**: Cubic-bezier easing functions
- **Hover Effects**: Elevation, scale, and color transitions
- **Border Animations**: Gradient top borders on job cards

## Responsive Breakpoints

- **Desktop**: 1200px+ (Full layout)
- **Laptop**: 992px - 1199px (Adjusted spacing)
- **Tablet**: 768px - 991px (2-column grid)
- **Mobile**: 576px - 767px (Single column)
- **Small Mobile**: < 576px (Optimized for small screens)

## File Structure

```
src/app/careers/
├── page.jsx              # Server component with SEO metadata
└── CareersClient.jsx     # Client component with all functionality
```

## Integration

### Footer Menu
The "Careers" link has been added to the footer's "Quick Links" section between "Products" and "Blog".

### Navigation
- Accessible via `/careers` route
- Includes breadcrumb navigation
- SEO optimized with metadata

## Customization

### Adding New Jobs
Edit the `jobOpenings` array in `CareersClient.jsx`:

```javascript
{
  id: 7,
  title: 'Your Job Title',
  department: 'production', // or 'quality', 'sales', 'design'
  location: 'Location',
  type: 'Full-time',
  experience: 'X-Y years',
  description: 'Job description...',
  requirements: ['Requirement 1', 'Requirement 2', 'Requirement 3']
}
```

### Changing Benefits
Edit the `benefits` array to modify icons, titles, descriptions, and colors.

### Updating Stats
Edit the `companyStats` array to change numbers and labels.

## Performance Optimizations

- CSS-in-JS with styled-jsx for scoped styles
- Lazy loading of animations
- Optimized SVG icons from react-icons
- Minimal re-renders with proper state management
- Smooth 60fps animations

## Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus states on interactive elements
- Proper heading hierarchy
- Alt text for icons (via aria-hidden)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential additions:
- Backend integration for job applications
- Email notifications
- Application tracking system
- Video testimonials section
- Employee spotlight carousel
- Live chat integration
- Social media sharing
- Print-friendly application forms

---

**Created**: March 2026
**Theme**: AGE Textile Manufacturing
**Design Style**: Ultra-modern, Professional, Aesthetic
