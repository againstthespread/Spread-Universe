import { type FantasyStreamPlay } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface PlayCardProps {
  play: FantasyStreamPlay;
  isLatest?: boolean;
}

export function PlayCard({ play, isLatest = false }: PlayCardProps) {
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
        return 'text-yellow-500 dark:text-yellow-400';
      case 'pass':
        return 'text-blue-500 dark:text-blue-400';
      case 'rush':
        return 'text-green-500 dark:text-green-400';
      case 'turnover':
        return 'text-red-500 dark:text-red-400';
      case 'fieldgoal':
        return 'text-purple-500 dark:text-purple-400';
      default:
        return 'text-foreground';
    }
  };

  const getPlayerNameColor = (name: string) => {
    const colors = [
      'text-blue-500 dark:text-blue-400',
      'text-green-500 dark:text-green-400',
      'text-yellow-500 dark:text-yellow-400',
      'text-purple-500 dark:text-purple-400',
      'text-pink-500 dark:text-pink-400',
      'text-indigo-500 dark:text-indigo-400',
      'text-teal-500 dark:text-teal-400',
      'text-orange-500 dark:text-orange-400',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  function getOrdinalSuffix(num: number): string {
    const teens = [11, 12, 13];
    const lastDigit = num % 10;
    
    if (teens.includes(num % 100)) return 'th';
    if (lastDigit === 1) return 'st';
    if (lastDigit === 2) return 'nd';
    if (lastDigit === 3) return 'rd';
    return 'th';
  }

  const downAndDistance = play.down && play.distance 
    ? `${play.down}${getOrdinalSuffix(play.down)} & ${play.distance}`
    : '';

  return (
    <Card 
      className={`p-4 ${isLatest && play.isLive ? 'border-primary/40' : ''}`}
      data-testid={`play-card-${play.id}`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
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
          {play.yards !== undefined && play.yards !== 0 && (
            <span className="text-muted-foreground">
              {' '}({play.yards > 0 ? '+' : ''}{play.yards} yards)
            </span>
          )}
        </div>
        
        {play.isScoring && (
          <div className="text-sm text-primary font-semibold" data-testid={`scoring-play-${play.id}`}>
            {play.playType === 'touchdown' ? 'TOUCHDOWN!' : play.playType === 'fieldgoal' ? 'FIELD GOAL!' : 'SCORING PLAY!'}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border gap-2 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span data-testid={`play-quarter-${play.id}`}>{play.quarter} {play.timeRemaining}</span>
          <span className={getPlayTypeColor(play.playType)} data-testid={`play-type-${play.id}`}>
            {play.playType.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {play.isScoring && (
            <Badge variant="default" className="text-xs" data-testid={`scoring-badge-${play.id}`}>
              SCORE
            </Badge>
          )}
          {isLatest && play.isLive && (
            <Badge variant="secondary" className="text-xs" data-testid={`live-badge-${play.id}`}>
              LIVE
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
