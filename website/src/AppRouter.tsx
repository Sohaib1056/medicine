import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import App from './App';
import MedicineListing from './pages/MedicineListing';
import LabTests from './pages/LabTests';
import HealthDevices from './pages/HealthDevices';
import Wellness from './pages/Wellness';
import PersonalCare from './pages/PersonalCare';
import MomBaby from './pages/MomBaby';
import HealthConcerns from './pages/HealthConcerns';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

const AppRouter = () => {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/medicines" element={<MedicineListing />} />
          <Route path="/lab-tests" element={<LabTests />} />
          <Route path="/health-devices" element={<HealthDevices />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/personal-care" element={<PersonalCare />} />
          <Route path="/mom-baby" element={<MomBaby />} />
          <Route path="/health-concerns" element={<HealthConcerns />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
};

export default AppRouter;
