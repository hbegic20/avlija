import "server-only";

type ErrorSummary = { name?: string; code?: string; message: string; hint?: string };

function summarize(error: unknown): ErrorSummary {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: unknown };
    return { name: error.name, code: typeof withCode.code === "string" ? withCode.code : undefined, message: error.message };
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const record = error as { code?: unknown; message: unknown; hint?: unknown };
    return {
      code: typeof record.code === "string" ? record.code : undefined,
      message: String(record.message),
      hint: typeof record.hint === "string" && record.hint ? record.hint : undefined,
    };
  }
  return { message: String(error) };
}

export function logServerError(context: string, error: unknown): void {
  console.error(`[avlija] ${context}`, summarize(error));
}

export function logIfUnexpected<Code extends string>(context: string, error: unknown, code: Code): Code {
  if (code === "unexpected") {
    logServerError(context, error);
  }
  return code;
}
