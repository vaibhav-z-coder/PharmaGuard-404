// ── VCF v4.x Parser (Strict 12-Step Deterministic Engine v2) ──
// Follows the exact processing order from the clinical spec.
// Steps: Structure -> Clean -> ALT -> GT -> Ploidy -> Index -> Map -> Zygosity -> Phenotype -> Risk
// Patched: multi-allelic GT (2/3, 3/3), trailing ALT comma, partial missing (0/.),
//          malformed genotype, ploidy validation, compound het, zygosity propagation.

import type { ParsedVariant, VCFParseResult, VCFParseError } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Known PGx-relevant rsIDs mapped to gene + star allele
const KNOWN_PGX_VARIANTS: Record<string, { gene: string; starAllele: string }> = {
  // CYP2D6
  "rs3892097": { gene: "CYP2D6", starAllele: "*4" },
  "rs5030655": { gene: "CYP2D6", starAllele: "*6" },
  "rs1065852": { gene: "CYP2D6", starAllele: "*10" },
  "rs28371725": { gene: "CYP2D6", starAllele: "*41" },
  "rs16947": { gene: "CYP2D6", starAllele: "*2" },
  "rs1135840": { gene: "CYP2D6", starAllele: "*2" },
  // CYP2C19
  "rs4244285": { gene: "CYP2C19", starAllele: "*2" },
  "rs4986893": { gene: "CYP2C19", starAllele: "*3" },
  "rs12248560": { gene: "CYP2C19", starAllele: "*17" },
  "rs28399504": { gene: "CYP2C19", starAllele: "*4" },
  // CYP2C9
  "rs1799853": { gene: "CYP2C9", starAllele: "*2" },
  "rs1057910": { gene: "CYP2C9", starAllele: "*3" },
  "rs28371686": { gene: "CYP2C9", starAllele: "*5" },
  // SLCO1B1
  "rs4149056": { gene: "SLCO1B1", starAllele: "*5" },
  "rs2306283": { gene: "SLCO1B1", starAllele: "*1b" },
  "rs4149015": { gene: "SLCO1B1", starAllele: "*15" },
  // TPMT
  "rs1800462": { gene: "TPMT", starAllele: "*2" },
  "rs1800460": { gene: "TPMT", starAllele: "*3B" },
  "rs1142345": { gene: "TPMT", starAllele: "*3C" },
  // DPYD
  "rs3918290": { gene: "DPYD", starAllele: "*2A" },
  "rs55886062": { gene: "DPYD", starAllele: "*13" },
  "rs67376798": { gene: "DPYD", starAllele: "c.2846A>T" },
  "rs75017182": { gene: "DPYD", starAllele: "HapB3" },
};

// ── Zygosity determination (Step 8 of strict spec) ──
export type Zygosity =
  | "Homozygous Reference"  // 0/0 -- no variant
  | "Heterozygous"          // 0/1 -- one copy
  | "Homozygous Alternate"  // 1/1 -- two copies same alt
  | "Compound Heterozygous" // 1/2 -- two different alts
  | "Unknown";              // No GT data

export interface ProcessedVariantRow {
  variant: ParsedVariant;
  zygosity: Zygosity;
  gtAlleles: [number, number] | null;
  skipReason?: string;
}

function parseInfoField(info: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!info || info === ".") return result;
  const fields = info.split(";");
  for (const field of fields) {
    const eqIndex = field.indexOf("=");
    if (eqIndex > 0) {
      result[field.substring(0, eqIndex)] = field.substring(eqIndex + 1);
    } else {
      result[field] = "true";
    }
  }
  return result;
}

// ── Step 2: Clean input ──
function cleanGenotype(gt: string): string {
  // Normalize phased separator to unphased
  return gt.replace(/\|/g, "/").trim();
}

