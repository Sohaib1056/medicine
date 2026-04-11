# 🚀 Quick Start Guide - MediCare Pharmacy Website

## ⚡ Get Started in 3 Steps

### Step 1: Navigate to the Website Folder
```bash
cd website
```

### Step 2: Install Dependencies (if needed)
```bash
npm install
# or
bun install
```

### Step 3: Start Development Server
```bash
npm run dev
# or
bun dev
```

The website will open at: **http://localhost:8080**

---

## 📋 What's Included

✅ **Complete Landing Page** with all sections:
- Top Bar with contact info
- Header with search and cart
- Navigation menu
- Hero section with CTA buttons
- Today's Best Deals (3 cards)
- Shop by Category (6 categories)
- Featured Products (6 products)
- Health Concerns (8 categories)
- Healthcare Services (4 services)
- Why Choose MediCare (6 benefits)
- App Download banner
- Newsletter subscription
- Complete footer
- Floating "Upload Prescription" button

✅ **Fully Responsive** - Works on mobile, tablet, and desktop

✅ **Modern Design** - Clean, professional pharmacy theme

✅ **Ready to Customize** - All components are modular and easy to edit

---

## 🎨 Color Scheme

The website uses these colors throughout:

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary Green | `#00B074` | Buttons, links, accents |
| Accent Orange | `#FF6B35` | Badges, highlights |
| Light Background | `#F4FBF7` | Hero section background |
| Dark Text | `#1A1A2E` | Headings, main text |
| Muted Gray | `#6B7280` | Secondary text |

---

## 📝 Quick Customization

### Change Logo Text
**File**: `src/components/Header.tsx`
```typescript
<span className="text-2xl font-bold text-[#1A1A2E]">MediCare</span>
```

### Update Contact Info
**File**: `src/components/TopBar.tsx`
```typescript
<span>+92-300-1234567</span>
<span>Karachi, Pakistan</span>
```

### Add/Remove Products
**File**: `src/components/FeaturedProducts.tsx`
```typescript
const products = [
  {
    image: 'URL',
    category: 'CATEGORY',
    name: 'Product Name',
    discount: '20% OFF',
    rating: 4.5,
    reviews: 234,
    originalPrice: 250,
    price: 200,
  },
  // Add more products here
];
```

### Modify Deals
**File**: `src/components/BestDeals.tsx`
```typescript
const deals = [
  {
    title: 'Your Deal Title',
    code: 'PROMO_CODE',
    bgColor: 'bg-gradient-to-br from-[#FF6B35] to-[#ff8c5a]',
  },
];
```

---

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app component with all sections |
| `src/components/` | All reusable components |
| `src/index.css` | Global styles and Tailwind imports |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `vite.config.ts` | Vite build configuration |

---

## 🎯 Next Steps

1. **Replace Placeholder Images**: Update image URLs in components with real product images
2. **Add Real Data**: Connect to your backend API for dynamic content
3. **Implement Cart**: Add shopping cart functionality
4. **User Authentication**: Implement sign in/sign up
5. **Payment Integration**: Add payment gateway (JazzCash, EasyPaisa, etc.)
6. **Product Pages**: Create individual product detail pages
7. **Order Tracking**: Build order tracking system

---

## 📚 Documentation

- **README_PHARMACY.md** - Complete project documentation
- **COMPONENT_GUIDE.md** - Detailed guide for each component
- **QUICK_START.md** - This file

---

## 🆘 Need Help?

### Common Issues

**Port already in use?**
```bash
# Change port in vite.config.ts
server: {
  port: 3000, // Change to any available port
}
```

**Dependencies not installing?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors?**
```bash
# Check for TypeScript errors
npm run lint
```

---

## ✨ Features Highlights

- 🎨 **Modern UI/UX** - Clean, professional design
- 📱 **Fully Responsive** - Mobile-first approach
- ⚡ **Fast Performance** - Optimized with Vite
- 🔒 **Type Safe** - Built with TypeScript
- 🎯 **SEO Ready** - Semantic HTML structure
- ♿ **Accessible** - ARIA labels and semantic elements
- 🎭 **Smooth Animations** - Hover effects and transitions

---

## 🎉 You're All Set!

Your MediCare pharmacy website is ready to go. Start the dev server and begin customizing!

```bash
npm run dev
```

Visit: **http://localhost:8080**

Happy coding! 💚
