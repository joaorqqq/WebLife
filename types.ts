
export enum GlobalEvent {
  NORMAL = 'Normal Year',
  GIANTS = 'Return of the Giants',
  ZOMBIES = 'Zombie Apocalypse',
  ALIENS = 'Alien Invasion',
  ANARCHY = 'Politician Vanishing (Anarchy)'
}

export interface ChoiceOption {
  label: string;
  resultId: string;
}

export interface InteractiveEvent {
  title: string;
  description: string;
  options: ChoiceOption[];
}

export interface SocialStats {
  isActive: boolean;
  followers: number;
  isVerified: boolean;
  isBanned: boolean;
  totalPosts: number;
}

export interface Character {
  firstName: string;
  lastName: string;
  country: string;
  state: string;
  city: string;
  age: number;
  health: number;
  happiness: number;
  intellect: number;
  appearance: number;
  money: number;
  fame: number;
  job: string;
  hasBunker: boolean;
  hasDodo: boolean;
  socialMedia: Record<string, SocialStats>;
}

export interface FamilyMember {
  relation: string;
  name: string;
  alive: boolean;
}

export interface GameLog {
  year: number;
  event: GlobalEvent;
  message: string;
  type: 'info' | 'danger' | 'success';
}

export enum GameState {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  INTERACTIVE_EVENT = 'INTERACTIVE_EVENT',
  STEALTH_MINIGAME = 'STEALTH_MINIGAME',
  BRIBERY_MINIGAME = 'BRIBERY_MINIGAME',
  GAMEOVER = 'GAMEOVER',
  PRISON = 'PRISON',
  ACTIVITIES_MENU = 'ACTIVITIES_MENU',
  DIGITAL_CAREERS = 'DIGITAL_CAREERS'
}
