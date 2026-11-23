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

// 5-tier color scale mapped through Moss / Matcha Growth Accent (#5B7553 in Light Washi, #74946A in Dark Sumi)
const LIGHT_HEATMAP_SCALE = ['#EFECE4', '#C8D6C2', '#9BB593', '#77966E', '#5B7553'];
const DARK_HEATMAP_SCALE = ['#161513', '#2B3528', '#41523B', '#597251', '#74946A'];

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
      return isDark ? 'rgba(22, 21, 19, 0.45)' : 'rgba(239, 236, 228, 0.55)';
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
        {/* Floating Field Journal Tooltip above hovered keycap cell */}
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
              className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] px-3 py-1.5 text-[11px] shadow-[0_8px_20px_-4px_rgba(35,33,30,0.16)] dark:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.75)]"
            >
              <div className="flex items-center gap-1.5 font-mono tabular-nums font-semibold text-[#23211E] dark:text-[#ECE8DF]">
                <span>
                  {hoveredCell.completedCount}{' '}
                  {hoveredCell.completedCount === 1 ? 'task' : 'tasks'}
                </span>
                <span className="text-[#7A756B] dark:text-[#8C877D]">·</span>
                <span className="font-normal text-[#7A756B] dark:text-[#8C877D]">
                  {formatFullTooltipDate(hoveredCell.date)}
                  {hoveredCell.isToday ? ' (Today)' : ''}
                </span>
              </div>
              <div className="text-[10px] font-medium text-[#5B7553] dark:text-[#74946A]">
                {getIntensityLabel(hoveredCell.completedCount)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#5B7553] dark:text-[#74946A]" />
              <h2 className="font-display text-base font-semibold tracking-tight text-[#23211E] dark:text-[#ECE8DF]">
                6-Month Activity Heatmap
              </h2>
            </div>
            <p className="text-xs text-[#7A756B] dark:text-[#8C877D]">
              <span className="font-mono tabular-nums font-medium text-[#23211E] dark:text-[#ECE8DF]">
                {totalSixMonthCompletions.toLocaleString()}
              </span>{' '}
              tasks completed across{' '}
              <span className="font-mono tabular-nums font-medium text-[#23211E] dark:text-[#ECE8DF]">
                {activeDaysCount}
              </span>{' '}
              active days in the last 26 weeks
            </p>
          </div>

          {/* 5-Tier Beveled Keycap Intensity Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#7A756B] dark:text-[#8C877D]">
            <span>Less</span>
            {scaleColors.map((hex, idx) => (
              <span
                key={hex}
                title={`Level ${idx}`}
                style={{ backgroundColor: hex }}
                className="h-3 w-3 rounded-[3px] border border-[#D5CFC0] dark:border-[#33312C] shadow-[0_1px_0_0_rgba(35,33,30,0.12),inset_0_1px_0_0_rgba(255,255,255,0.22)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-colors duration-300"
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Matrix */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[520px]">
            {/* Month Labels Row */}
            <div className="mb-1.5 flex pl-8 text-[11px] text-[#7A756B] dark:text-[#8C877D]">
              <div className="relative h-4 w-full">
                {monthHeaders.map((m) => (
                  <span
                    key={`${m.label}-${m.weekIndex}`}
                    style={{ left: `${(m.weekIndex / weeks.length) * 100}%` }}
                    className="absolute top-0 whitespace-nowrap font-mono tabular-nums text-[11px]"
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              {/* Day-of-week labels */}
              <div className="grid grid-rows-7 gap-1.5 pr-1 text-[10px] font-mono tabular-nums text-[#7A756B] dark:text-[#8C877D]">
                <span className="h-3.5 leading-3.5 opacity-0">Sun</span>
                <span className="h-3.5 leading-3.5">Mon</span>
                <span className="h-3.5 leading-3.5 opacity-0">Tue</span>
                <span className="h-3.5 leading-3.5">Wed</span>
                <span className="h-3.5 leading-3.5 opacity-0">Thu</span>
                <span className="h-3.5 leading-3.5">Fri</span>
                <span className="h-3.5 leading-3.5 opacity-0">Sat</span>
              </div>

              {/* 26 Week Columns — Beveled Keycap Cells */}
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
                          whileHover={cell.isFuture ? undefined : { scale: 1.22, y: -1 }}
                          whileTap={cell.isFuture ? undefined : { scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 25 }}
                          onMouseEnter={(e) => handleCellEnter(cell, e)}
                          onFocus={(e) => handleCellEnter(cell, e)}
                          onMouseLeave={handleCellLeave}
                          aria-label={`${formatFullTooltipDate(cell.date)}: ${cell.completedCount} tasks completed`}
                          style={{ backgroundColor: fillHex }}
                          className={`relative h-3.5 w-full rounded-[3px] border border-[#D5CFC0]/80 dark:border-[#2C2A26] shadow-[0_1px_0_0_rgba(35,33,30,0.14),inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-colors duration-200 ${
                            cell.isToday
                              ? 'ring-2 ring-[#D94A2B] dark:ring-[#E85D3F] ring-offset-1 ring-offset-[#FCFBF7] dark:ring-offset-[#1E1D1A] z-10'
                              : isSelected
                                ? 'ring-1 ring-[#23211E] dark:ring-[#ECE8DF] z-20'
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

        {/* Recessed Status Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#EFECE4]/75 dark:bg-[#141311] px-3.5 py-2.5 text-xs shadow-[inset_0_1px_2px_rgba(35,33,30,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-300">
          {hoveredCell ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums font-medium text-[#23211E] dark:text-[#ECE8DF]">
                  {formatFullTooltipDate(hoveredCell.date)}
                  {hoveredCell.isToday ? ' (Today — Live)' : ''}
                </span>
                <span aria-hidden="true" className="text-[#7A756B] dark:text-[#8C877D]">
                  ·
                </span>
                <span className="text-[#7A756B] dark:text-[#8C877D]">
                  {getIntensityLabel(hoveredCell.completedCount)}
                </span>
              </div>
              <div className="font-mono tabular-nums font-medium text-[#5B7553] dark:text-[#74946A]">
                {hoveredCell.completedCount} completed{' '}
                <span className="text-[#7A756B] dark:text-[#8C877D]">
                  / {Math.max(hoveredCell.completedCount, hoveredCell.plannedCount)} planned
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="text-[#7A756B] dark:text-[#8C877D]">
                Hover any keycap tile to inspect daily field log output.
              </span>
              <span className="font-mono tabular-nums font-medium text-[#D94A2B] dark:text-[#E85D3F]">
                Today: {todayCompletedCount} completed
              </span>
            </>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
};
