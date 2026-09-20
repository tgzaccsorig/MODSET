"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PickedMod {
  versionId: string;
  projectId: string;
  name: string;
  iconUrl?: string;
  category?: string;
  source: "recommended" | "manual" | "dependency";
  score?: number;
}

interface BuilderState {
  step: number;
  minecraftVersion: string | null;
  loader: "fabric" | "forge" | "neoforge" | null;
  categories: string[];
  recommended: PickedMod[];
  selected: Record<string, PickedMod>;
  autoAdded: string[];
  setStep: (n: number) => void;
  setVersion: (v: string) => void;
  setLoader: (l: BuilderState["loader"]) => void;
  toggleCategory: (slug: string) => void;
  setRecommended: (mods: PickedMod[]) => void;
  toggleMod: (m: PickedMod) => void;
  addAuto: (ids: string[]) => void;
  clear: () => void;
}

export const useBuilder = create<BuilderState>()(
  persist(
    (set, get) => ({
      step: 1,
      minecraftVersion: null,
      loader: null,
      categories: [],
      recommended: [],
      selected: {},
      autoAdded: [],
      setStep: (n) => set({ step: n }),
      setVersion: (v) => set({ minecraftVersion: v }),
      setLoader: (l) => set({ loader: l }),
      toggleCategory: (slug) =>
        set((s) => ({
          categories: s.categories.includes(slug)
            ? s.categories.filter((c) => c !== slug)
            : [...s.categories, slug],
        })),
      setRecommended: (mods) =>
        set(() => ({
          recommended: mods,
          selected: mods.reduce<Record<string, PickedMod>>((acc, m) => {
            acc[m.versionId] = m;
            return acc;
          }, {}),
        })),
      toggleMod: (m) =>
        set((s) => {
          const sel = { ...s.selected };
          if (sel[m.versionId]) delete sel[m.versionId];
          else sel[m.versionId] = m;
          return { selected: sel };
        }),
      addAuto: (ids) => set({ autoAdded: ids }),
      clear: () =>
        set({
          step: 1,
          minecraftVersion: null,
          loader: null,
          categories: [],
          recommended: [],
          selected: {},
          autoAdded: [],
        }),
    }),
    { name: "modset-builder" }
  )
);
