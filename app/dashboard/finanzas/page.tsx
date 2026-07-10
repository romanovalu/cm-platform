'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Cobro = { id: string; monto: number; moneda: string; estado: string; fecha_emision: string; concepto: string }
type Gasto = { id: string; concepto: string; categoria: string; monto: number; moneda: string; recurrente: boolean; fecha: string }

const CATEGORIAS = ['Herramientas', 'Publicidad', 'Diseño', 'Capacitación', 'Impuestos', 'Suscripciones', 'Otros']

export default function FinanzasPage() {
  const [cobros, setCobros] = useState<Cobro[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [tab, setTab] = useState<'resumen' | 'ingresos' | 'gastos'>('resumen')
  const [loading, setLoading] = useState(true)
  const [modalGasto, setModalGasto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ concepto: '', categoria: 'Herramientas', monto: '', moneda: 'USD', recurrente: false, fecha: new Date().toISOString().split('T')[0] })

  const cargar = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/'; return }

    const [{ data: c }, { data: g }] = await Promise.all([
      supabase.from('cobros').select('id,monto,moneda,estado,fecha_emision,concepto').eq('estado', 'pagado').order('fecha_emision', { ascending: false }),
      supabase.from('gastos').select('*').order('fecha', { ascending: false }),
    ])
    if (c) setCobros(c)
    if (g) setGastos(g)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardarGasto = async () => {
    if (!form.concepto.trim() || !form.monto) return
    setGuardando(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('gastos').insert({ ...form, monto: Number(form.monto), user_id: session!.user.id })
    setForm({ concepto: '', categoria: 'Herramientas', monto: '', moneda: 'USD', recurrente: false, fecha: new Date().toISOString().split('T')[0] })
    setModalGasto(false)
    setGuardando(false)
    await cargar()
  }

  const eliminarGasto = async (id: string) => {
    await supabase.from('gastos').delete().eq('id', id)
    await cargar()
  }

  const totalIngresos = cobros.reduce((s, c) => s + c.monto, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
  const margen = totalIngresos - totalGastos
  const porcentajeMargen = totalIngresos > 0 ? Math.round((margen / totalIngresos) * 100) : 0

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/dashboard'} className="text-gray-400 hover:text-white transition-colors text-sm">← Dashboard</button>
          <span className="text-gray-700">|</span>
          <h1 className="text-white font-bold">Mis Finanzas</h1>
        </div>
      </header>

      <div className="bg-gray-900 border-b border-gray-800 px-6">
        <div className="flex gap-0 max-w-5xl mx-auto">
          {[{ key: 'resumen', label: 'Resumen' }, { key: 'ingresos', label: 'Ingresos' }, { key: 'gastos', label: 'Gastos' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* RESUMEN */}
        {tab === 'resumen' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-gray-400 text-xs mb-1">Ingresos cobrados</p>
                <p className="text-green-400 text-2xl font-bold">USD {totalIngresos.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-gray-400 text-xs mb-1">Total gastos</p>
                <p className="text-red-400 text-2xl font-bold">USD {totalGastos.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-gray-400 text-xs mb-1">Ganancia neta</p>
                <p className={`text-2xl font-bold ${margen >= 0 ? 'text-white' : 'text-red-400'}`}>USD {margen.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-gray-400 text-xs mb-1">Margen</p>
                <p className={`text-2xl font-bold ${porcentajeMargen >= 50 ? 'text-green-400' : porcentajeMargen >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>{porcentajeMargen}%</p>
              </div>
            </div>

            {/* Gastos por categoría */}
            {gastos.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Gastos por categoría</h3>
                <div className="space-y-3">
                  {CATEGORIAS.map(cat => {
                    const total = gastos.filter(g => g.categoria === cat).reduce((s, g) => s + g.monto, 0)
                    if (total === 0) return null
                    const pct = totalGastos > 0 ? Math.round((total / totalGastos) * 100) : 0
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{cat}</span>
                          <span className="text-white font-medium">USD {total.toLocaleString()} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setTab('ingresos')} className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 text-left transition-colors">
                <p className="text-2xl mb-2">💰</p>
                <p className="text-white font-medium">Ver ingresos</p>
                <p className="text-gray-400 text-sm mt-1">{cobros.length} pagos recibidos</p>
              </button>
              <button onClick={() => setTab('gastos')} className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 text-left transition-colors">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-white font-medium">Ver gastos</p>
                <p className="text-gray-400 text-sm mt-1">{gastos.length} gastos registrados</p>
              </button>
            </div>
          </div>
        )}

        {/* INGRESOS */}
        {tab === 'ingresos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Ingresos cobrados</h3>
                <p className="text-gray-400 text-sm">Cobros marcados como pagados en todos tus clientes</p>
              </div>
            </div>
            {cobros.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl p-12 text-center">
                <p className="text-3xl mb-3">💰</p>
                <p className="text-white font-medium">Sin ingresos todavía</p>
                <p className="text-gray-400 text-sm mt-2">Cuando marques un cobro como pagado aparecerá aquí</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cobros.map(c => (
                  <div key={c.id} className="bg-gray-900 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{c.concepto}</p>
                      <p className="text-gray-500 text-sm">{new Date(c.fecha_emision).toLocaleDateString('es-AR')}</p>
                    </div>
                    <p className="text-green-400 font-bold">{c.moneda} {c.monto.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GASTOS */}
        {tab === 'gastos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Mis gastos</h3>
                <p className="text-gray-400 text-sm">Herramientas, suscripciones y costos de operación</p>
              </div>
              <button onClick={() => setModalGasto(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                + Nuevo gasto
              </button>
            </div>

            {gastos.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl p-12 text-center">
                <p className="text-3xl mb-3">📊</p>
                <p className="text-white font-medium">Sin gastos registrados</p>
                <p className="text-gray-400 text-sm mt-2 mb-5">Registrá tus gastos para calcular tu ganancia real</p>
                <button onClick={() => setModalGasto(true)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  + Nuevo gasto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {gastos.map(g => (
                  <div key={g.id} className="bg-gray-900 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">{g.categoria}</span>
                        {g.recurrente && <span className="px-2 py-0.5 bg-violet-600/20 text-violet-400 rounded-full text-xs">Recurrente</span>}
                        <span className="text-gray-500 text-xs">{new Date(g.fecha).toLocaleDateString('es-AR')}</span>
                      </div>
                      <p className="text-white font-medium">{g.concepto}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-red-400 font-bold">{g.moneda} {g.monto.toLocaleString()}</p>
                      <button onClick={() => eliminarGasto(g.id)} className="text-gray-600 hover:text-red-400 text-sm transition-colors">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Gasto */}
      {modalGasto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Nuevo gasto</h3>
              <button onClick={() => setModalGasto(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Concepto</label>
                <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })}
                  placeholder="Ej: Canva Pro, Buffer..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500">
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
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
              <div>
                <label className="block text-sm text-gray-400 mb-1">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl">
                <input type="checkbox" id="recurrente" checked={form.recurrente} onChange={e => setForm({ ...form, recurrente: e.target.checked })}
                  className="w-4 h-4 accent-violet-500" />
                <label htmlFor="recurrente" className="text-gray-300 text-sm">Gasto mensual recurrente</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModalGasto(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardarGasto} disabled={guardando}
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
