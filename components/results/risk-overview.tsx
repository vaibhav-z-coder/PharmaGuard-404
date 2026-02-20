"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-primary/20 ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary transition-all duration-300 ease-in-out" style={{ width: `${clamped}%` }} />
    </div>
  );
}
import { RiskBadge, RiskLabelBadge } from "./risk-badge";
import type { RiskAssessment } from "@/lib/types";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";

interface RiskOverviewProps {
  riskAssessment: RiskAssessment;
  drug: string;
  timestamp: string;
  patientId: string;
}

export function RiskOverview({ riskAssessment, drug, timestamp, patientId }: RiskOverviewProps) {
  const [formattedDate, setFormattedDate] = useState(timestamp);

  useEffect(() => {
    setFormattedDate(
      new Date(timestamp).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }, [timestamp]);

  const riskLabel = riskAssessment.risk_label ?? "Unknown";

  const showAlert =
    riskAssessment.risk_level === "Critical" ||
    riskAssessment.risk_level === "High" ||
    riskLabel === "Toxic" ||
    riskLabel === "Ineffective";

  const levelGlow: Record<string, string> = {
    Critical: "shadow-rose-500/10",
    High: "shadow-red-500/10",
    Moderate: "shadow-amber-400/10",
    Low: "shadow-emerald-500/10",
  };
  const glow = levelGlow[riskAssessment.risk_level] || "";

  return (
    <Card className={`card-glow overflow-hidden shadow-lg ${glow}`}>
      {showAlert && (
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-500 animate-shimmer" />
      )}
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          {/* Top row: Badges + Drug info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <RiskLabelBadge label={riskLabel} size="lg" />
                <RiskBadge level={riskAssessment.risk_level} size="md" />
                {showAlert && (
                  <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-foreground text-balance">
                {drug} Risk Assessment
              </h2>
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:text-right">
              <span className="flex items-center gap-1.5 sm:justify-end">
                <Clock className="h-3.5 w-3.5" />
                {formattedDate}
              </span>
              <span className="text-xs font-mono">
                ID: {patientId}
              </span>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Confidence */}
            <div className="flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Confidence
                </span>
                <span className="text-lg font-extrabold tabular-nums text-foreground">
                  {riskAssessment.confidence_score}%
                </span>
              </div>
              <ProgressBar value={riskAssessment.confidence_score} className="h-2" />
            </div>

            {/* Clinical Risk Label */}
            <div className="flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:bg-muted/30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Clinical Outcome
              </span>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground">
                  {riskLabel}
                </span>
              </div>
            </div>

            {/* Severity */}
            <div className="flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:bg-muted/30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Severity
              </span>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {riskAssessment.severity}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
