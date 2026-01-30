import React from "react";

const CartContext = React.createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = React.useState([]);

  function add(service) {
    setItems((prev) => {
      const found = prev.find((x) => x.serviceId === service.id);
      if (found) {
        return prev.map((x) =>
          x.serviceId === service.id ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [
        ...prev,
        {
          serviceId: service.id,
          name: service.name,
          duration_min: service.duration_min,
          price: service.price,
          qty: 1,
        },
      ];
    });
  }

  function removeOne(serviceId) {
    setItems((prev) =>
      prev
        .map((x) =>
          x.serviceId === serviceId ? { ...x, qty: x.qty - 1 } : x
        )
        .filter((x) => x.qty > 0)
    );
  }

  function removeAll(serviceId) {
    setItems((prev) => prev.filter((x) => x.serviceId !== serviceId));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const totalDurationMin = items.reduce((sum, it) => sum + it.duration_min * it.qty, 0);
  const count = items.reduce((sum, it) => sum + it.qty, 0);

  const value = {
    items,
    add,
    removeOne,
    removeAll,
    clear,
    subtotal,
    totalDurationMin,
    count,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
