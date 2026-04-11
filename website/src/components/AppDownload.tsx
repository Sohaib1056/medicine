import React from 'react';
import { Smartphone, Apple, Clock, Package, Headphones } from 'lucide-react';

const AppDownload = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-[#00B074] to-[#008c5a]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-4">
              Download MediCare App &<br />Get 30% OFF
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              Download our mobile app and enjoy exclusive discounts, faster checkout, and easy order tracking. Available on iOS and Android.
            </p>
            
            <div className="flex gap-4 mb-8">
              <button className="flex items-center gap-3 bg-white text-[#1A1A2E] px-6 py-3 rounded-lg hover:bg-gray-100 transition">
                <Apple size={24} />
                <div className="text-left">
                  <p className="text-xs">Download on the</p>
                  <p className="font-bold">App Store</p>
                </div>
              </button>
              
              <button className="flex items-center gap-3 bg-white text-[#1A1A2E] px-6 py-3 rounded-lg hover:bg-gray-100 transition">
                <Smartphone size={24} />
                <div className="text-left">
                  <p className="text-xs">GET IT ON</p>
                  <p className="font-bold">Google Play</p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Right Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">30%</div>
              <p className="text-white/90">First Order Discount</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">2</span>
                <span className="text-2xl font-bold">Hr</span>
              </div>
              <p className="text-white/90">Express Delivery</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">10k</span>
                <span className="text-2xl font-bold">+</span>
              </div>
              <p className="text-white/90">Products</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <p className="text-white/90">Support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
