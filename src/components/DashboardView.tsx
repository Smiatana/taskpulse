import React, { useState, useMemo } from 'react';
import {
  Sun,
  Calendar,
  CloudSun,
  Folder,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ChecklistGroup, TaskItem, DashboardTab } from '../types/models';
import { TaskCard } from './TaskCard';
import { GroupedChecklistsView } from './GroupedChecklistsView';

interface DashboardViewProps {
  groups: ChecklistGroup[];
  tasks: TaskItem[];
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateGroup: (group: Omit<ChecklistGroup, 'id' | 'createdAt'>) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenQuickAddForGroup: (groupId: string) => void;
}

const FILTER_LABELS: Record<'all' | 'pending' | 'completed', string> = {
  all: 'Усе',
  pending: 'Актыўныя',
  completed: 'Выкананыя',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  groups,
  tasks,
  activeTab,
  onTabChange,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onCreateGroup,
  onDeleteGroup,
  onOpenQuickAddForGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter tasks based on search and status
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const group = t.groupId ? groups.find((g) => g.id === t.groupId) : undefined;
        const matchesGroup = group ? group.title.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesGroup) return false;
      }
      // Status
      if (statusFilter === 'pending' && t.isCompleted) return false;
      if (statusFilter === 'completed' && !t.isCompleted) return false;
      return true;
    });
  }, [tasks, groups, searchQuery, statusFilter]);

  const sortTasksWithTime = (a: TaskItem, b: TaskItem) => {
    // Completed tasks go to the bottom
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    // Due date comparison
    if (a.dueDate !== b.dueDate) {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    // Due time comparison within same date
    if (a.dueTime && b.dueTime) {
      return a.dueTime.localeCompare(b.dueTime);
    }
    if (a.dueTime && !b.dueTime) return -1;
    if (!a.dueTime && b.dueTime) return 1;
    return a.sortOrder - b.sortOrder;
  };

  // Today Tab tasks: dueDate === todayStr OR overdue tasks, sorted by time
  const todayTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => {
        if (t.isAnytime || !t.dueDate) return false;
        return t.dueDate <= todayStr;
      })
      .sort(sortTasksWithTime);
  }, [filteredTasks, todayStr]);

  // Upcoming Tab tasks: dueDate > todayStr, sorted by date and time
  const upcomingTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => {
        if (t.isAnytime || !t.dueDate) return false;
        return t.dueDate > todayStr;
      })
      .sort(sortTasksWithTime);
  }, [filteredTasks, todayStr]);

  // Anytime Tab tasks: isAnytime === true or dueDate === null
  const anytimeTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.isAnytime || !t.dueDate);
  }, [filteredTasks]);

  // Compute Overall Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const todayPending = tasks.filter((t) => !t.isCompleted && t.dueDate === todayStr).length;

  const getGroupById = (groupId?: string | null) =>
    groupId ? groups.find((g) => g.id === groupId) : undefined;

  return (
    <div className="space-y-4 pb-28">
      {/* Flutter Material 3 Top Segmented Tab Bar */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => onTabChange('today')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 ${
            activeTab === 'today'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="h-4 w-4" />
          <span>Сёння</span>
          {todayPending > 0 && (
            <span
              className={`ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                activeTab === 'today' ? 'bg-indigo-900/80 text-indigo-200' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {todayPending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('upcoming')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 ${
            activeTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Хутка</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('anytime')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 ${
            activeTab === 'anytime'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudSun className="h-4 w-4" />
          <span>У любы час</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('groups')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 ${
            activeTab === 'groups'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="h-4 w-4" />
          <span>Групы</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      {activeTab !== 'groups' && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук задач ці груп..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-0.5 text-xs">
            {(['all', 'pending', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition-colors ${
                  statusFilter === filter
                    ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {FILTER_LABELS[filter]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: TODAY */}
      {activeTab === 'today' && (
        <div className="space-y-3 pb-20">
          {/* Header Card with Belarusian Date */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                  {new Date().toLocaleDateString('be-BY', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <h2 className="text-base font-bold text-white sm:text-lg">Фокус на сёння</h2>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {completedTasks} / {totalTasks} Выканана
                </span>
              </div>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
              <Sun className="mx-auto h-10 w-10 text-amber-500/60" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">На сёння ўсё выканана!</h3>
              <p className="mt-1 text-xs text-slate-500">
                Няма актыўных задач, прызначаных на сёння. Увядзіце задачу ніжэй альбо звярніцеся да ІІ.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  group={getGroupById(task.groupId)}
                  allGroups={groups}
                  onToggleComplete={onToggleComplete}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: UPCOMING */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3 pb-20">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-white">Каляндарны графік задач</h2>
            <span className="text-xs text-slate-400">{upcomingTasks.length} задач запланавана</span>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
              <Calendar className="mx-auto h-10 w-10 text-sky-500/60" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">Няма запланаваных задач</h3>
              <p className="mt-1 text-xs text-slate-500">
                Выкарыстоўвайце разумны радок (напрыклад "Купіць квіткі ў пятніцу #Адпачынак") для планавання наперад!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  group={getGroupById(task.groupId)}
                  allGroups={groups}
                  onToggleComplete={onToggleComplete}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: ANYTIME */}
      {activeTab === 'anytime' && (
        <div className="space-y-3 pb-20">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <div className="flex items-start gap-2.5">
              <CloudSun className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-amber-300">Задачы ў любы час (плывучыя)</h3>
                <p className="text-[11px] text-slate-400">
                  Гнуткія задачы без жорсткага дэдлайну. Націсніце на пазнаку даты на любой задачы, каб замацаваць яе на Сёння альбо пэўную дату.
                </p>
              </div>
            </div>
          </div>

          {anytimeTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
              <CloudSun className="mx-auto h-10 w-10 text-amber-500/40" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">Няма задач без даты</h3>
              <p className="mt-1 text-xs text-slate-500">
                Дадавайце гнуткія задачы праз ніжнюю панэль, пазначыўшы "у любы час".
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {anytimeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  group={getGroupById(task.groupId)}
                  allGroups={groups}
                  onToggleComplete={onToggleComplete}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: GROUPED CHECKLISTS */}
      {activeTab === 'groups' && (
        <GroupedChecklistsView
          groups={groups}
          tasks={tasks}
          onToggleComplete={onToggleComplete}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onCreateGroup={onCreateGroup}
          onDeleteGroup={onDeleteGroup}
          onOpenQuickAddForGroup={onOpenQuickAddForGroup}
        />
      )}
    </div>
  );
};
