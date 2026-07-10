'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type Post = {
  id: string
  titulo: string
  descripcion: string
  tipo: string
  fecha_programada: string
  estado: string
  comentario_cliente: string
}

const estadoColor: Record<string, string> = {
  borrador: 'bg-gray-500/20 text-gray-400',
  aprobado: 'bg-green-500/20 text-green-400',
  publicado: 'bg-blue-500/20 text-blue-400',
  rechazado: 'bg-red-500/20 text-red-400',
}

export default function AprobarPage() {
  const { clienteId } = useParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [comentarios, setComentarios] = useState<Record<string, string>>({})
  const [procesando, setProcesando] = useState<string | null>(null)

  const cargar = async () => {
    const { data } = await supabase
      .from('contenido')
      .select('*')
      .eq('cliente_id', clienteId)
      .in('estado', ['borrador', 'aprobado', 'rechazado'])
      .order('fecha_programada', { ascending: true })
    if (data) setPosts(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [clienteId])

  const accion = async (postId: string, estado: 'aprobado' | 'rechazado') => {
    setProcesando(postId)
    await supabase.from('contenido').update({
      estado,
      comentario_cliente: comentarios[postId] || null,
    }).eq('id', postId)
    await cargar()
    setProcesando(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Cargando contenido...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-xl font-bold">Aprobación de contenido</h1>
          <p className="text-gray-400 text-sm mt-1">Revisá y aprobá las piezas antes de que se publiquen</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✅</p>
            <h2 className="text-white text-xl font-bold mb-2">No hay contenido pendiente</h2>
            <p className="text-gray-400">Tu community manager te avisará cuando haya piezas para revisar.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">{posts.length} pieza{posts.length !== 1 ? 's' : ''} para revisar</p>
            {posts.map(post => (
              <div key={post.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[post.estado] || 'bg-gray-500/20 text-gray-400'}`}>
                          {post.estado.charAt(0).toUpperCase() + post.estado.slice(1)}
                        </span>
                        <span className="text-gray-500 text-xs">{post.tipo}</span>
                        {post.fecha_programada && (
                          <span className="text-gray-500 text-xs">
                            📅 {new Date(post.fecha_programada).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-lg">{post.titulo}</h3>
                    </div>
                  </div>

                  {post.descripcion && (
                    <div className="bg-gray-800 rounded-xl p-4 mb-4">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{post.descripcion}</p>
                    </div>
                  )}

                  {post.estado === 'aprobado' && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                      <p className="text-green-400 font-medium">✓ Ya aprobaste esta pieza</p>
                    </div>
                  )}

                  {post.estado === 'rechazado' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-red-400 font-medium mb-1">✗ Rechazada</p>
                      {post.comentario_cliente && <p className="text-gray-400 text-sm">Tu comentario: {post.comentario_cliente}</p>}
                    </div>
                  )}

                  {post.estado === 'borrador' && (
                    <div className="space-y-3 mt-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Comentario (opcional)</label>
                        <textarea
                          value={comentarios[post.id] || ''}
                          onChange={e => setComentarios({ ...comentarios, [post.id]: e.target.value })}
                          placeholder="Dejá un comentario si querés cambiar algo o aclarar..."
                          rows={2}
                          className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none text-sm"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => accion(post.id, 'rechazado')}
                          disabled={procesando === post.id}
                          className="flex-1 py-3 bg-gray-800 hover:bg-red-900/40 border border-gray-700 hover:border-red-700 text-gray-300 hover:text-red-400 font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                          {procesando === post.id ? '...' : '✗ Solicitar cambios'}
                        </button>
                        <button
                          onClick={() => accion(post.id, 'aprobado')}
                          disabled={procesando === post.id}
                          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          {procesando === post.id ? '...' : '✓ Aprobar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-gray-600 text-xs">
        Powered by Voler Orbit
      </footer>
    </div>
  )
}
