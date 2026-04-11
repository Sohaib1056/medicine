import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Phone, MapPin } from 'lucide-react';

const MedicineHeader = () => {
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

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl flex gap-2">
            <input
              type="text"
              placeholder="Search for medicines, health products..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
            />
            <button className="bg-[#00A651] text-white px-6 py-2.5 rounded-lg hover:bg-[#008f47] transition font-medium">
              Search
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <Link to="/signin" className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#00A651]">
              <User size={20} />
              <span>Sign In</span>
            </Link>
            <button className="relative">
              <ShoppingCart size={24} className="text-[#1A1A1A] hover:text-[#00A651]" />
              <span className="absolute -top-2 -right-2 bg-[#E53935] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MedicineHeader;
