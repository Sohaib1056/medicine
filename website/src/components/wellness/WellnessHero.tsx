import React from 'react';
import { Search } from 'lucide-react';

const WellnessHero = () => {
  return (
    <section className="bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-[#1A1A1A] mb-4">
          Your Wellness Journey Starts Here
        </h1>
        <p className="text-lg text-[#666666] mb-8">
          Discover premium vitamins, supplements, herbal products, and wellness essentials to support your healthy lifestyle.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 bg-white rounded-lg p-2 border-2 border-[#00A651] shadow-lg">
            <input
              type="text"
              placeholder="Search for vitamins, supplements, wellness products..."
              className="flex-1 px-4 py-3 focus:outline-none text-[#1A1A1A]"
            />
            <button className="bg-[#00A651] text-white px-8 py-3 rounded-lg hover:bg-[#008f47] transition font-medium flex items-center gap-2">
              <Search size={20} />
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WellnessHero;
