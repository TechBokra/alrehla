import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_MEDUSA_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(
  env: Record<string, string | undefined>
): ClientEnv {
  const parsed = clientEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      `Invalid client environment:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".") || "root"}: ${i.message}`)
        .join("\n")}`
    );
  }
  return parsed.data;
}