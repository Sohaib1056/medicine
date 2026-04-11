import React from 'react';
import { Check } from 'lucide-react';

const HealthPackages = () => {
  const packages = [
    {
      name: 'Basic Health Package',
      gradient: 'from-[#00A651] to-[#00d66a]',
      tests: [
        'Complete Blood Count (CBC)',
        'Blood Sugar (Fasting)',
        'Lipid Profile',
        'Kidney Function Test',
        'Liver Function Test',
      ],
      price: 1999,
      oldPrice: 3500,
    },
    {
      name: 'Standard Health Package',
      gradient: 'from-[#00BFA5] to-[#00e6c3]',
      tests: [
        'All Basic Package Tests',
        'Thyroid Profile (T3, T4, TSH)',
        'Vitamin D Test',
        'Vitamin B12 Test',
        'HbA1c (Diabetes)',
        'Uric Acid Test',
        'Iron Studies',
      ],
      price: 3999,
      oldPrice: 7000,
    },
    {
      name: 'Premium Health Package',
      gradient: 'from-[#1a237e] to-[#3949ab]',
      tests: [
        'All Standard Package Tests',
        'Complete Hormone Panel',
        'Cardiac Risk Markers',
        'Cancer Markers (Basic)',
        'Allergy Panel',
        'Bone Health Profile',
        'Complete Urine Analysis',
        'ECG & Consultation',
      ],
      price: 6999,
      oldPrice: 14000,
    },
  ];

  return (
    <section className="py-16 px-4 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Health Packages
          </h2>
          <p className="text-[#666666]">
            Comprehensive health checkup packages at best prices
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${pkg.gradient} rounded-xl p-8 text-white shadow-xl hover:scale-105 transition`}
            >
              <h3 className="text-2xl font-bold mb-6">{pkg.name}</h3>

              <div className="space-y-3 mb-8">
                {pkg.tests.map((test, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check size={20} className="flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{test}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/30 pt-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold">Rs. {pkg.price}</span>
                  <span className="text-sm line-through opacity-75">
                    Rs. {pkg.oldPrice}
                  </span>
                </div>
                <p className="text-sm opacity-90">
                  Save Rs. {pkg.oldPrice - pkg.price}
                </p>
              </div>

              <button className="w-full bg-white text-[#1A1A1A] py-3 rounded-lg hover:bg-gray-100 transition font-bold">
                Book Package
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HealthPackages;
