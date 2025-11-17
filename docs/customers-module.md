# Modulo de Clientes

## Descripcion

Se agrego un modulo completo de gestion de clientes en `viteapp`, reutilizando Sales.Api para todas las operaciones CRUD. La funcionalidad replica el patron usado en Productos: una pagina dedicada, un servicio API centralizado y un dialogo reutilizable para crear o editar registros.

## Arquitectura

### Flujo de datos

```
CustomersPage -> customersApi -> apiClient -> Sales.Api (CustomersController)
       |
CustomerFormDialog
```

### Componentes principales

1. **CustomersPage** (`/src/pages/CustomersPage.tsx`)
   - Lista todos los clientes del tenant autenticado.
   - Bodega el estado de busqueda en memoria (filtro local).
   - Expone acciones para crear, editar y eliminar.
   - Muestra badges de estado activo/inactivo.

2. **CustomerFormDialog** (`/src/components/customers/CustomerFormDialog.tsx`)
   - Dialogo reutilizable para crear o actualizar clientes.
   - Maneja validaciones basicas y estados de carga/error.
   - Campos soportados:
     - Nombre (obligatorio, max 200)
     - Email (obligatorio, max 320)
     - Telefono (opcional, max 30)
     - Direccion (opcional, max 250)
     - RFC/TaxId (opcional, max 30)
     - Estado (solo en modo edicion)

3. **customersApi** (`/src/api/customersApi.ts`)
   - Capa fina sobre `apiClient`.
   - Expone funciones `getCustomers`, `getCustomerById`, `createCustomer`, `updateCustomer`, `deleteCustomer`.
   - Tipos alineados con `Sales.Application.Customers.DTOs`.

### Tipos TypeScript

```ts
export interface CustomerDto {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive: boolean;
}

export interface CustomerCreateDto {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
}

export interface CustomerUpdateDto extends CustomerCreateDto {
  isActive: boolean;
}
```

## Integracion con Sales.Api

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/customers` | Lista todos los clientes del tenant actual |
| GET | `/api/customers/{id}` | Obtiene un cliente por su Id |
| POST | `/api/customers` | Crea un cliente nuevo |
| PUT | `/api/customers/{id}` | Actualiza un cliente existente |
| DELETE | `/api/customers/{id}` | Elimina un cliente |

El token JWT se inyecta automaticamente mediante `apiClient`, por lo que no se expone manualmente el `tenantId`.

## Navegacion

- Nueva ruta protegida: `/customers`.
- El sidebar incluye el item **Clientes** con el icono `IconAddressBook`.

## Caracteristicas de UI/UX

- Borde superior con breadcrumb `Panel principal / Clientes`.
- Busqueda inmediata (filtrado en memoria) por nombre, email, telefono o RFC.
- Tabla con columnas: Nombre, Email, Telefono, Direccion, RFC/Tax ID, Estado, Acciones.
- Estados vacio, error y loading claros.
- Confirmacion nativa antes de eliminar.

## Validaciones

- Frontend valida campos obligatorios y maximos basicos antes de enviar.
- Backend aplica DataAnnotations (Name, Email, Phone, Address, TaxId, IsActive) en `CustomerCreateDto` y `CustomerUpdateDto`.

## Archivos afectados

### Nuevos
- `/src/api/customersApi.ts`
- `/src/components/customers/CustomerFormDialog.tsx`
- `/src/pages/CustomersPage.tsx`
- `/docs/customers-module.md` (este archivo)

### Modificados
- `/src/App.tsx` (nueva ruta)
- `/src/components/app-sidebar.tsx` (item Clientes)

## Pruebas recomendadas

1. **Crear cliente**: llenar todos los campos y verificar que aparece en la tabla.
2. **Editar cliente**: ajustar datos, activar/desactivar y confirmar persistencia.
3. **Eliminar cliente**: confirmar que desaparece de la lista sin errores.
4. **Busquedas**: probar filtros por nombre, email y RFC.
5. **Manejo de errores**: interrumpir la red para validar el mensaje de fallo.
6. **Multitenancy**: iniciar sesion con otro tenant y validar que ve solo sus clientes.
