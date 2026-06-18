import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface Props {
  onBack: () => void
}

export default function Reports({ onBack }: Props) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getHistory()
      .then((res) => setHistory(res.history))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const downloadReport = (name: string) => {
    window.open(`/api/report/download/${name}`, '_blank')
  }

  const downloadGherkin = (name: string) => {
    window.open(`/api/gherkin/download/${name}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Historial de Actividad</h2>
          <p className="text-sm text-gray-400 mt-1">
            Todas las ejecuciones, reportes y features generados
          </p>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
          ← Volver
        </button>
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500 font-medium">No hay actividad registrada aún</p>
          <p className="text-xs text-gray-600 mt-1">Ejecuta pruebas, genera PDFs o features Gherkin y aparecerán aquí</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="space-y-3">
          {history.map((entry, idx) => {
            const time = new Date(entry.timestamp)
            const summary = entry.results_summary
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm">
                      {entry.source === 'gherkin_generate' ? '📋' : entry.source === 'email_sent' ? '✉' : '📄'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {entry.source === 'report_generate' && 'Reporte PDF Generado'}
                        {entry.source === 'gherkin_generate' && 'Features Gherkin Generados'}
                        {entry.source === 'email_sent' && 'Reporte Enviado por Email'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {time.toLocaleDateString()} · {time.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {entry.source === 'email_sent' && entry.email_to && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      {entry.email_to}
                    </span>
                  )}
                </div>

                {summary && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                      Total: {summary.total}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      Pasaron: {summary.passed}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                      Fallaron: {summary.failed}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                      {Math.round((summary.passed / (summary.total || 1)) * 100)}% éxito
                    </span>
                  </div>
                )}

                {summary?.categories && summary.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {summary.categories.map((cat: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/[0.03] text-[9px] text-gray-500 font-mono border border-white/5">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {entry.pdf_filename && (
                    <>
                      <a
                        href={`/api/report/download/${entry.pdf_filename}`}
                        target="_blank"
                        className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-[10px] border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                      >
                        👁 Ver PDF
                      </a>
                      <button
                        onClick={() => downloadReport(entry.pdf_filename)}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] text-gray-500 font-bold text-[10px] border border-white/5 hover:text-white hover:border-white/10 transition-all"
                      >
                        ⬇ Descargar
                      </button>
                    </>
                  )}
                  {entry.gherkin_filename && (
                    <>
                      <a
                        href={`/api/gherkin/download/${entry.gherkin_filename}`}
                        target="_blank"
                        className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-[10px] border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                      >
                        👁 Ver Gherkin
                      </a>
                      <button
                        onClick={() => downloadGherkin(entry.gherkin_filename)}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] text-gray-500 font-bold text-[10px] border border-white/5 hover:text-white hover:border-white/10 transition-all"
                      >
                        ⬇ Descargar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
