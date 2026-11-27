import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Task, WeeklyDayStat } from '../types/productivity';
import { formatHumanDate } from '../data/seedData';
import { SpotlightCard } from './SpotlightCard';

interface WeeklySummaryCardProps {
  tasks: Task[];
  weeklyData: WeeklyDayStat[];
  isDark?: boolean;
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
  onToggleTask?: (id: string) => void;
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  tasks,
  weeklyData,
  isDark = true,
  isDimmed = false,
  onMouseEnterCard,
  onMouseLeaveCard,
  onToggleTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // 7-day completion metrics
  const totalCompleted = useMemo(
    () => weeklyData.reduce((acc, d) => acc + d.completed, 0),
    [weeklyData]
  );

  const totalPlanned = useMemo(
    () => weeklyData.reduce((acc, d) => acc + d.planned, 0),
    [weeklyData]
  );

  const weeklyRate = useMemo(
    () => (totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0),
    [totalCompleted, totalPlanned]
  );

  const dailyAverage = useMemo(
    () => (totalCompleted / Math.max(1, weeklyData.length)).toFixed(1),
    [totalCompleted, weeklyData.length]
  );

  const peakDay = useMemo(() => {
    if (weeklyData.length === 0) return null;
    return weeklyData.reduce((max, d) => (d.completed > max.completed ? d : max), weeklyData[0]);
  }, [weeklyData]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (weeklyData.length === 0) return 'Last 7 Days';
    const first = weeklyData[0]?.formattedDate ?? '';
    const last = weeklyData[weeklyData.length - 1]?.isToday
      ? 'Today'
      : weeklyData[weeklyData.length - 1]?.formattedDate ?? '';
    return `${first} – ${last}`;
  }, [weeklyData]);

  // High-priority tasks analysis
  const highPriorityTasks = useMemo(
    () => tasks.filter((t) => t.priority === 'High'),
    [tasks]
  );

  const highPriorityAddressed = useMemo(
    () => highPriorityTasks.filter((t) => t.completed),
    [highPriorityTasks]
  );

  const highPriorityRate = useMemo(
    () =>
      highPriorityTasks.length > 0
        ? Math.round((highPriorityAddressed.length / highPriorityTasks.length) * 100)
        : 100,
    [highPriorityAddressed.length, highPriorityTasks.length]
  );

  const maxDailyCompleted = useMemo(
    () => Math.max(1, ...weeklyData.map((d) => d.completed)),
    [weeklyData]
  );

  return (
    <SpotlightCard
      ariaLabel="Weekly Summary"
      isDark={isDark}
      isDimmed={isDimmed}
      onMouseEnterCard={onMouseEnterCard}
      onMouseLeaveCard={onMouseLeaveCard}
      className="p-5 overflow-hidden"
    >
      <div className="flex flex-col gap-4">
        {/* Card Header — Editorial Newsreader & Tactile Badge */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-[#D94A2B] dark:text-[#E85D3F]" />
              <h2 className="font-display text-base font-semibold tracking-tight text-[#23211E] dark:text-[#ECE8DF]">
                Weekly Summary
              </h2>
            </div>
            <p className="text-xs text-[#7A756B] dark:text-[#8C877D]">
              <span className="font-mono tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
                {dateRangeLabel}
              </span>{' '}
              · 7-day completion report & high-priority audit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#D5CFC0] dark:border-[#33312C] bg-[#EFECE4] dark:bg-[#141311] px-2 py-0.5 font-mono text-[11px] tabular-nums font-medium text-[#5B7553] dark:text-[#74946A]">
              <TrendingUp className="h-3 w-3" />
              <span>{weeklyRate}% rate</span>
            </span>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={isExpanded ? 'Collapse high-priority list' : 'Expand high-priority list'}
              className="inline-flex items-center justify-center rounded-[4px] border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] p-1 text-[#7A756B] hover:text-[#23211E] dark:text-[#8C877D] dark:hover:text-[#ECE8DF] transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </motion.button>
          </div>
        </div>

        {/* 3-Panel Minimalist Hardware Metrics Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* 1. Total Completed Tasks */}
          <div className="rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4]/50 dark:bg-[#141311]/60 p-3 shadow-[inset_0_1px_1px_rgba(35,33,30,0.03)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
            <div className="text-[11px] font-medium text-[#7A756B] dark:text-[#8C877D]">
              Total Completed
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
                {totalCompleted}
              </span>
              <span className="font-mono text-xs text-[#7A756B] dark:text-[#8C877D]">
                / {totalPlanned}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#5B7553] dark:text-[#74946A]">
              <span className="font-mono tabular-nums">{dailyAverage}</span> tasks / day avg
            </div>
          </div>

          {/* 2. High-Priority Tasks Addressed */}
          <div className="rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4]/50 dark:bg-[#141311]/60 p-3 shadow-[inset_0_1px_1px_rgba(35,33,30,0.03)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#7A756B] dark:text-[#8C877D]">
              <span>High-Priority</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#D94A2B] dark:bg-[#E85D3F]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold tabular-nums text-[#D94A2B] dark:text-[#E85D3F]">
                {highPriorityAddressed.length}
              </span>
              <span className="font-mono text-xs text-[#7A756B] dark:text-[#8C877D]">
                / {highPriorityTasks.length} addressed
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#7A756B] dark:text-[#8C877D]">
              <span className="font-mono tabular-nums font-medium text-[#23211E] dark:text-[#ECE8DF]">
                {highPriorityRate}%
              </span>{' '}
              addressed this cycle
            </div>
          </div>

          {/* 3. Peak Output Day */}
          <div className="rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4]/50 dark:bg-[#141311]/60 p-3 shadow-[inset_0_1px_1px_rgba(35,33,30,0.03)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#7A756B] dark:text-[#8C877D]">
              <span>Peak Day</span>
              <Flame className="h-3.5 w-3.5 text-[#D94A2B] dark:text-[#E85D3F]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
                {peakDay ? peakDay.completed : 0}
              </span>
              <span className="font-mono text-xs text-[#7A756B] dark:text-[#8C877D]">
                tasks ({peakDay ? peakDay.dayLabel : '—'})
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[#7A756B] dark:text-[#8C877D]">
              Highest single-day velocity
            </div>
          </div>
        </div>

        {/* 7-Day Tactile Micro Rhythm Strip */}
        <div className="rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4]/70 dark:bg-[#141311] p-3 shadow-[inset_0_1px_2px_rgba(35,33,30,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
          <div className="mb-2 flex items-center justify-between text-[11px] text-[#7A756B] dark:text-[#8C877D]">
            <span className="font-medium">7-Day Execution Rhythm</span>
            <span className="font-mono tabular-nums">{totalCompleted} total tasks</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weeklyData.map((day) => {
              const heightPct = Math.max(15, Math.round((day.completed / maxDailyCompleted) * 100));
              return (
                <div
                  key={day.fullDate}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <div className="flex h-10 w-full items-end justify-center rounded-[3px] bg-[#DCD6C8]/60 dark:bg-[#262420] p-0.5">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      title={`${day.dayLabel}: ${day.completed} completed / ${day.planned} planned`}
                      className={`w-full rounded-[2px] transition-colors ${
                        day.isToday
                          ? 'bg-[#D94A2B] dark:bg-[#E85D3F]'
                          : 'bg-[#5B7553] dark:bg-[#74946A]'
                      }`}
                    />
                  </div>

                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      day.isToday
                        ? 'font-semibold text-[#D94A2B] dark:text-[#E85D3F]'
                        : 'text-[#7A756B] dark:text-[#8C877D]'
                    }`}
                  >
                    {day.dayLabel}
                  </span>

                  <span className="font-mono text-[10px] tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
                    {day.completed}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-Priority Tasks Addressed Section (Expandable List) */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="high-priority-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[#E4DFD3] dark:border-[#2C2A26] pt-3.5">
                <div className="mb-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-[#23211E] dark:text-[#ECE8DF]">
                    <span>High-Priority Tasks Log</span>
                    <span className="rounded-[3px] bg-[#D94A2B]/10 dark:bg-[#E85D3F]/15 px-1.5 py-0.2 font-mono text-[10px] text-[#D94A2B] dark:text-[#E85D3F]">
                      {highPriorityAddressed.length} / {highPriorityTasks.length} Addressed
                    </span>
                  </div>

                  <span className="text-[11px] text-[#7A756B] dark:text-[#8C877D]">
                    {highPriorityTasks.length - highPriorityAddressed.length === 0
                      ? 'All cleared'
                      : `${highPriorityTasks.length - highPriorityAddressed.length} pending`}
                  </span>
                </div>

                {highPriorityTasks.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#E4DFD3] dark:border-[#2C2A26] py-4 text-center text-xs text-[#7A756B] dark:text-[#8C877D]">
                    No high-priority tasks in active queue.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#E4DFD3] dark:divide-[#2C2A26] rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A]">
                    {highPriorityTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-[#F6F3EC]/70 dark:hover:bg-[#161513]/60"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          {/* Interactive 'Stamp & Click' Checkbox Well */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                            onClick={() => onToggleTask?.(task.id)}
                            aria-label={
                              task.completed
                                ? `Mark "${task.title}" as incomplete`
                                : `Mark "${task.title}" as completed`
                            }
                            className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors cursor-pointer ${
                              task.completed
                                ? 'border-[#B83B1F] dark:border-[#C9482C] bg-[#D94A2B] dark:bg-[#E85D3F] text-[#FCFBF7] shadow-[0_1px_0_0_#9E3119]'
                                : 'border-[#D5CFC0] dark:border-[#3A3731] bg-[#EFECE4] dark:bg-[#141311] shadow-[inset_0_1px_2px_rgba(35,33,30,0.12)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] hover:border-[#D94A2B] dark:hover:border-[#E85D3F]'
                            }`}
                          >
                            {task.completed && <Check className="h-3 w-3 stroke-[2.5]" />}
                          </motion.button>

                          {/* Task Title & Metadata */}
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-xs transition-colors ${
                                task.completed
                                  ? 'text-[#7A756B] dark:text-[#8C877D] line-through decoration-[#7A756B]/50'
                                  : 'text-[#23211E] dark:text-[#ECE8DF]'
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#7A756B] dark:text-[#8C877D]">
                              <span className="font-medium">{task.category}</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">
                                Due {formatHumanDate(task.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="shrink-0 text-right">
                          {task.completed ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-[#5B7553] dark:text-[#74946A]">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Addressed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#D94A2B] dark:text-[#E85D3F]">
                              <AlertCircle className="h-3 w-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalist Field Note Footer */}
        <div className="flex items-center justify-between text-[11px] text-[#7A756B] dark:text-[#8C877D] border-t border-[#E4DFD3] dark:border-[#2C2A26] pt-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#5B7553] dark:text-[#74946A]" />
            <span>
              {highPriorityRate === 100
                ? 'All high-priority targets resolved.'
                : `${highPriorityTasks.length - highPriorityAddressed.length} high-priority tasks requiring focus.`}
            </span>
          </div>

          <span className="font-mono tabular-nums">
            {totalCompleted} completed this week
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
};
