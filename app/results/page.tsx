"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskOverview } from "@/components/results/risk-overview";
import { PGxProfile } from "@/components/results/pgx-profile";
import { ClinicalRecommendations } from "@/components/results/clinical-recommendations";
import { AIExplanationSection } from "@/components/results/ai-explanation";
import { JSONOutput } from "@/components/results/json-output";
import { WhyThisDecision } from "@/components/results/why-this-decision";
import { getSelectedDrug, clearAnalysisResult } from "@/lib/analysis-store";
import { DRUG_DETAILS, type AnalysisResult, type SupportedDrug } from "@/lib/types";
import {
  Shield, ArrowLeft, FlaskConical, BarChart3, Dna, Activity,
  ChevronLeft, RotateCcw, Stethoscope, Heart
} from "lucide-react";

type ViewMode = "clinical" | "patient";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>("clinical");

  useEffect(() => {
    const stored = getSelectedDrug();
    if (stored) setResult(stored);
    setLoading(false);
  }, []);

  const handleBackToSummary = () => router.push("/summary");
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

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center px-6 animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted animate-float">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">No Analysis Results</h2>
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            No analysis data found. Please run an analysis first.
          </p>
          <Button onClick={handleNewAnalysis} className="gap-2 shadow-md shadow-primary/15">
            <ArrowLeft className="h-4 w-4" /> Go to Upload
          </Button>
        </div>
      </div>
    );
  }

  const drugKey = result.drug as SupportedDrug;
  const drugInfo = DRUG_DETAILS[drugKey] || { label: result.drug, gene: "Unknown", description: "" };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 glass-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">PharmaGuard</h1>
              <p className="mt-0.5 text-[11px] text-muted-foreground font-medium">
                {drugInfo.label} -- Detailed Results
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="hidden sm:flex items-center rounded-xl border border-border/60 bg-muted/30 p-0.5">
              <button
                onClick={() => setMode("clinical")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  mode === "clinical"
                    ? "bg-card text-foreground shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Stethoscope className="h-3 w-3" />
                Clinical
              </button>
              <button
                onClick={() => setMode("patient")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  mode === "patient"
                    ? "bg-card text-foreground shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className="h-3 w-3" />
                Patient
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={handleBackToSummary} className="gap-1.5 text-xs transition-all ">
              <ChevronLeft className="h-3 w-3" /> All Drugs
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewAnalysis} className="gap-1.5 text-xs transition-all ">
              <RotateCcw className="h-3 w-3" /> New
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-7">

          {/* Mobile mode toggle */}
          <div className="flex sm:hidden items-center rounded-xl border border-border/60 bg-muted/30 p-0.5 w-full animate-fade-up">
            <button
              onClick={() => setMode("clinical")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                mode === "clinical" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" /> Clinical Mode
            </button>
            <button
              onClick={() => setMode("patient")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                mode === "patient" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Heart className="h-3.5 w-3.5" /> Patient Mode
            </button>
          </div>

          {/* Patient-friendly summary */}
          {mode === "patient" && (
            <Card className="border-primary/20 bg-primary/[0.03] animate-scale-in overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] to-transparent pointer-events-none" />
              <CardContent className="relative p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-bold text-foreground">What does this mean for you?</h3>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {result.ai_explanation.patient_friendly}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Overview */}
          <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <RiskOverview
              riskAssessment={result.risk_assessment}
              drug={result.drug}
              timestamp={result.timestamp}
              patientId={result.patient_id}
            />
          </div>

          {/* Why This Decision */}
          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <WhyThisDecision result={result} />
          </div>

          {/* Two-column: Profile + Recommendations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: "180ms" }}>
            {mode === "clinical" ? (
              <>
                <PGxProfile profile={result.pharmacogenomic_profile} />
                <ClinicalRecommendations
                  recommendation={result.clinical_recommendations}
                  riskLevel={result.risk_assessment.risk_level}
                  drug={result.drug}
                />
              </>
            ) : (
              <>
                {/* Simplified profile for patient mode */}
                <Card className="card-glow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Dna className="h-4 w-4 text-primary" />
                      Your Genetic Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {[
                      { label: "Gene Tested", value: result.pharmacogenomic_profile.gene, mono: true },
                      { label: "Your Variation", value: result.pharmacogenomic_profile.diplotype, mono: true },
                      { label: "What This Means", value: result.pharmacogenomic_profile.phenotype_label, mono: false },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 p-3.5 transition-all hover:bg-muted/40">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        <span className={`text-sm font-bold ${mono ? "font-mono text-primary" : "text-foreground"}`}>{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Simplified recommendations */}
                <Card className="card-glow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FlaskConical className="h-4 w-4 text-primary" />
                      What You Should Know
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm leading-relaxed text-foreground">{result.clinical_recommendations.dosing_guidance}</p>
                    {result.clinical_recommendations.warnings.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800">Important</span>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {result.clinical_recommendations.warnings.map((w, i) => (
                            <li key={i} className="text-sm text-amber-900 leading-relaxed">{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* AI Explanation (clinical mode only) */}
          {mode === "clinical" && (
            <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
              <AIExplanationSection explanation={result.ai_explanation} />
            </div>
          )}

          {/* Quality Metrics */}
          {result.quality_metrics && (
            <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
              <Card className="border-border/40 card-glow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: "Variants", value: result.quality_metrics.variants_analyzed, icon: Activity },
                      { label: "PGx Variants", value: result.quality_metrics.pgx_variants_found, icon: Dna },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:bg-muted/30">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
                        <span className="flex items-center gap-2 text-xl font-extrabold tabular-nums text-foreground">
                          <Icon className="h-4 w-4 text-primary" />
                          {value}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:bg-muted/30">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gene Coverage</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.quality_metrics.gene_coverage.length > 0 ? (
                          result.quality_metrics.gene_coverage.map((gene) => (
                            <Badge key={gene} variant="outline" className="text-[9px] font-mono font-bold border-primary/30 text-primary bg-primary/5">{gene}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:bg-muted/30">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pipeline</span>
                      <span className="text-sm font-bold text-foreground">{result.quality_metrics.analysis_version}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{result.quality_metrics.pipeline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* JSON Output (clinical only) */}
          {mode === "clinical" && (
            <div className="animate-fade-up" style={{ animationDelay: "360ms" }}>
              <JSONOutput result={result} />
            </div>
          )}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between border-t border-border/40 pt-8">
            <Button variant="outline" onClick={handleBackToSummary} className="gap-2 font-semibold text-sm transition-all ">
              <ChevronLeft className="h-4 w-4" /> Back to All Drugs
            </Button>
            <Button variant="outline" onClick={handleNewAnalysis} className="gap-2 font-semibold text-sm transition-all ">
              <RotateCcw className="h-4 w-4" /> New Analysis
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
