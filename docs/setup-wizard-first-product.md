# Crear producto desde el onboarding

## Resumen

El onboarding (`SetupWizard`) ahora permite elegir si, al finalizar la configuración inicial, el usuario administrador debe ser redirigido directamente a la pantalla de creación de producto.

## Comportamiento

- La opción se muestra en el paso final de impuestos.
- Se presenta como un checkbox opcional.
- Si está activado, al completar el wizard se navega a ` /products/new `.
- Si no está activado, el comportamiento se mantiene y el usuario va a ` /dashboard `.

## Archivos afectados

- `src/components/setup-wizard/SetupWizard.tsx`
- `src/components/setup-wizard/steps/TaxConfigStep.tsx`

## Objetivo

Reducir fricción en el primer uso permitiendo que el usuario configure su negocio y, enseguida, cargue su primer producto sin pasos extra.
