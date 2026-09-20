import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await prisma.packGeneration.findUnique({
    where: { id: params.id },
    include: { pack: true },
  });
  if (!g) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({
    status: g.status,
    progress: g.progress,
    stage: g.stage,
    fileUrl: g.fileUrl,
    fileSize: g.fileSize ? Number(g.fileSize) : null,
    error: g.error,
  });
}
