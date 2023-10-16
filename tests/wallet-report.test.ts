import {
  GatewayMetrics,
  WalletAnalytics,
  WalletTransaction,
} from "../src/utils/analytics";
import { computeWalletMetrics } from "../src/utils/wallet-report";

describe("wallet-report", () => {
  const walletAddress = "0x0000000000000000000000000000000000000000";
  const invalidAddress = walletAddress.substring(3);

  const pendingTxn: WalletTransaction = { status: "PENDING" };
  const completedTxn: WalletTransaction = { status: "COMPLETED" };

  const testAmountUSD = "100";
  const testChainId: number = 0;

  describe("generateReport", () => {
    const validWalletAnalytics: WalletAnalytics = {
      walletAddress,
      transactions: [
        {
          status: "COMPLETED",
          sending: { amountUSD: testAmountUSD, chainId: testChainId },
          receiving: {
            amountUSD: testAmountUSD,
            chainId: testChainId,
          },
        },
      ],
    };

    let metrics: GatewayMetrics;

    describe("valid report", () => {
      afterEach(() => {
        expect(metrics.wallet).toEqual(walletAddress);
      });

      describe("totalTransactions", () => {
        it("single txn", () => {
          metrics = computeWalletMetrics(validWalletAnalytics);
          expect(metrics.totalTransactions).toEqual(1);
        });

        it("multiple completed txns", () => {
          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [
              ...validWalletAnalytics.transactions,
              {
                status: "COMPLETED",
                sending: { amountUSD: "0", chainId: 12 },
                receiving: { amountUSD: "0", chainId: 12 },
              },
            ],
          });

          expect(metrics.totalTransactions).toEqual(2);
        });

        it("multiple txns with some pending", () => {
          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [...validWalletAnalytics.transactions, pendingTxn],
          });
          expect(metrics.totalTransactions).toEqual(1);
        });
      });

      describe("totalUniqueNetworks", () => {
        it("single chainId", () => {
          metrics = computeWalletMetrics(validWalletAnalytics);
          expect(metrics.totalTransactions).toEqual(1);
          expect(metrics.totalUniqueNetworks).toEqual(1);
        });

        it("multiple txns with some pending", () => {
          validWalletAnalytics.transactions.push();

          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [
              ...validWalletAnalytics.transactions,
              {
                status: "PENDING",
                sending: { amountUSD: "50", chainId: 2 },
                receiving: { amountUSD: "50", chainId: 2 },
              },
            ],
          });
          expect(metrics.totalTransactions).toEqual(1);
          expect(metrics.totalUniqueNetworks).toEqual(1);
        });

        it("multiple txns with same chainId", () => {
          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [
              ...validWalletAnalytics.transactions,
              {
                status: "COMPLETED",
                sending: {
                  amountUSD: "50",
                  chainId: testChainId,
                },
                receiving: {
                  amountUSD: "50",
                  chainId: testChainId,
                },
              },
            ],
          });

          expect(metrics.totalTransactions).toEqual(2);
          expect(metrics.totalUniqueNetworks).toEqual(1);
        });

        it("multiple txns with different chainIds", () => {
          validWalletAnalytics.transactions.push();

          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [
              ...validWalletAnalytics.transactions,
              {
                status: "COMPLETED",
                sending: { amountUSD: "50", chainId: 2 },
                receiving: { amountUSD: "50", chainId: 2 },
              },
            ],
          });
          expect(metrics.totalTransactions).toEqual(2);
          expect(metrics.totalUniqueNetworks).toEqual(2);
        });
      });

      describe("totalVolume", () => {
        it("single txn", () => {
          metrics = computeWalletMetrics(validWalletAnalytics);
          expect(metrics.totalVolume).toEqual(100);
        });

        it("single txn missing sending metadata", () => {
          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [
              {
                status: "COMPLETED",
                receiving: { amountUSD: "100", chainId: 0 },
              },
            ],
          });
        });

        it("multiple completed txns", () => {
          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [
              ...validWalletAnalytics.transactions,
              {
                status: "COMPLETED",
                receiving: {
                  amountUSD: "250.34",
                  chainId: testChainId,
                },
              },
            ],
          });

          expect(metrics.totalVolume).toEqual(+testAmountUSD + 250.34);
        });

        it("multiple txns with some pending", () => {
          metrics = computeWalletMetrics({
            ...validWalletAnalytics,
            transactions: [
              ...validWalletAnalytics.transactions,
              {
                status: "PENDING",
                receiving: {
                  amountUSD: "1000",
                  chainId: testChainId,
                },
              },
            ],
          });

          expect(metrics.totalVolume).toBe(+testAmountUSD);
        });
      });
    });
  });
});
