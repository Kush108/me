"use client";

import { TailorResponse } from "@/types/job";

interface TailoredOutputProps {
  data: TailorResponse;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs font-sans px-2 py-1 rounded border border-border text-text-muted hover:text-accent hover:border-accent transition-colors"
    >
      Copy {label}
    </button>
  );
}

export function TailoredOutput({ data }: TailoredOutputProps) {
  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-accent text-sm uppercase tracking-wider">
            Tailored Resume Summary
          </h3>
          <CopyButton text={data.tailoredSummary} label="summary" />
        </div>
        <p className="text-text-primary text-sm leading-relaxed bg-bg-secondary p-4 rounded border border-border">
          {data.tailoredSummary}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-accent text-sm uppercase tracking-wider">
            Cover Letter
          </h3>
          <CopyButton text={data.coverLetter} label="letter" />
        </div>
        <div className="text-text-primary text-sm leading-relaxed bg-bg-secondary p-4 rounded border border-border whitespace-pre-wrap">
          {data.coverLetter}
        </div>
      </section>

      {data.keywordsMatched?.length > 0 && (
        <section>
          <h4 className="font-sans text-text-muted text-xs mb-2">
            Keywords Matched
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.keywordsMatched.map((kw) => (
              <span
                key={kw}
                className="text-xs font-mono px-2 py-0.5 rounded bg-accent-dim text-accent border border-accent/30"
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.missingSkills?.length > 0 && (
        <section>
          <h4 className="font-sans text-text-muted text-xs mb-2">
            Gap Analysis
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.missingSkills.map((skill) => (
              <span
                key={skill}
                className="text-xs font-mono px-2 py-0.5 rounded bg-score-red/10 text-score-red border border-score-red/30"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.matchNotes && (
        <section className="border-t border-border pt-4">
          <h4 className="font-sans text-text-muted text-xs mb-1">Fit Notes</h4>
          <p className="text-sm text-text-primary italic">{data.matchNotes}</p>
        </section>
      )}
    </div>
  );
}
