# MediCare Component Guide

This guide provides an overview of each component and how to customize them.

## 🔝 TopBar Component
**File**: `src/components/TopBar.tsx`

**Features**:
- Phone number display
- Location display
- Track Order & Help links
- Sign up and Google login buttons

**Customization**:
```typescript
// Change phone number
<span>+92-300-1234567</span>

// Change location
<span>Karachi, Pakistan</span>
```

---

## 🎯 Header Component
**File**: `src/components/Header.tsx`

**Features**:
- MediCare logo
- Search bar
- Sign In link
- Shopping cart with badge

**Customization**:
```typescript
// Change logo text
<span className="text-2xl font-bold text-[#1A1A2E]">MediCare</span>

// Change search placeholder
placeholder="Search medicines, health products, wellness items..."
```

---

## 🧭 Navigation Component
**File**: `src/components/Navigation.tsx`

**Features**:
- Main category navigation
- Hover effects

**Customization**:
```typescript
const navItems = [
  'Medicine',
  'Lab Tests',
  'Health Devices',
  // Add or remove items here
];
```

---

## 🎨 HeroSection Component
**File**: `src/components/HeroSection.tsx`

**Features**:
- Badge with trust message
- Main heading with highlighted text
- Description text
- Two CTA buttons
- Three stat cards
- Hero image

**Customization**:
```typescript
// Change main heading
<h1>Pakistan's Most <span className="text-[#00B074]">Trusted</span><br />Online Pharmacy</h1>

// Change stats
<p className="font-bold">2 Hours</p>
<p className="text-sm">Express Delivery</p>
```

---

## 💰 BestDeals Component
**File**: `src/components/BestDeals.tsx`

**Features**:
- Three deal cards
- Hot Deal badges
- Promo codes
- Shop Now buttons

**Customization**:
```typescript
const deals = [
  {
    title: 'Flat 30% OFF on First Order',
    code: 'FIRST30',
    bgColor: 'bg-gradient-to-br from-[#FF6B35] to-[#ff8c5a]',
  },
  // Add more deals here
];
```

---

## 📦 ShopByCategory Component
**File**: `src/components/ShopByCategory.tsx`

**Features**:
- Six category cards
- Icons with colored backgrounds
- Item counts

**Customization**:
```typescript
const categories = [
  { 
    icon: Pill, 
    name: 'Medicines', 
    count: '3000+', 
    bgColor: 'bg-blue-100', 
    iconColor: 'text-blue-600' 
  },
  // Add or modify categories
];
```

---

## ⭐ FeaturedProducts Component
**File**: `src/components/FeaturedProducts.tsx`

**Features**:
- Six product cards
- Product images
- Discount badges
- Star ratings
- Price display (original + discounted)
- Add to Cart buttons

**Customization**:
```typescript
const products = [
  {
    image: 'https://placehold.co/250x250/e3f2fd/1976d2?text=Panadol',
    category: 'PAIN RELIEF',
    name: 'Panadol Extra 500mg',
    discount: '20% OFF',
    rating: 4.5,
    reviews: 234,
    originalPrice: 250,
    price: 200,
  },
  // Add more products
];
```

---

## 🏥 HealthConcerns Component
**File**: `src/components/HealthConcerns.tsx`

**Features**:
- Eight health concern categories
- Icon cards with counts
- Hover effects

**Customization**:
```typescript
const concerns = [
  { 
    icon: Heart, 
    name: 'Heart Care', 
    count: '150+', 
    bgColor: 'bg-red-50', 
    iconColor: 'text-red-500' 
  },
  // Add more concerns
];
```

---

## 🩺 HealthcareServices Component
**File**: `src/components/HealthcareServices.tsx`

**Features**:
- Four service cards
- Service images
- Icons
- Learn More links

**Customization**:
```typescript
const services = [
  {
    icon: FileText,
    title: 'Order with Prescription',
    description: 'Upload your prescription...',
    image: 'https://placehold.co/400x300/...',
  },
  // Add more services
];
```

---

## ✨ WhyChoose Component
**File**: `src/components/WhyChoose.tsx`

**Features**:
- Six benefit cards
- Icons with colored backgrounds
- Descriptions

**Customization**:
```typescript
const benefits = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Get your medicines delivered within 2 hours...',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  // Add more benefits
];
```

---

## 📱 AppDownload Component
**File**: `src/components/AppDownload.tsx`

**Features**:
- App download promotion
- App Store & Google Play buttons
- Four stat cards in grid

**Customization**:
```typescript
// Change heading
<h2>Download MediCare App & Get 30% OFF</h2>

// Change stats
<div className="text-4xl font-bold mb-2">30%</div>
<p>First Order Discount</p>
```

---

## 📧 Newsletter Component
**File**: `src/components/Newsletter.tsx`

**Features**:
- Email input field
- Subscribe button
- Centered layout

**Customization**:
```typescript
// Change heading
<h2>Subscribe to Our Newsletter</h2>

// Change description
<p>Get the latest updates on new products...</p>
```

---

## 🦶 Footer Component
**File**: `src/components/Footer.tsx`

**Features**:
- Brand section with logo and social links
- Quick Links column
- Our Policies column
- Contact Us column
- Payment methods
- Copyright notice

**Customization**:
```typescript
// Change social links
<a href="#" className="...">
  <Facebook size={18} />
</a>

// Change contact info
<span>123 Main Street, Karachi, Pakistan</span>
<span>+92-300-1234567</span>
<span>support@medicare.pk</span>
```

---

## 🔘 FloatingButton Component
**File**: `src/components/FloatingButton.tsx`

**Features**:
- Fixed position bottom-right
- Upload Prescription action
- Hover effects

**Customization**:
```typescript
// Change button text
<button>
  <Upload size={20} />
  Upload Prescription
</button>

// Change position
className="fixed bottom-8 right-8..."
```

---

## 🎨 Color Reference

All components use these consistent colors:

```css
Primary Green: #00B074
Accent Orange: #FF6B35
Light Background: #F4FBF7
White: #FFFFFF
Dark Text: #1A1A2E
Muted Gray: #6B7280
```

## 📐 Layout Tips

1. **Responsive Grid**: Most sections use `grid md:grid-cols-X` for responsive layouts
2. **Max Width**: Content is constrained with `max-w-7xl mx-auto`
3. **Spacing**: Consistent padding with `py-16 px-4`
4. **Hover Effects**: Most interactive elements have `hover:` states
5. **Transitions**: Smooth animations with `transition` class

## 🔧 Common Modifications

### Change Section Background
```typescript
// White background
<section className="py-16 px-4 bg-white">

// Gray background
<section className="py-16 px-4 bg-gray-50">

// Custom color
<section className="py-16 px-4 bg-[#F4FBF7]">
```

### Adjust Spacing
```typescript
// More padding
<section className="py-20 px-6">

// Less padding
<section className="py-12 px-4">
```

### Change Grid Columns
```typescript
// 2 columns on mobile, 4 on desktop
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

// 3 columns on mobile, 6 on desktop
<div className="grid grid-cols-3 md:grid-cols-6 gap-6">
```

---

Happy customizing! 🚀
