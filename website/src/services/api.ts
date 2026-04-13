// API Service for MediCare Website Backend
import axios from 'axios';

// Base URL for the website backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/website';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add session ID to all requests
api.interceptors.request.use((config) => {
  let sessionId = localStorage.getItem('sessionId');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  
  config.headers['x-session-id'] = sessionId;
  
  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

// Types
export interface Product {
  id: string;
  name: string;
  genericName?: string;
  brand?: string;
  manufacturer?: string;
  category?: string;
  price: number;
  originalPrice: number;
  discount: number;
  image?: string;
  description?: string;
  inStock: boolean;
  stock: number;
  requiresPrescription: boolean;
  form?: string;
  packSize?: string;
  rating?: number;
  reviews?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  brand?: string;
  manufacturer?: string;
  category?: string;
  image?: string;
  form?: string;
  packSize?: string;
  requiresPrescription: boolean;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  quantity: number;
  stockAvailable: number;
  unitsPerPack: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number;
  subtotal: number;
  deliveryCharges: number;
  total: number;
  itemCount: number;
}

// Products API
export const productsAPI = {
  getProducts: async (params?: { 
    search?: string; 
    category?: string; 
    page?: number; 
    limit?: number;
  }): Promise<{ success: boolean; products: Product[]; pagination: any }> => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  getProductById: async (id: string): Promise<{ success: boolean; product: Product }> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  getCategories: async (): Promise<Array<{ name: string; count: number }>> => {
    try {
      const response = await api.get('/products/categories');
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
  
  getBrands: async (): Promise<string[]> => {
    try {
      const response = await api.get('/products/brands');
      return response.data.brands || [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  },
};

// Cart API
export const cartAPI = {
  getCart: async (): Promise<{ cart: Cart; warnings: any }> => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  addToCart: async (productId: string, quantity: number = 1): Promise<{ 
    success: boolean; 
    message: string; 
    itemCount: number;
    cart: any;
  }> => {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },
  
  updateCartItem: async (productId: string, quantity: number): Promise<{ 
    success: boolean; 
    message: string;
    cart: any;
  }> => {
    const response = await api.put('/cart/update', { productId, quantity });
    return response.data;
  },
  
  removeFromCart: async (productId: string): Promise<{ 
    success: boolean; 
    message: string;
    itemCount: number;
    cart: any;
  }> => {
    const response = await api.delete(`/cart/remove/${productId}`);
    return response.data;
  },
  
  applyCoupon: async (couponCode: string): Promise<{ 
    success: boolean; 
    message: string;
    discount: number;
    savings: number;
    cart: any;
  }> => {
    const response = await api.post('/cart/apply-coupon', { couponCode });
    return response.data;
  },
  
  removeCoupon: async (): Promise<{ 
    success: boolean; 
    message: string;
    cart: any;
  }> => {
    const response = await api.delete('/cart/remove-coupon');
    return response.data;
  },
};

export default api;
