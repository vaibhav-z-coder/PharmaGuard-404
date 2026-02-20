// lib/pgx-rules-engine.ts
// Strict CPIC-aligned risk determination using full phenotype string matching.
// Uses a direct switch/case per drug (from user spec) instead of a complex RULES object.

import type {
  RiskLevel,
  RiskLabel,
  Phenotype,
  RiskAssessment,
  ClinicalRecommendation,
  SupportedDrug,
  ParsedVariant,
} from "./types";
import { PHENOTYPE_LABELS, SUPPORTED_DRUGS } from "./types";

// ── Resolve abbreviated phenotype to full label ──
// STRICT gene-specific terminology (matches phenotype-mapper):
// CYP2C9, CYP2D6, CYP2C19 -> "Metabolizer"
// TPMT -> "TPMT Activity"
// DPYD -> "DPD Activity"
// SLCO1B1 -> "Function"
function resolveLabel(gene: string, phenotype: Phenotype): string {
  if (gene === "TPMT") {
    const map: Record<Phenotype, string> = {
      NM: "Normal TPMT Activity", IM: "Intermediate TPMT Activity",
      PM: "Deficient TPMT Activity", RM: "Normal TPMT Activity", URM: "Normal TPMT Activity",
    };
    return map[phenotype];
  }
  if (gene === "DPYD") {
    const map: Record<Phenotype, string> = {
      NM: "Normal DPD Activity", IM: "Reduced DPD Activity",
      PM: "Deficient DPD Activity", RM: "Normal DPD Activity", URM: "Normal DPD Activity",
    };
    return map[phenotype];
  }
  if (gene === "SLCO1B1") {
    const map: Record<Phenotype, string> = {
      NM: "Normal Function", IM: "Decreased Function",
      PM: "Poor Function", RM: "Normal Function", URM: "Normal Function",
    };
    return map[phenotype];
  }
  return PHENOTYPE_LABELS[phenotype];
}

// ── Drug-to-gene mapping ──
const DRUG_GENE_MAP: Record<SupportedDrug, string> = {
  CODEINE: "CYP2D6",
  CLOPIDOGREL: "CYP2C19",
  WARFARIN: "CYP2C9",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  FLUOROURACIL: "DPYD",
};

export function getPrimaryGene(drug: SupportedDrug): string {
  return DRUG_GENE_MAP[drug] || "";
}

export function isSupportedDrug(drug: string): drug is SupportedDrug {
  return SUPPORTED_DRUGS.includes(drug as SupportedDrug);
}

// ── Core risk determination (STRICT 3-level: Critical/Moderate/Low) ──
// Rule 1: PM, Deficient, Poor Function -> Critical (Red)
// Rule 2: Intermediate, Reduced, Decreased -> Moderate (Yellow)
// Rule 3: Normal -> Low (Green)
// Rule 4: URM: CYP2D6 -> Critical, others -> Moderate
// Rule 5: NEVER downgrade severe to "High". Severe = Critical always.
function determineRisk(drug: string, gene: string, label: string): RiskLevel {
  // Universal keyword matching per the strict spec
  if (
    label.includes("Poor") ||
    label.includes("Deficient")
  ) {
    return "Critical";
  }

  if (
    label.includes("Intermediate") ||
    label.includes("Reduced") ||
    label.includes("Decreased")
  ) {
    return "Moderate";
  }

  if (label.includes("Normal")) {
    return "Low";
  }

  // Ultra-rapid special handling
  if (label.includes("Ultra-rapid") || label.includes("Ultrarapid")) {
    if (gene === "CYP2D6") return "Critical"; // morphine overdose risk
    return "Moderate"; // others
  }

  // Rapid metabolizer (CYP2C19)
  if (label.includes("Rapid")) {
    return "Low";
  }

  return "Unknown";
}

// ── Map RiskLevel to clinical RiskLabel ──
function riskToLabel(drug: string, riskLevel: RiskLevel, label: string): RiskLabel {
  if (riskLevel === "Low") return "Safe";
  if (riskLevel === "Unknown") return "Unknown";
  if (riskLevel === "Moderate") return "Adjust Dosage";

  // Critical -- depends on drug mechanism
  if (riskLevel === "Critical" || riskLevel === "High") {
    if (drug === "CODEINE") {
      if (label.includes("Ultra-rapid") || label.includes("Ultrarapid")) return "Toxic";
      return "Ineffective"; // PM = no morphine conversion
    }
    if (drug === "CLOPIDOGREL") return "Ineffective"; // prodrug: PM = no active metabolite
    return "Toxic"; // Warfarin, Simvastatin, Azathioprine, 5-FU: PM = drug accumulation
  }

  return "Unknown";
}

