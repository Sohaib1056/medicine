import React from 'react';
import { ArrowRight, Flame } from 'lucide-react';

const BestDeals = () => {
  const deals = [
    {
      title: 'Flat 30% OFF on First Order',
      code: 'FIRST30',
      bgColor: 'bg-gradient-to-br from-[#FF6B35] to-[#ff8c5a]',
    },
    {
      title: 'Extra 20% OFF on Health Devices',
      code: 'DEVICE20',
      bgColor: 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]',
    },
    {
      title: 'Buy 1 Get 1 FREE on Vitamins',
      code: 'BOGO',
      bgColor: 'bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]',
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#1A1A2E]">Today's Best Deals</h2>
          <a href="#" className="flex items-center gap-2 text-[#00B074] hover:underline font-medium">
            View All Offers <ArrowRight size={20} />
          </a>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {deals.map((deal, index) => (
            <div key={index} className={`${deal.bgColor} rounded-xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Flame size={16} />
                <span className="text-xs font-bold">Hot Deal</span>
              </div>
              
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-3">{deal.title}</h3>
                <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-2 rounded-lg mb-4">
                  <p className="text-sm">Use code: <span className="font-bold text-lg">{deal.code}</span></p>
                </div>
                <button className="bg-white text-[#1A1A2E] px-6 py-2 rounded-lg hover:bg-gray-100 transition font-medium">
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestDeals;
