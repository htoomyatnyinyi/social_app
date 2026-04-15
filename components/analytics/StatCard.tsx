import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
  isDark: boolean;
  trend?: string;
  trendStatus?: 'up' | 'down' | 'stable';
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  label,
  value,
  icon,
  color,
  index,
  isDark,
  trend,
  trendStatus,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      className="flex-1 min-w-[45%] m-1.5"
    >
      <BlurView
        intensity={isDark ? 20 : 40}
        tint={isDark ? "dark" : "light"}
        className="rounded-[28px] overflow-hidden border border-white/10 dark:border-white/5 p-4 h-[120px]"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View 
            className="w-10 h-10 rounded-2xl items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </View>
          
          {trend && (
            <View className={`flex-row items-center px-2 py-1 rounded-full ${
              trendStatus === 'up' ? 'bg-emerald-500/10' : 
              trendStatus === 'down' ? 'bg-rose-500/10' : 'bg-gray-500/10'
            }`}>
              <Ionicons 
                name={trendStatus === 'up' ? 'trending-up' : trendStatus === 'down' ? 'trending-down' : 'remove'} 
                size={12} 
                color={trendStatus === 'up' ? '#10B981' : trendStatus === 'down' ? '#F43F5E' : '#94A3B8'} 
              />
              <Text 
                className={`text-[10px] font-bold ml-1 ${
                  trendStatus === 'up' ? 'text-emerald-500' : 
                  trendStatus === 'down' ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {trend}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-[12px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </Text>
        
        <Text className="text-[22px] font-black text-gray-900 dark:text-white">
          {value}
        </Text>
      </BlurView>
    </Animated.View>
  );
});
