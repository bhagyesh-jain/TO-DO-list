import React from 'react';
import { motion } from 'motion/react';
import { Award, CheckCheck, Flame } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';

interface KeyMetricCardsProps {
  currentStreak: number;
  completionRate: number;
  totalTasksDone: number;
  sixMonthPlannedTotal: number;
  isDark?: boolean;
  focusedWidget: string | null;
  onFocusWidget: (id: string | null) => void;
}

export const KeyMetricCards: React.FC<KeyMetricCardsProps> = ({
  currentStreak,
  completionRate,
  totalTasksDone,
  sixMonthPlannedTotal,
  isDark = true,
  focusedWidget,
  onFocusWidget,
}) => {
  return (
    <section
      aria-label="Key Productivity Metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {/* Current Streak */}
      <SpotlightCard
        as="div"
        isDark={isDark}
        isDimmed={focusedWidget !== null && focusedWidget !== 'kpi-streak'}
        onMouseEnterCard={() => onFocusWidget('kpi-streak')}
        onMouseLeaveCard={() => onFocusWidget(null)}
        className="p-4 overflow-hidden"
      >
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
            <span className="text-xs font-medium">Current Streak</span>
            <Flame className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.span
              key={currentStreak}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-zinc-100"
            >
              {currentStreak}
            </motion.span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              days
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
            Consecutive active days
          </p>
        </div>
      </SpotlightCard>

      {/* Completion Rate % */}
      <SpotlightCard
        as="div"
        isDark={isDark}
        isDimmed={focusedWidget !== null && focusedWidget !== 'kpi-rate'}
        onMouseEnterCard={() => onFocusWidget('kpi-rate')}
        onMouseLeaveCard={() => onFocusWidget(null)}
        className="p-4 overflow-hidden"
      >
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
            <span className="text-xs font-medium">Completion Rate</span>
            <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.span
              key={completionRate}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-zinc-100"
            >
              {completionRate}%
            </motion.span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              consistency
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
            Across {sixMonthPlannedTotal.toLocaleString()} scheduled tasks
          </p>
        </div>
      </SpotlightCard>

      {/* Total Tasks Done */}
      <SpotlightCard
        as="div"
        isDark={isDark}
        isDimmed={focusedWidget !== null && focusedWidget !== 'kpi-total'}
        onMouseEnterCard={() => onFocusWidget('kpi-total')}
        onMouseLeaveCard={() => onFocusWidget(null)}
        className="p-4 overflow-hidden"
      >
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
            <span className="text-xs font-medium">Total Tasks Done</span>
            <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.span
              key={totalTasksDone}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-zinc-100"
            >
              {totalTasksDone.toLocaleString()}
            </motion.span>
            <span className="text-xs text-slate-600 dark:text-zinc-400">
              completed
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
            Past 6 months + today
          </p>
        </div>
      </SpotlightCard>
    </section>
  );
};
