Propósito

Este documento define el entorno, las convenciones, los límites arquitectónicos y las responsabilidades para todos los agentes de desarrollo que generen o modifiquen código en el frontend Sales.Web (`viteapp`), una SPA multitenant construida con Vite, React y TypeScript que se conecta a `Sales.Api`.
Su objetivo es asegurar consistencia, seguridad y mantenibilidad en todo el código generado automáticamente en el cliente.

🧩 Estructura del sistema (vista desde el frontend)

- `Sales.Web (viteapp)`: SPA en Vite + React + TypeScript.
- `Sales.Api`: backend REST con autenticación JWT y multitenancy.
- `Sales.Shared` (opcional): DTOs y contratos compartidos.

Reglas clave de arquitectura frontend

- El frontend **nunca accede directamente a la base de datos**: solo se comunica con `Sales.Api` vía HTTP/JSON.
- Mantener separación clara entre:
  - **componentes de UI** (presentacionales),
  - **hooks/servicios** que llaman a la API,
  - **estado global** (auth, usuario actual, tenant, etc.).
- No duplicar lógica de negocio que ya existe en `Sales.Api`; el frontend solo orquesta flujos y presenta datos.

⚙️ Stack frontend

- Vite
- React + React Router
- TypeScript
- Cliente HTTP centralizado (`apiClient`) con Axios o `fetch`.
- Estado de autenticación basado en JWT (almacenado en `localStorage`/`sessionStorage`).

🎨 Sistema de diseño

El sistema de diseño de `viteapp` garantiza consistencia visual, accesibilidad y mantenibilidad en toda la aplicación. Todos los componentes deben seguir estas convenciones.

Tecnología de estilos

- **Tailwind CSS** como framework principal de utilidades CSS.
- Configuración centralizada en `tailwind.config.js` para colores, espaciado, tipografía y breakpoints.
- Usar clases de Tailwind directamente en componentes (evitar estilos inline con `style={{}}` salvo casos excepcionales).
- Para casos complejos o animaciones personalizadas, permitir CSS Modules (`.module.css`) o Styled Components solo si ya están adoptados.

Paleta de colores

Definir colores semánticos en `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... hasta 900
          DEFAULT: '#3b82f6', // Azul principal
        },
        secondary: {
          DEFAULT: '#6b7280', // Gris neutro
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
  },
};
```

Usar clases como `bg-primary`, `text-error`, `border-success`.

Tipografía

- Fuente principal: **Inter** o **Roboto** (definida en `index.html` o importada vía CDN/npm).
- Escala tipográfica consistente:
  - `text-xs` → 12px (etiquetas pequeñas)
  - `text-sm` → 14px (texto secundario)
  - `text-base` → 16px (texto principal)
  - `text-lg` → 18px (subtítulos)
  - `text-xl`, `text-2xl`, `text-3xl` → títulos
- Pesos: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).
- Altura de línea: usar `leading-tight`, `leading-normal`, `leading-relaxed` según contexto.

Espaciado y layout

- Seguir escala de Tailwind: `p-2`, `p-4`, `p-6`, `p-8`, `m-4`, `gap-4`, etc.
- No usar valores arbitrarios (`p-[13px]`) sin justificación; mantener consistencia con la escala estándar.
- Layout principal:
  - Usar `flex` y `grid` de Tailwind.
  - Contenedores responsivos: `container mx-auto px-4` o `max-w-7xl mx-auto`.

Componentes base reutilizables

Crear componentes atómicos en `/src/components/ui/` (inspirados en shadcn/ui o similar):

- `Button`: variantes `primary`, `secondary`, `outline`, `ghost`, `danger`.
- `Input`: input de texto con validación visual y label integrado.
- `Select`: dropdown personalizado o nativo estilizado.
- `Card`: contenedor con sombra y padding estándar.
- `Badge`: etiquetas de estado (activo, pendiente, error).
- `Modal`: diálogo/modal centralizado con overlay.
- `Table`: tabla responsiva con estilos consistentes.
- `Spinner`: indicador de carga.
- `Alert`: notificaciones tipo toast o inline.

Ejemplo de `Button`:

```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils'; // helper para combinar clases

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/50',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary/50',
    outline: 'border border-primary text-primary hover:bg-primary/10 focus:ring-primary/50',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-primary/50',
    danger: 'bg-error text-white hover:bg-error/90 focus:ring-error/50',
  };

  return (
    <button className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {children}
    </button>
  );
}
```

Accesibilidad (a11y)

