import { NextResponse } from "next/server";
import { parseVCF, getDetectedGenes, buildDiplotype, filterVariantsForGene } from "@/lib/vcf-parser";
import { mapPhenotype } from "@/lib/phenotype-mapper";
import { evaluateRisk, getPrimaryGene, getGenotypeOverride } from "@/lib/pgx-rules-engine";
import { generateExplanation } from "@/lib/ai-explainer";
import {
  SUPPORTED_DRUGS,
  type SupportedDrug,
  type AnalysisResult,
  type MultiDrugAnalysisResult,
  type DetectedVariant,
  type AnalysisErrorResponse,
} from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("vcfFile") as File | null;

    // ── Validate file ──
    if (!file) {
      return NextResponse.json(
        { error: "No VCF file uploaded", code: "MISSING_FILE" } satisfies AnalysisErrorResponse,
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB size limit", code: "FILE_TOO_LARGE", details: `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` } satisfies AnalysisErrorResponse,
        { status: 400 }
      );
    }
    if (!file.name.endsWith(".vcf")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a .vcf file.", code: "INVALID_VCF" } satisfies AnalysisErrorResponse,
        { status: 400 }
      );
    }

    // ── Parse VCF ──
    const fileContent = await file.text();
    const parseResult = parseVCF(fileContent);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error, code: "INVALID_VCF", details: parseResult.details } satisfies AnalysisErrorResponse,
        { status: 400 }
      );
    }
    if (parseResult.variants.length === 0) {
      return NextResponse.json(
        { error: "No variants detected in VCF file", code: "NO_VARIANTS", details: "The uploaded VCF file contains no variant data lines." } satisfies AnalysisErrorResponse,
        { status: 400 }
      );
    }

    // ── Shared metadata ──
    const detectedGenes = getDetectedGenes(parseResult.variants);
    const timestamp = new Date().toISOString();
    const patientId = parseResult.sampleId || `SAMPLE_${Date.now()}`;
    const pgxVariantsFound = parseResult.variants.filter((v) => v.gene).length;

    const qualityMetrics = {
      variants_analyzed: parseResult.variants.length,
      pgx_variants_found: pgxVariantsFound,
      gene_coverage: detectedGenes,
      analysis_version: "1.0.0",
      pipeline: "PharmaGuard CPIC-Aligned PGx Pipeline",
    };

    // ── Analyze every drug ──
    const results: AnalysisResult[] = [];

    for (const drug of SUPPORTED_DRUGS) {
      const primaryGene = getPrimaryGene(drug);
      const hasRelevantGene = detectedGenes.includes(primaryGene);

      let diplotype: string;
      let phenotypeResult;
      const detectedVariants: DetectedVariant[] = [];

      if (hasRelevantGene) {
        diplotype = buildDiplotype(parseResult.variants, primaryGene);
        phenotypeResult = mapPhenotype(primaryGene, diplotype);

        const geneVariants = filterVariantsForGene(parseResult.variants, primaryGene);
        for (const v of geneVariants) {
          detectedVariants.push({
            rsid: v.id,
            chromosome: v.chrom,
            position: v.pos,
            ref_allele: v.ref,
            alt_allele: v.alt,
            gene: v.gene || primaryGene,
            star_allele: v.starAllele,
          });
        }
      } else {
        diplotype = "*1/*1";
        phenotypeResult = mapPhenotype(primaryGene, diplotype);
        for (const v of parseResult.variants.filter((x) => x.gene)) {
          detectedVariants.push({
            rsid: v.id,
            chromosome: v.chrom,
            position: v.pos,
            ref_allele: v.ref,
            alt_allele: v.alt,
            gene: v.gene || "Unknown",
            star_allele: v.starAllele,
          });
        }
      }

      // Phenotype-based risk (v2 -- strict 3-level Critical/Moderate/Low)
      const { riskAssessment, recommendation } = evaluateRisk(drug, primaryGene, phenotypeResult.phenotype);

      const finalRisk = { ...riskAssessment };
      const finalRec = { ...recommendation, warnings: [...recommendation.warnings] };

      // Genotype-level overrides
      const gtOverride = getGenotypeOverride(drug, primaryGene, parseResult.variants);
      if (gtOverride) {
        finalRisk.risk_level = gtOverride.riskLevel;
        finalRisk.risk_label = gtOverride.riskLabel;
        finalRisk.severity = gtOverride.severity;
        finalRisk.confidence_score = gtOverride.confidence;
      }

      // Unknown handling
      if (!hasRelevantGene && detectedGenes.length > 0) {
        finalRisk.risk_level = "Unknown";
        finalRisk.risk_label = "Unknown";
        finalRisk.confidence_score = 30;
        finalRisk.severity = `No ${primaryGene} variants detected.`;
        finalRec.dosing_guidance = `No ${primaryGene} variants found. Assume wildtype (*1/*1) pending testing. Use standard dosing.`;
        finalRec.warnings.push(`VCF did not contain variants for ${primaryGene}.`);
      } else if (!hasRelevantGene && detectedGenes.length === 0) {
        finalRisk.risk_level = "Unknown";
        finalRisk.risk_label = "Unknown";
        finalRisk.confidence_score = 10;
        finalRisk.severity = "No pharmacogenomic variants detected.";
        finalRec.dosing_guidance = "No PGx variants found. Use standard clinical protocols.";
        finalRec.warnings.push("No PGx variants detected in VCF.");
      }

      const explanation = generateExplanation(drug, primaryGene, phenotypeResult.phenotype, diplotype);

      results.push({
        patient_id: patientId,
        drug,
        timestamp,
        risk_assessment: finalRisk,
        pharmacogenomic_profile: {
          gene: primaryGene,
          diplotype: phenotypeResult.diplotype,
          phenotype: phenotypeResult.phenotype,
          phenotype_label: phenotypeResult.phenotypeLabel,
          detected_variants: detectedVariants,
        },
        clinical_recommendations: finalRec,
        ai_explanation: explanation,
        quality_metrics: qualityMetrics,
      });
    }

    const multiResult: MultiDrugAnalysisResult = {
      patient_id: patientId,
      timestamp,
      quality_metrics: qualityMetrics,
      results,
    };

    return NextResponse.json(multiResult);
  } catch (error) {
    console.error("Multi-drug analysis error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred during analysis",
        code: "PARSE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      } satisfies AnalysisErrorResponse,
      { status: 500 }
    );
  }
}
