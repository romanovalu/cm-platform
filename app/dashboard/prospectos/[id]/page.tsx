'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Prospecto = {
  id: string
  nombre: string
  empresa: string
  email: string
  telefono: string
  industria: string
  estado: string
  origen: string
  notas: string
}

type Item = { descripcion: string; cantidad: number; precio: number }

type Presupuesto = {
  id: string
  titulo: string
  items: Item[]
  subtotal: number
  descuento: number
  total: number
  moneda: string
  validez: string
  notas: string
  estado: 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
  created_at: string
}

const ESTADOS_P = [
  { key: 'nuevo',             label: 'Nuevo' },
  { key: 'contactado',        label: 'Contactado' },
  { key: 'propuesta_enviada', label: 'Propuesta enviada' },
  { key: 'negociacion',       label: 'Negociación' },
  { key: 'ganado',            label: 'Ganado' },
  { key: 'perdido',           label: 'Perdido' },
]

const estadoPresupColor: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-400',
  enviado:  'bg-blue-500/20 text-blue-400',
  aceptado: 'bg-green-500/20 text-green-400',
  rechazado:'bg-red-500/20 text-red-400',
}

const ITEM_VACIO: Item = { descripcion: '', cantidad: 1, precio: 0 }

export default function ProspectoDetallePage() {
  const { id } = useParams()
  const [prospecto, setProspecto] = useState<Prospecto | null>(null)
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)
  const [editandoEstado, setEditandoEstado] = useState(false)

  const [form, setForm] = useState({
    titulo: '',
    moneda: 'USD',
    descuento: 0,
    validez: '',
    notas: '',
    items: [{ ...ITEM_VACIO }] as Item[],
  })

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }
      const [{ data: pro }, { data: pres }] = await Promise.all([
        supabase.from('prospectos').select('*').eq('id', id).single(),
        supabase.from('presupuestos').select('*').eq('prospecto_id', id).order('created_at', { ascending: false }),
      ])
      if (pro) setProspecto(pro)
      if (pres) setPresupuestos(pres)
      setLoading(false)
    }
    cargar()
  }, [id])

  const recargarPresupuestos = async () => {
    const { data } = await supabase.from('presupuestos').select('*').eq('prospecto_id', id).order('created_at', { ascending: false })
    if (data) setPresupuestos(data)
  }

  const subtotal = form.items.reduce((s, it) => s + it.cantidad * it.precio, 0)
  const total = subtotal - (subtotal * form.descuento / 100)

  const setItem = (i: number, campo: keyof Item, valor: string | number) => {
    const items = [...form.items]
    items[i] = { ...items[i], [campo]: valor }
    setForm({ ...form, items })
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { ...ITEM_VACIO }] })
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const guardarPresupuesto = async () => {
    if (!form.titulo.trim() || form.items.some(it => !it.descripcion.trim())) return
    setGuardando(true)
    await supabase.from('presupuestos').insert({
      prospecto_id: id,
      titulo: form.titulo,
      items: form.items,
      subtotal,
      descuento: form.descuento,
      total,
      moneda: form.moneda,
      validez: form.validez || null,
      notas: form.notas,
      estado: 'borrador',
    })
    setForm({ titulo: '', moneda: 'USD', descuento: 0, validez: '', notas: '', items: [{ ...ITEM_VACIO }] })
    setModal(false)
    setGuardando(false)
    await recargarPresupuestos()
  }

  const copiarLink = (presId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/presupuesto/${presId}`)
    setLinkCopiado(presId)
    setTimeout(() => setLinkCopiado(null), 2000)
  }

  const cambiarEstadoPres = async (presId: string, estado: string) => {
    await supabase.from('presupuestos').update({ estado }).eq('id', presId)
    await recargarPresupuestos()
  }

  const cambiarEstadoPro = async (estado: string) => {
    await supabase.from('prospectos').update({ estado }).eq('id', id)
    setProspecto(prev => prev ? { ...prev, estado } : prev)
    setEditandoEstado(false)
  }

  const convertirACliente = async () => {
    if (!prospecto) return
    if (!confirm(`¿Convertir a ${prospecto.nombre} en cliente activo?`)) return
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('clientes').insert({
      user_id: session!.user.id,
      nombre: prospecto.nombre,
      empresa: prospecto.empresa,
      email: prospecto.email,
      telefono: prospecto.telefono,
      industria: prospecto.industria,
      estado: 'activo',
      pago: 'pendiente',
      moneda: 'USD',
      retainer: 0,
    })
    await cambiarEstadoPro('ganado')
    window.location.href = '/dashboard'
  }

  const eliminar = async (presId: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return
    await supabase.from('presupuestos').delete().eq('id', presId)
    await recargarPresupuestos()
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>
  if (!prospecto) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">No encontrado</p></div>

  const estadoActual = ESTADOS_P.find(e => e.key === prospecto.estado)

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/dashboard/prospectos'} className="text-gray-400 hover:text-white text-sm transition-colors">← Prospectos</button>
          <span className="text-gray-700">|</span>
          <h1 className="text-white font-bold">{prospecto.nombre}</h1>
          {prospecto.empresa && <span className="text-gray-400 text-sm">{prospecto.empresa}</span>}
        </div>
        <div className="flex items-center gap-3">
          {prospecto.estado !== 'ganado' && prospecto.estado !== 'perdido' && (
            <button onClick={convertirACliente}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
              ✓ Convertir en cliente
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info prospecto */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-white font-bold">Información del prospecto</h3>
            <div className="relative">
              <button onClick={() => setEditandoEstado(!editandoEstado)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  prospecto.estado === 'ganado' ? 'bg-green-500/20 text-green-400' :
                  prospecto.estado === 'perdido' ? 'bg-red-500/20 text-red-400' :
                  prospecto.estado === 'negociacion' ? 'bg-yellow-500/20 text-yellow-400' :
                  prospecto.estado === 'propuesta_enviada' ? 'bg-violet-500/20 text-violet-400' :
                  prospecto.estado === 'contactado' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                {estadoActual?.label} ▾
              </button>
              {editandoEstado && (
                <div className="absolute right-0 top-9 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 w-48 shadow-xl">
                  {ESTADOS_P.map(e => (
                    <button key={e.key} onClick={() => cambiarEstadoPro(e.key)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-700 transition-colors ${prospecto.estado === e.key ? 'text-violet-400 font-medium' : 'text-gray-300'}`}>
                      {e.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {prospecto.email && <div><span className="text-gray-500">Email: </span><span className="text-white">{prospecto.email}</span></div>}
            {prospecto.telefono && <div><span className="text-gray-500">Teléfono: </span><span className="text-white">{prospecto.telefono}</span></div>}
            {prospecto.industria && <div><span className="text-gray-500">Industria: </span><span className="text-white">{prospecto.industria}</span></div>}
            {prospecto.origen && <div><span className="text-gray-500">Origen: </span><span className="text-white">{prospecto.origen}</span></div>}
          </div>
          {prospecto.notas && (
            <div className="mt-4 p-4 bg-gray-800 rounded-xl">
              <p className="text-gray-500 text-xs mb-1">Notas</p>
              <p className="text-gray-300 text-sm">{prospecto.notas}</p>
            </div>
          )}
        </div>

        {/* Presupuestos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Presupuestos</h3>
            <button onClick={() => setModal(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
              + Nuevo presupuesto
            </button>
          </div>

          {presupuestos.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-10 text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-white font-medium mb-2">Sin presupuestos todavía</p>
              <p className="text-gray-400 text-sm mb-5">Creá el primer presupuesto para este prospecto</p>
              <button onClick={() => setModal(true)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                + Nuevo presupuesto
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {presupuestos.map(p => (
                <div key={p.id} className="bg-gray-900 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoPresupColor[p.estado]}`}>
                          {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                        </span>
                        <span className="text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString('es-AR')}</span>
                        {p.validez && <span className="text-gray-500 text-xs">Válido hasta: {new Date(p.validez).toLocaleDateString('es-AR')}</span>}
                      </div>
                      <p className="text-white font-bold text-lg">{p.titulo}</p>
                      <p className="text-gray-400 text-sm mt-1">{p.items.length} ítem{p.items.length !== 1 ? 's' : ''} · Total: <span className="text-white font-semibold">{p.moneda} {p.total.toLocaleString()}</span></p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button onClick={() => copiarLink(p.id)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition-colors text-center">
                        {linkCopiado === p.id ? '✓ Copiado' : '🔗 Link'}
                      </button>
                      {p.estado === 'borrador' && (
                        <button onClick={() => cambiarEstadoPres(p.id, 'enviado')} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs rounded-lg transition-colors">Enviado</button>
                      )}
                      {(p.estado === 'borrador' || p.estado === 'enviado') && (
                        <button onClick={() => cambiarEstadoPres(p.id, 'aceptado')} className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs rounded-lg transition-colors">Aceptado</button>
                      )}
                      <button onClick={() => eliminar(p.id)} className="px-3 py-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-500 hover:text-red-400 text-xs rounded-lg transition-colors">Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal presupuesto */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Nuevo presupuesto</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título *</label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Servicio de Community Management — Julio 2025"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400">Servicios / Ítems *</label>
                  <div className="flex items-center gap-3">
                    <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}
                      className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:outline-none focus:border-violet-500">
                      <option>USD</option><option>ARS</option><option>EUR</option>
                    </select>
                    <button onClick={addItem} className="text-violet-400 hover:text-violet-300 text-sm transition-colors">+ Agregar ítem</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-1">
                    <span className="col-span-6 text-xs text-gray-500">Descripción</span>
                    <span className="col-span-2 text-xs text-gray-500 text-center">Cant.</span>
                    <span className="col-span-3 text-xs text-gray-500 text-right">Precio unit.</span>
                    <span className="col-span-1"></span>
                  </div>
                  {form.items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={it.descripcion} onChange={e => setItem(i, 'descripcion', e.target.value)}
                        placeholder="Ej: Gestión Instagram"
                        className="col-span-6 px-3 py-2.5 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 text-sm" />
                      <input type="number" min="1" value={it.cantidad} onChange={e => setItem(i, 'cantidad', Number(e.target.value))}
                        className="col-span-2 px-3 py-2.5 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 text-sm text-center" />
                      <input type="number" min="0" value={it.precio} onChange={e => setItem(i, 'precio', Number(e.target.value))}
                        placeholder="0"
                        className="col-span-3 px-3 py-2.5 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 text-sm text-right" />
                      <button onClick={() => removeItem(i)} disabled={form.items.length === 1}
                        className="col-span-1 text-gray-600 hover:text-red-400 text-lg transition-colors disabled:opacity-20 text-center">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{form.moneda} {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Descuento (%)</span>
                  <input type="number" min="0" max="100" value={form.descuento}
                    onChange={e => setForm({ ...form, descuento: Number(e.target.value) })}
                    className="w-20 px-3 py-1 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none text-sm text-right" />
                </div>
                <div className="flex justify-between font-bold border-t border-gray-700 pt-2 mt-2">
                  <span className="text-white">Total</span>
                  <span className="text-violet-300 text-lg">{form.moneda} {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Válido hasta</label>
                  <input type="date" value={form.validez} onChange={e => setForm({ ...form, validez: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Condiciones / Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  rows={3} placeholder="Condiciones de pago, qué incluye, aclaraciones..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardarPresupuesto} disabled={guardando || !form.titulo.trim()}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar presupuesto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
