import React from 'react';
import { Pill, Activity, Heart, Sparkles, Baby, Leaf } from 'lucide-react';

const ShopByCategory = () => {
  const categories = [
    { icon: Pill, name: 'Medicines', count: '3000+', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Activity, name: 'Health Devices', count: '300+', bgColor: 'bg-red-100', iconColor: 'text-red-600' },
    { icon: Heart, name: 'Wellness', count: '200+', bgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
    { icon: Sparkles, name: 'Personal Care', count: '1500+', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: Baby, name: 'Baby Care', count: '800+', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { icon: Leaf, name: 'Vitamins', count: '1200+', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-[#1A1A2E] mb-8 text-center">Shop by Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition cursor-pointer group"
              >
                <div className={`w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition`}>
                  <Icon className={category.iconColor} size={32} />
                </div>
                <h3 className="font-bold text-[#1A1A2E] mb-1">{category.name}</h3>
                <p className="text-sm text-[#6B7280]">{category.count} items</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
