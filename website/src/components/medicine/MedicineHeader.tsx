import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Phone, MapPin, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { productsAPI, Product } from '../../services/api';

const MedicineHeader = () => {
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch all products on mount for suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsAPI.getProducts({ limit: 500, page: 1 });
        setAllProducts(response.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when search query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const filtered = allProducts
        .filter(product => {
          const searchLower = searchQuery.toLowerCase();
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.genericName?.toLowerCase().includes(searchLower) ||
            product.category?.toLowerCase().includes(searchLower) ||
            product.manufacturer?.toLowerCase().includes(searchLower) ||
            product.brand?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 8); // Show max 8 suggestions
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName);
    navigate(`/medicines?search=${encodeURIComponent(productName)}`);
    setShowSuggestions(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={index} className="font-bold text-[#00A651]">{part}</span> : 
        part
    );
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#00A651] text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone size={14} />
              <span>+92-300-1234567</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>Karachi, Pakistan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-[#00A651] rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+</span>
            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]">MediCare</span>
          </Link>

          {/* Search Bar with Autocomplete */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl flex gap-2 relative" ref={searchRef}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search for medicines, health products..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                autoComplete="off"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSuggestionClick(product.name)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ctext y="18" font-size="18"%3E💊%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <span className="text-2xl">💊</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">
                            {highlightMatch(product.name, searchQuery)}
                          </p>
                          {product.genericName && (
                            <p className="text-xs text-[#666666] truncate">
                              {product.genericName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {product.category && (
                              <span className="text-[10px] text-[#00A651] font-semibold uppercase">
                                {product.category}
                              </span>
                            )}
                            <span className="text-xs font-bold text-[#00A651]">
                              Rs. {product.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* View All Results */}
                  <div
                    onClick={handleSearch}
                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center border-t border-gray-200"
                  >
                    <span className="text-sm font-medium text-[#00A651]">
                      View all results for "{searchQuery}"
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button 
              type="submit"
              className="bg-[#00A651] text-white px-6 py-2.5 rounded-lg hover:bg-[#008f47] transition font-medium"
            >
              Search
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <Link to="/signin" className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#00A651]">
              <User size={20} />
              <span>Sign In</span>
            </Link>
            <Link to="/cart" className="relative">
              <ShoppingCart size={24} className="text-[#1A1A1A] hover:text-[#00A651]" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E53935] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default MedicineHeader;
