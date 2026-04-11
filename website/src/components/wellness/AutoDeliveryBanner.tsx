import React from 'react';
import { RefreshCw } from 'lucide-react';

const AutoDeliveryBanner = () => {
  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] rounded-xl p-8 mx-5 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#00A651] rounded-full flex items-center justify-center">
                <RefreshCw className="text-white" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-[#1A1A1A]">
                Never Run Out — Auto-Delivery
              </h3>
            </div>
            <p className="text-lg text-[#666666] max-w-2xl">
              Subscribe to auto-delivery and get your wellness essentials delivered automatically. 
              Save 10% on every order and never worry about running out of your favorite products.
            </p>
          </div>

          {/* Right Side */}
          <div>
            <button className="bg-[#00A651] text-white px-8 py-4 rounded-lg hover:bg-[#008f47] transition font-bold text-lg shadow-lg hover:shadow-xl whitespace-nowrap">
              Set Up Auto-Delivery
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AutoDeliveryBanner;
