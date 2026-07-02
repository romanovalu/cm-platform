export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Voler Orbit</h1>
          <p className="text-gray-400 mt-2">Ingresá a tu cuenta</p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  )
}