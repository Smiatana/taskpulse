import React, { useState, useEffect, useRef } from 'react';
import {
  BellRing,
  Mic,
  MicOff,
  Send,
  Calendar,
  Folder,
  Repeat,
  CloudSun,
  Clock,
} from 'lucide-react';
import { ChecklistGroup, TaskItem, RecurrenceRule, DashboardTab } from '../types/models';
import { parseTaskFast } from '../services/fastParser';

interface QuickAddBarProps {
  groups: ChecklistGroup[];
  activeGroupId?: string | null;
  activeTab?: DashboardTab;
  onAddTask: (task: Omit<TaskItem, 'id' | 'sortOrder'>, newGroupTitle?: string | null) => void;
  onOpenNotifications: () => void;
}

const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  none: 'Без паўтору',
  daily: 'Штодзень',
  weekly: 'Штотыдзень',
  monthly: 'Штомесяц',
};

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  groups,
  activeGroupId,
  activeTab = 'today',
  onAddTask,
  onOpenNotifications,
}) => {
  const [text, setText] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [detectedPreview, setDetectedPreview] = useState<{
    dateLabel: string | null;
    timeLabel: string | null;
    groupTitle: string | null;
    recurrence: RecurrenceRule;
    isAnytime: boolean;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'be-BY';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Распазнаванне маўлення не падтрымліваецца ў гэтым браўзеры. Калі ласка, увядзіце задачу тэкстам.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Live heuristics in Belarusian & English as user types
  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed && !selectedTime && !selectedDate) {
      setDetectedPreview(null);
      return;
    }

    let dateLabel: string | null = null;
    let timeLabel: string | null = selectedTime || null;
    let isAnytime = false;
    let recurrence: RecurrenceRule = 'none';
    let groupTitle: string | null = null;

    if (selectedDate) {
      if (selectedDate === 'anytime') {
        isAnytime = true;
        dateLabel = 'У любы час';
      } else {
        const d = new Date(selectedDate + 'T12:00:00');
        dateLabel = d.toLocaleDateString('be-BY', { month: 'short', day: 'numeric' });
      }
    }

    // Recurrence
    if (/(?:^|\s)(every\s*day|daily|штодзень|штодня)(?:\s|$)/i.test(trimmed)) recurrence = 'daily';
    else if (/(?:^|\s)(every\s*week|weekly|штотыдзень|штотыдня)(?:\s|$)/i.test(trimmed)) recurrence = 'weekly';
    else if (/(?:^|\s)(every\s*month|monthly|штомесяц|штомесяца)(?:\s|$)/i.test(trimmed)) recurrence = 'monthly';

    // Time detection in text if not explicitly set
    if (!timeLabel) {
      const timeMatch = trimmed.match(/(?:(?:at|on|а|у|ў|о|в)\s+)?(\b\d{1,2}):(\d{2})/i);
      if (timeMatch) {
        const h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2];
        timeLabel = `${String(h).padStart(2, '0')}:${m}`;
      } else {
        const timeOnlyHour = trimmed.match(/(?:at|а|у|ў|о|в)\s*(\d{1,2})(?:\s*гадзін[аые]|\s*г)?\b/i);
        if (timeOnlyHour && timeOnlyHour[1]) {
          const h = parseInt(timeOnlyHour[1], 10);
          if (h >= 0 && h <= 23) {
            timeLabel = `${String(h).padStart(2, '0')}:00`;
          }
        }
      }
    }

    // Days of week and keywords if date not manually picked
    if (!selectedDate) {
      if (/(?:^|\s)(паслязаўтра|пасля\s*заўтра|day\s*after\s*tomorrow)(?:\s|$)/i.test(trimmed)) {
        dateLabel = 'Паслязаўтра (+2 дн.)';
      } else if (/(?:^|\s)(tomorrow|заўтра)(?:\s|$)/i.test(trimmed)) {
        dateLabel = 'Заўтра';
      } else if (/(?:^|\s)(today|сёння)(?:\s|$)/i.test(trimmed)) {
        dateLabel = 'Сёння';
      } else if (/(?:^|\s)(anytime|someday|у любы час|любы час)(?:\s|$)/i.test(trimmed)) {
        isAnytime = true;
        dateLabel = 'У любы час';
      } else if (/(?:every|кожны|кожную|па|у|ў|on)\s+(панядзелак|аўторак|серада|сераду|чацвер|пятніца|пятніцу|субота|суботу|нядзеля|нядзелю|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(trimmed)) {
        recurrence = 'weekly';
        const m = trimmed.match(/(панядзелак|аўторак|серада|сераду|чацвер|пятніца|пятніцу|субота|суботу|нядзеля|нядзелю|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
        if (m) dateLabel = m[0];
      } else if (/(\d{1,2})[./](\d{1,2})/i.test(trimmed)) {
        const dateNum = trimmed.match(/(\d{1,2})[./](\d{1,2})/);
        if (dateNum) dateLabel = `${dateNum[1]}.${dateNum[2]}`;
      } else if (/(?:in\s*(\d+)|праз\s*(\d+))/i.test(trimmed)) {
        const match = trimmed.match(/(?:in\s*(\d+)|праз\s*(\d+))/i);
        if (match) {
          const count = match[1] || match[2];
          dateLabel = `Праз ${count} дн.`;
        }
      } else if (activeTab === 'anytime') {
        isAnytime = true;
        dateLabel = 'У любы час';
      }
    }

    const tagMatch = trimmed.match(/#([a-zA-Zа-яА-ЯёЁ0-9_\s-]+)/);
    if (tagMatch) {
      groupTitle = tagMatch[1].trim();
    } else if (activeGroupId) {
      const active = groups.find((g) => g.id === activeGroupId);
      if (active) groupTitle = active.title;
    }

    setDetectedPreview({
      dateLabel,
      timeLabel,
      groupTitle,
      recurrence,
      isAnytime,
    });
  }, [text, selectedTime, selectedDate, activeGroupId, groups, activeTab]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = text.trim();
    if (!query) return;

    // Instant synchronous client-side parsing (< 1ms, zero latency!)
    const result = parseTaskFast(query, groups, activeTab, activeGroupId);

    // Apply manual overrides if set
    let finalDueDate = result.dueDate;
    let finalIsAnytime = result.isAnytime;

    if (selectedDate === 'anytime') {
      finalIsAnytime = true;
      finalDueDate = null;
    } else if (selectedDate) {
      finalDueDate = selectedDate;
      finalIsAnytime = false;
    }

    const finalDueTime = selectedTime || result.dueTime || null;

    onAddTask(
      {
        groupId: result.matchedGroupId || null,
        title: result.title || query,
        isCompleted: false,
        dueDate: finalIsAnytime ? null : finalDueDate,
        dueTime: finalDueTime,
        isAnytime: finalIsAnytime,
        recurrenceRule: result.recurrenceRule || 'none',
      },
      result.suggestedGroupTitle
    );

    setText('');
    setSelectedTime('');
    setSelectedDate('');
    setShowTimePicker(false);
    setShowDatePicker(false);
    setDetectedPreview(null);
  };

  const insertTag = (groupTitle: string) => {
    setText((prev) => {
      const clean = prev.replace(/#\S+/g, '').trim();
      return `${clean} #${groupTitle} `.trimStart();
    });
    inputRef.current?.focus();
  };

  const handleShortcutDate = (type: 'tomorrow' | 'afterTomorrow' | 'anytime') => {
    const now = new Date();
    if (type === 'tomorrow') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (type === 'afterTomorrow') {
      const d = new Date(now);
      d.setDate(d.getDate() + 2);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (type === 'anytime') {
      setSelectedDate('anytime');
    }
  };

  return (
    <div
      className="relative border-t border-slate-800/80 bg-slate-950/95 px-3 py-2.5 backdrop-blur-md sm:px-4"
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
    >
      {/* Detected NLP Chips Preview */}
      {detectedPreview && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] animate-in fade-in slide-in-from-bottom-1">
          <span className="font-medium text-slate-400">Выяўлена:</span>
          {detectedPreview.groupTitle && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-indigo-300">
              <Folder className="h-3 w-3" />
              {detectedPreview.groupTitle}
            </span>
          )}
          {detectedPreview.dateLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-emerald-300">
              <Calendar className="h-3 w-3" />
              {detectedPreview.dateLabel}
            </span>
          )}
          {detectedPreview.timeLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 px-2 py-0.5 text-cyan-300 font-semibold">
              <Clock className="h-3 w-3" />
              {detectedPreview.timeLabel}
            </span>
          )}
          {detectedPreview.isAnytime && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-300">
              <CloudSun className="h-3 w-3" />
              У любы час
            </span>
          )}
          {detectedPreview.recurrence !== 'none' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-purple-300">
              <Repeat className="h-3 w-3" />
              {RECURRENCE_LABELS[detectedPreview.recurrence]}
            </span>
          )}
        </div>
      )}

      {/* Main Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Phone Notifications / Alarms Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          title="Налады тэлефонных апавяшчэнняў і сігналаў"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-indigo-300 hover:border-indigo-500 hover:bg-slate-700/80 shadow-md transition-all active:scale-95"
        >
          <BellRing className="h-4 w-4 text-indigo-400" />
        </button>

        {/* NLP Text Field */}
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="напрыклад 'Прыняць таблеткі а 7:00 штодзень' альбо 'паслязаўтра а 12:00'"
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-3.5 pr-20 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* Quick Date Picker Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowTimePicker(false);
            }}
            className={`absolute right-14 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              selectedDate
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={selectedDate ? `Абраная дата: ${selectedDate}` : 'Выбраць дату або хуткія тэрміны'}
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>

          {/* Quick Time Picker Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowTimePicker(!showTimePicker);
              setShowDatePicker(false);
            }}
            className={`absolute right-8 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              selectedTime
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={selectedTime ? `Абраны час: ${selectedTime}` : 'Задаць дакладны час'}
          >
            <Clock className="h-3.5 w-3.5" />
          </button>

          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleSpeech}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isListening ? 'Слухаю... націсніце для прыпынку' : 'Галасавы ўвод'}
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!text.trim()}
          title="Дадаць задачу імгненна"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Quick Date Options Dropdown */}
      {showDatePicker && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-lg text-xs animate-in fade-in">
          <span className="text-slate-400 text-[11px] mr-1">Хуткая дата:</span>
          <button
            type="button"
            onClick={() => {
              handleShortcutDate('tomorrow');
              setShowDatePicker(false);
            }}
            className="rounded-lg px-2.5 py-1 border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 text-xs font-medium"
          >
            Заўтра
          </button>
          <button
            type="button"
            onClick={() => {
              handleShortcutDate('afterTomorrow');
              setShowDatePicker(false);
            }}
            className="rounded-lg px-2.5 py-1 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium"
          >
            Паслязаўтра
          </button>
          <button
            type="button"
            onClick={() => {
              handleShortcutDate('anytime');
              setShowDatePicker(false);
            }}
            className="rounded-lg px-2.5 py-1 border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-medium"
          >
            У любы час
          </button>
          <input
            type="date"
            value={selectedDate === 'anytime' ? '' : selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setShowDatePicker(false);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-white"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-rose-400 hover:text-rose-300 text-[11px] ml-1"
            >
              Сцерці
            </button>
          )}
        </div>
      )}

      {/* Quick Time Dropdown */}
      {showTimePicker && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-lg text-xs animate-in fade-in">
          <span className="text-slate-400 text-[11px] mr-1">Хуткі выбар часу:</span>
          {['07:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => {
                setSelectedTime(time);
                setShowTimePicker(false);
              }}
              className={`rounded-lg px-2 py-0.5 border text-xs transition-colors ${
                selectedTime === time
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              {time}
            </button>
          ))}
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-white"
          />
          {selectedTime && (
            <button
              type="button"
              onClick={() => setSelectedTime('')}
              className="text-rose-400 hover:text-rose-300 text-[11px] ml-1"
            >
              Сцерці
            </button>
          )}
        </div>
      )}

      {/* Fast Shortcuts row */}
      {text.length === 0 && !showTimePicker && !showDatePicker && (
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px] text-slate-400">
          <span className="shrink-0 text-slate-400">Хуткія:</span>
          <button
            type="button"
            onClick={() => setText((prev) => (prev ? `${prev} заўтра` : 'заўтра '))}
            className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-sky-300 hover:border-sky-700 hover:text-white"
          >
            заўтра
          </button>
          <button
            type="button"
            onClick={() => setText((prev) => (prev ? `${prev} паслязаўтра` : 'паслязаўтра '))}
            className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-indigo-300 hover:border-indigo-700 hover:text-white"
          >
            паслязаўтра
          </button>
          <button
            type="button"
            onClick={() => setText((prev) => (prev ? `${prev} а 12:00` : 'а 12:00 '))}
            className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-cyan-300 hover:border-cyan-700 hover:text-white"
          >
            а 12:00
          </button>
          <button
            type="button"
            onClick={() => setText((prev) => (prev ? `${prev} у любы час` : 'у любы час '))}
            className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-amber-300 hover:border-amber-700 hover:text-white"
          >
            у любы час
          </button>
          {groups.slice(0, 2).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => insertTag(g.title)}
              className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300 hover:border-slate-700 hover:text-white"
            >
              #{g.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
