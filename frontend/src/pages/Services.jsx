import React from "react";
import { apiGet } from "../api.js";
import { useCart } from "../store/CartContext.jsx";

export default function Services({ onNext }) {
  const { add, count } = useCart();
  const [services, setServices] = React.useState([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    apiGet("/services")
      .then((data) => { if (alive) setServices(data.services || []); })
      .catch((e) => { if (alive) setError(e.message || "Hiba"); });
    return () => { alive = false; };
  }, []);

  if (error) return <div className="card error">Nem sikerült betölteni a szolgáltatásokat. ({error})</div>;

  return (
    <div className="col-content">
      {services.map((s) => (
        <div className="service-card" key={s.id}>
          <div>
            <div className="service-title">{s.name}</div>
            <div className="service-meta">Időtartam: {s.duration_min} perc</div>
            <div className="service-price">{Number(s.price).toLocaleString("hu-HU")} Ft</div>
          </div>
          <button className="btn-add" onClick={() => add(s)}>Kosárba +</button>
        </div>
      ))}

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" disabled={count === 0} onClick={onNext}>
          Tovább az időponthoz →
        </button>
      </div>
    </div>
  );
}
