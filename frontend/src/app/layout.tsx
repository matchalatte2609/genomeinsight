import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GenomeInsight - Population Genomics Analysis Platform',
  description: 'Advanced bioinformatics platform for population genomics analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="flex flex-col min-h-screen">
          {/* Navigation Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    GenomeInsight
                  </h1>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="/" className="text-gray-500 hover:text-gray-900">
                    Dashboard
                  </a>
                  <a href="/upload" className="text-gray-500 hover:text-gray-900">
                    Upload Files
                  </a>
                  <a href="/analysis" className="text-gray-500 hover:text-gray-900">
                    Analysis
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-sm text-gray-500">
                © 2025 GenomeInsight. Advanced bioinformatics platform.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}