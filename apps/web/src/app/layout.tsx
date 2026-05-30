import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TESTA — AI Test Orchestrator',
  description: 'AI-powered autonomous web testing platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-black min-h-screen text-white">

        {/* ── Accenture-style navigation bar ── */}
        <header className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-black">
          <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">

            {/* Brand mark */}
            <div className="flex items-center gap-3">
              <span className="text-[#a100ff] font-black text-xl tracking-tighter font-mono leading-none">
                {'>'}
              </span>
              <span className="font-bold text-base tracking-widest uppercase text-white">
                TESTA
              </span>
              <span className="text-[#737373] text-xs tracking-widest uppercase border-l border-[#1e1e1e] pl-3">
                AI Test Orchestrator
              </span>
            </div>

            {/* Nav actions */}
            <nav className="flex items-center gap-6">
              <a
                href="/projects"
                className="text-xs tracking-widest uppercase text-[#737373] hover:text-[#a100ff] transition-colors"
              >
                History
              </a>
              <a
                href="/projects/new"
                className="text-xs tracking-widest uppercase text-[#737373] hover:text-[#a100ff] transition-colors"
              >
                New Run
              </a>
              <a
                href="https://ai.azure.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-widest uppercase text-[#737373] hover:text-[#a100ff] transition-colors"
              >
                Azure AI
              </a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        {/* Accenture-style footer */}
        <footer className="border-t border-[#1e1e1e] mt-24 py-6">
          <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
            <span className="text-[#737373] text-xs tracking-widest uppercase">
              TESTA &mdash; Powered by Azure AI Foundry
            </span>
            <span className="text-[#a100ff] font-mono font-black text-sm">{'>'}</span>
          </div>
        </footer>

      </body>
    </html>
  );
}
