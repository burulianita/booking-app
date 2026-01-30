import React from "react";
import { useCart } from "../store/CartContext.jsx";

export default function Cart() {
  const { items, subtotal, removeOne, add, removeAll, clear } = useCart();

  if (items.length === 0) {
    return <div className="card">A kosár üres.</div>;
  }

  return (
    <div className="col-content">
      {items.map((it) => (
        <div className="service-card" key={it.serviceId}>
          <div>
            <div className="service-title">{it.name}</div>
            <div className="service-meta">
              {it.duration_min} perc • {it.price.toLocaleString("hu-HU")} Ft • db: <b>{it.qty}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn-add" onClick={() => removeOne(it.serviceId)}>-</button>
            <button className="btn-add" onClick={() => add({ id: it.serviceId, name: it.name, duration_min: it.duration_min, price: it.price })}>+</button>
            <button className="btn-add" onClick={() => removeAll(it.serviceId)}>Törlés</button>
          </div>
        </div>
      ))}

      <div className="card summary">
        <div className="summary-row"><span>Összesen</span><b>{subtotal.toLocaleString("hu-HU")} Ft</b></div>
        <button className="btn btn-ghost" onClick={clear}>Kosár ürítése</button>
      </div>
    </div>
  );
}
