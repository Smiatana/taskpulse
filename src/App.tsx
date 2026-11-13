import React, { useState, useEffect } from 'react';
import {
  ChecklistGroup,
  TaskItem,
  DashboardTab,
  RecurrenceRule,
} from './types/models';
import {
  loadGroupsFromStorage,
  saveGroupsToStorage,
  loadTasksFromStorage,
  saveTasksToStorage,
  calculateNextDueDate,
} from './services/storage';
import { FlutterMobileFrame } from './components/FlutterMobileFrame';
import { DashboardView } from './components/DashboardView';
import { QuickAddBar } from './components/QuickAddBar';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { FlutterCodeExportModal } from './components/FlutterCodeExportModal';
import { checkAndNotifyTimedTasks } from './services/notificationService';

const RECURRENCE_NAMES: Record<RecurrenceRule, string> = {
  none: 'без паўтору',
  daily: 'штодзень',
  weekly: 'штотыдзень',
  monthly: 'штомесяц',
};

export default function App() {
  const [groups, setGroups] = useState<ChecklistGroup[]>(() => loadGroupsFromStorage());
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasksFromStorage());
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');
  const [activeQuickAddGroupId, setActiveQuickAddGroupId] = useState<string | null>(null);

  // Modals & Panels state
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [themeStyle, setThemeStyle] = useState<'material3' | 'cupertino'>('material3');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Persist whenever state changes locally
  useEffect(() => {
    saveGroupsToStorage(groups);
  }, [groups]);

  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  // 100% Local offline notification scheduler
  // Monitors tasks with specific due times (e.g. 07:00, 12:00) and triggers notifications, chimes, and vibrations
  useEffect(() => {
    checkAndNotifyTimedTasks(tasks);

    const timer = setInterval(() => {
      checkAndNotifyTimedTasks(tasks);
    }, 15000);

    return () => clearInterval(timer);
  }, [tasks]);

  // Handle task completion toggle with automatic recurrence instance rollover
  const handleToggleComplete = (taskId: string) => {
    setTasks((prevTasks) => {
      const taskIndex = prevTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const current = prevTasks[taskIndex];
      const willBeCompleted = !current.isCompleted;

      const updated = [...prevTasks];
      updated[taskIndex] = {
        ...current,
        isCompleted: willBeCompleted,
        completedAt: willBeCompleted ? new Date().toISOString() : undefined,
      };

      // Recurrence rule generation on completion
      if (willBeCompleted && current.recurrenceRule && current.recurrenceRule !== 'none') {
        const nextDueDate = calculateNextDueDate(
          current.dueDate || new Date().toISOString().split('T')[0],
          current.recurrenceRule
        );

        const newRecurringTask: TaskItem = {
          id: 'task-recur-' + Date.now(),
          groupId: current.groupId || null,
          title: current.title,
          isCompleted: false,
          dueDate: nextDueDate,
          dueTime: current.dueTime || null,
          isAnytime: false,
          recurrenceRule: current.recurrenceRule,
          sortOrder: prevTasks.length + 1,
        };

        updated.unshift(newRecurringTask);
        showToast(
          `Створаны наступны паўтор (${RECURRENCE_NAMES[current.recurrenceRule]}): "${current.title}" на ${nextDueDate}${
            current.dueTime ? ' а ' + current.dueTime : ''
          }`
        );
      }

      return updated;
    });
  };

  // Update existing task
  const handleUpdateTask = (updatedTask: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Задачу выдалена');
  };

  // Create a new checklist group
  const handleCreateGroup = (groupData: Omit<ChecklistGroup, 'id' | 'createdAt'>): ChecklistGroup => {
    const newGroup: ChecklistGroup = {
      id: 'group-' + Date.now(),
      ...groupData,
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [...prev, newGroup]);
    showToast(`Створана група: "${newGroup.title}"`);
    return newGroup;
  };

  // Delete a checklist group
  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    // When deleting a group, set affected tasks to ungrouped (null)
    setTasks((prev) =>
      prev.map((t) => (t.groupId === groupId ? { ...t, groupId: null } : t))
    );
    showToast('Групу чэк-лістаў выдалена');
  };

  // Quick-Add bar handler
  const handleQuickAddTask = (
    taskData: Omit<TaskItem, 'id' | 'sortOrder'>,
    suggestedGroupTitle?: string | null
  ) => {
    let targetGroupId: string | null = taskData.groupId || null;

    if (suggestedGroupTitle && (!targetGroupId || !groups.some((g) => g.id === targetGroupId))) {
      const existing = groups.find(
        (g) => g.title.toLowerCase() === suggestedGroupTitle.toLowerCase()
      );
      if (existing) {
        targetGroupId = existing.id;
      } else {
        const created = handleCreateGroup({
          title: suggestedGroupTitle,
          description: 'Аўтаматычна створана праз хуткі ўвод',
          color: '#6366f1',
        });
        targetGroupId = created.id;
      }
    }

    // Ungrouped by default unless explicitly tagged or created in a group context
    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      groupId: targetGroupId || null,
      title: taskData.title,
      isCompleted: false,
      dueDate: taskData.isAnytime ? null : taskData.dueDate || new Date().toISOString().split('T')[0],
      dueTime: taskData.dueTime || null,
      isAnytime: taskData.isAnytime,
      recurrenceRule: taskData.recurrenceRule || 'none',
      sortOrder: tasks.length + 1,
    };

    setTasks((prev) => [newTask, ...prev]);
    showToast(`Дададзена: "${newTask.title}"`);
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (confirm('Скінуць да пачатковых дэма-чэк-лістаў і задач?')) {
      localStorage.removeItem('taskpulse_flutter_groups_be_v2');
      localStorage.removeItem('taskpulse_flutter_tasks_be_v2');
      setGroups(loadGroupsFromStorage());
      setTasks(loadTasksFromStorage());
      showToast('Скінута да пачатковых дэма-даных');
    }
  };

  return (
    <FlutterMobileFrame
      onOpenNotifications={() => setIsNotificationModalOpen(true)}
      onOpenCodeExport={() => setIsCodeExportOpen(true)}
      onResetData={handleResetData}
      isPhoneFrame={isPhoneFrame}
      setIsPhoneFrame={setIsPhoneFrame}
      themeStyle={themeStyle}
      setThemeStyle={setThemeStyle}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-indigo-600/95 border border-indigo-400 px-4 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Flutter Dashboard View (Сёння, Хутка, У любы час, Групы) */}
      <DashboardView
        groups={groups}
        tasks={tasks}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleComplete={handleToggleComplete}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCreateGroup={handleCreateGroup}
        onDeleteGroup={handleDeleteGroup}
        onOpenQuickAddForGroup={(groupId) => {
          setActiveQuickAddGroupId(groupId);
        }}
      />

      {/* Flutter Mobile Bottom Quick-Add Bar */}
      <div className={`fixed inset-x-0 bottom-0 z-40 mx-auto w-full ${isPhoneFrame ? 'max-w-[420px]' : 'max-w-4xl'}`}>
        <QuickAddBar
          groups={groups}
          activeGroupId={activeQuickAddGroupId}
          activeTab={activeTab}
          onAddTask={handleQuickAddTask}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
        />
      </div>

      {/* 100% Offline Local Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        tasks={tasks}
      />

      {/* Flutter / Isar Dart & Android Code Export Modal */}
      <FlutterCodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        groups={groups}
        tasks={tasks}
      />
    </FlutterMobileFrame>
  );
}
