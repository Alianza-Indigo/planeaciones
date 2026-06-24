"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

export function PaymentButton() {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    const response = await fetch("/api/payments/create", { method: "POST" });
    const payload = await response.json();
    setLoading(false);

    if (payload.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
    }
  }

  return (
    <button className="button primary" type="button" onClick={checkout} disabled={loading}>
      {loading ? <Loader2 size={17} /> : <CreditCard size={17} />}
      Ir a pago
    </button>
  );
}
