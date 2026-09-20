import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  MODRINTH_API_URL: z.string().url().default("https://api.modrinth.com/v2"),
  MODRINTH_USER_AGENT: z.string().default("modset/0.1.0"),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("auto"),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_PUBLIC_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  MAX_ZIP_SIZE_MB: z.coerce.number().default(500),
  MAX_MODS_PER_PACK: z.coerce.number().default(200),
  BUILD_TIMEOUT_MS: z.coerce.number().default(300_000),
});

export const env = schema.parse(process.env);
