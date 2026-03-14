import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";

export default function MeditationScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [intervalTime, setIntervalTime] = useState(30); // in minutes
  const [timeLeft, setTimeLeft] = useState(30 * 60); // in seconds
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  const [enableDhammaAudio, setEnableDhammaAudio] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bellSound = useRef<Audio.Sound | null>(null);
  const dhammaSound = useRef<Audio.Sound | null>(null);

  const theme = {
    background: "#ffffff",
    primary: "#4a90e2",
    secondary: "#50c878",
    text: "#333333",
    icon: "#888888",
    surface: "#f5f5f5",
  };

  // 1. Initialize Audio on Mount
  useEffect(() => {
    let isMounted = true;

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: bell } = await Audio.Sound.createAsync({
          uri: "http://192.168.1.241:3000/u/Am5YNQ.mp3",
        });

        const { sound: dhamma } = await Audio.Sound.createAsync({
          uri: "http://192.168.1.241:3000/u/dONVU2.mp3",
        });

        if (isMounted) {
          bellSound.current = bell;
          dhammaSound.current = dhamma;
          await bellSound.current.setVolumeAsync(volume);
          await dhammaSound.current.setVolumeAsync(volume);
          setIsAudioLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load audio", error);
      }
    };

    setupAudio();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (bellSound.current) bellSound.current.unloadAsync();
      if (dhammaSound.current) dhammaSound.current.unloadAsync();
    };
  }, []);

  // 2. Handle Volume Changes Dynamically
  useEffect(() => {
    const updateVolume = async () => {
      if (bellSound.current) await bellSound.current.setVolumeAsync(volume);
      if (dhammaSound.current) await dhammaSound.current.setVolumeAsync(volume);
    };
    updateVolume();
  }, [volume]);

  // 3. Audio Playback Helpers
  const playBell = async () => {
    if (bellSound.current) {
      await bellSound.current.replayAsync(); // replayAsync ensures it plays from the beginning
    }
  };

  const manageDhammaAudio = async (shouldPlay: boolean) => {
    if (!dhammaSound.current) return;

    if (shouldPlay && enableDhammaAudio) {
      await dhammaSound.current.playAsync();
    } else {
      await dhammaSound.current.pauseAsync();
    }
  };

  // 4. Timer Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          // Timer finished
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            playBell();
            manageDhammaAudio(false);
            setIsRunning(false);
            return 0;
          }

          // Intermediate interval bell (e.g., if 60m session, rings at 30m mark)
          const isIntermediateBell =
            prev !== intervalTime * 60 && prev % (30 * 60) === 0;

          if (isIntermediateBell) {
            playBell();
          }

          return prev - 1;
        });
      }, 1000);

      manageDhammaAudio(true);
    } else {
      // Clear interval if paused
      if (timerRef.current) clearInterval(timerRef.current);
      manageDhammaAudio(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, enableDhammaAudio]);

  // 5. Controls
  const toggleTimer = () => {
    if (!isRunning && timeLeft === intervalTime * 60) {
      // Ring bell exactly when starting a fresh session
      playBell();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = async () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(intervalTime * 60);

    // Stop and reset dhamma audio back to beginning
    if (dhammaSound.current) {
      await dhammaSound.current.stopAsync();
    }
  };

  const changeInterval = (minutes: number) => {
    if (!isRunning) {
      setIntervalTime(minutes);
      setTimeLeft(minutes * 60);
    }
  };

  // 6. Formatting
  const formatTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isAudioLoaded) {
    return (
      <View
        style={[
          styles.container,
          styles.centerAll,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.icon }}>
          Loading sounds...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primary }]}>
            MEDITATION
          </Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            May all beings be well, happy, and peaceful.
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime()}</Text>
            <Text style={styles.timerLabel}>Meditation</Text>
          </View>

          <View style={styles.timerButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isRunning ? theme.icon : theme.primary },
              ]}
              onPress={toggleTimer}
            >
              <Text style={styles.buttonText}>
                {isRunning ? "Pause" : "Start"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.icon }]}
              onPress={resetTimer}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.settingsContainer, { backgroundColor: theme.surface }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Settings
          </Text>

          {/* Interval Setting */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Duration
            </Text>
            <View style={styles.intervalToggle}>
              <TouchableOpacity onPress={() => changeInterval(30)}>
                <Text
                  style={[
                    styles.intervalOption,
                    {
                      color: intervalTime === 30 ? theme.secondary : theme.icon,
                    },
                  ]}
                >
                  30m
                </Text>
              </TouchableOpacity>
              <Text style={{ color: theme.icon }}> | </Text>
              <TouchableOpacity onPress={() => changeInterval(60)}>
                <Text
                  style={[
                    styles.intervalOption,
                    {
                      color: intervalTime === 60 ? theme.secondary : theme.icon,
                    },
                  ]}
                >
                  1h
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dhamma Audio Setting */}
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Dhamma Audio
              </Text>
              <Text style={[styles.settingDescription, { color: theme.icon }]}>
                အာနာပါနသမထ လမ်းညွှန် အသံ
              </Text>
            </View>
            <Switch
              value={enableDhammaAudio}
              onValueChange={setEnableDhammaAudio}
              trackColor={{ false: "#ccc", true: theme.secondary }}
              thumbColor={Platform.OS === "android" ? "#fff" : undefined}
            />
          </View>

          {/* Volume Setting */}
          <View style={styles.volumeContainer}>
            <Text style={[styles.volumeLabel, { color: theme.text }]}>
              Volume: {Math.round(volume * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={volume}
              onValueChange={setVolume}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.icon}
              thumbTintColor={theme.primary}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerAll: { justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 24, paddingBottom: 50 },
  header: { marginTop: 20, marginBottom: 40, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "300", letterSpacing: 2 },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
    textAlign: "center",
  },
  timerContainer: { alignItems: "center", marginBottom: 50 },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timerText: { fontSize: 48, fontWeight: "300" },
  timerLabel: { fontSize: 16, color: "#888", marginTop: 4 },
  timerButtons: { flexDirection: "row", gap: 15 },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  settingsContainer: { padding: 20, borderRadius: 16, gap: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: -4 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  settingDescription: { fontSize: 12, marginTop: 4 },
  intervalToggle: { flexDirection: "row", alignItems: "center" },
  intervalOption: { fontSize: 16, padding: 5, fontWeight: "600" },
  volumeContainer: { width: "100%", alignItems: "stretch", marginTop: 10 },
  volumeLabel: { marginBottom: 12, fontSize: 14, fontWeight: "500" },
  slider: { width: "100%", height: 40 },
});
// import React, { useState, useEffect, useRef } from "react";
// import {
//   ScrollView,
//   StyleSheet,
//   Switch,
//   Text,
//   View,
//   TouchableOpacity,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Slider from "@react-native-community/slider";
// import { Audio } from "expo-av";

