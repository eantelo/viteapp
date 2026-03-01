# Configuración de URL base de API (`viteapp`)

## Objetivo

Configurar `viteapp` para consumir la API pública en:

- `https://salesapi.tecnoshop.com.bo`

## Cambios aplicados

Se agregaron los archivos de entorno de Vite:

- `.env`
- `.env.production`

Ambos contienen:

- `VITE_API_URL=https://salesapi.tecnoshop.com.bo`

## Cómo funciona

El cliente HTTP centralizado (`src/api/apiClient.ts`) ya utiliza:

- `import.meta.env.VITE_API_URL`

Por lo tanto, con esta configuración todas las solicitudes del frontend apuntan al dominio configurado.

## Nota operativa

Si en algún momento necesitas volver a API local para desarrollo, cambia temporalmente en `.env`:

- `VITE_API_URL=http://localhost:5205`
