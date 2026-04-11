import React from 'react';
import { Star, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const TrendingProducts = () => {
  const products = [
    {
      id: 1,
      image: 'https://placehold.co/250x250/fff3e0/f57c00?text=Vitamin+C',
      category: 'VITAMINS',
      name: 'Vitamin C Effervescent Tablets',
      rating: 4.8,
      reviews: 523,
      price: 899,
      originalPrice: 1200,
      discount: 25,
    },
    {
      id: 2,
      image: 'https://placehold.co/250x250/e3f2fd/1976d2?text=Whey+Protein',
      category: 'PROTEIN & FITNESS',
      name: 'Whey Protein Isolate 1kg',
      rating: 4.7,
      reviews: 412,
      price: 4999,
      originalPrice: 6500,
      discount: 23,
    },
    {
      id: 3,
      image: 'https://placehold.co/250x250/e8f5e9/43a047?text=Ashwagandha',
      category: 'HERBAL',
      name: 'Ashwagandha Root Extract',
      rating: 4.9,
      reviews: 389,
      price: 1299,
      originalPrice: 1800,
      discount: 28,
    },
    {
      id: 4,
      image: 'https://placehold.co/250x250/e0f2f1/00897b?text=Omega-3',
      category: 'SUPPLEMENTS',
      name: 'Omega-3 Fish Oil Capsules',
      rating: 4.6,
      reviews: 456,
      price: 1499,
      originalPrice: 2000,
      discount: 25,
    },
    {
      id: 5,
      image: 'https://placehold.co/250x250/f3e5f5/9c27b0?text=Magnesium',
      category: 'MINERALS',
      name: 'Magnesium Citrate 400mg',
      rating: 4.7,
      reviews: 298,
      price: 799,
      originalPrice: 1100,
      discount: 27,
    },
  ];

  return (
    <section className="py-16 px-4 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Trending in Wellness</h2>
          <a href="#" className="flex items-center gap-2 text-[#00A651] hover:underline font-medium">
            View All <ArrowRight size={20} />
          </a>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition flex-shrink-0 w-64"
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

          {/* Scroll Buttons */}
          <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition">
            <ChevronLeft size={24} className="text-[#00A651]" />
          </button>
          <button className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition">
            <ChevronRight size={24} className="text-[#00A651]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
