# Sunrise Sunset — Base de Datos PostgreSQL

## Estructura

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema (clientes, instructores, recepción, admin) |
| `plans` | Planes de membresía disponibles |
| `plan_credit_buckets` | Composición type-aware de créditos por plan |
| `memberships` | Membresías de clientes con su estado y créditos restantes |
| `membership_credits` | Buckets de créditos activos por membresía |
| `class_types` | Tipos de clase (Sculpt-Funcional, Surf-Pilates, Yoga) |
| `instructors` | Instructores con su perfil y especialidades |
| `schedules` | Horarios recurrentes de clases |
| `classes` | Instancias de clases programadas |
| `bookings` | Reservaciones de clientes a clases |
| `loyalty_points` | Puntos del programa de lealtad |
| `rewards` | Catálogo de recompensas canjeables |
| `redemptions` | Canjes de recompensas |
| `notifications` | Notificaciones a usuarios |
| `wallet_passes` | Pases de Apple/Google Wallet emitidos |
| `apple_wallet_devices` | Dispositivos registrados para push de Apple Wallet |
| `apple_wallet_updates` | Log de actualizaciones de pase para sync |
| `payments` | Registro de pagos |
| `system_settings` | Configuración del sistema |
| `referral_codes` | Códigos de referido para acumular puntos |

### Tipos ENUM relevantes

- `user_role`: client, instructor, admin, super_admin, reception
- `membership_status`: pending_payment, pending_activation, active, expired, paused, cancelled
- `payment_method`: cash, transfer, card, online
- `class_status`: scheduled, in_progress, completed, cancelled
- `booking_status`: confirmed, waitlist, checked_in, no_show, cancelled
- `wallet_platform`: apple, google

## Aplicación de migraciones

El orden de despliegue está documentado en `docs/superpowers/deploy.md`.
Resumen: aplica `schema_complete.sql` (o las migraciones en orden numérico)
+ los seeds Sunrise.

### Comandos útiles (local)

```bash
# Crear DB
createdb sunrise_sunset

# Aplicar esquema base
psql -d sunrise_sunset -f database/schema_complete.sql

# Aplicar migraciones posteriores en orden
for f in database/migrations/0*.sql; do
  psql -d sunrise_sunset -f "$f"
done

# Aplicar seeds Sunrise (catálogo de planes + clases)
psql -d sunrise_sunset -f database/seeds/sunrise_class_types.sql
psql -d sunrise_sunset -f database/seeds/sunrise_packages.sql
psql -d sunrise_sunset -f database/seeds/sunrise_singles.sql
```

### Producción

`DATABASE_URL` se configura por env en Railway. Para aplicar una migración nueva:

```bash
psql "$DATABASE_URL" -f database/migrations/NNN_nueva_migracion.sql
```

## Conexión desde la aplicación

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Railway uses managed certs
});
```
