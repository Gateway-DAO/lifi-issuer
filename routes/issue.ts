import { FlowProducer, Queue, Worker } from "bullmq";
import { ethers } from "ethers";
import { Router } from "express";
import { default as _ } from "lodash";
import {
  BullConnectionConfig,
  BullQueueConfig,
  BullWorkerConfig,
} from "../services/bull";
import { Credential as GTWCredential, Gateway } from "../services/protocol";

const gt = new Gateway();
gt.jwt = process.env.PROTOCOL_API_JWT;

/**
 * Helpers
 */

function formatTier(text: string): string {
  if (text == "baby") return "Novice";

  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ----

/**
 * Queues
 */

export const IssueProtocolQueue = new Queue<IssueProtocolData>(
  "issue-protocol",
  {
    ...BullQueueConfig,
  }
);

export const CreateOrUpdateLoyaltyPassQueue =
  new Queue<CreateOrUpdateLoyaltyPassData>("create_or_update-loyalty_pass", {
    ...BullQueueConfig,
  });

// ----

/**
 * LIFI - ISSUE PDAS
 */

/**
 * Step 1 - issue on protocol
 */
type IssueProtocolData = {
  recipient: string;
  title: string;
  description: string;
  claim: any;
  dataModelId: string;
  tags: string[];
  image: string;
  needsDapp?: boolean;
  gateId?: string;
  points?: number;
};
const IssueProtocolDataWorker = new Worker<IssueProtocolData>(
  "issue-protocol",
  async (job) => {
    job.updateProgress(25);

    const { recipient, title, description, claim, dataModelId, tags, image } =
      job.data;

    // start job
    job.log(`Getting ${recipient} user...`);
    console.log(`Getting ${recipient} user...`);

    // check for existing user by wallet
    let recipientUser;
    try {
      recipientUser = await gt.getUserByWallet(recipient);
      job.log(`recipientUser: ${recipientUser?.id}`);
    } catch (err) {
      job.log(`Error getting the user for wallet ${recipient}`);
      throw new Error("Error getting the user, please try again later");
    }

    // check for existing user's credentials
    let existingCredByDM;
    if (recipientUser) {
      existingCredByDM = await gt.earnedCredentialsByIdByDataModels(
        recipientUser.id,
        [dataModelId]
      );
    }

    if (existingCredByDM) {
      job.log(
        `[wallet ${recipient}] existingCredByDM: ${JSON.stringify(
          existingCredByDM
        )}`
      );

      console.log(
        `[wallet ${recipient}] existingCredByDM: ${JSON.stringify(
          existingCredByDM
        )}`
      );

      const cred = existingCredByDM.find(
        (cred) => cred.title === title && cred.dataModel.id === dataModelId
      );

      if (cred) {
        job.log(
          "Redundant issuance: " +
            JSON.stringify({
              dedupe: true,
              recipient: recipient,
            })
        );

        job.updateProgress(100);

        return { recipient, cred, needsDapp: false };
      }

      job.log(`Wallet ${recipient} has no associated duplicates`);
    } else {
      job.log(`Wallet ${recipient} is not associated with a user`);
    }

    job.updateProgress(66);

    const cred = await gt.issueCredential({
      recipient,
      title,
      description,
      claim,
      dataModelId,
      orgId: ORG_ID,
      tags,
      image,
    });

    job.updateProgress(100);

    return {
      cred,
      recipient,
    };
  },
  {
    ...BullWorkerConfig,
  }
);

/**
 * Step 2 - Create or Update Wallet's Loyalty Pass
 */
type CreateOrUpdateLoyaltyPassData = {
  recipient: string;
};
const CreateOrUpdateLoyaltyPassWorker =
  new Worker<CreateOrUpdateLoyaltyPassData>(
    "create_or_update-loyalty_pass",
    async (job) => {
      const childrenValues = await job.getChildrenValues();

      // Find protocol::User for wallet
      const wallet = (Object.values(childrenValues)[0] || job.data).recipient;

      const wallet_userId = (await gt.getUserByWallet(wallet))?.id;
      job.log(`[wallet ${wallet}] walletUser: ${wallet_userId}`);

      if (!wallet_userId) {
        throw new Error(`[wallet ${wallet}] User doesn't exist`);
      }

      // Aggregate totals for Loyalty Pass Credential
      let totalTxs = 0;
      let totalChains = 0;
      let totalVolume = 0;
      let points = 0;

      const credsByDM = await gt.earnedCredentialsByIdByDataModels(
        wallet_userId,
        [
          DATA["volume"].data_model,
          DATA["transactions"].data_model,
          DATA["networks"].data_model,
        ]
      );

      credsByDM.forEach((cred) => {
        job.log(JSON.stringify(cred));
        points += cred.claim.points;
        if (cred.claim.volume) {
          totalVolume += Number(cred.claim.volume.replace(/\$|,/g, ""));
        } else if (cred.claim.transactions) {
          totalTxs += cred.claim.transactions;
        } else if (cred.claim.chains) {
          totalChains += cred.claim.chains;
        }
      });

      // if the user does not have any points, skip
      if (points == 0) {
        return {};
      }

      // Check if user has a loyalty pass
      const credByLPDM = await gt.earnedCredentialsByIdByDataModels(
        wallet_userId,
        [LOYALTY_DM_ID]
      );
      if (credByLPDM !== undefined && credByLPDM.length > 0) {
        job.log(
          `[wallet: ${wallet}] Wallet has ${credByLPDM.length} Loyalty Passes`
        );

        // -> update if exists
        const lp = credByLPDM[0];

        // - -> only update if totalPoints are different
        if (
          lp.claim.points != points ||
          lp.claim.totalTxs != totalTxs ||
          lp.claim.totalChains != totalChains ||
          Number(lp.claim.totalVolume.replace(/\$|,/g, "")) !== totalVolume
        ) {
          job.log(
            `[wallet ${wallet}] update lp points: ${lp.claim.points} => ${points}`
          );
          job.log(
            `new claims: ${JSON.stringify({
              ...lp.claim,
              points,
              totalTxs,
              totalChains,
              totalVolume: Number(totalVolume).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              }),
              tier: Object.values(LOYALTY_PASS_TIERS).find(
                (tier) => tier.min <= points && tier.max >= points
              ).title,
            })}`
          );
          await gt.updateCredential({
            id: lp.id,
            claim: {
              ...lp.claim,
              points,
              totalTxs,
              totalChains,
              totalVolume: Number(totalVolume).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              }),
              tier: Object.values(LOYALTY_PASS_TIERS).find(
                (tier) => tier.min <= points && tier.max >= points
              ).title,
            },
          });
        } else {
          job.log(
            `[wallet ${wallet}] no update needed lp: ${{
              points,
              totalTxs,
              totalChains,
              totalVolume: Number(totalVolume).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              }),
              tier: Object.values(LOYALTY_PASS_TIERS).find(
                (tier) => tier.min <= points && tier.max >= points
              ).title,
            }}`
          );

          return {};
        }
      } else {
        // -> create new one if it does not exist
        job.log(
          `[wallet ${wallet}] new lp: ${JSON.stringify({
            points: points,
            totalTxs,
            totalChains,
            totalVolume: Number(totalVolume).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            }),
          })}`
        );

        await gt.issueCredential({
          recipient: wallet,
          title: "LI.FI Loyalty Pass",
          description: `LI.FI Loyalty Pass is a user-owned and operated consumer recognition method. Using the Loyalty Pass, LI.FI issues private data assets for on-chain activity via Jumper Exchange, interacting with community campaigns, and other engagement across LI.FI powered products.This loyalty pass can be used in the future for unique experiences and benefits across the LI.FI ecosystem`,
          claim: {
            points: points,
            totalTxs,
            totalChains,
            totalVolume: Number(totalVolume).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            }),
            tier: Object.values(LOYALTY_PASS_TIERS).find(
              (tier) => tier.min <= points && tier.max >= points
            ).title,
          },
          orgId: ORG_ID,
          dataModelId: LOYALTY_DM_ID,
          tags: ["DeFi", "Bridging"],
          image:
            "https://cdn.mygateway.xyz/implementations/jumper_loyalty_pass.png",
        });
      }

      return {
        points,
        totalTxs,
        totalChains,
        totalVolume: Number(totalVolume).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
        tier: Object.values(LOYALTY_PASS_TIERS).find(
          (tier) => tier.min <= points && tier.max >= points
        ).title,
      };
    },
    {
      ...BullWorkerConfig,
      autorun: true,
    }
  );

