import React from 'react';
import MedicineHeader from '../components/medicine/MedicineHeader';
import LabNavigation from '../components/lab/LabNavigation';
import LabHero from '../components/lab/LabHero';
import PopularTests from '../components/lab/PopularTests';
import HealthPackages from '../components/lab/HealthPackages';
import HowItWorks from '../components/lab/HowItWorks';
import LabPartners from '../components/lab/LabPartners';
import MedicineFooter from '../components/medicine/MedicineFooter';

const LabTests = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <MedicineHeader />
      <LabNavigation />
      <LabHero />
      <PopularTests />
      <HealthPackages />
      <HowItWorks />
      <LabPartners />
      <MedicineFooter />
    </div>
  );
};

export default LabTests;
