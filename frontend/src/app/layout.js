import './globals.css';
import Navbar from '@/components/Navbar';
import { VerificationProvider } from '@/context/VerificationContext';

export const metadata = {
  title: 'TruthLens | Cross-Lingual Multimodal Fact Verification (Graph RAG)',
  description: 'Production-grade Cross-Lingual Multimodal Fake News and Claim Verification System using Agentic Graph RAG, BGE-M3, and XLM-RoBERTa.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <VerificationProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-6 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>TruthLens AI • Autonomous Agentic Graph RAG Framework</span>
              <div className="flex items-center gap-4">
                <span>FastAPI AI Backend</span>
                <span>•</span>
                <span>Neo4j Knowledge Graph</span>
                <span>•</span>
                <span>Next.js 14 App Router</span>
              </div>
            </div>
          </footer>
        </VerificationProvider>
      </body>
    </html>
  );
}
