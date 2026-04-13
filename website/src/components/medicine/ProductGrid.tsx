import { useState, useEffect } from 'react';
import { Star, ShoppingCart, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, X } from 'lucide-react';
import { productsAPI, Product } from '../../services/api';
import { useCart } from '../../context/CartContext';

interface ProductGridProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  filters: any;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ProductGrid: React.FC<ProductGridProps> = ({ sortBy, setSortBy, filters }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const itemsPerPage = 12;

  const { addToCart } = useCart();

  // Toast notification system
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fetch products from backend
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await productsAPI.getProducts({ 
          search: filters.search || '', 
          limit: 500,
          page: 1 
        });
        setProducts(response.products);
      } catch (err) {
        setError('Failed to load products. Please make sure the backend server is running.');
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters.search]);

  // Filter products based on filters
  const filteredProducts = products.filter(product => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.genericName?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.manufacturer?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Categories filter
    if (filters.categories.length > 0) {
      const productCategory = product.category?.toLowerCase() || '';
      const matchesCategory = filters.categories.some((cat: string) => 
        productCategory.includes(cat.toLowerCase()) || cat.toLowerCase().includes(productCategory)
      );
      if (!matchesCategory) return false;
    }

    // Brands filter
    if (filters.brands.length > 0) {
      const productBrand = (product.manufacturer || product.brand || '').toLowerCase();
      const matchesBrand = filters.brands.some((brand: string) => 
        productBrand.includes(brand.toLowerCase())
      );
      if (!matchesBrand) return false;
    }

    // Price range filter
    if (filters.priceRange) {
      const price = product.price;
      const [min, max] = filters.priceRange;
      if (price < min || price > max) return false;
    }

    // Discount filter
    if (filters.discounts.length > 0) {
      const productDiscount = product.discount || 0;
      const matchesDiscount = filters.discounts.some((discount: string) => {
        const discountValue = parseInt(discount.replace('%+', ''));
        return productDiscount >= discountValue;
      });
      if (!matchesDiscount) return false;
    }

    // In stock filter
    if (filters.inStock && !product.inStock) return false;

    // Requires prescription filter
    if (filters.requiresPrescription && !product.requiresPrescription) return false;

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A651] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="text-[#E53935] mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Unable to Load Products</h3>
          <p className="text-[#666666] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#00A651] text-white px-6 py-2 rounded-lg hover:bg-[#008f47] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[#666666]">
            Showing <span className="font-semibold text-[#1A1A1A]">{startIndex + 1}-{Math.min(endIndex, sortedProducts.length)}</span> of{' '}
            <span className="font-semibold text-[#1A1A1A]">{sortedProducts.length}</span> results
          </p>
          {filters.search && (
            <p className="text-sm text-[#00A651] mt-1">
              Search results for: "{filters.search}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#666666]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00A651]"
          >
            <option value="popular">Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {currentProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#666666] text-lg">No products found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentProducts.map((product) => {
            const isOutOfStock = !product.inStock;
            const isLowStock = product.inStock && product.stock <= 10;

            return (
              <div
                key={product.id}
                className="bg-white border rounded-[10px] overflow-hidden hover:shadow-lg hover:shadow-[#00A651]/10 transition group"
              >
                {/* Image Area */}
                <div className="relative bg-gray-50 p-3 h-36 flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).src = `https://placehold.co/200x200/e3f2fd/1976d2?text=${encodeURIComponent(product.name.substring(0, 10))}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                      <span className="text-3xl">💊</span>
                    </div>
                  )}
                  
                  {/* Stock Status Badge */}
                  {isOutOfStock && (
                    <span className="absolute top-2 left-2 bg-[#E53935] text-white text-xs font-bold px-2 py-0.5 rounded">
                      OUT OF STOCK
                    </span>
                  )}
                  {isLowStock && (
                    <span className="absolute top-2 left-2 bg-[#FF6F00] text-white text-xs font-bold px-2 py-0.5 rounded">
                      LOW STOCK
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* Category */}
                  {product.category && (
                    <p className="text-[#00A651] text-[10px] font-semibold uppercase mb-1">
                      {product.category}
                    </p>
                  )}

                  {/* Product Name */}
                  <h3 className="font-bold text-sm text-[#1A1A1A] mb-1 line-clamp-2 min-h-[2rem]">
                    {product.name}
                  </h3>

                  {/* Brand/Manufacturer */}
                  {(product.brand || product.manufacturer) && (
                    <p className="text-xs text-[#666666] mb-1">
                      {product.brand || product.manufacturer}
                    </p>
                  )}

                  {/* Stock Info */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className={`text-xs font-medium ${isOutOfStock ? 'text-[#E53935]' : isLowStock ? 'text-[#FF6F00]' : 'text-[#00A651]'}`}>
                      {isOutOfStock ? 'Out of Stock' : `${product.stock} units`}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold text-[#00A651]">
                      Rs. {product.price.toFixed(2)}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-xs text-gray-500 line-through">
                        Rs. {product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Pack Info */}
                  {product.packSize && (
                    <p className="text-xs text-[#666666] mb-2">
                      {product.packSize}
                    </p>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`w-full py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium text-sm ${
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            // Show first page, last page, current page, and pages around current
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPage === page
                      ? 'bg-[#00A651] text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-2">...</span>;
            }
            return null;
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

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

export default ProductGrid;
