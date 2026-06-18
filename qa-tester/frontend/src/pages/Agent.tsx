import { useState } from 'react'
import { api } from '../api/client'

export default function Agent() {
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [chat, setChat] = useState<{ q: string; a: string }[]>([])

  const handleAnalyze = async () => {
    setLoading(true)
    setResponse('')
    try {
      const allResults = await api.executeAll()
      const res = await fetch('/api/agent/analyze', { method: 'POST' })
      const data = await res.json()
      setResponse(data.analysis || 'Sin respuesta')
    } catch (e: any) {
      setResponse(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      let full = data.answer || 'Sin respuesta'
      if (data.test_results) {
        const total = JSON.stringify(data.test_results).split('"passed":true').length - 1
        const failed = JSON.stringify(data.test_results).split('"passed":false').length - 1
        full += `\n\n📊 Pruebas ejecutadas: ${total + failed} total | ✅ ${total} pasaron | ❌ ${failed} fallaron`
      }
      if (data.email_sent) {
        if (data.email_sent.success) {
          full += `\n\n✅ PDF enviado exitosamente a ${data.email_sent.to}`
        } else {
          full += `\n\n❌ Error al enviar email a ${data.email_sent.to}: ${data.email_sent.detail}`
        }
      }
      setChat((prev) => [...prev, { q: question, a: full }])
      setQuestion('')
    } catch (e: any) {
      setChat((prev) => [...prev, { q: question, a: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Agente QA 🤖</h2>
        <p className="text-sm text-gray-400 mt-1">
          Asistente con Gemini para analizar resultados y responder preguntas sobre las pruebas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Analizar Resultados</h3>
          <p className="text-xs text-gray-500 mb-4">
            Ejecuta todas las pruebas y envía los resultados a Gemini para obtener un análisis inteligente.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Analizando...' : '🔍 Ejecutar y Analizar'}
          </button>
          {response && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{response}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold text-white mb-4">Consultar al Agente</h3>
          <p className="text-xs text-gray-500 mb-4">
            Hacé preguntas sobre QA, testing, recomendaciones de pruebas, etc.
          </p>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="Ej: ¿Qué pruebas debería ejecutar después de un cambio en empresas?"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40"
              />
              <button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600/20 text-blue-400 font-bold text-xs border border-blue-500/20 hover:bg-blue-600/30 transition-all disabled:opacity-50"
              >
                {loading ? '...' : 'Enviar'}
              </button>
            </div>

            {chat.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-gray-600">Preguntas sugeridas:</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {[
                    '¿Qué pruebas recomiendas para el módulo de empresas?',
                    '¿Cómo mejorar la cobertura de pruebas?',
                    'Explica los resultados de las pruebas de carga',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuestion(q)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-gray-500 hover:text-gray-300 hover:border-white/10 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {chat.map((c, i) => (
                <div key={i} className="space-y-2">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[10px] text-blue-400 font-bold mb-1">Tú:</p>
                    <p className="text-xs text-gray-300">{c.q}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-[10px] text-purple-400 font-bold mb-1">Agente:</p>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap">{c.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
