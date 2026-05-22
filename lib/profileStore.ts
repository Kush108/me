import { Job, JobStatus, JobStatusesMap } from "@/types/job";
import { getJobsCache } from "@/lib/jobsCache";

const PROFILE_KEY = "jobOpsProfile_v2";
const LEGACY_STATUS_KEY = "jobStatuses";

export type DismissReason = "not_interested" | "later";

export interface ScoreCacheEntry {
  matchScore: number;
  matchReasons: string[];
  matchNote?: string;
  scoredAt: string;
}

export interface SeenEntry {
  firstSeenAt: string;
  lastSeenAt: string;
  dismissReason?: DismissReason;
  dismissedAt?: string;
}

export interface FeedSnapshot {
  jobs: Job[];
  fetchedAt: string;
  feedErrors?: string[];
}

export interface JobOpsProfile {
  version: 2;
  /** Last scan results — kept indefinitely, no API needed to browse */
  feedSnapshot?: FeedSnapshot;
  /** Full job snapshots — saved / tailored / applied (permanent local library) */
  archive: Record<string, Job>;
  scoreCache: Record<string, ScoreCacheEntry>;
  seen: Record<string, SeenEntry>;
  sourcePages: Record<string, number>;
  refreshGeneration: number;
  statuses: JobStatusesMap;
  updatedAt: string;
}

function emptyProfile(): JobOpsProfile {
  return {
    version: 2,
    archive: {},
    scoreCache: {},
    seen: {},
    sourcePages: {},
    refreshGeneration: 0,
    statuses: {},
    updatedAt: new Date().toISOString(),
  };
}

function persist(profile: JobOpsProfile): void {
  if (typeof window === "undefined") return;
  profile.updatedAt = new Date().toISOString();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): JobOpsProfile {
  if (typeof window === "undefined") return emptyProfile();

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as JobOpsProfile;
      if (parsed.version === 2) {
        migrateJobsCacheToFeed(parsed);
        return parsed;
      }
    }
  } catch {
    /* fall through */
  }

  const profile = emptyProfile();
  migrateLegacyStatuses(profile);
  migrateJobsCacheToFeed(profile);
  persist(profile);
  return profile;
}

function migrateJobsCacheToFeed(profile: JobOpsProfile): void {
  if (profile.feedSnapshot?.jobs?.length) return;
  const cached = getJobsCache();
  if (cached?.jobs?.length) {
    profile.feedSnapshot = {
      jobs: cached.jobs,
      fetchedAt: cached.fetchedAt,
      feedErrors: cached.feedErrors,
    };
    persist(profile);
  }
}

