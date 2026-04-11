import React, { useState } from 'react';
import MedicineHeader from '../components/medicine/MedicineHeader';
import PersonalCareNavigation from '../components/personalcare/PersonalCareNavigation';
import CategoryTabs from '../components/personalcare/CategoryTabs';
import PromoBanner from '../components/personalcare/PromoBanner';
import BestSellers from '../components/personalcare/BestSellers';
import PersonalCareSidebar from '../components/personalcare/PersonalCareSidebar';
import ProductGrid from '../components/personalcare/ProductGrid';
import ComboDealSection from '../components/personalcare/ComboDealSection';
import MedicineFooter from '../components/medicine/MedicineFooter';

const PersonalCare = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [filters, setFilters] = useState({
    brands: [] as string[],
    skinTypes: [] as string[],
    concerns: [] as string[],
    priceRange: [0, 10000],
  });

  return (
    <div className="min-h-screen bg-white font-sans">
      <MedicineHeader />
      <PersonalCareNavigation />
      <CategoryTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <PromoBanner />
      <BestSellers />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <PersonalCareSidebar filters={filters} setFilters={setFilters} />
          <ProductGrid filters={filters} activeCategory={activeCategory} />
        </div>
      </div>
      
      <ComboDealSection />
      <MedicineFooter />
    </div>
  );
};

export default PersonalCare;
