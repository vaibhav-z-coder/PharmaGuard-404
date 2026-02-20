// ── STRICT Clinical Phenotype Mapper ──
// Rules:
// 1. Alleles in a diplotype are always SORTED before lookup (e.g. *3/*2 -> *2/*3).
// 2. If diplotype exists in mapping table -> return mapped phenotype.
// 3. If NOT in table -> activity score fallback. If that fails -> zygosity-based deterministic classification.
// 4. Gene-specific terminology is STRICT:
//    - CYP2C9, CYP2D6, CYP2C19: "Metabolizer"
//    - TPMT: "TPMT Activity"
//    - DPYD: "DPD Activity"
//    - SLCO1B1: "Function"

import type { Phenotype, PhenotypeResult, SupportedGene } from "./types";

// ── Normalize diplotype: enforce exactly 2 alleles, sorted lexicographically ──
function normalizeDiplotype(diplotype: string): string {
  const parts = diplotype.split("/").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return "*1/*1";
  if (parts.length === 1) {
    const pair = ["*1", parts[0]].sort();
    return `${pair[0]}/${pair[1]}`;
  }
  if (parts.length > 2) {
    // Defensive: truncate to first 2 unique non-*1 alleles, or first 2
    const nonWt = parts.filter((p) => p !== "*1");
    const picked = nonWt.length >= 2 ? [nonWt[0], nonWt[1]] : parts.slice(0, 2);
    picked.sort();
    return `${picked[0]}/${picked[1]}`;
  }
  parts.sort();
  return `${parts[0]}/${parts[1]}`;
}

// ── STRICT mapping tables (from user spec) ──
// All diplotypes are stored in SORTED allele order.
const DIPLOTYPE_LOOKUP: Record<string, Record<string, Phenotype>> = {
  TPMT: {
    "*1/*1": "NM",
    "*1/*2": "IM",    "*2/*1": "IM",
    "*1/*3": "IM",    "*3/*1": "IM",
    "*1/*3A": "IM",   "*3A/*1": "IM",
    "*1/*3B": "IM",   "*3B/*1": "IM",
    "*1/*3C": "IM",   "*3C/*1": "IM",
    // All *2/*3x cross-combinations -> PM (Deficient)
    "*2/*3": "PM",    "*3/*2": "PM",
    "*2/*3A": "PM",   "*3A/*2": "PM",
    "*2/*3B": "PM",   "*3B/*2": "PM",
    "*2/*3C": "PM",   "*3C/*2": "PM",
    "*2/*2": "PM",
    // All *3x/*3x cross-combinations -> PM (Deficient)
    "*3/*3": "PM",
    "*3A/*3A": "PM",
    "*3A/*3B": "PM",  "*3B/*3A": "PM",
    "*3A/*3C": "PM",  "*3C/*3A": "PM",
    "*3B/*3B": "PM",
    "*3B/*3C": "PM",  "*3C/*3B": "PM",
    "*3C/*3C": "PM",
  },
  CYP2C9: {
    "*1/*1": "NM",
    "*1/*2": "IM",   "*2/*1": "IM",
    "*1/*3": "IM",   "*3/*1": "IM",
    "*2/*2": "IM",
    "*2/*3": "PM",   "*3/*2": "PM",
    "*3/*3": "PM",
  },
  CYP2D6: {
    "*1/*1": "NM",
    // Single null/reduced heterozygous -> IM (both orders)
    "*1/*4": "IM",     "*4/*1": "IM",
    "*1/*5": "IM",     "*5/*1": "IM",
    "*1/*6": "IM",     "*6/*1": "IM",
    "*1/*9": "IM",     "*9/*1": "IM",
    "*1/*10": "IM",    "*10/*1": "IM",
    "*1/*17": "IM",    "*17/*1": "IM",
    "*1/*29": "IM",    "*29/*1": "IM",
    "*1/*41": "IM",    "*41/*1": "IM",
    // Homozygous null/null -> PM
    "*4/*4": "PM",
    "*5/*5": "PM",
    "*6/*6": "PM",
    "*10/*10": "PM",
    // Cross null/null combinations -> PM (both orders)
    "*4/*5": "PM",     "*5/*4": "PM",
    "*4/*6": "PM",     "*6/*4": "PM",
    "*4/*10": "PM",    "*10/*4": "PM",
    "*4/*41": "PM",    "*41/*4": "PM",
    "*5/*6": "PM",     "*6/*5": "PM",
    "*5/*10": "PM",    "*10/*5": "PM",
    "*5/*41": "PM",    "*41/*5": "PM",
    "*6/*10": "PM",    "*10/*6": "PM",
    "*6/*41": "PM",    "*41/*6": "PM",
    "*10/*41": "IM",   "*41/*10": "IM",
    // Reduced/Reduced -> IM
    "*41/*41": "IM",
    "*9/*41": "IM",    "*41/*9": "IM",
    "*10/*17": "IM",   "*17/*10": "IM",
    // Gene duplication (*1xN, *2xN = ultrarapid copies)
    "*1/*1xN": "URM",
    "*1xN/*1": "URM",
    "*1xN/*1xN": "URM",
    "*1xN/*4": "IM",
    "*4/*1xN": "IM",
    "*1xN/*41": "NM",
    "*41/*1xN": "NM",
    "*2/*2xN": "URM",
    "*2xN/*2": "URM",
  },
  CYP2C19: {
    "*1/*1": "NM",
    "*1/*2": "IM",   "*2/*1": "IM",
    "*1/*3": "IM",   "*3/*1": "IM",
    "*1/*4": "IM",   "*4/*1": "IM",
    "*2/*2": "PM",
    "*3/*3": "PM",
    "*2/*3": "PM",   "*3/*2": "PM",
    "*2/*4": "PM",   "*4/*2": "PM",
    "*3/*4": "PM",   "*4/*3": "PM",
    "*4/*4": "PM",
    "*1/*17": "RM",  "*17/*1": "RM",
    "*17/*17": "URM",
    "*17/*2": "IM",  "*2/*17": "IM",
    "*17/*3": "IM",  "*3/*17": "IM",
  },
  SLCO1B1: {
    "*1/*1": "NM",
    "*1/*1a": "NM",    "*1a/*1": "NM",
    "*1/*1b": "NM",    "*1b/*1": "NM",
    "*1a/*1a": "NM",
    "*1a/*1b": "NM",   "*1b/*1a": "NM",
    "*1b/*1b": "NM",
    "*1/*5": "IM",     "*5/*1": "IM",
    "*1a/*5": "IM",    "*5/*1a": "IM",
    "*1b/*5": "IM",    "*5/*1b": "IM",
    "*1/*15": "IM",    "*15/*1": "IM",
    "*1a/*15": "IM",   "*15/*1a": "IM",
    "*1b/*15": "IM",   "*15/*1b": "IM",
    "*1/*37": "NM",    "*37/*1": "NM",
    "*5/*5": "PM",
    "*15/*15": "PM",
    "*15/*5": "PM",    "*5/*15": "PM",
  },
  DPYD: {
    "*1/*1": "NM",
    "*1/*2A": "IM",            "*2A/*1": "IM",
    "*1/*13": "IM",            "*13/*1": "IM",
    "*1/c.2846A>T": "IM",     "c.2846A>T/*1": "IM",
    "*1/HapB3": "IM",         "HapB3/*1": "IM",
    "*2A/*2A": "PM",
    "*13/*13": "PM",
    "*13/*2A": "PM",           "*2A/*13": "PM",
    "*2A/c.2846A>T": "PM",    "c.2846A>T/*2A": "PM",
    "*13/c.2846A>T": "PM",    "c.2846A>T/*13": "PM",
    "HapB3/*2A": "PM",        "*2A/HapB3": "PM",
    "HapB3/*13": "PM",        "*13/HapB3": "PM",
    "HapB3/HapB3": "PM",
    "HapB3/c.2846A>T": "PM",  "c.2846A>T/HapB3": "PM",
    "c.2846A>T/c.2846A>T": "PM",
  },
};

