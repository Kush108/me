"use client";

import { JOB_SOURCES } from "@/lib/jobSources";
import { JobStatus } from "@/types/job";

interface FilterBarProps {
  sourceFilter: string;
  onSourceChange: (value: string) => void;
  minScore: number;
  onMinScoreChange: (value: number) => void;
  statusFilter: JobStatus | "all" | "library";
  onStatusChange: (value: JobStatus | "all" | "library") => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  hideDismissed: boolean;
  onHideDismissedChange: (value: boolean) => void;
}

const STATUS_TABS: { id: JobStatus | "all" | "library"; label: string }[] = [
  { id: "all", label: "Feed" },
  { id: "saved", label: "Saved" },
  { id: "library", label: "Library" },
  { id: "later", label: "Later" },
  { id: "tailored", label: "Tailored" },
  { id: "applied", label: "Applied" },
  { id: "dismissed", label: "Passed" },
];

export function FilterBar({
  sourceFilter,
  onSourceChange,
  minScore,
  onMinScoreChange,
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
  hideDismissed,
  onHideDismissedChange,
}: FilterBarProps) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block font-sans text-xs text-text-muted mb-1">
            Source
          </label>
          <select
            value={sourceFilter}
            onChange={(e) => onSourceChange(e.target.value)}
            className="w-full bg-bg-card border border-border rounded px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All sources</option>
            {JOB_SOURCES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-sans text-xs text-text-muted mb-1">
            Min match score: {minScore}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => onMinScoreChange(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block font-sans text-xs text-text-muted mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Title, company, keywords..."
            className="w-full bg-bg-card border border-border rounded px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:shadow-[0_0_0_1px_var(--accent-dim)]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusChange(tab.id)}
            className={`font-sans text-xs px-3 py-1.5 rounded border transition-colors ${
              statusFilter === tab.id
                ? "bg-accent-dim border-accent text-accent"
                : "border-border text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {statusFilter === "all" && (
          <label className="flex items-center gap-2 ml-auto font-sans text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={hideDismissed}
              onChange={(e) => onHideDismissedChange(e.target.checked)}
              className="accent-accent"
            />
            Hide passed / later
          </label>
        )}
      </div>
    </div>
  );
}
