export type JobStatus =
  | "new"
  | "saved"
  | "tailored"
  | "applied"
  | "rejected"
  | "dismissed"
  | "later";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  sourceName: string;
  postedDate: string;
  matchScore: number;
  matchReasons: string[];
  matchNote?: string;
  unscored?: boolean;
  status: JobStatus;
  tailoredSummary?: string;
  tailoredCoverLetter?: string;
  tailoredAt?: string;
  /** Local-only notes (profile archive) */
  notes?: string;
  /** When saved to profile library */
  savedAt?: string;
}

export interface JobStatusEntry {
  status: JobStatus;
  tailoredSummary?: string;
  tailoredCoverLetter?: string;
  tailoredAt?: string;
  notes?: string;
  savedAt?: string;
}

export type JobStatusesMap = Record<string, JobStatusEntry>;

export interface TailorResponse {
  tailoredSummary: string;
  coverLetter: string;
  keywordsMatched: string[];
  missingSkills: string[];
  matchNotes: string;
}
