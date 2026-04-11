import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';

interface ProductGridProps {
  activeAge: string;
}

const ProductGrid: React.FC<ProductGridProps> = () => {
  const products = [
    {
      id: 1,
      image: 'https://placehold.co/250x250/e3f2fd/1976d2?text=Johnson%27s',
      category: 'BABY SKINCARE',
      name: "Johnson's Baby Bath & Skincare Set",
      ageRange: '0-12 months',
      rating: 4.9,
      reviews: 823,
      price: 1899,
      originalPrice: 2500,
      discount: 24,
    },
    {
      id: 2,
      image: 'https://placehold.co/250x250/fff3e0/f57c00?text=Pampers',
      category: 'DIAPERS',
      name: 'Pampers Premium Care Size 1 (52 pcs)',
      ageRange: '0-3 months',
      rating: 4.8,
      reviews: 1234,
      price: 1299,
      originalPrice: 1600,
      discount: 19,
    },
    {
      id: 3,
      image: 'https://placehold.co/250x250/e8f5e9/43a047?text=Nestl%C3%A9',
      category: 'BABY FOOD',
      name: 'Nestlé NAN PRO 1 Infant Formula 400g',
      ageRange: '0-6 months',
      rating: 4.7,
      reviews: 689,
      price: 1599,
      originalPrice: 1900,
      discount: 16,
    },
    {
      id: 4,
      image: 'https://placehold.co/250x250/fce4ec/e91e63?text=Mustela',
      category: 'BABY SKINCARE',
      name: 'Mustela Hydra Bébé Face Cream',
      ageRange: '0-12 months',
      rating: 4.9,
      reviews: 456,
      price: 2199,
      originalPrice: 2800,
      discount: 21,
    },
    {
      id: 5,
      image: 'https://placehold.co/250x250/f3e5f5/9c27b0?text=Pigeon',
      category: 'BREASTFEEDING',
      name: 'Pigeon Breast Pump Electric',
      ageRange: 'Mom Care',
      rating: 4.8,
      reviews: 378,
      price: 4999,
      originalPrice: 6500,
      discount: 23,
    },
    {
      id: 6,
      image: 'https://placehold.co/250x250/e0f2f1/00897b?text=Mothercare',
      category: 'ACCESSORIES',
      name: 'Mothercare Baby Bottle Sterilizer',
      ageRange: '0-12 months',
      rating: 4.7,
      reviews: 512,
      price: 3499,
      originalPrice: 4500,
      discount: 22,
    },
    {
      id: 7,
      image: 'https://placehold.co/250x250/fff9c4/f9a825?text=Huggies',
      category: 'DIAPERS',
      name: 'Huggies Dry Pants Size 2 (60 pcs)',
      ageRange: '3-8 months',
      rating: 4.6,
      reviews: 945,
      price: 1399,
      originalPrice: 1700,
      discount: 18,
    },
    {
      id: 8,
      image: 'https://placehold.co/250x250/e1f5fe/0288d1?text=Cerelac',
      category: 'BABY FOOD',
      name: 'Nestlé Cerelac Wheat 400g',
      ageRange: '6+ months',
      rating: 4.8,
      reviews: 723,
      price: 599,
      originalPrice: 750,
      discount: 20,
    },
  ];

  return (
    <section className="py-16 px-4 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8">Featured Products</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition"
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
                {/* Age Range Badge */}
                <span className="absolute top-2 right-2 bg-[#FFB6C1] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {product.ageRange}
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
      </div>
    </section>
  );
};

export default ProductGrid;
