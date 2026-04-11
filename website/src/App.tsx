import React from 'react';
import TopBar from './components/TopBar';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import BestDeals from './components/BestDeals';
import ShopByCategory from './components/ShopByCategory';
import FeaturedProducts from './components/FeaturedProducts';
import HealthConcerns from './components/HealthConcerns';
import HealthcareServices from './components/HealthcareServices';
import WhyChoose from './components/WhyChoose';
import AppDownload from './components/AppDownload';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import FloatingButton from './components/FloatingButton';

function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <TopBar />
      <Header />
      <Navigation />
      <HeroSection />
      <BestDeals />
      <ShopByCategory />
      <FeaturedProducts />
      <HealthConcerns />
      <HealthcareServices />
      <WhyChoose />
      <AppDownload />
      <Newsletter />
      <Footer />
      <FloatingButton />
    </div>
  );
}

export default App;
