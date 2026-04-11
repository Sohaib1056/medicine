import React from 'react';

const articles = [
  {
    category: 'Heart Health',
    emoji: '❤️',
    emojiBg: '#FFEBEE',
    title: '10 Foods That Lower Cholesterol Naturally',
    date: 'April 8, 2026',
    readTime: '5 min read',
  },
  {
    category: 'Diabetes Care',
    emoji: '🩸',
    emojiBg: '#E3F2FD',
    title: 'Managing Blood Sugar: A Complete Guide',
    date: 'April 6, 2026',
    readTime: '7 min read',
  },
  {
    category: 'Mental Wellness',
    emoji: '🧠',
    emojiBg: '#E8EAF6',
    title: 'Stress Management Techniques That Work',
    date: 'April 5, 2026',
    readTime: '6 min read',
  },
];

const HealthArticles = () => {
  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Health Articles</h2>
          <button className="text-[#00A651] font-medium hover:underline">View All →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div 
                className="h-32 flex items-center justify-center text-5xl"
                style={{ backgroundColor: article.emojiBg }}
              >
                {article.emoji}
              </div>
              <div className="p-5">
                <span className="inline-block bg-[#00A651] text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
                  {article.category}
                </span>
                <h3 className="font-bold text-gray-900 mb-3 text-base leading-snug">
                  {article.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
                <button className="text-[#00A651] font-medium text-sm mt-3 hover:underline">
                  Read More →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthArticles;
