"use client";

import { useEffect, useState } from "react";
import { Dna, FlaskConical, Activity, ShieldCheck, Sparkles, FileText } from "lucide-react";

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-primary/20 ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary transition-all duration-300 ease-in-out" style={{ width: `${clamped}%` }} />
    </div>
  );
}

const STEPS = [
  { text: "Parsing VCF file...", icon: FileText },
  { text: "Identifying pharmacogenomic variants...", icon: Dna },
  { text: "Mapping diplotypes to phenotypes...", icon: Activity },
  { text: "Evaluating drug-gene interactions across 6 drugs...", icon: FlaskConical },
  { text: "Generating clinical recommendations...", icon: ShieldCheck },
  { text: "Building AI explanations...", icon: Sparkles },
];

export function AnalysisLoader() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 700);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + Math.random() * 6 + 2));
    }, 180);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Pulsing glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-glow" />
        {/* Outer ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/10 border-t-primary" style={{ animationDuration: "1.2s" }} />
        {/* Inner ring */}
        <div className="absolute inset-3 animate-spin rounded-full border-2 border-primary/5 border-b-primary/30" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
        <CurrentIcon className="h-8 w-8 text-primary animate-float" />
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-xl font-bold text-foreground">
          Analyzing All Drug Interactions
        </h3>
        <p className="text-sm text-muted-foreground font-medium min-h-[20px] transition-all">
          {STEPS[step].text}
        </p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-2">
        <ProgressBar value={Math.min(progress, 95)} className="h-2" />
        <p className="text-center text-xs text-muted-foreground tabular-nums font-bold">
          {Math.round(Math.min(progress, 95))}%
        </p>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i <= step
                ? "h-2 w-5 bg-primary shadow-sm shadow-primary/30"
                : i === step + 1
                  ? "h-2 w-2 bg-primary/30"
                  : "h-1.5 w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
