import "server-only";
import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { logServerError } from "@/lib/logging/log-server-error";

const geminiModels = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"] as const;
const requestTimeoutMs = 20_000;
const quotaExceededStatus = 429;
const nextModelStatuses = new Set([404, quotaExceededStatus, 500, 503, 504]);

export type GeminiFailure = "not_configured" | "quota" | "unavailable" | "invalid_response";

let cachedClient: GoogleGenAI | null = null;

function geminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  cachedClient ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: requestTimeoutMs } });
  return cachedClient;
}

function parseJson(text: string | undefined): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function generateStructured<Output>({
  context,
  systemInstruction,
  prompt,
  schema,
}: {
  context: string;
  systemInstruction: string;
  prompt: string;
  schema: z.ZodType<Output>;
}): Promise<ActionResult<Output, GeminiFailure>> {
  const client = geminiClient();
  if (!client) {
    logServerError(`ai.${context}`, "GEMINI_API_KEY is not set");
    return failure("not_configured");
  }
  const jsonSchema = z.toJSONSchema(schema);
  let allQuota = true;
  for (const model of geminiModels) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
      const parsed = schema.safeParse(parseJson(response.text));
      if (!parsed.success) {
        logServerError(`ai.${context}`, {
          code: "invalid_response",
          message: `${model}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
        });
        return failure("invalid_response");
      }
      return success(parsed.data);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : null;
      if (status !== null && !nextModelStatuses.has(status)) {
        logServerError(`ai.${context}`, error);
        return failure("unavailable");
      }
      allQuota &&= status === quotaExceededStatus;
      if (status !== quotaExceededStatus) {
        logServerError(`ai.${context}.${model}`, error);
      }
    }
  }
  return failure(allQuota ? "quota" : "unavailable");
}
