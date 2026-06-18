import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import TestRunner from './pages/TestRunner'
import Reports from './pages/Reports'
import Agent from './pages/Agent'

type Page = 'dashboard' | 'runner' | 'reports' | 'agent'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [testResults, setTestResults] = useState<any>(null)
  const [pdfPath, setPdfPath] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-black text-white">
              QA
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">QA Tester</h1>
              <p className="text-[10px] text-gray-500 font-medium">BBV Inversiones</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            {[
              { id: 'dashboard' as Page, label: 'Pruebas' },
              { id: 'runner' as Page, label: 'Resultados' },
              { id: 'reports' as Page, label: 'Reportes' },
              { id: 'agent' as Page, label: '🤖 Agente QA' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  page === item.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {page === 'dashboard' && (
          <Dashboard
            onResults={(results) => {
              setTestResults(results)
              setPage('runner')
            }}
          />
        )}
        {page === 'runner' && (
          <TestRunner
            results={testResults}
            onBack={() => setPage('dashboard')}
            onPdfGenerated={setPdfPath}
            onViewReports={() => setPage('reports')}
          />
        )}
        {page === 'reports' && <Reports onBack={() => setPage('dashboard')} />}
        {page === 'agent' && <Agent />}
      </main>
    </div>
  )
}
