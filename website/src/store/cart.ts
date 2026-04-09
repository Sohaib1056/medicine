import { Product } from "@/data/products";

export interface CartItem extends Product {
  quantity: number;
}

type CartState = {
  items: CartItem[];
};

let state: CartState = { items: [] };
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getSnapshot() {
    return state;
  },
  addItem(product: Product) {
    const existing = state.items.find((i) => i.id === product.id);
    if (existing) {
      state = {
        items: state.items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    } else {
      state = { items: [...state.items, { ...product, quantity: 1 }] };
    }
    notify();
  },
  removeItem(id: string) {
    state = { items: state.items.filter((i) => i.id !== id) };
    notify();
  },
  updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      cartStore.removeItem(id);
      return;
    }
    state = {
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    };
    notify();
  },
  clear() {
    state = { items: [] };
    notify();
  },
  getTotal() {
    return state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
  getCount() {
    return state.items.reduce((sum, i) => sum + i.quantity, 0);
  },
};
