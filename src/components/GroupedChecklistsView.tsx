import React, { useState } from 'react';
import {
  Folder,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { ChecklistGroup, TaskItem } from '../types/models';
import { TaskCard } from './TaskCard';

interface GroupedChecklistsViewProps {
  groups: ChecklistGroup[];
  tasks: TaskItem[];
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateGroup: (group: Omit<ChecklistGroup, 'id' | 'createdAt'>) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenQuickAddForGroup: (groupId: string) => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

export const GroupedChecklistsView: React.FC<GroupedChecklistsViewProps> = ({
  groups,
  tasks,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onCreateGroup,
  onDeleteGroup,
  onOpenQuickAddForGroup,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const toggleCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onCreateGroup({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      color: newColor,
    });

    setNewTitle('');
    setNewDesc('');
    setShowNewGroupModal(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white sm:text-lg">Групы чэк-лістаў</h2>
          <p className="text-xs text-slate-400">Кантэксты і праекты, размеркаваныя па розных днях</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewGroupModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Новая група</span>
          </button>
        </div>
      </div>

      {/* List of Groups */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
          <Folder className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-2 text-sm font-medium text-slate-300">Груп чэк-лістаў пакуль няма</h3>
          <p className="mt-1 text-xs text-slate-500">Стварыце праект або папрасіце ІІ згенераваць яго для вас.</p>
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white"
          >
            Стварыць першую групу чэк-лістаў
          </button>
        </div>
      ) : (
        groups.map((group) => {
          const groupTasks = tasks
            .filter((t) => t.groupId === group.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          const completedCount = groupTasks.filter((t) => t.isCompleted).length;
          const totalCount = groupTasks.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isCollapsed = collapsedGroups[group.id];

          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-sm transition-all hover:border-slate-700"
            >
              {/* Group Header Card */}
              <div
                className="flex cursor-pointer items-start justify-between p-4 transition-colors hover:bg-slate-800/40"
                onClick={() => toggleCollapse(group.id)}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: group.color || '#6366f1' }}
                  >
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                        {group.title}
                      </h3>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                    {group.description && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {group.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="h-1.5 w-32 sm:w-44 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: group.color || '#6366f1',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{percent}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Выдаліць групу чэк-лістаў "${group.title}" і яе задачы?`)) {
                        onDeleteGroup(group.id);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                    title="Выдаліць групу"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400">
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {/* Tasks Content */}
              {!isCollapsed && (
                <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 sm:p-4 space-y-2.5">
                  {/* Inline Timeline & Chronological Distribution Info */}
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-1">
                    <span className="font-medium text-slate-400">Задачы з індывідуальнымі прызначанымі днямі:</span>
                    <button
                      type="button"
                      onClick={() => onOpenQuickAddForGroup(group.id)}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Дадаць у {group.title}
                    </button>
                  </div>

                  {groupTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 py-6 text-center text-xs text-slate-500">
                      У гэтай групе пакуль няма задач. Выкарыстоўвайце ніжнюю панэль для дадання задач!
                    </div>
                  ) : (
                    groupTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        group={group}
                        allGroups={groups}
                        onToggleComplete={onToggleComplete}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Ungrouped Tasks section if any exist */}
      {(() => {
        const ungroupedTasks = tasks.filter((t) => !t.groupId);
        if (ungroupedTasks.length === 0) return null;
        const isCollapsed = collapsedGroups['ungrouped'];
        const completedCount = ungroupedTasks.filter((t) => t.isCompleted).length;

        return (
          <div className="overflow-hidden rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 shadow-sm transition-all">
            <div
              className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-800/40"
              onClick={() => toggleCollapse('ungrouped')}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                  <Folder className="h-5 w-5 opacity-60" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">Без групы (асобныя задачы)</h3>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                      {completedCount}/{ungroupedTasks.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Задачы, якія не прывязаныя ні да аднаго чэк-ліста</p>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center text-slate-400">
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </div>
            </div>

            {!isCollapsed && (
              <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 sm:p-4 space-y-2.5">
                {ungroupedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    group={undefined}
                    allGroups={groups}
                    onToggleComplete={onToggleComplete}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* New Group Modal Dialog */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Стварыць новую групу чэк-лістаў</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Бацькоўскі кантэйнер для шматдзённых задач і этапаў праекта.
            </p>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Назва чэк-ліста *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="напрыклад Уладкаванне кватэры, Падарожжа ў Токіа"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Апісанне (неабавязкова)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="напрыклад Задачы і тэрміны для ўладкавання"
                  rows={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Колер тэмы
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      aria-label="Выбраць колер"
                      className={`h-7 w-7 rounded-full transition-transform ${
                        newColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Адмена
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-40"
                >
                  Стварыць групу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
