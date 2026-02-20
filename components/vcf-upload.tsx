"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Dna } from "lucide-react";
import { cn } from "@/lib/utils";

interface VCFUploadProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  error?: string;
}

export function VCFUpload({ onFileSelect, file, error }: VCFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback(
    (f: File): string | null => {
      if (!f.name.endsWith(".vcf")) {
        return "Invalid file type. Please upload a .vcf file.";
      }
      if (f.size > 5 * 1024 * 1024) {
        return "File exceeds 5MB size limit.";
      }
      return null;
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const err = validateFile(droppedFile);
        if (err) {
          onFileSelect(null);
          return;
        }
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        const err = validateFile(selectedFile);
        if (err) {
          onFileSelect(null);
          return;
        }
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleRemove = useCallback(() => {
    onFileSelect(null);
  }, [onFileSelect]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-foreground">
        VCF File
      </label>
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer group",
            isDragging
              ? "border-primary bg-primary/[0.04] scale-[1.01] shadow-lg shadow-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30 hover:shadow-md",
            error && "border-destructive bg-destructive/[0.02]"
          )}
        >
          <input
            type="file"
            accept=".vcf"
            onChange={handleChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload VCF file"
          />
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
            isDragging ? "bg-primary/15 scale-110" : "bg-primary/[0.06] group-hover:bg-primary/10 group-hover:scale-105"
          )}>
            {isDragging ? (
              <Dna className="h-8 w-8 text-primary animate-float" />
            ) : (
              <Upload className="h-7 w-7 text-primary/60 group-hover:text-primary transition-colors" />
            )}
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm font-semibold text-foreground">
              {isDragging ? "Drop your file here" : "Drop your VCF file here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports VCF v4.x format, max 5MB
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-primary/25 bg-primary/[0.03] p-4 transition-all animate-scale-in shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-sm shadow-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB -- Ready for analysis
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive font-medium animate-fade-up" style={{ animationDuration: "0.3s" }}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
