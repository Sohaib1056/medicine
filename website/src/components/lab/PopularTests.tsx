import React from 'react';
import { Clock, Home, ArrowRight } from 'lucide-react';

const PopularTests = () => {
  const tests = [
    {
      name: 'Complete Blood Count (CBC)',
      turnaround: '24 hours',
      homeCollection: 'Available',
      price: 599,
      oldPrice: 1200,
    },
    {
      name: 'Blood Sugar (Fasting & Random)',
      turnaround: '6 hours',
      homeCollection: 'Available',
      price: 399,
      oldPrice: 800,
    },
    {
      name: 'Thyroid Profile (T3, T4, TSH)',
      turnaround: '24 hours',
      homeCollection: 'Available',
      price: 1299,
      oldPrice: 2500,
    },
    {
      name: 'Liver Function Test (LFT)',
      turnaround: '24 hours',
      homeCollection: 'Available',
      price: 899,
      oldPrice: 1800,
    },
    {
      name: 'Lipid Profile (Cholesterol Panel)',
      turnaround: '24 hours',
      homeCollection: 'Available',
      price: 799,
      oldPrice: 1500,
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Popular Tests</h2>
          <a href="#" className="flex items-center gap-2 text-[#00A651] hover:underline font-medium">
            View All <ArrowRight size={20} />
          </a>
        </div>

        <div className="space-y-4">
          {tests.map((test, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-6 hover:shadow-lg transition flex items-center justify-between"
            >
              {/* Left Side */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">
                  {test.name}
                </h3>
                <div className="flex items-center gap-6 text-sm text-[#666666]">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#00A651]" />
                    <span>Reports in {test.turnaround}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-[#00A651]" />
                    <span>Home Collection {test.homeCollection}</span>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#00A651]">
                      Rs. {test.price}
                    </span>
                    <span className="text-sm text-[#666666] line-through">
                      Rs. {test.oldPrice}
                    </span>
                  </div>
                </div>
                <button className="bg-[#00A651] text-white px-6 py-3 rounded-lg hover:bg-[#008f47] transition font-medium whitespace-nowrap">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularTests;
