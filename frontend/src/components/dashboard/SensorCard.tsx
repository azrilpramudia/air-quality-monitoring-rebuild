"use client";

interface SensorCardProps {
  title: string;
  value: string | number | null;
  unit: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  trend?: "up" | "down" | "stable" | null;
  subtitle?: string;
}

export function SensorCard({
  title,
  value,
  unit,
  icon,
  color,
  bgColor,
  borderColor,
  trend,
  subtitle,
}: SensorCardProps) {
  const displayValue = value === null ? "—" : value;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border p-5
        ${bgColor} ${borderColor}
        transition-all duration-300
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium text-gray-400`}>{title}</span>
        <span className={`${color} opacity-80`}>{icon}</span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        <span className={`text-3xl font-bold tracking-tight ${color}`}>
          {displayValue}
        </span>
        {value !== null && (
          <span className="text-sm text-gray-500 mb-1">{unit}</span>
        )}
      </div>

      {/* Subtitle / trend */}
      {subtitle && <p className="mt-2 text-xs text-gray-500">{subtitle}</p>}

      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend === "up" && <TrendUp />}
          {trend === "down" && <TrendDown />}
          {trend === "stable" && <TrendStable />}
        </div>
      )}

      {/* Decorative corner glow */}
      <div
        className={`
          absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 blur-xl
          ${bgColor}
        `}
      />
    </div>
  );
}

// ─── Trend indicators ────────────────────
function TrendUp() {
  return (
    <span className="flex items-center gap-0.5 text-xs text-red-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 2L10 6H8V10H4V6H2L6 2Z" fill="currentColor" />
      </svg>
      Rising
    </span>
  );
}

function TrendDown() {
  return (
    <span className="flex items-center gap-0.5 text-xs text-green-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 10L2 6H4V2H8V6H10L6 10Z" fill="currentColor" />
      </svg>
      Falling
    </span>
  );
}

function TrendStable() {
  return (
    <span className="flex items-center gap-0.5 text-xs text-gray-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 6H10M7 3L10 6L7 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Stable
    </span>
  );
}
