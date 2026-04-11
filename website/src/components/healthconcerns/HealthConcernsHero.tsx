import React from 'react';
import { Search } from 'lucide-react';

const HealthConcernsHero = () => {
  return (
    <div className="bg-gradient-to-r from-[#00897B] to-[#00A651] py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Find Products for Your Health Needs
        </h1>
        <p className="text-white/90 text-lg mb-8">
          Browse by health condition and find the right medicines and supplements
        </p>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for health concerns, symptoms, or conditions..."
              className="w-full px-6 py-4 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-[#00A651] px-6 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthConcernsHero;
