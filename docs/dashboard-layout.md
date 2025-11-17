# DashboardLayout - Layout Compartido para Páginas Protegidas

## 📋 Descripción

`DashboardLayout` es un componente de layout reutilizable que encapsula la estructura común de todas las páginas protegidas (autenticadas) del dashboard. Elimina la duplicación de código y garantiza consistencia visual en toda la aplicación.

## 🎯 Propósito

Antes de esta refactorización, cada página protegida (`DashboardPage`, `ProductsPage`, etc.) era responsable de renderizar:
- `SidebarProvider` + `AppSidebar`
- Header con breadcrumbs
- Información del usuario
- Botón de logout

Esto causaba:
- ❌ Duplicación masiva de código
- ❌ Difícil mantenimiento (cambios requerían editar múltiples archivos)
- ❌ Riesgo de inconsistencias entre páginas

Con `DashboardLayout`:
- ✅ Un solo punto de verdad para el layout
- ✅ Cambios centralizados
- ✅ Consistencia garantizada
- ✅ Páginas enfocadas en su contenido específico

## 🏗️ Arquitectura

### Estructura del Layout

```
DashboardLayout
├─ SidebarProvider (contexto del sidebar)
│   ├─ AppSidebar (navegación lateral)
│   └─ SidebarInset
│       ├─ Header (común a todas las páginas)
│       │   ├─ SidebarTrigger (botón hamburguesa)
│       │   ├─ Breadcrumb (navegación jerárquica)
│       │   └─ UserInfo + Logout
│       └─ {children} (contenido específico de cada página)
```

### Componentes incluidos

| Componente | Descripción | Responsabilidad |
|------------|-------------|-----------------|
| `SidebarProvider` | Contexto para estado del sidebar | Maneja colapso/expansión |
| `AppSidebar` | Navegación lateral | Links a todas las secciones |
| `Header` | Barra superior fija | Breadcrumbs, usuario, logout |
| `Breadcrumb` | Navegación jerárquica | Muestra ruta actual |
| `UserInfo` | Email y rol del usuario | Datos del `AuthContext` |
| `LogoutButton` | Cerrar sesión | Invoca `logout()` del context |

## 📝 API del Componente

### Props

```typescript
interface BreadcrumbItem {
  label: string;   // Texto a mostrar
  href?: string;   // Link opcional (solo para items padres)
}

interface DashboardLayoutProps {
  /**
   * Array de items del breadcrumb.
   * El último item se muestra como página actual (sin link).
   * 
   * Ejemplo:
   * [
   *   { label: "Panel principal", href: "/dashboard" },
   *   { label: "Productos" }  // ← Página actual (sin href)
   * ]
   */
  breadcrumbs: BreadcrumbItem[];
  
  /**
   * Contenido específico de la página
   */
  children: ReactNode;
  
  /**
   * Clase CSS adicional para el contenedor del contenido.
   * Útil para ajustar padding, gap, etc.
   */
  className?: string;
}
```

## 🚀 Uso

### Ejemplo básico

```tsx
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export function MiPagina() {
  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Panel principal", href: "/dashboard" },
        { label: "Mi Página" },
      ]}
    >
      {/* Contenido específico de tu página */}
      <h1>Contenido de Mi Página</h1>
    </DashboardLayout>
  );
}
```

### Ejemplo con clase personalizada

```tsx
<DashboardLayout
  breadcrumbs={[
    { label: "Panel principal", href: "/dashboard" },
    { label: "Productos" },
  ]}
  className="flex flex-1 flex-col gap-4 p-4"
>
  <div className="grid gap-4">
    {/* Tu contenido aquí */}
  </div>
</DashboardLayout>
```

### Ejemplo con breadcrumb multi-nivel

```tsx
<DashboardLayout
  breadcrumbs={[
    { label: "Panel principal", href: "/dashboard" },
    { label: "Ventas", href: "/sales" },
    { label: "Nueva Venta" },
  ]}
>
  {/* Contenido */}
</DashboardLayout>
```

## 📂 Páginas Refactorizadas

### Antes vs. Después

#### ❌ ANTES (DashboardPage.tsx - 300 líneas)

