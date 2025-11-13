import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function SearchBar({ className }) {
  const router = useRouter();
  const [operationType, setOperationType] = useState('sale');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();

    // Build query params
    const query = {};
    if (operationType && operationType !== 'all') query.operation_type = operationType;
    if (propertyType && propertyType !== 'all') query.property_type = propertyType;
    if (location) query.city = location;

    // Navigate to properties page with filters
    router.push({
      pathname: '/properties',
      query
    });
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`flex flex-col gap-3 md:flex-row md:items-end ${className || ''}`}
    >
      {/* Operation Type */}
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-foreground">
          Operación
        </label>
        <Select value={operationType} onValueChange={setOperationType}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sale">Venta</SelectItem>
            <SelectItem value="rent">Alquiler</SelectItem>
            <SelectItem value="temp_rent">Alquiler Temporal</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-foreground">
          Tipo de Propiedad
        </label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Todas..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="apartment">Departamento</SelectItem>
            <SelectItem value="house">Casa</SelectItem>
            <SelectItem value="ph">PH</SelectItem>
            <SelectItem value="land">Terreno</SelectItem>
            <SelectItem value="commercial">Comercial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="flex-[2] space-y-2">
        <label className="text-sm font-medium text-foreground">
          Ubicación
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ciudad o barrio..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Search Button */}
      <Button type="submit" size="lg" className="md:px-8">
        <Search className="mr-2 h-4 w-4" />
        Buscar
      </Button>
    </form>
  );
}
