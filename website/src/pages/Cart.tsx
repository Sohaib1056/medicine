import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MedicineHeader from '../components/medicine/MedicineHeader';
import MedicineNavigation from '../components/medicine/MedicineNavigation';
import MedicineFooter from '../components/medicine/MedicineFooter';
import CartItems from '../components/cart/CartItems';
import OrderSummary from '../components/cart/OrderSummary';
import EmptyCart from '../components/cart/EmptyCart';
import YouMayLike from '../components/cart/YouMayLike';
import { ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const {
    cartItems,
    cartCount,
    subtotal,
    total,
    deliveryCharges,
    couponCode,
    couponDiscount,
    loading,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    if (couponCode) {
      setPromoCode(couponCode);
      setPromoApplied(true);
    }
  }, [couponCode]);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // If quantity is 0 or less, remove the item
      await handleRemoveItem(productId);
      return;
    }
    
    // Find the item to check stock
    const item = cartItems.find(i => i.productId === productId);
    if (item && newQuantity > item.stockAvailable) {
      alert(`Only ${item.stockAvailable} units available in stock`);
      return;
    }
    
    await updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId: string) => {
    await removeFromCart(productId);
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    try {
      await applyCoupon(promoCode.toUpperCase());
      setPromoApplied(true);
    } catch (error) {
      setPromoApplied(false);
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setPromoCode('');
    setPromoApplied(false);
  };

  // Transform cart items to match CartItems component format
  const transformedItems = cartItems.map((item) => ({
    id: item.productId,
    name: item.name,
    category: item.category || 'MEDICINE',
    brand: item.brand || item.manufacturer || '',
    price: item.finalPrice,
    oldPrice: item.originalPrice,
    quantity: item.quantity,
    inStock: item.stockAvailable > 0,
    lowStock: item.stockAvailable <= 10,
    rxRequired: item.requiresPrescription,
    image: item.image || '',
    form: item.form || '',
    packSize: item.packSize || '',
    stockAvailable: item.stockAvailable,
  }));

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <MedicineHeader />
      <MedicineNavigation />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E0E0E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Link to="/" className="hover:text-[#00A651] transition-colors">Home</Link>
            <ChevronRight size={16} />
            <span className="text-[#1A1A1A] font-medium">Cart</span>
          </div>
        </div>
      </div>

      {loading && cartCount === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A651] mx-auto mb-4"></div>
            <p className="text-[#666666]">Loading cart...</p>
          </div>
        </div>
      ) : cartCount === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Cart Items */}
              <div className="lg:col-span-2">
                <CartItems
                  items={transformedItems}
                  updateQuantity={(id, qty) => handleUpdateQuantity(id.toString(), qty)}
                  removeItem={(id) => handleRemoveItem(id.toString())}
                  promoCode={promoCode}
                  setPromoCode={setPromoCode}
                  promoApplied={promoApplied}
                  setPromoApplied={setPromoApplied}
                  discount={couponDiscount}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                />
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <OrderSummary
                  itemCount={cartCount}
                  subtotal={subtotal}
                  discount={couponDiscount}
                  deliveryCharges={deliveryCharges}
                  total={total}
                  promoApplied={promoApplied}
                  couponCode={couponCode}
                />
              </div>
            </div>
          </div>

          {/* You May Also Like */}
          <YouMayLike />
        </>
      )}

      <MedicineFooter />
    </div>
  );
};

export default Cart;
