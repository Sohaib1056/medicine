import React from 'react';
import { Sparkles } from 'lucide-react';

const PromoBanner = () => {
  const brands = ['Neutrogena', 'Garnier', "L'Oreal", 'Himalaya'];

  return (
    <div className="bg-gradient-to-r from-[#F3E5F5] to-[#E1F5FE] py-8 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="text-[#9C27B0]" size={32} />
            <h2 className="text-4xl font-bold text-[#1A1A1A]">
              Upto 40% OFF on Beauty Essentials
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#666666] font-medium">Top Brands:</span>
            {brands.map((brand, index) => (
              <span key={brand} className="text-[#1A1A1A] font-semibold">
                {brand}
                {index < brands.length - 1 && <span className="text-[#666666] mx-2">•</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <button className="bg-[#00A651] text-white px-8 py-4 rounded-lg hover:bg-[#008f47] transition font-bold text-lg shadow-lg whitespace-nowrap">
          Shop Now
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;
