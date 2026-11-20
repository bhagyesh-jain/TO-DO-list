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
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Personal', 'Health'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export const TaskComposer: React.FC<TaskComposerProps> = ({
  onAddTask,
  inputRef,
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
      isDimmed={isDimmed}
      onMouseEnterCard={onMouseEnterCard}
      onMouseLeaveCard={onMouseLeaveCard}
      className="p-4"
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
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />

          <MagneticButton
            type="submit"
            withShimmer={true}
            magneticStrength={0.25}
            className="shrink-0 whitespace-nowrap rounded-lg border border-indigo-400/30 bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.65),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </MagneticButton>
        </div>

        {errorMsg && (
          <p role="alert" className="text-xs text-rose-400">
            {errorMsg}
          </p>
        )}

        {/* Controls Bar: Category, Priority, Due Date with Sliding layoutId Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Category:</span>
              <div
                role="group"
                aria-label="Select task category"
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-950/80 p-0.5"
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
                        active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="composer-category-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          className="absolute inset-0 rounded-md border border-indigo-400/30 bg-indigo-600/90 shadow-sm"
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
              <span className="text-zinc-500">Priority:</span>
              <div
                role="group"
                aria-label="Select task priority"
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-950/80 p-0.5"
              >
                {PRIORITIES.map((prio) => {
                  const active = priority === prio;
                  const activePillColor =
                    prio === 'High'
                      ? 'bg-rose-500/25 border-rose-500/40'
                      : prio === 'Medium'
                        ? 'bg-amber-500/25 border-amber-500/40'
                        : 'bg-zinc-800 border-white/15';
                  const activeTextColor =
                    prio === 'High'
                      ? 'text-rose-200'
                      : prio === 'Medium'
                        ? 'text-amber-200'
                        : 'text-zinc-100';

                  return (
                    <motion.button
                      key={prio}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setPriority(prio)}
                      className={`relative whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        active ? activeTextColor : 'text-zinc-400 hover:text-zinc-200'
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
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <div className="flex items-center gap-1">
              {[
                { label: 'Today', iso: todayISO, activeText: 'text-emerald-300' },
                { label: 'Tomorrow', iso: tomorrowISO, activeText: 'text-indigo-300' },
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
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="composer-duedate-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className="absolute inset-0 rounded-md border border-white/10 bg-zinc-800/90"
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
                className="rounded-md border border-white/10 bg-zinc-950/80 px-2 py-1 font-mono text-xs tabular-nums text-zinc-300 transition-colors focus:border-indigo-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>
    </SpotlightCard>
  );
};
