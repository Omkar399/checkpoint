"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { HeatmapEntry } from "@/lib/api/types";

interface ActivityHeatmapProps {
  data: HeatmapEntry[];
  year?: number;
  className?: string;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bucketClass(count: number): string {
  if (count <= 0) return "bg-primary/10";
  if (count === 1) return "bg-primary/30";
  if (count <= 3) return "bg-primary/60";
  return "bg-primary";
}

function formatPrettyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ActivityHeatmap({ data, year, className }: ActivityHeatmapProps) {
  const resolvedYear = year ?? new Date().getFullYear();

  const { weeks, monthLabels } = React.useMemo(() => {
    const countByDate = new Map<string, number>();
    for (const entry of data) {
      countByDate.set(entry.date, entry.count);
    }

    const start = new Date(resolvedYear, 0, 1);
    const end = new Date(resolvedYear, 11, 31);

    // Roll start back to the Sunday on or before Jan 1 so the grid is aligned to full weeks
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    // Roll end forward to the Saturday on or after Dec 31
    const gridEnd = new Date(end);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const totalDays =
      Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;
    const totalWeeks = totalDays / 7;

    type Cell = {
      date: string;
      count: number;
      inYear: boolean;
    } | null;

    const weeks: Cell[][] = [];
    const monthLabels: { weekIndex: number; label: string }[] = [];
    let lastLabeledMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + w * 7 + d);
        const inYear = date.getFullYear() === resolvedYear;
        if (!inYear) {
          col.push(null);
        } else {
          const key = formatDate(date);
          col.push({
            date: key,
            count: countByDate.get(key) ?? 0,
            inYear: true,
          });
        }
      }
      weeks.push(col);

      // Determine the first in-year date in this week to place a month label
      const firstInYear = col.find((c): c is NonNullable<Cell> => c !== null);
      if (firstInYear) {
        const month = Number(firstInYear.date.slice(5, 7)) - 1;
        if (month !== lastLabeledMonth && firstInYear.date.endsWith("01") === false) {
          // only place label when we're near the start of a month (day <= 7)
          const day = Number(firstInYear.date.slice(8, 10));
          if (day <= 7) {
            monthLabels.push({ weekIndex: w, label: MONTH_LABELS[month] });
            lastLabeledMonth = month;
          }
        } else if (month !== lastLabeledMonth) {
          monthLabels.push({ weekIndex: w, label: MONTH_LABELS[month] });
          lastLabeledMonth = month;
        }
      }
    }

    return { weeks, monthLabels };
  }, [data, resolvedYear]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {/* Weekday column */}
        <div
          className="grid shrink-0 pt-4 text-[10px] text-muted-foreground"
          style={{
            gridTemplateRows: "repeat(7, 12px)",
            rowGap: "2px",
          }}
          aria-hidden="true"
        >
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex h-3 items-center justify-end pr-1 leading-none"
            >
              {i % 2 === 1 ? label : ""}
            </div>
          ))}
        </div>

        {/* Main grid (months + cells) */}
        <div className="flex flex-col gap-1">
          {/* Month label row */}
          <div
            className="relative h-3 text-[10px] text-muted-foreground"
            style={{ width: `${weeks.length * 14}px` }}
            aria-hidden="true"
          >
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={`${weekIndex}-${label}`}
                className="absolute top-0 leading-none"
                style={{ left: `${weekIndex * 14}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Cell grid */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, 12px)`,
              gridTemplateRows: "repeat(7, 12px)",
              gridAutoFlow: "column",
              gap: "2px",
            }}
            role="grid"
            aria-label={`Activity heatmap for ${resolvedYear}`}
          >
            {weeks.flatMap((week, w) =>
              week.map((cell, d) => {
                if (!cell) {
                  return (
                    <div
                      key={`${w}-${d}`}
                      className="size-3"
                      aria-hidden="true"
                    />
                  );
                }
                return (
                  <div
                    key={`${w}-${d}`}
                    className={cn(
                      "size-3 rounded-[2px] ring-1 ring-foreground/5 transition-colors",
                      bucketClass(cell.count),
                    )}
                    title={`${formatPrettyDate(cell.date)}: ${cell.count} check-in${cell.count === 1 ? "" : "s"}`}
                    role="gridcell"
                    aria-label={`${cell.date}: ${cell.count} check-ins`}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <span className="size-3 rounded-[2px] bg-primary/10 ring-1 ring-foreground/5" />
        <span className="size-3 rounded-[2px] bg-primary/30 ring-1 ring-foreground/5" />
        <span className="size-3 rounded-[2px] bg-primary/60 ring-1 ring-foreground/5" />
        <span className="size-3 rounded-[2px] bg-primary ring-1 ring-foreground/5" />
        <span>More</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
