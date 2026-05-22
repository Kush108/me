"use client";

import { useRef } from "react";
import {
  exportProfileData,
  getProfileStats,
  importProfileData,
  type JobOpsProfile,
} from "@/lib/profileStore";

interface ProfileToolsProps {
  profile: JobOpsProfile;
  onProfileChange: (p: JobOpsProfile) => void;
}

export function ProfileTools({ profile, onProfileChange }: ProfileToolsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = getProfileStats(profile);

  const handleExport = () => {
    const blob = new Blob([exportProfileData(profile)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-ops-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = importProfileData(String(reader.result));
        onProfileChange(p);
        window.location.reload();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Import failed");
      }
    };
    reader.readAsText(file);
  };

  const lastScan = stats.lastScan
    ? new Date(stats.lastScan).toLocaleString("en-CA", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "never";

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 font-mono text-[11px] text-text-muted space-y-1">
        <p>
          <span className="text-accent">LOCAL PROFILE</span> — no API needed to
          browse
        </p>
        <p>
          {stats.archived} archived · {stats.saved} saved · {stats.feed} last
          feed · {stats.scored} scored · last scan {lastScan}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="font-sans text-xs px-3 py-1.5 rounded border border-border hover:border-accent hover:text-accent"
        >
          Export backup
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="font-sans text-xs px-3 py-1.5 rounded border border-border hover:border-accent hover:text-accent"
        >
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
