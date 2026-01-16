# Asistente Virtual - CRM Leads (Frontend)

## Flujo UI
El asistente puede abrir el CRM y pre-cargar datos para crear un lead. El flujo es:

1. El backend envía `ACTION_DATA` con `type: "formPrefill"`, `formType: "lead"` y `path: "/crm"`.
2. El hook `useInterfaceAgent` guarda los datos en `FormPrefillContext` y navega a `/crm`.
3. `CrmPage` consume el prefill y abre `LeadFormDialog` con los campos cargados.
4. El usuario confirma y guarda el lead.

## Tipos soportados
- `formType: "lead"`
- Campos: `name`, `email`, `phone`, `company`, `city`, `productInterestId`, `source`, `estimatedValue`, `notes`

## Navegación rápida
Se habilitaron alias para navegar a CRM desde el asistente:
- `crm`, `lead`, `leads`, `prospectos`, `pipeline` → `/crm`

## Highlight (post-creación)
El enlace ` /crm?highlight={leadId} ` abre el CRM y selecciona el lead para edición inmediata.

## Archivos relevantes
- `src/contexts/FormPrefillContext.tsx`
- `src/lib/interface-agent.ts`
- `src/pages/CrmPage.tsx`
- `src/components/crm/LeadFormDialog.tsx`
