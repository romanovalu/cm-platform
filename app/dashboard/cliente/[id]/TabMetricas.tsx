'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'

type Reporte = {
  id: string
  titulo: string
  plataforma: string
  periodo: string
  reporte_texto: string
  created_at: string
}

const PLATAFORMAS = ['Meta (Facebook/Instagram)', 'TikTok', 'Google Ads', 'LinkedIn', 'YouTube']

export default function TabMetricas({ clienteId, clienteNombre }: { clienteId: string, clienteNombre: string }) {
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [verReporte, setVerReporte] = useState<Reporte | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ plataforma: 'Meta (Facebook/Instagram)', periodo: '', titulo: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const cargar = async () => {
    const { data } = await supabase.from('reportes').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
    if (data) setReportes(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [clienteId])

  const copiarLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/metricas/${clienteId}`)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  const procesarExcel = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !form.periodo.trim()) {
      setError('Seleccioná un archivo y completá el período')
      return
    }
    setError('')
    setGenerando(true)

    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const datos = XLSX.utils.sheet_to_json(ws)

      if (!datos.length) {
        setError('El archivo no tiene datos válidos')
        setGenerando(false)
        return
      }

      const res = await fetch('/api/generar-reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plataforma: form.plataforma, periodo: form.periodo, datos: datos.slice(0, 50) }),
      })

      const { reporte, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)

      const titulo = form.titulo.trim() || `Reporte ${form.plataforma} — ${form.periodo}`
      await supabase.from('reportes').insert({
        cliente_id: clienteId,
        titulo,
        plataforma: form.plataforma,
        periodo: form.periodo,
        datos_json: datos.slice(0, 50),
        reporte_texto: reporte,
      })

      setForm({ plataforma: 'Meta (Facebook/Instagram)', periodo: '', titulo: '' })
      if (fileRef.current) fileRef.current.value = ''
      await cargar()
    } catch (e) {
      setError('Hubo un error. Verificá que el archivo sea .xlsx o .xls')
    }
    setGenerando(false)
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este reporte?')) return
    await supabase.from('reportes').delete().eq('id', id)
    await cargar()
  }

  if (loading) return <div className="text-gray-400 text-center py-12">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Header con link */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">Portal de métricas</h3>
          <p className="text-gray-400 text-sm">{clienteNombre} ve sus reportes en su portal privado</p>
        </div>
        <button onClick={copiarLink} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors">
          {linkCopiado ? '✓ Link copiado' : '🔗 Link del cliente'}
        </button>
      </div>

      {/* Subir Excel */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h4 className="text-white font-semibold mb-4">Cargar nuevo reporte</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Plataforma</label>
              <select value={form.plataforma} onChange={e => setForm({ ...form, plataforma: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500">
                {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Período *</label>
              <input value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })}
                placeholder="Ej: Junio 2025 / Semana del 2-8 jun"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título del reporte (opcional)</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Se genera automáticamente si lo dejás vacío"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Archivo Excel (.xlsx / .xls) *</label>
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-violet-600 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}>
              <p className="text-2xl mb-2">📊</p>
              <p className="text-gray-300 text-sm">Hacé clic para seleccionar el Excel exportado de {form.plataforma}</p>
              <p className="text-gray-500 text-xs mt-1">Exportá el reporte directamente desde el administrador de anuncios</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={procesarExcel} disabled={generando}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {generando ? (<><span className="animate-spin">⟳</span> Analizando con IA...</>) : '✨ Generar reporte con IA'}
          </button>
        </div>
      </div>

      {/* Lista de reportes */}
      {reportes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold">Reportes generados</h4>
          {reportes.map(r => (
            <div key={r.id} className="bg-gray-900 rounded-xl p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded-full text-xs">{r.plataforma}</span>
                  <span className="text-gray-500 text-xs">{r.periodo}</span>
                  <span className="text-gray-600 text-xs">{new Date(r.created_at).toLocaleDateString('es-AR')}</span>
                </div>
                <p className="text-white font-medium">{r.titulo}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => setVerReporte(r)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">Ver</button>
                <button onClick={() => eliminar(r.id)} className="px-3 py-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-500 hover:text-red-400 text-xs rounded-lg transition-colors">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ver reporte */}
      {verReporte && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">{verReporte.titulo}</h3>
                <p className="text-gray-400 text-sm">{verReporte.plataforma} · {verReporte.periodo}</p>
              </div>
              <button onClick={() => setVerReporte(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6">
              <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{verReporte.reporte_texto}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
