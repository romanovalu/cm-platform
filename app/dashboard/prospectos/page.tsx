'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Prospecto = {
  id: string
  nombre: string
  empresa: string
  email: string
  telefono: string
  industria: string
  estado: 'nuevo' | 'contactado' | 'propuesta_enviada' | 'negociacion' | 'ganado' | 'perdido'
  origen: string
  notas: string
  created_at: string
}

const ESTADOS = [
  { key: 'nuevo',            label: 'Nuevo',             color: 'bg-gray-500/20 text-gray-300',   dot: 'bg-gray-400' },
  { key: 'contactado',       label: 'Contactado',        color: 'bg-blue-500/20 text-blue-400',   dot: 'bg-blue-400' },
  { key: 'propuesta_enviada',label: 'Propuesta enviada', color: 'bg-violet-500/20 text-violet-400', dot: 'bg-violet-400' },
  { key: 'negociacion',      label: 'Negociación',       color: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-400' },
  { key: 'ganado',           label: 'Ganado',            color: 'bg-green-500/20 text-green-400', dot: 'bg-green-400' },
  { key: 'perdido',          label: 'Perdido',           color: 'bg-red-500/20 text-red-400',     dot: 'bg-red-500' },
]

const estadoInfo = Object.fromEntries(ESTADOS.map(e => [e.key, e]))

const FORM_VACIO = { nombre: '', empresa: '', email: '', telefono: '', industria: '', estado: 'nuevo', origen: '', notas: '' }

export default function ProspectosPage() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [form, setForm] = useState(FORM_VACIO)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }
      await cargar()
    }
    init()
  }, [])

  const cargar = async () => {
    const { data } = await supabase.from('prospectos').select('*').order('created_at', { ascending: false })
    if (data) setProspectos(data)
    setLoading(false)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('prospectos').insert({ ...form, user_id: session!.user.id })
    setForm(FORM_VACIO)
    setModal(false)
    setGuardando(false)
    await cargar()
  }

  const lista = filtro === 'todos' ? prospectos : prospectos.filter(p => p.estado === filtro)

  const contarPorEstado = (key: string) => prospectos.filter(p => p.estado === key).length

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/dashboard'} className="text-gray-400 hover:text-white text-sm transition-colors">← Dashboard</button>
          <span className="text-gray-700">|</span>
          <h1 className="text-white font-bold text-lg">Prospectos</h1>
        </div>
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
          + Nuevo prospecto
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Pipeline resumen */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          {ESTADOS.map(e => (
            <button key={e.key} onClick={() => setFiltro(filtro === e.key ? 'todos' : e.key)}
              className={`bg-gray-900 rounded-xl p-4 text-center transition-colors border ${filtro === e.key ? 'border-violet-500' : 'border-transparent hover:border-gray-700'}`}>
              <p className="text-2xl font-bold text-white">{contarPorEstado(e.key)}</p>
              <p className={`text-xs mt-1 font-medium ${e.color.split(' ')[1]}`}>{e.label}</p>
            </button>
          ))}
        </div>

        {/* Filtro activo */}
        {filtro !== 'todos' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400 text-sm">Filtrando por:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoInfo[filtro].color}`}>{estadoInfo[filtro].label}</span>
            <button onClick={() => setFiltro('todos')} className="text-gray-500 hover:text-white text-xs ml-1">✕ Quitar filtro</button>
          </div>
        )}

        {/* Lista */}
        {lista.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-16 text-center">
            <p className="text-4xl mb-4">🎯</p>
            <h3 className="text-white font-semibold text-lg mb-2">
              {filtro === 'todos' ? 'Sin prospectos todavía' : `Sin prospectos en "${estadoInfo[filtro].label}"`}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {filtro === 'todos' ? 'Agregá tu primer prospecto para empezar a gestionar tu pipeline' : 'Probá con otro filtro'}
            </p>
            {filtro === 'todos' && (
              <button onClick={() => setModal(true)} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors">
                + Agregar prospecto
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Prospecto</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Industria</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Origen</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Estado</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(p => (
                  <tr key={p.id}
                    onClick={() => window.location.href = `/dashboard/prospectos/${p.id}`}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{p.nombre}</p>
                      {p.empresa && <p className="text-gray-400 text-sm">{p.empresa}</p>}
                      {p.email && <p className="text-gray-500 text-xs">{p.email}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{p.industria || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{p.origen || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoInfo[p.estado].color}`}>
                        {estadoInfo[p.estado].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal nuevo prospecto */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Nuevo prospecto</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del contacto"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Empresa</label>
                <input value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })}
                  placeholder="Nombre del negocio"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Industria</label>
                  <input value={form.industria} onChange={e => setForm({ ...form, industria: e.target.value })}
                    placeholder="Gastronomía, Moda..."
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Origen</label>
                  <input value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })}
                    placeholder="Instagram, referido, web..."
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estado inicial</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500">
                  {ESTADOS.filter(e => !['ganado','perdido'].includes(e.key)).map(e => (
                    <option key={e.key} value={e.key}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  rows={3} placeholder="Info relevante, qué busca, presupuesto estimado..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !form.nombre.trim()}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
