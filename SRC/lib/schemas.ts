import { z } from "zod";

export const recommendSchema = z.object({
  minecraftVersion: z.string().min(1),
  loader: z.enum(["fabric", "forge", "neoforge"]),
  categories: z.array(z.string()).min(1).max(8),
});

export const validateSchema = z.object({
  minecraftVersion: z.string().min(1),
  loader: z.enum(["fabric", "forge", "neoforge"]),
  versionIds: z.array(z.string()).max(500),
});

export const createPackSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  minecraftVersion: z.string(),
  loader: z.enum(["fabric", "forge", "neoforge"]),
  versionIds: z.array(z.string()).min(1).max(500),
  isPublic: z.boolean().default(true),
});
