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
  MONTHS_TRANSLATED,
  TIER_DATA,
} from "../../utils/constants";
import {
  Campaign,
  CampaignMetrics,
  GatewayMetrics,
  LineaMetrics,
  MonthlyPDA,
} from "../../utils/types";

/**
 * MONTHLY PDAs
 */

export async function dispatchWalletHandlerV1(
  credentialMetrics: GatewayMetrics
) {
  await CredentialQueueWorker.waitUntilReady();
  await CreateOrUpdateLoyaltyPassWorker.waitUntilReady();

  // Volume PDA
  let volumeJob = getJob(MonthlyPDA.VOLUME, credentialMetrics);

  // Network PDA
  let networkJob = getJob(MonthlyPDA.NETWORKS, credentialMetrics);

  // Transaction PDA
  let transactionsJob = getJob(MonthlyPDA.TRANSACTIONS, credentialMetrics);

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

export async function dispatchWalletHandler(credentialMetrics: GatewayMetrics) {
  await CredentialQueueWorker.waitUntilReady();
  await CreateOrUpdateLoyaltyPassWorker.waitUntilReady();

  // Bridge PDA
  let bridgeJob = getJob(MonthlyPDA.BRIDGE, credentialMetrics);

  // Transaction PDA
  let transactionsJob = getJob(MonthlyPDA.TRANSACT, credentialMetrics);

  // Chain PDA
  let chainJob = getJob(MonthlyPDA.CHAIN, credentialMetrics);

  // Swap PDA
  let swapJob = getJob(MonthlyPDA.SWAP, credentialMetrics);

  UpdateLoyaltyPassFlowProducer.add({
    name: `${credentialMetrics.wallet}`,
    queueName: "loyalty-pass",
    data: {
      wallet: credentialMetrics.wallet,
    },
    children: [bridgeJob, transactionsJob, chainJob, swapJob].filter(
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

function getJob(metric: MonthlyPDA, data: GatewayMetrics) {
  const value = {
    [MonthlyPDA.VOLUME]: ["volume", data.totalVolume],
    [MonthlyPDA.TRANSACTIONS]: ["transactions", data.totalTransactions],
    [MonthlyPDA.NETWORKS]: ["chains", data.totalUniqueNetworks],

    [MonthlyPDA.BRIDGE]: ["volume", (data as GatewayMetrics).totalBridge],
    [MonthlyPDA.SWAP]: ["volume", (data as GatewayMetrics).totalVolume],
    [MonthlyPDA.CHAIN]: [
      "chains",
      (data as GatewayMetrics).totalUniqueNetworks,
    ],
    [MonthlyPDA.TRANSACT]: [
      "transactions",
      (data as GatewayMetrics).totalTransactions,
    ],
  }[metric];

  const tier = computeTier(metric, value[1] as number);

  let points = 0;
  let job = undefined;

  if (tier != undefined) {
    console.log(`[wallet ${data.wallet}::month ${data.month}] tier: ${tier}`);
    points = computePoints(metric, tier);

    job = {
      name: `${data.wallet}-${data.month}-${metric}`,
      queueName: "issue-credential",
      data: {
        recipient: data.wallet,
        title: `${TIER_DATA[metric].title} - ${MONTHS_TRANSLATED[data.month]}`,
        description: TIER_DATA[metric].description,
        claim: {
          ...{
            [value[0]]:
              metric == MonthlyPDA.VOLUME ||
              metric == MonthlyPDA.SWAP ||
              metric == MonthlyPDA.BRIDGE
                ? Number(value[1]).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })
                : value[1],
          },
          tier: formatTier(tier),
          points,
        },
        image: TIER_DATA[metric].image || TIER_DATA[metric].images[tier],
        dataModelId: TIER_DATA[metric].data_model,
        points,
      },
      opts: {
        jobId: `issue-${metric}-${data.month}-${data.wallet}`,
      },
    };
  }

  return job;
}

/**
 * ONE-OFF CAMPAIGNS
 */

export async function dispatchLineaHandler(lineaMetrics: LineaMetrics) {
  await CredentialQueueWorker.waitUntilReady();
  await CreateOrUpdateLoyaltyPassWorker.waitUntilReady();

  const volumeTier = computeLineaTier(
    MonthlyPDA.VOLUME,
    lineaMetrics.totalVolume
  );
  let volumePoints = computeLineaPoints(MonthlyPDA.VOLUME, volumeTier);

  const transactionsTier = computeLineaTier(
    MonthlyPDA.TRANSACTIONS,
    lineaMetrics.totalTransactions
  );
  let transactionsPoints = computeLineaPoints(
    MonthlyPDA.TRANSACTIONS,
    transactionsTier
  );

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
        dataModelId: campaignData.data_model,
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
