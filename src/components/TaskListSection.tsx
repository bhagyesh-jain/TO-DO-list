import React from 'react';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import {
  ArrowUpDown,
  Check,
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
}

const STATUS_FILTERS: StatusFilter[] = ['All', 'Active', 'Completed'];
const CATEGORY_FILTERS: CategoryFilter[] = ['All', 'Work', 'Personal', 'Health'];

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

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
          // dueDate sort
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
    if (priority === 'High') return 'text-rose-400 font-medium';
    if (priority === 'Medium') return 'text-amber-400 font-medium';
    return 'text-slate-400';
  };

  const getCategoryTextClass = (category: Task['category']) => {
    if (category === 'Work') return 'text-indigo-400 font-medium';
    if (category === 'Health') return 'text-emerald-400 font-medium';
    return 'text-violet-400 font-medium';
  };

  return (
    <section
      aria-label="Daily Tasks List"
      className="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-900/65 p-5 backdrop-blur-md"
    >
      {/* Toolbar Row 1: Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Segmented Control */}
        <div
          role="tablist"
          aria-label="Filter tasks by completion status"
          className="flex items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-950/70 p-1"
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
              <button
                key={status}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`ml-1.5 font-mono tabular-nums text-[11px] ${
                    active ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Filter tasks..."
            aria-label="Filter tasks by keyword"
            className="w-full rounded-lg border border-slate-800/80 bg-slate-950/70 py-1.5 pl-8 pr-7 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500/70 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Row 2: Category Tabs & Sort Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 pb-3 text-xs">
        <div
          role="group"
          aria-label="Filter tasks by category"
          className="flex flex-wrap items-center gap-1"
        >
          {CATEGORY_FILTERS.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryFilterChange(cat)}
                className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-950/70 p-0.5">
            <button
              type="button"
              onClick={() => onSortModeChange('manual')}
              className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                sortMode === 'manual'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GripVertical className="h-3 w-3" />
              <span>Manual Drag</span>
            </button>
            <button
              type="button"
              onClick={() => onSortModeChange('priority')}
              className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                sortMode === 'priority'
                  ? 'bg-indigo-600/90 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>Priority Sort</span>
            </button>
            <button
              type="button"
              onClick={() => onSortModeChange('dueDate')}
              className={` whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                sortMode === 'dueDate'
                  ? 'bg-indigo-600/90 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Due Date</span>
            </button>
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
          <ListChecks className="h-8 w-8 text-slate-600" />
          <div className="space-y-1">
            <h3 className="font-display text-sm font-semibold text-slate-200">
              No matching tasks found
            </h3>
            <p className="max-w-xs text-xs text-slate-400">
              {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                ? 'Try clearing your active filters or search query to view all scheduled tasks.'
                : 'Your task queue is clear. Add a new task above to start tracking your daily momentum.'}
            </p>
          </div>
          {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All' ? (
            <button
              type="button"
              onClick={() => {
                onStatusFilterChange('All');
                onCategoryFilterChange('All');
                onSearchQueryChange('');
              }}
              className="whitespace-nowrap shrink-0 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onFocusComposer}
              className="whitespace-nowrap shrink-0 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer"
            >
              Create First Task
            </button>
          )}
        </motion.div>
      ) : canDragReorder ? (
        <Reorder.Group
          axis="y"
          values={displayTasks}
          onReorder={onReorderTasks}
          className="flex flex-col divide-y divide-slate-800/60"
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
                className="group flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 select-none"
              >
                <TaskRowContent
                  task={task}
                  todayISO={todayISO}
                  canDrag={true}
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
        <div className="flex flex-col divide-y divide-slate-800/60">
          <AnimatePresence initial={false} mode="popLayout">
            {displayTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="group flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
              >
                <TaskRowContent
                  task={task}
                  todayISO={todayISO}
                  canDrag={false}
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/70 pt-3 text-xs text-slate-400">
        <span>
          Showing <span className="font-mono tabular-nums text-slate-200">{displayTasks.length}</span>{' '}
          of <span className="font-mono tabular-nums text-slate-200">{tasks.length}</span> tasks
          {canDragReorder ? ' · Drag rows to reorder' : ''}
        </span>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="whitespace-nowrap shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-rose-400 cursor-pointer"
          >
            Clear completed ({completedCount})
          </button>
        )}
      </div>
    </section>
  );
};

interface TaskRowContentProps {
  task: Task;
  todayISO: string;
  canDrag: boolean;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCyclePriority: (id: string) => void;
  getCategoryTextClass: (cat: Task['category']) => string;
  getPriorityTextClass: (prio: TaskPriority) => string;
}

const TaskRowContent: React.FC<TaskRowContentProps> = ({
  task,
  todayISO,
  canDrag,
  onToggleTask,
  onDeleteTask,
  onCyclePriority,
  getCategoryTextClass,
  getPriorityTextClass,
}) => {
  const isOverdue = !task.completed && task.dueDate < todayISO;

  return (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {canDrag && (
          <span
            title="Drag to reorder"
            className="mt-0.5 cursor-grab text-slate-600 transition-colors group-hover:text-slate-400 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        {/* Spring-animated Checkbox Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.82 }}
          animate={{ scale: task.completed ? [1, 1.18, 1] : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          onClick={() => onToggleTask(task.id)}
          aria-label={
            task.completed
              ? `Mark "${task.title}" as incomplete`
              : `Mark "${task.title}" as completed`
          }
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
            task.completed
              ? 'border-emerald-500 bg-emerald-500 text-slate-950'
              : 'border-slate-700 bg-slate-950/60 hover:border-indigo-400'
          }`}
        >
          <AnimatePresence initial={false}>
            {task.completed && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 550, damping: 24 }}
              >
                <Check className="h-3.5 w-3.5 stroke-[2.75]" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Task Title with animated strikethrough + Zero-Pill inline metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="relative inline-block max-w-full">
            <span
              onClick={() => onToggleTask(task.id)}
              className={`block cursor-pointer text-sm leading-snug transition-colors ${
                task.completed ? 'text-slate-500' : 'text-slate-100'
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
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pointer-events-none absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-emerald-500/70"
            />
          </div>

          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className={getCategoryTextClass(task.category)}>{task.category}</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <button
              type="button"
              onClick={() => onCyclePriority(task.id)}
              title="Click to cycle priority level"
              className={`hover:underline cursor-pointer ${getPriorityTextClass(task.priority)}`}
            >
              {task.priority} Priority
            </button>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span
              className={`font-mono tabular-nums ${
                isOverdue
                  ? 'text-rose-400 font-medium'
                  : task.dueDate === todayISO && !task.completed
                    ? 'text-emerald-400'
                    : 'text-slate-400'
              }`}
            >
              Due {formatHumanDate(task.dueDate)}
              {isOverdue ? ' (Overdue)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Action */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={() => onDeleteTask(task.id)}
        aria-label={`Delete task "${task.title}"`}
        className="shrink-0 rounded-md p-1.5 text-slate-500 opacity-80 transition-colors hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </motion.button>
    </>
  );
};
