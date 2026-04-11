import React from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, MapPin, CreditCard } from 'lucide-react';

const MedicineFooter = () => {
  return (
    <footer className="bg-[#111111] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About MediCare */}
          <div>
            <h3 className="font-bold text-lg mb-4">About MediCare</h3>
            <p className="text-gray-400 text-sm mb-4">
              Pakistan's most trusted online pharmacy delivering genuine medicines and health products to your doorstep.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00A651] transition">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00A651] transition">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00A651] transition">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00A651] transition">
                <Youtube size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00A651] transition">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-[#00A651] transition">About Us</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">Our Services</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">Health Blog</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">Careers</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">Contact Us</a></li>
            </ul>
          </div>
          
          {/* Our Policies */}
          <div>
            <h3 className="font-bold text-lg mb-4">Our Policies</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-[#00A651] transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">Return Policy</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-[#00A651] transition">FAQs</a></li>
            </ul>
          </div>
          
          {/* Contact Us */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                <span>123 Main Street, Karachi, Pakistan</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} className="flex-shrink-0" />
                <span>+92-300-1234567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={18} className="flex-shrink-0" />
                <span>support@medicare.pk</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 MediCare. All rights reserved.
          </p>
          
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">We Accept:</span>
            <div className="flex gap-2">
              <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                <CreditCard size={20} className="text-gray-700" />
              </div>
              <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-700">
                VISA
              </div>
              <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-700">
                MC
              </div>
              <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-[#00A651]">
                Jazz
              </div>
              <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-700">
                Easy
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MedicineFooter;