// ── Steps 4-8: Process a single VCF data row through the strict pipeline ──
function processRow(cols: string[]): ProcessedVariantRow {
  const [chrom, pos, id, ref, alt, qual, filter, info, format, sample] = cols;
  const parsedInfo = parseInfoField(info || ".");

  // Gene + star allele resolution
  let gene = parsedInfo.GENE || parsedInfo.gene || undefined;
  let rawStar = parsedInfo.STAR || parsedInfo.star || undefined;
  let starAllele: string | undefined;
  if (rawStar) {
    const trimmed = rawStar.trim();
    if (trimmed.includes("/")) {
      const starParts = trimmed.split("/").map((s: string) => s.trim());
      const nonRef = starParts.filter((s: string) => s !== "*1");
      starAllele = nonRef.length > 0 ? nonRef[0] : starParts[0];
    } else {
      starAllele = trimmed;
    }
  }

  const rsid = id && id !== "." ? id : undefined;
  if (rsid && KNOWN_PGX_VARIANTS[rsid]) {
    gene = gene || KNOWN_PGX_VARIANTS[rsid].gene;
    starAllele = starAllele || KNOWN_PGX_VARIANTS[rsid].starAllele;
  }

  const baseVariant: ParsedVariant = {
    chrom: chrom || ".",
    pos: parseInt(pos, 10) || 0,
    id: rsid || ".",
    ref: ref || ".",
    alt: alt || ".",
    qual: qual || ".",
    filter: filter || ".",
    info: parsedInfo,
    gene,
    starAllele,
    genotype: undefined,
  };

  // Step 3: ALT validation
  if (!alt || alt === ".") {
    return { variant: baseVariant, zygosity: "Homozygous Reference", gtAlleles: null, skipReason: "Reference only variant" };
  }

  // Skip structural variants (e.g., <DEL>, <INS>, <DUP>, <CNV>)
  if (alt.startsWith("<") && alt.endsWith(">")) {
    return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: "Structural variant" };
  }

  // Split and clean ALT list -- handles trailing comma ("A,T,") producing empty strings
  const altList = alt.split(",").map((a) => a.trim()).filter((a) => a.length > 0);
  if (altList.length === 0) {
    return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: "Empty ALT after cleaning" };
  }
  if (altList.some((a) => a.startsWith("<") && a.endsWith(">"))) {
    return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: "Structural variant in ALT" };
  }

  // Step 4: Extract GT from FORMAT
  if (!format || !sample) {
    // No FORMAT/SAMPLE columns -- VCF without genotype data.
    // Per Step 4 spec: GT field missing => we cannot determine zygosity.
    // HOWEVER, for PGx files that only have CHROM-POS-ID-REF-ALT-QUAL-FILTER-INFO,
    // we infer het (0/1) as the conservative default since the variant IS listed.
    baseVariant.genotype = "0/1";
    return { variant: baseVariant, zygosity: "Heterozygous", gtAlleles: [0, 1] };
  }

  const formatFields = format.split(":");
  const sampleFields = sample.split(":");
  const gtIndex = formatFields.indexOf("GT");

  if (gtIndex < 0 || gtIndex >= sampleFields.length) {
    // GT field missing from FORMAT
    baseVariant.genotype = "0/1";
    return { variant: baseVariant, zygosity: "Heterozygous", gtAlleles: [0, 1] };
  }

  const rawGt = cleanGenotype(sampleFields[gtIndex]);
  baseVariant.genotype = rawGt;

  // Step 4b: Missing genotype ("./.", ".", empty)
  if (rawGt === "./." || rawGt === "." || rawGt === "" || rawGt === "././.") {
    return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: "Missing genotype" };
  }

  // Step 5: Ploidy check -- split and validate exactly 2 alleles (diploid only)
  const gtParts = rawGt.split("/");
  if (gtParts.length !== 2) {
    return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: `Unsupported ploidy (${gtParts.length} alleles)` };
  }

  // Step 6: Index validation -- each allele must be "." or a non-negative integer
  const alleleIndices: number[] = [];
  for (const part of gtParts) {
    // Partial missing like "0/." -- reject
    if (part === "." || part === "") {
      return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: "Missing genotype" };
    }
    // Must be purely numeric (no letters, no special chars except digits)
    if (!/^\d+$/.test(part)) {
      return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: "Malformed genotype" };
    }
    const idx = parseInt(part, 10);
    // Validate ALT index bounds: allele 0 = REF, allele N = ALT[N-1]
    // So max valid index = altList.length (since ALT[0..length-1] maps to indices 1..length)
    if (idx > altList.length) {
      return { variant: baseVariant, zygosity: "Unknown", gtAlleles: null, skipReason: `Invalid ALT index (${idx} > ${altList.length})` };
    }
    alleleIndices.push(idx);
  }

  const [a1, a2] = alleleIndices;

  // Step 8: Determine zygosity
  let zygosity: Zygosity;
  if (a1 === 0 && a2 === 0) {
    zygosity = "Homozygous Reference";
  } else if (a1 === 0 || a2 === 0) {
    zygosity = "Heterozygous";
  } else if (a1 === a2) {
    zygosity = "Homozygous Alternate";
  } else {
    zygosity = "Compound Heterozygous";
  }

  // Propagate zygosity onto the variant for downstream consumers
  baseVariant.zygosity = zygosity;

  return { variant: baseVariant, zygosity, gtAlleles: [a1, a2] };
}

