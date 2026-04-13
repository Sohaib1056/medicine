import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, CheckCircle, AlertCircle, X } from 'lucide-react';
import { productsAPI, Product } from '../../services/api';
import { useCart } from '../../context/CartContext';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const YouMayLike = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { addToCart } = useCart();

  // Toast notification system
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsAPI.getProducts({ 
          limit: 10,
          page: 1 
        });
        // Get random 5 products
        const shuffled = response.products.sort(() => 0.5 - Math.random());
        setProducts(shuffled.slice(0, 5));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    if (product.inStock) {
      try {
        await addToCart(product, 1);
        showToast(`${product.name} added to cart!`, 'success');
      } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Failed to add item to cart', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-t border-[#E0E0E0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">You May Also Like</h2>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A651] mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-t border-[#E0E0E0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">You May Also Like</h2>
          <a 
            href="/medicines" 
            className="text-[#00A651] hover:text-[#008f47] font-medium transition-colors"
          >
            View All →
          </a>
        </div>

        {/* Products Scroll */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {products.map((product) => {
              const isOutOfStock = !product.inStock;
              const isLowStock = product.inStock && product.stock <= 10;

              return (
                <div
                  key={product.id}
                  className="w-64 bg-white rounded-lg border border-[#E0E0E0] overflow-hidden hover:shadow-lg hover:border-[#00A651] transition-all"
                >
                  <div className="relative">
                    <div className="bg-gray-100 h-48 flex items-center justify-center p-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/200x200/e3f2fd/1976d2?text=${encodeURIComponent(product.name.substring(0, 10))}`;
                          }}
                        />
                      ) : (
                        <span className="text-5xl">💊</span>
                      )}
                    </div>
                    {product.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-[#E53935] text-white text-xs font-bold px-2 py-1 rounded">
                        {product.discount}% OFF
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-2 right-2 bg-[#E53935] text-white text-xs font-bold px-2 py-1 rounded">
                        OUT OF STOCK
                      </span>
                    )}
                    {isLowStock && (
                      <span className="absolute top-2 right-2 bg-[#FF6F00] text-white text-xs font-bold px-2 py-1 rounded">
                        LOW STOCK
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    {product.category && (
                      <p className="text-[10px] text-[#00A651] font-semibold mb-1 uppercase">
                        {product.category}
                      </p>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {(product.brand || product.manufacturer) && (
                      <p className="text-xs text-gray-500 mb-2">
                        {product.brand || product.manufacturer}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.rating || 4.5)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({product.reviews || 0})</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-[#00A651]">
                        Rs. {product.price.toFixed(2)}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          Rs. {product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className={`w-full py-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                        isOutOfStock
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#00A651] text-white hover:bg-[#008f47]'
                      }`}
                    >
                      <ShoppingCart size={16} />
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
              toast.type === 'success' 
                ? 'bg-[#00A651] text-white' 
                : 'bg-[#E53935] text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 hover:opacity-80 transition"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouMayLike;
