'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const TONOS = ['Profesional', 'Cercano y amigable', 'Divertido', 'Inspirador', 'Formal', 'Informativo']

export default function BriefPage() {
  const { clienteId } = useParams()
  const [cliente, setCliente] = useState<{ nombre: string; empresa: string } | null>(null)
  const [onboardingId, setOnboardingId] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    descripcion: '',
    publico_objetivo: '',
    tono_voz: '',
    colores: '',
    competidores: '',
    objetivos: '',
    que_no_hacer: '',
  })

  useEffect(() => {
    const cargar = async () => {
      const { data: cli } = await supabase.from('clientes').select('nombre, empresa').eq('id', clienteId as string).single()
      if (cli) setCliente(cli)

      const { data: ob } = await supabase.from('onboarding').select('*').eq('cliente_id', clienteId as string).single()
      if (ob) {
        setOnboardingId(ob.id)
        setForm({
          descripcion: ob.descripcion || '',
          publico_objetivo: ob.publico_objetivo || '',
          tono_voz: ob.tono_voz || '',
          colores: ob.colores || '',
          competidores: ob.competidores || '',
          objetivos: ob.objetivos || '',
          que_no_hacer: ob.que_no_hacer || '',
        })
      }
      setLoading(false)
    }
    cargar()
  }, [clienteId])

  const guardar = async () => {
    setGuardando(true)
    if (onboardingId) {
      await supabase.from('onboarding').update(form).eq('id', onboardingId)
    } else {
      await supabase.from('onboarding').insert({ ...form, cliente_id: clienteId })
    }
    setGuardando(false)
    setGuardado(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (guardado) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-white text-2xl font-bold mb-3">¡Brief enviado!</h2>
        <p className="text-gray-400 leading-relaxed">
          Tu community manager ya recibió la información de tu marca. En breve te va a contactar para empezar a trabajar.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <div>
              <h1 className="text-white font-bold">Brief de marca</h1>
              {cliente && <p className="text-gray-400 text-sm">{cliente.nombre}{cliente.empresa ? ` · ${cliente.empresa}` : ''}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-sm">
            Completá este formulario para que tu community manager conozca tu marca en profundidad. Toda la información es confidencial.
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-bold text-lg">Sobre tu negocio</h2>

          <div>
            <label className="block text-sm text-gray-300 font-medium mb-1">¿A qué se dedica tu negocio? *</label>
            <p className="text-gray-500 text-xs mb-2">Describí qué hacés, qué vendés y cuál es tu propuesta de valor</p>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Somos una veterinaria especializada en animales exóticos, brindamos consultas, cirugías y venta de alimentos especiales..."
              rows={4} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 font-medium mb-1">¿A quién le vendés?</label>
            <p className="text-gray-500 text-xs mb-2">Edad, género, intereses, dónde viven, qué les preocupa</p>
            <input value={form.publico_objetivo} onChange={e => setForm({ ...form, publico_objetivo: e.target.value })}
              placeholder="Ej: Personas de 25-45 años, CABA y GBA, amantes de las mascotas, profesionales..."
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 font-medium mb-2">¿Cómo querés que suene tu marca en redes?</label>
            <div className="flex flex-wrap gap-2">
              {TONOS.map(t => (
                <button key={t} onClick={() => setForm({ ...form, tono_voz: t })}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${form.tono_voz === t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-bold text-lg">Identidad visual</h2>

          <div>
            <label className="block text-sm text-gray-300 font-medium mb-1">Colores de tu marca</label>
            <input value={form.colores} onChange={e => setForm({ ...form, colores: e.target.value })}
              placeholder="Ej: Verde menta, blanco y dorado / Azul oscuro #1A2B5F y gris"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 font-medium mb-1">¿Quiénes son tus competidores?</label>
            <input value={form.competidores} onChange={e => setForm({ ...form, competidores: e.target.value })}
              placeholder="Ej: Clínica Veterinaria XYZ, PetShop ABC..."
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-bold text-lg">Objetivos y límites</h2>

          <div>
            <label className="block text-sm text-gray-300 font-medium mb-1">¿Qué querés lograr con las redes sociales?</label>
            <textarea value={form.objetivos} onChange={e => setForm({ ...form, objetivos: e.target.value })}
              placeholder="Ej: Aumentar ventas online, posicionarme como referente, llegar a nuevos clientes en zona norte..."
              rows={3} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 font-medium mb-1">¿Qué cosas NO querés que se publiquen?</label>
            <p className="text-gray-500 text-xs mb-2">Temas a evitar, imágenes que no te gustan, mencionar competidores, etc.</p>
            <textarea value={form.que_no_hacer} onChange={e => setForm({ ...form, que_no_hacer: e.target.value })}
              placeholder="Ej: No mencionar precios, no usar imágenes con mucho texto, no hablar de política..."
              rows={3} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
          </div>
        </div>

        <button onClick={guardar} disabled={guardando || !form.descripcion.trim()}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-lg">
          {guardando ? 'Enviando...' : 'Enviar brief →'}
        </button>

        <p className="text-center text-gray-600 text-xs pb-4">Powered by Voler Orbit</p>
      </main>
    </div>
  )
}