// ── Severity description per drug/phenotype ──
function getSeverity(drug: string, label: string, riskLevel: RiskLevel): string {
  if (riskLevel === "Low") return `Standard ${drug.toLowerCase()} response expected with ${label}.`;
  if (riskLevel === "Unknown") return `Unable to determine risk for ${drug} with phenotype: ${label}.`;

  const map: Record<string, Record<string, string>> = {
    CODEINE: {
      "Poor Metabolizer": "Reduced conversion to morphine. Therapy may be ineffective. Consider alternative analgesics.",
      "Intermediate Metabolizer": "Reduced but partial conversion to morphine. Monitor for inadequate pain relief.",
      "Ultra-rapid Metabolizer": "Excessive morphine formation. Risk of respiratory depression and CNS toxicity.",
      "Ultrarapid Metabolizer": "Excessive morphine formation. Risk of respiratory depression and CNS toxicity.",
    },
    CLOPIDOGREL: {
      "Poor Metabolizer": "Severely impaired activation. High risk of cardiovascular events (stent thrombosis). Contraindicated.",
      "Intermediate Metabolizer": "Reduced activation. Consider increased dose or alternative antiplatelet (prasugrel, ticagrelor).",
    },
    WARFARIN: {
      "Poor Metabolizer": "Significantly reduced clearance. High bleeding risk. Requires major dose reduction (30-80%).",
      "Intermediate Metabolizer": "Moderately reduced clearance. Requires dose reduction (20-40%) with close INR monitoring.",
    },
    SIMVASTATIN: {
      "Poor Function": "Greatly increased plasma levels. High risk of myopathy and rhabdomyolysis. Contraindicated at high doses.",
      "Decreased Function": "Increased plasma levels. Elevated myopathy risk. Consider lower dose or alternative statin.",
    },
    AZATHIOPRINE: {
      "Deficient TPMT Activity": "Severely impaired drug inactivation. Life-threatening myelosuppression risk. Contraindicated or reduce dose by 90%.",
      "Intermediate TPMT Activity": "Reduced inactivation. Increased toxicity risk. Reduce dose by 30-50% and monitor blood counts.",
    },
    FLUOROURACIL: {
      "Deficient DPD Activity": "Severely impaired clearance. Fatal toxicity risk. Contraindicated.",
      "Reduced DPD Activity": "Reduced clearance. Increased GI and hematologic toxicity. Reduce dose by 25-50%.",
    },
  };

  return map[drug]?.[label] || `${riskLevel} risk for ${drug} with ${label}. Consult CPIC guidelines.`;
}

// ── Confidence scoring ──
function getConfidence(riskLevel: RiskLevel): number {
  if (riskLevel === "Critical") return 95;
  if (riskLevel === "Moderate") return 85;
  if (riskLevel === "Low") return 90;
  if (riskLevel === "High") return 92; // legacy fallback
  return 20; // Unknown
}

