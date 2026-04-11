import React from 'react';
import { Upload } from 'lucide-react';

const UploadBanner = () => {
  return (
    <div className="bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-[#1A1A1A] font-medium">
          Upload Prescription & Get Medicines Delivered in 2 Hours
        </p>
        <button className="flex items-center gap-2 bg-[#00A651] text-white px-6 py-2.5 rounded-lg hover:bg-[#008f47] transition font-medium">
          <Upload size={18} />
          Upload Prescription
        </button>
      </div>
    </div>
  );
};

export default UploadBanner;
