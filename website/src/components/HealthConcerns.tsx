import React from 'react';
import { Heart, Brain, Droplet, Bone, Eye, Activity, Wind, Plus } from 'lucide-react';

const HealthConcerns = () => {
  const concerns = [
    { icon: Heart, name: 'Heart Care', count: '150+', bgColor: 'bg-red-50', iconColor: 'text-red-500' },
    { icon: Brain, name: 'Mental Wellness', count: '120+', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
    { icon: Droplet, name: 'Diabetes', count: '200+', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { icon: Bone, name: 'Bone & Joint', count: '180+', bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
    { icon: Eye, name: 'Eye Care', count: '90+', bgColor: 'bg-cyan-50', iconColor: 'text-cyan-500' },
    { icon: Activity, name: 'Blood Pressure', count: '160+', bgColor: 'bg-pink-50', iconColor: 'text-pink-500' },
    { icon: Wind, name: 'Respiratory', count: '140+', bgColor: 'bg-teal-50', iconColor: 'text-teal-500' },
    { icon: Plus, name: 'General Health', count: '300+', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Shop by Health Concerns</h2>
          <p className="text-[#6B7280]">Find products tailored to your specific health needs</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {concerns.map((concern, index) => {
            const Icon = concern.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition cursor-pointer group"
              >
                <div className={`w-14 h-14 ${concern.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition`}>
                  <Icon className={concern.iconColor} size={28} />
                </div>
                <h3 className="font-semibold text-[#1A1A2E] text-sm mb-1">{concern.name}</h3>
                <p className="text-xs text-[#6B7280]">{concern.count} items</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HealthConcerns;
