import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PushNotificationToken = {
  expoToken: string | null;
  deviceToken?: string | null;
};

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;
  private devicePushToken: string | null = null;

  private constructor() {
    this.setupNotificationHandler();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async registerForPushNotifications(): Promise<PushNotificationToken | null> {
    let token: PushNotificationToken | null = null;

    if (Platform.OS === 'android') {
      await this.setupAndroidChannel();
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      try {
        // Get Expo push token
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }

        const expoTokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        this.expoPushToken = expoTokenResponse.data;

        // Get device push token (optional)
        try {
          const deviceTokenResponse = await Notifications.getDevicePushTokenAsync();
          this.devicePushToken = deviceTokenResponse.data;
        } catch (error) {
          console.log('Device push token not available:', error);
        }

        token = {
          expoToken: this.expoPushToken,
          deviceToken: this.devicePushToken,
        };

        console.log('Push notification tokens obtained:', token);
      } catch (error) {
        console.error('Error getting push tokens:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  private async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('workout', {
      name: 'Workout Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });

    await Notifications.setNotificationChannelAsync('progress', {
      name: 'Progress Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });

    await Notifications.setNotificationChannelAsync('community', {
      name: 'Community',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
    });
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null, // null means show immediately
    });

    return notificationId;
  }

  async scheduleWorkoutReminder(
    title: string,
    body: string,
    scheduledTime: Date,
    data?: Record<string, any>
  ): Promise<string> {
    return this.scheduleLocalNotification(
      title,
      body,
      data,
      {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledTime,
      }
    );
  }

  async scheduleDailyReminder(
    title: string,
    body: string,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ): Promise<string> {
    return this.scheduleLocalNotification(
      title,
      body,
      data,
      {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      }
    );
  }

  async scheduleWeeklyReminder(
    title: string,
    body: string,
    weekday: number, // 1-7 (Sunday = 1)
    hour: number,
    minute: number,
    data?: Record<string, any>
  ): Promise<string> {
    return this.scheduleLocalNotification(
      title,
      body,
      data,
      {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
      }
    );
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  getDevicePushToken(): string | null {
    return this.devicePushToken;
  }

  async addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Promise<Notifications.Subscription> {
    return Notifications.addNotificationReceivedListener(callback);
  }

  async addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Promise<Notifications.Subscription> {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  async addNotificationsDroppedListener(
    callback: () => void
  ): Promise<Notifications.Subscription> {
    return Notifications.addNotificationsDroppedListener(callback);
  }

  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  }

  async clearLastNotificationResponse(): Promise<void> {
    await Notifications.clearLastNotificationResponseAsync();
  }

  async unregisterForNotifications(): Promise<void> {
    await Notifications.unregisterForNotificationsAsync();
  }
}

export const pushNotificationService = PushNotificationService.getInstance(); 