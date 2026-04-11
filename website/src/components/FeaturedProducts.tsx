import React from 'react';
import { ArrowRight, Star, ShoppingCart } from 'lucide-react';

const FeaturedProducts = () => {
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
    {
      image: 'https://placehold.co/250x250/fff3e0/f57c00?text=Vitamin+D3',
      category: 'VITAMINS',
      name: 'Vitamin D3 Supplements',
      discount: '15% OFF',
      rating: 4.8,
      reviews: 189,
      originalPrice: 800,
      price: 680,
    },
    {
      image: 'https://placehold.co/250x250/e8f5e9/43a047?text=Thermometer',
      category: 'HEALTH DEVICES',
      name: 'Digital Thermometer',
      discount: '25% OFF',
      rating: 4.6,
      reviews: 156,
      originalPrice: 1200,
      price: 900,
    },
    {
      image: 'https://placehold.co/250x250/fce4ec/e91e63?text=Baby+Care',
      category: 'BABY CARE',
      name: 'Baby Skincare Set',
      discount: '30% OFF',
      rating: 4.9,
      reviews: 312,
      originalPrice: 1500,
      price: 1050,
    },
    {
      image: 'https://placehold.co/250x250/f3e5f5/9c27b0?text=Serum',
      category: 'PERSONAL CARE',
      name: 'Skincare Serum',
      discount: '18% OFF',
      rating: 4.7,
      reviews: 278,
      originalPrice: 2200,
      price: 1804,
    },
    {
      image: 'https://placehold.co/250x250/e0f2f1/00897b?text=Omega+3',
      category: 'SUPPLEMENTS',
      name: 'Omega-3 Fish Oil',
      discount: '22% OFF',
      rating: 4.8,
      reviews: 421,
      originalPrice: 1800,
      price: 1404,
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#1A1A2E]">Featured Products</h2>
          <a href="#" className="flex items-center gap-2 text-[#00B074] hover:underline font-medium">
            View All <ArrowRight size={20} />
          </a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {products.map((product, index) => (
            <div key={index} className="bg-white border rounded-xl overflow-hidden hover:shadow-xl transition group">
              <div className="relative">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                <span className="absolute top-2 left-2 bg-[#FF6B35] text-white text-xs font-bold px-2 py-1 rounded">
                  {product.discount}
                </span>
                <span className="absolute top-2 right-2 bg-gray-100 text-[#6B7280] text-xs font-medium px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-[#1A1A2E] mb-2 line-clamp-2">{product.name}</h3>
                
                <div className="flex items-center gap-1 mb-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={16} />
                  <span className="text-sm font-medium text-[#1A1A2E]">{product.rating}</span>
                  <span className="text-xs text-[#6B7280]">({product.reviews})</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-[#00B074]">PKR {product.price}</span>
                  <span className="text-sm text-[#6B7280] line-through">PKR {product.originalPrice}</span>
                </div>
                
                <button className="w-full bg-[#00B074] text-white py-2 rounded-lg hover:bg-[#009960] transition flex items-center justify-center gap-2 font-medium">
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

export default FeaturedProducts;
