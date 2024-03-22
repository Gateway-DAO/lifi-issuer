import { ethers } from "ethers";
import { Router } from "express";
import { CreateOrUpdateLoyaltyPassQueue } from "../../services/bull";
import {
  LifiLineaReport,
  LifiWalletReport,
  parseLifiData,
} from "../../utils/types";
import { dispatchLineaHandler, dispatchWalletHandler } from "./dispatch";

const router = Router();

router.post("/loyalty-pass", async (req, res) => {
  const { loyaltypass } = req.headers;
  if (!loyaltypass) {
    res.status(400).send("Missing LoyaltyPass file as header");
  }

  const LoyaltyPasses = require(loyaltypass as string);

  const promises = LoyaltyPasses.map(async ({ wallet: recipient }) => {
    CreateOrUpdateLoyaltyPassQueue.add("create_or_update-loyalty-pass", {
      wallet: ethers.getAddress(recipient),
    });
  });
  await Promise.all(promises);

  res.status(200).send(LoyaltyPasses);
});

router.post("/credential", async (req, res) => {
  // collect loyaltypass and pda filepaths from the request header
  const { credential } = req.headers;
  if (!credential) {
    res.status(400).send("Missing credential file as header");
  }

  let credentials: LifiWalletReport[] = [];

  try {
    credentials = require(credential as string);
  } catch (err) {
    return res.status(400).send({
      error: "Invalid PDA file",
    });
  }

  const promises = credentials.map(async (lifiData) => {
    await dispatchWalletHandler(parseLifiData(lifiData));

    // add 5 second backoff
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
  await Promise.all(promises);

  res.status(200).send(credentials);
});

router.post("/credential/linea", async (req, res) => {
  const { credential } = req.headers;
  if (!credential) {
    res.status(400).send("Missing credential file as header");
  }

  let credentials: LifiLineaReport[] = [];
  try {
    credentials = require(credential as string);
  } catch (err) {
    return res.status(400).send({
      error: "Invalid PDA file",
    });
  }

  const promises = credentials.map(async (lineaData) => {
    await dispatchLineaHandler({
      wallet: ethers.getAddress(lineaData._id),
      totalTransactions: lineaData.count,
      totalVolume: lineaData.volume,
    });

    // add 5 second backoff
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
  await Promise.all(promises);

  res.status(200).send(credentials);
});

export default router;
