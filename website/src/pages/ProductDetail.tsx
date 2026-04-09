import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { ShoppingCart, Minus, Plus, ArrowLeft, FileText, CheckCircle, XCircle, Star, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const tabs = ["Description", "Usage Instructions", "Side Effects", "Reviews"] as const;

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Description");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        // Fetch all inventory items and find the one with matching ID
        const response = await fetch('http://localhost:4000/api/pharmacy/inventory?limit=1000');
        const data = await response.json();
        
        // Find the product by ID (either _id or key)
        const inventoryItem = (data.items || []).find((item: any) => 
          item._id === id || item.key === id
        );
        
        if (!inventoryItem) {
          setError(true);
          setLoading(false);
          return;
        }

        // Map inventory item to Product format (same as Products page)
        let imageUrl = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop';
        if (inventoryItem.image) {
          imageUrl = inventoryItem.image.startsWith('http') 
            ? inventoryItem.image 
            : `http://localhost:4000${inventoryItem.image}`;
        }
        
        const salePrice = inventoryItem.lastSalePerUnit || 0;
        
        const mappedProduct = {
          id: inventoryItem._id || inventoryItem.key,
          name: inventoryItem.name || inventoryItem.key,
          composition: inventoryItem.genericName || 'N/A',
          price: salePrice,
          originalPrice: undefined,
          image: imageUrl,
          category: inventoryItem.category?.toLowerCase() || 'tablets',
          brand: inventoryItem.manufacturer || 'Generic',
          inStock: (inventoryItem.onHand || 0) > 0,
          prescriptionRequired: inventoryItem.narcotic || false,
          description: inventoryItem.description || `${inventoryItem.name}${inventoryItem.genericName ? ' (' + inventoryItem.genericName + ')' : ''}${inventoryItem.manufacturer ? ' - ' + inventoryItem.manufacturer : ''}`,
          usage: 'Consult your physician for proper usage and dosage instructions.',
          sideEffects: 'Consult your physician for potential side effects and contraindications.',
          rating: 4.5,
          reviews: 0,
        };
        
        setProduct(mappedProduct);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Product not found</p>
            <Link to="/products"><Button variant="outline" className="mt-4">Back to Products</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const tabContent = {
    "Description": product.description,
    "Usage Instructions": product.usage,
    "Side Effects": product.sideEffects,
    "Reviews": `⭐ ${product.rating}/5 based on ${product.reviews} reviews. Customer reviews coming soon.`,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-square">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            {discount > 0 && (
              <span className="absolute top-4 left-4 gradient-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-xl">
                -{discount}%
              </span>
            )}
            {product.prescriptionRequired && (
              <span className="absolute top-4 right-4 bg-foreground/80 text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Prescription Required
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">{product.brand}</p>
            <h1 className="text-3xl font-bold text-foreground mt-1">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">{product.composition}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "text-primary fill-primary" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-3xl font-bold text-foreground">Rs {product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">Rs {product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Stock */}
            <div className="mt-4 flex items-center gap-2">
              {product.inStock ? (
                <>
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary font-medium">In Stock</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Quantity:</span>
              <div className="flex items-center gap-2 bg-secondary rounded-xl p-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-foreground">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                disabled={!product.inStock}
                onClick={() => {
                  for (let i = 0; i < quantity; i++) addItem(product);
                  toast.success(`${quantity}x ${product.name} added to cart`);
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
              </Button>
              <Link to="/cart" className="flex-1">
                <Button
                  variant="hero-outline"
                  size="lg"
                  className="w-full"
                  disabled={!product.inStock}
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) addItem(product);
                  }}
                >
                  Buy Now
                </Button>
              </Link>
            </div>

            {/* Tabs */}
            <div className="mt-10 border-t border-border pt-6">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {tabContent[activeTab]}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
