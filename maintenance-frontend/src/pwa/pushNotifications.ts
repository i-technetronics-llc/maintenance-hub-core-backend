const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const isPushSupported = () => {
  return 'PushManager' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermission = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!('Notification' in window)) return 'unsupported';

  const permission = await Notification.requestPermission();
  return permission;
};

export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription && VAPID_PUBLIC_KEY) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
};

export const sendSubscriptionToServer = async (subscription: PushSubscription) => {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    return false;
  }
};

export const showLocalNotification = async (title: string, options?: NotificationOptions) => {
  if (getNotificationPermission() !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options,
  });
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
