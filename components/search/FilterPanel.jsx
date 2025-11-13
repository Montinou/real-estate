import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  showResults = false,
  resultsCount = 0
}) {
  const propertyTypes = [
    { value: 'apartment', label: 'Departamento' },
    { value: 'house', label: 'Casa' },
    { value: 'ph', label: 'PH' },
    { value: 'land', label: 'Terreno' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'office', label: 'Oficina' }
  ];

  const operationTypes = [
    { value: 'sale', label: 'Venta' },
    { value: 'rent', label: 'Alquiler' },
    { value: 'temp_rent', label: 'Alquiler Temporal' }
  ];

  const roomOptions = [1, 2, 3, 4, 5];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(v =>
    v !== undefined && v !== '' && v !== null
  );

  return (
    <div className="space-y-6">
      {/* Active Filters Count */}
      {showResults && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {resultsCount} {resultsCount === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-auto p-0 text-xs"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      <Separator />

      {/* Operation Type */}
      <div className="space-y-3">
        <Label>Tipo de Operación</Label>
        <Select
          value={filters.operation_type || ''}
          onValueChange={(value) => handleFilterChange('operation_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {operationTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Property Type */}
      <div className="space-y-3">
        <Label>Tipo de Propiedad</Label>
        <Select
          value={filters.property_type || ''}
          onValueChange={(value) => handleFilterChange('property_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <Label>Rango de Precio (USD)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-price" className="text-xs text-muted-foreground">
              Mínimo
            </Label>
            <Input
              id="min-price"
              type="number"
              placeholder="0"
              value={filters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-price" className="text-xs text-muted-foreground">
              Máximo
            </Label>
            <Input
              id="max-price"
              type="number"
              placeholder="Sin límite"
              value={filters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Rooms */}
      <div className="space-y-3">
        <Label>Habitaciones</Label>
        <div className="grid grid-cols-5 gap-2">
          {roomOptions.map((num) => (
            <Button
              key={num}
              variant={filters.rooms === num ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                handleFilterChange('rooms', filters.rooms === num ? null : num)
              }
              className="w-full"
            >
              {num}+
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Location Search */}
      <div className="space-y-3">
        <Label htmlFor="city">Ubicación</Label>
        <Input
          id="city"
          type="text"
          placeholder="Ciudad o barrio..."
          value={filters.city || ''}
          onChange={(e) => handleFilterChange('city', e.target.value)}
        />
      </div>

      {/* Apply Filters Button */}
      {hasActiveFilters && (
        <Button className="w-full" size="lg">
          Aplicar Filtros
        </Button>
      )}
    </div>
  );
}
