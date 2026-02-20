// ── Template-Based AI Explainer (CPIC-Aligned) ──

import type { AIExplanation, Phenotype, SupportedDrug } from "./types";
import { PHENOTYPE_LABELS } from "./types";

interface ExplanationTemplate {
  summaryTemplate: string;
  mechanismTemplate: string;
  patientFriendlyTemplate: string;
  citations: string[];
}

const BASE_CITATIONS = [
  "CPIC Guidelines - Clinical Pharmacogenetics Implementation Consortium. https://cpicpgx.org/guidelines/",
  "PharmGKB - Pharmacogenomics Knowledge Base. https://www.pharmgkb.org/",
  "PharmVar - Pharmacogene Variation Consortium. https://www.pharmvar.org/",
];

const TEMPLATES: Record<string, Record<string, ExplanationTemplate>> = {
  CODEINE: {
    CYP2D6: {
      summaryTemplate:
        "CYP2D6 {phenotypeLabel} status detected. CYP2D6 is the primary enzyme responsible for converting codeine (a prodrug) into its active metabolite morphine. {riskExplanation}",
      mechanismTemplate:
        "Codeine undergoes O-demethylation by hepatic CYP2D6 to form morphine, which is the primary analgesic metabolite. The CYP2D6 gene is highly polymorphic, with over 100 known allelic variants. The detected diplotype {diplotype} results in {phenotypeLabel} status with an activity score that {activityExplanation}. This directly impacts the rate and extent of codeine-to-morphine conversion, {clinicalConsequence}.",
      patientFriendlyTemplate:
        "Your body uses an enzyme called CYP2D6 to convert codeine into morphine, which is the part of the drug that actually relieves pain. Your genetic test shows you are a {phenotypeLabel}, which means {patientExplanation}. {patientAction}",
      citations: [
        ...BASE_CITATIONS,
        "Crews KR, et al. Clinical Pharmacogenetics Implementation Consortium Guidelines for Cytochrome P450 2D6 Genotype and Codeine Therapy: 2014 update. Clin Pharmacol Ther. 2014;95(4):376-382.",
      ],
    },
  },
  CLOPIDOGREL: {
    CYP2C19: {
      summaryTemplate:
        "CYP2C19 {phenotypeLabel} status detected. CYP2C19 is the primary enzyme responsible for activating clopidogrel. {riskExplanation}",
      mechanismTemplate:
        "Clopidogrel is a prodrug that requires two sequential CYP-dependent oxidation steps for activation, with CYP2C19 playing the primary role. The detected diplotype {diplotype} results in {phenotypeLabel} status, {activityExplanation}. {clinicalConsequence}.",
      patientFriendlyTemplate:
        "Clopidogrel is a blood thinner that needs to be activated by your body before it can work. Your genetic test shows you are a {phenotypeLabel} for the enzyme CYP2C19, which means {patientExplanation}. {patientAction}",
      citations: [
        ...BASE_CITATIONS,
        "Scott SA, et al. Clinical Pharmacogenetics Implementation Consortium Guidelines for CYP2C19 Genotype and Clopidogrel Therapy: 2013 update. Clin Pharmacol Ther. 2013;94(3):317-323.",
      ],
    },
  },
  WARFARIN: {
    CYP2C9: {
      summaryTemplate:
        "CYP2C9 {phenotypeLabel} status detected. CYP2C9 metabolizes the more potent S-enantiomer of warfarin. {riskExplanation}",
      mechanismTemplate:
        "Warfarin is administered as a racemic mixture. The S-enantiomer is 3-5 times more potent than the R-enantiomer and is primarily metabolized by CYP2C9. The detected diplotype {diplotype} results in {phenotypeLabel} status, {activityExplanation}. {clinicalConsequence}.",
      patientFriendlyTemplate:
        "Warfarin is a blood thinner used to prevent blood clots. Your body breaks down warfarin using an enzyme called CYP2C9. Your genetic test shows you are a {phenotypeLabel}, which means {patientExplanation}. {patientAction}",
      citations: [
        ...BASE_CITATIONS,
        "Johnson JA, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) Guidelines for Pharmacogenetics-Guided Warfarin Dosing: 2017 Update. Clin Pharmacol Ther. 2017;102(3):397-404.",
      ],
    },
  },
  SIMVASTATIN: {
    SLCO1B1: {
      summaryTemplate:
        "SLCO1B1 {phenotypeLabel} status detected. SLCO1B1 encodes the hepatic uptake transporter OATP1B1, which facilitates simvastatin acid uptake into the liver. {riskExplanation}",
      mechanismTemplate:
        "SLCO1B1 encodes the organic anion transporting polypeptide 1B1 (OATP1B1), a hepatic influx transporter critical for simvastatin lactone and acid uptake into hepatocytes. The detected diplotype {diplotype} results in {phenotypeLabel} transporter function, {activityExplanation}. {clinicalConsequence}.",
      patientFriendlyTemplate:
        "Simvastatin is a cholesterol-lowering medication. Your body uses a transporter protein called OATP1B1 to move this drug into your liver where it works. Your genetic test shows you have {phenotypeLabel} transporter function, which means {patientExplanation}. {patientAction}",
      citations: [
        ...BASE_CITATIONS,
        "Ramsey LB, et al. The Clinical Pharmacogenetics Implementation Consortium Guideline for SLCO1B1 and Simvastatin-Induced Myopathy: 2014 Update. Clin Pharmacol Ther. 2014;96(4):423-428.",
      ],
    },
  },
  AZATHIOPRINE: {
    TPMT: {
      summaryTemplate:
        "TPMT {phenotypeLabel} status detected. TPMT is a key enzyme in the metabolism of thiopurine drugs including azathioprine. {riskExplanation}",
      mechanismTemplate:
        "Azathioprine is converted to 6-mercaptopurine (6-MP), which undergoes competing metabolic pathways. TPMT catalyzes S-methylation of 6-MP, diverting it away from cytotoxic thioguanine nucleotide (TGN) formation. The detected diplotype {diplotype} results in {phenotypeLabel} TPMT activity, {activityExplanation}. {clinicalConsequence}.",
      patientFriendlyTemplate:
        "Azathioprine is an immunosuppressant medication. Your body uses an enzyme called TPMT to break it down. Your genetic test shows you are a {phenotypeLabel}, which means {patientExplanation}. {patientAction}",
      citations: [
        ...BASE_CITATIONS,
        "Relling MV, et al. Clinical Pharmacogenetics Implementation Consortium Guidelines for Thiopurine Methyltransferase Genotype and Thiopurine Dosing: 2013 Update. Clin Pharmacol Ther. 2013;93(4):324-325.",
      ],
    },
  },
  FLUOROURACIL: {
    DPYD: {
      summaryTemplate:
        "DPYD {phenotypeLabel} status detected. Dihydropyrimidine dehydrogenase (DPD), encoded by DPYD, is the rate-limiting enzyme in fluoropyrimidine catabolism. {riskExplanation}",
      mechanismTemplate:
        "Dihydropyrimidine dehydrogenase (DPD) is the initial and rate-limiting enzyme in the catabolism of 5-fluorouracil, responsible for degrading >80% of administered dose. The detected diplotype {diplotype} results in {phenotypeLabel} DPD activity, {activityExplanation}. {clinicalConsequence}.",
      patientFriendlyTemplate:
        "5-Fluorouracil (5-FU) is a chemotherapy drug. Your body uses an enzyme called DPD to break down this drug after it does its job. Your genetic test shows you are a {phenotypeLabel}, which means {patientExplanation}. {patientAction}",
      citations: [
        ...BASE_CITATIONS,
        "Amstutz U, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) Guideline for Dihydropyrimidine Dehydrogenase Genotype and Fluoropyrimidine Dosing: 2017 Update. Clin Pharmacol Ther. 2018;103(2):210-216.",
      ],
    },
  },
};

