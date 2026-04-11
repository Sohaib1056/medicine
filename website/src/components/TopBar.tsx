import React from 'react';
import { Phone, MapPin } from 'lucide-react';

const TopBar = () => {
  return (
    <div className="bg-[#00B074] text-white py-2 px-4">
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
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">Track Order</a>
          <span>|</span>
          <a href="#" className="hover:underline">Help & Support</a>
          <button className="ml-4 px-4 py-1 border border-white rounded hover:bg-white hover:text-[#00B074] transition">
            Sign up with email
          </button>
          <button className="px-4 py-1 bg-white text-[#00B074] rounded hover:bg-gray-100 transition font-medium">
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
