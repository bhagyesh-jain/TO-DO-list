import React, { useRef } from 'react';
import {
  AnimatePresence,
  motion,
  Reorder,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import {
  ArrowUpDown,
  GripVertical,
  ListChecks,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  CategoryFilter,
  SortMode,
  StatusFilter,
  Task,
  TaskPriority,
} from '../types/productivity';
import { formatHumanDate, getTodayISO } from '../data/seedData';
import { MagneticButton, SpotlightCard } from './SpotlightCard';

interface TaskListSectionProps {
  tasks: Task[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCyclePriority: (id: string) => void;
  onReorderTasks: (newOrder: Task[]) => void;
  onClearCompleted: () => void;
  onFocusComposer: () => void;
  isDark?: boolean;
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

const STATUS_FILTERS: StatusFilter[] = ['All', 'Active', 'Completed'];
const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'Work', 'Personal', 'Health'];

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

// 8 radial particle angles for checkbox completion burst
const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export const TaskListSection: React.FC<TaskListSectionProps> = ({
  tasks,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortMode,
  onSortModeChange,
  searchQuery,
  onSearchQueryChange,
  onToggleTask,
  onDeleteTask,
  onCyclePriority,
  onReorderTasks,
  onClearCompleted,
  onFocusComposer,
  isDark = true,
  isDimmed = false,
  onMouseEnterCard,
  onMouseLeaveCard,
}) => {
  const todayISO = getTodayISO();

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'Active' && task.completed) return false;
    if (statusFilter === 'Completed' && !task.completed) return false;
    if (categoryFilter !== 'All' && task.category !== categoryFilter) return false;
    if (
      searchQuery.trim() !== '' &&
      !task.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sort tasks based on sortMode
  const displayTasks =
    sortMode === 'manual'
      ? filteredTasks
      : [...filteredTasks].sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          if (sortMode === 'priority') {
            const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
            if (diff !== 0) return diff;
            return a.dueDate.localeCompare(b.dueDate);
          }
          const dateDiff = a.dueDate.localeCompare(b.dueDate);
          if (dateDiff !== 0) return dateDiff;
          return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        });

  const canDragReorder =
    sortMode === 'manual' &&
    statusFilter === 'All' &&
    categoryFilter === 'All' &&
    searchQuery.trim() === '';

  const completedCount = tasks.filter((t) => t.completed).length;

  const getPriorityTextClass = (priority: TaskPriority) => {
    if (priority === 'High') return 'text-rose-600 dark:text-rose-400 font-medium';
    if (priority === 'Medium') return 'text-amber-600 dark:text-amber-400 font-medium';
    return 'text-slate-500 dark:text-zinc-400';
  };

  const getCategoryTextClass = (category: Task['category']) => {
    if (category === 'Work') return 'text-indigo-600 dark:text-indigo-400 font-medium';
    if (category === 'Health') return 'text-emerald-600 dark:text-emerald-400 font-medium';
    return 'text-violet-600 dark:text-violet-400 font-medium';
  };

  return (
    <SpotlightCard
      ariaLabel="Daily Tasks List"
      isDark={isDark}
      isDimmed={isDimmed}
      onMouseEnterCard={onMouseEnterCard}
      onMouseLeaveCard={onMouseLeaveCard}
      className="p-5 overflow-hidden"
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar Row 1: Sliding layoutId Status Filter Tabs & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Segmented Control */}
          <div
            role="tablist"
            aria-label="Filter tasks by completion status"
            className="flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 p-1 transition-colors duration-300"
          >
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              const count =
                status === 'All'
                  ? tasks.length
                  : status === 'Active'
                    ? tasks.filter((t) => !t.completed).length
                    : completedCount;
              return (
                <motion.button
                  key={status}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => onStatusFilterChange(status)}
                  className={`relative whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="task-status-filter-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-md border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-600 dark:bg-indigo-500 shadow-[0_2px_10px_rgba(79,70,229,0.35)]"
                    />
                  )}
                  <span className="relative z-10">{status}</span>
                  <span
                    className={`relative z-10 ml-1.5 font-mono tabular-nums text-[11px] ${
                      active ? 'text-indigo-100' : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Filter tasks..."
              aria-label="Filter tasks by keyword"
              className="w-full rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 py-1.5 pl-8 pr-7 text-xs text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 transition-colors focus:border-indigo-500/70 focus:outline-none"
            />
            {searchQuery && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => onSearchQueryChange('')}
                aria-label="Clear search query"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Toolbar Row 2: Sliding layoutId Category Tabs & Sort Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3 text-xs">
          <div
            role="group"
            aria-label="Filter tasks by category"
            className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 p-0.5 transition-colors duration-300"
          >
            {CATEGORY_FILTERS.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <motion.button
                  key={cat}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => onCategoryFilterChange(cat)}
                  className={`relative whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'text-slate-900 dark:text-zinc-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="task-category-filter-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-zinc-800 shadow-2xs"
                    />
                  )}
                  <span className="relative z-10">
                    {cat === 'All' ? 'All Categories' : cat}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 p-0.5 transition-colors duration-300">
              {(
                [
                  { id: 'manual', label: 'Manual Drag', icon: GripVertical },
                  { id: 'priority', label: 'Priority Sort', icon: ArrowUpDown },
                  { id: 'dueDate', label: 'Due Date', icon: null },
                ] as const
              ).map((item) => {
                const active = sortMode === item.id;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => onSortModeChange(item.id)}
                    className={`relative inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? item.id === 'manual'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="task-sort-mode-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className={`absolute inset-0 rounded-md border ${
                          item.id === 'manual'
                            ? 'border-slate-200 dark:border-white/15 bg-white dark:bg-zinc-800'
                            : 'border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-600 dark:bg-indigo-500'
                        }`}
                      />
                    )}
                    {Icon && <Icon className="relative z-10 h-3 w-3" />}
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task List Body */}
        {displayTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-3 py-12 text-center"
          >
            <ListChecks className="h-8 w-8 text-slate-400 dark:text-zinc-600" />
            <div className="space-y-1">
              <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-zinc-200">
                No matching tasks found
              </h3>
              <p className="max-w-xs text-xs text-slate-600 dark:text-zinc-400">
                {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                  ? 'Try clearing your active filters or search query to view all scheduled tasks.'
                  : 'Your task queue is clear. Add a new task above to start tracking your daily momentum.'}
              </p>
            </div>
            {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All' ? (
              <MagneticButton
                onClick={() => {
                  onStatusFilterChange('All');
                  onCategoryFilterChange('All');
                  onSearchQueryChange('');
                }}
                className="whitespace-nowrap shrink-0 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200 transition-colors hover:bg-slate-200 dark:hover:bg-zinc-700"
              >
                Reset Filters
              </MagneticButton>
            ) : (
              <MagneticButton
                withShimmer={true}
                onClick={onFocusComposer}
                className="whitespace-nowrap shrink-0 rounded-lg border border-indigo-500/30 bg-indigo-600 dark:bg-indigo-500 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 dark:hover:bg-indigo-400"
              >
                Create First Task
              </MagneticButton>
            )}
          </motion.div>
        ) : canDragReorder ? (
          <Reorder.Group
            axis="y"
            values={displayTasks}
            onReorder={onReorderTasks}
            className="flex flex-col gap-1.5"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {displayTasks.map((task) => (
                <Reorder.Item
                  key={task.id}
                  value={task}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="select-none"
                >
                  <SpotlightTaskRow
                    task={task}
                    todayISO={todayISO}
                    canDrag={true}
                    isDark={isDark}
                    onToggleTask={onToggleTask}
                    onDeleteTask={onDeleteTask}
                    onCyclePriority={onCyclePriority}
                    getCategoryTextClass={getCategoryTextClass}
                    getPriorityTextClass={getPriorityTextClass}
                  />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false} mode="popLayout">
              {displayTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                >
                  <SpotlightTaskRow
                    task={task}
                    todayISO={todayISO}
                    canDrag={false}
                    isDark={isDark}
                    onToggleTask={onToggleTask}
                    onDeleteTask={onDeleteTask}
                    onCyclePriority={onCyclePriority}
                    getCategoryTextClass={getCategoryTextClass}
                    getPriorityTextClass={getPriorityTextClass}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer Summary & Clear Completed */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-white/10 pt-3 text-xs text-slate-600 dark:text-zinc-400">
          <span>
            Showing{' '}
            <span className="font-mono tabular-nums text-slate-900 dark:text-zinc-200">
              {displayTasks.length}
            </span>{' '}
            of{' '}
            <span className="font-mono tabular-nums text-slate-900 dark:text-zinc-200">
              {tasks.length}
            </span>{' '}
            tasks
            {canDragReorder ? ' · Grab handle to reorder' : ''}
          </span>

          {completedCount > 0 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={onClearCompleted}
              className="whitespace-nowrap shrink-0 text-xs font-medium text-slate-600 dark:text-zinc-400 transition-colors hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            >
              Clear completed ({completedCount})
            </motion.button>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
};

interface SpotlightTaskRowProps {
  task: Task;
  todayISO: string;
  canDrag: boolean;
  isDark: boolean;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCyclePriority: (id: string) => void;
  getCategoryTextClass: (cat: Task['category']) => string;
  getPriorityTextClass: (prio: TaskPriority) => string;
}

/**
 * Individual task row with:
 * - Theme-aware cursor-tracking radial spotlight hover & 1px border illumination
 * - Contextual cursor states (cursor-grab / active:cursor-grabbing for draggable rows)
 * - Custom self-drawing SVG checkmark (pathLength: 0 -> 1) + 8-particle radial burst
 * - Smooth animated strikethrough and magnetic delete button
 */
const SpotlightTaskRow: React.FC<SpotlightTaskRowProps> = ({
  task,
  todayISO,
  canDrag,
  isDark,
  onToggleTask,
  onDeleteTask,
  onCyclePriority,
  getCategoryTextClass,
  getPriorityTextClass,
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const spotlightColor = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(99, 102, 241, 0.08)';

  const rowSpotlight = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;
  const isOverdue = !task.completed && task.dueDate < todayISO;

  return (
    <div
      ref={rowRef}
      onMouseMove={handleMouseMove}
      className={`group/row relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 px-3.5 py-3 transition-colors duration-200 hover:border-indigo-400/50 dark:hover:border-white/20 hover:bg-white/95 dark:hover:bg-zinc-800/80 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {/* Radial Cursor Spotlight across Task Row */}
      <motion.div
        aria-hidden="true"
        style={{ background: rowSpotlight }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
      />

      <div className="relative z-10 flex min-w-0 flex-1 items-start gap-3">
        {canDrag && (
          <span
            title="Drag to reorder task"
            className="mt-0.5 cursor-grab text-slate-400 dark:text-zinc-500 transition-colors group-hover/row:text-slate-600 dark:group-hover/row:text-zinc-300 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        {/* Custom Self-Drawing SVG Checkmark + Radial Particle Burst */}
        <div className="relative mt-0.5 flex items-center justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => onToggleTask(task.id)}
            aria-label={
              task.completed
                ? `Mark "${task.title}" as incomplete`
                : `Mark "${task.title}" as completed`
            }
            className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
              task.completed
                ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.45)]'
                : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/80 hover:border-indigo-500 dark:hover:border-indigo-400'
            }`}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="h-3.5 w-3.5 overflow-visible"
              aria-hidden="true"
            >
              <motion.path
                d="M3.2 8.3L6.6 11.6L12.8 4.6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{
                  pathLength: task.completed ? 1 : 0,
                  opacity: task.completed ? 1 : 0,
                }}
                transition={{
                  pathLength: { type: 'spring', stiffness: 380, damping: 28 },
                  opacity: { duration: 0.1 },
                }}
              />
            </svg>
          </motion.button>

          {/* Tiny Radial Particle Burst on Completion */}
          <AnimatePresence>
            {task.completed && (
              <div
                key={`burst-${task.completedAt || 'done'}`}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                {PARTICLE_ANGLES.map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const distance = 15;
                  const tx = Math.cos(rad) * distance;
                  const ty = Math.sin(rad) * distance;
                  return (
                    <motion.span
                      key={angle}
                      initial={{ x: 0, y: 0, scale: 1, opacity: 0.95 }}
                      animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`absolute h-1 w-1 rounded-full ${
                        i % 2 === 0
                          ? 'bg-emerald-600 dark:bg-emerald-400'
                          : 'bg-indigo-600 dark:bg-indigo-400'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Task Title with animated strikethrough + Zero-Pill inline metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="relative inline-block max-w-full">
            <span
              onClick={() => onToggleTask(task.id)}
              className={`block cursor-pointer text-sm leading-snug transition-colors ${
                task.completed
                  ? 'text-slate-400 dark:text-zinc-500'
                  : 'text-slate-900 dark:text-zinc-100'
              }`}
            >
              {task.title}
            </span>
            {/* Animated Strikethrough Line */}
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{
                width: task.completed ? '100%' : '0%',
                opacity: task.completed ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="pointer-events-none absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-gradient-to-r from-emerald-600 to-indigo-600 dark:from-emerald-400 dark:to-indigo-400"
            />
          </div>

          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <span className={getCategoryTextClass(task.category)}>{task.category}</span>
            <span aria-hidden="true" className="text-slate-400 dark:text-zinc-600">
              ·
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => onCyclePriority(task.id)}
              title="Click to cycle priority level"
              className={`hover:underline cursor-pointer ${getPriorityTextClass(task.priority)}`}
            >
              {task.priority} Priority
            </motion.button>
            <span aria-hidden="true" className="text-slate-400 dark:text-zinc-600">
              ·
            </span>
            <span
              className={`font-mono tabular-nums ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : task.dueDate === todayISO && !task.completed
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Due {formatHumanDate(task.dueDate)}
              {isOverdue ? ' (Overdue)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Magnetic Delete Icon Button */}
      <MagneticButton
        magneticStrength={0.35}
        onClick={() => onDeleteTask(task.id)}
        aria-label={`Delete task "${task.title}"`}
        className="relative z-10 shrink-0 rounded-md p-1.5 text-slate-400 dark:text-zinc-500 opacity-75 transition-colors hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 group-hover/row:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </MagneticButton>
    </div>
  );
};
