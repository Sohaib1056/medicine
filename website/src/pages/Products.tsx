import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

const priceRanges = [
  { label: "Under $5", min: 0, max: 5 },
  { label: "$5 - $15", min: 5, max: 15 },
  { label: "$15 - $30", min: 15, max: 30 },
  { label: "$30+", min: 30, max: Infinity },
];

interface Product {
  id: string;
  name: string;
  composition: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  inStock: boolean;
  prescriptionRequired: boolean;
  description: string;
  usage: string;
  sideEffects: string;
  rating: number;
  reviews: number;
}

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get("search") || "";

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:4000/api/pharmacy/inventory?limit=1000');
        const data = await response.json();
        
        // Map inventory items to Product format
        const items = (data.items || []).map((item: any) => {
          // Convert relative image path to full URL
          let imageUrl = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop';
          if (item.image) {
            // If image starts with http, use as is, otherwise prepend backend URL
            imageUrl = item.image.startsWith('http') 
              ? item.image 
              : `http://localhost:4000${item.image}`;
          }
          
          // Use the sale price from inventory (lastSalePerUnit is the price set in Add Invoice)
          const salePrice = item.lastSalePerUnit || 0;
          
          // Debug: Log the actual prices
          console.log(`Item: ${item.name}, lastSalePerUnit: ${item.lastSalePerUnit}, salePrice: ${salePrice}`);
          
          return {
            id: item._id || item.key,
            name: item.name || item.key,
            composition: item.genericName || 'N/A',
            price: salePrice,
            originalPrice: undefined,
            image: imageUrl,
            category: item.category?.toLowerCase() || 'tablets',
            brand: item.manufacturer || 'Generic',
            inStock: (item.onHand || 0) > 0,
            prescriptionRequired: item.narcotic || false,
            description: item.description || `${item.name}${item.genericName ? ' (' + item.genericName + ')' : ''}${item.manufacturer ? ' - ' + item.manufacturer : ''}`,
            usage: 'Consult your physician for proper usage',
            sideEffects: 'Consult your physician for side effects',
            rating: 4.5,
            reviews: 0,
          };
        });
        
        setProducts(items);
        
        // Extract unique categories from inventory items
        const uniqueCategories = [...new Set(items.map((item: any) => item.category).filter(Boolean))];
        
        // If no categories found, use some default ones
        const defaultCategories = ['tablets', 'syrups', 'vitamins', 'personal care'];
        const categoriesToUse = uniqueCategories.length > 0 ? uniqueCategories : defaultCategories;
        
        const dynamicCategories = categoriesToUse.map((cat: string) => {
          // Map category names to appropriate icons
          const categoryIcons: { [key: string]: string } = {
            'tablets': '💊',
            'syrups': '🧴', 
            'vitamins': '🌿',
            'personal care': '🧼',
            'medical devices': '🩺',
            'first aid': '🩹',
            'antibiotic': '💊',
            'painkiller': '💊',
            'supplement': '🌿',
            'cream': '🧴',
            'injection': '💉',
            'capsule': '💊',
            'drops': '💧',
            'spray': '🌬️',
            'gel': '🧴',
            'powder': '🥄',
            'ointment': '🧴',
          };
          
          const icon = categoryIcons[cat.toLowerCase()] || '💊';
          const name = cat.charAt(0).toUpperCase() + cat.slice(1);
          
          return {
            name,
            icon,
            slug: cat.toLowerCase()
          };
        });
        
        setCategories(dynamicCategories);
        console.log('Generated categories:', dynamicCategories);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (inStockOnly && !p.inStock) return false;
      if (selectedPrice !== null) {
        const range = priceRanges[selectedPrice];
        if (p.price < range.min || p.price > range.max) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.composition.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, selectedPrice, inStockOnly, searchQuery]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedPrice(null);
    setInStockOnly(false);
  };

  const hasFilters = selectedCategory || selectedBrand || selectedPrice !== null || inStockOnly;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Loading products...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} products found</p>
          </div>
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-60 shrink-0 space-y-6`}>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
                <X className="h-3 w-3 mr-1" /> Clear Filters
              </Button>
            )}

            {/* Category */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3">Category</h3>
              <div className="space-y-1.5">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-2">Loading categories...</p>
                ) : (
                  categories.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => setSelectedCategory(selectedCategory === c.slug ? "" : c.slug)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                        selectedCategory === c.slug
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {c.icon} {c.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3">Price Range</h3>
              <div className="space-y-1.5">
                {priceRanges.map((r, i) => (
                  <button
                    key={r.label}
                    onClick={() => setSelectedPrice(selectedPrice === i ? null : i)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                      selectedPrice === i
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3">Brand</h3>
              <div className="space-y-1.5">
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(selectedBrand === b ? "" : b)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                      selectedBrand === b
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded accent-primary"
              />
              <span className="text-sm text-foreground">In Stock Only</span>
            </label>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">No products found</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
