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

// 8 radial particle angles for stamp completion burst
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
    if (priority === 'High') return 'text-[#D94A2B] dark:text-[#E85D3F] font-medium';
    if (priority === 'Medium') return 'text-[#B57624] dark:text-[#D99B3E] font-medium';
    return 'text-[#7A756B] dark:text-[#8C877D]';
  };

  const getCategoryTextClass = (category: Task['category']) => {
    if (category === 'Work') return 'text-[#23211E] dark:text-[#ECE8DF] font-medium';
    if (category === 'Health') return 'text-[#5B7553] dark:text-[#74946A] font-medium';
    return 'text-[#9E5A3C] dark:text-[#C88464] font-medium';
  };

  return (
    <SpotlightCard
      ariaLabel="Daily Tasks List"
      isDark={isDark}
      isDimmed={isDimmed}
      onMouseEnterCard={onMouseEnterCard}
      onMouseLeaveCard={onMouseLeaveCard}
      className="p-6 overflow-hidden"
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar Row 1: Recessed Hardware Status Track & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Segmented Control */}
          <div
            role="tablist"
            aria-label="Filter tasks by completion status"
            className="flex items-center gap-1 rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-1 shadow-[inset_0_1px_2px_rgba(35,33,30,0.08)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)] transition-colors duration-300"
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
                      ? 'text-[#FCFBF7]'
                      : 'text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="task-status-filter-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-md border border-[#B83B1F] dark:border-[#C9482C] bg-[#D94A2B] dark:bg-[#E85D3F] shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.22)]"
                    />
                  )}
                  <span className="relative z-10">{status}</span>
                  <span
                    className={`relative z-10 ml-1.5 font-mono tabular-nums text-[11px] ${
                      active ? 'text-[#FCFBF7]/90' : 'text-[#7A756B] dark:text-[#8C877D]'
                    }`}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Search Input (Recessed Well) */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7A756B] dark:text-[#8C877D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search journal tasks..."
              aria-label="Filter tasks by keyword"
              className="w-full rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] py-1.5 pl-8 pr-7 text-xs text-[#23211E] dark:text-[#ECE8DF] placeholder-[#7A756B] dark:placeholder-[#8C877D] shadow-[inset_0_1px_2px_rgba(35,33,30,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] transition-colors focus:border-[#D94A2B] dark:focus:border-[#E85D3F] focus:outline-none"
            />
            {searchQuery && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => onSearchQueryChange('')}
                aria-label="Clear search query"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Toolbar Row 2: Recessed Category Track & Sort Mode Track */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4DFD3] dark:border-[#2C2A26] pb-3.5 text-xs">
          <div
            role="group"
            aria-label="Filter tasks by category"
            className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-0.5 shadow-[inset_0_1px_2px_rgba(35,33,30,0.08)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)] transition-colors duration-300"
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
                      ? 'text-[#23211E] dark:text-[#ECE8DF]'
                      : 'text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="task-category-filter-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-md border border-[#D5CFC0] dark:border-[#3A3731] bg-[#FCFBF7] dark:bg-[#262420] shadow-[0_1px_2px_rgba(35,33,30,0.08)]"
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
            <div className="flex items-center gap-1 rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-0.5 shadow-[inset_0_1px_2px_rgba(35,33,30,0.08)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)] transition-colors duration-300">
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
                          ? 'text-[#23211E] dark:text-[#ECE8DF]'
                          : 'text-[#FCFBF7]'
                        : 'text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="task-sort-mode-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className={`absolute inset-0 rounded-md border ${
                          item.id === 'manual'
                            ? 'border-[#D5CFC0] dark:border-[#3A3731] bg-[#FCFBF7] dark:bg-[#262420]'
                            : 'border-[#B83B1F] dark:border-[#C9482C] bg-[#D94A2B] dark:bg-[#E85D3F]'
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
            <ListChecks className="h-8 w-8 text-[#7A756B] dark:text-[#8C877D]" />
            <div className="space-y-1">
              <h3 className="font-display text-base font-medium text-[#23211E] dark:text-[#ECE8DF]">
                No matching tasks found
              </h3>
              <p className="max-w-xs text-xs text-[#7A756B] dark:text-[#8C877D]">
                {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                  ? 'Try clearing your active filters or search query to view all scheduled tasks.'
                  : 'Your journal page is clear. Add a new task above to start tracking your daily momentum.'}
              </p>
            </div>
            {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All' ? (
              <MagneticButton
                onClick={() => {
                  onStatusFilterChange('All');
                  onCategoryFilterChange('All');
                  onSearchQueryChange('');
                }}
                className="whitespace-nowrap shrink-0 rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#262420] px-3.5 py-1.5 text-xs font-medium text-[#23211E] dark:text-[#ECE8DF] transition-colors hover:border-[#D94A2B]"
              >
                Reset Filters
              </MagneticButton>
            ) : (
              <MagneticButton
                withShimmer={true}
                onClick={onFocusComposer}
                className="whitespace-nowrap shrink-0 rounded-lg border border-[#B83B1F] bg-[#D94A2B] dark:bg-[#E85D3F] px-3.5 py-1.5 text-xs font-medium text-[#FCFBF7] shadow-[0_2px_0_0_#9E3119]"
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
            className="flex flex-col divide-y divide-[#E4DFD3] dark:divide-[#2C2A26]"
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
          <div className="flex flex-col divide-y divide-[#E4DFD3] dark:divide-[#2C2A26]">
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E4DFD3] dark:border-[#2C2A26] pt-3.5 text-xs text-[#7A756B] dark:text-[#8C877D]">
          <span>
            Showing{' '}
            <span className="font-mono tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
              {displayTasks.length}
            </span>{' '}
            of{' '}
            <span className="font-mono tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
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
              className="whitespace-nowrap shrink-0 text-xs font-medium text-[#7A756B] dark:text-[#8C877D] transition-colors hover:text-[#D94A2B] dark:hover:text-[#E85D3F] cursor-pointer"
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
 * Field Journal Task Entry Row:
 * - 'Stamp & Click' recessed matte checkbox well (whileTap={{ scale: 0.92 }}) that fills with Vermilion (#D94A2B / #E85D3F)
 * - Self-drawing SVG checkmark (pathLength: 0 -> 1) + Vermilion/Moss ink stamp burst
 * - Thin ink strikethrough across the task title
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
    ? 'rgba(236, 232, 223, 0.035)'
    : 'rgba(217, 74, 43, 0.045)';

  const rowSpotlight = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;
  const isOverdue = !task.completed && task.dueDate < todayISO;

  return (
    <div
      ref={rowRef}
      onMouseMove={handleMouseMove}
      className={`group/row relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-3 transition-colors duration-150 hover:bg-[#F6F3EC]/80 dark:hover:bg-[#161513]/65 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {/* Subtle Paper Spotlight across Task Row */}
      <motion.div
        aria-hidden="true"
        style={{ background: rowSpotlight }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
      />

      <div className="relative z-10 flex min-w-0 flex-1 items-start gap-3">
        {canDrag && (
          <span
            title="Drag to reorder task"
            className="mt-0.5 cursor-grab text-[#7A756B]/60 dark:text-[#8C877D]/60 transition-colors group-hover/row:text-[#23211E] dark:group-hover/row:text-[#ECE8DF] active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        {/* 'Stamp & Click' Recessed Well Checkbox + Vermilion Stamp Fill */}
        <div className="relative mt-0.5 flex items-center justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            onClick={() => onToggleTask(task.id)}
            aria-label={
              task.completed
                ? `Mark "${task.title}" as incomplete`
                : `Mark "${task.title}" as completed`
            }
            className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors cursor-pointer ${
              task.completed
                ? 'border-[#B83B1F] dark:border-[#C9482C] bg-[#D94A2B] dark:bg-[#E85D3F] text-[#FCFBF7] shadow-[0_1px_0_0_#9E3119,inset_0_1px_0_rgba(255,255,255,0.25)]'
                : 'border-[#D5CFC0] dark:border-[#3A3731] bg-[#EFECE4] dark:bg-[#141311] shadow-[inset_0_1px_2px_rgba(35,33,30,0.14)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.65)] hover:border-[#D94A2B] dark:hover:border-[#E85D3F]'
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
                strokeWidth="2.3"
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

          {/* Tiny Radial Stamp Ink Burst on Completion */}
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
                      initial={{ x: 0, y: 0, scale: 1, opacity: 0.9 }}
                      animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.42,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`absolute h-1 w-1 rounded-full ${
                        i % 2 === 0
                          ? 'bg-[#D94A2B] dark:bg-[#E85D3F]'
                          : 'bg-[#5B7553] dark:bg-[#74946A]'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Task Title with thin ink strikethrough + Zero-Pill inline metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="relative inline-block max-w-full">
            <span
              onClick={() => onToggleTask(task.id)}
              className={`block cursor-pointer text-sm leading-snug transition-colors ${
                task.completed
                  ? 'text-[#7A756B] dark:text-[#8C877D]'
                  : 'text-[#23211E] dark:text-[#ECE8DF]'
              }`}
            >
              {task.title}
            </span>
            {/* Smooth Thin Ink Strikethrough Line */}
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{
                width: task.completed ? '100%' : '0%',
                opacity: task.completed ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="pointer-events-none absolute left-0 top-1/2 h-[1.25px] -translate-y-1/2 bg-[#23211E]/65 dark:bg-[#ECE8DF]/60"
            />
          </div>

          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A756B] dark:text-[#8C877D]">
            <span className={getCategoryTextClass(task.category)}>{task.category}</span>
            <span aria-hidden="true" className="text-[#E4DFD3] dark:text-[#3A3731]">
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
            <span aria-hidden="true" className="text-[#E4DFD3] dark:text-[#3A3731]">
              ·
            </span>
            <span
              className={`font-mono tabular-nums ${
                isOverdue
                  ? 'text-[#D94A2B] dark:text-[#E85D3F] font-medium'
                  : task.dueDate === todayISO && !task.completed
                    ? 'text-[#5B7553] dark:text-[#74946A] font-medium'
                    : 'text-[#7A756B] dark:text-[#8C877D]'
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
        magneticStrength={0.3}
        onClick={() => onDeleteTask(task.id)}
        aria-label={`Delete task "${task.title}"`}
        className="relative z-10 shrink-0 rounded-md p-1.5 text-[#7A756B] dark:text-[#8C877D] opacity-75 transition-colors hover:bg-[#D94A2B]/10 hover:text-[#D94A2B] dark:hover:text-[#E85D3F] group-hover/row:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </MagneticButton>
    </div>
  );
};
