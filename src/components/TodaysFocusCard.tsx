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
      className="p-5 overflow-hidden"
    >
      {/* Subtle ambient top highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-48 w-96 rounded-full bg-emerald-500/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                Today&apos;s Focus
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
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
                  className="font-mono text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                >
                  {progressPercent}%
                </motion.span>
                <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-zinc-400">
                  ({completedToday}/{totalToday})
                </span>
              </div>
              <span className="block text-[11px] text-slate-400 dark:text-zinc-500">
                Daily Completion
              </span>
            </div>
          </div>
        </div>

        {/* Spring-animated progress bar track */}
        <div className="space-y-2">
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Today's task completion progress"
            className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 p-0.5 shadow-inner transition-colors duration-300"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 24 }}
              className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 via-emerald-600 to-emerald-500 dark:from-indigo-500 dark:via-emerald-500 dark:to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60"
              />
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-slate-800 dark:text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-mono tabular-nums">{completedToday}</span> completed
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <span className="font-mono tabular-nums">
                  {Math.max(0, totalToday - completedToday)}
                </span>{' '}
                remaining
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-300">
              <Flame className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span className="font-mono tabular-nums font-medium">{currentStreak}d</span>
              <span className="text-slate-600 dark:text-zinc-400">active streak</span>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
};
