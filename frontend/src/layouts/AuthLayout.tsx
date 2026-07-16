import { Bot, DatabaseZap, LockKeyhole, ShieldCheck } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

import { Badge } from "@/components";

import { BrandMark } from "../components/BrandMark";

export function AuthLayout({
  children,
  eyebrow,
  title,
  description,
}: PropsWithChildren<{
  eyebrow: string;
  title: ReactNode;
  description: string;
}>) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
      <section className="auth-grid relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col xl:p-14">
        <BrandMark />
        <div className="my-auto max-w-2xl py-16">
          <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-200 ring-emerald-300/20">
            AI chạy cục bộ • Dữ liệu thuộc về bạn
          </Badge>
          <h1 className="mt-7 text-5xl font-black leading-[1.04] tracking-[-0.055em] xl:text-6xl">
            Biến dữ liệu thật thành
            <span className="block text-emerald-300">nội dung đáng tin.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 xl:text-lg">
            Lập kế hoạch, sinh bài bằng RAG, duyệt và phân phối nội dung trong một
            quy trình thống nhất—không đưa bí mật kinh doanh lên AI công cộng.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: DatabaseZap, value: "100%", label: "bám dữ liệu nguồn" },
              { icon: Bot, value: "3 tác tử", label: "phối hợp kiểm chứng" },
              { icon: ShieldCheck, value: "Local", label: "xử lý riêng tư" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                <Icon size={19} className="text-emerald-300" />
                <p className="mt-4 text-lg font-black">{value}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <LockKeyhole size={14} />
          <span>Kiến trúc Local AI + RAG dành cho SME Việt Nam</span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-[#fbfcfa] px-5 py-10 sm:px-8">
        <div className="absolute left-5 top-5 lg:hidden">
          <div className="[&_span_span:first-child]:text-slate-950 [&_span_span:last-child]:text-slate-500">
            <BrandMark />
          </div>
        </div>
        <div className="w-full max-w-[470px] pt-16 lg:pt-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
