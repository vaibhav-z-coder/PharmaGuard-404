"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AIExplanation as AIExplanationType } from "@/lib/types";
import { Brain, FileText, Microscope, Heart, BookOpen } from "lucide-react";

interface AIExplanationProps {
  explanation: AIExplanationType;
}

export function AIExplanationSection({ explanation }: AIExplanationProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI-Powered Explanation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["summary"]} className="w-full">
          {/* Summary */}
          <AccordionItem value="summary">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Summary
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed text-foreground">
                {explanation.summary}
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Biological Mechanism */}
          <AccordionItem value="mechanism">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2">
                <Microscope className="h-4 w-4 text-primary" />
                Biological Mechanism
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed text-foreground">
                {explanation.mechanism}
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Patient-Friendly */}
          <AccordionItem value="patient-friendly">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Patient-Friendly Explanation
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {explanation.patient_friendly}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Citations */}
          <AccordionItem value="citations">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Citations & References ({explanation.citations.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="flex flex-col gap-2 pl-4 list-decimal">
                {explanation.citations.map((citation, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {citation}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
