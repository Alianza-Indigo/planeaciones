import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "ADIA — Generador de Planeaciones Didácticas",
  description:
    "Herramienta de IA para docentes mexicanos. Genera planeaciones inclusivas alineadas a la Nueva Escuela Mexicana con adaptaciones neuroinclusivas.",
  openGraph: {
    title: "ADIA — Planeaciones Didácticas con IA",
    description:
      "Genera planeaciones NEM en minutos con adaptaciones para TDAH, TEA, dislexia y más.",
    url: "https://adia.alianzaindigo.org",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${syne.variable}`}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
