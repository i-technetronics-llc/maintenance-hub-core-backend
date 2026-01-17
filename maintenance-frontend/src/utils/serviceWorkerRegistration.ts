// Service Worker registration utility

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Reload page when new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[PWA] Service Worker unregistration failed:', error);
      });
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[PWA] This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push notifications
      // Note: Replace with your VAPID public key
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      console.log('[PWA] Push notification subscription:', subscription);

      // Send subscription to your server
      // await fetch('/api/push-subscribe', {
      //   method: 'POST',
      //   body: JSON.stringify(subscription),
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });
    }

    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push notifications:', error);
    return null;
  }
}

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

// Check if app is installed
export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Show install prompt
export function setupInstallPrompt() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show your custom install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';

      installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
          // Show the install prompt
          deferredPrompt.prompt();

          // Wait for the user to respond to the prompt
          const { outcome } = await deferredPrompt.userChoice;

          console.log(`[PWA] User response to install prompt: ${outcome}`);

          // Clear the deferred prompt
          deferredPrompt = null;
          installButton.style.display = 'none';
        }
      });
    }
  });

  // Track if app was installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
}
