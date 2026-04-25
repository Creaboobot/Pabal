"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Globe2, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type CompanyListItem = {
  affiliationCount: number;
  description: string | null;
  id: string;
  industry: string | null;
  name: string;
  website: string | null;
};

type CompanyListProps = {
  companies: CompanyListItem[];
};

export function CompanyList({ companies }: CompanyListProps) {
  const [query, setQuery] = useState("");
  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return companies;
    }

    return companies.filter((company) =>
      [company.name, company.industry, company.website]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [companies, query]);

  if (companies.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild>
            <Link href="/people/companies/new">Create company</Link>
          </Button>
        }
        description="Create the first organisation record in this workspace."
        icon={Building2}
        title="No companies yet"
      />
    );
  }

  return (
    <section aria-label="Company records" className="grid gap-4">
      <Input
        aria-label="Filter companies"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter companies by name, industry, or website"
        type="search"
        value={query}
      />

      {filteredCompanies.length === 0 ? (
        <EmptyState
          description="Adjust the filter to show organisation records."
          icon={Building2}
          title="No matching companies"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredCompanies.map((company) => (
            <Link
              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/people/companies/${company.id}`}
              key={company.id}
            >
              <Card className="h-full p-4 transition hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                    <Building2 aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-foreground">
                      {company.name}
                    </h2>
                    {company.industry ? (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {company.industry}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {company.affiliationCount} linked people
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  {company.website ? (
                    <span className="flex items-center gap-2">
                      <Globe2 aria-hidden="true" className="size-4" />
                      <span className="truncate">{company.website}</span>
                    </span>
                  ) : null}
                  {company.description ? (
                    <span className="line-clamp-2">{company.description}</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UsersRound aria-hidden="true" className="size-4" />
                      Relationship context starts with linked people.
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
