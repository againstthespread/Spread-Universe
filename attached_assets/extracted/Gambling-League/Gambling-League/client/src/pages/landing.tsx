import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, BarChart3, Calendar } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Navy Gradient */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NDEtOC4wNTktMTgtMTgtMTgiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
              Fantasy Football League Platform
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Create or join leagues and compete weekly by picking NFL games against the spread
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                className="bg-accent text-foreground hover:bg-accent/90 font-semibold text-lg px-8"
                onClick={() => window.location.href = '/auth'}
                data-testid="button-login"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg">Create Leagues</h3>
              <p className="text-muted-foreground">
                Start your own league with 8, 10, 12, or 16 members and invite friends to compete
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-lg">Weekly Picks</h3>
              <p className="text-muted-foreground">
                Pick NFL games against the spread each week with automatic deadline based on first game time
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-chart-4/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-chart-4" />
              </div>
              <h3 className="font-heading font-semibold text-lg">Track Standings</h3>
              <p className="text-muted-foreground">
                Real-time standings using NPW scoring with wins, draws, and pick accuracy
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-md bg-destructive/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-heading font-semibold text-lg">Playoffs</h3>
              <p className="text-muted-foreground">
                Automatic playoff bracket generation for top finishers with championship in Week 17
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="font-heading font-semibold text-lg">Create or Join</h3>
              <p className="text-muted-foreground text-sm">
                Start a new league or join an existing one with your friends
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent text-foreground flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="font-heading font-semibold text-lg">Make Picks</h3>
              <p className="text-muted-foreground text-sm">
                Pick games against the spread before the first game starts each week
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-chart-4 text-white flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="font-heading font-semibold text-lg">Compete</h3>
              <p className="text-muted-foreground text-sm">
                Face weekly matchups and earn Net Positive Wins (NPW)
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center mx-auto text-2xl font-bold">
                4
              </div>
              <h3 className="font-heading font-semibold text-lg">Win Championship</h3>
              <p className="text-muted-foreground text-sm">
                Climb the standings and compete in playoffs for the title
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            Ready to Start Your League?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of players competing in fantasy football leagues with automatic scheduling and real-time standings
          </p>
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg px-8"
            onClick={() => window.location.href = '/auth'}
            data-testid="button-cta-login"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
