import { DailyActivityRecord, Task } from '../types/productivity';

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  return formatISODate(new Date());
}

export function getOffsetDateISO(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatISODate(d);
}

export function formatHumanDate(isoDate: string): string {
  const today = getTodayISO();
  const tomorrow = getOffsetDateISO(1);
  const yesterday = getOffsetDateISO(-1);

  if (isoDate === today) return 'Today';
  if (isoDate === tomorrow) return 'Tomorrow';
  if (isoDate === yesterday) return 'Yesterday';

  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullTooltipDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generates a realistic, deterministic 182-day (26-week) daily task completion history.
 * Creates an active streak leading up to today so the heatmap and KPI cards render rich data immediately.
 */
export function generateSeedHistory(): Record<string, DailyActivityRecord> {
  const records: Record<string, DailyActivityRecord> = {};
  const today = new Date();
  const totalDays = 182; // 26 full weeks

  for (let i = totalDays - 1; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = formatISODate(d);
    const dayOfWeek = d.getDay(); // 0 Sun .. 6 Sat

    // Deterministic pseudo-random wave based on day index
    const seed = (i * 37 + dayOfWeek * 13) % 100;
    const isRecentStreak = i <= 14; // Guarantee a 14+ day streak leading up to today

    let planned = dayOfWeek === 0 || dayOfWeek === 6 ? 5 : 7;
    if (seed > 75) planned += 2;
    if (seed < 20) planned = Math.max(4, planned - 1);

    let completed = 0;
    if (isRecentStreak) {
      // High consistency in recent 14 days (3 to 8 tasks completed per day)
      completed = Math.min(planned, Math.max(3, Math.round((planned * (68 + (seed % 32))) / 100)));
    } else if (seed < 12 && dayOfWeek === 0) {
      // Occasional rest Sunday in earlier months
      completed = 0;
    } else if (seed < 28) {
      completed = Math.min(planned, 2 + (seed % 2));
    } else if (seed < 65) {
      completed = Math.min(planned, 4 + (seed % 3));
    } else {
      completed = planned;
    }

    records[iso] = {
      date: iso,
      completedCount: completed,
      plannedCount: planned,
    };
  }

  return records;
}

export function generateSeedTasks(): Task[] {
  const today = getTodayISO();
  const tomorrow = getOffsetDateISO(1);
  const inTwoDays = getOffsetDateISO(2);

  return [
    {
      id: 'task-101',
      title: 'Finalize Q4 product architecture specification & performance benchmarks',
      category: 'Work',
      priority: 'High',
      dueDate: today,
      completed: true,
      completedAt: new Date().toISOString(),
      order: 0,
    },
    {
      id: 'task-102',
      title: '45-minute Zone 2 endurance run & mobility routine',
      category: 'Health',
      priority: 'High',
      dueDate: today,
      completed: true,
      completedAt: new Date().toISOString(),
      order: 1,
    },
    {
      id: 'task-103',
      title: 'Review design system token contrast ratios for dark mode cards',
      category: 'Work',
      priority: 'High',
      dueDate: today,
      completed: false,
      order: 2,
    },
    {
      id: 'task-104',
      title: 'Prepare sprint retrospective metrics and team velocity breakdown',
      category: 'Work',
      priority: 'Medium',
      dueDate: today,
      completed: false,
      order: 3,
    },
    {
      id: 'task-105',
      title: 'Meal prep high-protein lunches and hydration electrolytes',
      category: 'Health',
      priority: 'Medium',
      dueDate: today,
      completed: true,
      completedAt: new Date().toISOString(),
      order: 4,
    },
    {
      id: 'task-106',
      title: 'Reconcile monthly investment portfolio & automate savings transfer',
      category: 'Personal',
      priority: 'Medium',
      dueDate: today,
      completed: false,
      order: 5,
    },
    {
      id: 'task-107',
      title: 'Read 25 pages of Designing Data-Intensive Applications before bed',
      category: 'Personal',
      priority: 'Low',
      dueDate: today,
      completed: false,
      order: 6,
    },
    {
      id: 'task-108',
      title: 'Audit API latency telemetry and configure edge caching rules',
      category: 'Work',
      priority: 'High',
      dueDate: tomorrow,
      completed: false,
      order: 7,
    },
    {
      id: 'task-109',
      title: 'Schedule annual dental checkup and blood panel lab work',
      category: 'Health',
      priority: 'Medium',
      dueDate: tomorrow,
      completed: false,
      order: 8,
    },
    {
      id: 'task-110',
      title: 'Organize home workspace cable routing and backup NAS drives',
      category: 'Personal',
      priority: 'Low',
      dueDate: inTwoDays,
      completed: true,
      completedAt: new Date().toISOString(),
      order: 9,
    },
  ];
}
