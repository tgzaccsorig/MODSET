"use client";
import { useEffect, useState } from "react";
import { useBuilder } from "@/store/builder.store";

export function StepValidate() {
  const { minecraftVersion, loader, selected, setStep, addAuto } = useBuilder();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const versionIds = Object.values(selected).map((m) => m.versionId);
    fetch("/api/builder/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minecraftVersion, loader, versionIds }),
    })
      .then((r) => r.json())
      .then((d) => {
        setResult(d);
        addAuto(d.autoAdded ?? []);
        setStatus(d.valid ? "ok" : "error");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <h3>Проверяем совместимость…</h3>;

  if (status === "error")
    return (
      <>
        <h3 style={{ color: "#f87171" }}>Есть проблемы</h3>
        <ul style={{ color: "#a1a1aa", fontSize: 13 }}>
          {result?.errors?.map((e: any, i: number) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
        <button className="secondary" onClick={() => setStep(4)}>← Вернуться</button>
      </>
    );

  return (
    <>
      <h3>Сборка готова к созданию</h3>
      <p>
        Найдено {Object.keys(selected).length} модов
        {result?.autoAdded?.length ? `, добавлены необходимые компоненты (${result.autoAdded.length})` : ""}.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="secondary" onClick={() => setStep(4)}>← Назад</button>
        <button className="primary" onClick={() => setStep(6)}>Создать ZIP →</button>
      </div>
    </>
  );
}