// ── Main VCF parser ──
export function parseVCF(fileContent: string): VCFParseResult | VCFParseError {
  const byteSize = new TextEncoder().encode(fileContent).length;
  if (byteSize > MAX_FILE_SIZE) {
    return { success: false, error: "File exceeds 5MB size limit", details: `File size: ${(byteSize / (1024 * 1024)).toFixed(2)}MB` };
  }

  const lines = fileContent.split("\n").map((l) => l.trim());
  if (lines.length === 0) {
    return { success: false, error: "Empty VCF file" };
  }

  const formatLine = lines.find((l) => l.startsWith("##fileformat="));
  if (!formatLine) {
    return { success: false, error: "Invalid VCF format", details: "Missing ##fileformat header line." };
  }

  const fileFormat = formatLine.replace("##fileformat=", "");
  if (!fileFormat.startsWith("VCF")) {
    return { success: false, error: "Invalid VCF format", details: `Unrecognized format: ${fileFormat}.` };
  }

  const headerLineIndex = lines.findIndex((l) => l.startsWith("#CHROM"));
  if (headerLineIndex === -1) {
    return { success: false, error: "Invalid VCF format", details: "Missing #CHROM header line." };
  }

  const headerLine = lines[headerLineIndex];
  const isTabSeparated = headerLine.includes("\t");
  const delimiter = isTabSeparated ? "\t" : /\s+/;

  const headerCols = headerLine.split(delimiter);
  const expectedCols = ["#CHROM", "POS", "ID", "REF", "ALT", "QUAL", "FILTER", "INFO"];
  for (let i = 0; i < expectedCols.length; i++) {
    if (headerCols[i] !== expectedCols[i]) {
      return { success: false, error: "Invalid VCF column headers", details: `Expected ${expectedCols[i]} at column ${i + 1}, found ${headerCols[i] || "missing"}.` };
    }
  }

  const sampleId = headerCols.length > 9 ? headerCols[9] : undefined;

  const variants: ParsedVariant[] = [];
  const processedRows: ProcessedVariantRow[] = [];

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith("#")) continue;

    const cols = line.split(delimiter);
    if (cols.length < 5) continue; // Need at minimum CHROM POS ID REF ALT

    const processed = processRow(cols);

    // CRITICAL: Skip homozygous reference rows (0/0).
    // The patient does NOT carry this variant.
    if (processed.zygosity === "Homozygous Reference") continue;

    // Skip rows with processing errors
    if (processed.skipReason && processed.zygosity === "Unknown") continue;

    processedRows.push(processed);
    variants.push(processed.variant);
  }

  return { success: true, variants, sampleId, fileFormat };
}

// Filter variants to only PGx-relevant ones for a specific gene
export function filterVariantsForGene(variants: ParsedVariant[], gene: string): ParsedVariant[] {
  return variants.filter((v) => v.gene === gene);
}

