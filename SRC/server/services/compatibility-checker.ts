import { modrinth } from "../modrinth/client";
import { resolveDependencies } from "./dependency-resolver";

export interface ValidateInput {
  minecraftVersion: string;
  loader: string;
  versionIds: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ type: string; message: string; modA?: string; modB?: string }>;
  warnings: string[];
  resolvedVersionIds: string[];
  autoAdded: string[];
}

export async function validatePack(input: ValidateInput): Promise<ValidationResult> {
  const errors: ValidationResult["errors"] = [];
  const warnings: string[] = [];

  if (!input.versionIds.length) {
    errors.push({ type: "EMPTY", message: "Сборка не содержит модов." });
    return { valid: false, errors, warnings, resolvedVersionIds: [], autoAdded: [] };
  }

  // 1. Проверяем что каждая версия совместима с MC + loader
  const versions = await modrinth.getVersionsBatch(input.versionIds);
  for (const v of versions) {
    if (!v.game_versions?.includes(input.minecraftVersion)) {
      errors.push({
        type: "VERSION_MISMATCH",
        message: `«${v.name}» не поддерживает Minecraft ${input.minecraftVersion}.`,
      });
    }
    if (!v.loaders?.includes(input.loader)) {
      errors.push({
        type: "LOADER_MISMATCH",
        message: `«${v.name}» не поддерживает загрузчик ${input.loader}.`,
      });
    }
  }

  // 2. Разрешаем зависимости
  let resolved;
  try {
    resolved = await resolveDependencies(input);
  } catch (e: any) {
    errors.push({ type: "DEPENDENCY", message: e.message });
    return { valid: false, errors, warnings, resolvedVersionIds: input.versionIds, autoAdded: [] };
  }

  for (const inc of resolved.incompatible) {
    errors.push({
      type: "INCOMPATIBLE",
      modA: inc.a,
      modB: inc.b,
      message: "Эти моды нельзя использовать вместе.",
    });
  }

  // 3. Дубликаты
  const byProject = new Map<string, string[]>();
  for (const v of resolved.versions) {
    const arr = byProject.get(v.projectId) ?? [];
    arr.push(v.modrinthVersionId);
    byProject.set(v.projectId, arr);
  }
  for (const [proj, ids] of byProject) {
    if (ids.length > 1) {
      warnings.push(`Обнаружено несколько версий одного мода (${proj}) — будет использована последняя.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resolvedVersionIds: resolved.versions.map((v) => v.modrinthVersionId),
    autoAdded: resolved.addedDependencies,
  };
}
