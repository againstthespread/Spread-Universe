import heroImage from "@assets/generated_images/Gaming_portal_hero_background_19f5d03b.png";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function Hero() {
  const scrollToGames = () => {
    const gamesSection = document.querySelector('[data-testid="text-games-heading"]');
    gamesSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 
          className="font-display text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-pulse"
          style={{ animationDuration: '3s' }}
          data-testid="text-hero-title"
        >
          AGAINST THE SPREAD
        </h1>
        
        <p 
          className="text-xl md:text-2xl text-white/90 mb-12 font-light tracking-wide"
          data-testid="text-hero-subtitle"
        >
          Your Gateway to Competitive Gaming
        </p>
        
        <Button 
          onClick={scrollToGames}
          size="lg"
          className="text-base md:text-lg font-semibold uppercase tracking-wide bg-primary/90 backdrop-blur-sm border border-primary-border hover:bg-primary"
          data-testid="button-view-games"
        >
          View Games
          <ChevronDown className="ml-2 h-5 w-5" />
        </Button>
      </div>
      
      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
