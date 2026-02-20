"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ClinicalRecommendation, RiskLevel } from "@/lib/types";
import { Stethoscope, AlertTriangle, Pill } from "lucide-react";

interface ClinicalRecommendationsProps {
  recommendation: ClinicalRecommendation;
  riskLevel: RiskLevel;
  drug: string;
}

export function ClinicalRecommendations({
  recommendation,
  riskLevel,
  drug,
}: ClinicalRecommendationsProps) {
  const isHighRisk = riskLevel === "Critical" || riskLevel === "High";

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Stethoscope className="h-5 w-5 text-primary" />
          Clinical Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Warnings */}
        {recommendation.warnings.length > 0 && (
          <div className="flex flex-col gap-2">
            {recommendation.warnings.map((warning, i) => (
              <Alert
                key={i}
                variant={isHighRisk ? "destructive" : "default"}
                className={isHighRisk ? "border-red-500/50 bg-red-500/5" : ""}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className={isHighRisk ? "text-red-700 dark:text-red-300" : ""}>
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Dosing Guidance */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            CPIC Dosing Guidance for {drug}
          </h4>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {recommendation.dosing_guidance}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {recommendation.cpic_level}
            </Badge>
          </div>
        </div>

        {/* Alternative Drugs */}
        {recommendation.alternative_drugs.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Alternative Drugs
            </h4>
            <div className="flex flex-wrap gap-2">
              {recommendation.alternative_drugs.map((alt) => (
                <Badge
                  key={alt}
                  variant="secondary"
                  className="gap-1.5 px-3 py-1.5 text-sm"
                >
                  <Pill className="h-3 w-3" />
                  {alt}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
