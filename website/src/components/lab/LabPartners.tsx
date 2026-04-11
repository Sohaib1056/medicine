import React from 'react';

const LabPartners = () => {
  const partners = [
    'Chughtai Lab',
    'IDC Lab',
    'Islamabad Diagnostic Center',
    'Excel Lab',
    'Shaukat Khanum Lab',
    'Aga Khan Lab',
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Our Lab Partners
          </h2>
          <p className="text-[#666666]">
            Trusted by Pakistan's leading diagnostic laboratories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-6 flex items-center justify-center hover:shadow-lg transition h-24"
            >
              <span className="text-center font-bold text-[#1A1A1A] text-sm">
                {partner}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[#666666] mb-4">
            All our partner labs are NABL certified and follow strict quality standards
          </p>
          <button className="bg-[#00A651] text-white px-8 py-3 rounded-lg hover:bg-[#008f47] transition font-medium">
            View All Partners
          </button>
        </div>
      </div>
    </section>
  );
};

export default LabPartners;
