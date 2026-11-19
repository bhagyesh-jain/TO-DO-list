import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, PieChart } from 'lucide-react';
import { CategoryStat, TaskCategory, WeeklyDayStat } from '../types/productivity';

interface AnalyticsChartsProps {
  weeklyData: WeeklyDayStat[];
  categoryStats: CategoryStat[];
  selectedCategoryFilter: 'All' | TaskCategory;
  onSelectCategoryFromChart: (cat: 'All' | TaskCategory) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  weeklyData,
  categoryStats,
  selectedCategoryFilter,
  onSelectCategoryFromChart,
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

  // Donut SVG geometry
  const totalTasks = categoryStats.reduce((acc, c) => acc + c.total, 0);
  const totalCompletedTasks = categoryStats.reduce((acc, c) => acc + c.completed, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const donutSegments = categoryStats.map((stat) => {
    const ratio = totalTasks > 0 ? stat.total / totalTasks : 0;
    const dashLength = ratio * circumference;
    const segment = {
      ...stat,
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
    <div className="grid grid-cols-1 gap-4">
      {/* 1. Weekly Completion Bar Chart */}
      <section
        aria-label="Weekly Completion Bar Chart"
        className="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-900/65 p-5 backdrop-blur-md"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h2 className="font-display text-sm font-semibold text-slate-100">
                Weekly Completion
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Planned vs. completed tasks over the last 7 days (
              <span className="font-mono tabular-nums text-emerald-400">{weeklyRate}%</span> weekly
              completion)
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-700" />
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="pt-2">
          <div className="grid h-44 grid-cols-7 items-end gap-2.5 border-b border-slate-800/80 pb-2 px-1">
            {weeklyData.map((day) => {
              const plannedHeightPct = Math.round((day.planned / maxWeeklyTasks) * 100);
              const completedHeightPct = Math.round((day.completed / maxWeeklyTasks) * 100);
              const isHovered = hoveredDay?.fullDate === day.fullDate;

              return (
                <div
                  key={day.fullDate}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="group flex h-full flex-col items-center justify-end gap-2 cursor-pointer"
                >
                  {/* Numeric Value Label on Hover / Today */}
                  <div className="font-mono text-[10px] tabular-nums text-slate-400 transition-colors group-hover:text-slate-100">
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
                        isHovered ? 'bg-slate-600' : 'bg-slate-700/85'
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
                          ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                          : isHovered
                            ? 'bg-emerald-400'
                            : 'bg-emerald-500/90'
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
                    day.isToday ? 'font-semibold text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-slate-500">
                  {day.isToday ? 'Today' : day.formattedDate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Inspection Readout */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/75 px-3.5 py-2 text-xs">
          {hoveredDay ? (
            <>
              <span className="font-mono text-slate-200">
                {hoveredDay.dayLabel}, {hoveredDay.formattedDate}
                {hoveredDay.isToday ? ' (Today)' : ''}
              </span>
              <span className="font-mono tabular-nums text-emerald-400">
                {hoveredDay.completed} of {hoveredDay.planned} tasks completed (
                {hoveredDay.planned > 0
                  ? Math.round((hoveredDay.completed / hoveredDay.planned) * 100)
                  : 0}
                %)
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-400">7-day total execution summary</span>
              <span className="font-mono tabular-nums text-slate-200">
                {weeklyCompletedSum} completed · {weeklyPlannedSum} planned
              </span>
            </>
          )}
        </div>
      </section>

      {/* 2. Category Breakdown Donut Chart */}
      <section
        aria-label="Category Breakdown Donut Chart"
        className="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-900/65 p-5 backdrop-blur-md"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-400" />
              <h2 className="font-display text-sm font-semibold text-slate-100">
                Category Breakdown
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Task concentration across Work, Personal, and Health · Click a category to filter
            </p>
          </div>

          {selectedCategoryFilter !== 'All' && (
            <button
              type="button"
              onClick={() => onSelectCategoryFromChart('All')}
              className="whitespace-nowrap shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Show All Categories
            </button>
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
                stroke="rgba(30, 41, 59, 0.8)"
                strokeWidth="16"
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
                    stroke={seg.strokeColor}
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
                  <span className="font-mono text-2xl font-semibold tabular-nums text-slate-100">
                    {activeCategoryStat.percentage}%
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {activeCategoryStat.category}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-slate-500">
                    {activeCategoryStat.completed}/{activeCategoryStat.total} done
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-2xl font-semibold tabular-nums text-slate-100">
                    {totalTasks}
                  </span>
                  <span className="text-xs text-slate-400">Active Queue</span>
                  <span className="font-mono text-[10px] tabular-nums text-emerald-400">
                    {totalCompletedTasks} done
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Category Breakdown Table */}
          <div className="flex flex-col divide-y divide-slate-800/70 sm:col-span-7">
            {categoryStats.map((stat) => {
              const isSelected = selectedCategoryFilter === stat.category;
              const completionPct =
                stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;

              return (
                <button
                  key={stat.category}
                  type="button"
                  onMouseEnter={() => setHoveredCategory(stat.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() =>
                    onSelectCategoryFromChart(
                      selectedCategoryFilter === stat.category ? 'All' : stat.category
                    )
                  }
                  className={`flex items-center justify-between gap-3 py-2.5 px-2.5 text-left transition-colors rounded-lg cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 text-slate-100'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: stat.strokeColor }}
                      className="h-3 w-3 shrink-0 rounded-xs"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{stat.category}</div>
                      <div className="font-mono text-[11px] tabular-nums text-slate-400">
                        {stat.completed} of {stat.total} completed ({completionPct}%)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold tabular-nums text-slate-100">
                      {stat.percentage}%
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-slate-500">
                      share
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
