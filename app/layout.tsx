import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Serverless Email API',
  description: 'High-performance serverless email delivery microservice powered by Next.js, Supabase, Upstash QStash, and Nodemailer.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Serverless Email API',
    description: 'High-performance serverless email delivery microservice powered by Next.js, Supabase, Upstash QStash, and Nodemailer.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Serverless Email API',
    description: 'High-performance serverless email delivery microservice powered by Next.js, Supabase, Upstash QStash, and Nodemailer.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased font-sans">{children}</body>
    </html>
  );
}
