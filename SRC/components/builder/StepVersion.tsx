"use client";
import { useEffect, useState } from "react";
import { useBuilder } from "@/store/builder.store";

export function StepVersion() {
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const setVersion = useBuilder((s) => s.setVersion);
  const setStep = useBuilder((s) => s.setStep);
  const current = useBuilder((s) => s.minecraftVersion);

  useEffect(() => {
    fetch("/api/versions")
      .then((r) => r.json())
      .then((d) => setVersions(d.versions.map((v: any) => v.version)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h3>Выберите версию Minecraft</h3>
      <p>Мы покажем только версии, которые доступны для модов.</p>
      {loading ? (
        <div className="versionGrid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="version skeleton" style={{ opacity: 0.3 }} />
          ))}
        </div>
      ) : (
        <div className="versionGrid">
          {versions.slice(0, 12).map((v) => (
            <button
              key={v}
              className={`version ${current === v ? "selected" : ""}`}
              onClick={() => setVersion(v)}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="primary"
          disabled={!current}
          onClick={() => setStep(2)}
        >
          Далее →
        </button>
      </div>
    </>
  );
}
