import React from 'react';
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

const BestSellers = () => {
  const products = [
    {
      id: 1,
      image: 'https://placehold.co/250x250/e3f2fd/1976d2?text=Neutrogena',
      category: 'SKIN CARE',
      name: 'Neutrogena Hydro Boost Moisturizer',
      skinType: 'Oily Skin',
      skinTypeBg: 'bg-pink-100',
      skinTypeText: 'text-pink-600',
      rating: 4.8,
      reviews: 623,
      price: 1899,
      originalPrice: 2500,
      discount: 24,
    },
    {
      id: 2,
      image: 'https://placehold.co/250x250/e8f5e9/43a047?text=Himalaya',
      category: 'SKIN CARE',
      name: 'Himalaya Purifying Neem Face Wash',
      skinType: 'All Skin Types',
      skinTypeBg: 'bg-green-100',
      skinTypeText: 'text-green-600',
      rating: 4.7,
      reviews: 512,
      price: 299,
      originalPrice: 450,
      discount: 34,
    },
    {
      id: 3,
      image: 'https://placehold.co/250x250/fff3e0/f57c00?text=Garnier',
      category: 'SKIN CARE',
      name: 'Garnier Vitamin C Brightening Serum',
      skinType: 'Dry Skin',
      skinTypeBg: 'bg-orange-100',
      skinTypeText: 'text-orange-600',
      rating: 4.9,
      reviews: 489,
      price: 1599,
      originalPrice: 2200,
      discount: 27,
    },
    {
      id: 4,
      image: 'https://placehold.co/250x250/f3e5f5/9c27b0?text=L%27Oreal',
      category: 'SKIN CARE',
      name: "L'Oreal Revitalift Anti-Aging Cream",
      skinType: 'Anti-Aging',
      skinTypeBg: 'bg-purple-100',
      skinTypeText: 'text-purple-600',
      rating: 4.8,
      reviews: 398,
      price: 2499,
      originalPrice: 3500,
      discount: 29,
    },
    {
      id: 5,
      image: 'https://placehold.co/250x250/fce4ec/e91e63?text=Dove',
      category: 'BODY CARE',
      name: 'Dove Deeply Nourishing Body Wash',
      skinType: 'All Skin Types',
      skinTypeBg: 'bg-green-100',
      skinTypeText: 'text-green-600',
      rating: 4.6,
      reviews: 567,
      price: 899,
      originalPrice: 1200,
      discount: 25,
    },
  ];

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8">Best Sellers</h2>

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
                  {/* Skin Type Badge */}
                  <span className={`absolute top-2 right-2 ${product.skinTypeBg} ${product.skinTypeText} text-xs font-semibold px-2 py-1 rounded-full`}>
                    {product.skinType}
                  </span>
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

export default BestSellers;
