import { ethers } from "ethers";

/**
 * LI.FI Exported Wallet Metadata
 */
export type LifiWalletReport = {
  _id: string;
  fromAddress: string;
  bucket: string;
  sumTransferUsd: number;
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

export enum Campaign {
  OG = "OG",
  BOOSTOR = "BOOSTOR",
  TRANSFERTO = "TRANSFERTO",
  LINEA = "LINEA",
}

export function parseLifiData(lifiData: LifiWalletReport): GatewayMetrics {
  return {
    wallet: ethers.getAddress(lifiData.fromAddress),
    month: new Date(lifiData.bucket.split("-")[1])
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase() as Month,
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
