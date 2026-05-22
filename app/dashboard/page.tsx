"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Job, JobStatus } from "@/types/job";
import { JobCard } from "@/components/JobCard";
import { JobModal, JobModalMode } from "@/components/JobModal";
import { FilterBar } from "@/components/FilterBar";
import { ProfileTools } from "@/components/ProfileTools";
import { ALL_SOURCE_IDS } from "@/lib/jobSources";
import { setJobsCache } from "@/lib/jobsCache";
import {
  advanceSourcePages,
  bumpRefreshGeneration,
  cacheScores,
  dismissJob,
  getSavedJobs,
  getDismissedIds,
  getExcludeIds,
  getFeedJobs,
  getLibraryJobs,
  getSourcePage,
  loadProfile,
  markSeen,
  mergeJobsWithProfile,
  persistFeedSnapshot,
  restoreJob,
  saveJobNotes,
  saveJobToArchive,
  updateJobInProfile,
  type DismissReason,
  type JobOpsProfile,
} from "@/lib/profileStore";

type StatusFilter = JobStatus | "all" | "library";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<JobOpsProfile>(() => loadProfile());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(
    () => loadProfile().feedSnapshot?.fetchedAt ?? null
  );
  const [feedErrors, setFeedErrors] = useState<string[]>([]);
  const [fetchMeta, setFetchMeta] = useState<{
    newCount?: number;
    excludedCount?: number;
    newlyScored?: number;
  } | null>(null);

  const [sourceFilter, setSourceFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideDismissed, setHideDismissed] = useState(true);

  const [modalJob, setModalJob] = useState<Job | null>(null);
  const [modalMode, setModalMode] = useState<JobModalMode>("details");

  const loadLocalFeed = useCallback((p: JobOpsProfile) => {
    const feed = getFeedJobs(p);
    setJobs(feed);
    setFetchedAt(p.feedSnapshot?.fetchedAt ?? null);
    setFeedErrors(p.feedSnapshot?.feedErrors || []);
  }, []);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    loadLocalFeed(p);
  }, [loadLocalFeed]);

  const applyJobsPayload = useCallback(
    (
      data: {
        jobs: Job[];
        fetchedAt: string;
        feedErrors?: string[];
        rateLimited?: boolean;
        meta?: {
          newCount?: number;
          excludedCount?: number;
          newlyScored?: number;
        };
      },
      currentProfile: JobOpsProfile
    ) => {
      let p = markSeen(currentProfile, data.jobs.map((j) => j.id));
      p = cacheScores(p, data.jobs);
      const merged = mergeJobsWithProfile(data.jobs, p);
      p = persistFeedSnapshot(p, merged, data.fetchedAt, data.feedErrors);
      setProfile(p);
      setJobs(merged);
      setFetchedAt(data.fetchedAt);
      setFeedErrors(data.feedErrors || []);
      setFetchMeta(data.meta ?? null);
      if (data.rateLimited) {
        setError("Rate limited — try again in 60 seconds");
      } else {
        setError(null);
      }
    },
    []
  );

  const scanForNewJobs = useCallback(async () => {
    let p = loadProfile();
    p = bumpRefreshGeneration(p);

    const sourcePages: Record<string, number> = {};
    for (const id of ALL_SOURCE_IDS) {
      sourcePages[id] = getSourcePage(p, id);
    }
    p = advanceSourcePages(p, ALL_SOURCE_IDS);
    for (const id of ALL_SOURCE_IDS) {
      sourcePages[id] = getSourcePage(p, id);
    }

    setLoading(true);
    setError(null);
    setFeedErrors([]);
    setFetchMeta(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          excludeIds: getExcludeIds(p),
          scoreCache: p.scoreCache,
          sourcePages,
          refreshGeneration: p.refreshGeneration,
          fresh: true,
        }),
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load jobs");
      }
      const data = await res.json();

      const payload = {
        jobs: data.jobs as Job[],
        fetchedAt: data.fetchedAt as string,
        feedErrors: data.feedErrors as string[] | undefined,
        rateLimited: data.rateLimited as boolean | undefined,
        meta: data.meta as
          | {
              newCount?: number;
              excludedCount?: number;
              newlyScored?: number;
            }
          | undefined,
      };

      setJobsCache(payload);
      applyJobsPayload(payload, p);
      setProfile(loadProfile());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }, [router, applyJobsPayload]);

  const dismissedIds = useMemo(() => getDismissedIds(profile), [profile]);

  const baseJobs = useMemo(() => {
    if (statusFilter === "saved") return getSavedJobs(profile);
    if (statusFilter === "library") return getLibraryJobs(profile);
    if (statusFilter === "all") return jobs;
    return getLibraryJobs(profile).length > 0
      ? getLibraryJobs(profile)
      : jobs;
  }, [statusFilter, profile, jobs]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return baseJobs.filter((job) => {
      if (
        hideDismissed &&
        statusFilter === "all" &&
        (job.status === "dismissed" ||
          job.status === "later" ||
          dismissedIds.has(job.id))
      ) {
        return false;
      }
      if (sourceFilter !== "all" && job.source !== sourceFilter) return false;
      if (job.unscored) {
        if (minScore > 0) return false;
      } else if (job.matchScore < minScore) {
        return false;
      }
      if (
        statusFilter !== "all" &&
        statusFilter !== "library" &&
        statusFilter !== "saved" &&
        job.status !== statusFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${job.title} ${job.company} ${job.description} ${job.location} ${job.notes || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    baseJobs,
    sourceFilter,
    minScore,
    statusFilter,
    searchQuery,
    hideDismissed,
    dismissedIds,
  ]);

  const syncJob = (updated: Job) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j))
    );
    if (modalJob?.id === updated.id) setModalJob({ ...updated });
  };

  const handleSave = (job: Job) => {
    const p = saveJobToArchive(profile, job);
    setProfile(p);
    const nextStatus: JobStatus = job.status === "saved" ? "new" : "saved";
    syncJob({ ...job, status: nextStatus, savedAt: p.archive[job.id]?.savedAt });
    if (statusFilter === "saved") loadLocalFeed(p);
  };

  const handleDismiss = (job: Job, reason: DismissReason) => {
    const p = dismissJob(profile, job, reason);
    setProfile(p);
    const status: JobStatus =
      reason === "not_interested" ? "dismissed" : "later";
    syncJob({ ...job, status });
  };

  const handleRestore = (job: Job) => {
    const p = restoreJob(profile, job);
    setProfile(p);
    loadLocalFeed(p);
  };

  const handleStatusChange = (updated: Job, status: Job["status"]) => {
    const p = updateJobInProfile(profile, { ...updated, status });
    setProfile(p);
    syncJob({ ...updated, status });
  };

  const handleNotesChange = (jobId: string, notes: string) => {
    const p = saveJobNotes(profile, jobId, notes);
    setProfile(p);
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, notes } : j))
    );
  };

  const openModal = (job: Job, mode: JobModalMode) => {
    setModalJob(job);
    setModalMode(mode);
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const minutesAgo = fetchedAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 60000)
      )
    : null;

  const archivedCount = getSavedJobs(profile).length;

  const stats = {
    feed: jobs.length,
    high: jobs.filter((j) => !j.unscored && j.matchScore >= 60).length,
    saved: archivedCount,
    applied: getLibraryJobs(profile).filter((j) => j.status === "applied")
      .length,
  };

  const isLocalTab =
    statusFilter === "saved" ||
    statusFilter === "library" ||
    statusFilter === "later" ||
    statusFilter === "dismissed";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-accent text-xs tracking-widest uppercase">
            FlowGrid Ops · v2.1
          </p>
          <h1 className="font-mono text-2xl font-bold text-text-primary mt-1">
            JOB OPS DASHBOARD
          </h1>
          <p className="font-sans text-sm text-text-muted mt-1">
            {stats.feed} in feed · {stats.high} strong · {stats.saved} saved ·{" "}
            {stats.applied} applied
            {isLocalTab && " · viewing local profile"}
          </p>
          {fetchMeta && (
            <p className="font-mono text-[10px] text-text-muted mt-1">
              Last scan: {fetchMeta.newCount ?? 0} new · skipped{" "}
              {fetchMeta.excludedCount ?? 0} known · OpenAI scored{" "}
              {fetchMeta.newlyScored ?? 0}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {minutesAgo !== null && (
            <span className="font-mono text-xs text-text-muted">
              Feed snapshot:{" "}
              {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`}
            </span>
          )}
          <button
            type="button"
            onClick={scanForNewJobs}
            disabled={loading}
            className="font-sans text-sm px-4 py-2 rounded border border-accent text-accent hover:bg-accent-dim disabled:opacity-50 transition-colors"
          >
            {loading ? "Scanning APIs…" : "Scan for new jobs"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="font-sans text-sm px-4 py-2 rounded border border-border text-text-muted hover:text-score-red hover:border-score-red/50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <ProfileTools profile={profile} onProfileChange={setProfile} />

      <p className="font-sans text-xs text-text-muted border border-border/60 rounded px-3 py-2 bg-bg-secondary/50">
        Opens from your <strong>local profile</strong> — no API on refresh.
        Saved jobs, scores, notes, and last feed stay in the browser indefinitely.
        Use <strong>Scan for new jobs</strong> only when you want fresh listings
        (RapidAPI + OpenAI for new IDs only).
      </p>

      {feedErrors.length > 0 && !error?.includes("Rate limited") && (
        <div className="text-xs font-mono text-score-yellow border border-score-yellow/30 rounded p-3 bg-score-yellow/5">
          Source warnings: {feedErrors.join(" · ")}
        </div>
      )}

      <FilterBar
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        minScore={minScore}
        onMinScoreChange={setMinScore}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hideDismissed={hideDismissed}
        onHideDismissedChange={setHideDismissed}
      />

      {error && (
        <p className="text-score-red font-sans text-sm border border-score-red/30 rounded p-4">
          {error}
        </p>
      )}

      {loading && (
        <p className="font-mono text-accent text-sm text-center animate-pulse">
          Scanning job APIs…
        </p>
      )}

      {!loading && filteredJobs.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="font-sans text-text-muted">
            {statusFilter === "saved"
              ? "No saved jobs yet — use Save to profile on any listing."
              : jobs.length === 0
                ? "No local feed yet. Click Scan for new jobs when ready."
                : "No jobs match your filters."}
          </p>
          {jobs.length === 0 && statusFilter === "all" && (
            <button
              type="button"
              onClick={scanForNewJobs}
              className="font-sans text-sm px-4 py-2 rounded border border-accent text-accent"
            >
              Scan for new jobs
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSave={handleSave}
              onDismiss={handleDismiss}
              onView={(j) => openModal(j, "details")}
              onTailor={(j) => openModal(j, "tailor")}
              onRestore={handleRestore}
              onOpen={(j) => window.open(j.url, "_blank", "noopener,noreferrer")}
            />
          ))}
        </div>
      )}

      <JobModal
        job={modalJob}
        mode={modalMode}
        onClose={() => setModalJob(null)}
        onStatusChange={handleStatusChange}
        onDismiss={handleDismiss}
        onRestore={handleRestore}
        onNotesChange={handleNotesChange}
      />
    </div>
  );
}
