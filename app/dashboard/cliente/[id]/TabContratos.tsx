'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Contrato = {
  id: string
  titulo: string
  descripcion: string
  estado: 'borrador' | 'enviado' | 'firmado' | 'vencido' | 'cancelado'
  fecha_inicio: string
  fecha_fin: string
  monto_total: number
  moneda: string
  notas: string
  created_at: string
}

const estadoColor = {
  borrador: 'bg-gray-500/20 text-gray-400',
  enviado: 'bg-blue-500/20 text-blue-400',
  firmado: 'bg-green-500/20 text-green-400',
  vencido: 'bg-red-500/20 text-red-400',
  cancelado: 'bg-red-900/20 text-red-600',
}

const estadoLabel = { borrador: 'Borrador', enviado: 'Enviado', firmado: 'Firmado', vencido: 'Vencido', cancelado: 'Cancelado' }

export default function TabContratos({ clienteId, monedaCliente }: { clienteId: string, monedaCliente: string }) {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    estado: 'borrador',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    monto_total: '',
    moneda: monedaCliente || 'USD',
    notas: '',
  })

  const cargar = async () => {
    const { data } = await supabase.from('contratos').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
    if (data) setContratos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [clienteId])

  const guardar = async () => {
    if (!form.titulo.trim()) return
    setGuardando(true)
    await supabase.from('contratos').insert({ ...form, cliente_id: clienteId, monto_total: Number(form.monto_total) || 0 })
    setForm({ titulo: '', descripcion: '', estado: 'borrador', fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: '', monto_total: '', moneda: monedaCliente || 'USD', notas: '' })
    setModal(false)
    setGuardando(false)
    await cargar()
  }

  const cambiarEstado = async (id: string, estado: Contrato['estado']) => {
    await supabase.from('contratos').update({ estado }).eq('id', id)
    await cargar()
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este contrato?')) return
    await supabase.from('contratos').delete().eq('id', id)
    await cargar()
  }

  const firmados = contratos.filter(c => c.estado === 'firmado')
  const totalFirmado = firmados.reduce((s, c) => s + c.monto_total, 0)

  if (loading) return <div className="text-gray-400 text-center py-12">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">Contratos firmados</p>
          <p className="text-green-400 text-xl font-bold">{firmados.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">Valor total firmado</p>
          <p className="text-white text-xl font-bold">{monedaCliente} {totalFirmado.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">Total contratos</p>
          <p className="text-white text-xl font-bold">{contratos.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
          + Nuevo contrato
        </button>
      </div>

      {contratos.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center">
          <p className="text-3xl mb-3">📄</p>
          <h4 className="text-white font-medium mb-2">Sin contratos todavía</h4>
          <p className="text-gray-400 text-sm mb-5">Registrá el primer contrato con este cliente</p>
          <button onClick={() => setModal(true)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
            + Nuevo contrato
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {contratos.map(c => (
            <div key={c.id} className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[c.estado]}`}>{estadoLabel[c.estado]}</span>
                    <span className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString('es-AR')}</span>
                  </div>
                  <p className="text-white font-bold text-lg">{c.titulo}</p>
                  {c.descripcion && <p className="text-gray-400 text-sm mt-1">{c.descripcion}</p>}
                  <div className="flex gap-6 mt-3 text-sm">
                    {c.monto_total > 0 && <span className="text-white font-medium">{c.moneda} {c.monto_total.toLocaleString()}</span>}
                    {c.fecha_inicio && <span className="text-gray-500">Inicio: {new Date(c.fecha_inicio).toLocaleDateString('es-AR')}</span>}
                    {c.fecha_fin && <span className="text-gray-500">Vence: {new Date(c.fecha_fin).toLocaleDateString('es-AR')}</span>}
                  </div>
                  {c.notas && <p className="text-gray-500 text-xs mt-2 italic">{c.notas}</p>}
                </div>
                <div className="flex flex-col gap-2 ml-4 min-w-fit">
                  {c.estado === 'borrador' && <button onClick={() => cambiarEstado(c.id, 'enviado')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">Enviado</button>}
                  {(c.estado === 'borrador' || c.estado === 'enviado') && <button onClick={() => cambiarEstado(c.id, 'firmado')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors">Firmado ✓</button>}
                  {c.estado === 'firmado' && <button onClick={() => cambiarEstado(c.id, 'vencido')} className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-800 text-white text-xs rounded-lg transition-colors">Vencido</button>}
                  <button onClick={() => eliminar(c.id)} className="px-3 py-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-500 hover:text-red-400 text-xs rounded-lg transition-colors">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Nuevo contrato</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título del contrato *</label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Servicio de community management 2025"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalle de los servicios incluidos..."
                  rows={3} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Monto total</label>
                  <input type="number" value={form.monto_total} onChange={e => setForm({ ...form, monto_total: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Moneda</label>
                  <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500">
                    <option>USD</option><option>ARS</option><option>EUR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha inicio</label>
                  <input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha vencimiento</label>
                  <input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estado</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500">
                  <option value="borrador">Borrador</option>
                  <option value="enviado">Enviado al cliente</option>
                  <option value="firmado">Firmado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notas internas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  rows={2} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !form.titulo.trim()}
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
