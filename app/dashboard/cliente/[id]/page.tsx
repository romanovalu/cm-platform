'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import TabOnboarding from './TabOnboarding'
import TabEstudio from './TabEstudio'
import TabCobros from './TabCobros'

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
}

const estadoColor = { activo: 'bg-green-500', pausado: 'bg-gray-500', revisar: 'bg-yellow-500' }
const pagoColor = { pagado: 'bg-green-500/20 text-green-400', pendiente: 'bg-yellow-500/20 text-yellow-400', vencido: 'bg-red-500/20 text-red-400' }

export default function ClientePage() {
  const { id } = useParams()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [pagoReal, setPagoReal] = useState<'pagado' | 'pendiente' | 'vencido'>('pendiente')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'resumen' | 'onboarding' | 'estudio' | 'cobros'>('resumen')

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }
      const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
      if (data) setCliente(data)
      const { data: cobros } = await supabase.from('cobros').select('estado').eq('cliente_id', id as string)
      if (cobros && cobros.length > 0) {
        const estados = cobros.map((c: { estado: string }) => c.estado)
        if (estados.some(e => e === 'vencido')) setPagoReal('vencido')
        else if (estados.every(e => e === 'pagado')) setPagoReal('pagado')
        else setPagoReal('pendiente')
      }
      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>
  if (!cliente) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Cliente no encontrado</p></div>

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/dashboard'} className="text-gray-400 hover:text-white transition-colors text-sm">← Mis clientes</button>
          <span className="text-gray-700">|</span>
          <h1 className="text-white font-bold">{cliente.nombre}</h1>
          {cliente.empresa && <span className="text-gray-400 text-sm">{cliente.empresa}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${estadoColor[cliente.estado]}`} />
          <span className="text-gray-300 text-sm capitalize">{cliente.estado}</span>
        </div>
      </header>

      <div className="bg-gray-900 border-b border-gray-800 px-6">
        <div className="flex gap-0">
          {[{ key: 'resumen', label: 'Resumen' }, { key: 'onboarding', label: 'Onboarding' }, { key: 'estudio', label: 'Estudio' }, { key: 'cobros', label: 'Cobros' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {tab === 'resumen' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-4">Información</h3>
                <div className="space-y-3">
                  {cliente.email && <div><p className="text-gray-500 text-xs">Email</p><p className="text-white text-sm">{cliente.email}</p></div>}
                  {cliente.telefono && <div><p className="text-gray-500 text-xs">Teléfono</p><p className="text-white text-sm">{cliente.telefono}</p></div>}
                  {cliente.industria && <div><p className="text-gray-500 text-xs">Industria</p><p className="text-white text-sm">{cliente.industria}</p></div>}
                </div>
              </div>
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-4">Facturación</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-500 text-xs">Retainer mensual</p>
                    <p className="text-white text-2xl font-bold">{cliente.retainer > 0 ? `${cliente.moneda} ${cliente.retainer.toLocaleString()}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Estado de pago</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${pagoColor[pagoReal]}`}>{pagoReal.charAt(0).toUpperCase() + pagoReal.slice(1)}</span>
                  </div>
                </div>
              </div>
            </div>
            {cliente.notas && (
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-3">Notas internas</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{cliente.notas}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {[{ key: 'onboarding', icon: '📋', label: 'Onboarding', sub: 'Brief y contrato' }, { key: 'estudio', icon: '🗓', label: 'Estudio', sub: 'Calendario de contenido' }, { key: 'cobros', icon: '💳', label: 'Cobros', sub: 'Historial de pagos' }].map(a => (
                <button key={a.key} onClick={() => setTab(a.key as typeof tab)} className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 text-left transition-colors">
                  <p className="text-2xl mb-2">{a.icon}</p>
                  <p className="text-white font-medium text-sm">{a.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{a.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'onboarding' && <TabOnboarding clienteId={id as string} />}
        {tab === 'estudio' && <TabEstudio clienteId={id as string} clienteNombre={cliente.nombre} />}
        {tab === 'cobros' && <TabCobros clienteId={id as string} retainer={cliente.retainer} moneda={cliente.moneda} />}
      </main>
    </div>
  )
}
