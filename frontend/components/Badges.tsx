"use client";
import { useT } from "@/lib/i18n";
export const Priority = ({ p }: { p: string }) => { const { t } = useT(); return <span className={`badge ${p}`}>{t("p_" + p)}</span>; };
export const Status = ({ s }: { s: string }) => { const { t } = useT(); return <span className="badge">{t("s_" + s)}</span>; };
export const Cat = ({ c }: { c: string }) => { const { t } = useT(); return <>{t("c_" + c)}</>; };
export const SlaBadge = ({ status, text }: { status?: string; text?: string }) => {
  if (!status) return null;
  const isOverdue = status === "overdue" || status === "breached";
  const isMet = status === "met";
  return (
    <span
      className={`badge ${isOverdue ? "high" : isMet ? "low" : "medium"}`}
      style={{
        background: isOverdue ? "#fee2e2" : isMet ? "#ecfdf5" : "#f0f9ff",
        color: isOverdue ? "#991b1b" : isMet ? "#065f46" : "#0369a1",
        border: `1px solid ${isOverdue ? "#fca5a5" : isMet ? "#a7f3d0" : "#bae6fd"}`,
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap"
      }}
      title={text}
    >
      {isOverdue ? "⚠️ Overdue SLA" : isMet ? "✅ SLA Met" : text || "⏱️ Active SLA"}
    </span>
  );
};
