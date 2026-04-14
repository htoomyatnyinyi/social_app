import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// We dynamic-require expo-notifications to avoid crashes on Expo Go (Android/SDK 53+)
// The side effects in expo-notifications check for Expo Go on Android and throw an error 
// before we can even use the library.
const isExpoGo = Constants.appOwnership === 'expo';
const isAndroid = Platform.OS === 'android';
const shouldSkipPush = isExpoGo && isAndroid;

let Notifications: any = null;

if (!shouldSkipPush) {
  try {
    // Dynamic import to avoid top-level side effects
    Notifications = require('expo-notifications');
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('Failed to load expo-notifications:', err);
  }
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (shouldSkipPush || !Notifications) {
      console.warn('推送通知:', 'Android Push Notifications are disabled in Expo Go. Use a development build for full functionality.');
      return;
    }

    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('Push Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('Push Notification Response:', response);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  return { expoPushToken };
}

export async function scheduleLocalNotificationAsync(title: string, body: string, data?: any) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  } catch (err) {
    console.log('Failed to schedule local notification:', err);
  }
}

async function registerForPushNotificationsAsync() {
  if (shouldSkipPush || !Notifications) return undefined;

  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1d9bf0',
      });
    } catch (e) {
      console.warn('Failed to set notification channel:', e);
    }
  }

  // Android Emulators support push notifications, whereas iOS Simulators technically do in recent versions but we allow it gracefully to fail if not.
  if (Device.isDevice || Platform.OS === 'android') {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return undefined; // permissions denied
      }
      
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      // If there's an EAS project ID, pass it. Otherwise, defaults usually work for Expo Go.
      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } catch (e: any) {
      if (e.message?.includes('FirebaseApp is not initialized')) {
        console.warn('Push Notifications (FCM): Android configuration missing (google-services.json). This is normal if you haven\'t configured Firebase yet for your bundle ID.');
        console.warn('To fix: Download google-services.json from Firebase Console and add it to your project root, then add "googleServicesFile": "./google-services.json" to app.json under expo.android.');
      } else {
        console.error('Failed to get push token:', e);
      }
    }
  } else {
    console.log('Push Notifications: Must use physical device or configured emulator for token generation.');
  }

  return token;
}
