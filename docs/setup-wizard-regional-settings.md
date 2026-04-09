# Configuración regional del onboarding

## Resumen

El paso `RegionalSettingsStep` del onboarding inicial permite seleccionar la moneda operativa y la zona horaria del tenant.

## Opciones añadidas

- Moneda `BOB` con etiqueta **Peso Boliviano** y símbolo `Bs.`.
- Zona horaria `America/La_Paz` con etiqueta visible **La Paz**.

## Archivo afectado

- `src/components/setup-wizard/steps/RegionalSettingsStep.tsx`

## Notas

Estas opciones impactan únicamente el selector visual del onboarding y el valor persistido en `SetupWizardData` durante la configuración inicial.
