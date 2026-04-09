import { useSyncExternalStore } from "react";
import { cartStore } from "@/store/cart";

export function useCart() {
  const state = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot);
  return {
    items: state.items,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    clear: cartStore.clear,
    total: cartStore.getTotal(),
    count: cartStore.getCount(),
  };
}
