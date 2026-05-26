/**
 * 👤 FORMULARIO: Cliente Nuevo (Sin membresía)
 *
 * Formulario simple para crear cuenta de cliente nuevo.
 * No incluye membresía - eso se hace después mediante venta normal.
 * Incluye buscador de clientes existentes para autocompletar datos.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Info, Search, UserCheck, X } from 'lucide-react';
import api from '@/lib/api';
import { PhoneInput } from '@/components/PhoneInput';
import { DEFAULT_COUNTRY, findCountryByISO, parsePhoneToParts } from '@/lib/country-codes';

// Internal form schema: stores country + national part separately for the UI.
const newClientSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  countryISO: z.string().default(DEFAULT_COUNTRY.iso),
  phoneNational: z.string().regex(/^[0-9]{6,14}$/, 'Teléfono inválido — solo dígitos, 6 a 14 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  acceptsCommunications: z.boolean().default(false),
});

type NewClientFormData = z.infer<typeof newClientSchema>;

// External payload — what the parent's onSubmit receives. Keeps the old shape
// (combined `phone`) so callers don't need to change.
export type NewClientForm = {
  displayName: string;
  email: string;
  phone: string;
  password?: string;
  dateOfBirth?: string;
  acceptsCommunications: boolean;
};

interface ExistingClient {
  id: string;
  display_name: string;
  email: string;
  phone: string;
}

interface NewClientFormProps {
  onSubmit: (data: NewClientForm) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const NewClientForm = ({ onSubmit, isLoading, onCancel }: NewClientFormProps) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<NewClientFormData>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      countryISO: DEFAULT_COUNTRY.iso,
      acceptsCommunications: false,
    },
  });

  const acceptsCommunications = watch('acceptsCommunications');
  const countryISO = watch('countryISO') ?? DEFAULT_COUNTRY.iso;
  const phoneNational = watch('phoneNational') ?? '';

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingClient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ExistingClient | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchClients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await api.get('/users', {
        params: { search: term, role: 'client', limit: 5 },
      });
      setSearchResults(data.users || []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchClients(value), 400);
  };

  const handleSelectClient = (client: ExistingClient) => {
    setSelectedClient(client);
    setShowResults(false);
    setSearchTerm('');
    // Auto-fill form — parse existing phone into country + national
    const parts = parsePhoneToParts(client.phone);
    setValue('displayName', client.display_name);
    setValue('email', client.email);
    setValue('countryISO', parts.country.iso);
    setValue('phoneNational', parts.national);
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    reset({ countryISO: DEFAULT_COUNTRY.iso, acceptsCommunications: false });
  };

  useEffect(() => {
    register('acceptsCommunications');
  }, [register]);

  const internalSubmit = (data: NewClientFormData) => {
    const country = findCountryByISO(data.countryISO) ?? DEFAULT_COUNTRY;
    const fullPhone = `${country.dialCode}${data.phoneNational}`;
    onSubmit({
      displayName: data.displayName,
      email: data.email,
      phone: fullPhone,
      password: data.password ? data.password : undefined,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth : undefined,
      acceptsCommunications: data.acceptsCommunications,
    });
  };

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Cliente Nuevo:</strong> Solo se creará la cuenta del cliente.
          Para asignarle una membresía, deberás realizar una venta desde "Ventas" o activar
          una membresía manualmente desde "Membresías".
          Al crear el cliente, se le enviará un <strong>correo y WhatsApp</strong> con sus datos de acceso.
        </AlertDescription>
      </Alert>

      {/* Buscador de clientes existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar cliente existente
          </CardTitle>
          <CardDescription>
            Busca por nombre, email o teléfono para autocompletar los datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedClient ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedClient.display_name}</span>
                <span className="text-xs text-muted-foreground">({selectedClient.email})</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleClearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                  {searchResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                      onClick={() => handleSelectClient(client)}
                    >
                      <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{client.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {client.email} · {client.phone}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-3 shadow-lg">
                  <p className="text-sm text-muted-foreground text-center">No se encontraron clientes</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Datos personales
          </CardTitle>
          <CardDescription>
            Información básica del nuevo cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="Nombre y apellido"
              {...register('displayName')}
            />
            {errors.displayName && (
              <p className="text-xs text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="phoneNational">
              Teléfono <span className="text-destructive">*</span>
            </Label>
            <PhoneInput
              id="phoneNational"
              countryISO={countryISO}
              phoneNational={phoneNational}
              onCountryChange={(v) => setValue('countryISO', v, { shouldValidate: true })}
              onPhoneChange={(v) => setValue('phoneNational', v, { shouldValidate: true })}
            />
            {(errors.phoneNational || errors.countryISO) && (
              <p className="text-xs text-destructive">
                {errors.phoneNational?.message ?? errors.countryISO?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Fecha de nacimiento
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña temporal (opcional)
            </Label>
            <Input
              id="password"
              type="text"
              placeholder="Se generará automáticamente si se deja vacío"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Si no especificas una, se generará una contraseña temporal aleatoria
            </p>
          </div>

          <div className="md:col-span-2 flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="acceptsCommunications"
              checked={acceptsCommunications}
              onCheckedChange={(checked) => setValue('acceptsCommunications', checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="acceptsCommunications"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepta recibir comunicaciones
              </Label>
              <p className="text-sm text-muted-foreground">
                El cliente autoriza recibir notificaciones de WhatsApp, correo y SMS
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cliente
        </Button>
      </div>
    </form>
  );
};
