"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PharmacogenomicProfile } from "@/lib/types";
import { Dna } from "lucide-react";

interface PGxProfileProps {
  profile: PharmacogenomicProfile;
}

export function PGxProfile({ profile }: PGxProfileProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dna className="h-5 w-5 text-primary" />
          Pharmacogenomic Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Gene info grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gene
            </span>
            <span className="text-lg font-bold font-mono text-foreground">
              {profile.gene}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Diplotype
            </span>
            <span className="text-lg font-bold font-mono text-primary">
              {profile.diplotype}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Phenotype
            </span>
            <Badge variant="secondary" className="w-fit text-sm">
              {profile.phenotype}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Classification
            </span>
            <span className="text-sm font-medium text-foreground">
              {profile.phenotype_label}
            </span>
          </div>
        </div>

        {/* Detected Variants Table */}
        {profile.detected_variants.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">
              Detected Variants ({profile.detected_variants.length})
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      rsID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Chromosome
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Position
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      REF
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      ALT
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Star Allele
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profile.detected_variants.map((variant, i) => (
                    <tr
                      key={`${variant.rsid}-${i}`}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-primary font-medium">
                        {variant.rsid}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-foreground">
                        {variant.chromosome}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-foreground">
                        {variant.position.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-foreground">
                        {variant.ref_allele}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-foreground">
                        {variant.alt_allele}
                      </td>
                      <td className="px-4 py-2.5">
                        {variant.star_allele ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {variant.star_allele}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profile.detected_variants.length === 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            No pharmacogenomic variants detected for {profile.gene}. Wildtype (*1/*1) assumed.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
