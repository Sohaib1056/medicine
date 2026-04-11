import React from 'react';

const CategoryGrid = () => {
  const categories = [
    { emoji: '🍎', name: 'Baby Food', count: '280+', bgColor: 'bg-pink-100' },
    { emoji: '🧷', name: 'Diapers', count: '150+', bgColor: 'bg-green-100' },
    { emoji: '🧴', name: 'Baby Skincare', count: '320+', bgColor: 'bg-pink-100' },
    { emoji: '🧸', name: 'Accessories', count: '450+', bgColor: 'bg-green-100' },
    { emoji: '🍼', name: 'Breastfeeding', count: '180+', bgColor: 'bg-pink-100' },
    { emoji: '🤰', name: 'Maternity', count: '220+', bgColor: 'bg-green-100' },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="text-center group cursor-pointer"
            >
              <div className={`w-32 h-32 mx-auto mb-4 rounded-full ${category.bgColor} border-2 border-transparent flex items-center justify-center group-hover:border-[#00A651] transition shadow-md group-hover:shadow-lg`}>
                <span className="text-5xl">{category.emoji}</span>
              </div>
              <h3 className="font-bold text-[#1A1A1A] mb-1">{category.name}</h3>
              <p className="text-sm text-[#666666]">{category.count} items</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
