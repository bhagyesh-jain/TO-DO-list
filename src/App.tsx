import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, RotateCcw } from 'lucide-react';
import {
  CategoryFilter,
  CategoryStat,
  DailyActivityRecord,
  SortMode,
  StatusFilter,
  Task,
  TaskCategory,
  TaskPriority,
  WeeklyDayStat,
} from './types/productivity';
import {
  formatISODate,
  generateSeedHistory,
  generateSeedTasks,
  getOffsetDateISO,
  getTodayISO,
} from './data/seedData';
import { TodaysFocusCard } from './components/TodaysFocusCard';
import { TaskComposer } from './components/TaskComposer';
import { TaskListSection } from './components/TaskListSection';
import { KeyMetricCards } from './components/KeyMetricCards';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { AnalyticsCharts } from './components/AnalyticsCharts';

const STORAGE_KEY_TASKS = 'flowstate_tasks_v1';
const STORAGE_KEY_HISTORY = 'flowstate_history_v1';

type WorkspaceMode = 'unified' | 'tasks' | 'analytics';

export default function App() {
  const composerInputRef = useRef<HTMLInputElement | null>(null);

  // Persistent Tasks State
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed data
    }
    return generateSeedTasks();
  });

  // Persistent 6-Month Historical Activity State
  const [history, setHistory] = useState<Record<string, DailyActivityRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 30) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed history
    }
    return generateSeedHistory();
  });

  // UI Filter & View State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('unified');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch {
      // Ignore storage quota errors
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  // Auto-clear toast feedback
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const todayISO = getTodayISO();

  // Today's tasks calculation
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate <= todayISO),
    [tasks, todayISO]
  );

  const todayCompletedCount = useMemo(
    () => tasks.filter((t) => t.completed && t.dueDate <= todayISO).length,
    [tasks, todayISO]
  );

  const todayPlannedCount = useMemo(
    () => Math.max(todayTasks.length, todayCompletedCount, 1),
    [todayTasks.length, todayCompletedCount]
  );

  // Compute Current Streak, Completion Rate %, and Total Tasks Done across 6 months + Today
  const {
    currentStreak,
    completionRate,
    totalTasksDone,
    sixMonthPlannedTotal,
  } = useMemo(() => {
    let completedSum = todayCompletedCount;
    let plannedSum = todayPlannedCount;

    Object.entries(history).forEach(([dateStr, rec]) => {
      if (dateStr < todayISO) {
        completedSum += rec.completedCount;
        plannedSum += Math.max(rec.plannedCount, rec.completedCount);
      }
    });

    const rate = plannedSum > 0 ? Math.min(100, Math.round((completedSum / plannedSum) * 100)) : 0;

    // Calculate consecutive days streak ending today (or yesterday if today is 0 so far)
    let streak = todayCompletedCount > 0 ? 1 : 0;
    const todayDate = new Date();
    for (let i = 1; i <= 180; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const iso = formatISODate(d);
      const count = history[iso]?.completedCount ?? 0;
      if (count > 0) {
        streak++;
      } else {
        break;
      }
    }

    return {
      currentStreak: streak,
      completionRate: rate,
      totalTasksDone: completedSum,
      sixMonthPlannedTotal: plannedSum,
    };
  }, [history, todayCompletedCount, todayPlannedCount, todayISO]);

  // Compute Weekly Completion Bar Chart data (Last 7 days ending Today)
  const weeklyData: WeeklyDayStat[] = useMemo(() => {
    const days: WeeklyDayStat[] = [];
    for (let offset = -6; offset <= 0; offset++) {
      const iso = getOffsetDateISO(offset);
      const [y, m, d] = iso.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const isToday = offset === 0;

      if (isToday) {
        days.push({
          dayLabel,
          fullDate: iso,
          formattedDate,
          planned: todayPlannedCount,
          completed: todayCompletedCount,
          isToday: true,
        });
      } else {
        const record = history[iso];
        const completed = record?.completedCount ?? 4;
        const planned = Math.max(record?.plannedCount ?? 6, completed);
        days.push({
          dayLabel,
          fullDate: iso,
          formattedDate,
          planned,
          completed,
          isToday: false,
        });
      }
    }
    return days;
  }, [history, todayCompletedCount, todayPlannedCount]);

  // Compute Category Breakdown Donut Chart data
  const categoryStats: CategoryStat[] = useMemo(() => {
    const categories: {
      cat: TaskCategory;
      color: string;
      strokeColor: string;
    }[] = [
      { cat: 'Work', color: 'text-indigo-400', strokeColor: '#6366f1' },
      { cat: 'Personal', color: 'text-violet-400', strokeColor: '#a855f7' },
      { cat: 'Health', color: 'text-emerald-400', strokeColor: '#10b981' },
    ];

    const totalAll = tasks.length;
    return categories.map(({ cat, color, strokeColor }) => {
      const catTasks = tasks.filter((t) => t.category === cat);
      const total = catTasks.length;
      const completed = catTasks.filter((t) => t.completed).length;
      const percentage = totalAll > 0 ? Math.round((total / totalAll) * 100) : 0;
      return {
        category: cat,
        total,
        completed,
        percentage,
        color,
        strokeColor,
      };
    });
  }, [tasks]);

  // Handlers
  const handleAddTask = (newTaskInput: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskInput.title,
      category: newTaskInput.category,
      priority: newTaskInput.priority,
      dueDate: newTaskInput.dueDate,
      completed: false,
      order: 0,
    };

    setTasks((prev) => [
      newTask,
      ...prev.map((item, idx) => ({ ...item, order: idx + 1 })),
    ]);
    setToastMessage(`Added "${newTask.title}" to ${newTask.category}`);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const nextCompleted = !task.completed;
        return {
          ...task,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (target) {
      setToastMessage(`Removed "${target.title}"`);
    }
  };

  const handleCyclePriority = (id: string) => {
    const order: TaskPriority[] = ['Low', 'Medium', 'High'];
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const nextPriority = order[(order.indexOf(task.priority) + 1) % order.length];
        return { ...task, priority: nextPriority };
      })
    );
  };

  const handleReorderTasks = (newOrderedTasks: Task[]) => {
    setTasks(newOrderedTasks.map((t, idx) => ({ ...t, order: idx })));
  };

  const handleClearCompleted = () => {
    const count = tasks.filter((t) => t.completed).length;
    if (count === 0) return;
    setTasks((prev) => prev.filter((t) => !t.completed));
    setToastMessage(`Cleared ${count} completed ${count === 1 ? 'task' : 'tasks'}`);
  };

  const handleResetDemoData = () => {
    const freshTasks = generateSeedTasks();
    const freshHistory = generateSeedHistory();
    setTasks(freshTasks);
    setHistory(freshHistory);
    setStatusFilter('All');
    setCategoryFilter('All');
    setSearchQuery('');
    setSortMode('manual');
    setToastMessage('Restored default 6-month demo dataset');
  };

  const handleFocusComposer = () => {
    if (workspaceMode === 'analytics') {
      setWorkspaceMode('unified');
    }
    setTimeout(() => {
      composerInputRef.current?.focus();
      composerInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const formattedHeaderDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col">
      {/* Subtle Ambient Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-indigo-950/25 via-slate-950/10 to-transparent"
      />

      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element Brand wordmark */}
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setWorkspaceMode('unified');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
          >
            FlowState
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
          >
            <a
              href="#workspace"
              onClick={(e) => {
                e.preventDefault();
                setWorkspaceMode('unified');
              }}
              className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                workspaceMode === 'unified' ? 'text-slate-100' : ''
              }`}
            >
              Unified Dashboard
            </a>
            <a
              href="#tasks"
              onClick={(e) => {
                e.preventDefault();
                setWorkspaceMode('tasks');
              }}
              className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                workspaceMode === 'tasks' ? 'text-slate-100' : ''
              }`}
            >
              Daily Tasks
            </a>
            <a
              href="#analytics"
              onClick={(e) => {
                e.preventDefault();
                setWorkspaceMode('analytics');
              }}
              className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                workspaceMode === 'analytics' ? 'text-slate-100' : ''
              }`}
            >
              Analytics & Heatmap
            </a>
            <a
              href="#reset"
              onClick={(e) => {
                e.preventDefault();
                handleResetDemoData();
              }}
              className="hover:text-indigo-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Reset Demo
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleFocusComposer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Workspace Context Sub-Header & View Switcher */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/70 pb-4">
          <div>
            <p className="font-mono text-xs text-indigo-400">{formattedHeaderDate}</p>
            <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              Personal Execution & Consistency
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Workspace Layout Switcher */}
            <div
              role="group"
              aria-label="Select workspace view mode"
              className="flex items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-900/80 p-1 text-xs"
            >
              <button
                type="button"
                onClick={() => setWorkspaceMode('unified')}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                  workspaceMode === 'unified'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('tasks')}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                  workspaceMode === 'tasks'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Focus Tasks
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('analytics')}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                  workspaceMode === 'analytics'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full Analytics
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetDemoData}
              title="Restore default 6-month history and tasks"
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset Seed Data</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid with Smooth Transitions */}
        <AnimatePresence mode="wait">
          {workspaceMode === 'unified' && (
            <motion.div
              key="unified-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
            >
              {/* Left Column (7 cols): Daily Tasks & To-Do List */}
              <div className="flex flex-col gap-5 lg:col-span-7">
                <TodaysFocusCard
                  todayTasks={todayTasks}
                  allTasks={tasks}
                  currentStreak={currentStreak}
                />

                <TaskComposer
                  onAddTask={handleAddTask}
                  inputRef={composerInputRef}
                />

                <TaskListSection
                  tasks={tasks}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  sortMode={sortMode}
                  onSortModeChange={setSortMode}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onCyclePriority={handleCyclePriority}
                  onReorderTasks={handleReorderTasks}
                  onClearCompleted={handleClearCompleted}
                  onFocusComposer={handleFocusComposer}
                />
              </div>

              {/* Right Column (5 cols): Key Metrics, 6-Month Heatmap & Analytics Charts */}
              <div className="flex flex-col gap-5 lg:col-span-5">
                <KeyMetricCards
                  currentStreak={currentStreak}
                  completionRate={completionRate}
                  totalTasksDone={totalTasksDone}
                  sixMonthPlannedTotal={sixMonthPlannedTotal}
                />

                <ActivityHeatmap
                  history={history}
                  todayCompletedCount={todayCompletedCount}
                  todayPlannedCount={todayPlannedCount}
                />

                <AnalyticsCharts
                  weeklyData={weeklyData}
                  categoryStats={categoryStats}
                  selectedCategoryFilter={categoryFilter}
                  onSelectCategoryFromChart={(cat) => setCategoryFilter(cat)}
                />
              </div>
            </motion.div>
          )}

          {workspaceMode === 'tasks' && (
            <motion.div
              key="tasks-only-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="mx-auto flex max-w-4xl flex-col gap-5"
            >
              <TodaysFocusCard
                todayTasks={todayTasks}
                allTasks={tasks}
                currentStreak={currentStreak}
              />

              <TaskComposer
                onAddTask={handleAddTask}
                inputRef={composerInputRef}
              />

              <TaskListSection
                tasks={tasks}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onCyclePriority={handleCyclePriority}
                onReorderTasks={handleReorderTasks}
                onClearCompleted={handleClearCompleted}
                onFocusComposer={handleFocusComposer}
              />
            </motion.div>
          )}

          {workspaceMode === 'analytics' && (
            <motion.div
              key="analytics-only-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="flex flex-col gap-6"
            >
              <KeyMetricCards
                currentStreak={currentStreak}
                completionRate={completionRate}
                totalTasksDone={totalTasksDone}
                sixMonthPlannedTotal={sixMonthPlannedTotal}
              />

              <ActivityHeatmap
                history={history}
                todayCompletedCount={todayCompletedCount}
                todayPlannedCount={todayPlannedCount}
              />

              <AnalyticsCharts
                weeklyData={weeklyData}
                categoryStats={categoryStats}
                selectedCategoryFilter={categoryFilter}
                onSelectCategoryFromChart={(cat) => {
                  setCategoryFilter(cat);
                  setWorkspaceMode('unified');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Non-intrusive Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            role="status"
            className="fixed bottom-5 right-5 z-50 rounded-lg border border-slate-700/80 bg-slate-900/95 px-4 py-2.5 text-xs font-medium text-slate-100 shadow-lg backdrop-blur-md"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-900 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <span>FlowState Personal Productivity Workspace</span>
          <span>Changes saved automatically to browser storage</span>
        </div>
      </footer>
    </div>
  );
}
