import { ethers } from "ethers";
import { Router } from "express";
import CredentialQueueWorker from "../services/bull/credential.worker";
import UpdateLoyaltyPassFlowProducer from "../services/bull/flow";
import CreateOrUpdateLoyaltyPassQueue from "../services/bull/loyaltypass.queue";
import { GatewayMetrics } from "../utils/analytics";
import {
  DESCRIPTION_TRANSLATED,
  METRICS_TRANSLATED,
  MONTHS_TRANSLATED,
  TIER_DATA,
  computePoints,
  computeTier,
  formatTier,
} from "../utils/tiers";

const router = Router();

router.post("/loyalty-pass", async (req, res) => {
  const { loyaltypass } = req.headers;
  if (!loyaltypass) {
    res.status(400).send("Missing LoyaltyPass file as header");
  }

  const LoyaltyPasses = require(loyaltypass as string);

  const promises = LoyaltyPasses.map(async ({ wallet: recipient }) => {
    CreateOrUpdateLoyaltyPassQueue.add("create_or_update-loyalty-pass", {
      recipient: ethers.getAddress(recipient),
    });
  });
  await Promise.all(promises);

  res.status(200).send(LoyaltyPasses);
});

router.post("/credential", async (req, res) => {
  // collect loyaltypass and pda filepaths from the request header
  const { loyaltypass, pda } = req.headers;
  if (!pda) {
    res.status(400).send("Missing PDA file as header");
  }

  const pdas: GatewayMetrics[] = require(pda as string);
  const promises = pdas.map(async (pda) => {
    await dispatchWalletHandler({
      ...pda,
      wallet: ethers.getAddress(pda.wallet),
    });

    // add 5 second backoff
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
  await Promise.all(promises);

  res.status(200).send(pdas);
});

router.get("/credential", (req, res, next) => {
  console.log("SUCCESS!");
  res.status(200).send({ msg: "healthy" });
});

async function dispatchWalletHandler(pda: GatewayMetrics) {
  await Promise.all([
    CredentialQueueWorker.waitUntilReady(),
    CreateOrUpdateLoyaltyPassQueue.waitUntilReady(),
  ]);

  // Volume PDA
  const volumeTier = computeTier("volume", pda.totalVolume);
  let volumePoints = 0;
  let volumeJob = undefined;
  if (volumeTier != undefined) {
    console.log(
      `[wallet ${pda.wallet}::month ${pda.month}] volumeTier: ${volumeTier}`
    );
    volumePoints = computePoints("volume", volumeTier);

    volumeJob = {
      name: `${pda.wallet}-${pda.month}-volume`,
      queueName: "issue-protocol",
      data: {
        recipient: pda.wallet,
        title: `${METRICS_TRANSLATED["volume"]} - ${
          MONTHS_TRANSLATED[pda.month]
        }`,
        description: DESCRIPTION_TRANSLATED["volume"],
        claim: {
          volume: Number(pda.totalVolume).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }),
          tier: formatTier(volumeTier),
          points: volumePoints,
        },
        image: TIER_DATA["volume"].images[volumeTier],
        dataModelId: TIER_DATA["volume"].data_model,
        points: volumePoints,
        tags: ["DeFi", "Bridging"],
      },
      opts: {
        jobId: `issue-volume-${pda.month}-${pda.wallet}`,
      },
    };
  }

  // Network PDA
  const networkTier = computeTier("networks", pda.totalUniqueNetworks);
  let networkPoints = 0;
  let networkJob = undefined;
  if (networkTier != undefined) {
    console.log(
      `[wallet ${pda.wallet}::month ${pda.month}] networkTier: ${networkTier}`
    );
    networkPoints = computePoints("networks", networkTier);

    networkJob = {
      name: `${pda.wallet}-${pda.month}-network`,
      queueName: "issue-protocol",
      data: {
        recipient: pda.wallet,
        title: `${METRICS_TRANSLATED["networks"]} - ${
          MONTHS_TRANSLATED[pda.month]
        }`,
        description: DESCRIPTION_TRANSLATED["networks"],
        claim: {
          chains: pda.totalUniqueNetworks,
          tier: formatTier(networkTier),
          points: networkPoints,
        },
        image: TIER_DATA["networks"].images[networkTier],
        dataModelId: TIER_DATA["networks"].data_model,
        points: networkPoints,
        tags: ["DeFi", "Bridging"],
      },
      opts: {
        jobId: `issue-network-${pda.month}-${pda.wallet}`,
      },
    };
  }

  // Transaction PDA
  const transactionsTier = computeTier("transactions", pda.totalTransactions);
  let transactionsPoints = 0;
  let transactionsJob = undefined;
  if (transactionsTier != undefined) {
    console.log(
      `[wallet ${pda.wallet}::month ${pda.month}] transactionsTier: ${transactionsTier}`
    );
    transactionsPoints = computePoints("transactions", transactionsTier);

    transactionsJob = {
      name: `${pda.wallet}-${pda.month}-txn`,
      queueName: "issue-protocol",
      data: {
        recipient: pda.wallet,
        title: `${METRICS_TRANSLATED["transactions"]} - ${
          MONTHS_TRANSLATED[pda.month]
        }`,
        description: DESCRIPTION_TRANSLATED["transactions"],
        claim: {
          transactions: pda.totalTransactions,
          tier: formatTier(transactionsTier),
          points: transactionsPoints,
        },
        image: TIER_DATA["transactions"].images[transactionsTier],
        dataModelId: TIER_DATA["transactions"].data_model,
        points: transactionsPoints,
        tags: ["DeFi", "Bridging"],
      },
      opts: {
        jobId: `issue-txn-${pda.month}-${pda.wallet}`,
      },
    };
  }

  UpdateLoyaltyPassFlowProducer.add({
    opts: {
      jobId: `loyaltypass-${pda.wallet}`,
      attempts: parseInt(process.env.BULLMQ_RETRY) || 5,
      backoff: {
        type: "exponential",
        delay: parseInt(process.env.BULLMQ_BACKOFF) || 500,
      },
    },
    name: `${pda.wallet}::create_or_update-loyalty_pass`,
    queueName: "create_or_update-loyalty_pass",
    children: [volumeJob, networkJob, transactionsJob].filter(
      (job) => job != undefined
    ),
  });
}

export default router;