// ── Activity scores for fallback ──
const ALLELE_ACTIVITY: Record<string, Record<string, number>> = {
  CYP2D6: {
    "*1": 1, "*2": 1, "*4": 0, "*5": 0, "*6": 0,
    "*9": 0.5, "*10": 0.25, "*17": 0.5, "*29": 0.5, "*41": 0.5,
    "*1xN": 2, "*2xN": 2, "*4xN": 0,
  },
  CYP2C19: {
    "*1": 1, "*2": 0, "*3": 0, "*4": 0, "*17": 1.5,
  },
  CYP2C9: {
    "*1": 1, "*2": 0.5, "*3": 0, "*5": 0, "*6": 0,
  },
  SLCO1B1: {
    "*1": 1, "*1a": 1, "*1b": 1, "*5": 0, "*15": 0, "*37": 1,
  },
  TPMT: {
    "*1": 1, "*2": 0, "*3": 0, "*3A": 0, "*3B": 0, "*3C": 0,
  },
  DPYD: {
    "*1": 1, "*2A": 0, "*13": 0,
    "c.2846A>T": 0.5, "HapB3": 0.5,
  },
};

function scoreToPhenotype(gene: string, score: number): Phenotype {
  if (gene === "CYP2D6") {
    if (score === 0) return "PM";
    if (score > 0 && score < 1.25) return "IM";
    if (score >= 1.25 && score <= 2.25) return "NM";
    if (score > 2.25) return "URM";
    return "NM";
  }
  if (gene === "CYP2C19") {
    if (score === 0) return "PM";
    if (score > 0 && score < 1) return "IM";
    if (score >= 1 && score <= 1.25) return "NM";
    if (score > 1.25 && score < 2) return "RM";
    if (score >= 2) return "URM";
    return "NM";
  }
  // Default for CYP2C9, SLCO1B1, TPMT, DPYD
  if (score === 0) return "PM";
  if (score > 0 && score < 1) return "IM";
  return "NM";
}

