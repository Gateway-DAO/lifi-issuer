import { Job, Worker } from "bullmq";
import {
  LOYALTY_DM_ID,
  LOYALTY_PASS_TIERS,
  ORG_ID,
  TIER_DATA,
} from "../../utils/tiers";
import { Gateway } from "../../services/protocol";
import { defaultWorkerOpts } from "./config";
import LoyaltyPassQueueData from "./loyaltypass.data";

const gt = new Gateway();

const CreateOrUpdateLoyaltyPassWorker = new Worker<LoyaltyPassQueueData>(
  "loyalty-pass",
  async (job: Job) => {
    // Find protocol::User for wallet
    const wallet = job.data.wallet;

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
        TIER_DATA["volume"].data_model,
        TIER_DATA["transactions"].data_model,
        TIER_DATA["networks"].data_model,
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
    ...defaultWorkerOpts,
  }
);

export default CreateOrUpdateLoyaltyPassWorker;
