import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monara Sentinel - Scam Intelligence & Investigation Platform',
  description: 'Defensive scam-intelligence and fraud-investigation platform with evidence-first analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
