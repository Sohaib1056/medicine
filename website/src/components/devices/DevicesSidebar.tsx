import React from 'react';
import { Star } from 'lucide-react';

interface DevicesSidebarProps {
  filters: {
    brands: string[];
    priceRange: number[];
    rating: number;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

const DevicesSidebar: React.FC<DevicesSidebarProps> = ({ filters, setFilters }) => {
  const brands = ['Omron', 'Beurer', 'Dr. Morepen', 'Rossmax', 'A&D Medical'];
  const ratings = [
    { stars: 5, label: '5 Stars' },
    { stars: 4, label: '4+ Stars' },
    { stars: 3, label: '3+ Stars' },
  ];

  const toggleBrand = (brand: string) => {
    setFilters((prev: any) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b: string) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  return (
    <aside className="w-[220px] flex-shrink-0 space-y-4">
      {/* Brands */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Brand</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="w-4 h-4 accent-[#00A651]"
              />
              <span className="text-sm text-[#666666]">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Price Range</h3>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="50000"
            step="1000"
            value={filters.priceRange[1]}
            onChange={(e) =>
              setFilters((prev: any) => ({
                ...prev,
                priceRange: [0, parseInt(e.target.value)],
              }))
            }
            className="w-full accent-[#00A651]"
          />
          <div className="flex justify-between text-sm text-[#666666]">
            <span>Rs. {filters.priceRange[0]}</span>
            <span>Rs. {filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Customer Rating */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Customer Rating</h3>
        <div className="space-y-2">
          {ratings.map((rating) => (
            <label key={rating.stars} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={filters.rating === rating.stars}
                onChange={() =>
                  setFilters((prev: any) => ({ ...prev, rating: rating.stars }))
                }
                className="w-4 h-4 accent-[#00A651]"
              />
              <div className="flex items-center gap-1">
                {[...Array(rating.stars)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-sm text-[#666666] ml-1">{rating.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default DevicesSidebar;