- Todos los componentes interactivos deben ser navegables por teclado (`tabIndex`, `onKeyDown`).
- Usar etiquetas semánticas: `<button>`, `<nav>`, `<main>`, `<article>`, `<aside>`.
- Añadir `aria-label`, `aria-describedby`, `role` cuando sea necesario.
- Contraste de colores: cumplir WCAG AA (mínimo 4.5:1 para texto normal).
- Inputs deben tener `<label>` asociado con `htmlFor`.

Iconografía

- Usar una librería consistente: **Lucide React**, **Heroicons** o **React Icons**.
- Tamaño estándar: `size={20}` o `size={24}` (ajustar según contexto).
- Color: heredar del texto padre (`className="text-current"`) o usar clases de Tailwind.

Ejemplo:

```tsx
import { Search, User, ShoppingCart } from 'lucide-react';

<Search className="text-gray-500" size={20} />
```

Responsividad

- Diseñar **mobile-first**: estilos base para móvil, breakpoints para escritorio.
- Breakpoints de Tailwind:
  - `sm:` → ≥640px
  - `md:` → ≥768px
  - `lg:` → ≥1024px
  - `xl:` → ≥1280px
  - `2xl:` → ≥1536px
- Ocultar/mostrar elementos según pantalla: `hidden md:block`, `block md:hidden`.
- Layout adaptativo: `flex-col md:flex-row`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.

Temas y personalización

- Permitir modo oscuro si aplica (usando `dark:` de Tailwind o contexto de tema).
- Configurar en `tailwind.config.js`:

```js
module.exports = {
  darkMode: 'class', // o 'media'
  // ...
};
```

- Ejemplo de uso:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Contenido adaptable
</div>
```

Animaciones y transiciones

- Usar transiciones suaves en interacciones: `transition-colors`, `transition-opacity`, `transition-transform`.
- Animaciones predefinidas de Tailwind: `animate-spin`, `animate-pulse`, `animate-bounce`.
- Para animaciones complejas, considerar **Framer Motion** (solo si ya está adoptado).

Ejemplo:

```tsx
<button className="bg-primary hover:bg-primary/90 transition-colors duration-200">
  Hover me
</button>
```

Formularios y validación visual

- Inputs en estado normal: `border-gray-300`.
- Input con error: `border-error focus:ring-error`.
- Input válido (opcional): `border-success focus:ring-success`.
- Mostrar mensajes de error bajo el input: `<span className="text-error text-sm">...</span>`.

Estados de carga y feedback

- Mostrar `<Spinner />` durante peticiones asíncronas.
- Deshabilitar botones mientras se procesa: `disabled={isLoading}` + `opacity-50 cursor-not-allowed`.
- Usar toasts o alerts para confirmar acciones (crear, actualizar, eliminar).

Convenciones de nomenclatura de clases

- Evitar abreviaciones crípticas en nombres de componentes.
- Agrupar clases por categoría (layout → tipografía → colores → interacción):

```tsx
<div className="flex items-center gap-4 px-6 py-4 text-lg font-semibold text-gray-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  ...
</div>
```

- Usar el helper `cn()` (de `clsx` + `tailwind-merge`) para combinar clases condicionalmente:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Storybook (opcional)

- Si el proyecto crece, considerar **Storybook** para documentar componentes reutilizables.
- Cada componente debe tener sus variantes documentadas (estados, variantes, props).

Reglas para agentes al generar UI

- Siempre reutilizar componentes base existentes (`Button`, `Input`, `Card`, etc.) antes de crear nuevos.
- Respetar la paleta de colores y la escala tipográfica definida.
- No introducir estilos inline ni clases arbitrarias sin consultar.
- Validar accesibilidad básica (labels, contraste, navegación por teclado).
- Probar la responsividad en móvil, tablet y escritorio.

🔐 Autenticación, autorización y multitenancy

- Todo acceso a recursos protegidos debe enviar el header `Authorization: Bearer <token>`.
- El JWT es emitido por `Sales.Api` y contiene al menos los claims:
  - `sub` (id de usuario)
  - `tenant` (tenant actual)
  - `role` (rol de usuario)
  - `email`
- El frontend **no infiere permisos** por su cuenta; debe usar:
  - claims del token para mostrar/ocultar opciones de UI,
  - respuestas de la API para validar permisos en operaciones sensibles.
- El `tenantId` no se fabrica en el cliente; se toma del token o de la respuesta de la API.
- Nunca persistir el token en cookies sin `HttpOnly` (riesgo XSS). Preferir `localStorage` + buenas prácticas de seguridad en el cliente.

🧱 Convenciones de desarrollo (viteapp)

Código y estilo

- Lenguaje: TypeScript estricto (`strict: true`).
- Nombres:
  - Componentes React: `PascalCase`.
  - Hooks: prefijo `use` (`useAuth`, `useProductsApi`).
  - Variables y funciones: `camelCase`.
- Componentes pequeños, enfocados y reutilizables.
- Todo código de acceso a API se centraliza en:
  - `apiClient` (configuración base), y
  - servicios o hooks especializados por agregado (`productsApi`, `useSales`, `useCustomers`, etc.).
- No llamar directamente a `fetch`/Axios desde componentes de página; siempre pasar por servicios/hooks.

Rutas y navegación

- Usar React Router con rutas coherentes (ejemplos):
  - `/login`, `/register`
  - `/dashboard`
  - `/products`, `/sales`, `/customers`, `/users`
- Proteger rutas mediante componentes de orden superior o wrappers:
  - `ProtectedRoute` para rutas autenticadas.
  - Variantes para roles si aplica (`AdminRoute`, etc.).
- Redirigir al login cuando el token no existe o expiró.

Gestión de estado y datos

- Gestionar el estado global (auth, usuario actual, tenant, preferencias básicas) mediante:
  - Contexto de React (`AuthContext`) o
  - un store ligero (p. ej. Zustand o Redux Toolkit si ya está adoptado).
- Consultas a la API:
  - Pueden usarse hooks como `useQuery` (React Query/TanStack Query) si el proyecto lo incluye, o hooks propios.
  - Manejar siempre estados `loading`, `error`, `empty` y `success` en UI.
- No almacenar en estado global datos que son específicos de una sola pantalla si no es necesario.

🌐 Comunicación con Sales.Api

Cliente HTTP centralizado (ejemplo conceptual):

```ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5205',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Ejemplo de servicio orientado a dominio:

