import { ChecklistGroup, RecurrenceRule, DashboardTab } from '../types/models';

export interface FastParseResult {
  title: string;
  matchedGroupId: string | null;
  suggestedGroupTitle: string | null;
  dueDate: string | null;
  dueTime: string | null;
  isAnytime: boolean;
  recurrenceRule: RecurrenceRule;
}

const DOW_MAP: Record<string, number> = {
  sunday: 0,
  нядзеля: 0,
  нядзелю: 0,
  monday: 1,
  панядзелак: 1,
  tuesday: 2,
  аўторак: 2,
  wednesday: 3,
  серада: 3,
  сераду: 3,
  thursday: 4,
  чацвер: 4,
  friday: 5,
  пятніца: 5,
  пятніцу: 5,
  saturday: 6,
  субота: 6,
  суботу: 6,
};

/**
 * High-speed synchronous NLP parser (< 1ms execution).
 * Supports English & Belarusian, explicit dates (15.11), times (7:00, а 9:00),
 * keywords (паслязаўтра, заўтра, сёння), and context-aware tab defaults.
 */
export function parseTaskFast(
  rawText: string,
  existingGroups: ChecklistGroup[],
  activeTab: DashboardTab = 'today',
  contextGroupId?: string | null
): FastParseResult {
  const now = new Date();
  let cleaned = rawText.trim();

  let matchedGroupId: string | null = null;
  let suggestedGroupTitle: string | null = null;
  let recurrenceRule: RecurrenceRule = 'none';
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let isAnytime = false;
  let explicitDateFound = false;

  // 1. Time parsing (e.g., "а 7:00", "at 7:00", "7:00", "12:00", "14:30", "at 9am")
  const time24Match = cleaned.match(/(?:(?:at|on|а|у|ў|о|в)\s+)?(\b\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
  if (time24Match) {
    let hours = parseInt(time24Match[1], 10);
    const mins = time24Match[2];
    const ampm = time24Match[3]?.toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    dueTime = `${String(hours).padStart(2, '0')}:${mins}`;
    cleaned = cleaned.replace(time24Match[0], ' ').trim();
  } else {
    const timeHourOnlyMatch = cleaned.match(/(?:at|а|у|ў|о|в)\s*(\d{1,2})\s*(am|pm|раніцы|дня|вечара|\b)/i);
    if (timeHourOnlyMatch && timeHourOnlyMatch[1]) {
      let hours = parseInt(timeHourOnlyMatch[1], 10);
      const modifier = timeHourOnlyMatch[2]?.toLowerCase() || '';
      if ((modifier === 'pm' || modifier.includes('вечар') || modifier.includes('дня')) && hours < 12) {
        hours += 12;
      }
      if (hours >= 0 && hours <= 23) {
        dueTime = `${String(hours).padStart(2, '0')}:00`;
        cleaned = cleaned.replace(timeHourOnlyMatch[0], ' ').trim();
      }
    }
  }

  // 2. Recurrence detection (English + Belarusian, Cyrillic-safe)
  if (/(?:^|\s)(every\s*day|daily|штодзень|штодня)(?:\s|$)/i.test(cleaned)) {
    recurrenceRule = 'daily';
    cleaned = cleaned.replace(/(?:^|\s)(every\s*day|daily|штодзень|штодня)(?:\s|$)/gi, ' ').trim();
  } else if (/(?:^|\s)(every\s*week|weekly|штотыдзень|штотыдня)(?:\s|$)/i.test(cleaned)) {
    recurrenceRule = 'weekly';
    cleaned = cleaned.replace(/(?:^|\s)(every\s*week|weekly|штотыдзень|штотыдня)(?:\s|$)/gi, ' ').trim();
  } else if (/(?:^|\s)(every\s*month|monthly|штомесяц|штомесяца)(?:\s|$)/i.test(cleaned)) {
    recurrenceRule = 'monthly';
    cleaned = cleaned.replace(/(?:^|\s)(every\s*month|monthly|штомесяц|штомесяца)(?:\s|$)/gi, ' ').trim();
  }

  // 3. Day of week detection (e.g. "every wednesday", "кожную сераду", "у пятніцу", "on friday")
  const dowRegex = /(?:(every|кожны|кожную|па|у|ў|on)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|панядзелак|аўторак|серада|сераду|чацвер|пятніца|пятніцу|субота|суботу|нядзеля|нядзелю)(?:\s|$|[.,!])/i;
  const dowMatch = cleaned.match(dowRegex);
  if (dowMatch) {
    const prefix = dowMatch[1]?.toLowerCase() || '';
    const dowWord = dowMatch[2]?.toLowerCase();
    const targetDay = DOW_MAP[dowWord];
    if (targetDay !== undefined) {
      if (['every', 'кожны', 'кожную', 'па'].includes(prefix)) {
        recurrenceRule = 'weekly';
      }
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      dueDate = d.toISOString().split('T')[0];
      explicitDateFound = true;
      cleaned = cleaned.replace(dowMatch[0], ' ').trim();
    }
  }

  // 4. Exact calendar numeric date like 15.11, 15/11, on 15.11
  const dateNumMatch = cleaned.match(/(?:(?:on|на|да|of)\s+)?(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/i);
  if (dateNumMatch && !explicitDateFound) {
    const day = parseInt(dateNumMatch[1], 10);
    const month = parseInt(dateNumMatch[2], 10);
    const year = dateNumMatch[3] ? parseInt(dateNumMatch[3], 10) : now.getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    dueDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    explicitDateFound = true;
    cleaned = cleaned.replace(dateNumMatch[0], ' ').trim();
  }

  // 5. Fast Date keywords: "паслязаўтра" (+2 days), "заўтра" (+1 day), "сёння", "у любы час"
  if (!explicitDateFound) {
    // Check "паслязаўтра" / "day after tomorrow" FIRST
    if (/(?:^|\s)(паслязаўтра|пасля\s*заўтра|day\s*after\s*tomorrow)(?:\s|$)/i.test(cleaned)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 2);
      dueDate = d.toISOString().split('T')[0];
      explicitDateFound = true;
      cleaned = cleaned.replace(/(?:^|\s)(паслязаўтра|пасля\s*заўтра|day\s*after\s*tomorrow)(?:\s|$)/gi, ' ').trim();
    } else if (/(?:^|\s)(заўтра|tomorrow)(?:\s|$)/i.test(cleaned)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      dueDate = d.toISOString().split('T')[0];
      explicitDateFound = true;
      cleaned = cleaned.replace(/(?:^|\s)(заўтра|tomorrow)(?:\s|$)/gi, ' ').trim();
    } else if (/(?:^|\s)(сёння|today)(?:\s|$)/i.test(cleaned)) {
      dueDate = now.toISOString().split('T')[0];
      explicitDateFound = true;
      cleaned = cleaned.replace(/(?:^|\s)(сёння|today)(?:\s|$)/gi, ' ').trim();
    } else if (/(?:^|\s)(anytime|someday|floating|no date|у любы час|любы час|без даты)(?:\s|$)/i.test(cleaned)) {
      isAnytime = true;
      dueDate = null;
      explicitDateFound = true;
      cleaned = cleaned.replace(/(?:^|\s)(anytime|someday|floating|no date|у любы час|любы час|без даты)(?:\s|$)/gi, ' ').trim();
    } else if (/(?:^|\s)(?:in\s*(\d+)|праз\s*(\d+))\s*(?:days?|дн\w*)(?:\s|$)/i.test(cleaned)) {
      const match = cleaned.match(/(?:in\s*(\d+)|праз\s*(\d+))/i);
      if (match) {
        const days = parseInt(match[1] || match[2], 10);
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        dueDate = d.toISOString().split('T')[0];
        explicitDateFound = true;
        cleaned = cleaned.replace(/(?:^|\s)(?:in\s*\d+|праз\s*\d+)\s*(?:days?|дн\w*)(?:\s|$)/gi, ' ').trim();
      }
    }
  }

  // 6. Context-aware tab defaulting if no explicit date was found in the text:
  if (!explicitDateFound) {
    if (activeTab === 'anytime') {
      isAnytime = true;
      dueDate = null;
    } else if (activeTab === 'upcoming') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      dueDate = d.toISOString().split('T')[0]; // Default to tomorrow in upcoming
      isAnytime = false;
    } else {
      dueDate = now.toISOString().split('T')[0]; // Default to today in 'today' or 'groups'
      isAnytime = false;
    }
  }

  // 7. Group matching: UNGROUPED BY DEFAULT!
  // Only assign to a group if user explicitly typed #Tag or contextGroupId was passed
  const tagMatch = cleaned.match(/#([a-zA-Zа-яА-ЯёЁ0-9_-]+)/);
  if (tagMatch) {
    const rawTag = tagMatch[1].trim().toLowerCase();
    const found = existingGroups.find((g) => g.title.toLowerCase() === rawTag);
    if (found) {
      matchedGroupId = found.id;
    } else {
      suggestedGroupTitle = tagMatch[1].trim();
    }
    cleaned = cleaned.replace(tagMatch[0], ' ').trim();
  } else if (contextGroupId) {
    matchedGroupId = contextGroupId;
  } else {
    // Check if user explicitly wrote "ў {Group}" or "для {Group}"
    for (const group of existingGroups) {
      const escaped = group.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const explicitGroupRegex = new RegExp(`(?:для|ў|у|for|in)\\s+${escaped}(?:\\s|$|[.,!])`, 'i');
      if (explicitGroupRegex.test(cleaned)) {
        matchedGroupId = group.id;
        cleaned = cleaned.replace(explicitGroupRegex, ' ').trim();
        break;
      }
    }
    // Otherwise matchedGroupId remains null! (Ungrouped by default)
  }

  // Clean trailing punctuation or prepositions
  cleaned = cleaned.replace(/^(to|do|please|must|зрабіць|трэба|калі ласка)\s+/i, '');
  cleaned = cleaned.replace(/\s+(on|at|by|for|на|у|ў|да|а)$/i, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return {
    title: cleaned || rawText.trim(),
    matchedGroupId,
    suggestedGroupTitle,
    dueDate: isAnytime ? null : dueDate,
    dueTime,
    isAnytime,
    recurrenceRule,
  };
}
