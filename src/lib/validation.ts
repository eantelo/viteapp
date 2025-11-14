const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TENANT_CODE_REGEX = /^[a-z0-9-]{3,32}$/;

export function validateEmail(email: string): string | null {
  if (!email) {
    return "El correo es obligatorio";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "Ingresa un correo válido";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "La contraseña es obligatoria";
  }
  if (password.length < 8) {
    return "Debe tener al menos 8 caracteres";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Incluye letras y números";
  }
  return null;
}

export function validateTenantCode(tenantCode: string): string | null {
  if (!tenantCode) {
    return "El código del tenant es obligatorio";
  }
  if (!TENANT_CODE_REGEX.test(tenantCode)) {
    return "Usa minúsculas, números y guiones (3-32 caracteres)";
  }
  return null;
}
