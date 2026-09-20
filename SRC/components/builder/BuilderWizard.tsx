"use client";
import { useBuilder } from "@/store/builder.store";
import { StepVersion } from "./StepVersion";
import { StepLoader } from "./StepLoader";
import { StepCategories } from "./StepCategories";
import { StepRecommendations } from "./StepRecommendations";
import { StepValidate } from "./StepValidate";
import { StepBuild } from "./StepBuild";
import { PackSummary } from "./PackSummary";
import { MobilePackSheet } from "./MobilePackSheet";

const STEPS = ["Версия", "Загрузчик", "Цели", "Рекомендации", "Проверка", "Готово"];

export function BuilderWizard() {
  const step = useBuilder((s) => s.step);
  const setStep = useBuilder((s) => s.setStep);

  return (
    <div className="builder">
      <div className="builderTop">
        <strong>Создание сборки</strong>
        <span className="tag">Шаг {step} из {STEPS.length}</span>
      </div>
      <div className="builderBody">
        <aside className="sidebar">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`sideStep ${step === i + 1 ? "active" : ""}`}
              onClick={() => i + 1 < step && setStep(i + 1)}
            >
              {String(i + 1).padStart(2, "0")} &nbsp; {label}
            </div>
          ))}
        </aside>
        <div className="content">
          {step === 1 && <StepVersion />}
          {step === 2 && <StepLoader />}
          {step === 3 && <StepCategories />}
          {step === 4 && <StepRecommendations />}
          {step === 5 && <StepValidate />}
          {step === 6 && <StepBuild />}
        </div>
        <PackSummary />
      </div>
      <MobilePackSheet />
    </div>
  );
}
