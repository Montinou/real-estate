import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/search/SearchBar';
import PropertyGrid from '@/components/property/PropertyGrid';
import { PropertyGridSkeleton } from '@/components/property/PropertyCardSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, TrendingUp, MapPin, ArrowRight } from 'lucide-react';

export default function Homepage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `US$ ${formatNumber(Math.round(price))}`;
  };

  return (
    <>
      <Head>
        <title>PropTech AI | Encuentra tu propiedad ideal en Argentina</title>
        <meta
          name="description"
          content="Descubre miles de propiedades en venta y alquiler en Argentina. Casas, departamentos, terrenos y más."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="mr-1.5 h-3 w-3" />
              {stats?.stats?.total_properties || 0} propiedades disponibles
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Encuentra tu{' '}
              <span className="text-primary">hogar ideal</span>
              {' '}en Argentina
            </h1>

            <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Busca entre miles de propiedades en venta y alquiler.
              Departamentos, casas, terrenos y más.
            </p>

            {/* Search Bar */}
            <div className="mt-8">
              <SearchBar className="max-w-4xl mx-auto" />
            </div>

            {/* Quick Stats */}
            {!loading && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formatNumber(stats.stats?.total_properties || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Propiedades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formatNumber(stats.stats?.total_cities || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Ciudades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formatNumber(stats.stats?.total_neighborhoods || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Barrios</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {Math.round((stats.stats?.geocoded_properties / stats.stats?.total_properties) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Geolocalizado</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Propiedades Destacadas</h2>
              <p className="text-muted-foreground mt-2">
                Las últimas propiedades agregadas a nuestra plataforma
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/properties">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <PropertyGridSkeleton count={8} />
          ) : (
            <PropertyGrid
              properties={stats?.latestProperties?.slice(0, 8) || []}
              className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            />
          )}
        </div>
      </section>

      {/* Top Cities */}
      {!loading && stats?.topCities && stats.topCities.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/40">
          <div className="container">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Explora por Ciudad</h2>
              <p className="text-muted-foreground mt-2">
                Las ciudades con más propiedades disponibles
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topCities.slice(0, 6).map((city, index) => (
                <Link
                  key={index}
                  href={`/properties?city=${encodeURIComponent(city.city_name)}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{city.city_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {city.state_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {city.count}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            propiedades
                          </div>
                        </div>
                      </div>
                      {city.avg_price > 0 && (
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                          Precio promedio: {formatPrice(city.avg_price)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                ¿Quieres publicar tu propiedad?
              </h2>
              <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
                Únete a miles de propietarios que ya confían en nuestra plataforma
                para vender o alquilar sus propiedades
              </p>
              <Button size="lg" variant="secondary">
                Publicar Propiedad
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
