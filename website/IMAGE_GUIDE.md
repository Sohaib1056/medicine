# 📸 Image Guide - MediCare Website

## 🗂️ Image Folder Structure

Images ko save karne ke liye yeh folder structure use karein:

```
website/
├── public/
│   ├── images/
│   │   ├── hero/
│   │   │   ├── happy-family.jpg          # Hero section family image
│   │   │   ├── hero-banner.jpg           # Main hero banner
│   │   │   └── hero-background.jpg       # Hero background
│   │   │
│   │   ├── products/
│   │   │   ├── medicines/
│   │   │   │   ├── panadol.jpg
│   │   │   │   ├── aspirin.jpg
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── devices/
│   │   │   │   ├── bp-monitor.jpg
│   │   │   │   ├── glucometer.jpg
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── wellness/
│   │   │   │   ├── vitamin-c.jpg
│   │   │   │   ├── protein.jpg
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── personal-care/
│   │   │   │   ├── face-wash.jpg
│   │   │   │   ├── moisturizer.jpg
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── mom-baby/
│   │   │       ├── baby-food.jpg
│   │   │       ├── diapers.jpg
│   │   │       └── ...
│   │   │
│   │   ├── brands/
│   │   │   ├── gsk-logo.png
│   │   │   ├── pfizer-logo.png
│   │   │   ├── abbott-logo.png
│   │   │   └── ...
│   │   │
│   │   ├── categories/
│   │   │   ├── heart-care.jpg
│   │   │   ├── diabetes.jpg
│   │   │   ├── vitamins.jpg
│   │   │   └── ...
│   │   │
│   │   ├── banners/
│   │   │   ├── promo-banner-1.jpg
│   │   │   ├── promo-banner-2.jpg
│   │   │   └── ...
│   │   │
│   │   └── misc/
│   │       ├── app-download.png
│   │       ├── delivery-truck.png
│   │       └── ...
│   │
│   └── logo.png                          # Main MediCare logo
```

---

## 📍 Specific Image Locations

### 1. Hero Section - "Happy Family" Image

**Location**: `website/public/images/hero/happy-family.jpg`

**Usage in Code**:
```tsx
<img 
  src="/images/hero/happy-family.jpg" 
  alt="Happy Family" 
  className="w-full h-full object-cover rounded-lg"
/>
```

**Recommended Size**: 800x600px
**Format**: JPG or PNG
**Max File Size**: 200KB (optimized)

---

### 2. Product Images

**Location**: `website/public/images/products/[category]/[product-name].jpg`

**Example**:
```tsx
// Medicine product
<img src="/images/products/medicines/panadol.jpg" alt="Panadol" />

// Health device
<img src="/images/products/devices/bp-monitor.jpg" alt="BP Monitor" />

// Wellness product
<img src="/images/products/wellness/vitamin-c.jpg" alt="Vitamin C" />
```

**Recommended Size**: 400x400px (square)
**Format**: JPG or PNG
**Max File Size**: 100KB per image

---

### 3. Brand Logos

**Location**: `website/public/images/brands/[brand-name]-logo.png`

**Example**:
```tsx
<img src="/images/brands/gsk-logo.png" alt="GSK" />
<img src="/images/brands/pfizer-logo.png" alt="Pfizer" />
```

**Recommended Size**: 200x80px
**Format**: PNG (transparent background)
**Max File Size**: 50KB

---

### 4. Category Images

**Location**: `website/public/images/categories/[category-name].jpg`

**Example**:
```tsx
<img src="/images/categories/heart-care.jpg" alt="Heart Care" />
<img src="/images/categories/diabetes.jpg" alt="Diabetes" />
```

**Recommended Size**: 300x300px
**Format**: JPG
**Max File Size**: 80KB

---

### 5. Promo Banners

**Location**: `website/public/images/banners/[banner-name].jpg`

**Example**:
```tsx
<img src="/images/banners/promo-banner-1.jpg" alt="Special Offer" />
```

**Recommended Size**: 1200x400px (wide banner)
**Format**: JPG
**Max File Size**: 150KB

---

## 🔧 How to Use Images in Code

### Method 1: Direct Path (Recommended)
```tsx
<img src="/images/hero/happy-family.jpg" alt="Happy Family" />
```

### Method 2: Import (for smaller images)
```tsx
import happyFamily from '/images/hero/happy-family.jpg';

<img src={happyFamily} alt="Happy Family" />
```

### Method 3: Dynamic Path
```tsx
const imagePath = `/images/products/${category}/${productName}.jpg`;
<img src={imagePath} alt={productName} />
```

---

## 📝 Image Naming Convention

### Rules:
1. Use lowercase letters
2. Use hyphens (-) instead of spaces
3. Be descriptive but concise
4. Include category if needed

