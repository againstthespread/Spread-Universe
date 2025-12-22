import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Round } from "@shared/schema";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import RoundTabs from "@/components/dashboard/RoundTabs";
import GameCardList from "@/components/matchups/GameCardList";
import LeaderboardSection from "@/components/leaderboard/LeaderboardSection";
import { useAuth } from "@/lib/auth";

const Dashboard = () => {
  const [, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeRound, setActiveRound] = useState("round64");
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);

  // Fetch rounds
  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  // Update active round ID when rounds are loaded or active round changes
  useEffect(() => {
    if (rounds.length > 0) {
      const round = rounds.find(r => r.name === activeRound);
      if (round) {
        setActiveRoundId(round.id);
      } else {
        // If the active round is not found, default to the first round
        setActiveRound(rounds[0].name);
        setActiveRoundId(rounds[0].id);
      }
    }
  }, [rounds, activeRound]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
    }
  }, [user, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Stats Overview */}
      <DashboardOverview />

      {/* Tournament Navigation Tabs */}
      <RoundTabs activeRound={activeRound} onRoundChange={setActiveRound} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matchups Section */}
        <div className="lg:col-span-2">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-inter font-bold text-xl">
                {rounds.find(r => r.name === activeRound)?.displayName || "Tournament"} Matchups
              </h2>
              {/* Conditionally show countdown to next round if applicable */}
            </div>

            {/* Game Cards */}
            {activeRoundId && <GameCardList roundId={activeRoundId} />}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="lg:col-span-1">
          <LeaderboardSection limitEntries={true} activeRound={activeRound} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
