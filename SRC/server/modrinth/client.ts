import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

const UA = env.MODRINTH_USER_AGENT;

async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const value = await fn();
  await redis.set(key, JSON.stringify(value), "EX", ttl);
  return value;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${env.MODRINTH_API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    logger.warn({ url, status: res.status }, "modrinth error");
    throw new Error(`Modrinth ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const modrinth = {
  getMinecraftVersions: () =>
    cached("mr:mc-versions", 60 * 60 * 24, () =>
      req<Array<{ version: string; version_type: string; date: string; major: boolean }>>("/tag/game_version")
    ),

  getLoaders: () =>
    cached("mr:loaders", 60 * 60 * 24, () =>
      req<Array<{ name: string; supported_project_types: string[] }>>("/tag/loader")
    ),

  getCategories: () =>
    cached("mr:categories", 60 * 60 * 24, () =>
      req<Array<{ name: string; project_type: string; header: string; icon: string }>>("/tag/category")
    ),

  searchProjects: (params: Record<string, string | string[] | number | undefined>) =>
    cached(
      `mr:search:${JSON.stringify(params)}`,
      60 * 60 * 6,
      () => {
        const usp = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v === undefined) continue;
          if (Array.isArray(v)) usp.set(k, JSON.stringify(v));
          else usp.set(k, String(v));
        }
        return req<any>(`/search?${usp.toString()}`);
      }
    ),

  getProject: (idOrSlug: string) =>
    cached(`mr:project:${idOrSlug}`, 60 * 60 * 6, () => req<any>(`/project/${idOrSlug}`)),

  getProjectVersions: (idOrSlug: string, params?: Record<string, string>) => {
    const usp = new URLSearchParams(params ?? {});
    return cached(
      `mr:project-versions:${idOrSlug}:${usp.toString()}`,
      60 * 60 * 2,
      () => req<any[]>(`/project/${idOrSlug}/version?${usp.toString()}`)
    );
  },

  getVersion: (versionId: string) =>
    cached(`mr:version:${versionId}`, 60 * 60 * 6, () => req<any>(`/version/${versionId}`)),

  getVersionsBatch: (ids: string[]) =>
    cached(`mr:versions-batch:${ids.sort().join(",")}`, 60 * 60 * 6, () =>
      req<any[]>(`/versions?ids=${JSON.stringify(ids)}`)
    ),
};
