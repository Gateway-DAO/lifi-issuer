import { GatewayMetrics, Month, WalletAnalytics } from "./analytics";

export const computeWalletMetrics = (
  walletStats: WalletAnalytics,
  month?: Month
): GatewayMetrics => {
  const wallet = walletStats.walletAddress;

  // Expected metrics
  let totalTransactions: number = 0;
  let totalVolume: number = 0;
  let uniqueChains = new Set<number>();

  // Basic iterator
  if (!walletStats.transactions) {
    console.error(`\nWallet ${wallet} has no transactions\n`, walletStats);
    return {
      wallet: wallet,
      totalTransactions: 0,
      totalUniqueNetworks: 0,
      totalVolume: 0,
    };
  }

  walletStats.transactions.forEach((txn: any) => {
    // check status is not still pending
    if (txn.status !== "PENDING") {
      // total number of transactions
      totalTransactions += 1;

      // current volume (prioritize "sending" metadata)
      // - sending
      if (txn?.sending?.amountUSD) {
        totalVolume += +txn.sending.amountUSD;
      }
      // - receiving
      else if (txn?.receiving?.amountUSD) {
        totalVolume += +txn.receiving.amountUSD;
      }
      // - error
      else {
        console.error(
          "\nTransaction is missing receiving amount, decimals, or priceUSD",
          txn,
          "\n"
        );
      }

      // number of unique chains
      uniqueChains.add(txn.sending?.chainId || txn.receiving.chainId);
    }
  });

  return {
    wallet,
    month,
    totalTransactions,
    totalUniqueNetworks: uniqueChains.size,
    totalVolume,
  };
};
