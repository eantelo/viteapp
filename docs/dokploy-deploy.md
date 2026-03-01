# Despliegue de `viteapp` en Dokploy

Esta guía deja `viteapp` listo para desplegarse como contenedor en Dokploy usando Docker + Nginx.

## Archivos agregados

- `Dockerfile`: build multistage (Node para compilar, Nginx para servir).
- `nginx.conf`: configuración de Nginx con fallback SPA (`try_files ... /index.html`).
- `.dockerignore`: reduce contexto de build y acelera despliegue.

## Requisitos

- Repositorio accesible desde Dokploy.
- Variable de API definida para producción.

## Configuración recomendada en Dokploy

### Opción A: repositorio dedicado `viteapp`

- **Build Type**: Dockerfile
- **Dockerfile Path**: `Dockerfile`
- **Port**: `80`
- **Build Arg**:
  - `VITE_API_URL=https://salesapi.tecnoshop.com.bo` (o la URL de tu API)

### Opción B: monorepo `salesnet` con frontend en subcarpeta

- **Build Type**: Dockerfile
- **Dockerfile Path**: `viteapp/Dockerfile`
- **Build Context**: raíz del repo (o `viteapp` si Dokploy permite contexto por carpeta)
- **Port**: `80`
- **Build Arg**:
  - `VITE_API_URL=https://salesapi.tecnoshop.com.bo`

> Nota importante: en Vite, `VITE_API_URL` se inyecta en build-time. Si cambias la URL de API, debes redeployar para regenerar los assets.

## Dominio y HTTPS

En Dokploy:

1. Asigna tu dominio al servicio.
2. Habilita SSL/TLS (Let's Encrypt) desde el panel.
3. Verifica que el DNS del dominio apunte al servidor de Dokploy.

## Verificación post-despliegue

- Carga de `index.html` sin errores 404.
- Navegación directa a rutas internas (ej. `/dashboard`) funcionando gracias al fallback SPA.
- Peticiones a API y autenticación JWT operativas.

## Troubleshooting rápido

- **Pantalla en blanco**: revisar `VITE_API_URL` y consola del navegador.
- **404 en rutas internas**: confirmar que `nginx.conf` tenga `try_files $uri /index.html;`.
- **Errores CORS**: validar `Cors:Origins` en `Sales.Api` para el dominio real del frontend.

## Validación local realizada

Se ejecutó build de producción:

- Comando: `npm run build`
- Resultado: exitoso (sin errores de compilación)
