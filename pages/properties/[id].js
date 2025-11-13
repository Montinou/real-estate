import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  Share2,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Home,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/properties/${id}`);
        const data = await response.json();

        if (data.success) {
          setProperty(data.data);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const formatPrice = (price, currency) => {
    if (!price) return 'Consultar precio';

    const formattedPrice = new Intl.NumberFormat('es-AR').format(price);

    if (currency === 'USD') {
      return `US$ ${formattedPrice}`;
    } else if (currency === 'ARS') {
      return `$ ${formattedPrice}`;
    }
    return `${currency} ${formattedPrice}`;
  };

  const getOperationLabel = (operationType) => {
    const labels = {
      sale: 'Venta',
      rent: 'Alquiler',
      temp_rent: 'Alquiler Temporal'
    };
    return labels[operationType] || operationType;
  };

  const getPropertyTypeLabel = (propertyType) => {
    const labels = {
      apartment: 'Departamento',
      house: 'Casa',
      ph: 'PH',
      land: 'Terreno',
      commercial: 'Comercial',
      office: 'Oficina',
      warehouse: 'Galpón',
      garage: 'Cochera'
    };
    return labels[propertyType] || propertyType;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-muted rounded-lg"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container py-16 text-center">
        <Home className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Propiedad no encontrada</h1>
        <p className="text-muted-foreground mb-6">
          La propiedad que buscas no existe o ha sido removida.
        </p>
        <Button asChild>
          <Link href="/properties">Ver todas las propiedades</Link>
        </Button>
      </div>
    );
  }

  // Parse images array if it's a string
  let images = [];
  try {
    images = typeof property.images === 'string'
      ? JSON.parse(property.images)
      : (property.images || []);
  } catch (e) {
    images = property.image_url ? [property.image_url] : [];
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <Head>
        <title>{property.title} | PropTech AI</title>
        <meta name="description" content={property.description || property.title} />
      </Head>

      <div className="container py-8 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/properties" className="hover:text-foreground transition-colors">
            Propiedades
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{property.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>

                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "bg-background/80 backdrop-blur-sm hover:bg-background",
                        isFavorite && "text-red-500"
                      )}
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Home className="mx-auto h-16 w-16 mb-2" />
                    <p>Sin imágenes disponibles</p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {images.slice(0, 6).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "relative aspect-video rounded-md overflow-hidden border-2 transition-all",
                      currentImageIndex === idx
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`Imagen ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Property Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={property.operation_type === 'sale' ? 'default' : 'secondary'}
                      >
                        {getOperationLabel(property.operation_type)}
                      </Badge>
                      <Badge variant="outline">
                        {getPropertyTypeLabel(property.property_type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-3xl">
                      {formatPrice(property.price, property.currency)}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold mb-2">{property.title}</h1>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      {[
                        property.address,
                        property.neighborhood_name,
                        property.city_name,
                        property.state_name
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Property Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {property.bedrooms > 0 && (
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                      <Bed className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-2xl font-bold">{property.bedrooms}</span>
                      <span className="text-sm text-muted-foreground">Dormitorios</span>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                      <Bath className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-2xl font-bold">{property.bathrooms}</span>
                      <span className="text-sm text-muted-foreground">Baños</span>
                    </div>
                  )}
                  {property.total_surface > 0 && (
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                      <Maximize className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-2xl font-bold">{property.total_surface}</span>
                      <span className="text-sm text-muted-foreground">m² totales</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Description */}
                {property.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Descripción</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detalles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {property.rooms > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Ambientes</span>
                        <span className="font-medium">{property.rooms}</span>
                      </div>
                    )}
                    {property.covered_surface > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Superficie cubierta</span>
                        <span className="font-medium">{property.covered_surface} m²</span>
                      </div>
                    )}
                    {property.uncovered_surface > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Superficie descubierta</span>
                        <span className="font-medium">{property.uncovered_surface} m²</span>
                      </div>
                    )}
                    {property.created_at && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Publicado</span>
                        <span className="font-medium">
                          {new Date(property.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source Link */}
                {property.source_url && (
                  <>
                    <Separator />
                    <Button variant="outline" className="w-full" asChild>
                      <a href={property.source_url} target="_blank" rel="noopener noreferrer">
                        Ver publicación original
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Contactar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Phone className="mr-2 h-4 w-4" />
                  Llamar ahora
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar mensaje
                </Button>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Horario de atención</p>
                      <p className="text-muted-foreground">Lun a Vie: 9:00 - 18:00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-muted-foreground">
                        {property.city_name}, {property.state_name}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Card */}
            <Card>
              <CardHeader>
                <CardTitle>Compartir propiedad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comparte esta propiedad con tus contactos
                </p>
                <Button variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
