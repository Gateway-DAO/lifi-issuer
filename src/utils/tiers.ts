import { Month } from "./types";

export const computeTier = (
  metric: keyof typeof METRICS_TRANSLATED,
  value: number
): string => {
  const tier = sortedTiers.find((tier) => {
    return value >= TIER_METRIC_LIMITS[tier][metric];
  });
  return tier;
};

export const computePoints = (metric: string, tier: string): number => {
  return TIER_DATA[metric]["points"][tier];
};
export const formatTier = (text: string): string => {
  if (text == "baby") return "Novice";

  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
export const ORG_ID = process.env.ORG_ID!;
export const LOYALTY_DM_ID = process.env.LOYALTY_DM_ID!;

export const TIER_DATA = {
  networks: {
    data_model: process.env.NETWORK_DM_ID!,
    images: {
      baby: "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/01+Chains+-+Novice.png",
      power_user:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/02+Chains+-+Power.png",
      chad: "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/03+Chains+-+Chad.png",
      ape: "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/04+Chains+-+Ape.png",
      degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/05+Chains+-+Degen.png",
      grand_degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Chains/06+Chains+-+Grand.png",
    },
    points: {
      baby: 5,
      power_user: 10,
      chad: 15,
      ape: 20,
      degen: 25,
      grand_degen: 30,
    },
  },
  transactions: {
    data_model: process.env.TXN_DM_ID!,
    images: {
      baby: "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/01+Transactions+-+Novice.png",
      power_user:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/02+Transactions+-+Power.png",
      chad: "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/03+Transactions+-+Chad.png",
      ape: "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/04+Transactions+-+Ape.png",
      degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/05+Transactions+-+Degen.png",
      grand_degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Transactions/06+Transactions+-+Grand.png",
    },
    points: {
      baby: 10,
      power_user: 18,
      chad: 25,
      ape: 33,
      degen: 40,
      grand_degen: 50,
    },
  },
  volume: {
    data_model: process.env.VOLUME_DM_ID!,
    images: {
      baby: "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/01+Volume+-+Novice.png",
      power_user:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/02+Volume+-+Power.png",
      chad: "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/03+Volume+-+Chad.png",
      ape: "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/04+Volume+-+Ape.png",
      degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/05+Volume+-+Degen.png",
      grand_degen:
        "https://cdn.mygateway.xyz/implementations/Designs+-+Volume/06+Volume+-+Grand.png",
    },
    points: {
      baby: 10,
      power_user: 18,
      chad: 25,
      ape: 33,
      degen: 40,
      grand_degen: 50,
    },
  },
};

export const TIER_METRIC_LIMITS = {
  none: {
    volume: 0,
    transactions: 0,
    networks: 0,
  },
  baby: {
    volume: 100,
    transactions: 1,
    networks: 1,
  },
  power_user: {
    volume: 1000,
    transactions: 10,
    networks: 5,
  },
  chad: {
    volume: 10000,
    transactions: 50,
    networks: 10,
  },
  ape: {
    volume: 50000,
    transactions: 250,
    networks: 14,
  },
  degen: {
    volume: 250000,
    transactions: 500,
    networks: 17,
  },
  grand_degen: {
    volume: 1000000,
    transactions: 1000,
    networks: 20,
  },
};

export const LOYALTY_PASS_TIERS = {
  baby: {
    min: 0,
    max: 50,
    title: "Novice",
  },
  bronze: {
    min: 51,
    max: 150,
    title: "Bronze",
  },
  silver: {
    min: 151,
    max: 350,
    title: "Silver",
  },
  gold: {
    min: 350,
    max: 700,
    title: "Gold",
  },
  platinum: {
    min: 701,
    max: 1100,
    title: "Platinum",
  },
  tungsten: {
    min: 1101,
    max: 9999999999999,
    title: "Tungsten",
  },
};

export const METRICS_TRANSLATED = {
  networks: "Chainoor",
  transactions: "Transactoor",
  volume: "Volumoor",
};

export const MONTHS_TRANSLATED = {
  [Month.JAN]: "January",
  [Month.FEB]: "February",
  [Month.MAR]: "March",
  [Month.APR]: "April",
  [Month.MAY]: "May",
  [Month.JUN]: "June",
  [Month.JUL]: "July",
  [Month.AUG]: "August",
  [Month.SEP]: "September",
  [Month.OCT]: "October",
  [Month.NOV]: "November",
  [Month.DEC]: "December",
};

export const DESCRIPTION_TRANSLATED = {
  volume:
    "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total volume transacted.",
  transactions:
    "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total # of TXs completed.",
  networks:
    "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the unique chains used.",
};

export const sortedTiers = [
  "grand_degen",
  "degen",
  "ape",
  "chad",
  "power_user",
  "baby",
];