function migrateLegacyStatuses(profile: JobOpsProfile): void {
  try {
    const legacy = localStorage.getItem(LEGACY_STATUS_KEY);
    if (!legacy) return;
    const statuses = JSON.parse(legacy) as JobStatusesMap;
    profile.statuses = { ...profile.statuses, ...statuses };
    for (const [id, entry] of Object.entries(statuses)) {
      if (entry.status === "rejected") {
        profile.seen[id] = {
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          dismissReason: "not_interested",
          dismissedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    /* ignore */
  }
}

export function getExcludeIds(profile: JobOpsProfile): string[] {
  const ids = new Set<string>();
  for (const id of Object.keys(profile.seen)) ids.add(id);
  for (const id of Object.keys(profile.archive)) ids.add(id);
  for (const id of Object.keys(profile.scoreCache)) ids.add(id);
  return Array.from(ids);
}

export function getDismissedIds(profile: JobOpsProfile): Set<string> {
  const out = new Set<string>();
  for (const [id, entry] of Object.entries(profile.seen)) {
    if (entry.dismissReason) out.add(id);
  }
  return out;
}

export function markSeen(profile: JobOpsProfile, jobIds: string[]): JobOpsProfile {
  const now = new Date().toISOString();
  for (const id of jobIds) {
    const prev = profile.seen[id];
    profile.seen[id] = {
      firstSeenAt: prev?.firstSeenAt ?? now,
      lastSeenAt: now,
      dismissReason: prev?.dismissReason,
      dismissedAt: prev?.dismissedAt,
    };
  }
  persist(profile);
  return profile;
}

export function persistFeedSnapshot(
  profile: JobOpsProfile,
  jobs: Job[],
  fetchedAt: string,
  feedErrors?: string[]
): JobOpsProfile {
  profile.feedSnapshot = { jobs, fetchedAt, feedErrors };
  persist(profile);
  return profile;
}

export function getFeedJobs(profile: JobOpsProfile): Job[] {
  if (!profile.feedSnapshot?.jobs) return [];
  return mergeJobsWithProfile(profile.feedSnapshot.jobs, profile);
}

export function dismissJob(
  profile: JobOpsProfile,
  job: Job,
  reason: DismissReason
): JobOpsProfile {
  const now = new Date().toISOString();
  const status: JobStatus = reason === "not_interested" ? "dismissed" : "later";

  profile.seen[job.id] = {
    firstSeenAt: profile.seen[job.id]?.firstSeenAt ?? now,
    lastSeenAt: now,
    dismissReason: reason,
    dismissedAt: now,
  };
  profile.statuses[job.id] = {
    ...profile.statuses[job.id],
    status,
  };
  upsertArchiveJob(profile, { ...job, status });
  syncFeedJob(profile, job.id, status);
  persist(profile);
  return profile;
}

export function restoreJob(profile: JobOpsProfile, job: Job): JobOpsProfile {
  const entry = profile.seen[job.id];
  if (entry) {
    delete entry.dismissReason;
    delete entry.dismissedAt;
  }
  profile.statuses[job.id] = {
    ...profile.statuses[job.id],
    status: "new",
  };
  const restored = { ...job, status: "new" as JobStatus };
  upsertArchiveJob(profile, restored);
  syncFeedJob(profile, job.id, "new");
  persist(profile);
  return profile;
}

function syncFeedJob(
  profile: JobOpsProfile,
  jobId: string,
  status: JobStatus
): void {
  if (!profile.feedSnapshot?.jobs) return;
  profile.feedSnapshot.jobs = profile.feedSnapshot.jobs.map((j) =>
    j.id === jobId ? { ...j, status } : j
  );
}

function upsertArchiveJob(profile: JobOpsProfile, job: Job): void {
  if (
    job.status === "saved" ||
    job.status === "tailored" ||
    job.status === "applied" ||
    job.status === "later"
  ) {
    profile.archive[job.id] = job;
  } else if (job.status === "new" && profile.archive[job.id]?.status === "saved") {
    /* keep archive until explicit unsave */
  }
}

export function saveJobToArchive(profile: JobOpsProfile, job: Job): JobOpsProfile {
  const isSaved = job.status === "saved";
  const now = new Date().toISOString();

  if (isSaved) {
    delete profile.archive[job.id];
    profile.statuses[job.id] = { ...profile.statuses[job.id], status: "new" };
    syncFeedJob(profile, job.id, "new");
  } else {
    const archived: Job = {
      ...job,
      status: "saved",
      savedAt: now,
    };
    profile.archive[job.id] = archived;
    profile.statuses[job.id] = {
      ...profile.statuses[job.id],
      status: "saved",
      savedAt: now,
    };
    syncFeedJob(profile, job.id, "saved");
  }

  persist(profile);
  return profile;
}

export function updateJobInProfile(
  profile: JobOpsProfile,
  job: Job
): JobOpsProfile {
  if (profile.archive[job.id]) {
    profile.archive[job.id] = { ...profile.archive[job.id], ...job };
  }
  if (profile.feedSnapshot?.jobs) {
    profile.feedSnapshot.jobs = profile.feedSnapshot.jobs.map((j) =>
      j.id === job.id ? { ...j, ...job } : j
    );
  }
  profile.statuses[job.id] = {
    ...profile.statuses[job.id],
    status: job.status,
    notes: job.notes ?? profile.statuses[job.id]?.notes,
    tailoredSummary: job.tailoredSummary ?? profile.statuses[job.id]?.tailoredSummary,
    tailoredCoverLetter:
      job.tailoredCoverLetter ?? profile.statuses[job.id]?.tailoredCoverLetter,
    tailoredAt: job.tailoredAt ?? profile.statuses[job.id]?.tailoredAt,
    savedAt: job.savedAt ?? profile.statuses[job.id]?.savedAt,
  };
  persist(profile);
  return profile;
}

export function saveJobNotes(
  profile: JobOpsProfile,
  jobId: string,
  notes: string
): JobOpsProfile {
  profile.statuses[jobId] = { ...profile.statuses[jobId], notes };
  if (profile.archive[jobId]) {
    profile.archive[jobId] = { ...profile.archive[jobId], notes };
  }
  if (profile.feedSnapshot?.jobs) {
    profile.feedSnapshot.jobs = profile.feedSnapshot.jobs.map((j) =>
      j.id === jobId ? { ...j, notes } : j
    );
  }
  persist(profile);
  return profile;
}

export function cacheScores(
  profile: JobOpsProfile,
  jobs: Job[]
): JobOpsProfile {
  const now = new Date().toISOString();
  for (const job of jobs) {
    if (job.unscored) continue;
    profile.scoreCache[job.id] = {
      matchScore: job.matchScore,
      matchReasons: job.matchReasons,
      matchNote: job.matchNote,
      scoredAt: now,
    };
  }
  persist(profile);
  return profile;
}

export function applyScoreCache(job: Job, profile: JobOpsProfile): Job {
  const cached = profile.scoreCache[job.id];
  if (!cached) return job;
  return {
    ...job,
    matchScore: cached.matchScore,
    matchReasons: cached.matchReasons,
    matchNote: cached.matchNote,
    unscored: false,
  };
}

export function mergeJobWithProfile(job: Job, profile: JobOpsProfile): Job {
  let merged = applyScoreCache(job, profile);
  const archived = profile.archive[job.id];
  if (archived) {
    merged = {
      ...merged,
      ...archived,
      matchScore: merged.matchScore || archived.matchScore,
      matchReasons: merged.matchReasons.length
        ? merged.matchReasons
        : archived.matchReasons,
    };
  }
  const statusEntry = profile.statuses[job.id];
  if (statusEntry) {
    merged = {
      ...merged,
      status: statusEntry.status ?? merged.status,
      notes: statusEntry.notes ?? merged.notes,
      savedAt: statusEntry.savedAt ?? merged.savedAt,
      tailoredSummary: statusEntry.tailoredSummary ?? merged.tailoredSummary,
      tailoredCoverLetter:
        statusEntry.tailoredCoverLetter ?? merged.tailoredCoverLetter,
      tailoredAt: statusEntry.tailoredAt ?? merged.tailoredAt,
    };
  }
  const seen = profile.seen[job.id];
  if (seen?.dismissReason === "not_interested")
    merged = { ...merged, status: "dismissed" };
  if (seen?.dismissReason === "later") merged = { ...merged, status: "later" };
  return merged;
}

export function mergeJobsWithProfile(jobs: Job[], profile: JobOpsProfile): Job[] {
  return jobs.map((j) => mergeJobWithProfile(j, profile));
}

export function saveJobStatusEntry(
  jobId: string,
  entry: JobStatusesMap[string]
): void {
  const profile = loadProfile();
  profile.statuses[jobId] = { ...profile.statuses[jobId], ...entry };
  persist(profile);
}

export function bumpRefreshGeneration(profile: JobOpsProfile): JobOpsProfile {
  profile.refreshGeneration += 1;
  persist(profile);
  return profile;
}

export function getSourcePage(profile: JobOpsProfile, sourceId: string): number {
  return profile.sourcePages[sourceId] ?? 1;
}

export function advanceSourcePages(
  profile: JobOpsProfile,
  sourceIds: string[]
): JobOpsProfile {
  for (const id of sourceIds) {
    profile.sourcePages[id] = (profile.sourcePages[id] ?? 1) + 1;
    if (profile.sourcePages[id] > 5) profile.sourcePages[id] = 1;
  }
  persist(profile);
  return profile;
}

/** Jobs explicitly saved to profile (Saved tab) */
export function getSavedJobs(profile: JobOpsProfile): Job[] {
  return Object.values(profile.archive)
    .filter((j) => j.status === "saved")
    .map((j) => mergeJobWithProfile(j, profile))
    .sort(
      (a, b) =>
        new Date(b.savedAt || b.postedDate).getTime() -
        new Date(a.savedAt || a.postedDate).getTime()
    );
}

/** @deprecated alias */
export function getArchivedJobs(profile: JobOpsProfile): Job[] {
  return getSavedJobs(profile);
}

export function getLibraryJobs(profile: JobOpsProfile): Job[] {
  const byId = new Map<string, Job>();
  for (const job of getArchivedJobs(profile)) byId.set(job.id, job);
  for (const job of getFeedJobs(profile)) {
    if (!byId.has(job.id)) byId.set(job.id, job);
  }
  for (const [id, entry] of Object.entries(profile.statuses)) {
    if (
      (entry.status === "tailored" || entry.status === "applied") &&
      profile.archive[id]
    ) {
      byId.set(id, mergeJobWithProfile(profile.archive[id], profile));
    }
  }
  return Array.from(byId.values());
}

export function exportProfileData(profile: JobOpsProfile): string {
  return JSON.stringify(profile, null, 2);
}

export function importProfileData(json: string): JobOpsProfile {
  const parsed = JSON.parse(json) as JobOpsProfile;
  if (!parsed || parsed.version !== 2) {
    throw new Error("Invalid profile backup (expected version 2)");
  }
  persist(parsed);
  return parsed;
}

export function getProfileStats(profile: JobOpsProfile) {
  return {
    archived: Object.keys(profile.archive).length,
    saved: getArchivedJobs(profile).filter((j) => j.status === "saved").length,
    feed: profile.feedSnapshot?.jobs?.length ?? 0,
    scored: Object.keys(profile.scoreCache).length,
    seen: Object.keys(profile.seen).length,
    lastScan: profile.feedSnapshot?.fetchedAt ?? null,
  };
}
