"use client";

import { ModeToggle } from "~/components/ui/mode-toggle";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOnboardingClick = () => {
    setIsTransitioning(true);
    // La navigation se fera automatiquement après l'animation
    setTimeout(() => {
      window.location.href = '/onboarding';
    }, 300);
  };

  return (
    <main 
      className={`flex min-h-screen flex-col items-center justify-center text-foreground px-3 relative transition-all duration-300 ${
        isTransitioning ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
      }`}
      style={{
        backgroundColor: 'var(--color-background)'
      }}
      >
        {/* SVG en arrière-plan */}
        <img 
          src="/chateau_min.svg" 
          alt="Château de Versailles" 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 min-h-[50vh] w-full object-cover"
          style={{ width: 'full', minHeight: '50vh' }}
        />
        
        {/* Mode Toggle en haut */}
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
      
      {/* Contenu principal */}
      <div className="flex flex-col items-center space-y-8 text-center relative z-10">
        <h1 className="text-2xl sm:text-5xl font-bold mb-8 font-apollon">
          Votre visite du 
          <br />
          Château de Versailles
        </h1>
        
        <div className="flex flex-col space-y-4 w-full max-w-sm">
          <Button 
            onClick={handleOnboardingClick}
            className="w-full" 
            size="lg"
          >
            Créer mon itinéraire idéal
          </Button>
          
          <Link href="/chat" className="w-full">
            <Button variant="secondary" className="w-full" size="lg">
              Chat
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
