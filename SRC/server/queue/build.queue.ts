import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const BUILD_QUEUE = "pack-build";

export const buildQueue = new Queue(BUILD_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export interface BuildJobData {
  generationId: string;
  packId: string;
}
