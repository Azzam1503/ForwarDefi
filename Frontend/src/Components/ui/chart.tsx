"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // from shadcn setup

export interface ChartConfig {
  [key: string]: { label: string; color: string };
}

export function ChartContainer({
  children,
  config,
  className,
}: {
  children: React.ReactNode;
  config: ChartConfig;
  className?: string;
}) {
  const cssVars: Record<string, string> = {};
  Object.entries(config).forEach(([key, val]) => {
    cssVars[`--color-${key}`] = val.color;
  });

  return (
    <div className={cn("h-full w-full", className)} style={cssVars as any}>
      {children}
    </div>
  );
}

export function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border bg-white/90 p-2 shadow-md text-sm">
      <p className="font-medium">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="text-gray-600">{p.name}</span>
            <span
              className="font-semibold"
              style={{ color: p.color || "black" }}
            >
              {p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegendContent({ payload }: any) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {payload.map((entry: any, i: number) => (
        <span key={i} className="flex items-center gap-1 text-sm text-gray-700">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  );
}
