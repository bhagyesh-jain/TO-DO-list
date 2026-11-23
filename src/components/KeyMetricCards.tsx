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
          <div className="flex items-center justify-between text-[#7A756B] dark:text-[#8C877D]">
            <span className="text-xs font-medium">Current Streak</span>
            <Flame className="h-4 w-4 text-[#D94A2B] dark:text-[#E85D3F]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.span
              key={currentStreak}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="font-mono text-2xl font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]"
            >
              {currentStreak}
            </motion.span>
            <span className="font-mono text-xs font-medium text-[#D94A2B] dark:text-[#E85D3F]">
              days
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#7A756B] dark:text-[#8C877D]">
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
          <div className="flex items-center justify-between text-[#7A756B] dark:text-[#8C877D]">
            <span className="text-xs font-medium">Completion Rate</span>
            <Award className="h-4 w-4 text-[#5B7553] dark:text-[#74946A]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.span
              key={completionRate}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="font-mono text-2xl font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]"
            >
              {completionRate}%
            </motion.span>
            <span className="font-mono text-xs font-medium text-[#5B7553] dark:text-[#74946A]">
              consistency
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#7A756B] dark:text-[#8C877D]">
            Across <span className="font-mono tabular-nums">{sixMonthPlannedTotal.toLocaleString()}</span> scheduled tasks
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
          <div className="flex items-center justify-between text-[#7A756B] dark:text-[#8C877D]">
            <span className="text-xs font-medium">Total Tasks Done</span>
            <CheckCheck className="h-4 w-4 text-[#5B7553] dark:text-[#74946A]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.span
              key={totalTasksDone}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="font-mono text-2xl font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]"
            >
              {totalTasksDone.toLocaleString()}
            </motion.span>
            <span className="text-xs text-[#7A756B] dark:text-[#8C877D]">
              completed
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#7A756B] dark:text-[#8C877D]">
            Past 6 months + today
          </p>
        </div>
      </SpotlightCard>
    </section>
  );
};