```ts
// src/api/productsApi.ts
import { apiClient } from './apiClient';

export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export async function getProducts(): Promise<ProductDto[]> {
  const response = await apiClient.get<ProductDto[]>('/api/products');
  return response.data;
}
```

⚠️ Configuración de entorno (viteapp)

- La URL de la API no debe estar hardcodeada en el código.
- Usar variables de entorno de Vite:
  - `VITE_API_URL` para apuntar a `Sales.Api` en cada entorno (desarrollo, staging, producción).
- Archivos típicos:
  - `.env` (dev local)
  - `.env.production`

Ejemplo:

```env
VITE_API_URL=http://localhost:5205
```

Seguridad en el frontend

- Nunca loguear tokens o información sensible en la consola.
- Manejar errores de red y de autorización (401/403) mostrando mensajes adecuados y redirigiendo al login si es necesario.
- Escapar/validar cualquier entrada de usuario que pueda terminar en el DOM.

🧠 Normas para agentes de IA (viteapp)

Reglas generales

- Respetar la arquitectura existente de `viteapp` (estructura de carpetas, patrones de hooks, etc.).
- No introducir nuevas librerías pesadas sin justificar su necesidad.
- Mantener coherencia con componentes y estilos existentes.
- No duplicar servicios ni hooks: reutilizar los existentes cuando sea posible.

Antes de generar código

- Identificar claramente en qué parte del frontend se va a trabajar:
  - página (`/src/pages/...`),
  - componente reutilizable (`/src/components/...`),
  - servicio API (`/src/api/...`),
  - hook (`/src/hooks/...`).
- Revisar contratos de `Sales.Api` (endpoints, DTOs) para alinear los tipos TypeScript.
- Generar solo el código estrictamente necesario para el caso de uso.

Al generar código

- Tipar todas las funciones públicas y props de componentes.
- Manejar estados `loading`/`error` de forma explícita.
- Respetar patrones de diseño ya presentes (por ejemplo, si se usa React Query o Zustand).
- Añadir solo el mínimo CSS necesario, respetando el sistema de diseño existente (Tailwind, CSS Modules, etc. si aplica).

🧭 Misión del agente (frontend)

“Construir y mantener el frontend Sales.Web (`viteapp`) como una SPA modular, segura y multitenant que consuma `Sales.Api` de forma consistente.
Cada línea de código debe ser simple, testeable y coherente con los principios de arquitectura limpia aplicada al frontend.”

📚 Documentación

- Cuando crees o modifiques código en `viteapp`, asegúrate de actualizar o crear la documentación correspondiente en formato Markdown.
- Utiliza la carpeta `/viteapp/docs` como carpeta de documentación específica de `viteapp` (si existe) para describir:
  - nuevos flujos de UI,
  - nuevos endpoints consumidos,
  - decisiones arquitectónicas relevantes.

🔗 Referencias recomendadas

- Documentación oficial de React y React Router.
- Documentación de Vite.
- Guía de TypeScript (especialmente tipos para React).
- Documentación de Axios o `fetch` nativo.
- Documentación interna de `Sales.Api` (endpoints y DTOs).
