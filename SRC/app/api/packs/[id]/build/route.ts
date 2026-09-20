import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildQueue } from "@/server/queue/build.queue";
import { NotFoundError } from "@/lib/errors";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const pack = await prisma.pack.findUnique({ where: { id: params.id } });
  if (!pack) return NextResponse.json({ error: "Сборка не найдена" }, { status: 404 });

  const generation = await prisma.packGeneration.create({
    data: {
      packId: pack.id,
      status: "queued",
      progress: 0,
      stage: "В очереди",
    },
  });

  await buildQueue.add("build", {
    generationId: generation.id,
    packId: pack.id,
  });

  return NextResponse.json({ generationId: generation.id, status: "queued" });
}
