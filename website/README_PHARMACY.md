# MediCare - Pakistan's Trusted Pharmacy

A modern, full-featured e-commerce pharmacy website built with React, TypeScript, and Tailwind CSS.

## 🎨 Design Features

### Color Scheme
- **Primary Green**: #00B074
- **Accent Orange**: #FF6B35
- **Light Background**: #F4FBF7
- **White**: #FFFFFF
- **Dark Text**: #1A1A2E
- **Muted Gray**: #6B7280

### Sections Included

1. **Top Bar** - Contact info, location, and authentication buttons
2. **Header** - Logo, search bar, sign in, and cart
3. **Navigation** - Main category navigation
4. **Hero Section** - Main banner with CTA buttons and stats
5. **Today's Best Deals** - 3 promotional deal cards
6. **Shop by Category** - 6 main product categories
7. **Featured Products** - 6 product cards with ratings and pricing
8. **Shop by Health Concerns** - 8 health concern categories
9. **Healthcare Services** - 4 service offerings
10. **Why Choose MediCare** - 6 benefit highlights
11. **App Download Banner** - Mobile app promotion with stats
12. **Newsletter** - Email subscription form
13. **Footer** - Complete footer with links and contact info
14. **Floating Button** - Sticky "Upload Prescription" button

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation

```bash
# Navigate to the website folder
cd website

# Install dependencies (if not already installed)
npm install
# or
bun install
```

### Development

```bash
# Start the development server
npm run dev
# or
bun dev
```

The website will be available at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build
# or
bun run build
```

## 📁 Project Structure

```
website/
├── src/
│   ├── components/
│   │   ├── TopBar.tsx
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── HeroSection.tsx
│   │   ├── BestDeals.tsx
│   │   ├── ShopByCategory.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── HealthConcerns.tsx
│   │   ├── HealthcareServices.tsx
│   │   ├── WhyChoose.tsx
│   │   ├── AppDownload.tsx
│   │   ├── Newsletter.tsx
│   │   ├── Footer.tsx
│   │   └── FloatingButton.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
└── tailwind.config.ts
```

## 🎯 Features

- ✅ Fully responsive design
- ✅ Modern UI with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ Lucide React icons
- ✅ Hover effects and transitions
- ✅ Clean component architecture
- ✅ Professional pharmacy theme
- ✅ SEO-friendly structure

## 🛠️ Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

## 📝 Customization

### Changing Colors
Update the color values in your components or add them to `tailwind.config.ts`:

```typescript
colors: {
  primary: '#00B074',
  accent: '#FF6B35',
  // ... other colors
}
```

### Adding New Sections
Create a new component in `src/components/` and import it in `App.tsx`:

```typescript
import NewSection from './components/NewSection';

// Add to App component
<NewSection />
```

### Updating Content
Each component contains its own data. Simply modify the arrays and objects within each component file.

## 🔗 Next Steps

1. Connect to a backend API for dynamic data
2. Add shopping cart functionality
3. Implement user authentication
4. Add payment gateway integration
5. Create product detail pages
6. Add order tracking system
7. Implement prescription upload functionality

## 📄 License

This project is created for MediCare Pakistan.

---

Built with ❤️ using React + Tailwind CSS
