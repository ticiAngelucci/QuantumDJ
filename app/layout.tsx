import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantumDJ — Qubits into grooves",
  description: "Un estudio de cuatro qubits con IonQ y sonidos para producir loops musicales.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
