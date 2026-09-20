import type { Category } from "@prisma/client";

// Демпферная функция: как сильно мод относится к категории.
// Заполняется через RecommendationRule / ModCategory.score.
// Здесь — только дефолтные эвристики для случая, когда категории не заданы вручную.
const HEURISTICS: Record<string, (modName: string) => number> = {
  optimization: (n) => (/sodium|lithium|ferrite|starlight|krypton|memoryleak|entityculling/i.test(n) ? 1 : 0),
  performance: (n) => (/sodium|lithium|embeddiu|immediatelyfast|threadtweak/i.test(n) ? 1 : 0),
  visual: (n) => (/iris|shader|continuity|indium|lambda|eating|3d skin/i.test(n) ? 0.8 : 0),
  "quality-of-life": (n) => (/modmenu|roughly enough|jei|rei|emi|appleskin|inventory/i.test(n) ? 0.9 : 0),
  world: () => 0,
  adventure: () => 0,
  building: () => 0,
  interface: (n) => (/modmenu|betterf3|fancymenu|modernui/i.test(n) ? 0.8 : 0),
};

export function scoreModForCategories(modName: string, categories: Category[]): number {
  let total = 0;
  for (const cat of categories) {
    const fn = HEURISTICS[cat.slug];
    if (fn) total += fn(modName) * (cat.slug === "optimization" ? 1.2 : 1);
  }
  return total;
}
