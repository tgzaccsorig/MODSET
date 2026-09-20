import { NextResponse } from "next/server";
import { validateSchema } from "@/lib/schemas";
import { validatePack } from "@/server/services/compatibility-checker";
import { AppError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const body = validateSchema.parse(await req.json());
    const result = await validatePack(body);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json(
      { error: "Проверка не удалась. Один из модов недоступен." },
      { status: 500 }
    );
  }
}
