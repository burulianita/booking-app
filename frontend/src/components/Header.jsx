import React from "react";
import logo from "../assets/nail_logo.jpg";
import { useCart } from "../store/CartContext.jsx";

export default function Header() {
  const { count } = useCart();

  return (
    <header className="app-header">
      <div className="brand">
        <img className="app-logo" src={logo} alt="Nail Studio" />
        <div className="brand-text">
          <div className="app-title">Nail Studio</div>
          <div className="app-subtitle">Időpontfoglalás</div>
        </div>
      </div>

      <div className="cart-pill">Kosár: <b>{count}</b></div>
    </header>
  );
}