const UpdateLoyaltyPassFlowProducer = new FlowProducer({
  ...BullConnectionConfig,
});

// ----

/**
 * Router
 */
const router = Router();

type LifiWalletReport = {
  wallet: string;
  month: string;
  totalTransactions: number;
  totalUniqueNetworks: number;
  totalVolume: number;
};

router.post("/lifi-lp", async (req, res) => {
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

router.post("/lifi-pda", async (req, res) => {
  // collect loyaltypass and pda filepaths from the request header
  const { loyaltypass, pda } = req.headers;
  if (!pda) {
    res.status(400).send("Missing PDA file as header");
  }

  const pdas: LifiWalletReport[] = require(pda as string);
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

async function dispatchWalletHandler(pda: LifiWalletReport) {
  await Promise.all([
    IssueProtocolDataWorker.waitUntilReady(),
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
        title: `${TITLE["volume"]} - ${MONTH_TRANSLATED[pda.month]}`,
        description: DESCRIPTION_TRANSLATED["volume"],
        claim: {
          volume: Number(pda.totalVolume).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }),
          tier: formatTier(volumeTier),
          points: volumePoints,
        },
        image: DATA["volume"].images[volumeTier],
        dataModelId: DATA["volume"].data_model,
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
        title: `${TITLE["networks"]} - ${MONTH_TRANSLATED[pda.month]}`,
        description: DESCRIPTION_TRANSLATED["networks"],
        claim: {
          chains: pda.totalUniqueNetworks,
          tier: formatTier(networkTier),
          points: networkPoints,
        },
        image: DATA["networks"].images[networkTier],
        dataModelId: DATA["networks"].data_model,
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
        title: `${TITLE["transactions"]} - ${MONTH_TRANSLATED[pda.month]}`,
        description: DESCRIPTION_TRANSLATED["transactions"],
        claim: {
          transactions: pda.totalTransactions,
          tier: formatTier(transactionsTier),
          points: transactionsPoints,
        },
        image: DATA["transactions"].images[transactionsTier],
        dataModelId: DATA["transactions"].data_model,
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
// ----

/*
 * Constants
 */

const ORG_ID = "fc619d2d-84c9-4f9c-88fe-ccddb5c37f51";
const DAPP_ORG_ID = "ac817945-f61c-4834-8608-d5e51089bf50";

const LOYALTY_DM_ID = "3fd0a00b-0a07-4178-8f22-f69fe626dca0";
// const LOYALTY_DAPP_ID = '4446a700-4ebb-4edd-b830-880c810bdc03';

const LOYALTY_PASS_TIERS = {
  baby: {
    min: 0,
    max: 50,
    title: "Novice",
  },
  bronze: {
    min: 51,
    max: 150,
    title: "Bronze",
  },
  silver: {
    min: 151,
    max: 350,
    title: "Silver",
  },
  gold: {
    min: 350,
    max: 700,
    title: "Gold",
  },
  platinum: {
    min: 701,
    max: 1100,
    title: "Platinum",
  },
  tungsten: {
    min: 1101,
    max: 9999999999999,
    title: "Tungsten",
  },
};

const DATA = {
  networks: {
    data_model: "42bf727e-0f82-46e6-9f2a-80ed5b620466",
    images: {
      baby: "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/01+Chains+-+Novice.png",
      power_user:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/02+Chains+-+Power.png",
      chad: "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/03+Chains+-+Chad.png",
      ape: "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/04+Chains+-+Ape.png",
      degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/05+Chains+-+Degen.png",
      grand_degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/06+Chains+-+Grand.png",
    },
    points: {
      baby: 5,
      power_user: 10,
      chad: 15,
      ape: 20,
      degen: 25,
      grand_degen: 30,
    },
  },
  transactions: {
    data_model: "ac17ff52-ee78-46e1-96f9-888656a61b17",
    images: {
      baby: "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/01+Transactions+-+Novice.png",
      power_user:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/02+Transactions+-+Power.png",
      chad: "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/03+Transactions+-+Chad.png",
      ape: "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/04+Transactions+-+Ape.png",
      degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/05+Transactions+-+Degen.png",
      grand_degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/06+Transactions+-+Grand.png",
    },
    points: {
      baby: 10,
      power_user: 18,
      chad: 25,
      ape: 33,
      degen: 40,
      grand_degen: 50,
    },
  },
  volume: {
    data_model: "d0d1906c-176f-40db-ba2b-39f7080e8f21",
    images: {
      baby: "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/01+Volume+-+Novice.png",
      power_user:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/02+Volume+-+Power.png",
      chad: "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/03+Volume+-+Chad.png",
      ape: "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/04+Volume+-+Ape.png",
      degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/05+Volume+-+Degen.png",
      grand_degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/06+Volume+-+Grand.png",
    },
    points: {
      baby: 10,
      power_user: 18,
      chad: 25,
      ape: 33,
      degen: 40,
      grand_degen: 50,
    },
  },
};

const TIERS = {
  none: {
    volume: 0,
    transactions: 0,
    networks: 0,
  },
  baby: {
    volume: 100,
    transactions: 1,
    networks: 1,
  },
  power_user: {
    volume: 1000,
    transactions: 10,
    networks: 5,
  },
  chad: {
    volume: 10000,
    transactions: 50,
    networks: 10,
  },
  ape: {
    volume: 50000,
    transactions: 250,
    networks: 14,
  },
  degen: {
    volume: 250_000,
    transactions: 500,
    networks: 17,
  },
  grand_degen: {
    volume: 1_000_000,
    transactions: 1000,
    networks: 20,
  },
};

const sortedTiers = [
  "grand_degen",
  "degen",
  "ape",
  "chad",
  "power_user",
  "baby",
];

const computeTier = (metric: string, value: number): string => {
  const tier = sortedTiers.find((tier) => {
    return value >= TIERS[tier][metric];
  });
  return tier;
};
const computePoints = (metric: string, tier: string): number => {
  return DATA[metric]["points"][tier];
};

const TITLE = {
  networks: "Chainoor",
  transactions: "Transactoor",
  volume: "Volumoor",
};

const MONTH_TRANSLATED = {
  MAR: "March",
  APR: "April",
  MAY: "May",
  JUN: "June",
  JUL: "July",
  AUG: "August",
  SEP: "September",
  OCT: "October",
  NOV: "November",
  DEC: "December",
};

const DESCRIPTION_TRANSLATED = {
  volume:
    "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total volume transacted.",
  transactions:
    "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total # of TXs completed.",
  networks:
    "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the unique chains used.",
};
