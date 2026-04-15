import { useMemo } from 'react';
import { useGetUserAnalyticsQuery } from '../store/profileApi';
import { useGetPostAnalyticsQuery } from '../store/postApi';
import { calculateEngagementRate, formatMetric } from '../utils/analyticsUtils';

/**
 * Standardized analytics data shape for UI consumption.
 */
export interface AnalyticsViewModel {
  overview: {
    impressions: number;
    likes: number;
    replies: number;
    reposts: number;
    interactions: number;
    engagementRate: number;
    formattedImpressions: string;
    formattedEngagement: string;
    totalPosts?: number;
    totalFollowers?: number;
    totalFollowing?: number;
  };
  charts: {
    followerGrowth?: { date: string; count: number }[];
    likeTrend?: { date: string; count: number }[];
  };
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Custom hook to centralize analytics logic for both global and post-specific views.
 */
export const useAnalyticsLogic = (postId?: string): AnalyticsViewModel => {
  // 1. Fetch data based on context (Global or Post)
  const globalQuery = useGetUserAnalyticsQuery(undefined, { skip: !!postId });
  const postQuery = useGetPostAnalyticsQuery(postId!, { skip: !postId });

  const query = postId ? postQuery : globalQuery;

  // 2. Derive standardized data structure
  const analyticsData = useMemo(() => {
    if (!query.data) {
      return {
        overview: {
          impressions: 0,
          likes: 0,
          replies: 0,
          reposts: 0,
          interactions: 0,
          engagementRate: 0,
          formattedImpressions: '0',
          formattedEngagement: '0.00%',
        },
        charts: {},
      };
    }

    if (postId) {
      // Post-specific data mapping
      const { metrics, likeTrend } = query.data;
      const rate = calculateEngagementRate(
        metrics.likes,
        metrics.replies,
        metrics.reposts,
        metrics.views
      );

      return {
        overview: {
          impressions: metrics.views || 0,
          likes: metrics.likes || 0,
          replies: metrics.replies || 0,
          reposts: metrics.reposts || 0,
          interactions: metrics.totalInteractions || 0,
          engagementRate: rate,
          formattedImpressions: formatMetric(metrics.views || 0, 'number'),
          formattedEngagement: formatMetric(rate, 'percentage'),
        },
        charts: {
          likeTrend,
        },
      };
    } else {
      // Global overview data mapping
      const { overview, followerGrowth } = query.data;
      
      // Use formula for extra safety/consistency even if backend provides one
      const rate = calculateEngagementRate(
        overview.totalLikes,
        overview.totalReplies,
        overview.totalReposts,
        overview.totalImpressions
      );

      return {
        overview: {
          impressions: overview.totalImpressions || 0,
          likes: overview.totalLikes || 0,
          replies: overview.totalReplies || 0,
          reposts: overview.totalReposts || 0,
          interactions: overview.totalInteractions || 0,
          engagementRate: rate,
          formattedImpressions: formatMetric(overview.totalImpressions || 0, 'number'),
          formattedEngagement: formatMetric(rate, 'percentage'),
          totalPosts: overview.totalPosts || 0,
          totalFollowers: overview.totalFollowers || 0,
          totalFollowing: overview.totalFollowing || 0,
        },
        charts: {
          followerGrowth,
        },
      };
    }
  }, [query.data, postId]);

  return {
    overview: analyticsData.overview,
    charts: analyticsData.charts,
    isLoading: query.isLoading,
    isError: !!query.error,
    refetch: query.refetch,
  };
};
