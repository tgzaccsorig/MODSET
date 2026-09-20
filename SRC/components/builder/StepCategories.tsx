"use client";
import { useEffect, useState } from "react";
import { useBuilder } from "@/store/builder.store";

export function StepCategories() {
  const [cats, setCats] = useState<any[]>([]);
  const categories = useBuilder((s) => s.categories);
  const toggle = useBuilder((s) => s.toggleCategory);
  const setStep = useBuilder((s) => s.setStep);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories));
  }, []);

  return (
    <>
      <h3>Что вам нужно?</h3>
      <p>Можно выбрать несколько.</p>
      <div className="versionGrid">
        {cats.map((c) => (
          <button
            key={c.slug}
            className={`version ${categories.includes(c.slug) ? "selected" : ""}`}
            onClick={() => toggle(c.slug)}
            style={{ textAlign: "left", padding: 14 }}
          >
            <div style={{ fontSize: 18 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: "#8f9098", marginTop: 4 }}>{c.description}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        <button className="secondary" onClick={() => setStep(2)}>← Назад</button>
        <button className="primary" disabled={!categories.length} onClick={() => setStep(4)}>
          Подобрать моды →
        </button>
      </div>
    </>
  );
}
