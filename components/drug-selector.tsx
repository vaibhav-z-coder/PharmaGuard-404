"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_DRUGS, DRUG_DETAILS } from "@/lib/types";
import { AlertCircle } from "lucide-react";

interface DrugSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
}

export function DrugSelector({ value, onValueChange, error }: DrugSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        Drug to Analyze
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={error ? "border-destructive" : ""}
          aria-label="Select a drug"
        >
          <SelectValue placeholder="Select a drug..." />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_DRUGS.map((drug) => {
            const details = DRUG_DETAILS[drug];
            return (
              <SelectItem key={drug} value={drug}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{details.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({details.gene})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {"- "}
                    {details.description}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