```tsx
export function DashboardPage() {
  const { auth, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    // ... lógica de logout
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <header className="flex h-16 shrink-0 items-center justify-between ...">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Panel principal</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sesión</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p>{auth?.email ?? "—"}</p>
              <p>Rol {auth?.role}</p>
            </div>
            <Button onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Contenido específico */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

#### ✅ DESPUÉS (DashboardPage.tsx - ~240 líneas)

```tsx
export function DashboardPage() {
  // Ya no necesita manejar logout ni estado del header
  const { auth, refreshSession, isRefreshing, refreshError } = useAuth();

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Panel principal", href: "/dashboard" },
        { label: "Sesión" },
      ]}
      className="flex flex-1 flex-col gap-4 p-4 pt-0"
    >
      {/* Solo el contenido específico de la página */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Cards de estadísticas */}
      </section>
    </DashboardLayout>
  );
}
```

**Reducción:** ~60 líneas de código eliminadas por página ✨

## 🎨 Personalización del Header

El header ya incluye toda la lógica común:
- Email del usuario (`auth.email`)
- Rol del usuario (`auth.role`)
- Botón de logout con spinner
- Manejo de estado de logout

Si necesitas agregar elementos al header (ej: notificaciones, búsqueda global), modifica directamente `DashboardLayout.tsx`.

## 🔧 Mantenimiento

### Agregar un nuevo elemento al header

Edita `DashboardLayout.tsx`:

```tsx
<header className="...">
  <div className="flex items-center gap-2">
    {/* Breadcrumbs existentes */}
  </div>
  
  {/* NUEVO: Barra de búsqueda global */}
  <div className="flex-1 max-w-md">
    <Input placeholder="Buscar..." />
  </div>
  
  <div className="flex items-center gap-4">
    {/* UserInfo + Logout existentes */}
  </div>
</header>
```

### Cambiar estilo del sidebar

Modifica `AppSidebar` directamente. `DashboardLayout` solo lo renderiza.

### Agregar footer común

Añade en `DashboardLayout.tsx`:

```tsx
<SidebarInset className="bg-slate-50">
  <header>...</header>
  <div className={className}>{children}</div>
  
  {/* NUEVO: Footer común */}
  <footer className="border-t p-4 text-center text-sm text-slate-500">
    © 2024 SalesNet. Todos los derechos reservados.
  </footer>
</SidebarInset>
```

## 📋 Checklist para Nuevas Páginas

Al crear una nueva página protegida:

- [ ] Importar `DashboardLayout`
- [ ] Definir array de `breadcrumbs` con ruta jerárquica
- [ ] Envolver contenido en `<DashboardLayout>`
- [ ] Remover imports de `SidebarProvider`, `AppSidebar`, etc.
- [ ] Remover lógica de logout de la página
- [ ] Agregar clase `className` si necesitas ajustar padding/gap
- [ ] NO manejar logout manualmente (lo hace el layout)
- [ ] Usar `useDocumentTitle()` para el título del navegador

### Plantilla para nueva página

```tsx
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function NuevaPagina() {
  useDocumentTitle("Título de la Página");
  
  // Tu lógica específica aquí
  
  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Panel principal", href: "/dashboard" },
        { label: "Sección Padre", href: "/seccion" },
        { label: "Tu Página" },
      ]}
      className="flex flex-1 flex-col gap-4 p-4"
    >
      {/* Tu contenido aquí */}
      <h1>Mi Nueva Página</h1>
    </DashboardLayout>
  );
}
```

## 🐛 Troubleshooting

### El breadcrumb no muestra correctamente

**Problema:** Solo veo el último item del breadcrumb.

**Solución:** Verifica que los items padres tengan `href`:

```tsx
// ❌ INCORRECTO
breadcrumbs={[
  { label: "Panel principal" },  // Falta href
  { label: "Productos" },
]}

// ✅ CORRECTO
breadcrumbs={[
  { label: "Panel principal", href: "/dashboard" },
  { label: "Productos" },
]}
```

### El sidebar no se muestra

**Problema:** El sidebar desapareció después de refactorizar.

**Solución:** `DashboardLayout` ya incluye `<AppSidebar />`. No lo agregues manualmente en tu página.

### El logout no funciona

**Problema:** El botón de logout no hace nada.

**Solución:** Verifica que `AuthContext` esté configurado correctamente. `DashboardLayout` usa `useAuth()` internamente.

### Quiero ocultar el botón de logout en una página específica

**Solución:** Actualmente no soportado. Si necesitas esto, crea una prop opcional `hideLogout?: boolean` en `DashboardLayout`.

## 🔄 Migraciones Futuras

Si necesitas agregar más páginas protegidas:

1. Crea tu página con el patrón de `DashboardLayout`
2. Agrega la ruta en `App.tsx` dentro de `<ProtectedRoute>`
3. Actualiza `AppSidebar` para agregar el link de navegación

Ejemplo:

```tsx
// App.tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/products" element={<ProductsPage />} />
  <Route path="/sales" element={<SalesPage />} />  {/* NUEVO */}
</Route>
```

## 📚 Referencias

- Componente: `src/components/layout/DashboardLayout.tsx`
- Páginas usando el layout:
  - `src/pages/DashboardPage.tsx`
  - `src/pages/ProductsPage.tsx`
- Documentación relacionada:
  - [Sistema de diseño](./design-system.md)
  - [Autenticación y rutas protegidas](./auth-pages.md)
