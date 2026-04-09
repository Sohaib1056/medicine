import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground mt-20">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-lg">💊</span>
            </div>
            <span className="text-xl font-bold">MediCart</span>
          </div>
          <p className="text-sm opacity-70">Your trusted online pharmacy. Genuine medicines delivered to your doorstep.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><Link to="/products" className="hover:opacity-100 transition-opacity">All Products</Link></li>
            <li><Link to="/products?category=tablets" className="hover:opacity-100 transition-opacity">Tablets</Link></li>
            <li><Link to="/products?category=vitamins" className="hover:opacity-100 transition-opacity">Vitamins</Link></li>
            <li><Link to="/products?category=medical-devices" className="hover:opacity-100 transition-opacity">Medical Devices</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Customer Care</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>Track Order</li>
            <li>Return Policy</li>
            <li>Privacy Policy</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>📞 1-800-MEDI-CART</li>
            <li>📧 support@medicart.com</li>
            <li>🕐 Mon-Sat, 8AM-10PM</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-sm opacity-50">
        <p>© 2026 MediCart. All rights reserved. Made with <Heart className="inline h-3 w-3" /> for better health.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
