import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cristal Comercializa · Nuevo San Vicente",
  description: "Sistema de gestión de lotes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans">{children}</body>
    </html>
  );
}
