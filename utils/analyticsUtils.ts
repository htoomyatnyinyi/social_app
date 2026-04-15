/**
 * Centralized logic for analytics calculations and formatting.
 * Strictly follows the formula: EngagementRate = ((Likes + Replies + Reposts) / Impressions) * 100
 */

/**
 * Formats a metric value based on its type.
 * 'number' -> 1.5K, 2.0M
 * 'percentage' -> 5.25%
 */
export const formatMetric = (value: number, type: 'number' | 'percentage'): string => {
  if (value === undefined || value === null || isNaN(value)) return type === 'percentage' ? '0.00%' : '0';

  if (type === 'percentage') {
    return `${value.toFixed(2)}%`;
  }

  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }

  return Math.floor(value).toString();
};

/**
 * Calculates engagement rate with safety checks.
 */
export const calculateEngagementRate = (
  likes: number = 0,
  replies: number = 0,
  reposts: number = 0,
  impressions: number = 0
): number => {
  if (impressions <= 0) return 0;
  
  const interactions = (likes || 0) + (replies || 0) + (reposts || 0);
  const rate = (interactions / impressions) * 100;
  
  return Math.max(0, rate);
};

/**
 * Derives a trend status based on historical comparison.
 * In the future, this can be expanded to compare current vs last week.
 */
export const getTrendStatus = (current: number, previous: number) => {
  if (!previous || current === previous) return 'stable';
  return current > previous ? 'up' : 'down';
};
