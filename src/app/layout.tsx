import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'Cloudflare DevSecOps Management Platform',
  description: 'Cloudflare REST API v4 DevSecOps Manager: DNS, Zones, WAF Firewall, SSL/TLS, Page Rules, Analytics & Security Posture Audit.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#090D16] text-[#F1F5F9] min-h-screen antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
