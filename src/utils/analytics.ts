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

/**
 * LI.FI Wallet Analytics
 */

// Wallet Analytics Response
export type WalletAnalytics = {
  walletAddress: string;
  transactions: WalletTransaction[];
};

// Wallet Analytics Transaction Metadata
export type WalletTransaction = {
  status: WalletTransactionStatus;
  sending?: { amountUSD: string; chainId: number };
  receiving?: { amountUSD: string; chainId: number };
};

// Transaction Status
export type WalletTransactionStatus = "COMPLETED" | "PENDING";

/**
 * Miscelleneous
 */
export enum Month {
  JAN = 'JAN',
  FEB = 'FEB',
  MAR = 'MAR',
  APR = 'APR',
  MAY = 'MAY',
  JUN = 'JUN',
  JUL = 'JUL',
  AUG = 'AUG',
  SEP = 'SEP',
  OCT = 'OCT',
  NOV = 'NOV',
  DEC = 'DEC',
}
