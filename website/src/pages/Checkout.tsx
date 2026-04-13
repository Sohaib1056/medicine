import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User, Phone, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import MedicineHeader from '../components/medicine/MedicineHeader';
import MedicineNavigation from '../components/medicine/MedicineNavigation';
import MedicineFooter from '../components/medicine/MedicineFooter';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartCount, subtotal, total, deliveryCharges, couponDiscount, clearCart } = useCart();
  
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [processing, setProcessing] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Karachi',
    postalCode: '',
    paymentMethod: 'card',
  });

  // Stripe test card data
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });

  // Redirect if cart is empty (but not on success page)
  useEffect(() => {
    if (cartCount === 0 && step !== 'success') {
      navigate('/cart');
    }
  }, [cartCount, navigate, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '');
    
    if (e.target.name === 'cardNumber') {
      // Format card number with spaces
      value = value.replace(/\D/g, '').slice(0, 16);
      value = value.replace(/(\d{4})/g, '$1 ').trim();
    } else if (e.target.name === 'expiryDate') {
      // Format expiry date MM/YY
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
    } else if (e.target.name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }
    
    setCardData({
      ...cardData,
      [e.target.name]: value,
    });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }
    
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate card data
    if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardName) {
      alert('Please fill in all card details');
      return;
    }
    
    setProcessing(true);
    
    // Simulate payment processing (2 seconds)
    setTimeout(async () => {
      setProcessing(false);
      setStep('success');
      
      // Clear cart after successful payment
      await clearCart();
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <MedicineHeader />
        <MedicineNavigation />
        
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-[#00A651] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Order Placed Successfully!
            </h1>
            
            <p className="text-[#666666] mb-2">
              Thank you for your order, {formData.fullName}
            </p>
            <p className="text-[#666666] mb-8">
              Your order will be delivered within 2 hours
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex justify-between mb-3">
                <span className="text-[#666666]">Order Total:</span>
                <span className="font-bold text-[#1A1A1A]">Rs. {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-[#666666]">Payment Method:</span>
                <span className="font-medium text-[#1A1A1A]">Card ending in {cardData.cardNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Delivery Address:</span>
                <span className="font-medium text-[#1A1A1A] text-right">{formData.address}, {formData.city}</span>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/medicines')}
                className="px-6 py-3 bg-[#00A651] text-white rounded-lg hover:bg-[#008f47] transition font-medium"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border-2 border-[#00A651] text-[#00A651] rounded-lg hover:bg-[#E8F5E9] transition font-medium"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
        
        <MedicineFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <MedicineHeader />
      <MedicineNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back to Cart */}
        <button
          onClick={() => step === 'payment' ? setStep('details') : navigate('/cart')}
          className="flex items-center gap-2 text-[#00A651] hover:text-[#008f47] font-medium mb-6"
        >
          <ArrowLeft size={20} />
          {step === 'payment' ? 'Back to Details' : 'Back to Cart'}
        </button>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'details' ? 'text-[#00A651]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-[#00A651] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Delivery Details</span>
            </div>
            
            <div className="w-16 h-0.5 bg-gray-300"></div>
            
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-[#00A651]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-[#00A651] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit} className="bg-white rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Delivery Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      <User size={16} className="inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        <Mail size={16} className="inline mr-2" />
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        <Phone size={16} className="inline mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+92 300 1234567"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      <MapPin size={16} className="inline mr-2" />
                      Delivery Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="House/Flat No, Street, Area"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        City *
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                        required
                      >
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Faisalabad">Faisalabad</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="75500"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full mt-6 bg-[#00A651] text-white py-3 rounded-lg hover:bg-[#008f47] transition font-bold"
                >
                  Continue to Payment
                </button>
              </form>
            )}
            
            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="bg-white rounded-xl p-6">
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Payment Information</h2>
                
                {/* Stripe Test Mode Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-blue-900 mb-2">🧪 Test Mode - Use Test Cards</h3>
                  <p className="text-sm text-blue-800 mb-2">Use these test card numbers:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Success:</strong> 4242 4242 4242 4242</li>
                    <li>• <strong>Declined:</strong> 4000 0000 0000 0002</li>
                    <li>• <strong>Insufficient Funds:</strong> 4000 0000 0000 9995</li>
                    <li>• Use any future expiry date (e.g., 12/25) and any 3-digit CVV</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      <CreditCard size={16} className="inline mr-2" />
                      Card Number *
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardData.cardNumber}
                      onChange={handleCardInputChange}
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651] font-mono"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      value={cardData.cardName}
                      onChange={handleCardInputChange}
                      placeholder="Name on card"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651]"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={cardData.expiryDate}
                        onChange={handleCardInputChange}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651] font-mono"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        <Lock size={16} className="inline mr-2" />
                        CVV *
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={cardData.cvv}
                        onChange={handleCardInputChange}
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A651] font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full mt-6 bg-[#00A651] text-white py-3 rounded-lg hover:bg-[#008f47] transition font-bold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Pay Rs. {total.toFixed(2)}
                    </>
                  )}
                </button>
                
                <p className="text-xs text-center text-[#666666] mt-4">
                  <Lock size={12} className="inline" /> Your payment information is secure and encrypted
                </p>
              </form>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-20">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex gap-3 pb-3 border-b border-gray-100">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💊</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</p>
                      <p className="text-xs text-[#666666]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-[#00A651]">
                      Rs. {(item.finalPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 mb-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Subtotal ({cartCount} items)</span>
                  <span className="text-[#1A1A1A] font-medium">Rs. {subtotal.toFixed(2)}</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666666]">Discount</span>
                    <span className="text-[#00A651] font-medium">- Rs. {couponDiscount.toFixed(2)}</span>
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
              
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-[#1A1A1A]">Total</span>
                <span className="text-2xl font-bold text-[#00A651]">Rs. {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <MedicineFooter />
    </div>
  );
};

export default Checkout;
