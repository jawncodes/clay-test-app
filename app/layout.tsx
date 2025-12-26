import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clay TODO App',
  description: 'Passwordless TODO application with user enrichment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

