import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import CredentialQueue from "../services/bull/credential.queue";
import CreateOrUpdateLoyaltyPassQueue from "../services/bull/loyaltypass.queue";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/bull");

createBullBoard({
  queues: [
    new BullMQAdapter(CredentialQueue),
    new BullMQAdapter(CreateOrUpdateLoyaltyPassQueue),
  ],
  serverAdapter,
});

export default serverAdapter.getRouter();
