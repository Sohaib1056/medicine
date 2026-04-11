import React from 'react';
import { Star, ShoppingCart, ArrowRight } from 'lucide-react';

interface DevicesContentProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  filters: any;
  activeCategory: string;
}

const DevicesContent: React.FC<DevicesContentProps> = ({ sortBy, setSortBy }) => {
  const products = [
    {
      id: 1,
      image: 'https://placehold.co/250x250/e3f2fd/1976d2?text=Omron+BP',
      category: 'BLOOD PRESSURE',
      name: 'Omron HEM-7120 BP Monitor',
      brand: 'Omron',
      rating: 4.8,
      reviews: 456,
      price: 4999,
      originalPrice: 6500,
      discount: 23,
    },
    {
      id: 2,
      image: 'https://placehold.co/250x250/fff3e0/f57c00?text=Accu-Chek',
      category: 'GLUCOMETER',
      name: 'Accu-Chek Active Glucometer',
      brand: 'Accu-Chek',
      rating: 4.7,
      reviews: 389,
      price: 1299,
      originalPrice: 1800,
      discount: 28,
    },
    {
      id: 3,
      image: 'https://placehold.co/250x250/e8f5e9/43a047?text=Beurer',
      category: 'THERMOMETER',
      name: 'Beurer FT09 Digital Thermometer',
      brand: 'Beurer',
      rating: 4.6,
      reviews: 234,
      price: 599,
      originalPrice: 900,
      discount: 33,
    },
    {
      id: 4,
      image: 'https://placehold.co/250x250/fce4ec/e91e63?text=Pulse+Ox',
      category: 'PULSE OXIMETER',
      name: 'Dr. Morepen Pulse Oximeter',
      brand: 'Dr. Morepen',
      rating: 4.5,
      reviews: 312,
      price: 1499,
      originalPrice: 2500,
      discount: 40,
    },
    {
      id: 5,
      image: 'https://placehold.co/250x250/f3e5f5/9c27b0?text=Scale',
      category: 'WEIGHING SCALE',
      name: 'Omron Digital Weighing Scale',
      brand: 'Omron',
      rating: 4.7,
      reviews: 278,
      price: 2499,
      originalPrice: 3500,
      discount: 29,
    },
    {
      id: 6,
      image: 'https://placehold.co/250x250/e0f2f1/00897b?text=Nebulizer',
      category: 'NEBULIZER',
      name: 'Rossmax Compressor Nebulizer',
      brand: 'Rossmax',
      rating: 4.8,
      reviews: 421,
      price: 3999,
      originalPrice: 5500,
      discount: 27,
    },
    {
      id: 7,
      image: 'https://placehold.co/250x250/fff9c4/f9a825?text=BP+Monitor',
      category: 'BLOOD PRESSURE',
      name: 'Dr. Morepen BP-02 Monitor',
      brand: 'Dr. Morepen',
      rating: 4.6,
      reviews: 198,
      price: 2999,
      originalPrice: 4200,
      discount: 29,
    },
    {
      id: 8,
      image: 'https://placehold.co/250x250/e1f5fe/0288d1?text=Thermometer',
      category: 'THERMOMETER',
      name: 'A&D Digital Thermometer',
      brand: 'A&D Medical',
      rating: 4.5,
      reviews: 167,
      price: 799,
      originalPrice: 1200,
      discount: 33,
    },
  ];

  return (
    <div className="flex-1">
      {/* Featured Brand Banner */}
      <div className="bg-gradient-to-r from-[#00BFA5] to-[#00d4b8] rounded-lg p-6 mb-6 flex items-center justify-between">
        <div className="text-white">
          <h3 className="text-2xl font-bold mb-2">Featured Brand: Omron</h3>
          <p className="text-white/90">Japan's #1 BP Monitor Brand</p>
        </div>
        <button className="bg-white text-[#00A651] px-6 py-3 rounded-lg hover:bg-gray-100 transition font-bold flex items-center gap-2">
          Shop Omron <ArrowRight size={20} />
        </button>
      </div>

      {/* Sort Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-[#666666]">
          Showing <span className="font-semibold text-[#1A1A1A]">1-8</span> of{' '}
          <span className="font-semibold text-[#1A1A1A]">48</span> results
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#666666]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00A651]"
          >
            <option value="popular">Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Discount %</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border rounded-lg overflow-hidden hover:shadow-lg hover:shadow-[#00A651]/10 transition group"
          >
            {/* Image Area */}
            <div className="relative bg-gray-50 p-4 h-48 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
              {/* Discount Badge */}
              {product.discount > 0 && (
                <span className="absolute top-2 left-2 bg-[#E53935] text-white text-xs font-bold px-2 py-1 rounded">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Category */}
              <p className="text-[#00A651] text-xs font-semibold uppercase mb-1">
                {product.category}
              </p>

              {/* Product Name */}
              <h3 className="font-bold text-[#1A1A1A] mb-2 line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>

              {/* Brand */}
              <p className="text-xs text-[#666666] mb-2">by {product.brand}</p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                <Star className="text-yellow-400 fill-yellow-400" size={16} />
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {product.rating}
                </span>
                <span className="text-xs text-[#666666]">({product.reviews})</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-[#00A651]">
                  Rs. {product.price}
                </span>
                <span className="text-sm text-[#666666] line-through">
                  Rs. {product.originalPrice}
                </span>
              </div>

              {/* Add to Cart Button */}
              <button className="w-full bg-[#00A651] text-white py-2.5 rounded-lg hover:bg-[#008f47] transition flex items-center justify-center gap-2 font-medium">
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DevicesContent;
