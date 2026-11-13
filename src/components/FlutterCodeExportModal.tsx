import React, { useState } from 'react';
import { X, Copy, Check, Code2, Smartphone, Cpu, FileCode } from 'lucide-react';
import { ChecklistGroup, TaskItem } from '../types/models';

interface FlutterCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ChecklistGroup[];
  tasks: TaskItem[];
}

export const FlutterCodeExportModal: React.FC<FlutterCodeExportModalProps> = ({
  isOpen,
  onClose,
  groups,
  tasks,
}) => {
  const [activeTab, setActiveTab] = useState<'android_build' | 'isar' | 'notification_service' | 'json'>('android_build');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const androidBuildGuide = `# ==========================================
# Інструкцыя па кампіляцыі і зборцы для Android
# ==========================================

# 1. Стварэнне праекта Flutter:
flutter create taskpulse_flutter --org com.taskpulse.app
cd taskpulse_flutter

# 2. Даданне неабходных пакетаў для Android:
flutter pub add isar isar_flutter_libs google_generative_ai path_provider
flutter pub add -d isar_generator build_runner

# 3. Дазволы для Android (android/app/src/main/AndroidManifest.xml):
# Дадайце наступныя радкі перад тэгам <application>:
# <uses-permission android:name="android.permission.INTERNET"/>
# <uses-permission android:name="android.permission.RECORD_AUDIO"/>

# 4. Генерацыя Isar кода:
dart run build_runner build --delete-conflicting-outputs

# 5. Кампіляцыя і зборка гатовага APK файла для Android прылад:
flutter build apk --release
# Выніковы APK будзе знаходзіцца па шляху:
# build/app/outputs/flutter-apk/app-release.apk

# 6. Зборка Android App Bundle (AAB) для публікацыі ў Google Play:
flutter build appbundle --release

# 7. Запуск непасрэдна на падлучанай Android прыладзе / эмулятары:
flutter run --release
`;

  const isarModelsCode = `// lib/models/checklist_models.dart
import 'package:isar/isar.dart';

part 'checklist_models.g.dart';

enum RecurrenceRule {
  none,
  daily,
  weekly,
  monthly,
}

@collection
class ChecklistGroup {
  Id isarId = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String id; // UUID

  late String title;
  String? description;
  late DateTime createdAt;
  String? color;
  String? icon;

  @Backlink(to: 'group')
  final tasks = IsarLinks<TaskItem>();
}

@collection
class TaskItem {
  Id isarId = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String id; // UUID

  @Index()
  late String groupId; // Знешні ключ

  final group = IsarLink<ChecklistGroup>();

  late String title;
  late bool isCompleted;

  DateTime? dueDate; // null калі "У любы час"
  String? dueTime; // Напрыклад "07:00", "09:00", "12:00" ці null
  late bool isAnytime;

  @enumerated
  late RecurrenceRule recurrenceRule;

  late int sortOrder;
  DateTime? completedAt;
}`;

  const notificationServiceCode = `// lib/services/notification_service.dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    tz.initializeTimeZones();

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Націск на апавяшчэнне
      },
    );
  }

  Future<void> scheduleTaskNotification({
    required int id,
    required String title,
    required String timeStr, // "07:00", "12:00"
    required DateTime targetDate,
  }) async {
    final parts = timeStr.split(':');
    final hour = int.parse(parts[0]);
    final minute = int.parse(parts[1]);

    final scheduledDate = tz.TZDateTime.from(
      DateTime(targetDate.year, targetDate.month, targetDate.day, hour, minute),
      tz.local,
    );

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'taskpulse_channel',
      'Задачы і напаміны',
      channelDescription: 'Апавяшчэнні для задач з канкрэтным часам',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
    );

    await flutterLocalNotificationsPlugin.zonedSchedule(
      id,
      '⏰ Час выканаць задачу!',
      title,
      scheduledDate,
      const NotificationDetails(android: androidDetails),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }
}`;

  const currentJsonDump = JSON.stringify(
    {
      groups,
      tasks,
    },
    null,
    2
  );

  const getActiveCode = () => {
    switch (activeTab) {
      case 'android_build':
        return androidBuildGuide;
      case 'isar':
        return isarModelsCode;
      case 'notification_service':
        return notificationServiceCode;
      case 'json':
        return currentJsonDump;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md animate-in fade-in">
      <div className="flex h-[90vh] max-h-[720px] w-full max-w-3xl flex-col rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header in Belarusian */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Кампіляцыя для Android і зыходны код Dart</h3>
              <p className="text-[11px] text-slate-400">
                Гатовыя інструкцыі для зборкі APK і файлы мадэляў Isar для Flutter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Зачыніць"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('android_build')}
            className={`border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'android_build'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Зборка Android APK (flutter build)
          </button>
          <button
            onClick={() => setActiveTab('isar')}
            className={`border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'isar'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            checklist_models.dart (Isar)
          </button>
          <button
            onClick={() => setActiveTab('notification_service')}
            className={`border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'notification_service'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            notification_service.dart (Апавяшчэнні)
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Бягучыя даныя JSON ({tasks.length} задач)
          </button>
        </div>

        {/* Code Content */}
        <div className="relative flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-200 selection:bg-indigo-500/40">
          <button
            onClick={handleCopy}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur hover:bg-slate-700 active:scale-95 transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Скапіявана!' : 'Скапіяваць код'}</span>
          </button>
          <pre className="whitespace-pre overflow-x-auto pr-24">{getActiveCode()}</pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-5 py-3 text-xs text-slate-400">
          <span>Сумяшчальна з Flutter 3.x, Android SDK 34+ і google_generative_ai ^0.4.0</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Закрыць
          </button>
        </div>
      </div>
    </div>
  );
};
