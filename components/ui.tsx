"use client";
// components/ui.tsx — componentes reutilizaveis

import { STATUS_COLORS } from "@/data/constants";

export function Badge({ label, color }: { label: string; color?: string }) {
  const c = color || STATUS_COLORS[label] || "#6b7280";
  return (
    <span style={{
      background: `${c}18`, color: c,
      border: `1px solid ${c}40`,
      borderRadius: 20, padding: "2px 9px",
      fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap", textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

const VARIANTS: Record<string, React.CSSProperties> = {
  primary:     { background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", boxShadow: "0 3px 10px rgba(22,163,74,0.3)", border: "none" },
  blue:        { background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", color: "#fff", boxShadow: "0 3px 10px rgba(14,165,233,0.3)", border: "none" },
  outline:     { background: "transparent", color: "#16a34a", border: "1px solid #bbf7d0", boxShadow: "none" },
  outlineBlue: { background: "transparent", color: "#0ea5e9", border: "1px solid #bae6fd", boxShadow: "none" },
  ghost:       { background: "#f3f4f6", color: "#6b7280", border: "none", boxShadow: "none" },
  danger:      { background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", boxShadow: "none" },
  indigo:      { background: "linear-gradient(135deg,#312e81,#4f46e5)", color: "#fff", boxShadow: "0 3px 10px rgba(79,70,229,0.3)", border: "none" },
};

export function Btn({
  children,
  onClick,
  style = {},
  small = false,
  variant = "primary",
  disabled = false,
  className = "",
}: {
  children: any;
  onClick?: any;
  style?: React.CSSProperties;
  small?: boolean;
  variant?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
      style={{
        borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
        fontSize: small ? 12 : 13,
        padding: small ? "5px 11px" : "8px 16px",
        fontFamily: "inherit", transition: "all 0.15s",
        opacity: disabled ? 0.6 : 1,
        ...VARIANTS[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, style = {} }: { children: any; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: 20,
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub = "",
  color,
}: {
  label: string;
  value: any;
  sub?: string;
  color: string;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "15px 18px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      borderLeft: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</p>
        {sub && <p style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
      <p style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#fff", fontSize: 12, fontWeight: 700 }}>
          {prefix}{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}
        </p>
      ))}
    </div>
  );
}

export function downloadCSV(rows: Record<string, any>[], filename: string) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(","), ...rows.map((r) => keys.map((k) => `"${r[k] ?? ""}"`).join(","))].join("\n");
  const a    = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: filename,
  });
  a.click();
}