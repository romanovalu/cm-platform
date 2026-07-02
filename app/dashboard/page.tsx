'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Cliente = {
  id: string
  nombre: string
  estado: 'activo' | 'pausado' | 'revisar'
  retainer: number
  proximo: string
  pago: 'pagado' | 'pendiente' | 'vencido'
}

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const estadoColor = {
    activo: 'bg-green-500',
    pausado: 'bg-gray-500',
    revisar: 'bg-yellow-500',
  }

  const pagoColor = {
    pagado: 'text-green-400',
    pendiente: 'text-yellow-400',
    vencido: 'text-red-400',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Voler Orbit</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/'
          }}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Título y botón */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Mis Clientes</h2>
            <p className="text-gray-400 text-sm mt-1">{clientes.length} clientes activos</p>
          </div>
          <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
            + Nuevo cliente
          </button>
        </div>

        {/* Tabla de clientes */}
        {clientes.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-16 text-center">
            <p className="text-4xl mb-4">🪐</p>
            <h3 className="text-white font-semibold text-lg mb-2">Todavía no tenés clientes</h3>
            <p className="text-gray-400 text-sm mb-6">Agregá tu primer cliente y enviále el link de onboarding</p>
            <button className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors">
              + Agregar primer cliente
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Cliente</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Estado</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Próximo</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Retainer</th>
                  <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Pago</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{cliente.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${estadoColor[cliente.estado]}`} />
                        <span className="text-gray-300 text-sm capitalize">{cliente.estado}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{cliente.proximo}</td>
                    <td className="px-6 py-4 text-white">${cliente.retainer}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${pagoColor[cliente.pago]}`}>
                      {cliente.pago.charAt(0).toUpperCase() + cliente.pago.slice(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
