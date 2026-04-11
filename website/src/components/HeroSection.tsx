import React from 'react';
import { Upload, ShoppingBag, Clock, Shield, Tag } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-[#F4FBF7] py-16 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 shadow-sm">
            <Shield className="text-[#00B074]" size={20} />
            <span className="text-sm font-medium text-[#1A1A2E]">100% Genuine & Licensed Medicines</span>
          </div>
          
          <h1 className="text-5xl font-bold text-[#1A1A2E] mb-4 leading-tight">
            Pakistan's Most <span className="text-[#00B074]">Trusted</span><br />
            Online Pharmacy
          </h1>
          
          <p className="text-lg text-[#6B7280] mb-8">
            Get medicines delivered to your doorstep in 2 hours. Save up to 30% on all health products with genuine quality guaranteed.
          </p>
          
          <div className="flex gap-4 mb-10">
            <button className="flex items-center gap-2 bg-[#00B074] text-white px-6 py-3 rounded-lg hover:bg-[#009960] transition font-medium">
              <Upload size={20} />
              Upload Prescription
            </button>
            <button className="flex items-center gap-2 border-2 border-[#00B074] text-[#00B074] px-6 py-3 rounded-lg hover:bg-[#00B074] hover:text-white transition font-medium">
              <ShoppingBag size={20} />
              Order Medicine
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="text-[#00B074]" size={24} />
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E]">2 Hours</p>
                <p className="text-sm text-[#6B7280]">Express Delivery</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="text-[#00B074]" size={24} />
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E]">100% Genuine</p>
                <p className="text-sm text-[#6B7280]">Products</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Tag className="text-[#00B074]" size={24} />
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E]">Save 30%</p>
                <p className="text-sm text-[#6B7280]">Best Prices</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Image */}
        <div className="relative">
          <img
            src="https://placehold.co/600x500/e0f2f1/00B074?text=Happy+Family"
            alt="Happy Family"
            className="rounded-2xl shadow-2xl w-full"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
