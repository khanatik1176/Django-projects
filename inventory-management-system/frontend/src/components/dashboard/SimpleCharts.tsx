"use client";

import { cn } from "@/lib/utils";

export interface BarChartItem {
  id?: string | number;
  label: string;
  value: number;
  color?: string;
}

export function SimpleBarChart({
  items,
  valueFormatter = (v) => String(v),
  className,
}: {
  items: BarChartItem[];
  valueFormatter?: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const width = `${Math.max((item.value / max) * 100, 4)}%`;
        return (
          <div key={item.id ?? `${item.label}-${index}`}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-[#5c6b63]">{item.label}</span>
              <span className="shrink-0 font-semibold text-[#14201a]">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#ecf1ed]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width,
                  backgroundColor: item.color ?? "#0b6e4f",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SimpleDonutChart({
  items,
  size = 160,
}: {
  items: BarChartItem[];
  size?: number;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = items.map((item) => {
    const fraction = item.value / total;
    const dash = fraction * circumference;
    const segment = {
      ...item,
      dash,
      offset,
      fraction,
    };
    offset += dash;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <svg width={size} height={size} viewBox="0 0 140 140" className="shrink-0">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#ecf1ed"
          strokeWidth="18"
        />
        {segments.map((seg, index) => (
          <circle
            key={seg.id ?? `${seg.label}-${index}`}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={seg.color ?? "#0b6e4f"}
            strokeWidth="18"
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            transform="rotate(-90 70 70)"
          />
        ))}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-[#14201a] text-[15px] font-bold"
          style={{ fontSize: 15 }}
        >
          {total}
        </text>
        <text
          x="70"
          y="82"
          textAnchor="middle"
          className="fill-[#5c6b63]"
          style={{ fontSize: 10 }}
        >
          total
        </text>
      </svg>
      <div className="w-full space-y-2 sm:max-w-[12rem]">
        {segments.map((seg, index) => (
          <div key={seg.id ?? `${seg.label}-${index}`} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color ?? "#0b6e4f" }}
              />
              <span className="truncate text-[#5c6b63]">{seg.label}</span>
            </span>
            <span className="font-semibold text-[#14201a]">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniSparkline({
  values,
  color = "#0b6e4f",
  height = 48,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (values.length < 2) return null;

  const width = 200;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polyline
        fill={`${color}22`}
        stroke="none"
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  );
}
