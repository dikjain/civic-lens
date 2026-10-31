"use client";
import { useT } from "@/lib/i18n";
export const Priority = ({ p }: { p: string }) => { const { t } = useT(); return <span className={`badge ${p}`}>{t("p_" + p)}</span>; };
export const Status = ({ s }: { s: string }) => { const { t } = useT(); return <span className="badge">{t("s_" + s)}</span>; };
export const Cat = ({ c }: { c: string }) => { const { t } = useT(); return <>{t("c_" + c)}</>; };
