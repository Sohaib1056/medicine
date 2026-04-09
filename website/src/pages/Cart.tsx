import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

const CartPage = () => {
  const { items, updateQuantity, removeItem, total } = useCart();
  const deliveryFee = total > 25 ? 0 : 4.99;
  const finalTotal = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h2 className="text-2xl font-bold text-foreground mt-4">Your cart is empty</h2>
            <p className="text-muted-foreground mt-2">Add some products to get started</p>
            <Link to="/products"><Button variant="hero" size="lg" className="mt-6">Browse Products</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Shopping Cart ({items.length})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-card rounded-2xl shadow-soft border border-border/50">
                <Link to={`/product/${item.id}`} className="shrink-0">
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-semibold text-foreground text-sm hover:text-primary transition-colors">{item.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.brand}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-secondary rounded-xl p-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-6 h-fit sticky top-24">
            <h3 className="font-bold text-foreground text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-primary font-medium">FREE</span> : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-primary">Free delivery on orders over $25</p>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground text-base">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button variant="hero" size="lg" className="w-full mt-6">Proceed to Checkout</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
