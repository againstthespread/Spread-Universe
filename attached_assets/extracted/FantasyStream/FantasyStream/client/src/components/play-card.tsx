import { type Play } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface PlayCardProps {
  play: Play;
  isLatest?: boolean;
}

export default function PlayCard({ play, isLatest = false }: PlayCardProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPlayTypeColor = (playType: string) => {
    switch (playType) {
      case 'touchdown':
        return 'text-yellow-400';
      case 'pass':
        return 'text-blue-400';
      case 'rush':
        return 'text-green-400';
      case 'turnover':
        return 'text-red-400';
      case 'fieldgoal':
        return 'text-purple-400';
      default:
        return 'text-foreground';
    }
  };

  const getPlayerNameColor = (name: string) => {
    // Assign colors based on first letter for consistency
    const colors = [
      'text-blue-400',
      'text-green-400',
      'text-yellow-400',
      'text-purple-400',
      'text-pink-400',
      'text-indigo-400',
      'text-teal-400',
      'text-orange-400',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const downAndDistance = play.down && play.distance 
    ? `${play.down}${getOrdinalSuffix(play.down)} & ${play.distance}`
    : '';

  function getOrdinalSuffix(num: number): string {
    const teens = [11, 12, 13];
    const lastDigit = num % 10;
    
    if (teens.includes(num % 100)) return 'th';
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
  }

  return (
    <div 
      className={`bg-card border rounded-lg p-4 fade-in ${
        isLatest && play.isLive ? 'border-primary/20' : 'border-border'
      }`}
      data-testid={`play-card-${play.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isLatest && play.isLive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}
              data-testid={`team-indicator-${play.id}`}
            >
              {play.team}
            </div>
            {(downAndDistance || play.yardLine) && (
              <div className="text-sm text-muted-foreground" data-testid={`play-situation-${play.id}`}>
                {downAndDistance} {play.yardLine ? `at ${play.yardLine}` : ''}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground" data-testid={`play-time-${play.id}`}>
          {formatTime(play.timestamp)}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="font-semibold text-foreground" data-testid={`play-description-${play.id}`}>
          {play.playerName && (
            <span className={getPlayerNameColor(play.playerName)}>
              {play.playerName}
            </span>
          )}{' '}
          {play.description.replace(play.playerName || '', '').trim()}
          {play.receiverName && (
            <>
              {' to '}
              <span className={getPlayerNameColor(play.receiverName)}>
                {play.receiverName}
              </span>
            </>
          )}
          {play.yards !== undefined && (
            <span className="text-muted-foreground">
              {' '}({play.yards > 0 ? '+' : ''}{play.yards} yards)
            </span>
          )}
        </div>
        
        {play.isScoring && (
          <div className="text-sm text-primary font-semibold" data-testid={`scoring-play-${play.id}`}>
            🏈 {play.playType.toUpperCase()}! 
            {play.playType === 'touchdown' && ' Extra point attempt coming up'}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span data-testid={`play-quarter-${play.id}`}>{play.quarter} {play.timeRemaining}</span>
          <span>•</span>
          <span className={getPlayTypeColor(play.playType)} data-testid={`play-type-${play.id}`}>
            {play.playType.toUpperCase()}
          </span>
        </div>
        {isLatest && play.isLive && (
          <Badge variant="default" className="text-xs font-medium" data-testid={`live-badge-${play.id}`}>
            LIVE
          </Badge>
        )}
      </div>
    </div>
  );
}
