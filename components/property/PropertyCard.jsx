import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Bed, Bath, Maximize, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PropertyCard({ property, className }) {
  const [isFavorite, setIsFavorite] = useState(false);

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

  return (
    <Card className={cn("group overflow-hidden hover:shadow-lg transition-all duration-300", className)}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {property.image_url ? (
          <Link href={`/properties/${property.id}`}>
            <Image
              src={property.image_url}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </Link>
        ) : (
          <Link href={`/properties/${property.id}`} className="flex items-center justify-center h-full bg-muted">
            <div className="text-center text-muted-foreground">
              <Home className="mx-auto h-12 w-12 mb-2" />
              <p className="text-sm">Sin imagen</p>
            </div>
          </Link>
        )}

        {/* Operation Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant={property.operation_type === 'sale' ? 'default' : 'secondary'}
            className="font-semibold"
          >
            {getOperationLabel(property.operation_type)}
          </Badge>
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background",
            isFavorite && "text-red-500"
          )}
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </Button>
      </div>

      {/* Content */}
      <Link href={`/properties/${property.id}`}>
        <CardContent className="p-4 space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-primary">
              {formatPrice(property.price, property.currency)}
            </h3>
          </div>

          {/* Location */}
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="line-clamp-1">
              {[
                property.neighborhood_name,
                property.city_name,
                property.state_name
              ].filter(Boolean).join(', ')}
            </div>
          </div>

          {/* Title */}
          <h4 className="font-semibold line-clamp-2 text-sm leading-snug min-h-[2.5rem]">
            {property.title}
          </h4>

          {/* Property Type */}
          <div className="text-sm text-muted-foreground">
            {getPropertyTypeLabel(property.property_type)}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.total_surface > 0 && (
              <div className="flex items-center gap-1.5">
                <Maximize className="h-4 w-4" />
                <span>{property.total_surface}m²</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
