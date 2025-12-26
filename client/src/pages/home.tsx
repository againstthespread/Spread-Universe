import { Link, useLocation } from "wouter";
import { Shield, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { PlatformCard } from "@/components/platform-card";
import { platforms } from "@shared/schema";

const PUBLIC_PLATFORMS = ["fantasystream", "footballweather"];

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handlePlatformClick = (platformId: string, platformUrl: string) => {
    if (PUBLIC_PLATFORMS.includes(platformId)) {
      setLocation(platformUrl);
    } else {
      if (user) {
        setLocation(platformUrl);
      } else {
        setLocation("/login");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Your Competitive Gaming Hub</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-primary">Against the Spread</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">Access all your competitive gaming tools.</p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-get-started">
                    Get Started Free
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-sign-in">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="py-8 md:py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Choose Your Platform</h2>
            <p className="text-muted-foreground">
              {user ? "Jump right in to any platform" : "Sign in to access all platforms, or try our free tools"}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {platforms.map((platform) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                onClick={() => handlePlatformClick(platform.id, platform.url)}
                showLockIcon={!user && !PUBLIC_PLATFORMS.includes(platform.id)}
              />
            ))}
          </div>
        </div>
      </section>
      <footer className="py-6 border-t border-border mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Against The Spread</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Your data is encrypted and secure</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Against The Spread. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
