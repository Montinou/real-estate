import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PropertyGrid from '@/components/property/PropertyGrid';
import { PropertyGridSkeleton } from '@/components/property/PropertyCardSkeleton';
import FilterPanel from '@/components/search/FilterPanel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 12,
    offset: 0,
    hasMore: false
  });

  // Get filters from URL query params
  const getFiltersFromQuery = () => {
    const { query } = router;
    return {
      operation_type: query.operation_type || '',
      property_type: query.property_type || '',
      city: query.city || '',
      min_price: query.min_price || '',
      max_price: query.max_price || '',
      rooms: query.rooms ? parseInt(query.rooms) : null,
      limit: 12,
      offset: query.page ? (parseInt(query.page) - 1) * 12 : 0
    };
  };

  const [filters, setFilters] = useState({});

  // Initialize filters from URL
  useEffect(() => {
    setFilters(getFiltersFromQuery());
  }, [router.query]);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);

      try {
        // Build query string
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all' && value !== '') {
            queryParams.append(key, value);
          }
        });

        const response = await fetch(`/api/properties/search?${queryParams.toString()}`);
        const data = await response.json();

        if (data.success) {
          setProperties(data.data || []);
          setPagination(data.pagination || {
            total: 0,
            limit: 12,
            offset: 0,
            hasMore: false
          });
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  const handleFiltersChange = (newFilters) => {
    // Update URL with new filters
    const query = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        query[key] = value;
      }
    });

    router.push({
      pathname: '/properties',
      query
    }, undefined, { shallow: true });
  };

  const handleClearFilters = () => {
    router.push('/properties', undefined, { shallow: true });
  };

  const handlePageChange = (newPage) => {
    const query = { ...router.query, page: newPage };
    router.push({
      pathname: '/properties',
      query
    }, undefined, { shallow: false, scroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPage = router.query.page ? parseInt(router.query.page) : 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <>
      <Head>
        <title>Propiedades | PropTech AI</title>
        <meta
          name="description"
          content="Encuentra la propiedad perfecta. Departamentos, casas, terrenos y más en Argentina."
        />
      </Head>

      <div className="container py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">Filtros</h2>
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                showResults={!loading}
                resultsCount={pagination.total}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {loading ? 'Cargando...' : `${pagination.total} Propiedades`}
              </h1>

              {/* Sort Options */}
              <Select defaultValue="newest">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                  <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                  <SelectItem value="surface">Superficie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Properties Grid */}
            {loading ? (
              <PropertyGridSkeleton count={12} />
            ) : (
              <PropertyGrid properties={properties} />
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
