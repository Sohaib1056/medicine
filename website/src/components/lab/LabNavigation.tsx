import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LabNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Medicine', path: '/medicines' },
    { name: 'Lab Tests', path: '/lab-tests' },
    { name: 'Health Devices', path: '/health-devices' },
    { name: 'Wellness', path: '/wellness' },
    { name: 'Personal Care', path: '/personal-care' },
    { name: 'Mom & Baby', path: '/mom-baby' },
    { name: 'Health Concerns', path: '/health-concerns' },
  ];

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center justify-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`block py-4 font-medium transition relative ${
                    isActive
                      ? 'text-[#00A651]'
                      : 'text-[#1A1A1A] hover:text-[#00A651]'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A651]"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default LabNavigation;
