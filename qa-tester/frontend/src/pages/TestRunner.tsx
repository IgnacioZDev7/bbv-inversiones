import { useState } from 'react'
import { api } from '../api/client'

interface Props {
  results: any
  onBack: () => void
  onPdfGenerated: (path: string) => void
  onViewReports: () => void
}

function getPassedCount(data: any): number {
  let count = 0
  const walk = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    if (obj.passed === true) count++
    if (Array.isArray(obj.results)) {
      obj.results.forEach((r: any) => {
        if (r.passed === true) count++
        if (Array.isArray(r.results)) r.results.forEach((rr: any) => { if (rr.passed === true) count++ })
      })
    }
    Object.values(obj).forEach(walk)
  }
  walk(data)
  return count
}

function getTotalCount(data: any): number {
  let count = 0
  const walk = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    if ('passed' in obj) count++
    if (Array.isArray(obj.results)) {
      obj.results.forEach((r: any) => {
        if ('passed' in r) count++
        if (Array.isArray(r.results)) r.results.forEach((rr: any) => { if ('passed' in rr) count++ })
      })
    }
    Object.values(obj).forEach(walk)
  }
  walk(data)
  return count
}

function StatusBadge({ passed }: { passed: boolean }) {
  return passed
    ? <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">PASÓ</span>
    : <span className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">FALLÓ</span>
}

function ResultCard({ title, data, depth = 0 }: { title: string; data: any; depth?: number }) {
  if (!data || typeof data !== 'object') return null

  const hasPassed = 'passed' in data
  const hasResults = Array.isArray(data.results) && data.results.length > 0
  const hasChildren = Object.values(data).some(
    (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0
  )
  const isPrimitive = !hasPassed && !hasResults && !hasChildren

  if (isPrimitive) return null

  return (
    <div
      className={`rounded-2xl border ${depth === 0 ? 'border-white/5 bg-white/[0.02]' : 'border-transparent'} p-4`}
      style={{ marginLeft: depth * 16 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-white">{title}</h4>
        {hasPassed && <StatusBadge passed={data.passed} />}
      </div>

      {data.avg_response_ms && (
        <div className="flex gap-3 text-[10px] text-gray-400 mb-2">
          <span>Promedio: {data.avg_response_ms}ms</span>
          {data.max_response_ms && <span>Máx: {data.max_response_ms}ms</span>}
          {data.error_rate_pct !== undefined && <span>Error: {data.error_rate_pct}%</span>}
          {data.cobertura_pct !== undefined && <span>Cobertura: {data.cobertura_pct}%</span>}
        </div>
      )}

      {data.detail && typeof data.detail === 'object' && (
        <div className="text-[10px] text-gray-500 font-mono mb-2">
          {data.detail.tc_id && <span>{data.detail.tc_id}: </span>}
          {data.detail.titulo && <span>{data.detail.titulo}</span>}
        </div>
      )}

      {hasResults && (
        <div className="space-y-2 mt-2">
          {data.results.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold text-blue-400 shrink-0">{r.id || r.tc_id || ''}</span>
                <span className="text-[10px] text-gray-300 truncate">{r.titulo || r.desc || r.test || r.descripcion || ''}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status && <span className="text-[10px] text-gray-500">{r.status}</span>}
                {r.passed !== undefined && <StatusBadge passed={r.passed} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasChildren && !hasResults && (
        <div className="space-y-2 mt-2">
          {Object.entries(data).map(([key, val]) => {
            if (key === 'passed' || key === 'results' || key === 'detail' || key === 'type') return null
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
              return <ResultCard key={key} title={key} data={val} depth={depth + 1} />
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

export default function TestRunner({ results, onBack, onPdfGenerated, onViewReports }: Props) {
  const [generating, setGenerating] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [email, setEmail] = useState('')
  const [emailResult, setEmailResult] = useState<string | null>(null)
  const [pdfPath, setPdfPath] = useState<string | null>(null)

  if (!results) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium">No hay resultados. Ejecuta pruebas primero.</p>
        <button onClick={onBack} className="mt-4 text-sm text-blue-400 hover:text-blue-300">Volver</button>
      </div>
    )
  }

  const passed = getPassedCount(results)
  const total = getTotalCount(results)

  const handleGeneratePdf = async () => {
    setGenerating(true)
    try {
      const res = await api.generateReportFromResults(results)
      setPdfPath(res.pdf_path)
      onPdfGenerated(res.pdf_path)
    } catch (e: any) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const handleSendEmail = async () => {
    if (!pdfPath || !email) return
    setEmailSending(true)
    setEmailResult(null)
    try {
      const res = await api.sendEmail(email, pdfPath)
      setEmailResult(res.success ? 'Reporte enviado exitosamente' : `Error: ${res.detail}`)
    } catch (e: any) {
      setEmailResult(`Error: ${e.message}`)
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Resultados de Pruebas</h2>
          <p className="text-sm text-gray-400 mt-1">
            {passed}/{total} pruebas pasaron
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
            ← Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, color: 'text-white' },
          { label: 'Pasaron', value: passed, color: 'text-emerald-400' },
          { label: 'Fallaron', value: total - passed, color: 'text-red-400' },
          {
            label: 'Tasa de Éxito',
            value: total > 0 ? `${Math.round((passed / total) * 100)}%` : '0%',
            color: passed / total > 0.8 ? 'text-emerald-400' : 'text-amber-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center"
          >
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Object.entries(results).map(([key, val]) => (
          <ResultCard key={key} title={key} data={val} />
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Generar Reporte PDF</h3>
        <button
          onClick={handleGeneratePdf}
          disabled={generating}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
        >
          {generating ? 'Generando...' : '📄 Generar PDF'}
        </button>

        {pdfPath && (
          <div className="space-y-3 mt-4">
            <p className="text-[10px] text-gray-500 font-mono">{pdfPath}</p>

            <div className="flex items-center gap-2">
              <a
                href={`/api/report/download/${pdfPath.split('\\').pop() || pdfPath.split('/').pop()}`}
                target="_blank"
                className="px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/20 hover:bg-blue-500/20 transition-all inline-flex items-center gap-1.5"
              >
                👁 Ver PDF
              </a>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40"
              />
              <button
                onClick={handleSendEmail}
                disabled={emailSending || !email}
                className="px-6 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold text-xs border border-emerald-500/20 hover:bg-emerald-600/30 transition-all disabled:opacity-50"
              >
                {emailSending ? 'Enviando...' : '✉ Enviar por Email'}
              </button>
            </div>

            {emailResult && (
              <p className={`text-xs font-medium ${emailResult.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                {emailResult}
              </p>
            )}

            <button onClick={onViewReports} className="text-xs text-blue-400 hover:text-blue-300">
              Ver todos los reportes generados →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
