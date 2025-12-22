import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { Hero } from "@/components/Hero";
import { GameGrid } from "@/components/GameGrid";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  const activeGames = games?.filter(game => game.isActive) || [];
  
  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeGames.forEach(game => {
      if (game.category) cats.add(game.category);
    });
    return Array.from(cats).sort();
  }, [activeGames]);
  
  const filteredGames = selectedCategory
    ? activeGames.filter(game => game.category === selectedCategory)
    : activeGames;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        
        <section className="py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 
              className="font-display text-4xl md:text-5xl font-bold text-center mb-8"
              data-testid="text-games-heading"
            >
              AVAILABLE GAMES
            </h2>
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-12">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  data-testid="button-filter-all"
                >
                  All Games
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`button-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20" data-testid="loading-games">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-20" data-testid="empty-games">
                <p className="text-lg text-muted-foreground">
                  {selectedCategory 
                    ? `No games in the ${selectedCategory} category yet.`
                    : "No games available yet. Check back soon!"
                  }
                </p>
              </div>
            ) : (
              <GameGrid games={filteredGames} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
