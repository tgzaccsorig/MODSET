import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { modrinth } from "@/server/modrinth/client";

const ALLOWED = new Set(["fabric", "forge", "neoforge"]);

export async function GET() {
  let loaders = await prisma.loader.findMany();
  if (!loaders.length) {
    const remote = await modrinth.getLoaders();
    const data = remote
      .filter((l) => ALLOWED.has(l.name.toLowerCase()))
      .map((l) => ({ slug: l.name.toLowerCase(), name: l.name, icon: null }));
    if (data.length) {
      await prisma.loader.createMany({ data, skipDuplicates: true });
      loaders = await prisma.loader.findMany();
    }
  }
  return NextResponse.json({ loaders });
}
