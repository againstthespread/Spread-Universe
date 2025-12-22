import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Round } from "@shared/schema";

interface RoundTabsProps {
  activeRound: string;
  onRoundChange: (round: string) => void;
}

const RoundTabs = ({ activeRound, onRoundChange }: RoundTabsProps) => {
  const { data: rounds, isLoading } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const [activeRoundData, setActiveRoundData] = useState<Round | null>(null);

  useEffect(() => {
    if (rounds && rounds.length > 0) {
      const currentRound = rounds.find(round => round.name === activeRound);
      if (currentRound) {
        setActiveRoundData(currentRound);
      } else {
        // If active round not found, default to first round
        setActiveRoundData(rounds[0]);
        onRoundChange(rounds[0].name);
      }
    }
  }, [rounds, activeRound, onRoundChange]);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md">
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!rounds || rounds.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-md">
        <ScrollArea className="w-full">
          <div className="flex whitespace-nowrap">
            {rounds.map((round) => (
              <button
                key={round.id}
                className={`py-4 px-6 font-inter font-medium border-b-4 focus:outline-none transition-colors ${
                  round.name === activeRound
                    ? "border-secondary"
                    : "border-transparent hover:border-gray-300"
                }`}
                onClick={() => onRoundChange(round.name)}
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`font-bold ${
                      round.name === activeRound ? "text-secondary" : "text-primary"
                    }`}
                  >
                    {round.displayName}
                  </span>
                  <span
                    className={`text-xs ${
                      round.name === activeRound ? "text-secondary" : "text-gray-500"
                    }`}
                  >
                    {round.pointValue} pts
                  </span>
                </div>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default RoundTabs;
