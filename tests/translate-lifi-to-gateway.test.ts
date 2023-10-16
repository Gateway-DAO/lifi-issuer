import { Month, parseLifiData } from "../src/utils/types";

describe("parseLifiData", () => {
  const sampleLifiData = {
    _id: "6526a42f987bacb5d8b76966",
    sumTransferUsd: 1120.41,
    transfers: 1,
    fromAddress: "0x000000005ebfb5a950f8fdf3248e99614a7ff220",
    bucket: "2023-09-01T00:00:00.000Z",
    chainCount: 2,
  };
  const parsedData = parseLifiData(sampleLifiData);

  it("should parse Date string to Month", () => {
    expect(parsedData.month).toBe(Month.SEP);
  });

  it("should parse chainCount to number", () => {
    expect(parsedData.totalUniqueNetworks).toBe(2);
  });

  it("should parse sumTransferUsd to number", () => {
    expect(parsedData.totalVolume).toBe(1120.41);
  });

  it("should parse transfers to number", () => {
    expect(parsedData.totalTransactions).toBe(1);
  });
});
