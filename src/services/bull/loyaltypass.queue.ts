import { Queue } from "bullmq";
import { defaultQueueOpts } from "./config";
import LoyaltyPassQueueData from "./loyaltypass.data";

export const CreateOrUpdateLoyaltyPassQueue = new Queue<LoyaltyPassQueueData>(
  "create_or_update-loyalty_pass",
  {
    ...defaultQueueOpts,
  }
);

export default CreateOrUpdateLoyaltyPassQueue;
