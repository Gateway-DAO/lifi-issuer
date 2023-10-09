import { FlowProducer } from "bullmq";
import { defaultConnectionOpts } from "./config";

const UpdateLoyaltyPassFlowProducer = new FlowProducer({
  ...defaultConnectionOpts,
});

export default UpdateLoyaltyPassFlowProducer;
