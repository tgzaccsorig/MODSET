"use client";
import { useEffect, useState } from "react";
import { useBuilder } from "@/store/builder.store";

export function StepRecommendations() {
  const { minecraftVersion, loader, categories, selected, toggleMod, setRecommended, setStep } = useBuilder();
  const [loading, setLoading] = useState(true);
  const [mods, setMods] = useState<any[]>([]);

  useEffect(() => {
    if (!minecraftVersion || !loader || !categories.length) return;
    setLoading(true);
    fetch("/api/builder/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minecraftVersion, loader, categories }),
    })
      .then((r) => r.json())
      .then((d) => {
        const mapped = (d.mods ?? []).map((m: any) => ({
          versionId: `${m.modrinthId}:latest`,
          projectId: m.modrinthId,
          name: m.name,
          iconUrl: m.iconUrl,
          source: "recommended" as const,
          score: m.score,
        }));
        setMods(mapped);
        // Автоматически ставим галочки
        setRecommended(mapped.slice(0, 15));
      })
      .finally(() => setLoading(false));
  }, [minecraftVersion, loader, categories.join(",")]);

  return (
    <>
      <h3>{loading ? "Подбираем моды…" : `Мы подобрали ${mods.length} модов`}</h3>
      <p>Снимите галочки с ненужных или добавьте вручную на следующем шаге.</p>
      {loading ? (
        <div style={{ color: "#8f9098" }}>Пожалуйста, подождите…</div>
      ) : (
        <div className="versionGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {mods.map((m) => {
            const isOn = !!selected[m.versionId];
            return (
              <button
                key={m.versionId}
                className={`version ${isOn ? "selected" : ""}`}
                onClick={() => toggleMod(m)}
                style={{ textAlign: "left", padding: 12 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  {isOn && <span style={{ color: "#4ade80" }}>✓</span>}
                </div>
                <div style={{ fontSize: 11, color: "#8f9098", marginTop: 4 }}>
                  score {m.score ?? 0}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        <button className="secondary" onClick={() => setStep(3)}>← Назад</button>
        <button className="primary" onClick={() => setStep(5)}>
          Проверить ({Object.keys(selected).length})
        </button>
      </div>
    </>
  );
}
