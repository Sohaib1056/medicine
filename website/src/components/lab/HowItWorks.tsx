import React from 'react';
import { Calendar, Home, FileText } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: Calendar,
      title: 'Book Online',
      description: 'Select your test or package and book online. Choose your preferred time slot.',
    },
    {
      number: 2,
      icon: Home,
      title: 'Sample Collection',
      description: 'Our trained phlebotomist will visit your home to collect samples safely.',
    },
    {
      number: 3,
      icon: FileText,
      title: 'Get Reports',
      description: 'Receive your reports online within 24 hours. Consult with doctors if needed.',
    },
  ];

  return (
    <section className="py-16 px-4 bg-[#F0FAF5]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            How It Works
          </h2>
          <p className="text-[#666666]">
            Simple 3-step process to get your lab tests done
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="text-center">
                {/* Circle Number */}
                <div className="w-20 h-20 bg-[#00A651] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Icon className="text-[#00A651]" size={32} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#666666]">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
