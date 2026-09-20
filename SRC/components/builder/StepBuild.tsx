"use client";
import { useState } from "react";
import { useBuilder } from "@/store/builder.store";

export function StepBuild() {
  const { minecraftVersion, loader, selected, clear } = useBuilder();
  const [packId, setPackId] = useState<string | null>(null);
  const [genId, setGenId] = useState<string | null>(null);
  const [build, setBuild] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function createAndBuild() {
    setBusy(true);
    try {
      const packRes = await fetch("/api/packs", {
        method