// ── Clinical recommendations per drug ──
function buildRecommendation(drug: string, label: string, riskLevel: RiskLevel): ClinicalRecommendation {
  const dosingMap: Record<string, Record<string, string>> = {
    CODEINE: {
      "Poor Metabolizer": "AVOID codeine. Use alternative analgesics not metabolized by CYP2D6 (e.g., acetaminophen, NSAIDs, morphine at standard doses).",
      "Intermediate Metabolizer": "Use codeine with caution. Monitor for efficacy. Consider alternative analgesics if inadequate response.",
      "Normal Metabolizer": "Use standard dosing per clinical guidelines.",
      "Ultra-rapid Metabolizer": "AVOID codeine. Risk of fatal respiratory depression. Use non-opioid analgesics.",
      "Ultrarapid Metabolizer": "AVOID codeine. Risk of fatal respiratory depression. Use non-opioid analgesics.",
    },
    CLOPIDOGREL: {
      "Poor Metabolizer": "AVOID clopidogrel. Use prasugrel or ticagrelor as alternative antiplatelet therapy.",
      "Intermediate Metabolizer": "Consider prasugrel or ticagrelor. If clopidogrel is used, consider platelet function testing.",
      "Normal Metabolizer": "Use standard dosing per clinical guidelines.",
      "Rapid Metabolizer": "Use standard dosing per clinical guidelines.",
      "Ultra-rapid Metabolizer": "Use standard dosing per clinical guidelines.",
      "Ultrarapid Metabolizer": "Use standard dosing per clinical guidelines.",
    },
    WARFARIN: {
      "Poor Metabolizer": "Reduce initial dose by 50-80%. Use pharmacogenomic dosing algorithms. Monitor INR closely for 2-3 weeks.",
      "Intermediate Metabolizer": "Reduce initial dose by 20-40%. Monitor INR more frequently during dose titration.",
      "Normal Metabolizer": "Use standard warfarin dosing with routine INR monitoring.",
    },
    SIMVASTATIN: {
      "Poor Function": "AVOID simvastatin or do not exceed 20mg/day. Use rosuvastatin or pravastatin instead.",
      "Decreased Function": "Use simvastatin at max 20mg/day. Monitor for muscle symptoms. Consider alternative statin.",
      "Normal Function": "Use standard dosing per clinical guidelines.",
    },
    AZATHIOPRINE: {
      "Deficient TPMT Activity": "Reduce dose by 90% or AVOID. Use alternative immunosuppressant. Monitor CBC weekly for 8 weeks.",
      "Intermediate TPMT Activity": "Reduce starting dose by 30-50%. Monitor CBC every 1-2 weeks for first 2 months.",
      "Normal TPMT Activity": "Use standard dosing per clinical guidelines.",
    },
    FLUOROURACIL: {
      "Deficient DPD Activity": "CONTRAINDICATED. Use alternative chemotherapy regimen. Fatal toxicity has been reported.",
      "Reduced DPD Activity": "Reduce dose by 25-50%. Monitor closely for GI and hematologic toxicity.",
      "Normal DPD Activity": "Use standard dosing per protocol.",
    },
  };

  const alternativesMap: Record<string, string[]> = {
    CODEINE: ["Acetaminophen", "Ibuprofen", "Morphine (direct)", "Hydromorphone", "Oxycodone"],
    CLOPIDOGREL: ["Prasugrel", "Ticagrelor", "Aspirin"],
    WARFARIN: ["Apixaban", "Rivaroxaban", "Edoxaban", "Dabigatran"],
    SIMVASTATIN: ["Rosuvastatin", "Pravastatin", "Fluvastatin", "Pitavastatin"],
    AZATHIOPRINE: ["Mycophenolate mofetil", "Methotrexate", "Cyclosporine"],
    FLUOROURACIL: ["Capecitabine (also DPYD-dependent)", "Gemcitabine", "Oxaliplatin"],
  };

  const dosing = dosingMap[drug]?.[label]
    || `Use standard ${drug.toLowerCase()} dosing. Consult CPIC guidelines for ${label}.`;
  const alternatives = (riskLevel === "Critical" || riskLevel === "High") ? (alternativesMap[drug] || []) : [];
  const warnings: string[] = [];

  if (riskLevel === "Critical" || riskLevel === "High") {
    warnings.push(`CPIC recommends avoiding or significantly adjusting ${drug.toLowerCase()} for this phenotype.`);
  }
  if (riskLevel === "Moderate") {
    warnings.push(`Dose adjustment recommended. Monitor closely for adverse effects.`);
  }

  return {
    dosing_guidance: dosing,
    alternative_drugs: alternatives,
    warnings,
    cpic_level: (riskLevel === "Critical" || riskLevel === "High") ? "Strong" : riskLevel === "Moderate" ? "Moderate" : "Optional",
  };
}

// ── Genotype-level overrides (most specific layer) ──
interface GenotypeOverride {
  riskLevel: RiskLevel;
  riskLabel: RiskLabel;
  severity: string;
  confidence: number;
}

