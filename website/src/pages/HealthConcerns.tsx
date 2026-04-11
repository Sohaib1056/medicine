import React, { useState } from 'react';
import HealthConcernsNavigation from '../components/healthconcerns/HealthConcernsNavigation';
import HealthConcernsHero from '../components/healthconcerns/HealthConcernsHero';
import ConcernsGrid from '../components/healthconcerns/ConcernsGrid';
import ConcernDetail from '../components/healthconcerns/ConcernDetail';
import HealthArticles from '../components/healthconcerns/HealthArticles';
import PharmacistButton from '../components/healthconcerns/PharmacistButton';
import MedicineHeader from '../components/medicine/MedicineHeader';
import MedicineFooter from '../components/medicine/MedicineFooter';

const HealthConcernsPage = () => {
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <MedicineHeader />
      <HealthConcernsNavigation />
      <HealthConcernsHero />
      <ConcernsGrid onSelectConcern={setSelectedConcern} />
      {selectedConcern && <ConcernDetail concern={selectedConcern} />}
      <HealthArticles />
      <PharmacistButton />
      <MedicineFooter />
    </div>
  );
};

export default HealthConcernsPage;
