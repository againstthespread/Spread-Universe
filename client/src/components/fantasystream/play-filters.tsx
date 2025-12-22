import { Button } from "@/components/ui/button";

type PlayFilterType = "all" | "scoring" | "touchdowns" | "big-plays";

interface PlayFiltersProps {
  activeFilter: PlayFilterType;
  onFilterChange: (filter: PlayFilterType) => void;
}

export function PlayFilters({ activeFilter, onFilterChange }: PlayFiltersProps) {
  const filters: { id: PlayFilterType; label: string }[] = [
    { id: "all", label: "All Plays" },
    { id: "scoring", label: "Scoring" },
    { id: "touchdowns", label: "Touchdowns" },
    { id: "big-plays", label: "Big Plays (20+ yds)" },
  ];

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              data-testid={`filter-${filter.id}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { PlayFilterType };
