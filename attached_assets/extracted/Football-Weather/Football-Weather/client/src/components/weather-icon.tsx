import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, Wind, CloudFog, Cloudy, Zap } from "lucide-react";

interface WeatherIconProps {
  icon: string;
  className?: string;
}

export function WeatherIcon({ icon, className = "h-6 w-6" }: WeatherIconProps) {
  const iconMap: Record<string, React.ReactNode> = {
    "01d": <Sun className={className} />,
    "01n": <Sun className={className} />,
    "02d": <CloudSun className={className} />,
    "02n": <CloudSun className={className} />,
    "03d": <Cloud className={className} />,
    "03n": <Cloud className={className} />,
    "04d": <Cloudy className={className} />,
    "04n": <Cloudy className={className} />,
    "09d": <CloudRain className={className} />,
    "09n": <CloudRain className={className} />,
    "10d": <CloudRain className={className} />,
    "10n": <CloudRain className={className} />,
    "11d": <Zap className={className} />,
    "11n": <Zap className={className} />,
    "13d": <CloudSnow className={className} />,
    "13n": <CloudSnow className={className} />,
    "50d": <CloudFog className={className} />,
    "50n": <CloudFog className={className} />,
  };

  return iconMap[icon] || <Cloud className={className} />;
}

export function getWeatherColor(temp: number, precipitation: number, snow?: number): string {
  if (snow && snow > 0) return "text-blue-400";
  if (precipitation > 50) return "text-blue-500";
  if (temp < 32) return "text-cyan-400";
  if (temp < 50) return "text-blue-300";
  if (temp > 80) return "text-orange-500";
  if (temp > 70) return "text-yellow-500";
  return "text-green-500";
}
