import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import { CreateOrUpdateLoyaltyPassQueue } from "./routes/issue-clone";
import statsRouter from "./routes/stats";
import CredentialQueue from "./services/bull/credential.queue";

/**
 * Express Router
 */
const app: Application = express();

/**
 * /
 *
 * healthcheck
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("healthy");
});

/**
 * /stats
 *
 * Format Wallet Statistics
 */
app.use("/stats", statsRouter);

/**
 * /bull
 *
 * BullMQ Dashboard
 */
const bullmqAdapter = new ExpressAdapter();
bullmqAdapter.setBasePath("/bull");
createBullBoard({
  queues: [
    new BullMQAdapter(CredentialQueue),
    new BullMQAdapter(CreateOrUpdateLoyaltyPassQueue),
  ],
  serverAdapter: bullmqAdapter,
});

app.use("/bull", bullmqAdapter.getRouter());

/*
 * Start Express Server
 */
dotenv.config();
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(
    `🟢\tBullMQ: \thttp://localhost:${port}/bull\n` +
      `\tdefault: \thttp://localhost:${port}`
  );
});
