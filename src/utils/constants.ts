import { Campaign, Month, MonthlyPDA } from "./types";

export const ORG_ID = process.env.ORG_ID!;
export const LOYALTY_DM_ID = process.env.LOYALTY_DM_ID!;

export const TIER_DATA: Record<
  MonthlyPDA,
  {
    title: string;
    description: string;
    data_model: string;
    images?: Record<(typeof sortedTiers)[number], string>;
    image?: string;
    points: Record<string, number>;
  }
> = {
  // V1
  [MonthlyPDA.NETWORKS]: {
    title: "Chainoor",
    description:
      "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the unique chains used.",
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
  [MonthlyPDA.TRANSACTIONS]: {
    title: "Transactoor",
    description:
      "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total # of TXs completed.",
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
  [MonthlyPDA.VOLUME]: {
    title: "Volumoor",
    description:
      "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total volume transacted.",
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

  // V2
  [MonthlyPDA.BRIDGE]: {
    title: "bridge_oor",
    description:
      "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total # of TXs completed.",
    image: "https://jumper-static.s3.us-east-2.amazonaws.com/bridgeoor.png",
    data_model: process.env.BRIDGE_DM_ID!,
    points: {
      baby: 10,
      power_user: 18,
      chad: 25,
      ape: 33,
      degen: 44,
      grand_degen: 50,
    },
  },
  [MonthlyPDA.CHAIN]: {
    title: "chain_oor",
    description:
      "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the unique chains used.",
    image: "https://jumper-static.s3.us-east-2.amazonaws.com/chainoor.png",
    data_model: process.env.CHAIN_DM_ID!,
    points: {
      baby: 5,
      power_user: 10,
      chad: 15,
      ape: 20,
      degen: 25,
      grand_degen: 30,
    },
  },
  [MonthlyPDA.TRANSACT]: {
    title: "transact_oor",
    description:
      "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total volume transacted.",
    image: "https://jumper-static.s3.us-east-2.amazonaws.com/transactoor.png",
    data_model: process.env.TRANSACT_DM_ID!,
    points: {
      baby: 10,
      power_user: 18,
      chad: 25,
      ape: 33,
      degen: 40,
      grand_degen: 50,
    },
  },
  [MonthlyPDA.SWAP]: {
    title: "swap_oor",
    description:
      "This is a monthly PDA issued by LI.FI to it's users of the Jumper Exchange platform based on the total volume transacted.",
    image: "https://jumper-static.s3.us-east-2.amazonaws.com/swapoor.png",
    data_model: process.env.SWAP_DM_ID!,
    points: {
      baby: 10,
      power_user: 18,
      chad: 25,
      ape: 33,
      degen: 44,
      grand_degen: 50,
    },
  },
};

export const CAMPAIGN_DATA = {
  [Campaign.BOOSTOR]: {
    title: "xp_boost",
    description:
      "This is a one-off PDA issued by LI.FI to the users of Jumper based on the volume generated through insurance",
    image: "https://jumper-static.s3.us-east-2.amazonaws.com/xpboost.png",
    data_model: process.env.BOOSTOR_DM_ID!,
    points: {
      baby: 7,
      power_user: 8,
      chad: 10,
      ape: 18,
      degen: 25,
    },
  },
  [Campaign.TRANSFERTO]: {
    title: "TransferTo.xyz",
    description:
      "This is a one-off PDA issued by LI.FI to the users of transferto.xyz based on the total volume generated",
    image: "https://jumper-static.s3.us-east-2.amazonaws.com/transfertoxyz.png",
    data_model: process.env.TRANSFERTO_DM_ID!,
    points: {
      baby: 100,
      power_user: 300,
      chad: 500,
    },
  },
  [Campaign.OG]: {
    title: "jumper_og",
    description:
      "This is a one-off PDA issued by LI.FI to the Jumper OG community",
    image: "https://jumper-static.s3.us-east-2.amazonaws.com/og.png",
    data_model: process.env.JUMPER_OG_DM_ID!,
    points: {
      baby: 100,
    },
  },
  [Campaign.LINEA]: {
    title: "Linea Voyage",
    description:
      "Representation of users bridging activity on Jumper Exchange during the Linea Voyage Campaign.",
    image: "https://cdn.mygateway.xyz/implementations/linea+voyage.png",
    data_model: process.env.ONCHAIN_DM_ID!,
    points: {
      volume: {
        voyager: 5.243,
        traveler: 10.313,
        explorer: 15.415,
        adventurer: 20.524,
        seafarer: 25.641,
        wanderer: 30.731,
        pilgrim: 40.824,
        globetrotter: 50.983,
        nomad: 75.99,
        captain: 100.999,
      },
      transactions: {
        voyager: 2.245,
        traveler: 5.321,
        explorer: 8.453,
        adventurer: 15.548,
        seafarer: 20.599,
        wanderer: 25.689,
        pilgrim: 30.78,
        globetrotter: 40.898,
        nomad: 45.911,
        captain: 50.999,
      },
    },
  },
};

export const TIER_METRIC_LIMITS = {
  none: {
    // V1
    [MonthlyPDA.VOLUME]: 0,
    [MonthlyPDA.TRANSACTIONS]: 0,
    [MonthlyPDA.NETWORKS]: 0,

    // V2
    [MonthlyPDA.SWAP]: 0,
    [MonthlyPDA.BRIDGE]: 0,
    [MonthlyPDA.CHAIN]: 0,
    [MonthlyPDA.TRANSACT]: 0,
  },
  baby: {
    // V1
    [MonthlyPDA.VOLUME]: 100,
    [MonthlyPDA.TRANSACTIONS]: 1,
    [MonthlyPDA.NETWORKS]: 1,

    // V2
    [MonthlyPDA.SWAP]: 100,
    [MonthlyPDA.BRIDGE]: 100,
    [MonthlyPDA.CHAIN]: 1,
    [MonthlyPDA.TRANSACT]: 1,
  },
  power_user: {
    // V1
    [MonthlyPDA.VOLUME]: 1_000,
    [MonthlyPDA.TRANSACTIONS]: 5,
    [MonthlyPDA.NETWORKS]: 2,

    // V2
    [MonthlyPDA.SWAP]: 1_000,
    [MonthlyPDA.BRIDGE]: 1_000,
    [MonthlyPDA.CHAIN]: 2,
    [MonthlyPDA.TRANSACT]: 5,
  },
  chad: {
    // V1
    [MonthlyPDA.VOLUME]: 10_000,
    [MonthlyPDA.TRANSACTIONS]: 11,
    [MonthlyPDA.NETWORKS]: 3,

    // V2
    [MonthlyPDA.SWAP]: 10_000,
    [MonthlyPDA.BRIDGE]: 10_000,
    [MonthlyPDA.CHAIN]: 3,
    [MonthlyPDA.TRANSACT]: 10,
  },
  ape: {
    // V1
    [MonthlyPDA.VOLUME]: 50_000,
    [MonthlyPDA.TRANSACTIONS]: 21,
    [MonthlyPDA.NETWORKS]: 5,

    // V2
    [MonthlyPDA.SWAP]: 50_000,
    [MonthlyPDA.BRIDGE]: 50_000,
    [MonthlyPDA.CHAIN]: 5,
    [MonthlyPDA.TRANSACT]: 21,
  },
  degen: {
    // V1
    [MonthlyPDA.VOLUME]: 100_000,
    [MonthlyPDA.TRANSACTIONS]: 36,
    [MonthlyPDA.NETWORKS]: 7,

    // V2
    [MonthlyPDA.SWAP]: 100_000,
    [MonthlyPDA.BRIDGE]: 100_000,
    [MonthlyPDA.CHAIN]: 7,
    [MonthlyPDA.TRANSACT]: 36,
  },
  grand_degen: {
    // V1
    [MonthlyPDA.VOLUME]: 500_000,
    [MonthlyPDA.TRANSACTIONS]: 50,
    [MonthlyPDA.NETWORKS]: 8,

    // V2
    [MonthlyPDA.SWAP]: 500_000,
    [MonthlyPDA.BRIDGE]: 500_000,
    [MonthlyPDA.CHAIN]: 9,
    [MonthlyPDA.TRANSACT]: 50,
  },
};

export const LINEA_TIER_METRIC_LIMITS = {
  voyager: {
    volume: 25,
    transactions: 1,
  },
  traveler: {
    volume: 51,
    transactions: 2,
  },
  explorer: {
    volume: 126,
    transactions: 3,
  },
  adventurer: {
    volume: 251,
    transactions: 4,
  },
  seafarer: {
    volume: 501,
    transactions: 6,
  },
  wanderer: {
    volume: 751,
    transactions: 8,
  },
  pilgrim: {
    volume: 1001,
    transactions: 10,
  },
  globetrotter: {
    volume: 1501,
    transactions: 12,
  },
  nomad: {
    volume: 2001,
    transactions: 14,
  },
  captain: {
    volume: 3000,
    transactions: 16,
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

export const sortedTiers = [
  "grand_degen",
  "degen",
  "ape",
  "chad",
  "power_user",
  "baby",
];

export const sortedLineaTiers = [
  "captain",
  "nomad",
  "globetrotter",
  "pilgrim",
  "wanderer",
  "seafarer",
  "adventurer",
  "explorer",
  "traveler",
  "voyager",
];
