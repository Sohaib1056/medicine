import React, { useState } from 'react';
import MedicineHeader from '../components/medicine/MedicineHeader';
import DevicesNavigation from '../components/devices/DevicesNavigation';
import PromoBanner from '../components/devices/PromoBanner';
import CategoryTabs from '../components/devices/CategoryTabs';
import DevicesSidebar from '../components/devices/DevicesSidebar';
import DevicesContent from '../components/devices/DevicesContent';
import MedicineFooter from '../components/medicine/MedicineFooter';

const HealthDevices = () => {
  const [activeCategory, setActiveCategory] = useState('All Devices');
  const [filters, setFilters] = useState({
    brands: [] as string[],
    priceRange: [0, 50000],
    rating: 0,
  });
  const [sortBy, setSortBy] = useState('popular');

  return (
    <div className="min-h-screen bg-white font-sans">
      <MedicineHeader />
      <DevicesNavigation />
      <PromoBanner />
      <CategoryTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <DevicesSidebar filters={filters} setFilters={setFilters} />
          <DevicesContent 
            sortBy={sortBy} 
            setSortBy={setSortBy} 
            filters={filters}
            activeCategory={activeCategory}
          />
        </div>
      </div>
      
      <MedicineFooter />
    </div>
  );
};

export default HealthDevices;
