import React from 'react';
import { ArrowRight, FileText, TestTube, Video, Package } from 'lucide-react';

const HealthcareServices = () => {
  const services = [
    {
      icon: FileText,
      title: 'Order with Prescription',
      description: 'Upload your prescription and get medicines delivered to your doorstep safely and securely.',
      image: 'https://placehold.co/400x300/e3f2fd/1976d2?text=Prescription',
    },
    {
      icon: TestTube,
      title: 'Lab Tests at Home',
      description: 'Book lab tests online and get samples collected from the comfort of your home.',
      image: 'https://placehold.co/400x300/f3e5f5/9c27b0?text=Lab+Tests',
    },
    {
      icon: Video,
      title: 'Online Consultation',
      description: 'Consult with verified doctors via video call from anywhere, anytime.',
      image: 'https://placehold.co/400x300/e8f5e9/43a047?text=Consultation',
    },
    {
      icon: Package,
      title: 'Health Packages',
      description: 'Complete health checkup packages at best prices with comprehensive reports.',
      image: 'https://placehold.co/400x300/fff3e0/f57c00?text=Packages',
    },
  ];

  return (
    <section className="py-16 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-[#1A1A2E] mb-10 text-center">Our Healthcare Services</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition group">
                <img src={service.image} alt={service.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="w-12 h-12 bg-[#00B074] bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-[#00B074]" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{service.title}</h3>
                  <p className="text-[#6B7280] mb-4 text-sm">{service.description}</p>
                  <a href="#" className="flex items-center gap-2 text-[#00B074] hover:underline font-medium text-sm group-hover:gap-3 transition-all">
                    Learn More <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HealthcareServices;
