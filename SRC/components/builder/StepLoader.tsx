"use client";
import { useBuilder } from "@/store/builder.store";

const LOADERS = [
  { slug: "fabric", name: "Fabric", desc: "Лёгкий, современный, для оптимизации" },
  { slug: "forge", name: "Forge", desc: "Классика, огромная экосистема" },
  { slug: "neoforge", name: "NeoForge", desc: "Современный форк Forge" },
] as const;

export function StepLoader() {
  const setLoader = useBuilder((s) => s.setLoader);
  const loader = useBuilder((s) => s.loader);
  const setStep = useBuilder((s) => s.setStep);
  const version = useBuilder((s) => s.minecraftVersion);

  return (
    <>
      <h3>Выберите загрузчик</h3>
      <p>Для Minecraft {version}.</p>
      <div className="versionGrid">
        {LOADERS.map((l) => (
          <button
            key={l.slug}
            className={`version ${loader === l.slug ? "selected" : ""}`}
            onClick={() => setLoader(l.slug)}
            style={{ textAlign: "left", padding: 16 }}
          >
            <div style={{ fontWeight: 700 }}>{l.name}</div>
            <div style={{ fontSize: 11, color: "#8f9098", marginTop: 4 }}>{l.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        <button className="secondary" onClick={() => setStep(1)}>← Назад</button>
        <button className="primary" disabled={!loader} onClick={() => setStep(3)}>Далее →</button>
      </div>
    </>
  );
}
