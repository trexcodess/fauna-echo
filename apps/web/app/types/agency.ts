// --- Enums / String Literals ---
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUARDIAN' | 'DETECTIVE' | 'TRAINER' | 'GUEST';
export type PetStatus = 'SAFE' | 'MISSING' | 'RECOVERED' | 'RESCUE_IN_PROGRESS';
export type AuthMethod = 'wallet' | 'paypal' | 'email';
export type Currency = 'USDC' | 'SOL' | 'AR';
export type MediaType = 'image' | 'video';

export type AppStep = 'auth' | 'onboarding' | 'mission_control' | 'search_grid' | 'tactical_hud' | 'dashboard' | 'processing' | 'archive';
export interface Job {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
}

// --- Database Models ---

export interface User {
  id: string;
  email: string;
  arweaveAddress: string | null;
  solanaAddress: string | null;
  xrplAddress: string | null;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  role: UserRole;
  bio: string | null;
  isSubscribed: boolean;
  authMethod: AuthMethod | null;
  password?: string; // Optional so it's not strictly required in frontend payloads
  agentRank: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations (Optional because Prisma returns them only if `include` is used)
  pets?: Pet[];
  investigations?: Sighting[];
  sessions?: Session[];
  accounts?: Account[];
  subscriptions?: Subscription[];
  ownedAssets?: AtomicAsset[];
  posts?: FeedPost[];
}

export interface Pet {
  id: string;
  name: string;
  status: PetStatus;
  
  ownerId: string;
  owner?: User;

  // Static Biometrics
  microchipId: string | null;
  nosePrintUrl: string | null;
  noseEmbedding?: number[] | null; // Prisma vector translates to an array of numbers
  geometry: string | null;

  // Dynamic Biometrics
  gaitVideoUrl: string | null;
  gaitSignature?: number[] | null;

  // Bounty Logic
  bountyActive: boolean;
  bountyAmount: number;
  bountyCurrency: Currency;
  lastKnownLat: number | null;
  lastKnownLng: number | null;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  sightings?: Sighting[];
}

export interface Sighting {
  id: string;
  petId: string;
  pet?: Pet;
  detectiveId: string;
  detective?: User;
  
  latitude: number;
  longitude: number;
  confidenceScore: number;
  forensicReport: string;
  cameraId: string | null;
  capturedImageUrl: string | null;
  timestamp: Date;
}

export interface Session {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  user?: User;
}

export interface Account {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  user?: User;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipModule {
  id: string;
  name: string;
  description: string;
  subdomain: string;
  icon: string;
  claimName: string;
  
  // Relations
  subscriptions?: Subscription[];
  posts?: FeedPost[];
}

export interface Subscription {
  id: string;
  userId: string;
  moduleId: string;
  user?: User;
  module?: ShipModule;
  
  status: string;
  activatedAt: Date;
  expiresAt: Date | null;
}

export interface AtomicAsset {
  id: string;
  title: string;
  artist: string;
  price: number;
  currency: Currency;
  image: string;
  audioUrl: string;
  license: string;
  
  ownerId: string;
  owner?: User;
}

export interface FeedPost {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: MediaType | null;
  timestamp: Date;
  
  authorId: string;
  author?: User;
  
  moduleId: string | null;
  module?: ShipModule;
}