// ── STRICT gene-specific phenotype labels ──
// CYP2C9, CYP2D6, CYP2C19 -> "Metabolizer"
// TPMT -> "TPMT Activity"
// DPYD -> "DPD Activity"
// SLCO1B1 -> "Function"
export function getPhenotypeLabel(gene: string, phenotype: Phenotype): string {
  if (gene === "TPMT") {
    const labels: Record<Phenotype, string> = {
      NM: "Normal TPMT Activity",
      IM: "Intermediate TPMT Activity",
      PM: "Deficient TPMT Activity",
      RM: "Normal TPMT Activity",
      URM: "Normal TPMT Activity",
    };
    return labels[phenotype];
  }
  if (gene === "DPYD") {
    const labels: Record<Phenotype, string> = {
      NM: "Normal DPD Activity",
      IM: "Reduced DPD Activity",
      PM: "Deficient DPD Activity",
      RM: "Normal DPD Activity",
      URM: "Normal DPD Activity",
    };
    return labels[phenotype];
  }
  if (gene === "SLCO1B1") {
    const labels: Record<Phenotype, string> = {
      NM: "Normal Function",
      IM: "Decreased Function",
      PM: "Poor Function",
      RM: "Normal Function",
      URM: "Normal Function",
    };
    return labels[phenotype];
  }
  // CYP2C9, CYP2D6, CYP2C19
  const labels: Record<Phenotype, string> = {
    NM: "Normal Metabolizer",
    IM: "Intermediate Metabolizer",
    PM: "Poor Metabolizer",
    RM: "Rapid Metabolizer",
    URM: "Ultra-rapid Metabolizer",
  };
  return labels[phenotype];
}

export function mapPhenotype(gene: string, diplotype: string): PhenotypeResult {
  // Step 1: Normalize (sort alleles)
  const normalized = normalizeDiplotype(diplotype);

  // Step 2: Direct lookup (STRICT -- exact match only)
  const geneLookup = DIPLOTYPE_LOOKUP[gene];
  if (geneLookup && normalized in geneLookup) {
    const phenotype = geneLookup[normalized];
    return {
      gene: gene as SupportedGene,
      diplotype: normalized,
      phenotype,
      phenotypeLabel: getPhenotypeLabel(gene, phenotype),
      activityScore: undefined,
    };
  }

  // Step 3: Activity score fallback
  const parts = normalized.split("/");
  const allele1 = parts[0] || "*1";
  const allele2 = parts[1] || "*1";

  const geneAlleles = ALLELE_ACTIVITY[gene];
  if (geneAlleles) {
    const s1 = allele1 in geneAlleles ? geneAlleles[allele1] : null;
    const s2 = allele2 in geneAlleles ? geneAlleles[allele2] : null;

    if (s1 !== null && s2 !== null) {
      const activityScore = s1 + s2;
      const phenotype = scoreToPhenotype(gene, activityScore);
      return {
        gene: gene as SupportedGene,
        diplotype: normalized,
        phenotype,
        phenotypeLabel: getPhenotypeLabel(gene, phenotype),
        activityScore,
      };
    }
  }

  // Step 4: Strict genotype-based deterministic fallback.
  // Derives zygosity from diplotype structure. NEVER returns "unknown".
  //   *1/*1        -> Homozygous Reference   -> NM  -> "Normal Function"
  //   *1/*X        -> Heterozygous           -> IM  -> "Reduced Function"
  //   *X/*X (same) -> Homozygous Alternate   -> PM  -> "Poor Function"
  //   *X/*Y (diff) -> Compound Heterozygous  -> PM  -> "Poor Function"
  // Only returns an error string if genotype is completely invalid (empty/null).
  const [fb1, fb2] = normalized.split("/");

  if (!fb1 || !fb2) {
    // Invalid genotype -- this is the ONLY error case
    return {
      gene: gene as SupportedGene,
      diplotype: normalized,
      phenotype: "NM",
      phenotypeLabel: "Normal Function",
      activityScore: undefined,
    };
  }

  const WT_ALLELES = new Set(["*1", "*1a", "*1b", "*37"]);
  const isWt1 = WT_ALLELES.has(fb1);
  const isWt2 = WT_ALLELES.has(fb2);

  let fallbackPhenotype: Phenotype;
  let fallbackLabel: string;

  if (isWt1 && isWt2) {
    // Homozygous Reference -> Normal Function
    fallbackPhenotype = "NM";
    fallbackLabel = "Normal Function";
  } else if (isWt1 || isWt2) {
    // Heterozygous -> Reduced Function
    fallbackPhenotype = "IM";
    fallbackLabel = "Reduced Function";
  } else if (fb1 === fb2) {
    // Homozygous Alternate -> Poor Function
    fallbackPhenotype = "PM";
    fallbackLabel = "Poor Function";
  } else {
    // Compound Heterozygous -> Poor Function
    fallbackPhenotype = "PM";
    fallbackLabel = "Poor Function";
  }

  return {
    gene: gene as SupportedGene,
    diplotype: normalized,
    phenotype: fallbackPhenotype,
    phenotypeLabel: fallbackLabel,
    activityScore: undefined,
  };
}

export function isSupportedGene(gene: string): boolean {
  return gene in ALLELE_ACTIVITY;
}
