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

export type Month =
  | "JAN"
  | "FEB"
  | "MAR"
  | "APR"
  | "MAY"
  | "JUN"
  | "JUL"
  | "AUG"
  | "SEP"
  | "OCT"
  | "NOV"
  | "DEC";

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