// ── Phenotype-specific phrases ──

function getRiskExplanation(phenotype: Phenotype, drug: string): string {
  const map: Record<Phenotype, string> = {
    PM: `This patient has significantly reduced or absent enzyme activity, which substantially impacts ${drug} metabolism and clinical outcomes.`,
    IM: `This patient has reduced enzyme activity, which may moderately impact ${drug} metabolism and clinical response.`,
    NM: `This patient has normal enzyme activity. Standard ${drug} metabolism and clinical response are expected.`,
    RM: `This patient has increased enzyme activity, which may result in enhanced ${drug} metabolism.`,
    URM: `This patient has significantly increased enzyme activity, which may substantially alter ${drug} metabolism and increase risk of adverse effects.`,
  };
  return map[phenotype];
}

function getActivityExplanation(phenotype: Phenotype): string {
  const map: Record<Phenotype, string> = {
    PM: "indicating absent or severely reduced enzymatic activity",
    IM: "indicating reduced enzymatic activity compared to normal metabolizers",
    NM: "indicating normal enzymatic activity",
    RM: "indicating increased enzymatic activity above the normal range",
    URM: "indicating significantly elevated enzymatic activity",
  };
  return map[phenotype];
}

function getClinicalConsequence(phenotype: Phenotype, drug: string): string {
  const map: Record<Phenotype, string> = {
    PM: `This significantly alters the pharmacokinetics of ${drug}, requiring major dosing adjustments or drug avoidance.`,
    IM: `This may result in altered ${drug} pharmacokinetics, potentially requiring dosing modifications.`,
    NM: `Standard pharmacokinetics of ${drug} are expected, and standard dosing is appropriate.`,
    RM: `Enhanced metabolism of ${drug} may result in altered drug exposure.`,
    URM: `Significantly enhanced metabolism of ${drug} may result in dangerous changes in drug exposure.`,
  };
  return map[phenotype];
}

