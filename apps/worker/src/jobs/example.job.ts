// Example job - safe, deterministic, proves queue infrastructure
// This job does not call external APIs - it just validates the worker pipeline

import { z } from 'zod';
import type { Job } from 'bullmq';

export const exampleJobSchema = z.object({
  message: z.string().min(1).max(500),
  timestamp: z.string().optional(),
  organizationId: z.string().optional(),
});

export type ExampleJobData = z.infer<typeof exampleJobSchema>;

export async function processExampleJob(
  job: Job<ExampleJobData>
): Promise<{ processedAt: string; echo: string }> {
  const parsed = exampleJobSchema.safeParse(job.data);

  if (!parsed.success) {
    throw new Error(`Invalid job data: ${parsed.error.message}`);
  }

  const { message } = parsed.data;

  // Simulate small work (no external calls)
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    processedAt: new Date().toISOString(),
    echo: `Processed: ${message} (job ${job.id ?? 'unknown'})`,
  };
}

export const EXAMPLE_QUEUE = 'example';
