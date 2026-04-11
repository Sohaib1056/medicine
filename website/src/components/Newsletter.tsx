import React from 'react';
import { Mail } from 'lucide-react';

const Newsletter = () => {
  return (
    <section className="py-16 px-4 bg-gray-100">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3">Subscribe to Our Newsletter</h2>
        <p className="text-[#6B7280] mb-8">
          Get the latest updates on new products, special offers, and health tips delivered to your inbox.
        </p>
        
        <div className="flex gap-3 max-w-xl mx-auto">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00B074]"
            />
          </div>
          <button className="bg-[#00B074] text-white px-8 py-4 rounded-lg hover:bg-[#009960] transition font-medium whitespace-nowrap">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
