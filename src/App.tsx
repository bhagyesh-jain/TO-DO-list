import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Plus, RotateCcw, Sun, Volume2, VolumeX } from 'lucide-react';
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
import { MagneticButton } from './components/SpotlightCard';
import {
  playTaskAddSound,
  playTaskCompleteSound,
  playTaskDeleteSound,
  playTaskUncheckSound,
} from './utils/soundEffects';

const STORAGE_KEY_TASKS = 'flowstate_tasks_v1';
const STORAGE_KEY_HISTORY = 'flowstate_history_v1';
const STORAGE_KEY_THEME = 'flowstate_theme_v1';
const STORAGE_KEY_SOUND = 'flowstate_sound_v1';

type WorkspaceMode = 'unified' | 'tasks' | 'analytics';
type ThemeMode = 'dark' | 'light';

export default function App() {
  const composerInputRef = useRef<HTMLInputElement | null>(null);

  // Dual Washi Light / Sumi Dark Theme State with localStorage + System Preference Detection
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      ) {
        return 'light';
      }
    } catch {
      // Default to dark
    }
    return 'dark';
  });

  const isDark = theme === 'dark';

  // Sync `.dark` class on document.documentElement and persist theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  // Listen to OS system theme changes if user hasn't manually overridden in session
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY_THEME)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Web Audio API Sound Toggle State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      if (saved !== null) return saved === 'true';
    } catch {
      // Default enabled
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(soundEnabled));
    } catch {
      // Ignore storage errors
    }
  }, [soundEnabled]);

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

  // UI Filter, View & Sibling Focus State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('unified');
  const [focusedWidget, setFocusedWidget] = useState<string | null>(null);
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

  // Compute Category Breakdown Donut Chart data (Vermilion, Ochre, Moss palette)
  const categoryStats: CategoryStat[] = useMemo(() => {
    const categories: {
      cat: TaskCategory;
      color: string;
      strokeColor: string;
    }[] = [
      {
        cat: 'Work',
        color: 'text-[#D94A2B] dark:text-[#E85D3F]',
        strokeColor: isDark ? '#E85D3F' : '#D94A2B',
      },
      {
        cat: 'Personal',
        color: 'text-[#C4842D] dark:text-[#D99B3E]',
        strokeColor: isDark ? '#D99B3E' : '#C4842D',
      },
      {
        cat: 'Health',
        color: 'text-[#5B7553] dark:text-[#74946A]',
        strokeColor: isDark ? '#74946A' : '#5B7553',
      },
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
  }, [tasks, isDark]);

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
    playTaskAddSound(soundEnabled);
    setToastMessage(`Added "${newTask.title}" to ${newTask.category}`);
  };

  const handleToggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (target) {
      if (!target.completed) {
        playTaskCompleteSound(soundEnabled);
      } else {
        playTaskUncheckSound(soundEnabled);
      }
    }

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
    playTaskDeleteSound(soundEnabled);
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
    playTaskDeleteSound(soundEnabled);
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
    playTaskAddSound(soundEnabled);
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
    <div className="field-journal-grid min-h-screen bg-[#F6F3EC] dark:bg-[#161513] text-[#23211E] dark:text-[#ECE8DF] flex flex-col transition-colors duration-300">
      {/* Top Navigation Bar — 3-Zone Contract on Matte Washi / Sumi Surface */}
      <header className="sticky top-0 z-30 border-b border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7]/95 dark:bg-[#1E1D1A]/95 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element Brand wordmark */}
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setWorkspaceMode('unified');
            }}
            className="font-display text-xl font-semibold tracking-tight text-[#23211E] dark:text-[#ECE8DF] whitespace-nowrap shrink-0"
          >
            FlowState
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#7A756B] dark:text-[#8C877D]"
          >
            <a
              href="#workspace"
              onClick={(e) => {
                e.preventDefault();
                setWorkspaceMode('unified');
              }}
              className={`hover:text-[#23211E] dark:hover:text-[#ECE8DF] hover:underline decoration-[#D94A2B] dark:decoration-[#E85D3F] underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                workspaceMode === 'unified'
                  ? 'text-[#23211E] dark:text-[#ECE8DF] font-semibold underline decoration-[#D94A2B] dark:decoration-[#E85D3F]'
                  : ''
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
              className={`hover:text-[#23211E] dark:hover:text-[#ECE8DF] hover:underline decoration-[#D94A2B] dark:decoration-[#E85D3F] underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                workspaceMode === 'tasks'
                  ? 'text-[#23211E] dark:text-[#ECE8DF] font-semibold underline decoration-[#D94A2B] dark:decoration-[#E85D3F]'
                  : ''
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
              className={`hover:text-[#23211E] dark:hover:text-[#ECE8DF] hover:underline decoration-[#D94A2B] dark:decoration-[#E85D3F] underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                workspaceMode === 'analytics'
                  ? 'text-[#23211E] dark:text-[#ECE8DF] font-semibold underline decoration-[#D94A2B] dark:decoration-[#E85D3F]'
                  : ''
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
              className="hover:text-[#D94A2B] dark:hover:text-[#E85D3F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Reset Demo
            </a>
          </nav>

          {/* Zone 3: Tactile Rocker Theme Toggle + Unified Hardware Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Tactile Mechanical Rocker Switch for Washi Light / Sumi Dark */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 24 }}
              onClick={toggleTheme}
              aria-label={
                isDark ? 'Switch to Washi Light Mode' : 'Switch to Sumi Dark Mode'
              }
              title={isDark ? 'Switch to Washi Light Mode' : 'Switch to Sumi Dark Mode'}
              className="relative inline-flex items-center gap-1 rounded-md border border-[#D5CFC0] dark:border-[#3A3731] bg-[#EFECE4] dark:bg-[#141311] p-1 text-xs font-medium shadow-[inset_0_1px_2px_rgba(35,33,30,0.1)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)] cursor-pointer select-none"
            >
              {/* Washi Light Pole */}
              <span
                className={`relative z-10 inline-flex items-center gap-1 rounded-[4px] px-2 py-1 transition-colors ${
                  !isDark
                    ? 'text-[#23211E] font-semibold'
                    : 'text-[#8C877D]'
                }`}
              >
                {!isDark && (
                  <motion.span
                    layoutId="theme-rocker-actuator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className=" -z-10 absolute inset-0 rounded-[4px] border border-[#D5CFC0] bg-[#FCFBF7] shadow-[0_1px_0_0_rgba(35,33,30,0.16),inset_0_1px_0_0_rgba(255,255,255,0.9)]"
                  />
                )}
                <Sun
                  className={`h-3.5 w-3.5 ${
                    !isDark ? 'text-[#D94A2B]' : 'text-[#8C877D]'
                  }`}
                />
                <span className="hidden sm:inline">Light</span>
              </span>

              {/* Sumi Dark Pole */}
              <span
                className={`relative z-10 inline-flex items-center gap-1 rounded-[4px] px-2 py-1 transition-colors ${
                  isDark
                    ? 'text-[#ECE8DF] font-semibold'
                    : 'text-[#7A756B]'
                }`}
              >
                {isDark && (
                  <motion.span
                    layoutId="theme-rocker-actuator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="-z-10 absolute inset-0 rounded-[4px] border border-[#3A3731] bg-[#262420] shadow-[0_1px_0_0_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  />
                )}
                <Moon
                  className={`h-3.5 w-3.5 ${
                    isDark ? 'text-[#E85D3F]' : 'text-[#7A756B]'
                  }`}
                />
                <span className="hidden sm:inline">Dark</span>
              </span>
            </motion.button>

            {/* Unified Primary Hardware Button (+ New Task) */}
            <MagneticButton
              type="button"
              withShimmer={true}
              magneticStrength={0.18}
              onClick={handleFocusComposer}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#B83B1F] dark:border-[#C94529] bg-[#D94A2B] dark:bg-[#E85D3F] px-3.5 py-2 text-xs font-medium text-[#FCFBF7] shadow-[0_2px_0_0_#9E3119,inset_0_1px_0_0_rgba(255,255,255,0.24)] dark:shadow-[0_2px_0_0_#A3341B,inset_0_1px_0_0_rgba(255,255,255,0.22)] transition-colors hover:bg-[#C43F22] dark:hover:bg-[#F0684B] whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </MagneticButton>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Workspace Context Sub-Header & Recessed Sliding View Switcher */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#E4DFD3] dark:border-[#2C2A26] pb-4 transition-colors duration-300">
          <div>
            <p className="font-display italic text-sm text-[#D94A2B] dark:text-[#E85D3F]">
              {formattedHeaderDate}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-[#23211E] dark:text-[#ECE8DF] sm:text-3xl">
              Personal Execution & Consistency
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Recessed Hardware Filter Track for Workspace Layout Switcher */}
            <div
              role="group"
              aria-label="Select workspace view mode"
              className="flex items-center gap-1 rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-1 text-xs shadow-[inset_0_1px_2px_rgba(35,33,30,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-300"
            >
              {(
                [
                  { id: 'unified', label: 'Split View' },
                  { id: 'tasks', label: 'Focus Tasks' },
                  { id: 'analytics', label: 'Full Analytics' },
                ] as const
              ).map((tab) => {
                const active = workspaceMode === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => setWorkspaceMode(tab.id)}
                    className={`relative whitespace-nowrap shrink-0 rounded-[4px] px-3 py-1 font-medium transition-colors cursor-pointer ${
                      active
                        ? 'text-[#FCFBF7]'
                        : 'text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="workspace-mode-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className="absolute inset-0 rounded-[4px] border border-[#B83B1F] dark:border-[#C94529] bg-[#D94A2B] dark:bg-[#E85D3F] shadow-[0_1px_0_0_#9E3119,inset_0_1px_0_0_rgba(255,255,255,0.22)]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Tactile Sound Effects Toggle */}
            <MagneticButton
              type="button"
              magneticStrength={0.16}
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={
                soundEnabled
                  ? 'Tactile UI sounds enabled (Click to mute)'
                  : 'Tactile UI sounds muted (Click to enable)'
              }
              aria-label={
                soundEnabled ? 'Mute UI sound effects' : 'Enable UI sound effects'
              }
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] px-3 py-1.5 text-xs font-medium text-[#23211E] dark:text-[#ECE8DF] shadow-[0_1px_0_0_rgba(35,33,30,0.08)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.6)] transition-colors hover:border-[#D94A2B]/60 dark:hover:border-[#E85D3F]/60"
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-[#5B7553] dark:text-[#74946A]" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-[#7A756B] dark:text-[#8C877D]" />
              )}
              <span>{soundEnabled ? 'SFX On' : 'SFX Off'}</span>
            </MagneticButton>

            <MagneticButton
              type="button"
              magneticStrength={0.16}
              onClick={handleResetDemoData}
              title="Restore default 6-month history and tasks"
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] px-3 py-1.5 text-xs font-medium text-[#23211E] dark:text-[#ECE8DF] shadow-[0_1px_0_0_rgba(35,33,30,0.08)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.6)] transition-colors hover:border-[#D94A2B]/60 dark:hover:border-[#E85D3F]/60"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#7A756B] dark:text-[#8C877D]" />
              <span>Reset Seed Data</span>
            </MagneticButton>
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
                  isDark={isDark}
                  isDimmed={focusedWidget !== null && focusedWidget.startsWith('chart-')}
                />

                <TaskComposer
                  onAddTask={handleAddTask}
                  inputRef={composerInputRef}
                  isDark={isDark}
                  isDimmed={focusedWidget !== null && focusedWidget.startsWith('chart-')}
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
                  isDark={isDark}
                  isDimmed={focusedWidget !== null && focusedWidget.startsWith('chart-')}
                />
              </div>

              {/* Right Column (5 cols): Key Metrics, 6-Month Heatmap & Analytics Charts */}
              <div className="flex flex-col gap-5 lg:col-span-5">
                <KeyMetricCards
                  currentStreak={currentStreak}
                  completionRate={completionRate}
                  totalTasksDone={totalTasksDone}
                  sixMonthPlannedTotal={sixMonthPlannedTotal}
                  isDark={isDark}
                  focusedWidget={focusedWidget}
                  onFocusWidget={setFocusedWidget}
                />

                <ActivityHeatmap
                  history={history}
                  todayCompletedCount={todayCompletedCount}
                  todayPlannedCount={todayPlannedCount}
                  isDark={isDark}
                  isDimmed={focusedWidget !== null && focusedWidget !== 'chart-heatmap'}
                  onMouseEnterCard={() => setFocusedWidget('chart-heatmap')}
                  onMouseLeaveCard={() => setFocusedWidget(null)}
                />

                <AnalyticsCharts
                  weeklyData={weeklyData}
                  categoryStats={categoryStats}
                  selectedCategoryFilter={categoryFilter}
                  onSelectCategoryFromChart={(cat) => setCategoryFilter(cat)}
                  isDark={isDark}
                  focusedWidget={focusedWidget}
                  onFocusWidget={setFocusedWidget}
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
                isDark={isDark}
              />

              <TaskComposer
                onAddTask={handleAddTask}
                inputRef={composerInputRef}
                isDark={isDark}
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
                isDark={isDark}
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
                isDark={isDark}
                focusedWidget={focusedWidget}
                onFocusWidget={setFocusedWidget}
              />

              <ActivityHeatmap
                history={history}
                todayCompletedCount={todayCompletedCount}
                todayPlannedCount={todayPlannedCount}
                isDark={isDark}
                isDimmed={focusedWidget !== null && focusedWidget !== 'chart-heatmap'}
                onMouseEnterCard={() => setFocusedWidget('chart-heatmap')}
                onMouseLeaveCard={() => setFocusedWidget(null)}
              />

              <AnalyticsCharts
                weeklyData={weeklyData}
                categoryStats={categoryStats}
                selectedCategoryFilter={categoryFilter}
                onSelectCategoryFromChart={(cat) => {
                  setCategoryFilter(cat);
                  setWorkspaceMode('unified');
                }}
                isDark={isDark}
                focusedWidget={focusedWidget}
                onFocusWidget={setFocusedWidget}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Non-intrusive Field Journal Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            role="status"
            className="fixed bottom-5 right-5 z-50 rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] px-4 py-2.5 text-xs font-medium text-[#23211E] dark:text-[#ECE8DF] shadow-[0_10px_24px_-4px_rgba(35,33,30,0.18)] dark:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.8)]"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-[#E4DFD3] dark:border-[#2C2A26] py-5 text-center text-xs text-[#7A756B] dark:text-[#8C877D] transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <span className="font-display italic text-sm text-[#23211E] dark:text-[#ECE8DF]">
            FlowState Field Journal & Tactile Execution Timer
          </span>
          <span className="font-mono text-[11px]">
            Changes & theme saved automatically to local storage
          </span>
        </div>
      </footer>
    </div>
  );
}
