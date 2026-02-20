"use client";

import type { RiskLevel, RiskLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Risk Level badge styles (Critical/High/Moderate/Low/Unknown) ──
const RISK_LEVEL_STYLES: Record<RiskLevel, { bg: string; text: string; border: string; ring: string }> = {
  Critical: {
    bg: "bg-rose-900",
    text: "text-white",
    border: "border-rose-700",
    ring: "ring-rose-500/30",
  },
  High: {
    bg: "bg-red-600",
    text: "text-white",
    border: "border-red-500",
    ring: "ring-red-500/30",
  },
  Moderate: {
    bg: "bg-amber-500",
    text: "text-black",
    border: "border-amber-400",
    ring: "ring-amber-400/30",
  },
  Low: {
    bg: "bg-green-600",
    text: "text-white",
    border: "border-green-500",
    ring: "ring-green-500/30",
  },
  Unknown: {
    bg: "bg-gray-400",
    text: "text-white",
    border: "border-gray-300",
    ring: "ring-gray-400/30",
  },
};

// ── Risk Label badge styles (Safe/Adjust Dosage/Ineffective/Toxic/Unknown) ──
const RISK_LABEL_STYLES: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  safe: {
    bg: "bg-green-600",
    text: "text-white",
    border: "border-green-500",
    ring: "ring-green-500/30",
  },
  "adjust dosage": {
    bg: "bg-amber-500",
    text: "text-black",
    border: "border-amber-400",
    ring: "ring-amber-400/30",
  },
  ineffective: {
    bg: "bg-red-600",
    text: "text-white",
    border: "border-red-500",
    ring: "ring-red-500/30",
  },
  toxic: {
    bg: "bg-rose-900",
    text: "text-white",
    border: "border-rose-700",
    ring: "ring-rose-500/30",
  },
  unknown: {
    bg: "bg-gray-400",
    text: "text-white",
    border: "border-gray-300",
    ring: "ring-gray-400/30",
  },
};

// ── Risk Level Badge ──
interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function normalizeLevel(level: string): RiskLevel {
  const normalized = level.trim();
  const key = (normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()) as RiskLevel;
  return key in RISK_LEVEL_STYLES ? key : "Unknown";
}

export function RiskBadge({ level, size = "md", className }: RiskBadgeProps) {
  const safeLevel = normalizeLevel(level);
  const styles = RISK_LEVEL_STYLES[safeLevel];

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold border ring-2 rounded-md uppercase tracking-wider",
        styles.bg,
        styles.text,
        styles.border,
        styles.ring,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-2 text-base",
        className
      )}
    >
      {safeLevel}
    </span>
  );
}

// ── Risk Label Badge (Safe/Ineffective/Toxic/Adjust Dosage/Unknown) ──
interface RiskLabelBadgeProps {
  label: RiskLabel;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RiskLabelBadge({ label, size = "md", className }: RiskLabelBadgeProps) {
  const safeLabel = label ?? "Unknown";
  const normalized = safeLabel.trim().toLowerCase();
  const styles = RISK_LABEL_STYLES[normalized] || RISK_LABEL_STYLES.unknown;

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold border ring-2 rounded-md uppercase tracking-wider",
        styles.bg,
        styles.text,
        styles.border,
        styles.ring,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-2 text-base",
        className
      )}
      >
      {safeLabel}
    </span>
  );
}

// ── Risk Dot (small indicator) ──
export function RiskDot({ level, className }: { level: RiskLevel; className?: string }) {
  const colorMap: Record<RiskLevel, string> = {
    Critical: "bg-rose-900",
    High: "bg-red-600",
    Moderate: "bg-amber-500",
    Low: "bg-green-600",
    Unknown: "bg-gray-400",
  };

  return (
    <span
      className={cn("inline-block h-3 w-3 rounded-full", colorMap[level] || "bg-gray-400", className)}
      aria-hidden="true"
    />
  );
}
