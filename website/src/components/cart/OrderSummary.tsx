import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Clock, MapPin, Phone, MessageCircle } from 'lucide-react';

interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  discount: number;
  deliveryCharges: number;
  total: number;
  promoApplied: boolean;
  couponCode?: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  itemCount,
  subtotal,
  discount,
  deliveryCharges,
  total,
  promoApplied,
  couponCode,
}) => {
  return (
    <div className="space-y-4">
      {/* Order Summary Card */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 lg:sticky lg:top-20">
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Order Summary</h2>

        {/* Line Items */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#666666]">Subtotal ({itemCount} items)</span>
            <span className="text-[#1A1A1A] font-medium">Rs. {subtotal.toFixed(2)}</span>
          </div>

          {promoApplied && discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#666666]">Discount ({couponCode || 'Coupon'})</span>
              <span className="text-[#00A651] font-medium">- Rs. {discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-[#666666]">Delivery Charges</span>
            {deliveryCharges === 0 ? (
              <span className="text-[#00A651] font-bold">FREE</span>
            ) : (
              <span className="text-[#1A1A1A] font-medium">Rs. {deliveryCharges}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E0E0E0] my-4"></div>

        {/* Total */}
        <div className="flex justify-between items-center mb-5">
          <span className="text-lg font-bold text-[#1A1A1A]">Total</span>
          <span className="text-2xl font-bold text-[#00A651]">Rs. {total.toFixed(2)}</span>
        </div>

        {/* Delivery Info */}
        <div className="bg-[#E8F5E9] rounded-lg p-4 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
            <Clock size={16} className="text-[#00A651]" />
            <span className="font-medium">2 Hour Express Delivery Available</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <MapPin size={16} className="text-[#00A651]" />
            <span>Delivering to: Karachi, Pakistan</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Link
          to="/checkout"
          className="block w-full bg-[#00A651] text-white text-center py-3.5 rounded-lg hover:bg-[#008f47] transition-colors font-bold text-base shadow-lg hover:shadow-xl"
        >
          Proceed to Checkout
        </Link>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#666666] mt-3">
          <Lock size={14} className="text-[#00A651]" />
          <span>Secure Checkout — SSL Encrypted</span>
        </div>

        {/* Payment Icons */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-[#E0E0E0]">
          <div className="text-xs text-[#666666] px-3 py-1.5 bg-gray-50 rounded border border-[#E0E0E0]">
            Visa
          </div>
          <div className="text-xs text-[#666666] px-3 py-1.5 bg-gray-50 rounded border border-[#E0E0E0]">
            Mastercard
          </div>
          <div className="text-xs text-[#666666] px-3 py-1.5 bg-gray-50 rounded border border-[#E0E0E0]">
            JazzCash
          </div>
          <div className="text-xs text-[#666666] px-3 py-1.5 bg-gray-50 rounded border border-[#E0E0E0]">
            Easypaisa
          </div>
        </div>
      </div>

      {/* Need Help Card */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
        <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Need Help?</h3>
        
        <div className="space-y-3">
          <a
            href="tel:+923001234567"
            className="flex items-center gap-3 text-sm text-[#666666] hover:text-[#00A651] transition-colors"
          >
            <Phone size={18} className="text-[#00A651]" />
            <span>Call us: +92-300-1234567</span>
          </a>
          
          <button className="flex items-center gap-3 text-sm text-[#666666] hover:text-[#00A651] transition-colors">
            <MessageCircle size={18} className="text-[#00A651]" />
            <span>Chat with Pharmacist</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
