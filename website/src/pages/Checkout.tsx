import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";

const steps = ["Information", "Prescription", "Payment", "Review"];

const CheckoutPage = () => {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", address: "", payment: "cod" });
  const deliveryFee = total > 25 ? 0 : 4.99;

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const next = () => setStep(Math.min(step + 1, steps.length - 1));
  const prev = () => setStep(Math.max(step - 1, 0));

  const placeOrder = () => {
    clear();
    toast.success("Order placed successfully! 🎉");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>

        {/* Stepper */}
        <div className="flex items-center mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                i <= step ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ml-2 hidden sm:block ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-6 animate-fade-in">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground text-lg">Your Information</h2>
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
              <textarea
                placeholder="Delivery Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground text-lg">Upload Prescription</h2>
              <p className="text-sm text-muted-foreground">If any items require a prescription, upload it here (optional).</p>
              <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-3">Click or drag to upload</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF up to 5MB</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground text-lg">Payment Method</h2>
              {[
                { id: "cod", label: "💵 Cash on Delivery" },
                { id: "card", label: "💳 Card Payment" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setForm({ ...form, payment: m.id })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    form.payment === m.id ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground">{m.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground text-lg">Review Order</h2>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground"><strong className="text-foreground">Name:</strong> {form.name || "–"}</p>
                <p className="text-muted-foreground"><strong className="text-foreground">Phone:</strong> {form.phone || "–"}</p>
                <p className="text-muted-foreground"><strong className="text-foreground">Address:</strong> {form.address || "–"}</p>
                <p className="text-muted-foreground"><strong className="text-foreground">Payment:</strong> {form.payment === "cod" ? "Cash on Delivery" : "Card"}</p>
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">{item.name} × {item.quantity}</span>
                    <span className="text-foreground font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span>${(total + deliveryFee).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" size="lg" onClick={prev} className="flex-1">Back</Button>
            )}
            {step < steps.length - 1 ? (
              <Button variant="hero" size="lg" onClick={next} className="flex-1">Continue</Button>
            ) : (
              <Button variant="hero" size="lg" onClick={placeOrder} className="flex-1">Place Order</Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
