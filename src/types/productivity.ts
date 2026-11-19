export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskCategory = 'Work' | 'Personal' | 'Health';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  order: number;
  notes?: string;
}

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  completedCount: number;
  plannedCount: number;
}

export type StatusFilter = 'All' | 'Active' | 'Completed';
export type CategoryFilter = 'All' | TaskCategory;
export type SortMode = 'manual' | 'priority' | 'dueDate';

export interface WeeklyDayStat {
  dayLabel: string; // Mon, Tue, Wed...
  fullDate: string; // YYYY-MM-DD
  formattedDate: string; // e.g., Nov 18
  planned: number;
  completed: number;
  isToday: boolean;
}

export interface CategoryStat {
  category: TaskCategory;
  total: number;
  completed: number;
  percentage: number;
  color: string;
  strokeColor: string;
}
