import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'AWS Serverless Email API Server & Console',
  description: 'High-performance serverless email delivery microservice powered by AWS Lambda, SQS, DynamoDB, and Amazon SES.',
  openGraph: {
    title: 'AWS Serverless Email API Server & Console',
    description: 'High-performance serverless email delivery microservice powered by AWS Lambda, SQS, DynamoDB, and Amazon SES.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AWS Serverless Email API Server & Console',
    description: 'High-performance serverless email delivery microservice powered by AWS Lambda, SQS, DynamoDB, and Amazon SES.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased font-sans">{children}</body>
    </html>
  );
}
