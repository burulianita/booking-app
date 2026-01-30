import React from "react";
import Header from "./components/Header.jsx";
import Services from "./pages/Services.jsx";
import Booking from "./pages/Booking.jsx";

export default function App() {
  const [step, setStep] = React.useState(1);

  const [selectedSlot, setSelectedSlot] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  return (
    <div className="app-shell">
      <Header />

      <div className="wizard-card">
        <section className={`wiz-col ${step === 1 ? "active-step" : ""}`}>
          <div>
            <div className="step-kicker">1</div>
            <div className="step-title">Milyen körmöt szeretnél?</div>
            <div className="step-sub">Válassz egy szolgáltatást</div>
          </div>

          {step === 1 ? (
            <Services onNext={() => { setSelectedSlot(""); setStep(2); }} />
          ) : (
            <div className="inactive-hint">Előbb válassz csomagot.</div>
          )}
        </section>

        <section className={`wiz-col ${step === 2 ? "active-step" : ""}`}>
          <div>
            <div className="step-kicker">2</div>
            <div className="step-title">Mikor jönnél?</div>
            <div className="step-sub">Dátum és idősáv</div>
          </div>

          {step === 2 ? (
            <Booking
              mode="slots"
              date={selectedDate}
              setDate={setSelectedDate}
              selected={selectedSlot}
              setSelected={setSelectedSlot}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          ) : (
            <div className="inactive-hint">Előbb válassz csomagot.</div>
          )}
        </section>

        <section className={`wiz-col ${step === 3 ? "active-step" : ""}`}>
          <div>
            <div className="step-kicker">3</div>
            <div className="step-title">Véglegesítés</div>
            <div className="step-sub">Kosár és összegzés</div>
          </div>

          {step === 3 ? (
            <Booking
              mode="checkout"
              date={selectedDate}
              selected={selectedSlot}
              onBack={() => setStep(2)}
              onDone={() => {}}
            />
          ) : (
            <div className="inactive-hint">Előbb válassz idősávot.</div>
          )}
        </section>
      </div>
    </div>
  );
}
