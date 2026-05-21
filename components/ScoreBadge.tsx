"use client";

interface ScoreBadgeProps {
  score: number;
  unscored?: boolean;
  size?: "sm" | "md";
}

export function ScoreBadge({ score, unscored, size = "md" }: ScoreBadgeProps) {
  if (unscored) {
    const dim = size === "sm" ? "w-10 h-10 text-[10px]" : "w-14 h-14 text-xs";
    return (
      <div
        className={`${dim} rounded-full border-2 border-border flex items-center justify-center font-mono font-bold shrink-0 text-text-muted`}
        title="Unscored"
      >
        —
      </div>
    );
  }

  const color =
    score >= 60
      ? "var(--green)"
      : score >= 40
        ? "var(--yellow)"
        : "var(--red)";

  const dim = size === "sm" ? "w-10 h-10 text-xs" : "w-14 h-14 text-sm";
  const pulse = score >= 70 ? "animate-pulseScore" : "";

  return (
    <div
      className={`${dim} ${pulse} rounded-full border-2 flex items-center justify-center font-mono font-bold shrink-0`}
      style={{
        borderColor: color,
        color,
        background: `linear-gradient(135deg, ${color}22, transparent)`,
      }}
      title={`Match score: ${score}`}
    >
      {score}
    </div>
  );
}
