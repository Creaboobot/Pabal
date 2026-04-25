"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Mail, UserRound } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RelationshipBadges } from "@/modules/people/components/relationship-badges";
import type {
  RelationshipStatus,
  RelationshipTemperature,
} from "@prisma/client";

export type PeopleListItem = {
  displayName: string;
  email: string | null;
  id: string;
  jobTitle: string | null;
  primaryCompanyName: string | null;
  relationshipStatus: RelationshipStatus;
  relationshipTemperature: RelationshipTemperature;
};

type PeopleListProps = {
  people: PeopleListItem[];
};

export function PeopleList({ people }: PeopleListProps) {
  const [query, setQuery] = useState("");
  const filteredPeople = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return people;
    }

    return people.filter((person) =>
      [
        person.displayName,
        person.email,
        person.jobTitle,
        person.primaryCompanyName,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [people, query]);

  if (people.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild>
            <Link href="/people/new">Create person</Link>
          </Button>
        }
        description="Create the first relationship record in this workspace."
        icon={UserRound}
        title="No people yet"
      />
    );
  }

  return (
    <section aria-label="People records" className="grid gap-4">
      <Input
        aria-label="Filter people"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter people by name, title, email, or company"
        type="search"
        value={query}
      />

      {filteredPeople.length === 0 ? (
        <EmptyState
          description="Adjust the filter to show relationship records."
          icon={UserRound}
          title="No matching people"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredPeople.map((person) => (
            <Link
              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/people/${person.id}`}
              key={person.id}
            >
              <Card className="h-full p-4 transition hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                    <UserRound aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-foreground">
                      {person.displayName}
                    </h2>
                    {person.jobTitle ? (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {person.jobTitle}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <RelationshipBadges
                        status={person.relationshipStatus}
                        temperature={person.relationshipTemperature}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  {person.primaryCompanyName ? (
                    <span className="flex items-center gap-2">
                      <Building2 aria-hidden="true" className="size-4" />
                      <span className="truncate">
                        {person.primaryCompanyName}
                      </span>
                    </span>
                  ) : null}
                  {person.email ? (
                    <span className="flex items-center gap-2">
                      <Mail aria-hidden="true" className="size-4" />
                      <span className="truncate">{person.email}</span>
                    </span>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
