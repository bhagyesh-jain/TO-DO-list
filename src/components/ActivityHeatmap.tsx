import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';
import { DailyActivityRecord } from '../types/productivity';
import {
  formatFullTooltipDate,
  formatISODate,
  getTodayISO,
} from '../data/seedData';
import { SpotlightCard } from './SpotlightCard';

interface ActivityHeatmapProps {
  history: Record<string, DailyActivityRecord>;
  todayCompletedCount: number;
  todayPlannedCount: number;
  isDark?: boolean;
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

interface HeatmapCell {
  date: string;
  completedCount: number;
  plannedCount: number;
  isToday: boolean;
  isFuture: boolean;
}

interface TooltipCoords {
  x: number;
  y: number;
}

// 5-tier color scale mapped from #18181B -> #10B981 in Dark Mode and #F1F5F9 -> #059669 in Light Mode
const DARK_HEATMAP_SCALE = ['#18181B', '#064E3B', '#047857', '#059669', '#10B981'];
const LIGHT_HEATMAP_SCALE = ['#F1F5F9', '#A7F3D0', '#34D399', '#10B981', '#059669'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  history,
  todayCompletedCount,
  todayPlannedCount,
  isDark = true,
  isDimmed = false,
  onMouseEnterCard,
  onMouseLeaveCard,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState<TooltipCoords | null>(null);
  const todayISO = getTodayISO();

  const scaleColors = isDark ? DARK_HEATMAP_SCALE : LIGHT_HEATMAP_SCALE;

  // Build a 26-week (182-day) grid aligned by week columns (Sunday -> Saturday)
  const { weeks, monthHeaders, totalSixMonthCompletions, activeDaysCount } = useMemo(() => {
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const endOfGrid = new Date(today);
    endOfGrid.setDate(today.getDate() + (6 - todayDayOfWeek));

    const numWeeks = 26;
    const totalGridDays = numWeeks * 7;
    const startOfGrid = new Date(endOfGrid);
    startOfGrid.setDate(endOfGrid.getDate() - (totalGridDays - 1));

    const weekColumns: HeatmapCell[][] = [];
    const headers: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    let totalCompletions = 0;
    let activeDays = 0;

    for (let w = 0; w < numWeeks; w++) {
      const col: HeatmapCell[] = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startOfGrid);
        cellDate.setDate(startOfGrid.getDate() + w * 7 + d);
        const iso = formatISODate(cellDate);
        const isToday = iso === todayISO;
        const isFuture = iso > todayISO;

        const record = history[iso];
        const completedCount = isToday
          ? todayCompletedCount
          : isFuture
            ? 0
            : record?.completedCount ?? 0;
        const plannedCount = isToday
          ? todayPlannedCount
          : isFuture
            ? 0
            : record?.plannedCount ?? 0;

        if (!isFuture) {
          totalCompletions += completedCount;
          if (completedCount > 0) activeDays++;
        }

        if (d === 0) {
          const m = cellDate.getMonth();
          if (m !== lastMonth) {
            headers.push({
              weekIndex: w,
              label: cellDate.toLocaleDateString('en-US', { month: 'short' }),
            });
            lastMonth = m;
          }
        }

        col.push({
          date: iso,
          completedCount,
          plannedCount,
          isToday,
          isFuture,
        });
      }
      weekColumns.push(col);
    }

    return {
      weeks: weekColumns,
      monthHeaders: headers,
      totalSixMonthCompletions: totalCompletions,
      activeDaysCount: activeDays,
    };
  }, [history, todayCompletedCount, todayPlannedCount, todayISO]);

  const getCellFillColor = (cell: HeatmapCell): string => {
    if (cell.isFuture) {
      return isDark ? 'rgba(24, 24, 27, 0.35)' : 'rgba(241, 245, 249, 0.5)';
    }
    const count = cell.completedCount;
    if (count === 0) return scaleColors[0];
    if (count <= 2) return scaleColors[1];
    if (count <= 4) return scaleColors[2];
    if (count <= 6) return scaleColors[3];
    return scaleColors[4];
  };

  const getIntensityLabel = (count: number) => {
    if (count === 0) return 'No tasks completed';
    if (count <= 2) return 'Light momentum';
    if (count <= 4) return 'Steady output';
    if (count <= 6) return 'High execution';
    return 'Peak productivity day';
  };

  const handleCellEnter = (
    cell: HeatmapCell,
    e: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>
  ) => {
    if (cell.isFuture || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    const centerX = cellRect.left - containerRect.left + cellRect.width / 2;
    const topY = cellRect.top - containerRect.top;

    setHoveredCell(cell);
    setTooltipCoords({
      x: Math.min(Math.max(centerX, 95), containerRect.width - 95),
      y: topY,
    });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
    setTooltipCoords(null);
  };

  return (
    <SpotlightCard
      ariaLabel="6-Month Activity Heatmap"
      isDark={isDark}
      isDimmed={isDimmed}
      onMouseEnterCard={onMouseEnterCard}
      onMouseLeaveCard={() => {
        handleCellLeave();
        onMouseLeaveCard?.();
      }}
      className="p-5"
    >
      <div ref={containerRef} className="relative flex flex-col gap-4">
        {/* Floating Glassmorphic Tooltip above hovered heatmap cell */}
        <AnimatePresence>
          {hoveredCell && tooltipCoords && (
            <motion.div
              key="heatmap-floating-tooltip"
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              style={{
                left: `${tooltipCoords.x}px`,
                top: `${Math.max(8, tooltipCoords.y - 10)}px`,
              }}
              className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 px-3 py-1.5 text-[11px] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.75)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900 dark:text-zinc-100">
                <span>
                  {hoveredCell.completedCount}{' '}
                  {hoveredCell.completedCount === 1 ? 'task' : 'tasks'}
                </span>
                <span className="text-slate-400 dark:text-zinc-500">·</span>
                <span className="font-normal text-slate-600 dark:text-zinc-300">
                  {formatFullTooltipDate(hoveredCell.date)}
                  {hoveredCell.isToday ? ' (Today)' : ''}
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                {getIntensityLabel(hoveredCell.completedCount)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-zinc-100">
                6-Month Activity Heatmap
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-zinc-200">
                {totalSixMonthCompletions.toLocaleString()}
              </span>{' '}
              tasks completed across{' '}
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-zinc-200">
                {activeDaysCount}
              </span>{' '}
              active days in the last 26 weeks
            </p>
          </div>

          {/* 5-Tier Intensity Scale Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
            <span>Less</span>
            {scaleColors.map((hex, idx) => (
              <span
                key={hex}
                title={`Level ${idx}`}
                style={{ backgroundColor: hex }}
                className="h-3 w-3 rounded-[3px] border border-slate-300/70 dark:border-white/10 transition-colors duration-300"
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Matrix */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[520px]">
            {/* Month Labels Row */}
            <div className="mb-1.5 flex pl-8 text-[11px] text-slate-400 dark:text-zinc-500">
              <div className="relative h-4 w-full">
                {monthHeaders.map((m) => (
                  <span
                    key={`${m.label}-${m.weekIndex}`}
                    style={{ left: `${(m.weekIndex / weeks.length) * 100}%` }}
                    className="absolute top-0 whitespace-nowrap font-mono text-[11px]"
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              {/* Day-of-week labels */}
              <div className="grid grid-rows-7 gap-1.5 pr-1 text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                <span className="h-3.5 leading-3.5 opacity-0">Sun</span>
                <span className="h-3.5 leading-3.5">Mon</span>
                <span className="h-3.5 leading-3.5 opacity-0">Tue</span>
                <span className="h-3.5 leading-3.5">Wed</span>
                <span className="h-3.5 leading-3.5 opacity-0">Thu</span>
                <span className="h-3.5 leading-3.5">Fri</span>
                <span className="h-3.5 leading-3.5 opacity-0">Sat</span>
              </div>

              {/* 26 Week Columns */}
              <div className="grid flex-1 grid-cols-26 gap-1.5">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                    {week.map((cell) => {
                      const isSelected = hoveredCell?.date === cell.date;
                      const fillHex = getCellFillColor(cell);
                      return (
                        <motion.button
                          key={cell.date}
                          type="button"
                          disabled={cell.isFuture}
                          whileHover={cell.isFuture ? undefined : { scale: 1.25 }}
                          whileTap={cell.isFuture ? undefined : { scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onMouseEnter={(e) => handleCellEnter(cell, e)}
                          onFocus={(e) => handleCellEnter(cell, e)}
                          onMouseLeave={handleCellLeave}
                          aria-label={`${formatFullTooltipDate(cell.date)}: ${cell.completedCount} tasks completed`}
                          style={{ backgroundColor: fillHex }}
                          className={`relative h-3.5 w-full rounded-[3px] border border-slate-300/60 dark:border-white/[0.08] transition-colors duration-200 ${
                            cell.isToday
                              ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 z-10'
                              : isSelected
                                ? 'ring-1 ring-slate-900 dark:ring-white z-20'
                                : ''
                          } ${
                            cell.isFuture
                              ? 'cursor-default opacity-35'
                              : 'cursor-pointer'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs transition-colors duration-300">
          {hoveredCell ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">
                  {formatFullTooltipDate(hoveredCell.date)}
                  {hoveredCell.isToday ? ' (Today — Live)' : ''}
                </span>
                <span aria-hidden="true" className="text-slate-400 dark:text-zinc-500">
                  ·
                </span>
                <span className="text-slate-600 dark:text-zinc-400">
                  {getIntensityLabel(hoveredCell.completedCount)}
                </span>
              </div>
              <div className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                {hoveredCell.completedCount} completed{' '}
                <span className="text-slate-400 dark:text-zinc-500">
                  / {Math.max(hoveredCell.completedCount, hoveredCell.plannedCount)} planned
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="text-slate-600 dark:text-zinc-400">
                Hover any square to trigger a floating glassmorphic inspection tooltip.
              </span>
              <span className="font-mono tabular-nums font-medium text-indigo-600 dark:text-indigo-400">
                Today: {todayCompletedCount} completed
              </span>
            </>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
};
