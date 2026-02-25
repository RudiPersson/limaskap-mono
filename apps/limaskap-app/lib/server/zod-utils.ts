import type { z } from "zod";

export function toZodV4SchemaTyped<T extends z.ZodTypeAny>(schema: T) {
  return schema;
}
