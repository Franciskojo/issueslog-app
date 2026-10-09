import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'IssuesLog — Tech Support Portal',
  description: 'Streamlined issue tracking between tech and non-tech teams. Log, track, and resolve issues efficiently.',
  keywords: ['issue tracker', 'tech support', 'bug report', 'helpdesk'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
