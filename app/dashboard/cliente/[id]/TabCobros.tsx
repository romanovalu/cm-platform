'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Cobro = {
  id: string
  concepto: string
  monto: number
  moneda: string
  estado: 'enviada' | 'pagado' | 'vencido'
  fecha_emision: string
  fecha_vencimiento: string
  notas: string
  comprobante_url: string
}

const estadoColor = {
  enviada: 'bg-yellow-500/20 text-yellow-400',
  pagado: 'bg-green-500/20 text-green-400',
  vencido: 'bg-red-500/20 text-red-400',
}

export default function TabCobros({ clienteId, retainer, moneda }: { clienteId: string, retainer: number, moneda: string }) {
  const [cobros, setCobros] = useState<Cobro[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    concepto: 'Retainer mensual',
    monto: retainer?.toString() || '',
    moneda: moneda || 'USD',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    notas: '',
  })

  const cargar = async () => {
    const { data } = await supabase.from('cobros').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
    if (data) setCobros(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [clienteId])

  const guardar = async () => {
    if (!form.concepto.trim() || !form.monto) return
    setGuardando(true)
    await supabase.from('cobros').insert({ ...form, cliente_id: clienteId, monto: Number(form.monto), estado: 'enviada' })
    setForm({ concepto: 'Retainer mensual', monto: retainer?.toString() || '', moneda: moneda || 'USD', fecha_emision: new Date().toISOString().split('T')[0], fecha_vencimiento: '', notas: '' })
    setModalAbierto(false)
    setGuardando(false)
    await cargar()
  }

  const cambiarEstado = async (id: string, estado: Cobro['estado']) => {
    await supabase.from('cobros').update({ estado }).eq('id', id)
    const { data: todos } = await supabase.from('cobros').select('estado').eq('cliente_id', clienteId)
    if (todos) {
      const lista = todos.map(c => c.estado === id ? estado : c.estado)
      let pagocliente: 'pagado' | 'pendiente' | 'vencido' = 'pendiente'
      if (lista.some(e => e === 'vencido')) pagocliente = 'vencido'
      else if (lista.length > 0 && lista.every(e => e === 'pagado')) pagocliente = 'pagado'
      await supabase.from('clientes').update({ pago: pagocliente }).eq('id', clienteId)
    }
    await cargar()
  }

  const total = cobros.filter(c => c.estado === 'pagado').reduce((sum, c) => sum + c.monto, 0)
  const pendiente = cobros.filter(c => c.estado !== 'pagado').reduce((sum, c) => sum + c.monto, 0)

  if (loading) return <div className="text-gray-400 text-center py-12">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">Total cobrado</p>
          <p className="text-green-400 text-xl font-bold">{moneda} {total.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">Pendiente de cobro</p>
          <p className="text-yellow-400 text-xl font-bold">{moneda} {pendiente.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">Facturas totales</p>
          <p className="text-white text-xl font-bold">{cobros.length}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end">
        <button onClick={() => setModalAbierto(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
          + Nueva factura
        </button>
      </div>

      {/* Lista */}
      {cobros.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center">
          <p className="text-3xl mb-3">💳</p>
          <h4 className="text-white font-medium mb-2">Sin facturas todavía</h4>
          <p className="text-gray-400 text-sm mb-5">Registrá el primer cobro de este cliente</p>
          <button onClick={() => setModalAbierto(true)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
            + Nueva factura
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cobros.map(cobro => (
            <div key={cobro.id} className="bg-gray-900 rounded-xl p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[cobro.estado]}`}>
                    {cobro.estado.charAt(0).toUpperCase() + cobro.estado.slice(1)}
                  </span>
                  <span className="text-gray-500 text-xs">{new Date(cobro.fecha_emision).toLocaleDateString('es-AR')}</span>
                  {cobro.fecha_vencimiento && <span className="text-gray-500 text-xs">Vence: {new Date(cobro.fecha_vencimiento).toLocaleDateString('es-AR')}</span>}
                </div>
                <p className="text-white font-medium">{cobro.concepto}</p>
                {cobro.notas && <p className="text-gray-400 text-sm mt-1">{cobro.notas}</p>}
              </div>
              <div className="flex items-center gap-4 ml-4">
                <p className="text-white font-bold">{cobro.moneda} {cobro.monto.toLocaleString()}</p>
                <div className="flex gap-2">
                  {cobro.estado !== 'pagado' && (
                    <button onClick={() => cambiarEstado(cobro.id, 'pagado')}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors">
                      Marcar pagado
                    </button>
                  )}
                  {cobro.estado === 'enviada' && (
                    <button onClick={() => cambiarEstado(cobro.id, 'vencido')}
                      className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-xs rounded-lg transition-colors">
                      Vencida
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Nueva factura</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Concepto</label>
                <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Monto</label>
                  <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })}
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
                  <label className="block text-sm text-gray-400 mb-1">Fecha emisión</label>
                  <input type="date" value={form.fecha_emision} onChange={e => setForm({ ...form, fecha_emision: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha vencimiento</label>
                  <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  rows={2} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModalAbierto(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={guardando}
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
