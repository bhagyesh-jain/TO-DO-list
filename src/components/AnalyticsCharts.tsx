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

  // Dynamic theme hairline gridline & track colors (#2C2A26 Sumi Dark / #E4DFD3 Washi Light)
  const gridlineColor = isDark ? '#2C2A26' : '#E4DFD3';
  const donutTrackStroke = isDark ? '#2C2A26' : '#E4DFD3';

  // Donut SVG geometry
  const totalTasks = categoryStats.reduce((acc, c) => acc + c.total, 0);
  const totalCompletedTasks = categoryStats.reduce((acc, c) => acc + c.completed, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const donutSegments = categoryStats.map((stat) => {
    const ratio = totalTasks > 0 ? stat.total / totalTasks : 0;
    const dashLength = ratio * circumference;
    // Washi / Sumi palette: Work -> Vermilion, Health -> Moss/Matcha, Personal -> Warm Ochre
    const themeStroke =
      stat.category === 'Work'
        ? isDark
          ? '#E85D3F'
          : '#D94A2B'
        : stat.category === 'Health'
          ? isDark
            ? '#74946A'
            : '#5B7553'
          : isDark
            ? '#D99B3E'
            : '#C4842D';

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
                <BarChart3 className="h-4 w-4 text-[#D94A2B] dark:text-[#E85D3F]" />
                <h2 className="font-display text-base font-semibold tracking-tight text-[#23211E] dark:text-[#ECE8DF]">
                  Weekly Completion
                </h2>
              </div>
              <p className="text-xs text-[#7A756B] dark:text-[#8C877D]">
                Planned vs. completed tasks over the last 7 days (
                <span className="font-mono tabular-nums font-medium text-[#5B7553] dark:text-[#74946A]">
                  {weeklyRate}%
                </span>{' '}
                weekly completion)
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs text-[#7A756B] dark:text-[#8C877D]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[2px] border border-[#C8C1B2] dark:border-[#3F3C36] bg-[#DCD6C8] dark:bg-[#32302B]" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[2px] border border-[#495E42] dark:border-[#88A87E]/40 bg-[#5B7553] dark:bg-[#74946A]" />
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Area with Theme-Aware Hairline Gridlines (#2C2A26 dark / #E4DFD3 light) */}
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
                    {/* Floating Matte Paper Bar Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.94 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                          className="pointer-events-none absolute -top-2 z-30 -translate-y-full whitespace-nowrap rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] px-2.5 py-1 text-[10px] font-mono tabular-nums shadow-[0_6px_16px_-4px_rgba(35,33,30,0.16)] dark:shadow-[0_10px_20px_-4px_rgba(0,0,0,0.75)]"
                        >
                          <span
                            className={`font-semibold ${
                              day.isToday
                                ? 'text-[#D94A2B] dark:text-[#E85D3F]'
                                : 'text-[#5B7553] dark:text-[#74946A]'
                            }`}
                          >
                            {day.completed}
                          </span>
                          <span className="text-[#7A756B] dark:text-[#8C877D]"> / </span>
                          <span className="text-[#23211E] dark:text-[#ECE8DF]">
                            {day.planned} tasks
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Numeric Value Label */}
                    <div className="font-mono text-[10px] tabular-nums text-[#7A756B] dark:text-[#8C877D] transition-colors group-hover:text-[#23211E] dark:group-hover:text-[#ECE8DF]">
                      {day.completed}/{day.planned}
                    </div>

                    {/* Paired Bars Container */}
                    <div className="flex h-32 w-full max-w-[42px] items-end justify-center gap-1.5 rounded-t-sm px-1">
                      {/* Planned Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(8, plannedHeightPct)}%` }}
                        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                        title={`${day.formattedDate}: ${day.planned} planned`}
                        className={`w-3.5 rounded-t-[2px] border-t border-x transition-colors ${
                          isHovered
                            ? 'border-[#B8B0A0] dark:border-[#4A463F] bg-[#CFC8B8] dark:bg-[#3D3A34]'
                            : 'border-[#CBC4B5] dark:border-[#3A3731] bg-[#DCD6C8] dark:bg-[#32302B]'
                        }`}
                      />

                      {/* Completed Bar (Beveled Keycap Column) */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(6, completedHeightPct)}%` }}
                        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                        title={`${day.formattedDate}: ${day.completed} completed`}
                        className={`w-3.5 rounded-t-[2px] border-t border-x shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28)] transition-colors ${
                          day.isToday
                            ? 'border-[#B83B1F] dark:border-[#C94529] bg-[#D94A2B] dark:bg-[#E85D3F]'
                            : isHovered
                              ? 'border-[#495E42] dark:border-[#88A87E] bg-[#6A8761] dark:bg-[#84A67A]'
                              : 'border-[#495E42] dark:border-[#5D7855] bg-[#5B7553] dark:bg-[#74946A]'
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
                    className={`font-mono tabular-nums text-xs ${
                      day.isToday
                        ? 'font-semibold text-[#D94A2B] dark:text-[#E85D3F]'
                        : 'text-[#23211E] dark:text-[#ECE8DF]'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-[#7A756B] dark:text-[#8C877D]">
                    {day.isToday ? 'Today' : day.formattedDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recessed Footer Inspection Readout */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4]/75 dark:bg-[#141311] px-3.5 py-2 text-xs shadow-[inset_0_1px_2px_rgba(35,33,30,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-300">
            {hoveredDay ? (
              <>
                <span className="font-mono tabular-nums font-medium text-[#23211E] dark:text-[#ECE8DF]">
                  {hoveredDay.dayLabel}, {hoveredDay.formattedDate}
                  {hoveredDay.isToday ? ' (Today)' : ''}
                </span>
                <span className="font-mono tabular-nums font-medium text-[#5B7553] dark:text-[#74946A]">
                  {hoveredDay.completed} of {hoveredDay.planned} tasks completed (
                  {hoveredDay.planned > 0
                    ? Math.round((hoveredDay.completed / hoveredDay.planned) * 100)
                    : 0}
                  %)
                </span>
              </>
            ) : (
              <>
                <span className="text-[#7A756B] dark:text-[#8C877D]">
                  7-day total execution summary
                </span>
                <span className="font-mono tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
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
                <PieChart className="h-4 w-4 text-[#5B7553] dark:text-[#74946A]" />
                <h2 className="font-display text-base font-semibold tracking-tight text-[#23211E] dark:text-[#ECE8DF]">
                  Category Breakdown
                </h2>
              </div>
              <p className="text-xs text-[#7A756B] dark:text-[#8C877D]">
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
                className="whitespace-nowrap shrink-0 text-xs font-medium text-[#D94A2B] dark:text-[#E85D3F] hover:underline cursor-pointer"
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
                    <span className="font-mono text-2xl font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
                      {activeCategoryStat.percentage}%
                    </span>
                    <span className="text-xs font-medium text-[#23211E] dark:text-[#ECE8DF]">
                      {activeCategoryStat.category}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-[#7A756B] dark:text-[#8C877D]">
                      {activeCategoryStat.completed}/{activeCategoryStat.total} done
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-2xl font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
                      {totalTasks}
                    </span>
                    <span className="text-xs text-[#7A756B] dark:text-[#8C877D]">
                      Active Queue
                    </span>
                    <span className="font-mono text-[10px] tabular-nums font-medium text-[#5B7553] dark:text-[#74946A]">
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
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onMouseEnter={() => setHoveredCategory(stat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() =>
                      onSelectCategoryFromChart(
                        selectedCategoryFilter === stat.category ? 'All' : stat.category
                      )
                    }
                    className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#D94A2B]/60 dark:border-[#E85D3F]/60 bg-[#EFECE4] dark:bg-[#262420] text-[#23211E] dark:text-[#ECE8DF] shadow-[0_1px_0_0_rgba(35,33,30,0.08)]'
                        : 'border-[#E4DFD3] dark:border-[#2C2A26] bg-[#F6F3EC]/70 dark:bg-[#161513]/70 hover:border-[#CFC8B8] dark:hover:border-[#3A3731] hover:bg-[#EFECE4]/80 dark:hover:bg-[#262420]/70 text-[#23211E] dark:text-[#ECE8DF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{ backgroundColor: stat.themeStroke }}
                        className="h-3 w-3 shrink-0 rounded-[2px] border border-black/10 dark:border-white/15 shadow-[0_1px_0_0_rgba(0,0,0,0.15)]"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#23211E] dark:text-[#ECE8DF]">
                          {stat.category}
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-[#7A756B] dark:text-[#8C877D]">
                          {stat.completed} of {stat.total} completed ({completionPct}%)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold tabular-nums text-[#23211E] dark:text-[#ECE8DF]">
                        {stat.percentage}%
                      </div>
                      <div className="font-mono text-[11px] tabular-nums text-[#7A756B] dark:text-[#8C877D]">
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
