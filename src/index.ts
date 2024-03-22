import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import bullRouter from "./routes/bull";
import issueRouter from "./routes/issue";
import statsRouter from "./routes/wallet";

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
app.use("/bull", bullRouter);
app.use("/issue", issueRouter);

/*
 * Start Express Server
 */
dotenv.config();
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(
    `🟢\tBullMQ: \thttp://localhost:${port}/bull\n` +
      `\tWallet Stats:\thttp://localhost:${port}/stats/wallet\n` +
      `\tdefault: \thttp://localhost:${port}`
  );

  console.log(
    `\n\n(check README)\n` +
      `▶️  Issue PDAs:\n` +
      `\t1. Load DB Dump in data/input.json\n` +
      `\t2. Execute following command in new shell\n` +
      `\t\tcurl -X POST http://localhost:8000/issue/pda \\ \n` +
      `\t\t\t-H 'pda: <path-to-db_dump>'\n` +
      `\t3. (optional) To issue one-off campaigns, execute following command in new shell\n` +
      `\t\tcurl -X POST http://localhost:8000/issue/pda/campaign \\ \n` +
      `\t\t\t-H 'pda: <path-to-db_dump>' -H 'campaign: <name of campaign, ex: og, boostor...>'\n`
  );
});
