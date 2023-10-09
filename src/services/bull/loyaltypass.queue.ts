import { Queue } from "bullmq";
import { defaultQueueOpts } from "./config";
import LoyaltyPassQueueData from "./loyaltypass.data";

export const CreateOrUpdateLoyaltyPassQueue = new Queue<LoyaltyPassQueueData>(
  "loyalty-pass",
  defaultQueueOpts
);

export default CreateOrUpdateLoyaltyPassQueue;
