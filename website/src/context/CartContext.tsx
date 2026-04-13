import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, cartAPI } from '../services/api';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  total: number;
  deliveryCharges: number;
  couponCode?: string;
  couponDiscount: number;
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load cart from backend on mount
  useEffect(() => {
    refreshCart();
  }, []);

  // Refresh cart from backend
  const refreshCart = async () => {
    try {
      const response = await cartAPI.getCart();
      const { cart, warnings } = response;
      
      setCartItems(cart.items);
      setCartCount(cart.itemCount);
      setSubtotal(cart.subtotal);
      setTotal(cart.total);
      setDeliveryCharges(cart.deliveryCharges);
      setCouponCode(cart.couponCode);
      setCouponDiscount(cart.couponDiscount);

      // Show warnings if any
      if (warnings.removedItems.length > 0) {
        console.warn('Items removed from cart:', warnings.removedItems);
      }
      if (warnings.priceChanges.length > 0) {
        console.warn('Price changes detected:', warnings.priceChanges);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Add item to cart
  const addToCart = async (product: Product, quantity: number = 1) => {
    setLoading(true);
    try {
      const response = await cartAPI.addToCart(product.id, quantity);
      setCartCount(response.itemCount);
      await refreshCart();
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.error || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    setLoading(true);
    try {
      const response = await cartAPI.removeFromCart(productId);
      setCartCount(response.itemCount);
      await refreshCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    setLoading(true);
    try {
      await cartAPI.updateCartItem(productId, quantity);
      await refreshCart();
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      alert(error.response?.data?.error || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  // Apply coupon
  const applyCoupon = async (code: string) => {
    setLoading(true);
    try {
      const response = await cartAPI.applyCoupon(code);
      setCouponCode(code);
      setCouponDiscount(response.discount);
      await refreshCart();
      alert(`Coupon ${code} applied! You save Rs. ${response.savings}`);
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      alert(error.response?.data?.error || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  // Remove coupon
  const removeCoupon = async () => {
    setLoading(true);
    try {
      await cartAPI.removeCoupon();
      setCouponCode(undefined);
      setCouponDiscount(0);
      await refreshCart();
    } catch (error) {
      console.error('Error removing coupon:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear cart (for order completion)
  const clearCart = async () => {
    try {
      // Clear cart items one by one
      for (const item of cartItems) {
        await cartAPI.removeFromCart(item.productId);
      }
      
      // Reset local state
      setCartItems([]);
      setCartCount(0);
      setSubtotal(0);
      setTotal(0);
      setDeliveryCharges(0);
      setCouponCode(undefined);
      setCouponDiscount(0);
      
      // Refresh to ensure sync
      await refreshCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const value: CartContextType = {
    cartItems,
    cartCount,
    subtotal,
    total,
    deliveryCharges,
    couponCode,
    couponDiscount,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    refreshCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
