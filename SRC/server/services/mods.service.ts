import { prisma } from "@/lib/db";
import { modrinth } from "../modrinth/client";

/**
 * Гарантирует наличие Mod + ModVersion в БД.
 * Возвращает { mod, version } — на них можно ссылаться из pack_mods.
 */
export async function ensureModAndVersion(versionId: string) {
  const existing = await prisma.modVersion.findUnique({
    where: { modrinthVersionId: versionId },
    include: { mod: true },
  });
  if (existing) return { mod: existing.mod, version: existing };

  const version = await modrinth.getVersion(versionId);
  if (!version) throw new Error(`Version ${versionId} not found`);

  const project = await modrinth.getProject(version.project_id);

  const mod = await prisma.mod.upsert({
    where: { modrinthId: project.id },
    create: {
      modrinthId: project.id,
      slug: project.slug,
      name: project.title,
      description: project.description,
      iconUrl: project.icon_url,
      projectUrl: `https://modrinth.com/project/${project.slug}`,
      license: project.license?.id ?? null,
      environment: project.client_side === "required" ? "client" : "both",
      downloads: BigInt(project.downloads ?? 0),
      follows: project.followers ?? 0,
    },
    update: {
      name: project.title,
      description: project.description,
      iconUrl: project.icon_url,
      downloads: BigInt(project.downloads ?? 0),
    },
  });

  const createdVersion = await prisma.modVersion.create({
    data: {
      modId: mod.id,
      modrinthVersionId: version.id,
      minecraftVersion: version.game_versions?.[0] ?? "",
      loader: version.loaders?.[0] ?? "",
      versionNumber: version.version_number,
      versionType: version.version_type,
      fileUrl: version.files?.[0]?.url ?? "",
      fileName: version.files?.[0]?.filename ?? "",
      fileSize: BigInt(version.files?.[0]?.size ?? 0),
      sha1: version.files?.[0]?.hashes?.sha1,
      sha512: version.files?.[0]?.hashes?.sha512,
      environment: version.loaders?.[0] ?? null,
      publishedAt: new Date(version.date_published),
    },
  });

  // Зависимости
  for (const d of version.dependencies ?? []) {
    await prisma.modDependency.create({
      data: {
        modVersionId: createdVersion.id,
        dependencyModId: null,
        dependencyVersionId: null,
        type: d.dependency_type,
      },
    }).catch(() => {});
  }

  return { mod, version: createdVersion };
      }
