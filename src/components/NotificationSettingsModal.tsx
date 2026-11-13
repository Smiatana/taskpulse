import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  X,
  Volume2,
  Smartphone,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { TaskItem } from '../types/models';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  testPhoneNotification,
  playAlertChime,
} from '../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  tasks,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(true);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const timedTasksToday = tasks
    .filter((t) => !t.isCompleted && t.dueTime && (t.dueDate === todayStr || !t.dueDate))
    .sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''));

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleTestNotification = async () => {
    const success = await testPhoneNotification();
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3500);
    }
  };

  const handleTestChimeOnly = () => {
    playAlertChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl text-slate-100 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Тэлефонныя апавяшчэнні</h2>
              <p className="text-[11px] text-slate-400">100% афлайн, без выкарыстання інтэрнэту</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Card */}
        <div className="mt-4 space-y-3.5">
          {!supported ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>Браўзер не падтрымлівае Web Notifications</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Гукавыя сігналы будуць працаваць пры адкрытым дадатку праз убудаваны аўдыёсінтэзатар.
              </p>
            </div>
          ) : permission === 'granted' ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Апавяшчэнні ўключаны</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Актыўна
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                Тэлефон паведаміць сігналам і вібрацыяй, калі настане час задач з канкрэтным тэрмінам.
              </p>
            </div>
          ) : permission === 'denied' ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
              <div className="flex items-center gap-2 font-semibold">
                <BellOff className="h-4 w-4 text-amber-400" />
                <span>Апавяшчэнні заблакаваны ў браўзеры</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                Каб атрымліваць напаміны на тэлефоне, дазвольце апавяшчэнні для гэтага сайта ў наладах вашага браўзера ці тэлефона.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs text-indigo-300">
              <div className="flex items-center gap-2 font-semibold">
                <Bell className="h-4 w-4 text-indigo-400" />
                <span>Дазволіць апавяшчэнні на тэлефоне</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                Націсніце кнопку ніжэй, каб уключыць гукавыя сігналы і тэлефонныя апавяшчэнні для задач.
              </p>
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="mt-2.5 w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 active:scale-95 transition-all"
              >
                Дазволіць апавяшчэнні
              </button>
            </div>
          )}

          {/* Test Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
            >
              <Smartphone className="h-3.5 w-3.5 text-sky-400" />
              <span>{testSent ? 'Адпраўлена!' : 'Праверыць сігнал'}</span>
            </button>
            <button
              type="button"
              onClick={handleTestChimeOnly}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
            >
              <Volume2 className="h-3.5 w-3.5 text-purple-400" />
              <span>Тэст гуку</span>
            </button>
          </div>

          {/* Timed Tasks for Today */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                Запланаваныя сігналы на сёння:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {timedTasksToday.length}
              </span>
            </div>

            {timedTasksToday.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                Няма актыўных задач з канкрэтным часам на сёння.
                <br />
                Дадайце час пры стварэнні задачы (напрыклад: "Прыняць таблеткі а 7:00").
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {timedTasksToday.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-3 py-2 text-xs"
                  >
                    <span className="truncate text-slate-200 pr-2">{t.title}</span>
                    <span className="shrink-0 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-cyan-300 font-bold font-mono">
                      {t.dueTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Зразумела
          </button>
        </div>
      </div>
    </div>
  );
};
