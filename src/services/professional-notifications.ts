import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerNursePushToken } from '@/api/professionalRequests';

const DEVICE_ID_KEY = '@carenow_nurse_notification_device_id';
const REQUEST_CHANNEL_ID = 'service-requests';

type NotificationModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationModule | null> | null = null;
let notificationHandlerConfigured = false;

/**
 * Expo Go no longer contains the native remote-push implementation.
 * Keep the import lazy so Expo Go can still run the rest of CareNow without
 * crashing during module evaluation. Development/production native builds
 * load expo-notifications normally on both Android and iOS.
 */
async function loadNotificationsModule(): Promise<NotificationModule | null> {
  // Expo Go must never attempt to initialise the remote push native module.
  // executionEnvironment is the supported Expo runtime discriminator.
  if (Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((module) => {
        configureNotificationHandler(module);
        return module;
      })
      .catch((error) => {
        console.warn('[CareNow Notifications] Native notification module unavailable.', error);
        return null;
      });
  }

  return notificationsModulePromise;
}

function configureNotificationHandler(module: NotificationModule) {
  if (notificationHandlerConfigured) return;

  module.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  notificationHandlerConfigured = true;
}

export async function registerProfessionalPushNotifications(): Promise<boolean> {
  // Remote push is not available in Expo Go. This is intentionally a no-op,
  // not an application error. Use an Android/iOS development or production
  // build for real push notifications.
  if (Constants.executionEnvironment === 'storeClient') {
    console.info('[CareNow Notifications] Expo Go detected. Remote push registration is skipped. Use a development build for push notifications.');
    return false;
  }

  if (!Device.isDevice) {
    console.warn('[CareNow Notifications] Push notifications require a physical device for Expo push registration.');
    return false;
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REQUEST_CHANNEL_ID, {
        name: 'Service Requests',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let permission = existing.status;
    if (permission !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      permission = requested.status;
    }

    if (permission !== 'granted') {
      console.warn('[CareNow Notifications] Notification permission was not granted.');
      return false;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('[CareNow Notifications] EAS projectId is missing from app.json.');
      return false;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token.data) return false;

    const deviceId = await getOrCreateDeviceId();
    await registerNursePushToken({
      deviceId,
      pushToken: token.data,
      platform: Platform.OS,
    });

    return true;
  } catch (error) {
    // Push setup must never prevent the professional dashboard from opening.
    console.warn('[CareNow Notifications] Unable to register push token', error);
    return false;
  }
}

export function addProfessionalNotificationResponseListener(
  onRequest: (requestId: string) => void,
) {
  // Return a subscription-shaped no-op immediately. This keeps the RootLayout
  // lifecycle synchronous while the native module is loaded only when needed.
  let active = true;
  let subscription: { remove: () => void } | null = null;

  void loadNotificationsModule().then((Notifications) => {
    if (!active || !Notifications) return;

    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        type?: string;
        requestId?: string;
      };

      if (data?.type === 'NURSE_SERVICE_REQUEST' && data.requestId) {
        onRequest(String(data.requestId));
      }
    });
  });

  return {
    remove: () => {
      active = false;
      subscription?.remove();
      subscription = null;
    },
  };
}

export async function getInitialProfessionalNotificationRequestId(): Promise<string | null> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return null;

  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    const data = response?.notification.request.content.data as {
      type?: string;
      requestId?: string;
    } | undefined;

    if (data?.type === 'NURSE_SERVICE_REQUEST' && data.requestId) {
      return String(data.requestId);
    }
  } catch (error) {
    console.warn('[CareNow Notifications] Unable to inspect launch notification', error);
  }

  return null;
}

async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated = `carenow-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}
