import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Plus } from 'lucide-react';
import { TaskCategory, TaskPriority } from '../types/productivity';
import { getOffsetDateISO, getTodayISO } from '../data/seedData';
import { MagneticButton, SpotlightCard } from './SpotlightCard';

interface TaskComposerProps {
  onAddTask: (task: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
  }) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isDark?: boolean;
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Personal', 'Health'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export const TaskComposer: React.FC<TaskComposerProps> = ({
  onAddTask,
  inputRef,
  isDark = true,
  isDimmed = false,
  onMouseEnterCard,
  onMouseLeaveCard,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState<string>(getTodayISO());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayISO = getTodayISO();
  const tomorrowISO = getOffsetDateISO(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setErrorMsg('Enter a task title before adding.');
      inputRef.current?.focus();
      return;
    }

    onAddTask({
      title: trimmed,
      category,
      priority,
      dueDate: dueDate || todayISO,
    });

    setTitle('');
    setErrorMsg(null);
  };

  return (
    <SpotlightCard
      as="div"
      ariaLabel="Quick-Add Task Composer"
      isDark={isDark}
      isDimmed={isDimmed}
      onMouseEnterCard={onMouseEnterCard}
      onMouseLeaveCard={onMouseLeaveCard}
      className="p-4 overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Main Input Row */}
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Add a new daily task... (Press Enter to save)"
            aria-label="Task title"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
          />

          <MagneticButton
            type="submit"
            withShimmer={true}
            magneticStrength={0.25}
            className="shrink-0 whitespace-nowrap rounded-lg border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-600 dark:bg-indigo-500 px-3.5 py-2 text-xs font-medium text-white shadow-[0_2px_10px_-2px_rgba(79,70,229,0.45)] dark:shadow-[0_0_20px_-4px_rgba(99,102,241,0.65),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-colors hover:bg-indigo-700 dark:hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </MagneticButton>
        </div>

        {errorMsg && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {errorMsg}
          </p>
        )}

        {/* Controls Bar: Category, Priority, Due Date with Sliding layoutId Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 dark:border-white/10 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-zinc-500">Category:</span>
              <div
                role="group"
                aria-label="Select task category"
                className="flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 p-0.5 transition-colors duration-300"
              >
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setCategory(cat)}
                      className={`relative whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="composer-category-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          className="absolute inset-0 rounded-md border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-600 dark:bg-indigo-500 shadow-xs"
                        />
                      )}
                      <span className="relative z-10">{cat}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-zinc-500">Priority:</span>
              <div
                role="group"
                aria-label="Select task priority"
                className="flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 p-0.5 transition-colors duration-300"
              >
                {PRIORITIES.map((prio) => {
                  const active = priority === prio;
                  const activePillColor =
                    prio === 'High'
                      ? 'bg-rose-500/15 dark:bg-rose-500/25 border-rose-500/40'
                      : prio === 'Medium'
                        ? 'bg-amber-500/15 dark:bg-amber-500/25 border-amber-500/40'
                        : 'bg-white dark:bg-zinc-700/80 border-slate-300 dark:border-white/15';
                  const activeTextColor =
                    prio === 'High'
                      ? 'text-rose-700 dark:text-rose-200'
                      : prio === 'Medium'
                        ? 'text-amber-700 dark:text-amber-200'
                        : 'text-slate-900 dark:text-zinc-100';

                  return (
                    <motion.button
                      key={prio}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setPriority(prio)}
                      className={`relative whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? activeTextColor
                          : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="composer-priority-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          className={`absolute inset-0 rounded-md border ${activePillColor}`}
                        />
                      )}
                      <span className="relative z-10">{prio}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Due Date Selector */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
            <div className="flex items-center gap-1">
              {[
                {
                  label: 'Today',
                  iso: todayISO,
                  activeText: 'text-emerald-700 dark:text-emerald-300',
                },
                {
                  label: 'Tomorrow',
                  iso: tomorrowISO,
                  activeText: 'text-indigo-700 dark:text-indigo-300',
                },
              ].map((preset) => {
                const active = dueDate === preset.iso;
                return (
                  <motion.button
                    key={preset.label}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => setDueDate(preset.iso)}
                    className={`relative whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                      active
                        ? `${preset.activeText} font-medium`
                        : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="composer-duedate-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className="absolute inset-0 rounded-md border border-slate-200/80 dark:border-white/10 bg-slate-100/90 dark:bg-zinc-800/90"
                      />
                    )}
                    <span className="relative z-10">{preset.label}</span>
                  </motion.button>
                );
              })}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Custom due date"
                className="rounded-md border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 px-2 py-1 font-mono text-xs tabular-nums text-slate-800 dark:text-zinc-300 transition-colors focus:border-indigo-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>
    </SpotlightCard>
  );
};