// export default function MeditationScreen() {
//   const [isRunning, setIsRunning] = useState(false);
//   const [interval, setIntervalTime] = useState(30);
//   const [timeLeft, setTimeLeft] = useState(30 * 60);

//   const [enableDhammaAudio, setEnableDhammaAudio] = useState(false);
//   const [volume, setVolume] = useState(0.5);

//   const timerRef = useRef(null);
//   const bellSound = useRef(null);
//   const dhammaSound = useRef(null);

//   const theme = {
//     background: "#ffffff",
//     primary: "#4a90e2",
//     secondary: "#50c878",
//     text: "#333333",
//     icon: "#888888",
//     surface: "#f5f5f5",
//   };

//   // Load sounds
//   useEffect(() => {
//     loadSounds();

//     return () => {
//       if (bellSound.current) bellSound.current.unloadAsync();
//       if (dhammaSound.current) dhammaSound.current.unloadAsync();
//     };
//   }, []);

//   const loadSounds = async () => {
//     const { sound } = await Audio.Sound.createAsync({
//       uri: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_1b52c8f2f7.mp3",
//     });

//     bellSound.current = sound;

//     const { sound: dhamma } = await Audio.Sound.createAsync({
//       uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
//     });

//     dhammaSound.current = dhamma;
//   };

//   const playBell = async () => {
//     if (bellSound.current) {
//       await bellSound.current.setVolumeAsync(volume);
//       await bellSound.current.replayAsync();
//     }
//   };

//   const playDhamma = async () => {
//     if (enableDhammaAudio && dhammaSound.current) {
//       await dhammaSound.current.setVolumeAsync(volume);
//       await dhammaSound.current.playAsync();
//     }
//   };

//   // Timer logic
//   useEffect(() => {
//     if (isRunning) {
//       timerRef.current = setInterval(() => {
//         setTimeLeft((prev) => {
//           if (prev <= 1) {
//             clearInterval(timerRef.current);
//             playBell();
//             setIsRunning(false);
//             return 0;
//           }

//           if (prev % (interval * 60) === 0) {
//             playBell();
//           }

//           return prev - 1;
//         });
//       }, 1000);

//       playDhamma();
//     }

//     return () => clearInterval(timerRef.current);
//   }, [isRunning]);

//   const startTimer = () => setIsRunning(true);

//   const resetTimer = () => {
//     setIsRunning(false);
//     clearInterval(timerRef.current);
//     setTimeLeft(interval * 60);
//   };

//   const formatTime = () => {
//     const m = Math.floor(timeLeft / 60);
//     const s = timeLeft % 60;

//     return `${m}:${s < 10 ? "0" : ""}${s}`;
//   };

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: theme.background }]}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.header}>
//           <Text style={[styles.title, { color: theme.primary }]}>
//             MEDITATION
//           </Text>
//           {/* <Text style={[styles.title, { color: theme.primary }]}>ဗုဒ္ဓံ</Text>
//           <Text style={[styles.title, { color: theme.primary }]}>ဓမ္မံ</Text>
//           <Text style={[styles.title, { color: theme.primary }]}>သံဃံ</Text> */}
//           {/* <Text style={[styles.subtitle, { color: theme.icon }]}>
//             Find your inner peace
//           </Text> */}
//           <Text style={[styles.subtitle, { color: theme.icon }]}>
//             may all being be well, happy, and peaceful.
//           </Text>
//         </View>

