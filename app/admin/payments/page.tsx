import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Pagos</h1>
          <p>Preferencias y eventos recibidos desde Mercado Pago y Stripe.</p>
        </div>
      </div>
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Importe</th>
              <th>Estado</th>
              <th>Proveedor</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.user.email}</td>
                <td>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(payment.createdAt)}</td>
                <td>${(payment.amountCents / 100).toFixed(2)} {payment.currency}</td>
                <td>{payment.status}</td>
                <td>{payment.provider}</td>
                <td>{payment.providerPaymentId ?? payment.providerPreferenceId ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
