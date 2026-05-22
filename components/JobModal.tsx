"use client";

import { useEffect, useState } from "react";
import { Job, TailorResponse } from "@/types/job";
import { TailoredOutput } from "./TailoredOutput";
import { ScoreBadge } from "./ScoreBadge";
import { saveJobStatus } from "@/lib/storage";
import type { DismissReason } from "@/lib/profileStore";

export type JobModalMode = "details" | "tailor";

interface JobModalProps {
  job: Job | null;
  mode: JobModalMode;
  onClose: () => void;
  onStatusChange: (job: Job, status: Job["status"]) => void;
  onDismiss?: (job: Job, reason: DismissReason) => void;
  onRestore?: (job: Job) => void;
  onNotesChange?: (jobId: string, notes: string) => void;
}

export function JobModal({
  job,
  mode,
  onClose,
  onStatusChange,
  onDismiss,
  onRestore,
  onNotesChange,
}: JobModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tailored, setTailored] = useState<TailorResponse | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!job) return;
    setNotes(job.notes || "");
    setError(null);

    if (mode !== "tailor") {
      if (job.tailoredSummary && job.tailoredCoverLetter) {
        setTailored({
          tailoredSummary: job.tailoredSummary,
          coverLetter: job.tailoredCoverLetter,
          keywordsMatched: job.matchReasons,
          missingSkills: [],
          matchNotes: "",
        });
      } else {
        setTailored(null);
      }
      setLoading(false);
      return;
    }

    if (job.tailoredSummary && job.tailoredCoverLetter) {
      setTailored({
        tailoredSummary: job.tailoredSummary,
        coverLetter: job.tailoredCoverLetter,
        keywordsMatched: job.matchReasons,
        missingSkills: [],
        matchNotes: "",
      });
      setLoading(false);
      return;
    }

    setTailored(null);
    setLoading(true);

    const run = async () => {
      try {
        const res = await fetch("/api/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: job.title,
            company: job.company,
            jobDescription: job.description,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Tailoring failed");
        }
        const data: TailorResponse = await res.json();
        setTailored(data);
        const now = new Date().toISOString();
        saveJobStatus(job.id, {
          status: "tailored",
          tailoredSummary: data.tailoredSummary,
          tailoredCoverLetter: data.coverLetter,
          tailoredAt: now,
        });
        onStatusChange(
          {
            ...job,
            status: "tailored",
            tailoredSummary: data.tailoredSummary,
            tailoredCoverLetter: data.coverLetter,
            tailoredAt: now,
          },
          "tailored"
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, mode]);

  if (!job) return null;

  const markApplied = () => {
    saveJobStatus(job.id, { status: "applied" });
    onStatusChange({ ...job, status: "applied" }, "applied");
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert(`Copy ${label} manually from the modal.`);
    }
  };

  const canRestore =
    job.status === "dismissed" || job.status === "later";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start gap-4 p-5 border-b border-border shrink-0">
          <ScoreBadge score={job.matchScore} unscored={job.unscored} />
          <div className="flex-1 min-w-0">
            <h2 className="font-mono text-lg text-text-primary">{job.title}</h2>
            <p className="font-sans text-sm text-text-muted">
              {job.company} · {job.location}
            </p>
            {job.savedAt && (
              <p className="font-mono text-[10px] text-accent mt-1">
                Saved to profile ·{" "}
                {new Date(job.savedAt).toLocaleDateString("en-CA")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-accent font-mono text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          <section>
            <h3 className="font-mono text-xs text-text-muted uppercase mb-2">
              Posting
            </h3>
            <p className="text-sm text-text-primary leading-relaxed max-h-48 overflow-y-auto bg-bg-secondary p-3 rounded border border-border whitespace-pre-wrap">
              {job.description || "No description stored."}
            </p>
          </section>

          <section>
            <h3 className="font-mono text-xs text-text-muted uppercase mb-2">
              Your notes (saved locally)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onNotesChange?.(job.id, notes)}
              rows={3}
              placeholder="Interview date, contact name, follow-up…"
              className="w-full bg-bg-secondary border border-border rounded p-3 text-sm text-text-primary font-sans resize-y focus:outline-none focus:border-accent"
            />
          </section>

          {loading && mode === "tailor" && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-sm text-accent">
                Generating tailored content…
              </span>
            </div>
          )}

          {error && (
            <p className="text-score-red text-sm font-sans border border-score-red/30 rounded p-3">
              {error}
            </p>
          )}

          {tailored && !loading && (
            <>
              <TailoredOutput data={tailored} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText(tailored.tailoredSummary, "summary")}
                  className="text-xs font-sans px-2 py-1 rounded border border-border hover:text-accent"
                >
                  Copy summary
                </button>
                <button
                  type="button"
                  onClick={() => copyText(tailored.coverLetter, "cover letter")}
                  className="text-xs font-sans px-2 py-1 rounded border border-border hover:text-accent"
                >
                  Copy cover letter
                </button>
              </div>
            </>
          )}

          {mode === "details" && !tailored && !loading && (
            <p className="text-sm text-text-muted font-sans">
              Open &quot;Tailor with AI&quot; to generate resume summary and cover
              letter (uses OpenAI once, then saved locally).
            </p>
          )}
        </div>

        <footer className="flex flex-wrap gap-2 p-5 border-t border-border shrink-0">
          {canRestore && onRestore && (
            <button
              type="button"
              onClick={() => {
                onRestore(job);
                onClose();
              }}
              className="font-sans text-sm px-4 py-2 rounded border border-accent text-accent hover:bg-accent-dim"
            >
              Restore to feed
            </button>
          )}
          {onDismiss && job.status !== "dismissed" && (
            <button
              type="button"
              onClick={() => {
                onDismiss(job, "not_interested");
                onClose();
              }}
              className="font-sans text-sm px-4 py-2 rounded border border-score-red/40 text-score-red hover:bg-score-red/10"
            >
              Not interested
            </button>
          )}
          {onDismiss && job.status !== "later" && job.status !== "dismissed" && (
            <button
              type="button"
              onClick={() => {
                onDismiss(job, "later");
                onClose();
              }}
              className="font-sans text-sm px-4 py-2 rounded border border-score-yellow/40 text-score-yellow hover:bg-score-yellow/10"
            >
              Maybe later
            </button>
          )}
          <button
            type="button"
            onClick={markApplied}
            className="font-sans text-sm px-4 py-2 rounded bg-score-green/20 border border-score-green text-score-green hover:bg-score-green/30"
          >
            Mark as Applied
          </button>
          <button
            type="button"
            onClick={() => copyText(job.url, "link")}
            className="font-sans text-sm px-4 py-2 rounded border border-border hover:text-accent"
          >
            Copy link
          </button>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm px-4 py-2 rounded border border-accent text-accent hover:bg-accent-dim"
          >
            Open Application ↗
          </a>
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-sm px-4 py-2 rounded border border-border text-text-muted ml-auto hover:text-text-primary"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
