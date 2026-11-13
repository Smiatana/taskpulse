import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Calendar,
  Clock,
  Repeat,
  MoreVertical,
  Trash2,
  Edit2,
  Folder,
  Sun,
  CloudSun,
  Flame,
  X,
} from 'lucide-react';
import { TaskItem, ChecklistGroup, RecurrenceRule } from '../types/models';
import confetti from 'canvas-confetti';

interface TaskCardProps {
  task: TaskItem;
  group?: ChecklistGroup;
  allGroups: ChecklistGroup[];
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
}

const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  none: 'Без паўтору',
  daily: 'Штодзень',
  weekly: 'Штотыдзень',
  monthly: 'Штомесяц',
};

const TIME_PRESETS = [
  { label: '07:00', hint: 'Раніца' },
  { label: '09:00', hint: 'Пачатак' },
  { label: '12:00', hint: 'Абед' },
  { label: '15:00', hint: 'Дзень' },
  { label: '18:00', hint: 'Вечар' },
  { label: '21:00', hint: 'Ноч' },
];

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  group,
  allGroups,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showDateReschedule, setShowDateReschedule] = useState(false);
  const [customTime, setCustomTime] = useState(task.dueTime || '');
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCheckboxClick = () => {
    if (!task.isCompleted) {
      confetti({
        particleCount: 28,
        spread: 45,
        origin: { y: 0.8 },
        colors: [group?.color || '#6366f1', '#10b981', '#38bdf8'],
      });
    }
    onToggleComplete(task.id);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdateTask({ ...task, title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleSetDueDate = (newDate: string | null, isAnytime: boolean) => {
    onUpdateTask({
      ...task,
      dueDate: newDate,
      isAnytime,
    });
  };

  const handleSetDueTime = (newTime: string | null) => {
    onUpdateTask({
      ...task,
      dueTime: newTime,
    });
  };

  const handleSetRecurrence = (rule: RecurrenceRule) => {
    onUpdateTask({
      ...task,
      recurrenceRule: rule,
    });
    setShowMenu(false);
  };

  const handleChangeGroup = (newGroupId: string | null) => {
    onUpdateTask({
      ...task,
      groupId: newGroupId || null,
    });
    setShowMenu(false);
  };

  // Helper date display in Belarusian
  const getDateLabel = () => {
    if (task.isAnytime || !task.dueDate) {
      return { text: 'У любы час', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: CloudSun };
    }
    if (task.dueDate === todayStr) {
      return { text: 'Сёння', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-medium', icon: Sun };
    }
    const d = new Date(task.dueDate + 'T12:00:00');
    const today = new Date(todayStr + 'T12:00:00');
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      return { text: 'Заўтра', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', icon: Calendar };
    }
    if (diffDays === 2) {
      return { text: 'Паслязаўтра', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Calendar };
    }
    if (diffDays < 0) {
      return { text: `Пратэрмінавана (${task.dueDate})`, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30 font-semibold', icon: Flame };
    }
    const formatted = d.toLocaleDateString('be-BY', { weekday: 'short', month: 'short', day: 'numeric' });
    return { text: formatted, color: 'text-slate-300 bg-slate-800/80 border-slate-700/60', icon: Calendar };
  };

  const dateBadge = getDateLabel();
  const DateIcon = dateBadge.icon;

  useEffect(() => {
    if (!showMenu) return;

    const updateMenuPosition = () => {
      const button = menuButtonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;

      const bounds = button.getBoundingClientRect();
      const viewportPadding = 8;
      const gap = 4;
      const availableBelow = window.innerHeight - bounds.bottom - gap - viewportPadding;
      const availableAbove = bounds.top - gap - viewportPadding;
      const contentHeight = menu.scrollHeight;
      const openAbove =
        availableBelow < Math.min(contentHeight, 320) && availableAbove > availableBelow;
      const availableHeight = Math.max(0, openAbove ? availableAbove : availableBelow);
      const height = Math.min(contentHeight, availableHeight);
      const width = Math.min(208, window.innerWidth - viewportPadding * 2);

      setMenuPosition({
        top: openAbove ? bounds.top - gap - height : bounds.bottom + gap,
        left: Math.max(
          viewportPadding,
          Math.min(bounds.right - width, window.innerWidth - width - viewportPadding)
        ),
        width,
        maxHeight: availableHeight,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [showMenu, allGroups.length]);

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        task.isCompleted
          ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20'
      }`}
    >
      <div className="flex items-start gap-3.5 p-3.5 sm:p-4">
        {/* Flutter M3 Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          aria-label={task.isCompleted ? 'Адзначыць як нявыкананае' : 'Адзначыць як выкананае'}
          className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-90 ${
            task.isCompleted
              ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'border-slate-600 bg-slate-800/80 hover:border-indigo-400 hover:bg-slate-800'
          }`}
        >
          {task.isCompleted && <Check className="h-4 w-4 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                autoFocus
                className="w-full rounded-lg border border-indigo-500/50 bg-slate-800 px-2.5 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveTitle}
                className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Захаваць
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={`cursor-pointer text-sm font-normal leading-snug sm:text-base ${
                task.isCompleted
                  ? 'text-slate-500 line-through decoration-slate-600'
                  : 'text-slate-100 hover:text-indigo-200'
              }`}
            >
              {task.title}
            </div>
          )}

          {/* Metadata Chips: Group, Due Date, Specific Time, Recurrence */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Checklist Group Tag */}
            {group && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-slate-300"
                style={{
                  backgroundColor: `${group.color || '#6366f1'}18`,
                  border: `1px solid ${group.color || '#6366f1'}35`,
                  color: group.color || '#818cf8',
                }}
              >
                <Folder className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{group.title}</span>
              </span>
            )}

            {/* Date Tag */}
            <button
              type="button"
              onClick={() => setShowDateReschedule(!showDateReschedule)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:brightness-110 ${dateBadge.color}`}
              title="Націсніце, каб перанесці дату альбо наладзіць час"
            >
              <DateIcon className="h-3 w-3" />
              <span>{dateBadge.text}</span>
            </button>

            {/* Specific Time Tag (e.g. 07:00, 09:00, 12:00) */}
            {task.dueTime ? (
              <button
                type="button"
                onClick={() => setShowDateReschedule(true)}
                className="inline-flex items-center gap-1 rounded-md border border-cyan-500/35 bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/25"
                title="Дакладны час задачы. Націсніце, каб змяніць"
              >
                <Clock className="h-3 w-3" />
                <span>{task.dueTime}</span>
              </button>
            ) : (
              /* Add Time shortcut if no time is set */
              <button
                type="button"
                onClick={() => setShowDateReschedule(true)}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-700 px-1.5 py-0.5 text-[11px] text-slate-400 hover:border-slate-500 hover:text-slate-200"
                title="Задаць дакладны час"
              >
                <Clock className="h-2.5 w-2.5" />
                <span>+ час</span>
              </button>
            )}

            {/* Recurrence Rule Tag */}
            {task.recurrenceRule && task.recurrenceRule !== 'none' && (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-300">
                <Repeat className="h-3 w-3 animate-spin-reverse" />
                <span>{RECURRENCE_LABELS[task.recurrenceRule]}</span>
              </span>
            )}
          </div>

          {/* Date & Time Reschedule Drawer / Menu */}
          {showDateReschedule && (
            <div className="mt-2.5 rounded-xl border border-slate-700 bg-slate-800/95 p-3 shadow-xl animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-700/60">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Дата і дакладны час
                </span>
                <button
                  type="button"
                  onClick={() => setShowDateReschedule(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Date Presets */}
              <div className="mb-3">
                <div className="text-[10px] text-slate-400 mb-1">Дата:</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetDueDate(todayStr, false)}
                    className={`rounded-lg px-2.5 py-1 text-xs border transition-colors ${
                      task.dueDate === todayStr && !task.isAnytime
                        ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    Сёння
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      handleSetDueDate(d.toISOString().split('T')[0], false);
                    }}
                    className="rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-2.5 py-1 text-xs"
                  >
                    Заўтра
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 2);
                      handleSetDueDate(d.toISOString().split('T')[0], false);
                    }}
                    className="rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 px-2.5 py-1 text-xs"
                  >
                    Паслязаўтра
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      handleSetDueDate(d.toISOString().split('T')[0], false);
                    }}
                    className="rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 text-xs"
                  >
                    Праз тыдзень
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDueDate(null, true)}
                    className={`rounded-lg px-2.5 py-1 text-xs border transition-colors ${
                      task.isAnytime
                        ? 'bg-amber-600 text-white border-amber-500 font-semibold'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    У любы час
                  </button>
                </div>

                {/* Exact Date Calendar Input */}
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[11px] text-slate-400">Дакладная дата:</span>
                  <input
                    type="date"
                    value={task.dueDate || ''}
                    onChange={(e) => handleSetDueDate(e.target.value || null, !e.target.value)}
                    className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Time Presets & Picker */}
              <div className="pt-2 border-t border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400">Дакладны час:</span>
                  {task.dueTime && (
                    <button
                      type="button"
                      onClick={() => handleSetDueTime(null)}
                      className="text-[10px] text-rose-400 hover:text-rose-300"
                    >
                      Сцерці час
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSetDueTime(p.label)}
                      className={`flex items-center justify-between rounded-lg px-2 py-1 text-xs border transition-colors ${
                        task.dueTime === p.label
                          ? 'bg-cyan-600 text-white border-cyan-500 font-semibold'
                          : 'bg-slate-700/50 hover:bg-slate-700 text-slate-200 border-slate-600'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[9px] opacity-70">{p.hint}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Time Input */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Індывідуальны:</span>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => {
                      setCustomTime(e.target.value);
                      handleSetDueTime(e.target.value || null);
                    }}
                    className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDateReschedule(false)}
                    className="ml-auto rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Гатова
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options Menu Button */}
        <div className="relative">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => {
              setMenuPosition(null);
              setShowMenu(!showMenu);
            }}
            aria-label="Дзеянні"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div
              ref={menuRef}
              className="fixed z-50 w-52 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl"
              style={{
                top: menuPosition?.top ?? 8,
                left: menuPosition?.left ?? 8,
                width: menuPosition?.width ?? 208,
                maxHeight: menuPosition?.maxHeight ?? 'calc(100dvh - 1rem)',
                visibility: menuPosition ? 'visible' : 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                Рэдагаваць назву
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDateReschedule(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
              >
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Задаць дату і час
              </button>

              {/* Recurrence Sub-menu */}
              <div className="my-1 border-t border-slate-800 pt-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400">
                  Правіла паўтору
                </div>
                {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceRule[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSetRecurrence(r)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-xs ${
                      task.recurrenceRule === r
                        ? 'bg-purple-500/20 text-purple-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{RECURRENCE_LABELS[r]}</span>
                    {task.recurrenceRule === r && <Check className="h-3 w-3 text-purple-400" />}
                  </button>
                ))}
              </div>

              {/* Change Group Sub-menu */}
              <div className="my-1 border-t border-slate-800 pt-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400">
                  Перамясціць у групу
                </div>
                <button
                  type="button"
                  onClick={() => handleChangeGroup(null)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-xs ${
                    !task.groupId
                      ? 'bg-slate-800 text-indigo-300 font-medium'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="italic">Без групы (асобная)</span>
                  {!task.groupId && <Check className="h-3 w-3 text-indigo-400" />}
                </button>
                {allGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleChangeGroup(g.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-xs ${
                      task.groupId === g.id
                        ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{g.title}</span>
                    {task.groupId === g.id && <Check className="h-3 w-3 text-indigo-400" />}
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-slate-800 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTask(task.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Выдаліць задачу
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
