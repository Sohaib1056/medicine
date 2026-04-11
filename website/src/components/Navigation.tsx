import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
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
        <ul className="flex items-center justify-center gap-8 py-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="text-[#1A1A2E] hover:text-[#00B074] font-medium transition"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