// Get all unique genes found in the VCF
export function getDetectedGenes(variants: ParsedVariant[]): string[] {
  const genes = new Set<string>();
  for (const v of variants) {
    if (v.gene) genes.add(v.gene);
  }
  return Array.from(genes);
}

// ── Clinical impact rank (lower = more severe) for allele prioritization ──
const ALLELE_SEVERITY: Record<string, number> = {
  // Null function (PM) alleles -- highest priority
  "*4": 0, "*5": 0, "*6": 0, "*2A": 0, "*13": 0, "*3": 0,
  "*3A": 0, "*3B": 0, "*3C": 0, "*2": 0,
  // Reduced function (IM) alleles
  "*9": 1, "*10": 1, "*17": 1, "*29": 1, "*41": 1,
  "*15": 1, "c.2846A>T": 1, "HapB3": 1,
  // Increased function (URM/RM) alleles
  "*1xN": 2, "*2xN": 2,
  // Normal function -- lowest priority (never include if there's something worse)
  "*1": 99, "*1a": 99, "*1b": 99, "*37": 99,
};

function alleleSeverity(allele: string): number {
  return ALLELE_SEVERITY[allele] ?? 50; // Unknown alleles get medium priority
}

// ── Build diplotype from detected star alleles for a gene ──
// A human carries exactly 2 copies of each gene (diploid).
// Uses zygosity from GT to determine allele count:
//   0/1 (Heterozygous) = one copy of variant + one copy of *1
//   1/1 (Homozygous Alternate) = two copies of variant
//   1/2 (Compound Het) = one copy each of two different variants
// NEVER produces more than 2 alleles.
// When >2 unique het variants are found, prioritizes the most clinically
// impactful alleles (PM > IM > RM > NM).
export function buildDiplotype(variants: ParsedVariant[], gene: string): string {
  const geneVariants = filterVariantsForGene(variants, gene);

  // Collect unique star alleles with their zygosity
  const alleleMap = new Map<string, string>(); // starAllele -> genotype
  for (const v of geneVariants) {
    if (!v.starAllele) continue;
    const allele = v.starAllele.trim();
    const gt = v.genotype || "0/1";

    // Normalize genotype
    const normalizedGt = gt.replace(/\|/g, "/");

    // Keep the most impactful genotype (1/1 > 0/1)
    const existing = alleleMap.get(allele);
    const isHom = normalizedGt === "1/1";
    if (!existing || isHom) {
      alleleMap.set(allele, normalizedGt);
    }
  }

  if (alleleMap.size === 0) return "*1/*1"; // Wildtype

  // Sort alleles by clinical severity (most impactful first)
  const sortedEntries = [...alleleMap.entries()].sort(
    (a, b) => alleleSeverity(a[0]) - alleleSeverity(b[0])
  );

  // Build exactly 2 alleles, prioritizing most severe
  const alleles: string[] = [];

  for (const [allele, gt] of sortedEntries) {
    if (alleles.length >= 2) break;
    // Determine copy count from genotype:
    //   "1/1" = homozygous alt = two copies of this star allele
    //   "0/1" = heterozygous = one copy
    //   "1/2", "2/3", etc. = compound het for that row = one copy of the star allele
    //     (the other alt allele would need a separate rsID mapping)
    const parts = gt.split("/");
    const isHomAlt = parts.length === 2 && parts[0] === parts[1] && parts[0] !== "0";
    if (isHomAlt) {
      alleles.push(allele, allele);
    } else {
      alleles.push(allele);
    }
  }

  // Enforce diploid (exactly 2 alleles) and sort for consistency
  let result: string;
  if (alleles.length === 0) {
    result = "*1/*1";
  } else if (alleles.length === 1) {
    // One het variant: pair with wildtype *1
    const pair = ["*1", alleles[0]].sort();
    result = `${pair[0]}/${pair[1]}`;
  } else {
    // Two alleles: sort for canonical form
    const pair = [alleles[0], alleles[1]].sort();
    result = `${pair[0]}/${pair[1]}`;
  }

  return result;
}
