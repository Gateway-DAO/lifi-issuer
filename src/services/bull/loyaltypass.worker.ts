import { Job, Worker } from "bullmq";
import {
  LOYALTY_DM_ID,
  LOYALTY_PASS_TIERS,
  ORG_ID,
  TIER_DATA,
} from "../../utils/tiers";
import { defaultWorkerOpts } from "./config";
import LoyaltyPassQueueData from "./loyaltypass.data";
import { Gateway, UserIdentifierType } from "@gateway-dao/sdk";
import { DecryptedPDA } from "@gateway-dao/sdk/dist/gatewaySdk";

const gt = new Gateway({
  apiKey: process.env.PROTOCOL_API_KEY,
  url: process.env.PROTOCOL_GRAPHQL_URL as string,
  token: process.env.PROTOCOL_API_JWT as string,
});

const CreateOrUpdateLoyaltyPassWorker = new Worker<LoyaltyPassQueueData>(
  "loyalty-pass",
  async (job: Job) => {
    // Find protocol::User for wallet
    const wallet = job.data.wallet;

    const wallet_userId = (
      await gt.user.getSingleUser({
        type: UserIdentifierType.EVM,
        value: wallet,
      })
    )?.user.id;

    job.log(`[wallet ${wallet}] walletUser: ${wallet_userId}`);

    if (!wallet_userId) {
      throw new Error(`[wallet ${wallet}] User doesn't exist`);
    }

    // Aggregate totals for Loyalty Pass Credential
    let totalTxs = 0;
    let totalChains = 0;
    let totalVolume = 0;
    let points = 0;

    const credsByDM = await gt.pda.getPDAs({
      filter: {
        dataModelIds: [
          TIER_DATA["volume"].data_model,
          TIER_DATA["transactions"].data_model,
          TIER_DATA["networks"].data_model,
          ...(process.env.ONCHAIN_DM_ID ? [process.env.ONCHAIN_DM_ID] : []),
        ],
        owner: {
          type: UserIdentifierType.USER_ID,
          value: wallet_userId,
        },
      },
    });

    credsByDM.PDAs.forEach((cred) => {
      job.log(JSON.stringify(cred));

      const asset = cred.dataAsset as DecryptedPDA;

      // 20 points for Linea Voyage
      points +=
        cred.id === process.env.ONCHAIN_DM_ID
          ? 20
          : cred.dataAsset.claim.points;

      // if jumper onchain, aggregate loyalty pass metrics
      if (
        [
          TIER_DATA["volume"].data_model,
          TIER_DATA["transactions"].data_model,
          TIER_DATA["networks"].data_model,
        ].includes(asset.dataModel.id)
      ) {
        if (asset.claim?.volume) {
          totalVolume += Number(asset.claim.volume.replace(/\$|,/g, ""));
        } else if (asset.claim?.transactions) {
          totalTxs += asset.claim.transactions;
        } else if (asset.claim?.chains) {
          totalChains += asset.claim.chains;
        }
      }
    });

    // if the user does not have any points, skip
    if (points == 0) {
      return {};
    }

    // Check if user has a loyalty pass
    const credByLPDM = await gt.pda.getPDAs({
      filter: {
        owner: {
          type: UserIdentifierType.USER_ID,
          value: wallet_userId,
        },
        dataModelIds: [LOYALTY_DM_ID],
      },
    });

    if (credByLPDM !== undefined && credByLPDM.PDAs.length > 0) {
      job.log(
        `[wallet: ${wallet}] Wallet has ${credByLPDM.PDAs.length} Loyalty Passes`
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
        await gt.pda.updatePDA({
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

      await gt.pda.createPDA({
        owner: {
          type: UserIdentifierType.EVM,
          value: wallet,
        },
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
        organization: {
          type: "ORG_ID",
          value: ORG_ID,
        },
        dataModelId: LOYALTY_DM_ID,
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
    ...defaultWorkerOpts,
  }
);

export default CreateOrUpdateLoyaltyPassWorker;
