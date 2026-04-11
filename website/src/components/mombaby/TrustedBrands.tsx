import React from 'react';

const TrustedBrands = () => {
  const brands = [
    'Pampers',
    "Johnson's",
    'Nestlé',
    'Mustela',
    'Mothercare',
    'Pigeon',
    'Huggies',
    'Chicco',
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Trusted Brands for Your Baby
          </h2>
          <p className="text-[#666666]">
            We partner with the world's leading baby care brands
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-6 flex items-center justify-center hover:shadow-lg transition h-24"
            >
              <span className="text-center font-bold text-[#1A1A1A] text-sm">
                {brand}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[#666666] mb-4">
            All products are 100% authentic and sourced directly from authorized distributors
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustedBrands;
