import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Flame, Target } from 'lucide-react';
import { Task } from '../types/productivity';
import { SpotlightCard } from './SpotlightCard';

interface TodaysFocusCardProps {
  todayTasks: Task[];
  allTasks: Task[];
  currentStreak: number;
  isDark?: boolean;
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  todayTasks,
  allTasks,
  currentStreak,
  isDark = true,
  isDimmed = false,
  onMouseEnterCard,
  onMouseLeaveCard,
}) => {
  const targetTasks = todayTasks.length > 0 ? todayTasks : allTasks;
  const totalToday = targetTasks.length;
  const completedToday = targetTasks.filter((t) => t.completed).length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const remainingHighPriority = targetTasks.filter(
    (t) => !t.completed && t.priority === 'High'
  ).length;

  return (
    <SpotlightCard
      ariaLabel="Today's Focus Progress"
      isDark={isDark}
      isDimmed={isDimmed}
      onMouseEnterCard={onMouseEnterCard}
      onMouseLeaveCard={onMouseLeaveCard}
      className="p-6 overflow-hidden"
    >
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#D94A2B] dark:text-[#E85D3F]" />
              <h2 className="font-display text-xl font-medium tracking-tight text-[#23211E] dark:text-[#ECE8DF]">
                Today&apos;s Focus
              </h2>
            </div>
            <p className="text-xs text-[#7A756B] dark:text-[#8C877D]">
              {completedToday === totalToday && totalToday > 0
                ? 'All scheduled focus tasks completed for today.'
                : remainingHighPriority > 0
                  ? `${remainingHighPriority} high-priority ${remainingHighPriority === 1 ? 'task remains' : 'tasks remain'} in today's queue.`
                  : 'Stay consistent—complete your scheduled tasks to extend your daily streak.'}
            </p>
          </div>

          <div className="flex items-baseline gap-4">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <motion.span
                  key={progressPercent}
                  initial={{ y: -5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="font-mono text-2xl font-semibold tabular-nums text-[#5B7553] dark:text-[#74946A]"
                >
                  {progressPercent}%
                </motion.span>
                <span className="font-mono text-xs tabular-nums text-[#7A756B] dark:text-[#8C877D]">
                  ({completedToday}/{totalToday})
                </span>
              </div>
              <span className="block text-[11px] text-[#7A756B] dark:text-[#8C877D]">
                Daily Completion
              </span>
            </div>
          </div>
        </div>

        {/* Recessed Hardware Track + Calm Moss/Matcha Spring Progress Bar */}
        <div className="space-y-2.5">
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Today's task completion progress"
            className="h-3 w-full overflow-hidden rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4] dark:bg-[#141311] p-0.5 shadow-[inset_0_1px_2px_rgba(35,33,30,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.65)] transition-colors duration-300"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 24 }}
              className="relative h-full overflow-hidden rounded-[3px] bg-[#5B7553] dark:bg-[#74946A] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A756B] dark:text-[#8C877D]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[#23211E] dark:text-[#ECE8DF]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#5B7553] dark:text-[#74946A]" />
                <span className="font-mono tabular-nums font-medium">{completedToday}</span> completed
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <span className="font-mono tabular-nums">
                  {Math.max(0, totalToday - completedToday)}
                </span>{' '}
                remaining
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#23211E] dark:text-[#ECE8DF]">
              <Flame className="h-3.5 w-3.5 text-[#D94A2B] dark:text-[#E85D3F]" />
              <span className="font-mono tabular-nums font-semibold text-[#D94A2B] dark:text-[#E85D3F]">
                {currentStreak}d
              </span>
              <span className="text-[#7A756B] dark:text-[#8C877D]">active streak</span>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
};
