import { ethers } from "ethers";

/**
 * LI.FI Exported Wallet Metadata
 */
export type LifiWalletReport = {
  _id: string;
  fromAddress: string;
  bucket: string;
  sumTransferUsd: number;
  sumBridgeTransferUsd?: number;
  transfers: number;
  chainCount: number;
};

/**
 * LI.FI Exported Campaign Metadata
 */

export type LifiLineaReport = {
  _id: string;
  count: number;
  volume: number;
};

// NOTE: OG, Boostor and TransferTo campaigns follow the same structure
export type LifiCampaignReport = {
  _id: string;
  points: number;
  fromAddress: string;
};
/**
 * Gateway PDA Metrics
 */
export type GatewayMetrics = {
  wallet: string;
  totalTransactions: number;
  totalUniqueNetworks: number;
  totalVolume: number;
  totalBridge?: number;
  month?: Month;
};

export type LineaMetrics = {
  wallet: string;
  totalTransactions: number;
  totalVolume: number;
};

// NOTE: OG, Boostor and TransferTo campaigns follow the same structure
export type CampaignMetrics = {
  wallet: string;
  points: number;
};

export enum MonthlyPDA {
  // V1
  NETWORKS = "networks",
  VOLUME = "volume",
  TRANSACTIONS = "transactions",

  // V2
  SWAP = "swap",
  BRIDGE = "bridge",
  CHAIN = "chain",
  TRANSACT = "transact",
}

export enum Campaign {
  OG = "og",
  BOOSTOR = "boostor",
  TRANSFERTO = "transferto",
  LINEA = "linea",
}

export function getCampaignType(campaign: string): Campaign {
  switch (campaign) {
    case "og":
      return Campaign.OG;
    case "boostor":
      return Campaign.BOOSTOR;
    case "transferto":
      return Campaign.TRANSFERTO;
    case "linea":
      return Campaign.LINEA;
    default:
      throw new Error("Invalid campaign type");
  }
}

export function parseLifiData(lifiData: LifiWalletReport): GatewayMetrics {
  return {
    wallet: ethers.getAddress(lifiData.fromAddress),
    month: new Date(lifiData.bucket.split("-")[1])
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase() as Month,
    totalBridge: lifiData?.sumBridgeTransferUsd,
    totalTransactions: lifiData.transfers,
    totalUniqueNetworks: lifiData.chainCount,
    totalVolume: lifiData.sumTransferUsd,
  };
}

export enum Month {
  JAN = "JAN",
  FEB = "FEB",
  MAR = "MAR",
  APR = "APR",
  MAY = "MAY",
  JUN = "JUN",
  JUL = "JUL",
  AUG = "AUG",
  SEP = "SEP",
  OCT = "OCT",
  NOV = "NOV",
  DEC = "DEC",
}
