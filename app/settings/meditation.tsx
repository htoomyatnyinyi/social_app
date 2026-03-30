import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  useGetMeditationStatsQuery,
  useRecordSessionMutation,
  useUpdateMeditationStatusMutation
} from '../../store/meditationApi';

const BELL_SOUND = require('../../assets/sounds/bell.mp3');

const MeditationTimer = () => {
  const { data: stats } = useGetMeditationStatsQuery();
  const [recordSession] = useRecordSessionMutation();
  const [updateStatus] = useUpdateMeditationStatusMutation();

  const [intervalTime, setIntervalTime] = useState(30); // 30 or 60 minutes
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // In seconds
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [repeat, setRepeat] = useState(true);

  const pulse = useSharedValue(1);

  const loadSound = React.useCallback(async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
      setSound(newSound);
    } catch {
      // Failed to load sound
    }
  }, [sound]);

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playBell = React.useCallback(async () => {
    if (sound) {
      try {
        await sound.replayAsync();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Reload sound if it failed
        const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
        setSound(newSound);
        await newSound.playAsync();
      }
    } else {
      loadSound().then(() => playBell());
    }
  }, [sound, loadSound]);

  useEffect(() => {
    let timer: any;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      playBell();

      // Record session to backend
      recordSession({ duration: intervalTime }).catch(console.error);

      if (repeat) {
        setTimeLeft(intervalTime * 60);
      } else {
        setIsActive(false);
        updateStatus({ isMeditating: false }).catch(console.error);
      }
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, repeat, intervalTime, playBell, recordSession, updateStatus]);

  useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [isActive, pulse]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: interpolate(pulse.value, [1, 1.1], [0.6, 0.4]),
    };
  });

  const toggleTimer = () => {
    const nextState = !isActive;
    if (nextState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsActive(nextState);
    updateStatus({ isMeditating: nextState }).catch(console.error);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsActive(false);
    setTimeLeft(intervalTime * 60);
    updateStatus({ isMeditating: false }).catch(console.error);
  };

  const selectInterval = (time: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntervalTime(time);
    setTimeLeft(time * 60);
    setIsActive(false);
    updateStatus({ isMeditating: false }).catch(console.error);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Meditation Timer',
          headerTransparent: true,
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' }
        }}
      />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Meditation Timer</Text>
          <TouchableOpacity
            onPress={() => setRepeat(!repeat)}
            style={[styles.repeatToggle, repeat && styles.repeatToggleActive]}
          >
            <Ionicons
              name={repeat ? "repeat" : "repeat-outline"}
              size={20}
              color={repeat ? "#fff" : "#94a3b8"}
            />
            <Text style={[styles.repeatText, repeat && styles.repeatTextActive]}>
              {repeat ? 'Continuous' : 'Single Session'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timerWrapper}>
          <Animated.View style={[styles.pulseCircle, animatedCircleStyle]} />
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerSubheader}>{isActive ? 'Breathe Deeply' : 'Peaceful Mind'}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          {stats?.totalMinutes > 0 && (
            <View style={styles.statsRow}>
              <View className="items-center">
                <Text style={styles.statsValue}>{stats.totalMinutes}</Text>
                <Text style={styles.statsLabel}>Minutes</Text>
              </View>
              <View style={styles.statsDivider} />
              <View className="items-center">
                <Text style={styles.statsValue}>{stats.sessionsCount}</Text>
                <Text style={styles.statsLabel}>Sessions</Text>
              </View>
            </View>
          )}

          <View style={styles.intervalOptions}>
            <TouchableOpacity
              onPress={() => selectInterval(30)}
              style={[styles.intervalBtn, intervalTime === 30 && styles.intervalBtnActive]}
            >
              <Text style={[styles.intervalBtnText, intervalTime === 30 && styles.intervalBtnTextActive]}>30 Min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectInterval(60)}
              style={[styles.intervalBtn, intervalTime === 60 && styles.intervalBtnActive]}
            >
              <Text style={[styles.intervalBtnText, intervalTime === 60 && styles.intervalBtnTextActive]}>1 Hour</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={resetTimer} style={styles.secondaryBtn}>
              <Ionicons name="refresh-outline" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleTimer} style={styles.mainBtn}>
              <View style={styles.playIconBox}>
                <Ionicons
                  name={isActive ? "pause" : "play"}
                  size={32}
                  color="#fff"
                  style={{ marginLeft: isActive ? 0 : 4 }}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playBell}
              style={styles.secondaryBtn}
            >
              <Ionicons name="notifications-outline" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  repeatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  repeatToggleActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  repeatText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  repeatTextActive: {
    color: '#fff',
  },
  timerWrapper: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  timerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  pulseCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerText: {
    fontSize: 54,
    fontWeight: '200',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  timerSubheader: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: 8,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  statsLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  intervalOptions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 6,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  intervalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  intervalBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  intervalBtnText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  intervalBtnTextActive: {
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  mainBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  }
});

export default MeditationTimer;
