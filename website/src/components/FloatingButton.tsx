import React from 'react';
import { Upload } from 'lucide-react';

const FloatingButton = () => {
  return (
    <button className="fixed bottom-8 right-8 bg-[#00B074] text-white px-6 py-4 rounded-full shadow-2xl hover:bg-[#009960] transition flex items-center gap-2 font-medium z-50 hover:scale-105 transform">
      <Upload size={20} />
      Upload Prescription
    </button>
  );
};

export default FloatingButton;
