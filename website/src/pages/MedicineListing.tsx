import React, { useState } from 'react';
import MedicineHeader from '../components/medicine/MedicineHeader';
import MedicineNavigation from '../components/medicine/MedicineNavigation';
import UploadBanner from '../components/medicine/UploadBanner';
import Sidebar from '../components/medicine/Sidebar';
import ProductGrid from '../components/medicine/ProductGrid';
import MedicineFooter from '../components/medicine/MedicineFooter';

const MedicineListing = () => {
  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRange: [0, 5000],
    discounts: [] as string[],
    inStock: false,
    requiresPrescription: false,
  });

  const [sortBy, setSortBy] = useState('popular');

  return (
    <div className="min-h-screen bg-white font-sans">
      <MedicineHeader />
      <MedicineNavigation />
      <UploadBanner />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <Sidebar filters={filters} setFilters={setFilters} />
          <ProductGrid sortBy={sortBy} setSortBy={setSortBy} filters={filters} />
        </div>
      </div>
      
      <MedicineFooter />
    </div>
  );
};

export default MedicineListing;
