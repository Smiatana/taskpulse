import { ChecklistGroup, TaskItem, RecurrenceRule } from '../types/models';

const STORAGE_KEY_GROUPS = 'taskpulse_flutter_groups_be_v2';
const STORAGE_KEY_TASKS = 'taskpulse_flutter_tasks_be_v2';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getFutureDateStr = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const INITIAL_GROUPS: ChecklistGroup[] = [
  {
    id: 'group-apt-setup',
    title: 'Уладкаванне кватэры',
    description: 'Пераезд у новую кватэру і падключэнне камунальных паслуг',
    createdAt: new Date().toISOString(),
    color: '#6366f1', // Indigo
    icon: 'home',
  },
  {
    id: 'group-daily-routine',
    title: 'Штодзённая руціна',
    description: 'Ранішнія рытуалы, прадукцыйнасць і карысныя звычкі',
    createdAt: new Date().toISOString(),
    color: '#10b981', // Emerald
    icon: 'sparkles',
  },
  {
    id: 'group-bank-account',
    title: 'Адкрыццё рахунку ў банку',
    description: 'Праверка дакументаў, візіт у аддзяленне і дэпазіт',
    createdAt: new Date().toISOString(),
    color: '#3b82f6', // Blue
    icon: 'landmark',
  },
];

const INITIAL_TASKS: TaskItem[] = [
  // Уладкаванне кватэры
  {
    id: 'task-apt-1',
    groupId: 'group-apt-setup',
    title: 'Забраць ключы ад кватэры і зафіксаваць паказчыкі лічыльнікаў',
    isCompleted: false,
    dueDate: getTodayStr(),
    isAnytime: false,
    recurrenceRule: 'none',
    sortOrder: 1,
  },
  {
    id: 'task-apt-2',
    groupId: 'group-apt-setup',
    title: 'Падключыць оптавалаконны інтэрнэт і Wi-Fi роўтэр',
    isCompleted: false,
    dueDate: getFutureDateStr(1),
    isAnytime: false,
    recurrenceRule: 'none',
    sortOrder: 2,
  },
  {
    id: 'task-apt-3',
    groupId: 'group-apt-setup',
    title: 'Сабраць працоўны стол і арганізаваць працоўнае месца',
    isCompleted: false,
    dueDate: getFutureDateStr(2),
    isAnytime: false,
    recurrenceRule: 'none',
    sortOrder: 3,
  },
  {
    id: 'task-apt-4',
    groupId: 'group-apt-setup',
    title: 'Купіць кухонны посуд, сродкі для мыцця і спецыі',
    isCompleted: false,
    dueDate: null,
    isAnytime: true,
    recurrenceRule: 'none',
    sortOrder: 4,
  },

  // Штодзённая руціна
  {
    id: 'task-routine-1',
    groupId: 'group-daily-routine',
    title: '30-хвілінная ранішняя прагулка на свежым паветры і размінка',
    isCompleted: true,
    dueDate: getTodayStr(),
    dueTime: '07:30',
    isAnytime: false,
    recurrenceRule: 'daily',
    sortOrder: 1,
    completedAt: new Date().toISOString(),
  },
  {
    id: 'task-routine-2',
    groupId: 'group-daily-routine',
    title: 'Прагляд ключавых прыярытэтаў на сёння і ачыстка пошты',
    isCompleted: false,
    dueDate: getTodayStr(),
    dueTime: '09:00',
    isAnytime: false,
    recurrenceRule: 'daily',
    sortOrder: 2,
  },
  {
    id: 'task-routine-3',
    groupId: 'group-daily-routine',
    title: 'Штотыднёвы аналіз асабістага бюджэту і выдаткаў',
    isCompleted: false,
    dueDate: getFutureDateStr(4),
    dueTime: '18:00',
    isAnytime: false,
    recurrenceRule: 'weekly',
    sortOrder: 3,
  },

  // Адкрыццё рахунку ў банку
  {
    id: 'task-bank-1',
    groupId: 'group-bank-account',
    title: 'Падрыхтаваць пашпарт і пацверджанне месца жыхарства',
    isCompleted: false,
    dueDate: getTodayStr(),
    dueTime: null,
    isAnytime: false,
    recurrenceRule: 'none',
    sortOrder: 1,
  },
  {
    id: 'task-bank-2',
    groupId: 'group-bank-account',
    title: 'Наведаць аддзяленне банку для падпісання дамовы',
    isCompleted: false,
    dueDate: getFutureDateStr(1),
    dueTime: '12:00',
    isAnytime: false,
    recurrenceRule: 'none',
    sortOrder: 2,
  },
  {
    id: 'task-bank-3',
    groupId: 'group-bank-account',
    title: 'Актываваць бескантактавую картку і наладзіць 2FA бяспеку',
    isCompleted: false,
    dueDate: null,
    isAnytime: true,
    recurrenceRule: 'none',
    sortOrder: 3,
  },
];

export const loadGroupsFromStorage = (): ChecklistGroup[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Не ўдалося прачытаць захаваныя групы', e);
  }
  localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(INITIAL_GROUPS));
  return INITIAL_GROUPS;
};

export const saveGroupsToStorage = (groups: ChecklistGroup[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
  } catch (e) {
    console.error('Не ўдалося захаваць групы', e);
  }
};

export const loadTasksFromStorage = (): TaskItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Не ўдалося прачытаць захаваныя задачы', e);
  }
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
  return INITIAL_TASKS;
};

export const saveTasksToStorage = (tasks: TaskItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Не ўдалося захаваць задачы', e);
  }
};

export const calculateNextDueDate = (currentDueDate: string | null, rule: RecurrenceRule): string => {
  const base = currentDueDate ? new Date(currentDueDate + 'T12:00:00') : new Date();
  if (rule === 'daily') {
    base.setDate(base.getDate() + 1);
  } else if (rule === 'weekly') {
    base.setDate(base.getDate() + 7);
  } else if (rule === 'monthly') {
    base.setMonth(base.getMonth() + 1);
  }
  return base.toISOString().split('T')[0];
};
