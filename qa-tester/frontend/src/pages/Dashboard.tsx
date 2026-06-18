import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'

interface Props {
  onResults: (results: any) => void
}

const GHERKIN_CATEGORIES = [
  { id: '', label: 'Todos los casos' },
  { id: 'funcional', label: 'Funcionales' },
  { id: 'no_funcional', label: 'No Funcionales' },
]

const CATEGORIES = [
  {
    id: 'functional',
    label: 'Pruebas Funcionales',
    color: 'from-blue-500 to-blue-600',
    items: [
      { id: 'unitarias', label: 'Unitarias' },
      { id: 'integracion', label: 'Integración' },
      { id: 'sistema', label: 'Sistema' },
      { id: 'aceptacion', label: 'Aceptación' },
    ],
  },
  {
    id: 'non_functional',
    label: 'Pruebas No Funcionales',
    color: 'from-purple-500 to-purple-600',
    items: [
      { id: 'carga', label: 'Carga' },
      { id: 'estres', label: 'Estrés' },
      { id: 'rendimiento', label: 'Rendimiento' },
      { id: 'volumen', label: 'Volumen' },
      { id: 'estabilidad', label: 'Estabilidad' },
      { id: 'robustez', label: 'Robustez' },
    ],
  },
  {
    id: 'black_box',
    label: 'Caja Negra',
    color: 'from-emerald-500 to-emerald-600',
    items: [
      { id: 'particion_de_equivalencias', label: 'Partición de Equivalencias' },
      { id: 'analisis_de_valores_limite', label: 'Valores Límite' },
      { id: 'tabla_de_decisiones', label: 'Tabla de Decisiones' },
      { id: 'transicion_de_estados', label: 'Transición de Estados' },
      { id: 'casos_de_uso', label: 'Casos de Uso' },
    ],
  },
  {
    id: 'white_box',
    label: 'Caja Blanca',
    color: 'from-amber-500 to-amber-600',
    items: [
      { id: 'cobertura_de_sentencia', label: 'Cobertura de Sentencia' },
      { id: 'cobertura_de_decision', label: 'Cobertura de Decisión' },
    ],
  },
]

const FRAMEWORKS = [
  { id: 'pytest', label: 'Pytest', color: 'from-orange-500 to-orange-600' },
  { id: 'playwright', label: 'Playwright', color: 'from-green-500 to-green-600' },
  { id: 'locust', label: 'Locust', color: 'from-cyan-500 to-cyan-600' },
  { id: 'robot', label: 'Robot Framework', color: 'from-rose-500 to-rose-600' },
]

function GaugeBar({ label, value, sub, color, unit = '%' }: { label: string; value: number; sub: string; color: string; unit?: string }) {
  const pct = Math.min(value, 100)
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-white">{label}</span>
        <span className="text-sm font-black tracking-tight" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
      <p className="text-[9px] text-gray-500 mt-1">{sub}</p>
    </div>
  )
}

function Sparkline({ history, color }: { history: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || history.length < 2) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const w = c.width, h = c.height
    ctx.clearRect(0, 0, w, h)
    const max = Math.max(...history, 1)
    const min = Math.min(...history, 0)
    const range = max - min || 1
    const step = w / (history.length - 1)
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    history.forEach((v, i) => {
      const x = i * step
      const y = h - ((v - min) / range) * (h - 4) - 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.fillStyle = color + '22'
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()
  }, [history, color])
  return <canvas ref={ref} width={140} height={30} className="w-full h-8 rounded" />
}

