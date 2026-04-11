import React from 'react';

const CategoryCircles = () => {
  const categories = [
    { emoji: '💊', name: 'Vitamins', count: '450+' },
    { emoji: '🌿', name: 'Herbal', count: '320+' },
    { emoji: '💪', name: 'Protein & Fitness', count: '280+' },
    { emoji: '✨', name: 'Skincare', count: '520+' },
    { emoji: '💇', name: 'Hair Care', count: '380+' },
    { emoji: '🧴', name: 'Essential Oils', count: '150+' },
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
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-[#00A651] transition shadow-md group-hover:shadow-lg">
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

export default CategoryCircles;