// Key format: "DRUG:GENE:STAR:GENOTYPE"
const GENOTYPE_OVERRIDES: Record<string, GenotypeOverride> = {
  // CYP2C19 *2 for Clopidogrel (het = Moderate/IM, hom = Critical/PM)
  "CLOPIDOGREL:CYP2C19:*2:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous CYP2C19*2. Intermediate metabolizer. Reduced clopidogrel activation.", confidence: 90 },
  "CLOPIDOGREL:CYP2C19:*2:1/1": { riskLevel: "Critical", riskLabel: "Ineffective", severity: "Homozygous CYP2C19*2. Poor metabolizer. Severely impaired clopidogrel activation. Contraindicated.", confidence: 98 },
  "CLOPIDOGREL:CYP2C19:*3:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous CYP2C19*3. Reduced clopidogrel activation.", confidence: 90 },
  "CLOPIDOGREL:CYP2C19:*3:1/1": { riskLevel: "Critical", riskLabel: "Ineffective", severity: "Homozygous CYP2C19*3. Severely impaired clopidogrel activation.", confidence: 98 },
  // CYP2D6 *4 for Codeine (het = Moderate/IM, hom = Critical/PM)
  "CODEINE:CYP2D6:*4:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous CYP2D6*4. Reduced codeine-to-morphine conversion.", confidence: 90 },
  "CODEINE:CYP2D6:*4:1/1": { riskLevel: "Critical", riskLabel: "Ineffective", severity: "Homozygous CYP2D6*4. No codeine-to-morphine conversion. Drug completely ineffective.", confidence: 98 },
  // CYP2D6 gene duplication (*1xN = ultrarapid) -> Critical for CYP2D6
  "CODEINE:CYP2D6:*1xN:0/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "CYP2D6 gene duplication (*1xN). Ultra-rapid metabolizer. Risk of morphine overdose and respiratory depression.", confidence: 95 },
  "CODEINE:CYP2D6:*1xN:1/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "CYP2D6 gene duplication (homozygous *1xN). Ultra-rapid metabolizer. Severe morphine overdose risk.", confidence: 98 },
  // CYP2C9 *2/*3 for Warfarin (het = Moderate, hom = Critical)
  "WARFARIN:CYP2C9:*2:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous CYP2C9*2. Mildly reduced warfarin clearance.", confidence: 88 },
  "WARFARIN:CYP2C9:*2:1/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "Homozygous CYP2C9*2. Significantly reduced warfarin clearance. High bleeding risk.", confidence: 95 },
  "WARFARIN:CYP2C9:*3:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous CYP2C9*3. Reduced warfarin clearance.", confidence: 90 },
  "WARFARIN:CYP2C9:*3:1/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "Homozygous CYP2C9*3. Severely reduced warfarin clearance. Very high bleeding risk.", confidence: 97 },
  // SLCO1B1 *5 for Simvastatin (het = Moderate, hom = Critical)
  "SIMVASTATIN:SLCO1B1:*5:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous SLCO1B1*5. Decreased function. Elevated myopathy risk.", confidence: 88 },
  "SIMVASTATIN:SLCO1B1:*5:1/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "Homozygous SLCO1B1*5. Poor function. High myopathy/rhabdomyolysis risk.", confidence: 95 },
  // TPMT *3A/*3C for Azathioprine (het = Moderate, hom = Critical)
  "AZATHIOPRINE:TPMT:*3A:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous TPMT*3A. Intermediate activity. Reduce dose 30-50%.", confidence: 90 },
  "AZATHIOPRINE:TPMT:*3A:1/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "Homozygous TPMT*3A. No TPMT activity. Life-threatening myelosuppression.", confidence: 98 },
  "AZATHIOPRINE:TPMT:*3C:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous TPMT*3C. Intermediate activity.", confidence: 90 },
  "AZATHIOPRINE:TPMT:*3C:1/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "Homozygous TPMT*3C. No TPMT activity. Life-threatening myelosuppression.", confidence: 98 },
  // DPYD *2A for Fluorouracil (het = Moderate/Reduced, hom = Critical/Deficient)
  "FLUOROURACIL:DPYD:*2A:0/1": { riskLevel: "Moderate", riskLabel: "Adjust Dosage", severity: "Heterozygous DPYD*2A. Reduced DPD activity. Dose reduction 25-50% required.", confidence: 90 },
  "FLUOROURACIL:DPYD:*2A:1/1": { riskLevel: "Critical", riskLabel: "Toxic", severity: "Homozygous DPYD*2A. No DPD activity. Fatal toxicity risk. Contraindicated.", confidence: 99 },
};

export function getGenotypeOverride(
  drug: string,
  gene: string,
  variants: ParsedVariant[]
): GenotypeOverride | null {
  for (const v of variants) {
    if (v.gene !== gene || !v.starAllele || !v.genotype) continue;
    const key = `${drug}:${gene}:${v.starAllele}:${v.genotype}`;
    if (key in GENOTYPE_OVERRIDES) return GENOTYPE_OVERRIDES[key];
    const altKey = `${drug}:${gene}:${v.starAllele}:${v.genotype.replace("|", "/")}`;
    if (altKey in GENOTYPE_OVERRIDES) return GENOTYPE_OVERRIDES[altKey];
  }
  return null;
}

// ── Main entry point ──
// Both API routes call: evaluateRisk(drug, gene, phenotype)
// where phenotype is an abbreviation ("PM", "IM", "NM", "RM", "URM")
export function evaluateRisk(
  drug: SupportedDrug,
  gene: string,
  phenotype: Phenotype
): { riskAssessment: RiskAssessment; recommendation: ClinicalRecommendation } {
  // Step 1: Resolve abbreviation to full phenotype label string
  const label = resolveLabel(gene, phenotype);

  // Step 2: Determine risk via strict switch/case (user spec)
  const riskLevel = determineRisk(drug, gene, label);

  // Step 3: Derive clinical risk label from risk level + drug context
  const riskLabel = riskToLabel(drug, riskLevel, label);

  // Step 4: Build severity, confidence, recommendation
  const severity = getSeverity(drug, label, riskLevel);
  const confidence = getConfidence(riskLevel);
  const recommendation = buildRecommendation(drug, label, riskLevel);

  return {
    riskAssessment: {
      risk_level: riskLevel,
      risk_label: riskLabel,
      confidence_score: confidence,
      severity,
    },
    recommendation,
  };
}
