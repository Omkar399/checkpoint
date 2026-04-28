"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { HeatmapEntry } from "@/lib/api/types";

interface ActivityHeatmapProps {
  data: HeatmapEntry[];
  year?: number;
  className?: string;
  /** Show legend below the grid (default: true). */
  showLegend?: boolean;
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

export function ActivityHeatmap({
  data,
  year,
  className,
  showLegend = true,
}: ActivityHeatmapProps) {
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

      const firstInYear = col.find((c): c is NonNullable<Cell> => c !== null);
      if (firstInYear) {
        const month = Number(firstInYear.date.slice(5, 7)) - 1;
        const day = Number(firstInYear.date.slice(8, 10));
        if (month !== lastLabeledMonth && day <= 7) {
          monthLabels.push({ weekIndex: w, label: MONTH_LABELS[month] });
          lastLabeledMonth = month;
        }
      }
    }

    return { weeks, monthLabels };
  }, [data, resolvedYear]);

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {/* Month labels — positioned as a percentage of total weeks */}
      <div
        className="relative h-3 w-full text-[10px] text-muted-foreground"
        aria-hidden="true"
      >
        {monthLabels.map(({ weekIndex, label }) => (
          <span
            key={`${weekIndex}-${label}`}
            className="absolute top-0 leading-none"
            style={{ left: `${(weekIndex / weeks.length) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Cell grid — fills container width, cells stay square via aspectRatio. */}
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
          gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          gridAutoFlow: "column",
          gap: "2px",
          aspectRatio: `${weeks.length} / 7`,
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
                  className="rounded-[2px]"
                  aria-hidden="true"
                />
              );
            }
            return (
              <div
                key={`${w}-${d}`}
                className={cn(
                  "rounded-[2px] ring-1 ring-foreground/5 transition-colors",
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

      {showLegend ? (
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <span className="size-2.5 rounded-[2px] bg-primary/10 ring-1 ring-foreground/5" />
          <span className="size-2.5 rounded-[2px] bg-primary/30 ring-1 ring-foreground/5" />
          <span className="size-2.5 rounded-[2px] bg-primary/60 ring-1 ring-foreground/5" />
          <span className="size-2.5 rounded-[2px] bg-primary ring-1 ring-foreground/5" />
          <span>More</span>
        </div>
      ) : null}
    </div>
  );
}

export default ActivityHeatmap;
