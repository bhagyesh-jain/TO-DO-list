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
      className="p-5 overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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
            placeholder="Write a new field entry... (Press Enter to stamp)"
            aria-label="Task title"
            className="w-full bg-transparent text-sm text-[#23211E] dark:text-[#ECE8DF] placeholder-[#7A756B] dark:placeholder-[#8C877D] focus:outline-none"
          />

          {/* Precision Matte Vermilion Hardware Key */}
          <MagneticButton
            type="submit"
            withShimmer={true}
            magneticStrength={0.18}
            className="shrink-0 whitespace-nowrap rounded-lg border border-[#B83B1F] dark:border-[#C9482C] bg-[#D94A2B] dark:bg-[#E85D3F] px-3.5 py-2 text-xs font-medium text-[#FCFBF7] shadow-[0_2px_0_0_#9E3119,inset_0_1px_0_0_rgba(255,255,255,0.24)] active:translate-y-[1px] transition-colors hover:bg-[#C64123] dark:hover:bg-[#F0684B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94A2B]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </MagneticButton>
        </div>

        {errorMsg && (
          <p role="alert" className="text-xs text-[#D94A2B] dark:text-[#E85D3F]">
            {errorMsg}
          </p>
        )}

        {/* Controls Bar: Recessed Hardware Tracks with Sliding layoutId Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4DFD3] dark:border-[#2C2A26] pt-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#7A756B] dark:text-[#8C877D]">Category:</span>
              <div
                role="group"
                aria-label="Select task category"
                className="flex items-center gap-1 rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-0.5 shadow-[inset_0_1px_2px_rgba(35,33,30,0.08)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)] transition-colors duration-300"
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
                          ? 'text-[#23211E] dark:text-[#ECE8DF]'
                          : 'text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="composer-category-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          className="absolute inset-0 rounded-md border border-[#D5CFC0] dark:border-[#3A3731] bg-[#FCFBF7] dark:bg-[#262420] shadow-[0_1px_2px_rgba(35,33,30,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
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
              <span className="text-[#7A756B] dark:text-[#8C877D]">Priority:</span>
              <div
                role="group"
                aria-label="Select task priority"
                className="flex items-center gap-1 rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-0.5 shadow-[inset_0_1px_2px_rgba(35,33,30,0.08)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)] transition-colors duration-300"
              >
                {PRIORITIES.map((prio) => {
                  const active = priority === prio;
                  const activePillColor =
                    prio === 'High'
                      ? 'bg-[#D94A2B]/15 dark:bg-[#E85D3F]/20 border-[#D94A2B]/40 dark:border-[#E85D3F]/45'
                      : prio === 'Medium'
                        ? 'bg-[#C4842D]/15 dark:bg-[#D99B3E]/20 border-[#C4842D]/40 dark:border-[#D99B3E]/40'
                        : 'bg-[#FCFBF7] dark:bg-[#262420] border-[#D5CFC0] dark:border-[#3A3731]';
                  const activeTextColor =
                    prio === 'High'
                      ? 'text-[#B83B1F] dark:text-[#F07358]'
                      : prio === 'Medium'
                        ? 'text-[#9A631A] dark:text-[#E8B15A]'
                        : 'text-[#23211E] dark:text-[#ECE8DF]';

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
                          : 'text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="composer-priority-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          className={`absolute inset-0 rounded-md border shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${activePillColor}`}
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
            <Calendar className="h-3.5 w-3.5 text-[#7A756B] dark:text-[#8C877D]" />
            <div className="flex items-center gap-1 rounded-lg border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-0.5 shadow-[inset_0_1px_2px_rgba(35,33,30,0.08)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)]">
              {[
                {
                  label: 'Today',
                  iso: todayISO,
                  activeText: 'text-[#5B7553] dark:text-[#74946A]',
                },
                {
                  label: 'Tomorrow',
                  iso: tomorrowISO,
                  activeText: 'text-[#D94A2B] dark:text-[#E85D3F]',
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
                        ? `${preset.activeText} font-semibold`
                        : 'text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="composer-duedate-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className="absolute inset-0 rounded-md border border-[#D5CFC0] dark:border-[#3A3731] bg-[#FCFBF7] dark:bg-[#262420] shadow-2xs"
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
                className="rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] px-2 py-0.5 font-mono text-xs tabular-nums text-[#23211E] dark:text-[#ECE8DF] transition-colors focus:border-[#D94A2B] dark:focus:border-[#E85D3F] focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>
    </SpotlightCard>
  );
};
