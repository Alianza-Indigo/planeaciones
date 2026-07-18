"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

export function PaymentButton({
  plan = "monthly",
  label = "Suscribirme",
}: {
  plan?: "monthly" | "annual";
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json();
      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      setError(
        [payload.error ?? "No se pudo iniciar la suscripción.", payload.details]
          .filter(Boolean)
          .join(" — "),
      );
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="button primary" type="button" onClick={checkout} disabled={loading}>
        {loading ? <Loader2 size={17} /> : <CreditCard size={17} />}
        {label}
      </button>
      {error ? <p className="alert" style={{ marginTop: 8 }}>{error}</p> : null}
    </>
  );
}
