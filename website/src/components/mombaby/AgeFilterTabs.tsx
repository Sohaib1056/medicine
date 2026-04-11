import React from 'react';

interface AgeFilterTabsProps {
  activeAge: string;
  setActiveAge: (age: string) => void;
}

const AgeFilterTabs: React.FC<AgeFilterTabsProps> = ({ activeAge, setActiveAge }) => {
  const ages = [
    { emoji: '👼', label: 'Newborn (0-3M)' },
    { emoji: '🍼', label: 'Infant (3-12M)' },
    { emoji: '🧒', label: 'Toddler (1-3Y)' },
    { emoji: '🤱', label: 'Mom Care' },
    { emoji: '🤰', label: 'Maternity' },
  ];

  return (
    <div className="bg-white border-b py-4 px-4 overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 min-w-max justify-center">
          {ages.map((age) => (
            <button
              key={age.label}
              onClick={() => setActiveAge(age.label)}
              className={`px-6 py-2.5 rounded-full font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeAge === age.label
                  ? 'bg-[#00A651] text-white'
                  : 'bg-white text-[#1A1A1A] border border-gray-300 hover:border-[#00A651]'
              }`}
            >
              <span className="text-xl">{age.emoji}</span>
              {age.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgeFilterTabs;
