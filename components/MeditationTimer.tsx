import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import {
  startTimer,
  stopTimer,
  resetTimer,
  tick,
  finishSession,
} from "@/store/timerSlice";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.7;

export default function MeditationTimer() {
  const dispatch = useDispatch();
  const { currentTime, isRunning, isFinished, interval } = useSelector(
    (state: RootState) => state.timer
  );
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning) {
      intervalId = setInterval(() => {
        dispatch(tick());
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, dispatch]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    const displayMins = mins % 60;

    if (hours > 0) {
      return `${hours}:${displayMins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${displayMins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleToggle = () => {
    if (isRunning) {
      dispatch(stopTimer());
    } else {
      dispatch(startTimer());
    }
  };

  const handleReset = () => {
    dispatch(resetTimer());
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          { borderColor: theme.tint, backgroundColor: theme.surface },
        ]}
      >
        <Text style={[styles.timerText, { color: theme.text }]}>
          {formatTime(currentTime)}
        </Text>
        <Text style={[styles.statusText, { color: theme.icon }]}>
          {isRunning
            ? "Meditating..."
            : isFinished
            ? "Session Finished"
            : "Ready"}
        </Text>
        <Text style={[styles.intervalText, { color: theme.secondary }]}>
          Bell every {interval}m
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isRunning ? theme.accent : theme.primary },
          ]}
          onPress={handleToggle}
        >
          <Text style={styles.buttonText}>{isRunning ? "Pause" : "Start"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.icon, opacity: 0.7 }]}
          onPress={handleReset}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 40,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "300", // Light font for elegance
    fontVariant: ["tabular-nums"],
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  intervalText: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    gap: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
