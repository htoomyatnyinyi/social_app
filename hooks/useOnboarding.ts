import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "@app_onboarded";

export const useOnboarding = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setIsOnboarded(value === "true");
      } catch (error) {
        console.error("Failed to check onboarding status", error);
        setIsOnboarded(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboarded(true);
    } catch (error) {
      console.error("Failed to complete onboarding", error);
    }
  };

  return { isOnboarded, isLoading, completeOnboarding };
};
