"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VCFUpload } from "@/components/vcf-upload";
import { AnalysisLoader } from "@/components/analysis-loader";
import { setMultiDrugResult } from "@/lib/analysis-store";
import { SUPPORTED_DRUGS, DRUG_DETAILS, type MultiDrugAnalysisResult, type AnalysisErrorResponse } from "@/lib/types";
import { toast } from "sonner";
import {
  Shield, FlaskConical, Dna, ArrowRight, Sparkles, Lock,
  Activity, ShieldCheck, Gauge, Zap
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFileSelect = useCallback((f: File | null) => {
    setFile(f);
    setFileError("");
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setFileError("Please upload a VCF file");
      toast.error("Please upload a VCF file");
      return;
    }
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("vcfFile", file);
      const response = await fetch("/api/analyze-all", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData: AnalysisErrorResponse = await response.json();
        const errorDesc = errorData.details || errorData.error;
        switch (errorData.code) {
          case "INVALID_VCF":
            setFileError(errorData.error);
            toast.error("Invalid VCF File", { description: errorDesc });
            break;
          case "NO_VARIANTS":
            toast.error("No Variants Found", { description: errorDesc });
            break;
          case "FILE_TOO_LARGE":
            setFileError(errorData.error);
            toast.error("File Too Large", { description: errorDesc });
            break;
          case "MISSING_FILE":
            setFileError(errorData.error);
            toast.error(errorData.error);
            break;
          default:
            toast.error("Analysis Failed", { description: errorDesc });
        }
        setIsAnalyzing(false);
        return;
      }
      const result: MultiDrugAnalysisResult = await response.json();
      setMultiDrugResult(result);
      router.push("/summary");
    } catch {
      toast.error("Network Error", {
        description: "Failed to connect to the analysis server. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, router]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/40 glass-card sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20 animate-pulse-glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">PharmaGuard</h1>
              <p className="mt-0.5 text-[11px] text-muted-foreground font-medium">Pharmacogenomic Analysis Tool</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" /> CPIC-Aligned
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 dot-pattern" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 lg:py-24">
          <div className="flex flex-col items-center gap-7 text-center">
            <div className="animate-fade-up">
              <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-semibold px-3 py-1 mb-4">
                <Zap className="h-3 w-3" /> Analyze 6 drugs simultaneously
              </Badge>
            </div>
            <h2 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl animate-fade-up" style={{ animationDelay: "60ms" }}>
              <span className="text-foreground">Precision Drug </span>
              <span className="gradient-text">Safety Analysis</span>
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground leading-relaxed animate-fade-up" style={{ animationDelay: "120ms" }}>
              Upload a VCF file to analyze all 6 critical drug-gene interactions simultaneously.
              Get CPIC-aligned risk assessment with clinical severity tags and AI-powered explanations.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
              {[
                { icon: Dna, text: "6 Gene Panels", color: "text-blue-500" },
                { icon: FlaskConical, text: "6 Drugs at Once", color: "text-indigo-500" },
                { icon: Gauge, text: "5-Tier Risk Grading", color: "text-amber-500" },
                { icon: ShieldCheck, text: "Severity Tags", color: "text-emerald-500" },
              ].map(({ icon: Icon, text, color }) => (
                <span key={text} className="flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 ">
                  <Icon className={`h-3.5 w-3.5 ${color}`} /> {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Drug panels preview */}
      <section className="border-b border-border/30">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-col gap-5 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Drugs Analyzed</h3>
            <div className="flex flex-wrap items-center justify-center gap-3 stagger-children">
              {SUPPORTED_DRUGS.map((drug) => {
                const info = DRUG_DETAILS[drug];
                return (
                  <span key={drug} className="animate-scale-in flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-xs shadow-sm transition-colors hover:bg-muted/60 ">
                    <Badge variant="outline" className="text-[9px] font-mono font-bold px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                      {info.gene}
                    </Badge>
                    <span className="font-semibold text-foreground">{info.label}</span>
                    <span className="text-muted-foreground hidden sm:inline">-- {info.description}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Upload Form */}
      <main className="mx-auto max-w-2xl px-6 py-14">
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          {isAnalyzing ? (
            <Card className="glass-card border-primary/20 shadow-xl shadow-primary/5 animate-scale-in">
              <CardContent className="p-8">
                <AnalysisLoader />
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card shadow-xl shadow-primary/5 card-glow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2.5 text-xl">
                  <Activity className="h-5 w-5 text-primary" />
                  Run Analysis
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Upload your VCF file to run pharmacogenomic analysis across all 6
                  supported drugs simultaneously.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 pt-4">
                <VCFUpload onFileSelect={handleFileSelect} file={file} error={fileError} />
                <Button
                  onClick={handleAnalyze}
                  size="lg"
                  className="w-full gap-2 h-12 text-base font-semibold shadow-sm shadow-primary/10 transition-all hover:shadow-md hover:shadow-primary/12"
                  disabled={!file}
                >
                  Run Analysis
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Your data is processed locally and never stored on our servers.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
