export interface Hackathon {
  id: string;
  name: string;
  organizer: string;
  banner: string;
  prizePool: string;
  prizePoolUSD: number; // for filtering
  mode: "Online" | "Offline" | "Hybrid";
  level?: "State" | "National" | "Global";
  registrationDeadline: string; // ISO date
  submissionDeadline: string;
  resultDate: string;
  teamSize: { min: number; max: number };
  tags: string[];
  platform: string;
  platformUrl: string;
  description: string;
  bookmarked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const HACKATHONS: Hackathon[] = [];

export const ALL_TAGS = [
  "AI",
  "AgriTech",
  "Blockchain",
  "Cybersecurity",
  "DeFi",
  "DevOps",
  "FinTech",
  "GameDev",
  "HealthTech",
  "IoT",
  "LLM",
  "ML",
  "Mobile",
  "Open Source",
  "Solidity",
  "UI/UX",
  "Web3",
];

export const AI_RECOMMENDATIONS: { hackathonId: string; reason: string }[] = [];
