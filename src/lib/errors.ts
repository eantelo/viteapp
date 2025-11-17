export interface ValidationExtraction<TField extends string> {
  fieldErrors: Partial<Record<TField, string>>;
  generalErrors: string[];
}

function normalizeKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function extractProblemDetails<TField extends string>(
  details: unknown,
  knownFields: readonly TField[]
): ValidationExtraction<TField> {
  const result: ValidationExtraction<TField> = {
    fieldErrors: {},
    generalErrors: [],
  };

  if (!details || typeof details !== "object") {
    return result;
  }

  const errors = (details as { errors?: Record<string, string[]> }).errors;
  if (errors && typeof errors === "object") {
    const lookup = knownFields.reduce<Record<string, TField>>((acc, field) => {
      acc[normalizeKey(field)] = field;
      return acc;
    }, {});

    for (const [rawKey, messages] of Object.entries(errors)) {
      if (!Array.isArray(messages) || messages.length === 0) {
        continue;
      }
      const normalizedKey = normalizeKey(rawKey);
      const mappedField = lookup[normalizedKey];
      const firstMessage = messages[0];
      if (mappedField) {
        result.fieldErrors[mappedField] = firstMessage;
      } else {
        result.generalErrors.push(`${rawKey}: ${firstMessage}`);
      }
    }

    return result;
  }

  const message = (details as { message?: string }).message;
  if (typeof message === "string" && message.trim().length > 0) {
    result.generalErrors.push(message);
  }

  return result;
}
