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

type Servicio = { nombre: string; detalle: string; precio: number }

type Presupuesto = {
  id: string
  titulo: string
  items: Servicio[]
  subtotal: number
  descuento: number
  total: number
  moneda: string
  validez: string | null
  notas: string | null
  duracion: string | null
  modalidad_pago: string | null
  metodo_pago: string | null
  no_incluye: string | null
  proximos_pasos: string | null
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

const SERVICIO_VACIO: Servicio = { nombre: '', detalle: '', precio: 0 }

const FORM_VACIO = {
  titulo: '',
  moneda: 'ARS',
  descuento: 0,
  validez: '',
  notas: '',
  duracion: '',
  modalidad_pago: 'Pago adelantado al inicio de cada mes',
  metodo_pago: 'Transferencia bancaria / Mercado Pago',
  no_incluye: '',
  proximos_pasos: 'Una vez aceptada la propuesta, coordinamos una reunión de inicio para definir el plan de contenido del primer mes.',
  servicios: [{ ...SERVICIO_VACIO }] as Servicio[],
}

export default function ProspectoDetallePage() {
  const { id } = useParams()
  const [prospecto, setProspecto] = useState<Prospecto | null>(null)
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editandoPresId, setEditandoPresId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)
  const [editandoEstado, setEditandoEstado] = useState(false)
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState(FORM_VACIO)
  const [modalEditar, setModalEditar] = useState(false)
  const [formEditar, setFormEditar] = useState({ nombre: '', empresa: '', email: '', telefono: '', industria: '', origen: '', notas: '' })
  const [guardandoEditar, setGuardandoEditar] = useState(false)

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

  const subtotal = form.servicios.reduce((s, sv) => s + sv.precio, 0)
  const total = subtotal - (subtotal * form.descuento / 100)

  const setServicio = (i: number, campo: keyof Servicio, valor: string | number) => {
    const servicios = [...form.servicios]
    servicios[i] = { ...servicios[i], [campo]: valor }
    setForm({ ...form, servicios })
  }

  const addServicio = () => setForm({ ...form, servicios: [...form.servicios, { ...SERVICIO_VACIO }] })
  const removeServicio = (i: number) => setForm({ ...form, servicios: form.servicios.filter((_, idx) => idx !== i) })

  const abrirModal = () => { setForm(FORM_VACIO); setEditandoPresId(null); setPaso(1); setModal(true) }
  const cerrarModal = () => { setModal(false); setPaso(1); setEditandoPresId(null) }

  const abrirEditarPres = (p: Presupuesto) => {
    setForm({
      titulo: p.titulo,
      moneda: p.moneda,
      descuento: p.descuento,
      validez: p.validez || '',
      notas: p.notas || '',
      duracion: p.duracion || '',
      modalidad_pago: p.modalidad_pago || '',
      metodo_pago: p.metodo_pago || '',
      no_incluye: p.no_incluye || '',
      proximos_pasos: p.proximos_pasos || '',
      servicios: (p.items as Servicio[]).length > 0 ? (p.items as Servicio[]) : [{ ...SERVICIO_VACIO }],
    })
    setEditandoPresId(p.id)
    setPaso(1)
    setModal(true)
  }

  const guardarPresupuesto = async () => {
    if (!form.titulo.trim() || form.servicios.some(s => !s.nombre.trim())) return
    setGuardando(true)
    const payload = {
      titulo: form.titulo,
      items: form.servicios,
      subtotal,
      descuento: form.descuento,
      total,
      moneda: form.moneda,
      validez: form.validez || null,
      notas: form.notas || null,
      duracion: form.duracion || null,
      modalidad_pago: form.modalidad_pago || null,
      metodo_pago: form.metodo_pago || null,
      no_incluye: form.no_incluye || null,
      proximos_pasos: form.proximos_pasos || null,
    }
    if (editandoPresId) {
      await supabase.from('presupuestos').update(payload).eq('id', editandoPresId)
    } else {
      await supabase.from('presupuestos').insert({ ...payload, prospecto_id: id, estado: 'borrador' })
    }
    setModal(false)
    setPaso(1)
    setEditandoPresId(null)
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
      moneda: 'ARS',
      retainer: 0,
    })
    await cambiarEstadoPro('ganado')
    window.location.href = '/dashboard'
  }

  const abrirEditar = () => {
    if (!prospecto) return
    setFormEditar({
      nombre: prospecto.nombre,
      empresa: prospecto.empresa || '',
      email: prospecto.email || '',
      telefono: prospecto.telefono || '',
      industria: prospecto.industria || '',
      origen: prospecto.origen || '',
      notas: prospecto.notas || '',
    })
    setModalEditar(true)
  }

  const guardarEditar = async () => {
    if (!formEditar.nombre.trim()) return
    setGuardandoEditar(true)
    await supabase.from('prospectos').update(formEditar).eq('id', id)
    setProspecto(prev => prev ? { ...prev, ...formEditar } : prev)
    setModalEditar(false)
    setGuardandoEditar(false)
  }

  const eliminar = async (presId: string) => {
    if (!confirm('¿Eliminar esta propuesta?')) return
    await supabase.from('presupuestos').delete().eq('id', presId)
    await recargarPresupuestos()
  }

  const pasoValido = () => {
    if (paso === 1) return form.titulo.trim().length > 0 && form.servicios.every(s => s.nombre.trim().length > 0)
    return true
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
            <button onClick={convertirACliente} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
              ✓ Convertir en cliente
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-white font-bold">Información del prospecto</h3>
            <div className="flex items-center gap-2">
              <button onClick={abrirEditar} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">
                Editar
              </button>
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

        {/* Propuestas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Propuestas comerciales</h3>
            <button onClick={abrirModal} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
              + Nueva propuesta
            </button>
          </div>

          {presupuestos.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-10 text-center">
              <p className="text-3xl mb-3">📄</p>
              <p className="text-white font-medium mb-2">Sin propuestas todavía</p>
              <p className="text-gray-400 text-sm mb-5">Creá una propuesta profesional para enviarle al prospecto</p>
              <button onClick={abrirModal} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                + Crear propuesta
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
                        {p.validez && <span className="text-gray-500 text-xs">· Válida hasta {new Date(p.validez).toLocaleDateString('es-AR')}</span>}
                      </div>
                      <p className="text-white font-bold text-lg">{p.titulo}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {(p.items as Servicio[]).length} servicio{(p.items as Servicio[]).length !== 1 ? 's' : ''} ·
                        Total: <span className="text-white font-semibold"> {p.moneda} {p.total.toLocaleString('es-AR')}</span>
                      </p>
                      {p.duracion && <p className="text-gray-500 text-xs mt-1">Duración: {p.duracion}</p>}
                    </div>
                    <div className="flex flex-col gap-2 ml-4 min-w-[100px]">
                      <button onClick={() => copiarLink(p.id)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition-colors text-center">
                        {linkCopiado === p.id ? '✓ Copiado' : '🔗 Link'}
                      </button>
                      {p.estado === 'borrador' && (
                        <button onClick={() => cambiarEstadoPres(p.id, 'enviado')} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs rounded-lg transition-colors text-center">Marcar enviada</button>
                      )}
                      {(p.estado === 'borrador' || p.estado === 'enviado') && (
                        <button onClick={() => cambiarEstadoPres(p.id, 'aceptado')} className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs rounded-lg transition-colors text-center">Aceptada</button>
                      )}
                      <button onClick={() => abrirEditarPres(p)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors text-center">Editar</button>
                      <button onClick={() => eliminar(p.id)} className="px-3 py-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-500 hover:text-red-400 text-xs rounded-lg transition-colors text-center">Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal propuesta — wizard 2 pasos */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col">
            {/* Header con pasos */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{editandoPresId ? 'Editar propuesta' : 'Nueva propuesta comercial'}</h3>
                <button onClick={cerrarModal} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="flex gap-2">
                {['Servicios y precios', 'Condiciones'].map((label, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${paso === i + 1 ? 'bg-violet-600 text-white' : paso > i + 1 ? 'bg-violet-900/40 text-violet-400' : 'bg-gray-800 text-gray-500'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${paso === i + 1 ? 'bg-white text-violet-600' : paso > i + 1 ? 'bg-violet-400 text-white' : 'bg-gray-700 text-gray-500'}`}>{paso > i + 1 ? '✓' : i + 1}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* PASO 1: Servicios */}
              {paso === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Título de la propuesta *</label>
                    <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                      placeholder="Ej: Propuesta de Community Management — Julio 2026"
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">Servicios incluidos *</label>
                    <div className="flex items-center gap-3">
                      <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}
                        className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:outline-none focus:border-violet-500">
                        <option>ARS</option><option>USD</option><option>EUR</option>
                      </select>
                      <button onClick={addServicio} className="text-violet-400 hover:text-violet-300 text-sm transition-colors">+ Agregar servicio</button>
                    </div>
                  </div>

                  {form.servicios.map((sv, i) => (
                    <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <input value={sv.nombre} onChange={e => setServicio(i, 'nombre', e.target.value)}
                          placeholder="Nombre del servicio (ej: Gestión de Instagram)"
                          className="flex-1 px-3 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-violet-500 text-sm font-medium" />
                        <div className="flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5">
                          <span className="text-gray-400 text-sm">{form.moneda}</span>
                          <input type="number" min="0" value={sv.precio} onChange={e => setServicio(i, 'precio', Number(e.target.value))}
                            placeholder="0"
                            className="w-24 bg-transparent text-white text-sm text-right focus:outline-none" />
                        </div>
                        <button onClick={() => removeServicio(i)} disabled={form.servicios.length === 1}
                          className="text-gray-600 hover:text-red-400 text-lg transition-colors disabled:opacity-20">✕</button>
                      </div>
                      <textarea value={sv.detalle} onChange={e => setServicio(i, 'detalle', e.target.value)}
                        rows={3} placeholder="Describí qué incluye este servicio (ej: 3 publicaciones semanales, diseño de contenido, respuesta a comentarios, informe mensual...)"
                        className="w-full px-3 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none" />
                    </div>
                  ))}

                  {/* Totales */}
                  <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Subtotal mensual</span>
                      <span className="text-white">{form.moneda} {subtotal.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Descuento (%)</span>
                      <input type="number" min="0" max="100" value={form.descuento}
                        onChange={e => setForm({ ...form, descuento: Number(e.target.value) })}
                        className="w-20 px-3 py-1 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none text-sm text-right" />
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-700 pt-2">
                      <span className="text-white">Total</span>
                      <span className="text-violet-300 text-lg">{form.moneda} {total.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Duración del servicio</label>
                      <input value={form.duracion} onChange={e => setForm({ ...form, duracion: e.target.value })}
                        placeholder="Ej: 3 meses, Mensual sin plazo mínimo"
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Válida hasta</label>
                      <input type="date" value={form.validez} onChange={e => setForm({ ...form, validez: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: Condiciones */}
              {paso === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Forma de pago</label>
                    <input value={form.modalidad_pago} onChange={e => setForm({ ...form, modalidad_pago: e.target.value })}
                      placeholder="Ej: Pago adelantado al inicio de cada mes"
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Método de pago</label>
                    <input value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })}
                      placeholder="Ej: Transferencia bancaria / Mercado Pago"
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Qué NO incluye esta propuesta</label>
                    <textarea value={form.no_incluye} onChange={e => setForm({ ...form, no_incluye: e.target.value })}
                      rows={3} placeholder="Ej: Pauta publicitaria (inversión aparte), diseño de logo, fotografía profesional..."
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Próximos pasos</label>
                    <textarea value={form.proximos_pasos} onChange={e => setForm({ ...form, proximos_pasos: e.target.value })}
                      rows={3} placeholder="Ej: Una vez aceptada la propuesta, coordinamos una reunión de inicio..."
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Notas adicionales</label>
                    <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                      rows={2} placeholder="Cualquier aclaración extra..."
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => paso === 1 ? cerrarModal() : setPaso(1)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
                {paso === 1 ? 'Cancelar' : '← Atrás'}
              </button>
              {paso === 1 ? (
                <button onClick={() => setPaso(2)} disabled={!pasoValido()}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  Continuar →
                </button>
              ) : (
                <button onClick={guardarPresupuesto} disabled={guardando}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {guardando ? 'Guardando...' : editandoPresId ? 'Guardar cambios' : 'Guardar propuesta'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal editar prospecto */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Editar prospecto</h3>
              <button onClick={() => setModalEditar(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                <input value={formEditar.nombre} onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Empresa</label>
                <input value={formEditar.empresa} onChange={e => setFormEditar({ ...formEditar, empresa: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={formEditar.email} onChange={e => setFormEditar({ ...formEditar, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                  <input value={formEditar.telefono} onChange={e => setFormEditar({ ...formEditar, telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Industria</label>
                  <input value={formEditar.industria} onChange={e => setFormEditar({ ...formEditar, industria: e.target.value })}
                    placeholder="Gastronomía, Moda..."
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Origen</label>
                  <input value={formEditar.origen} onChange={e => setFormEditar({ ...formEditar, origen: e.target.value })}
                    placeholder="Instagram, referido, web..."
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notas</label>
                <textarea value={formEditar.notas} onChange={e => setFormEditar({ ...formEditar, notas: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModalEditar(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardarEditar} disabled={guardandoEditar || !formEditar.nombre.trim()}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                {guardandoEditar ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
