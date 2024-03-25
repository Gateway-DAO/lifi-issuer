import {
  CreateOrUpdateLoyaltyPassWorker,
  CredentialQueueWorker,
  UpdateLoyaltyPassFlowProducer,
} from "../../services/bull";
import {
  computeCampaignTier,
  computeLineaPoints,
  computeLineaTier,
  computePoints,
  computeTier,
  formatTier,
} from "../../utils/helpers";
import {
  CAMPAIGN_DATA,
  DESCRIPTION_TRANSLATED,
  METRICS_TRANSLATED,
  MONTHS_TRANSLATED,
  TIER_DATA,
} from "../../utils/constants";
import {
  Campaign,
  CampaignMetrics,
  GatewayMetrics,
  LineaMetrics,
} from "../../utils/types";

/**
 * MONTHLY PDAs
 */

export async function dispatchWalletHandler(credentialMetrics: GatewayMetrics) {
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

/**
 * ONE-OFF CAMPAIGNS
 */

export async function dispatchLineaHandler(lineaMetrics: LineaMetrics) {
  await CredentialQueueWorker.waitUntilReady();
  await CreateOrUpdateLoyaltyPassWorker.waitUntilReady();

  const volumeTier = computeLineaTier("volume", lineaMetrics.totalVolume);
  let volumePoints = computeLineaPoints("volume", volumeTier);

  const transactionsTier = computeLineaTier(
    "transactions",
    lineaMetrics.totalTransactions
  );
  let transactionsPoints = computeLineaPoints("transactions", transactionsTier);

  const children = [
    {
      name: `${lineaMetrics.wallet}`,
      queueName: "issue-credential",
      data: {
        recipient: lineaMetrics.wallet,
        title: `Linea Voyage`,
        description:
          "Representation of users bridging activity on Jumper Exchange during the Linea Voyage Campaign.",
        claim: {
          volume: Number(lineaMetrics.totalVolume).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }),
          transactions: lineaMetrics.totalTransactions,
          points: volumePoints + transactionsPoints,
        },
        image: "https://cdn.mygateway.xyz/implementations/linea+voyage.png",
        dataModelId: process.env.ONCHAIN_DM_ID,
        points: volumePoints + transactionsPoints,
        tags: ["DeFi", "Bridging"],
        campaign: "linea",
      },
      opts: {
        jobId: `issue-volume-${lineaMetrics.wallet}`,
      },
    },
  ];

  UpdateLoyaltyPassFlowProducer.add({
    name: `${lineaMetrics.wallet}`,
    queueName: "loyalty-pass",
    data: {
      wallet: lineaMetrics.wallet,
      campaign: "linea",
    },
    children,
    opts: {
      jobId: `loyaltypass-${lineaMetrics.wallet}`,
      attempts: parseInt(process.env.BULLMQ_RETRY) || 5,
      backoff: {
        type: "exponential",
        delay: parseInt(process.env.BULLMQ_BACKOFF) || 500,
      },
    },
  });
}

export async function dispatchCampaignHandler(
  campaignMetrics: CampaignMetrics,
  campaign: Campaign
) {
  await CredentialQueueWorker.waitUntilReady();
  await CreateOrUpdateLoyaltyPassWorker.waitUntilReady();

  const tier = computeCampaignTier(campaign, campaignMetrics.points);
  const campaignData = CAMPAIGN_DATA[campaign];

  const children = [
    {
      name: `${campaignMetrics.wallet}`,
      queueName: "issue-credential",
      data: {
        recipient: campaignMetrics.wallet,
        title: campaignData.title,
        description: campaignData.description,
        claim: {
          points: campaignMetrics.points,
          tier,
        },
        image: campaignData.image,
        dataModelId: campaignData.dataModel,
        points: campaignMetrics.points,
        tags: ["DeFi", "Bridging"],
        campaign,
      },
      opts: {
        jobId: `issue-${campaign}-${campaignMetrics.wallet}`,
      },
    },
  ];

  UpdateLoyaltyPassFlowProducer.add({
    name: `${campaignMetrics.wallet}`,
    queueName: "loyalty-pass",
    data: {
      wallet: campaignMetrics.wallet,
      campaign,
    },
    children,
    opts: {
      jobId: `loyaltypass-${campaignMetrics.wallet}`,
      attempts: parseInt(process.env.BULLMQ_RETRY) || 5,
      backoff: {
        type: "exponential",
        delay: parseInt(process.env.BULLMQ_BACKOFF) || 500,
      },
    },
  });
}
