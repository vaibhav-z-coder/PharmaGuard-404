// ── Client-side Analysis State Store ──
// Stores multi-drug results and selected drug detail

import type { AnalysisResult, MultiDrugAnalysisResult } from "./types";

const STORAGE_KEY_MULTI = "pharmaguard_multi";
const STORAGE_KEY_SELECTED = "pharmaguard_selected";

let multiResult: MultiDrugAnalysisResult | null = null;
let selectedResult: AnalysisResult | null = null;

// ── Multi-Drug Results ──

export function setMultiDrugResult(result: MultiDrugAnalysisResult): void {
  multiResult = result;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY_MULTI, JSON.stringify(result));
    } catch { /* storage full or unavailable */ }
  }
}

export function getMultiDrugResult(): MultiDrugAnalysisResult | null {
  if (multiResult) return multiResult;
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_MULTI);
      if (stored) {
        multiResult = JSON.parse(stored) as MultiDrugAnalysisResult;
        return multiResult;
      }
    } catch { /* ignore */ }
  }
  return null;
}

// ── Selected Drug Detail ──

export function setSelectedDrug(result: AnalysisResult): void {
  selectedResult = result;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(result));
    } catch { /* storage full */ }
  }
}

export function getSelectedDrug(): AnalysisResult | null {
  if (selectedResult) return selectedResult;
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_SELECTED);
      if (stored) {
        selectedResult = JSON.parse(stored) as AnalysisResult;
        return selectedResult;
      }
    } catch { /* ignore */ }
  }
  return null;
}

// ── Legacy single-result support (backwards compat) ──

export function setAnalysisResult(result: AnalysisResult): void {
  setSelectedDrug(result);
}

export function getAnalysisResult(): AnalysisResult | null {
  return getSelectedDrug();
}

// ── Clear all ──

export function clearAnalysisResult(): void {
  multiResult = null;
  selectedResult = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY_MULTI);
      sessionStorage.removeItem(STORAGE_KEY_SELECTED);
    } catch { /* ignore */ }
  }
}
