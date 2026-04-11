import React from 'react';

interface Concern {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  count: string;
}

const concerns: Concern[] = [
  { id: 'heart', name: 'Heart Care', icon: '❤️', iconBg: '#FFEBEE', count: '230+' },
  { id: 'mental', name: 'Mental Wellness', icon: '🧠', iconBg: '#E8EAF6', count: '180+' },
  { id: 'diabetes', name: 'Diabetes', icon: '🩸', iconBg: '#E3F2FD', count: '300+' },
  { id: 'bone', name: 'Bone & Joint', icon: '🦴', iconBg: '#FFF3E0', count: '200+' },
  { id: 'eye', name: 'Eye Care', icon: '👁️', iconBg: '#E0F7FA', count: '280+' },
  { id: 'bp', name: 'Blood Pressure', icon: '💉', iconBg: '#FFEBEE', count: '380+' },
  { id: 'respiratory', name: 'Respiratory', icon: '🫁', iconBg: '#E3F2FD', count: '160+' },
  { id: 'general', name: 'General Health', icon: '🏥', iconBg: '#E8F5E9', count: '900+' },
  { id: 'digestive', name: 'Digestive Health', icon: '🦷', iconBg: '#FFF8E1', count: '140+' },
  { id: 'kidney', name: 'Kidney Care', icon: '🫘', iconBg: '#F3E5F5', count: '110+' },
  { id: 'liver', name: 'Liver Health', icon: '🔴', iconBg: '#FFEBEE', count: '95+' },
  { id: 'women', name: "Women's Health", icon: '👩', iconBg: '#FCE4EC', count: '320+' },
  { id: 'men', name: "Men's Health", icon: '👨', iconBg: '#E8F5E9', count: '280+' },
  { id: 'immunity', name: 'Immunity', icon: '🛡️', iconBg: '#E8F5E9', count: '450+' },
  { id: 'sleep', name: 'Sleep Disorders', icon: '😴', iconBg: '#E8EAF6', count: '90+' },
  { id: 'thyroid', name: 'Thyroid', icon: '🦋', iconBg: '#E3F2FD', count: '170+' },
];

interface ConcernsGridProps {
  onSelectConcern: (concernId: string) => void;
}

const ConcernsGrid: React.FC<ConcernsGridProps> = ({ onSelectConcern }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {concerns.map((concern) => (
          <button
            key={concern.id}
            onClick={() => onSelectConcern(concern.id)}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#00A651] hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
              style={{ backgroundColor: concern.iconBg }}
            >
              {concern.icon}
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-[#00A651] transition-colors">
              {concern.name}
            </h3>
            <p className="text-xs text-gray-500">{concern.count} Products</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConcernsGrid;
