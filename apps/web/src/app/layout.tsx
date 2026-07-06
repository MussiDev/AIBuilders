import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
