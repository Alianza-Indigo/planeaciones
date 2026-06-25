import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  // Los administradores aterrizan en su panel; el resto en el generador.
  if (session?.user?.role === "ADMIN") redirect("/admin");
  redirect("/planner");
}
