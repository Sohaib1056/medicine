import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MedicineHeader from '../components/medicine/MedicineHeader';
import MedicineNavigation from '../components/medicine/MedicineNavigation';
import UploadBanner from '../components/medicine/UploadBanner';
import Sidebar from '../components/medicine/Sidebar';
import ProductGrid from '../components/medicine/ProductGrid';
import MedicineFooter from '../components/medicine/MedicineFooter';

const MedicineListing = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRange: [0, 5000],
    discounts: [] as string[],
    inStock: false,
    requiresPrescription: false,
    search: searchQuery,
  });

  const [sortBy, setSortBy] = useState('popular');

  // Update search filter when URL changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
  }, [searchQuery]);

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
