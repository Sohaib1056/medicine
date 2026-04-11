import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';

interface ProductGridProps {
  filters: any;
  activeCategory: string;
}

const ProductGrid: React.FC<ProductGridProps> = () => {
  const products = [
    {
      id: 1,
      image: 'https://placehold.co/250x250/e3f2fd/1976d2?text=Cleanser',
      category: 'SKIN CARE',
      name: 'Cetaphil Gentle Skin Cleanser',
      skinType: 'All Skin Types',
      skinTypeBg: 'bg-green-100',
      skinTypeText: 'text-green-600',
      rating: 4.7,
      reviews: 423,
      price: 1299,
      originalPrice: 1800,
      discount: 28,
    },
    {
      id: 2,
      image: 'https://placehold.co/250x250/fff3e0/f57c00?text=Shampoo',
      category: 'HAIR CARE',
      name: "L'Oreal Total Repair 5 Shampoo",
      skinType: 'Damaged Hair',
      skinTypeBg: 'bg-orange-100',
      skinTypeText: 'text-orange-600',
      rating: 4.6,
      reviews: 389,
      price: 899,
      originalPrice: 1200,
      discount: 25,
    },
    {
      id: 3,
      image: 'https://placehold.co/250x250/e8f5e9/43a047?text=Toothpaste',
      category: 'ORAL CARE',
      name: 'Colgate Total Advanced Whitening',
      skinType: 'Whitening',
      skinTypeBg: 'bg-blue-100',
      skinTypeText: 'text-blue-600',
      rating: 4.8,
      reviews: 512,
      price: 349,
      originalPrice: 500,
      discount: 30,
    },
    {
      id: 4,
      image: 'https://placehold.co/250x250/fce4ec/e91e63?text=Body+Lotion',
      category: 'BODY CARE',
      name: 'Nivea Nourishing Body Lotion',
      skinType: 'Dry Skin',
      skinTypeBg: 'bg-orange-100',
      skinTypeText: 'text-orange-600',
      rating: 4.7,
      reviews: 456,
      price: 799,
      originalPrice: 1100,
      discount: 27,
    },
    {
      id: 5,
      image: 'https://placehold.co/250x250/f3e5f5/9c27b0?text=Face+Cream',
      category: 'SKIN CARE',
      name: 'Olay Regenerist Night Cream',
      skinType: 'Anti-Aging',
      skinTypeBg: 'bg-purple-100',
      skinTypeText: 'text-purple-600',
      rating: 4.9,
      reviews: 378,
      price: 2199,
      originalPrice: 3000,
      discount: 27,
    },
    {
      id: 6,
      image: 'https://placehold.co/250x250/e0f2f1/00897b?text=Shaving+Gel',
      category: "MEN'S GROOMING",
      name: 'Gillette Sensitive Shaving Gel',
      skinType: 'Sensitive Skin',
      skinTypeBg: 'bg-teal-100',
      skinTypeText: 'text-teal-600',
      rating: 4.6,
      reviews: 298,
      price: 599,
      originalPrice: 850,
      discount: 30,
    },
    {
      id: 7,
      image: 'https://placehold.co/250x250/fff9c4/f9a825?text=Sunscreen',
      category: 'SKIN CARE',
      name: 'Neutrogena Ultra Sheer SPF 50+',
      skinType: 'All Skin Types',
      skinTypeBg: 'bg-green-100',
      skinTypeText: 'text-green-600',
      rating: 4.8,
      reviews: 534,
      price: 1499,
      originalPrice: 2000,
      discount: 25,
    },
    {
      id: 8,
      image: 'https://placehold.co/250x250/e1f5fe/0288d1?text=Conditioner',
      category: 'HAIR CARE',
      name: 'Pantene Pro-V Smooth Conditioner',
      skinType: 'Frizzy Hair',
      skinTypeBg: 'bg-pink-100',
      skinTypeText: 'text-pink-600',
      rating: 4.5,
      reviews: 412,
      price: 749,
      originalPrice: 1000,
      discount: 25,
    },
  ];

  return (
    <div className="flex-1">
      {/* Sort Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-[#666666]">
          Showing <span className="font-semibold text-[#1A1A1A]">1-8</span> of{' '}
          <span className="font-semibold text-[#1A1A1A]">156</span> results
        </p>
        <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00A651]">
          <option>Popular</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Discount %</option>
          <option>Customer Rating</option>
        </select>
      </div>

      {/* Product Grid */}
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
    </div>
  );
};

export default ProductGrid;
