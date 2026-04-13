import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, Tag } from 'lucide-react';

interface CartItem {
  id: number | string;
  name: string;
  category: string;
  brand: string;
  price: number;
  oldPrice: number;
  quantity: number;
  inStock: boolean;
  lowStock?: boolean;
  rxRequired: boolean;
  image: string;
  form?: string;
  packSize?: string;
  stockAvailable?: number;
}

interface CartItemsProps {
  items: CartItem[];
  updateQuantity: (id: number | string, quantity: number) => void;
  removeItem: (id: number | string) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  setPromoApplied: (applied: boolean) => void;
  discount: number;
  onApplyCoupon?: () => void;
  onRemoveCoupon?: () => void;
}

const CartItems: React.FC<CartItemsProps> = ({
  items,
  updateQuantity,
  removeItem,
  promoCode,
  setPromoCode,
  promoApplied,
  setPromoApplied,
  discount,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const handleApplyCoupon = () => {
    if (onApplyCoupon) {
      onApplyCoupon();
    } else {
      setPromoApplied(true);
    }
  };

  const handleRemoveCoupon = () => {
    if (onRemoveCoupon) {
      onRemoveCoupon();
    } else {
      setPromoApplied(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Heading */}
      <h1 className="text-2xl font-bold text-[#1A1A1A]">
        My Cart ({items.length} {items.length === 1 ? 'Item' : 'Items'})
      </h1>

      {/* Cart Items */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] divide-y divide-[#E0E0E0]">
        {items.map((item) => (
          <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">💊</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#00A651] font-semibold uppercase mb-1">
                  {item.category}
                </p>
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-[#666666] mb-2">{item.brand}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  {item.inStock && (
                    <span className={`text-xs font-medium ${item.lowStock ? 'text-[#FF6F00]' : 'text-[#00A651]'}`}>
                      {item.lowStock ? `⚠ Only ${item.stockAvailable} left` : '✓ In Stock'}
                    </span>
                  )}
                  {!item.inStock && (
                    <span className="text-xs text-[#E53935] font-medium">
                      ✗ Out of Stock
                    </span>
                  )}
                  {item.rxRequired && (
                    <span className="text-[10px] bg-[#FF6F00] text-white px-2 py-0.5 rounded-full font-medium">
                      Rx Required
                    </span>
                  )}
                </div>

                {/* Quantity & Price - Mobile */}
                <div className="flex items-center justify-between lg:hidden">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center border-2 border-[#00A651] text-[#00A651] rounded-md hover:bg-[#00A651] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#00A651]"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold text-[#1A1A1A]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={!item.inStock || (item.stockAvailable !== undefined && item.quantity >= item.stockAvailable)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-[#00A651] text-[#00A651] rounded-md hover:bg-[#00A651] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#00A651]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-base font-bold text-[#00A651]">
                      Rs. {(item.price * item.quantity).toFixed(2)}
                    </p>
                    {item.oldPrice > item.price && (
                      <p className="text-xs text-[#666666] line-through">
                        Rs. {(item.oldPrice * item.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity & Price - Desktop */}
              <div className="hidden lg:flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center border-2 border-[#00A651] text-[#00A651] rounded-md hover:bg-[#00A651] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#00A651]"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-semibold text-[#1A1A1A]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={!item.inStock || (item.stockAvailable !== undefined && item.quantity >= item.stockAvailable)}
                    className="w-8 h-8 flex items-center justify-center border-2 border-[#00A651] text-[#00A651] rounded-md hover:bg-[#00A651] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#00A651]"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-[#00A651]">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>
                  {item.oldPrice > item.price && (
                    <p className="text-xs text-[#666666] line-through">
                      Rs. {(item.oldPrice * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#E53935] transition-colors"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </div>

            {/* Remove Button - Mobile */}
            <div className="lg:hidden mt-3 pt-3 border-t border-[#E0E0E0]">
              <button
                onClick={() => removeItem(item.id)}
                className="flex items-center gap-1 text-xs text-[#666666] hover:text-[#E53935] transition-colors"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Shopping */}
      <Link
        to="/medicines"
        className="inline-flex items-center gap-2 text-[#00A651] hover:text-[#008f47] font-medium transition-colors"
      >
        <ArrowLeft size={18} />
        Continue Shopping
      </Link>

      {/* Promo Code */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-4">
        <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
          <Tag size={18} className="text-[#00A651]" />
          Apply Coupon Code
        </h3>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 px-4 py-2.5 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20"
          />
          <button
            onClick={handleApplyCoupon}
            className="px-6 py-2.5 bg-[#00A651] text-white rounded-lg hover:bg-[#008f47] transition-colors font-medium"
          >
            Apply
          </button>
        </div>

        {promoApplied && (
          <div className="bg-[#E8F5E9] border border-[#00A651] rounded-lg px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm text-[#00A651] font-medium">
              ✓ {promoCode} Applied — You save Rs. {discount}!
            </span>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs text-[#666666] hover:text-[#E53935] transition-colors"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItems;
