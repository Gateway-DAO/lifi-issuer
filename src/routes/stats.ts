import { Router } from "express";
import path from "path";
import { Month, WalletAnalytics } from "../utils/analytics";
import { computeWalletMetrics } from "../utils/wallet-report";
import fs from "fs";

const router = Router();

router.post("/wallet", (req, res, _next) => {
  const analyticsFp =
    (req.headers.input as string) ||
    path.join(`${__dirname}`, "..", "..", "data", "input.json");
  const outputFp =
    (req.headers.output as string) ||
    path.join(`${__dirname}`, "..", "..", "data", "output.json");

  const month = req.headers.month;
  if (!month) {
    res.status(400).send({
      error: "MISSING_MONTH_HEADER",
      message: "Missing `month` header. Reference src/utils/analytics/month",
    });
  }

  const input = require(analyticsFp) as WalletAnalytics[];
  const reports = input.map((walletOutput) =>
    computeWalletMetrics(walletOutput, Month[month as string])
  );

  console.log(JSON.stringify(reports));

  fs.writeFileSync(outputFp, JSON.stringify(reports));
});

export default router;
