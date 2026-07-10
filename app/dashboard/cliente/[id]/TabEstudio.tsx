'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Post = {
  id: string
  titulo: string
  descripcion: string
  tipo: string
  fecha_programada: string
  estado: 'borrador' | 'aprobado' | 'publicado' | 'rechazado'
  comentario_cliente: string
}

const estadoColor = {
  borrador: 'bg-gray-500/20 text-gray-400',
  aprobado: 'bg-green-500/20 text-green-400',
  publicado: 'bg-blue-500/20 text-blue-400',
  rechazado: 'bg-red-500/20 text-red-400',
}

const estadoLabel = { borrador: 'Borrador', aprobado: 'Aprobado', publicado: 'Publicado', rechazado: 'Rechazado' }

export default function TabEstudio({ clienteId, clienteNombre }: { clienteId: string, clienteNombre: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '', tipo: 'Post', fecha_programada: '' })

  const cargar = async () => {
    const { data } = await supabase.from('contenido').select('*').eq('cliente_id', clienteId).order('fecha_programada', { ascending: true })
    if (data) setPosts(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [clienteId])

  const guardar = async () => {
    if (!form.titulo.trim()) return
    setGuardando(true)
    await supabase.from('contenido').insert({ ...form, cliente_id: clienteId, estado: 'borrador' })
    setForm({ titulo: '', descripcion: '', tipo: 'Post', fecha_programada: '' })
    setModalAbierto(false)
    setGuardando(false)
    await cargar()
  }

  const cambiarEstado = async (id: string, estado: Post['estado']) => {
    await supabase.from('contenido').update({ estado }).eq('id', id)
    await cargar()
  }

  const copiarLink = () => {
    const link = `${window.location.origin}/aprobar/${clienteId}`
    navigator.clipboard.writeText(link)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  if (loading) return <div className="text-gray-400 text-center py-12">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">Calendario de contenido</h3>
          <p className="text-gray-400 text-sm">{posts.length} piezas este mes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={copiarLink}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors">
            {linkCopiado ? '✓ Link copiado' : '🔗 Link para cliente'}
          </button>
          <button onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
            + Nuevo contenido
          </button>
        </div>
      </div>

      {/* Resumen de estados */}
      <div className="grid grid-cols-4 gap-3">
        {(['borrador', 'aprobado', 'publicado', 'rechazado'] as const).map(e => (
          <div key={e} className="bg-gray-900 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{posts.filter(p => p.estado === e).length}</p>
            <p className="text-gray-400 text-xs mt-1 capitalize">{estadoLabel[e]}</p>
          </div>
        ))}
      </div>

      {/* Lista de contenido */}
      {posts.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center">
          <p className="text-3xl mb-3">🗓</p>
          <h4 className="text-white font-medium mb-2">Sin contenido todavía</h4>
          <p className="text-gray-400 text-sm mb-5">Creá el primer post para este cliente</p>
          <button onClick={() => setModalAbierto(true)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
            + Nuevo contenido
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[post.estado]}`}>{estadoLabel[post.estado]}</span>
                    <span className="text-gray-500 text-xs">{post.tipo}</span>
                    {post.fecha_programada && <span className="text-gray-500 text-xs">📅 {new Date(post.fecha_programada).toLocaleDateString('es-AR')}</span>}
                  </div>
                  <p className="text-white font-medium">{post.titulo}</p>
                  {post.descripcion && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{post.descripcion}</p>}
                  {post.comentario_cliente && (
                    <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500">Comentario del cliente:</p>
                      <p className="text-gray-300 text-sm">{post.comentario_cliente}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {post.estado === 'borrador' && (
                    <button onClick={() => cambiarEstado(post.id, 'aprobado')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors">Aprobar</button>
                  )}
                  {post.estado === 'aprobado' && (
                    <button onClick={() => cambiarEstado(post.id, 'publicado')} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">Publicado</button>
                  )}
                  {post.estado !== 'publicado' && (
                    <button onClick={() => cambiarEstado(post.id, 'borrador')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors">Borrador</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo contenido */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Nuevo contenido</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título *</label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Post de lanzamiento de producto"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción / Copy</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Texto del post, descripción o instrucciones..."
                  rows={4} className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500">
                    <option>Post</option>
                    <option>Historia</option>
                    <option>Reel</option>
                    <option>Carrusel</option>
                    <option>Video</option>
                    <option>Story</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha programada</label>
                  <input type="date" value={form.fecha_programada} onChange={e => setForm({ ...form, fecha_programada: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModalAbierto(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">Cancelar</button>
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
