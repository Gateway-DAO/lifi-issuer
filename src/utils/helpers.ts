import {
  CAMPAIGN_DATA,
  LINEA_TIER_DATA,
  LINEA_TIER_METRIC_LIMITS,
  METRICS_TRANSLATED,
  TIER_DATA,
  TIER_METRIC_LIMITS,
  sortedLineaTiers,
  sortedTiers,
} from "./constants";
import { Campaign } from "./types";

export const computeTier = (
  metric: keyof typeof METRICS_TRANSLATED,
  value: number
): string => {
  const tier = sortedTiers.find((tier) => {
    return value >= TIER_METRIC_LIMITS[tier][metric];
  });
  return tier;
};

export const computeLineaTier = (
  metric: keyof typeof METRICS_TRANSLATED,
  value: number
): string => {
  const tier = sortedLineaTiers.find((tier) => {
    return value >= LINEA_TIER_METRIC_LIMITS[tier][metric];
  });
  return tier;
};

export const computeCampaignTier = (
  campaign: Campaign,
  value: number
): string => {
  const tier = sortedTiers.find((tier) => {
    if (!CAMPAIGN_DATA[campaign].points[tier]) {
      return false;
    }

    return value >= CAMPAIGN_DATA[campaign].points[tier];
  });

  return tier;
};

export const computePoints = (metric: string, tier: string): number => {
  return TIER_DATA[metric]["points"][tier] || 0;
};

export const computeLineaPoints = (metric: string, tier: string): number => {
  return LINEA_TIER_DATA[metric]["points"][tier] || 0;
};

export const formatTier = (text: string): string => {
  if (text == "baby") return "Novice";

  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
