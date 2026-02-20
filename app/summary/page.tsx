"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-primary/20 ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary transition-all duration-300 ease-in-out" style={{ width: `${clamped}%` }} />
    </div>
  );
}
import { getMultiDrugResult, setSelectedDrug, clearAnalysisResult } from "@/lib/analysis-store";
import { DRUG_DETAILS, SUPPORTED_GENES, type MultiDrugAnalysisResult, type AnalysisResult, type SupportedDrug, type RiskLevel } from "@/lib/types";
import {
  Shield, ArrowRight, FlaskConical, Dna, Activity, AlertTriangle, CheckCircle2,
  XCircle, HelpCircle, BarChart3, RotateCcw, ArrowLeft, Gauge, ShieldCheck, Zap
} from "lucide-react";

const RISK_ORDER: Record<RiskLevel, number> = { Critical: 0, High: 1, Moderate: 2, Low: 3, Unknown: 4 };

const LEVEL_STYLE: Record<RiskLevel, { bg: string; border: string; text: string; glow: string }> = {
  Critical: { bg: "bg-rose-600", border: "border-rose-500", text: "text-rose-50", glow: "shadow-rose-200/30" },
  High:     { bg: "bg-red-500", border: "border-red-400", text: "text-white", glow: "shadow-red-200/30" },
  Moderate: { bg: "bg-amber-400", border: "border-amber-300", text: "text-amber-900", glow: "shadow-amber-200/30" },
  Low:      { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-white", glow: "shadow-emerald-200/30" },
  Unknown:  { bg: "bg-slate-300", border: "border-slate-200", text: "text-slate-700", glow: "shadow-slate-200/30" },
};

const LABEL_STYLE: Record<string, string> = {
  safe: "severity-safe",
  "adjust dosage": "severity-dose-adjust",
  ineffective: "severity-alternative",
  toxic: "severity-critical",
  unknown: "bg-slate-50 text-slate-600 border border-slate-200",
};

const SEVERITY_TAG_MAP: Record<string, { text: string; className: string }> = {
  safe:            { text: "Standard Dosing", className: "severity-safe" },
  "adjust dosage": { text: "Dose Adjustment Required", className: "severity-dose-adjust" },
  ineffective:     { text: "Consider Alternative Therapy", className: "severity-alternative" },
  toxic:           { text: "Monitor Closely", className: "severity-critical" },
  unknown:         { text: "Insufficient Data", className: "bg-slate-50 text-slate-600 border border-slate-200" },
};

function getRiskIcon(level: RiskLevel) {
  switch (level) {
    case "Critical": return <XCircle className="h-3.5 w-3.5" />;
    case "High":     return <AlertTriangle className="h-3.5 w-3.5" />;
    case "Moderate": return <AlertTriangle className="h-3.5 w-3.5" />;
    case "Low":      return <CheckCircle2 className="h-3.5 w-3.5" />;
    default:         return <HelpCircle className="h-3.5 w-3.5" />;
  }
}

export default function SummaryPage() {
  const router = useRouter();
  const [data, setData] = useState<MultiDrugAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getMultiDrugResult();
    if (stored) setData(stored);
    setLoading(false);
  }, []);

  const handleSelectDrug = (result: AnalysisResult) => {
    setSelectedDrug(result);
    router.push("/results");
  };

  const handleNewAnalysis = () => { clearAnalysisResult(); router.push("/"); };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center px-6 animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted animate-float">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">No Analysis Results</h2>
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            Run an analysis first by uploading a VCF file on the home page.
          </p>
          <Button onClick={handleNewAnalysis} className="gap-2 shadow-md shadow-primary/15">
            <ArrowLeft className="h-4 w-4" /> Go to Upload
          </Button>
        </div>
      </div>
    );
  }

  const sorted = [...data.results].sort(
    (a, b) => RISK_ORDER[a.risk_assessment.risk_level] - RISK_ORDER[b.risk_assessment.risk_level]
  );
  const flagged = sorted.filter((r) => r.risk_assessment.risk_level === "Critical" || r.risk_assessment.risk_level === "Moderate").length;
  const avgConfidence = Math.round(sorted.reduce((sum, r) => sum + r.risk_assessment.confidence_score, 0) / sorted.length);

  const coveredGenes = data.quality_metrics.gene_coverage;
  const totalGenes = SUPPORTED_GENES.length;
  const coveragePct = Math.round((coveredGenes.length / totalGenes) * 100);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 glass-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">PharmaGuard</h1>
              <p className="mt-0.5 text-[11px] text-muted-foreground font-medium">Analysis Summary</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleNewAnalysis} className="gap-1.5 text-xs transition-all ">
            <RotateCcw className="h-3 w-3" /> New Analysis
          </Button>

        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-8">

          {/* Title */}
          <div className="flex flex-col gap-3 animate-fade-up">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-extrabold text-foreground">Drug Interaction Report</h2>
              {flagged > 0 ? (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 gap-1 font-semibold text-xs animate-scale-in">
                  <AlertTriangle className="h-3 w-3" />
                  {flagged} drug{flagged > 1 ? "s" : ""} flagged
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1 font-semibold text-xs animate-scale-in">
                  <ShieldCheck className="h-3 w-3" /> All clear
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Patient: <span className="font-mono font-semibold text-foreground">{data.patient_id}</span>
              <span className="mx-2 text-border">|</span>
              {data.results.length} drugs analyzed
              <span className="mx-2 text-border">|</span>
              {data.quality_metrics.variants_analyzed} variants scanned
            </p>
          </div>

          {/* Gene Coverage Summary Panel */}
          <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <Card className="glass-card border-border/40 overflow-hidden shadow-lg shadow-primary/[0.03]">
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              <CardContent className="relative py-5 px-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Gene Coverage Gauge */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Dna className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Gene Coverage</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-extrabold tabular-nums text-foreground">{coveredGenes.length}<span className="text-lg text-muted-foreground font-bold">/{totalGenes}</span></span>
                      <span className="mb-1 text-xs text-muted-foreground font-semibold">({coveragePct}%)</span>
                    </div>
                    <ProgressBar value={coveragePct} className="h-1.5" />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {SUPPORTED_GENES.map((g) => (
                        <Badge
                          key={g}
                          variant="outline"
                          className={`text-[9px] font-mono font-bold px-1.5 py-0 transition-all ${
                            coveredGenes.includes(g)
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/50"
                              : "border-border text-muted-foreground opacity-40"
                          }`}
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* PGx Variants Found */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">PGx Variants</span>
                    </div>
                    <span className="text-3xl font-extrabold tabular-nums text-foreground">{data.quality_metrics.pgx_variants_found}</span>
                    <span className="text-xs text-muted-foreground">of {data.quality_metrics.variants_analyzed} total variants</span>
                  </div>

                  {/* Avg Confidence */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Avg Confidence</span>
                    </div>
                    <span className="text-3xl font-extrabold tabular-nums text-foreground">{avgConfidence}<span className="text-lg text-muted-foreground font-bold">%</span></span>
                    <ProgressBar value={avgConfidence} className="h-1.5" />
                  </div>

                  {/* Pipeline */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Pipeline</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">v{data.quality_metrics.analysis_version}</span>
                    <span className="text-xs text-muted-foreground truncate">{data.quality_metrics.pipeline}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drug Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {sorted.map((result) => {
              const drugKey = result.drug as SupportedDrug;
              const details = DRUG_DETAILS[drugKey] || { label: result.drug, gene: "Unknown", description: "" };
              const riskLabel = (result.risk_assessment.risk_label ?? "Unknown").trim().toLowerCase();
              const levelStyle = LEVEL_STYLE[result.risk_assessment.risk_level] || LEVEL_STYLE.Unknown;
              const labelStyle = LABEL_STYLE[riskLabel] || LABEL_STYLE.unknown;
              const severityTag = SEVERITY_TAG_MAP[riskLabel] || SEVERITY_TAG_MAP.unknown;
              const isFlagged = result.risk_assessment.risk_level === "Critical";

              return (
                <Card
                  key={result.drug}
                  className={`card-glow animate-fade-up group cursor-pointer border-border/60 transition-all duration-300 hover:border-primary/25 ${isFlagged ? "ring-1 ring-red-200" : ""}`}
                  onClick={() => handleSelectDrug(result)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${details.label}`}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectDrug(result); } }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1.5">
                        <CardTitle className="text-lg font-bold">{details.label}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono font-bold px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                            {details.gene}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{details.description}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold shadow-sm ${levelStyle.bg} ${levelStyle.border} ${levelStyle.text} ${levelStyle.glow} shadow-md`}>
                        {getRiskIcon(result.risk_assessment.risk_level)}
                        {result.risk_assessment.risk_level}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3.5">
                    {/* Risk label + severity tag */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${labelStyle}`}>
                        {result.risk_assessment.risk_label ?? "Unknown"}
                      </span>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${severityTag.className}`}>
                        {severityTag.text}
                      </span>
                    </div>

                    {/* Confidence bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium text-muted-foreground">Confidence</span>
                        <span className="font-bold tabular-nums text-foreground">{result.risk_assessment.confidence_score}%</span>
                      </div>
                      <ProgressBar value={result.risk_assessment.confidence_score} className="h-1.5" />
                    </div>

                    {/* Phenotype */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono font-semibold text-foreground">{result.pharmacogenomic_profile.diplotype}</span>
                      <span className="text-border">--</span>
                      <span>{result.pharmacogenomic_profile.phenotype_label}</span>
                    </div>

                    {/* View details */}
                    <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 pt-1">
                      <Zap className="h-3 w-3" />
                      View Details
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
