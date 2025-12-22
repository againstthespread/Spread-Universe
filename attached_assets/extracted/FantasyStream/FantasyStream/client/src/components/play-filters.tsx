import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter } from "lucide-react";

interface PlayFiltersProps {
  onFilterChange: (filters: { team?: string; player?: string }) => void;
  currentFilters: { team?: string; player?: string };
}

export default function PlayFilters({ onFilterChange, currentFilters }: PlayFiltersProps) {
  const [localTeamFilter, setLocalTeamFilter] = useState(currentFilters.team || "");
  const [localPlayerFilter, setLocalPlayerFilter] = useState(currentFilters.player || "");

  const { data: teams = [] } = useQuery<string[]>({
    queryKey: ["/api/teams"],
    refetchInterval: 60000, // Refresh every minute to get new teams
  });

  const { data: players = [] } = useQuery<string[]>({
    queryKey: ["/api/players"], 
    refetchInterval: 60000, // Refresh every minute to get new players
  });

  const applyFilters = () => {
    onFilterChange({
      team: localTeamFilter || undefined,
      player: localPlayerFilter || undefined,
    });
  };

  const handleTeamChange = (value: string) => {
    setLocalTeamFilter(value === 'all' ? '' : value);
  };

  const clearFilters = () => {
    setLocalTeamFilter("");
    setLocalPlayerFilter("");
    onFilterChange({});
  };

  const hasActiveFilters = currentFilters.team || currentFilters.player;

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter plays:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Team Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Team</label>
              <Select 
                value={localTeamFilter || 'all'} 
                onValueChange={handleTeamChange}
                data-testid="select-team-filter"
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Player Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Player</label>
              <Input
                placeholder="Search players..."
                value={localPlayerFilter}
                onChange={(e) => setLocalPlayerFilter(e.target.value)}
                className="w-48"
                data-testid="input-player-filter"
              />
            </div>

            {/* Apply/Clear Buttons */}
            <div className="flex gap-2 items-end">
              <Button 
                onClick={applyFilters}
                size="sm"
                className="h-9"
                data-testid="button-apply-filters"
              >
                Apply
              </Button>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="h-9"
                  data-testid="button-clear-filters"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="flex gap-2 items-center text-xs">
              {currentFilters.team && (
                <span className="bg-primary/20 text-primary px-2 py-1 rounded" data-testid="filter-chip-team">
                  Team: {currentFilters.team}
                </span>
              )}
              {currentFilters.player && (
                <span className="bg-primary/20 text-primary px-2 py-1 rounded" data-testid="filter-chip-player">
                  Player: {currentFilters.player}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}