import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, FileText } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-card rounded-2xl shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden border border-border/50 flex flex-col">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden aspect-square bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 gradient-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-lg">
            -{discount}%
          </span>
        )}
        {product.prescriptionRequired && (
          <span className="absolute top-3 right-3 bg-foreground/80 text-primary-foreground text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
            <FileText className="h-3 w-3" /> Rx
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground text-sm font-semibold px-4 py-2 rounded-xl">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-foreground text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.composition}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs font-medium text-foreground bg-accent px-1.5 py-0.5 rounded">
            ⭐ {product.rating}
          </span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Price + Actions */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-foreground">Rs {product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through ml-1.5">
                Rs {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            <Link to={`/product/${product.id}`}>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="icon"
              className="h-9 w-9"
              disabled={!product.inStock}
              onClick={() => {
                addItem(product);
                toast.success(`${product.name} added to cart`);
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
