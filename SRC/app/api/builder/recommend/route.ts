import { NextResponse } from "next/server";
import { recommendSchema } from "@/lib/schemas";
import { recommendMods } from "@/server/services/recommendation.service";
import { AppError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const body = recommendSchema.parse(await req.json());
    const mods = await recommendMods(body);
    return NextResponse.json({ mods, total: mods.length });
  } catch (e: any) {
    if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json(
      { error: "Не удалось подобрать моды. Попробуйте позже." },
      { status: 500 }
    );
  }
}
