"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/types";
import { Code2, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

interface JSONOutputProps {
  result: AnalysisResult;
}

function syntaxHighlight(json: string): string {
  // Replace JSON tokens with spans for styling
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-600 dark:text-amber-400"; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-primary font-medium"; // key
          } else {
            cls = "text-green-700 dark:text-green-400"; // string
          }
        } else if (/true|false/.test(match)) {
          cls = "text-blue-600 dark:text-blue-400"; // boolean
        } else if (/null/.test(match)) {
          cls = "text-muted-foreground"; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

export function JSONOutput({ result }: JSONOutputProps) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(result, null, 2);
  const highlighted = syntaxHighlight(jsonString);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [jsonString]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmaguard-${result.drug.toLowerCase()}-${result.patient_id}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON file downloaded");
  }, [jsonString, result.drug, result.patient_id]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code2 className="h-5 w-5 text-primary" />
            Structured JSON Output
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-4">
          <pre
            className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
