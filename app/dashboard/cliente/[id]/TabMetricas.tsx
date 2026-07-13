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
  const [paso, setPaso] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [verReporte, setVerReporte] = useState<Reporte | null>(null)
  const [error, setError] = useState('')
  const [archivoNombre, setArchivoNombre] = useState('')
  const [filas, setFilas] = useState<number>(0)
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

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivoNombre(file.name)
    setError('')
    setFilas(0)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const datos = XLSX.utils.sheet_to_json(ws)
      setFilas(datos.length)
      if (datos.length === 0) setError('El archivo no tiene filas con datos. Verificá que el Excel tenga datos en la primera hoja.')
    } catch {
      setError('No se pudo leer el archivo. Asegurate de que sea un .xlsx o .xls válido.')
      setArchivoNombre('')
    }
  }

  const procesarExcel = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Primero seleccioná un archivo Excel'); return }
    if (!form.periodo.trim()) { setError('Completá el campo Período'); return }
    if (filas === 0) { setError('El archivo no tiene datos válidos'); return }

    setError('')
    setGenerando(true)

    try {
      setPaso('Leyendo el archivo...')
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const datos = XLSX.utils.sheet_to_json(ws)

      setPaso('Enviando datos a la IA...')
      const res = await fetch('/api/generar-reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plataforma: form.plataforma,
          periodo: form.periodo,
          datos: datos.slice(0, 50),
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Error del servidor (${res.status}): ${text}`)
      }

      const json = await res.json()
      if (json.error) throw new Error(json.error)
      if (!json.reporte) throw new Error('La IA no devolvió un reporte. Verificá que ANTHROPIC_API_KEY esté configurado en Vercel.')

      setPaso('Guardando reporte...')
      const titulo = form.titulo.trim() || `Reporte ${form.plataforma} — ${form.periodo}`
      const { error: dbErr } = await supabase.from('reportes').insert({
        cliente_id: clienteId,
        titulo,
        plataforma: form.plataforma,
        periodo: form.periodo,
        datos_json: datos.slice(0, 50),
        reporte_texto: json.reporte,
      })
      if (dbErr) throw new Error(`Error al guardar en base de datos: ${dbErr.message}`)

      setForm({ plataforma: 'Meta (Facebook/Instagram)', periodo: '', titulo: '' })
      setArchivoNombre('')
      setFilas(0)
      if (fileRef.current) fileRef.current.value = ''
      setPaso('')
      await cargar()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setError(msg)
      setPaso('')
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">Portal de métricas</h3>
          <p className="text-gray-400 text-sm">{clienteNombre} ve sus reportes en su portal privado</p>
        </div>
        <button onClick={copiarLink} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors">
          {linkCopiado ? '✓ Link copiado' : '🔗 Link del cliente'}
        </button>
      </div>

      {/* Formulario */}
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
                placeholder="Ej: Junio 2025"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Título (opcional)</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Se genera automáticamente si lo dejás vacío"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
          </div>

          {/* Zona de archivo */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Archivo Excel (.xlsx / .xls) *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                archivoNombre
                  ? 'border-green-600 bg-green-600/5'
                  : 'border-gray-700 hover:border-violet-600'
              }`}>
              {archivoNombre ? (
                <div>
                  <p className="text-green-400 font-semibold text-sm mb-1">✓ Archivo cargado</p>
                  <p className="text-white text-sm">{archivoNombre}</p>
                  <p className="text-gray-400 text-xs mt-1">{filas} filas de datos encontradas</p>
                  <p className="text-gray-600 text-xs mt-2">Clic para cambiar el archivo</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300 text-sm mb-1">Hacé clic para seleccionar el Excel</p>
                  <p className="text-gray-500 text-xs">Exportá el reporte desde el administrador de anuncios de {form.plataforma}</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}

          {paso && (
            <div className="bg-violet-900/20 border border-violet-700/40 rounded-xl p-3 flex items-center gap-3">
              <span className="text-violet-400 text-lg animate-spin inline-block">⟳</span>
              <p className="text-violet-300 text-sm">{paso}</p>
            </div>
          )}

          <button
            onClick={procesarExcel}
            disabled={generando || !archivoNombre || filas === 0}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {generando ? paso || 'Procesando...' : '✨ Generar reporte con IA'}
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
