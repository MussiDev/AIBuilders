import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Finanzas + Gastos Compartidos',
  description: 'Finanzas personales y gastos compartidos en una sola app.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