//         <View style={styles.timerContainer}>
//           <View style={styles.timerCircle}>
//             <Text style={styles.timerText}>{formatTime()}</Text>
//             <Text style={styles.timerLabel}>Meditation</Text>
//           </View>

//           <View style={styles.timerButtons}>
//             <TouchableOpacity
//               style={[styles.button, { backgroundColor: theme.primary }]}
//               onPress={startTimer}
//             >
//               <Text style={styles.buttonText}>Start</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.button, { backgroundColor: theme.icon }]}
//               onPress={resetTimer}
//             >
//               <Text style={styles.buttonText}>Reset</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View
//           style={[styles.settingsContainer, { backgroundColor: theme.surface }]}
//         >
//           <Text style={[styles.sectionTitle, { color: theme.text }]}>
//             Settings
//           </Text>

//           {/* Interval */}
//           <View style={styles.settingRow}>
//             <Text style={[styles.settingLabel, { color: theme.text }]}>
//               Bell Interval
//             </Text>

//             <View style={styles.intervalToggle}>
//               <Text
//                 style={[
//                   styles.intervalOption,
//                   { color: interval === 30 ? theme.secondary : theme.icon },
//                 ]}
//                 onPress={() => {
//                   if (!isRunning) {
//                     setIntervalTime(30);
//                     setTimeLeft(30 * 60);
//                   }
//                 }}
//               >
//                 30m
//               </Text>

//               <Text style={{ color: theme.icon }}> | </Text>

//               <Text
//                 style={[
//                   styles.intervalOption,
//                   { color: interval === 60 ? theme.secondary : theme.icon },
//                 ]}
//                 onPress={() => {
//                   if (!isRunning) {
//                     setIntervalTime(60);
//                     setTimeLeft(60 * 60);
//                   }
//                 }}
//               >
//                 1h
//               </Text>
//             </View>
//           </View>

//           {/* Dhamma Audio */}
//           {/* <View style={styles.settingRow}>
//             <View>
//               <Text style={[styles.settingLabel, { color: theme.text }]}>
//                 Dhamma Audio
//               </Text>

//               <Text style={[styles.settingDescription, { color: theme.icon }]}>
//                 အာနာပါနသမထ လမ်းညွှန် အသံ
//               </Text>
//             </View>

//             <Switch
//               value={enableDhammaAudio}
//               onValueChange={setEnableDhammaAudio}
//               trackColor={{ false: theme.icon, true: theme.secondary }}
//             />
//           </View> */}

//           {/* Volume */}
//           {/* <View style={styles.volumeContainer}>
//             <Text style={[styles.volumeLabel, { color: theme.text }]}>
//               Volume: {Math.round(volume * 100)}%
//             </Text>

//             <Slider
//               style={styles.slider}
//               minimumValue={0}
//               maximumValue={1}
//               step={0.01}
//               value={volume}
//               onValueChange={setVolume}
//             />
//           </View> */}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },

//   scrollContent: {
//     padding: 24,
//     minHeight: "100%",
//   },

//   header: {
//     marginTop: 20,
//     marginBottom: 40,
//     alignItems: "center",
//   },

//   title: {
//     fontSize: 32,
//     fontWeight: "300",
//   },

//   subtitle: {
//     fontSize: 14,
//     marginTop: 8,
//     fontStyle: "italic",
//   },

//   timerContainer: {
//     alignItems: "center",
//     marginBottom: 50,
//   },

//   timerCircle: {
//     width: 200,
//     height: 200,
//     borderRadius: 100,
//     backgroundColor: "#f5f5f5",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//   },

//   timerText: {
//     fontSize: 48,
//     fontWeight: "300",
//   },

//   timerLabel: {
//     fontSize: 16,
//     color: "#888",
//   },

//   timerButtons: {
//     flexDirection: "row",
//     gap: 15,
//   },

//   button: {
//     paddingHorizontal: 30,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },

//   buttonText: {
//     color: "white",
//     fontSize: 16,
//   },

//   settingsContainer: {
//     padding: 20,
//     borderRadius: 16,
//     gap: 20,
//   },

//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//   },

//   settingRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },

//   settingLabel: {
//     fontSize: 16,
//   },

//   settingDescription: {
//     fontSize: 12,
//   },

//   intervalToggle: {
//     flexDirection: "row",
//     alignItems: "center",
//   },

//   intervalOption: {
//     fontSize: 16,
//     padding: 5,
//   },

//   volumeContainer: {
//     width: "100%",
//     alignItems: "center",
//   },

//   volumeLabel: {
//     marginBottom: 8,
//   },

//   slider: {
//     width: 300,
//   },
// });
