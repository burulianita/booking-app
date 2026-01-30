import React from "react";
import { apiGet, apiPost } from "../api.js";
import { useCart } from "../store/CartContext.jsx";

export default function Booking({
  mode = "slots",
  onNext,
  onBack,
  onDone,
  date,
  setDate,
  selected,
  setSelected,
}) {
  const { items, subtotal, totalDurationMin, clear } = useCart();

  const [slots, setSlots] = React.useState([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [bookingState, setBookingState] = React.useState({
    loading: false,
    ok: null,
    error: "",
  });

  const cartEmpty = items.length === 0;

  async function loadSlots() {
    setBookingState({ loading: false, ok: null, error: "" });
    if (setSelected) setSelected("");
    setLoadingSlots(true);

    try {
      const data = await apiGet(
        `/slots?date=${encodeURIComponent(date)}&duration_min=${encodeURIComponent(
          totalDurationMin || 30
        )}`
      );
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirmBooking() {
    setBookingState({ loading: true, ok: null, error: "" });

    try {
      const payload = {
        name,
        email,
        date,
        start_time: selected,
        items: items.map((it) => ({ serviceId: it.serviceId, qty: it.qty })),
      };

      const res = await apiPost("/bookings", payload);

      // ✅ Előbb állapot → hogy legyen mit kirajzolni
      setBookingState({ loading: false, ok: res, error: "" });

      // ✅ csak utána ürítjük a kosarat
      clear();

      if (onDone) onDone();
    } catch (e) {
      setBookingState({
        loading: false,
        ok: null,
        error: e.message || "Sikertelen foglalás.",
      });
    }
  }

  /* ✅ SIKER ESETÉN MINDIG EZ LÁTSZÓDJON (MÉG AKKOR IS, HA clear() ÜRÍTETT) */
  if (bookingState.ok) {
    return (
      <div className="col-content">
        <div className="card ok">
          <div style={{ fontWeight: 900, marginBottom: 6 }}>
            Időpontodat lefoglaltuk, várunk szeretettel! 💚
          </div>
          <div>
            Azonosító: <b>{bookingState.ok.booking_id}</b>
          </div>
          <div>
            Dátum: <b>{date}</b>
          </div>
          <div>
            Időpont: <b>{selected}</b>
          </div>
          <div>
            Fizetendő:{" "}
            <b>{Number(bookingState.ok.payable).toLocaleString("hu-HU")} Ft</b>
          </div>
        </div>
      </div>
    );
  }

  /* ✅ csak ezután nézzük a kosarat */
  if (cartEmpty) {
    return <div className="card">A kosár üres.</div>;
  }

  /* -------- 2. lépés: slot választás -------- */
  if (mode === "slots") {
    return (
      <div className="col-content">
        <div className="input-wrapper">
          <label className="input-label">Dátum</label>
          <input
            className="custom-input"
            type="date"
            value={date}
            onChange={(e) => setDate && setDate(e.target.value)}
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadSlots}
          disabled={loadingSlots}
          style={{ marginTop: 12 }}
        >
          {loadingSlots ? "Betöltés..." : "Idősávok betöltése"}
        </button>

        <div className="section-title" style={{ marginTop: 14, fontWeight: 900 }}>
          Elérhető idősávok
        </div>

        {loadingSlots ? (
          <div className="muted">Betöltés...</div>
        ) : slots.length === 0 ? (
          <div className="muted">Nincs szabad hely erre a napra.</div>
        ) : (
          <div className="slots-grid">
            {slots.map((t) => (
              <button
                key={t}
                className={`slot-btn ${selected === t ? "selected" : ""}`}
                onClick={() => setSelected && setSelected(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onBack}>
            ← Vissza
          </button>
          <button className="btn btn-primary" disabled={!selected} onClick={onNext}>
            Tovább →
          </button>
        </div>
      </div>
    );
  }

  /* -------- 3. lépés: véglegesítés -------- */
  return (
    <div className="col-content">
      <div className="form-container" style={{ display: "grid", gap: 12 }}>
        <div className="input-wrapper">
          <label className="input-label">Teljes név</label>
          <input
            className="custom-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pl. Kiss János"
          />
        </div>

        <div className="input-wrapper">
          <label className="input-label">Email cím</label>
          <input
            className="custom-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pelda@email.hu"
          />
        </div>

        <div className="card summary">
          <div className="summary-row">
            <span>Csomag</span>
            <b>{items.length} tétel</b>
          </div>
          <div className="summary-row">
            <span>Dátum</span>
            <b>{date}</b>
          </div>
          <div className="summary-row">
            <span>Időpont</span>
            <b>{selected || "—"}</b>
          </div>
          <div className="total-amount">{subtotal.toLocaleString("hu-HU")} Ft</div>
        </div>

        <button
          className="btn btn-primary"
          disabled={bookingState.loading || !selected || !name || !email}
          onClick={confirmBooking}
        >
          {bookingState.loading ? "Foglalás..." : "Időpont lefoglalása"}
        </button>

        <button className="btn btn-ghost" onClick={onBack}>
          ← Vissza
        </button>

        {bookingState.error ? <div className="card error">{bookingState.error}</div> : null}
      </div>
    </div>
  );
}
