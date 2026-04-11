import React from 'react';

interface PersonalCareSidebarProps {
  filters: {
    brands: string[];
    skinTypes: string[];
    concerns: string[];
    priceRange: number[];
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

const PersonalCareSidebar: React.FC<PersonalCareSidebarProps> = ({ filters, setFilters }) => {
  const brands = ['Neutrogena', 'Garnier', "L'Oreal", 'Himalaya', 'Dove', 'Nivea'];
  const skinTypes = ['Oily Skin', 'Dry Skin', 'Combination', 'Sensitive', 'All Skin Types'];
  const concerns = ['Anti-aging', 'Acne', 'Moisturizing', 'Brightening', 'Sun Protection'];

  const toggleBrand = (brand: string) => {
    setFilters((prev: any) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b: string) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const toggleSkinType = (type: string) => {
    setFilters((prev: any) => ({
      ...prev,
      skinTypes: prev.skinTypes.includes(type)
        ? prev.skinTypes.filter((t: string) => t !== type)
        : [...prev.skinTypes, type],
    }));
  };

  const toggleConcern = (concern: string) => {
    setFilters((prev: any) => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter((c: string) => c !== concern)
        : [...prev.concerns, concern],
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

      {/* Skin Type */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Skin Type</h3>
        <div className="space-y-2">
          {skinTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.skinTypes.includes(type)}
                onChange={() => toggleSkinType(type)}
                className="w-4 h-4 accent-[#00A651]"
              />
              <span className="text-sm text-[#666666]">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Concern */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Concern</h3>
        <div className="space-y-2">
          {concerns.map((concern) => (
            <label key={concern} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.concerns.includes(concern)}
                onChange={() => toggleConcern(concern)}
                className="w-4 h-4 accent-[#00A651]"
              />
              <span className="text-sm text-[#666666]">{concern}</span>
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
            max="10000"
            step="500"
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
    </aside>
  );
};

export default PersonalCareSidebar;
