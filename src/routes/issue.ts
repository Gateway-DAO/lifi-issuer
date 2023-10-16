import { ethers } from "ethers";
import { Router } from "express";
import {
  CreateOrUpdateLoyaltyPassQueue,
  CreateOrUpdateLoyaltyPassWorker,
  CredentialQueueWorker,
  UpdateLoyaltyPassFlowProducer,
} from "../services/bull";
import {
  DESCRIPTION_TRANSLATED,
  METRICS_TRANSLATED,
  MONTHS_TRANSLATED,
  TIER_DATA,
  computePoints,
  computeTier,
  formatTier,
} from "../utils/tiers";
import {
  GatewayMetrics,
  LifiWalletReport,
  parseLifiData,
} from "../utils/types";

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

async function dispatchWalletHandler(credentialMetrics: GatewayMetrics) {
  await CredentialQueueWorker.waitUntilReady();
  await CreateOrUpdateLoyaltyPassWorker.waitUntilReady();

  // Volume PDA
  const volumeTier = computeTier("volume", credentialMetrics.totalVolume);
  let volumePoints = 0;
  let volumeJob = undefined;
  if (volumeTier != undefined) {
    console.log(
      `[wallet ${credentialMetrics.wallet}::month ${credentialMetrics.month}] volumeTier: ${volumeTier}`
    );
    volumePoints = computePoints("volume", volumeTier);

    volumeJob = {
      name: `${credentialMetrics.wallet}-${credentialMetrics.month}-volume`,
      queueName: "issue-credential",
      data: {
        recipient: credentialMetrics.wallet,
        title: `${METRICS_TRANSLATED["volume"]} - ${
          MONTHS_TRANSLATED[credentialMetrics.month]
        }`,
        description: DESCRIPTION_TRANSLATED["volume"],
        claim: {
          volume: Number(credentialMetrics.totalVolume).toLocaleString(
            "en-US",
            {
              style: "currency",
              currency: "USD",
            }
          ),
          tier: formatTier(volumeTier),
          points: volumePoints,
        },
        image: TIER_DATA["volume"].images[volumeTier],
        dataModelId: TIER_DATA["volume"].data_model,
        points: volumePoints,
        tags: ["DeFi", "Bridging"],
      },
      opts: {
        jobId: `issue-volume-${credentialMetrics.month}-${credentialMetrics.wallet}`,
      },
    };
  }

  // Network PDA
  const networkTier = computeTier(
    "networks",
    credentialMetrics.totalUniqueNetworks
  );
  let networkPoints = 0;
  let networkJob = undefined;
  if (networkTier != undefined) {
    console.log(
      `[wallet ${credentialMetrics.wallet}::month ${credentialMetrics.month}] networkTier: ${networkTier}`
    );
    networkPoints = computePoints("networks", networkTier);

    networkJob = {
      name: `${credentialMetrics.wallet}-${credentialMetrics.month}-network`,
      queueName: "issue-credential",
      data: {
        recipient: credentialMetrics.wallet,
        title: `${METRICS_TRANSLATED["networks"]} - ${
          MONTHS_TRANSLATED[credentialMetrics.month]
        }`,
        description: DESCRIPTION_TRANSLATED["networks"],
        claim: {
          chains: credentialMetrics.totalUniqueNetworks,
          tier: formatTier(networkTier),
          points: networkPoints,
        },
        image: TIER_DATA["networks"].images[networkTier],
        dataModelId: TIER_DATA["networks"].data_model,
        points: networkPoints,
        tags: ["DeFi", "Bridging"],
      },
      opts: {
        jobId: `issue-network-${credentialMetrics.month}-${credentialMetrics.wallet}`,
      },
    };
  }

  // Transaction PDA
  const transactionsTier = computeTier(
    "transactions",
    credentialMetrics.totalTransactions
  );
  let transactionsPoints = 0;
  let transactionsJob = undefined;
  if (transactionsTier != undefined) {
    console.log(
      `[wallet ${credentialMetrics.wallet}::month ${credentialMetrics.month}] transactionsTier: ${transactionsTier}`
    );
    transactionsPoints = computePoints("transactions", transactionsTier);

    transactionsJob = {
      name: `${credentialMetrics.wallet}-${credentialMetrics.month}-txn`,
      queueName: "issue-credential",
      data: {
        recipient: credentialMetrics.wallet,
        title: `${METRICS_TRANSLATED["transactions"]} - ${
          MONTHS_TRANSLATED[credentialMetrics.month]
        }`,
        description: DESCRIPTION_TRANSLATED["transactions"],
        claim: {
          transactions: credentialMetrics.totalTransactions,
          tier: formatTier(transactionsTier),
          points: transactionsPoints,
        },
        image: TIER_DATA["transactions"].images[transactionsTier],
        dataModelId: TIER_DATA["transactions"].data_model,
        points: transactionsPoints,
        tags: ["DeFi", "Bridging"],
      },
      opts: {
        jobId: `issue-txn-${credentialMetrics.month}-${credentialMetrics.wallet}`,
      },
    };
  }

  UpdateLoyaltyPassFlowProducer.add({
    name: `${credentialMetrics.wallet}`,
    queueName: "loyalty-pass",
    data: {
      wallet: credentialMetrics.wallet,
    },
    children: [volumeJob, networkJob, transactionsJob].filter(
      (job) => job != undefined
    ),
    opts: {
      jobId: `loyaltypass-${credentialMetrics.wallet}`,
      attempts: parseInt(process.env.BULLMQ_RETRY) || 5,
      backoff: {
        type: "exponential",
        delay: parseInt(process.env.BULLMQ_BACKOFF) || 500,
      },
    },
  });
}

export default router;
