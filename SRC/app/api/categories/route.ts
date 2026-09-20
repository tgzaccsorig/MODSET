import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CORE = [
  { slug: "optimization", name: "Оптимизация", icon: "⚡", description: "Ускорение и FPS" },
  { slug: "performance", name: "Производительность", icon: "🚀", description: "Максимум скорости" },
  { slug: "visual", name: "Визуал", icon: "🎨", description: "Шейдеры и графика" },
  { slug: "quality-of-life", name: "Удобство", icon: "🧩", description: "QoL-моды" },
  { slug: "world", name: "Мир", icon: "🌍", description: "Генерация и биомы" },
  { slug: "adventure", name: "Приключения", icon: "🗺️", description: "Квесты и RPG" },
  { slug: "building", name: "Строительство", icon: "🧱", description: "Декорации и блоки" },
  { slug: "interface", name: "Интерфейс", icon: "🖥️", description: "UI и HUD" },
];

export async function GET() {
  const count = await prisma.category.count();
  if (!count) {
    await prisma.category.createMany({ data: CORE, skipDuplicates: true });
  }
  const categories = await prisma.category.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json({ categories });
}
