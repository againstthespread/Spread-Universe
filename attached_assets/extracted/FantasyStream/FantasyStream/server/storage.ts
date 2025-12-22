import { type Game, type Play } from "@shared/schema";

export interface IStorage {
  getGames(): Promise<Game[]>;
  getPlays(limit?: number, teamFilter?: string, playerFilter?: string): Promise<Play[]>;
  addPlay(play: Play): Promise<Play>;
  updateGame(game: Game): Promise<Game>;
  getGameById(id: string): Promise<Game | undefined>;
  getUniqueTeams(): Promise<string[]>;
  getUniquePlayers(): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private games: Map<string, Game>;
  private plays: Play[];
  private playIds: Set<string>;

  constructor() {
    this.games = new Map();
    this.plays = [];
    this.playIds = new Set();
  }

  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getPlays(limit = 50, teamFilter?: string, playerFilter?: string): Promise<Play[]> {
    let filteredPlays = [...this.plays];
    
    // Apply team filter
    if (teamFilter) {
      filteredPlays = filteredPlays.filter(play => 
        play.team.toLowerCase().includes(teamFilter.toLowerCase())
      );
    }
    
    // Apply player filter
    if (playerFilter) {
      filteredPlays = filteredPlays.filter(play => 
        (play.playerName?.toLowerCase().includes(playerFilter.toLowerCase())) ||
        (play.receiverName?.toLowerCase().includes(playerFilter.toLowerCase()))
      );
    }
    
    return filteredPlays
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async addPlay(play: Play): Promise<Play> {
    // Create composite key to prevent cross-game duplicates
    const compositeKey = `${play.gameId}:${play.id}`;
    
    // Prevent duplicates and cap memory usage
    if (this.playIds.has(compositeKey)) {
      return play;
    }
    
    this.plays.push(play);
    this.playIds.add(compositeKey);
    
    // Cap at 1000 plays to prevent unbounded memory growth
    if (this.plays.length > 1000) {
      const removedPlay = this.plays.shift();
      if (removedPlay) {
        const removedCompositeKey = `${removedPlay.gameId}:${removedPlay.id}`;
        this.playIds.delete(removedCompositeKey);
      }
    }
    
    return play;
  }

  async updateGame(game: Game): Promise<Game> {
    this.games.set(game.id, game);
    return game;
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getUniqueTeams(): Promise<string[]> {
    const teams = new Set<string>();
    this.plays.forEach(play => {
      if (play.team) {
        teams.add(play.team);
      }
    });
    return Array.from(teams).sort();
  }

  async getUniquePlayers(): Promise<string[]> {
    const players = new Set<string>();
    this.plays.forEach(play => {
      if (play.playerName) {
        players.add(play.playerName);
      }
      if (play.receiverName) {
        players.add(play.receiverName);
      }
    });
    return Array.from(players).sort();
  }
}

export const storage = new MemStorage();
