import { ethers } from "ethers";
import { Router } from "express";
import { CreateOrUpdateLoyaltyPassQueue } from "../../services/bull";
import {
  Campaign,
  LifiCampaignReport,
  LifiLineaReport,
  LifiWalletReport,
  parseLifiData,
} from "../../utils/types";
import {
  dispatchCampaignHandler,
  dispatchLineaHandler,
  dispatchWalletHandler,
} from "./dispatch";

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

router.post("/pda", async (req, res) => {
  // collect loyaltypass and pda filepaths from the request header
  const { pda } = req.headers;
  if (!pda) {
    res.status(400).send("Missing pda file as header");
  }

  let pdas: LifiWalletReport[] = [];

  try {
    pdas = require(pda as string);
  } catch (err) {
    return res.status(400).send({
      error: "Invalid PDA file",
    });
  }

  const promises = pdas.map(async (lifiData) => {
    await dispatchWalletHandler(parseLifiData(lifiData));

    // add 5 second backoff
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
  await Promise.all(promises);

  res.status(200).send(pdas);
});

// TODO: put this route inside of /pda/campaign
router.post("/pda/linea", async (req, res) => {
  const { pda } = req.headers;
  if (!pda) {
    res.status(400).send("Missing pda file as header");
  }

  let pdas: LifiLineaReport[] = [];
  try {
    pdas = require(pda as string);
  } catch (err) {
    return res.status(400).send({
      error: "Invalid PDA file",
    });
  }

  const promises = pdas.map(async (lineaData) => {
    await dispatchLineaHandler({
      wallet: ethers.getAddress(lineaData._id),
      totalTransactions: lineaData.count,
      totalVolume: lineaData.volume,
    });

    // add 5 second backoff
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
  await Promise.all(promises);

  res.status(200).send(pdas);
});

router.post("/pda/campaign", async (req, res) => {
  const { pda, campaign } = req.headers;
  if (!pda) {
    res.status(400).send("Missing pda file as header");
  }

  let pdas: LifiCampaignReport[] = [];
  try {
    pdas = require(pda as string);
  } catch (err) {
    return res.status(400).send({
      error: "Invalid PDA file",
    });
  }

  const promises = pdas.map(async (lineaData) => {
    await dispatchCampaignHandler(
      {
        wallet: ethers.getAddress(lineaData.fromAddress),
        points: lineaData.points,
      },
      campaign as Campaign
    );

    // add 5 second backoff
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
  await Promise.all(promises);

  res.status(200).send(pdas);
});

export default router;
