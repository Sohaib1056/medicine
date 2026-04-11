import React from 'react';

interface CategoryTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, setActiveCategory }) => {
  const categories = [
    'All',
    'Skin Care',
    'Hair Care',
    'Oral Care',
    'Body Care',
    "Men's Grooming",
    "Women's Care",
  ];

  return (
    <div className="bg-white border-b py-4 px-4 overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full font-medium transition whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-[#00A651] text-white'
                  : 'bg-white text-[#1A1A1A] border border-gray-300 hover:border-[#00A651]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