function SystemPanel() {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [cpuHist, setCpuHist] = useState<number[]>([])
  const [memHist, setMemHist] = useState<number[]>([])

  useEffect(() => {
    if (!open) return
    const poll = async () => {
      try {
        const s = await api.getSystemStats()
        setStats(s)
        setCpuHist((p) => [...p.slice(-29), s.cpu.percent])
        setMemHist((p) => [...p.slice(-29), s.memory.percent])
      } catch { /* skip */ }
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [open])

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.01] transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: open ? 'pulse 2s infinite' : 'none' }} />
          <h3 className="text-sm font-bold text-white">Monitor del Sistema</h3>
          {stats && !open && (
            <span className="text-[10px] text-gray-500">
              CPU {stats.cpu.percent}% · RAM {stats.memory.percent}% · Disco {stats.disk.percent}%
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && stats && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <GaugeBar label="CPU" value={stats.cpu.percent} sub={`${stats.cpu.freq_mhz} MHz · ${stats.cpu.cores} núcleos`} color="#3b82f6" />
            <GaugeBar label="Memoria" value={stats.memory.percent} sub={`${stats.memory.used_gb}/${stats.memory.total_gb} GB · Swap ${stats.memory.swap_percent}%`} color="#8b5cf6" />
            <GaugeBar label="Disco" value={stats.disk.percent} sub={`${stats.disk.used_gb}/${stats.disk.total_gb} GB`} color="#10b981" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500">CPU por núcleo</span>
                <span className="text-[10px] text-gray-500">Red: ↑{stats.network.sent_mbps} ↓{stats.network.recv_mbps} Mbps</span>
              </div>
              <div className="flex gap-1">
                {stats.cpu.per_core.map((p: number, i: number) => {
                  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16']
                  return (
                    <div key={i} className="flex-1 h-8 bg-white/[0.04] rounded relative overflow-hidden">
                      <div className="absolute bottom-0 w-full rounded transition-all duration-500" style={{ height: `${Math.min(p, 100)}%`, background: colors[i % colors.length] }} />
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white/80">{p}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-1">Historial 60s</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] text-gray-600">CPU</p>
                  <Sparkline history={cpuHist} color="#3b82f6" />
                </div>
                <div>
                  <p className="text-[8px] text-gray-600">RAM</p>
                  <Sparkline history={memHist} color="#8b5cf6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {open && !stats && (
        <div className="px-4 pb-4">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ onResults }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedTests, setSelectedTests] = useState<Record<string, string[]>>({})
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [gherkinCategory, setGherkinCategory] = useState('')
  const [gherkinResult, setGherkinResult] = useState<any>(null)
  const [generatingGherkin, setGeneratingGherkin] = useState(false)

  const toggleTest = (catId: string, itemId: string) => {
    setSelectedTests((prev) => {
      const current = prev[catId] || []
      const next = { ...prev }
      if (current.includes(itemId)) {
        next[catId] = current.filter((i) => i !== itemId)
      } else {
        next[catId] = [...current, itemId]
      }
      return next
    })
  }

  const toggleAllInCategory = (catId: string, items: { id: string }[]) => {
    setSelectedTests((prev) => {
      const allSelected = items.every((i) => (prev[catId] || []).includes(i.id))
      if (allSelected) {
        return { ...prev, [catId]: [] }
      }
      return { ...prev, [catId]: items.map((i) => i.id) }
    })
  }

  const toggleFramework = (id: string) => {
    setSelectedFrameworks((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const handleRunTests = async () => {
    setLoading('tests')
    setError(null)
    try {
      const results: any = {}

      for (const cat of CATEGORIES) {
        const items = selectedTests[cat.id]
        if (items && items.length > 0) {
          if (cat.id === 'functional') {
            const res = await api.executeFunctional(items.join(','))
            results['Pruebas Funcionales'] = res
          } else if (cat.id === 'non_functional') {
            const res = await api.executeNonFunctional(items.join(','))
            results['Pruebas No Funcionales'] = res
          } else if (cat.id === 'black_box') {
            const res = await api.executeBlackBox(items.join(','))
            results['Caja Negra'] = res
          } else if (cat.id === 'white_box') {
            const res = await api.executeWhiteBox(items.join(','))
            results['Caja Blanca'] = res
          }
        }
      }

      for (const fw of selectedFrameworks) {
        if (fw === 'pytest') {
          results['Framework: Pytest'] = await api.runPytest()
        } else if (fw === 'playwright') {
          results['Framework: Playwright'] = await api.runPlaywright()
        } else if (fw === 'locust') {
          results['Framework: Locust'] = await api.runLocust()
        } else if (fw === 'robot') {
          results['Framework: Robot'] = await api.runRobot()
        }
      }

      if (Object.keys(results).length === 0) {
        const all = await api.executeAll()
        results['Pruebas Funcionales'] = all.funcionales
        results['Pruebas No Funcionales'] = all.no_funcionales
        results['Caja Negra'] = all.caja_negra
        results['Caja Blanca'] = all.caja_blanca
      }

      onResults(results)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <SystemPanel />

      <div>
        <h2 className="text-2xl font-black text-white">Panel de Pruebas</h2>
        <p className="text-sm text-gray-400 mt-1">
          Selecciona los tipos de prueba, técnicas y frameworks a ejecutar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CATEGORIES.map((cat) => {
          const selectedCount = (selectedTests[cat.id] || []).length
          const totalCount = cat.items.length
          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center text-[10px] font-black text-white`}>
                    {selectedCount}/{totalCount}
                  </div>
                  <h3 className="text-sm font-bold text-white">{cat.label}</h3>
                </div>
                <button
                  onClick={() => toggleAllInCategory(cat.id, cat.items)}
                  className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
                >
                  {selectedCount === totalCount ? 'Deseleccionar' : 'Todo'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => {
                  const isSel = (selectedTests[cat.id] || []).includes(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleTest(cat.id, item.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSel
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                          : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:border-white/10 hover:text-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-4">Frameworks de Automatización</h3>
        <div className="flex flex-wrap gap-3">
          {FRAMEWORKS.map((fw) => {
            const isSel = selectedFrameworks.includes(fw.id)
            return (
              <button
                key={fw.id}
                onClick={() => toggleFramework(fw.id)}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                  isSel
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                    : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:border-white/10 hover:text-gray-300'
                }`}
              >
                {fw.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-4">Generar Features Gherkin (BDD)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Genera archivos .feature con escenarios Given-When-Then a partir de los casos de prueba
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {GHERKIN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setGherkinCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                gherkinCategory === cat.id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:border-white/10 hover:text-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={async () => {
            setGeneratingGherkin(true)
            setGherkinResult(null)
            try {
              const res = await api.generateGherkin(gherkinCategory || undefined)
              setGherkinResult(res)
            } catch (e: any) {
              setGherkinResult({ success: false, error: e.message })
            } finally {
              setGeneratingGherkin(false)
            }
          }}
          disabled={generatingGherkin}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs uppercase tracking-wider hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50"
        >
          {generatingGherkin ? 'Generando...' : '📋 Generar Features Gherkin'}
        </button>
        {gherkinResult && gherkinResult.success && (
          <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <p className="text-xs font-bold text-amber-400">✅ Generado exitosamente</p>
            <p className="text-[10px] text-gray-400">
              Archivo combinado: <span className="font-mono text-gray-300">{gherkinResult.combined.filename}</span>
            </p>
            <p className="text-[10px] text-gray-400">
              {gherkinResult.total_features} features · {gherkinResult.combined.scenarios} escenarios
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {gherkinResult.per_feature.map((f: any, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                  {f.feature} ({f.scenarios})
                </span>
              ))}
            </div>
          </div>
        )}
        {gherkinResult && !gherkinResult.success && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs font-bold text-red-400">Error: {gherkinResult.error}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5">
          <p className="text-sm font-bold text-red-400">Error: {error}</p>
        </div>
      )}

      <button
        onClick={handleRunTests}
        disabled={loading !== null}
        className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-sm uppercase tracking-widest hover:from-blue-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/25 disabled:opacity-50"
      >
        {loading === 'tests' ? 'Ejecutando pruebas...' : '▶ Ejecutar Pruebas Seleccionadas'}
      </button>
    </div>
  )
}
