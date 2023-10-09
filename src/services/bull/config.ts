import { QueueOptions, WorkerOptions } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

export const defaultConnectionOpts = {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
};

export const defaultWorkerOpts: WorkerOptions = {
  ...defaultConnectionOpts,
  concurrency: parseInt(process.env.BULLMQ_CONCURRENCY) || 1,
  lockDuration: 5 * 60 * 1000,
};

export const defaultQueueOpts: QueueOptions = {
  ...defaultConnectionOpts,
  defaultJobOptions: {
    attempts: parseInt(process.env.BULLMQ_RETRY) || 5,
    stackTraceLimit: 500,
    backoff: {
      type: "exponential",
      delay: parseInt(process.env.BULLMQ_BACKOFF) || 500,
    },
  },
};