function getPatientExplanation(phenotype: Phenotype): string {
  const map: Record<Phenotype, string> = {
    PM: "your body breaks down this medication much more slowly than most people, or cannot break it down at all",
    IM: "your body breaks down this medication somewhat more slowly than most people",
    NM: "your body processes this medication at a normal rate",
    RM: "your body breaks down this medication faster than most people",
    URM: "your body breaks down this medication much faster than most people",
  };
  return map[phenotype];
}

function getPatientAction(phenotype: Phenotype): string {
  const map: Record<Phenotype, string> = {
    PM: "Your doctor may need to use a different medication or a much lower dose. Do not change your medication without consulting your healthcare provider.",
    IM: "Your doctor may consider adjusting your dose or monitoring you more closely. Discuss this result with your healthcare provider.",
    NM: "Standard dosing should work well for you. Continue taking your medication as prescribed.",
    RM: "Your doctor may want to monitor your response more closely. Discuss this result with your healthcare provider.",
    URM: "Your doctor may need to use a different medication. This result is important to share with all your healthcare providers.",
  };
  return map[phenotype];
}

export function generateExplanation(
  drug: SupportedDrug,
  gene: string,
  phenotype: Phenotype,
  diplotype: string
): AIExplanation {
  const phenotypeLabel = PHENOTYPE_LABELS[phenotype];
  const drugTemplates = TEMPLATES[drug];
  const template = drugTemplates?.[gene];

  if (!template) {
    return {
      summary: `${gene} ${phenotypeLabel} status detected for ${drug}. Consult CPIC guidelines for specific recommendations.`,
      mechanism: `No detailed mechanism template available for ${drug}-${gene} interaction.`,
      patient_friendly: `Your genetic test found a result that may affect how your body processes ${drug}. Please discuss with your doctor.`,
      citations: BASE_CITATIONS,
    };
  }

  const replacements: Record<string, string> = {
    "{phenotypeLabel}": phenotypeLabel,
    "{diplotype}": diplotype,
    "{riskExplanation}": getRiskExplanation(phenotype, drug.toLowerCase()),
    "{activityExplanation}": getActivityExplanation(phenotype),
    "{clinicalConsequence}": getClinicalConsequence(phenotype, drug.toLowerCase()),
    "{patientExplanation}": getPatientExplanation(phenotype),
    "{patientAction}": getPatientAction(phenotype),
  };

  function fillTemplate(tmpl: string): string {
    let result = tmpl;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replaceAll(key, value);
    }
    return result;
  }

  return {
    summary: fillTemplate(template.summaryTemplate),
    mechanism: fillTemplate(template.mechanismTemplate),
    patient_friendly: fillTemplate(template.patientFriendlyTemplate),
    citations: template.citations,
  };
}
