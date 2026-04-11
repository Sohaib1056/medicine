import React from 'react';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

const HealthTipsBlog = () => {
  const blogs = [
    {
      emoji: '🥗',
      bgColor: 'bg-gradient-to-br from-[#fff3e0] to-[#ffe0b2]',
      category: 'NUTRITION',
      title: '10 Superfoods to Boost Your Immunity',
      date: 'March 15, 2024',
      readTime: '5 min read',
    },
    {
      emoji: '🧘',
      bgColor: 'bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]',
      category: 'WELLNESS',
      title: 'The Benefits of Daily Meditation for Mental Health',
      date: 'March 12, 2024',
      readTime: '7 min read',
    },
    {
      emoji: '💪',
      bgColor: 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb]',
      category: 'FITNESS',
      title: 'Complete Guide to Protein Supplements',
      date: 'March 10, 2024',
      readTime: '6 min read',
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Health Tips & Wellness Blog
          </h2>
          <p className="text-[#666666]">
            Expert advice and tips for a healthier lifestyle
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {blogs.map((blog, index) => (
            <div
              key={index}
              className="bg-white border rounded-xl overflow-hidden hover:shadow-xl transition group cursor-pointer"
            >
              {/* Image Area with Emoji */}
              <div className={`${blog.bgColor} h-48 flex items-center justify-center`}>
                <span className="text-7xl">{blog.emoji}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category Tag */}
                <span className="inline-block bg-[#00A651] text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  {blog.category}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 group-hover:text-[#00A651] transition">
                  {blog.title}
                </h3>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-[#666666] mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{blog.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{blog.readTime}</span>
                  </div>
                </div>

                {/* Read More Link */}
                <a
                  href="#"
                  className="flex items-center gap-2 text-[#00A651] font-medium hover:underline group-hover:gap-3 transition-all"
                >
                  Read More <ArrowRight size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HealthTipsBlog;
