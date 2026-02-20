"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, HelpCircle, ArrowRight, Dna, FlaskConical, ShieldAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WhyThisDecisionProps {
  result: AnalysisResult;
}

export function WhyThisDecision({ result }: WhyThisDecisionProps) {
  const [open, setOpen] = useState(false);

  const { pharmacogenomic_profile: profile, risk_assessment: risk } = result;

  const steps = [
    {
      icon: Dna,
      label: "Genotype Detected",
      detail: `VCF analysis found diplotype ${profile.diplotype} in gene ${profile.gene}`,
      badge: profile.diplotype,
      badgeClass: "border-primary/30 text-primary bg-primary/5",
    },
    {
      icon: FlaskConical,
      label: "Phenotype Mapped",
      detail: `Diplotype ${profile.diplotype} maps to ${profile.phenotype_label} (${profile.phenotype})`,
      badge: profile.phenotype_label,
      badgeClass: "border-amber-300 text-amber-700 bg-amber-50",
    },
    {
      icon: ShieldAlert,
      label: "CPIC Risk Assignment",
      detail: `${profile.phenotype_label} receiving ${result.drug} results in risk level: ${risk.risk_level} (${risk.risk_label ?? "Unknown"})`,
      badge: risk.risk_level,
      badgeClass:
        risk.risk_level === "Critical" || risk.risk_level === "High"
          ? "border-red-300 text-red-700 bg-red-50"
          : risk.risk_level === "Moderate"
            ? "border-amber-300 text-amber-700 bg-amber-50"
            : "border-emerald-300 text-emerald-700 bg-emerald-50",
    },
  ];

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardHeader
        className="cursor-pointer select-none pb-3 transition-colors hover:bg-muted/30"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label="Toggle Why This Decision explanation"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" />
            Why This Decision?
          </CardTitle>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          />
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 pb-5 animate-fade-up" style={{ animationDuration: "0.3s" }}>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            This is the step-by-step reasoning PharmaGuard used to produce the risk assessment for{" "}
            <span className="font-semibold text-foreground">{result.drug}</span>.
          </p>
          <div className="flex flex-col gap-0">
            {steps.map((step, i) => (
              <div key={step.label} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                    <step.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-1 flex flex-1 flex-col items-center">
                      <div className="h-full w-px bg-border" />
                      <ArrowRight className="my-1 h-3 w-3 rotate-90 text-muted-foreground/40" />
                      <div className="h-full w-px bg-border" />
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className={cn("flex flex-col gap-1 pb-5", i === steps.length - 1 && "pb-0")}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Step {i + 1}: {step.label}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-mono font-bold px-1.5 py-0 ${step.badgeClass}`}>
                      {step.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
          {risk.severity && (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Severity Note</span>
              <p className="mt-1 text-sm text-foreground">{risk.severity}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
