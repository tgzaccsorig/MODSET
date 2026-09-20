import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPackSchema } from "@/lib/schemas";
import { validatePack } from "@/server/services/compatibility-checker";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Number(url.searchParams.get("pageSize") ?? 20));

  const [items, total] = await Promise.all([
    prisma.pack.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { mods: true } } },
    }),
    prisma.pack.count({ where: { isPublic: true } }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  const body = createPackSchema.parse(await req.json());

  // Валидируем и разрешаем зависимости
  const validation = await validatePack({
    minecraftVersion: body.minecraftVersion,
    loader: body.loader,
    versionIds: body.versionIds,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: "INVALID_PACK", details: validation }, { status: 422 });
  }

  const pack = await prisma.pack.create({
    data: {
      name: body.name,
      description: body.description,
      minecraftVersion: body.minecraftVersion,
      loader: body.loader,
      isPublic: body.isPublic,
      mods: {
        create: validation.resolvedVersionIds.map((vid) => ({
          modVersion: { connect: { modrinthVersionId: vid } },
          mod: { connect: { modrinthId: vid.split(":")[0] } }, // плейсхолдер
          source: "recommended",
          required: true,
        })),
      },
    },
    include: { mods: true },
  });

  return NextResponse.json({ pack });
}
