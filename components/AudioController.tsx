import React, { useEffect, useState } from "react";
import { Audio } from "expo-av";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function AudioController() {
  const { currentTime, interval, isFinished, isRunning } = useSelector(
    (state: RootState) => state.timer
  );
  const { enableDhammaAudio, volume } = useSelector(
    (state: RootState) => state.audio
  );

  const [dhammaSoundObj, setDhammaSoundObj] = useState<Audio.Sound | null>(
    null
  );

  // Helper to play bell sound
  async function playBell() {
    try {
      console.log(`Playing bell at volume ${volume}`);
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/sounds/bell.mp3")
      );
      await sound.setVolumeAsync(volume);
      await sound.playAsync();

      // Unload after playback to free resources
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Error playing bell:", error);
    }
  }

  // Manage Dhamma Audio (Looping functionality)
  useEffect(() => {
    let soundObj: Audio.Sound | null = null;

    const manageAudio = async () => {
      if (isRunning && enableDhammaAudio) {
        if (!dhammaSoundObj) {
          try {
            console.log("Loading Dhamma audio...");
            const { sound } = await Audio.Sound.createAsync(
              require("@/assets/sounds/dhamma.mp3"),
              { shouldPlay: true, isLooping: true }
            );
            await sound.setVolumeAsync(volume * 0.5); // Background volume slightly lower
            soundObj = sound;
            setDhammaSoundObj(sound);
          } catch (error) {
            console.log("Error loading Dhamma audio", error);
          }
        } else {
          await dhammaSoundObj.playAsync();
        }
      } else {
        if (dhammaSoundObj) {
          console.log("Pausing Dhamma audio...");
          await dhammaSoundObj.pauseAsync();
        }
      }
    };

    manageAudio();

    return () => {
      // Cleanup if component unmounts or dependency changes significantly
      // Note: we want to keep it loaded while running, so only unload on manual stop/unmount
    };
  }, [isRunning, enableDhammaAudio]);

  // Update volume if changed while playing
  useEffect(() => {
    if (dhammaSoundObj) {
      dhammaSoundObj.setVolumeAsync(volume * 0.5);
    }
  }, [volume, dhammaSoundObj]);

  // Interval check
  useEffect(() => {
    // interval * 60 for minutes.
    // If interval is 1 minute (test), it's 60 seconds.
    if (isRunning && currentTime > 0 && currentTime % (interval * 60) === 0) {
      playBell();
    }
  }, [currentTime, interval, isRunning]);

  // Finish check
  useEffect(() => {
    if (isFinished) {
      // Ring twice
      playBell();
      setTimeout(() => playBell(), 3000); // 3 seconds later ring again

      // Stop Dhamma audio if playing
      if (dhammaSoundObj) {
        dhammaSoundObj.stopAsync();
      }
    }
  }, [isFinished]);

  return null;
}
