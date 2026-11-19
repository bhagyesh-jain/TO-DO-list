import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';
import { DailyActivityRecord } from '../types/productivity';
import {
  formatFullTooltipDate,
  formatISODate,
  getTodayISO,
} from '../data/seedData';

interface ActivityHeatmapProps {
  history: Record<string, DailyActivityRecord>;
  todayCompletedCount: number;
  todayPlannedCount: number;
}

interface HeatmapCell {
  date: string;
  completedCount: number;
  plannedCount: number;
  isToday: boolean;
  isFuture: boolean;
  monthLabel?: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  history,
  todayCompletedCount,
  todayPlannedCount,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const todayISO = getTodayISO();

  // Build a 26-week (182-day) grid aligned by week columns (Sunday -> Saturday)
  const { weeks, monthHeaders, totalSixMonthCompletions, activeDaysCount } = useMemo(() => {
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 (Sun) .. 6 (Sat)
    // End of current week (Saturday)
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

  // 5-tier color intensity scale based on number of tasks completed per day
  const getIntensityClass = (cell: HeatmapCell) => {
    if (cell.isFuture) {
      return 'bg-slate-900/30 border-slate-800/30 opacity-35';
    }
    const count = cell.completedCount;
    if (count === 0) {
      return 'bg-slate-800/60 border-slate-800/90 hover:border-slate-600';
    }
    if (count <= 2) {
      return 'bg-emerald-950/90 border-emerald-800/70 hover:border-emerald-500';
    }
    if (count <= 4) {
      return 'bg-emerald-700/80 border-emerald-600/80 hover:border-emerald-400';
    }
    if (count <= 6) {
      return 'bg-emerald-500/90 border-emerald-400/90 hover:border-emerald-300';
    }
    return 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.35)]';
  };

  const getIntensityLabel = (count: number) => {
    if (count === 0) return 'No tasks completed';
    if (count <= 2) return 'Light momentum';
    if (count <= 4) return 'Steady output';
    if (count <= 6) return 'High execution';
    return 'Peak productivity day';
  };

  return (
    <section
      aria-label="6-Month Activity Heatmap"
      className="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-900/65 p-5 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-400" />
            <h2 className="font-display text-sm font-semibold text-slate-100">
              6-Month Activity Heatmap
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            <span className="font-mono tabular-nums text-slate-200">
              {totalSixMonthCompletions.toLocaleString()}
            </span>{' '}
            tasks completed across{' '}
            <span className="font-mono tabular-nums text-slate-200">{activeDaysCount}</span> active
            days in the last 26 weeks
          </p>
        </div>

        {/* Intensity Scale Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Less</span>
          <span
            title="0 tasks"
            className="h-3 w-3 rounded-[3px] border border-slate-800 bg-slate-800/60"
          />
          <span
            title="1–2 tasks"
            className="h-3 w-3 rounded-[3px] border border-emerald-800/70 bg-emerald-950/90"
          />
          <span
            title="3–4 tasks"
            className="h-3 w-3 rounded-[3px] border border-emerald-600/80 bg-emerald-700/80"
          />
          <span
            title="5–6 tasks"
            className="h-3 w-3 rounded-[3px] border border-emerald-400/90 bg-emerald-500/90"
          />
          <span
            title="7+ tasks"
            className="h-3 w-3 rounded-[3px] border border-emerald-300 bg-emerald-400"
          />
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[520px]">
          {/* Month Labels Row */}
          <div className="mb-1.5 flex pl-8 text-[11px] text-slate-500">
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
            <div className="grid grid-rows-7 gap-1.5 pr-1 text-[10px] font-mono text-slate-500">
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
                    return (
                      <motion.button
                        key={cell.date}
                        type="button"
                        disabled={cell.isFuture}
                        whileHover={cell.isFuture ? undefined : { scale: 1.22 }}
                        onMouseEnter={() => !cell.isFuture && setHoveredCell(cell)}
                        onFocus={() => !cell.isFuture && setHoveredCell(cell)}
                        aria-label={`${formatFullTooltipDate(cell.date)}: ${cell.completedCount} tasks completed`}
                        className={`h-3.5 w-full rounded-[3px] border transition-colors ${getIntensityClass(
                          cell
                        )} ${
                          cell.isToday
                            ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950'
                            : isSelected
                              ? 'ring-1 ring-slate-200'
                              : ''
                        } ${cell.isFuture ? 'cursor-default' : 'cursor-pointer'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Hover / Active Day Tooltip Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/75 px-3.5 py-2.5 text-xs">
        {hoveredCell ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-slate-200">
                {formatFullTooltipDate(hoveredCell.date)}
                {hoveredCell.isToday ? ' (Today — Live)' : ''}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-400">
                {getIntensityLabel(hoveredCell.completedCount)}
              </span>
            </div>
            <div className="font-mono tabular-nums text-emerald-400 font-medium">
              {hoveredCell.completedCount} completed{' '}
              <span className="text-slate-500">
                / {Math.max(hoveredCell.completedCount, hoveredCell.plannedCount)} planned
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="text-slate-400">
              Hover or focus any square above to inspect exact daily task completion counts.
            </span>
            <span className="font-mono tabular-nums text-indigo-400">
              Today: {todayCompletedCount} completed
            </span>
          </>
        )}
      </div>
    </section>
  );
};
