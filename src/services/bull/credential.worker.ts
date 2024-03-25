import { Job, Worker } from "bullmq";
import { defaultWorkerOpts } from "./config";
import CredentialQueueData from "./credential.data";
import {
  Gateway,
  OrganizationIdentifierType,
  UserIdentifierType,
} from "@gateway-dao/sdk";
import {
  PDAs_queryQuery,
  user_queryQuery,
} from "@gateway-dao/sdk/dist/gatewaySdk";

const gt = new Gateway({
  apiKey: process.env.PROTOCOL_API_KEY,
  url: process.env.PROTOCOL_GRAPHQL_URL as string,
  token: process.env.PROTOCOL_API_JWT as string,
});

const CredentialQueueWorker = new Worker<CredentialQueueData>(
  "issue-credential",
  async (job: Job) => {
    job.updateProgress(25);

    const { recipient, title, description, claim, dataModelId, tags, image } =
      job.data;

    // start job
    job.log(`Getting ${recipient} user...`);
    console.log(`Getting ${recipient} user...`);

    // check for existing user by wallet
    let recipientUser: user_queryQuery;
    try {
      recipientUser = await gt.user.getSingleUser({
        type: UserIdentifierType.EVM,
        value: recipient,
      });
      job.log(`recipientUser: ${recipientUser?.user?.id}`);
    } catch (err) {
      job.log(`Error getting the user for wallet ${recipient}`);
      await new Promise((resolve) =>
        setTimeout(resolve, parseInt(process.env.BULLMQ_BACKOFF))
      );
    }

    // check for existing user's credentials
    let existingCredByDM: PDAs_queryQuery;
    if (recipientUser?.user?.id) {
      existingCredByDM = await gt.pda.getPDAs({
        filter: {
          dataModelIds: [dataModelId],
          owner: {
            type: UserIdentifierType.USER_ID,
            value: recipientUser.user.id,
          },
        },
      });
    }

    if (existingCredByDM) {
      job.log(
        `[wallet ${recipient}] existingCredByDM: ${JSON.stringify(
          existingCredByDM
        )}`
      );

      const cred = existingCredByDM.PDAs.find(
        (cred) => cred.dataAsset.title === title && cred.id === dataModelId
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
      job.log(`Wallet ${recipient} has no associated duplicates`);
    }

    job.updateProgress(66);

    const cred = await gt.pda.createPDA({
      owner: {
        type: UserIdentifierType.EVM,
        value: recipient,
      },
      title,
      description,
      claim,
      dataModelId,
      organization: {
        type: OrganizationIdentifierType.ORG_ID,
        value: process.env.ORG_ID,
      },
      image,
    });

    job.updateProgress(100);

    return {
      cred,
      recipient,
    };
  },
  {
    ...defaultWorkerOpts,
    autorun: true,
  }
);

export default CredentialQueueWorker;
