import { Queue } from "bullmq";
import { defaultQueueOpts } from "./config";
import CredentialQueueData from "./credential.data";

export const CredentialQueue = new Queue<CredentialQueueData>(
  "issue-credential",
  defaultQueueOpts
);

export default CredentialQueue;
