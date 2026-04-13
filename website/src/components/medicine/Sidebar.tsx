import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../services/api';

interface SidebarProps {
  filters: {
    categories: string[];
    brands: string[];
    priceRange: number[];
    discounts: string[];
    inStock: boolean;
    requiresPrescription: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters }) => {
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories and brands from backend
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          productsAPI.getCategories(),
          productsAPI.getBrands()
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error('Error fetching filters:', error);
        // Fallback to default values
        setCategories([
          { name: 'Pain Relief', count: 0 },
          { name: 'Antibiotics', count: 0 },
          { name: 'Vitamins', count: 0 },
        ]);
        setBrands(['GSK', 'Pfizer', 'Abbott']);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  const discounts = ['10%+', '20%+', '30%+', '50%+'];

  const toggleCategory = (category: string) => {
    setFilters((prev: any) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c: string) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleBrand = (brand: string) => {
    setFilters((prev: any) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b: string) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const toggleDiscount = (discount: string) => {
    setFilters((prev: any) => ({
      ...prev,
      discounts: prev.discounts.includes(discount)
        ? prev.discounts.filter((d: string) => d !== discount)
        : [...prev.discounts, discount],
    }));
  };

  return (
    <aside className="w-[220px] flex-shrink-0 space-y-4">
      {/* Clear Filters Button */}
      {(filters.categories.length > 0 || 
        filters.brands.length > 0 || 
        filters.discounts.length > 0 || 
        filters.inStock || 
        filters.requiresPrescription ||
        filters.priceRange[1] < 5000) && (
        <button
          onClick={() => setFilters({
            categories: [],
            brands: [],
            priceRange: [0, 5000],
            discounts: [],
            inStock: false,
            requiresPrescription: false,
          })}
          className="w-full bg-[#FF6F35] text-white py-2 rounded-lg hover:bg-[#e55a1f] transition font-medium text-sm"
        >
          Clear All Filters
        </button>
      )}

      {/* Categories */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Categories</h3>
        {loading ? (
          <div className="text-sm text-[#666666]">Loading...</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((cat) => (
              <label key={cat.name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.name)}
                  onChange={() => toggleCategory(cat.name)}
                  className="w-4 h-4 accent-[#00A651]"
                />
                <span className="text-sm text-[#666666] flex-1">{cat.name}</span>
                {cat.count > 0 && (
                  <span className="text-xs text-[#999999]">({cat.count})</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Brand</h3>
        {loading ? (
          <div className="text-sm text-[#666666]">Loading...</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
        )}
      </div>

      {/* Price Range */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Price Range</h3>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
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

      {/* Discount */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Discount</h3>
        <div className="space-y-2">
          {discounts.map((discount) => (
            <label key={discount} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={filters.discounts.includes(discount)}
                onChange={() => toggleDiscount(discount)}
                className="w-4 h-4 accent-[#00A651]"
              />
              <span className="text-sm text-[#666666]">{discount}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold text-[#1A1A1A] mb-3">Availability</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) =>
                setFilters((prev: any) => ({ ...prev, inStock: e.target.checked }))
              }
              className="w-4 h-4 accent-[#00A651]"
            />
            <span className="text-sm text-[#666666]">In Stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={filters.requiresPrescription}
              onChange={(e) =>
                setFilters((prev: any) => ({
                  ...prev,
                  requiresPrescription: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-[#00A651]"
            />
            <span className="text-sm text-[#666666]">Requires Prescription</span>
          </label>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
