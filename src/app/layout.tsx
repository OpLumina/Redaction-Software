import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Redact',
  description: 'Local-first document redaction. Nothing leaves your machine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
