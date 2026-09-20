import { Worker } from "bullmq";
import archiver from "archiver";
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { redis } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { s3, uploadFile } from "@/lib/s3";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { BUILD_QUEUE, type BuildJobData } from "@/server/queue/build.queue";
import { modrinth } from "@/server/modrinth/client";
import { ensureModAndVersion } from "@/server/services/mods.service";

const STAGES = {
  resolve: "Проверяем зависимости",
  download: "Скачиваем моды",
  verify: "Проверяем файлы",
  zip: "Создаём ZIP",
  upload: "Загружаем архив",
} as const;

async function updateStage(id: string, progress: number, stage: string) {
  await prisma.packGeneration.update({
    where: { id },
    data: { progress, stage, status: progress === 100 ? "ready" : "processing" },
  });
}

async function downloadAndVerify(
  url: string,
  fileName: string,
  sha512: string | null,
  destDir: string
): Promise<string> {
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  const dest = path.join(destDir, safe);

  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Не удалось скачать ${fileName}`);

  const hash = crypto.createHash("sha512");
  const nodeStream = Readable.fromWeb(res.body as any);
  nodeStream.on("data", (chunk) => hash.update(chunk));

  await pipeline(nodeStream, createWriteStream(dest));

  if (sha512) {
    const actual = hash.digest("hex");
    if (actual.toLowerCase() !== sha512.toLowerCase()) {
      await fs.unlink(dest).catch(() => {});
      throw new Error(`Хэш не совпал для ${fileName}`);
    }
  }
  return dest;
}

const worker = new Worker<BuildJobData>(
  BUILD_QUEUE,
  async (job) => {
    const { generationId, packId } = job.data;
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      include: { mods: { include: { modVersion: true } } },
    });
    if (!pack) throw new Error("Pack not found");

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "modset-"));
    const modsDir = path.join(workDir, "mods");
    await fs.mkdir(modsDir, { recursive: true });

    try {
      // 1. resolve / sync DB
      await updateStage(generationId, 10, STAGES.resolve);
      const versions = await Promise.all(
        pack.mods.map((m) => ensureModAndVersion(m.modVersionId ? m.modVersionId : m.modVersion.modrinthVersionId))
      );

      // 2. download
      await updateStage(generationId, 30, STAGES.download);
      const files: Array<{ rel: string; sha512: string | null; projectId: string; versionId: string }> = [];
      let totalSize = 0;

      for (let i = 0; i < versions.length; i++) {
        const { version } = versions[i];
        const local = await downloadAndVerify(version.fileUrl, version.fileName, version.sha512, modsDir);
        const stat = await fs.stat(local);
        totalSize += stat.size;
        files.push({
          rel: path.relative(workDir, local),
          sha512: version.sha512,
          projectId: version.modId,
          versionId: version.modrinthVersionId,
        });
        const p = 30 + Math.floor((i / versions.length) * 40);
        await updateStage(generationId, p, `${STAGES.download} (${i + 1}/${versions.length})`);

        if (totalSize > env.MAX_ZIP_SIZE_MB * 1024 * 1024) {
          throw new Error("Размер сборки превышает допустимый лимит.");
        }
      }

      // 3. verify + meta
      await updateStage(generationId, 75, STAGES.verify);
      const meta = {
        name: pack.name,
        minecraft: pack.minecraftVersion,
        loader: pack.loader,
        mods: files.map((f) => ({
          projectId: f.projectId,
          versionId: f.versionId,
          file: f.rel,
        })),
      };
      await fs.writeFile(path.join(workDir, "modset.json"), JSON.stringify(meta, null, 2));
      await fs.writeFile(
        path.join(workDir, "README.txt"),
        `MODSET pack: ${pack.name}\nMinecraft ${pack.minecraftVersion} / ${pack.loader}\nМодов: ${files.length}\n`
      );

      // 4. zip
      await updateStage(generationId, 85, STAGES.zip);
      const zipPath = path.join(workDir, `${pack.name.replace(/[^\w\-]+/g, "_") || "pack"}.zip`);
      await new Promise<void>((resolve, reject) => {
        const out = createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        out.on("close", () => resolve());
        archive.on("error", reject);
        archive.pipe(out);
        archive.directory(modsDir, "mods");
        archive.file(path.join(workDir, "modset.json"), { name: "modset.json" });
        archive.file(path.join(workDir, "README.txt"), { name: "README.txt" });
        archive.finalize();
      });

      // 5. upload
      await updateStage(generationId, 95, STAGES.upload);
      const key = `packs/${pack.id}/${generationId}.zip`;
      const stat = await fs.stat(zipPath);
      await uploadFile(key, zipPath, "application/zip");

      const fileUrl = `${env.S3_PUBLIC_URL}/${key}`;
      await prisma.packGeneration.update({
        where: { id: generationId },
        data: {
          status: "ready",
          progress: 100,
          stage: "Готово",
          fileUrl,
          fileSize: BigInt(stat.size),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });
      logger.info({ generationId, packId, size: stat.size }, "build ready");
    } catch (e: any) {
      logger.error({ generationId, err: e?.message }, "build failed");
      await prisma.packGeneration.update({
        where: { id: generationId },
        data: { status: "failed", error: e?.message ?? "Неизвестная ошибка" },
      });
      throw e;
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  },
  { connection: redis, concurrency: 2 }
);

worker.on("failed", (job, err) => logger.error({ job: job?.id, err: err.message }, "worker failed"));
logger.info("pack worker ready");
