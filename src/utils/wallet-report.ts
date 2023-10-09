import { GatewayMetrics, Month, WalletAnalytics } from "./analytics";

const TIMESTAMPS = {
  JAN: [1672531200, 1675209599],
  FEB: [1675209600, 1677628799],
  MAR: [1677628800, 1680307199],
  APR: [1680307200, 1682899199],
  MAY: [1682899200, 1685577599],
  JUN: [1685577600, 1688169599],
  JUL: [1688169600, 1690847999],
  AUG: [1690848000, 1693526399],
  SEP: [1693526400, 1696118399],
  OCT: [1696118400, 1698796799],
  NOV: [1698796800, 1701388799],
  DEC: [1701388800, 1704067199],
};

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
