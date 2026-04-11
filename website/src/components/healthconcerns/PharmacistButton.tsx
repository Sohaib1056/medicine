import React from 'react';
import { MessageCircle } from 'lucide-react';

const PharmacistButton = () => {
  return (
    <button className="fixed bottom-6 right-6 bg-[#00A651] text-white rounded-full shadow-lg hover:bg-[#008f47] transition-all hover:scale-105 z-50 flex items-center gap-3 px-6 py-4 group">
      <div className="bg-white rounded-full p-2">
        <MessageCircle className="w-5 h-5 text-[#00A651]" />
      </div>
      <span className="font-medium">Talk to Pharmacist</span>
    </button>
  );
};

export default PharmacistButton;
