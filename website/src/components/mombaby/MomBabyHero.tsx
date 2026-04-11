import React from 'react';
import { Check, Microscope, Leaf, Baby } from 'lucide-react';

const MomBabyHero = () => {
  const badges = [
    { icon: Check, text: '100% Safe' },
    { icon: Microscope, text: 'Dermatologist Tested' },
    { icon: Leaf, text: 'No Harmful Chemicals' },
    { icon: Baby, text: 'Pediatrician Approved' },
  ];

  return (
    <section className="bg-gradient-to-r from-[#FFB6C1] to-[#c8e6c9] py-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-[#1A1A1A] mb-4">
          Safe Products for Your Little One
        </h1>
        <p className="text-xl text-[#666666] mb-8">
          Trusted by 50,000+ parents across Pakistan
        </p>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-full px-6 py-3 flex items-center gap-2 shadow-md"
              >
                <Icon className="text-[#00A651]" size={20} />
                <span className="font-medium text-[#1A1A1A]">{badge.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MomBabyHero;
