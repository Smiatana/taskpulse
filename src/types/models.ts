export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly';

export interface ChecklistGroup {
  id: string; // Primary Key / UUID
  title: string;
  description?: string;
  createdAt: string; // ISO string
  color?: string;
  icon?: string;
}

export interface TaskItem {
  id: string; // Primary Key / UUID
  groupId?: string | null; // Foreign Key linking to ChecklistGroup, null if ungrouped
  title: string;
  isCompleted: boolean;
  dueDate: string | null; // ISO YYYY-MM-DD string, null if "Anytime"
  dueTime?: string | null; // HH:MM string in 24h format, e.g. "07:00", "12:00"
  isAnytime: boolean;
  recurrenceRule: RecurrenceRule;
  sortOrder: number;
  completedAt?: string | null;
}

export type DashboardTab = 'today' | 'upcoming' | 'anytime' | 'groups';

export interface NLPParseResult {
  title: string;
  matchedGroupId: string | null;
  suggestedGroupTitle: string | null;
  dueDate: string | null;
  dueTime: string | null; // e.g. "07:00"
  isAnytime: boolean;
  recurrenceRule: RecurrenceRule;
}

export interface GeneratedChecklistTask {
  title: string;
  dueDate: string | null;
  dueTime?: string | null;
  isAnytime: boolean;
  recurrenceRule: RecurrenceRule;
  sortOrder: number;
  selected?: boolean;
}

export interface GeneratedChecklist {
  groupTitle: string;
  groupDescription: string;
  tasks: GeneratedChecklistTask[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  previewChecklist?: GeneratedChecklist | null;
}
