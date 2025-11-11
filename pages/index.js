import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Check if authenticated
    const token = localStorage.getItem('ml_access_token');
    setAuthenticated(!!token);

    // Fetch dashboard stats
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/stats/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMLLogin = () => {
    window.location.href = '/api/auth/mercadolibre/login';
  };

  return (
    <>
      <Head>
        <title>PropTech AI - Dashboard</title>
        <meta name="description" content="Real Estate Intelligence Platform for Argentina" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">
                  🏠 PropTech AI
                </h1>
                <span className="ml-3 text-sm text-gray-500">
                  Argentina Real Estate Intelligence
                </span>
              </div>
              <div className="flex items-center space-x-4">
                {!authenticated ? (
                  <button
                    onClick={handleMLLogin}
                    className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
                  >
                    🔐 Login con MercadoLibre
                  </button>
                ) : (
                  <span className="text-green-600">✅ Autenticado</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Propiedades"
                  value={stats?.stats?.total_properties || 0}
                  icon="🏠"
                  color="blue"
                />
                <StatCard
                  title="Propiedades Activas"
                  value={stats?.stats?.active_properties || 0}
                  icon="✅"
                  color="green"
                />
                <StatCard
                  title="Nuevas Hoy"
                  value={stats?.stats?.new_today || 0}
                  icon="🆕"
                  color="yellow"
                />
                <StatCard
                  title="Precio Promedio USD"
                  value={`$${Math.round(stats?.stats?.avg_price_usd || 0).toLocaleString()}`}
                  icon="💰"
                  color="purple"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Property Types */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📊 Propiedades por Tipo
                  </h2>
                  <div className="space-y-3">
                    {stats?.byType?.map((type, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium capitalize">
                            {type.property_type}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({type.operation_type})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{type.count}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ${Math.round(type.avg_price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Cities */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    🌆 Top Ciudades
                  </h2>
                  <div className="space-y-3">
                    {stats?.topCities?.map((city, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{city.city || 'Sin especificar'}</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {city.count} propiedades
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Latest Properties */}
              <div className="bg-white rounded-lg shadow p-6 mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🆕 Últimas Propiedades
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Título
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Precio
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Ubicación
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats?.latestProperties?.map((prop) => (
                        <tr key={prop.id}>
                          <td className="px-4 py-2 text-sm">
                            {prop.title?.substring(0, 50)}...
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {prop.currency} {prop.price?.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {prop.city} {prop.neighborhood && `- ${prop.neighborhood}`}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className="capitalize">{prop.property_type}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Sources */}
              <div className="bg-white rounded-lg shadow p-6 mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📡 Fuentes de Datos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats?.sources?.map((source) => (
                    <div key={source.display_name} className="border rounded-lg p-4">
                      <h3 className="font-semibold">{source.display_name}</h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>Total: {source.total_scraped || 0}</p>
                        <p>Procesados: {source.processed || 0}</p>
                        <p>Errores: {source.errors || 0}</p>
                        <p className="text-xs text-gray-500">
                          Último: {source.last_scrape_at ? new Date(source.last_scrape_at).toLocaleDateString() : 'Nunca'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .min-h-screen {
          min-height: 100vh;
        }

        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }

        .max-w-7xl {
          max-width: 80rem;
        }

        .mx-auto {
          margin-left: auto;
          margin-right: auto;
        }

        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }

        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-8 { gap: 2rem; }

        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .items-center { align-items: center; }
        .space-x-4 > * + * { margin-left: 1rem; }
        .space-y-3 > * + * { margin-top: 0.75rem; }

        .bg-white { background-color: white; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
        .rounded-lg { border-radius: 0.5rem; }

        .text-sm { font-size: 0.875rem; }
        .text-xl { font-size: 1.25rem; }
        .text-3xl { font-size: 1.875rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        .text-gray-500 { color: #6b7280; }
        .text-gray-900 { color: #111827; }
        .text-green-600 { color: #059669; }
        .text-blue-800 { color: #1e40af; }
        .bg-blue-100 { background-color: #dbeafe; }
        .bg-yellow-400 { background-color: #fbbf24; }
        .hover\\:bg-yellow-500:hover { background-color: #eab308; }

        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .ml-2 { margin-left: 0.5rem; }
        .ml-3 { margin-left: 0.75rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-8 { margin-top: 2rem; }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .transition {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-duration: 150ms;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .capitalize { text-transform: capitalize; }
        .uppercase { text-transform: uppercase; }

        @media (min-width: 768px) {
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (min-width: 1024px) {
          .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
        }

        @media (min-width: 640px) {
          .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        }
      `}</style>
    </>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]} mr-4 text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}