### Examples:
✅ Good:
- `happy-family.jpg`
- `bp-monitor-omron.jpg`
- `vitamin-c-1000mg.jpg`
- `baby-food-nestle.jpg`

❌ Bad:
- `IMG_1234.jpg`
- `photo.jpg`
- `product image.jpg`
- `HAPPY FAMILY.JPG`

---

## 🎨 Image Optimization Tips

### Before Upload:
1. **Resize**: Use correct dimensions
2. **Compress**: Use tools like TinyPNG, ImageOptim
3. **Format**: 
   - JPG for photos
   - PNG for logos/transparent images
   - WebP for modern browsers (optional)

### Recommended Tools:
- **Online**: TinyPNG.com, Squoosh.app
- **Desktop**: ImageOptim (Mac), FileOptimizer (Windows)
- **Photoshop**: Save for Web (Legacy)

---

## 📦 Creating Image Folders

### Windows:
```bash
cd website/public
mkdir images
cd images
mkdir hero products brands categories banners misc
cd products
mkdir medicines devices wellness personal-care mom-baby
```

### Mac/Linux:
```bash
cd website/public
mkdir -p images/{hero,products/{medicines,devices,wellness,personal-care,mom-baby},brands,categories,banners,misc}
```

---

## 🔄 Updating Existing Components

### Hero Section (Home Page)
**File**: `website/src/components/HeroSection.tsx`

Find this line:
```tsx
<div className="bg-gray-100 h-full flex items-center justify-center">
  <span className="text-4xl">Happy Family</span>
</div>
```

Replace with:
```tsx
<img 
  src="/images/hero/happy-family.jpg" 
  alt="Happy Family enjoying health" 
  className="w-full h-full object-cover rounded-lg"
/>
```

### Product Cards
**Files**: Various `ProductGrid.tsx` files

Find:
```tsx
<div className="bg-gray-100 h-48 flex items-center justify-center">
  <span className="text-4xl">💊</span>
</div>
```

Replace with:
```tsx
<img 
  src="/images/products/medicines/product-name.jpg" 
  alt="Product Name" 
  className="w-full h-48 object-cover"
/>
```

---

## 📊 Image Sizes Reference

| Location | Recommended Size | Format | Max Size |
|----------|-----------------|--------|----------|
| Hero Images | 800x600px | JPG | 200KB |
| Product Images | 400x400px | JPG/PNG | 100KB |
| Brand Logos | 200x80px | PNG | 50KB |
| Category Images | 300x300px | JPG | 80KB |
| Promo Banners | 1200x400px | JPG | 150KB |
| Icons | 64x64px | PNG | 20KB |

---

## 🚀 Quick Start

### Step 1: Create Folders
```bash
cd website/public
mkdir -p images/hero images/products/medicines
```

### Step 2: Add Your Image
Copy your `happy-family.jpg` to:
```
website/public/images/hero/happy-family.jpg
```

### Step 3: Update Component
Edit `website/src/components/HeroSection.tsx` and replace placeholder with:
```tsx
<img src="/images/hero/happy-family.jpg" alt="Happy Family" />
```

### Step 4: Test
```bash
npm run dev
```
Visit: http://localhost:5173/

---

## 🔍 Troubleshooting

### Image Not Showing?

1. **Check Path**: Make sure path starts with `/images/`
2. **Check File Name**: Case-sensitive on Linux/Mac
3. **Check Location**: Must be in `public/` folder
4. **Restart Server**: After adding new images
5. **Clear Cache**: Hard refresh (Ctrl+Shift+R)

### Image Too Large?

1. Use image compression tools
2. Resize to recommended dimensions
3. Convert to WebP format (optional)

---

## 📱 Responsive Images

For different screen sizes:

```tsx
<picture>
  <source 
    media="(max-width: 768px)" 
    srcSet="/images/hero/happy-family-mobile.jpg" 
  />
  <source 
    media="(min-width: 769px)" 
    srcSet="/images/hero/happy-family-desktop.jpg" 
  />
  <img 
    src="/images/hero/happy-family.jpg" 
    alt="Happy Family" 
  />
</picture>
```

---

## ✅ Checklist

Before deploying:

- [ ] All images optimized
- [ ] Correct folder structure
- [ ] Proper naming convention
- [ ] Alt text added
- [ ] Responsive images tested
- [ ] File sizes under limits
- [ ] Images loading correctly

---

## 📚 Additional Resources

- **Image Optimization**: https://tinypng.com
- **WebP Converter**: https://squoosh.app
- **Free Stock Photos**: https://unsplash.com
- **Icon Libraries**: https://lucide.dev

---

*Last Updated: April 2026*
*For MediCare Pharmacy Website*
