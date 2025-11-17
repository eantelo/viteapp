# IA en el formulario de productos

El formulario de creación de productos ahora consulta automáticamente el endpoint `POST /api/products/suggestions` cuando el usuario escribe un nombre con al menos 4 caracteres.

## Comportamiento

- La petición se envía con debounce (600 ms) y se cancela si el usuario sigue escribiendo.
- Solo se ejecuta al crear productos (no durante la edición).
- Si la marca, categoría o descripción están vacías y la IA devuelve valores, se rellenan automáticamente.
- El usuario puede aplicar manualmente cada sugerencia desde el panel auxiliar.
- Cuando se obtiene una descripción, se muestra un resumen y un botón para aplicarla al campo correspondiente.
- En caso de error se muestra un mensaje discreto sin bloquear el flujo.

## Uso del API client

```ts
import { suggestProductMetadata } from "@/api/productsApi";

const suggestion = await suggestProductMetadata(name);
```

`ProductFormDialog` administra el estado (`aiStatus`, `aiSuggestion`, `aiError`) y renderiza los mensajes dentro de un contenedor con estilo `border-dashed`.

## Consideraciones

- Se requiere que el backend tenga configurado `OpenAI:ApiKey` para obtener resultados reales.
- El frontend asume que la respuesta contiene `brand`, `category`, `description`, `confidence` y `source`.
- Si la API está deshabilitada (`source = "disabled"`) simplemente no se muestran botones de aplicación.
