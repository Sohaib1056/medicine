import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Header = () => {
  const { cartCount } = useCart();

  return (
    <div className="bg-white border-b py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-10 h-10 bg-[#00B074] rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl font-bold">+</span>
          </div>
          <span className="text-2xl font-bold text-[#1A1A2E]">MediCare</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search medicines, health products, wellness items..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00B074]"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <Link to="/signin" className="flex items-center gap-2 text-[#1A1A2E] hover:text-[#00B074]">
            <User size={20} />
            <span>Sign In</span>
          </Link>
          <Link to="/cart" className="relative">
            <ShoppingCart size={24} className="text-[#1A1A2E] hover:text-[#00B074]" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#FF6B35] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
