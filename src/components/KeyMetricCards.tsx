import React from 'react';
import { motion } from 'motion/react';
import { Award, CheckCheck, Flame } from 'lucide-react';

interface KeyMetricCardsProps {
  currentStreak: number;
  completionRate: number;
  totalTasksDone: number;
  sixMonthPlannedTotal: number;
}

export const KeyMetricCards: React.FC<KeyMetricCardsProps> = ({
  currentStreak,
  completionRate,
  totalTasksDone,
  sixMonthPlannedTotal,
}) => {
  return (
    <section
      aria-label="Key Productivity Metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {/* Current Streak */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/65 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Current Streak</span>
          <Flame className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <motion.span
            key={currentStreak}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="font-mono text-2xl font-semibold tabular-nums text-slate-100"
          >
            {currentStreak}
          </motion.span>
          <span className="text-xs font-medium text-amber-400">days</span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Consecutive active days
        </p>
      </div>

      {/* Completion Rate % */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/65 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Completion Rate</span>
          <Award className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <motion.span
            key={completionRate}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="font-mono text-2xl font-semibold tabular-nums text-slate-100"
          >
            {completionRate}%
          </motion.span>
          <span className="text-xs text-emerald-400">consistency</span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Across {sixMonthPlannedTotal.toLocaleString()} scheduled tasks
        </p>
      </div>

      {/* Total Tasks Done */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/65 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Total Tasks Done</span>
          <CheckCheck className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <motion.span
            key={totalTasksDone}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="font-mono text-2xl font-semibold tabular-nums text-slate-100"
          >
            {totalTasksDone.toLocaleString()}
          </motion.span>
          <span className="text-xs text-slate-400">completed</span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Past 6 months + today
        </p>
      </div>
    </section>
  );
};
