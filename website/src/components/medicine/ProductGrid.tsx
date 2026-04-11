import React from 'react';
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGridProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  filters: any;
}

const ProductGrid: React.FC<ProductGridProps> = ({ sortBy, setSortBy }) => {
  const products = [
    {
      id: 1,
      image: 'https://placehold.co/200x200/e3f2fd/1976d2?text=Panadol',
      discount: 20,
      hot: true,
      rxRequired: true,
      category: 'PAIN RELIEF',
      name: 'Panadol Extra 500mg Tablets',
      rating: 4.5,
      reviews: 234,
      price: 240,
      originalPrice: 300,
    },
    {
      id: 2,
      image: 'https://placehold.co/200x200/fff3e0/f57c00?text=Augmentin',
      discount: 15,
      hot: false,
      rxRequired: true,
      category: 'ANTIBIOTICS',
      name: 'Augmentin 625mg Tablets',
      rating: 4.7,
      reviews: 189,
      price: 850,
      originalPrice: 1000,
    },
    {
      id: 3,
      image: 'https://placehold.co/200x200/e8f5e9/43a047?text=Vitamin+D3',
      discount: 30,
      hot: true,
      rxRequired: false,
      category: 'VITAMINS',
      name: 'Vitamin D3 5000 IU Capsules',
      rating: 4.8,
      reviews: 312,
      price: 700,
      originalPrice: 1000,
    },
    {
      id: 4,
      image: 'https://placehold.co/200x200/fce4ec/e91e63?text=Aspirin',
      discount: 10,
      hot: false,
      rxRequired: false,
      category: 'CARDIAC',
      name: 'Aspirin 75mg Tablets',
      rating: 4.6,
      reviews: 156,
      price: 180,
      originalPrice: 200,
    },
    {
      id: 5,
      image: 'https://placehold.co/200x200/f3e5f5/9c27b0?text=Glucophage',
      discount: 25,
      hot: true,
      rxRequired: true,
      category: 'DIABETES',
      name: 'Glucophage 500mg Tablets',
      rating: 4.7,
      reviews: 278,
      price: 450,
      originalPrice: 600,
    },
    {
      id: 6,
      image: 'https://placehold.co/200x200/e0f2f1/00897b?text=Ventolin',
      discount: 18,
      hot: false,
      rxRequired: true,
      category: 'RESPIRATORY',
      name: 'Ventolin Inhaler 100mcg',
      rating: 4.9,
      reviews: 421,
      price: 820,
      originalPrice: 1000,
    },
    {
      id: 7,
      image: 'https://placehold.co/200x200/fff9c4/f9a825?text=Betnovate',
      discount: 22,
      hot: false,
      rxRequired: false,
      category: 'SKIN CARE',
      name: 'Betnovate Cream 30g',
      rating: 4.5,
      reviews: 198,
      price: 390,
      originalPrice: 500,
    },
    {
      id: 8,
      image: 'https://placehold.co/200x200/e1f5fe/0288d1?text=Brufen',
      discount: 12,
      hot: false,
      rxRequired: false,
      category: 'PAIN RELIEF',
      name: 'Brufen 400mg Tablets',
      rating: 4.4,
      reviews: 267,
      price: 220,
      originalPrice: 250,
    },
  ];

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-[#666666]">
          Showing <span className="font-semibold text-[#1A1A1A]">1-8</span> of{' '}
          <span className="font-semibold text-[#1A1A1A]">156</span> results
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
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border rounded-[10px] overflow-hidden hover:shadow-lg hover:shadow-[#00A651]/10 transition group"
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
              {/* Hot Badge */}
              {product.hot && (
                <span className="absolute top-2 right-2 bg-[#FF6F00] text-white text-xs font-bold px-2 py-1 rounded">
                  HOT
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Rx Badge */}
              {product.rxRequired && (
                <span className="inline-block bg-[#FF6F00] text-white text-xs font-medium px-2 py-1 rounded-full mb-2">
                  Rx Required
                </span>
              )}

              {/* Category */}
              <p className="text-[#00A651] text-xs font-semibold uppercase mb-1">
                {product.category}
              </p>

              {/* Product Name */}
              <h3 className="font-bold text-[#1A1A1A] mb-2 line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>

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

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2">
        <button className="p-2 border rounded-lg hover:bg-gray-50 transition">
          <ChevronLeft size={20} />
        </button>
        <button className="px-4 py-2 bg-[#00A651] text-white rounded-lg font-medium">
          1
        </button>
        <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
          2
        </button>
        <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
          3
        </button>
        <button className="p-2 border rounded-lg hover:bg-gray-50 transition">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProductGrid;
