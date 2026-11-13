import { TaskItem } from '../types/models';

/**
 * 100% Local Phone Notification Service
 * Works completely offline without internet using Web Notifications API,
 * Service Worker background notifications, Web Audio API chime synthesis, and Vibration API.
 */

export interface NotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Synthesizes a pleasant dual-tone chime using Web Audio API.
 * Requires 0 external audio files and works 100% offline.
 */
export function playAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;

    // First tone (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second tone (880.00 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('Audio synthesis not permitted or unavailable:', err);
  }
}

/**
 * Triggers phone vibration if supported by device.
 */
export function vibratePhone(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      // Ignore vibration restrictions
    }
  }
}

/**
 * Sends a phone notification via Service Worker or Web Notification API.
 */
export async function sendPhoneNotification(
  title: string,
  body: string,
  tag?: string
): Promise<boolean> {
  playAlertChime();
  vibratePhone();

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: tag || 'taskpulse-notification',
    renotify: true,
    vibrate: [200, 100, 200],
  };

  // Try Service Worker registration first (works better on Android PWA)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, options);
        return true;
      }
    } catch (e) {
      console.warn('SW showNotification failed, falling back to new Notification:', e);
    }
  }

  // Fallback to direct Window Notification
  try {
    new Notification(title, options);
    return true;
  } catch (err) {
    console.error('Failed to trigger Notification:', err);
    return false;
  }
}

/**
 * Immediate Test Notification
 */
export async function testPhoneNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }

  return sendPhoneNotification(
    '🔔 TaskPulse: Тэставае апавяшчэнне',
    'Апавяшчэнні паспяхова падключаны! Цяпер вы атрымаеце сігнал у час запланаванай задачы.',
    'test-notification'
  );
}

/**
 * Checks tasks for due times matching current time and triggers alerts.
 */
export function checkAndNotifyTimedTasks(tasks: TaskItem[]): string[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  const storageKey = `taskpulse_notified_${todayStr}`;
  let notifiedSet: Set<string>;
  try {
    const raw = localStorage.getItem(storageKey);
    notifiedSet = new Set(raw ? JSON.parse(raw) : []);
  } catch {
    notifiedSet = new Set();
  }

  const newlyTriggered: string[] = [];

  for (const task of tasks) {
    if (task.isCompleted) continue;
    if (!task.dueTime) continue;

    // Only alert if scheduled for today or without a strict date (floating timed task)
    if (task.dueDate && task.dueDate !== todayStr) continue;

    const taskTime = task.dueTime.trim();
    const taskKey = `${task.id}_${taskTime}`;

    if (notifiedSet.has(taskKey)) continue;

    // Check if current time matches task time (or if within a 3-minute grace period)
    const [tH, tM] = taskTime.split(':').map((v) => parseInt(v, 10));
    const [cH, cM] = [now.getHours(), now.getMinutes()];
    const diffMins = (cH * 60 + cM) - (tH * 60 + tM);

    // Alert if within [0, 4] minutes after due time
    if (diffMins >= 0 && diffMins <= 4) {
      sendPhoneNotification(
        `⏰ Час выканаць: ${task.title}`,
        `Запланавана на ${task.dueTime}. Адзначце выкананне пасля завяршэння!`,
        taskKey
      );

      notifiedSet.add(taskKey);
      newlyTriggered.push(task.id);
    }
  }

  if (newlyTriggered.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(notifiedSet)));
    } catch (e) {
      console.error(e);
    }
  }

  return newlyTriggered;
}
