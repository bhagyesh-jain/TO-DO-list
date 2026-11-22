import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, PieChart } from 'lucide-react';
import { CategoryStat, TaskCategory, WeeklyDayStat } from '../types/productivity';
import { SpotlightCard } from './SpotlightCard';

interface AnalyticsChartsProps {
  weeklyData: WeeklyDayStat[];
  categoryStats: CategoryStat[];
  selectedCategoryFilter: 'All' | TaskCategory;
  onSelectCategoryFromChart: (cat: 'All' | TaskCategory) => void;
  isDark?: boolean;
  focusedWidget: string | null;
  onFocusWidget: (id: string | null) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  weeklyData,
  categoryStats,
  selectedCategoryFilter,
  onSelectCategoryFromChart,
  isDark = true,
  focusedWidget,
  onFocusWidget,
}) => {
  const [hoveredDay, setHoveredDay] = useState<WeeklyDayStat | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<TaskCategory | null>(null);

  const maxWeeklyTasks = Math.max(
    8,
    ...weeklyData.map((d) => Math.max(d.planned, d.completed))
  );

  const weeklyPlannedSum = weeklyData.reduce((acc, d) => acc + d.planned, 0);
  const weeklyCompletedSum = weeklyData.reduce((acc, d) => acc + d.completed, 0);
  const weeklyRate =
    weeklyPlannedSum > 0 ? Math.round((weeklyCompletedSum / weeklyPlannedSum) * 100) : 0;

  // Dynamic theme gridline & track colors (#27272A dark / #E2E8F0 light)
  const gridlineColor = isDark ? '#27272A' : '#E2E8F0';
  const donutTrackStroke = isDark ? '#27272A' : '#E2E8F0';

  // Donut SVG geometry
  const totalTasks = categoryStats.reduce((acc, c) => acc + c.total, 0);
  const totalCompletedTasks = categoryStats.reduce((acc, c) => acc + c.completed, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const donutSegments = categoryStats.map((stat) => {
    const ratio = totalTasks > 0 ? stat.total / totalTasks : 0;
    const dashLength = ratio * circumference;
    // Deepen accents slightly in Light Mode (#059669 emerald, #4F46E5 indigo)
    const themeStroke =
      stat.category === 'Work'
        ? isDark
          ? '#6366F1'
          : '#4F46E5'
        : stat.category === 'Health'
          ? isDark
            ? '#10B981'
            : '#059669'
          : isDark
            ? '#A855F7'
            : '#9333EA';

    const segment = {
      ...stat,
      themeStroke,
      dashArray: `${Math.max(0, dashLength - 3)} ${circumference}`,
      dashOffset: -cumulativeOffset,
    };
    cumulativeOffset += dashLength;
    return segment;
  });

  const activeCategoryStat =
    categoryStats.find((c) => c.category === hoveredCategory) ||
    categoryStats.find((c) => c.category === selectedCategoryFilter);

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* 1. Weekly Completion Bar Chart */}
      <SpotlightCard
        ariaLabel="Weekly Completion Bar Chart"
        isDark={isDark}
        isDimmed={focusedWidget !== null && focusedWidget !== 'chart-weekly'}
        onMouseEnterCard={() => onFocusWidget('chart-weekly')}
        onMouseLeaveCard={() => {
          setHoveredDay(null);
          onFocusWidget(null);
        }}
        className="p-5 overflow-hidden"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Weekly Completion
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Planned vs. completed tasks over the last 7 days (
                <span className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                  {weeklyRate}%
                </span>{' '}
                weekly completion)
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-300 dark:bg-zinc-700" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Area with Theme-Aware Gridlines (#27272A dark / #E2E8F0 light) */}
          <div className="relative pt-3">
            {/* Horizontal Reference Gridlines */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-3 bottom-8 flex flex-col justify-between"
            >
              {[0, 1, 2, 3].map((lineIdx) => (
                <div
                  key={lineIdx}
                  style={{ borderColor: gridlineColor }}
                  className="w-full border-b border-dashed transition-colors duration-300"
                />
              ))}
            </div>

            <div
              style={{ borderColor: gridlineColor }}
              className="relative z-10 grid h-44 grid-cols-7 items-end gap-2.5 border-b pb-2 px-1 transition-colors duration-300"
            >
              {weeklyData.map((day) => {
                const plannedHeightPct = Math.round((day.planned / maxWeeklyTasks) * 100);
                const completedHeightPct = Math.round((day.completed / maxWeeklyTasks) * 100);
                const isHovered = hoveredDay?.fullDate === day.fullDate;

                return (
                  <div
                    key={day.fullDate}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="group relative flex h-full flex-col items-center justify-end gap-2 cursor-pointer"
                  >
                    {/* Floating Glassmorphic Bar Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.94 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                          className="pointer-events-none absolute -top-2 z-30 -translate-y-full whitespace-nowrap rounded-lg border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 px-2.5 py-1 text-[10px] font-mono shadow-md backdrop-blur-xl"
                        >
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {day.completed}
                          </span>
                          <span className="text-slate-400 dark:text-zinc-500"> / </span>
                          <span className="text-slate-700 dark:text-zinc-300">
                            {day.planned} tasks
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Numeric Value Label */}
                    <div className="font-mono text-[10px] tabular-nums text-slate-500 dark:text-zinc-400 transition-colors group-hover:text-slate-900 dark:group-hover:text-zinc-100">
                      {day.completed}/{day.planned}
                    </div>

                    {/* Paired Bars Container */}
                    <div className="flex h-32 w-full max-w-[42px] items-end justify-center gap-1.5 rounded-t-md px-1">
                      {/* Planned Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(8, plannedHeightPct)}%` }}
                        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                        title={`${day.formattedDate}: ${day.planned} planned`}
                        className={`w-3.5 rounded-t-sm transition-colors ${
                          isHovered
                            ? 'bg-slate-400 dark:bg-zinc-600'
                            : 'bg-slate-300/90 dark:bg-zinc-700/85'
                        }`}
                      />

                      {/* Completed Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(6, completedHeightPct)}%` }}
                        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                        title={`${day.formattedDate}: ${day.completed} completed`}
                        className={`w-3.5 rounded-t-sm transition-colors ${
                          day.isToday
                            ? 'bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                            : isHovered
                              ? 'bg-emerald-500 dark:bg-emerald-400'
                              : 'bg-emerald-600 dark:bg-emerald-500/90'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="mt-2 grid grid-cols-7 gap-2.5 text-center">
              {weeklyData.map((day) => (
                <div key={day.fullDate} className="flex flex-col items-center">
                  <span
                    className={`font-mono text-xs ${
                      day.isToday
                        ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-slate-400 dark:text-zinc-500">
                    {day.isToday ? 'Today' : day.formattedDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Inspection Readout */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 px-3.5 py-2 text-xs transition-colors duration-300">
            {hoveredDay ? (
              <>
                <span className="font-mono font-medium text-slate-900 dark:text-zinc-200">
                  {hoveredDay.dayLabel}, {hoveredDay.formattedDate}
                  {hoveredDay.isToday ? ' (Today)' : ''}
                </span>
                <span className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                  {hoveredDay.completed} of {hoveredDay.planned} tasks completed (
                  {hoveredDay.planned > 0
                    ? Math.round((hoveredDay.completed / hoveredDay.planned) * 100)
                    : 0}
                  %)
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-600 dark:text-zinc-400">
                  7-day total execution summary
                </span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-zinc-200">
                  {weeklyCompletedSum} completed · {weeklyPlannedSum} planned
                </span>
              </>
            )}
          </div>
        </div>
      </SpotlightCard>

      {/* 2. Category Breakdown Donut Chart */}
      <SpotlightCard
        ariaLabel="Category Breakdown Donut Chart"
        isDark={isDark}
        isDimmed={focusedWidget !== null && focusedWidget !== 'chart-category'}
        onMouseEnterCard={() => onFocusWidget('chart-category')}
        onMouseLeaveCard={() => {
          setHoveredCategory(null);
          onFocusWidget(null);
        }}
        className="p-5 overflow-hidden"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Category Breakdown
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Task concentration across Work, Personal, and Health · Click a category to filter
              </p>
            </div>

            {selectedCategoryFilter !== 'All' && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => onSelectCategoryFromChart('All')}
                className="whitespace-nowrap shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Show All Categories
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center sm:col-span-5">
              <svg
                viewBox="0 0 160 160"
                className="h-40 w-40 -rotate-90 transform overflow-visible"
                role="img"
                aria-label="Category distribution donut chart"
              >
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={donutTrackStroke}
                  strokeWidth="16"
                  className="transition-colors duration-300"
                />

                {donutSegments.map((seg) => {
                  const isHighlighted =
                    hoveredCategory === seg.category || selectedCategoryFilter === seg.category;
                  return (
                    <motion.circle
                      key={seg.category}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={seg.themeStroke}
                      strokeWidth={isHighlighted ? 20 : 16}
                      strokeDasharray={seg.dashArray}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: seg.dashOffset }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      strokeLinecap="butt"
                      onMouseEnter={() => setHoveredCategory(seg.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() =>
                        onSelectCategoryFromChart(
                          selectedCategoryFilter === seg.category ? 'All' : seg.category
                        )
                      }
                      className="cursor-pointer transition-all duration-150"
                    />
                  );
                })}
              </svg>

              {/* Center Metric Label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                {activeCategoryStat ? (
                  <>
                    <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                      {activeCategoryStat.percentage}%
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      {activeCategoryStat.category}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-slate-400 dark:text-zinc-500">
                      {activeCategoryStat.completed}/{activeCategoryStat.total} done
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                      {totalTasks}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-zinc-400">
                      Active Queue
                    </span>
                    <span className="font-mono text-[10px] tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                      {totalCompletedTasks} done
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Category Breakdown Table */}
            <div className="flex flex-col gap-1.5 sm:col-span-7">
              {donutSegments.map((stat) => {
                const isSelected = selectedCategoryFilter === stat.category;
                const completionPct =
                  stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;

                return (
                  <motion.button
                    key={stat.category}
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onMouseEnter={() => setHoveredCategory(stat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() =>
                      onSelectCategoryFromChart(
                        selectedCategoryFilter === stat.category ? 'All' : stat.category
                      )
                    }
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500/40 dark:border-white/20 bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100'
                        : 'border-transparent bg-slate-100/50 dark:bg-zinc-800/35 hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-800/65 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{ backgroundColor: stat.themeStroke }}
                        className="h-3 w-3 shrink-0 rounded-xs"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          {stat.category}
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-zinc-400">
                          {stat.completed} of {stat.total} completed ({completionPct}%)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                        {stat.percentage}%
                      </div>
                      <div className="font-mono text-[11px] tabular-nums text-slate-400 dark:text-zinc-500">
                        share
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};
