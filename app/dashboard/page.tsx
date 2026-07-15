'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Cliente = {
  id: string
  nombre: string
  empresa: string
  email: string
  telefono: string
  industria: string
  estado: 'activo' | 'pausado' | 'revisar'
  retainer: number
  moneda: string
  pago: 'pagado' | 'pendiente' | 'vencido'
  notas: string
  created_at: string
}

const estadoColor = {
  activo: 'bg-green-500',
  pausado: 'bg-gray-500',
  revisar: 'bg-yellow-500',
}

const pagoColor = {
  pagado: 'text-green-400',
  pendiente: 'text-yellow-400',
  vencido: 'text-red-400',
}

const pagoLabel = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
}

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    industria: '',
    retainer: '',
    moneda: 'USD',
    estado: 'activo',
    notas: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }
      await cargarClientes()
      setLoading(false)
    }
    init()
  }, [])

  const cargarClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setClientes(data)
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return
    setGuardando(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('clientes').insert({
      user_id: session.user.id,
      nombre: form.nombre,
      empresa: form.empresa,
      email: form.email,
      telefono: form.telefono,
      industria: form.industria,
      retainer: Number(form.retainer) || 0,
      moneda: form.moneda,
      estado: form.estado,
      notas: form.notas,
      pago: 'pendiente',
    })

    setForm({ nombre: '', empresa: '', email: '', telefono: '', industria: '', retainer: '', moneda: 'USD', estado: 'activo', notas: '' })
    setModalAbierto(false)
    setGuardando(false)
    await cargarClientes()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Voler Orbit</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/dashboard/prospectos'}
            className="text-sm text-gray-400 hover:text-white transition-colors">
            🎯 Prospectos
          </button>
          <button onClick={() => window.location.href = '/dashboard/finanzas'}
            className="text-sm text-gray-400 hover:text-white transition-colors">
            💰 Finanzas
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Título y botón */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Mis Clientes</h2>
            <p className="text-gray-400 text-sm mt-1">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            + Nuevo cliente
          </button>
        </div>

        {/* Lista de clientes */}
        {clientes.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-16 text-center">
            <p className="text-4xl mb-4">🪐</p>
            <h3 className="text-white font-semibold text-lg mb-2">Todavía no tenés clientes</h3>
            <p className="text-gray-400 text-sm mb-6">Agregá tu primer cliente y enviále el link de onboarding</p>
            <button
              onClick={() => setModalAbierto(true)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
            >
              + Agregar primer cliente
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Cliente</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Industria</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Estado</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Retainer</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Pago</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} onClick={() => window.location.href = `/dashboard/cliente/${cliente.id}`} className="border-b border-gray-800 last:border-0 hover:bg-gray-800 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{cliente.nombre}</p>
                      {cliente.empresa && <p className="text-gray-400 text-sm">{cliente.empresa}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{cliente.industria || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${estadoColor[cliente.estado]}`} />
                        <span className="text-gray-300 text-sm capitalize">{cliente.estado}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {cliente.retainer > 0 ? `${cliente.moneda} ${cliente.retainer.toLocaleString()}` : '—'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${pagoColor[cliente.pago]}`}>
                      {pagoLabel[cliente.pago]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal nuevo cliente */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Nuevo cliente</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del contacto"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Empresa</label>
                <input
                  type="text"
                  value={form.empresa}
                  onChange={e => setForm({ ...form, empresa: e.target.value })}
                  placeholder="Nombre del negocio"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@cliente.com"
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+54 9 11..."
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Industria</label>
                <input
                  type="text"
                  value={form.industria}
                  onChange={e => setForm({ ...form, industria: e.target.value })}
                  placeholder="Gastronomía, Moda, Salud..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Retainer</label>
                  <input
                    type="number"
                    value={form.retainer}
                    onChange={e => setForm({ ...form, retainer: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Moneda</label>
                  <select
                    value={form.moneda}
                    onChange={e => setForm({ ...form, moneda: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                  >
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={e => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
                >
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                  <option value="revisar">Revisar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Notas internas sobre el cliente..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim()}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
