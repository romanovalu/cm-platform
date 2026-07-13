'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type Reporte = {
  id: string
  titulo: string
  plataforma: string
  periodo: string
  reporte_texto: string
  created_at: string
}

const plataformaIcon: Record<string, string> = {
  'Meta (Facebook/Instagram)': '📘',
  'TikTok': '🎵',
  'Google Ads': '🔍',
  'LinkedIn': '💼',
  'YouTube': '▶️',
}

export default function MetricasPage() {
  const { clienteId } = useParams()
  const [cliente, setCliente] = useState<{ nombre: string; empresa: string } | null>(null)
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Reporte | null>(null)

  useEffect(() => {
    const cargar = async () => {
      const [{ data: cli }, { data: rep }] = await Promise.all([
        supabase.from('clientes').select('nombre, empresa').eq('id', clienteId as string).single(),
        supabase.from('reportes').select('*').eq('cliente_id', clienteId as string).order('created_at', { ascending: false }),
      ])
      if (cli) setCliente(cli)
      if (rep) {
        setReportes(rep)
        if (rep.length > 0) setSeleccionado(rep[0])
      }
      setLoading(false)
    }
    cargar()
  }, [clienteId])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Cargando tu portal...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">V</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Portal de métricas</h1>
              {cliente && <p className="text-gray-400 text-sm">{cliente.nombre}{cliente.empresa ? ` · ${cliente.empresa}` : ''}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {reportes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📊</p>
            <h2 className="text-white text-xl font-bold mb-3">Tu portal está listo</h2>
            <p className="text-gray-400 max-w-sm mx-auto">Acá vas a poder ver los reportes de tus campañas a medida que tu community manager los publique.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar: lista de reportes */}
            <div className="space-y-2">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Reportes disponibles</h3>
              {reportes.map(r => (
                <button key={r.id} onClick={() => setSeleccionado(r)}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${seleccionado?.id === r.id ? 'bg-violet-600/20 border border-violet-600/40' : 'bg-gray-900 hover:bg-gray-800 border border-transparent'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{plataformaIcon[r.plataforma] || '📊'}</span>
                    <span className="text-gray-400 text-xs">{r.plataforma.split(' ')[0]}</span>
                  </div>
                  <p className={`font-medium text-sm ${seleccionado?.id === r.id ? 'text-violet-300' : 'text-white'}`}>{r.titulo}</p>
                  <p className="text-gray-500 text-xs mt-1">{r.periodo}</p>
                  <p className="text-gray-600 text-xs">{new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p>
                </button>
              ))}
            </div>

            {/* Contenido del reporte seleccionado */}
            {seleccionado && (
              <div className="md:col-span-2">
                <div className="bg-gray-900 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{plataformaIcon[seleccionado.plataforma] || '📊'}</span>
                      <div>
                        <span className="px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded-full text-xs font-medium">{seleccionado.plataforma}</span>
                        <span className="text-gray-500 text-xs ml-2">{seleccionado.periodo}</span>
                      </div>
                    </div>
                    <h2 className="text-white text-xl font-bold">{seleccionado.titulo}</h2>
                    <p className="text-gray-500 text-sm mt-1">Publicado el {new Date(seleccionado.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-800 rounded-xl p-5">
                      <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{seleccionado.reporte_texto}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-gray-700 text-xs">
        Portal privado generado por Voler Orbit · Solo vos podés ver este link
      </footer>
    </div>
  )
}
