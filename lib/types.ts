// ── PharmaGuard Type Definitions ──

export const RISK_LEVELS = ["Critical", "High", "Moderate", "Low", "Unknown"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// Clinical risk labels displayed to users (mapped from RiskLevel + context)
export const RISK_LABELS = ["Safe", "Adjust Dosage", "Ineffective", "Toxic", "Unknown"] as const;
export type RiskLabel = (typeof RISK_LABELS)[number];

export const SUPPORTED_DRUGS = [
  "CODEINE",
  "WARFARIN",
  "CLOPIDOGREL",
  "SIMVASTATIN",
  "AZATHIOPRINE",
  "FLUOROURACIL",
] as const;
export type SupportedDrug = (typeof SUPPORTED_DRUGS)[number];

export const SUPPORTED_GENES = [
  "CYP2D6",
  "CYP2C19",
  "CYP2C9",
  "SLCO1B1",
  "TPMT",
  "DPYD",
] as const;
export type SupportedGene = (typeof SUPPORTED_GENES)[number];

export const PHENOTYPES = ["PM", "IM", "NM", "RM", "URM"] as const;
export type Phenotype = (typeof PHENOTYPES)[number];

export const PHENOTYPE_LABELS: Record<Phenotype, string> = {
  PM: "Poor Metabolizer",
  IM: "Intermediate Metabolizer",
  NM: "Normal Metabolizer",
  RM: "Rapid Metabolizer",
  URM: "Ultrarapid Metabolizer",
};

// ── Drug display info ──

export interface DrugInfo {
  label: string;
  gene: string;
  description: string;
}

export const DRUG_DETAILS: Record<SupportedDrug, DrugInfo> = {
  CODEINE: { label: "Codeine", gene: "CYP2D6", description: "Opioid analgesic" },
  WARFARIN: { label: "Warfarin", gene: "CYP2C9", description: "Anticoagulant" },
  CLOPIDOGREL: { label: "Clopidogrel", gene: "CYP2C19", description: "Antiplatelet" },
  SIMVASTATIN: { label: "Simvastatin", gene: "SLCO1B1", description: "Statin / Lipid-lowering" },
  AZATHIOPRINE: { label: "Azathioprine", gene: "TPMT", description: "Immunosuppressant" },
  FLUOROURACIL: { label: "5-Fluorouracil", gene: "DPYD", description: "Chemotherapy" },
};

// ── Parsed VCF Data ──

export interface ParsedVariant {
  chrom: string;
  pos: number;
  id: string; // rsID
  ref: string;
  alt: string;
  qual: string;
  filter: string;
  info: Record<string, string>;
  gene?: string;
  starAllele?: string;
  genotype?: string; // e.g., "0/1", "1/1"
  zygosity?: "Homozygous Reference" | "Heterozygous" | "Homozygous Alternate" | "Compound Heterozygous" | "Unknown";
}

export interface VCFParseResult {
  success: true;
  variants: ParsedVariant[];
  sampleId?: string;
  fileFormat?: string;
}

export interface VCFParseError {
  success: false;
  error: string;
  details?: string;
}

// ── Phenotype Mapping ──

export interface PhenotypeResult {
  gene: SupportedGene;
  diplotype: string;
  phenotype: Phenotype;
  phenotypeLabel: string;
  activityScore?: number;
}

// ── Risk Assessment ──

export interface RiskAssessment {
  risk_level: RiskLevel;
  risk_label: RiskLabel;
  confidence_score: number; // 0-100
  severity: string;
}

// ── Pharmacogenomic Profile ──

export interface DetectedVariant {
  rsid: string;
  chromosome: string;
  position: number;
  ref_allele: string;
  alt_allele: string;
  gene: string;
  star_allele?: string;
}

export interface PharmacogenomicProfile {
  gene: string;
  diplotype: string;
  phenotype: string;
  phenotype_label: string;
  detected_variants: DetectedVariant[];
}

// ── Clinical Recommendations ──

export interface ClinicalRecommendation {
  dosing_guidance: string;
  alternative_drugs: string[];
  warnings: string[];
  cpic_level: string;
}

// ── AI Explanation ──

export interface AIExplanation {
  summary: string;
  mechanism: string;
  patient_friendly: string;
  citations: string[];
}

// ── Quality Metrics ──

export interface QualityMetrics {
  variants_analyzed: number;
  pgx_variants_found: number;
  gene_coverage: string[];
  analysis_version: string;
  pipeline: string;
}

// ── Full Analysis Result (single drug) ──

export interface AnalysisResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: RiskAssessment;
  pharmacogenomic_profile: PharmacogenomicProfile;
  clinical_recommendations: ClinicalRecommendation;
  ai_explanation: AIExplanation;
  quality_metrics: QualityMetrics;
}

// ── Multi-Drug Analysis (all drugs at once) ──

export interface MultiDrugAnalysisResult {
  patient_id: string;
  timestamp: string;
  quality_metrics: QualityMetrics;
  results: AnalysisResult[];
}

// ── API Request / Response ──

export interface AnalysisRequest {
  vcfFile: File;
  drug: SupportedDrug;
}

export interface AnalysisErrorResponse {
  error: string;
  code: "INVALID_VCF" | "UNSUPPORTED_DRUG" | "NO_VARIANTS" | "PARSE_ERROR" | "FILE_TOO_LARGE" | "MISSING_FILE";
  details?: string;
}
