import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const isAdmin = location === "/admin";

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/80 backdrop-blur-md">
      <div className="h-full px-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/">
          <button 
            className="font-display text-2xl font-bold hover-elevate active-elevate-2 px-3 py-1 rounded-md"
            data-testid="link-home-logo"
          >
            ATS
          </button>
        </Link>

        <Link href={isAdmin ? "/" : "/admin"}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            data-testid={isAdmin ? "link-home" : "link-admin"}
          >
            {isAdmin ? (
              <>Back to Home</>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Admin
              </>
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}
