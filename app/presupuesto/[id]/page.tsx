'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type Item = { descripcion: string; cantidad: number; precio: number }

type Presupuesto = {
  id: string
  titulo: string
  items: Item[]
  subtotal: number
  descuento: number
  total: number
  moneda: string
  validez: string | null
  notas: string | null
  estado: 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
  created_at: string
  prospecto_id: string
}

type Prospecto = {
  nombre: string
  empresa: string
  user_id: string
}

export default function PresupuestoPublicoPage() {
  const { id } = useParams()
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [prospecto, setProspecto] = useState<Prospecto | null>(null)
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState<'aceptado' | 'rechazado' | null>(null)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      const { data: pres } = await supabase.from('presupuestos').select('*').eq('id', id).single()
      if (!pres) { setLoading(false); return }
      setPresupuesto(pres)
      if (pres.estado === 'aceptado' || pres.estado === 'rechazado') {
        setFinalizado(true)
        setAccion(pres.estado)
      }
      const { data: pro } = await supabase.from('prospectos').select('nombre, empresa, user_id').eq('id', pres.prospecto_id).single()
      if (pro) setProspecto(pro)
      setLoading(false)
    }
    cargar()
  }, [id])

  const confirmar = async () => {
    if (!accion) return
    setEnviando(true)
    await supabase.from('presupuestos').update({ estado: accion }).eq('id', id)
    setFinalizado(true)
    setEnviando(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Cargando presupuesto...</p>
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-gray-800 font-bold text-xl mb-2">Presupuesto no encontrado</h2>
          <p className="text-gray-500">El link puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    )
  }

  if (finalizado) {
    const esAceptado = accion === 'aceptado'
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm p-10 text-center max-w-md w-full">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${esAceptado ? 'bg-green-100' : 'bg-red-50'}`}>
            <span className="text-4xl">{esAceptado ? '✓' : '✕'}</span>
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${esAceptado ? 'text-green-700' : 'text-red-600'}`}>
            {esAceptado ? '¡Presupuesto aceptado!' : 'Presupuesto rechazado'}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {esAceptado
              ? 'Perfecto. Nos pondremos en contacto muy pronto para arrancar con el trabajo.'
              : 'Recibimos tu respuesta. Podemos hablar para ajustar la propuesta si querés.'}
          </p>
        </div>
      </div>
    )
  }

  const monedaSimbolo = presupuesto.moneda === 'ARS' ? '$' : presupuesto.moneda === 'EUR' ? '€' : 'USD '
  const formatNum = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0 })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">Presupuesto profesional</p>
            <h1 className="text-gray-900 font-bold text-xl">{presupuesto.titulo}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{new Date(presupuesto.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {presupuesto.validez && (
              <p className="text-xs text-orange-500 mt-0.5">
                Válido hasta: {new Date(presupuesto.validez).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Para */}
        {prospecto && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Para</p>
            <p className="text-gray-900 font-semibold text-lg">{prospecto.nombre}</p>
            {prospecto.empresa && <p className="text-gray-500">{prospecto.empresa}</p>}
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-gray-900 font-semibold">Detalle de servicios</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Descripción</th>
                <th className="text-center px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Cant.</th>
                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Precio</th>
                <th className="text-right px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {(presupuesto.items as Item[]).map((item, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-6 py-4 text-gray-800">{item.descripcion}</td>
                  <td className="px-4 py-4 text-center text-gray-500">{item.cantidad}</td>
                  <td className="px-4 py-4 text-right text-gray-500">{monedaSimbolo}{formatNum(item.precio)}</td>
                  <td className="px-6 py-4 text-right text-gray-800 font-medium">{monedaSimbolo}{formatNum(item.cantidad * item.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{monedaSimbolo}{formatNum(presupuesto.subtotal)}</span>
            </div>
            {presupuesto.descuento > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento ({presupuesto.descuento}%)</span>
                <span>-{monedaSimbolo}{formatNum(presupuesto.subtotal * presupuesto.descuento / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{monedaSimbolo}{formatNum(presupuesto.total)}</span>
            </div>
          </div>
        </div>

        {/* Notas / condiciones */}
        {presupuesto.notas && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Condiciones y notas</p>
            <p className="text-gray-600 text-sm leading-relaxed">{presupuesto.notas}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-gray-900 font-semibold mb-2">Tu respuesta</h3>
          <p className="text-gray-500 text-sm mb-5">¿Qué decisión tomás con este presupuesto?</p>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setAccion('aceptado')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                accion === 'aceptado'
                  ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}>
              ✓ Acepto el presupuesto
            </button>
            <button
              onClick={() => setAccion('rechazado')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                accion === 'rechazado'
                  ? 'bg-red-500 text-white ring-2 ring-red-500 ring-offset-2'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}>
              ✕ No me interesa
            </button>
          </div>

          {accion && (
            <button
              onClick={confirmar}
              disabled={enviando}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-colors ${
                accion === 'aceptado' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50`}>
              {enviando ? 'Enviando...' : `Confirmar: ${accion === 'aceptado' ? 'Acepto' : 'No me interesa'}`}
            </button>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs pb-4">
          Presupuesto generado con Orbit · Sistema de gestión para community managers
        </p>
      </div>
    </div>
  )
}
