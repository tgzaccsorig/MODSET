import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { modrinth } from "@/server/modrinth/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeSnapshots = url.searchParams.get("snapshots") === "1";

  // Пробуем из БД
  let versions = await prisma.minecraftVersion.findMany({
    where: includeSnapshots ? {} : { type: "release" },
    orderBy: { releaseDate: "desc" },
    take: 60,
  });

  // Если БД пуста — наполняем из Modrinth
  if (!versions.length) {
    const remote = await modrinth.getMinecraftVersions();
    const filtered = includeSnapshots ? remote : remote.filter((v) => v.version_type === "release");
    await prisma.minecraftVersion.createMany({
      data: filtered.map((v) => ({
        version: v.version,
        type: v.version_type,
        releaseDate: new Date(v.date),
        isMajor: v.major,
      })),
      skipDuplicates: true,
    });
    versions = await prisma.minecraftVersion.findMany({
      where: includeSnapshots ? {} : { type: "release" },
      orderBy: { releaseDate: "desc" },
      take: 60,
    });
  }

  return NextResponse.json({ versions });
}
