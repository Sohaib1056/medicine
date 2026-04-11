import React from 'react';
import MedicineHeader from '../components/medicine/MedicineHeader';
import WellnessNavigation from '../components/wellness/WellnessNavigation';
import WellnessHero from '../components/wellness/WellnessHero';
import CategoryCircles from '../components/wellness/CategoryCircles';
import TrendingProducts from '../components/wellness/TrendingProducts';
import HealthTipsBlog from '../components/wellness/HealthTipsBlog';
import AutoDeliveryBanner from '../components/wellness/AutoDeliveryBanner';
import MedicineFooter from '../components/medicine/MedicineFooter';

const Wellness = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <MedicineHeader />
      <WellnessNavigation />
      <WellnessHero />
      <CategoryCircles />
      <TrendingProducts />
      <HealthTipsBlog />
      <AutoDeliveryBanner />
      <MedicineFooter />
    </div>
  );
};

export default Wellness;
