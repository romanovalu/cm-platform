'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

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
  prospecto_id: string
}

type Prospecto = { nombre: string; empresa: string | null }

export default function PresupuestoPublicoPage() {
  const { id } = useParams()
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [prospecto, setProspecto] = useState<Prospecto | null>(null)
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState<'aceptado' | 'rechazado' | null>(null)
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
      const { data: pro } = await supabase.from('prospectos').select('nombre, empresa').eq('id', pres.prospecto_id).single()
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin block"></span>
          Cargando propuesta...
        </div>
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">?</div>
          <h2 className="text-slate-800 font-bold text-xl mb-2">Propuesta no encontrada</h2>
          <p className="text-slate-500 text-sm">El link puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    )
  }

  if (finalizado) {
    const esAceptado = accion === 'aceptado'
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center max-w-md w-full">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold ${esAceptado ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
            {esAceptado ? '✓' : '✕'}
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${esAceptado ? 'text-emerald-700' : 'text-red-600'}`}>
            {esAceptado ? '¡Propuesta aceptada!' : 'Propuesta rechazada'}
          </h2>
          <p className="text-slate-500 leading-relaxed">
            {esAceptado
              ? 'Perfecto. Nos pondremos en contacto muy pronto para arrancar con el trabajo. ¡Gracias por elegirnos!'
              : 'Recibimos tu respuesta. Si querés ajustar algún punto de la propuesta, podemos hablar.'}
          </p>
        </div>
      </div>
    )
  }

  const monedaSimbolo = presupuesto.moneda === 'ARS' ? '$' : presupuesto.moneda === 'EUR' ? '€' : 'U$D '
  const fmtNum = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0 })
  const fmtFecha = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

  const vencida = presupuesto.validez ? new Date(presupuesto.validez) < new Date() : false

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra superior */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Propuesta comercial</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">{fmtFecha(presupuesto.created_at)}</span>
            </div>
            <h1 className="text-slate-900 font-bold text-2xl leading-tight">{presupuesto.titulo}</h1>
          </div>
          {presupuesto.validez && (
            <div className={`text-right text-xs px-3 py-2 rounded-xl ${vencida ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
              <p className="font-semibold">{vencida ? 'Propuesta vencida' : 'Válida hasta'}</p>
              <p>{fmtFecha(presupuesto.validez)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Para quién */}
        {prospecto && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Preparada para</p>
              <p className="text-slate-900 font-bold text-lg">{prospecto.nombre}</p>
              {prospecto.empresa && <p className="text-slate-500 text-sm">{prospecto.empresa}</p>}
            </div>
            {presupuesto.duracion && (
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Duración</p>
                <p className="text-slate-700 font-semibold">{presupuesto.duracion}</p>
              </div>
            )}
          </div>
        )}

        {/* Servicios */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-slate-900 font-bold">Servicios incluidos</h2>
            <span className="text-xs text-slate-400">{presupuesto.items.length} servicio{presupuesto.items.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {(presupuesto.items as Servicio[]).map((sv, i) => (
              <div key={i} className="px-6 py-5 flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-600 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-slate-900 font-semibold">{sv.nombre}</p>
                  </div>
                  {sv.detalle && (
                    <p className="text-slate-500 text-sm leading-relaxed mt-2 ml-8 whitespace-pre-line">{sv.detalle}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400 mb-0.5">por mes</p>
                  <p className="text-slate-900 font-bold text-lg">{monedaSimbolo}{fmtNum(sv.precio)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-5 space-y-3">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{monedaSimbolo}{fmtNum(presupuesto.subtotal)}</span>
            </div>
            {presupuesto.descuento > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Descuento ({presupuesto.descuento}%)</span>
                <span>- {monedaSimbolo}{fmtNum(presupuesto.subtotal * presupuesto.descuento / 100)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <div>
                <p className="text-slate-900 font-bold text-lg">Total mensual</p>
                {presupuesto.duracion && <p className="text-slate-400 text-xs">{presupuesto.duracion}</p>}
              </div>
              <div className="text-right">
                <p className="text-violet-700 font-black text-3xl">{monedaSimbolo}{fmtNum(presupuesto.total)}</p>
                <p className="text-slate-400 text-xs">+ IVA si corresponde</p>
              </div>
            </div>
          </div>
        </div>

        {/* Condiciones en 2 columnas */}
        {(presupuesto.modalidad_pago || presupuesto.metodo_pago) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
            <h2 className="text-slate-900 font-bold mb-4">Condiciones de contratación</h2>
            <div className="grid grid-cols-2 gap-4">
              {presupuesto.modalidad_pago && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Forma de pago</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{presupuesto.modalidad_pago}</p>
                </div>
              )}
              {presupuesto.metodo_pago && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Método de pago</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{presupuesto.metodo_pago}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Qué no incluye */}
        {presupuesto.no_incluye && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-500 text-lg">⚠</span>
              <h2 className="text-slate-800 font-bold">Esta propuesta NO incluye</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{presupuesto.no_incluye}</p>
          </div>
        )}

        {/* Próximos pasos */}
        {presupuesto.proximos_pasos && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
            <h2 className="text-slate-900 font-bold mb-3">Próximos pasos</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{presupuesto.proximos_pasos}</p>
          </div>
        )}

        {/* Notas */}
        {presupuesto.notas && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
            <h2 className="text-slate-900 font-bold mb-3">Notas adicionales</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{presupuesto.notas}</p>
          </div>
        )}

        {/* Acción */}
        {!vencida && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-6">
            <h2 className="text-slate-900 font-bold mb-1">¿Qué decidís?</h2>
            <p className="text-slate-500 text-sm mb-5">Tu respuesta queda registrada y nos notifica automáticamente.</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => setAccion('aceptado')}
                className={`py-4 rounded-xl font-semibold text-sm transition-all border-2 ${
                  accion === 'aceptado'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                }`}>
                <span className="block text-xl mb-1">{accion === 'aceptado' ? '✓' : '👍'}</span>
                Acepto la propuesta
              </button>
              <button onClick={() => setAccion('rechazado')}
                className={`py-4 rounded-xl font-semibold text-sm transition-all border-2 ${
                  accion === 'rechazado'
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}>
                <span className="block text-xl mb-1">{accion === 'rechazado' ? '✕' : '🤔'}</span>
                Por ahora no
              </button>
            </div>

            {accion && (
              <button onClick={confirmar} disabled={enviando}
                className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all ${
                  accion === 'aceptado'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                    : 'bg-slate-700 hover:bg-slate-800'
                } disabled:opacity-50`}>
                {enviando ? 'Enviando respuesta...' : accion === 'aceptado' ? '¡Confirmar! Acepto esta propuesta' : 'Confirmar: no me interesa por ahora'}
              </button>
            )}
          </div>
        )}

        {vencida && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-5 text-center">
            <p className="text-red-600 font-semibold mb-1">Esta propuesta ya venció</p>
            <p className="text-slate-500 text-sm">Contactanos para recibir una propuesta actualizada.</p>
          </div>
        )}

        <p className="text-center text-slate-400 text-xs pb-6">
          Propuesta generada con Orbit · Plataforma para community managers
        </p>
      </div>
    </div>
  )
}
