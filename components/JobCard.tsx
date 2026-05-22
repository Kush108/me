"use client";

import { Job } from "@/types/job";
import { ScoreBadge } from "./ScoreBadge";
import type { DismissReason } from "@/lib/profileStore";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-text-muted",
  saved: "bg-accent",
  tailored: "bg-score-yellow",
  applied: "bg-score-green",
  rejected: "bg-score-red",
  dismissed: "bg-score-red/60",
  later: "bg-score-yellow/60",
};

interface JobCardProps {
  job: Job;
  onSave: (job: Job) => void;
  onDismiss: (job: Job, reason: DismissReason) => void;
  onView: (job: Job) => void;
  onTailor: (job: Job) => void;
  onRestore?: (job: Job) => void;
  onOpen: (job: Job) => void;
}

export function JobCard({
  job,
  onSave,
  onDismiss,
  onView,
  onTailor,
  onRestore,
  onOpen,
}: JobCardProps) {
  const excerpt =
    job.description.length > 120
      ? job.description.slice(0, 120) + "…"
      : job.description;

  const posted = new Date(job.postedDate).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="bg-bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors">
      <div className="flex gap-3">
        <ScoreBadge score={job.matchScore} unscored={job.unscored} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_COLORS[job.status] || STATUS_COLORS.new}`}
              title={job.status}
            />
            <h2 className="font-mono text-text-primary font-medium text-base leading-snug truncate">
              {job.title}
            </h2>
          </div>
          <p className="font-sans text-sm text-text-muted mt-0.5">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
          <p className="font-sans text-xs text-text-muted mt-1">
            {job.sourceName} · {posted}
          </p>
        </div>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">{excerpt}</p>

      {job.notes && (
        <p className="text-xs text-accent/90 leading-snug border-l-2 border-accent pl-2">
          {job.notes.length > 80 ? job.notes.slice(0, 80) + "…" : job.notes}
        </p>
      )}

      {job.matchNote && !job.unscored && (
        <p className="text-xs text-text-primary/80 italic leading-snug">
          {job.matchNote}
        </p>
      )}

      {job.matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.matchReasons.slice(0, 5).map((r) => (
            <span
              key={r}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-secondary text-accent/80 border border-border"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => onSave(job)}
          className="text-xs font-sans px-2.5 py-1.5 rounded border border-border hover:border-accent hover:text-accent transition-colors"
        >
          {job.status === "saved" ? "Saved ✓" : "Save to profile"}
        </button>
        <button
          type="button"
          onClick={() => onView(job)}
          className="text-xs font-sans px-2.5 py-1.5 rounded border border-border hover:text-text-primary transition-colors"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onTailor(job)}
          className="text-xs font-sans px-2.5 py-1.5 rounded bg-accent-dim border border-accent text-accent hover:bg-accent/20 transition-colors"
        >
          {job.tailoredSummary ? "Tailored ✓" : "Tailor AI →"}
        </button>
        {onRestore &&
          (job.status === "dismissed" || job.status === "later") && (
            <button
              type="button"
              onClick={() => onRestore(job)}
              className="text-xs font-sans px-2.5 py-1.5 rounded border border-accent/50 text-accent"
            >
              Restore
            </button>
          )}
        {job.status !== "dismissed" && (
          <button
            type="button"
            onClick={() => onDismiss(job, "not_interested")}
            className="text-xs font-sans px-2.5 py-1.5 rounded border border-border text-text-muted hover:text-score-red hover:border-score-red/40 transition-colors"
          >
            Not interested
          </button>
        )}
        {job.status !== "later" && job.status !== "dismissed" && (
          <button
            type="button"
            onClick={() => onDismiss(job, "later")}
            className="text-xs font-sans px-2.5 py-1.5 rounded border border-border text-text-muted hover:text-score-yellow hover:border-score-yellow/40 transition-colors"
          >
            Maybe later
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(job)}
          className="text-xs font-sans px-2.5 py-1.5 rounded border border-border hover:text-text-primary transition-colors ml-auto"
        >
          Open Job ↗
        </button>
      </div>
    </article>
  );
}
