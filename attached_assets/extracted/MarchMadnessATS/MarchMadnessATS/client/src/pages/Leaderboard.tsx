import { useEffect } from "react";
import { useLocation } from "wouter";
import LeaderboardSection from "@/components/leaderboard/LeaderboardSection";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

const Leaderboard = () => {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-primary">Full Leaderboard</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <LeaderboardSection limitEntries={false} />
      </div>
    </div>
  );
};

export default Leaderboard;
