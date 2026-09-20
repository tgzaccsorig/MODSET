import { modrinth } from "../modrinth/client";
import { prisma } from "@/lib/db";
import { DependencyError } from "@/lib/errors";

export interface ResolvedVersion {
  modrinthVersionId: string;
  projectId: string;
  dependencies: Array<{ projectId: string; versionId?: string; type: string }>;
}

export interface ResolveInput {
  minecraftVersion: string;
  loader: string;
  versionIds: string[];
}

export interface ResolveResult {
  versions: ResolvedVersion[];
  addedDependencies: string[];
  incompatible: Array<{ a: string; b: string }>;
}

/**
 * Разрешает зависимости с обходом в глубину и защитой от циклов.
 * required  -> добавляем автоматически
 * optional  -> пропускаем (только если явно указано в правилах — вне MVP)
 * incompatible -> фиксируем конфликт
 */
export async function resolveDependencies(input: ResolveInput): Promise<ResolveResult> {
  const { minecraftVersion, loader, versionIds } = input;
  const queue = [...versionIds];
  const visitedVersions = new Map<string, ResolvedVersion>();
  const visitedProjects = new Set<string>();
  const incompatible: Array<{ a: string; b: string }> = [];
  const addedDependencies: string[] = [];

  while (queue.length) {
    const versionId = queue.shift()!;
    if (visitedVersions.has(versionId)) continue;

    const version = await modrinth.getVersion(versionId);
    if (!version) throw new DependencyError(`Не удалось получить версию мода (${versionId}).`);

    const resolved: ResolvedVersion = {
      modrinthVersionId: version.id,
      projectId: version.project_id,
      dependencies: (version.dependencies ?? []).map((d: any) => ({
        projectId: d.project_id,
        versionId: d.version_id,
        type: d.dependency_type,
      })),
    };
    visitedVersions.set(versionId, resolved);

    if (visitedProjects.has(resolved.projectId)) continue;
    visitedProjects.add(resolved.projectId);

    for (const dep of resolved.dependencies) {
      if (dep.type === "incompatible" && dep.projectId) {
        incompatible.push({ a: resolved.projectId, b: dep.projectId });
        continue;
      }
      if (dep.type !== "required") continue;

      // Ищем подходящую версию: сначала конкретную, потом — любую совместимую.
      let depVersionId = dep.versionId;
      if (!depVersionId) {
        const list = await modrinth.getProjectVersions(dep.projectId, {
          loaders: JSON.stringify([loader]),
          game_versions: JSON.stringify([minecraftVersion]),
        });
        depVersionId = list[0]?.id;
      }
      if (!depVersionId) {
        throw new DependencyError(
          `Не удалось подобрать совместимую версию для зависимости «${dep.projectId}» (Minecraft ${minecraftVersion}).`
        );
      }
      if (!visitedProjects.has(dep.projectId)) {
        addedDependencies.push(dep.projectId);
        queue.push(depVersionId);
      }
    }
  }

  return {
    versions: [...visitedVersions.values()],
    addedDependencies,
    incompatible,
  };
}
