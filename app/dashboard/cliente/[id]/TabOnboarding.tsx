'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

const REDES = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Google Business', 'YouTube', 'X (Twitter)']
const TONOS = ['Profesional', 'Cercano y amigable', 'Divertido', 'Inspirador', 'Formal', 'Informativo']

const GUIAS: Record<string, string> = {
  Instagram: 'Configuración → Creadores → Añadir administrador → Buscar tu usuario y asignar rol "Editor"',
  Facebook: 'Configuración de la página → Acceso a la página → Añadir personas → Rol: Editor',
  TikTok: 'Configuración → Administración de la cuenta → Autorizaciones → Añadir gestor',
  LinkedIn: 'Página de empresa → Admin tools → Manage admins → Añadir admin',
  'Google Business': 'Google Business Profile → Configuración → Usuarios → Añadir usuario con rol Editor',
  YouTube: 'YouTube Studio → Configuración → Permisos → Invitar → Rol: Editor',
  'X (Twitter)': 'Configuración → Seguridad → Delegados → Añadir delegado',
}

export default function TabOnboarding({ clienteId }: { clienteId: string }) {
  const [data, setData] = useState<any>(null)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState({
    descripcion: '', publico_objetivo: '', tono_voz: '', colores: '',
    competidores: '', objetivos: '', que_no_hacer: '',
    redes: [] as string[],
    credenciales: {} as Record<string, { usuario: string, password: string }>,
    drive_url: '', plan_elegido: '', monto_plan: '', nombre_firma: '',
    contrato_firmado: false,
  })

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('onboarding').select('*').eq('cliente_id', clienteId).single()
      if (data) {
        setData(data)
        setForm({
          descripcion: data.descripcion || '',
          publico_objetivo: data.publico_objetivo || '',
          tono_voz: data.tono_voz || '',
          colores: data.colores || '',
          competidores: data.competidores || '',
          objetivos: data.objetivos || '',
          que_no_hacer: data.que_no_hacer || '',
          redes: data.redes || [],
          credenciales: data.credenciales || {},
          drive_url: data.drive_url || '',
          plan_elegido: data.plan_elegido || '',
          monto_plan: data.monto_plan || '',
          nombre_firma: data.nombre_firma || '',
          contrato_firmado: data.contrato_firmado || false,
        })
      }
    }
    cargar()
  }, [clienteId])

  const toggleRed = (red: string) => {
    const nuevas = form.redes.includes(red) ? form.redes.filter(r => r !== red) : [...form.redes, red]
    setForm({ ...form, redes: nuevas })
  }

  const setCred = (red: string, campo: 'usuario' | 'password', valor: string) => {
    setForm({ ...form, credenciales: { ...form.credenciales, [red]: { ...form.credenciales[red], [campo]: valor } } })
  }

  const guardar = async () => {
    setGuardando(true)
    const payload = { ...form, cliente_id: clienteId, monto_plan: Number(form.monto_plan) || 0 }
    if (data) {
      await supabase.from('onboarding').update(payload).eq('id', data.id)
    } else {
      await supabase.from('onboarding').insert(payload)
    }
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  return (
    <div className="space-y-6">

      {/* BRIEF */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-5">📋 Brief de marca</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción del negocio</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="¿Qué hace el negocio, qué vende, cuál es su propuesta de valor?"
              rows={3} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Público objetivo</label>
            <input value={form.publico_objetivo} onChange={e => setForm({ ...form, publico_objetivo: e.target.value })}
              placeholder="Edad, género, intereses, ubicación..."
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Tono de voz</label>
            <div className="flex flex-wrap gap-2">
              {TONOS.map(t => (
                <button key={t} onClick={() => setForm({ ...form, tono_voz: t })}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${form.tono_voz === t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Colores de marca</label>
              <input value={form.colores} onChange={e => setForm({ ...form, colores: e.target.value })}
                placeholder="#FF0000, azul marino, blanco..."
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Competidores</label>
              <input value={form.competidores} onChange={e => setForm({ ...form, competidores: e.target.value })}
                placeholder="Nombre de competidores principales..."
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objetivos en redes</label>
            <textarea value={form.objetivos} onChange={e => setForm({ ...form, objetivos: e.target.value })}
              placeholder="¿Qué quiere lograr con las redes sociales?"
              rows={2} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Qué NO hacer</label>
            <textarea value={form.que_no_hacer} onChange={e => setForm({ ...form, que_no_hacer: e.target.value })}
              placeholder="Temas a evitar, colores prohibidos, competidores a no mencionar..."
              rows={2} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
          </div>
        </div>
      </div>

      {/* REDES */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-5">📱 Redes activas</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {REDES.map(red => (
            <button key={red} onClick={() => toggleRed(red)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${form.redes.includes(red) ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              {red}
            </button>
          ))}
        </div>

        {form.redes.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-gray-400 text-sm">Guías de acceso para el cliente</h4>
            {form.redes.map(red => (
              <div key={red} className="bg-gray-800 rounded-xl p-4">
                <p className="text-white font-medium text-sm mb-2">{red}</p>
                <p className="text-gray-400 text-xs mb-3 leading-relaxed">📌 {GUIAS[red]}</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.credenciales[red]?.usuario || ''}
                    onChange={e => setCred(red, 'usuario', e.target.value)}
                    placeholder="Usuario / Email"
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-violet-500" />
                  <input
                    value={form.credenciales[red]?.password || ''}
                    onChange={e => setCred(red, 'password', e.target.value)}
                    placeholder="Contraseña (opcional)"
                    type="password"
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ASSETS */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-5">🗂 Assets de marca</h3>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Link de Google Drive con materiales</label>
          <input value={form.drive_url} onChange={e => setForm({ ...form, drive_url: e.target.value })}
            placeholder="https://drive.google.com/..."
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      {/* CONTRATO */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-5">📄 Propuesta y contrato</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Plan elegido</label>
              <input value={form.plan_elegido} onChange={e => setForm({ ...form, plan_elegido: e.target.value })}
                placeholder="Plan Básico, Pro, Full..."
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monto mensual</label>
              <input value={form.monto_plan} onChange={e => setForm({ ...form, monto_plan: e.target.value })}
                placeholder="0" type="number"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl">
            <input type="checkbox" id="firmado" checked={form.contrato_firmado}
              onChange={e => setForm({ ...form, contrato_firmado: e.target.checked })}
              className="w-4 h-4 accent-violet-500" />
            <label htmlFor="firmado" className="text-gray-300 text-sm">Contrato firmado por el cliente</label>
          </div>
          {form.contrato_firmado && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre del firmante</label>
              <input value={form.nombre_firma} onChange={e => setForm({ ...form, nombre_firma: e.target.value })}
                placeholder="Nombre completo"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
            </div>
          )}
        </div>
      </div>

      <button onClick={guardar} disabled={guardando}
        className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
        {guardado ? '✓ Guardado' : guardando ? 'Guardando...' : 'Guardar onboarding'}
      </button>
    </div>
  )
}
