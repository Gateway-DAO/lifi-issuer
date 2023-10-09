import { Job, Worker } from "bullmq";
import { Gateway } from "../protocol";
import { defaultConnectionOpts, defaultWorkerOpts } from "./config";
import CredentialQueueData from "./credential.data";

const gt = new Gateway();

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
    let recipientUser: Record<string, any>;
    try {
      recipientUser = await gt.getUserByWallet(recipient);
      job.log(`recipientUser: ${recipientUser?.id}`);
    } catch (err) {
      job.log(`Error getting the user for wallet ${recipient}`);
      throw new Error("Error getting the user, please try again later");
    }

    // check for existing user's credentials
    let existingCredByDM: Record<string, any>;
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
      job.log(`Wallet ${recipient} has no associated duplicates`);
    }

    job.updateProgress(66);

    const cred = await gt.issueCredential({
      recipient,
      title,
      description,
      claim,
      dataModelId,
      orgId: process.env.ORG_ID,
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
    ...defaultWorkerOpts,
    autorun: true,
  }
);

export default CredentialQueueWorker;
