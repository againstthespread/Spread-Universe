import { Sun, Cloud, CloudRain, CloudSnow, Wind, CloudSun, Thermometer } from "lucide-react";

interface WeatherIconProps {
  icon: string;
  className?: string;
}

export function WeatherIcon({ icon, className = "h-6 w-6" }: WeatherIconProps) {
  const getIcon = () => {
    if (icon.includes("01")) return <Sun className={className} />;
    if (icon.includes("02")) return <CloudSun className={className} />;
    if (icon.includes("03") || icon.includes("04")) return <Cloud className={className} />;
    if (icon.includes("09") || icon.includes("10")) return <CloudRain className={className} />;
    if (icon.includes("13")) return <CloudSnow className={className} />;
    if (icon.includes("50")) return <Wind className={className} />;
    return <Thermometer className={className} />;
  };

  return getIcon();
}
