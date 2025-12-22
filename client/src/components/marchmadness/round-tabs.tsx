import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MarchmadnessRound } from "@shared/schema";

interface RoundTabsProps {
  rounds: MarchmadnessRound[];
  selectedRoundId: string | null;
  onRoundChange: (roundId: string) => void;
}

export function RoundTabs({ rounds, selectedRoundId, onRoundChange }: RoundTabsProps) {
  if (rounds.length === 0) return null;

  return (
    <Tabs value={selectedRoundId || rounds[0]?.id} onValueChange={onRoundChange}>
      <TabsList className="w-full h-auto flex-wrap justify-start gap-1" data-testid="tabs-rounds">
        {rounds.map((round) => (
          <TabsTrigger 
            key={round.id} 
            value={round.id}
            className="text-xs sm:text-sm"
            data-testid={`tab-round-${round.id}`}
          >
            {round.displayName}
            <span className="hidden sm:inline ml-1 text-muted-foreground">
              ({round.pointValue}pts)
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
