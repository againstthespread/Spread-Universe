import React from "react";
import BasketballIcon from "./basketball-icon";

interface TeamLogoProps {
  logoUrl?: string | null;
  teamName: string;
  className?: string;
}

const TeamLogo = ({ logoUrl, teamName, className = "" }: TeamLogoProps) => {
  // If no logo URL, display a placeholder with the team's first letter
  if (!logoUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-primary font-bold rounded-full ${className}`}>
        <BasketballIcon className="h-5 w-5" />
      </div>
    );
  }

  // Handle SVG URLs explicitly
  if (logoUrl.endsWith('.svg')) {
    return (
      <div className={className}>
        <object
          data={logoUrl}
          type="image/svg+xml"
          className="w-full h-full"
          aria-label={`${teamName} logo`}
        >
          {/* Only show fallback if SVG fails to load */}
          <div className="flex items-center justify-center bg-gray-200 text-primary font-bold rounded-full w-full h-full">
            {teamName.charAt(0)}
          </div>
        </object>
      </div>
    );
  }

  // For other image formats - show only the image without the gray circle background
  return (
    <div className={className}>
      <div className="relative w-full h-full">
        <img
          src={logoUrl}
          alt={`${teamName} logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            // If image fails to load, show the fallback
            const parent = e.currentTarget.parentElement;
            if (parent) {
              // Create and append fallback element
              const fallback = document.createElement('div');
              fallback.className = "flex items-center justify-center bg-gray-200 text-primary font-bold rounded-full w-full h-full";
              fallback.textContent = teamName.charAt(0);
              parent.appendChild(fallback);
            }
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default TeamLogo;
