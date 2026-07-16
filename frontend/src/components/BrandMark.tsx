import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/dashboard"
      className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
      aria-label="SMEFlow AI - Trang tổng quan"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-950/20 transition group-hover:-rotate-3 group-hover:scale-105">
        <Sparkles size={20} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span>
          <span className="block text-lg font-black tracking-[-0.04em] text-white">
            SMEFlow <span className="text-emerald-300">AI</span>
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Marketing riêng tư
          </span>
        </span>
      )}
    </Link>
  );
}
