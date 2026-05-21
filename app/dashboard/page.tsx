"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Job, JobStatus } from "@/types/job";
import { JobCard } from "@/components/JobCard";
import { JobModal } from "@/components/JobModal";
import { FilterBar } from "@/components/FilterBar";
import { mergeJobsWithStorage, saveJobStatus } from "@/lib/storage";
import {
  clearJobsCache,
  getJobsCache,
  setJobsCache,
} from "@/lib/jobsCache";

export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [feedErrors, setFeedErrors] = useState<string[]>([]);

  const [sourceFilter, setSourceFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalJob, setModalJob] = useState<Job | null>(null);

  const applyJobsPayload = useCallback(
    (data: {
      jobs: Job[];
      fetchedAt: string;
      feedErrors?: string[];
      rateLimited?: boolean;
    }) => {
      const merged = mergeJobsWithStorage(data.jobs);
      setJobs(merged);
      setFetchedAt(data.fetchedAt);
      setFeedErrors(data.feedErrors || []);
      if (data.rateLimited) {
        setError("Rate limited — try again in 60 seconds");
      }
    },
    []
  );

  const fetchJobs = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh) {
        const cached = getJobsCache();
        if (cached) {
          applyJobsPayload(cached);
          setLoading(false);
          return;
        }
      } else {
        clearJobsCache();
      }

      setLoading(true);
      setError(null);
      setFeedErrors([]);

      try {
        const res = await fetch("/api/jobs", { cache: "no-store" });
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
        };

        setJobsCache(payload);
        applyJobsPayload(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    },
    [router, applyJobsPayload]
  );

  useEffect(() => {
    fetchJobs(false);
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return jobs.filter((job) => {
      if (sourceFilter !== "all" && job.source !== sourceFilter) return false;
      if (job.unscored) {
        if (minScore > 0) return false;
      } else if (job.matchScore < minScore) {
        return false;
      }
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (q) {
        const hay = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, sourceFilter, minScore, statusFilter, searchQuery]);

  const handleSave = (job: Job) => {
    const status: JobStatus = job.status === "saved" ? "new" : "saved";
    saveJobStatus(job.id, { status });
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status } : j))
    );
  };

  const handleStatusChange = (updated: Job, status: Job["status"]) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === updated.id ? { ...j, ...updated, status } : j))
    );
    if (modalJob?.id === updated.id) {
      setModalJob({ ...updated, status });
    }
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

  const stats = {
    total: jobs.length,
    high: jobs.filter((j) => !j.unscored && j.matchScore >= 60).length,
    saved: jobs.filter((j) => j.status === "saved").length,
    applied: jobs.filter((j) => j.status === "applied").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-accent text-xs tracking-widest uppercase">
            FlowGrid Ops
          </p>
          <h1 className="font-mono text-2xl font-bold text-text-primary mt-1">
            JOB OPS DASHBOARD
          </h1>
          <p className="font-sans text-sm text-text-muted mt-1">
            {stats.total} listings · {stats.high} strong matches · {stats.saved}{" "}
            saved · {stats.applied} applied
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {minutesAgo !== null && (
            <span className="font-mono text-xs text-text-muted">
              Last fetched: {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchJobs(true)}
            disabled={loading}
            className="font-sans text-sm px-4 py-2 rounded border border-border hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
          >
            {loading ? "Refreshing…" : "Refresh"}
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
      />

      {error && (
        <p className="text-score-red font-sans text-sm border border-score-red/30 rounded p-4">
          {error}
        </p>
      )}

      {loading && jobs.length === 0 ? (
        <div className="grid place-items-center py-24">
          <p className="font-mono text-accent animate-pulse">
            Fetching jobs & scoring matches…
          </p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <p className="font-sans text-text-muted text-center py-16">
          No jobs match your filters. Try lowering the score threshold or
          clearing filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSave={handleSave}
              onTailor={(j) => setModalJob(j)}
              onOpen={(j) => window.open(j.url, "_blank", "noopener,noreferrer")}
            />
          ))}
        </div>
      )}

      <JobModal
        job={modalJob}
        onClose={() => setModalJob(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
