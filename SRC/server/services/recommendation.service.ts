import { prisma } from "@/lib/db";
import { modrinth } from "../modrinth/client";
import { scoreModForCategories } from "../scoring/score";

export interface RecommendInput {
  minecraftVersion: string;
  loader: string;
  categories: string[]; // slugs
}

export interface RecommendedMod {
  id: string;
  modrinthId: string;
  slug: string;
  name: string;
  description: string;
  iconUrl?: string;
  categories: string[];
  type: "recommended" | "extra";
  score: number;
}

/**
 * Deterministic recommendation engine.
 * 1. Берём кандидатов через Modrinth search по каждой категории.
 * 2. Фильтруем по MC version + loader.
 * 3. Скорим по совпадению с категориями и по popularity.
 * 4. Возвращаем top N recommended + дополнительный список.
 */
export async function recommendMods(input: RecommendInput): Promise<RecommendedMod[]> {
  const { minecraftVersion, loader, categories } = input;

  const seen = new Map<string, RecommendedMod>();
  const facets = [
    [`versions:${minecraftVersion}`],
    [`categories:${categories.join(",")}`],
  ];

  const searchResults = await Promise.all(
    categories.map((cat) =>
      modrinth.searchProjects({
        query: "",
        limit: 40,
        facets: JSON.stringify([
          [`versions:${minecraftVersion}`],
          [`categories:${cat}`],
          [`project_type:mod`],
        ]),
        index: "relevance",
      })
    )
  );

  const allHits = searchResults.flatMap((r: any) => r.hits ?? []);
  const unique = new Map(allHits.map((h: any) => [h.project_id, h]));

  const dbCategories = await prisma.category.findMany({
    where: { slug: { in: categories } },
  });

  for (const hit of unique.values()) {
    const score = scoreModForCategories(hit.title, dbCategories) + Math.log10((hit.downloads ?? 1) + 10) * 0.3;
    if (score <= 0.2) continue;
    seen.set(hit.project_id, {
      id: hit.project_id,
      modrinthId: hit.project_id,
      slug: hit.slug,
      name: hit.title,
      description: hit.description,
      iconUrl: hit.icon_url,
      categories: hit.categories ?? [],
      type: "recommended",
      score: Math.round(score * 100),
    });
  }

  const list = [...seen.values()].sort((a, b) => b.score - a.score);
  const top = list.slice(0, 30);
  return top;
}
