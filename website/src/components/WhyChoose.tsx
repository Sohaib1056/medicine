import React from 'react';
import { Truck, Shield, Tag, Headphones, CreditCard, RotateCcw } from 'lucide-react';

const WhyChoose = () => {
  const benefits = [
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Get your medicines delivered within 2 hours with our express delivery service.',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Shield,
      title: '100% Genuine',
      description: 'All products are sourced directly from licensed manufacturers and distributors.',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Tag,
      title: 'Best Prices',
      description: 'Save up to 30% on all medicines and health products with our competitive pricing.',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Our customer support team is available round the clock to assist you.',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: CreditCard,
      title: 'Secure Payment',
      description: 'Multiple payment options with 100% secure and encrypted transactions.',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: 'Hassle-free returns within 7 days if you are not satisfied with your order.',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Why Choose MediCare?</h2>
          <p className="text-[#6B7280]">Your health is our priority</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="flex gap-4 group">
                <div className={`w-14 h-14 ${benefit.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition`}>
                  <Icon className={benefit.iconColor} size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{benefit.title}</h3>
                  <p className="text-[#6B7280] text-sm">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
