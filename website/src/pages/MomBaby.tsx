import React, { useState } from 'react';
import MedicineHeader from '../components/medicine/MedicineHeader';
import MomBabyNavigation from '../components/mombaby/MomBabyNavigation';
import MomBabyHero from '../components/mombaby/MomBabyHero';
import AgeFilterTabs from '../components/mombaby/AgeFilterTabs';
import CategoryGrid from '../components/mombaby/CategoryGrid';
import ExpertPharmacistCTA from '../components/mombaby/ExpertPharmacistCTA';
import ProductGrid from '../components/mombaby/ProductGrid';
import TrustedBrands from '../components/mombaby/TrustedBrands';
import MedicineFooter from '../components/medicine/MedicineFooter';

const MomBaby = () => {
  const [activeAge, setActiveAge] = useState('Newborn (0-3M)');

  return (
    <div className="min-h-screen bg-white font-sans">
      <MedicineHeader />
      <MomBabyNavigation />
      <MomBabyHero />
      <AgeFilterTabs activeAge={activeAge} setActiveAge={setActiveAge} />
      <CategoryGrid />
      <ExpertPharmacistCTA />
      <ProductGrid activeAge={activeAge} />
      <TrustedBrands />
      <MedicineFooter />
    </div>
  );
};

export default MomBaby;
