import { QueueOptions, WorkerOptions } from "bullmq";

export const BullConnectionConfig = {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
};

export const BullWorkerConfig: WorkerOptions = {
  ...BullConnectionConfig,
  concurrency: parseInt(process.env.BULLMQ_CONCURRENCY) || 1,
  lockDuration: 5 * 60 * 1000,
};

export const BullQueueConfig: QueueOptions = {
  ...BullConnectionConfig,
  defaultJobOptions: {
    attempts: parseInt(process.env.BULLMQ_RETRY) || 5,
    stackTraceLimit: 500,
    backoff: {
      type: "exponential",
      delay: parseInt(process.env.BULLMQ_BACKOFF) || 500,
    },
  },
};
