import { ProfileService } from '@/src/services/profile';
import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

type PushNotificationContextType = {
  expoPushToken: string | undefined;
  lastNotificationResponse: Notifications.NotificationResponse | null;
};

const PushNotificationContext = createContext<
  PushNotificationContextType | undefined
>(undefined);

export function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [lastNotificationResponse, setLastNotificationResponse] =
    useState<Notifications.NotificationResponse | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })
    ).data;

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Store the token in the user's profile
        if (user?.$id) {
          ProfileService.getUserProfile(user).then((profile) => {
            if (profile) {
              ProfileService.updateUserProfile(user, {
                pushToken: token,
              });
            }
          });
        }
      }
    });

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Refresh notifications when a new one is received
        refreshNotifications();
      });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setLastNotificationResponse(response);
        // Refresh notifications when user interacts with a notification
        refreshNotifications();
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.$id]);

  return (
    <PushNotificationContext.Provider
      value={{
        expoPushToken,
        lastNotificationResponse,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
}

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error(
      'usePushNotifications must be used within a PushNotificationProvider'
    );
  }
  return context;
};
