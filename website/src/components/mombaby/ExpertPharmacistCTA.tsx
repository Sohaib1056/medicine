import React from 'react';
import { MessageCircle } from 'lucide-react';

const ExpertPharmacistCTA = () => {
  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#FFE4E9] rounded-xl p-8 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <div className="text-6xl">👩‍⚕️</div>
            <div>
              <h3 className="text-3xl font-bold text-[#1A1A1A] mb-2">
                Expert Pharmacist for Baby Health
              </h3>
              <p className="text-lg text-[#666666]">
                Get free advice from our certified pharmacists on baby care, nutrition, and health concerns
              </p>
            </div>
          </div>

          {/* Right Side */}
          <button className="bg-[#00A651] text-white px-8 py-4 rounded-lg hover:bg-[#008f47] transition font-bold text-lg shadow-lg whitespace-nowrap flex items-center gap-2">
            <MessageCircle size={24} />
            Consult Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default ExpertPharmacistCTA;
