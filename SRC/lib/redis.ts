// redis.ts
import Redis from "ioredis";
import { env } from "./env";
const g = globalThis as unknown as { redis?: Redis };
export const redis = g.redis ?? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
if (process.env.NODE_ENV !== "production") g.redis = redis;
