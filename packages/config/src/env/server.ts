import { z } from "zod";

export const serverEnvSchema = z.object({
  MEDUSA_BACKEND_URL: z.string().url(),
  MEDUSA_ADMIN_API_TOKEN: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  env: Record<string, string | undefined>
): ServerEnv {
  const parsed = serverEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".") || "root"}: ${i.message}`)
        .join("\n")}`
    );
  }
  return parsed.data;
}